import React from 'react';

interface AcademicGridPatternProps {
  className?: string;
  size?: number;
}

export const AcademicGridPattern: React.FC<AcademicGridPatternProps> = ({
  className = '',
  size = 24
}) => {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full opacity-30 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="grid-pattern"
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${size} 0 L 0 0 0 ${size}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <circle cx={size} cy={size} r="1" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </svg>
  );
};
