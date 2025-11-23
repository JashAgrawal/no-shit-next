import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { tasks, ideas } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';

// GET tasks for an idea
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

    if (!ideaId) {
      return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 });
    }

    // Verify idea belongs to user
    const idea = await db.select().from(ideas).where(
      and(eq(ideas.id, ideaId), eq(ideas.userId, session.user.id))
    );

    if (!idea.length) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const ideaTasks = await db.select().from(tasks).where(eq(tasks.ideaId, ideaId));

    return NextResponse.json({ tasks: ideaTasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE delete a task
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const ideaId = searchParams.get('ideaId');

    if (!id || !ideaId) {
      return NextResponse.json({ error: 'Task ID and Idea ID are required' }, { status: 400 });
    }

    const idea = await db.select().from(ideas).where(
      and(eq(ideas.id, ideaId), eq(ideas.userId, session.user.id))
    );

    if (!idea.length) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    await db.delete(tasks).where(eq(tasks.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create a new task
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ideaId, title, description, status, priority, assignedTo, tags, dueDate } = await req.json();

    if (!ideaId || !title || !description) {
      return NextResponse.json({ error: 'IdeaId, title, and description are required' }, { status: 400 });
    }

    // Verify idea belongs to user
    const idea = await db.select().from(ideas).where(
      and(eq(ideas.id, ideaId), eq(ideas.userId, session.user.id))
    );

    if (!idea.length) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const newTask = await db.insert(tasks).values({
      id: id || crypto.randomUUID(),
      ideaId,
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      assignedTo: assignedTo || null,
      tags: tags ? JSON.stringify(tags) : null,
      dueDate: dueDate || null,
    }).returning();

    return NextResponse.json({ task: newTask[0] });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH update a task
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...updates } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.status) updateData.status = updates.status;
    if (updates.priority) updateData.priority = updates.priority;
    if (updates.assignedTo !== undefined) updateData.assignedTo = updates.assignedTo;
    if (updates.tags) updateData.tags = JSON.stringify(updates.tags);
    if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate;

    const updatedTask = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    return NextResponse.json({ task: updatedTask[0] });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

