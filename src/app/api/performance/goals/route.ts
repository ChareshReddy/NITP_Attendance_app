import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

async function getAuthUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}

export async function GET(request: Request) {
  try {
    const caller = await getAuthUser();
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    let whereClause: any = {};

    if (caller.role === 'EMPLOYEE') {
      whereClause.userId = caller.id;
    } else if (caller.role === 'TL') {
      if (userIdParam) {
        // Scoping check for TL
        const target = await prisma.user.findUnique({
          where: { id: userIdParam },
          select: { teamId: true },
        });
        if (!target || target.teamId !== caller.teamId) {
          return NextResponse.json({ error: 'Forbidden: Member not in team' }, { status: 403 });
        }
        whereClause.userId = userIdParam;
      } else {
        whereClause.user = { teamId: caller.teamId };
      }
    } else if (caller.role === 'HR_ADMIN') {
      if (userIdParam && userIdParam !== 'all') {
        whereClause.userId = userIdParam;
      }
    }

    const goals = await prisma.performanceGoal.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Goals GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const caller = await getAuthUser();
    if (!caller || (caller.role !== 'TL' && caller.role !== 'HR_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, goalTitle, kpi, weight, target, period } = await request.json();

    if (!userId || !goalTitle || !kpi || weight === undefined || !target || !period) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If TL, check if target user is in their team
    if (caller.role === 'TL') {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { teamId: true },
      });
      if (!targetUser || targetUser.teamId !== caller.teamId) {
        return NextResponse.json({ error: 'Forbidden: User not in team' }, { status: 403 });
      }
    }

    const goal = await prisma.performanceGoal.create({
      data: {
        userId,
        managerId: caller.id,
        goalTitle,
        kpi,
        weight: parseFloat(weight),
        target,
        period,
        status: 'DRAFT',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: caller.id,
        action: 'CREATE_GOAL',
        entity: 'PerformanceGoal',
        entityId: goal.id,
      },
    });

    return NextResponse.json({ success: true, goal });
  } catch (error) {
    console.error('Goals POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const caller = await getAuthUser();
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, achievement, rating, status, goalTitle, kpi, weight, target, period } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing goal id' }, { status: 400 });
    }

    const existingGoal = await prisma.performanceGoal.findUnique({
      where: { id },
      include: { user: { select: { teamId: true } } },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (caller.role === 'EMPLOYEE') {
      // Employees can only update achievement and set status to mid/year end
      if (existingGoal.userId !== caller.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (achievement !== undefined) updateData.achievement = achievement;
      if (status !== undefined && ['MID_YEAR', 'YEAR_END'].includes(status)) {
        updateData.status = status;
      }
    } else if (caller.role === 'TL') {
      // TLs can approve goals, edit basic fields of their team goals, and rate them
      if (existingGoal.user.teamId !== caller.teamId && existingGoal.managerId !== caller.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (goalTitle !== undefined) updateData.goalTitle = goalTitle;
      if (kpi !== undefined) updateData.kpi = kpi;
      if (weight !== undefined) updateData.weight = parseFloat(weight);
      if (target !== undefined) updateData.target = target;
      if (period !== undefined) updateData.period = period;
      if (achievement !== undefined) updateData.achievement = achievement;
      if (rating !== undefined) updateData.rating = parseFloat(rating);
      if (status !== undefined) updateData.status = status; // e.g. MANAGER_APPROVED, HR_REVIEWED
    } else if (caller.role === 'HR_ADMIN') {
      // HR can update anything
      if (goalTitle !== undefined) updateData.goalTitle = goalTitle;
      if (kpi !== undefined) updateData.kpi = kpi;
      if (weight !== undefined) updateData.weight = parseFloat(weight);
      if (target !== undefined) updateData.target = target;
      if (period !== undefined) updateData.period = period;
      if (achievement !== undefined) updateData.achievement = achievement;
      if (rating !== undefined) updateData.rating = parseFloat(rating);
      if (status !== undefined) updateData.status = status;
    }

    const updated = await prisma.performanceGoal.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: caller.id,
        action: 'UPDATE_GOAL',
        entity: 'PerformanceGoal',
        entityId: id,
      },
    });

    return NextResponse.json({ success: true, goal: updated });
  } catch (error) {
    console.error('Goals PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
