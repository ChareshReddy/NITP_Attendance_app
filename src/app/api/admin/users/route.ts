import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { encrypt, decrypt } from '@/lib/encryption';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        team: true,
        manager: {
          select: { id: true, name: true },
        },
        employeeProfile: true,
      },
      orderBy: { name: 'asc' },
    });

    const decryptedUsers = users.map((u) => {
      if (u.employeeProfile) {
        return {
          ...u,
          employeeProfile: {
            ...u.employeeProfile,
            accountNumber: decrypt(u.employeeProfile.accountNumber),
            pan: decrypt(u.employeeProfile.pan),
          },
        };
      }
      return u;
    });

    const teams = await prisma.team.findMany({
      include: {
        teamLeader: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ users: decryptedUsers, teams });
  } catch (error) {
    console.error('Admin Users GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'HR_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name, email, password, role, teamId, managerId,
      dateOfBirth, gender, maritalStatus, nationality, personalEmail, mobileNumber,
      emergencyContact, permanentAddress, currentAddress, dateOfJoining, employeeType,
      department, designation, grade, location, businessUnit, hrBusinessPartner,
      employmentStatus, probationPeriod, confirmationDate, workShift, bankName,
      accountNumber, ifsc, pan, uan, professionalEmail, insuranceNumber, pfNumber,
      bankAddress, bankBranch, expectedEndDate, incrementPerks, bloodGroup, profileImage,
      timezone, financialDocuments
    } = body;

    // Validate mandatory fields
    if (!name || !email || !password || !role || !dateOfJoining || !department || !designation) {
      return NextResponse.json({ error: 'Missing required fields (Name, Email, Password, Role, Date of Joining, Department, Designation)' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
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
        employeeProfile: {
          create: {
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            gender: gender || null,
            maritalStatus: maritalStatus || null,
            nationality: nationality || null,
            personalEmail: personalEmail || null,
            mobileNumber: mobileNumber || null,
            emergencyContact: emergencyContact || null,
            permanentAddress: permanentAddress || null,
            currentAddress: currentAddress || null,
            dateOfJoining: new Date(dateOfJoining),
            employeeType: employeeType || 'Full-time',
            department,
            designation,
            grade: grade || null,
            location: location || null,
            businessUnit: businessUnit || null,
            hrBusinessPartner: hrBusinessPartner || null,
            employmentStatus: employmentStatus || 'Active',
            probationPeriod: probationPeriod ? parseInt(probationPeriod) : null,
            confirmationDate: confirmationDate ? new Date(confirmationDate) : null,
            workShift: workShift || null,
            bankName: bankName || null,
            accountNumber: accountNumber ? encrypt(accountNumber) : null,
            ifsc: ifsc || null,
            pan: pan ? encrypt(pan) : null,
            panEncrypted: !!pan,
            uan: uan || null,
            professionalEmail: professionalEmail || null,
            insuranceNumber: insuranceNumber || null,
            pfNumber: pfNumber || null,
            bankAddress: bankAddress || null,
            bankBranch: bankBranch || null,
            expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null,
            incrementPerks: incrementPerks || null,
            bloodGroup: bloodGroup || null,
            profileImage: profileImage || null,
            timezone: timezone || 'Asia/Kolkata',
            financialDocuments: financialDocuments || null,
          }
        }
      },
    });

    // Auto-create initial PerformanceScore for new staff members
    if (newUser.role === 'EMPLOYEE' || newUser.role === 'TL') {
      try {
        await prisma.performanceScore.create({
          data: {
            userId: newUser.id,
            autoScore: 100,
            rating: 'BLUE',
          },
        });
      } catch (scoreErr) {
        console.error('Error auto-creating performance score for new user:', scoreErr);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
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
    const session = await auth();
    if (!session || session.user?.role !== 'HR_ADMIN') {
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
      updateData.isActive = !deactivate;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
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
