import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { messages, ideas } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';

// GET /api/messages?ideaId=...&chatType=oracle|agent|hivemind|boardroom&agentId=...
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const ideaId = searchParams.get('ideaId');
    const chatType = searchParams.get('chatType');
    const agentId = searchParams.get('agentId');

    if (!ideaId) {
      return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 });
    }

    // Verify idea belongs to user
    const idea = await db.select().from(ideas).where(eq(ideas.id, ideaId));
    if (!idea.length || idea[0].userId !== session.user.id) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const whereClauses: any[] = [eq(messages.ideaId, ideaId)];
    if (chatType) whereClauses.push(eq(messages.chatType, chatType));
    // agentId null for oracle/hivemind/boardroom; filter only if provided
    if (agentId) whereClauses.push(eq(messages.agentId, agentId));

    const results = await db
      .select()
      .from(messages)
      .where(whereClauses.length > 1 ? and(...whereClauses) : whereClauses[0]);

    return NextResponse.json({ messages: results });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const ideaId = searchParams.get('ideaId');
    const chatType = searchParams.get('chatType');
    const agentId = searchParams.get('agentId');

    if (!ideaId) {
      return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 });
    }

    // Verify idea belongs to user
    const idea = await db.select().from(ideas).where(eq(ideas.id, ideaId));
    if (!idea.length || idea[0].userId !== session.user.id) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const whereClauses: any[] = [eq(messages.ideaId, ideaId)];
    if (chatType) whereClauses.push(eq(messages.chatType, chatType));
    if (agentId) whereClauses.push(eq(messages.agentId, agentId));

    await db
      .delete(messages)
      .where(whereClauses.length > 1 ? and(...whereClauses) : whereClauses[0]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete messages error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
