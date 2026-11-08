import React from 'react';
import { Check, Clock, UserCheck } from 'lucide-react';

export const TaskChecklistItem = ({ task, onToggle, canToggle = true }) => {
  if (!task) return null;

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      onClick={() => canToggle && onToggle(task._id, !task.isCompleted)}
      className={`group flex items-start gap-3 p-2.5 rounded-xl border transition cursor-pointer select-none ${
        task.isCompleted
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border transition ${
          task.isCompleted
            ? 'bg-emerald-600 border-emerald-600 text-white'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 group-hover:border-blue-500'
        }`}
      >
        {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug break-words ${
            task.isCompleted
              ? 'line-through text-slate-400 dark:text-slate-500'
              : 'font-medium text-slate-800 dark:text-slate-200'
          }`}
        >
          {task.description}
        </p>

        {task.isCompleted && (task.completedAt || task.completedBy) && (
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-emerald-700 dark:text-emerald-400">
            {task.completedAt && (
              <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3 h-3" />
                {formatTimestamp(task.completedAt)}
              </span>
            )}
            {task.completedBy && (
              <span className="inline-flex items-center gap-1 text-[11px]">
                <UserCheck className="w-3 h-3" />
                {task.completedBy.name || 'Caregiver'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
