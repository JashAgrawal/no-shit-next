import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { ideas, messages, tasks } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { hivemind } from '@/src/lib/orchestrator';
import { AGENTS } from '@/src/lib/agents';
import { streamFromGemini } from '@/src/lib/gemini';
import { getGeminiFunctionDeclarations, executeFunctionCall } from '@/src/lib/functionCalling';

export async function POST(req: NextRequest) {
  try {
    // Auth session
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, ideaId, conversationHistory } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Verify idea ownership if provided
    if (ideaId) {
      const idea = await db.select().from(ideas).where(and(eq(ideas.id, ideaId), eq(ideas.userId, session.user.id)));
      if (!idea.length) {
        return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
      }
    }

    // Persist user's message early
    if (ideaId) {
      await db.insert(messages).values({
        id: crypto.randomUUID(),
        ideaId,
        chatType: 'hivemind',
        agentId: null,
        role: 'user',
        content: message,
      });
    }

    // Build chatHistory for router
    const history = Array.isArray(conversationHistory)
      ? conversationHistory.map((m: any) => ({ role: m.role, content: m.content, agentId: m.agentId }))
      : [];

    // Route to best agent using HiveMind orchestrator
    const routing = await hivemind.routeWithAI({
      userMessage: message,
      ideaName: undefined,
      ideaDescription: undefined,
      chatHistory: history,
    });

    const agent = routing.agent;

    const encoder = new TextEncoder();
    let full = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Emit routing decision early
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ route: true, agentId: agent.id, confidence: routing.confidence, reasoning: routing.reasoning })}\n\n`)
          );

          // Build the agent prompt with minimal context
          let prompt = message;
          if (history && history.length > 0) {
            const ctx = history.slice(-6).map((m: any) => `${m.agentId || 'User'}: ${m.content}`).join('\n');
            prompt = `CONTEXT:\n${ctx}\n\nUSER:\n${message}`;
          }

          // Stream from selected agent
          const tools = getGeminiFunctionDeclarations();

          for await (const chunk of streamFromGemini(prompt, agent.systemPrompt, tools)) {
            if (chunk.text) {
              full += chunk.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ agentId: agent.id, chunk: chunk.text })}\n\n`));
            }

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
                      assignedTo: null,
                      tags: call.args?.tags ? JSON.stringify(call.args.tags) : null,
                      dueDate: null,
                    });

                    const confirmMsg = `\n\n✅ Task created: "${call.args?.title || 'Untitled Task'}"\n`;
                    full += confirmMsg;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ agentId: agent.id, chunk: confirmMsg, toolCall: { name: 'create_task', taskId } })}\n\n`));

                  } else if (call.name === 'update_task' && call.args?.taskId) {
                    const updateData: any = {};
                    if (call.args.status) updateData.status = call.args.status;
                    if (call.args.priority) updateData.priority = call.args.priority;
                    await db.update(tasks).set(updateData).where(eq(tasks.id, call.args.taskId));

                    const confirmMsg = `\n\n✅ Task updated\n`;
                    full += confirmMsg;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ agentId: agent.id, chunk: confirmMsg, toolCall: { name: 'update_task' } })}\n\n`));

                  } else if (call.name === 'generate_image') {
                    const { generateMedia } = await import('@/src/lib/gemini');
                    const imageResult = await generateMedia(call.args?.prompt || '');

                    if (imageResult) {
                      const imgMsg = `\n\n![Generated Image](${imageResult.url})\n`;
                      full += imgMsg;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        agentId: agent.id,
                        chunk: imgMsg,
                        toolCall: {
                          name: call.name,
                          imageUrl: imageResult.url
                        }
                      })}\n\n`));
                    } else {
                      const errMsg = `\n\n❌ Failed to generate image\n`;
                      full += errMsg;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ agentId: agent.id, chunk: errMsg })}\n\n`));
                    }
                  }
                } catch (error) {
                  console.error(`Error executing function ${call.name}:`, error);
                  const errMsg = `\n\n❌ Error executing ${call.name}\n`;
                  full += errMsg;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ agentId: agent.id, chunk: errMsg })}\n\n`));
                }
              }
            }
          }

          // Persist assistant message
          if (ideaId) {
            await db.insert(messages).values({
              id: crypto.randomUUID(),
              ideaId,
              chatType: 'hivemind',
              agentId: agent.id,
              role: 'assistant',
              content: full,
            });
          }

          // Done signal
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
  } catch (error) {
    console.error('HiveMind chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
