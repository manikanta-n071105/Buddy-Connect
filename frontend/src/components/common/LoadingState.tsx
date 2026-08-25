import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading dashboard details...' }) => (
  <div className="flex flex-col items-center justify-center p-12 text-slate-500 min-h-[280px]">
    <div className="relative flex items-center justify-center mb-4">
      <div className="w-12 h-12 rounded-full border-4 border-orange-500/20 border-t-orange-600 animate-spin" />
      <Loader2 className="w-5 h-5 text-orange-600 absolute animate-pulse" />
    </div>
    <p className="text-xs font-bold tracking-wide uppercase text-slate-500">{message}</p>
  </div>
);

