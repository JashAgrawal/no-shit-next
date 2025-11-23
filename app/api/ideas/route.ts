import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { ideas } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

// GET all ideas for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userIdeas = await db.select().from(ideas).where(eq(ideas.userId, session.user.id));
    return NextResponse.json({ ideas: userIdeas });
  } catch (error) {
    console.error('Get ideas error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

// POST create a new idea
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description, verdict, validationData, dashboardData } = await req.json();
    if (!name || !description) return NextResponse.json({ error: 'Name and description are required' }, { status: 400 });

    const newIdea = await db
      .insert(ideas)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        name,
        description,
        validated: verdict ? true : false,
        verdict: verdict || null,
        validationData: validationData ? JSON.stringify(validationData) : null,
        dashboardData: dashboardData ? JSON.stringify(dashboardData) : null,
      })
      .returning();

    return NextResponse.json({ idea: newIdea[0] });
  } catch (error) {
    console.error('Create idea error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

// PATCH update an idea
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 });

    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.description) updateData.description = updates.description;
    if (updates.verdict) updateData.verdict = updates.verdict;
    if (updates.validated !== undefined) updateData.validated = updates.validated;
    if (updates.validationData) updateData.validationData = JSON.stringify(updates.validationData);
    if (updates.dashboardData) updateData.dashboardData = JSON.stringify(updates.dashboardData);

    const updatedIdea = await db.update(ideas).set(updateData).where(eq(ideas.id, id)).returning();
    return NextResponse.json({ idea: updatedIdea[0] });
  } catch (error) {
    console.error('Update idea error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

// DELETE remove an idea
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 });

    const existing = await db.select().from(ideas).where(eq(ideas.id, id));
    if (!existing.length || existing[0].userId !== session.user.id) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    await db.delete(ideas).where(eq(ideas.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete idea error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

