import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import { BarChart3, Plus, Clock, CheckCircle2, Trash2, X, AlertCircle, Vote, Sparkles, Filter, RotateCw, Users, ShieldCheck, TrendingUp, Layers, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PollOption {
  id: string;
  option_text: string;
  vote_count: number;
  percentage: number;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  department: string;
  target_audience: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  creator_name: string;
  creator_role: string;
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId: string | null;
  isExpired: boolean;
}

export const PollsPage: React.FC = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  // Poll creation form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [durationHours, setDurationHours] = useState('24');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canCreatePoll = ['SUPER_ADMIN', 'ADMIN', 'DIRECTOR'].includes(user?.role || '') || (user?.permissions?.includes('MANAGE_POLLS') ?? false);
  const isJunior = user?.role === 'JUNIOR';

  const fetchPolls = async () => {
    try {
      const res = await api.get(`/polls${showExpired ? '?includeExpired=true' : ''}`);
      setPolls(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load campus polls');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchPolls();
    toast.success('Live voting results refreshed!');
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchPolls();
  }, [showExpired]);

  const handleAddOption = () => {
    if (options.length >= 6) {
      toast.error('Maximum 6 options allowed per poll');
      return;
    }
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error('At least 2 poll choices are required');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOpts = options.map(o => o.trim()).filter(o => o.length > 0);

    if (!title.trim() || cleanOpts.length < 2) {
      toast.error('Please enter a poll question and at least 2 non-empty choices');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/polls', {
        title: title.trim(),
        description: description.trim(),
        department,
        durationHours,
        options: cleanOpts
      });

      toast.success('Campus poll created successfully!');
      setShowCreateModal(false);
      // Reset form
      setTitle('');
      setDescription('');
      setDepartment('ALL');
      setDurationHours('24');
      setOptions(['', '']);
      fetchPolls();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      await api.post(`/polls/${pollId}/vote`, { optionId });
      toast.success('Your vote has been recorded!');

      // Optimistic UI update
      setPolls(prevPolls =>
        prevPolls.map(p => {
          if (p.id !== pollId) return p;

          const prevUserVotedOptionId = p.userVotedOptionId;
          const updatedOptions = p.options.map(opt => {
            let count = opt.vote_count;
            if (opt.id === optionId) count += 1;
            if (prevUserVotedOptionId && opt.id === prevUserVotedOptionId) count = Math.max(0, count - 1);
            return { ...opt, vote_count: count };
          });

          const newTotal = updatedOptions.reduce((sum, o) => sum + o.vote_count, 0);
          const optionsWithPct = updatedOptions.map(o => ({
            ...o,
            percentage: newTotal > 0 ? Math.round((o.vote_count / newTotal) * 100) : 0
          }));

          return {
            ...p,
            options: optionsWithPct,
            totalVotes: newTotal,
            userVotedOptionId: optionId
          };
        })
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit vote');
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!window.confirm('Are you sure you want to delete this campus poll?')) return;
    try {
      await api.delete(`/polls/${pollId}`);
      toast.success('Poll deleted successfully');
      fetchPolls();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete poll');
    }
  };

  const getTimeRemaining = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `Expires in ${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `Expires in ${hours}h ${minutes}m`;
    return `Expires in ${minutes}m`;
  };

  const totalActivePolls = polls.filter(p => !p.isExpired).length;
  const totalVotesAcrossPolls = polls.reduce((sum, p) => sum + p.totalVotes, 0);

  if (isLoading) return <LoadingState message="Loading Campus Polls..." />;

  return (
    <div className="space-y-4 pb-8">
      {/* Compact Banner Header */}
      <div className="relative overflow-hidden bg-slate-900 p-4 sm:p-5 rounded-2xl text-white shadow-md border border-slate-800">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-orange-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider">
              <Vote className="w-3 h-3" /> Student Polls
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">Interactive Campus Polls</h1>
            <p className="text-xs text-slate-300 font-medium">Vote on active campus topics and department surveys.</p>
          </div>

          {/* Quick Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCw className={`w-3 h-3 text-orange-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {canCreatePoll && (
              <button
                onClick={() => setShowExpired(!showExpired)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  showExpired
                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>{showExpired ? 'Inc. Expired' : 'Active Only'}</span>
              </button>
            )}

            {canCreatePoll && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Create Poll</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: 3 columns on large screens, 2 on medium screens */}
      {polls.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-2xs">
          <Vote className="w-8 h-8 text-orange-500 mx-auto" />
          <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase">No Active Campus Polls</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">There are currently no active polls running for your department.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {polls.map((poll) => {
            const timeText = getTimeRemaining(poll.expires_at);

            return (
              <div
                key={poll.id}
                className={`bg-white rounded-2xl border p-4 shadow-2xs space-y-3 transition-all hover:shadow-md relative overflow-hidden flex flex-col justify-between ${
                  poll.isExpired ? 'border-slate-200 opacity-75 bg-slate-50/50' : 'border-slate-200/90 hover:border-orange-300'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Card Header: Dept Pill & Timer */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 truncate">
                      {poll.department === 'ALL' || !poll.department ? 'Campus Wide' : poll.department}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        poll.isExpired ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-orange-50 border-orange-200 text-orange-800'
                      }`}>
                        <Clock className="w-3 h-3 text-orange-600" /> {timeText}
                      </span>

                      {canCreatePoll && (
                        <button
                          onClick={() => handleDeletePoll(poll.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer rounded-md hover:bg-rose-50"
                          title="Delete Poll"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">{poll.title}</h3>
                    {poll.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{poll.description}</p>
                    )}
                  </div>

                  {/* Voting Options */}
                  <div className="space-y-2 pt-0.5">
                    {!isJunior && (
                      <p className="text-[10px] text-amber-800 font-semibold bg-amber-50 p-1.5 rounded-lg border border-amber-200/80">
                        Live Results (Only Juniors vote)
                      </p>
                    )}

                    {poll.options.map((opt) => {
                      const isSelected = poll.userVotedOptionId === opt.id;
                      const isDisabled = poll.isExpired || !isJunior;

                      return (
                        <button
                          key={opt.id}
                          disabled={isDisabled}
                          onClick={() => handleVote(poll.id, opt.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl border transition-all relative overflow-hidden flex items-center min-h-[38px] ${
                            !isJunior ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
                          } ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50/80 ring-1 ring-orange-500/20'
                              : 'border-slate-200/90 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          {/* Animated Progress Fill */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 transition-all duration-500 opacity-20 pointer-events-none ${
                              isSelected ? 'bg-orange-600' : 'bg-slate-600'
                            }`}
                            style={{ width: `${opt.percentage}%` }}
                          />

                          <div className="flex items-center justify-between w-full relative z-10 text-xs gap-2">
                            <div className="flex items-center gap-2 font-bold text-slate-900 min-w-0 pr-1">
                              {isSelected && <Check className="w-3.5 h-3.5 text-orange-600 shrink-0 stroke-[3]" />}
                              <span className="truncate text-[11px] sm:text-xs">{opt.option_text}</span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 bg-white/90 px-1.5 py-0.5 rounded-md border border-slate-200/60 text-[10px]">
                              <span className="font-mono font-black text-slate-900">{opt.percentage}%</span>
                              <span className="text-slate-400">({opt.vote_count})</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-medium mt-2">
                  <span className="truncate pr-1">By {poll.creator_name}</span>
                  <span className="font-extrabold text-slate-700 shrink-0">{poll.totalVotes} votes</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compact Create Poll Modal */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Vote className="w-4 h-4 text-orange-600" /> Create Campus Student Poll
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="space-y-3">
              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Poll Question *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Preferred topic for upcoming Tech Fest workshop?"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all text-xs"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add additional details..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all resize-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">Department Scope *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-hidden text-xs"
                  >
                    <option value="ALL">Campus Wide (All Departments)</option>
                    <option value="Computer Science & Engineering">Computer Science & Engineering (CSE)</option>
                    <option value="Electronics & Communication Engineering">Electronics & Communication Engineering (ECE)</option>
                    <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering (EEE)</option>
                    <option value="Mechanical Engineering">Mechanical Engineering (MECH)</option>
                    <option value="Civil Engineering">Civil Engineering (CIVIL)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">Duration *</label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-hidden text-xs"
                  >
                    <option value="1">1 Hour</option>
                    <option value="6">6 Hours</option>
                    <option value="12">12 Hours</option>
                    <option value="24">24 Hours (1 Day)</option>
                    <option value="48">48 Hours (2 Days)</option>
                    <option value="168">7 Days (1 Week)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Choice Options */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block font-black text-slate-900 uppercase text-[10px] tracking-wider">Poll Choices *</label>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-orange-600 font-extrabold hover:underline text-[11px] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Option
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="w-4 text-center font-extrabold text-slate-400 text-[10px]">{idx + 1}.</span>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Choice ${idx + 1}`}
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-hidden focus:ring-2 focus:ring-orange-500/20 text-xs"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-extrabold rounded-xl shadow-xs transition-all cursor-pointer text-xs"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Poll'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
