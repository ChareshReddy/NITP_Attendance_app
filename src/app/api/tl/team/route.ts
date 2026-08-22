import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

async function getAuthUser() {
  const session = await auth();
  if (!session?.user) return null;
  return {
    userId: session.user.id,
    role: session.user.role,
    email: session.user.email,
    teamId: session.user.teamId,
    name: session.user.name,
  };
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'TL' && user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const queryTeamId = searchParams.get('teamId');

    let teamId = user.teamId;

    if (!teamId) {
      const ledTeam = await prisma.team.findFirst({
        where: { teamLeaderId: user.userId },
      });
      if (ledTeam) teamId = ledTeam.id;
    }

    let allTeams: any[] = [];
    if (user.role === 'HR_ADMIN') {
      allTeams = await prisma.team.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      if (queryTeamId) {
        teamId = queryTeamId;
      } else if (!teamId && allTeams.length > 0) {
        teamId = allTeams[0].id;
      }
    }

    if (!teamId) {
      return NextResponse.json({ members: [], team: null, allTeams });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    const members = await prisma.user.findMany({
      where: { teamId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employeeProfile: true,
      },
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const memberIds = members.map(m => m.id);

    const todayAttendance = await prisma.attendance.findMany({
      where: {
        userId: { in: memberIds },
        date: todayStr,
      },
    });

    const membersWithStatus = members.map(member => {
      const att = todayAttendance.find(a => a.userId === member.id);
      return {
        ...member,
        todayAttendance: att || null,
      };
    });

    return NextResponse.json({
      team,
      members: membersWithStatus,
      allTeams,
    });
  } catch (error) {
    console.error('TL team status GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
