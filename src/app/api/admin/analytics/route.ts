import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

async function getAuthUser() {
  const session = await auth();
  if (!session?.user) return null;
  return {
    userId: session.user.id,
    role: session.user.role,
  };
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Total Employees count (all registered rostered staff)
    const totalEmployees = await prisma.user.count({
      where: {
        role: { in: ['EMPLOYEE', 'TL'] },
      },
    });

    // 2. Active Employees count
    const activeEmployees = await prisma.user.count({
      where: {
        role: { in: ['EMPLOYEE', 'TL'] },
        isActive: true,
      },
    });

    // 3. New Joiners (this month)
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const newJoiners = await prisma.user.count({
      where: {
        role: { in: ['EMPLOYEE', 'TL'] },
        isActive: true,
        createdAt: { gte: firstDayOfMonth },
      },
    });

    // 4. On Leave (today) - active staff only
    const onLeaveToday = await prisma.leaveRequest.count({
      where: {
        status: 'APPROVED',
        startDate: { lte: todayStr },
        endDate: { gte: todayStr },
        user: { role: { in: ['EMPLOYEE', 'TL'] }, isActive: true },
      },
    });

    // 5. Checked in today - active staff only
    const checkedInToday = await prisma.attendance.count({
      where: {
        date: todayStr,
        checkInTime: { not: null },
        status: { not: 'ABSENT' },
        user: { role: { in: ['EMPLOYEE', 'TL'] }, isActive: true },
      },
    });

    // 6. Absent (today) - only count active staff with explicit ABSENT status today
    const absentToday = await prisma.attendance.count({
      where: {
        date: todayStr,
        status: 'ABSENT',
        user: { role: { in: ['EMPLOYEE', 'TL'] }, isActive: true },
      },
    });

    // 7. Rolling Attendance % (past 30 days) for active staff
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const presentLogs = await prisma.attendance.count({
      where: {
        date: { gte: thirtyDaysAgoStr, lte: todayStr },
        status: { in: ['PRESENT', 'LATE', 'LATE_COMING', 'EARLY_LEAVING', 'OVERTIME', 'MISSING_PUNCH'] },
        user: { role: { in: ['EMPLOYEE', 'TL'] }, isActive: true },
      },
    });

    const absentLogs = await prisma.attendance.count({
      where: {
        date: { gte: thirtyDaysAgoStr, lte: todayStr },
        status: 'ABSENT',
        user: { role: { in: ['EMPLOYEE', 'TL'] }, isActive: true },
      },
    });

    const totalLogs = presentLogs + absentLogs;
    let rollingAttendanceRate = totalLogs > 0 ? (presentLogs / totalLogs) * 100 : 100;
    
    // If today has check-ins or active employees present, ensure realistic rate
    const todayRate = activeEmployees > 0 ? (checkedInToday / activeEmployees) * 100 : 100;

    return NextResponse.json({
      totalEmployees,
      activeEmployees,
      newJoiners,
      onLeaveToday,
      absentToday,
      rollingAttendanceRate,
      todayAttendanceRate: todayRate,
      checkedInToday,
    });
  } catch (error) {
    console.error('Analytics stats calculation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
