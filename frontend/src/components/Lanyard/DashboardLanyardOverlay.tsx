import React, { useState, useEffect } from 'react';
import Lanyard from './Lanyard';
import { Sparkles, X, RotateCcw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DashboardLanyardOverlayProps {
  onDismiss?: () => void;
}

export const DashboardLanyardOverlay: React.FC<DashboardLanyardOverlayProps> = ({ onDismiss }) => {
  const { user } = useAuth();
  const [secondsLeft, setSecondsLeft] = useState<number>(5);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isPaused) return;

    if (secondsLeft <= 0) {
      setIsVisible(false);
      if (onDismiss) onDismiss();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsVisible(false);
          if (onDismiss) onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, isPaused, onDismiss]);

  const handleManualClose = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  if (!isVisible) return null;

  const progressPercent = ((5 - secondsLeft) / 5) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/85 backdrop-blur-md overflow-hidden select-none transition-all duration-500 animate-fadeIn">
      {/* Subtle Orange Glow Ambient Orbs in Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner / Controls */}
      <div className="relative z-10 w-full max-w-4xl px-6 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-lg tracking-wide">
                Buddy Connect 3D Digital ID
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Drag, pull and swing your interactive 3D campus pass
            </p>
          </div>
        </div>

        {/* 5-Second Timer Pill & Skip Button */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 bg-stone-900/90 border border-orange-500/40 px-3.5 py-1.5 rounded-full shadow-inner cursor-pointer"
            onClick={() => setIsPaused((p) => !p)}
            title={isPaused ? 'Click to resume countdown' : 'Click to pause countdown'}
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <svg className="w-5 h-5 transform -rotate-90">
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-stone-700"
                  fill="transparent"
                />
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-orange-500 transition-all duration-1000 ease-linear"
                  strokeDasharray={50}
                  strokeDashoffset={50 - (50 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-orange-400">
                {secondsLeft}
              </span>
            </div>
            <span className="text-xs font-medium text-stone-300">
              {isPaused ? 'Paused' : `${secondsLeft}s left`}
            </span>
          </div>

          <button
            onClick={handleManualClose}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-stone-800/90 hover:bg-orange-600 border border-stone-700 hover:border-orange-500 text-stone-300 hover:text-white text-xs font-semibold transition-all duration-200 shadow-md group"
          >
            <span>Skip to Dashboard</span>
            <X className="w-3.5 h-3.5 text-stone-400 group-hover:text-white" />
          </button>
        </div>
      </div>

      {/* 3D Interactive Lanyard Scene Canvas */}
      <div className="relative z-0 w-full flex-1 flex items-center justify-center">
        <Lanyard
          position={[0, 0, 20]}
          gravity={[0, -40, 0]}
          bandColor="#ea580c"
          userName={user?.name || 'CAMPUS MEMBER'}
          userRole={user?.role || 'STUDENT'}
          className="w-full h-full"
        />
      </div>

      {/* Bottom Hint & Replay Controls */}
      <div className="relative z-10 w-full max-w-xl px-6 pb-6 text-center">
        <div className="inline-flex items-center gap-2 bg-stone-900/80 backdrop-blur border border-stone-800/80 px-4 py-2 rounded-full text-xs text-stone-400 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
          <span>Interactive Physics enabled — grab with cursor/finger to throw the card</span>
        </div>
      </div>
    </div>
  );
};
