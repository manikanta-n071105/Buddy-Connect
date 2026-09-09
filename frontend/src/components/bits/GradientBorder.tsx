import React from 'react';

interface GradientBorderProps {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
}

export const GradientBorder: React.FC<GradientBorderProps> = ({
  children,
  className = '',
  gradient = 'from-orange-500 via-amber-500 to-indigo-600'
}) => {
  return (
    <div className={`relative p-[1.5px] rounded-2xl bg-gradient-to-r ${gradient} shadow-lg transition-all duration-300 ${className}`}>
      <div className="relative rounded-[15px] bg-white dark:bg-slate-900 h-full w-full overflow-hidden">
        {children}
      </div>
    </div>
  );
};
