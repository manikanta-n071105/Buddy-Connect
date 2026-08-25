import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import { Settings, Save, ShieldCheck, Users, BookOpen, Clock, Vote } from 'lucide-react';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, val: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value: val } : s));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put('/settings', { settings });
      toast.success('System settings saved successfully');
      fetchSettings();
    } catch (err) {
      toast.error('Failed to save system settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading System Settings Configuration..." />;

  const getSettingIcon = (key: string) => {
    if (key.includes('FACULTY')) return <BookOpen className="w-4 h-4 text-teal-600 shrink-0" />;
    if (key.includes('SENIOR') || key.includes('JUNIOR') || key.includes('DIRECTOR')) return <Users className="w-4 h-4 text-indigo-600 shrink-0" />;
    if (key.includes('ESCALATION') || key.includes('HOURS')) return <Clock className="w-4 h-4 text-amber-600 shrink-0" />;
    return <Vote className="w-4 h-4 text-emerald-600 shrink-0" />;
  };

  const formatKeyName = (key: string) => {
    switch (key) {
      case 'MAX_JUNIORS_PER_FACULTY':
        return 'Max Juniors Assigned per Faculty Member';
      case 'MAX_JUNIORS_PER_SENIOR':
        return 'Max Juniors Assigned per Senior Mentor';
      case 'MAX_SENIORS_PER_DIRECTOR':
        return 'Max Seniors Managed per Department Director';
      default:
        return key.replace(/_/g, ' ');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Super Admin Settings
          </div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            System Capacity & Mentorship Rules
          </h1>
          <p className="text-xs text-slate-300">
            Control global junior-faculty assignment limits, senior quotas, and resolution escalation thresholds.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="space-y-4 divide-y divide-slate-100">
          {settings.map((s) => {
            const isFacultyLimit = s.key === 'MAX_JUNIORS_PER_FACULTY';
            return (
              <div
                key={s.key}
                className={`pt-4 first:pt-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-3 rounded-xl transition-all ${
                  isFacultyLimit ? 'bg-teal-50/70 border border-teal-200/80 shadow-2xs' : ''
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {getSettingIcon(s.key)}
                    <span className="text-xs font-black text-slate-900 tracking-tight block">
                      {formatKeyName(s.key)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block leading-tight">{s.description}</span>
                  <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">{s.key}</span>
                </div>
                <div className="md:col-span-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={s.value}
                    onChange={(e) => handleChange(s.key, e.target.value)}
                    className={`w-full p-2.5 bg-white border rounded-xl text-xs font-extrabold outline-hidden focus:ring-2 ${
                      isFacultyLimit
                        ? 'border-teal-300 text-teal-900 focus:ring-teal-500/20'
                        : 'border-slate-200 text-indigo-900 focus:ring-indigo-500/20'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" /> {isSubmitting ? 'Saving Settings...' : 'Save Configuration Settings'}
        </button>
      </form>
    </div>
  );
};
