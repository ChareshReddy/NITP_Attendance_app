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

// GET: Fetch regularisation requests
export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'EMPLOYEE') {
      const requests = await prisma.regularisationRequest.findMany({
        where: { userId: user.userId },
        orderBy: { date: 'desc' },
      });
      return NextResponse.json({ requests });
    } else if (user.role === 'TL') {
      // TL gets team requests
      const requests = await prisma.regularisationRequest.findMany({
        where: {
          user: { teamId: user.teamId }
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { date: 'desc' },
      });
      return NextResponse.json({ requests });
    } else if (user.role === 'HR_ADMIN') {
      const requests = await prisma.regularisationRequest.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, team: { select: { name: true } } }
          }
        },
        orderBy: { date: 'desc' },
      });
      return NextResponse.json({ requests });
    }
    return NextResponse.json({ requests: [] });
  } catch (error) {
    console.error('Regularisation GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Submit a regularisation request
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date, checkInTime, checkOutTime, reason } = await request.json();

    if (!date || !reason) {
      return NextResponse.json({ error: 'Date and Reason are required' }, { status: 400 });
    }

    // Check if there is already a pending request for this date
    const existingPending = await prisma.regularisationRequest.findFirst({
      where: {
        userId: user.userId,
        date,
        status: 'PENDING'
      }
    });

    if (existingPending) {
      return NextResponse.json({ error: 'A pending regularisation request already exists for this date' }, { status: 400 });
    }

    const req = await prisma.regularisationRequest.create({
      data: {
        userId: user.userId,
        date,
        checkInTime: checkInTime || null,
        checkOutTime: checkOutTime || null,
        reason,
        status: 'PENDING'
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'REGULARISATION_SUBMIT',
        entity: 'RegularisationRequest',
        entityId: req.id
      }
    });

    return NextResponse.json({ success: true, request: req });
  } catch (error) {
    console.error('Regularisation POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Approve / Reject regularisation request (TL or HR Admin)
export async function PUT(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'TL' && user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, status } = await request.json();

    if (!id || !status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const existing = await prisma.regularisationRequest.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (existing.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request has already been processed' }, { status: 400 });
    }

    // Check TL scope
    if (user.role === 'TL' && existing.user.teamId !== user.teamId) {
      return NextResponse.json({ error: 'Forbidden: User is not in your team' }, { status: 403 });
    }

    const updated = await prisma.regularisationRequest.update({
      where: { id },
      data: {
        status,
        reviewedById: user.userId,
        reviewedAt: new Date()
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: `REGULARISATION_${status}`,
        entity: 'RegularisationRequest',
        entityId: updated.id
      }
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: existing.userId,
        message: `Your regularisation request for ${existing.date} has been ${status.toLowerCase()} by ${user.name}.`
      }
    });

    // If Approved, update/upsert the corresponding Attendance record!
    if (status === 'APPROVED') {
      await prisma.attendance.upsert({
        where: {
          userId_date: {
            userId: existing.userId,
            date: existing.date
          }
        },
        update: {
          checkInTime: existing.checkInTime || undefined,
          checkOutTime: existing.checkOutTime || undefined,
          status: 'PRESENT' // Change status to present since it's regularised
        },
        create: {
          userId: existing.userId,
          date: existing.date,
          checkInTime: existing.checkInTime || null,
          checkOutTime: existing.checkOutTime || null,
          status: 'PRESENT',
          ip: 'REGULARISATION',
          tz: 'Asia/Kolkata'
        }
      });
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error('Regularisation PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
