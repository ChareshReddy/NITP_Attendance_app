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
  // 1. Tasks count
  const totalTasks = await prisma.task.count({
    where: { assignedToId: userId },
  });
  const completedTasks = await prisma.task.count({
    where: {
      assignedToId: userId,
      status: 'COMPLETED',
    },
  });

  // 2. TrackSheets count
  const totalTrackSheets = await prisma.trackSheet.count({
    where: { userId },
  });
  const approvedTrackSheets = await prisma.trackSheet.count({
    where: {
      userId,
      status: 'APPROVED',
    },
  });

  const totalItems = totalTasks + totalTrackSheets;
  const completedItems = completedTasks + approvedTrackSheets;

  const autoScore = totalItems > 0 
    ? Math.round((completedItems / totalItems) * 100) 
    : 100;

  // Map to rating bands
  let rating: 'RED' | 'YELLOW' | 'GREEN' | 'BLUE' = 'GREEN';
  if (autoScore <= 40) {
    rating = 'RED'; // Needs Improvement
  } else if (autoScore <= 65) {
    rating = 'YELLOW'; // Average
  } else if (autoScore <= 85) {
    rating = 'GREEN'; // Good
  } else {
    rating = 'BLUE'; // Excellent
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

    // 1. Fetch relevant users to report on (only count EMPLOYEE & TL roles)
    let usersQuery: any = { isActive: true };
    if (user.role === 'TL') {
      usersQuery.teamId = user.teamId;
      usersQuery.role = { in: ['EMPLOYEE', 'TL'] };
    } else if (user.role === 'HR_ADMIN') {
      usersQuery.role = { in: ['EMPLOYEE', 'TL'] };
    } else {
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
    } else if (user.role === 'EMPLOYEE') {
      const existingScore = await prisma.performanceScore.findUnique({
        where: { userId: user.userId },
      });

      if (!existingScore?.manualOverride) {
        const { autoScore, rating } = await calculateUserPerformance(user.userId);

        await prisma.performanceScore.upsert({
          where: { userId: user.userId },
          update: {
            autoScore,
            rating,
          },
          create: {
            userId: user.userId,
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

    const { userId, rating, reason, overrideScore, clearOverride } = await request.json();

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
          overrideScore: null,
          updatedById: user.userId,
        },
        create: {
          userId,
          manualOverride: false,
          rating: autoRating,
          autoScore,
          overrideScore: null,
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

    let overrideScoreFloat: number | null = null;
    if (overrideScore !== undefined && overrideScore !== null && overrideScore !== '') {
      overrideScoreFloat = parseFloat(overrideScore);
      if (isNaN(overrideScoreFloat) || overrideScoreFloat < 0 || overrideScoreFloat > 100) {
        return NextResponse.json({ error: 'Override score must be a number between 0 and 100' }, { status: 400 });
      }
    }

    const updated = await prisma.performanceScore.upsert({
      where: { userId },
      update: {
        manualOverride: true,
        overrideReason: reason,
        rating,
        overrideScore: overrideScoreFloat,
        updatedById: user.userId,
      },
      create: {
        userId,
        manualOverride: true,
        overrideReason: reason,
        rating,
        autoScore: 100,
        overrideScore: overrideScoreFloat,
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
