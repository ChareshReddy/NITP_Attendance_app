import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with clean environment...');

  // Clean up existing records
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
  
  await prisma.user.create({
    data: {
      name: 'Rohini HR',
      email: 'rohini.hr@nextitpoint.com',
      passwordHash: hrPasswordHash,
      role: 'HR_ADMIN',
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Rohini HR',
      email: 'rohini@nextitpoint.com',
      passwordHash: hrPasswordHash,
      role: 'HR_ADMIN',
      isActive: true,
    },
  });

  console.log('Database seeded successfully with clean HR Users:');
  console.log(' - Name: Rohini HR');
  console.log(' - Emails: rohini.hr@nextitpoint.com / rohini@nextitpoint.com');
  console.log(' - Role: HR_ADMIN');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
