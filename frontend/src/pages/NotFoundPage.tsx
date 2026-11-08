import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, ArrowLeft, Compass, FileQuestion, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Ambient Lighting Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[650px] h-[300px] sm:h-[450px] bg-gradient-to-tr from-orange-600/20 via-amber-500/10 to-transparent blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[240px] sm:w-[450px] h-[200px] sm:h-[300px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-10 right-10 w-[200px] sm:w-[350px] h-[150px] sm:h-[250px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Glassmorphism Card */}
      <div className="w-full max-w-lg mx-auto relative z-10 text-center space-y-6">
        {/* Branding Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-orange-400">
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          <span>Sanskrithi School of Engineering</span>
        </div>

        {/* 404 Visual Display */}
        <div className="relative py-4">
          <div className="text-8xl sm:text-9xl font-black tracking-tighter bg-gradient-to-b from-slate-100 via-slate-300 to-slate-600 bg-clip-text text-transparent select-none drop-shadow-2xl">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-xl flex items-center justify-center animate-pulse">
              <Compass className="w-12 h-12 sm:w-14 sm:h-14 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Heading & Details */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto">
            The page you are looking for doesn't exist, has been removed, or has been relocated to another address.
          </p>

          {/* Requested Path Pill */}
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-950/80 border border-slate-800/80 text-xs font-mono text-slate-400 max-w-full truncate">
              <FileQuestion className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{location.pathname}</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/40"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span>Go Back</span>
          </button>

          <Link
            to={user ? '/dashboard' : '/login'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-950/50"
          >
            <Home className="w-4 h-4" />
            <span>{user ? 'Return to Dashboard' : 'Go to Login'}</span>
          </Link>
        </div>

        {/* Quick Help Links */}
        <div className="pt-6 border-t border-slate-800/60 flex items-center justify-center gap-6 text-xs text-slate-500">
          <Link to="/monthly-report" className="hover:text-orange-400 transition-colors">
            Monthly Report Hub
          </Link>
          <span>•</span>
          <Link to="/report-generator" className="hover:text-orange-400 transition-colors">
            Activity Report
          </Link>
          <span>•</span>
          <Link to="/login" className="hover:text-orange-400 transition-colors">
            Portal Sign In
          </Link>
        </div>

        {/* Security Badge */}
        <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
          <span>JuniorConnect Secure Campus Portal</span>
        </div>
      </div>
    </div>
  );
};

