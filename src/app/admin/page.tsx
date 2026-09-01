'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { 
  Users, 
  Clock, 
  MapPin, 
  Plus, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Trash2, 
  Settings, 
  ShieldAlert, 
  Search,
  UserPlus,
  TrendingUp,
  FileCheck,
  Calendar,
  Bell,
  BookOpen,
  CreditCard,
  Menu,
  X,
  UserMinus,
  CalendarDays
} from 'lucide-react';
import Speedometer from '@/components/Speedometer';
import PerformancePieChart from '@/components/PerformancePieChart';
import { motion, AnimatePresence } from 'framer-motion';

// Framer motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring" as const, 
      stiffness: 260, 
      damping: 25 
    } 
  }
};

// Dynamic import of Recharts to prevent SSR window issues
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string;
  teamId: string | null;
  managerId: string | null;
  isActive: boolean;
  team: {
    id: string;
    name: string;
  } | null;
  manager: {
    id: string;
    name: string;
  } | null;
  employeeProfile?: {
    department: string | null;
    designation: string | null;
    bankName: string | null;
    accountNumber: string | null;
    ifsc: string | null;
    pan: string | null;
  } | null;
  salaryStructure?: {
    basicSalary: number;
    hra: number;
    conveyance: number;
    specialAllowance: number;
    effectiveFrom: string | Date;
  } | null;
}

interface Team {
  id: string;
  name: string;
  teamLeader: {
    id: string;
    name: string;
  } | null;
}

interface TLReport {
  id: string;
  periodStart: string;
  periodEnd: string;
  summary: string;
  status: string;
  createdAt: string;
  team: { name: string };
  submittedBy: { name: string };
}

interface Holiday {
  id: string;
  date: string;
  name: string;
}

interface LeaveType {
  id: string;
  name: string;
  daysAllowed: number;
}

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);

  const formatDateToIndian = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatEmployeeName = (name: string) => {
    if (!name) return '';
    const parts = name.toLowerCase().split(/\s+/).filter(Boolean);
    const capitalized = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1));
    const initials = capitalized.filter(part => part.length === 1);
    const fullWords = capitalized.filter(part => part.length > 1);
    return [...fullWords, ...initials].join(' ');
  };

  const formatToTitleCase = (text: string | null | undefined): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
  };
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'new-employee' | 'reports' | 'policies' | 'audit' | 'performance' | 'leaves' | 'payroll' | 'trainings' | 'resignations'>('analytics');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [kpiStats, setKpiStats] = useState<any>({
    totalEmployees: 0,
    activeEmployees: 0,
    newJoiners: 0,
    onLeaveToday: 0,
    absentToday: 0,
    rollingAttendanceRate: 100,
    checkedInToday: 0,
  });
  const [teams, setTeams] = useState<Team[]>([]);
  const [reports, setReports] = useState<TLReport[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Performance Rating States
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [overrideUserId, setOverrideUserId] = useState('');
  const [overrideRating, setOverrideRating] = useState('GREEN');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideScore, setOverrideScore] = useState('');
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [performanceCounts, setPerformanceCounts] = useState({ RED: 0, YELLOW: 0, GREEN: 0, BLUE: 0 });

  // Leave Request States
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [leaveSubTab, setLeaveSubTab] = useState<'requests' | 'history'>('requests');

  // Resignation Request States
  const [resignationRequests, setResignationRequests] = useState<any[]>([]);
  const [reviewResignationId, setReviewResignationId] = useState<string | null>(null);
  const [resignationNotes, setResignationNotes] = useState('');
  const [submittingResignation, setSubmittingResignation] = useState(false);

  // User Form States
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState('EMPLOYEE');
  const [userTeamId, setUserTeamId] = useState('');
  const [userManagerId, setUserManagerId] = useState('');

  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    teamId: '',
    managerId: '',
    dateOfBirth: '',
    gender: 'Male',
    maritalStatus: 'Single',
    nationality: 'Indian',
    personalEmail: '',
    mobileNumber: '',
    emergencyContact: '',
    permanentAddress: '',
    currentAddress: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    employeeType: 'Full-time',
    department: '',
    designation: '',
    grade: 'A',
    location: 'Offshore',
    businessUnit: '',
    hrBusinessPartner: '',
    employmentStatus: 'Active',
    probationPeriod: '6',
    confirmationDate: '',
    workShift: 'General Shift',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    pan: '',
    uan: '',
    professionalEmail: '',
    insuranceNumber: '',
    pfNumber: '',
    bankAddress: '',
    bankBranch: '',
    expectedEndDate: '',
    incrementPerks: '',
    bloodGroup: 'A+',
    timezone: 'Asia/Kolkata',
  });

  // Payroll States
  const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
  const [payrollPeriodStart, setPayrollPeriodStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [payrollPeriodEnd, setPayrollPeriodEnd] = useState(() => {
    const d = new Date();
    d.setDate(0); // last day of prev month
    return d.toISOString().split('T')[0];
  });
  const [payrollSubTab, setPayrollSubTab] = useState<'runs' | 'structures'>('runs');
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [selectedSalaryUser, setSelectedSalaryUser] = useState<any>(null);
  const [salaryBasic, setSalaryBasic] = useState('30000');
  const [salaryHRA, setSalaryHRA] = useState('12000');
  const [salaryConveyance, setSalaryConveyance] = useState('3000');
  const [salarySpecial, setSalarySpecial] = useState('5000');
  const [salaryEffectiveFrom, setSalaryEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);

  const [isPayrollEditModalOpen, setIsPayrollEditModalOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [runOvertime, setRunOvertime] = useState('0');
  const [runBonus, setRunBonus] = useState('0');
  const [runIncentives, setRunIncentives] = useState('0');
  const [runLoanDeduction, setRunLoanDeduction] = useState('0');

  // Trainings States
  const [trainings, setTrainings] = useState<any[]>([]);
  const [trainingName, setTrainingName] = useState('');
  const [trainingTrainer, setTrainingTrainer] = useState('');
  const [trainingPlannedDate, setTrainingPlannedDate] = useState(new Date().toISOString().split('T')[0]);
  const [trainingHours, setTrainingHours] = useState('8.0');
  const [trainingDept, setTrainingDept] = useState('');
  const [trainingAssignees, setTrainingAssignees] = useState<string[]>([]);

  const [selectedTraining, setSelectedTraining] = useState<any>(null);
  const [selectedAttendee, setSelectedAttendee] = useState<any>(null);
  const [evalAttended, setEvalAttended] = useState(false);
  const [evalCertified, setEvalCertified] = useState(false);
  const [evalScore, setEvalScore] = useState('');
  const [evalFeedback, setEvalFeedback] = useState('');
  const [isTrainingEvalModalOpen, setIsTrainingEvalModalOpen] = useState(false);

  // Team Form States
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLeaderId, setNewTeamLeaderId] = useState('');

  // Export Form States
  const [exportType, setExportType] = useState('attendance');
  const [exportTeam, setExportTeam] = useState('all');
  const [exportUser, setExportUser] = useState('all');
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');

  // Policy Form States
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [leaveName, setLeaveName] = useState('');
  const [leaveDays, setLeaveDays] = useState('12');

  // Status message states
  const [errorMsg, setErrorMsgState] = useState('');
  const [successMsg, setSuccessMsgState] = useState('');
  const [fadeSuccess, setFadeSuccess] = useState(false);
  const [fadeError, setFadeError] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false); // Refactored to avoid generic loading collision
  const [loading, setLoading] = useState(false);

  const successTimeoutRef = React.useRef<any>(null);
  const errorTimeoutRef = React.useRef<any>(null);

  const setSuccessMsg = (msg: string) => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current.fade);
      clearTimeout(successTimeoutRef.current.dismiss);
    }
    setSuccessMsgState(msg);
    setFadeSuccess(false);
    if (msg) {
      const fadeId = setTimeout(() => setFadeSuccess(true), 4000);
      const dismissId = setTimeout(() => {
        setSuccessMsgState('');
        setFadeSuccess(false);
      }, 4500);
      successTimeoutRef.current = { fade: fadeId, dismiss: dismissId };
    }
  };

  const setErrorMsg = (msg: string) => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current.fade);
      clearTimeout(errorTimeoutRef.current.dismiss);
    }
    setErrorMsgState(msg);
    setFadeError(false);
    if (msg) {
      const fadeId = setTimeout(() => setFadeError(true), 4000);
      const dismissId = setTimeout(() => {
        setErrorMsgState('');
        setFadeError(false);
      }, 4500);
      errorTimeoutRef.current = { fade: fadeId, dismiss: dismissId };
    }
  };

  // User search/filter
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    setMounted(true);
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      // 1. Fetch Users & Teams
      const usersRes = await fetch('/api/admin/users');
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData.users || []);
        setTeams(uData.teams || []);
      }

      // 2. Fetch Reports
      const reportsRes = await fetch('/api/reports');
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.reports || []);
      }

      // 2.5. Fetch Analytics KPI Stats
      if (activeTab === 'analytics') {
        const statsRes = await fetch('/api/admin/analytics');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setKpiStats(statsData);
        }
      }

      // 3. Fetch Policies & Logs
      if (activeTab === 'policies' || activeTab === 'analytics' || activeTab === 'audit') {
        const policyRes = await fetch('/api/admin/policy');
        if (policyRes.ok) {
          const policyData = await policyRes.json();
          setHolidays(policyData.holidays || []);
          setLeaveTypes(policyData.leaveTypes || []);
          setAuditLogs(policyData.auditLogs || []);
        }
      }

      // 4. Fetch Performance Scores
      const perfRes = await fetch('/api/admin/performance?recompute=true');
      if (perfRes.ok) {
        const perfData = await perfRes.json();
        setPerformanceData(perfData.performanceData || []);
        
        const counts = { RED: 0, YELLOW: 0, GREEN: 0, BLUE: 0 };
        (perfData.performanceData || []).forEach((p: any) => {
          const rating = p.score?.rating as 'RED' | 'YELLOW' | 'GREEN' | 'BLUE';
          if (rating && counts[rating] !== undefined) {
            counts[rating]++;
          }
        });
        setPerformanceCounts(counts);
      }

      // 5. Fetch Leave Requests
      const leaveRes = await fetch('/api/leave-requests');
      if (leaveRes.ok) {
        const leaveData = await leaveRes.json();
        setLeaveRequests(leaveData.requests || []);
      }

      // 5.5. Fetch Payroll Runs
      if (activeTab === 'payroll' || activeTab === 'analytics') {
        const payrollRes = await fetch('/api/payroll/runs');
        if (payrollRes.ok) {
          const payrollData = await payrollRes.json();
          setPayrollRuns(payrollData.runs || []);
        }
      }

      // 5.6. Fetch Trainings catalog & assignments
      if (activeTab === 'trainings') {
        const trainingRes = await fetch('/api/trainings');
        if (trainingRes.ok) {
          const trainingData = await trainingRes.json();
          setTrainings(trainingData.trainings || []);
        }
      }

      // 5.7. Fetch Resignation Requests
      const resignationsRes = await fetch('/api/resignation');
      if (resignationsRes.ok) {
        const resignationsData = await resignationsRes.json();
        setResignationRequests(resignationsData.requests || []);
      }

      // 6. Fetch HR Self Attendance status
      const attRes = await fetch('/api/attendance');
      if (attRes.ok) {
        const attData = await attRes.json();
        setTodayRecord(attData.todayRecord || null);
      }
    } catch (e) {
      console.error('Error fetching admin data:', e);
    }
  };

  const handleCheckIn = async () => {
    setLoadingAttendance(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_in', tz: userTz }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to check in');
      setSuccessMsg('Checked in successfully!');
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleCheckOut = async () => {
    setLoadingAttendance(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_out', tz: userTz }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to check out');
      setSuccessMsg('Checked out successfully!');
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          password: userPassword,
          role: userRole,
          teamId: userTeamId || null,
          managerId: userManagerId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setSuccessMsg(`Account for ${userName} created successfully!`);
      setUserName('');
      setUserEmail('');
      setUserPassword('');
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating user');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create employee');

      setSuccessMsg(`Employee account for ${employeeForm.name} created successfully! Generated ID: ${data.user.id}`);
      setEmployeeForm({
        name: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
        teamId: '',
        managerId: '',
        dateOfBirth: '',
        gender: 'Male',
        maritalStatus: 'Single',
        nationality: 'Indian',
        personalEmail: '',
        mobileNumber: '',
        emergencyContact: '',
        permanentAddress: '',
        currentAddress: '',
        dateOfJoining: new Date().toISOString().split('T')[0],
        employeeType: 'Full-time',
        department: '',
        designation: '',
        grade: 'A',
        location: 'Offshore',
        businessUnit: '',
        hrBusinessPartner: '',
        employmentStatus: 'Active',
        probationPeriod: '6',
        confirmationDate: '',
        workShift: 'General Shift',
        bankName: '',
        accountNumber: '',
        ifsc: '',
        pan: '',
        uan: '',
        professionalEmail: '',
        insuranceNumber: '',
        pfNumber: '',
        bankAddress: '',
        bankBranch: '',
        expectedEndDate: '',
        incrementPerks: '',
        bloodGroup: 'A+',
        timezone: 'Asia/Kolkata',
      });
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating employee');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/payroll/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodStart: payrollPeriodStart, periodEnd: payrollPeriodEnd }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate payroll runs');

      let msg = `Generated ${data.generatedRuns?.length || 0} payroll runs.`;
      if (data.skippedUsers?.length > 0) {
        msg += ` Skipped ${data.skippedUsers.length} users (e.g. ${data.skippedUsers.map((u: any) => u.name).join(', ')}).`;
      }
      setSuccessMsg(msg);
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error generating payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSalaryStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSalaryUser) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/payroll/salary-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedSalaryUser.id,
          basicSalary: parseFloat(salaryBasic),
          hra: parseFloat(salaryHRA),
          conveyance: parseFloat(salaryConveyance),
          specialAllowance: parseFloat(salarySpecial),
          effectiveFrom: salaryEffectiveFrom,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update salary structure');

      setSuccessMsg(`Salary structure for ${selectedSalaryUser.name} updated successfully!`);
      setIsSalaryModalOpen(false);
      setSelectedSalaryUser(null);
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating salary structure');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayrollValues = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRun) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/payroll/runs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRun.id,
          action: 'update_values',
          overtime: parseFloat(runOvertime),
          bonus: parseFloat(runBonus),
          incentives: parseFloat(runIncentives),
          loanDeduction: parseFloat(runLoanDeduction),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update payroll values');

      setSuccessMsg(`Payroll values updated for employee!`);
      setIsPayrollEditModalOpen(false);
      setSelectedRun(null);
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating payroll');
    } finally {
      setLoading(false);
    }
  };

  const handlePayrollStatusChange = async (id: string, newStatus: 'APPROVED' | 'PAID') => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/payroll/runs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action: 'status_change',
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update payroll status');

      setSuccessMsg(`Payroll run status updated to ${newStatus}!`);
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating status');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingName,
          trainer: trainingTrainer,
          plannedDate: trainingPlannedDate,
          durationHours: parseFloat(trainingHours),
          department: trainingDept,
          userIds: trainingAssignees,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create training');

      setSuccessMsg(`Training course "${trainingName}" created & employees assigned successfully!`);
      setTrainingName('');
      setTrainingTrainer('');
      setTrainingHours('8.0');
      setTrainingDept('');
      setTrainingAssignees([]);
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating training');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordTrainingEval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTraining || !selectedAttendee) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/trainings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_attendance',
          trainingId: selectedTraining.id,
          userId: selectedAttendee.id,
          attended: evalAttended,
          certified: evalCertified,
          assessmentScore: evalScore !== '' ? parseFloat(evalScore) : null,
          feedback: evalFeedback,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit training evaluation');

      setSuccessMsg(`Training evaluation recorded for ${selectedAttendee.name}!`);
      setIsTrainingEvalModalOpen(false);
      setSelectedTraining(null);
      setSelectedAttendee(null);
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording evaluation');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName, teamLeaderId: newTeamLeaderId || null }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create team');

      setSuccessMsg(`Team "${newTeamName}" created successfully!`);
      setNewTeamName('');
      setNewTeamLeaderId('');
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating team');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserActivation = async (id: string, currentlyDeactivated: boolean) => {
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          deactivate: !currentlyDeactivated,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed');

      setSuccessMsg(`User account status updated.`);
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error modifying status');
    }
  };

  const handleReviewReport = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to review report');

      setSuccessMsg(`Team Leader status report has been ${status.toLowerCase()}!`);
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error reviewing report');
    }
  };

  const handleOpenOverrideModal = (userId: string, scoreRecord: any) => {
    setOverrideUserId(userId);
    setOverrideRating(scoreRecord.rating || 'GREEN');
    setOverrideReason(scoreRecord.overrideReason || '');
    setOverrideScore(scoreRecord.overrideScore !== null && scoreRecord.overrideScore !== undefined ? String(scoreRecord.overrideScore) : '');
    setIsOverrideModalOpen(true);
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      setErrorMsg('Override reason is required.');
      return;
    }

    try {
      const res = await fetch('/api/admin/performance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: overrideUserId,
          rating: overrideRating,
          reason: overrideReason,
          overrideScore: overrideScore.trim() !== '' ? parseFloat(overrideScore) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply override');

      setSuccessMsg('Performance rating override saved successfully.');
      setIsOverrideModalOpen(false);
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    }
  };

  const handleClearOverride = async (userId: string) => {
    if (!confirm('Are you sure you want to clear this manual override and restore automatic scoring?')) return;
    try {
      const res = await fetch('/api/admin/performance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          clearOverride: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to clear override');

      setSuccessMsg('Manual override cleared and score recalculated.');
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error clearing override');
    }
  };

  const handleReviewLeaveRequest = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/leave-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to review leave request');

      setSuccessMsg(`Leave request has been ${status.toLowerCase()} successfully.`);
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error reviewing leave request');
    }
  };

  const handleOpenRejectModal = (id: string) => {
    setRejectRequestId(id);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectRequestId) return;

    try {
      const res = await fetch('/api/leave-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rejectRequestId,
          status: 'REJECTED',
          rejectionReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject leave request');

      setSuccessMsg('Leave request has been rejected successfully.');
      setIsRejectModalOpen(false);
      setRejectRequestId(null);
      setRejectionReason('');
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error rejecting leave request');
    }
  };
  const handleReviewResignation = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setSubmittingResignation(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/resignation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          hrNotes: resignationNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update resignation request');
      setSuccessMsg(`Resignation request has been ${status.toLowerCase()} successfully!`);
      setReviewResignationId(null);
      setResignationNotes('');
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating resignation request');
    } finally {
      setSubmittingResignation(false);
    }
  };

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'holiday',
          name: holidayName,
          date: holidayDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create holiday');

      setSuccessMsg('Holiday configured successfully!');
      setHolidayName('');
      setHolidayDate('');
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm('Are you sure you want to remove this holiday?')) return;
    try {
      const res = await fetch(`/api/admin/policy?id=${id}&type=holiday`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg('Holiday deleted.');
        fetchAdminData();
      }
    } catch (err) {
      console.error('Error deleting holiday:', err);
    }
  };

  const handleCreateLeaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'leave_type',
          name: leaveName,
          daysAllowed: leaveDays,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create leave policy');

      setSuccessMsg('Leave policy added successfully!');
      setLeaveName('');
      setLeaveDays('12');
      fetchAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    }
  };

  const handleDeleteLeaveType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this leave policy?')) return;
    try {
      const res = await fetch(`/api/admin/policy?id=${id}&type=leave_type`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg('Leave policy removed.');
        fetchAdminData();
      }
    } catch (err) {
      console.error('Error deleting leave policy:', err);
    }
  };

  const handleExportExcel = () => {
    // Builds queries and triggers direct browser download stream
    let url = `/api/admin/export?type=${exportType}`;
    if (exportTeam !== 'all') url += `&teamId=${exportTeam}`;
    if (exportUser !== 'all') url += `&userId=${exportUser}`;
    if (exportStart && exportEnd) url += `&startDate=${exportStart}&endDate=${exportEnd}`;

    // Standard redirect to download file
    window.location.href = url;
  };

  // Mock analytics data for visual charts
  const analyticsData = [
    { name: 'Monday', Present: 42, Late: 5, Absent: 3 },
    { name: 'Tuesday', Present: 44, Late: 4, Absent: 2 },
    { name: 'Wednesday', Present: 45, Late: 3, Absent: 2 },
    { name: 'Thursday', Present: 41, Late: 7, Absent: 2 },
    { name: 'Friday', Present: 43, Late: 5, Absent: 2 },
  ];

  const pieData = [
    { name: 'Completed Tasks', value: 24, color: '#10B981' },
    { name: 'In Progress', value: 12, color: '#3B82F6' },
    { name: 'Not Started', value: 8, color: '#EF4444' },
  ];

  const pendingReportsCount = reports.filter(r => r.status === 'PENDING').length;

  const filteredUsers = users.filter(user => {
    return user.name.toLowerCase().includes(userSearch.toLowerCase()) || 
           user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
           user.role.toLowerCase().includes(userSearch.toLowerCase());
  });

  const adminNavItems: {
    id: 'analytics' | 'users' | 'new-employee' | 'reports' | 'policies' | 'audit' | 'performance' | 'leaves' | 'payroll' | 'trainings' | 'resignations';
    label: string;
    icon: any;
  }[] = [
    { id: 'analytics', label: 'Analytics & Export', icon: TrendingUp },
    { id: 'users', label: 'Account Management', icon: Users },
    { id: 'new-employee', label: 'Create Employee', icon: UserPlus },
    { id: 'performance', label: 'Performance Ratings', icon: FileCheck },
    { id: 'leaves', label: 'Leave Requests', icon: Calendar },
    { id: 'resignations', label: 'Resignations', icon: UserMinus },
    { id: 'payroll', label: 'Run Payroll', icon: CreditCard },
    { id: 'trainings', label: 'Training Center', icon: BookOpen },
    { id: 'reports', label: 'Review TL Reports', icon: FileText },
    { id: 'policies', label: 'Policies & Holidays', icon: Settings },
    { id: 'audit', label: 'System Audit Log', icon: ShieldAlert },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Header />

      {/* Mobile Nav Toggle Bar */}
      <div className="md:hidden bg-white/60 backdrop-blur-md border-b border-gray-200/50 px-4 py-3.5 flex items-center justify-between sticky top-[73px] z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-50 text-brand-navy border border-gray-200"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xs font-extrabold text-brand-navy tracking-wider">
            {adminNavItems.find(item => item.id === activeTab)?.label}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1">
        {/* Persistent Left Sidebar - Desktop */}
        <aside className="hidden md:flex w-20 hover:w-60 bg-white flex-col shrink-0 sticky top-[73px] h-[calc(100vh-73px)] z-20 py-6 overflow-y-auto transition-all duration-300 ease-in-out group shadow-sm border-r border-gray-200">
          <nav className="flex-1 space-y-1 px-2 relative">
            {adminNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  aria-label={item.label}
                  className={`w-full text-left py-3 px-4 flex items-center relative transition-all cursor-pointer rounded-xl ${
                    isActive 
                      ? 'text-brand-navy font-bold' 
                      : 'text-slate-600 hover:text-brand-navy hover:bg-slate-50'
                  }`}
                >
                  {/* Animated sliding highlight background pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPillAdmin"
                      className="absolute inset-0 bg-slate-100 border-l-4 border-brand-navy rounded-xl -z-10"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}
                  
                  <item.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-brand-navy' : 'text-slate-400 group-hover:text-brand-navy'}`} />
                  <span className="text-xs font-semibold tracking-wide ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Slide-over Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            
            <aside className="relative flex w-full max-w-xs flex-col bg-white border-r border-gray-200 py-4 shadow-xl h-full animate-in slide-in-from-left duration-200 text-brand-navy">
              <div className="flex items-center justify-between px-4 pb-4 border-b border-slate-100 mb-4">
                <span className="text-sm font-extrabold text-brand-navy font-heading">Admin Panel</span>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <nav className="flex-1 overflow-y-auto space-y-1">
                {adminNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileSidebarOpen(false);
                    }}
                    title={item.label}
                    aria-label={item.label}
                    className={`w-full text-left py-3 px-4 flex items-center gap-3 transition-all cursor-pointer ${
                      activeTab === item.id 
                        ? 'bg-slate-100 border-l-4 border-brand-navy text-brand-navy font-extrabold' 
                        : 'border-l-4 border-transparent text-slate-600 hover:bg-slate-50 hover:text-brand-navy font-semibold'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? 'text-brand-navy' : 'text-slate-400'}`} />
                    <span className="text-xs tracking-wide">{item.label}</span>
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        )}

        <main className="flex-1 p-4 md:pt-4 md:px-8 md:pb-12 w-full max-w-7xl mx-auto">
        
        {/* Status Alerts */}
        {errorMsg && (
          <div className={`mb-6 rounded-lg bg-red-50 p-4 text-sm text-brand-red flex items-start justify-between gap-2.5 border border-red-100 transition-all duration-500 ease-in-out ${fadeError ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button 
              onClick={() => setErrorMsg('')} 
              className="text-brand-red hover:text-red-800 font-extrabold text-base ml-2 outline-none cursor-pointer leading-none"
              aria-label="Dismiss error alert"
            >
              &times;
            </button>
          </div>
        )}
        {successMsg && (
          <div className={`mb-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 flex items-start justify-between gap-2.5 border border-emerald-100 transition-all duration-500 ease-in-out ${fadeSuccess ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button 
              onClick={() => setSuccessMsg('')} 
              className="text-emerald-800 hover:text-emerald-950 font-extrabold text-base ml-2 outline-none cursor-pointer leading-none"
              aria-label="Dismiss success alert"
            >
              &times;
            </button>
          </div>
        )}

        {/* Dashboard Title & Quick KPIs */}
        {activeTab === 'analytics' && (
          <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-gray-100 pb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-brand-navy font-heading">HR & Admin Command Center</h1>
              <p className="text-sm text-gray-500 mt-1">Configure company policy, verify check-ins, approve reports, and audit system actions.</p>
            </div>

            {/* Quick Check-in/out widget for HR */}
            <div className="flex items-center gap-4 premium-card p-4 shadow-sm self-start lg:self-center min-w-[280px] border border-gray-200/50">
              <div className="bg-blue-50 p-2.5 rounded-xl text-brand-navy shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-gray-400 block">Daily Work Shift</span>
                <span className="text-xs font-bold text-brand-navy block mt-0.5">
                  {todayRecord && todayRecord.checkInTime ? (
                    <>
                      In: <span className="font-semibold text-brand-cta">{new Date(todayRecord.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      {todayRecord.checkOutTime ? (
                        <>
                          {" "}• Out: <span className="font-semibold text-brand-red">{new Date(todayRecord.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </>
                      ) : ''}
                    </>
                  ) : (
                    'Not Checked In'
                  )}
                </span>
              </div>
              <div className="shrink-0 flex gap-2">
                <button
                  onClick={handleCheckIn}
                  disabled={loadingAttendance || !!(todayRecord && todayRecord.checkInTime)}
                  className={`font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all ${
                    (!todayRecord?.checkInTime && !loadingAttendance)
                      ? 'bg-brand-cta hover:bg-blue-700 text-white cursor-pointer shadow-sm btn-premium'
                      : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loadingAttendance && !todayRecord?.checkInTime ? '...' : 'Check In'}
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={loadingAttendance || !todayRecord?.checkInTime || !!todayRecord?.checkOutTime}
                  className={`font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all ${
                    (todayRecord?.checkInTime && !todayRecord?.checkOutTime && !loadingAttendance)
                      ? 'bg-brand-red hover:bg-red-700 text-white cursor-pointer shadow-sm btn-premium'
                      : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loadingAttendance && todayRecord?.checkInTime && !todayRecord?.checkOutTime ? '...' : 'Check Out'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HR KPI Cards - Only visible on Analytics (home) tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Active Staff */}
              <div className="premium-card p-4 text-center flex flex-col justify-center min-h-[90px] shadow-xs hover:shadow-md transition-all">
                <span className="block text-3xl font-extrabold text-brand-navy font-heading">
                  {kpiStats.activeEmployees || users.filter(u => u.isActive && (u.role === 'EMPLOYEE' || u.role === 'TL')).length}
                </span>
                <span className="text-[10px] font-bold text-gray-400 mt-1 block tracking-wider">Active Staff</span>
              </div>

              {/* New Joiners */}
              <div className="premium-card p-4 text-center flex flex-col justify-center min-h-[90px] shadow-xs hover:shadow-md transition-all">
                <span className="block text-3xl font-extrabold text-blue-600 font-heading">
                  {kpiStats.newJoiners ?? 0}
                </span>
                <span className="text-[10px] font-bold text-gray-400 mt-1 block tracking-wider">New Joiners (Month)</span>
              </div>

              {/* Avg Attendance */}
              <div className="premium-card p-4 text-center flex flex-col justify-center min-h-[90px] shadow-xs hover:shadow-md transition-all">
                <span className="block text-3xl font-extrabold text-emerald-600 font-heading">
                  {kpiStats.rollingAttendanceRate !== undefined ? `${kpiStats.rollingAttendanceRate.toFixed(1)}%` : '100.0%'}
                </span>
                <span className="text-[10px] font-bold text-gray-400 mt-1 block tracking-wider">Avg Attendance</span>
              </div>

              {/* Present Today */}
              <div className="premium-card p-4 text-center flex flex-col justify-center min-h-[90px] shadow-xs hover:shadow-md transition-all">
                <span className="block text-3xl font-extrabold text-brand-cta font-heading">
                  {kpiStats.checkedInToday ?? 0}
                </span>
                <span className="text-[10px] font-bold text-gray-400 mt-1 block tracking-wider">Present Today</span>
              </div>

              {/* Absent Today */}
              <div className="premium-card p-4 text-center flex flex-col justify-center min-h-[90px] shadow-xs hover:shadow-md transition-all">
                <span className="block text-3xl font-extrabold text-brand-red font-heading">
                  {kpiStats.absentToday ?? 0}
                </span>
                <span className="text-[10px] font-bold text-gray-400 mt-1 block tracking-wider">Absent Today</span>
              </div>

              {/* On Leave Today */}
              <div className="premium-card p-4 text-center flex flex-col justify-center min-h-[90px] shadow-xs hover:shadow-md transition-all">
                <span className="block text-3xl font-extrabold text-purple-600 font-heading">
                  {kpiStats.onLeaveToday ?? 0}
                </span>
                <span className="text-[10px] font-bold text-gray-400 mt-1 block tracking-wider">On Leave (Today)</span>
              </div>

              {/* Pending TL Reports */}
              <button
                onClick={() => setActiveTab('reports')}
                className="premium-card p-4 text-center flex flex-col justify-center items-center min-h-[90px] shadow-xs hover:shadow-md transition-all cursor-pointer group w-full"
              >
                <span className="block text-3xl font-extrabold text-brand-navy font-heading group-hover:text-brand-cta transition-colors">
                  {reports.filter(r => r.status === 'PENDING').length}
                </span>
                <span className="text-[10px] font-bold text-gray-400 mt-1 block tracking-wider group-hover:text-brand-navy transition-colors">Pending TL Reports</span>
              </button>

              {/* Pending Leaves */}
              <button
                onClick={() => setActiveTab('leaves')}
                className="premium-card p-4 text-center flex flex-col justify-center items-center min-h-[90px] shadow-xs hover:shadow-md transition-all cursor-pointer group w-full"
              >
                <span className="block text-3xl font-extrabold text-purple-700 font-heading group-hover:text-brand-cta transition-colors">
                  {leaveRequests.filter(r => r.status === 'PENDING').length}
                </span>
                <span className="text-[10px] font-bold text-gray-400 mt-1 block tracking-wider group-hover:text-brand-navy transition-colors">Pending Leaves</span>
              </button>

              {/* Payroll Status */}
              <button
                onClick={() => setActiveTab('payroll')}
                className="premium-card p-4 text-center flex flex-col justify-center items-center min-h-[90px] shadow-xs hover:shadow-md transition-all cursor-pointer group w-full"
              >
                {payrollRuns.some(r => r.status === 'DRAFT') ? (
                  <>
                    <span className="block text-xl font-extrabold text-amber-600 font-heading group-hover:text-brand-cta transition-colors">
                      Draft Active
                    </span>
                    <span className="text-[8px] text-gray-400 block font-semibold mt-0.5">Needs calculation</span>
                  </>
                ) : payrollRuns.some(r => r.status === 'APPROVED') ? (
                  <>
                    <span className="block text-xl font-extrabold text-blue-600 font-heading group-hover:text-brand-cta transition-colors">
                      Pending Payout
                    </span>
                    <span className="text-[8px] text-gray-400 block font-semibold mt-0.5">Approved runs</span>
                  </>
                ) : (
                  <>
                    <span className="block text-xl font-extrabold text-emerald-600 font-heading group-hover:text-brand-cta transition-colors">
                      All Paid
                    </span>
                    <span className="text-[8px] text-gray-400 block font-semibold mt-0.5">Up to date</span>
                  </>
                )}
                <span className="text-[10px] font-bold text-gray-400 mt-1 block tracking-wider group-hover:text-brand-navy transition-colors">Payroll Status</span>
              </button>

              {/* Performance Overview */}
              <div className="premium-card p-4 flex flex-col justify-center min-h-[90px] shadow-xs hover:shadow-md transition-all">
                <span className="text-[10px] font-bold text-gray-400 block mb-2 text-center tracking-wider uppercase">Performance Overview</span>
                <PerformancePieChart
                  counts={performanceCounts}
                  size={54}
                  showLegend={true}
                  showDetails={false}
                />
              </div>
            </div>
            
            {/* Visual Charts */}
            {mounted && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Attendance Trends */}
                <div className="premium-card p-6 lg:col-span-2">
                  <h2 className="text-base font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-brand-cta" />
                    Attendance Trends (Weekly Overview)
                  </h2>
                  
                  <div className="h-[250px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData}>
                        <defs>
                          <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0D1B6E" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#0D1B6E" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="Present" stroke="#0D1B6E" fillOpacity={1} fill="url(#colorPresent)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Task Accomplishment */}
                <div className="premium-card p-6 lg:col-span-1">
                  <h2 className="text-base font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-brand-cta" />
                    Deliverables Completion Rate
                  </h2>
                  
                  <div className="h-[180px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend */}
                  <div className="space-y-1 mt-4">
                    {pieData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs font-semibold text-gray-500">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          {d.name}
                        </span>
                        <span className="text-brand-navy">{d.value} Tasks</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Excel Export Module */}
            <div className="premium-card p-6">
              <h2 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-brand-cta" />
                Data Export & Excel Stream Center
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">Export Data Type</label>
                  <select
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                  >
                    <option value="attendance">Shift Attendance Logs</option>
                    <option value="tracksheet">Work Track Sheets</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">Filter Team</label>
                  <select
                    value={exportTeam}
                    onChange={(e) => setExportTeam(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                  >
                    <option value="all">All Teams</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">Filter Employee</label>
                  <select
                    value={exportUser}
                    onChange={(e) => setExportUser(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                  >
                    <option value="all">All Employees</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">Start Date</label>
                  <input
                    type="date"
                    value={exportStart}
                    onChange={(e) => setExportStart(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">End Date</label>
                  <input
                    type="date"
                    value={exportEnd}
                    onChange={(e) => setExportEnd(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleExportExcel}
                  className="bg-brand-cta text-white font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 cursor-pointer btn-premium shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Stream to Excel Spreadsheet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: User Account Administration */}
        {activeTab === 'users' && (
          <div className="premium-card p-0 overflow-hidden space-y-0">
            {/* Header Title strip with Navy Blue background */}
            <div className="bg-brand-navy px-5 py-3 text-white">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-heading flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-white" />
                User Account Administration
              </h3>
              <p className="text-[10px] text-white/80 mt-0.5">
                Manage, edit, activate, and deactivate employee accounts across the system.
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left side actions column */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* Create Account Form */}
              <div className="premium-card p-6">
              <h2 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-cta" />
                Provision New Account
              </h2>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="John Doe"
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="john@nextitpoint.com"
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">System Role</label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="TL">Team Leader</option>
                      <option value="HR_ADMIN">HR / Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Assign Team</label>
                    <select
                      value={userTeamId}
                      onChange={(e) => setUserTeamId(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    >
                      <option value="">No Team Assigned</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">Report Manager (TL)</label>
                  <select
                    value={userManagerId}
                    onChange={(e) => setUserManagerId(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                  >
                    <option value="">No Manager</option>
                    {users.filter(u => u.role === 'TL').map(tl => (
                      <option key={tl.id} value={tl.id}>{tl.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-sm cursor-pointer btn-premium text-center disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </form>
            </div>

              {/* Create Team Form */}
              <div className="premium-card p-6">
                <h2 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-brand-red" />
                  Create New Team
                </h2>

                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Team Name</label>
                    <input
                      type="text"
                      required
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="e.g. Sales Team"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Assign Team Leader (Optional)</label>
                    <select
                      value={newTeamLeaderId}
                      onChange={(e) => setNewTeamLeaderId(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    >
                      <option value="">No Team Leader</option>
                      {users.filter(u => u.role === 'TL').map(tl => (
                        <option key={tl.id} value={tl.id}>{tl.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-sm cursor-pointer btn-premium text-center disabled:opacity-50"
                  >
                    {loading ? 'Creating Team...' : 'Create Team'}
                  </button>
                </form>
              </div>

            </div>

            {/* Accounts Directory */}
            <div className="premium-card p-6 lg:col-span-2 lg:h-[768px] flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 shrink-0">
                <h2 className="text-lg font-bold text-brand-navy font-heading">User Directory</h2>
                
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search accounts..."
                    className="block w-full rounded-xl border border-gray-200/80 py-1.5 pl-9 pr-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar-container pr-1">
                <table className="min-w-full text-left text-xs relative border-collapse">
                  <thead className="sticky top-0 bg-slate-100/70 backdrop-blur-xs text-slate-700 font-bold z-10">
                    <tr className="border-b border-gray-200/50 text-gray-500 font-bold tracking-wider">
                      <th className="py-3 px-2 bg-transparent">Name</th>
                      <th className="py-3 px-2 bg-transparent">Role</th>
                      <th className="py-3 px-2 bg-transparent">Team</th>
                      <th className="py-3 px-2 bg-transparent">Reporting Manager</th>
                      <th className="py-3 px-2 text-center bg-transparent">Status</th>
                      <th className="py-3 px-2 text-center bg-transparent">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((u) => {
                      const isDeactivated = !u.isActive;
                      return (
                        <tr key={u.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-2">
                            <div className="font-bold text-brand-navy">{u.name}</div>
                            <div className="text-[10px] text-gray-400">{u.email}</div>
                          </td>
                          <td className="py-3 px-2 font-medium text-brand-navy">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">
                              {formatToTitleCase(u.role)}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-gray-500 font-medium">{u.team ? u.team.name : 'Unassigned'}</td>
                          <td className="py-3 px-2 text-gray-500 font-medium">{u.manager ? u.manager.name : 'None'}</td>
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isDeactivated ? 'bg-red-100 text-brand-red' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isDeactivated ? 'Deactivated' : 'Active'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={() => handleToggleUserActivation(u.id, isDeactivated)}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                isDeactivated 
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                  : 'bg-red-100 text-brand-red hover:bg-red-200'
                              }`}
                            >
                              {isDeactivated ? 'Reactivate' : 'Deactivate'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB: Create Employee */}
        {activeTab === 'new-employee' && (
          <div className="premium-card p-0 overflow-hidden space-y-0">
            {/* Header Title strip with Navy Blue background */}
            <div className="bg-brand-navy px-5 py-3 text-white">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-heading flex items-center gap-2">
                <UserPlus className="w-4.5 h-4.5 text-white" />
                Onboard & Create New Employee
              </h3>
              <p className="text-[10px] text-white/80 mt-0.5">
                Provide employee details to generate their system account and profile record.
              </p>
            </div>

            <div className="p-6">
              <form onSubmit={handleCreateEmployee} className="space-y-6">
              {/* Section 1: Account Details */}
              <div className="bg-slate-50 border border-gray-200 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold tracking-wider text-brand-cta">1. Account Credentials & Hierarchy</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={employeeForm.name}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Rahul Kumar"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Official Email Address *</label>
                    <input
                      type="email"
                      required
                      value={employeeForm.email}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="rahul@nextitpoint.com"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      value={employeeForm.password}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">System Role *</label>
                    <select
                      value={employeeForm.role}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, role: e.target.value }))}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="TL">Team Leader</option>
                      <option value="HR_ADMIN">HR / Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Assign Team</label>
                    <select
                      value={employeeForm.teamId}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, teamId: e.target.value }))}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    >
                      <option value="">No Team Assigned</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Report Manager (TL)</label>
                    <select
                      value={employeeForm.managerId}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, managerId: e.target.value }))}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    >
                      <option value="">No Manager</option>
                      {users.filter(u => u.role === 'TL').map(tl => (
                        <option key={tl.id} value={tl.id}>{tl.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Employment Profile */}
              <div className="bg-slate-50 border border-gray-200 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold tracking-wider text-emerald-600">2. Employment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Date of Joining *</label>
                    <input
                      type="date"
                      required
                      value={employeeForm.dateOfJoining}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, dateOfJoining: e.target.value }))}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Employee Type</label>
                    <select
                      value={employeeForm.employeeType}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, employeeType: e.target.value }))}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Department *</label>
                    <input
                      type="text"
                      required
                      value={employeeForm.department}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="e.g. Engineering"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Designation *</label>
                    <input
                      type="text"
                      required
                      value={employeeForm.designation}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, designation: e.target.value }))}
                      placeholder="e.g. Senior Developer"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Grade</label>
                    <input
                      type="text"
                      value={employeeForm.grade}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, grade: e.target.value }))}
                      placeholder="e.g. M3"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Work Location</label>
                    <input
                      type="text"
                      value={employeeForm.location}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g. Offshore / Bangalore"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Business Unit</label>
                    <input
                      type="text"
                      value={employeeForm.businessUnit}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, businessUnit: e.target.value }))}
                      placeholder="e.g. Digital Delivery"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">HR Business Partner</label>
                    <input
                      type="text"
                      value={employeeForm.hrBusinessPartner}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, hrBusinessPartner: e.target.value }))}
                      placeholder="HR Specialist"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Work Shift</label>
                    <input
                      type="text"
                      value={employeeForm.workShift}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, workShift: e.target.value }))}
                      placeholder="e.g. General Shift (9:00 - 18:00)"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Probation Period (Months)</label>
                    <input
                      type="number"
                      value={employeeForm.probationPeriod}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, probationPeriod: e.target.value }))}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Confirmation Date</label>
                    <input
                      type="date"
                      value={employeeForm.confirmationDate}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, confirmationDate: e.target.value }))}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Employment Status</label>
                    <select
                      value={employeeForm.employmentStatus}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, employmentStatus: e.target.value }))}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Deactivated">Deactivated</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Section 3: Personal & Contact */}
              <div className="bg-slate-50 border border-gray-200 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold tracking-wider text-amber-600">3. Personal & Contact Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={employeeForm.dateOfBirth}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Gender</label>
                    <select
                      value={employeeForm.gender}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, gender: e.target.value }))}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Marital Status</label>
                    <select
                      value={employeeForm.maritalStatus}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, maritalStatus: e.target.value }))}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Nationality</label>
                    <input
                      type="text"
                      value={employeeForm.nationality}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, nationality: e.target.value }))}
                      placeholder="e.g. Indian"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Personal Email</label>
                    <input
                      type="email"
                      value={employeeForm.personalEmail}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, personalEmail: e.target.value }))}
                      placeholder="personal@email.com"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Professional Email</label>
                    <input
                      type="email"
                      value={employeeForm.professionalEmail}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, professionalEmail: e.target.value }))}
                      placeholder="professional@nextitpoint.com"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Mobile Number</label>
                    <input
                      type="text"
                      value={employeeForm.mobileNumber}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, mobileNumber: e.target.value }))}
                      placeholder="+91 XXXXX XXXXX"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Emergency Contact Info</label>
                    <input
                      type="text"
                      value={employeeForm.emergencyContact}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                      placeholder="Name - Relationship - Phone"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Current Address</label>
                    <textarea
                      value={employeeForm.currentAddress}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, currentAddress: e.target.value }))}
                      placeholder="Current residence address..."
                      rows={2}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Permanent Address</label>
                    <textarea
                      value={employeeForm.permanentAddress}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, permanentAddress: e.target.value }))}
                      placeholder="Permanent address as per records..."
                      rows={2}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Bank & Financial Details */}
              <div className="bg-slate-50 border border-gray-200 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold tracking-wider text-purple-600">4. Bank & Financial details (Encrypted at Rest)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={employeeForm.bankName}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="HDFC Bank"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Bank Branch</label>
                    <input
                      type="text"
                      value={employeeForm.bankBranch}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, bankBranch: e.target.value }))}
                      placeholder="E.g. Kanjurmarg East"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Account Number</label>
                    <input
                      type="password"
                      value={employeeForm.accountNumber}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="Sensitive Field"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={employeeForm.ifsc}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, ifsc: e.target.value }))}
                      placeholder="HDFC0001234"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Bank Address</label>
                    <input
                      type="text"
                      value={employeeForm.bankAddress}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, bankAddress: e.target.value }))}
                      placeholder="E.g. 1st Floor, Trade Center, Mumbai"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-brand-navy mb-1">PAN Code</label>
                      <input
                        type="password"
                        value={employeeForm.pan}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, pan: e.target.value }))}
                        placeholder="Sensitive Field"
                        className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-navy mb-1">Insurance Number</label>
                      <input
                        type="text"
                        value={employeeForm.insuranceNumber}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, insuranceNumber: e.target.value }))}
                        placeholder="INS-12345678"
                        className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">PF Number</label>
                    <input
                      type="text"
                      value={employeeForm.pfNumber}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, pfNumber: e.target.value }))}
                      placeholder="MH/BAN/12345/678"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">UAN Number</label>
                    <input
                      type="text"
                      value={employeeForm.uan}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, uan: e.target.value }))}
                      placeholder="100123456789"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Joining / Perks & Custom configurations */}
              <div className="bg-slate-50 border border-gray-200 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold tracking-wider text-teal-600">5. Contract Details & Perks</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Expected End Date</label>
                    <input
                      type="date"
                      value={employeeForm.expectedEndDate}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, expectedEndDate: e.target.value }))}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Blood Group</label>
                    <select
                      value={employeeForm.bloodGroup}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, bloodGroup: e.target.value }))}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Timezone Context</label>
                    <input
                      type="text"
                      value={employeeForm.timezone}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, timezone: e.target.value }))}
                      placeholder="Asia/Kolkata"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Increment / Perks</label>
                    <input
                      type="text"
                      value={employeeForm.incrementPerks}
                      onChange={(e) => setEmployeeForm(prev => ({ ...prev, incrementPerks: e.target.value }))}
                      placeholder="E.g., Yearly bonus, medical insurance cover"
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Row */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-slate-100 text-gray-500 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-xs font-extrabold tracking-wide bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white transition-all cursor-pointer btn-premium text-center disabled:opacity-50"
                >
                  {loading ? 'Onboarding...' : 'Onboard Employee'}
                </button>
              </div>
            </form>
            </div>
          </div>
        )}

        {/* TAB 3: Review TL Submitted Reports */}
        {activeTab === 'reports' && (
          <div className="premium-card p-0 overflow-hidden space-y-0">
            {/* Header Title strip with Navy Blue background */}
            <div className="bg-brand-navy px-5 py-3 text-white">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-heading flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-white" />
                Review Periodic Team Status Reports
              </h3>
              <p className="text-[10px] text-white/80 mt-0.5">
                Audit, approve, and reject team status reports submitted by Team Leaders.
              </p>
            </div>

            <div className="p-6">

            <div className="space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar-container pr-1">
              {reports.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No team reports submitted yet.</p>
              ) : (
                reports.map((rep) => (
                  <div key={rep.id} className="p-5 rounded-xl border border-gray-200 bg-slate-50 hover:bg-slate-100/50 shadow-xs hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-brand-navy flex items-center gap-2">
                          Team: {rep.team.name}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Period: <span className="font-semibold">{formatDateToIndian(rep.periodStart)} to {formatDateToIndian(rep.periodEnd)}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          rep.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          rep.status === 'REJECTED' ? 'bg-red-100 text-brand-red' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {formatToTitleCase(rep.status)}
                        </span>

                        {rep.status === 'PENDING' && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleReviewReport(rep.id, 'APPROVED')}
                              className="bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-650/15 text-white text-xs font-bold py-1.5 px-3.5 rounded-lg cursor-pointer transition-all shadow-md"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewReport(rep.id, 'REJECTED')}
                              className="bg-brand-red hover:bg-red-700 hover:shadow-lg hover:shadow-brand-red/15 text-white text-xs font-bold py-1.5 px-3.5 rounded-lg cursor-pointer transition-all shadow-md"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white/50 backdrop-blur-xs p-4 rounded-lg border border-gray-200/40 text-xs text-gray-500 whitespace-pre-line font-medium leading-relaxed">
                      {rep.summary}
                    </div>

                    <div className="mt-2 text-[10px] text-gray-400 text-right">
                      Submitted by: {formatEmployeeName(rep.submittedBy.name)} &bull; Filed {formatDateToIndian(rep.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
            </div>
          </div>
        )}

        {/* TAB 4: Configure Policy & Holiday Calendars */}
        {activeTab === 'policies' && (
          <div className="premium-card p-0 overflow-hidden space-y-0">
            {/* Header Title strip with Navy Blue background */}
            <div className="bg-brand-navy px-5 py-3 text-white">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-heading flex items-center gap-2">
                <Settings className="w-4.5 h-4.5 text-white" />
                Configure Policy & Holiday Calendars
              </h3>
              <p className="text-[10px] text-white/80 mt-0.5">
                Set up global company holidays and configure allowed annual leave day counts by leave type.
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Holiday Configuration */}
            <div className="space-y-6">
              <div className="premium-card p-6">
                <h2 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                  Configure Company Holidays
                </h2>

                <form onSubmit={handleCreateHoliday} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end mb-6">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-brand-navy mb-1">Holiday Name</label>
                    <input
                      type="text"
                      required
                      value={holidayName}
                      onChange={(e) => setHolidayName(e.target.value)}
                      placeholder="Independence Day"
                      className="block w-full rounded-xl border border-gray-200/80 py-1.5 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={holidayDate}
                      onChange={(e) => setHolidayDate(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200/80 py-1.5 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    />
                  </div>
                  <div className="sm:col-span-3 flex justify-end mt-2">
                    <button
                      type="submit"
                      className="bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer btn-premium shadow-md"
                    >
                      Add Holiday
                    </button>
                  </div>
                </form>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {holidays.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">No holidays configured.</p>
                  ) : (
                    holidays.map((h) => (
                      <div key={h.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl text-xs border border-gray-200 shadow-xs">
                        <div>
                          <span className="font-bold text-brand-navy">{h.name}</span>
                          <span className="text-[10px] text-gray-400 ml-2">({formatDateToIndian(h.date)})</span>
                        </div>
                        <button
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="text-brand-red hover:text-red-700 transition-colors p-1 cursor-pointer"
                          title="Delete Holiday"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Leave Policy Settings */}
            <div className="space-y-6">
              <div className="premium-card p-6">
                <h2 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                  Configure Leave Types Policy
                </h2>

                <form onSubmit={handleCreateLeaveType} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end mb-6">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-brand-navy mb-1">Leave Type Name</label>
                    <input
                      type="text"
                      required
                      value={leaveName}
                      onChange={(e) => setLeaveName(e.target.value)}
                      placeholder="Casual Leave"
                      className="block w-full rounded-xl border border-gray-200/80 py-1.5 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Days Allowed</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={leaveDays}
                      onChange={(e) => setLeaveDays(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200/80 py-1.5 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div className="sm:col-span-3 flex justify-end mt-2">
                    <button
                      type="submit"
                      className="bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer btn-premium shadow-md"
                    >
                      Add Policy
                    </button>
                  </div>
                </form>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {leaveTypes.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">No leave policies defined.</p>
                  ) : (
                    leaveTypes.map((l) => (
                      <div key={l.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl text-xs border border-gray-200 shadow-xs">
                        <div>
                          <span className="font-bold text-brand-navy">{l.name}</span>
                          <span className="text-[10px] text-gray-400 ml-2">({l.daysAllowed} days allowed per year)</span>
                        </div>
                        <button
                          onClick={() => handleDeleteLeaveType(l.id)}
                          className="text-brand-red hover:text-red-700 transition-colors p-1 cursor-pointer"
                          title="Delete Policy"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            </div>
            </div>
          </div>
        )}

        {/* TAB 5: System Audit Logs */}
        {activeTab === 'audit' && (
          <div className="premium-card p-0 overflow-hidden space-y-0">
            {/* Header Title strip with Navy Blue background */}
            <div className="bg-brand-navy px-5 py-3 text-white">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-heading flex items-center gap-2">
                <ShieldAlert className="w-4.5 h-4.5 text-white" />
                System Audit Logs
              </h3>
              <p className="text-[10px] text-white/80 mt-0.5">
                Audit key system operations and changes executed by administrators and team leaders.
              </p>
            </div>

            <div className="p-6">

            <div className="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar-container pr-1">
              <table className="min-w-full text-left text-xs relative border-collapse">
                <thead className="sticky top-0 bg-slate-100/70 backdrop-blur-xs text-slate-700 font-bold z-10">
                  <tr className="border-b border-gray-200/50 text-gray-500 font-bold tracking-wider">
                    <th className="py-3 px-2 bg-transparent">Timestamp</th>
                    <th className="py-3 px-2 bg-transparent">Operation Executed By</th>
                    <th className="py-3 px-2 bg-transparent">Action Type</th>
                    <th className="py-3 px-2 bg-transparent">Target Entity</th>
                    <th className="py-3 px-2 bg-transparent">Target ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-400">No logs captured yet.</td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-2 text-gray-400 font-semibold whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-bold text-brand-navy">{log.user.name}</div>
                          <div className="text-[10px] text-gray-400">{log.user.email}</div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.action.includes('DEACTIVATE') || log.action.includes('REJECT') ? 'bg-red-100 text-brand-red' :
                            log.action.includes('CREATE') || log.action.includes('APPROVE') ? 'bg-emerald-100 text-emerald-800' :
                            'bg-blue-100 text-brand-cta'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-500 font-bold">{log.entity}</td>
                        <td className="py-3 px-2 text-gray-400 font-mono select-all truncate max-w-[120px]" title={log.entityId || ''}>
                          {log.entityId || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        )}

        {/* TAB 6: Performance Score Ratings */}
        {activeTab === 'performance' && (
          <div className="premium-card p-0 overflow-hidden space-y-0">
            {/* Header Title strip with Navy Blue background */}
            <div className="bg-brand-navy px-5 py-3 text-white">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-heading flex items-center gap-2">
                <FileCheck className="w-4.5 h-4.5 text-white" />
                Performance Score Ratings
              </h3>
              <p className="text-[10px] text-white/80 mt-0.5">
                Monitor team performance score distributions, review metrics, and override calculated scorecards.
              </p>
            </div>

            <div className="p-6 space-y-6">
            {/* Performance KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 text-center shadow-xs">
                <span className="block text-2xl font-extrabold text-blue-700 font-heading">{performanceCounts.BLUE}</span>
                <span className="text-[10px] font-bold text-blue-800 tracking-wider block mt-1">Excellent (76%–100%)</span>
              </div>
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 text-center shadow-xs">
                <span className="block text-2xl font-extrabold text-emerald-700 font-heading">{performanceCounts.GREEN}</span>
                <span className="text-[10px] font-bold text-emerald-800 tracking-wider block mt-1">Good (51%–75%)</span>
              </div>
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 text-center shadow-xs">
                <span className="block text-2xl font-extrabold text-amber-700 font-heading">{performanceCounts.YELLOW}</span>
                <span className="text-[10px] font-bold text-amber-800 tracking-wider block mt-1">Average (26%–50%)</span>
              </div>
              <div className="bg-red-50/50 p-4 rounded-xl border border-red-100/50 text-center shadow-xs">
                <span className="block text-2xl font-extrabold text-brand-red font-heading">{performanceCounts.RED}</span>
                <span className="text-[10px] font-bold text-red-800 tracking-wider block mt-1">Bad (0%–25%)</span>
              </div>
            </div>

            <div className="premium-card p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-brand-navy font-heading">Employee Performance Indicator Overview</h2>
                  <p className="text-xs text-gray-400 mt-1">Automatic nightly auto-scoring with manual override capability for HR Admins.</p>
                </div>
                <button
                  onClick={() => fetchAdminData()}
                  className="bg-slate-100 hover:bg-slate-200 text-brand-navy border border-gray-200/50 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Recompute Auto-Scores
                </button>
              </div>

            <div className="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar-container pr-1">
              <table className="min-w-full text-left text-xs relative border-collapse">
                <thead className="sticky top-0 bg-slate-100/70 backdrop-blur-xs text-slate-700 font-bold z-10">
                  <tr className="border-b border-gray-200/50 text-gray-500 font-bold tracking-wider">
                    <th className="py-3 px-2 bg-transparent">Employee</th>
                    <th className="py-3 px-2 bg-transparent">Team</th>
                    <th className="py-3 px-2 text-center bg-transparent">Score Type</th>
                    <th className="py-3 px-2 text-center bg-transparent">Score</th>
                    <th className="py-3 px-2 text-center bg-transparent">Rating Badge</th>
                    <th className="py-3 px-2 bg-transparent">Override Reason</th>
                    <th className="py-3 px-2 text-center bg-transparent">Last Updated</th>
                    <th className="py-3 px-2 text-center bg-transparent">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {performanceData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-gray-400">No performance records retrieved.</td>
                    </tr>
                  ) : (
                    performanceData.map((p: any) => (
                      <tr key={p.user.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-2 font-bold text-brand-navy">
                          <div>{p.user.name}</div>
                          <div className="text-[10px] text-gray-400 font-semibold">{p.user.email}</div>
                        </td>
                        <td className="py-3 px-2 text-gray-500 font-semibold">{p.user.team?.name || 'Unassigned'}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.score.manualOverride ? 'bg-purple-100 text-purple-800' : 'bg-blue-50 text-blue-800'
                          }`}>
                            {p.score.manualOverride ? 'Manual' : 'Auto'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center font-extrabold text-brand-navy">
                          {(() => {
                            let score = p.score.autoScore;
                            if (p.score.manualOverride) {
                              score = p.score.overrideScore !== null && p.score.overrideScore !== undefined
                                ? p.score.overrideScore
                                : (p.score.rating === 'RED' ? 15 : p.score.rating === 'YELLOW' ? 38 : p.score.rating === 'GREEN' ? 63 : 88);
                            }
                            return `${Math.round(score)}%`;
                          })()}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                            p.score.rating === 'BLUE' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            p.score.rating === 'GREEN' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            p.score.rating === 'YELLOW' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-red-100 text-brand-red border-red-200'
                          }`}>
                            {p.score.rating === 'RED' ? 'Bad' : p.score.rating === 'YELLOW' ? 'Average' : p.score.rating === 'GREEN' ? 'Good' : 'Excellent'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-500 max-w-xs truncate" title={p.score.overrideReason || ''}>
                          {p.score.overrideReason || '-'}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-400">
                          {formatDateToIndian(p.score.updatedAt)}
                        </td>
                        <td className="py-3 px-2 text-center whitespace-nowrap space-x-1.5">
                          <button
                            onClick={() => handleOpenOverrideModal(p.user.id, p.score)}
                            className="bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold px-2 py-1 rounded-lg text-[10px] transition-all cursor-pointer shadow-xs"
                          >
                            Override
                          </button>
                          {p.score.manualOverride && (
                            <button
                              onClick={() => handleClearOverride(p.user.id)}
                              className="bg-gray-100 hover:bg-gray-200 text-brand-navy font-bold px-2 py-1 rounded-lg text-[10px] transition-all cursor-pointer shadow-xs"
                            >
                              Clear
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
        )}

        {/* TAB 7: Leave Requests System */}
        {activeTab === 'leaves' && (
          <div className="premium-card p-0 overflow-hidden space-y-0">
            {/* Header Title strip with Navy Blue background */}
            <div className="bg-brand-navy px-5 py-3 text-white">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-heading flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-white" />
                Employee Leave Requests
              </h3>
              <p className="text-[10px] text-white/80 mt-0.5">
                Approve, reject, or comment on annual leave requests submitted by staff.
              </p>
            </div>

            <div className="p-6 space-y-6">
            {/* Leave Requests KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100/50 text-center shadow-xs">
                <span className="block text-2xl font-extrabold text-purple-700 font-heading">
                  {leaveRequests.filter(r => r.status === 'PENDING').length}
                </span>
                <span className="text-[10px] font-bold text-purple-800 tracking-wider block mt-1">Pending Leave Requests</span>
              </div>
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 text-center shadow-xs">
                <span className="block text-2xl font-extrabold text-emerald-700 font-heading">
                  {leaveRequests.filter(r => r.status === 'APPROVED').length}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 tracking-wider block mt-1">Approved Leave Requests</span>
              </div>
              <div className="bg-red-50/50 p-4 rounded-xl border border-red-100/50 text-center shadow-xs">
                <span className="block text-2xl font-extrabold text-brand-red font-heading">
                  {leaveRequests.filter(r => r.status === 'REJECTED').length}
                </span>
                <span className="text-[10px] font-bold text-red-800 tracking-wider block mt-1">Rejected Leave Requests</span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Tab Toggle for Leave Requests & History */}
              <div className="flex justify-center">
                <div className="inline-flex p-1 bg-slate-100 rounded-full border border-slate-200 shadow-3xs">
                  <button
                    onClick={() => setLeaveSubTab('requests')}
                    className={`px-6 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
                      leaveSubTab === 'requests'
                        ? 'bg-brand-navy text-white shadow-sm'
                        : 'text-brand-navy hover:bg-slate-200/50'
                    }`}
                  >
                    Leave Requests
                  </button>
                  <button
                    onClick={() => setLeaveSubTab('history')}
                    className={`px-6 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
                      leaveSubTab === 'history'
                        ? 'bg-brand-navy text-white shadow-sm'
                        : 'text-brand-navy hover:bg-slate-200/50'
                    }`}
                  >
                    Leave Requests History
                  </button>
                </div>
              </div>

              {leaveSubTab === 'requests' ? (
                <div className="animate-in fade-in duration-200 premium-card p-6">
                  <h2 className="text-lg font-bold text-brand-navy font-heading mb-4">Pending Employee Leave Requests</h2>
                  <div className="max-h-[400px] overflow-y-auto overflow-x-auto custom-scrollbar-container pr-1">
                    <table className="min-w-full text-left text-xs relative border-collapse">
                      <thead className="sticky top-0 bg-slate-100/70 backdrop-blur-xs text-slate-700 font-bold z-10">
                        <tr className="border-b border-gray-200/50 text-gray-500 font-bold tracking-wider">
                          <th className="py-3 px-2 bg-transparent">Employee</th>
                          <th className="py-3 px-2 bg-transparent">Team</th>
                          <th className="py-3 px-2 bg-transparent">Leave Type</th>
                          <th className="py-3 px-2 bg-transparent">Duration</th>
                          <th className="py-3 px-2 bg-transparent">Reason</th>
                          <th className="py-3 px-2 text-center bg-transparent">Status</th>
                          <th className="py-3 px-2 text-center bg-transparent">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {leaveRequests.filter(r => r.status === 'PENDING').length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-gray-400 font-medium">No pending leave requests logged in system.</td>
                          </tr>
                        ) : (
                          leaveRequests.filter(r => r.status === 'PENDING').map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50/50 border-b border-gray-50">
                              <td className="py-3 px-2 font-bold text-brand-navy">
                                <div>{req.user.name}</div>
                                <div className="text-[10px] text-gray-400 font-medium">{req.user.email}</div>
                              </td>
                              <td className="py-3 px-2 text-gray-500 font-semibold">{req.user.teamId ? teams.find(t => t.id === req.user.teamId)?.name : 'Unassigned'}</td>
                              <td className="py-3 px-2 font-semibold text-brand-navy">{req.leaveType.name}</td>
                              <td className="py-3 px-2 text-gray-500 whitespace-nowrap">
                                {req.startDate} to {req.endDate}
                              </td>
                              <td className="py-3 px-2 text-gray-500 max-w-xs truncate" title={req.reason}>
                                {req.reason}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                                  {formatToTitleCase(req.status)}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center whitespace-nowrap space-x-1.5">
                                <button
                                  onClick={() => handleReviewLeaveRequest(req.id, 'APPROVED')}
                                  className="bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/15 text-white font-bold px-2 py-1 rounded-lg text-[10px] transition-all cursor-pointer shadow-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleOpenRejectModal(req.id)}
                                  className="bg-brand-red hover:bg-red-700 hover:shadow-lg hover:shadow-brand-red/15 text-white font-bold px-2 py-1 rounded-lg text-[10px] transition-all cursor-pointer shadow-xs"
                                >
                                  Reject
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in duration-200 premium-card p-6">
                  <h2 className="text-lg font-bold text-brand-navy font-heading mb-4">Leave Requests History</h2>
                  <div className="max-h-[400px] overflow-y-auto overflow-x-auto custom-scrollbar-container pr-1">
                    <table className="min-w-full text-left text-xs relative border-collapse">
                      <thead className="sticky top-0 bg-slate-100/70 backdrop-blur-xs text-slate-700 font-bold z-10">
                        <tr className="border-b border-gray-200/50 text-gray-500 font-bold tracking-wider">
                          <th className="py-3 px-2 bg-transparent">Employee</th>
                          <th className="py-3 px-2 bg-transparent">Team</th>
                          <th className="py-3 px-2 bg-transparent">Leave Type</th>
                          <th className="py-3 px-2 bg-transparent">Duration</th>
                          <th className="py-3 px-2 bg-transparent">Reason</th>
                          <th className="py-3 px-2 text-center bg-transparent">Status</th>
                          <th className="py-3 px-2 bg-transparent">Reviewed By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {leaveRequests.filter(r => r.status !== 'PENDING').length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-gray-400 font-medium">No review history found.</td>
                          </tr>
                        ) : (
                          leaveRequests.filter(r => r.status !== 'PENDING').map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50/50 border-b border-gray-50">
                              <td className="py-3 px-2 font-bold text-brand-navy">
                                <div>{req.user.name}</div>
                                <div className="text-[10px] text-gray-400 font-medium">{req.user.email}</div>
                              </td>
                              <td className="py-3 px-2 text-gray-500 font-semibold">{req.user.teamId ? teams.find(t => t.id === req.user.teamId)?.name : 'Unassigned'}</td>
                              <td className="py-3 px-2 font-semibold text-brand-navy">{req.leaveType.name}</td>
                              <td className="py-3 px-2 text-gray-500 whitespace-nowrap">
                                {req.startDate} to {req.endDate}
                              </td>
                              <td className="py-3 px-2 text-gray-500 max-w-xs truncate" title={req.reason}>
                                {req.reason}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-brand-red'
                                }`}>
                                  {formatToTitleCase(req.status)}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-gray-500 font-semibold">{req.reviewedBy?.name || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* TAB: Resignation Requests */}
        {activeTab === 'resignations' && (
          <div className="premium-card p-0 overflow-hidden space-y-0">
            {/* Header Title strip with Navy Blue background */}
            <div className="bg-brand-navy px-5 py-3 text-white">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-heading flex items-center gap-2">
                <UserMinus className="w-4.5 h-4.5 text-white" />
                Resignation Requests
              </h3>
              <p className="text-[10px] text-white/80 mt-0.5">
                Review, approve, or reject resignation requests submitted by employees.
              </p>
            </div>

            <div className="p-6">

            <div className="max-h-[340px] overflow-y-auto overflow-x-auto custom-scrollbar-container pr-1">
              <table className="w-full text-left text-xs border-collapse relative">
                <thead className="sticky top-0 bg-slate-100/70 backdrop-blur-xs text-slate-700 font-bold z-10">
                  <tr className="border-b border-gray-200/50 text-gray-550 font-bold tracking-wider">
                    <th className="py-3 px-3 bg-transparent">Employee Name</th>
                    <th className="py-3 px-3 bg-transparent">Submission Date</th>
                    <th className="py-3 px-3 bg-transparent">Resignation Date</th>
                    <th className="py-3 px-3 bg-transparent">Last Working Day</th>
                    <th className="py-3 px-3 bg-transparent">Reason</th>
                    <th className="py-3 px-3 text-center bg-transparent">Status</th>
                    <th className="py-3 px-3 bg-transparent">HR Notes</th>
                    <th className="py-3 px-3 text-center bg-transparent">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resignationRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-400">No resignation requests found.</td>
                    </tr>
                  ) : (
                    resignationRequests.map((req) => {
                      const isPending = req.status === 'PENDING';
                      return (
                        <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3.5 px-3">
                            <div>
                              <span className="font-bold text-brand-navy block">
                                {formatEmployeeName(req.user.name)}
                              </span>
                              <span className="text-[10px] text-gray-455 block mt-0.5">
                                {req.user.email} {req.user.team?.name ? `| ${req.user.team.name}` : ''}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-gray-500 font-mono">
                            {formatDateToIndian(req.createdAt)}
                          </td>
                          <td className="py-3.5 px-3 text-gray-500 font-mono">
                            {formatDateToIndian(req.resignationDate)}
                          </td>
                          <td className="py-3.5 px-3 text-gray-500 font-mono">
                            {formatDateToIndian(req.lastWorkingDay)}
                          </td>
                          <td className="py-3.5 px-3 text-gray-500 max-w-xs break-words" title={req.reason}>
                            {req.reason}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className={`inline-block px-2.5 py-0.75 rounded-full text-[9px] font-extrabold border ${
                              req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                              req.status === 'REJECTED' ? 'bg-red-50 text-brand-red border-red-200/60' :
                              'bg-amber-50 text-amber-700 border-amber-200/60'
                            }`}>
                              {formatToTitleCase(req.status)}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            {isPending ? (
                              <input
                                type="text"
                                placeholder="Add HR notes..."
                                value={reviewResignationId === req.id ? resignationNotes : ''}
                                onFocus={() => {
                                  setReviewResignationId(req.id);
                                  setResignationNotes(req.hrNotes || '');
                                }}
                                onChange={(e) => setResignationNotes(e.target.value)}
                                className="rounded-xl border border-gray-200/80 py-1.5 px-2.5 text-xs text-brand-gray bg-white/70 outline-none focus:border-brand-cta w-full"
                              />
                            ) : (
                              <span className="text-gray-550 italic">{req.hrNotes || '-'}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            {isPending ? (
                              <div className="flex gap-1.5 justify-center">
                                <button
                                  onClick={() => {
                                    setReviewResignationId(req.id);
                                    handleReviewResignation(req.id, 'APPROVED');
                                  }}
                                  disabled={submittingResignation}
                                  className="bg-emerald-650 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded-lg text-[10px] transition-all cursor-pointer shadow-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setReviewResignationId(req.id);
                                    handleReviewResignation(req.id, 'REJECTED');
                                  }}
                                  disabled={submittingResignation}
                                  className="bg-brand-red hover:bg-red-700 text-white font-bold px-2 py-1 rounded-lg text-[10px] transition-all cursor-pointer shadow-xs"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 font-semibold text-[10px]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        )}

        {/* TAB: Run Payroll */}
        {activeTab === 'payroll' && (
          <div className="premium-card p-0 overflow-hidden space-y-0">
            {/* Header Title strip with Navy Blue background */}
            <div className="bg-brand-navy px-5 py-3 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-heading flex items-center gap-2">
                  <CreditCard className="w-4.5 h-4.5 text-white" />
                  Payroll Management
                </h3>
                <p className="text-[10px] text-white/80 mt-0.5">
                  Configure user salary structures and generate or approve periodic employee payroll runs.
                </p>
              </div>

              {/* Sub-tabs */}
              <div className="flex gap-1.5 bg-white/10 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setPayrollSubTab('runs')}
                  className={`px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wide uppercase transition-all cursor-pointer ${
                    payrollSubTab === 'runs' ? 'bg-white text-brand-navy shadow-xs' : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Payroll Runs
                </button>
                <button
                  type="button"
                  onClick={() => setPayrollSubTab('structures')}
                  className={`px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wide uppercase transition-all cursor-pointer ${
                    payrollSubTab === 'structures' ? 'bg-white text-brand-navy shadow-xs' : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Salary Structures
                </button>
              </div>
            </div>

            <div className="p-6">

            {/* SUBTAB 1: Runs */}
            {payrollSubTab === 'runs' && (
              <div className="space-y-6">
                {/* Payroll KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200 text-center shadow-xs">
                    <span className="block text-2xl font-extrabold text-brand-navy font-heading">{payrollRuns.length}</span>
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider block mt-1">Total Runs Logged</span>
                  </div>
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 text-center shadow-xs">
                    <span className="block text-2xl font-extrabold text-amber-700 font-heading">
                      {payrollRuns.filter(r => r.status === 'DRAFT').length}
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 tracking-wider block mt-1">Draft Payrolls</span>
                  </div>
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 text-center shadow-xs">
                    <span className="block text-2xl font-extrabold text-blue-700 font-heading">
                      {payrollRuns.filter(r => r.status === 'APPROVED').length}
                    </span>
                    <span className="text-[10px] font-bold text-blue-800 tracking-wider block mt-1">Approved Pending Payout</span>
                  </div>
                </div>

                {/* Parameters block */}
                <div className="bg-white/50 backdrop-blur-xs p-4 rounded-xl border border-gray-200/50 shadow-xs">
                  <form onSubmit={handleGeneratePayroll} className="flex flex-col md:flex-row md:items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-brand-navy mb-1">Period Start Date</label>
                      <input
                        type="date"
                        required
                        value={payrollPeriodStart}
                        onChange={(e) => setPayrollPeriodStart(e.target.value)}
                        className="block w-full rounded-xl border border-gray-200/80 py-1.5 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-brand-navy mb-1">Period End Date</label>
                      <input
                        type="date"
                        required
                        value={payrollPeriodEnd}
                        onChange={(e) => setPayrollPeriodEnd(e.target.value)}
                        className="block w-full rounded-xl border border-gray-200/80 py-1.5 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer btn-premium text-center disabled:opacity-50 shadow-md"
                    >
                      {loading ? 'Generating...' : 'Generate Payroll Draft'}
                    </button>
                  </form>
                </div>

                {/* Runs list */}
                <div className="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar-container pr-1">
                  <table className="min-w-full text-left text-xs relative border-collapse">
                    <thead className="sticky top-0 bg-slate-100/70 backdrop-blur-xs text-slate-700 font-bold z-10">
                      <tr className="border-b border-gray-200/50 text-gray-500 font-bold tracking-wider">
                        <th className="py-3 px-2 bg-transparent">Employee</th>
                        <th className="py-3 px-2 bg-transparent">Period</th>
                        <th className="py-3 px-2 text-right bg-transparent">Gross (INR)</th>
                        <th className="py-3 px-2 text-right bg-transparent">Deductions (INR)</th>
                        <th className="py-3 px-2 text-right bg-transparent">Net Pay (INR)</th>
                        <th className="py-3 px-2 text-center bg-transparent">Status</th>
                        <th className="py-3 px-2 text-center bg-transparent">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payrollRuns.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-gray-400">No payroll runs found in system.</td>
                        </tr>
                      ) : (
                        payrollRuns.map((run) => (
                          <tr key={run.id} className="hover:bg-gray-50/50">
                            <td className="py-3 px-2 font-bold text-brand-navy">
                              {formatEmployeeName(run.user.name)}
                            </td>
                            <td className="py-3 px-2 text-gray-500">
                              {formatDateToIndian(run.periodStart)} to {formatDateToIndian(run.periodEnd)}
                            </td>
                            <td className="py-3 px-2 text-right font-semibold text-gray-500">
                              {run.grossEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-2 text-right font-semibold text-gray-500">
                              {run.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-2 text-right font-extrabold text-brand-navy">
                              {run.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                run.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                                run.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {formatToTitleCase(run.status)}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center whitespace-nowrap space-x-1.5">
                              {run.status === 'DRAFT' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedRun(run);
                                      setRunOvertime(run.overtime.toString());
                                      setRunBonus(run.bonus.toString());
                                      setRunIncentives(run.incentives.toString());
                                      setRunLoanDeduction(run.loanDeduction.toString());
                                      setIsPayrollEditModalOpen(true);
                                    }}
                                    className="bg-gray-100 hover:bg-gray-200 text-brand-navy font-bold px-2 py-1 rounded-lg text-[10px] transition-all cursor-pointer shadow-xs"
                                  >
                                    Edit Extras
                                  </button>
                                  <button
                                    onClick={() => handlePayrollStatusChange(run.id, 'APPROVED')}
                                    className="bg-blue-500 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/15 text-white font-bold px-2 py-1 rounded-lg text-[10px] transition-all cursor-pointer shadow-xs"
                                  >
                                    Approve
                                  </button>
                                </>
                              )}
                              {run.status === 'APPROVED' && (
                                <button
                                  onClick={() => handlePayrollStatusChange(run.id, 'PAID')}
                                  className="bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/15 text-white font-bold px-2 py-1 rounded-lg text-[10px] transition-all cursor-pointer shadow-xs"
                                >
                                  Mark Paid
                                </button>
                              )}
                              {(run.status === 'APPROVED' || run.status === 'PAID') && (
                                <a
                                  href={`/api/payroll/runs/export?id=${run.id}`}
                                  download
                                  className="inline-block bg-gray-800 hover:bg-gray-950 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] text-center transition-all shadow-xs"
                                >
                                  Payslip
                                </a>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUBTAB 2: Salary Structures */}
            {payrollSubTab === 'structures' && (
              <div className="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar-container pr-1">
                <table className="min-w-full text-left text-xs relative border-collapse">
                  <thead className="sticky top-0 bg-slate-100/70 backdrop-blur-xs text-slate-700 font-bold z-10">
                    <tr className="border-b border-gray-200/50 text-gray-500 font-bold tracking-wider">
                      <th className="py-3 px-2 bg-transparent">Employee</th>
                      <th className="py-3 px-2 bg-transparent">Department</th>
                      <th className="py-3 px-2 bg-transparent">Designation</th>
                      <th className="py-3 px-2 text-right bg-transparent">Basic (INR)</th>
                      <th className="py-3 px-2 text-right bg-transparent">HRA (INR)</th>
                      <th className="py-3 px-2 text-right bg-transparent">Conveyance (INR)</th>
                      <th className="py-3 px-2 text-right bg-transparent">Allowance (INR)</th>
                      <th className="py-3 px-2 text-center bg-transparent">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-gray-400">No active employees found.</td>
                      </tr>
                    ) : (
                      users.map((employee) => (
                        <tr key={employee.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-2 font-bold text-brand-navy">
                            {employee.name}
                          </td>
                          <td className="py-3 px-2 text-gray-500 font-semibold">{employee.employeeProfile?.department || 'N/A'}</td>
                          <td className="py-3 px-2 text-gray-500">{employee.employeeProfile?.designation || 'N/A'}</td>
                          <td className="py-3 px-2 text-right text-gray-500 font-semibold">
                            {employee.salaryStructure?.basicSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                          </td>
                          <td className="py-3 px-2 text-right text-gray-500">
                            {employee.salaryStructure?.hra.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                          </td>
                          <td className="py-3 px-2 text-right text-gray-500">
                            {employee.salaryStructure?.conveyance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                          </td>
                          <td className="py-3 px-2 text-right text-gray-500">
                            {employee.salaryStructure?.specialAllowance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSalaryUser(employee);
                                setSalaryBasic(employee.salaryStructure?.basicSalary?.toString() || '30000');
                                setSalaryHRA(employee.salaryStructure?.hra?.toString() || '12000');
                                setSalaryConveyance(employee.salaryStructure?.conveyance?.toString() || '3000');
                                setSalarySpecial(employee.salaryStructure?.specialAllowance?.toString() || '5000');
                                setSalaryEffectiveFrom(employee.salaryStructure?.effectiveFrom ? new Date(employee.salaryStructure.effectiveFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                                setIsSalaryModalOpen(true);
                              }}
                              className="bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold px-3 py-1 rounded-lg text-[10px] transition-all cursor-pointer shadow-xs"
                            >
                              Configure
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            </div>
          </div>
        )}

        {/* TAB: Training Center */}
        {activeTab === 'trainings' && (
          <div className="premium-card p-0 overflow-hidden space-y-0">
            {/* Header Title strip with Navy Blue background */}
            <div className="bg-brand-navy px-5 py-3 text-white">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-heading flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-white" />
                Employee Trainings & Certifications
              </h3>
              <p className="text-[10px] text-white/80 mt-0.5">
                Schedule courses, enroll employees, monitor attendance, and issue program completion certifications.
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Training & Assign Employees */}
            <div className="premium-card p-6 lg:col-span-1 space-y-4">
              <h2 className="text-lg font-bold text-brand-navy font-heading flex items-center gap-2">
                <Bell className="w-5 h-5 text-brand-cta" />
                Schedule New Training
              </h2>

              <form onSubmit={handleCreateTraining} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">Course Name</label>
                  <input
                    type="text"
                    required
                    value={trainingName}
                    onChange={(e) => setTrainingName(e.target.value)}
                    placeholder="e.g. Next.js App Router Masterclass"
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">Trainer Name</label>
                  <input
                    type="text"
                    required
                    value={trainingTrainer}
                    onChange={(e) => setTrainingTrainer(e.target.value)}
                    placeholder="e.g. Santhosh Kumar"
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Planned Date</label>
                    <input
                      type="date"
                      required
                      value={trainingPlannedDate}
                      onChange={(e) => setTrainingPlannedDate(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Duration (Hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={trainingHours}
                      onChange={(e) => setTrainingHours(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">Target Department</label>
                  <input
                    type="text"
                    value={trainingDept}
                    onChange={(e) => setTrainingDept(e.target.value)}
                    placeholder="e.g. Engineering"
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                  />
                </div>

                {/* Checklist to assign users */}
                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1.5">Assign Employees</label>
                  <div className="max-h-[160px] overflow-y-auto border border-gray-200/50 p-2.5 rounded-xl bg-white/50 backdrop-blur-xs space-y-2 shadow-xs">
                    {users.length === 0 ? (
                      <p className="text-[10px] text-gray-400">No active employees found.</p>
                    ) : (
                      users.map((u) => (
                        <label key={u.id} className="flex items-center gap-2 text-xs font-semibold text-brand-navy cursor-pointer">
                          <input
                            type="checkbox"
                            checked={trainingAssignees.includes(u.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTrainingAssignees([...trainingAssignees, u.id]);
                              } else {
                                setTrainingAssignees(trainingAssignees.filter((id) => id !== u.id));
                              }
                            }}
                            className="rounded text-brand-cta focus:ring-brand-cta border-gray-300 cursor-pointer"
                          />
                          {u.name}
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs cursor-pointer btn-premium text-center disabled:opacity-50 shadow-md"
                >
                  {loading ? 'Creating...' : 'Schedule & Assign Training'}
                </button>
              </form>
            </div>

            {/* Courses & Assignments review list */}
            <div className="premium-card p-6 lg:col-span-2 space-y-6">
              <h2 className="text-lg font-bold text-brand-navy font-heading">Scheduled Trainings & Performance Results</h2>

              <div className="space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar-container pr-1">
                {trainings.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">No trainings scheduled yet.</p>
                ) : (
                  trainings.map((t) => (
                    <div key={t.id} className="p-4 rounded-2xl border border-gray-200 bg-slate-50 space-y-4 shadow-xs hover:shadow-md transition-all">
                      <div className="flex justify-between items-start border-b border-gray-200/50 pb-2">
                        <div>
                          <h4 className="text-sm font-extrabold text-brand-navy">{t.trainingName}</h4>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Trainer: {t.trainer} | Dept: {t.department || 'All'}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-brand-navy block">{formatDateToIndian(t.plannedDate)}</span>
                          <span className="text-[9px] text-gray-400 font-medium">{t.durationHours} hours duration</span>
                        </div>
                      </div>

                      {/* Attendee performance evaluation list */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-brand-navy tracking-wider">Attendee Status & Assessment Scores</p>
                        {t.attendance.length === 0 ? (
                          <p className="text-[10px] text-gray-400 italic">No employees assigned to this course.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-[11px] bg-white/40 backdrop-blur-xs rounded-xl border border-gray-200/50 shadow-xs">
                              <thead>
                                <tr className="border-b border-gray-200/50 text-gray-500 font-bold">
                                  <th className="py-2 px-2.5 bg-transparent">Name</th>
                                  <th className="py-2 px-2.5 text-center bg-transparent">Attended</th>
                                  <th className="py-2 px-2.5 text-center bg-transparent">Certified</th>
                                  <th className="py-2 px-2.5 text-center bg-transparent">Score</th>
                                  <th className="py-2 px-2.5 bg-transparent">Feedback</th>
                                  <th className="py-2 px-2.5 text-center bg-transparent">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 font-medium text-brand-navy">
                                {t.attendance.map((assign: any) => (
                                  <tr key={assign.userId} className="hover:bg-gray-50/50">
                                    <td className="py-2 px-2.5 font-bold">{assign.user.name}</td>
                                    <td className="py-2 px-2.5 text-center">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                        assign.attended ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-brand-red'
                                      }`}>{assign.attended ? 'Yes' : 'No'}</span>
                                    </td>
                                    <td className="py-2 px-2.5 text-center">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                        assign.certified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                                      }`}>{assign.certified ? 'Certified' : 'No'}</span>
                                    </td>
                                    <td className="py-2 px-2.5 text-center font-extrabold">
                                      {assign.assessmentScore !== null ? `${assign.assessmentScore}%` : '-'}
                                    </td>
                                    <td className="py-2 px-2.5 text-gray-500 max-w-[120px] truncate" title={assign.feedback || ''}>
                                      {assign.feedback || '-'}
                                    </td>
                                    <td className="py-2 px-2.5 text-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedTraining(t);
                                          setSelectedAttendee(assign.user);
                                          setEvalAttended(assign.attended);
                                          setEvalCertified(assign.certified);
                                          setEvalScore(assign.assessmentScore !== null ? assign.assessmentScore.toString() : '');
                                          setEvalFeedback(assign.feedback || '');
                                          setIsTrainingEvalModalOpen(true);
                                        }}
                                        className="bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold px-2 py-0.5 rounded-lg text-[9px] transition-all cursor-pointer shadow-xs"
                                      >
                                        Evaluate
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            </div>
            </div>
          </div>
        )}

      </main>
    </div>

      {/* Override Modal */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="premium-card max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-brand-navy font-heading">Override Performance Rating</h2>
            
            {(() => {
              const uObj = performanceData.find((p) => p.user.id === overrideUserId);
              if (uObj) {
                return (
                  <div className="mb-4 text-center border-b border-gray-100 pb-4">
                    <p className="text-xs text-gray-400 font-semibold mb-2">Current Rating for {uObj.user.name}</p>
                    <div className="flex justify-center">
                      {(() => {
                        const displayRating = uObj.score.rating;
                        let displayScore = uObj.score.autoScore;
                        if (uObj.score.manualOverride) {
                          displayScore = uObj.score.overrideScore !== null && uObj.score.overrideScore !== undefined
                            ? uObj.score.overrideScore
                            : (displayRating === 'RED' ? 15 : displayRating === 'YELLOW' ? 38 : displayRating === 'GREEN' ? 63 : 88);
                        }
                        return <Speedometer score={displayScore} rating={displayRating} size={240} />;
                      })()}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <form onSubmit={handleSaveOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-navy mb-1">New Performance Rating</label>
                <select
                  required
                  value={overrideRating}
                  onChange={(e) => setOverrideRating(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200/80 py-2.5 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                >
                  <option value="RED">RED (Bad: 0-25)</option>
                  <option value="YELLOW">YELLOW (Average: 26-50)</option>
                  <option value="GREEN">GREEN (Good: 51-75)</option>
                  <option value="BLUE">BLUE (Excellent: 76-100)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-navy mb-1">Override Score (0-100) (Optional)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(e.target.value)}
                  placeholder="e.g. 53"
                  className="block w-full rounded-xl border border-gray-200/80 py-2.5 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                />
                <p className="text-[10px] text-gray-400 mt-1">If blank, defaults to midpoint of chosen rating band (RED=20, YELLOW=53, GREEN=75, BLUE=93).</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-navy mb-1">Override Reason</label>
                <textarea
                  required
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Enter justification for overriding automatic score calculation..."
                  className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs resize-y min-h-[50px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-brand-navy font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer btn-premium shadow-md"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configure Salary Modal */}
      {isSalaryModalOpen && selectedSalaryUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="premium-card max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-brand-navy font-heading">Configure Salary Structure</h2>
            <p className="text-xs text-gray-500">Set base compensation values for <strong>{selectedSalaryUser.name}</strong>.</p>

            <form onSubmit={handleUpdateSalaryStructure} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-navy mb-1">Basic Salary (INR/Month) *</label>
                <input
                  type="number"
                  required
                  value={salaryBasic}
                  onChange={(e) => setSalaryBasic(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-navy mb-1">HRA (INR/Month) *</label>
                <input
                  type="number"
                  required
                  value={salaryHRA}
                  onChange={(e) => setSalaryHRA(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-navy mb-1">Conveyance (INR/Month) *</label>
                <input
                  type="number"
                  required
                  value={salaryConveyance}
                  onChange={(e) => setSalaryConveyance(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-navy mb-1">Special Allowance (INR/Month) *</label>
                <input
                  type="number"
                  required
                  value={salarySpecial}
                  onChange={(e) => setSalarySpecial(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-navy mb-1">Effective From *</label>
                <input
                  type="date"
                  required
                  value={salaryEffectiveFrom}
                  onChange={(e) => setSalaryEffectiveFrom(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSalaryModalOpen(false);
                    setSelectedSalaryUser(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-brand-navy font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer btn-premium shadow-md"
                >
                  Save Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payroll Run Modal */}
      {isPayrollEditModalOpen && selectedRun && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="premium-card max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-brand-navy font-heading">Edit Payroll Extras</h2>
            <p className="text-xs text-gray-500">Adjust monthly variables for <strong>{selectedRun.user.name}</strong>.</p>

            <form onSubmit={handleUpdatePayrollValues} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-navy mb-1">Overtime Pay (INR)</label>
                <input
                  type="number"
                  value={runOvertime}
                  onChange={(e) => setRunOvertime(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-navy mb-1">Performance Bonus (INR)</label>
                <input
                  type="number"
                  value={runBonus}
                  onChange={(e) => setRunBonus(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-navy mb-1">Sales/Team Incentives (INR)</label>
                <input
                  type="number"
                  value={runIncentives}
                  onChange={(e) => setRunIncentives(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-navy mb-1">Loan Deduction (INR)</label>
                <input
                  type="number"
                  value={runLoanDeduction}
                  onChange={(e) => setRunLoanDeduction(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPayrollEditModalOpen(false);
                    setSelectedRun(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-brand-navy font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer btn-premium shadow-md"
                >
                  Recompute & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {isRejectModalOpen && rejectRequestId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="premium-card max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-brand-navy font-heading">Reject Leave Request</h2>
            <p className="text-xs text-gray-500">Provide a clear reason explaining why this leave request is being rejected.</p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-navy mb-1">Rejection Reason *</label>
                <textarea
                  required
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Project deliverable deadline conflicts with the requested dates."
                  className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs resize-y min-h-[50px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRejectModalOpen(false);
                    setRejectRequestId(null);
                    setRejectionReason('');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-brand-navy font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-red hover:bg-red-700 hover:shadow-lg hover:shadow-brand-red/15 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer btn-premium shadow-md"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Training Evaluation Modal */}
      {isTrainingEvalModalOpen && selectedTraining && selectedAttendee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="premium-card max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-brand-navy font-heading">Evaluate Training Performance</h2>
            <p className="text-xs text-gray-500">Record assessment results for <strong>{selectedAttendee.name}</strong> on course <strong>{selectedTraining.trainingName}</strong>.</p>

            <form onSubmit={handleRecordTrainingEval} className="space-y-4">
              <div className="flex gap-6 items-center">
                <label className="flex items-center gap-2 text-xs font-bold text-brand-navy cursor-pointer">
                  <input
                    type="checkbox"
                    checked={evalAttended}
                    onChange={(e) => setEvalAttended(e.target.checked)}
                    className="rounded text-brand-cta focus:ring-brand-cta border-gray-300 cursor-pointer w-4 h-4"
                  />
                  Attended Course
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-brand-navy cursor-pointer">
                  <input
                    type="checkbox"
                    checked={evalCertified}
                    onChange={(e) => setEvalCertified(e.target.checked)}
                    className="rounded text-brand-cta focus:ring-brand-cta border-gray-300 cursor-pointer w-4 h-4"
                  />
                  Certified Pass
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-navy mb-1">Assessment Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={evalScore}
                  onChange={(e) => setEvalScore(e.target.value)}
                  placeholder="e.g. 85"
                  className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-navy mb-1">Trainer Feedback</label>
                <textarea
                  rows={2}
                  value={evalFeedback}
                  onChange={(e) => setEvalFeedback(e.target.value)}
                  placeholder="Enter comments about performance, strengths, or actions..."
                  className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs resize-y min-h-[50px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsTrainingEvalModalOpen(false);
                    setSelectedTraining(null);
                    setSelectedAttendee(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-brand-navy font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer btn-premium shadow-md"
                >
                  Save Results
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
