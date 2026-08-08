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
    
    if (userId !== user.userId && user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'LATE').length;
    
    const stats = {
      present: presentCount,
      late: lateCount,
      absent: 0,
      leave: 0,
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = attendanceRecords.find(r => r.date === todayStr) || null;

    return NextResponse.json({
      attendance: attendanceRecords,
      todayRecord,
      stats,
    });
  } catch (error) {
    console.error('Attendance GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, tz } = await request.json();
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: user.userId,
          date: todayStr,
        },
      },
    });

    if (action === 'check_in') {
      if (existing) {
        return NextResponse.json({ error: 'Already checked in today' }, { status: 400 });
      }

      const timezone = tz || 'Asia/Kolkata';
      let status = 'PRESENT';
      try {
        const options = { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false } as const;
        const timeStr = new Intl.DateTimeFormat('en-US', options).format(now);
        const [hour, minute] = timeStr.split(':').map(Number);
        
        // Late arrival threshold: after 9:30 AM
        if (hour > 9 || (hour === 9 && minute > 30)) {
          status = 'LATE';
        }
      } catch (err) {
        console.error('Timezone parsing error, defaulting status to PRESENT:', err);
      }

      const record = await prisma.attendance.create({
        data: {
          userId: user.userId,
          date: todayStr,
          checkInTime: now,
          status: status as any,
          ip,
          tz: timezone,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: 'CHECK_IN',
          entity: 'Attendance',
          entityId: record.id,
        },
      });

      return NextResponse.json({ success: true, record });
    } else if (action === 'check_out') {
      if (!existing) {
        return NextResponse.json({ error: 'Must check in before checking out' }, { status: 400 });
      }
      if (existing.checkOutTime) {
        return NextResponse.json({ error: 'Already checked out today' }, { status: 400 });
      }

      const record = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkOutTime: now,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: 'CHECK_OUT',
          entity: 'Attendance',
          entityId: record.id,
        },
      });

      return NextResponse.json({ success: true, record });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Attendance POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
