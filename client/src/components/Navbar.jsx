import React, { useState } from 'react';
import {
  HeartHandshake,
  Sun,
  Moon,
  Plus,
  Sparkles,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CaregiverAvatar } from './CaregiverAvatar';

export const Navbar = ({ onOpenNewVisit, onOpenSmartEntry }) => {
  const { user, circles, activeCircle, setActiveCircle, currentRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showCircleMenu, setShowCircleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Care Circle Selector */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100">
                CareVisit <span className="text-blue-600 dark:text-blue-400">Planner</span>
              </h1>
              <span className="text-[10px] text-slate-400 block -mt-1 font-medium">
                Caregiver Visit Coordination
              </span>
            </div>
          </div>

          {/* Circle Selector Dropdown */}
          {activeCircle && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCircleMenu(!showCircleMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
              >
                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="max-w-[130px] sm:max-w-[180px] truncate">
                  {activeCircle.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showCircleMenu && (
                <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Care Circles
                  </div>
                  {circles.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => {
                        setActiveCircle(c);
                        setShowCircleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/70 transition ${
                        c._id === activeCircle._id
                          ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {c.careRecipient?.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Privacy Assurance Badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/40 px-3 py-1 rounded-full border border-slate-200/50 dark:border-slate-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Only authorised circle members can view this data</span>
        </div>

        {/* Right: Actions, Theme, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Smart Visit Entry AI Button */}
          <button
            type="button"
            onClick={onOpenSmartEntry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900 text-xs font-semibold transition shadow-sm"
            title="Type or dictate visits in natural language"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Smart Entry</span>
          </button>

          {/* Schedule Visit Button */}
          {currentRole !== 'Viewer' && (
            <button
              type="button"
              onClick={onOpenNewVisit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Schedule Visit</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <CaregiverAvatar user={user} size="sm" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    Role: {currentRole}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 font-semibold transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
