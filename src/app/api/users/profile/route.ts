import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/encryption';

async function getAuthUser() {
  const session = await auth();
  if (!session?.user) return null;
  return {
    userId: session.user.id,
    role: session.user.role,
    teamId: session.user.teamId,
  };
}

export async function GET(request: Request) {
  try {
    const caller = await getAuthUser();
    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || caller.userId;

    // Enforce scoping
    if (caller.role === 'EMPLOYEE' && userId !== caller.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let profile = await prisma.employeeProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            teamId: true,
            managerId: true,
          },
        },
      },
    });

    if (!profile) {
      profile = await prisma.employeeProfile.create({
        data: {
          userId,
          employmentStatus: 'Active',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
              teamId: true,
              managerId: true,
            },
          },
        },
      });
    }

    // Decrypt sensitive info only for HR_ADMIN or the user themselves
    const canReadSensitive = caller.role === 'HR_ADMIN' || caller.userId === userId;
    
    const responseData = {
      ...profile,
      accountNumber: canReadSensitive ? decrypt(profile.accountNumber) : '*********',
      pan: canReadSensitive ? decrypt(profile.pan) : '*********',
    };

    return NextResponse.json({ profile: responseData });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const caller = await getAuthUser();
    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Enforce scoping
    if (caller.role === 'EMPLOYEE' && userId !== caller.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingProfile = await prisma.employeeProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Determine update payload based on role
    const updateData: any = {};

    if (caller.role === 'HR_ADMIN') {
      // HR_ADMIN can update everything
      if (body.dateOfBirth !== undefined) updateData.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
      if (body.gender !== undefined) updateData.gender = body.gender;
      if (body.maritalStatus !== undefined) updateData.maritalStatus = body.maritalStatus;
      if (body.nationality !== undefined) updateData.nationality = body.nationality;
      if (body.personalEmail !== undefined) updateData.personalEmail = body.personalEmail;
      if (body.mobileNumber !== undefined) updateData.mobileNumber = body.mobileNumber;
      if (body.emergencyContact !== undefined) updateData.emergencyContact = body.emergencyContact;
      if (body.permanentAddress !== undefined) updateData.permanentAddress = body.permanentAddress;
      if (body.currentAddress !== undefined) updateData.currentAddress = body.currentAddress;
      if (body.dateOfJoining !== undefined) updateData.dateOfJoining = body.dateOfJoining ? new Date(body.dateOfJoining) : null;
      if (body.employeeType !== undefined) updateData.employeeType = body.employeeType;
      if (body.department !== undefined) updateData.department = body.department;
      if (body.designation !== undefined) updateData.designation = body.designation;
      if (body.grade !== undefined) updateData.grade = body.grade;
      if (body.location !== undefined) updateData.location = body.location;
      if (body.businessUnit !== undefined) updateData.businessUnit = body.businessUnit;
      if (body.hrBusinessPartner !== undefined) updateData.hrBusinessPartner = body.hrBusinessPartner;
      if (body.employmentStatus !== undefined) updateData.employmentStatus = body.employmentStatus;
      if (body.probationPeriod !== undefined) updateData.probationPeriod = body.probationPeriod ? parseInt(body.probationPeriod) : null;
      if (body.confirmationDate !== undefined) updateData.confirmationDate = body.confirmationDate ? new Date(body.confirmationDate) : null;
      if (body.workShift !== undefined) updateData.workShift = body.workShift;
      if (body.bankName !== undefined) updateData.bankName = body.bankName;
      if (body.ifsc !== undefined) updateData.ifsc = body.ifsc;
      if (body.uan !== undefined) updateData.uan = body.uan;
      if (body.professionalEmail !== undefined) updateData.professionalEmail = body.professionalEmail;
      if (body.insuranceNumber !== undefined) updateData.insuranceNumber = body.insuranceNumber;
      if (body.pfNumber !== undefined) updateData.pfNumber = body.pfNumber;
      if (body.bankAddress !== undefined) updateData.bankAddress = body.bankAddress;
      if (body.bankBranch !== undefined) updateData.bankBranch = body.bankBranch;
      if (body.expectedEndDate !== undefined) updateData.expectedEndDate = body.expectedEndDate ? new Date(body.expectedEndDate) : null;
      if (body.incrementPerks !== undefined) updateData.incrementPerks = body.incrementPerks;
      if (body.bloodGroup !== undefined) updateData.bloodGroup = body.bloodGroup;
      if (body.profileImage !== undefined) updateData.profileImage = body.profileImage;
      if (body.timezone !== undefined) updateData.timezone = body.timezone;
      if (body.financialDocuments !== undefined) updateData.financialDocuments = body.financialDocuments;
      
      // Encrypt bank account and PAN if provided
      if (body.accountNumber !== undefined) {
        updateData.accountNumber = body.accountNumber ? encrypt(body.accountNumber) : null;
      }
      if (body.pan !== undefined) {
        updateData.pan = body.pan ? encrypt(body.pan) : null;
        updateData.panEncrypted = !!body.pan;
      }
    } else {
      // Employees can only update contact & address info, plus custom fields like blood group, profile image, timezone, financial docs
      if (body.personalEmail !== undefined) updateData.personalEmail = body.personalEmail;
      if (body.mobileNumber !== undefined) updateData.mobileNumber = body.mobileNumber;
      if (body.emergencyContact !== undefined) updateData.emergencyContact = body.emergencyContact;
      if (body.permanentAddress !== undefined) updateData.permanentAddress = body.permanentAddress;
      if (body.currentAddress !== undefined) updateData.currentAddress = body.currentAddress;
      if (body.maritalStatus !== undefined) updateData.maritalStatus = body.maritalStatus;
      if (body.bloodGroup !== undefined) updateData.bloodGroup = body.bloodGroup;
      if (body.profileImage !== undefined) updateData.profileImage = body.profileImage;
      if (body.timezone !== undefined) updateData.timezone = body.timezone;
      if (body.financialDocuments !== undefined) updateData.financialDocuments = body.financialDocuments;
    }

    const updatedProfile = await prisma.employeeProfile.update({
      where: { userId },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: caller.userId,
        action: 'UPDATE_EMPLOYEE_PROFILE',
        entity: 'EmployeeProfile',
        entityId: updatedProfile.id,
      },
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
