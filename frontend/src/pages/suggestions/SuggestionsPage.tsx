import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Suggestion } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { Lightbulb, ThumbsUp, TrendingUp, ShieldCheck, CheckCircle2, Clock, XCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export const SuggestionsPage: React.FC = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State for Junior
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Campus Infrastructure');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Review Modal for Mentors & Management
  const [reviewTarget, setReviewTarget] = useState<any>(null);
  const [statusVal, setStatusVal] = useState('UNDER_REVIEW');
  const [responseNoteVal, setResponseNoteVal] = useState('');

  const isMentorOrManagement = ['SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'SENIOR'].includes(user?.role || '');

  const fetchSuggestions = async () => {
    try {
      const res = await api.get('/suggestions');
      setSuggestions(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleVote = async (id: string) => {
    try {
      await api.post(`/suggestions/${id}/vote`);
      fetchSuggestions();
    } catch (err) {
      toast.error('Failed to upvote suggestion');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    setIsSubmitting(true);
    try {
      await api.post('/suggestions', { title, description, category, isAnonymous });
      toast.success('Suggestion submitted!');
      setTitle('');
      setDescription('');
      fetchSuggestions();
    } catch (err) {
      toast.error('Failed to submit suggestion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTarget) return;
    try {
      await api.patch(`/suggestions/${reviewTarget.id}/status`, {
        status: statusVal,
        responseNote: responseNoteVal
      });
      toast.success(`Suggestion status updated to ${statusVal.replace('_', ' ')}!`);
      setReviewTarget(null);
      fetchSuggestions();
    } catch (err) {
      toast.error('Failed to update suggestion status');
    }
  };

  if (isLoading) return <LoadingState message="Loading Student Suggestions & Initiatives..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Sleek Banner Header - Matching Design System */}
      <div className="relative overflow-hidden bg-slate-900 p-4 sm:p-5 rounded-2xl text-white shadow-md border border-slate-800">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-orange-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider">
            <Lightbulb className="w-3 h-3" /> Student Voice & Ideas
          </div>
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">Student Suggestions & Feedback</h1>
          <p className="text-xs text-slate-300 font-medium">Proposals, campus improvements, and student feedback monitored by mentors.</p>
        </div>
      </div>

      {/* New Suggestion Form for Junior */}
      {user?.role === 'JUNIOR' && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Submit a Proposal to Mentors</h3>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. Extended Library Hours during exams)"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs"
          />
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Explain why this suggestion will benefit students..."
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs"
          />
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded-xs text-indigo-600"
              />
              <span>Post Anonymously</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-md shadow-xs"
            >
              Submit Proposal
            </button>
          </div>
        </form>
      )}

      {/* Leaderboard Feed */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-indigo-600" /> Suggestions Leaderboard & Mentor Review
        </h3>

        {suggestions.map((s) => (
          <div key={s.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-start gap-4">
              {/* Upvote Button */}
              <button
                onClick={() => handleVote(s.id)}
                className={`p-3 rounded-md border flex flex-col items-center gap-1 min-w-[50px] transition-all ${
                  s.user_voted
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span className="text-xs font-bold">{s.vote_count}</span>
              </button>

              {/* Suggestion Info */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{s.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-sm">
                      {s.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${
                      s.status === 'IMPLEMENTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      s.status === 'ACCEPTED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      s.status === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      s.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {s.status ? s.status.replace('_', ' ') : 'PENDING'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1">
                  <span>Submitted by: <strong className="text-slate-700">{s.author_name}</strong></span>
                  {isMentorOrManagement && (
                    <button
                      onClick={() => { setReviewTarget(s); setStatusVal(s.status || 'UNDER_REVIEW'); setResponseNoteVal(s.response_note || ''); }}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Review / Update Status
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Official Response Note Banner */}
            {s.response_note && (
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-md text-xs text-indigo-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-indigo-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Mentor & Management Official Response:
                </p>
                <p className="text-slate-700 font-medium">{s.response_note}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Review Modal for Mentors & Management */}
      {reviewTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Review Student Proposal
              </h3>
              <button onClick={() => setReviewTarget(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-1 text-xs bg-slate-50 p-3 border rounded-md">
              <p className="font-bold text-slate-900">{reviewTarget.title}</p>
              <p className="text-slate-600 text-[11px]">{reviewTarget.description}</p>
            </div>
            <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Proposal Status *</label>
                <select value={statusVal} onChange={(e) => setStatusVal(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-md">
                  <option value="PENDING">PENDING</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="ACCEPTED">ACCEPTED FOR PLANNING</option>
                  <option value="IMPLEMENTED">IMPLEMENTED & COMPLETED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Response Note / Feedback</label>
                <textarea
                  rows={3}
                  value={responseNoteVal}
                  onChange={(e) => setResponseNoteVal(e.target.value)}
                  placeholder="Provide guidance or update for students regarding this initiative..."
                  className="w-full p-2 bg-slate-50 border rounded-md"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setReviewTarget(null)} className="px-3 py-1.5 border rounded-md">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white font-semibold rounded-md">Save Status Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
