import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    // Strict public DTO mapping that guarantees non-exposure of private HR data
    const toPublicDTO = (user: any) => {
      const profile = user.employeeProfile || {};
      return {
        id: user.id,
        name: user.name,
        email: profile.professionalEmail || user.email,
        designation: profile.designation || 'Team Member',
        department: profile.department || 'General',
        dateOfJoining: profile.dateOfJoining ? profile.dateOfJoining.toISOString().split('T')[0] : null,
        profileImage: profile.profileImage || null,
        location: profile.location || null,
        workLocationStatus: profile.workLocationStatus || null,
      };
    };

    if (ids) {
      const idList = ids.split(',').map((s) => s.trim()).filter(Boolean);
      const users = await prisma.user.findMany({
        where: { id: { in: idList }, isActive: true },
        include: { employeeProfile: true },
      });
      return NextResponse.json({ employees: users.map(toPublicDTO) });
    }

    if (!id) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { employeeProfile: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ employee: toPublicDTO(user) });
  } catch (error) {
    console.error('Error fetching employee public profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
