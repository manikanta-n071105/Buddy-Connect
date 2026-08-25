import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldCheck, Eye, EyeOff, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { SanskrithiIntro } from '../../components/common/SanskrithiIntro';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  const handleIntroComplete = () => {
    setShowIntro(false);
    navigate('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      toast.error('Please enter your username/email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login({ usernameOrEmail: usernameOrEmail.trim(), password: password.trim() });
      toast.success('Signed in successfully! Welcome to JuniorConnect.');
      setShowIntro(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Invalid username or password.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden select-none">
      <style>{`
        @keyframes spinYLeftToRight {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>

      {/* Ambient Radial Lighting FX (Responsive Max Dimensions) */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[700px] h-[300px] sm:h-[450px] bg-gradient-to-tr from-orange-600/20 via-amber-500/10 to-transparent blur-[100px] sm:blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-5 left-5 w-[250px] sm:w-[500px] h-[200px] sm:h-[300px] bg-indigo-600/15 blur-[100px] sm:blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-5 right-5 w-[200px] sm:w-[400px] h-[150px] sm:h-[250px] bg-purple-600/10 blur-[90px] sm:blur-[130px] rounded-full pointer-events-none" />

      {/* 3D SSE Intro Animation on Login Success */}
      {showIntro && (
        <SanskrithiIntro onComplete={handleIntroComplete} />
      )}

      {/* Main Container */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto relative z-10 space-y-4 sm:space-y-6">
        {/* Header Branding Image */}
        <div className="text-center space-y-2">
          <div className="flex flex-col items-center justify-center mx-auto px-1 space-y-2">
            <img
              src="/assets/sse-reveal.png"
              alt="Sanskrithi School of Engineering"
              className="w-full max-w-[240px] sm:max-w-[300px] h-auto object-contain drop-shadow-2xl hover:scale-102 transition-transform duration-300"
            />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] shadow-lg shadow-orange-950/40">
              <Sparkles className="w-3 h-3 text-orange-400 shrink-0" /> Campus Mentorship Platform
            </div>
          </div>
        </div>

        {/* Auth Glassmorphism Card Box */}
        <div className="bg-slate-900/85 backdrop-blur-2xl border border-slate-800/90 p-5 sm:p-8 sm:px-10 shadow-2xl shadow-black/90 rounded-2xl sm:rounded-3xl space-y-5 sm:space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 sm:w-32 h-28 sm:h-32 bg-orange-500/10 blur-2xl pointer-events-none" />

          {/* S Logo inside the login box (3D Left to Right Y-Axis Spin) */}
          <div className="flex flex-col items-center justify-center pt-0.5" style={{ perspective: '1000px' }}>
            <div className="relative inline-block">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center p-0.5 border-2 overflow-hidden bg-orange-600 shadow-2xl mx-auto transition-all ${
                  isLoading ? 'border-orange-400 ring-4 ring-orange-500/40 scale-105' : 'border-orange-500/80 hover:scale-105'
                }`}
                style={{
                  animation: isLoading ? 'spinYLeftToRight 1.2s linear infinite' : 'spinYLeftToRight 4.5s linear infinite'
                }}
              >
                <img
                  src="/assets/sse-s-logo.jpg"
                  alt="Sanskrithi S Logo"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="text-center border-b border-slate-800/80 pb-3 sm:pb-4">
            <h2 className="text-base sm:text-xl font-black tracking-tight text-white">Sign In to Your Portal</h2>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">Enter your official credentials to access your dashboard</p>
          </div>

          <form className="space-y-3.5 sm:space-y-4" onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label className="block text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
                Username or Email Address *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-orange-500/80 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Enter your username or email"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-950/90 border border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 text-white placeholder-slate-500 transition-all shadow-inner outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-orange-500/80 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-slate-950/90 border border-slate-800 rounded-xl text-xs font-mono focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 text-white placeholder-slate-500 transition-all shadow-inner outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 px-4 rounded-xl shadow-lg shadow-orange-600/30 text-xs font-black tracking-wider uppercase text-white bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-500 hover:to-amber-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-1"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Authenticating Access...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Footer Notice */}
          <div className="pt-3 sm:pt-4 border-t border-slate-800/80 text-center">
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
              <span>Protected by Encrypted Authentication</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
