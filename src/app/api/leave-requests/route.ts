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

// GET: Fetch leave requests
export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure 'On Duty' category exists in DB
    await prisma.leaveType.upsert({
      where: { name: 'On Duty' },
      update: {},
      create: { name: 'On Duty', daysAllowed: 365 }
    });

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

    const requests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true, teamId: true },
        },
        leaveType: {
          select: { id: true, name: true, daysAllowed: true },
        },
        reviewedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also calculate leave balances for the response (if requesting for a specific user or self)
    const targetBalanceUserId = user.role === 'EMPLOYEE' ? user.userId : userIdParam;
    let leaveBalances = null;

    if (targetBalanceUserId && targetBalanceUserId !== 'all') {
      const leaveTypes = await prisma.leaveType.findMany({
        include: {
          requests: {
            where: {
              userId: targetBalanceUserId,
              status: 'APPROVED',
            },
          },
        },
      });

      const currentYear = new Date().getFullYear();
      leaveBalances = leaveTypes.map((lt) => {
        let daysUsed = 0;
        lt.requests.forEach((req) => {
          let current = new Date(req.startDate);
          const end = new Date(req.endDate);
          while (current <= end) {
            if (current.getFullYear() === currentYear) {
              daysUsed++;
            }
            current.setDate(current.getDate() + 1);
          }
        });

        return {
          id: lt.id,
          name: lt.name,
          daysAllowed: lt.daysAllowed,
          daysUsed,
          daysRemaining: Math.max(0, lt.daysAllowed - daysUsed),
        };
      });
    }

    return NextResponse.json({ requests, leaveBalances });
  } catch (error) {
    console.error('LeaveRequest GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a leave request
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leaveTypeId, startDate, endDate, reason } = await request.json();

    if (!leaveTypeId || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Calculate requested days
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return NextResponse.json({ error: 'Invalid dates selected' }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();
    let requestedDays = 0;
    let temp = new Date(startDate);
    while (temp <= end) {
      if (temp.getFullYear() === currentYear) {
        requestedDays++;
      }
      temp.setDate(temp.getDate() + 1);
    }

    if (requestedDays === 0) {
      return NextResponse.json({ error: 'Requests must cover the current year' }, { status: 400 });
    }

    // 2. Fetch leave type & approved requests for balance checking
    const leaveType = await prisma.leaveType.findUnique({
      where: { id: leaveTypeId },
      include: {
        requests: {
          where: {
            userId: user.userId,
            status: 'APPROVED',
          },
        },
      },
    });

    if (!leaveType) {
      return NextResponse.json({ error: 'Leave type not found' }, { status: 404 });
    }

    let daysUsed = 0;
    leaveType.requests.forEach((req) => {
      let current = new Date(req.startDate);
      const reqEnd = new Date(req.endDate);
      while (current <= reqEnd) {
        if (current.getFullYear() === currentYear) {
          daysUsed++;
        }
        current.setDate(current.getDate() + 1);
      }
    });

    const remaining = leaveType.daysAllowed - daysUsed;

    if (leaveType.name !== 'Loss of Pay' && requestedDays > remaining) {
      return NextResponse.json({
        error: `Insufficient balance. Requested: ${requestedDays} day(s), Remaining: ${remaining} day(s).`,
      }, { status: 400 });
    }

    // 3. Create the request
    const leaveReq = await prisma.leaveRequest.create({
      data: {
        userId: user.userId,
        leaveTypeId,
        startDate,
        endDate,
        reason,
        status: 'PENDING',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'LEAVE_REQUEST_SUBMIT',
        entity: 'LeaveRequest',
        entityId: leaveReq.id,
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

      const leaveTypeName = leaveType.name;
      
      const notifData = {
        type: 'leave',
        title: 'New Leave Request Raised',
        body: `${applicant?.name || 'A team member'} has raised a leave request (${leaveTypeName}).`,
        status: 'PENDING',
        details: {
          'Applicant': applicant?.name || 'A team member',
          'Leave Type': leaveTypeName,
          'Duration': `${startDate} to ${endDate}`,
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
      console.error('Error sending leave request notifications:', notifError);
    }

    return NextResponse.json({ success: true, request: leaveReq });
  } catch (error) {
    console.error('LeaveRequest POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Approve / Reject leave requests
export async function PUT(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Leave approvals are handled exclusively by HR' }, { status: 403 });
    }

    const { id, status, rejectionReason } = await request.json();

    if (!id || !status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, teamId: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    if (existing.status !== 'PENDING') {
      return NextResponse.json({ error: 'Conflict: Leave request has already been resolved' }, { status: 400 });
    }

    let isLossOfPay = false;
    if (status === 'APPROVED') {
      const leaveType = await prisma.leaveType.findUnique({
        where: { id: existing.leaveTypeId },
      });
      if (leaveType) {
        if (leaveType.name === 'Loss of Pay') {
          isLossOfPay = true;
        } else {
          const currentYear = new Date().getFullYear();
          const approvedRequests = await prisma.leaveRequest.findMany({
            where: {
              userId: existing.userId,
              leaveTypeId: existing.leaveTypeId,
              status: 'APPROVED',
              id: { not: existing.id },
            },
          });
          let daysUsed = 0;
          approvedRequests.forEach((req) => {
            let current = new Date(req.startDate);
            const reqEnd = new Date(req.endDate);
            while (current <= reqEnd) {
              if (current.getFullYear() === currentYear) {
                daysUsed++;
              }
              current.setDate(current.getDate() + 1);
            }
          });
          const remaining = leaveType.daysAllowed - daysUsed;

          const start = new Date(existing.startDate);
          const end = new Date(existing.endDate);
          let requestedDays = 0;
          let temp = new Date(start);
          while (temp <= end) {
            if (temp.getFullYear() === currentYear) {
              requestedDays++;
            }
            temp.setDate(temp.getDate() + 1);
          }

          if (requestedDays > remaining) {
            isLossOfPay = true;
          }
        }
      }
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewedById: user.userId,
        reviewedAt: new Date(),
        lossOfPay: status === 'APPROVED' ? isLossOfPay : false,
      },
    });

    // Write to AuditLog
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: `LEAVE_REQUEST_${status}`,
        entity: 'LeaveRequest',
        entityId: updated.id,
      },
    });

    // Send notification to the employee (including rejection reason if rejected)
    const notifData = {
      type: 'leave',
      title: `Leave Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      body: `Your leave request from ${existing.startDate} to ${existing.endDate} has been ${status.toLowerCase()} by ${user.name}.`,
      status,
      details: {
        'Duration': `${existing.startDate} to ${existing.endDate}`,
        'Reviewed By': user.name,
        ...(status === 'REJECTED' && rejectionReason ? { 'Rejection Reason': rejectionReason } : {})
      }
    };
    const notifMessage = JSON.stringify(notifData);

    await prisma.notification.create({
      data: {
        userId: existing.userId,
        message: notifMessage,
      },
    });

    // If APPROVED, auto-populate the Attendance table with status 'LEAVE' for all dates in range
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
            status: 'LEAVE',
            checkInTime: null,
            checkOutTime: null,
          },
          create: {
            userId: existing.userId,
            date: dateStr,
            status: 'LEAVE',
            ip: 'SYSTEM',
            tz: 'Asia/Kolkata',
          },
        });
        current.setDate(current.getDate() + 1);
      }
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error('LeaveRequest PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
