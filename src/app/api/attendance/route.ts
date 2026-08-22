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

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Sweep missing punches from past days
    const pastUnclosedRecords = await prisma.attendance.findMany({
      where: {
        userId,
        date: { lt: todayStr },
        checkInTime: { not: null },
        checkOutTime: null,
        status: { not: 'MISSING_PUNCH' },
      },
    });

    if (pastUnclosedRecords.length > 0) {
      await prisma.attendance.updateMany({
        where: { id: { in: pastUnclosedRecords.map(r => r.id) } },
        data: { status: 'MISSING_PUNCH' },
      });
    }

    // 2. Auto-populate past missing days with HOLIDAY, WEEK_OFF, or ABSENT
    // We will scan the last 30 days up to yesterday
    const holidays = await prisma.holiday.findMany();
    const holidayDates = new Set(holidays.map(h => h.date));
    
    const workWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']; // Mon-Fri default

    const dateCursor = new Date();
    dateCursor.setDate(dateCursor.getDate() - 30); // scan last 30 days

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const existingDates = new Set(
      (await prisma.attendance.findMany({
        where: { userId, date: { lt: todayStr } },
        select: { date: true },
      })).map(r => r.date)
    );

    const backfillData = [];

    while (dateCursor <= yesterday) {
      const dateStr = dateCursor.toISOString().split('T')[0];
      
      if (!existingDates.has(dateStr)) {
        // Determine day of week
        const dayName = dateCursor.toLocaleDateString('en-US', { weekday: 'long' });
        const isWeekOff = !workWeek.includes(dayName);
        const isHoliday = holidayDates.has(dateStr);

        let status: 'HOLIDAY' | 'WEEK_OFF' | 'ABSENT' = 'ABSENT';
        if (isHoliday) status = 'HOLIDAY';
        else if (isWeekOff) status = 'WEEK_OFF';

        backfillData.push({
          userId,
          date: dateStr,
          status,
          ip: 'SYSTEM',
          tz: 'Asia/Kolkata',
        });
      }
      dateCursor.setDate(dateCursor.getDate() + 1);
    }

    if (backfillData.length > 0) {
      await prisma.attendance.createMany({
        data: backfillData,
        skipDuplicates: true,
      });
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    const currentMonthPrefix = new Date().toLocaleDateString('en-CA').slice(0, 7);
    const monthlyRecords = attendanceRecords.filter(r => r.date.startsWith(currentMonthPrefix));

    const presentCount = monthlyRecords.filter(r => ['PRESENT', 'OVERTIME', 'LATE_COMING', 'EARLY_LEAVING', 'MISSING_PUNCH'].includes(r.status)).length;
    const lateCount = monthlyRecords.filter(r => r.status === 'LATE_COMING').length;
    const absentCount = monthlyRecords.filter(r => r.status === 'ABSENT').length;
    const leaveCount = monthlyRecords.filter(r => r.status === 'LEAVE').length;
    const missingCount = monthlyRecords.filter(r => r.status === 'MISSING_PUNCH').length;
    const earlyLeavingCount = monthlyRecords.filter(r => r.status === 'EARLY_LEAVING').length;
    
    const stats = {
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      leave: leaveCount,
      missing: missingCount,
      earlyLeaving: earlyLeavingCount,
    };

    const todayRecord = attendanceRecords.find(r => r.date === todayStr) || null;

    return NextResponse.json({
      attendance: attendanceRecords,
      todayRecord,
      stats,
      holidays,
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
          status = 'LATE_COMING';
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

      // Calculate working hours
      const checkInTime = new Date(existing.checkInTime!);
      const workingHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      
      let newStatus = existing.status;
      
      if (workingHours < 8) {
        newStatus = 'EARLY_LEAVING';
      } else if (workingHours >= 9.5) {
        newStatus = 'OVERTIME';
      } else if (existing.status === 'LATE') {
        newStatus = 'LATE_COMING'; // normalize legacy status
      }

      const record = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkOutTime: now,
          status: newStatus as any,
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
