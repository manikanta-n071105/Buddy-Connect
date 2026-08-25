import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const CreateIssuePage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/issues/categories');
        setCategories(res.data.data);
        if (res.data.data.length > 0) setCategoryId(res.data.data[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !categoryId) {
      toast.error('Please complete all required issue fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/issues', {
        title,
        description,
        categoryId,
        priority
      });
      toast.success(`Issue #${res.data.data.issue_number} raised successfully!`);
      navigate(`/issues/${res.data.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to raise issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Issues
      </button>

      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-600" /> Raise New Support Issue Ticket
          </h1>
          <p className="text-xs text-slate-500">Submit a support request to your assigned Senior mentor and Director</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the issue (e.g., Library access error)"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level *</label>
            <div className="grid grid-cols-4 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`p-2.5 rounded-md border text-xs font-bold transition-all ${
                    priority === p
                      ? p === 'CRITICAL'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : p === 'HIGH'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Provide complete details, room number, date, or specific guidance needed..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-md shadow-xs transition-colors"
          >
            {isSubmitting ? 'Submitting Issue Ticket...' : 'Submit Support Issue Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
};
