import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

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
    { name: 'Casual Leave', daysAllowed: 12 },
    { name: 'Sick Leave', daysAllowed: 12 },
    { name: 'Earned Leave', daysAllowed: 15 },
    { name: 'Compensatory Off', daysAllowed: 5 },
    { name: 'Maternity Leave', daysAllowed: 180 },
    { name: 'Paternity Leave', daysAllowed: 15 },
    { name: 'Loss of Pay', daysAllowed: 365 },
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

  // 8. Seed Real Team Data from Excel exports JSON file
  const realSeedPath = path.join(__dirname, 'real_seed_data.json');
  if (fs.existsSync(realSeedPath)) {
    const rawData = fs.readFileSync(realSeedPath, 'utf8');
    const { users: realUsers, trackSheets: realTrackSheets } = JSON.parse(rawData);

    console.log(`Seeding ${realUsers.length} real team users and ${realTrackSheets.length} track sheet logs...`);

    const teamMap: { [key: string]: string } = {}; // team name to team id map
    const tlMap: { [key: string]: string } = {}; // team name to TL user id map
    const createdUsers: { [email: string]: any } = {};

    for (const u of realUsers) {
      let teamId = teamMap[u.team];
      if (!teamId) {
        const existingTeam = await prisma.team.findFirst({ where: { name: u.team } });
        if (existingTeam) {
          teamId = existingTeam.id;
        } else {
          const newTeam = await prisma.team.create({
            data: { name: u.team }
          });
          teamId = newTeam.id;
        }
        teamMap[u.team] = teamId;
      }

      const createdUser = await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          passwordHash: u.passwordHash,
          role: u.role,
          isActive: true,
          teamId: teamId,
        }
      });
      createdUsers[u.email] = createdUser;

      if (u.role === 'TL') {
        tlMap[u.team] = createdUser.id;
        await prisma.team.update({
          where: { id: teamId },
          data: { teamLeaderId: createdUser.id }
        });
      }

      await prisma.performanceScore.create({
        data: {
          userId: createdUser.id,
          rating: u.role === 'TL' ? 'BLUE' : 'GREEN',
          autoScore: u.role === 'TL' ? 95.0 : 80.0,
          manualOverride: false
        }
      });
    }

    for (const u of realUsers) {
      const createdUser = createdUsers[u.email];
      const teamTLId = tlMap[u.team];
      if (teamTLId && u.role === 'EMPLOYEE') {
        await prisma.user.update({
          where: { id: createdUser.id },
          data: { managerId: teamTLId }
        });
      }
    }

    console.log('Inserting track sheet records in batch...');
    const trackSheetsData = realTrackSheets.map((ts: any) => {
      const matchedUser = createdUsers[ts.email];
      return {
        userId: matchedUser.id,
        date: ts.date,
        project: ts.project,
        taskDescription: ts.taskDescription,
        hours: ts.hours,
        status: ts.status,
        notes: ts.notes
      };
    });

    if (trackSheetsData.length > 0) {
      await prisma.trackSheet.createMany({
        data: trackSheetsData
      });
    }

    console.log(`Successfully seeded ${realUsers.length} users and ${trackSheetsData.length} track sheets!`);

    // 9. Seed structures, payroll, goals, and training for demo users
    console.log('Seeding salary structures...');
    await prisma.salaryStructure.createMany({
      data: [
        {
          userId: employee.id,
          basicSalary: 30000,
          hra: 12000,
          conveyance: 3000,
          specialAllowance: 5000,
          effectiveFrom: new Date('2026-01-01'),
        },
        {
          userId: tl.id,
          basicSalary: 45000,
          hra: 18000,
          conveyance: 4000,
          specialAllowance: 8000,
          effectiveFrom: new Date('2026-01-01'),
        },
      ],
      skipDuplicates: true,
    });

    console.log('Seeding payroll runs...');
    await prisma.payrollRun.create({
      data: {
        userId: employee.id,
        periodStart: new Date('2026-07-01'),
        periodEnd: new Date('2026-07-31'),
        basicSalary: 30000,
        hra: 12000,
        conveyance: 3000,
        specialAllowance: 5000,
        grossEarnings: 50000,
        pf: 3600,
        esi: 375,
        professionalTax: 200,
        tds: 2500,
        lopDeduction: 0,
        totalDeductions: 6675,
        netSalary: 43325,
        status: 'PAID',
      },
    });

    console.log('Seeding performance goals...');
    await prisma.performanceGoal.create({
      data: {
        userId: employee.id,
        managerId: tl.id,
        goalTitle: 'Optimize Attendance App Performance',
        kpi: 'Reduce Next.js bundle size by 20% & response time < 300ms',
        weight: 50,
        target: 'Lighthouse Performance score >= 90',
        achievement: 'Bundle size reduced by 22% using dynamic imports',
        rating: 4.5,
        period: '2026-H1',
        status: 'HR_REVIEWED',
      },
    });

    console.log('Seeding training catalog and attendance...');
    const trainingObj = await prisma.training.create({
      data: {
        trainingName: 'SAP UI5 Developer Bootcamp',
        trainer: 'Santhosh Kumar',
        plannedDate: new Date('2026-08-20'),
        actualDate: new Date('2026-08-22'),
        durationHours: 16,
        department: 'Engineering',
      },
    });

    await prisma.trainingAttendance.create({
      data: {
        trainingId: trainingObj.id,
        userId: employee.id,
        attended: true,
        assessmentScore: 88,
        certified: true,
        feedback: 'Excellent interactive training sessions',
      },
    });
  }

  console.log('Database seeded successfully with clean HR Users, demo accounts, and real team data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
