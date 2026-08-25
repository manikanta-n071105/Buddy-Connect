import React, { useState } from 'react';
import { CheckCircle2, Clock, XCircle, Vote, Globe, Users, Lock, Info } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

interface VotingPanelProps {
  issueId: string;
  isEligibleToVote: boolean;
  issueStatus?: string;
  votingScope?: 'ALL' | 'MENTOR_SCOPE' | 'REPORTER_ONLY' | 'NONE';
  voteSummary?: {
    satisfied: number;
    partiallySatisfied: number;
    notSatisfied: number;
    total: number;
    satisfiedPercent: number;
  };
  onVoteSubmitted?: () => void;
}

export const VotingPanel: React.FC<VotingPanelProps> = ({
  issueId,
  isEligibleToVote,
  issueStatus = '',
  votingScope = 'NONE',
  voteSummary = { satisfied: 0, partiallySatisfied: 0, notSatisfied: 0, total: 0, satisfiedPercent: 0 },
  onVoteSubmitted
}) => {
  const [selectedVote, setSelectedVote] = useState<'SATISFIED' | 'PARTIALLY_SATISFIED' | 'NOT_SATISFIED' | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (type: 'SATISFIED' | 'PARTIALLY_SATISFIED' | 'NOT_SATISFIED') => {
    setSelectedVote(type);
  };

  const submitVote = async () => {
    if (!selectedVote) {
      toast.error('Please select a feedback option before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/issues/${issueId}/vote`, {
        voteType: selectedVote,
        comment
      });
      toast.success('Your feedback vote has been submitted');
      if (onVoteSubmitted) onVoteSubmitted();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = voteSummary.total || 1;
  const satPct = Math.round((voteSummary.satisfied / total) * 100);
  const partPct = Math.round((voteSummary.partiallySatisfied / total) * 100);
  const notPct = Math.round((voteSummary.notSatisfied / total) * 100);

  const getScopeBadge = () => {
    switch (votingScope) {
      case 'ALL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Globe className="w-3 h-3 text-indigo-600" /> Campus-Wide Voting (All Students)
          </span>
        );
      case 'MENTOR_SCOPE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <Users className="w-3 h-3 text-amber-600" /> Mentor Circle Scope (Assigned Juniors)
          </span>
        );
      case 'REPORTER_ONLY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
            <Lock className="w-3 h-3 text-slate-600" /> Reporter Only Voting
          </span>
        );
      case 'NONE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            <Lock className="w-3 h-3 text-rose-600" /> Voting Access Locked
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Vote className="w-5 h-5 text-orange-600 shrink-0" />
          <h3 className="text-sm font-extrabold text-slate-900">Student Issue Resolution Feedback & Voting</h3>
        </div>
        <div className="flex items-center gap-2">
          {getScopeBadge()}
          <span className="text-xs text-slate-500 font-bold">{voteSummary.total} Votes Recorded</span>
        </div>
      </div>

      {/* Distribution Progress Bars */}
      <div className="space-y-3">
        {/* Satisfied */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-bold">
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Satisfied
            </span>
            <span className="text-slate-700">{satPct}% ({voteSummary.satisfied})</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${satPct}%` }} />
          </div>
        </div>

        {/* Partially Satisfied */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-bold">
            <span className="inline-flex items-center gap-1.5 text-amber-700">
              <Clock className="w-4 h-4 text-amber-600" /> Partially Satisfied
            </span>
            <span className="text-slate-700">{partPct}% ({voteSummary.partiallySatisfied})</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${partPct}%` }} />
          </div>
        </div>

        {/* Not Satisfied */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-bold">
            <span className="inline-flex items-center gap-1.5 text-rose-700">
              <XCircle className="w-4 h-4 text-rose-600" /> Not Satisfied
            </span>
            <span className="text-slate-700">{notPct}% ({voteSummary.notSatisfied})</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-rose-500 h-2 rounded-full transition-all" style={{ width: `${notPct}%` }} />
          </div>
        </div>
      </div>

      {/* Student Voting Form (Enabled ONLY if status is RESOLVED/VOTING and isEligibleToVote === true) */}
      {isEligibleToVote ? (
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <p className="text-xs font-extrabold text-slate-800">Cast Your Feedback Vote on Issue Resolution Quality:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleVote('SATISFIED')}
              className={`p-3 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                selectedVote === 'SATISFIED'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Satisfied</span>
            </button>

            <button
              type="button"
              onClick={() => handleVote('PARTIALLY_SATISFIED')}
              className={`p-3 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                selectedVote === 'PARTIALLY_SATISFIED'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md scale-[1.02]'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Partially</span>
            </button>

            <button
              type="button"
              onClick={() => handleVote('NOT_SATISFIED')}
              className={`p-3 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                selectedVote === 'NOT_SATISFIED'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-[1.02]'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Not Satisfied</span>
            </button>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional feedback notes for senior mentor & admin..."
            rows={2}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
          />

          <button
            type="button"
            disabled={!selectedVote || isSubmitting}
            onClick={submitVote}
            className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            {isSubmitting ? 'Submitting Feedback...' : 'Submit Resolution Vote'}
          </button>
        </div>
      ) : (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-center text-xs font-semibold text-slate-500 bg-slate-50/80 p-3 rounded-xl">
          <Info className="w-4 h-4 text-orange-500 shrink-0" />
          <span>
            {!['RESOLVED', 'VOTING'].includes(issueStatus)
              ? 'Voting buttons are hidden. Voting is permitted strictly when issue status is set to RESOLVED / VOTING.'
              : votingScope === 'NONE'
              ? 'Voting permissions are currently locked by Department Director.'
              : `Voting access is restricted for your role under permission scope: ${votingScope.replace('_', ' ')}`}
          </span>
        </div>
      )}
    </div>
  );
};
