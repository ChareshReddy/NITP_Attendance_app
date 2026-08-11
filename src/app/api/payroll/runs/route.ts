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
    const userIdParam = searchParams.get('userId');

    let whereClause: any = {};

    if (caller.role === 'EMPLOYEE') {
      whereClause.userId = caller.id;
      // Employees can only see approved or paid payslips
      whereClause.status = { in: ['APPROVED', 'PAID'] };
    } else if (caller.role === 'HR_ADMIN') {
      if (userIdParam && userIdParam !== 'all') {
        whereClause.userId = userIdParam;
      }
    } else {
      // TLs can see team member payroll? Scoped to team or forbidden. Let's make it HR/employee only.
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const runs = await prisma.payrollRun.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { periodStart: 'desc' },
    });

    return NextResponse.json({ runs });
  } catch (error) {
    console.error('Payroll GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const caller = await getAuthUser();
    if (!caller || caller.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { periodStart, periodEnd } = await request.json();

    if (!periodStart || !periodEnd) {
      return NextResponse.json({ error: 'Missing period dates' }, { status: 400 });
    }

    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return NextResponse.json({ error: 'Invalid period dates' }, { status: 400 });
    }

    // Fetch active employees with their salary structures
    const activeUsers = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        salaryStructure: true,
      },
    });

    const generatedRuns = [];
    const skippedUsers = [];

    // Helper: format YYYY-MM-DD
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    for (const employee of activeUsers) {
      if (!employee.salaryStructure) {
        skippedUsers.push({ id: employee.id, name: employee.name, reason: 'No Salary Structure defined' });
        continue;
      }

      // Check if payroll already exists for this period
      const existingRun = await prisma.payrollRun.findFirst({
        where: {
          userId: employee.id,
          periodStart: start,
          periodEnd: end,
        },
      });

      if (existingRun) {
        skippedUsers.push({ id: employee.id, name: employee.name, reason: 'Payroll already exists for this period' });
        continue;
      }

      // Pull attendance records to count LOP (absent or LOP approved leaves)
      const attendance = await prisma.attendance.findMany({
        where: {
          userId: employee.id,
          date: {
            gte: formatDate(start),
            lte: formatDate(end),
          },
        },
      });

      // Count LOP days: status ABSENT, MISSING_PUNCH, or approved leave with loss of pay
      const absentDays = attendance.filter(r => ['ABSENT', 'MISSING_PUNCH'].includes(r.status)).length;
      
      const approvedLOPLeaves = await prisma.leaveRequest.findMany({
        where: {
          userId: employee.id,
          status: 'APPROVED',
          lossOfPay: true,
          startDate: { gte: formatDate(start) },
          endDate: { lte: formatDate(end) },
        },
      });

      let leaveLOPDays = 0;
      approvedLOPLeaves.forEach(req => {
        let current = new Date(req.startDate);
        const reqEnd = new Date(req.endDate);
        while (current <= reqEnd) {
          if (current >= start && current <= end) {
            leaveLOPDays++;
          }
          current.setDate(current.getDate() + 1);
        }
      });

      const totalLOPDays = absentDays + leaveLOPDays;

      // Formulas
      const basic = employee.salaryStructure.basicSalary;
      const hra = employee.salaryStructure.hra;
      const conveyance = employee.salaryStructure.conveyance;
      const special = employee.salaryStructure.specialAllowance;

      const baseSalaryTotal = basic + hra + conveyance + special;
      const lopDeduction = parseFloat(((baseSalaryTotal / 30) * totalLOPDays).toFixed(2));

      // Standard deductions
      const pf = parseFloat((basic * 0.12).toFixed(2)); // 12% basic
      const grossWithoutExtras = basic + hra + conveyance + special;
      const esi = parseFloat((grossWithoutExtras * 0.0075).toFixed(2)); // 0.75% gross
      const pt = 200.00; // Flat 200 Professional Tax
      const tds = parseFloat((grossWithoutExtras * 0.05).toFixed(2)); // 5% TDS simulation

      const totalDeductions = parseFloat((pf + esi + pt + tds + lopDeduction).toFixed(2));
      const netSalary = parseFloat((grossWithoutExtras - totalDeductions).toFixed(2));

      const run = await prisma.payrollRun.create({
        data: {
          userId: employee.id,
          periodStart: start,
          periodEnd: end,
          basicSalary: basic,
          hra,
          conveyance,
          specialAllowance: special,
          pf,
          esi,
          professionalTax: pt,
          tds,
          lopDeduction,
          totalDeductions,
          grossEarnings: grossWithoutExtras,
          netSalary,
          status: 'DRAFT',
        },
      });

      generatedRuns.push(run);
    }

    await prisma.auditLog.create({
      data: {
        userId: caller.id,
        action: 'GENERATE_PAYROLL_RUN',
        entity: 'PayrollRun',
        entityId: periodStart + ' to ' + periodEnd,
      },
    });

    return NextResponse.json({ success: true, generatedRuns, skippedUsers });
  } catch (error) {
    console.error('Payroll generate POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const caller = await getAuthUser();
    if (!caller || caller.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, action, overtime, bonus, incentives, loanDeduction, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing run id' }, { status: 400 });
    }

    const existingRun = await prisma.payrollRun.findUnique({
      where: { id },
    });

    if (!existingRun) {
      return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 });
    }

    if (action === 'update_values') {
      const ot = overtime !== undefined ? parseFloat(overtime) : existingRun.overtime;
      const bo = bonus !== undefined ? parseFloat(bonus) : existingRun.bonus;
      const inc = incentives !== undefined ? parseFloat(incentives) : existingRun.incentives;
      const loan = loanDeduction !== undefined ? parseFloat(loanDeduction) : existingRun.loanDeduction;

      // Recalculate Gross and Net
      const gross = existingRun.basicSalary + existingRun.hra + existingRun.conveyance + existingRun.specialAllowance + ot + bo + inc;
      const totalDeductions = existingRun.pf + existingRun.esi + existingRun.professionalTax + existingRun.tds + existingRun.lopDeduction + loan;
      const net = gross - totalDeductions;

      const updated = await prisma.payrollRun.update({
        where: { id },
        data: {
          overtime: ot,
          bonus: bo,
          incentives: inc,
          loanDeduction: loan,
          grossEarnings: parseFloat(gross.toFixed(2)),
          totalDeductions: parseFloat(totalDeductions.toFixed(2)),
          netSalary: parseFloat(net.toFixed(2)),
        },
      });

      return NextResponse.json({ success: true, run: updated });
    } else if (action === 'status_change') {
      const updated = await prisma.payrollRun.update({
        where: { id },
        data: { status },
      });

      await prisma.auditLog.create({
        data: {
          userId: caller.id,
          action: `PAYROLL_STATUS_${status}`,
          entity: 'PayrollRun',
          entityId: id,
        },
      });

      return NextResponse.json({ success: true, run: updated });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Payroll PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
