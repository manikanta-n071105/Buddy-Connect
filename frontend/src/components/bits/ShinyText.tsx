import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 4,
  className = ''
}) => {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`inline-block bg-clip-text text-transparent bg-[linear-gradient(120deg,rgba(255,255,255,0.7)_0%,rgba(255,255,255,1)_50%,rgba(255,255,255,0.7)_100%)] bg-[length:200%_100%] ${
        !disabled ? 'animate-shiny-text' : ''
      } ${className}`}
      style={{
        animationDuration,
      }}
    >
      {text}
    </span>
  );
};
