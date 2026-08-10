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
  Calendar
} from 'lucide-react';
import Speedometer from '@/components/Speedometer';

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
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'reports' | 'policies' | 'audit' | 'performance' | 'leaves'>('analytics');
  
  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [reports, setReports] = useState<TLReport[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Performance Rating States
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [overrideUserId, setOverrideUserId] = useState('');
  const [overrideRating, setOverrideRating] = useState('GREEN');
  const [overrideReason, setOverrideReason] = useState('');
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [performanceCounts, setPerformanceCounts] = useState({ RED: 0, YELLOW: 0, GREEN: 0, BLUE: 0 });

  // Leave Request States
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

  // User Form States
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState('EMPLOYEE');
  const [userTeamId, setUserTeamId] = useState('');
  const [userManagerId, setUserManagerId] = useState('');

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
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [roleLoading, setRoleLoading] = useState(false); // Refactored to avoid generic loading collision
  const [loading, setLoading] = useState(false);

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
    } catch (e) {
      console.error('Error fetching admin data:', e);
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

  const handleOpenOverrideModal = (userId: string, currentRating: string) => {
    setOverrideUserId(userId);
    setOverrideRating(currentRating);
    setOverrideReason('');
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

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg pb-12">
      <Header />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-brand-red flex items-start gap-2.5 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 flex items-start gap-2.5 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Dashboard Title & Quick KPIs */}
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-brand-navy font-heading">HR & Admin Command Center</h2>
          <p className="text-sm text-gray-500 mt-1">Configure company policy, verify check-ins, approve reports, and audit system actions.</p>
        </div>

        {/* HR KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white premium-card p-4 border border-gray-100 text-center">
            <span className="block text-3xl font-extrabold text-brand-navy font-heading">{users.length}</span>
            <span className="text-[10px] font-bold text-gray-400 mt-1 block uppercase">Active Accounts</span>
          </div>
          <div className="bg-white premium-card p-4 border border-gray-100 text-center">
            <span className="block text-3xl font-extrabold text-emerald-600 font-heading">
              {users.length > 0 ? '92%' : '0%'}
            </span>
            <span className="text-[10px] font-bold text-gray-400 mt-1 block uppercase">Avg Attendance</span>
          </div>
          <div className="bg-white premium-card p-4 border border-gray-100 text-center">
            <span className="block text-3xl font-extrabold text-brand-red font-heading">{holidays.length}</span>
            <span className="text-[10px] font-bold text-gray-400 mt-1 block uppercase">Company Holidays</span>
          </div>
          <div className="bg-white premium-card p-4 border border-gray-100 text-center">
            <span className="block text-3xl font-extrabold text-brand-cta font-heading">{reports.filter(r => r.status === 'PENDING').length}</span>
            <span className="text-[10px] font-bold text-gray-400 mt-1 block uppercase">Pending TL Reports</span>
          </div>
          <div className="bg-white premium-card p-4 border border-gray-100 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1 text-center">Performance Overview</span>
            <div className="flex justify-around items-center gap-1">
              <div className="text-center">
                <span className="block text-xs font-extrabold text-blue-600 bg-blue-50 px-1 rounded">{performanceCounts.BLUE}</span>
                <span className="text-[8px] text-gray-400 block mt-0.5">Blue</span>
              </div>
              <div className="text-center">
                <span className="block text-xs font-extrabold text-emerald-600 bg-emerald-50 px-1 rounded">{performanceCounts.GREEN}</span>
                <span className="text-[8px] text-gray-400 block mt-0.5">Green</span>
              </div>
              <div className="text-center">
                <span className="block text-xs font-extrabold text-amber-600 bg-amber-50 px-1 rounded">{performanceCounts.YELLOW}</span>
                <span className="text-[8px] text-gray-400 block mt-0.5">Yellow</span>
              </div>
              <div className="text-center">
                <span className="block text-xs font-extrabold text-brand-red bg-red-50 px-1 rounded">{performanceCounts.RED}</span>
                <span className="text-[8px] text-gray-400 block mt-0.5">Red</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'analytics' ? 'border-brand-navy text-brand-navy' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Analytics & Export
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'users' ? 'border-brand-navy text-brand-navy' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Account Management
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-3 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'performance' ? 'border-brand-navy text-brand-navy' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Performance Ratings
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`py-3 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'leaves' ? 'border-brand-navy text-brand-navy' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Leave Requests
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-3 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'reports' ? 'border-brand-navy text-brand-navy' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Review TL Reports
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`py-3 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'policies' ? 'border-brand-navy text-brand-navy' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Policies & Holidays
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'audit' ? 'border-brand-navy text-brand-navy' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            System Audit Log
          </button>
        </div>

        {/* TAB 1: Analytics & Excel Export */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            
            {/* Visual Charts */}
            {mounted && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Attendance Trends */}
                <div className="bg-white premium-card p-6 border border-gray-100 lg:col-span-2">
                  <h3 className="text-base font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-brand-cta" />
                    Attendance Trends (Weekly Overview)
                  </h3>
                  
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
                <div className="bg-white premium-card p-6 border border-gray-100 lg:col-span-1">
                  <h3 className="text-base font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-brand-cta" />
                    Deliverables Completion Rate
                  </h3>
                  
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
            <div className="bg-white premium-card p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-brand-cta" />
                Data Export & Excel Stream Center
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Export Data Type</label>
                  <select
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-xs text-brand-gray bg-white outline-none"
                  >
                    <option value="attendance">Shift Attendance Logs</option>
                    <option value="tracksheet">Work Track Sheets</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Filter Team</label>
                  <select
                    value={exportTeam}
                    onChange={(e) => setExportTeam(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-xs text-brand-gray bg-white outline-none"
                  >
                    <option value="all">All Teams</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Filter Employee</label>
                  <select
                    value={exportUser}
                    onChange={(e) => setExportUser(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-xs text-brand-gray bg-white outline-none"
                  >
                    <option value="all">All Employees</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    value={exportStart}
                    onChange={(e) => setExportStart(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 py-1.5 px-3 text-xs text-brand-gray bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    value={exportEnd}
                    onChange={(e) => setExportEnd(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 py-1.5 px-3 text-xs text-brand-gray bg-white outline-none"
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left side actions column */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* Create Account Form */}
              <div className="bg-white premium-card p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-cta" />
                Provision New Account
              </h3>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="John Doe"
                    className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-xs text-brand-gray bg-white outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="john@nextitpoint.com"
                    className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-xs text-brand-gray bg-white outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-xs text-brand-gray bg-white outline-none sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">System Role</label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-xs text-brand-gray bg-white outline-none"
                    >
                      <option value="EMPLOYEE">EMPLOYEE</option>
                      <option value="TL">TEAM LEADER</option>
                      <option value="HR_ADMIN">HR / ADMIN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Assign Team</label>
                    <select
                      value={userTeamId}
                      onChange={(e) => setUserTeamId(e.target.value)}
                      className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-xs text-brand-gray bg-white outline-none"
                    >
                      <option value="">No Team Assigned</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Report Manager (TL)</label>
                  <select
                    value={userManagerId}
                    onChange={(e) => setUserManagerId(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-xs text-brand-gray bg-white outline-none"
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
                  className="w-full bg-brand-cta text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all text-sm cursor-pointer btn-premium text-center disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </form>
            </div>

              {/* Create Team Form */}
              <div className="bg-white premium-card p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-brand-red" />
                  Create New Team
                </h3>

                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Team Name</label>
                    <input
                      type="text"
                      required
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="e.g. Sales Team"
                      className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-xs text-brand-gray bg-white outline-none sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Assign Team Leader (Optional)</label>
                    <select
                      value={newTeamLeaderId}
                      onChange={(e) => setNewTeamLeaderId(e.target.value)}
                      className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-xs text-brand-gray bg-white outline-none"
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
                    className="w-full bg-brand-cta text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all text-sm cursor-pointer btn-premium text-center disabled:opacity-50"
                  >
                    {loading ? 'Creating Team...' : 'Create Team'}
                  </button>
                </form>
              </div>

            </div>

            {/* Accounts Directory */}
            <div className="bg-white premium-card p-6 border border-gray-100 lg:col-span-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <h3 className="text-lg font-bold text-brand-navy font-heading">User Directory</h3>
                
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search accounts..."
                    className="block w-full rounded-lg border border-gray-200 py-1.5 pl-9 pr-3 text-xs text-brand-gray bg-white outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-2">Name</th>
                      <th className="py-3 px-2">Role</th>
                      <th className="py-3 px-2">Team</th>
                      <th className="py-3 px-2">Reporting Manager</th>
                      <th className="py-3 px-2 text-center">Status</th>
                      <th className="py-3 px-2 text-center">Actions</th>
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
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-gray-500 font-medium">{u.team ? u.team.name : 'Unassigned'}</td>
                          <td className="py-3 px-2 text-gray-500 font-medium">{u.manager ? u.manager.name : 'None'}</td>
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isDeactivated ? 'bg-red-100 text-brand-red' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isDeactivated ? 'DEACTIVATED' : 'ACTIVE'}
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
        )}

        {/* TAB 3: Review TL Submitted Reports */}
        {activeTab === 'reports' && (
          <div className="bg-white premium-card p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-brand-navy font-heading mb-4">Review Periodic Team Status Reports</h3>

            <div className="space-y-6">
              {reports.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No team reports submitted yet.</p>
              ) : (
                reports.map((rep) => (
                  <div key={rep.id} className="p-5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-all">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-brand-navy flex items-center gap-2">
                          Team: {rep.team.name}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Period: <span className="font-semibold">{new Date(rep.periodStart).toLocaleDateString()} to {new Date(rep.periodEnd).toLocaleDateString()}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          rep.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          rep.status === 'REJECTED' ? 'bg-red-100 text-brand-red' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {rep.status}
                        </span>

                        {rep.status === 'PENDING' && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleReviewReport(rep.id, 'APPROVED')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1 px-3 rounded cursor-pointer transition-colors shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewReport(rep.id, 'REJECTED')}
                              className="bg-brand-red hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded cursor-pointer transition-colors shadow-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-100 text-xs text-gray-500 whitespace-pre-line font-medium leading-relaxed">
                      {rep.summary}
                    </div>

                    <div className="mt-2 text-[10px] text-gray-400 text-right">
                      Submitted by: {rep.submittedBy.name} &bull; Filed {new Date(rep.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Configure Policy & Holiday Calendars */}
        {activeTab === 'policies' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Holiday Configuration */}
            <div className="space-y-6">
              <div className="bg-white premium-card p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                  Configure Company Holidays
                </h3>

                <form onSubmit={handleCreateHoliday} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end mb-6">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Holiday Name</label>
                    <input
                      type="text"
                      required
                      value={holidayName}
                      onChange={(e) => setHolidayName(e.target.value)}
                      placeholder="Independence Day"
                      className="block w-full rounded-lg border border-gray-200 py-1.5 px-3 text-xs text-brand-gray bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={holidayDate}
                      onChange={(e) => setHolidayDate(e.target.value)}
                      className="block w-full rounded-lg border border-gray-200 py-1.5 px-3 text-xs text-brand-gray bg-white outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3 flex justify-end mt-2">
                    <button
                      type="submit"
                      className="bg-brand-cta text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-blue-700 transition-all cursor-pointer btn-premium"
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
                      <div key={h.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg text-xs border border-gray-100">
                        <div>
                          <span className="font-bold text-brand-navy">{h.name}</span>
                          <span className="text-[10px] text-gray-400 ml-2">({new Date(h.date).toLocaleDateString()})</span>
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
              <div className="bg-white premium-card p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                  Configure Leave Types Policy
                </h3>

                <form onSubmit={handleCreateLeaveType} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end mb-6">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Leave Type Name</label>
                    <input
                      type="text"
                      required
                      value={leaveName}
                      onChange={(e) => setLeaveName(e.target.value)}
                      placeholder="Casual Leave"
                      className="block w-full rounded-lg border border-gray-200 py-1.5 px-3 text-xs text-brand-gray bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Days Allowed</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={leaveDays}
                      onChange={(e) => setLeaveDays(e.target.value)}
                      className="block w-full rounded-lg border border-gray-200 py-1.5 px-3 text-xs text-brand-gray bg-white outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3 flex justify-end mt-2">
                    <button
                      type="submit"
                      className="bg-brand-cta text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-blue-700 transition-all cursor-pointer btn-premium"
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
                      <div key={l.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg text-xs border border-gray-100">
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
        )}

        {/* TAB 5: System Audit Logs */}
        {activeTab === 'audit' && (
          <div className="bg-white premium-card p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-brand-red shrink-0" />
              Company Audit Logs (Key System Operations)
            </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Timestamp</th>
                    <th className="py-3 px-2">Operation Executed By</th>
                    <th className="py-3 px-2">Action Type</th>
                    <th className="py-3 px-2">Target Entity</th>
                    <th className="py-3 px-2">Target ID</th>
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
        )}

        {/* TAB 6: Performance Score Ratings */}
        {activeTab === 'performance' && (
          <div className="bg-white premium-card p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-brand-navy font-heading">Employee Performance Indicator Overview</h3>
                <p className="text-xs text-gray-400 mt-1">Automatic nightly auto-scoring with manual override capability for HR Admins.</p>
              </div>
              <button
                onClick={() => fetchAdminData()}
                className="bg-brand-bg hover:bg-gray-100 text-brand-navy border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Recompute Auto-Scores
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Employee</th>
                    <th className="py-3 px-2">Team</th>
                    <th className="py-3 px-2 text-center">Score Type</th>
                    <th className="py-3 px-2 text-center">Auto Score</th>
                    <th className="py-3 px-2 text-center">Rating Badge</th>
                    <th className="py-3 px-2">Override Reason</th>
                    <th className="py-3 px-2 text-center">Last Updated</th>
                    <th className="py-3 px-2 text-center">Action</th>
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
                        <td className="py-3 px-2 text-center font-extrabold text-brand-navy">{Math.round(p.score.autoScore)}%</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                            p.score.rating === 'BLUE' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            p.score.rating === 'GREEN' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            p.score.rating === 'YELLOW' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-red-100 text-brand-red border-red-200'
                          }`}>
                            {p.score.rating}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-500 max-w-xs truncate" title={p.score.overrideReason || ''}>
                          {p.score.overrideReason || '-'}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-400">
                          {new Date(p.score.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2 text-center whitespace-nowrap space-x-1.5">
                          <button
                            onClick={() => handleOpenOverrideModal(p.user.id, p.score.rating)}
                            className="bg-brand-cta hover:bg-blue-700 text-white font-bold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer"
                          >
                            Override
                          </button>
                          {p.score.manualOverride && (
                            <button
                              onClick={() => handleClearOverride(p.user.id)}
                              className="bg-gray-100 hover:bg-gray-200 text-brand-navy font-bold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer"
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
        )}

        {/* TAB 7: Leave Requests System */}
        {activeTab === 'leaves' && (
          <div className="bg-white premium-card p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-brand-navy font-heading mb-4">All Company Leave Requests</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Employee</th>
                    <th className="py-3 px-2">Team</th>
                    <th className="py-3 px-2">Leave Type</th>
                    <th className="py-3 px-2">Duration</th>
                    <th className="py-3 px-2">Reason</th>
                    <th className="py-3 px-2 text-center">Status</th>
                    <th className="py-3 px-2">Reviewed By</th>
                    <th className="py-3 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-gray-400">No leave requests logged in system.</td>
                    </tr>
                  ) : (
                    leaveRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/50">
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
                            req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            req.status === 'REJECTED' ? 'bg-red-100 text-brand-red' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-500">{req.reviewedBy?.name || '-'}</td>
                        <td className="py-3 px-2 text-center whitespace-nowrap space-x-1.5">
                          {req.status === 'PENDING' ? (
                            <>
                              <button
                                onClick={() => handleReviewLeaveRequest(req.id, 'APPROVED')}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReviewLeaveRequest(req.id, 'REJECTED')}
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
          </div>
        )}

      </main>

      {/* Override Modal */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-brand-navy font-heading mb-4">Override Performance Rating</h3>
            
            {(() => {
              const uObj = performanceData.find((p) => p.user.id === overrideUserId);
              if (uObj) {
                return (
                  <div className="mb-4 text-center border-b border-gray-100 pb-4">
                    <p className="text-xs text-gray-400 font-semibold mb-2">Current Rating for {uObj.user.name}</p>
                    <div className="flex justify-center">
                      <Speedometer score={uObj.score.autoScore} rating={uObj.score.rating} size={150} />
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <form onSubmit={handleSaveOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase mb-1">New Performance Rating</label>
                <select
                  required
                  value={overrideRating}
                  onChange={(e) => setOverrideRating(e.target.value)}
                  className="block w-full rounded-lg border-0 py-2.5 px-3 text-brand-gray shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-brand-cta sm:text-sm bg-white outline-none"
                >
                  <option value="RED">RED (Poor)</option>
                  <option value="YELLOW">YELLOW (Needs Improvement)</option>
                  <option value="GREEN">GREEN (Good)</option>
                  <option value="BLUE">BLUE (Excellent)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Override Reason</label>
                <textarea
                  required
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Enter justification for overriding automatic score calculation..."
                  className="block w-full rounded-lg border-0 py-2 px-3 text-brand-gray shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-brand-cta sm:text-sm bg-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-brand-navy font-bold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-cta hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer btn-premium shadow-md"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
