'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { 
  Users, 
  Clock, 
  MapPin, 
  Globe, 
  Plus, 
  FileText, 
  CheckSquare, 
  ArrowLeftRight,
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  Check,
  X,
  Send,
  UserCheck,
  Filter,
  Menu,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  todayAttendance: {
    checkInTime: string;
    checkOutTime: string | null;
    status: string;
    ip: string;
    tz: string;
  } | null;
  employeeProfile?: any;
}

interface TeamTrackSheet {
  id: string;
  date: string;
  project: string;
  taskDescription: string;
  hours: number;
  status: string;
  notes: string | null;
  assignedByName: string | null;
  tlComment?: string | null;
  referenceLink?: string | null;
  user: {
    id: string;
    name: string;
  };
}

interface TeamTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: string;
  status: string;
  assignedTo: {
    id: string;
    name: string;
  };
}

interface TeamReport {
  id: string;
  periodStart: string;
  periodEnd: string;
  summary: string;
  status: string;
  createdAt: string;
  submittedBy: {
    name: string;
  };
}

export default function TeamLeaderDashboard() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'tracksheets' | 'tasks' | 'reports' | 'leaves' | 'goals'>('attendance');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Goals States
  const [goals, setGoals] = useState<any[]>([]);
  const [goalUser, setGoalUser] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalKPI, setGoalKPI] = useState('');
  const [goalWeight, setGoalWeight] = useState('50');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalPeriod, setGoalPeriod] = useState('2026-H2');

  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [goalRatingInput, setGoalRatingInput] = useState('4.0');
  const [goalStatusInput, setGoalStatusInput] = useState('MANAGER_APPROVED');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  
  // Data States
  const [team, setTeam] = useState<{ id: string; name: string } | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [trackSheets, setTrackSheets] = useState<TeamTrackSheet[]>([]);
  const [expandedSheets, setExpandedSheets] = useState<Record<string, boolean>>({});
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [reports, setReports] = useState<TeamReport[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  
  // Leave Request States
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Performance Rating States
  const [performanceScores, setPerformanceScores] = useState<any[]>([]);
  const [performanceCounts, setPerformanceCounts] = useState({ RED: 0, YELLOW: 0, GREEN: 0, BLUE: 0 });

  // Task Assignment States
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskAssignee, setTaskAssignee] = useState('');

  // Report Submission States
  const [reportStart, setReportStart] = useState('');
  const [reportEnd, setReportEnd] = useState('');
  const [reportSummary, setReportSummary] = useState('');

  // Filtering States for Track Sheets
  const [filterMember, setFilterMember] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Drill-down and commenting states
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<TeamMember | null>(null);
  const [commentingTrackSheet, setCommentingTrackSheet] = useState<any | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

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

  const formatToTitleCase = (str: string | null | undefined): string => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(/[\s_]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Status message states
  const [errorMsg, setErrorMsgState] = useState('');
  const [successMsg, setSuccessMsgState] = useState('');
  const [fadeSuccess, setFadeSuccess] = useState(false);
  const [fadeError, setFadeError] = useState(false);
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

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          setSessionUser(data.user);
        }
      } catch (e) {
        console.error('Session fetch failed in TL Board:', e);
      }
    }
    fetchSession();
  }, []);

  useEffect(() => {
    fetchTeamData();
  }, [activeTab, selectedTeamId]);

  const fetchTeamData = async () => {
    try {
      let currentMembers: TeamMember[] = [];

      // Fetch Team & Members
      const teamUrl = selectedTeamId ? `/api/tl/team?teamId=${selectedTeamId}` : '/api/tl/team';
      const teamRes = await fetch(teamUrl);
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeam(teamData.team);
        setMembers(teamData.members || []);
        currentMembers = teamData.members || [];
        if (teamData.allTeams) {
          setAllTeams(teamData.allTeams);
          if (teamData.allTeams.length > 0 && !selectedTeamId && teamData.team) {
            setSelectedTeamId(teamData.team.id);
          }
        }
        if (teamData.members?.length > 0) {
          setTaskAssignee(teamData.members[0].id);
        }
      }

      // Fetch Tasks
      const tasksRes = await fetch('/api/tasks');
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }

      // Fetch Team Track Sheets
      if (activeTab === 'tracksheets') {
        const sheetsDataList: TeamTrackSheet[] = [];
        for (const m of currentMembers) {
          const mSheetsRes = await fetch(`/api/tracksheets?userId=${m.id}`);
          if (mSheetsRes.ok) {
            const mSheetsData = await mSheetsRes.json();
            const mapped = mSheetsData.trackSheets.map((s: any) => ({
              ...s,
              user: { id: m.id, name: m.name }
            }));
            sheetsDataList.push(...mapped);
          }
        }
        sheetsDataList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTrackSheets(sheetsDataList);
      }

      // Fetch Reports
      if (activeTab === 'reports') {
        const reportsRes = await fetch('/api/reports');
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setReports(reportsData.reports || []);
        }
      }

      // Fetch Leave Requests
      const leaveRes = await fetch('/api/leave-requests');
      if (leaveRes.ok) {
        const leaveData = await leaveRes.json();
        const memberIds = currentMembers.map(m => m.id);
        const filteredRequests = (leaveData.requests || []).filter((r: any) => 
          memberIds.includes(r.userId)
        );
        setLeaveRequests(filteredRequests);
      }

      // Fetch Team Goals
      if (activeTab === 'goals') {
        const goalsRes = await fetch('/api/performance/goals');
        if (goalsRes.ok) {
          const goalsData = await goalsRes.json();
          setGoals(goalsData.goals || []);
        }
      }

      // Fetch Performance Scores
      const perfRes = await fetch('/api/admin/performance?recompute=true');
      if (perfRes.ok) {
        const perfData = await perfRes.json();
        setPerformanceScores(perfData.performanceData || []);
        
        const counts = { RED: 0, YELLOW: 0, GREEN: 0, BLUE: 0 };
        const memberIds = currentMembers.map(m => m.id);
        const filteredPerf = (perfData.performanceData || []).filter((p: any) => 
          memberIds.includes(p.user.id)
        );
        filteredPerf.forEach((p: any) => {
          const rating = p.score?.rating as 'RED' | 'YELLOW' | 'GREEN' | 'BLUE';
          if (rating && counts[rating] !== undefined) {
            counts[rating]++;
          }
        });
        setPerformanceCounts(counts);
      }

    } catch (e) {
      console.error('Error fetching TL data:', e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          dueDate: taskDueDate,
          priority: taskPriority,
          assignedToId: taskAssignee,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign task');

      setSuccessMsg(`Task successfully assigned to ${members.find(m => m.id === taskAssignee)?.name}!`);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      fetchTeamData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewTrackSheet = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/tracksheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to review track sheet');

      setSuccessMsg(`Track sheet entry has been ${status.toLowerCase()}!`);
      fetchTeamData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error reviewing track sheet');
    }
  };

  const handleSaveComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentingTrackSheet) return;
    setSubmittingComment(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/tracksheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: commentingTrackSheet.id,
          tlComment: commentText
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save comment');
      setSuccessMsg('Comment saved successfully!');
      setCommentingTrackSheet(null);
      setCommentText('');
      fetchTeamData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReviewLeaveRequest = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/leave-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update leave request status');

      setSuccessMsg(`Leave request has been ${status.toLowerCase()} successfully.`);
      fetchTeamData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating leave request');
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
      fetchTeamData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error rejecting leave request');
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalUser) {
      setErrorMsg('Please select a team member.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/performance/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: goalUser,
          goalTitle,
          kpi: goalKPI,
          weight: parseFloat(goalWeight),
          target: goalTarget,
          period: goalPeriod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create goal');

      setSuccessMsg('Performance goal successfully created and assigned!');
      setGoalTitle('');
      setGoalKPI('');
      setGoalWeight('50');
      setGoalTarget('');
      fetchTeamData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating goal');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGoalStatusRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/performance/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedGoal.id,
          rating: parseFloat(goalRatingInput),
          status: goalStatusInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update goal');

      setSuccessMsg('Goal status & rating updated successfully!');
      setIsGoalModalOpen(false);
      setSelectedGoal(null);
      fetchTeamData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating goal');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: reportStart,
          periodEnd: reportEnd,
          summary: reportSummary,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit report');

      setSuccessMsg('Team report submitted to HR successfully!');
      setReportStart('');
      setReportEnd('');
      setReportSummary('');
      fetchTeamData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting report');
    } finally {
      setLoading(false);
    }
  };

  // Stats computation
  const activeMembersCount = members.length;
  const presentTodayCount = members.filter(m => m.todayAttendance?.status === 'PRESENT' || m.todayAttendance?.status === 'LATE').length;
  const lateTodayCount = members.filter(m => m.todayAttendance?.status === 'LATE').length;
  const pendingTrackSheetsCount = trackSheets.filter(s => s.status === 'PENDING').length;

  // Filtered Track Sheets
  const filteredTrackSheets = trackSheets.filter(sheet => {
    const matchesMember = filterMember === 'all' || sheet.user.id === filterMember;
    const matchesStatus = filterStatus === 'all' || sheet.status === filterStatus;
    return matchesMember && matchesStatus;
  });

  const tlNavItems: {
    id: 'attendance' | 'tracksheets' | 'tasks' | 'leaves' | 'goals' | 'reports';
    label: string;
    icon: any;
  }[] = [
    { id: 'attendance', label: 'Team Attendance', icon: UserCheck },
    { id: 'tracksheets', label: 'Track Sheets Review', icon: FileText },
    { id: 'tasks', label: 'Task Assignment', icon: CheckSquare },
    { id: 'leaves', label: 'Leave Requests', icon: Calendar },
    { id: 'goals', label: 'Team Goals & KPIs', icon: TrendingUp },
    { id: 'reports', label: 'Team Reports to HR', icon: Send },
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
            {tlNavItems.find(item => item.id === activeTab)?.label}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1">
        {/* Persistent Left Sidebar - Desktop */}
        <aside className="hidden md:flex w-20 hover:w-60 bg-white flex-col shrink-0 sticky top-[73px] h-[calc(100vh-73px)] z-20 py-6 overflow-y-auto transition-all duration-300 ease-in-out group shadow-sm border-r border-gray-200">
          <nav className="flex-1 space-y-1 px-2 relative">
            {tlNavItems.map((item) => {
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
                      layoutId="activeTabPillTL"
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
          
          <div className="mt-auto px-2 border-t border-slate-100 pt-4 mb-2">
            <Link
              href="/employee"
              className="w-full text-left py-3 px-4 flex items-center relative transition-all cursor-pointer rounded-xl text-slate-600 hover:text-brand-navy hover:bg-slate-50"
            >
              <ArrowLeftRight className="w-4 h-4 shrink-0 text-slate-400" />
              <span className="text-xs font-semibold tracking-wide ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden">
                My Portal
              </span>
            </Link>
          </div>
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
                <span className="text-sm font-extrabold text-brand-navy font-heading">TL Board</span>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <nav className="flex-1 overflow-y-auto space-y-1">
                {tlNavItems.map((item) => (
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

              <div className="mt-auto px-4 border-t border-slate-100 pt-4 mb-4">
                <Link
                  href="/employee"
                  className="w-full text-left py-3 px-4 flex items-center gap-3 transition-all cursor-pointer rounded-xl text-slate-600 hover:text-brand-navy hover:bg-slate-50"
                >
                  <ArrowLeftRight className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="text-xs font-semibold tracking-wide">
                    My Portal
                  </span>
                </Link>
              </div>
            </aside>
          </div>
        )}

        <main className="flex-1 p-4 md:pt-4 md:px-8 md:pb-12 w-full max-w-7xl mx-auto">
        
        {/* Alerts Center */}
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

        {/* Dashboard Title & KPIs */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-navy font-heading">
              {team ? team.name : 'Team Leader Board'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage attendance, log reviews, and track deliverables.</p>
          </div>
          {allTeams.length > 0 && (
            <div className="flex items-center gap-2 premium-card px-4 py-2.5 shadow-sm border border-gray-200/50 self-start md:self-center">
              <span className="text-xs font-bold text-gray-500 tracking-wider">Inspect Team:</span>
              <select
                value={selectedTeamId}
                onChange={(e) => {
                  setSelectedTeamId(e.target.value);
                }}
                className="rounded-xl border border-gray-200/80 py-1.5 px-3 text-xs text-brand-navy font-bold bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all cursor-pointer shadow-xs"
              >
                {allTeams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Combined Summary & Category Bar */}
        <div className="premium-card p-3 mb-8 bg-slate-50/60 border border-slate-255/35 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
            <span className="font-semibold text-slate-550">
              Team: <strong className="text-brand-navy">{team?.name || 'N/A'}</strong>
            </span>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="flex flex-wrap items-center gap-4 text-slate-650">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                Members: <strong className="text-brand-navy">{activeMembersCount}</strong>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                Present: <strong className="text-emerald-700">{presentTodayCount}</strong>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-brand-red" />
                Late: <strong className="text-brand-red">{lateTodayCount}</strong>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                Pending Logs: <strong className="text-amber-700">{pendingTrackSheetsCount}</strong>
              </span>
            </div>
          </div>
          
          {/* Quick tab filters/categories */}
          <div className="flex flex-wrap items-center gap-1.5">
            {tlNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isActive 
                      ? 'bg-brand-navy text-white border-brand-navy shadow-sm' 
                      : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>



        {/* Tab Contents */}

        {/* TAB 1: Attendance Grid */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-brand-navy font-heading">Attendance Status</h2>
            </div>

            <div className="premium-card p-6 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200/50 text-gray-500 font-bold tracking-wider">
                    <th className="py-3 px-3">Employee Name</th>
                    <th className="py-3 px-3">Emp No</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3">Check-in Time</th>
                    <th className="py-3 px-3">Check-out Time</th>
                    <th className="py-3 px-3">IP & Timezone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">No members found in this team.</td>
                    </tr>
                  ) : (
                    members.map((member) => {
                      const todayAtt = member.todayAttendance;
                      const hasCheckedIn = !!todayAtt;
                      const isLate = todayAtt?.status === 'LATE' || todayAtt?.status.includes('LATE');
                      const isPresent = todayAtt?.status === 'PRESENT' || todayAtt?.status === 'OVERTIME';

                      return (
                        <tr 
                          key={member.id} 
                          className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedMemberForDetail(member)}
                        >
                          <td className="py-3.5 px-3">
                            <div>
                               <span className="font-bold text-brand-navy block">{formatEmployeeName(member.name)}</span>
                              <span className="text-[10px] text-gray-400 block mt-0.5">{member.role}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-brand-navy">
                            #{member.id.slice(-4)}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            {hasCheckedIn ? (
                              <span className={`inline-block px-2.5 py-0.75 rounded-full text-[9px] font-extrabold border ${
                                isLate ? 'bg-red-50 text-brand-red border-red-200/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                              }`}>
                                {formatToTitleCase(todayAtt.status)}
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.75 rounded-full text-[9px] font-extrabold border bg-slate-100 text-slate-500 border-slate-200">
                                Absent
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 font-medium text-slate-600 font-mono">
                            {todayAtt?.checkInTime ? new Date(todayAtt.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </td>
                          <td className="py-3.5 px-3 font-medium text-slate-600 font-mono">
                            {todayAtt?.checkOutTime ? new Date(todayAtt.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </td>
                          <td className="py-3.5 px-3 text-[10px] text-gray-450 leading-relaxed">
                            {todayAtt ? (
                              <div>
                                <span className="block font-medium">IP: {todayAtt.ip || 'Unknown'}</span>
                                <span className="block text-gray-400 font-medium">TZ: {todayAtt.tz || 'Asia/Kolkata'}</span>
                              </div>
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Track Sheets Review */}
        {activeTab === 'tracksheets' && (
          <div className="premium-card p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-brand-navy font-heading">Team Track Sheets Review</h2>
              
              {/* Filters */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Filter className="w-4 h-4 text-brand-navy shrink-0" />
                <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
                  <select
                    value={filterMember}
                    onChange={(e) => setFilterMember(e.target.value)}
                    className="rounded-xl border border-gray-200/80 py-1.5 px-2.5 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                  >
                    <option value="all">All Members</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="rounded-xl border border-gray-200/80 py-1.5 px-2.5 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                  >
                    <option value="all">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar-container pr-1">
              <table className="w-full table-fixed text-left text-xs relative border-collapse">
                <thead className="sticky top-0 bg-slate-100/70 backdrop-blur-xs text-slate-700 font-bold z-10">
                  <tr className="border-b border-gray-200/50 text-gray-500 font-bold tracking-wider">
                    <th className="py-3 px-2 bg-transparent w-[14%]">Member</th>
                    <th className="py-3 px-2 bg-transparent w-[10%]">Date</th>
                    <th className="py-3 px-2 bg-transparent w-[20%]">Task / Project</th>
                    <th className="py-3 px-2 bg-transparent w-[16%]">Assigned By</th>
                    <th className="py-3 px-2 bg-transparent w-[14%]">Work Link</th>
                    <th className="py-3 px-2 bg-transparent w-[12%]">Hours</th>
                    <th className="py-3 px-2 bg-transparent w-[10%]">Status</th>
                    <th className="py-3 px-2 text-center bg-transparent w-[4%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTrackSheets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-gray-400">No track sheets found.</td>
                    </tr>
                  ) : (
                    filteredTrackSheets.map((sheet) => {
                      const isExpanded = !!expandedSheets[sheet.id];
                      return (
                        <React.Fragment key={sheet.id}>
                          <tr 
                            className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${
                              isExpanded ? 'bg-slate-50/40' : ''
                            }`}
                            onClick={() => setExpandedSheets(prev => ({ ...prev, [sheet.id]: !prev[sheet.id] }))}
                          >
                            <td className="py-3 px-2 font-bold text-brand-navy truncate" title={sheet.user.name}>{sheet.user.name}</td>
                            <td className="py-3 px-2 font-semibold text-brand-navy whitespace-nowrap">{sheet.date}</td>
                            <td className="py-3 px-2 font-medium text-brand-navy truncate" title={sheet.project}>{sheet.project}</td>
                            <td className="py-3 px-2 text-brand-navy font-semibold truncate" title={sheet.assignedByName || 'N/A'}>
                              {sheet.assignedByName || '-'}
                            </td>
                            <td className="py-3 px-2">
                              {sheet.referenceLink ? (
                                <a
                                  href={sheet.referenceLink.startsWith('http') ? sheet.referenceLink : `https://${sheet.referenceLink}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand-cta hover:underline font-bold"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View
                                </a>
                              ) : (
                                <span className="text-gray-400 font-semibold">-</span>
                              )}
                            </td>
                            <td className="py-3 px-2 font-extrabold text-brand-navy">{sheet.hours}h</td>
                            <td className="py-3 px-2">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                sheet.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                sheet.status === 'REJECTED' ? 'bg-red-100 text-brand-red' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {formatToTitleCase(sheet.status)}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <ChevronDown className={`w-4 h-4 text-gray-400 mx-auto transition-transform duration-200 ${
                                isExpanded ? 'rotate-180 text-brand-cta' : ''
                              }`} />
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={8} className="p-0 border-t-0 bg-transparent">
                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-6 py-4 bg-slate-50/60 rounded-xl m-2 border border-slate-100/50 text-xs text-brand-navy space-y-3">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Notes / Blockers</p>
                                          <p className="text-brand-navy mt-0.5 font-medium">{sheet.notes || 'N/A'}</p>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Task Description</p>
                                        <p className="text-gray-600 mt-0.5 whitespace-pre-wrap leading-relaxed">{sheet.taskDescription}</p>
                                      </div>
                                      {sheet.tlComment && (
                                        <div>
                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TL Feedback / Comment</p>
                                          <p className="text-brand-navy mt-0.5 italic">"{sheet.tlComment}"</p>
                                        </div>
                                      )}
                                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/50">
                                        <div className="flex items-center gap-2">
                                          {sheet.status === 'PENDING' ? (
                                            <>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleReviewTrackSheet(sheet.id, 'APPROVED');
                                                }}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold transition-colors cursor-pointer text-xs"
                                                title="Approve Log"
                                              >
                                                <Check className="w-3.5 h-3.5" />
                                                Approve
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleReviewTrackSheet(sheet.id, 'REJECTED');
                                                }}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 text-brand-red hover:bg-red-200 font-bold transition-colors cursor-pointer text-xs"
                                                title="Reject Log"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                                Reject
                                              </button>
                                            </>
                                          ) : (
                                            <span className="text-gray-400 text-xs font-semibold">Reviewed</span>
                                          )}
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCommentingTrackSheet(sheet);
                                            setCommentText(sheet.tlComment || '');
                                          }}
                                          className="text-xs bg-brand-cta/15 text-brand-cta border border-brand-cta/25 px-3 py-1.5 rounded-lg font-extrabold hover:bg-brand-cta/25 transition-all cursor-pointer inline-flex items-center gap-1"
                                        >
                                          {sheet.tlComment ? 'Edit Feedback' : 'Add Feedback'}
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Tasks Assignment & Board */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Task Form */}
            <div className="premium-card p-6 lg:col-span-1">
              <h2 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-brand-cta" />
                Assign New Task
              </h2>
              
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">Assignee</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs sm:text-sm cursor-pointer"
                  >
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Integrate DB Schema updates"
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">Task Description</label>
                  <textarea
                    required
                    rows={2}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Describe detail instructions and outputs expected."
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs sm:text-sm resize-y min-h-[50px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Due Date</label>
                    <input
                      type="date"
                      required
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs sm:text-sm cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs sm:text-sm cursor-pointer"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-sm cursor-pointer btn-premium text-center disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : 'Assign Task'}
                </button>
              </form>
            </div>

            {/* Active Tasks List */}
            <div className="premium-card p-6 lg:col-span-2">
              <h2 className="text-lg font-bold text-brand-navy font-heading mb-4">Team Task Board</h2>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar-container pr-1">
                {tasks.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">No tasks currently defined.</p>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="p-4 rounded-xl border border-gray-200 bg-slate-50 shadow-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-brand-navy">{task.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] bg-blue-100 text-brand-navy px-2 py-0.5 rounded-full font-bold">
                              Assigned to: {task.assignedTo.name}
                            </span>
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
                              Created by TL
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            task.priority === 'HIGH' ? 'bg-red-100 text-brand-red' : 
                            task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {formatToTitleCase(task.priority)}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                            task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-brand-cta' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {formatToTitleCase(task.status)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400 font-semibold">
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Team Reports to HR */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Report Form */}
            <div className="premium-card p-6 lg:col-span-1">
              <h2 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-cta" />
                Submit Team Report to HR
              </h2>
              
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={reportStart}
                      onChange={(e) => setReportStart(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs sm:text-sm cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={reportEnd}
                      onChange={(e) => setReportEnd(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs sm:text-sm cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">Status Summary</label>
                  <textarea
                    required
                    rows={3}
                    value={reportSummary}
                    onChange={(e) => setReportSummary(e.target.value)}
                    placeholder="Provide a periodic summary of team attendance, task completion rates, SAP deployment progress, roadblocks, or notes..."
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs sm:text-sm resize-y min-h-[60px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-sm cursor-pointer btn-premium flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              </form>
            </div>

            {/* Reports Log */}
            <div className="premium-card p-6 lg:col-span-2">
              <h2 className="text-lg font-bold text-brand-navy font-heading mb-4">Past Submitted Reports</h2>
              
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">No reports submitted yet.</p>
                ) : (
                  reports.map((rep) => (
                    <div key={rep.id} className="p-4 rounded-xl border border-gray-200 bg-slate-50 shadow-xs">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-extrabold text-brand-navy flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-brand-cta" />
                          {new Date(rep.periodStart).toLocaleDateString()} - {new Date(rep.periodEnd).toLocaleDateString()}
                        </span>
                        
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          rep.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          rep.status === 'REJECTED' ? 'bg-red-100 text-brand-red' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {formatToTitleCase(rep.status)}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 whitespace-pre-line bg-white p-3 rounded-lg border border-gray-200 mt-2 font-medium">
                        {rep.summary}
                      </p>

                      <div className="text-[10px] text-gray-400 mt-2 flex justify-between">
                        <span>Submitted by: {rep.submittedBy.name}</span>
                        <span>Filed: {new Date(rep.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Leave Requests Review */}
        {activeTab === 'leaves' && (
          <div className="premium-card p-6">
            <h2 className="text-lg font-bold text-brand-navy font-heading mb-4">Pending Team Leave Requests</h2>
            
            <div className="max-h-[400px] overflow-y-auto overflow-x-auto custom-scrollbar-container pr-1">
              <table className="min-w-full text-left text-xs relative border-collapse">
                <thead className="sticky top-0 bg-slate-100/70 backdrop-blur-xs text-slate-700 font-bold z-10">
                  <tr className="border-b border-gray-200/50 text-gray-500 font-bold tracking-wider">
                    <th className="py-3 px-2 bg-transparent">Employee</th>
                    <th className="py-3 px-2 bg-transparent">Leave Type</th>
                    <th className="py-3 px-2 bg-transparent">Duration</th>
                    <th className="py-3 px-2 bg-transparent">Reason</th>
                    <th className="py-3 px-2 text-center bg-transparent">Status</th>
                    <th className="py-3 px-2 text-center bg-transparent">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaveRequests.filter(r => r.status === 'PENDING').length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-400">No pending leave requests from your team.</td>
                    </tr>
                  ) : (
                    leaveRequests.filter(r => r.status === 'PENDING').map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-2 font-bold text-brand-navy">{req.user.name}</td>
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
                        <td className="py-3 px-2 text-center space-x-2 whitespace-nowrap">
                          {((sessionUser?.role === 'HR_ADMIN') || 
                            (sessionUser?.role === 'TL' && req.user.teamId === sessionUser.teamId)) ? (
                            <>
                              <button
                                onClick={() => handleReviewLeaveRequest(req.id, 'APPROVED')}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(req.id)}
                                className="bg-brand-red hover:bg-red-700 text-white font-bold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-gray-400 font-semibold text-[10px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Resolved Leave History */}
            <div className="mt-8 border-t border-gray-150 pt-6">
              <h3 className="text-base font-bold text-brand-navy font-heading mb-4">Leave Review History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200/50 text-gray-500 font-bold tracking-wider">
                      <th className="py-3 px-2">Employee</th>
                      <th className="py-3 px-2">Leave Type</th>
                      <th className="py-3 px-2">Duration</th>
                      <th className="py-3 px-2">Reason</th>
                      <th className="py-3 px-2 text-center">Status</th>
                      <th className="py-3 px-2">Reviewed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leaveRequests.filter(r => r.status !== 'PENDING').length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-gray-400">No review history found.</td>
                      </tr>
                    ) : (
                      leaveRequests.filter(r => r.status !== 'PENDING').map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-2 font-bold text-brand-navy">{req.user.name}</td>
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
                          <td className="py-3 px-2 text-gray-500">{req.reviewedBy?.name || 'System'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Team Goals & KPIs */}
        {activeTab === 'goals' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Goal Form */}
            <div className="premium-card p-6 lg:col-span-1 space-y-4">
              <h2 className="text-lg font-bold text-brand-navy font-heading flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-brand-cta" />
                Assign Performance Goal
              </h2>

              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">Team Member</label>
                  <select
                    required
                    value={goalUser}
                    onChange={(e) => setGoalUser(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-2.5 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                  >
                    <option value="">Select team member</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">Goal Title</label>
                  <input
                    type="text"
                    required
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="e.g. Optimize Hono APIs"
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">KPI / Metric Description</label>
                  <textarea
                    required
                    rows={2}
                    value={goalKPI}
                    onChange={(e) => setGoalKPI(e.target.value)}
                    placeholder="Describe how progress will be measured..."
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy mb-1">Target Threshold</label>
                  <input
                    type="text"
                    required
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    placeholder="e.g. bundle size < 300kb"
                    className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Weight (%)</label>
                    <input
                      type="number"
                      required
                      min="5"
                      max="100"
                      value={goalWeight}
                      onChange={(e) => setGoalWeight(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">Appraisal Period</label>
                    <select
                      value={goalPeriod}
                      onChange={(e) => setGoalPeriod(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200/80 py-2 px-2.5 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                    >
                      <option value="2026-H1">2026-H1</option>
                      <option value="2026-H2">2026-H2</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs cursor-pointer btn-premium text-center disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : 'Assign Goal to User'}
                </button>
              </form>
            </div>

            {/* Goals review list grid */}
            <div className="premium-card p-6 lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-brand-navy font-heading">Team Performance Goals</h2>

              <div className="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar-container pr-1">
                <table className="min-w-full text-left text-xs relative border-collapse">
                  <thead className="sticky top-0 bg-slate-100/70 backdrop-blur-xs text-slate-700 font-bold z-10">
                    <tr className="border-b border-gray-200/50 text-gray-500 font-bold tracking-wider">
                      <th className="py-3 px-2 bg-transparent">Employee</th>
                      <th className="py-3 px-2 bg-transparent">Goal Description</th>
                      <th className="py-3 px-2 text-center bg-transparent">Weight</th>
                      <th className="py-3 px-2 text-center bg-transparent">Period</th>
                      <th className="py-3 px-2 text-center bg-transparent">Rating</th>
                      <th className="py-3 px-2 text-center bg-transparent">Status</th>
                      <th className="py-3 px-2 text-center bg-transparent">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {goals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-gray-400">No active goals set for team members.</td>
                      </tr>
                    ) : (
                      goals.map((g) => (
                        <tr key={g.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-2 font-bold text-brand-navy">{g.user.name}</td>
                          <td className="py-3 px-2 text-gray-500">
                            <div className="font-bold text-brand-navy">{g.goalTitle}</div>
                            <div className="text-[10px] mt-0.5">KPI: {g.kpi}</div>
                            <div className="text-[10px] italic">Target: {g.target}</div>
                            {g.achievement && (
                              <div className="mt-1.5 p-1.5 bg-white rounded border border-gray-200 text-[10px]">
                                <span className="font-bold block text-[9px] text-gray-400">Accomplishment:</span>
                                {g.achievement}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-gray-500">{g.weight}%</td>
                          <td className="py-3 px-2 text-center text-gray-500">{g.period}</td>
                          <td className="py-3 px-2 text-center font-extrabold text-brand-cta">
                            {g.rating !== null ? g.rating.toFixed(1) : '-'}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                              g.status === 'HR_REVIEWED' ? 'bg-purple-100 text-purple-800' :
                              g.status === 'MANAGER_APPROVED' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {formatToTitleCase(g.status)}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={() => {
                                setSelectedGoal(g);
                                setGoalRatingInput(g.rating ? g.rating.toString() : '4.0');
                                setGoalStatusInput(g.status);
                                setIsGoalModalOpen(true);
                              }}
                              className="bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold px-2.5 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
                            >
                              Rate / Update
                            </button>
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

      {/* Rejection Reason Modal */}
      {isRejectModalOpen && rejectRequestId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white/85 backdrop-blur-lg rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/40 space-y-4">
            <h3 className="text-lg font-bold text-brand-navy font-heading">Reject Leave Request</h3>
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
                  className="bg-slate-100 hover:bg-slate-200 text-brand-navy font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
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
      
      {/* Goal Update Modal */}
      {isGoalModalOpen && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/85 backdrop-blur-lg rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/40 space-y-4">
            <h3 className="text-lg font-bold text-brand-navy font-heading">Evaluate Performance Goal</h3>
            <p className="text-xs text-gray-500">Provide final evaluation score & rating for <strong>{selectedGoal.user.name}</strong>.</p>

            <form onSubmit={handleUpdateGoalStatusRating} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-navy mb-1">Manager Rating (1.0 to 5.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  required
                  value={goalRatingInput}
                  onChange={(e) => setGoalRatingInput(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-navy mb-1">Status</label>
                <select
                  value={goalStatusInput}
                  onChange={(e) => setGoalStatusInput(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200/80 py-2 px-2.5 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs cursor-pointer"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="MID_YEAR">Mid Year</option>
                  <option value="YEAR_END">Year End</option>
                  <option value="MANAGER_APPROVED">Manager Approved</option>
                  <option value="HR_REVIEWED">Hr Reviewed</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsGoalModalOpen(false);
                    setSelectedGoal(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-brand-navy font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer btn-premium shadow-md"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {selectedMemberForDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200/80 space-y-4 text-brand-navy max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-150 pb-3">
              <div className="flex items-center gap-3">
                {selectedMemberForDetail.employeeProfile?.profileImage ? (
                  <img 
                    src={selectedMemberForDetail.employeeProfile.profileImage} 
                    alt="Avatar" 
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-brand-navy/60">
                    {selectedMemberForDetail.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold font-heading">
                    {formatEmployeeName(selectedMemberForDetail.name)}
                  </h3>
                  <span className="text-xs text-gray-500 font-medium block">
                    Role: {selectedMemberForDetail.role} | Emp No: #{selectedMemberForDetail.id.slice(-4).toUpperCase()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMemberForDetail(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-normal">
              {/* Section 1: Personal Profile */}
              <div className="space-y-3 p-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl">
                <h4 className="font-extrabold text-[10px] text-gray-400 tracking-wider mb-2">Personal Profile</h4>
                <div className="space-y-2">
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Gender:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.gender || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Date of Birth:</strong>
                    <span className="font-bold">
                      {selectedMemberForDetail.employeeProfile?.dateOfBirth ? new Date(selectedMemberForDetail.employeeProfile.dateOfBirth).toLocaleDateString('en-GB') : 'N/A'}
                    </span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Marital Status:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.maritalStatus || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Blood Group:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.bloodGroup || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between">
                    <strong className="text-gray-500">Nationality:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.nationality || 'N/A'}</span>
                  </p>
                </div>
              </div>

              {/* Section 2: Contact Details */}
              <div className="space-y-3 p-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl">
                <h4 className="font-extrabold text-[10px] text-gray-400 tracking-wider mb-2">Contact Info</h4>
                <div className="space-y-2">
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Mobile Number:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.mobileNumber || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Personal Email:</strong>
                    <span className="font-bold truncate max-w-[150px]" title={selectedMemberForDetail.employeeProfile?.personalEmail}>{selectedMemberForDetail.employeeProfile?.personalEmail || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Professional Email:</strong>
                    <span className="font-bold truncate max-w-[150px]" title={selectedMemberForDetail.employeeProfile?.professionalEmail}>{selectedMemberForDetail.employeeProfile?.professionalEmail || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between">
                    <strong className="text-gray-500">Emergency Number:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.emergencyContact || 'N/A'}</span>
                  </p>
                </div>
              </div>

              {/* Section 3: Professional Info */}
              <div className="space-y-3 p-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl md:col-span-2">
                <h4 className="font-extrabold text-[10px] text-gray-400 tracking-wider mb-2">Employment & Job Profile</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Date of Joining:</strong>
                    <span className="font-bold">
                      {selectedMemberForDetail.employeeProfile?.dateOfJoining ? new Date(selectedMemberForDetail.employeeProfile.dateOfJoining).toLocaleDateString('en-GB') : 'N/A'}
                    </span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Employment Status:</strong>
                    <span className="font-bold text-emerald-600">{selectedMemberForDetail.employeeProfile?.employmentStatus || 'Active'}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Employee Type:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.employeeType || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Department:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.department || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Designation:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.designation || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Insurance Number:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.insuranceNumber || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Expected End Date:</strong>
                    <span className="font-bold">
                      {selectedMemberForDetail.employeeProfile?.expectedEndDate ? new Date(selectedMemberForDetail.employeeProfile.expectedEndDate).toLocaleDateString('en-GB') : 'N/A'}
                    </span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Increment/Perks:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.incrementPerks || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between">
                    <strong className="text-gray-500">Timezone Context:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.timezone || 'Asia/Kolkata'}</span>
                  </p>
                </div>
              </div>

              {/* Section 4: Address Details */}
              <div className="space-y-3 p-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl md:col-span-2">
                <h4 className="font-extrabold text-[10px] text-gray-400 tracking-wider mb-2">Address Details</h4>
                <div className="space-y-2">
                  <div>
                    <strong className="text-gray-500 block mb-0.5">Current Address:</strong>
                    <p className="font-semibold text-slate-700">{selectedMemberForDetail.employeeProfile?.currentAddress || 'N/A'}</p>
                  </div>
                  <div className="border-t border-slate-100 pt-2 mt-2">
                    <strong className="text-gray-500 block mb-0.5">Permanent Address:</strong>
                    <p className="font-semibold text-slate-700">{selectedMemberForDetail.employeeProfile?.permanentAddress || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Section 5: Financial Details */}
              <div className="space-y-3 p-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl md:col-span-2">
                <h4 className="font-extrabold text-[10px] text-gray-400 tracking-wider mb-2">Financial Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Bank Name:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.bankName || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Bank Branch:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.bankBranch || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Bank Address:</strong>
                    <span className="font-bold truncate max-w-[150px]" title={selectedMemberForDetail.employeeProfile?.bankAddress}>{selectedMemberForDetail.employeeProfile?.bankAddress || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">Account Number:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.accountNumber || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">IFSC Code:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.ifsc || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">PF Number:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.pfNumber || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <strong className="text-gray-500">UAN Number:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.uan || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between">
                    <strong className="text-gray-500">PAN Card:</strong>
                    <span className="font-bold">{selectedMemberForDetail.employeeProfile?.pan || 'N/A'}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedMemberForDetail(null)}
                className="bg-brand-navy hover:bg-brand-navy-light text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer w-full text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Track Sheet Feedback Modal */}
      {commentingTrackSheet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-brand-navy font-heading">Provide Log Feedback</h3>
            <p className="text-xs text-gray-550 leading-relaxed">
              Add review comments or instructions on completed task log by <strong>{formatEmployeeName(commentingTrackSheet.user.name)}</strong>:
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs text-slate-600 space-y-1">
              <div><strong>Task:</strong> {commentingTrackSheet.project}</div>
              <div><strong>Desc:</strong> {commentingTrackSheet.taskDescription}</div>
              {commentingTrackSheet.referenceLink && (
                <div>
                  <strong>Work Link:</strong>{' '}
                  <a
                    href={commentingTrackSheet.referenceLink.startsWith('http') ? commentingTrackSheet.referenceLink : `https://${commentingTrackSheet.referenceLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-cta hover:underline font-bold"
                  >
                    View Link
                  </a>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveComment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-navy mb-1">Feedback Comment</label>
                <textarea
                  required
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="E.g. Excellent work, verify edge cases in production..."
                  className="block w-full rounded-xl border border-gray-200/80 py-2 px-3 text-xs text-brand-gray bg-white/70 backdrop-blur-xs outline-none focus:border-brand-cta focus:ring-4 focus:ring-brand-cta/15 transition-all shadow-xs resize-y min-h-[50px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCommentingTrackSheet(null);
                    setCommentText('');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-brand-navy font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="bg-brand-cta hover:bg-blue-700 hover:shadow-lg hover:shadow-brand-cta/15 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer btn-premium shadow-md disabled:opacity-50"
                >
                  {submittingComment ? 'Saving...' : 'Save Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </main>
    </div>
    </div>
  );
}
