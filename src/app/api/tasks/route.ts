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
    const assignedToId = searchParams.get('assignedToId');
    const teamId = searchParams.get('teamId');

    const where: any = {};

    if (user.role === 'EMPLOYEE') {
      where.assignedToId = user.userId;
    } else if (user.role === 'TL') {
      if (teamId) {
        where.teamId = teamId;
      } else {
        where.teamId = user.teamId || undefined;
      }
      if (assignedToId) {
        where.assignedToId = assignedToId;
      }
    } else if (user.role === 'HR_ADMIN') {
      if (teamId) where.teamId = teamId;
      if (assignedToId) where.assignedToId = assignedToId;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        assignedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Tasks GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'TL' && user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, description, dueDate, priority, assignedToId } = await request.json();

    if (!title || !description || !dueDate || !assignedToId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const targetEmployee = await prisma.user.findUnique({
      where: { id: assignedToId },
    });

    if (!targetEmployee) {
      return NextResponse.json({ error: 'Assigned employee not found' }, { status: 404 });
    }

    const task = await prisma.task.create({
      data: {
        teamId: targetEmployee.teamId || user.teamId,
        assignedById: user.userId,
        assignedToId,
        title,
        description,
        dueDate: new Date(dueDate),
        priority: priority || 'MEDIUM',
        status: 'TODO',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE_TASK',
        entity: 'Task',
        entityId: task.id,
      },
    });

    await prisma.notification.create({
      data: {
        userId: assignedToId,
        message: `New task assigned: "${title}" by ${user.name}. Due by ${new Date(dueDate).toLocaleDateString()}.`,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Tasks POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, title, description, dueDate, priority, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const existing = await prisma.task.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (user.role === 'EMPLOYEE') {
      if (existing.assignedToId !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (!status) {
        return NextResponse.json({ error: 'Employees can only update task status' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (status) {
      if (!['TODO', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updateData.status = status;
    }

    if (user.role !== 'EMPLOYEE') {
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (dueDate) updateData.dueDate = new Date(dueDate);
      if (priority) updateData.priority = priority;
    }

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: status ? `STATUS_TASK_${status}` : 'UPDATE_TASK',
        entity: 'Task',
        entityId: updated.id,
      },
    });

    if (status === 'COMPLETED' && user.role === 'EMPLOYEE') {
      await prisma.notification.create({
        data: {
          userId: existing.assignedById,
          message: `${user.name} has completed the task: "${existing.title}".`,
        },
      });
    }

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error('Tasks PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
