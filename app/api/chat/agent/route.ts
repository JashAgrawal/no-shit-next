import { NextRequest, NextResponse } from 'next/server';
import { sendToGemini, streamFromGemini, generateMedia } from '@/src/lib/gemini';
import { AGENTS } from '@/src/lib/agents';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { messages, ideas, tasks } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { getGeminiFunctionDeclarations } from '@/src/lib/functionCalling';

export async function POST(req: NextRequest) {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, agentId, ideaId, context } = await req.json();

    if (!message || !agentId) {
      return NextResponse.json({ error: 'Message and agentId are required' }, { status: 400 });
    }

    // If ideaId is provided, verify ownership
    if (ideaId) {
      const idea = await db.select().from(ideas).where(and(eq(ideas.id, ideaId), eq(ideas.userId, session.user.id)));
      if (!idea.length) {
        return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
      }
    }

    // Get agent
    const agent = AGENTS[agentId];
    if (!agent) {
      return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 });
    }

    // Build context-aware prompt
    let fullPrompt = message;

    if (context) {
      // Add shared context if available
      if (context.hivemind && context.hivemind.length > 0) {
        fullPrompt = `HIVEMIND CONTEXT:\n${context.hivemind.map((m: any) => `${m.role}: ${m.content}`).join('\n')}\n\nUSER MESSAGE:\n${message}`;
      }
      if (context.boardroom && context.boardroom.length > 0) {
        fullPrompt += `\n\nBOARDROOM CONTEXT:\n${context.boardroom.map((m: any) => `${m.role}: ${m.content}`).join('\n')}`;
      }
    }

    // Assistant agent: use tools-based function calling
    if (agent.id === 'assistant') {
      const encoder = new TextEncoder();
      const functionDeclarations = getGeminiFunctionDeclarations();

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            let fullText = '';

            // Stream with tools
            for await (const chunk of streamFromGemini(fullPrompt, agent.systemPrompt, functionDeclarations)) {
              // Handle text content
              if (chunk.text) {
                fullText += chunk.text;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`));
              }

              // Handle tool calls
              if (chunk.toolCalls && chunk.toolCalls.length > 0) {
                for (const call of chunk.toolCalls) {
                  try {
                    if (call.name === 'create_task') {
                      const taskId = crypto.randomUUID();
                      await db.insert(tasks).values({
                        id: taskId,
                        ideaId,
                        title: call.args?.title || 'Untitled Task',
                        description: call.args?.description || '',
                        status: 'todo',
                        priority: call.args?.priority || 'medium',
                        assignedTo: call.args?.assignedTo || null,
                        tags: call.args?.tags ? JSON.stringify(call.args.tags) : null,
                        dueDate: null,
                      });

                      // Send confirmation message
                      const confirmMsg = `\n\n✅ Task created: "${call.args?.title || 'Untitled Task'}"\n`;
                      fullText += confirmMsg;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: confirmMsg, toolCall: { name: 'create_task', taskId } })}\n\n`));

                    } else if (call.name === 'update_task' && call.args?.taskId) {
                      const updateData: any = {};
                      if (call.args.status) updateData.status = call.args.status;
                      if (call.args.priority) updateData.priority = call.args.priority;
                      await db.update(tasks).set(updateData).where(eq(tasks.id, call.args.taskId));

                      // Send confirmation message
                      const confirmMsg = `\n\n✅ Task updated\n`;
                      fullText += confirmMsg;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: confirmMsg, toolCall: { name: 'update_task' } })}\n\n`));

                    } else if (call.name === 'generate_image') {
                      const imageResult = await generateMedia(call.args?.prompt || '');

                      if (imageResult) {
                        const imgMsg = `\n\n![Generated Image](${imageResult.url})\n`;
                        fullText += imgMsg;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: imgMsg, toolCall: { name: 'generate_image', imageUrl: imageResult.url } })}\n\n`));
                      } else {
                        const errMsg = `\n\n❌ Failed to generate image\n`;
                        fullText += errMsg;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: errMsg })}\n\n`));
                      }
                    }
                  } catch (error) {
                    console.error(`Error executing function ${call.name}:`, error);
                    const errMsg = `\n\n❌ Error executing ${call.name}\n`;
                    fullText += errMsg;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: errMsg })}\n\n`));
                  }
                }
              }
            }

            // Persist messages if ideaId is available
            if (ideaId) {
              await db.insert(messages).values([
                {
                  id: crypto.randomUUID(),
                  ideaId,
                  chatType: 'agent',
                  agentId: agent.id,
                  role: 'user',
                  content: message,
                },
                {
                  id: crypto.randomUUID(),
                  ideaId,
                  chatType: 'agent',
                  agentId: agent.id,
                  role: 'assistant',
                  content: fullText,
                },
              ]);
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, agentId: agent.id })}\n\n`));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Stream response using SSE (non-assistant agents)
    const encoder = new TextEncoder();
    let fullResponse = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamFromGemini(fullPrompt, agent.systemPrompt)) {
            const text = chunk.text || '';
            fullResponse += text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`));
          }

          // Persist messages if ideaId is available
          if (ideaId) {
            await db.insert(messages).values([
              {
                id: crypto.randomUUID(),
                ideaId,
                chatType: 'agent',
                agentId: agent.id,
                role: 'user',
                content: message,
              },
              {
                id: crypto.randomUUID(),
                ideaId,
                chatType: 'agent',
                agentId: agent.id,
                role: 'assistant',
                content: fullResponse,
              },
            ]);
          }

          // Send final metadata
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, agentId: agent.id })}\n\n`)
          );
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

