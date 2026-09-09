import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ShinyText } from '../bits/ShinyText';

interface SanskrithiIntroProps {
  onComplete?: () => void;
  autoClose?: boolean;
  spinOnly?: boolean;
}

export const SanskrithiIntro: React.FC<SanskrithiIntroProps> = ({
  onComplete,
  autoClose = true,
  spinOnly = false,
}) => {
  const [skipped, setSkipped] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!autoClose) return;
    const duration = spinOnly ? 2700 : 6800;
    const timer = setTimeout(() => {
      if (!skipped && onComplete) {
        onComplete();
      }
    }, duration);
    return () => clearTimeout(timer);
  }, [autoClose, onComplete, skipped, spinOnly]);

  const handleSkip = () => {
    setSkipped(true);
    if (onComplete) onComplete();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 30;
    const y = (clientY / innerHeight - 0.5) * -30;
    setMousePos({ x, y });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onClick={handleSkip}
      className="fixed inset-0 z-50 bg-[#0e0d0c] flex flex-col items-center justify-center overflow-hidden font-sans select-none backdrop-blur-3xl cursor-pointer"
    >
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
          100% { opacity: 0; transform: scale(1.4); filter: blur(12px); pointer-events: none; }
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
        @keyframes sse3DCardReveal {
          0% { opacity: 0; transform: perspective(1200px) rotateY(-35deg) rotateX(15deg) scale(0.75); filter: blur(10px); }
          60% { opacity: 1; transform: perspective(1200px) rotateY(5deg) rotateX(-2deg) scale(1.03); filter: blur(0px); }
          100% { opacity: 1; transform: perspective(1200px) rotateY(0deg) rotateX(0deg) scale(1); filter: blur(0px); }
        }

        .sse-stage {
          perspective: 1400px;
          background: radial-gradient(ellipse 900px 500px at 50% 38%, rgba(226,81,52,0.18), transparent 65%),
                      radial-gradient(ellipse 1400px 800px at 50% 100%, rgba(226,81,52,0.08), transparent 70%);
        }
        .sse-mark-slot-full {
          animation: sseDissolve 0.6s 2.8s cubic-bezier(0.7,0,0.84,0) forwards;
        }
        .sse-mark-drop {
          animation: sseDrop 1.1s 0.2s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .sse-mark-spin {
          animation: sseSpin 1.6s 1.2s cubic-bezier(0.45,0,0.15,1) forwards;
        }
        .sse-shadow-full {
          animation: sseShadowPulse 1.1s 0.2s cubic-bezier(0.22,1,0.36,1) forwards,
                     sseShadowOut 0.6s 2.8s cubic-bezier(0.7,0,0.84,0) forwards;
        }
        .sse-shadow-spinonly {
          animation: sseShadowPulse 1.1s 0.2s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .sse-card-reveal {
          animation: sse3DCardReveal 1.2s 3.2s cubic-bezier(0.16,1,0.3,1) forwards;
        }
      `}</style>

      {/* Ambient Radial Lights */}
      <div className="absolute w-[650px] h-[650px] bg-orange-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse-subtle" />

      {/* Skip Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleSkip();
        }}
        className="absolute top-6 right-6 z-30 flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-black text-slate-300 hover:text-white transition-all backdrop-blur-md cursor-pointer shadow-lg hover:scale-105"
      >
        <span>Skip Intro</span>
        <X className="w-4 h-4 text-orange-400" />
      </button>

      {/* 3D Stage Container */}
      <div className="relative w-[380px] h-[380px] flex items-center justify-center">
        {/* PHASE 1: Floor Ambient Shadow & Spinning SSE S Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-[160px] h-[40px] rounded-[50%] bg-[#e25134] blur-[16px] opacity-0 ${spinOnly ? 'sse-shadow-spinonly' : 'sse-shadow-full'}`} />
        </div>

        <div className={`absolute z-10 w-[160px] h-[160px] flex items-center justify-center ${spinOnly ? '' : 'sse-mark-slot-full'}`}>
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

        {/* PHASE 2: Realistic 3D Emblem Card Reveal (Appears After Logo Spin at 3.2s when spinOnly is false) */}
        {!spinOnly && (
          <div className="absolute z-20 inset-0 flex flex-col items-center justify-center text-center opacity-0 sse-card-reveal px-2">
            <div
              className="relative px-8 sm:px-10 py-9 rounded-[28px] bg-slate-950/95 border-2 border-orange-500/80 animate-border-glow-pulse flex flex-col items-center justify-center text-center shadow-2xl max-w-md overflow-hidden group"
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateY(${mousePos.x}deg) rotateX(${mousePos.y}deg)`,
              }}
            >
              {/* Glossy Diagonal Specular Light Beam Sweep */}
              <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none animate-light-sweep" />

              {/* College Logo Image */}
              <div
                className="relative z-10 transition-transform duration-500 group-hover:scale-105"
                style={{ transform: 'translateZ(30px)' }}
              >
                <img
                  src="/assets/sse-reveal.png"
                  alt="Sanskrithi School of Engineering"
                  className="h-16 sm:h-20 w-auto object-contain drop-shadow-[0_12px_24px_rgba(249,115,22,0.5)]"
                />
              </div>

              {/* Subtitle Text */}
              <div
                className="mt-6 space-y-1"
                style={{ transform: 'translateZ(20px)' }}
              >
                <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-orange-400">
                  <ShinyText text="JUNIORCONNECT MENTORSHIP ECOSYSTEM" speed={2.5} />
                </h2>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Caption */}
      <div className="absolute bottom-8 text-center text-[10px] text-slate-400 font-extrabold tracking-widest uppercase">
        Empowering Next-Gen Engineers & Mentors
      </div>
    </div>
  );
};
