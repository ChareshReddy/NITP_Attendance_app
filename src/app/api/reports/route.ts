import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    const where: any = {};

    if (user.role === 'TL') {
      where.teamId = user.teamId || undefined;
    } else if (user.role === 'HR_ADMIN') {
      if (teamId) where.teamId = teamId;
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        team: true,
        submittedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Reports GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'TL') {
      return NextResponse.json({ error: 'Only Team Leaders can submit reports' }, { status: 403 });
    }

    const { periodStart, periodEnd, summary } = await request.json();

    if (!periodStart || !periodEnd || !summary) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!user.teamId) {
      return NextResponse.json({ error: 'Team Leader is not assigned to a team' }, { status: 400 });
    }

    const hrAdmin = await prisma.user.findFirst({
      where: { role: 'HR_ADMIN' },
    });

    if (!hrAdmin) {
      return NextResponse.json({ error: 'No HR Admin found in system to submit report to' }, { status: 500 });
    }

    const report = await prisma.report.create({
      data: {
        teamId: user.teamId,
        submittedById: user.userId,
        submittedToUserId: hrAdmin.id,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        summary,
        status: 'PENDING',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'SUBMIT_REPORT',
        entity: 'Report',
        entityId: report.id,
      },
    });

    await prisma.notification.create({
      data: {
        userId: hrAdmin.id,
        message: `New team report submitted by TL ${user.name} for team.`,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Reports POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Report ID and status are required' }, { status: 400 });
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const updated = await prisma.report.update({
      where: { id },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: `REPORT_${status}`,
        entity: 'Report',
        entityId: id,
      },
    });

    await prisma.notification.create({
      data: {
        userId: report.submittedById,
        message: `Your team report submitted for review has been ${status.toLowerCase()} by HR.`,
      },
    });

    return NextResponse.json({ success: true, report: updated });
  } catch (error) {
    console.error('Reports PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
