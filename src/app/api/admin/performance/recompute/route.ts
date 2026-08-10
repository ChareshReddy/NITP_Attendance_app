import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateUserPerformance } from '../route';

export async function GET() {
  try {
    const activeUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    let updatedCount = 0;
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
      updatedCount++;
    }

    return NextResponse.json({ success: true, updatedCount });
  } catch (error) {
    console.error('Recompute GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
