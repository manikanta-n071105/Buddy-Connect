import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import {
  UtensilsCrossed,
  Coffee,
  Sun,
  Moon,
  CheckCircle2,
  XCircle,
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export const HostelMessPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [menu, setMenu] = useState<{ breakfast: string; lunch: string; dinner: string } | null>(null);
  const [rsvps, setRsvps] = useState<Record<string, boolean>>({
    BREAKFAST: true,
    LUNCH: true,
    DINNER: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [updatingMeal, setUpdatingMeal] = useState<string | null>(null);

  if (user?.residence_status === 'DAY_SCHOLAR' && !['WARDEN', 'SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-2xs max-w-lg mx-auto my-12">
        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-900">Hosteller Exclusive Page</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            You are currently registered as a <strong className="text-slate-800">Day Scholar</strong>. Hostel Mess Opt-In & Meal RSVP features are reserved exclusively for Hosteller students.
          </p>
        </div>
      </div>
    );
  }

  const fetchMessData = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const [menuRes, rsvpRes] = await Promise.all([
        api.get(`/mess/menu?date=${dateStr}`),
        api.get(`/mess/rsvp?date=${dateStr}`)
      ]);
      setMenu(menuRes.data.data);
      setRsvps(rsvpRes.data.data.rsvps || { BREAKFAST: true, LUNCH: true, DINNER: true });
    } catch (err: any) {
      toast.error('Failed to load hostel mess schedule');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessData(selectedDate);
  }, [selectedDate]);

  const handleToggleRsvp = async (mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER', willEat: boolean) => {
    setUpdatingMeal(mealType);
    try {
      await api.post('/mess/rsvp', {
        date: selectedDate,
        mealType,
        willEat
      });
      setRsvps((prev) => ({ ...prev, [mealType]: willEat }));
      toast.success(`Updated ${mealType.toLowerCase()}: ${willEat ? 'Yes, I will eat' : 'No, I won\'t eat'}`);
    } catch (err: any) {
      toast.error('Failed to update meal preference');
    } finally {
      setUpdatingMeal(null);
    }
  };

  const mealsList = [
    {
      key: 'BREAKFAST' as const,
      title: 'Breakfast',
      time: '07:30 AM - 09:00 AM',
      icon: Coffee,
      color: 'from-amber-500 to-orange-500',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      items: menu?.breakfast || 'Puri / Idli with Chutney & Sambhar, Tea / Coffee'
    },
    {
      key: 'LUNCH' as const,
      title: 'Lunch',
      time: '12:30 PM - 02:00 PM',
      icon: Sun,
      color: 'from-orange-500 to-amber-600',
      badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
      items: menu?.lunch || 'Steamed Rice, Dal Tadka, Paneer / Veg Curry, Curd & Papad'
    },
    {
      key: 'DINNER' as const,
      title: 'Dinner',
      time: '07:30 PM - 09:00 PM',
      icon: Moon,
      color: 'from-indigo-600 to-purple-600',
      badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      items: menu?.dinner || 'Roti, Mixed Veg Curry, Rice, Rasam & Sweet'
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-white rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <UtensilsCrossed className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-black uppercase tracking-wider mb-3 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Hostel Daily Mess Tracker
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Hostel Meal Opt-In & RSVP</h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl font-medium">
              Mark whether you will be dining for Breakfast, Lunch, and Dinner. By default, your meal RSVP is set to <strong>"Yes, I will eat"</strong>.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-black text-white text-xs outline-hidden cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Fetching today's mess menu & meal preferences..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mealsList.map((meal) => {
            const Icon = meal.icon;
            const willEat = rsvps[meal.key] !== false; // Default true
            const isSaving = updatingMeal === meal.key;

            return (
              <div
                key={meal.key}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-md hover:shadow-xl transition-all p-6 space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Meal Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${meal.color} text-white flex items-center justify-center shadow-md`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-base text-slate-900">{meal.title}</h3>
                        <span className="text-[11px] font-bold text-slate-400">{meal.time}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border uppercase tracking-wider ${meal.badgeBg}`}>
                      {meal.title}
                    </span>
                  </div>

                  {/* Menu Items Box */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-orange-600" /> Today's Menu
                    </span>
                    <p className="text-xs font-bold text-slate-800 leading-relaxed">
                      {meal.items}
                    </p>
                  </div>
                </div>

                {/* RSVP Status Selection */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Your Preference (Default: Eating)
                  </span>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleToggleRsvp(meal.key, true)}
                      className={`py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        willEat
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30 scale-[1.02]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Yes, I'll Eat</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleToggleRsvp(meal.key, false)}
                      className={`py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        !willEat
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30 scale-[1.02]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>No, Won't Eat</span>
                    </button>
                  </div>

                  <div className="text-center">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold ${willEat ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {willEat ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Registered for {meal.title}
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" /> Opted out of {meal.title}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
