import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Clock3,
  CheckSquare,
  Sparkles,
} from 'lucide-react';

export const MobileBottomNav = () => {
  const items = [
    { label: 'Today', path: '/', icon: LayoutDashboard },
    { label: 'Calendar', path: '/calendar', icon: CalendarDays },
    { label: 'Timeline', path: '/timeline', icon: Clock3 },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'AI Summary', path: '/ai-summary', icon: Sparkles },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
