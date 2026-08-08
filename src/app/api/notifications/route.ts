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

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.userId, read: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (id) {
      await prisma.notification.update({
        where: { id },
        data: { read: true },
      });
    } else {
      await prisma.notification.updateMany({
        where: { userId: user.userId, read: false },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
