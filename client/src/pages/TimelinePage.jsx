import React, { useState, useEffect } from 'react';
import {
  Clock,
  Filter,
  CheckCircle2,
  Calendar,
  User,
  MapPin,
  ListTodo,
  FileText,
  UserCheck,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/apiClient';
import { CaregiverAvatar } from '../components/CaregiverAvatar';
import { StatusBadge } from '../components/StatusBadge';
import toast from 'react-hot-toast';

export const TimelinePage = ({ onSelectVisit }) => {
  const { activeCircle, currentRole } = useAuth();
  const [timelineData, setTimelineData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCaregiver, setSelectedCaregiver] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTimeline = async () => {
    if (!activeCircle?._id) return;
    setLoading(true);
    try {
      const params = {};
      if (selectedCaregiver) params.caregiverId = selectedCaregiver;
      if (selectedStatus) params.status = selectedStatus;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get(`/circles/${activeCircle._id}/timeline`, { params });
      if (res.data?.success) {
        setTimelineData(res.data.data?.timeline || []);
        setStats(res.data.data?.stats || null);
      }
    } catch (err) {
      console.error('Error fetching timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [activeCircle, selectedCaregiver, selectedStatus, startDate, endDate]);

  const handleToggleTask = async (taskId, targetStatus) => {
    if (currentRole === 'Viewer') return;
    try {
      await api.patch(`/tasks/${taskId}/complete`, { isCompleted: targetStatus });
      toast.success(targetStatus ? 'Task completed!' : 'Task unmarked');
      fetchTimeline();
    } catch (err) {
      // handled
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Care Completion Timeline
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Visual chronological record of visits, completed checklists, timestamps, and caregiver handovers
        </p>
      </div>

      {/* Summary KPI Banner */}
      {stats && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                Care Circle Progress Summary
              </span>
              <h3 className="text-xl font-black mt-0.5">
                {stats.completedTasks} of {stats.totalTasks} Tasks Completed
              </h3>
              <div className="w-full bg-blue-900/60 h-2.5 rounded-full mt-2.5 overflow-hidden border border-blue-400/30">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.completionPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center border border-white/15">
              <span className="text-[11px] text-blue-200 block font-medium">Completion Rate</span>
              <span className="text-2xl font-black text-emerald-300">
                {stats.completionPercentage}%
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center border border-white/15">
              <span className="text-[11px] text-blue-200 block font-medium">Total Logged Visits</span>
              <span className="text-2xl font-black">{stats.totalVisits}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Filter Timeline:
          </span>

          {/* Caregiver */}
          <select
            value={selectedCaregiver}
            onChange={(e) => setSelectedCaregiver(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Caregivers</option>
            {activeCircle?.members?.map((m) => (
              <option key={m.userId?._id} value={m.userId?._id}>
                {m.userId?.name}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Missed">Missed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
            />
          </div>
        </div>

        {(selectedCaregiver || selectedStatus || startDate || endDate) && (
          <button
            type="button"
            onClick={() => {
              setSelectedCaregiver('');
              setSelectedStatus('');
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Chronological Vertical Timeline Spine */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <Clock className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-sm">Loading care timeline...</p>
        </div>
      ) : timelineData.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
            No visits match the selected timeline filters.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-8 ml-3 sm:ml-4">
          {timelineData.map((visit) => {
            const isCompleted = visit.status === 'Completed';

            return (
              <div key={visit._id} className="relative group">
                {/* Node dot on timeline spine */}
                <div
                  className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-5 h-5 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center shadow-sm ${
                    isCompleted
                      ? 'bg-emerald-500'
                      : visit.hasConflict
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                ></div>

                {/* Date Header for this item */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                    {formatDate(visit.startTime)}
                  </span>
                  <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                    {formatTime(visit.startTime)} – {formatTime(visit.endTime)}
                  </span>
                  <StatusBadge status={visit.status} />
                  {visit.hasConflict && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 dark:bg-amber-900/60 dark:text-amber-200 px-2 py-0.5 rounded-full">
                      ⚠️ Overlap Flagged
                    </span>
                  )}
                </div>

                {/* Visit Card Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition hover:shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h4
                        onClick={() => onSelectVisit(visit)}
                        className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 cursor-pointer transition"
                      >
                        {visit.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {visit.category}
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

                  {/* Visit Checklist Tasks with Completion Timestamps & Caregiver */}
                  {visit.tasks && visit.tasks.length > 0 && (
                    <div className="mt-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <ListTodo className="w-3.5 h-3.5 text-blue-500" />
                          Checklist Tasks ({visit.completedTasks} / {visit.totalTasks} Done • {visit.completionRate}%)
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {visit.tasks.map((task) => (
                          <div
                            key={task._id}
                            onClick={() => handleToggleTask(task._id, !task.isCompleted)}
                            className={`flex items-start gap-3 p-2.5 rounded-xl border transition ${
                              currentRole !== 'Viewer' ? 'cursor-pointer' : ''
                            } ${
                              task.isCompleted
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                                task.isCompleted
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                              }`}
                            >
                              {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs ${
                                  task.isCompleted
                                    ? 'line-through text-slate-400 dark:text-slate-500'
                                    : 'font-medium text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {task.description}
                              </p>

                              {task.isCompleted && (
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                  {task.completedAt && (
                                    <span className="inline-flex items-center gap-1 font-mono">
                                      <Clock className="w-3 h-3" />
                                      {formatTime(task.completedAt)}
                                    </span>
                                  )}
                                  {task.completedBy && (
                                    <span className="inline-flex items-center gap-1">
                                      <UserCheck className="w-3 h-3" />
                                      Completed by {task.completedBy.name || 'Caregiver'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Post-Visit Observation & Handover Notes */}
                  {visit.completedNotes && (
                    <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                        Caregiver Observation / Handover Notes:
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 italic">
                        "{visit.completedNotes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
