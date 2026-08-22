import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

async function getAuthUser() {
  const session = await auth();
  if (!session?.user) return null;
  return {
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
  };
}

// GET: Fetch resignation requests
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'HR_ADMIN') {
      const requests = await prisma.resignationRequest.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, team: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ requests });
    } else {
      // Employee or TL: fetch self resignation request
      const request = await prisma.resignationRequest.findUnique({
        where: { userId: user.userId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      return NextResponse.json({ request });
    }
  } catch (error) {
    console.error('Resignation GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Submit a resignation request (Employee only)
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resignationDate, lastWorkingDay, reason } = await request.json();

    if (!resignationDate || !lastWorkingDay || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if resignation already exists
    const existing = await prisma.resignationRequest.findUnique({
      where: { userId: user.userId },
    });

    if (existing) {
      return NextResponse.json({ error: 'You have already submitted a resignation request' }, { status: 400 });
    }

    const resignation = await prisma.resignationRequest.create({
      data: {
        userId: user.userId,
        resignationDate: new Date(resignationDate),
        lastWorkingDay: new Date(lastWorkingDay),
        reason,
        status: 'PENDING',
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'RESIGNATION_SUBMIT',
        entity: 'ResignationRequest',
        entityId: resignation.id,
      },
    });

    return NextResponse.json({ success: true, resignation });
  } catch (error) {
    console.error('Resignation POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Approve / Reject resignation request (HR Admin only)
export async function PUT(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, status, hrNotes } = await request.json();

    if (!id || !status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid body parameters' }, { status: 400 });
    }

    const existing = await prisma.resignationRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Resignation request not found' }, { status: 404 });
    }

    const updated = await prisma.resignationRequest.update({
      where: { id },
      data: {
        status,
        hrNotes: hrNotes || null,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: `RESIGNATION_${status}`,
        entity: 'ResignationRequest',
        entityId: updated.id,
      },
    });

    // Create notification for employee
    await prisma.notification.create({
      data: {
        userId: existing.userId,
        message: `Your resignation request has been ${status.toLowerCase()} by HR. Notes: ${hrNotes || 'None'}`,
      },
    });

    return NextResponse.json({ success: true, resignation: updated });
  } catch (error) {
    console.error('Resignation PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
