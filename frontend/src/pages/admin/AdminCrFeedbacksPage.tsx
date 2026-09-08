import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import { CrClassFeedback, getBranchShortCode, DEPARTMENT_OPTIONS } from '../../types';
import { ShieldCheck, Star, Filter, MessageSquareText, Building2, BookOpen, User, Layers, AlertTriangle, CheckCircle2, Search, X } from 'lucide-react';
import { toast } from 'sonner';

export const AdminCrFeedbacksPage: React.FC = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<CrClassFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFeedbacks = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (departmentFilter !== 'ALL') params.department = departmentFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (ratingFilter !== 'ALL') params.rating = ratingFilter;

      const res = await api.get('/cr-feedback/admin', { params });
      setFeedbacks(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load confidential CR feedbacks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [departmentFilter, categoryFilter, ratingFilter]);

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.cr_name?.toLowerCase().includes(term) ||
      f.cr_username?.toLowerCase().includes(term) ||
      f.feedback_category?.toLowerCase().includes(term) ||
      f.feedback_text?.toLowerCase().includes(term)
    );
  });

  const totalCount = feedbacks.length;
  const avgRating = totalCount > 0 ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / totalCount).toFixed(1) : '0.0';
  const criticalCount = feedbacks.filter((f) => f.rating <= 2).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Sleek Banner Header */}
      <div className="relative overflow-hidden bg-slate-900 p-5 rounded-2xl text-white shadow-md border border-slate-800">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3 text-amber-400" /> Confidential Super Admin Audit
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">
            Class Representative (CR) Feedbacks Audit
          </h1>
          <p className="text-xs text-slate-300 font-medium max-w-2xl">
            Confidential reports submitted by appointed Class Representatives across all academic departments. Visible strictly to Super Administrators.
          </p>
        </div>
      </div>

      {/* Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-[11px] text-slate-500 font-extrabold uppercase">Total CR Reports</p>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900">{totalCount}</h3>
            <MessageSquareText className="w-5 h-5 text-amber-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-[11px] text-slate-500 font-extrabold uppercase">Average Satisfaction</p>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-amber-600 flex items-center gap-1">
              {avgRating} <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </h3>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-[11px] text-slate-500 font-extrabold uppercase">Critical Attention (1-2 Stars)</p>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-rose-600">{criticalCount}</h3>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by subject, faculty, CR name, or comments..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-amber-500 outline-hidden"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden text-xs"
            >
              <option value="ALL">All Departments</option>
              <option value="CSE">CSE (All Sections)</option>
              {DEPARTMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden text-xs"
            >
              <option value="ALL">All Categories</option>
              <option value="TEACHING_QUALITY">Teaching Quality</option>
              <option value="ACADEMIC_PACE">Academic Pace</option>
              <option value="CLASSROOM_INFRA">Classroom Infrastructure</option>
              <option value="ATTENDANCE_SCHEDULE">Attendance & Schedule</option>
              <option value="EXAM_ASSIGNMENTS">Exam & Evaluation</option>
              <option value="OTHER">Other Observations</option>
            </select>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden text-xs"
            >
              <option value="ALL">All Ratings</option>
              <option value="5">5 Stars ⭐⭐⭐⭐⭐</option>
              <option value="4">4 Stars ⭐⭐⭐⭐</option>
              <option value="3">3 Stars ⭐⭐⭐</option>
              <option value="2">2 Stars ⭐⭐</option>
              <option value="1">1 Star ⭐</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedbacks Feed */}
      {isLoading ? (
        <LoadingState message="Loading confidential CR feedback audit reports..." />
      ) : filteredFeedbacks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-2xs">
          <MessageSquareText className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-xs font-black text-slate-900 uppercase">No Matching Feedbacks Found</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">Try clearing search filters or changing department scope.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredFeedbacks.map((f) => (
            <div key={f.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3 relative overflow-hidden">
              {/* Top Accent Line based on Rating */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                f.rating <= 2 ? 'bg-rose-500' : f.rating === 3 ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-[10px] font-black rounded-md bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-600 fill-amber-500" /> CR: {f.cr_name} (@{f.cr_username})
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {getBranchShortCode(f.department)}
                    </span>
                    {f.year_batch && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {f.year_batch}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl shrink-0 self-start sm:self-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= f.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                  <span className="font-extrabold text-xs text-amber-900 ml-1.5">{f.rating} / 5</span>
                </div>
              </div>

              {/* Feedback Body */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">CR Observation Comments:</p>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  "{f.feedback_text}"
                </p>
              </div>

              {/* Footer Details */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-1">
                <span className="inline-flex items-center gap-1 text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                  <Layers className="w-3 h-3 text-slate-500" /> Category: {f.feedback_category.replace(/_/g, ' ')}
                </span>
                <span>Submitted: {new Date(f.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
