import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

async function getAuthUser() {
  const session = await auth();
  if (!session?.user) return null;
  return {
    userId: session.user.id,
    role: session.user.role,
    teamId: session.user.teamId,
    name: session.user.name,
  };
}

// Helper to compute auto score for a user
export async function calculateUserPerformance(userId: string) {
  // Constants for scoring calculation
  const BASE_SCORE = 100;
  const OVERDUE_TASK_PENALTY = 5;
  const LATE_CHECKIN_PENALTY = 2;
  const LATE_DAY_THRESHOLD = 3;
  const EXCESSIVE_LEAVE_PENALTY = 3;
  const REJECTED_TRACKSHEET_PENALTY = 1;

  // 1. Overdue tasks count
  const overdueTasksCount = await prisma.task.count({
    where: {
      assignedToId: userId,
      status: { in: ['TODO', 'IN_PROGRESS'] },
      dueDate: { lt: new Date() },
    },
  });
  const taskDeduction = overdueTasksCount * OVERDUE_TASK_PENALTY;

  // 2. Late check-ins in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const lateCheckinsCount = await prisma.attendance.count({
    where: {
      userId,
      status: 'LATE',
      checkInTime: { gte: thirtyDaysAgo },
    },
  });
  const lateDeduction = Math.max(0, lateCheckinsCount - LATE_DAY_THRESHOLD) * LATE_CHECKIN_PENALTY;

  // 3. Excessive leave days beyond allotted (current year)
  const leaveTypes = await prisma.leaveType.findMany({
    include: {
      requests: {
        where: {
          userId,
          status: 'APPROVED',
        },
      },
    },
  });

  const currentYear = new Date().getFullYear();
  let totalAllotted = 0;
  let totalUsed = 0;

  leaveTypes.forEach((lt) => {
    totalAllotted += lt.daysAllowed;
    lt.requests.forEach((req) => {
      let current = new Date(req.startDate);
      const end = new Date(req.endDate);
      while (current <= end) {
        if (current.getFullYear() === currentYear) {
          totalUsed++;
        }
        current.setDate(current.getDate() + 1);
      }
    });
  });

  const excessiveLeaveDays = Math.max(0, totalUsed - totalAllotted);
  const leaveDeduction = excessiveLeaveDays * EXCESSIVE_LEAVE_PENALTY;

  // 4. Rejected track sheets count
  const rejectedTrackSheetsCount = await prisma.trackSheet.count({
    where: {
      userId,
      status: 'REJECTED',
    },
  });
  const tracksheetDeduction = rejectedTrackSheetsCount * REJECTED_TRACKSHEET_PENALTY;

  // Calculate final score bounded [0, 100]
  const autoScore = Math.max(0, Math.min(BASE_SCORE, BASE_SCORE - taskDeduction - lateDeduction - leaveDeduction - tracksheetDeduction));

  // Map to rating bands
  let rating: 'RED' | 'YELLOW' | 'GREEN' | 'BLUE' = 'GREEN';
  if (autoScore <= 40) {
    rating = 'RED';
  } else if (autoScore <= 65) {
    rating = 'YELLOW';
  } else if (autoScore <= 85) {
    rating = 'GREEN';
  } else {
    rating = 'BLUE';
  }

  return { autoScore, rating };
}

// GET: Retrieve performance data
export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recompute = searchParams.get('recompute') === 'true';

    // 1. Fetch relevant users to report on
    let usersQuery: any = { isActive: true };
    if (user.role === 'TL') {
      usersQuery.teamId = user.teamId;
    } else if (user.role !== 'HR_ADMIN') {
      // Employees can only fetch their own performance score
      usersQuery.id = user.userId;
    }

    const activeUsers = await prisma.user.findMany({
      where: usersQuery,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: { select: { name: true } },
      },
    });

    // 2. Perform on-demand recompute if HR opens dashboard or requested
    if (recompute && (user.role === 'HR_ADMIN' || user.role === 'TL')) {
      for (const u of activeUsers) {
        const existingScore = await prisma.performanceScore.findUnique({
          where: { userId: u.id },
        });

        // Skip users with active manual override
        if (existingScore?.manualOverride) continue;

        const { autoScore, rating } = await calculateUserPerformance(u.id);

        await prisma.performanceScore.upsert({
          where: { userId: u.id },
          update: {
            autoScore,
            rating,
          },
          create: {
            userId: u.id,
            autoScore,
            rating,
          },
        });
      }
    }

    // 3. Fetch scores
    const userIds = activeUsers.map(u => u.id);
    const scores = await prisma.performanceScore.findMany({
      where: { userId: { in: userIds } },
      include: {
        updatedBy: { select: { name: true } },
      },
    });

    // Merge users list with their scores
    const result = activeUsers.map((u) => {
      const score = scores.find(s => s.userId === u.id);
      return {
        user: u,
        score: score || {
          rating: 'GREEN',
          autoScore: 100,
          manualOverride: false,
          overrideReason: null,
          updatedAt: new Date(),
        },
      };
    });

    return NextResponse.json({ performanceData: result });
  } catch (error) {
    console.error('Performance GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Set manual override (HR Admins only)
export async function PUT(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, rating, reason, clearOverride } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (clearOverride) {
      // Recalculate auto score and rating on override removal
      const { autoScore, rating: autoRating } = await calculateUserPerformance(userId);

      const updated = await prisma.performanceScore.upsert({
        where: { userId },
        update: {
          manualOverride: false,
          overrideReason: null,
          rating: autoRating,
          autoScore,
          updatedById: user.userId,
        },
        create: {
          userId,
          manualOverride: false,
          rating: autoRating,
          autoScore,
          updatedById: user.userId,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: 'PERFORMANCE_OVERRIDE_CLEAR',
          entity: 'PerformanceScore',
          entityId: updated.id,
        },
      });

      return NextResponse.json({ success: true, score: updated });
    }

    if (!rating || !['RED', 'YELLOW', 'GREEN', 'BLUE'].includes(rating) || !reason) {
      return NextResponse.json({ error: 'Rating and override reason are required' }, { status: 400 });
    }

    const updated = await prisma.performanceScore.upsert({
      where: { userId },
      update: {
        manualOverride: true,
        overrideReason: reason,
        rating,
        updatedById: user.userId,
      },
      create: {
        userId,
        manualOverride: true,
        overrideReason: reason,
        rating,
        autoScore: 100,
        updatedById: user.userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'PERFORMANCE_OVERRIDE',
        entity: 'PerformanceScore',
        entityId: updated.id,
      },
    });

    return NextResponse.json({ success: true, score: updated });
  } catch (error) {
    console.error('Performance PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
