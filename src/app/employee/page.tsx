'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { 
  Clock, 
  MapPin, 
  Globe, 
  Plus, 
  History, 
  CheckSquare, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  Trash2,
  Bell,
  Check,
  Calendar,
  TrendingUp,
  Menu,
  X,
  User
} from 'lucide-react';
import Speedometer from '@/components/Speedometer';

interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime: string;
  checkOutTime: string | null;
  status: string;
  ip: string;
  tz: string;
}

interface TrackSheet {
  id: string;
  date: string;
  project: string;
  taskDescription: string;
  hours: number;
  status: string;
  notes: string | null;
  assignedByName: string | null;
}

interface EmployeeProfile {
  id: string;
  userId: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  dateOfBirth: string | null;
  personalEmail: string | null;
  mobileNumber: string | null;
  emergencyContact: string | null;
  permanentAddress: string | null;
  currentAddress: string | null;
  dateOfJoining: string | null;
  employeeType: string;
  department: string | null;
  designation: string | null;
  grade: string | null;
  location: string | null;
  businessUnit: string | null;
  hrBusinessPartner: string | null;
  employmentStatus: string;
  probationPeriod: string | null;
  confirmationDate: string | null;
  workShift: string;
  bankName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  pan: string | null;
  uan: string | null;
}

interface SalaryStructure {
  id: string;
  basicSalary: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  effectiveFrom: string;
}

interface PayrollRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  basicSalary: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  overtime: number;
  bonus: number;
  incentives: number;
  pf: number;
  esi: number;
  professionalTax: number;
  tds: number;
  lopDeduction: number;
  loanDeduction: number;
  totalDeductions: number;
  grossEarnings: number;
  netSalary: number;
  status: string;
}

interface PerformanceGoal {
  id: string;
  goalTitle: string;
  kpi: string;
  weight: number;
  target: string;
  achievement: string | null;
  rating: number | null;
  period: string;
  status: string;
  manager: { name: string } | null;
}

interface TrainingAssignment {
  id: string;
  attended: boolean;
  certified: boolean;
  assessmentScore: number | null;
  feedback: string | null;
  training: {
    id: string;
    trainingName: string;
    trainer: string;
    plannedDate: string;
    durationHours: number;
    department: string | null;
  };
}

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: string;
  status: string;
}

interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function EmployeeDashboard() {
  // Session & States
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [stats, setStats] = useState({ present: 0, late: 0, absent: 0, leave: 0 });
  
  const [trackSheets, setTrackSheets] = useState<TrackSheet[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Leave Request States
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Performance Score States
  const [performanceScore, setPerformanceScore] = useState<any>(null);

  // Self-Service States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'tracksheets' | 'profile' | 'leaves' | 'payroll' | 'goals' | 'trainings'>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    mobileNumber: '',
    personalEmail: '',
    emergencyContact: '',
    currentAddress: '',
    permanentAddress: '',
    maritalStatus: 'Single',
  });
  const [myPayrollRuns, setMyPayrollRuns] = useState<PayrollRun[]>([]);
  const [myGoals, setMyGoals] = useState<PerformanceGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<PerformanceGoal | null>(null);
  const [achievementInput, setAchievementInput] = useState('');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [myTrainings, setMyTrainings] = useState<TrainingAssignment[]>([]);

  // Form States
  const [project, setProject] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [hours, setHours] = useState('8.0');
  const [notes, setNotes] = useState('');
  const [assignedByName, setAssignedByName] = useState('');

  // Status handlers
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [submittingTrack, setSubmittingTrack] = useState(false);
  const [errorMsg, setErrorMsgState] = useState('');
  const [successMsg, setSuccessMsgState] = useState('');
  const [fadeSuccess, setFadeSuccess] = useState(false);
  const [fadeError, setFadeError] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Fetch Attendance
      const attRes = await fetch('/api/attendance');
      if (attRes.ok) {
        const attData = await attRes.json();
        setAttendance(attData.attendance || []);
        setTodayRecord(attData.todayRecord);
        if (attData.stats) setStats(attData.stats);
      }

      // 2. Fetch Track sheets
      const trackRes = await fetch('/api/tracksheets');
      if (trackRes.ok) {
        const trackData = await trackRes.json();
        setTrackSheets(trackData.trackSheets || []);
      }

      // 3. Fetch Tasks
      const taskRes = await fetch('/api/tasks?scope=assigned');
      if (taskRes.ok) {
        const taskData = await taskRes.json();
        setTasks(taskData.tasks || []);
      }

      // 4. Fetch Notifications
      const notifRes = await fetch('/api/notifications');
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
        setUnreadCount(notifData.unreadCount || 0);
      }

      // 5. Fetch Leave requests
      const leaveRes = await fetch('/api/leave-requests');
      if (leaveRes.ok) {
        const leaveData = await leaveRes.json();
        setLeaveRequests(leaveData.requests || []);
        setLeaveBalances(leaveData.leaveBalances || []);
      }

      // 6. Fetch Performance score
      const perfRes = await fetch('/api/admin/performance');
      if (perfRes.ok) {
        const perfData = await perfRes.json();
        if (perfData.performanceData && perfData.performanceData.length > 0) {
          setPerformanceScore(perfData.performanceData[0].score);
        }
      }

      // 7. Fetch Employee Profile details
      const profileRes = await fetch('/api/users/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.profile) {
          setEmployeeProfile(profileData.profile);
          setProfileForm({
            mobileNumber: profileData.profile.mobileNumber || '',
            personalEmail: profileData.profile.personalEmail || '',
            emergencyContact: profileData.profile.emergencyContact || '',
            currentAddress: profileData.profile.currentAddress || '',
            permanentAddress: profileData.profile.permanentAddress || '',
            maritalStatus: profileData.profile.maritalStatus || 'Single',
          });
        }
      }

      // 8. Fetch Employee Payroll Runs
      const payrollRes = await fetch('/api/payroll/runs');
      if (payrollRes.ok) {
        const payrollData = await payrollRes.json();
        setMyPayrollRuns(payrollData.runs || []);
      }

      // 9. Fetch Employee Performance Goals
      const goalsRes = await fetch('/api/performance/goals');
      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setMyGoals(goalsData.goals || []);
      }

      // 10. Fetch Employee Training assignments
      const trainingRes = await fetch('/api/trainings');
      if (trainingRes.ok) {
        const trainingData = await trainingRes.json();
        setMyTrainings(trainingData.assignments || []);
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
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

      setSuccessMsg('Successfully checked in!');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during check in');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleCheckOut = async () => {
    setLoadingAttendance(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_out' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to check out');

      setSuccessMsg('Successfully checked out! Shift completed.');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during check out');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleSubmitTrackSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTrack(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/tracksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: todayStr,
          project,
          taskDescription,
          hours,
          notes,
          assignedByName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log hours');

      setSuccessMsg('Track sheet entry created successfully!');
      setProject('');
      setTaskDescription('');
      setNotes('');
      setAssignedByName('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving track sheet');
    } finally {
      setSubmittingTrack(false);
    }
  };

  const handleDeleteTrackSheet = async (id: string) => {
    if (!confirm('Are you sure you want to delete this track sheet?')) return;
    try {
      const res = await fetch(`/api/tracksheets?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg('Track sheet entry deleted.');
        fetchData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to delete');
      }
    } catch (err) {
      console.error('Error deleting track sheet:', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAttendance(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profileForm,
          userId: employeeProfile?.userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setSuccessMsg('Your personal profile details updated successfully!');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating profile');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleUpdateGoalAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    setLoadingAttendance(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/performance/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedGoal.id,
          achievement: achievementInput,
          status: 'YEAR_END', // Move goal to review status
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update goal');

      setSuccessMsg(`Accomplishments submitted for: ${selectedGoal.goalTitle}!`);
      setIsGoalModalOpen(false);
      setSelectedGoal(null);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating goal');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleSubmitLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTypeId || !leaveStartDate || !leaveEndDate || !leaveReason.trim()) {
      setErrorMsg('Please fill in all leave request fields.');
      return;
    }

    setSubmittingLeave(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveTypeId,
          startDate: leaveStartDate,
          endDate: leaveEndDate,
          reason: leaveReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit leave request');

      setSuccessMsg('Leave request submitted successfully!');
      setLeaveStartDate('');
      setLeaveEndDate('');
      setLeaveReason('');
      setLeaveTypeId('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting leave request');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleUpdateTaskStatus = async (id: string, currentStatus: string) => {
    let nextStatus = 'TODO';
    if (currentStatus === 'TODO') nextStatus = 'IN_PROGRESS';
    else if (currentStatus === 'IN_PROGRESS') nextStatus = 'COMPLETED';
    else return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (res.ok) {
        setSuccessMsg(`Task status updated to ${nextStatus.replace('_', ' ')}!`);
        fetchData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to update task');
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (res.ok) {
        setUnreadCount(0);
        fetchData();
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  // Helper date conversions
  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const employeeNavItems: {
    id: 'dashboard' | 'tasks' | 'tracksheets' | 'profile' | 'leaves' | 'payroll' | 'goals' | 'trainings';
    label: string;
    icon: any;
  }[] = [
    { id: 'dashboard', label: 'My Dashboard', icon: Clock },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'tracksheets', label: 'My Track Sheets', icon: FileText },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'leaves', label: 'My Leaves & Requests', icon: Calendar },
    { id: 'payroll', label: 'My Payroll & Payslips', icon: TrendingUp },
    { id: 'goals', label: 'My Goals & KPIs', icon: CheckSquare },
    { id: 'trainings', label: 'My Trainings Catalog', icon: Bell },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg">
      <Header />

      {/* Mobile Nav Toggle Bar */}
      <div className="md:hidden bg-white border-b border-gray-150 px-4 py-3.5 flex items-center justify-between sticky top-[73px] z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-50 text-brand-navy border border-gray-200"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xs font-extrabold text-brand-navy uppercase tracking-wider">
            {employeeNavItems.find(item => item.id === activeTab)?.label}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1">
        {/* Persistent Left Sidebar - Desktop */}
        <aside className="hidden md:flex w-60 bg-white border-r border-gray-150 flex-col shrink-0 sticky top-[73px] h-[calc(100vh-73px)] z-20 py-6 overflow-y-auto">
          <div className="px-4 mb-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Employee Portal</span>
          </div>
          <nav className="flex-1 space-y-1">
            {employeeNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left py-3 px-4 flex items-center gap-3 transition-all cursor-pointer ${
                  activeTab === item.id 
                    ? 'bg-blue-50/60 border-l-4 border-brand-navy text-brand-navy font-extrabold' 
                    : 'border-l-4 border-transparent text-brand-gray hover:bg-gray-50 hover:text-brand-navy font-semibold'
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? 'text-brand-navy' : 'text-gray-400'}`} />
                <span className="text-xs tracking-wide">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Slide-over Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            
            <aside className="relative flex w-full max-w-xs flex-col bg-white py-4 shadow-xl border-r border-gray-100 h-full animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between px-4 pb-4 border-b border-gray-100 mb-4">
                <span className="text-sm font-extrabold text-brand-navy font-heading">Employee Portal</span>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="text-gray-500 hover:text-brand-navy p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <nav className="flex-1 overflow-y-auto space-y-1">
                {employeeNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full text-left py-3 px-4 flex items-center gap-3 transition-all cursor-pointer ${
                      activeTab === item.id 
                        ? 'bg-blue-50/60 border-l-4 border-brand-navy text-brand-navy font-extrabold' 
                        : 'border-l-4 border-transparent text-brand-gray hover:bg-gray-50 hover:text-brand-navy font-semibold'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? 'text-brand-navy' : 'text-gray-400'}`} />
                    <span className="text-xs tracking-wide">{item.label}</span>
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto pb-12">

        {/* Tab Content Panels */}
        <div className="flex-1 space-y-6">
          {/* Alerts center inside main content so it stays visible */}
          <div>
            {errorMsg && (
              <div className={`mb-4 rounded-lg bg-red-50 p-4 text-sm text-brand-red flex items-start justify-between gap-2.5 border border-red-100 transition-all duration-500 ease-in-out ${fadeError ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
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
              <div className={`mb-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 flex items-start justify-between gap-2.5 border border-emerald-100 transition-all duration-500 ease-in-out ${fadeSuccess ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
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
          </div>

          {/* TAB 1: Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Row 1: 3 equal-width columns */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daily Shift Logging Card */}
                <div className="bg-white premium-card p-6 border-l-4 border-l-brand-navy border-y border-r border-gray-150 relative overflow-hidden lg:col-span-1 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between rounded-2xl min-h-[240px]">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-base font-bold text-brand-navy font-heading">Daily Work Shift</h3>
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-brand-navy">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="bg-gray-50/60 p-2.5 rounded-lg border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Today's Date</p>
                        <p className="text-xs font-extrabold text-brand-navy mt-0.5">
                          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="bg-gray-50/60 p-2.5 rounded-lg border border-gray-100 flex flex-col justify-between min-h-[60px]">
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Check In</p>
                            <p className="text-sm font-extrabold text-brand-navy mt-0.5">
                              {todayRecord ? formatTime(todayRecord.checkInTime) : '--:--'}
                            </p>
                          </div>
                          {todayRecord && (
                            <div className="mt-1">
                              <span className={`text-[8px] font-extrabold px-1 py-0.25 rounded uppercase ${
                                todayRecord.status.includes('LATE') ? 'bg-red-100 text-brand-red' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {todayRecord.status.replace('_', ' ')}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="bg-gray-50/60 p-2.5 rounded-lg border border-gray-100 flex flex-col justify-between min-h-[60px]">
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Check Out</p>
                            <p className="text-sm font-extrabold text-brand-navy mt-0.5">
                              {todayRecord && todayRecord.checkOutTime ? formatTime(todayRecord.checkOutTime) : '--:--'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full">
                    {!todayRecord ? (
                      <button
                        onClick={handleCheckIn}
                        disabled={loadingAttendance}
                        className="w-full bg-brand-cta hover:bg-blue-700 hover:shadow-md text-white font-bold py-3 px-4 rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50 text-center btn-premium uppercase tracking-wider"
                      >
                        {loadingAttendance ? 'Processing...' : 'Check In Now'}
                      </button>
                    ) : !todayRecord.checkOutTime ? (
                      <button
                        onClick={handleCheckOut}
                        disabled={loadingAttendance}
                        className="w-full bg-brand-red hover:bg-red-700 hover:shadow-md text-white font-bold py-3 px-4 rounded-xl transition-all text-xs cursor-pointer disabled:opacity-50 text-center btn-premium uppercase tracking-wider"
                      >
                        {loadingAttendance ? 'Processing...' : 'Check Out Now'}
                      </button>
                    ) : (
                      <div className="w-full text-center bg-gray-100 text-gray-500 font-bold py-3 px-4 rounded-xl text-xs border border-gray-200 uppercase tracking-wider">
                        Shift Completed
                      </div>
                    )}
                  </div>
                </div>

                {/* Center Column: Stats panel widgets */}
                <div className="lg:col-span-1 grid grid-cols-2 gap-4">
                  <div className="bg-white premium-card p-4 border border-gray-150 text-center shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center min-h-[90px] rounded-xl">
                    <span className="block text-2xl font-extrabold text-brand-navy font-heading leading-tight">{stats.present}</span>
                    <span className="text-[10px] font-bold text-gray-400 mt-1 block uppercase tracking-wider">Presents</span>
                  </div>
                  <div className="bg-white premium-card p-4 border border-gray-150 text-center shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center min-h-[90px] rounded-xl">
                    <span className="block text-2xl font-extrabold text-brand-red font-heading leading-tight">{stats.late}</span>
                    <span className="text-[10px] font-bold text-gray-400 mt-1 block uppercase tracking-wider">Lates</span>
                  </div>
                  <div className="bg-white premium-card p-4 border border-gray-150 text-center shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center min-h-[90px] rounded-xl">
                    <span className="block text-2xl font-extrabold text-brand-maroon font-heading leading-tight">{stats.leave}</span>
                    <span className="text-[10px] font-bold text-gray-400 mt-1 block uppercase tracking-wider">Leaves</span>
                  </div>
                  <div className="bg-white premium-card p-4 border border-gray-150 text-center shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center min-h-[90px] rounded-xl">
                    <span className="block text-2xl font-extrabold text-brand-cta font-heading leading-tight">
                      {trackSheets.length > 0 
                        ? (trackSheets.reduce((sum, item) => sum + item.hours, 0) / trackSheets.length).toFixed(1)
                        : '0.0'}h
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 mt-1 block uppercase tracking-wider">Avg Hours</span>
                  </div>
                </div>

                {/* Right Column: Performance Health Gauge Card (Decreased to col-span-1) */}
                <div className="bg-white premium-card p-6 border border-gray-150 lg:col-span-1 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between min-h-[240px] rounded-2xl">
                  {(() => {
                    const displayRating = performanceScore?.rating || 'GREEN';
                    let displayScore = performanceScore?.autoScore ?? 100;
                    if (performanceScore?.manualOverride) {
                      displayScore = performanceScore.overrideScore !== null && performanceScore.overrideScore !== undefined
                        ? performanceScore.overrideScore
                        : (displayRating === 'RED' ? 20 : displayRating === 'YELLOW' ? 53 : displayRating === 'GREEN' ? 75 : 93);
                    }
                    return (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-bold text-brand-navy font-heading flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-brand-cta shrink-0" />
                            Performance
                          </h3>
                          {performanceScore && (
                            <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border shadow-sm ${
                              displayRating === 'BLUE' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              displayRating === 'GREEN' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                              displayRating === 'YELLOW' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              'bg-red-100 text-brand-red border-red-200'
                            }`}>
                              {displayRating} ({displayScore})
                            </span>
                          )}
                        </div>
                        <div className="flex justify-center flex-1 items-center pt-2">
                          {performanceScore ? (
                            <Speedometer score={displayScore} rating={displayRating} size={210} />
                          ) : (
                            <p className="text-xs text-gray-400">No score logged.</p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Row 2: Full width form */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Log Daily Work Hours form */}
                <div className="bg-white premium-card p-6 border border-gray-150 lg:col-span-3 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between rounded-2xl">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-brand-navy font-heading flex items-center gap-2">
                      <FileText className="w-5 h-5 text-brand-cta" />
                      Log Daily Work Hours
                    </h3>
                  </div>
                  <form onSubmit={handleSubmitTrackSheet} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Task / Project</label>
                        <input
                          type="text"
                          required
                          value={project}
                          onChange={(e) => setProject(e.target.value)}
                          placeholder="e.g. API Integration"
                          className="block w-full rounded-lg border border-gray-200 py-1.5 px-3 text-xs text-brand-gray bg-white outline-none focus:ring-1 focus:ring-brand-cta transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Hours Worked</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="24"
                          required
                          value={hours}
                          onChange={(e) => setHours(e.target.value)}
                          className="block w-full rounded-lg border border-gray-200 py-1.5 px-3 text-xs text-brand-gray bg-white outline-none focus:ring-1 focus:ring-brand-cta transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Task Assigned By</label>
                        <input
                          type="text"
                          required
                          value={assignedByName}
                          onChange={(e) => setAssignedByName(e.target.value)}
                          placeholder="e.g. TL Likith"
                          className="block w-full rounded-lg border border-gray-200 py-1.5 px-3 text-xs text-brand-gray bg-white outline-none focus:ring-1 focus:ring-brand-cta transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Task Description</label>
                      <textarea
                        required
                        rows={2}
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        placeholder="Explain task details..."
                        className="block w-full rounded-lg border border-gray-200 py-1.5 px-3 text-xs text-brand-gray bg-white outline-none focus:ring-1 focus:ring-brand-cta transition-all"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingTrack}
                        className="bg-brand-cta hover:bg-blue-700 hover:shadow-md text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer btn-premium"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {submittingTrack ? 'Saving...' : 'Submit Entry'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1.1: My Tasks Page */}
          {activeTab === 'tasks' && (
            <div className="bg-white premium-card p-6 border border-gray-150 shadow-md rounded-2xl space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-brand-navy font-heading flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-brand-cta" />
                  My Assigned Tasks
                </h3>
                <p className="text-xs text-gray-500 mt-1">View and complete tasks assigned to you by your Team Leader.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-1">
                {tasks.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    <CheckSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No tasks assigned to you currently.
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="p-4 rounded-xl border border-gray-150 bg-gray-50/50 hover:bg-white hover:shadow-md hover:border-gray-250 transition-all flex flex-col justify-between min-h-[160px]"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h4 className="text-sm font-bold text-brand-navy line-clamp-2">{task.title}</h4>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded shrink-0 uppercase tracking-wider ${
                            task.priority === 'HIGH' ? 'bg-red-100 text-brand-red border border-red-200' : 'bg-slate-100 text-slate-700'
                          }`}>{task.priority}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-3 leading-normal mb-4">{task.description}</p>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-xs text-gray-400 mt-auto">
                        <span className="font-medium">Due: {task.dueDate}</span>
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, task.status)}
                          disabled={task.status === 'COMPLETED'}
                          className={`font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            task.status === 'COMPLETED' 
                              ? 'bg-emerald-50 text-emerald-700 cursor-default' 
                              : 'bg-brand-cta text-white hover:bg-blue-700 shadow-sm'
                          }`}
                        >
                          {task.status === 'COMPLETED' ? 'Completed' : 'Start Task'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 1.2: My Track Sheets Page */}
          {activeTab === 'tracksheets' && (
            <div className="bg-white premium-card p-6 border border-gray-150 shadow-md rounded-2xl space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-brand-navy font-heading flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-cta" />
                  My Track Sheets Log
                </h3>
                <p className="text-xs text-gray-500 mt-1">Review your submitted work hours logs and their current approval status.</p>
              </div>

              <div className="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar-container pr-1">
                <table className="w-full table-fixed text-left text-xs relative border-collapse">
                  <thead className="sticky top-0 bg-white shadow-[0_1px_0_0_rgba(243,244,246,1)] z-10">
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider bg-white">
                      <th className="py-3 px-2 bg-white w-[100px]">Date</th>
                      <th className="py-3 px-2 bg-white w-[160px]">Task / Project</th>
                      <th className="py-3 px-2 bg-white w-[120px]">Assigned By</th>
                      <th className="py-3 px-2 bg-white">Description</th>
                      <th className="py-3 px-2 text-center bg-white w-[80px]">Hours</th>
                      <th className="py-3 px-2 text-center bg-white w-[100px]">Status</th>
                      <th className="py-3 px-2 text-center bg-white w-[80px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trackSheets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-400">
                          <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          No work logged yet. Use the Dashboard form to log work hours.
                        </td>
                      </tr>
                    ) : (
                      trackSheets.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-2 font-semibold text-brand-navy truncate">{item.date}</td>
                          <td className="py-3 px-2 font-semibold text-brand-navy break-words">{item.project}</td>
                          <td className="py-3 px-2 text-brand-navy font-medium truncate" title={item.assignedByName || 'N/A'}>
                            {item.assignedByName || '-'}
                          </td>
                          <td className="py-3 px-2 text-gray-500 break-words whitespace-normal leading-normal">{item.taskDescription}</td>
                          <td className="py-3 px-2 text-center font-extrabold text-brand-navy">{item.hours}h</td>
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-block px-2.5 py-0.75 rounded-full text-[9px] font-extrabold border ${
                              item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-250' :
                              item.status === 'REJECTED' ? 'bg-red-100 text-brand-red border-red-250' :
                              'bg-amber-100 text-amber-800 border-amber-250'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            {item.status === 'PENDING' ? (
                              <button
                                onClick={() => handleDeleteTrackSheet(item.id)}
                                className="text-brand-red hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-all cursor-pointer inline-flex items-center justify-center border border-transparent hover:border-red-100"
                                title="Delete Log"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            ) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: My Profile */}
          {activeTab === 'profile' && employeeProfile && (
            <div className="space-y-6">
              <div className="bg-white premium-card p-6 border border-gray-100">
                <div className="border-b border-gray-100 pb-4 mb-6">
                  <h3 className="text-lg font-bold text-brand-navy font-heading">My Professional Profile</h3>
                  <p className="text-xs text-gray-500 mt-1">Review your designation, department, and employment details set by HR.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Employee ID</span>
                    <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.id}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Department</span>
                    <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.department || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Designation</span>
                    <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.designation || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Date of Joining</span>
                    <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.dateOfJoining || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Employee Type</span>
                    <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.employeeType || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Work Shift</span>
                    <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.workShift || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Nationality</span>
                    <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.nationality || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Gender</span>
                    <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.gender || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Grade</span>
                    <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.grade || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Editable Personal Contact Fields */}
              <div className="bg-white premium-card p-6 border border-gray-100">
                <div className="border-b border-gray-100 pb-4 mb-6">
                  <h3 className="text-lg font-bold text-brand-navy font-heading">Personal Contact Details</h3>
                  <p className="text-xs text-gray-500 mt-1">Keep your contact information up-to-date.</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Mobile Number</label>
                      <input
                        type="text"
                        value={profileForm.mobileNumber}
                        onChange={(e) => setProfileForm({ ...profileForm, mobileNumber: e.target.value })}
                        className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-xs text-brand-gray bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Personal Email</label>
                      <input
                        type="email"
                        value={profileForm.personalEmail}
                        onChange={(e) => setProfileForm({ ...profileForm, personalEmail: e.target.value })}
                        className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-xs text-brand-gray bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Emergency Contact Number</label>
                      <input
                        type="text"
                        value={profileForm.emergencyContact}
                        onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                        className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-xs text-brand-gray bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Marital Status</label>
                      <select
                        value={profileForm.maritalStatus}
                        onChange={(e) => setProfileForm({ ...profileForm, maritalStatus: e.target.value })}
                        className="block w-full rounded-lg border border-gray-200 py-2 px-2.5 text-xs text-brand-gray bg-white outline-none"
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Current Address</label>
                      <input
                        type="text"
                        value={profileForm.currentAddress}
                        onChange={(e) => setProfileForm({ ...profileForm, currentAddress: e.target.value })}
                        className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-xs text-brand-gray bg-white outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Permanent Address</label>
                      <input
                        type="text"
                        value={profileForm.permanentAddress}
                        onChange={(e) => setProfileForm({ ...profileForm, permanentAddress: e.target.value })}
                        className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-xs text-brand-gray bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="bg-brand-cta hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-lg transition-colors cursor-pointer shadow-md"
                    >
                      Save Profile Changes
                    </button>
                  </div>
                </form>
              </div>

              {/* Financial/Regulatory Info (Read Only) */}
              <div className="bg-white premium-card p-6 border border-gray-100">
                <div className="border-b border-gray-100 pb-4 mb-6">
                  <h3 className="text-lg font-bold text-brand-navy font-heading">Financial & Bank Information</h3>
                  <p className="text-xs text-gray-500 mt-1">Details stored securely with field-level encryption. Contact HR to edit.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Bank Name</span>
                    <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.bankName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">IFSC Code</span>
                    <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.ifsc || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Permanent Account Number (PAN)</span>
                    <span className="text-sm font-bold text-brand-navy mt-0.5 block">
                      {employeeProfile.pan ? '••••••••••' : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Universal Account Number (UAN)</span>
                    <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.uan || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: My Leaves */}
          {activeTab === 'leaves' && (
            <div className="space-y-6">
              <div className="bg-white premium-card p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-cta" />
                  Leave Balances & Time-off Requests
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Balances grid */}
                  <div className="lg:col-span-2 space-y-4">
                    <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider">Leave Balance Status</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {leaveBalances.map((bal) => (
                        <div key={bal.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50">
                          <p className="text-xs font-bold text-brand-navy">{bal.name}</p>
                          <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] text-gray-500 font-semibold text-center">
                            <div className="bg-white p-1 rounded border border-gray-100">
                              <span className="block text-xs font-extrabold text-brand-navy">{bal.daysAllowed}</span>
                              Allotted
                            </div>
                            <div className="bg-white p-1 rounded border border-gray-100">
                              <span className="block text-xs font-extrabold text-brand-red">{bal.daysUsed}</span>
                              Used
                            </div>
                            <div className="bg-white p-1 rounded border border-gray-100">
                              <span className="block text-xs font-extrabold text-emerald-600">{bal.daysRemaining}</span>
                              Remaining
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Apply Form */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3 lg:col-span-1">
                    <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider">Request Time Off</h4>
                    <form onSubmit={handleSubmitLeaveRequest} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Leave Category</label>
                        <select
                          required
                          value={leaveTypeId}
                          onChange={(e) => setLeaveTypeId(e.target.value)}
                          className="block w-full rounded-lg border border-gray-200 py-1.5 px-2.5 text-xs text-brand-gray bg-white outline-none"
                        >
                          <option value="">Select leave type</option>
                          {leaveBalances.map((bal) => (
                            <option key={bal.id} value={bal.id}>
                              {bal.name} ({bal.daysRemaining} left)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Start Date</label>
                          <input
                            type="date"
                            required
                            value={leaveStartDate}
                            onChange={(e) => setLeaveStartDate(e.target.value)}
                            className="block w-full rounded-lg border border-gray-200 py-1 px-1.5 text-xs text-brand-gray bg-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">End Date</label>
                          <input
                            type="date"
                            required
                            value={leaveEndDate}
                            onChange={(e) => setLeaveEndDate(e.target.value)}
                            className="block w-full rounded-lg border border-gray-200 py-1 px-1.5 text-xs text-brand-gray bg-white outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Reason</label>
                        <textarea
                          required
                          rows={2}
                          value={leaveReason}
                          onChange={(e) => setLeaveReason(e.target.value)}
                          placeholder="State reason..."
                          className="block w-full rounded-lg border border-gray-200 py-1 px-1.5 text-xs text-brand-gray bg-white outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingLeave}
                        className="w-full bg-brand-cta text-white font-bold text-xs py-2 px-3 rounded-lg hover:bg-blue-700 transition-all cursor-pointer btn-premium shadow-md disabled:opacity-50"
                      >
                        {submittingLeave ? 'Submitting...' : 'Request Leave'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* History */}
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider mb-3">Leave Request History</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-2">Leave Type</th>
                          <th className="py-2.5 px-2">Duration</th>
                          <th className="py-2.5 px-2">Reason</th>
                          <th className="py-2.5 px-2 text-center">Status</th>
                          <th className="py-2.5 px-2">Reviewed By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {leaveRequests.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-4 text-gray-400">No leave requests found.</td>
                          </tr>
                        ) : (
                          leaveRequests.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50/50">
                              <td className="py-3 px-2 font-semibold text-brand-navy">{req.leaveType.name}</td>
                              <td className="py-3 px-2 text-gray-500 whitespace-nowrap">
                                {req.startDate} to {req.endDate}
                              </td>
                              <td className="py-3 px-2 text-gray-500 max-w-xs truncate" title={req.reason}>
                                {req.reason}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                  req.status === 'REJECTED' ? 'bg-red-100 text-brand-red' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-gray-500">
                                {req.reviewedBy ? req.reviewedBy.name : '-'}
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

          {/* TAB 4: My Payroll */}
          {activeTab === 'payroll' && (
            <div className="space-y-6">
              {/* Salary Structure Info */}
              {employeeProfile && (
                <div className="bg-white premium-card p-6 border border-gray-100">
                  <div className="border-b border-gray-100 pb-4 mb-4">
                    <h3 className="text-lg font-bold text-brand-navy font-heading">My Salary Structure Breakdown</h3>
                    <p className="text-xs text-gray-500 mt-1">Periodic salary structure values registered under your profile account.</p>
                  </div>
                  {/* Pull default values for structure if not explicitly set yet */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase">Basic Salary</span>
                      <span className="text-base font-extrabold text-brand-navy mt-1 block">
                        {(myPayrollRuns[0]?.basicSalary || 30000).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase">HRA Allowance</span>
                      <span className="text-base font-extrabold text-brand-navy mt-1 block">
                        {(myPayrollRuns[0]?.hra || 12000).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase">Conveyance</span>
                      <span className="text-base font-extrabold text-brand-navy mt-1 block">
                        {(myPayrollRuns[0]?.conveyance || 3000).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase">Special Allowance</span>
                      <span className="text-base font-extrabold text-brand-navy mt-1 block">
                        {(myPayrollRuns[0]?.specialAllowance || 5000).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* My Payslips Table */}
              <div className="bg-white premium-card p-6 border border-gray-100">
                <div className="border-b border-gray-100 pb-4 mb-4">
                  <h3 className="text-lg font-bold text-brand-navy font-heading">My Monthly Payslips</h3>
                  <p className="text-xs text-gray-500 mt-1">Download official digital Excel/PDF payslip documents generated by the HR payroll system.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-2">Pay Period</th>
                        <th className="py-3 px-2 text-right">Gross Earnings (INR)</th>
                        <th className="py-3 px-2 text-right">Deductions (INR)</th>
                        <th className="py-3 px-2 text-right">Net Salary (INR)</th>
                        <th className="py-3 px-2 text-center">Status</th>
                        <th className="py-3 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {myPayrollRuns.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-gray-400">No payslips released in system.</td>
                        </tr>
                      ) : (
                        myPayrollRuns.map((run) => (
                          <tr key={run.id} className="hover:bg-gray-50/50">
                            <td className="py-3 px-2 font-bold text-brand-navy">
                              {new Date(run.periodStart).toLocaleDateString(undefined, {month:'long', year:'numeric'})}
                            </td>
                            <td className="py-3 px-2 text-right text-gray-500 font-semibold">
                              {run.grossEarnings.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                            </td>
                            <td className="py-3 px-2 text-right text-gray-500">
                              {run.totalDeductions.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                            </td>
                            <td className="py-3 px-2 text-right font-extrabold text-brand-navy">
                              {run.netSalary.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                                {run.status}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <a
                                href={`/api/payroll/runs/export?id=${run.id}`}
                                download
                                className="inline-block bg-brand-cta hover:bg-blue-700 text-white font-bold px-3 py-1 rounded text-[10px]"
                              >
                                Download Payslip
                              </a>
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

          {/* TAB 5: My Goals */}
          {activeTab === 'goals' && (
            <div className="bg-white premium-card p-6 border border-gray-100">
              <div className="border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-lg font-bold text-brand-navy font-heading">Performance Goals & KPI Targets</h3>
                <p className="text-xs text-gray-500 mt-1">Review active objectives, submit accomplishments, and review manager reviews.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myGoals.length === 0 ? (
                  <p className="col-span-2 text-xs text-gray-400 py-6 text-center">No goals assigned for this appraisal cycle.</p>
                ) : (
                  myGoals.map((goal) => (
                    <div key={goal.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-all flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-bold text-brand-navy">{goal.goalTitle}</h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            goal.status === 'HR_REVIEWED' ? 'bg-purple-100 text-purple-800' :
                            goal.status === 'MANAGER_APPROVED' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>{goal.status}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2"><strong>KPI:</strong> {goal.kpi}</p>
                        <p className="text-xs text-gray-500 mt-1"><strong>Target Metric:</strong> {goal.target}</p>
                        <p className="text-xs text-gray-500 mt-1"><strong>Appraisal Period:</strong> {goal.period}</p>
                        <p className="text-xs text-gray-500 mt-1"><strong>Goal Weight:</strong> {goal.weight}%</p>
                        {goal.achievement && (
                          <div className="mt-3 p-2 bg-white rounded border border-gray-100 text-xs">
                            <span className="font-bold block text-[10px] text-gray-400">Accomplishment description:</span>
                            {goal.achievement}
                          </div>
                        )}
                        {goal.rating && (
                          <p className="text-xs font-bold text-brand-cta mt-2">Manager Rating: {goal.rating} / 5.0</p>
                        )}
                      </div>

                      {goal.status !== 'HR_REVIEWED' && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGoal(goal);
                              setAchievementInput(goal.achievement || '');
                              setIsGoalModalOpen(true);
                            }}
                            className="bg-brand-cta hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg w-full text-center transition-colors cursor-pointer"
                          >
                            Update Accomplishments
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: Trainings Catalog */}
          {activeTab === 'trainings' && (
            <div className="bg-white premium-card p-6 border border-gray-100">
              <div className="border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-lg font-bold text-brand-navy font-heading">My Training Courses & Certifications</h3>
                <p className="text-xs text-gray-500 mt-1">View specialized training sessions assigned to you and check certification status.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myTrainings.length === 0 ? (
                  <p className="col-span-2 text-xs text-gray-400 py-6 text-center">No trainings assigned at this time.</p>
                ) : (
                  myTrainings.map((assign) => (
                    <div key={assign.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-brand-navy">{assign.training.trainingName}</h4>
                          <span className="text-[10px] text-gray-400 block mt-0.5">Trainer: {assign.training.trainer}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          assign.certified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {assign.certified ? 'Certified' : 'Registered'}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 space-y-1">
                        <p><strong>Scheduled Date:</strong> {new Date(assign.training.plannedDate).toLocaleDateString()}</p>
                        <p><strong>Duration Hours:</strong> {assign.training.durationHours} hours</p>
                        <p><strong>Attended:</strong> {assign.attended ? 'Yes' : 'No'}</p>
                        {assign.assessmentScore !== null && (
                          <p><strong>Assessment Score:</strong> <span className="font-bold text-brand-navy">{assign.assessmentScore}%</span></p>
                        )}
                        {assign.feedback && (
                          <div className="p-2 bg-white rounded border border-gray-100 text-[11px] italic mt-2">
                            "Feedback: {assign.feedback}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>

      {/* Goal Accomplishment Submission Modal */}
      {isGoalModalOpen && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <h3 className="text-lg font-bold text-brand-navy font-heading">Record Goal Accomplishments</h3>
            <p className="text-xs text-gray-500">Provide details on what you accomplished toward this objective: <strong>{selectedGoal.goalTitle}</strong>.</p>

            <form onSubmit={handleUpdateGoalAchievement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Accomplishments / Deliverables</label>
                <textarea
                  required
                  rows={4}
                  value={achievementInput}
                  onChange={(e) => setAchievementInput(e.target.value)}
                  placeholder="E.g., I reduced the bundle size from 500kb to 380kb, updated dependencies, and implemented code split bundles..."
                  className="block w-full rounded-lg border border-gray-200 py-2.5 px-3 text-xs text-brand-gray bg-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsGoalModalOpen(false);
                    setSelectedGoal(null);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-brand-navy font-bold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-cta hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer btn-premium shadow-md"
                >
                  Submit for Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
