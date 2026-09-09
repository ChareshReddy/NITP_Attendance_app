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

// GET: Fetch WFH requests
export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let userIdParam = searchParams.get('userId');
    if (userIdParam === 'self') {
      userIdParam = user.userId;
    }

    let whereClause: any = {};

    if (user.role === 'EMPLOYEE') {
      whereClause.userId = user.userId;
    } else if (user.role === 'TL') {
      if (userIdParam) {
        if (userIdParam === user.userId) {
          whereClause.userId = user.userId;
        } else {
          // TL checking a specific user
          const targetUser = await prisma.user.findUnique({
            where: { id: userIdParam },
            select: { teamId: true },
          });
          if (!targetUser || targetUser.teamId !== user.teamId) {
            return NextResponse.json({ error: 'Forbidden: Member not in your team' }, { status: 403 });
          }
          whereClause.userId = userIdParam;
        }
      } else {
        // Fetch all team members' requests
        whereClause.user = { teamId: user.teamId };
      }
    } else if (user.role === 'HR_ADMIN') {
      if (userIdParam && userIdParam !== 'all') {
        whereClause.userId = userIdParam;
      }
    }

    const requests = await prisma.wfhRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true, teamId: true, team: { select: { name: true } } },
        },
        reviewedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('WFH GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a WFH request (Employee submit) OR direct assignment (HR Admin)
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { startDate, endDate, reason, targetUserId, directAssign } = await request.json();

    if (!startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'Start date, end date, and reason are required' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return NextResponse.json({ error: 'Invalid date range selected' }, { status: 400 });
    }

    // HR Direct Assignment Mode
    if (directAssign) {
      if (user.role !== 'HR_ADMIN') {
        return NextResponse.json({ error: 'Forbidden: Only HR Admins can directly assign WFH' }, { status: 403 });
      }

      if (!targetUserId) {
        return NextResponse.json({ error: 'Target employee is required for direct assignment' }, { status: 400 });
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true, email: true },
      });

      if (!targetUser) {
        return NextResponse.json({ error: 'Target employee not found' }, { status: 404 });
      }

      // Create directly approved WFH Request
      const wfhReq = await prisma.wfhRequest.create({
        data: {
          userId: targetUserId,
          startDate,
          endDate,
          reason,
          status: 'APPROVED',
          reviewedById: user.userId,
          reviewedAt: new Date(),
          isDirectHrAssignment: true,
        },
      });

      // Upsert Attendance records for each date in range as WFH
      let current = new Date(startDate);
      const targetEnd = new Date(endDate);
      while (current <= targetEnd) {
        const dateStr = current.toISOString().split('T')[0];
        await prisma.attendance.upsert({
          where: {
            userId_date: {
              userId: targetUserId,
              date: dateStr,
            },
          },
          update: {
            status: 'WFH',
          },
          create: {
            userId: targetUserId,
            date: dateStr,
            status: 'WFH',
            ip: 'HR_ASSIGNED',
            tz: 'Asia/Kolkata',
          },
        });
        current.setDate(current.getDate() + 1);
      }

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: 'WFH_DIRECT_ASSIGN',
          entity: 'WfhRequest',
          entityId: wfhReq.id,
        },
      });

      // Notify Target Employee
      try {
        const notifData = {
          type: 'wfh',
          title: 'Work From Home Assigned by HR',
          body: `HR (${user.name}) has assigned you Work From Home from ${startDate} to ${endDate}.`,
          status: 'APPROVED',
          details: {
            'Duration': `${startDate} to ${endDate}`,
            'Assigned By': user.name,
            'Reason / Note': reason,
          },
        };
        await prisma.notification.create({
          data: {
            userId: targetUserId,
            message: JSON.stringify(notifData),
          },
        });
      } catch (notifErr) {
        console.error('Error sending direct WFH notification:', notifErr);
      }

      return NextResponse.json({ success: true, request: wfhReq });
    }

    // Standard Employee Submission Mode
    // Check for existing pending requests overlapping with this date range
    const overlappingPending = await prisma.wfhRequest.findFirst({
      where: {
        userId: user.userId,
        status: 'PENDING',
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    if (overlappingPending) {
      return NextResponse.json({
        error: 'You already have a pending WFH request overlapping with these dates.',
      }, { status: 400 });
    }

    const wfhReq = await prisma.wfhRequest.create({
      data: {
        userId: user.userId,
        startDate,
        endDate,
        reason,
        status: 'PENDING',
        isDirectHrAssignment: false,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'WFH_REQUEST_SUBMIT',
        entity: 'WfhRequest',
        entityId: wfhReq.id,
      },
    });

    // Notify TL and HR Admins
    try {
      const applicant = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { name: true, teamId: true },
      });

      const teamLeaderId = applicant?.teamId ? (await prisma.team.findUnique({
        where: { id: applicant.teamId },
        select: { teamLeaderId: true },
      }))?.teamLeaderId : null;

      const notifData = {
        type: 'wfh',
        title: 'New WFH Request Raised',
        body: `${applicant?.name || 'A team member'} has requested Work From Home.`,
        status: 'PENDING',
        details: {
          'Applicant': applicant?.name || 'A team member',
          'Duration': `${startDate} to ${endDate}`,
          'Reason': reason,
        },
      };
      const notifMessage = JSON.stringify(notifData);

      // Notify TL (if not self)
      if (teamLeaderId && teamLeaderId !== user.userId) {
        await prisma.notification.create({
          data: {
            userId: teamLeaderId,
            message: notifMessage,
          },
        });
      }

      // Notify HR Admins
      const hrAdmins = await prisma.user.findMany({
        where: { role: 'HR_ADMIN' },
        select: { id: true },
      });

      for (const hr of hrAdmins) {
        if (hr.id !== user.userId) {
          await prisma.notification.create({
            data: {
              userId: hr.id,
              message: notifMessage,
            },
          });
        }
      }
    } catch (notifErr) {
      console.error('Error sending WFH request notifications:', notifErr);
    }

    return NextResponse.json({ success: true, request: wfhReq });
  } catch (error) {
    console.error('WFH POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Approve / Reject WFH request (TL or HR Admin)
export async function PUT(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'TL' && user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Team Leaders or HR Admins can review WFH requests' }, { status: 403 });
    }

    const { id, status, rejectionReason } = await request.json();

    if (!id || !status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const existing = await prisma.wfhRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, teamId: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'WFH request not found' }, { status: 404 });
    }

    if (existing.status !== 'PENDING') {
      return NextResponse.json({ error: 'Conflict: Request has already been resolved' }, { status: 400 });
    }

    // Check TL team scope
    if (user.role === 'TL' && existing.user.teamId !== user.teamId) {
      return NextResponse.json({ error: 'Forbidden: Member not in your team' }, { status: 403 });
    }

    const updated = await prisma.wfhRequest.update({
      where: { id },
      data: {
        status,
        reviewedById: user.userId,
        reviewedAt: new Date(),
        rejectionReason: status === 'REJECTED' ? (rejectionReason || null) : null,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: `WFH_REQUEST_${status}`,
        entity: 'WfhRequest',
        entityId: updated.id,
      },
    });

    // If APPROVED, auto-populate the Attendance table with status 'WFH' for all dates in range
    if (status === 'APPROVED') {
      let current = new Date(existing.startDate);
      const end = new Date(existing.endDate);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        await prisma.attendance.upsert({
          where: {
            userId_date: {
              userId: existing.userId,
              date: dateStr,
            },
          },
          update: {
            status: 'WFH',
          },
          create: {
            userId: existing.userId,
            date: dateStr,
            status: 'WFH',
            ip: 'WFH_APPROVED',
            tz: 'Asia/Kolkata',
          },
        });
        current.setDate(current.getDate() + 1);
      }
    }

    // Send notification to employee
    try {
      const notifData = {
        type: 'wfh',
        title: `Work From Home Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
        body: `Your WFH request from ${existing.startDate} to ${existing.endDate} has been ${status.toLowerCase()} by ${user.name}.`,
        status,
        details: {
          'Duration': `${existing.startDate} to ${existing.endDate}`,
          'Reviewed By': user.name,
          ...(status === 'REJECTED' && rejectionReason ? { 'Rejection Reason': rejectionReason } : {}),
        },
      };
      await prisma.notification.create({
        data: {
          userId: existing.userId,
          message: JSON.stringify(notifData),
        },
      });
    } catch (notifErr) {
      console.error('Error sending WFH review notification:', notifErr);
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error('WFH PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
