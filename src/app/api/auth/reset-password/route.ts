import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    const resetRequest = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRequest || resetRequest.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    await prisma.user.update({
      where: { id: resetRequest.userId },
      data: { passwordHash },
    });

    await prisma.passwordReset.delete({
      where: { id: resetRequest.id },
    });

    await prisma.auditLog.create({
      data: {
        userId: resetRequest.userId,
        action: 'PASSWORD_RESET',
        entity: 'User',
        entityId: resetRequest.userId,
      },
    });

    return NextResponse.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
