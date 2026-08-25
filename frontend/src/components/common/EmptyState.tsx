import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no items to display at this moment.',
  action
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-lg shadow-sm">
    <div className="p-3 bg-slate-100 rounded-full text-slate-500 mb-4">
      <Inbox className="w-8 h-8" />
    </div>
    <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
    <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
    {action && <div>{action}</div>}
  </div>
);
