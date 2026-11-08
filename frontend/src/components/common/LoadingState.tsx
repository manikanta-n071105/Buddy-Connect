import React from 'react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading dashboard details...',
  size = 'md',
  fullHeight = false,
}) => {
  const sizeConfig = {
    sm: {
      wrapper: 'w-10 h-10',
      shadow: 'w-8 h-2',
      glow: 'w-12 h-12',
      textSize: 'text-[10px]',
      gap: 'space-y-1.5',
      minH: 'min-h-[140px]',
    },
    md: {
      wrapper: 'w-16 h-16 sm:w-20 sm:h-20',
      shadow: 'w-12 sm:w-16 h-3 sm:h-3.5',
      glow: 'w-20 sm:w-24 h-20 sm:h-24',
      textSize: 'text-xs',
      gap: 'space-y-2.5',
      minH: 'min-h-[280px]',
    },
    lg: {
      wrapper: 'w-24 h-24 sm:w-28 sm:h-28',
      shadow: 'w-20 sm:w-24 h-4 sm:h-5',
      glow: 'w-28 sm:w-36 h-28 sm:h-36',
      textSize: 'text-sm',
      gap: 'space-y-3',
      minH: 'min-h-[400px]',
    },
  }[size];

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 select-none text-slate-400 ${
        fullHeight ? 'min-h-screen' : sizeConfig.minH
      }`}
    >
      <style>{`
        @keyframes sseLogoSpinY {
          0% {
            transform: perspective(800px) rotateY(0deg);
          }
          100% {
            transform: perspective(800px) rotateY(360deg);
          }
        }
        @keyframes sseShadowPulse {
          0%, 100% {
            transform: scale(0.85);
            opacity: 0.35;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.7;
          }
        }
      `}</style>

      {/* 3D Spin Stage */}
      <div className="relative flex flex-col items-center justify-center" style={{ perspective: '1000px' }}>
        {/* Ambient Back Glow */}
        <div
          className={`absolute rounded-full bg-gradient-to-tr from-orange-600/30 via-amber-500/20 to-transparent blur-xl pointer-events-none ${sizeConfig.glow}`}
        />

        {/* 3D Spinning S-Logo */}
        <div
          className={`relative z-10 rounded-full flex items-center justify-center p-0.5 border-2 border-orange-400/90 bg-orange-600 shadow-2xl shadow-orange-950/70 overflow-hidden ring-4 ring-orange-500/20 ${sizeConfig.wrapper}`}
          style={{
            animation: 'sseLogoSpinY 1.6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
            transformStyle: 'preserve-3d',
          }}
        >
          <img
            src="/assets/sse-s-logo.jpg"
            alt="Sanskrithi S Logo"
            className="w-full h-full object-cover rounded-full"
            loading="eager"
          />
        </div>

        {/* Dynamic Floor Shadow Pulse */}
        <div
          className={`mt-2.5 rounded-[50%] bg-[#e25134] blur-[6px] pointer-events-none ${sizeConfig.shadow}`}
          style={{ animation: 'sseShadowPulse 1.6s ease-in-out infinite' }}
        />
      </div>

      {/* Loading Status Message */}
      {message && (
        <div className={`mt-4 text-center ${sizeConfig.gap}`}>
          <p className={`font-bold tracking-wider uppercase text-slate-400 ${sizeConfig.textSize}`}>
            {message}
          </p>
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500/80" />
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500/60" />
          </div>
        </div>
      )}
    </div>
  );
};
