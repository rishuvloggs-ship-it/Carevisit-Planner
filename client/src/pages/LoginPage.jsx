import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, LogIn, Lock, Mail, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    setSubmitting(true);
    try {
      const ok = await login(email, password);
      if (ok) {
        navigate('/');
      }
    } catch (err) {
      // handled by apiClient
    } finally {
      setSubmitting(false);
    }
  };

  const quickLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setSubmitting(true);
    try {
      const ok = await login(demoEmail, 'Password123!');
      if (ok) {
        navigate('/');
      }
    } catch (err) {
      // handled
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-blue-600 items-center justify-center text-white mb-3 shadow-lg shadow-blue-500/30">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            CareVisit Planner
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authorised Caregiver Visit Coordination & Scheduling
          </p>
        </div>

        {/* Quick Demo Login Buttons */}
        <div className="mb-6 p-4 rounded-2xl bg-blue-50/70 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700">
          <p className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" />
            1-Click Demo Logins
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => quickLogin('sarah@carevisit.demo')}
              className="px-2.5 py-1.5 text-xs text-left bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition"
            >
              <span className="font-bold block text-slate-900 dark:text-slate-100 truncate">
                Sarah Jenkins
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                Family Admin
              </span>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('david@carevisit.demo')}
              className="px-2.5 py-1.5 text-xs text-left bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition"
            >
              <span className="font-bold block text-slate-900 dark:text-slate-100 truncate">
                David Miller
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Caregiver
              </span>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('priya@carevisit.demo')}
              className="px-2.5 py-1.5 text-xs text-left bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition"
            >
              <span className="font-bold block text-slate-900 dark:text-slate-100 truncate">
                Priya Sharma
              </span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                Caregiver (PT)
              </span>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('robert@carevisit.demo')}
              className="px-2.5 py-1.5 text-xs text-left bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition"
            >
              <span className="font-bold block text-slate-900 dark:text-slate-100 truncate">
                Robert Vance
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                Viewer (Read-Only)
              </span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@carevisit.demo"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Need to create a new circle?{' '}
          <Link
            to="/register"
            className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Register Here
          </Link>
        </p>
      </div>
    </div>
  );
};
