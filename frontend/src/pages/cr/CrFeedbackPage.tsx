import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import { CrClassFeedback } from '../../types';
import { MessageSquareText, Star, Send, Shield, CheckCircle2, AlertCircle, Building2, BookOpen, User, Clock, Layers } from 'lucide-react';
import { toast } from 'sonner';

export const CrFeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<CrClassFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [feedbackCategory, setFeedbackCategory] = useState('TEACHING_QUALITY');
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const totalPages = Math.ceil(feedbacks.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedFeedbacks = feedbacks.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const fetchMyFeedbacks = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/cr-feedback/my');
      setFeedbacks(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load feedback history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyFeedbacks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      toast.error('Please enter detailed observations/feedback before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/cr-feedback', {
        feedbackCategory,
        rating,
        feedbackText: feedbackText.trim()
      });

      toast.success('Class feedback submitted confidentially to Super Administrator!');
      setFeedbackCategory('TEACHING_QUALITY');
      setRating(5);
      setFeedbackText('');
      fetchMyFeedbacks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit class feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { key: 'TEACHING_QUALITY', label: 'Teaching Quality & Explanation' },
    { key: 'ACADEMIC_PACE', label: 'Syllabus Coverage & Pace' },
    { key: 'CLASSROOM_INFRA', label: 'Classroom & Lab Infrastructure' },
    { key: 'ATTENDANCE_SCHEDULE', label: 'Faculty Punctuality & Schedule' },
    { key: 'EXAM_ASSIGNMENTS', label: 'Tests, Homework & Evaluation' },
    { key: 'OTHER', label: 'Other Classroom Observation' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Sleek Banner Header */}
      <div className="relative overflow-hidden bg-slate-900 p-5 rounded-2xl text-white shadow-md border border-slate-800">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Class Representative (CR) Portal
          </div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            Class Representative Feedback Hub
          </h1>
          <p className="text-xs text-slate-300 font-medium max-w-2xl">
            As an appointed Class Representative, your feedback regarding subject lectures, faculty pace, and classroom observations is sent <strong className="text-amber-300">confidentially to the Super Administrator</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Feedback Submission Form */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquareText className="w-5 h-5 text-amber-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Submit Class Observation</h3>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Shield className="w-3 h-3 text-amber-600" /> Confidential
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-semibold">
            <div>
              <label className="block font-extrabold text-slate-800 mb-1">Feedback Category *</label>
              <select
                value={feedbackCategory}
                onChange={(e) => setFeedbackCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden focus:border-amber-500"
              >
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-extrabold text-slate-800 mb-1.5">Classroom Satisfaction Rating (1 to 5 Stars) *</label>
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 font-black text-amber-700 text-xs bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                  {rating} / 5
                </span>
              </div>
            </div>

            <div>
              <label className="block font-extrabold text-slate-800 mb-1">Detailed Observations & Feedback *</label>
              <textarea
                required
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Describe teaching pace, doubts clarification, student understanding, or classroom issues..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Submitting Feedback...' : 'Submit Confidential CR Report'}
            </button>
          </form>
        </div>

        {/* Right Column: History of CR Feedback Submitted */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" /> Your Submitted Class Reports ({feedbacks.length})
            </h3>
          </div>

          {isLoading ? (
            <LoadingState message="Loading your submitted CR feedbacks..." />
          ) : feedbacks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-2xs">
              <MessageSquareText className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="text-xs font-black text-slate-900 uppercase">No Feedback Reports Submitted Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Fill out the form on the left to submit your first confidential class observation to the Super Administrator.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {paginatedFeedbacks.map((f) => (
                  <div key={f.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5 relative overflow-hidden">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          Category: {f.feedback_category.replace(/_/g, ' ')}
                        </h4>
                        <p className="text-[11px] text-slate-600 font-semibold mt-0.5 flex items-center gap-2">
                          <span>Branch: <strong className="text-slate-900">{f.department}</strong></span>
                          {f.year_batch && <span>({f.year_batch})</span>}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl shrink-0">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${
                              star <= f.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                        <span className="font-extrabold text-[10px] text-amber-900 ml-1">{f.rating}/5</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      "{f.feedback_text}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-1">
                      <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Layers className="w-3 h-3 text-slate-400" /> Category: {f.feedback_category.replace(/_/g, ' ')}
                      </span>
                      <span>Submitted on: {new Date(f.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clean Pagination Bar */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-slate-700">
                <span className="text-slate-500 font-bold">
                  Showing <span className="text-slate-900 font-black">{(safeCurrentPage - 1) * pageSize + 1}</span> to <span className="text-slate-900 font-black">{Math.min(safeCurrentPage * pageSize, feedbacks.length)}</span> of <span className="text-slate-900 font-black">{feedbacks.length}</span> feedbacks
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 disabled:opacity-40 disabled:hover:bg-slate-50 disabled:hover:text-slate-700 transition-all font-black text-xs cursor-pointer"
                  >
                    Previous
                  </button>

                  <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-900 font-black">
                    Page {safeCurrentPage} of {totalPages}
                  </span>

                  <button
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 disabled:opacity-40 disabled:hover:bg-slate-50 disabled:hover:text-slate-700 transition-all font-black text-xs cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
