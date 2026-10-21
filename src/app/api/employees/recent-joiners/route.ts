import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 14 days ago cutoff
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        employeeProfile: {
          dateOfJoining: {
            gte: fourteenDaysAgo,
          },
        },
      },
      include: {
        employeeProfile: true,
      },
      orderBy: {
        employeeProfile: {
          dateOfJoining: 'desc',
        },
      },
      take: 12,
    });

    const recentJoiners = users.map((u) => {
      const p: any = u.employeeProfile || {};
      return {
        id: u.id,
        name: u.name,
        email: p.professionalEmail || u.email,
        designation: p.designation || 'Team Member',
        department: p.department || 'General',
        dateOfJoining: p.dateOfJoining ? p.dateOfJoining.toISOString().split('T')[0] : null,
        profileImage: p.profileImage || null,
        location: p.location || null,
      };
    });

    return NextResponse.json({ recentJoiners });
  } catch (error) {
    console.error('Error fetching recent joiners:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
