import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const holidays = await prisma.holiday.findMany({
      orderBy: { date: 'asc' },
    });

    const leaveTypes = await prisma.leaveType.findMany({
      orderBy: { name: 'asc' },
    });

    const auditLogs = await prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ holidays, leaveTypes, auditLogs });
  } catch (error) {
    console.error('Policy GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { type, name, date, daysAllowed } = await request.json();

    if (type === 'holiday') {
      if (!name || !date) {
        return NextResponse.json({ error: 'Name and date are required' }, { status: 400 });
      }
      const newHoliday = await prisma.holiday.create({
        data: { name, date: new Date(date) },
      });
      
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: 'CREATE_HOLIDAY',
          entity: 'Holiday',
          entityId: newHoliday.id,
        },
      });

      return NextResponse.json({ success: true, holiday: newHoliday });
    } else if (type === 'leave_type') {
      if (!name || daysAllowed === undefined) {
        return NextResponse.json({ error: 'Name and days allowed are required' }, { status: 400 });
      }
      const newLeaveType = await prisma.leaveType.create({
        data: { name, daysAllowed: parseInt(daysAllowed) },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: 'CREATE_LEAVE_TYPE',
          entity: 'LeaveType',
          entityId: newLeaveType.id,
        },
      });

      return NextResponse.json({ success: true, leaveType: newLeaveType });
    } else {
      return NextResponse.json({ error: 'Invalid configuration type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Policy POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and type are required' }, { status: 400 });
    }

    if (type === 'holiday') {
      await prisma.holiday.delete({ where: { id } });
    } else if (type === 'leave_type') {
      await prisma.leaveType.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: `DELETE_${type.toUpperCase()}`,
        entity: type === 'holiday' ? 'Holiday' : 'LeaveType',
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Policy DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
