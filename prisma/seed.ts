import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean up
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.trackSheet.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.report.deleteMany();
  await prisma.team.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.holiday.deleteMany();

  // 1. Seed Leave Types
  const leaveTypes = [
    { name: 'Sick Leave', daysAllowed: 12 },
    { name: 'Casual Leave', daysAllowed: 12 },
    { name: 'Earned Leave', daysAllowed: 15 },
    { name: 'Maternity Leave', daysAllowed: 90 },
    { name: 'Paternity Leave', daysAllowed: 10 },
  ];
  for (const lt of leaveTypes) {
    await prisma.leaveType.create({ data: lt });
  }

  // 2. Seed Holidays
  const holidays = [
    { date: '2026-01-01', name: 'New Year' },
    { date: '2026-01-15', name: 'Uttarayana / Pongal' },
    { date: '2026-01-26', name: 'Republic Day' },
    { date: '2026-05-01', name: 'May Day' },
    { date: '2026-08-15', name: 'Independence Day' },
    { date: '2026-09-14', name: 'Ganesh Chaturthi' },
    { date: '2026-10-02', name: 'Mahatma Gandhi Jayanti' },
    { date: '2026-10-21', name: 'Dussehra' },
    { date: '2026-11-09', name: 'Deepavali' },
    { date: '2026-12-25', name: 'Christmas' },
  ];
  for (const h of holidays) {
    await prisma.holiday.create({ data: h });
  }

  // 3. Create Users
  const hrAdminHash = bcrypt.hashSync('AdminPass123', 10);
  const tlHash = bcrypt.hashSync('TlPass123', 10);
  const empHash = bcrypt.hashSync('EmployeePass123', 10);

  // Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@nextitpoint.com',
      passwordHash: hrAdminHash,
      role: 'HR_ADMIN',
    },
  });

  // Team Leader
  const tl = await prisma.user.create({
    data: {
      name: 'TL User',
      email: 'tl@nextitpoint.com',
      passwordHash: tlHash,
      role: 'TL',
    },
  });

  // Team
  const sapTeam = await prisma.team.create({
    data: {
      name: 'SAP Implementation Team',
      teamLeaderId: tl.id,
    },
  });

  // Update TL with teamId
  await prisma.user.update({
    where: { id: tl.id },
    data: { teamId: sapTeam.id },
  });

  // Employees
  const employee = await prisma.user.create({
    data: {
      name: 'Employee User',
      email: 'employee@nextitpoint.com',
      passwordHash: empHash,
      role: 'EMPLOYEE',
      teamId: sapTeam.id,
      managerId: tl.id,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      name: 'Employee User Two',
      email: 'employee2@nextitpoint.com',
      passwordHash: empHash,
      role: 'EMPLOYEE',
      teamId: sapTeam.id,
      managerId: tl.id,
    },
  });

  // 4. Seed Attendance Records for the last 5 days
  const today = new Date();
  const getPastDateStr = (daysAgo: number) => {
    const d = new Date();
    d.setDate(today.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const users = [employee, employee2, tl];
  for (let i = 1; i <= 5; i++) {
    const dateStr = getPastDateStr(i);
    for (const u of users) {
      // Don't log attendance on weekend
      const checkDate = new Date(dateStr);
      if (checkDate.getDay() === 0 || checkDate.getDay() === 6) continue;

      const isLate = Math.random() > 0.7;
      const checkInHour = isLate ? 10 : 9; // Late threshold is 9:30 AM
      const checkInMin = Math.floor(Math.random() * 30);
      const hourStr = checkInHour < 10 ? `0${checkInHour}` : `${checkInHour}`;
      const minStr = checkInMin < 10 ? `0${checkInMin}` : `${checkInMin}`;
      
      const checkInTime = new Date(`${dateStr}T${hourStr}:${minStr}:00Z`);
      const checkOutTime = new Date(`${dateStr}T18:00:00Z`);

      await prisma.attendance.create({
        data: {
          userId: u.id,
          date: dateStr,
          checkInTime,
          checkOutTime,
          status: isLate ? 'LATE' : 'PRESENT',
          ip: '192.168.1.100',
          tz: 'Asia/Kolkata',
        },
      });
    }
  }

  // 5. Seed Track Sheets for last 5 days
  for (let i = 1; i <= 5; i++) {
    const dateStr = getPastDateStr(i);
    const checkDate = new Date(dateStr);
    if (checkDate.getDay() === 0 || checkDate.getDay() === 6) continue;

    for (const u of [employee, employee2]) {
      await prisma.trackSheet.create({
        data: {
          userId: u.id,
          date: dateStr,
          project: 'SAP Rollout - Client A',
          taskDescription: `Configured inventory valuation rules and verified ledger posting matrices.`,
          hours: 8.0,
          status: i > 2 ? 'APPROVED' : 'PENDING',
          notes: 'Faced minor issues with inventory account definitions, resolved with TL.',
        },
      });
    }
  }

  // 6. Seed Tasks
  await prisma.task.create({
    data: {
      teamId: sapTeam.id,
      assignedById: tl.id,
      assignedToId: employee.id,
      title: 'Review Inventory GL Integration',
      description: 'Check if all inventory transactions map correctly to the General Ledger rules.',
      dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      priority: 'HIGH',
      status: 'TODO',
    },
  });

  await prisma.task.create({
    data: {
      teamId: sapTeam.id,
      assignedById: tl.id,
      assignedToId: employee2.id,
      title: 'Prepare SAP Customizing Document',
      description: 'Document customized transaction codes and configurations done for Asset Management.',
      dueDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
    },
  });

  // 7. Seed Notification
  await prisma.notification.create({
    data: {
      userId: employee.id,
      message: 'New Task Assigned: Review Inventory GL Integration',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
