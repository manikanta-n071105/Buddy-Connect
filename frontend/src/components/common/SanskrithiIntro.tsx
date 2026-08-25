import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SanskrithiIntroProps {
  onComplete?: () => void;
  autoClose?: boolean;
}

export const SanskrithiIntro: React.FC<SanskrithiIntroProps> = ({ onComplete, autoClose = true }) => {
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (!autoClose) return;
    const timer = setTimeout(() => {
      if (!skipped && onComplete) {
        onComplete();
      }
    }, 7500);
    return () => clearTimeout(timer);
  }, [autoClose, onComplete, skipped]);

  const handleSkip = () => {
    setSkipped(true);
    if (onComplete) onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0e0d0c] flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      <style>{`
        @keyframes sseDrop {
          0% { transform: translateY(-500px); opacity: 0; }
          60% { transform: translateY(0); opacity: 1; }
          75% { transform: translateY(-30px); }
          90% { transform: translateY(0); }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes sseSpin {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(720deg); }
        }
        @keyframes sseDissolve {
          0% { opacity: 1; transform: scale(1); filter: blur(0px); }
          100% { opacity: 0; transform: scale(1.4); filter: blur(12px); }
        }
        @keyframes sseShadowPulse {
          0% { transform: scale(0.2); opacity: 0; }
          60% { transform: scale(1); opacity: 0.6; }
          75% { transform: scale(0.8); opacity: 0.4; }
          100% { transform: scale(1); opacity: 0.5; }
        }
        @keyframes sseShadowOut {
          0% { opacity: 0.5; transform: scale(1); }
          100% { opacity: 0; transform: scale(2.5); }
        }
        @keyframes sseRevealIn {
          0% { opacity: 0; transform: scale(0.85) translateY(20px); filter: blur(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
        }

        .sse-stage {
          perspective: 1400px;
          background: radial-gradient(ellipse 900px 500px at 50% 38%, rgba(226,81,52,0.18), transparent 65%),
                      radial-gradient(ellipse 1400px 800px at 50% 100%, rgba(226,81,52,0.08), transparent 70%);
        }
        .sse-mark-slot {
          animation: sseDissolve 0.7s 3.3s cubic-bezier(0.7,0,0.84,0) forwards;
        }
        .sse-mark-drop {
          animation: sseDrop 1.1s 0.2s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .sse-mark-spin {
          animation: sseSpin 1.8s 1.4s cubic-bezier(0.45,0,0.15,1) forwards;
        }
        .sse-shadow {
          animation: sseShadowPulse 1.1s 0.2s cubic-bezier(0.22,1,0.36,1) forwards,
                     sseShadowOut 0.7s 3.3s cubic-bezier(0.7,0,0.84,0) forwards;
        }
        .sse-reveal {
          animation: sseRevealIn 1.2s 3.8s cubic-bezier(0.16,1,0.3,1) forwards;
        }
      `}</style>

      <div className="relative w-full h-full sse-stage flex flex-col items-center justify-center">
        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 z-30 flex items-center gap-2 px-4 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-full text-xs font-semibold text-slate-300 hover:text-white transition-colors backdrop-blur-md cursor-pointer shadow-lg"
        >
          <span>Skip Intro</span>
          <X className="w-4 h-4" />
        </button>

        {/* 3D Stage Container */}
        <div className="relative w-[360px] h-[360px] flex items-center justify-center">
          {/* Floor Ambient Glow & Shadow (No Spiral/Ring Lines) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[160px] h-[40px] rounded-[50%] bg-[#e25134] blur-[16px] opacity-0 sse-shadow" />
          </div>

          {/* Falling & Spinning SSE Mark Logo - Natural Unsquished Aspect Ratio */}
          <div className="absolute z-10 w-[160px] h-[160px] flex items-center justify-center sse-mark-slot">
            <div className="w-full h-full sse-mark-drop">
              <div className="w-full h-full sse-mark-spin flex items-center justify-center">
                <img
                  src="/assets/sse-s-logo.jpg"
                  alt="Sanskrithi School of Engineering S Logo"
                  className="w-36 h-36 aspect-square rounded-full shadow-2xl shadow-orange-600/40 border-2 border-orange-500/50 object-cover bg-[#0e0d0c]"
                />
              </div>
            </div>
          </div>

          {/* Final Reveal - SSE Full Logo & Badges Banner */}
          <div className="absolute z-20 inset-0 flex flex-col items-center justify-center text-center opacity-0 sse-reveal px-2">
            <div className="p-6 bg-[#0e0d0c] border-2 border-orange-500/60 rounded-3xl shadow-2xl shadow-orange-950/80 max-w-md w-full flex flex-col items-center gap-4 backdrop-blur-xl">
              
              {/* Clean Dark Container */}
              <div className="w-full bg-[#0e0d0c] p-2 flex flex-col items-center justify-center overflow-hidden">
                <img
                  src="/assets/sse-reveal.png"
                  alt="Sanskrithi School of Engineering"
                  className="w-full max-w-[360px] h-auto object-contain"
                />
              </div>

              {/* Subtitle */}
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest pt-1">
                JuniorConnect Mentorship Ecosystem
              </p>
            </div>
          </div>
        </div>

        {/* Footer Caption */}
        <div className="absolute bottom-8 text-center text-xs text-[#a39b90] font-bold tracking-widest uppercase">
          Empowering Next-Gen Engineers & Mentors
        </div>
      </div>
    </div>
  );
};
