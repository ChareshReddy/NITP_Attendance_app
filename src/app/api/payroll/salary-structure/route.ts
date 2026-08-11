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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || caller.id;

    if (caller.role === 'EMPLOYEE' && userId !== caller.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const structure = await prisma.salaryStructure.findUnique({
      where: { userId },
    });

    return NextResponse.json({ structure });
  } catch (error) {
    console.error('SalaryStructure GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const caller = await getAuthUser();
    if (!caller || caller.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, basicSalary, hra, conveyance, specialAllowance, effectiveFrom } = await request.json();

    if (!userId || basicSalary === undefined || hra === undefined || conveyance === undefined || specialAllowance === undefined || !effectiveFrom) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const structure = await prisma.salaryStructure.upsert({
      where: { userId },
      update: {
        basicSalary: parseFloat(basicSalary),
        hra: parseFloat(hra),
        conveyance: parseFloat(conveyance),
        specialAllowance: parseFloat(specialAllowance),
        effectiveFrom: new Date(effectiveFrom),
      },
      create: {
        userId,
        basicSalary: parseFloat(basicSalary),
        hra: parseFloat(hra),
        conveyance: parseFloat(conveyance),
        specialAllowance: parseFloat(specialAllowance),
        effectiveFrom: new Date(effectiveFrom),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: caller.id,
        action: 'UPSERT_SALARY_STRUCTURE',
        entity: 'SalaryStructure',
        entityId: structure.id,
      },
    });

    return NextResponse.json({ success: true, structure });
  } catch (error) {
    console.error('SalaryStructure POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
