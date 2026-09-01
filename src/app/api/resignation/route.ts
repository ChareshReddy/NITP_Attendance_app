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

    // Send notifications to TL and HR
    try {
      const applicant = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { name: true, teamId: true }
      });

      const teamLeaderId = applicant?.teamId ? (await prisma.team.findUnique({
        where: { id: applicant.teamId },
        select: { teamLeaderId: true }
      }))?.teamLeaderId : null;

      const notifData = {
        type: 'resignation',
        title: 'New Resignation Request Submitted',
        body: `${applicant?.name || 'A team member'} has submitted a resignation request.`,
        status: 'PENDING',
        details: {
          'Applicant': applicant?.name || 'A team member',
          'Resignation Date': new Date(resignationDate).toLocaleDateString(),
          'Proposed LWD': new Date(lastWorkingDay).toLocaleDateString(),
          'Reason': reason
        }
      };
      const notifMessage = JSON.stringify(notifData);

      // Notify TL (if exists and is not the applicant themselves)
      if (teamLeaderId && teamLeaderId !== user.userId) {
        await prisma.notification.create({
          data: {
            userId: teamLeaderId,
            message: notifMessage,
          }
        });
      }

      // Notify all HR Admins (excluding the applicant if they are an HR admin)
      const hrAdmins = await prisma.user.findMany({
        where: { role: 'HR_ADMIN' },
        select: { id: true }
      });

      for (const hr of hrAdmins) {
        if (hr.id !== user.userId) {
          await prisma.notification.create({
            data: {
              userId: hr.id,
              message: notifMessage,
            }
          });
        }
      }
    } catch (notifError) {
      console.error('Error sending resignation notifications:', notifError);
    }

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
    const notifData = {
      type: 'resignation',
      title: `Resignation Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      body: `Your resignation request has been ${status.toLowerCase()} by HR.`,
      status,
      details: {
        'Status': status,
        'HR Notes': hrNotes || 'None'
      }
    };
    const notifMessage = JSON.stringify(notifData);

    await prisma.notification.create({
      data: {
        userId: existing.userId,
        message: notifMessage,
      },
    });

    return NextResponse.json({ success: true, resignation: updated });
  } catch (error) {
    console.error('Resignation PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
