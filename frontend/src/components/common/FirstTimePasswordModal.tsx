import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, KeyRound, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const FirstTimePasswordModal: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user || !user.mustChangePassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.trim().length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/change-password', {
        newPassword: newPassword.trim()
      });

      toast.success('Your personal password has been saved! You will use this password for all future logins.');
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update personal password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-lg flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full p-7 space-y-5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center mx-auto shadow-md">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">Set Your Personal Password</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
            Welcome to JuniorConnect! Your account was created with an initial password. Please choose your own personal password to use every time you log in.
          </p>
        </div>

        {/* User Badge */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-xs">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-bold text-slate-900">{user.name}</p>
              <p className="text-[11px] text-slate-500 font-mono">@{user.username}</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 font-extrabold text-[10px] rounded-full uppercase">
            First Login Setup
          </span>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-orange-600" /> Choose New Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Confirm New Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm rounded-xl shadow-lg shadow-orange-600/30 transition-all cursor-pointer active:scale-98"
          >
            {isSubmitting ? 'Saving Password...' : 'Save & Activate My Personal Password'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
