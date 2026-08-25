import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { VotingPanel } from '../../components/issues/VotingPanel';
import { ArrowLeft, MessageSquare, Globe, Users, Lock, Send, ShieldAlert, EyeOff, Zap, CheckCircle2, ShieldX } from 'lucide-react';
import { toast } from 'sonner';

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [statusUpdate, setStatusUpdate] = useState<string>('');
  const [votingScopeUpdate, setVotingScopeUpdate] = useState<string>('NONE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingScope, setIsUpdatingScope] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/issues/${id}`);
      setData(res.data.data);
      setStatusUpdate(res.data.data.issue.status);
      setResolutionText(res.data.data.issue.resolution || '');
      setVotingScopeUpdate(res.data.data.issue.voting_scope || 'NONE');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.patch(`/issues/${id}/status`, {
        status: statusUpdate,
        resolution: resolutionText
      });
      toast.success('Issue status updated successfully');
      fetchDetail();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScopeChange = async (newScope: string) => {
    setIsUpdatingScope(true);
    try {
      await api.patch(`/issues/${id}/voting-scope`, {
        votingScope: newScope
      });
      setVotingScopeUpdate(newScope);
      toast.success(`Voting permissions updated to ${newScope.replace('_', ' ')}`);
      fetchDetail();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update voting scope');
    } finally {
      setIsUpdatingScope(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await api.post(`/issues/${id}/comments`, { comment: commentText });
      setCommentText('');
      fetchDetail();
    } catch (err) {
      toast.error('Failed to post comment');
    }
  };

  if (isLoading || !data) return <LoadingState message="Fetching issue detail & audit history..." />;

  const { issue, comments, voteSummary, isEligibleToVote, isReporter } = data;

  // STRICT RULE 1: Only Department Director and Super Admin can configure who can vote
  const canManageVotingScope = ['SUPER_ADMIN', 'ADMIN', 'DIRECTOR'].includes(user?.role || '');
  const isSeniorMentor = user?.role === 'SENIOR';
  const isEscalatedToDirector = issue.status === 'ESCALATED';

  // STRICT RULE 2: Senior Mentor CANNOT change status if issue is escalated to Director
  const canUpdateStatus = (canManageVotingScope || isSeniorMentor) && !(isSeniorMentor && isEscalatedToDirector);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/issues')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Issue Registry
      </button>

      {/* Main Issue Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-black text-orange-600 tracking-wider uppercase">{issue.issue_number} • {issue.category_name}</span>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">{issue.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={issue.priority} type="priority" />
            
            {/* STRICT RULE: Only the reporting student (or mentors/admin) can view the issue status! */}
            {isReporter ? (
              <StatusBadge status={issue.status} type="issue" />
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-300" title="Status visible strictly to reporting student and mentor">
                <EyeOff className="w-3 h-3 text-slate-500" /> Protected Ticket
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">{issue.description}</p>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 text-xs border-t border-slate-100 font-medium">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Reported Student</span>
            <span className="text-slate-900 font-bold">{issue.junior_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Senior</span>
            <span className="text-slate-900 font-bold">{issue.senior_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Department Director</span>
            <span className="text-slate-900 font-bold">{issue.director_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Date Reported</span>
            <span className="text-slate-900 font-bold">{new Date(issue.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Escalation Lock Warning for Senior Mentors */}
      {isSeniorMentor && isEscalatedToDirector && (
        <div className="bg-rose-950 text-rose-100 border-2 border-rose-600 rounded-2xl p-4 sm:p-5 shadow-xl flex items-center gap-3">
          <ShieldX className="w-6 h-6 text-rose-400 shrink-0" />
          <div className="text-xs font-medium">
            <h4 className="font-black uppercase tracking-wider text-rose-200">Escalated to Department Director</h4>
            <p className="text-rose-300 mt-0.5">This issue ticket has been escalated to the Department Director. Status modification is restricted to the Director and Super Admin.</p>
          </div>
        </div>
      )}

      {/* First-Time Senior Mentor Quick Action Banner for Newly Raised Issues */}
      {isSeniorMentor && issue.status === 'OPEN' && (
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border-2 border-orange-500/40 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-orange-600 flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-600 animate-pulse" /> Senior Mentor First-Time Status Update
            </h3>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-orange-600 text-white uppercase">Newly Raised Issue</span>
          </div>

          <p className="text-xs text-slate-700 font-semibold">
            This student issue is newly raised. As assigned Senior Mentor, choose an initial action to update its status for the first time:
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  await api.patch(`/issues/${id}/status`, { status: 'UNDER_REVIEW', resolution: 'Senior mentor acknowledged the issue and started initial review.' });
                  toast.success('Issue acknowledged and set to UNDER REVIEW');
                  fetchDetail();
                } catch (err) {
                  toast.error('Failed to update status');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Acknowledge & Set Under Review
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  await api.patch(`/issues/${id}/status`, { status: 'IN_PROGRESS', resolution: 'Senior mentor has actively started working on resolving the issue.' });
                  toast.success('Issue status set to IN PROGRESS');
                  fetchDetail();
                } catch (err) {
                  toast.error('Failed to update status');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" /> Start Working (In Progress)
            </button>
          </div>
        </div>
      )}

      {/* Voting Scope Management (Strictly Department Director & Super Admin Control) */}
      {canManageVotingScope && (
        <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-500" /> Director Voting Access Permission Controls
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Department Director / Admin Only</span>
          </div>

          <p className="text-xs text-slate-300">
            By default, voting is locked for raised issues until Department Director explicitly grants access:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
            <button
              type="button"
              disabled={isUpdatingScope}
              onClick={() => handleScopeChange('NONE')}
              className={`p-3 rounded-xl border text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                votingScopeUpdate === 'NONE'
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Lock className="w-4 h-4 text-rose-400 shrink-0" />
              <div className="text-left">
                <p className="font-extrabold">Voting Locked</p>
                <p className="text-[10px] font-normal opacity-80">Default: No voting</p>
              </div>
            </button>

            <button
              type="button"
              disabled={isUpdatingScope}
              onClick={() => handleScopeChange('ALL')}
              className={`p-3 rounded-xl border text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                votingScopeUpdate === 'ALL'
                  ? 'bg-orange-600 text-white border-orange-500 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Globe className="w-4 h-4 text-orange-400 shrink-0" />
              <div className="text-left">
                <p className="font-extrabold">All Students</p>
                <p className="text-[10px] font-normal opacity-80">Campus-wide voting</p>
              </div>
            </button>

            <button
              type="button"
              disabled={isUpdatingScope}
              onClick={() => handleScopeChange('MENTOR_SCOPE')}
              className={`p-3 rounded-xl border text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                votingScopeUpdate === 'MENTOR_SCOPE'
                  ? 'bg-orange-600 text-white border-orange-500 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-left">
                <p className="font-extrabold">Mentor Circle</p>
                <p className="text-[10px] font-normal opacity-80">Assigned juniors only</p>
              </div>
            </button>

            <button
              type="button"
              disabled={isUpdatingScope}
              onClick={() => handleScopeChange('REPORTER_ONLY')}
              className={`p-3 rounded-xl border text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                votingScopeUpdate === 'REPORTER_ONLY'
                  ? 'bg-orange-600 text-white border-orange-500 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="text-left">
                <p className="font-extrabold">Reporter Only</p>
                <p className="text-[10px] font-normal opacity-80">Only student who raised</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Resolution & Voting Section */}
      <VotingPanel
        issueId={issue.id}
        isEligibleToVote={isEligibleToVote}
        issueStatus={issue.status}
        votingScope={issue.voting_scope || 'NONE'}
        voteSummary={voteSummary}
        onVoteSubmitted={fetchDetail}
      />

      {/* Mentor Action / Status Update Form (Guarded against Escalated lock for Seniors) */}
      {canUpdateStatus && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Update Issue Status & Add Resolution</h3>
          <form onSubmit={handleStatusChange} className="space-y-3">
            <div className="flex gap-3">
              <select
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-hidden cursor-pointer"
              >
                <option value="OPEN">OPEN</option>
                <option value="UNDER_REVIEW">UNDER REVIEW</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVE & OPEN VOTING</option>
                <option value="CLOSED">CLOSED</option>
                <option value="REOPENED">REOPENED</option>
                <option value="ESCALATED">ESCALATED TO DIRECTOR</option>
              </select>
            </div>

            <textarea
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="Enter official resolution details and actions taken..."
              rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Update Issue Status
            </button>
          </form>
        </div>
      )}

      {/* Comments & Activity Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-orange-600" /> Discussion & Activity Log ({comments.length})
        </h3>

        <div className="space-y-3 divide-y divide-slate-100">
          {comments.map((c: any) => (
            <div key={c.id} className="pt-3 first:pt-0">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-900">{c.author_name} ({c.author_role.replace('_', ' ')})</span>
                <span className="text-[10px] text-slate-400 font-mono">{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-700 font-medium">{c.comment}</p>
            </div>
          ))}
        </div>

        {/* Post Comment Input */}
        <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-slate-100">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment or update note..."
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> Post
          </button>
        </form>
      </div>
    </div>
  );
};
