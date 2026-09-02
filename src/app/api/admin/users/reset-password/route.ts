import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. HR Admin access required.' }, { status: 403 });
    }

    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'User ID and new password are required' }, { status: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const passwordHash = bcrypt.hashSync(newPassword.trim(), 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Log action to AuditLog
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PASSWORD_RESET_BY_HR',
        entity: 'User',
        entityId: userId,
      },
    });

    // Send notification to employee
    try {
      await prisma.notification.create({
        data: {
          userId: userId,
          message: 'Your system password has been reset by HR Administration. Please change your temporary password upon login.',
        },
      });
    } catch (notifErr) {
      console.error('Error creating password reset notification:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${user.name}`,
    });
  } catch (error) {
    console.error('Admin reset-password error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
