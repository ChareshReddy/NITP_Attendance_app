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
  TrendingUp
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

  // Form States
  const [project, setProject] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [hours, setHours] = useState('8.0');
  const [notes, setNotes] = useState('');

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
      const taskRes = await fetch('/api/tasks');
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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log hours');

      setSuccessMsg('Track sheet entry created successfully!');
      setProject('');
      setTaskDescription('');
      setNotes('');
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

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg pb-12">
      <Header />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Info & Performance Rating */}
        <div className="lg:col-span-3 flex flex-col md:flex-row md:items-center justify-between bg-white premium-card p-6 border border-gray-100 gap-4">
          <div>
            <h2 className="text-xl font-bold text-brand-navy font-heading">Welcome back!</h2>
            <p className="text-xs text-gray-500 mt-1">Here is your attendance overview and task track sheets for today.</p>
          </div>
          {performanceScore && (
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Rating:</span>
              <span className={`px-3 py-1 text-xs font-extrabold rounded-full tracking-wide shadow-sm border ${
                performanceScore.rating === 'BLUE' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                performanceScore.rating === 'GREEN' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                performanceScore.rating === 'YELLOW' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                'bg-red-100 text-brand-red border-red-200'
              }`}>
                {performanceScore.rating} ({Math.round(performanceScore.autoScore)}%)
              </span>
              {performanceScore.manualOverride && (
                <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold" title={`Reason: ${performanceScore.overrideReason}`}>
                  Override
                </span>
              )}
            </div>
          )}
        </div>

        {/* Alerts Center */}
        <div className="lg:col-span-3">
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

        {/* Column 1: Attendance Logging & Stats */}
        <div className="space-y-8 lg:col-span-1">
          {/* Shift Clock Card */}
          <div className="bg-white premium-card p-6 border border-gray-100 relative overflow-hidden">
            {/* Top Light-Blue Badge */}
            <div className="absolute top-4 right-4 w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-brand-navy">
              <Clock className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-bold text-brand-navy font-heading mb-4">Daily Work Shift</h3>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Today's Date</p>
                <p className="text-base font-bold text-brand-navy mt-0.5">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase">Check In</p>
                  <p className="text-lg font-extrabold text-brand-navy mt-0.5">
                    {todayRecord ? formatTime(todayRecord.checkInTime) : '--:--'}
                  </p>
                  {todayRecord && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      todayRecord.status === 'LATE' ? 'bg-red-100 text-brand-red' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {todayRecord.status}
                    </span>
                  )}
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase">Check Out</p>
                  <p className="text-lg font-extrabold text-brand-navy mt-0.5">
                    {todayRecord && todayRecord.checkOutTime ? formatTime(todayRecord.checkOutTime) : '--:--'}
                  </p>
                </div>
              </div>

              {todayRecord && (
                <div className="text-xs text-gray-400 flex flex-col gap-1 px-1 mt-2">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> IP: {todayRecord.ip}</span>
                  <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Timezone: {todayRecord.tz}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {!todayRecord ? (
                <button
                  onClick={handleCheckIn}
                  disabled={loadingAttendance}
                  className="flex-1 bg-brand-cta text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-all text-sm cursor-pointer disabled:opacity-50 text-center btn-premium shadow-md"
                >
                  {loadingAttendance ? 'Processing...' : 'Check In Now'}
                </button>
              ) : !todayRecord.checkOutTime ? (
                <button
                  onClick={handleCheckOut}
                  disabled={loadingAttendance}
                  className="flex-1 bg-brand-red text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-all text-sm cursor-pointer disabled:opacity-50 text-center btn-premium shadow-md"
                >
                  {loadingAttendance ? 'Processing...' : 'Check Out Now'}
                </button>
              ) : (
                <div className="flex-1 text-center bg-gray-100 text-gray-500 font-bold py-3 px-4 rounded-lg text-sm border border-gray-200">
                  Shift Completed
                </div>
              )}
            </div>
          </div>

          {performanceScore && (
            <div className="bg-white premium-card p-6 border border-gray-100 relative">
              <h3 className="text-sm font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-cta shrink-0" />
                Performance Indicator
              </h3>
              <div className="flex justify-center">
                <Speedometer score={performanceScore.autoScore} rating={performanceScore.rating} size={190} />
              </div>
              {performanceScore.manualOverride && (
                <div className="mt-4 p-2.5 bg-purple-50 border border-purple-100 rounded-lg text-[10px] text-purple-700">
                  <span className="font-bold block mb-0.5">HR Override Justification:</span>
                  {performanceScore.overrideReason}
                </div>
              )}
            </div>
          )}

          {/* Personal KPI Tiles */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white premium-card p-4 border border-gray-100 text-center">
              <span className="block text-3xl font-extrabold text-brand-navy font-heading">{stats.present}</span>
              <span className="text-xs font-semibold text-gray-400 mt-1 block">Present Days</span>
            </div>
            <div className="bg-white premium-card p-4 border border-gray-100 text-center">
              <span className="block text-3xl font-extrabold text-brand-red font-heading">{stats.late}</span>
              <span className="text-xs font-semibold text-gray-400 mt-1 block">Late Arrivals</span>
            </div>
            <div className="bg-white premium-card p-4 border border-gray-100 text-center">
              <span className="block text-3xl font-extrabold text-brand-maroon font-heading">{stats.leave}</span>
              <span className="text-xs font-semibold text-gray-400 mt-1 block">Leave Days</span>
            </div>
            <div className="bg-white premium-card p-4 border border-gray-100 text-center">
              <span className="block text-3xl font-extrabold text-brand-cta font-heading">
                {trackSheets.length > 0 
                  ? (trackSheets.reduce((sum, item) => sum + item.hours, 0) / trackSheets.length).toFixed(1)
                  : '0.0'}h
              </span>
              <span className="text-xs font-semibold text-gray-400 mt-1 block">Avg Hours/Day</span>
            </div>
          </div>

          {/* Notifications Panel */}
          <div className="bg-white premium-card p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-brand-navy font-heading flex items-center gap-2">
                <Bell className="w-5 h-5 text-brand-cta" />
                Alerts Center
              </h3>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkNotificationsRead}
                  className="text-xs font-semibold text-brand-link hover:underline cursor-pointer"
                >
                  Clear All ({unreadCount})
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No notifications found.</p>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-3 rounded-lg border text-xs relative ${
                      notif.read ? 'bg-gray-50 border-gray-100 text-gray-500' : 'bg-blue-50/50 border-blue-100 text-brand-navy font-medium'
                    }`}
                  >
                    <p className="pr-3">{notif.message}</p>
                    <span className="block mt-1 text-[9px] text-gray-400">
                      {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Logging Work & Task Trackers */}
        <div className="space-y-8 lg:col-span-2">
          {/* Work Track Sheet Submission Form */}
          <div className="bg-white premium-card p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-cta" />
              Log Daily Work Hours
            </h3>
            
            <form onSubmit={handleSubmitTrackSheet} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Task</label>
                  <input
                    type="text"
                    required
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    placeholder="e.g. Database Refactoring"
                    className="block w-full rounded-lg border-0 py-2.5 px-3 text-brand-gray shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-brand-cta sm:text-sm bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Hours Logged</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    required
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="block w-full rounded-lg border-0 py-2.5 px-3 text-brand-gray shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-brand-cta sm:text-sm bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Task Description</label>
                <textarea
                  required
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Summarize the tasks you completed (e.g. Configured modules, fixed bugs, held client demos...)"
                  className="block w-full rounded-lg border-0 py-2 px-3 text-brand-gray shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-brand-cta sm:text-sm bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Additional Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Blockers faced, dependencies, or clarifications needed."
                  className="block w-full rounded-lg border-0 py-2.5 px-3 text-brand-gray shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-brand-cta sm:text-sm bg-white outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingTrack}
                  className="bg-brand-cta text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 cursor-pointer btn-premium shadow-md disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {submittingTrack ? 'Saving...' : 'Submit Entry'}
                </button>
              </div>
            </form>
          </div>

          {/* Assigned Tasks Card */}
          <div className="bg-white premium-card p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-brand-cta" />
              Assigned Tasks
            </h3>

            <div className="space-y-4">
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No tasks assigned to you.</p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-brand-navy">{task.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        task.priority === 'HIGH' ? 'bg-red-100 text-brand-red' : 
                        task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {task.priority}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 text-xs">
                      <span className="text-gray-400 font-medium">Due Date: {new Date(task.dueDate).toLocaleDateString()}</span>
                      
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, task.status)}
                        disabled={task.status === 'COMPLETED'}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
                          task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 cursor-default' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-brand-cta hover:bg-blue-200' :
                          'bg-gray-100 text-brand-navy hover:bg-gray-200'
                        }`}
                      >
                        {task.status === 'COMPLETED' && <Check className="w-3.5 h-3.5" />}
                        {task.status === 'COMPLETED' ? 'Completed' :
                         task.status === 'IN_PROGRESS' ? 'Mark Completed' : 'Start Task'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Track Sheets History Log */}
          <div className="bg-white premium-card p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-brand-cta" />
              My Track Sheets Log
            </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Task</th>
                    <th className="py-3 px-2">Description</th>
                    <th className="py-3 px-2 text-center">Hours</th>
                    <th className="py-3 px-2 text-center">Status</th>
                    <th className="py-3 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trackSheets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-400">No work logged yet.</td>
                    </tr>
                  ) : (
                    trackSheets.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-2 font-semibold text-brand-navy whitespace-nowrap">{item.date}</td>
                        <td className="py-3 px-2 font-medium text-brand-navy whitespace-nowrap">{item.project}</td>
                        <td className="py-3 px-2 text-gray-500 max-w-xs truncate" title={item.taskDescription}>
                          {item.taskDescription}
                        </td>
                        <td className="py-3 px-2 text-center font-extrabold text-brand-navy">{item.hours}h</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            item.status === 'REJECTED' ? 'bg-red-100 text-brand-red' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          {item.status === 'PENDING' ? (
                            <button
                              onClick={() => handleDeleteTrackSheet(item.id)}
                              className="text-brand-red hover:text-red-700 transition-colors p-1 cursor-pointer"
                              title="Delete entry"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
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
          </div>
          {/* Leave Requests & Balances Card */}
          <div className="bg-white premium-card p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-cta" />
              Request Leave & Leave Balance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Balances */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider">Your Balances ({new Date().getFullYear()})</h4>
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

              {/* Form */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider">Request Time Off</h4>
                <form onSubmit={handleSubmitLeaveRequest} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Leave Type</label>
                    <select
                      required
                      value={leaveTypeId}
                      onChange={(e) => setLeaveTypeId(e.target.value)}
                      className="block w-full rounded-lg border-0 py-2 px-2.5 text-brand-gray shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-brand-cta text-xs bg-white outline-none"
                    >
                      <option value="">Select leave type</option>
                      {leaveBalances.map((bal) => (
                        <option key={bal.id} value={bal.id} disabled={bal.daysRemaining <= 0}>
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
                        className="block w-full rounded-lg border-0 py-1.5 px-2 text-brand-gray shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-brand-cta text-xs bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">End Date</label>
                      <input
                        type="date"
                        required
                        value={leaveEndDate}
                        onChange={(e) => setLeaveEndDate(e.target.value)}
                        className="block w-full rounded-lg border-0 py-1.5 px-2 text-brand-gray shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-brand-cta text-xs bg-white outline-none"
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
                      placeholder="Why do you need leave?"
                      className="block w-full rounded-lg border-0 py-1.5 px-2 text-brand-gray shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-brand-cta text-xs bg-white outline-none"
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

            {/* Leave History List */}
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

      </main>
    </div>
  );
}
