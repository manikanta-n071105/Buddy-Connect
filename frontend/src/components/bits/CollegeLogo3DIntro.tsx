import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ShinyText } from './ShinyText';

interface CollegeLogo3DIntroProps {
  onComplete?: () => void;
  autoHideDuration?: number; // duration in ms
  alwaysShowClose?: boolean;
}

export const CollegeLogo3DIntro: React.FC<CollegeLogo3DIntroProps> = ({
  onComplete,
  autoHideDuration = 3600,
  alwaysShowClose = true
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [autoHideDuration]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 30; // 3D tilt
    const y = (clientY / innerHeight - 0.5) * -30;
    setMousePos({ x, y });
  };

  if (!isVisible) return null;

  return (
    <div
      onMouseMove={handleMouseMove}
      onClick={handleDismiss}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/98 backdrop-blur-3xl text-white overflow-hidden transition-all duration-700 animate-in fade-in cursor-pointer select-none"
    >
      {/* Ambient Lighting Spheres */}
      <div className="absolute w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse-subtle" />
      <div className="absolute w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none translate-x-32 translate-y-32" />

      {/* Skip Intro Button */}
      {alwaysShowClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="absolute top-6 right-6 px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl cursor-pointer transition-all hover:scale-105 z-20 flex items-center gap-2 text-xs font-black backdrop-blur-md"
        >
          <span>Skip Intro</span>
          <X className="w-4 h-4 text-orange-400" />
        </button>
      )}

      {/* 3D Realistic Stage & Card Container */}
      <div
        className="relative z-10 p-4 transition-transform duration-300 ease-out animate-emblem-3d-entrance"
        style={{
          perspective: '1200px',
        }}
      >
        <div
          className="relative px-10 py-12 rounded-[28px] bg-slate-950/95 border-2 border-orange-500/80 animate-border-glow-pulse flex flex-col items-center justify-center text-center shadow-2xl max-w-lg overflow-hidden group"
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
              className="h-20 sm:h-24 w-auto object-contain drop-shadow-[0_12px_24px_rgba(249,115,22,0.5)]"
            />
          </div>

          {/* Subtitle Text */}
          <div
            className="mt-8 space-y-1.5"
            style={{ transform: 'translateZ(20px)' }}
          >
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-orange-400">
              <ShinyText text="JUNIORCONNECT MENTORSHIP ECOSYSTEM" speed={2.5} />
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};
