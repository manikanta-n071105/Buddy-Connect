import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ArrowLeft, MessageSquare, Send, ShieldAlert, Zap, CheckCircle2, ShieldX, Flame, Calendar, User } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/issues/${id}`);
      setData(res.data.data);
      setStatusUpdate(res.data.data.issue.status);
      setResolutionText(res.data.data.issue.resolution || '');
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

  const { issue, comments, isReporter } = data;

  const canManageStatus = ['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'SENIOR', 'FACULTY'].includes(user?.role || '');
  const isSeniorMentor = user?.role === 'SENIOR';
  const isEscalatedToMentor = issue.status === 'ESCALATED';

  // Senior Mentor CANNOT change status if issue is ESCALATED TO MENTOR
  const canUpdateStatus = canManageStatus && !(isSeniorMentor && isEscalatedToMentor);

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-8">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/issues')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-orange-600" /> Back to All Issues
        </button>

        <span className="text-xs font-mono font-bold text-slate-400">Ticket ID: #{issue.issue_number}</span>
      </div>

      {/* Main Issue Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-black tracking-wider">
                {issue.issue_number}
              </span>
              <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {issue.category_name}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{issue.title}</h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={issue.priority} type="priority" />
            {isEscalatedToMentor ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-md animate-pulse">
                <Flame className="w-3.5 h-3.5 text-amber-300" /> ESCALATED TO MENTOR
              </span>
            ) : (
              <StatusBadge status={issue.status} type="issue" />
            )}
          </div>
        </div>

        {/* Issue Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Issue Description</h3>
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 whitespace-pre-wrap leading-relaxed">
            {issue.description}
          </div>
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-semibold border-t border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Reported Student</span>
            <p className="text-slate-900 font-extrabold flex items-center gap-1 mt-0.5">
              <User className="w-3.5 h-3.5 text-orange-600" /> {issue.junior_name}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Senior Mentor</span>
            <p className="text-slate-900 font-extrabold mt-0.5">{issue.senior_name}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Department Mentor</span>
            <p className="text-slate-900 font-extrabold mt-0.5">{issue.mentor_name}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Date Logged</span>
            <p className="text-slate-900 font-extrabold mt-0.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(issue.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Resolution Details Card (If Resolved/Closed) */}
      {issue.resolution && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Official Resolution Details
          </h3>
          <p className="text-xs text-emerald-950 font-bold whitespace-pre-wrap leading-relaxed">
            {issue.resolution}
          </p>
          {issue.resolution_notes && (
            <p className="text-[11px] text-emerald-700 font-semibold italic border-t border-emerald-200/60 pt-2 mt-2">
              Note: {issue.resolution_notes}
            </p>
          )}
        </div>
      )}

      {/* Mentor Action / Status Update Form */}
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
                <option value="RESOLVED">MARK AS RESOLVED</option>
                {user?.role !== 'SENIOR' && <option value="CLOSED">CLOSED</option>}
                <option value="REOPENED">REOPENED</option>
                <option value="ESCALATED">ESCALATED TO Mentor</option>
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
              className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
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
