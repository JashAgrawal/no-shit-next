import { NextRequest, NextResponse } from 'next/server';
import { sendToGemini, streamFromGemini } from '@/src/lib/gemini';
import { AGENTS } from '@/src/lib/agents';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { messages, ideas } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, ideaId, conversationHistory, shouldJudge, stream } = await req.json();

    if (!message || !ideaId) {
      return NextResponse.json({ error: 'Message and ideaId are required' }, { status: 400 });
    }

    // Verify idea belongs to user
    const idea = await db.select().from(ideas).where(eq(ideas.id, ideaId));
    if (!idea.length || idea[0].userId !== session.user.id) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Build conversation context
    const conversationContext = conversationHistory
      ? conversationHistory.map((m: any) => `${m.role === 'user' ? 'USER' : 'ORACLE'}: ${m.content}`).join('\n\n')
      : '';

    // Get Oracle's response
    let prompt = '';
    if (shouldJudge) {
      prompt = `${AGENTS.oracle.systemPrompt}

CONVERSATION HISTORY:
${conversationContext}

USER'S LATEST MESSAGE:
${message}

INSTRUCTIONS:
Make a FINAL VERDICT. Provide it in this EXACT format:

VERDICT: [TRASH/MID/VIABLE/FIRE]

SCORES:
- Problem Clarity: X/10
- Market Size: X/10
- Uniqueness: X/10
- Business Model: X/10
- Execution: X/10

REASONING:
[Your brutal honest assessment]`;
    } else {
      prompt = `${AGENTS.oracle.systemPrompt}

${conversationContext ? `CONVERSATION HISTORY:\n${conversationContext}\n\n` : ''}USER'S MESSAGE:
${message}

INSTRUCTIONS:
Ask 2-3 pointed, brutal questions to understand this idea better.`;
    }

    // If streaming is requested, return a streaming response
    if (stream) {
      const encoder = new TextEncoder();
      let fullResponse = '';

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamFromGemini(prompt)) {
              fullResponse += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
            }

            // Parse verdict if judging
            let verdict = null;
            let dashboardData = null;
            if (shouldJudge && fullResponse.includes('VERDICT:')) {
              const verdictMatch = fullResponse.match(/VERDICT:\s*(TRASH|MID|VIABLE|FIRE)/);
              if (verdictMatch) {
                verdict = verdictMatch[1];
                dashboardData = { fullAnalysis: fullResponse };

                await db.update(ideas)
                  .set({
                    verdict,
                    validated: true,
                    dashboardData: JSON.stringify(dashboardData),
                  })
                  .where(eq(ideas.id, ideaId));
              }
            }

            // Save messages to database
            await db.insert(messages).values([
              {
                id: crypto.randomUUID(),
                ideaId,
                chatType: 'oracle',
                agentId: null,
                role: 'user',
                content: message,
              },
              {
                id: crypto.randomUUID(),
                ideaId,
                chatType: 'oracle',
                agentId: 'oracle',
                role: 'assistant',
                content: fullResponse,
              },
            ]);

            // Send final metadata
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true, verdict, dashboardData })}\n\n`)
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
    }

    // Non-streaming response (fallback)
    const response = await sendToGemini(prompt);

    // Parse verdict if judging
    let verdict = null;
    let dashboardData = null;
    if (shouldJudge && response.includes('VERDICT:')) {
      const verdictMatch = response.match(/VERDICT:\s*(TRASH|MID|VIABLE|FIRE)/);
      if (verdictMatch) {
        verdict = verdictMatch[1];
        dashboardData = { fullAnalysis: response };

        await db.update(ideas)
          .set({
            verdict,
            validated: true,
            dashboardData: JSON.stringify(dashboardData),
          })
          .where(eq(ideas.id, ideaId));
      }
    }

    // Save messages to database
    await db.insert(messages).values([
      {
        id: crypto.randomUUID(),
        ideaId,
        chatType: 'oracle',
        agentId: null,
        role: 'user',
        content: message,
      },
      {
        id: crypto.randomUUID(),
        ideaId,
        chatType: 'oracle',
        agentId: 'oracle',
        role: 'assistant',
        content: response,
      },
    ]);

    return NextResponse.json({ response, verdict, dashboardData });
  } catch (error) {
    console.error('Oracle chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

