import { NextRequest, NextResponse } from 'next/server';
import { sendToGemini, streamFromGemini } from '@/src/lib/gemini';
import { AGENTS } from '@/src/lib/agents';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { ideas, messages, tasks } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { getGeminiFunctionDeclarations } from '@/src/lib/functionCalling';
import { sendWithTools } from '@/src/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    // Get session
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

    // Streaming SSE per agent
    const encoder = new TextEncoder();
    const agentIds = ['ceo', 'cto', 'cmo', 'cfo'];
    const fullResponses: Record<string, string> = {};
    let currentTurnTranscript = '';

    // Persist user's initiating message early
    if (ideaId) {
      await db.insert(messages).values({
        id: crypto.randomUUID(),
        ideaId,
        chatType: 'boardroom',
        agentId: null,
        role: 'user',
        content: message,
      });
    }

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for (const agentId of agentIds) {
            const agent = AGENTS[agentId];
            let fullPrompt = `BOARDROOM DISCUSSION:\n${message}\n\n`;
            
            if (conversationHistory && conversationHistory.length > 0) {
              fullPrompt += `PREVIOUS DISCUSSION HISTORY:\n${conversationHistory.map((m: any) => `${m.agentId ? AGENTS[m.agentId]?.name || 'User' : 'User'}: ${m.content}`).join('\n')}\n\n`;
            }

            if (currentTurnTranscript) {
              fullPrompt += `CURRENT MEETING TRANSCRIPT (What just happened):\n${currentTurnTranscript}\n\n`;
            }

            fullPrompt += `INSTRUCTIONS:\nYou are ${agent.name} (${agent.role}).\n${agent.personality}\n\nRespond to the user's input AND the other board members. If someone just spoke, build on it or disagree. Don't ignore them.\n\nYOUR RESPONSE:`;

            fullResponses[agent.id] = '';
            for await (const chunk of streamFromGemini(fullPrompt, agent.systemPrompt)) {
              fullResponses[agent.id] += chunk.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ agentId: agent.id, chunk:chunk.text })}\n\n`)
              );
            }
            
            // Append to transcript for next agent
            currentTurnTranscript += `${agent.name}: ${fullResponses[agent.id]}\n\n`;

            // Persist this agent's final response
            if (ideaId) {
              await db.insert(messages).values({
                id: crypto.randomUUID(),
                ideaId,
                chatType: 'boardroom',
                agentId: agent.id,
                role: 'assistant',
                content: fullResponses[agent.id],
              });
            }
          }

          // Assistant summary over the whole debate
          try {
            const assistant = AGENTS['assistant'];
            const summaryPrompt = `${assistant.systemPrompt}\n\nBOARDROOM TOPIC / USER MESSAGE:\n${message}\n\nFULL DEBATE TRANSCRIPT:\n${agentIds
              .map((aid) => `${AGENTS[aid].name}: ${fullResponses[aid]}`)
              .join('\n\n')}\n\nSummarize key points and decisions in 5-8 bullet points. Make it actionable.`;
            
            // Use native tools for summary if needed (though summary usually doesn't need tools, keeping it consistent)
            const functionDeclarations = getGeminiFunctionDeclarations();
            const { text: summary, toolCalls } = await sendWithTools(summaryPrompt, functionDeclarations, assistant.systemPrompt);

            // Handle any tool calls from summary (e.g. auto-create tasks from meeting)
            if (ideaId && Array.isArray(toolCalls)) {
               for (const call of toolCalls) {
                 if (call.name === 'create_task') {
                    await db.insert(tasks).values({
                      id: crypto.randomUUID(),
                      ideaId,
                      title: call.args?.title || 'Untitled Task',
                      description: call.args?.description || '',
                      status: 'todo',
                      priority: call.args?.priority || 'medium',
                      assignedTo: call.args?.assignedTo || null,
                      tags: call.args?.tags ? JSON.stringify(call.args.tags) : null,
                      dueDate: null,
                    });
                 }
               }
            }

            // Persist assistant summary
            if (ideaId) {
              await db.insert(messages).values({
                id: crypto.randomUUID(),
                ideaId,
                chatType: 'boardroom',
                agentId: 'assistant',
                role: 'assistant',
                content: summary,
              });
            }

            // Stream summary event
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ agentId: 'assistant', summary })}\n\n`)
            );
          } catch (e) {
            // ignore summary errors, still close stream
            console.error('Summary generation failed:', e);
          }

          // Final signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
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
    console.error('Boardroom chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

