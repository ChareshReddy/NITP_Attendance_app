import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

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

    const users = await prisma.user.findMany({
      include: {
        team: true,
        manager: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const teams = await prisma.team.findMany({
      include: {
        teamLeader: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ users, teams });
  } catch (error) {
    console.error('Admin Users GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, email, password, role, teamId, managerId } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        teamId: teamId || null,
        managerId: managerId || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE_USER',
        entity: 'User',
        entityId: newUser.id,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Admin Users POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, name, email, password, role, teamId, managerId, deactivate } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (password) updateData.passwordHash = bcrypt.hashSync(password, 10);
    if (role) updateData.role = role;
    
    if (teamId !== undefined) updateData.teamId = teamId || null;
    if (managerId !== undefined) updateData.managerId = managerId || null;

    if (deactivate !== undefined) {
      if (deactivate) {
        if (!existing.passwordHash.startsWith('DEACTIVATED_')) {
          updateData.passwordHash = `DEACTIVATED_${existing.passwordHash}`;
        }
      } else {
        if (existing.passwordHash.startsWith('DEACTIVATED_')) {
          updateData.passwordHash = existing.passwordHash.replace('DEACTIVATED_', '');
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: deactivate ? 'DEACTIVATE_USER' : 'UPDATE_USER',
        entity: 'User',
        entityId: id,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Admin Users PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
