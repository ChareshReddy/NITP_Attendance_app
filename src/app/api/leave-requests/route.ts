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

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    let whereClause: any = {};

    if (user.role === 'EMPLOYEE') {
      whereClause.userId = user.userId;
    } else if (user.role === 'TL') {
      if (userIdParam) {
        // TL checking a specific user
        const targetUser = await prisma.user.findUnique({
          where: { id: userIdParam },
          select: { teamId: true },
        });
        if (!targetUser || targetUser.teamId !== user.teamId) {
          return NextResponse.json({ error: 'Forbidden: Member not in your team' }, { status: 403 });
        }
        whereClause.userId = userIdParam;
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

    if (requestedDays > remaining) {
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

    if (user.role !== 'TL' && user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, status } = await request.json();

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

    // TL can only review their own team member requests
    if (user.role === 'TL' && existing.user.teamId !== user.teamId) {
      return NextResponse.json({ error: 'Forbidden: Request is not from your team member' }, { status: 403 });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewedById: user.userId,
        reviewedAt: new Date(),
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

    // Send notification to the employee
    await prisma.notification.create({
      data: {
        userId: existing.userId,
        message: `Your leave request from ${existing.startDate} to ${existing.endDate} has been ${status.toLowerCase()} by ${user.name}.`,
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
