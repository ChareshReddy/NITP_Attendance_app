'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { 
  Users, 
  Clock, 
  MapPin, 
  Globe, 
  Plus, 
  FileText, 
  CheckSquare, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  Check,
  X,
  Send,
  UserCheck,
  Filter
} from 'lucide-react';

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
}

interface TeamTrackSheet {
  id: string;
  date: string;
  project: string;
  taskDescription: string;
  hours: number;
  status: string;
  notes: string | null;
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
  const [activeTab, setActiveTab] = useState<'attendance' | 'tracksheets' | 'tasks' | 'reports' | 'leaves'>('attendance');
  
  // Data States
  const [team, setTeam] = useState<{ id: string; name: string } | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [trackSheets, setTrackSheets] = useState<TeamTrackSheet[]>([]);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [reports, setReports] = useState<TeamReport[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  
  // Leave Request States
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

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
  const [filterProject, setFilterProject] = useState('');

  // Status message states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
    const matchesProject = filterProject.trim() === '' || sheet.project.toLowerCase().includes(filterProject.toLowerCase());
    return matchesMember && matchesProject;
  });

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg pb-12">
      <Header />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Alerts Center */}
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

        {/* Dashboard Title & KPIs */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-navy font-heading">
              {team ? team.name : 'Team Leader Board'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage attendance, log reviews, and track deliverables.</p>
          </div>
          {allTeams.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm self-start md:self-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inspect Team:</span>
              <select
                value={selectedTeamId}
                onChange={(e) => {
                  setSelectedTeamId(e.target.value);
                }}
                className="rounded-lg border-0 py-1.5 px-3 text-xs text-brand-navy font-bold bg-gray-50 ring-1 ring-inset ring-gray-200 outline-none focus:ring-brand-cta focus:ring-2 cursor-pointer"
              >
                {allTeams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* KPI Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white premium-card p-4 border border-gray-100 text-center">
            <span className="block text-3xl font-extrabold text-brand-navy font-heading">{activeMembersCount}</span>
            <span className="text-[10px] font-bold text-gray-400 mt-1 block uppercase">Team Members</span>
          </div>
          <div className="bg-white premium-card p-4 border border-gray-100 text-center">
            <span className="block text-3xl font-extrabold text-emerald-600 font-heading">{presentTodayCount}</span>
            <span className="text-[10px] font-bold text-gray-400 mt-1 block uppercase">Present Today</span>
          </div>
          <div className="bg-white premium-card p-4 border border-gray-100 text-center">
            <span className="block text-3xl font-extrabold text-brand-red font-heading">{lateTodayCount}</span>
            <span className="text-[10px] font-bold text-gray-400 mt-1 block uppercase">Late Arrivals</span>
          </div>
          <div className="bg-white premium-card p-4 border border-gray-100 text-center">
            <span className="block text-3xl font-extrabold text-brand-cta font-heading">{pendingTrackSheetsCount}</span>
            <span className="text-[10px] font-bold text-gray-400 mt-1 block uppercase">Pending Reviews</span>
          </div>
          <div className="bg-white premium-card p-4 border border-gray-100 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5 text-center">Team Performance</span>
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

        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-3 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'attendance' ? 'border-brand-navy text-brand-navy' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Real-time Attendance
          </button>
          <button
            onClick={() => setActiveTab('tracksheets')}
            className={`py-3 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'tracksheets' ? 'border-brand-navy text-brand-navy' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Track Sheets Review
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-3 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'tasks' ? 'border-brand-navy text-brand-navy' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Task Assignment
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
            Team Reports to HR
          </button>
        </div>

        {/* Tab Contents */}

        {/* TAB 1: Attendance Grid */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-brand-navy font-heading mb-4">Shift Attendance Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center col-span-3">No members found in this team.</p>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="bg-white premium-card p-5 border border-gray-100 relative">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-base font-bold text-brand-navy">{member.name}</h4>
                        <p className="text-xs text-gray-400">{member.email}</p>
                        {(() => {
                          const mScoreObj = performanceScores.find((p) => p.user.id === member.id);
                          if (mScoreObj) {
                            return (
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                                  mScoreObj.score.rating === 'BLUE' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                  mScoreObj.score.rating === 'GREEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                  mScoreObj.score.rating === 'YELLOW' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                  'bg-red-50 text-brand-red border-red-100'
                                }`}>
                                  {mScoreObj.score.rating} ({Math.round(mScoreObj.score.autoScore)}%)
                                </span>
                                {mScoreObj.score.manualOverride && (
                                  <span className="text-[8px] bg-purple-50 text-purple-600 px-1 py-0.5 rounded font-bold" title={`Reason: ${mScoreObj.score.overrideReason}`}>
                                    override
                                  </span>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      
                      {member.todayAttendance ? (
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          member.todayAttendance.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' :
                          member.todayAttendance.status === 'LATE' ? 'bg-red-100 text-brand-red' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {member.todayAttendance.status}
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          ABSENT
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Check In:</span>
                        <span className="font-semibold text-brand-navy">
                          {member.todayAttendance && member.todayAttendance.checkInTime ? new Date(member.todayAttendance.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Check Out:</span>
                        <span className="font-semibold text-brand-navy">
                          {member.todayAttendance?.checkOutTime ? new Date(member.todayAttendance.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                        </span>
                      </div>
                      
                      {member.todayAttendance && (
                        <div className="pt-2 flex flex-col gap-0.5 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> IP: {member.todayAttendance.ip}</span>
                          <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> TZ: {member.todayAttendance.tz}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Track Sheets Review */}
        {activeTab === 'tracksheets' && (
          <div className="bg-white premium-card p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-brand-navy font-heading">Team Track Sheets Review</h3>
              
              {/* Filters */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Filter className="w-4 h-4 text-brand-navy shrink-0" />
                <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
                  <select
                    value={filterMember}
                    onChange={(e) => setFilterMember(e.target.value)}
                    className="rounded-lg border border-gray-200 py-1.5 px-2 text-xs text-brand-gray bg-white outline-none"
                  >
                    <option value="all">All Members</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <input
                    type="text"
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    placeholder="Filter by Task..."
                    className="rounded-lg border border-gray-200 py-1.5 px-2 text-xs text-brand-gray bg-white outline-none w-36"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Member</th>
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Task</th>
                    <th className="py-3 px-2">Task Description</th>
                    <th className="py-3 px-2 text-center">Hours</th>
                    <th className="py-3 px-2">Notes</th>
                    <th className="py-3 px-2 text-center">Status</th>
                    <th className="py-3 px-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTrackSheets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-gray-400">No track sheets found.</td>
                    </tr>
                  ) : (
                    filteredTrackSheets.map((sheet) => (
                      <tr key={sheet.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-2 font-bold text-brand-navy">{sheet.user.name}</td>
                        <td className="py-3 px-2 font-semibold text-brand-navy whitespace-nowrap">{sheet.date}</td>
                        <td className="py-3 px-2 font-medium text-brand-navy whitespace-nowrap">{sheet.project}</td>
                        <td className="py-3 px-2 text-gray-500 max-w-xs truncate" title={sheet.taskDescription}>
                          {sheet.taskDescription}
                        </td>
                        <td className="py-3 px-2 text-center font-extrabold text-brand-navy">{sheet.hours}h</td>
                        <td className="py-3 px-2 text-gray-400 italic max-w-xs truncate" title={sheet.notes || ''}>
                          {sheet.notes || '-'}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            sheet.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            sheet.status === 'REJECTED' ? 'bg-red-100 text-brand-red' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {sheet.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          {sheet.status === 'PENDING' ? (
                            <div className="flex justify-center gap-1.5">
                              <button
                                onClick={() => handleReviewTrackSheet(sheet.id, 'APPROVED')}
                                className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 p-1.5 rounded cursor-pointer transition-colors"
                                title="Approve Log"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleReviewTrackSheet(sheet.id, 'REJECTED')}
                                className="bg-red-100 text-brand-red hover:bg-red-200 p-1.5 rounded cursor-pointer transition-colors"
                                title="Reject Log"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-[10px] font-semibold">Reviewed</span>
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

        {/* TAB 3: Tasks Assignment & Board */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Task Form */}
            <div className="bg-white premium-card p-6 border border-gray-100 lg:col-span-1">
              <h3 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-brand-cta" />
                Assign New Task
              </h3>
              
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Assignee</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-brand-gray bg-white outline-none sm:text-sm"
                  >
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Integrate DB Schema updates"
                    className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-brand-gray bg-white outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Task Description</label>
                  <textarea
                    required
                    rows={3}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Describe detail instructions and outputs expected."
                    className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-brand-gray bg-white outline-none sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Due Date</label>
                    <input
                      type="date"
                      required
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-brand-gray bg-white outline-none sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-brand-gray bg-white outline-none sm:text-sm"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-cta text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all text-sm cursor-pointer btn-premium text-center disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : 'Assign Task'}
                </button>
              </form>
            </div>

            {/* Active Tasks List */}
            <div className="bg-white premium-card p-6 border border-gray-100 lg:col-span-2">
              <h3 className="text-lg font-bold text-brand-navy font-heading mb-4">Team Task Board</h3>
              
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">No tasks currently defined.</p>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
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
                            {task.priority}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                            task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-brand-cta' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.status.replace('_', ' ')}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Report Form */}
            <div className="bg-white premium-card p-6 border border-gray-100 lg:col-span-1">
              <h3 className="text-lg font-bold text-brand-navy font-heading mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-cta" />
                Submit Team Report to HR
              </h3>
              
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={reportStart}
                      onChange={(e) => setReportStart(e.target.value)}
                      className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-brand-gray bg-white outline-none sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-navy uppercase mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={reportEnd}
                      onChange={(e) => setReportEnd(e.target.value)}
                      className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-brand-gray bg-white outline-none sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase mb-1">Status Summary</label>
                  <textarea
                    required
                    rows={5}
                    value={reportSummary}
                    onChange={(e) => setReportSummary(e.target.value)}
                    placeholder="Provide a periodic summary of team attendance, task completion rates, SAP deployment progress, roadblocks, or notes..."
                    className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-brand-gray bg-white outline-none sm:text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-cta text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all text-sm cursor-pointer btn-premium flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              </form>
            </div>

            {/* Reports Log */}
            <div className="bg-white premium-card p-6 border border-gray-100 lg:col-span-2">
              <h3 className="text-lg font-bold text-brand-navy font-heading mb-4">Past Submitted Reports</h3>
              
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">No reports submitted yet.</p>
                ) : (
                  reports.map((rep) => (
                    <div key={rep.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-extrabold text-brand-navy flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-brand-cta" />
                          {new Date(rep.periodStart).toLocaleDateString()} - {new Date(rep.periodEnd).toLocaleDateString()}
                        </span>
                        
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          rep.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          rep.status === 'REJECTED' ? 'bg-red-100 text-brand-red' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {rep.status}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 whitespace-pre-line bg-white p-3 rounded-lg border border-gray-100 mt-2 font-medium">
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
          <div className="bg-white premium-card p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-brand-navy font-heading mb-4">Pending Team Leave Requests</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Employee</th>
                    <th className="py-3 px-2">Leave Type</th>
                    <th className="py-3 px-2">Duration</th>
                    <th className="py-3 px-2">Reason</th>
                    <th className="py-3 px-2 text-center">Status</th>
                    <th className="py-3 px-2 text-center">Actions</th>
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
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center space-x-2 whitespace-nowrap">
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
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Resolved Leave History */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="text-base font-bold text-brand-navy font-heading mb-4">Leave Review History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
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
                              {req.status}
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

      </main>
    </div>
  );
}
