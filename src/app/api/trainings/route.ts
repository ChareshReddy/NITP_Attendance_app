import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

async function getAuthUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}

export async function GET(request: Request) {
  try {
    const caller = await getAuthUser();
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (caller.role === 'EMPLOYEE') {
      const assignments = await prisma.trainingAttendance.findMany({
        where: { userId: caller.id },
        include: {
          training: true,
        },
      });
      return NextResponse.json({ assignments });
    }

    // HR and TL can view all trainings and their attendance lists
    const trainings = await prisma.training.findMany({
      include: {
        attendance: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { plannedDate: 'desc' },
    });

    return NextResponse.json({ trainings });
  } catch (error) {
    console.error('Trainings GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const caller = await getAuthUser();
    if (!caller || caller.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { trainingName, trainer, plannedDate, durationHours, department, userIds } = await request.json();

    if (!trainingName || !trainer || !plannedDate || durationHours === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const training = await prisma.training.create({
      data: {
        trainingName,
        trainer,
        plannedDate: new Date(plannedDate),
        durationHours: parseFloat(durationHours),
        department: department || null,
      },
    });

    // Assign employees if userIds are provided
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      const attendanceData = userIds.map((uid: string) => ({
        trainingId: training.id,
        userId: uid,
        attended: false,
        certified: false,
      }));
      await prisma.trainingAttendance.createMany({
        data: attendanceData,
        skipDuplicates: true,
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: caller.id,
        action: 'CREATE_TRAINING',
        entity: 'Training',
        entityId: training.id,
      },
    });

    return NextResponse.json({ success: true, training });
  } catch (error) {
    console.error('Trainings POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const caller = await getAuthUser();
    if (!caller || caller.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, id, trainingId, userId, attended, certified, assessmentScore, feedback } = body;

    if (action === 'record_attendance') {
      if (!trainingId || !userId) {
        return NextResponse.json({ error: 'Missing trainingId or userId' }, { status: 400 });
      }

      const score = assessmentScore !== undefined && assessmentScore !== '' ? parseFloat(assessmentScore) : null;

      const record = await prisma.trainingAttendance.upsert({
        where: {
          trainingId_userId: {
            trainingId,
            userId,
          },
        },
        update: {
          attended: !!attended,
          certified: !!certified,
          assessmentScore: score,
          feedback: feedback || null,
        },
        create: {
          trainingId,
          userId,
          attended: !!attended,
          certified: !!certified,
          assessmentScore: score,
          feedback: feedback || null,
        },
      });

      return NextResponse.json({ success: true, record });
    } else if (action === 'update_training') {
      if (!id) {
        return NextResponse.json({ error: 'Missing training id' }, { status: 400 });
      }
      const updated = await prisma.training.update({
        where: { id },
        data: {
          trainingName: body.trainingName,
          trainer: body.trainer,
          plannedDate: body.plannedDate ? new Date(body.plannedDate) : undefined,
          actualDate: body.actualDate ? new Date(body.actualDate) : undefined,
          durationHours: body.durationHours ? parseFloat(body.durationHours) : undefined,
          department: body.department || null,
        },
      });

      return NextResponse.json({ success: true, training: updated });
    } else if (action === 'assign_users') {
      if (!id || !body.userIds || !Array.isArray(body.userIds)) {
        return NextResponse.json({ error: 'Invalid assign body' }, { status: 400 });
      }
      const attendanceData = body.userIds.map((uid: string) => ({
        trainingId: id,
        userId: uid,
        attended: false,
        certified: false,
      }));
      await prisma.trainingAttendance.createMany({
        data: attendanceData,
        skipDuplicates: true,
      });
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Trainings PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
