import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import {
  Building2,
  UtensilsCrossed,
  Users,
  CheckCircle2,
  XCircle,
  Calendar,
  Save,
  Coffee,
  Sun,
  Moon,
  AlertTriangle,
  RefreshCw,
  Phone,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

export const WardenDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [summary, setSummary] = useState<any>(null);
  const [menuData, setMenuData] = useState<{ breakfast: string; lunch: string; dinner: string }>({
    breakfast: '',
    lunch: '',
    dinner: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingMenu, setIsSavingMenu] = useState<string | null>(null);

  const fetchWardenData = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const [sumRes, menuRes] = await Promise.all([
        api.get(`/mess/warden-summary?date=${dateStr}`),
        api.get(`/mess/menu?date=${dateStr}`)
      ]);
      setSummary(sumRes.data.data);
      setMenuData({
        breakfast: menuRes.data.data.breakfast || '',
        lunch: menuRes.data.data.lunch || '',
        dinner: menuRes.data.data.dinner || ''
      });
    } catch (err: any) {
      toast.error('Failed to load warden hostel mess summary');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWardenData(selectedDate);
  }, [selectedDate]);

  const handleSaveMenu = async (mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER', menuItems: string) => {
    if (!menuItems.trim()) {
      toast.error(`Please enter menu items for ${mealType.toLowerCase()}`);
      return;
    }
    setIsSavingMenu(mealType);
    try {
      await api.post('/mess/menu', {
        date: selectedDate,
        mealType,
        menuItems
      });
      toast.success(`${mealType} menu updated successfully!`);
      fetchWardenData(selectedDate);
    } catch (err: any) {
      toast.error('Failed to update menu');
    } finally {
      setIsSavingMenu(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-black uppercase tracking-wider mb-3 border border-indigo-500/30">
            <Building2 className="w-3.5 h-3.5" /> Hostel Warden Operations Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Hostel Mess & Daily Meal Headcount</h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl font-medium">
            Manage today's meal menu, track real-time hosteller opt-in counts, and prevent food waste.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-black text-white text-xs outline-hidden cursor-pointer"
            />
          </div>
          <button
            onClick={() => fetchWardenData(selectedDate)}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Calculating live hosteller meal counts & menu..." />
      ) : (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Hostellers</span>
                <span className="text-2xl font-black text-slate-900">{summary?.totalHostellers || 0}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Coffee className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Breakfast Headcount</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900">{summary?.meals?.BREAKFAST?.eating || 0}</span>
                  <span className="text-[10px] font-bold text-rose-600">({summary?.meals?.BREAKFAST?.optOut || 0} opt-out)</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <Sun className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Lunch Headcount</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900">{summary?.meals?.LUNCH?.eating || 0}</span>
                  <span className="text-[10px] font-bold text-rose-600">({summary?.meals?.LUNCH?.optOut || 0} opt-out)</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Moon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Dinner Headcount</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900">{summary?.meals?.DINNER?.eating || 0}</span>
                  <span className="text-[10px] font-bold text-rose-600">({summary?.meals?.DINNER?.optOut || 0} opt-out)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Menu Management Section */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-orange-600" /> Daily Mess Menu Publishing
                </h3>
                <p className="text-slate-500 text-xs mt-0.5 font-medium">Update food items for Breakfast, Lunch, and Dinner for {selectedDate}.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Breakfast Menu */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-amber-700 font-extrabold text-xs uppercase tracking-wider">
                  <Coffee className="w-4 h-4 text-amber-600" /> Breakfast Menu
                </div>
                <textarea
                  rows={3}
                  value={menuData.breakfast}
                  onChange={(e) => setMenuData({ ...menuData, breakfast: e.target.value })}
                  placeholder="e.g. Puri / Idli with Sambhar, Tea / Coffee"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                <button
                  onClick={() => handleSaveMenu('BREAKFAST', menuData.breakfast)}
                  disabled={isSavingMenu === 'BREAKFAST'}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Breakfast Menu
                </button>
              </div>

              {/* Lunch Menu */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-orange-700 font-extrabold text-xs uppercase tracking-wider">
                  <Sun className="w-4 h-4 text-orange-600" /> Lunch Menu
                </div>
                <textarea
                  rows={3}
                  value={menuData.lunch}
                  onChange={(e) => setMenuData({ ...menuData, lunch: e.target.value })}
                  placeholder="e.g. Rice, Dal Tadka, Paneer Curry, Curd & Papad"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <button
                  onClick={() => handleSaveMenu('LUNCH', menuData.lunch)}
                  disabled={isSavingMenu === 'LUNCH'}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Lunch Menu
                </button>
              </div>

              {/* Dinner Menu */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-purple-700 font-extrabold text-xs uppercase tracking-wider">
                  <Moon className="w-4 h-4 text-purple-600" /> Dinner Menu
                </div>
                <textarea
                  rows={3}
                  value={menuData.dinner}
                  onChange={(e) => setMenuData({ ...menuData, dinner: e.target.value })}
                  placeholder="e.g. Roti, Mixed Veg Curry, Rice, Rasam & Sweet"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                <button
                  onClick={() => handleSaveMenu('DINNER', menuData.dinner)}
                  disabled={isSavingMenu === 'DINNER'}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Dinner Menu
                </button>
              </div>
            </div>
          </div>

          {/* Opt-Out Hostellers Audit Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" /> Opt-Out Hostellers Audit ({selectedDate})
              </h3>
            </div>

            {['BREAKFAST', 'LUNCH', 'DINNER'].map((mKey) => {
              const mealAudit = summary?.meals?.[mKey];
              const students = mealAudit?.optOutStudents || [];

              return (
                <div key={mKey} className="space-y-2 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase tracking-wider text-slate-900">
                      {mKey} Opt-Out List ({students.length} Hostellers Not Eating)
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Expected Dining: {mealAudit?.eating}
                    </span>
                  </div>

                  {students.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium italic">No opt-out requests. All hostellers expected to dine.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                      {students.map((s: any, idx: number) => (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                          <p className="font-extrabold text-slate-900">{s.name} <span className="text-slate-400 text-[10px]">({s.code || s.role})</span></p>
                          {s.phone && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-orange-600" /> {s.phone}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
