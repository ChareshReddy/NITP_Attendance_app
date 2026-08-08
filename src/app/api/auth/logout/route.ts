import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (token) {
      const user = await verifyJWT(token);
      if (user) {
        // Create Audit Log
        await prisma.auditLog.create({
          data: {
            userId: user.userId,
            action: 'LOGOUT',
            entity: 'User',
            entityId: user.userId,
          },
        });
      }
    }

    cookieStore.delete('session_token');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
