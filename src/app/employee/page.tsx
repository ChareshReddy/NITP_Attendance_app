'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  User,
  LayoutDashboard,
  CreditCard,
  GraduationCap,
  LogOut,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Speedometer from '@/components/Speedometer';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to capitalize employee name and ensure Surname is last
export function formatEmployeeName(nameVal: string | null | undefined): string {
  if (!nameVal) return '-';
  const capitalized = nameVal
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  const parts = capitalized.split(' ');
  if (parts.length > 1 && parts[0].length === 1) {
    const initial = parts.shift();
    parts.push(initial!);
    return parts.join(' ');
  }
  return capitalized;
}

// Timezone-safe Indian date formatting
export function formatDateToIndian(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return '-';
  if (typeof dateVal === 'string' && dateVal.includes('-') && dateVal.length <= 10) {
    const parts = dateVal.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      if (parts[2].length === 4) return dateVal;
    }
  }
  const date = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  if (isNaN(date.getTime())) return typeof dateVal === 'string' ? dateVal : '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// CountUp animations for stats
function CountUp({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let start = 0;
    const end = value;
    if (start === end) return;
    const duration = 800;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = progress * (2 - progress);
      const current = Math.floor(easedProgress * (end - start) + start);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayValue(end);
      }
    };
    requestAnimationFrame(update);
  }, [value]);

  return <>{mounted ? displayValue : value}</>;
}

function CountUpFloat({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let start = 0.0;
    const end = value;
    if (start === end) return;
    const duration = 800;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = progress * (2 - progress);
      const current = easedProgress * (end - start) + start;
      setDisplayValue(Number(current.toFixed(1)));

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayValue(end);
      }
    };
    requestAnimationFrame(update);
  }, [value]);

  return <>{mounted ? displayValue.toFixed(1) : value.toFixed(1)}</>;
}

// Framer motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
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
  financialDocuments?: string | null;
  professionalEmail?: string | null;
  insuranceNumber?: string | null;
  expectedEndDate?: string | Date | null;
  incrementPerks?: string | null;
  profileImage?: string | null;
  bankBranch?: string | null;
  bankAddress?: string | null;
  pfNumber?: string | null;
  bloodGroup?: string | null;
  timezone?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
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
  createdAt?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Session & States
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [timeStr, setTimeStr] = useState('');
  const [greeting, setGreeting] = useState('');
  const [isLogExpanded, setIsLogExpanded] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      const hrs = now.getHours();
      if (hrs < 12) setGreeting('Good morning');
      else if (hrs < 17) setGreeting('Good afternoon');
      else setGreeting('Good evening');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['dashboard', 'tasks', 'tracksheets', 'profile', 'leaves', 'payroll', 'trainings', 'history', 'resignation'].includes(tab)) {
        setActiveTab(tab as any);
      }
    }
  }, []);

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'tracksheets' | 'profile' | 'leaves' | 'payroll' | 'trainings' | 'history' | 'resignation'>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Collapsible Profile Sections
  const [openProfileSections, setOpenProfileSections] = useState({
    professional: true,
    contact: false,
    financial: false,
  });

  const formatToTitleCase = (str: string | null | undefined): string => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(/[\s_]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Calendar History States
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [selectedTrackSheet, setSelectedTrackSheet] = useState<any | null>(null);
  const [uploadingTaskDoc, setUploadingTaskDoc] = useState(false);
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfile | null>(null);
  const [resignationRequest, setResignationRequest] = useState<any>(null);
  const [resignationDate, setResignationDate] = useState('');
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [resignationReason, setResignationReason] = useState('');
  const [submittingResignation, setSubmittingResignation] = useState(false);

  const [regularisationRequests, setRegularisationRequests] = useState<any[]>([]);
  const [regDate, setRegDate] = useState('');
  const [regCheckIn, setRegCheckIn] = useState('');
  const [regCheckOut, setRegCheckOut] = useState('');
  const [regReason, setRegReason] = useState('');
  const [submittingReg, setSubmittingReg] = useState(false);
  const [profileForm, setProfileForm] = useState({
    mobileNumber: '',
    personalEmail: '',
    emergencyContact: '',
    currentAddress: '',
    permanentAddress: '',
    maritalStatus: 'Single',
    professionalEmail: '',
    insuranceNumber: '',
    bloodGroup: '',
    timezone: 'Asia/Kolkata',
    profileImage: '',
  });
  const [myPayrollRuns, setMyPayrollRuns] = useState<PayrollRun[]>([]);
  const [myTrainings, setMyTrainings] = useState<TrainingAssignment[]>([]);

  // Form States
  const [logItems, setLogItems] = useState<Array<{
    project: string;
    taskDescription: string;
    hours: string;
    notes: string;
    assignedByName: string;
  }>>([{ project: '', taskDescription: '', hours: '8.0', notes: '', assignedByName: '' }]);

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
        setHolidays(attData.holidays || []);
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
            professionalEmail: profileData.profile.professionalEmail || '',
            insuranceNumber: profileData.profile.insuranceNumber || '',
            bloodGroup: profileData.profile.bloodGroup || '',
            timezone: profileData.profile.timezone || 'Asia/Kolkata',
            profileImage: profileData.profile.profileImage || '',
          });
        }
      }

      // 8. Fetch Employee Payroll Runs
      const payrollRes = await fetch('/api/payroll/runs');
      if (payrollRes.ok) {
        const payrollData = await payrollRes.json();
        setMyPayrollRuns(payrollData.runs || []);
      }



      // 10. Fetch Employee Training assignments
      const trainingRes = await fetch('/api/trainings');
      if (trainingRes.ok) {
        const trainingData = await trainingRes.json();
        setMyTrainings(trainingData.assignments || []);
      }

      // 11. Fetch Resignation request
      const resignationRes = await fetch('/api/resignation');
      if (resignationRes.ok) {
        const resignationData = await resignationRes.json();
        setResignationRequest(resignationData.request || null);
      }

      // 12. Fetch Regularisation requests
      const regularisationRes = await fetch('/api/regularisation');
      if (regularisationRes.ok) {
        const regularisationData = await regularisationRes.json();
        setRegularisationRequests(regularisationData.requests || []);
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
      const payload = logItems.map(item => ({
        ...item,
        date: todayStr
      }));

      const res = await fetch('/api/tracksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log hours');

      setSuccessMsg('Track sheet entries created successfully!');
      setLogItems([{ project: '', taskDescription: '', hours: '8.0', notes: '', assignedByName: '' }]);
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

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setErrorMsg('');
    setSuccessMsg('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dest', 'profiles');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setProfileForm(prev => ({ ...prev, profileImage: data.url }));
        
        // Save the updated profile image immediately to the database
        await fetch('/api/users/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...profileForm,
            profileImage: data.url,
            userId: employeeProfile?.userId,
          }),
        });

        setSuccessMsg('Profile image updated successfully!');
        
        // Dispatch custom event to notify Header
        window.dispatchEvent(new CustomEvent('profileImageUpdated', { detail: data.url }));
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload profile image.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading file.');
    } finally {
      setUploadingImage(false);
    }
  };

  const [uploadingDoc, setUploadingDoc] = useState(false);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    setErrorMsg('');
    setSuccessMsg('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dest', 'financial');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const uploadResult = await res.json();
        let docs = [];
        try {
          docs = employeeProfile?.financialDocuments ? JSON.parse(employeeProfile.financialDocuments) : [];
          if (!Array.isArray(docs)) docs = [];
        } catch {
          docs = [];
        }
        const newDoc = {
          name: file.name,
          url: uploadResult.url,
          uploadedAt: new Date().toISOString()
        };
        const updatedDocs = [...docs, newDoc];
        
        const saveRes = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            financialDocuments: JSON.stringify(updatedDocs),
            userId: employeeProfile?.userId,
          })
        });
        if (saveRes.ok) {
          setSuccessMsg('Financial document uploaded successfully!');
          fetchData();
        } else {
          const saveErr = await saveRes.json();
          throw new Error(saveErr.error || 'Failed to save document metadata.');
        }
      } else {
        const uploadErr = await res.json();
        throw new Error(uploadErr.error || 'Failed to upload document file.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDocumentDelete = async (docIndex: number) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      let docs = [];
      try {
        docs = employeeProfile?.financialDocuments ? JSON.parse(employeeProfile.financialDocuments) : [];
        if (!Array.isArray(docs)) docs = [];
      } catch {
        docs = [];
      }
      docs.splice(docIndex, 1);
      
      const saveRes = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financialDocuments: JSON.stringify(docs),
          userId: employeeProfile?.userId,
        })
      });
      if (saveRes.ok) {
        setSuccessMsg('Document deleted successfully!');
        fetchData();
      } else {
        const saveErr = await saveRes.json();
        throw new Error(saveErr.error || 'Failed to delete document.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting document.');
    }
  };

  const handleTaskDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTrackSheet) return;
    setUploadingTaskDoc(true);
    setErrorMsg('');
    setSuccessMsg('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dest', 'tasks');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const uploadResult = await res.json();
        let docs = [];
        try {
          docs = selectedTrackSheet.supportingDocuments ? JSON.parse(selectedTrackSheet.supportingDocuments) : [];
          if (!Array.isArray(docs)) docs = [];
        } catch {
          docs = [];
        }
        const newDoc = {
          name: file.name,
          url: uploadResult.url,
          uploadedAt: new Date().toISOString()
        };
        const updatedDocs = [...docs, newDoc];
        
        const saveRes = await fetch('/api/tracksheets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedTrackSheet.id,
            supportingDocuments: JSON.stringify(updatedDocs)
          })
        });
        if (saveRes.ok) {
          const saveResult = await saveRes.json();
          setSuccessMsg('Supporting document uploaded successfully!');
          setSelectedTrackSheet(saveResult.trackSheet);
          fetchData();
        } else {
          const saveErr = await saveRes.json();
          throw new Error(saveErr.error || 'Failed to save document metadata.');
        }
      } else {
        const uploadErr = await res.json();
        throw new Error(uploadErr.error || 'Failed to upload document file.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading document.');
    } finally {
      setUploadingTaskDoc(false);
    }
  };

  const handleTaskDocDelete = async (docIndex: number) => {
    if (!selectedTrackSheet) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      let docs = [];
      try {
        docs = selectedTrackSheet.supportingDocuments ? JSON.parse(selectedTrackSheet.supportingDocuments) : [];
        if (!Array.isArray(docs)) docs = [];
      } catch {
        docs = [];
      }
      docs.splice(docIndex, 1);
      
      const saveRes = await fetch('/api/tracksheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTrackSheet.id,
          supportingDocuments: JSON.stringify(docs)
        })
      });
      if (saveRes.ok) {
        const saveResult = await saveRes.json();
        setSuccessMsg('Document deleted successfully!');
        setSelectedTrackSheet(saveResult.trackSheet);
        fetchData();
      } else {
        const saveErr = await saveRes.json();
        throw new Error(saveErr.error || 'Failed to delete document.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting document.');
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

  const handleSubmitResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingResignation(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/resignation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resignationDate,
          lastWorkingDay,
          reason: resignationReason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit resignation request');
      setSuccessMsg('Your resignation request has been submitted successfully!');
      setResignationReason('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting resignation');
    } finally {
      setSubmittingResignation(false);
    }
  };

  const handleSubmitRegularisation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReg(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/regularisation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: regDate,
          checkInTime: regCheckIn || null,
          checkOutTime: regCheckOut || null,
          reason: regReason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit regularisation request');
      setSuccessMsg('Regularisation request submitted successfully!');
      setRegDate('');
      setRegCheckIn('');
      setRegCheckOut('');
      setRegReason('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting regularisation');
    } finally {
      setSubmittingReg(false);
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
    id: 'dashboard' | 'tasks' | 'tracksheets' | 'profile' | 'leaves' | 'payroll' | 'trainings' | 'history' | 'resignation';
    label: string;
    icon: any;
  }[] = [
    { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'tracksheets', label: 'My Track Sheets', icon: FileText },
    { id: 'leaves', label: 'My Leaves & Requests', icon: Calendar },
    { id: 'history', label: 'My Attendance History', icon: History },
    { id: 'payroll', label: 'My Payroll & Payslip', icon: CreditCard },
    { id: 'trainings', label: 'My Trainings', icon: GraduationCap },
    { id: 'resignation', label: 'Resignation', icon: LogOut },
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
          <span className="text-xs font-extrabold text-brand-navy uppercase tracking-wider">
            {employeeNavItems.find(item => item.id === activeTab)?.label}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1">
        {/* Persistent Left Sidebar - Desktop */}
        <aside className="hidden md:flex w-20 hover:w-60 bg-white flex-col shrink-0 sticky top-[73px] h-[calc(100vh-73px)] z-20 py-6 overflow-y-auto transition-all duration-300 ease-in-out group shadow-sm border-r border-gray-200">
          <nav className="flex-1 space-y-1 px-2 relative">
            {employeeNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left py-3 px-4 flex items-center relative transition-all cursor-pointer rounded-xl ${
                    isActive 
                      ? 'text-brand-navy font-bold' 
                      : 'text-slate-600 hover:text-brand-navy hover:bg-slate-50'
                  }`}
                >
                  {/* Animated sliding highlight background pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
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
                <span className="text-sm font-extrabold text-brand-navy font-heading">Employee Portal</span>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
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
            <motion.div 
              initial="hidden"
              animate="show"
              variants={containerVariants}
              className="space-y-6"
            >
              {/* Top Row: Hero and Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Daily Shift Logging Card (Hero Card - Spans 2 Columns) */}
                <motion.div 
                  variants={cardVariants}
                  className="premium-card card-accent-blue p-4 relative overflow-hidden lg:col-span-2 flex flex-col justify-between min-h-[200px]"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3 pb-3 border-b border-gray-150/40">
                    <div>
                      <h2 className="text-xl font-extrabold text-brand-navy font-heading tracking-tight">
                        {greeting}, {employeeProfile?.user?.name || 'Member'}!
                      </h2>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-brand-navy/5 px-3 py-1.5 rounded-2xl border border-brand-navy/10">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-mono text-xs font-extrabold text-brand-navy tracking-wider">
                        {timeStr || '--:--:--'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50/75 p-2 rounded-2xl border border-slate-200/50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold tracking-wider">Check In Time</p>
                        <p className="text-xs font-extrabold text-brand-navy mt-0.5">
                          {todayRecord ? formatTime(todayRecord.checkInTime) : '--:--'}
                        </p>
                        {todayRecord && (
                          <span className={`inline-block mt-0.5 text-[7px] font-extrabold px-1 py-0.25 rounded-md border ${
                            todayRecord.status.includes('LATE') ? 'bg-red-50 text-brand-red border-red-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                          }`}>
                            {formatToTitleCase(todayRecord.status)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50/75 p-2 rounded-2xl border border-slate-200/50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-cta">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold tracking-wider">Check Out Time</p>
                        <p className="text-xs font-extrabold text-brand-navy mt-0.5">
                          {todayRecord && todayRecord.checkOutTime ? formatTime(todayRecord.checkOutTime) : '--:--'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full space-y-2">
                    {todayRecord && todayRecord.checkOutTime ? (
                      <div className="w-full text-center bg-emerald-50 text-emerald-800 font-extrabold py-2 px-3 rounded-xl text-[11px] border border-emerald-200/50 tracking-wider flex items-center justify-center gap-2 animate-in fade-in duration-300">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Shift Completed
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={handleCheckIn}
                          disabled={loadingAttendance || !!todayRecord}
                          className={`flex-1 font-bold py-2 px-3 rounded-xl transition-all text-[11px] text-center tracking-wider flex items-center justify-center gap-2 ${
                            (!todayRecord && !loadingAttendance)
                              ? 'bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/20 text-white cursor-pointer btn-premium'
                              : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                          {loadingAttendance && !todayRecord ? 'Processing...' : 'Check In'}
                        </button>

                        <button
                          onClick={handleCheckOut}
                          disabled={loadingAttendance || !todayRecord || !!todayRecord.checkOutTime}
                          className={`flex-1 font-bold py-2 px-3 rounded-xl transition-all text-[11px] text-center tracking-wider flex items-center justify-center gap-2 ${
                            (todayRecord && !todayRecord.checkOutTime && !loadingAttendance)
                              ? 'bg-brand-red hover:bg-red-700 hover:shadow-lg hover:shadow-brand-red/20 text-white cursor-pointer btn-premium'
                              : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                          {loadingAttendance && todayRecord && !todayRecord.checkOutTime ? 'Processing...' : 'Check Out'}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Right Column: Performance Health Gauge Card */}
                <motion.div 
                  variants={cardVariants}
                  className="premium-card p-4 lg:col-span-1 transition-all duration-300 flex flex-col justify-between min-h-[200px] relative overflow-hidden"
                >
                  {/* Subtle soft brand-color glow ring behind it */}
                  <div className="glow-ring-soft w-48 h-48 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 bg-blue-400/20 blur-3xl rounded-full" />
                  
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
                        <div className="flex justify-between items-center mb-2 z-10">
                          <h3 className="text-sm font-bold text-brand-navy font-heading flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-brand-cta shrink-0" />
                            Performance
                          </h3>
                          {performanceScore && (
                            <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full border shadow-xs ${
                              displayRating === 'BLUE' ? 'bg-blue-50 text-blue-700 border-blue-200/60' :
                              displayRating === 'GREEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                              displayRating === 'YELLOW' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
                              'bg-red-50 text-brand-red border-red-200/60'
                            }`}>
                              {displayRating === 'BLUE' ? 'Excellent' :
                               displayRating === 'GREEN' ? 'Good' :
                               displayRating === 'YELLOW' ? 'Average' :
                               'Needs Improvement'} ({displayScore})
                            </span>
                          )}
                        </div>
                        <div className="flex justify-center flex-1 items-center pt-2 z-10">
                          {performanceScore ? (
                            <Speedometer score={displayScore} rating={displayRating} size={240} />
                          ) : (
                            <p className="text-xs text-gray-400">No score logged.</p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              </div>

              {/* Middle Row: Horizontal Stat-Strip */}
              <motion.div 
                variants={cardVariants}
                className="premium-card p-3 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-250/40"
              >
                {/* Presents Stat */}
                <div className="flex items-center gap-2 justify-center py-1 md:py-0 md:px-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block text-lg font-extrabold font-mono text-brand-navy leading-none">
                      <CountUp value={stats.present} />
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 mt-0.5 block uppercase tracking-wider">Presents</span>
                  </div>
                </div>

                {/* Lates Stat */}
                <div className="flex items-center gap-2 justify-center py-1 md:py-0 md:px-4">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-brand-red shrink-0 shadow-xs">
                    <TrendingUp className="w-4 h-4 rotate-90" />
                  </div>
                  <div className="text-left">
                    <span className="block text-lg font-extrabold font-mono text-brand-red leading-none">
                      <CountUp value={stats.late} />
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 mt-0.5 block uppercase tracking-wider">Lates</span>
                  </div>
                </div>

                {/* Leaves Stat */}
                <div className="flex items-center gap-2 justify-center py-1 md:py-0 md:px-4">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0 shadow-xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block text-lg font-extrabold font-mono text-brand-maroon leading-none">
                      <CountUp value={stats.leave} />
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 mt-0.5 block uppercase tracking-wider">Leaves</span>
                  </div>
                </div>

                {/* Avg Hours Stat */}
                <div className="flex items-center gap-2 justify-center py-1 md:py-0 md:px-4">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-cta shrink-0 shadow-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block text-lg font-extrabold font-mono text-brand-navy leading-none">
                      {(() => {
                        const currentMonthPrefix = new Date().toLocaleDateString('en-CA').slice(0, 7);
                        const monthlyTrack = trackSheets.filter(t => t.date.startsWith(currentMonthPrefix));
                        const val = monthlyTrack.length > 0 
                          ? Number((monthlyTrack.reduce((sum, item) => sum + item.hours, 0) / monthlyTrack.length).toFixed(1))
                          : 0.0;
                        return <CountUpFloat value={val} />;
                      })()}
                      <span className="text-xs font-semibold">h</span>
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 mt-0.5 block uppercase tracking-wider">Avg Hours</span>
                  </div>
                </div>
              </motion.div>

              {/* Bottom Row: Collapsible Daily Work Hours form */}
              <motion.div 
                variants={cardVariants}
                className="premium-card p-4 transition-all duration-300"
              >
                <button
                  onClick={() => setIsLogExpanded(!isLogExpanded)}
                  className="w-full flex justify-between items-center outline-none cursor-pointer"
                >
                  <h3 className="text-base font-bold text-brand-navy font-heading flex items-center gap-2">
                    <FileText className="w-5 h-5 text-brand-cta" />
                    Log Daily Work Hours
                  </h3>
                  <span className="text-xs font-bold text-brand-cta hover:underline">
                    {isLogExpanded ? 'Collapse Form' : 'Expand Form'}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isLogExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <form onSubmit={handleSubmitTrackSheet} className="space-y-3 pt-1">
                        {logItems.map((item, index) => (
                          <div key={index} className="p-3 bg-slate-50/50 border border-slate-200/60 rounded-xl space-y-2 relative mb-3">
                            {logItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setLogItems(logItems.filter((_, i) => i !== index))}
                                className="absolute top-2 right-2 text-brand-red hover:text-red-700 cursor-pointer"
                                title="Remove Task Row"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Task / Project</label>
                                <input
                                  type="text"
                                  required
                                  value={item.project}
                                  onChange={(e) => {
                                    const updated = [...logItems];
                                    updated[index].project = e.target.value;
                                    setLogItems(updated);
                                  }}
                                  placeholder="e.g. API Integration"
                                  className="block w-full futuristic-input py-1.5 px-2.5 text-xs text-brand-gray"
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
                                  value={item.hours}
                                  onChange={(e) => {
                                    const updated = [...logItems];
                                    updated[index].hours = e.target.value;
                                    setLogItems(updated);
                                  }}
                                  className="block w-full futuristic-input py-1.5 px-2.5 text-xs text-brand-gray"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Task Assigned By</label>
                                <input
                                  type="text"
                                  required
                                  value={item.assignedByName}
                                  onChange={(e) => {
                                    const updated = [...logItems];
                                    updated[index].assignedByName = e.target.value;
                                    setLogItems(updated);
                                  }}
                                  placeholder="e.g. TL Likith"
                                  className="block w-full futuristic-input py-1.5 px-2.5 text-xs text-brand-gray"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Task Description</label>
                                <input
                                  type="text"
                                  required
                                  value={item.taskDescription}
                                  onChange={(e) => {
                                    const updated = [...logItems];
                                    updated[index].taskDescription = e.target.value;
                                    setLogItems(updated);
                                  }}
                                  placeholder="Explain task details..."
                                  className="block w-full futuristic-input py-1.5 px-2.5 text-xs text-brand-gray"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="flex justify-end gap-2 items-center">
                          <button
                            type="button"
                            onClick={() => setLogItems([...logItems, { project: '', taskDescription: '', hours: '8.0', notes: '', assignedByName: '' }])}
                            className="bg-slate-100 hover:bg-slate-200 text-brand-navy border border-slate-200 font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3 h-3" />
                            Add Row
                          </button>
                          <button
                            type="submit"
                            disabled={submittingTrack}
                            className="bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer btn-premium shadow-sm"
                          >
                            {submittingTrack ? 'Saving...' : 'Submit logs'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}

          {/* TAB 1.1: My Tasks Page */}
          {activeTab === 'tasks' && (
            <div className="premium-card p-6 space-y-6">
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
            <div className="premium-card p-6 space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-brand-navy font-heading flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-cta" />
                  My Track Sheets Log
                </h3>
                <p className="text-xs text-gray-500 mt-1">Review your submitted work hours logs and their current approval status.</p>
              </div>

              <div className="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar-container pr-1">
                <table className="w-full table-fixed text-left text-xs relative border-collapse">
                  <thead className="sticky top-0 bg-slate-100/70 backdrop-blur-xs text-slate-700 font-bold z-10">
                    <tr className="border-b border-gray-200/50 text-gray-500 font-bold tracking-wider">
                      <th className="py-3 px-2 w-[100px] bg-transparent">Date</th>
                      <th className="py-3 px-2 w-[160px] bg-transparent">Task / Project</th>
                      <th className="py-3 px-2 w-[120px] bg-transparent">Assigned By</th>
                      <th className="py-3 px-2 bg-transparent">Description</th>
                      <th className="py-3 px-2 text-center w-[80px] bg-transparent">Hours</th>
                      <th className="py-3 px-2 text-center w-[100px] bg-transparent">Status</th>
                      <th className="py-3 px-2 text-center w-[80px] bg-transparent">Action</th>
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
                        <tr 
                          key={item.id} 
                          className="hover:bg-gray-50/50 cursor-pointer"
                          onClick={() => setSelectedTrackSheet(item)}
                        >
                          <td className="py-3 px-2 font-semibold text-brand-navy truncate">{formatDateToIndian(item.date)}</td>
                          <td className="py-3 px-2 font-semibold text-brand-navy break-words">{item.project}</td>
                          <td className="py-3 px-2 text-brand-navy font-medium truncate" title={item.assignedByName || 'N/A'}>
                            {formatEmployeeName(item.assignedByName)}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTrackSheet(item.id);
                                }}
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
              <div className="premium-card p-0 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenProfileSections(prev => ({ ...prev, professional: !prev.professional }))}
                  className="w-full flex items-center justify-between px-6 py-4 bg-brand-navy hover:bg-brand-navy-light transition-all text-left font-bold text-white cursor-pointer outline-none border-b border-brand-navy-light"
                >
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white font-heading">My Professional Profile</h2>
                    <p className="text-[10px] text-slate-200 font-normal mt-0.5">Review your designation, department, and employment details set by HR.</p>
                  </div>
                  {openProfileSections.professional ? (
                    <ChevronUp className="w-4 h-4 text-white shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white shrink-0" />
                  )}
                </button>

                {openProfileSections.professional && (
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      {/* Left: 4-Column Fields Grid */}
                      <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400">Employee ID</span>
                          <span className="text-sm font-bold text-brand-navy mt-0.5 block">
                            {employeeProfile.id.length > 15 ? 'NITP00021' : employeeProfile.id}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400">Department</span>
                          <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.department || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400">Designation</span>
                          <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.designation || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400">Date of Joining</span>
                          <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.dateOfJoining || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400">Employee Type</span>
                          <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.employeeType || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400">Work Shift</span>
                          <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.workShift || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400">Nationality</span>
                          <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.nationality || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400">Gender</span>
                          <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.gender || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400">Insurance Number</span>
                          <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.insuranceNumber || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400">Expected End Date</span>
                          <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.expectedEndDate ? formatDateToIndian(employeeProfile.expectedEndDate) : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400">Increment / Perks</span>
                          <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.incrementPerks || 'N/A'}</span>
                        </div>
                        <div>
                          {/* Empty placeholder for grid balance */}
                        </div>
                      </div>

                      {/* Right: Portrait Aspect Ratio Profile Photo (Centered Vertically) */}
                      <div className="relative group shrink-0 self-center md:ml-4 flex flex-col items-center">
                        {profileForm.profileImage ? (
                          <img 
                            src={profileForm.profileImage} 
                            alt="Profile Picture" 
                            className="w-28 h-36 rounded-xl object-cover border border-gray-250 shadow-sm"
                          />
                        ) : (
                          <div className="w-28 h-36 rounded-xl bg-slate-100 border border-gray-250 flex items-center justify-center text-brand-navy/60 shadow-sm">
                            <User className="w-12 h-12" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-1.5 right-1.5 p-1.5 rounded-full bg-brand-cta text-white hover:bg-blue-700 shadow-md border border-white cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
                          title="Change Profile Picture"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        {uploadingImage && (
                          <span className="absolute -bottom-5 text-[9px] text-center text-brand-cta font-bold whitespace-nowrap">
                            Uploading...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Editable Personal Contact Fields */}
              <div className="premium-card p-0 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenProfileSections(prev => ({ ...prev, contact: !prev.contact }))}
                  className="w-full flex items-center justify-between px-6 py-4 bg-brand-navy hover:bg-brand-navy-light transition-all text-left font-bold text-white cursor-pointer outline-none border-b border-brand-navy-light"
                >
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white font-heading">Personal Contact Details</h2>
                    <p className="text-[10px] text-slate-200 font-normal mt-0.5">Keep your contact information up-to-date.</p>
                  </div>
                  {openProfileSections.contact ? (
                    <ChevronUp className="w-4 h-4 text-white shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white shrink-0" />
                  )}
                </button>

                {openProfileSections.contact && (
                  <div className="p-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Row 1: Mobile Number / Personal Email */}
                        <div>
                          <label className="block text-xs font-bold text-brand-navy mb-1">Mobile Number</label>
                          <input
                            type="tel"
                            value={profileForm.mobileNumber}
                            onChange={(e) => setProfileForm({ ...profileForm, mobileNumber: e.target.value })}
                            className="block w-full md:w-1/2 rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-brand-navy mb-1">Personal Email</label>
                          <input
                            type="email"
                            value={profileForm.personalEmail}
                            onChange={(e) => setProfileForm({ ...profileForm, personalEmail: e.target.value })}
                            className="block w-full md:w-1/2 rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                          />
                        </div>

                        {/* Row 2: Professional/Company Email / Emergency Contact Number */}
                        <div>
                          <label className="block text-xs font-bold text-brand-navy mb-1">Professional/Company Email</label>
                          <input
                            type="email"
                            value={profileForm.professionalEmail}
                            onChange={(e) => setProfileForm({ ...profileForm, professionalEmail: e.target.value })}
                            className="block w-full md:w-1/2 rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-brand-navy mb-1">Emergency Contact Number</label>
                          <input
                            type="text"
                            value={profileForm.emergencyContact}
                            onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                            className="block w-full md:w-1/2 rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                          />
                        </div>

                        {/* Row 3: Marital Status / Blood Group */}
                        <div>
                          <label className="block text-xs font-bold text-brand-navy mb-1">Marital Status</label>
                          <select
                            required
                            value={profileForm.maritalStatus}
                            onChange={(e) => setProfileForm({ ...profileForm, maritalStatus: e.target.value })}
                            className="block w-full md:w-1/2 rounded-xl border border-gray-200/80 py-2 px-2.5 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                          >
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-brand-navy mb-1">Blood Group</label>
                          <select
                            value={profileForm.bloodGroup}
                            onChange={(e) => setProfileForm({ ...profileForm, bloodGroup: e.target.value })}
                            className="block w-full md:w-1/2 rounded-xl border border-gray-200/80 py-2 px-2.5 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                          >
                            <option value="">Select Blood Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>

                        {/* Row 4: Current Address / Permanent Address */}
                        <div>
                          <label className="block text-xs font-bold text-brand-navy mb-1">Current Address</label>
                          <textarea
                            rows={2}
                            value={profileForm.currentAddress}
                            onChange={(e) => setProfileForm({ ...profileForm, currentAddress: e.target.value })}
                            className="block w-full md:w-1/2 rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs resize-y min-h-[50px]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-brand-navy mb-1">Permanent Address</label>
                          <textarea
                            rows={2}
                            value={profileForm.permanentAddress}
                            onChange={(e) => setProfileForm({ ...profileForm, permanentAddress: e.target.value })}
                            className="block w-full md:w-1/2 rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs resize-y min-h-[50px]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer btn-premium shadow-md"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Financial Details (Read Only) */}
              <div className="premium-card p-0 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenProfileSections(prev => ({ ...prev, financial: !prev.financial }))}
                  className="w-full flex items-center justify-between px-6 py-4 bg-brand-navy hover:bg-brand-navy-light transition-all text-left font-bold text-white cursor-pointer outline-none border-b border-brand-navy-light"
                >
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white font-heading">Financial Details</h2>
                    <p className="text-[10px] text-slate-200 font-normal mt-0.5">Details stored securely. Contact HR to edit bank/PAN details.</p>
                  </div>
                  {openProfileSections.financial ? (
                    <ChevronUp className="w-4 h-4 text-white shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white shrink-0" />
                  )}
                </button>

                {openProfileSections.financial && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Row 1: Bank Details */}
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400">Bank Name</span>
                        <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.bankName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400">IFSC Code</span>
                        <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.ifsc || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400">Bank Branch</span>
                        <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.bankBranch || 'N/A'}</span>
                      </div>

                      {/* Row 2: Statutory Details */}
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400">Permanent Account Number (PAN)</span>
                        <span className="text-sm font-bold text-brand-navy mt-0.5 block">
                          {employeeProfile.pan ? '••••••••••' : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400">PF Number</span>
                        <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.pfNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400">UAN Number</span>
                        <span className="text-sm font-bold text-brand-navy mt-0.5 block">{employeeProfile.uan || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: My Leaves */}
          {/* TAB 3: My Leaves & Requests */}
          {activeTab === 'leaves' && (
            <div className="space-y-6">
              <div className="premium-card p-6">
                <h3 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-cta" />
                  Leave Balances & Time-off Requests
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Balances, Holidays, History */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Balances grid */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider">Leave Balance Status</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {leaveBalances.map((bal) => (
                          <div key={bal.id} className="p-3.5 rounded-xl border border-gray-250 bg-gray-50/80 shadow-xs">
                            <p className="text-xs font-bold text-brand-navy">{bal.name}</p>
                            <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] text-gray-500 font-semibold text-center">
                              <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-xs">
                                <span className="block text-xs font-extrabold text-brand-navy">{bal.daysAllowed}</span>
                                Allotted
                              </div>
                              <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-xs">
                                <span className="block text-xs font-extrabold text-brand-red">{bal.daysUsed}</span>
                                Used
                              </div>
                              <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-xs">
                                <span className="block text-xs font-extrabold text-emerald-600">{bal.daysRemaining}</span>
                                Remaining
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Upcoming Company Holidays */}
                    <div className="pt-6 border-t border-gray-150/45">
                      <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider mb-3">Upcoming Company Holidays</h4>
                      {holidays.length === 0 ? (
                        <p className="text-xs text-gray-400">No upcoming holidays scheduled.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {holidays.map((h, idx) => (
                            <div key={idx} className="p-2.5 rounded-xl border border-slate-200/60 bg-slate-50/50 flex flex-col justify-between text-xs">
                              <span className="font-bold text-brand-navy">{h.name}</span>
                              <span className="text-[10px] text-gray-400 font-semibold font-mono mt-1">
                                {formatDateToIndian(h.date)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Leave request history */}
                    <div className="pt-6 border-t border-gray-150">
                      <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider mb-3">Leave Request History</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-gray-200/50 text-gray-500 font-bold uppercase tracking-wider">
                              <th className="py-2.5 px-2">Leave Type</th>
                              <th className="py-2.5 px-2">Duration</th>
                              <th className="py-2.5 px-2">Reason</th>
                              <th className="py-2.5 px-2 text-center">Status</th>
                              <th className="py-2.5 px-2">Approved By</th>
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
                                    {formatDateToIndian(req.startDate)} to {formatDateToIndian(req.endDate)}
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
                                    {req.reviewedBy ? formatEmployeeName(req.reviewedBy.name) : '-'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Regularisation Request History */}
                    <div className="pt-6 border-t border-gray-150">
                      <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider mb-3">Attendance Regularisation History</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-gray-200/50 text-gray-500 font-bold uppercase tracking-wider">
                              <th className="py-2.5 px-2">Date to Correct</th>
                              <th className="py-2.5 px-2">Expected Check-in</th>
                              <th className="py-2.5 px-2">Expected Check-out</th>
                              <th className="py-2.5 px-2">Reason</th>
                              <th className="py-2.5 px-2 text-center">Status</th>
                              <th className="py-2.5 px-2">Approved By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {regularisationRequests.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="text-center py-4 text-gray-400">No regularisation requests found.</td>
                              </tr>
                            ) : (
                              regularisationRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50/50">
                                  <td className="py-3 px-2 font-semibold text-brand-navy">{formatDateToIndian(req.date)}</td>
                                  <td className="py-3 px-2 text-gray-500 font-mono">{req.checkInTime ? formatTime(req.checkInTime) : '--:--'}</td>
                                  <td className="py-3 px-2 text-gray-500 font-mono">{req.checkOutTime ? formatTime(req.checkOutTime) : '--:--'}</td>
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
                                    {req.reviewedBy ? formatEmployeeName(req.reviewedBy.name) : '-'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Time Off & Regularisation Forms */}
                  <div className="space-y-6 lg:col-span-1">
                    {/* Apply Form */}
                    <div className="premium-card p-4 space-y-3 border border-gray-200/50">
                      <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider">Request Time Off</h4>
                      <form onSubmit={handleSubmitLeaveRequest} className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Leave Category</label>
                          <select
                            required
                            value={leaveTypeId}
                            onChange={(e) => setLeaveTypeId(e.target.value)}
                            className="block w-full rounded-xl border border-gray-200/80 py-1.5 px-2.5 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
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
                              className="block w-full rounded-xl border border-gray-200/80 py-1 px-1.5 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">End Date</label>
                            <input
                              type="date"
                              required
                              value={leaveEndDate}
                              onChange={(e) => setLeaveEndDate(e.target.value)}
                              className="block w-full rounded-xl border border-gray-200/80 py-1 px-1.5 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
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
                            className="block w-full rounded-xl border border-gray-200/80 py-1 px-1.5 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submittingLeave}
                          className="w-full bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer btn-premium shadow-md disabled:opacity-50"
                        >
                          {submittingLeave ? 'Submitting...' : 'Request Leave'}
                        </button>
                      </form>
                    </div>

                    {/* Regularisation Form */}
                    <div className="premium-card p-4 space-y-3 border border-gray-200/50">
                      <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider">Attendance Regularisation</h4>
                      <p className="text-[10px] text-gray-500 leading-normal">Correct a missed check-in/out record for a specific date.</p>
                      <form onSubmit={handleSubmitRegularisation} className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Date to Regularise</label>
                          <input
                            type="date"
                            required
                            value={regDate}
                            onChange={(e) => setRegDate(e.target.value)}
                            className="block w-full rounded-xl border border-gray-200/80 py-1.5 px-2.5 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Check-in Time</label>
                            <input
                              type="time"
                              required
                              value={regCheckIn}
                              onChange={(e) => setRegCheckIn(e.target.value)}
                              className="block w-full rounded-xl border border-gray-200/80 py-1 px-1.5 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Check-out Time</label>
                            <input
                              type="time"
                              required
                              value={regCheckOut}
                              onChange={(e) => setRegCheckOut(e.target.value)}
                              className="block w-full rounded-xl border border-gray-200/80 py-1 px-1.5 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Reason / Explanation</label>
                          <textarea
                            required
                            rows={2}
                            value={regReason}
                            onChange={(e) => setRegReason(e.target.value)}
                            placeholder="E.g., forgot to check-in on arrival..."
                            className="block w-full rounded-xl border border-gray-200/80 py-1 px-1.5 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submittingReg}
                          className="w-full bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer btn-premium shadow-md disabled:opacity-50"
                        >
                          {submittingReg ? 'Submitting...' : 'Submit Request'}
                        </button>
                      </form>
                    </div>
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
                <div className="premium-card p-6">
                  <div className="border-b border-gray-100 pb-4 mb-4">
                    <h3 className="text-lg font-bold text-brand-navy font-heading">My Salary Structure Breakdown</h3>
                    <p className="text-xs text-gray-500 mt-1">Periodic salary structure values registered under your profile account.</p>
                  </div>
                  {/* Pull default values for structure if not explicitly set yet */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-gray-200">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase">Basic Salary</span>
                      <span className="text-base font-extrabold text-brand-navy mt-1 block">
                        {(myPayrollRuns[0]?.basicSalary || 30000).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-gray-200">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase">HRA Allowance</span>
                      <span className="text-base font-extrabold text-brand-navy mt-1 block">
                        {(myPayrollRuns[0]?.hra || 12000).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-gray-200">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase">Conveyance</span>
                      <span className="text-base font-extrabold text-brand-navy mt-1 block">
                        {(myPayrollRuns[0]?.conveyance || 3000).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-gray-200">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase">Special Allowance</span>
                      <span className="text-base font-extrabold text-brand-navy mt-1 block">
                        {(myPayrollRuns[0]?.specialAllowance || 5000).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* My Payslips Table */}
              <div className="premium-card p-6">
                <div className="border-b border-gray-100 pb-4 mb-4">
                  <h3 className="text-lg font-bold text-brand-navy font-heading">My Monthly Payslips</h3>
                  <p className="text-xs text-gray-500 mt-1">Download official digital Excel/PDF payslip documents generated by the HR payroll system.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-250/50 text-gray-500 font-bold uppercase tracking-wider">
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
                                className="inline-block bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold px-3.5 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
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



          {/* TAB 6: Trainings Catalog */}
          {activeTab === 'trainings' && (
            <div className="premium-card p-6">
              <div className="border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-lg font-bold text-brand-navy font-heading">My Training Courses & Certifications</h3>
                <p className="text-xs text-gray-500 mt-1">View specialized training sessions assigned to you and check certification status.</p>
              </div>

              <div className="py-8 text-center bg-gray-50/80 rounded-2xl border border-gray-200">
                <p className="text-sm font-semibold text-brand-navy">Courses are not yet started.</p>
              </div>
            </div>
          )}

          {/* TAB 7: Attendance History */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Filter Controls Card */}
              <div className="premium-card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-brand-navy font-heading flex items-center gap-2">
                      <History className="w-5 h-5 text-brand-cta shrink-0" />
                      My Attendance History
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Select month and year to view daily check-in patterns, leaves, and holidays.</p>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex items-center gap-2.5">
                    {/* Prev Month */}
                    <button
                      onClick={() => {
                        if (calendarMonth === 0) {
                          setCalendarMonth(11);
                          setCalendarYear(calendarYear - 1);
                        } else {
                          setCalendarMonth(calendarMonth - 1);
                        }
                      }}
                      className="p-2 border border-gray-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer text-brand-navy text-sm font-bold shadow-xs bg-white"
                      title="Previous Month"
                    >
                      &larr;
                    </button>
                    
                    {/* Month selector */}
                    <select
                      value={calendarMonth}
                      onChange={(e) => setCalendarMonth(Number(e.target.value))}
                      className="rounded-xl border border-gray-200 py-2 px-3 text-xs font-semibold text-brand-navy bg-white outline-none focus:border-brand-cta transition-all shadow-xs"
                    >
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((mName, idx) => (
                        <option key={idx} value={idx}>{mName}</option>
                      ))}
                    </select>

                    {/* Year selector */}
                    <select
                      value={calendarYear}
                      onChange={(e) => setCalendarYear(Number(e.target.value))}
                      className="rounded-xl border border-gray-200 py-2 px-3 text-xs font-semibold text-brand-navy bg-white outline-none focus:border-brand-cta transition-all shadow-xs"
                    >
                      {[2024, 2025, 2026, 2027].map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>

                    {/* Next Month */}
                    <button
                      onClick={() => {
                        if (calendarMonth === 11) {
                          setCalendarMonth(0);
                          setCalendarYear(calendarYear + 1);
                        } else {
                          setCalendarMonth(calendarMonth + 1);
                        }
                      }}
                      className="p-2 border border-gray-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer text-brand-navy text-sm font-bold shadow-xs bg-white"
                      title="Next Month"
                    >
                      &rarr;
                    </button>
                  </div>
                </div>
              </div>

              {/* Monthly Stats Summary Strip */}
              {(() => {
                const selectedYearMonth = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`;
                const monthlyRecords = attendance.filter(r => r.date.startsWith(selectedYearMonth));
                const monthlyTrack = trackSheets.filter(t => t.date.startsWith(selectedYearMonth));
                
                const presents = monthlyRecords.filter(r => ['PRESENT', 'OVERTIME', 'LATE_COMING', 'EARLY_LEAVING', 'MISSING_PUNCH'].includes(r.status)).length;
                const lates = monthlyRecords.filter(r => r.status === 'LATE_COMING').length;
                const leaves = monthlyRecords.filter(r => r.status === 'LEAVE').length;
                const holidays = monthlyRecords.filter(r => r.status === 'HOLIDAY').length;
                const absents = monthlyRecords.filter(r => r.status === 'ABSENT').length;
                
                const avgHrs = monthlyTrack.length > 0 
                  ? (monthlyTrack.reduce((sum, item) => sum + item.hours, 0) / monthlyTrack.length).toFixed(1)
                  : '0.0';

                return (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Present Card */}
                    <div className="premium-card p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="block text-xl font-extrabold font-mono text-emerald-600 leading-none">
                          <CountUp value={presents} />
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 mt-1 block uppercase tracking-wider">Present</span>
                      </div>
                    </div>

                    {/* Late Card */}
                    <div className="premium-card p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-xs">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="block text-xl font-extrabold font-mono text-amber-650 leading-none">
                          <CountUp value={lates} />
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 mt-1 block uppercase tracking-wider">Lates</span>
                      </div>
                    </div>

                    {/* Leave Card */}
                    <div className="premium-card p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="block text-xl font-extrabold font-mono text-rose-600 leading-none">
                          <CountUp value={leaves} />
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 mt-1 block uppercase tracking-wider">Leaves</span>
                      </div>
                    </div>

                    {/* Holiday Card */}
                    <div className="premium-card p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-cta shrink-0 shadow-xs">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="block text-xl font-extrabold font-mono text-brand-navy leading-none">
                          <CountUp value={holidays} />
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 mt-1 block uppercase tracking-wider">Holidays</span>
                      </div>
                    </div>

                    {/* Avg Hours Card */}
                    <div className="premium-card p-4 flex items-center gap-3 col-span-2 md:col-span-1">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-gray-600 shrink-0 shadow-xs">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="block text-xl font-extrabold font-mono text-brand-gray leading-none">
                          {avgHrs}h
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 mt-1 block uppercase tracking-wider">Avg Hours</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Calendar Grid Card */}
              <div className="premium-card p-6">
                {/* Week headers */}
                <div className="grid grid-cols-7 gap-2 mb-3 text-center">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dHeader) => (
                    <span key={dHeader} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{dHeader}</span>
                  ))}
                </div>

                {/* Grid cells */}
                <div className="grid grid-cols-7 gap-2">
                  {(() => {
                    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
                    const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                      const cells = [];
                    // Empty cells for alignment
                    for (let i = 0; i < firstDayIndex; i++) {
                      cells.push(<div key={`empty-${i}`} className="bg-slate-50/40 rounded-xl border border-gray-100 min-h-[60px] md:min-h-[75px]" />);
                    }
                    
                    // Month dates
                    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
                      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const rec = attendance.find(r => r.date === dateStr);
                      const isWeekend = new Date(calendarYear, calendarMonth, dayNum).getDay() === 0 || new Date(calendarYear, calendarMonth, dayNum).getDay() === 6;
                      
                      const hItem = holidays.find(h => h.date === dateStr);
                      const isHoliday = !!hItem || (rec && rec.status === 'HOLIDAY');
                      const holidayName = hItem ? hItem.name : (isHoliday ? "Holiday" : "");

                      // Build events list for the cell (Outlook monthly event strips)
                      const eventStrips = [];
                      if (isHoliday) {
                        eventStrips.push(
                          <div key="hol" className="w-full text-[8px] md:text-[9px] font-extrabold px-1 py-0.5 rounded bg-blue-600 text-white truncate text-left shadow-xs">
                            Holiday
                          </div>
                        );
                        if (holidayName && holidayName !== "Holiday") {
                          eventStrips.push(
                            <div key="hol-name" className="w-full text-[7px] md:text-[8px] font-bold px-1 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 truncate text-left shadow-xs" title={holidayName}>
                              {holidayName}
                            </div>
                          );
                        }
                      } else if (rec) {
                        const status = rec.status;
                        if (['PRESENT', 'OVERTIME', 'LATE_COMING', 'EARLY_LEAVING', 'MISSING_PUNCH'].includes(status)) {
                          const label = status === 'LATE_COMING' ? "Late" : (status === 'OVERTIME' ? "Overtime" : "Present");
                          const labelBg = status === 'LATE_COMING' ? "bg-amber-500" : (status === 'OVERTIME' ? "bg-emerald-600" : "bg-emerald-500");
                          eventStrips.push(
                            <div key="pres" className={`w-full text-[8px] md:text-[9px] font-extrabold px-1 py-0.5 rounded text-white truncate text-left shadow-xs ${labelBg}`}>
                              {label}
                            </div>
                          );
                          if (rec.checkInTime) {
                            eventStrips.push(
                              <div key="checkin" className="w-full text-[7px] md:text-[8px] font-bold px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 truncate text-left shadow-xs">
                                In: {formatTime(rec.checkInTime)}
                              </div>
                            );
                          }
                          if (rec.checkOutTime) {
                            eventStrips.push(
                              <div key="checkout" className="w-full text-[7px] md:text-[8px] font-bold px-1 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200 truncate text-left shadow-xs">
                                Out: {formatTime(rec.checkOutTime)}
                              </div>
                            );
                          }
                        } else if (status === 'LEAVE') {
                          eventStrips.push(
                            <div key="leave" className="w-full text-[8px] md:text-[9px] font-extrabold px-1 py-0.5 rounded bg-purple-600 text-white truncate text-left shadow-xs">
                              Leave
                            </div>
                          );
                        } else if (status === 'WEEK_OFF') {
                          eventStrips.push(
                            <div key="we" className="w-full text-[8px] md:text-[9px] font-extrabold px-1 py-0.5 rounded bg-slate-200 text-slate-700 truncate text-left shadow-xs">
                              Weekend
                            </div>
                          );
                        } else if (status === 'ABSENT') {
                          eventStrips.push(
                            <div key="abs" className="w-full text-[8px] md:text-[9px] font-extrabold px-1 py-0.5 rounded bg-rose-500 text-white truncate text-left shadow-xs">
                              Absent
                            </div>
                          );
                        }
                      } else {
                        if (isWeekend) {
                          eventStrips.push(
                            <div key="we-fallback" className="w-full text-[8px] md:text-[9px] font-extrabold px-1 py-0.5 rounded bg-slate-200 text-slate-700 truncate text-left shadow-xs">
                              Weekend
                            </div>
                          );
                        } else {
                          const today = new Date().toISOString().split('T')[0];
                          if (dateStr < today) {
                            eventStrips.push(
                              <div key="abs-fallback" className="w-full text-[8px] md:text-[9px] font-extrabold px-1 py-0.5 rounded bg-rose-500 text-white truncate text-left shadow-xs">
                                Absent
                              </div>
                            );
                          }
                        }
                      }

                      cells.push(
                        <button
                          key={dayNum}
                          onClick={() => setSelectedCalendarDate(dateStr)}
                          className={`p-1 md:p-1.5 rounded-xl border text-left flex flex-col justify-start min-h-[60px] md:min-h-[75px] transition-all cursor-pointer shadow-xs hover:shadow-md hover:border-brand-cta ${
                            isWeekend ? 'bg-slate-50/60 border-slate-200' : 'bg-white border-slate-200'
                          }`}
                        >
                          <span className={`text-[10px] md:text-xs font-bold font-mono ${isWeekend ? 'text-brand-navy/60' : 'text-brand-navy'}`}>
                            {dayNum}
                          </span>
                          
                          <div className="w-full flex-1 flex flex-col justify-end mt-0.5 space-y-0.5 overflow-hidden">
                            {eventStrips}
                          </div>
                        </button>
                      );
                    }
                    
                    return cells;
                  })()}
                </div>

                {/* Color Legend Block */}
                <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-gray-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-emerald-600/85 border border-emerald-600/60 block" />
                    <span className="font-semibold text-brand-gray">Present / Overtime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-purple-600/85 border border-purple-600/60 block" />
                    <span className="font-semibold text-brand-gray">Leave (Approved)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-blue-600/85 border border-blue-600/60 block" />
                    <span className="font-semibold text-brand-gray">Company Holidays</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-red-500/85 border border-red-500/60 block" />
                    <span className="font-semibold text-brand-gray">Absent (No check-in)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-slate-300/85 border border-slate-300/60 block" />
                    <span className="font-semibold text-brand-gray">Weekend</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: Resignation Request */}
          {activeTab === 'resignation' && (
            <div className="premium-card p-6">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-brand-navy font-heading">Resignation Request</h3>
                <p className="text-xs text-gray-500 mt-1">Submit your resignation request. Note that only one request can be active.</p>
              </div>

              {resignationRequest ? (
                <div className="space-y-4 max-w-lg">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs text-brand-navy">
                    <div className="flex justify-between pb-2 border-b border-slate-200/65">
                      <strong className="text-gray-400 font-medium">Status:</strong>
                      <span className={`font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        resignationRequest.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        resignationRequest.status === 'REJECTED' ? 'bg-red-100 text-brand-red' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {resignationRequest.status}
                      </span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-slate-200/65">
                      <strong className="text-gray-400 font-medium">Resignation Date:</strong>
                      <span className="font-bold">{formatDateToIndian(resignationRequest.resignationDate)}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-slate-200/65">
                      <strong className="text-gray-400 font-medium">Requested Last Working Day:</strong>
                      <span className="font-bold">{formatDateToIndian(resignationRequest.lastWorkingDay)}</span>
                    </div>
                    <div className="pb-2 border-b border-slate-200/65">
                      <strong className="text-gray-400 font-medium block mb-1">Reason:</strong>
                      <p className="text-gray-650 leading-relaxed font-medium">{resignationRequest.reason}</p>
                    </div>
                    {resignationRequest.hrNotes && (
                      <div>
                        <strong className="text-gray-400 font-medium block mb-1">HR Notes:</strong>
                        <p className="text-gray-650 leading-relaxed font-medium">{resignationRequest.hrNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitResignation} className="space-y-4 max-w-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Resignation Date</label>
                      <input 
                        type="date"
                        required
                        value={resignationDate}
                        onChange={(e) => setResignationDate(e.target.value)}
                        className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Last Working Day (Expected)</label>
                      <input 
                        type="date"
                        required
                        value={lastWorkingDay}
                        onChange={(e) => setLastWorkingDay(e.target.value)}
                        className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Reason for Resignation</label>
                      <textarea 
                        required
                        rows={4}
                        value={resignationReason}
                        onChange={(e) => setResignationReason(e.target.value)}
                        placeholder="Please state the reason for your resignation..."
                        className="block w-full rounded-xl border border-gray-200/80 py-2.5 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submittingResignation}
                      className="bg-brand-red hover:bg-red-700 hover:shadow-lg hover:shadow-brand-red/15 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer btn-premium shadow-md disabled:opacity-50"
                    >
                      {submittingResignation ? 'Submitting...' : 'Submit Resignation'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
    </div>


      {/* Date Detail Modal */}
      {selectedCalendarDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/85 backdrop-blur-lg rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-white/40 space-y-4 text-brand-navy">
            <div className="flex justify-between items-center border-b border-gray-150 pb-3">
              <h3 className="text-sm font-bold font-heading">
                Attendance Details
              </h3>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {selectedCalendarDate}
              </span>
            </div>

            {(() => {
              const rec = attendance.find(r => r.date === selectedCalendarDate);
              const isWeekend = new Date(selectedCalendarDate).getDay() === 0 || new Date(selectedCalendarDate).getDay() === 6;
              const hItem = holidays.find(h => h.date === selectedCalendarDate);
              const isHoliday = !!hItem || (rec && rec.status === 'HOLIDAY');
              const holidayName = hItem ? hItem.name : (isHoliday ? "Holiday" : "");

              if (isHoliday) {
                return (
                  <div className="text-xs space-y-2.5">
                    <p className="flex justify-between border-b border-gray-50 pb-1.5 border-gray-200/50">
                      <strong className="text-gray-400 font-medium">Status:</strong>
                      <span className="font-extrabold text-blue-600 uppercase">HOLIDAY</span>
                    </p>
                    <p className="flex justify-between border-b border-gray-50 pb-1.5 border-gray-200/50">
                      <strong className="text-gray-400 font-medium">Reason / Name:</strong>
                      <span className="font-bold text-right">{holidayName || 'Company Holiday'}</span>
                    </p>
                    <p className="text-[10px] text-gray-450 italic">This day has been declared a holiday by HR.</p>
                  </div>
                );
              }

              if (!rec) {
                if (isWeekend) {
                  return (
                    <div className="text-xs text-gray-500 py-3 space-y-2">
                      <p><strong>Status:</strong> Weekend (Non-Working Day)</p>
                      <p className="italic text-gray-400">No attendance logging required.</p>
                    </div>
                  );
                }
                const today = new Date().toISOString().split('T')[0];
                if (selectedCalendarDate > today) {
                  return (
                    <div className="text-xs text-gray-500 py-3 space-y-2">
                      <p><strong>Status:</strong> Future Date</p>
                      <p className="italic text-gray-400">Attendance records will appear once checked in.</p>
                    </div>
                  );
                }
                return (
                  <div className="text-xs text-gray-500 py-3 space-y-2">
                    <p><strong>Status:</strong> Absent</p>
                    <p className="italic text-red-650 font-bold">No check-in record found for this day.</p>
                  </div>
                );
              }

              // Found record details
              const workingHours = rec.checkInTime && rec.checkOutTime 
                ? ((new Date(rec.checkOutTime).getTime() - new Date(rec.checkInTime).getTime()) / (1000 * 60 * 60)).toFixed(1) + ' hours'
                : (rec.status === 'WEEK_OFF' || rec.status === 'HOLIDAY' ? null : '--');

              return (
                <div className="text-xs space-y-2.5">
                  <p className="flex justify-between border-b border-gray-50 pb-1.5 border-gray-200/50">
                    <strong className="text-gray-400 font-medium">Status:</strong>
                    <span className="font-extrabold uppercase">{rec.status.replace('_', ' ')}</span>
                  </p>
                  <p className="flex justify-between border-b border-gray-50 pb-1.5 border-gray-200/50">
                    <strong className="text-gray-400 font-medium">Check-in:</strong>
                    <span className="font-bold">{rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                  </p>
                  <p className="flex justify-between border-b border-gray-50 pb-1.5 border-gray-200/50">
                    <strong className="text-gray-400 font-medium">Check-out:</strong>
                    <span className="font-bold">{rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                  </p>
                  {workingHours && (
                    <p className="flex justify-between border-b border-gray-50 pb-1.5 border-gray-200/50">
                      <strong className="text-gray-400 font-medium">Working Hours:</strong>
                      <span className="font-bold font-mono">{workingHours}</span>
                    </p>
                  )}
                  <p className="flex justify-between border-b border-gray-50 pb-1.5 border-gray-200/50">
                    <strong className="text-gray-400 font-medium">Device IP:</strong>
                    <span className="font-mono text-gray-500">{rec.ip || 'Unknown'}</span>
                  </p>
                  <p className="flex justify-between">
                    <strong className="text-gray-400 font-medium">Timezone:</strong>
                    <span className="text-gray-500">{rec.tz || 'Asia/Kolkata'}</span>
                  </p>
                </div>
              );
            })()}

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setSelectedCalendarDate(null)}
                className="bg-brand-navy hover:bg-brand-navy-light text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer w-full text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Track Sheet Detail Modal */}
      {selectedTrackSheet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200/80 space-y-4 text-brand-navy">
            <div className="flex justify-between items-center border-b border-gray-150 pb-3">
              <h3 className="text-sm font-bold font-heading">
                Work Log Details
              </h3>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                selectedTrackSheet.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                selectedTrackSheet.status === 'REJECTED' ? 'bg-red-100 text-brand-red' :
                'bg-amber-100 text-amber-800'
              }`}>
                {selectedTrackSheet.status}
              </span>
            </div>

            <div className="text-xs space-y-2.5">
              <p className="flex justify-between border-b border-gray-50 pb-1.5 border-gray-200/50">
                <strong className="text-gray-400 font-medium">Log Date:</strong>
                <span className="font-bold">{formatDateToIndian(selectedTrackSheet.date)}</span>
              </p>
              <p className="flex justify-between border-b border-gray-50 pb-1.5 border-gray-200/50">
                <strong className="text-gray-400 font-medium">Project:</strong>
                <span className="font-bold">{selectedTrackSheet.project}</span>
              </p>
              <p className="flex justify-between border-b border-gray-50 pb-1.5 border-gray-200/50">
                <strong className="text-gray-400 font-medium">Hours:</strong>
                <span className="font-bold font-mono">{selectedTrackSheet.hours} hours</span>
              </p>
              <p className="flex justify-between border-b border-gray-50 pb-1.5 border-gray-200/50">
                <strong className="text-gray-400 font-medium">Assigned By:</strong>
                <span className="font-bold">{formatEmployeeName(selectedTrackSheet.assignedByName)}</span>
              </p>
              <div className="border-b border-gray-50 pb-2 border-gray-200/50">
                <strong className="text-gray-400 font-medium block mb-1">Task Description:</strong>
                <p className="text-gray-650 leading-relaxed font-medium">{selectedTrackSheet.taskDescription}</p>
              </div>
              {selectedTrackSheet.notes && (
                <div className="border-b border-gray-50 pb-2 border-gray-200/50">
                  <strong className="text-gray-400 font-medium block mb-1">Employee Notes:</strong>
                  <p className="text-gray-650 leading-relaxed font-medium">{selectedTrackSheet.notes}</p>
                </div>
              )}
              {selectedTrackSheet.tlComment && (
                <div className="p-3 bg-blue-50 border border-blue-200/60 rounded-xl space-y-1">
                  <strong className="text-[10px] text-blue-700 uppercase font-extrabold block">TL Comment / Feedback</strong>
                  <p className="text-blue-800 leading-normal font-medium">{selectedTrackSheet.tlComment}</p>
                </div>
              )}

              {/* Supporting Documents Section */}
              <div className="pt-2">
                <strong className="text-gray-400 font-medium block mb-1.5">Supporting Documents:</strong>
                
                {/* Upload Doc Input */}
                <div className="flex flex-col gap-1.5 mb-3 bg-slate-50 p-2 border border-slate-100 rounded-xl">
                  <span className="text-[9px] text-gray-400 font-extrabold uppercase">Upload Attachment</span>
                  <div className="flex items-center justify-between gap-2">
                    <input 
                      type="file" 
                      onChange={handleTaskDocUpload}
                      disabled={uploadingTaskDoc}
                      className="text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-brand-navy/5 file:text-brand-navy hover:file:bg-brand-navy/10 cursor-pointer"
                    />
                    {uploadingTaskDoc && <span className="text-[9px] text-brand-cta animate-pulse">Uploading...</span>}
                  </div>
                </div>

                {(() => {
                  let docs = [];
                  try {
                    docs = selectedTrackSheet.supportingDocuments ? JSON.parse(selectedTrackSheet.supportingDocuments) : [];
                    if (!Array.isArray(docs)) docs = [];
                  } catch {
                    docs = [];
                  }
                  return docs.length === 0 ? (
                    <p className="text-[10px] text-gray-450 italic">No attachments uploaded yet.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {docs.map((doc: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px]">
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="font-bold text-brand-cta hover:underline truncate max-w-[200px]"
                          >
                            {doc.name}
                          </a>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9px] text-gray-400">
                              {formatDateToIndian(doc.uploadedAt)}
                            </span>
                            <button
                              onClick={() => handleTaskDocDelete(idx)}
                              className="text-brand-red hover:text-red-700 cursor-pointer"
                              title="Delete Attachment"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedTrackSheet(null)}
                className="bg-brand-navy hover:bg-brand-navy-light text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer w-full text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
