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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.userId;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const project = searchParams.get('project');

    if (userId !== user.userId && user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const where: any = { userId };
    
    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }
    if (project && project !== 'all') {
      where.project = project;
    }

    const trackSheets = await prisma.trackSheet.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ trackSheets });
  } catch (error) {
    console.error('TrackSheets GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date, project, taskDescription, hours, notes, assignedByName } = await request.json();

    if (!date || !project || !taskDescription || !hours) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hoursFloat = parseFloat(hours);
    if (isNaN(hoursFloat) || hoursFloat <= 0 || hoursFloat > 24) {
      return NextResponse.json({ error: 'Hours must be a positive number between 0 and 24' }, { status: 400 });
    }

    const trackSheet = await prisma.trackSheet.create({
      data: {
        userId: user.userId,
        date,
        project,
        taskDescription,
        hours: hoursFloat,
        notes,
        status: 'PENDING',
        assignedByName: assignedByName || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE_TRACK_SHEET',
        entity: 'TrackSheet',
        entityId: trackSheet.id,
      },
    });

    return NextResponse.json({ success: true, trackSheet });
  } catch (error) {
    console.error('TrackSheets POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, project, taskDescription, hours, notes, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Track sheet ID is required' }, { status: 400 });
    }

    const existing = await prisma.trackSheet.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Track sheet not found' }, { status: 404 });
    }

    if (user.role === 'EMPLOYEE') {
      if (existing.userId !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (existing.status !== 'PENDING') {
        return NextResponse.json({ error: 'Cannot modify an approved/rejected track sheet' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (project) updateData.project = project;
    if (taskDescription) updateData.taskDescription = taskDescription;
    if (hours !== undefined) {
      const hoursFloat = parseFloat(hours);
      if (isNaN(hoursFloat) || hoursFloat <= 0 || hoursFloat > 24) {
        return NextResponse.json({ error: 'Invalid hours' }, { status: 400 });
      }
      updateData.hours = hoursFloat;
    }
    if (notes !== undefined) updateData.notes = notes;
    
    if (status) {
      if (user.role === 'EMPLOYEE') {
        return NextResponse.json({ error: 'Employees cannot change approval status' }, { status: 403 });
      }
      if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updateData.status = status;
    }

    const updated = await prisma.trackSheet.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: status ? `STATUS_TRACK_SHEET_${status}` : 'UPDATE_TRACK_SHEET',
        entity: 'TrackSheet',
        entityId: updated.id,
      },
    });

    if (status && existing.userId !== user.userId) {
      await prisma.notification.create({
        data: {
          userId: existing.userId,
          message: `Your track sheet for ${existing.date} has been ${status.toLowerCase()} by ${user.name}.`,
        },
      });
    }

    return NextResponse.json({ success: true, trackSheet: updated });
  } catch (error) {
    console.error('TrackSheets PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const existing = await prisma.trackSheet.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Track sheet not found' }, { status: 404 });
    }

    if (existing.userId !== user.userId && user.role !== 'HR_ADMIN' && user.role !== 'TL') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (user.role === 'EMPLOYEE' && existing.status !== 'PENDING') {
      return NextResponse.json({ error: 'Cannot delete an approved/rejected track sheet' }, { status: 400 });
    }

    await prisma.trackSheet.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'DELETE_TRACK_SHEET',
        entity: 'TrackSheet',
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('TrackSheets DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
