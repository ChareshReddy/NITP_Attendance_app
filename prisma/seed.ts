import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with clean environment...');

  // Clean up existing records
  await prisma.leaveRequest.deleteMany();
  await prisma.performanceScore.deleteMany();
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
  const leaveTypesData = [
    { name: 'Sick Leave', daysAllowed: 12 },
    { name: 'Casual Leave', daysAllowed: 12 },
    { name: 'Earned Leave', daysAllowed: 15 },
    { name: 'Maternity Leave', daysAllowed: 90 },
    { name: 'Paternity Leave', daysAllowed: 10 },
  ];
  const leaveTypes: any[] = [];
  for (const lt of leaveTypesData) {
    const created = await prisma.leaveType.create({ data: lt });
    leaveTypes.push(created);
  }

  // 2. Seed Holidays (Official 2026 List)
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

  // 3. Create HR Admin User (Rohini HR / Rohini#123)
  const hrPasswordHash = bcrypt.hashSync('Rohini#123', 10);
  const tlPasswordHash = bcrypt.hashSync('TlPass123', 10);
  const empPasswordHash = bcrypt.hashSync('EmployeePass123', 10);
  
  const hr1 = await prisma.user.create({
    data: {
      name: 'Rohini HR',
      email: 'rohini.hr@nextitpoint.com',
      passwordHash: hrPasswordHash,
      role: 'HR_ADMIN',
      isActive: true,
    },
  });

  const hr2 = await prisma.user.create({
    data: {
      name: 'Rohini HR',
      email: 'rohini@nextitpoint.com',
      passwordHash: hrPasswordHash,
      role: 'HR_ADMIN',
      isActive: true,
    },
  });

  // 4. Create Demo Team Leader
  const tl = await prisma.user.create({
    data: {
      name: 'TL User',
      email: 'tl@nextitpoint.com',
      passwordHash: tlPasswordHash,
      role: 'TL',
      isActive: true,
    },
  });

  // Create Team
  const team = await prisma.team.create({
    data: {
      name: 'Mumbai Development Team',
      teamLeaderId: tl.id,
    },
  });

  // Update TL with teamId
  await prisma.user.update({
    where: { id: tl.id },
    data: { teamId: team.id },
  });

  // 5. Create Demo Employee
  const employee = await prisma.user.create({
    data: {
      name: 'Employee User',
      email: 'employee@nextitpoint.com',
      passwordHash: empPasswordHash,
      role: 'EMPLOYEE',
      isActive: true,
      teamId: team.id,
      managerId: tl.id,
    },
  });

  // 6. Seed one sample LeaveRequest per user
  const casualLeave = leaveTypes.find(lt => lt.name === 'Casual Leave');
  if (casualLeave) {
    await prisma.leaveRequest.create({
      data: {
        userId: employee.id,
        leaveTypeId: casualLeave.id,
        startDate: '2026-08-17',
        endDate: '2026-08-19',
        reason: 'Family function attendance',
        status: 'PENDING',
      },
    });
  }

  // 7. Seed sample PerformanceScore rows
  await prisma.performanceScore.create({
    data: {
      userId: employee.id,
      rating: 'GREEN',
      autoScore: 82.0,
      manualOverride: false,
    },
  });

  await prisma.performanceScore.create({
    data: {
      userId: tl.id,
      rating: 'BLUE',
      autoScore: 95.0,
      manualOverride: false,
    },
  });

  await prisma.performanceScore.create({
    data: {
      userId: hr1.id,
      rating: 'BLUE',
      autoScore: 100.0,
      manualOverride: false,
    },
  });

  console.log('Database seeded successfully with clean HR Users and demo accounts:');
  console.log(' - HR 1: rohini.hr@nextitpoint.com');
  console.log(' - HR 2: rohini@nextitpoint.com');
  console.log(' - TL: tl@nextitpoint.com');
  console.log(' - Employee: employee@nextitpoint.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
