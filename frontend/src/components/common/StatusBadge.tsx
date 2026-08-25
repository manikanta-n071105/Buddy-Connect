import React from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Flame,
  Check,
  RotateCcw,
  Ban,
  HelpCircle
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  type?: 'issue' | 'vote' | 'priority' | 'support';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'issue' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      // Vote Types
      case 'SATISFIED':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500', icon: CheckCircle2, label: 'Satisfied' };
      case 'PARTIALLY_SATISFIED':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200/80', dot: 'bg-amber-500', icon: Clock, label: 'Partially Satisfied' };
      case 'NOT_SATISFIED':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200/80', dot: 'bg-rose-500', icon: XCircle, label: 'Not Satisfied' };

      // Support Indicator Types
      case 'NORMAL':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500', icon: CheckCircle2, label: 'Normal Support' };
      case 'ATTENTION':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200/80', dot: 'bg-amber-500', icon: Clock, label: 'Attention Needed' };
      case 'HIGH_ATTENTION':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200/80', dot: 'bg-rose-500 animate-pulse', icon: AlertTriangle, label: 'High Priority Support' };

      // Issue Statuses
      case 'OPEN':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80', dot: 'bg-indigo-500', icon: Clock, label: 'Open' };
      case 'UNDER_REVIEW':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200/80', dot: 'bg-blue-500', icon: HelpCircle, label: 'Under Review' };
      case 'IN_PROGRESS':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200/80', dot: 'bg-amber-500', icon: Clock, label: 'In Progress' };
      case 'RESOLVED':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500', icon: CheckCircle2, label: 'Resolved' };
      case 'VOTING':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200/80', dot: 'bg-purple-500', icon: Clock, label: 'Resolution Voting' };
      case 'CLOSED':
        return { bg: 'bg-slate-100 text-slate-700 border-slate-200/80', dot: 'bg-slate-500', icon: Check, label: 'Closed' };
      case 'REOPENED':
        return { bg: 'bg-orange-50 text-orange-700 border-orange-200/80', dot: 'bg-orange-500', icon: RotateCcw, label: 'Reopened' };
      case 'ESCALATED':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200/80', dot: 'bg-rose-500 animate-pulse', icon: Flame, label: 'Escalated' };
      case 'CANCELLED':
        return { bg: 'bg-slate-50 text-slate-500 border-slate-200/80', dot: 'bg-slate-400', icon: Ban, label: 'Cancelled' };

      // Issue Priorities
      case 'LOW':
        return { bg: 'bg-slate-100 text-slate-600 border-slate-200/80', dot: 'bg-slate-400', icon: Clock, label: 'Low Priority' };
      case 'MEDIUM':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200/80', dot: 'bg-blue-500', icon: Clock, label: 'Medium Priority' };
      case 'HIGH':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200/80', dot: 'bg-amber-500', icon: AlertTriangle, label: 'High Priority' };
      case 'CRITICAL':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200/80', dot: 'bg-rose-500 animate-pulse', icon: Flame, label: 'Critical Priority' };

      default:
        return { bg: 'bg-slate-50 text-slate-600 border-slate-200/80', dot: 'bg-slate-400', icon: HelpCircle, label: status };
    }
  };

  const style = getBadgeStyle();
  const IconComponent = style.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border shadow-2xs transition-all ${style.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      <IconComponent className="w-3.5 h-3.5 shrink-0 opacity-85" />
      <span className="tracking-tight">{style.label}</span>
    </span>
  );
};

