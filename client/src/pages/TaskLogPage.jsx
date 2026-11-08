import React, { useState, useEffect } from 'react';
import { CheckSquare, Filter, Clock, Check, Calendar, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/apiClient';
import toast from 'react-hot-toast';

export const TaskLogPage = ({ onSelectVisit }) => {
  const { activeCircle, currentRole } = useAuth();
  const [visitsWithTasks, setVisitsWithTasks] = useState([]);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMPLETED'
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    if (!activeCircle?._id) return;
    try {
      const res = await api.get(`/circles/${activeCircle._id}/visits`);
      if (res.data?.success) {
        setVisitsWithTasks(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeCircle]);

  const handleToggle = async (taskId, targetStatus) => {
    if (currentRole === 'Viewer') return;
    try {
      await api.patch(`/tasks/${taskId}/complete`, { isCompleted: targetStatus });
      toast.success(targetStatus ? 'Task completed' : 'Task marked pending');
      fetchTasks();
    } catch (err) {
      // handled
    }
  };

  // Flatten all tasks
  const allTasks = [];
  for (const v of visitsWithTasks) {
    if (v.tasks) {
      for (const t of v.tasks) {
        allTasks.push({
          ...t,
          visitTitle: v.title,
          visitStartTime: v.startTime,
          visitCaregiver: v.caregiverId,
          visitDoc: v,
        });
      }
    }
  }

  const filteredTasks = allTasks.filter((t) => {
    if (filterMode === 'PENDING') return !t.isCompleted;
    if (filterMode === 'COMPLETED') return t.isCompleted;
    return true;
  });

  const completedCount = allTasks.filter((t) => t.isCompleted).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Care Circle Task Checklist
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full checklist log across all coordinated visits • {completedCount} of {allTasks.length} tasks completed
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterMode === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All ({allTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterMode === 'PENDING'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Pending ({allTasks.length - completedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterMode === 'COMPLETED'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <Clock className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-sm">Loading task checklist...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <CheckSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
            No tasks found in this view.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTasks.map((t) => (
            <div
              key={t._id}
              onClick={() => handleToggle(t._id, !t.isCompleted)}
              className={`p-3.5 rounded-2xl border transition select-none flex items-start gap-3 ${
                currentRole !== 'Viewer' ? 'cursor-pointer hover:shadow-sm' : ''
              } ${
                t.isCompleted
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                  t.isCompleted
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'
                }`}
              >
                {t.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-snug break-words ${
                    t.isCompleted
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'font-semibold text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {t.description}
                </p>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectVisit(t.visitDoc);
                    }}
                    className="hover:text-blue-600 cursor-pointer font-medium underline-offset-2 hover:underline truncate max-w-[200px]"
                  >
                    Visit: {t.visitTitle}
                  </span>

                  {t.isCompleted && t.completedAt && (
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                      Done {new Date(t.completedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      at {new Date(t.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
