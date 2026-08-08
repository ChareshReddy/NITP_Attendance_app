import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, teamLeaderId } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    // Create team
    const newTeam = await prisma.team.create({
      data: {
        name,
        teamLeaderId: teamLeaderId || null,
      },
    });

    // If team leader is assigned, update their teamId to this team
    if (teamLeaderId) {
      await prisma.user.update({
        where: { id: teamLeaderId },
        data: { teamId: newTeam.id },
      });
    }

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_TEAM',
        entity: 'Team',
        entityId: newTeam.id,
      },
    });

    return NextResponse.json({ success: true, team: newTeam });
  } catch (error) {
    console.error('Admin Teams POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
