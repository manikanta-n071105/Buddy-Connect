import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load content',
  message = 'An unexpected error occurred while fetching information.',
  onRetry
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
    <AlertCircle className="w-8 h-8 text-rose-600 mb-3" />
    <h4 className="text-base font-semibold mb-1">{title}</h4>
    <p className="text-sm text-rose-600 max-w-md mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm rounded-md transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Try Again</span>
      </button>
    )}
  </div>
);
