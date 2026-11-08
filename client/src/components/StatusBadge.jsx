import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

export const StatusBadge = ({ status, size = 'sm' }) => {
  const configs = {
    Scheduled: {
      label: 'Scheduled',
      icon: Calendar,
      className:
        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    },
    'In Progress': {
      label: 'In Progress',
      icon: Clock,
      className:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    },
    Completed: {
      label: 'Completed',
      icon: CheckCircle2,
      className:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    },
    Missed: {
      label: 'Missed',
      icon: AlertTriangle,
      className:
        'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    },
    Cancelled: {
      label: 'Cancelled',
      icon: XCircle,
      className:
        'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    },
  };

  const config = configs[status] || configs['Scheduled'];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full ${config.className} ${sizeClasses[size] || sizeClasses.sm}`}
    >
      <Icon className={size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} />
      <span>{config.label}</span>
    </span>
  );
};
