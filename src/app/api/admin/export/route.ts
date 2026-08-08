import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import ExcelJS from 'exceljs';
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
    if (!user || (user.role !== 'HR_ADMIN' && user.role !== 'TL')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'attendance';
    const teamId = searchParams.get('teamId');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Next IT Point Attendance System';
    workbook.created = new Date();

    if (type === 'attendance') {
      const sheet = workbook.addWorksheet('Attendance Logs');

      sheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Employee ID', key: 'userId', width: 25 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Role', key: 'role', width: 15 },
        { header: 'Check In Time', key: 'checkInTime', width: 25 },
        { header: 'Check Out Time', key: 'checkOutTime', width: 25 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'IP Address', key: 'ip', width: 18 },
        { header: 'Timezone', key: 'tz', width: 20 },
      ];

      const where: any = {};
      if (userId && userId !== 'all') {
        where.userId = userId;
      }
      if (startDate && endDate) {
        where.date = { gte: startDate, lte: endDate };
      }

      const records = await prisma.attendance.findMany({
        where,
        include: {
          user: true,
        },
        orderBy: { date: 'desc' },
      });

      const filteredRecords = (teamId && teamId !== 'all')
        ? records.filter(r => r.user.teamId === teamId)
        : records;

      filteredRecords.forEach((r) => {
        sheet.addRow({
          date: r.date,
          userId: r.user.id,
          name: r.user.name,
          email: r.user.email,
          role: r.user.role,
          checkInTime: r.checkInTime.toISOString(),
          checkOutTime: r.checkOutTime ? r.checkOutTime.toISOString() : '-',
          status: r.status,
          ip: r.ip,
          tz: r.tz,
        });
      });

      sheet.getRow(1).font = { bold: true };
    } else {
      const sheet = workbook.addWorksheet('Work Track Sheets');

      sheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Project', key: 'project', width: 25 },
        { header: 'Task Description', key: 'taskDescription', width: 40 },
        { header: 'Hours Logged', key: 'hours', width: 15 },
        { header: 'Approval Status', key: 'status', width: 15 },
        { header: 'Notes', key: 'notes', width: 30 },
      ];

      const where: any = {};
      if (userId && userId !== 'all') {
        where.userId = userId;
      }
      if (startDate && endDate) {
        where.date = { gte: startDate, lte: endDate };
      }

      const records = await prisma.trackSheet.findMany({
        where,
        include: {
          user: true,
        },
        orderBy: { date: 'desc' },
      });

      const filteredRecords = (teamId && teamId !== 'all')
        ? records.filter(r => r.user.teamId === teamId)
        : records;

      filteredRecords.forEach((r) => {
        sheet.addRow({
          date: r.date,
          name: r.user.name,
          email: r.user.email,
          project: r.project,
          taskDescription: r.taskDescription,
          hours: r.hours,
          status: r.status,
          notes: r.notes || '-',
        });
      });

      sheet.getRow(1).font = { bold: true };
    }

    const buffer = await workbook.xlsx.writeBuffer();

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: `EXPORT_EXCEL_${type.toUpperCase()}`,
        entity: 'User',
        entityId: user.userId,
      },
    });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${type}_export_${new Date().toISOString().split('T')[0]}.xlsx`,
      },
    });

  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
