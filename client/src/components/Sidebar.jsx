import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Clock3,
  CheckSquare,
  Users2,
  Sparkles,
  Heart,
  MapPin,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ conflictCount = 0 }) => {
  const { activeCircle, currentRole } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Shared Calendar', path: '/calendar', icon: CalendarDays },
    { label: 'Completion Timeline', path: '/timeline', icon: Clock3 },
    { label: 'Task Checklist', path: '/tasks', icon: CheckSquare },
    { label: 'Circle & Caregivers', path: '/circle', icon: Users2 },
    { label: 'AI Weekly Insights', path: '/ai-summary', icon: Sparkles },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Care Recipient Card */}
      {activeCircle && (
        <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-800/80 dark:to-slate-800/30 border border-blue-100/80 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-blue-600 text-white">
              <Heart className="w-3.5 h-3.5 fill-current" />
            </span>
            <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
              Care Recipient
            </span>
          </div>
          <h2 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
            {activeCircle.careRecipient?.name || 'Care Recipient'}
          </h2>
          {activeCircle.careRecipient?.address && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-1">{activeCircle.careRecipient.address}</span>
            </p>
          )}
          <div className="mt-2.5 pt-2 border-t border-blue-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">Your Circle Role:</span>
            <span className="font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/40 px-2 py-0.5 rounded-md">
              {currentRole}
            </span>
          </div>
        </div>
      )}

      {/* Nav Links */}
      <nav className="space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.path === '/' && conflictCount > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-amber-400 text-amber-950' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {conflictCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Safety Notice Footer */}
      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500">
        <p className="flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400 mb-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          Non-Emergency Use
        </p>
        <p>In case of acute medical emergencies, immediately dial 911 or local emergency services.</p>
      </div>
    </aside>
  );
};
