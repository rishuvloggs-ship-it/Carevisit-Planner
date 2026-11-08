import React, { useState, useEffect } from 'react';
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  ListTodo,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/apiClient';
import { CaregiverAvatar } from '../components/CaregiverAvatar';
import { StatusBadge } from '../components/StatusBadge';
import { TaskChecklistItem } from '../components/TaskChecklistItem';
import toast from 'react-hot-toast';

export const DashboardPage = ({ onOpenNewVisit, onSelectVisit, onOpenSmartEntry }) => {
  const { activeCircle, currentRole } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    if (!activeCircle?._id) return;
    setLoading(false);
    try {
      const res = await api.get(`/circles/${activeCircle._id}/dashboard`);
      if (res.data?.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [activeCircle]);

  const handleTaskToggle = async (taskId, targetStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/complete`, { isCompleted: targetStatus });
      toast.success(targetStatus ? 'Task completed!' : 'Task reopened');
      fetchDashboard();
    } catch (err) {
      // handled
    }
  };

  const formatTimeRange = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center items-center text-slate-400">
        <Clock className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const metrics = dashboardData?.metrics || {
    totalWeeklyTasks: 0,
    completedWeeklyTasks: 0,
    weeklyCompletionRate: 100,
    todayCount: 0,
    conflictCount: 0,
  };

  const todayVisits = dashboardData?.todayVisits || [];
  const upcomingVisits = dashboardData?.upcomingVisits || [];
  const conflictVisits = dashboardData?.conflictVisits || [];
  const recentActivity = dashboardData?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Care Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Coordination overview for{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {activeCircle?.careRecipient?.name || 'Care Recipient'}
            </span>
          </p>
        </div>

        {currentRole !== 'Viewer' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSmartEntry}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 transition flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Smart Entry
            </button>
            <button
              type="button"
              onClick={onOpenNewVisit}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              Schedule Visit
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Today's Visits</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {metrics.todayCount}
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-baseline">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Weekly Task Rate
              </p>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {metrics.weeklyCompletionRate}%
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {metrics.completedWeeklyTasks} / {metrics.totalWeeklyTasks}
            </h3>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.weeklyCompletionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div
            className={`p-3 rounded-xl ${
              metrics.conflictCount > 0
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Schedule Conflicts
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {metrics.conflictCount}
            </h3>
            <span className="text-[10px] text-slate-400">
              {metrics.conflictCount > 0 ? 'Needs circle attention' : 'No overlaps detected'}
            </span>
          </div>
        </div>
      </div>

      {/* Conflicts Needing Attention Banner */}
      {conflictVisits.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <h3 className="font-bold text-sm text-amber-900 dark:text-amber-100">
                Action Needed: {conflictVisits.length} Conflicting Visits Flagged
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {conflictVisits.map((cv) => (
              <div
                key={cv._id}
                onClick={() => onSelectVisit(cv)}
                className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-amber-200 dark:border-amber-900/60 shadow-xs hover:border-amber-400 cursor-pointer transition flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {cv.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 font-bold">
                      Flagged Conflict
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {new Date(cv.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                    • {formatTimeRange(cv.startTime, cv.endTime)}
                  </p>
                </div>
                <button
                  type="button"
                  className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg hover:bg-blue-100 transition"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Today's Visits & Recent Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Today's Schedule & Actionable Checklist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Today's Schedule & Tasks
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {new Date().toLocaleDateString([], {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          {todayVisits.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No support visits scheduled for today.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Enjoy a peaceful day or schedule a check-in visit.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayVisits.map((visit) => (
                <div
                  key={visit._id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition hover:border-blue-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4
                          onClick={() => onSelectVisit(visit)}
                          className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-blue-600 cursor-pointer transition"
                        >
                          {visit.title}
                        </h4>
                        <StatusBadge status={visit.status} />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {formatTimeRange(visit.startTime, visit.endTime)}
                        </span>
                        {visit.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {visit.location}
                          </span>
                        )}
                      </p>
                    </div>

                    <CaregiverAvatar user={visit.caregiverId} size="sm" showName={true} />
                  </div>

                  {/* Visit Checklist Tasks */}
                  {visit.tasks && visit.tasks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <ListTodo className="w-3 h-3" />
                        Checklist ({visit.tasks.filter((t) => t.isCompleted).length} / {visit.tasks.length})
                      </p>
                      {visit.tasks.map((task) => (
                        <TaskChecklistItem
                          key={task._id}
                          task={task}
                          onToggle={handleTaskToggle}
                          canToggle={currentRole !== 'Viewer'}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upcoming this week */}
          <div className="pt-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3">
              Upcoming Later This Week
            </h3>
            {upcomingVisits.length === 0 ? (
              <p className="text-xs text-slate-400">No additional visits booked for this week.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upcomingVisits.map((uv) => (
                  <div
                    key={uv._id}
                    onClick={() => onSelectVisit(uv)}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 cursor-pointer transition shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                        {uv.title}
                      </span>
                      <StatusBadge status={uv.status} />
                    </div>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                      {new Date(uv.startTime).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      • {formatTimeRange(uv.startTime, uv.endTime)}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">{uv.category}</span>
                      <CaregiverAvatar user={uv.caregiverId} size="xs" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Care Activity Stream */}
        <div className="space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Recent Care Activity
          </h3>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400">No activity logged yet.</p>
            ) : (
              recentActivity.map((act) => (
                <div key={act._id} className="flex items-start gap-2.5 text-xs">
                  <CaregiverAvatar user={act.performedBy} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 dark:text-slate-200 text-xs leading-snug break-words">
                      {act.details}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      {new Date(act.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
