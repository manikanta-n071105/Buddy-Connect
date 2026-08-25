import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { OnboardingItem } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { ClipboardCheck, CheckCircle2, Circle, PlusCircle, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export const OnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{ items: OnboardingItem[]; completedCount: number; totalCount: number; progressPercent: number; overallAveragePercent?: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Senior assigned juniors selection
  const [juniorsList, setJuniorsList] = useState<any[]>([]);
  const [selectedJuniorId, setSelectedJuniorId] = useState<string>('');

  // Add Item Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemCategory, setItemCategory] = useState('ACADEMIC');
  const [isRequired, setIsRequired] = useState(true);

  const canManageOnboarding = ['SUPER_ADMIN', 'ADMIN', 'DIRECTOR'].includes(user?.role || '') || (user?.permissions?.includes('MANAGE_ONBOARDING') ?? false);
  const isSenior = user?.role === 'SENIOR';

  // Fetch Assigned Juniors for Senior Mentor
  useEffect(() => {
    if (isSenior) {
      api.get('/users?role=JUNIOR').then((res) => {
        const junArr = res.data.data;
        setJuniorsList(junArr);
        if (junArr.length > 0) {
          setSelectedJuniorId(junArr[0].junior_id || junArr[0].id);
        }
      }).catch(console.error);
    }
  }, [isSenior]);

  const fetchOnboarding = async () => {
    setIsLoading(true);
    try {
      let url = '/onboarding/progress';
      if (isSenior && selectedJuniorId) {
        url += `?juniorId=${selectedJuniorId}`;
      }
      const res = await api.get(url);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboarding();
  }, [selectedJuniorId]);

  const toggleItem = async (itemId: string, currentStatus?: boolean) => {
    if (isSenior) {
      toast.info('Read-only view for Senior Mentor');
      return;
    }
    try {
      await api.post(`/onboarding/item/${itemId}`, { isCompleted: !currentStatus });
      toast.success('Checklist updated');
      fetchOnboarding();
    } catch (err) {
      toast.error('Failed to update checklist item');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle || !itemCategory) {
      toast.error('Please enter a title and category');
      return;
    }

    try {
      await api.post('/onboarding/items', {
        title: itemTitle.trim(),
        description: itemDescription.trim(),
        category: itemCategory.trim(),
        isRequired
      });

      toast.success('Onboarding checklist item added & attached for all juniors!');
      setShowAddModal(false);
      setItemTitle('');
      setItemDescription('');
      fetchOnboarding();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add onboarding item');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Sleek Banner Header - Matching Design System */}
      <div className="relative overflow-hidden bg-slate-900 p-4 sm:p-5 rounded-2xl text-white shadow-md border border-slate-800">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-orange-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider">
              <ClipboardCheck className="w-3 h-3" /> Orientation Progress
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">Student Onboarding Checklist</h1>
            <p className="text-xs text-slate-300 font-medium">Track and complete essential college orientation and setup steps.</p>
          </div>

          {canManageOnboarding && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* Senior / Director Mentor Aggregated Average Banner */}
      {['SENIOR', 'DIRECTOR'].includes(user?.role || '') && data && (
        <div className="bg-gradient-to-r from-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex items-center justify-between gap-4 border border-indigo-800/80">
          <div className="space-y-1">
            <h3 className="text-sm font-black tracking-tight flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-indigo-400" /> Assigned Juniors Overall Onboarding Average
            </h3>
            <p className="text-xs text-indigo-200 font-medium">Aggregated checklist completion score across all your assigned student mentees</p>
          </div>
          <div className="bg-indigo-900/90 border border-indigo-700/80 px-5 py-2.5 rounded-xl text-right shrink-0 shadow-inner">
            <span className="text-3xl font-black text-emerald-400">{data.overallAveragePercent || 0}%</span>
            <span className="block text-[10px] text-indigo-300 font-extrabold uppercase tracking-wider">Assigned Avg</span>
          </div>
        </div>
      )}

      {/* Senior Selector Bar */}
      {isSenior && (
        <div className="p-4 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-indigo-950">Inspect Individual Assigned Junior Checklist:</span>
          </div>
          <select
            value={selectedJuniorId}
            onChange={(e) => setSelectedJuniorId(e.target.value)}
            className="p-2.5 bg-white border border-indigo-300 rounded-xl font-bold text-slate-900 outline-hidden"
          >
            {juniorsList.map((j) => (
              <option key={j.junior_id || j.id} value={j.junior_id || j.id}>
                {j.name} ({j.register_number || 'Junior'})
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading || !data ? (
        <LoadingState message="Loading Onboarding Checklist..." />
      ) : (
        <>
          {/* Progress Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Overall Onboarding Progress</span>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1 rounded-full shadow-2xs">
                {data.completedCount} / {data.totalCount} Completed ({data.progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500 shadow-xs" style={{ width: `${data.progressPercent}%` }} />
            </div>
          </div>

          {/* Checklist Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {data.items.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id, item.is_completed)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors group"
              >
                <div className="flex items-start gap-3.5">
                  {item.is_completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 group-hover:text-slate-400 shrink-0 mt-0.5 transition-colors" />
                  )}
                  <div>
                    <h4 className={`text-xs font-bold ${item.is_completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">{item.description}</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-3 py-1 bg-slate-100 rounded-full border border-slate-200/60 shadow-2xs">
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Checklist Item Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-orange-600" /> Super Admin: Add Checklist Task
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="e.g. Register for College Library Access Card"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category *</label>
                <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-hidden">
                  <option value="ACADEMIC">ACADEMIC</option>
                  <option value="HOSTEL">HOSTEL & HOUSING</option>
                  <option value="ADMINISTRATIVE">ADMINISTRATIVE</option>
                  <option value="CAMPUS_LIFE">CAMPUS LIFE & CLUBS</option>
                  <option value="HEALTH_SAFETY">HEALTH & SAFETY</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Description / Instructions</label>
                <textarea
                  rows={3}
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Step-by-step instructions for the junior student..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-hidden"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} className="rounded-md text-orange-600 focus:ring-orange-500" />
                <span>Mandatory Onboarding Item</span>
              </label>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-extrabold rounded-xl shadow-md shadow-orange-600/30 hover:from-orange-500 hover:to-amber-500 transition-all cursor-pointer">Add Task to Checklist</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

