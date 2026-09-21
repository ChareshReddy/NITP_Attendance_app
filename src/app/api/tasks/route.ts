import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { formatDateToIndian } from '@/lib/dateUtils';

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
    const scope = searchParams.get('scope');

    const where: any = {};

    // 1. Employee Portal view / personal assigned scope check
    if (scope === 'assigned' || assignedToId === 'me' || user.role === 'EMPLOYEE') {
      where.assignedToId = user.userId;
    } 
    // 2. Team Leader scope check (assigned by them OR assigned to a member of their team)
    else if (user.role === 'TL') {
      where.AND = [
        {
          OR: [
            { assignedById: user.userId },
            ...(user.teamId ? [
              { teamId: user.teamId },
              {
                assignedTo: {
                  teamId: user.teamId,
                },
              },
            ] : []),
          ],
        },
      ];

      if (assignedToId) {
        // Enforce that TL can only query their own tasks or their team members' tasks
        const targetEmployee = await prisma.user.findUnique({
          where: { id: assignedToId },
          select: { teamId: true },
        });
        if (assignedToId === user.userId || (targetEmployee && targetEmployee.teamId === user.teamId)) {
          where.AND.push({ assignedToId });
        } else {
          where.AND.push({ assignedToId: 'unauthorized_assigned_to_id' });
        }
      }
      if (teamId) {
        if (teamId === user.teamId) {
          where.AND.push({ teamId });
        } else {
          where.AND.push({ teamId: 'unauthorized_team_id' });
        }
      }
    } 
    // 3. HR/Admin scope check
    else if (user.role === 'HR_ADMIN') {
      if (teamId) where.teamId = teamId;
      if (assignedToId) where.assignedToId = assignedToId;
    } 
    // 4. Safe fallback for other/undefined roles
    else {
      where.assignedToId = user.userId;
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

    if (user.role === 'TL' && user.teamId && targetEmployee.teamId && targetEmployee.teamId !== user.teamId && assignedToId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden: Cannot assign tasks to members of another team' }, { status: 403 });
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

    const notifData = {
      type: 'task',
      title: 'New Task Assigned',
      body: `New task assigned: "${title}" by ${user.name}.`,
      status: 'PENDING',
      details: {
        'Task': title,
        'Assigned By': user.name,
        'Due Date': formatDateToIndian(dueDate),
        'Priority': priority || 'NORMAL',
      },
      link: '/employee?tab=tasks',
    };

    await prisma.notification.create({
      data: {
        userId: assignedToId,
        message: JSON.stringify(notifData),
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

    if (status !== undefined && status !== existing.status) {
      if (existing.assignedToId !== user.userId) {
        return NextResponse.json({ error: 'Forbidden: Only the assignee can change task status' }, { status: 403 });
      }
    }

    if (user.role === 'EMPLOYEE') {
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
      const taskDoneNotif = {
        type: 'task',
        title: 'Task Completed',
        body: `${user.name} has completed the task: "${existing.title}".`,
        status: 'COMPLETED',
        details: {
          'Task': existing.title,
          'Completed By': user.name,
        },
        link: '/tl?tab=tasks',
      };
      await prisma.notification.create({
        data: {
          userId: existing.assignedById,
          message: JSON.stringify(taskDoneNotif),
        },
      });
    }

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error('Tasks PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
