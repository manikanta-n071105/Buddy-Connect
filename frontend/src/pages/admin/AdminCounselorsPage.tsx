import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import { User, getBranchShortCode } from '../../types';
import { ShieldCheck, Heart, UserCheck, KeyRound, Building2, Phone, Mail, User as UserIcon, XCircle, Search } from 'lucide-react';
import { toast } from 'sonner';

export const AdminCounselorsPage: React.FC = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Toggle Counselor Password Modal
  const [targetMentor, settargetMentor] = useState<User | null>(null);
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMentors = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/users?role=MENTOR');
      setMentors(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load mentors list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const handleOpenToggleModal = (dir: User) => {
    settargetMentor(dir);
    setSuperAdminPassword('');
  };

  const handleConfirmToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMentor || !superAdminPassword.trim()) {
      toast.error('Super Administrator authorization password is required.');
      return;
    }

    const nextStatus = !targetMentor.is_counselor;

    try {
      setIsSubmitting(true);
      const res = await api.patch(`/counseling/${targetMentor.id}/counselor-status`, {
        isCounselor: nextStatus,
        superAdminPassword: superAdminPassword.trim()
      });

      toast.success(res.data.message || `Mentor ${targetMentor.name} counselor status updated.`);
      settargetMentor(null);
      setSuperAdminPassword('');
      fetchMentors();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update counselor status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMentors = mentors.filter((d) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.name.toLowerCase().includes(term) ||
      d.username.toLowerCase().includes(term) ||
      d.email.toLowerCase().includes(term) ||
      (d.department && d.department.toLowerCase().includes(term))
    );
  });

  const appointedCount = mentors.filter((d) => d.is_counselor).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="relative overflow-hidden bg-slate-900 p-5 rounded-2xl text-white shadow-md border border-slate-800">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-rose-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-black uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3 text-rose-400" /> Super Admin Management
          </div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            Mental Health Counseling Teachers Appointing Hub
          </h1>
          <p className="text-xs text-slate-300 font-medium max-w-2xl">
            Appoint active mentors as <strong className="text-rose-300">Mental Health Counseling Teachers</strong>. Super Administrator password verification is required to authorize counselor appointments.
          </p>
        </div>
      </div>

      {/* Summary Stats & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
            <Heart className="w-5 h-5 text-rose-600 fill-rose-400" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Appointed Counseling Teachers</h4>
            <p className="text-xs font-bold text-rose-600">{appointedCount} of {mentors.length} mentors Appointed</p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search mentors by name or department..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-hidden focus:border-rose-500"
          />
        </div>
      </div>

      {/* mentors Cards List */}
      {isLoading ? (
        <LoadingState message="Loading mentors list..." />
      ) : filteredMentors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-2xs">
          <Building2 className="w-8 h-8 text-rose-500 mx-auto" />
          <h4 className="text-xs font-black text-slate-900 uppercase">No mentors Found</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">Create Mentor Accounts first to appoint them as Mental Health Counseling Teachers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMentors.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
                      {d.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">{d.name}</h4>
                      <p className="text-[11px] text-slate-500 font-bold">@{d.username}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 text-[10px] font-black rounded-full border uppercase tracking-wider flex items-center gap-1 shrink-0 ${
                    d.is_counselor
                      ? 'bg-rose-100 text-rose-900 border-rose-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {d.is_counselor ? (
                      <>
                        <Heart className="w-3 h-3 text-rose-600 fill-rose-500" /> Counselor
                      </>
                    ) : (
                      'MENTOR'
                    )}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 font-semibold">
                  <p className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Branch: <strong className="text-slate-900">{getBranchShortCode(d.department)}</strong></span>
                  </p>
                  <p className="flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Gender: <strong className="text-slate-900">{d.gender || 'MALE'}</strong></span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{d.email}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleOpenToggleModal(d)}
                className={`w-full py-2.5 font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                  d.is_counselor
                    ? 'bg-slate-100 hover:bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${d.is_counselor ? 'text-rose-600 fill-rose-500' : 'text-white'}`} />
                {d.is_counselor ? 'Remove Counselor Appointment' : 'Appoint as Counseling Teacher'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* SUPER ADMIN AUTHORIZATION PASSWORD MODAL */}
      {targetMentor && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-rose-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Authorize Counselor Status</h3>
              </div>
              <button onClick={() => settargetMentor(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmToggle} className="space-y-3.5 text-xs font-semibold">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <p className="text-[10px] font-black text-rose-900 uppercase tracking-wider">Target Mentor:</p>
                <h4 className="font-extrabold text-xs text-rose-950">{targetMentor.name} ({getBranchShortCode(targetMentor.department)})</h4>
                <p className="text-[11px] text-rose-800 font-medium">
                  New Status: <strong className="text-rose-950">{!targetMentor.is_counselor ? 'Appointed Mental Health Counselor Teacher' : 'Regular Mentor Only'}</strong>
                </p>
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Super Administrator Authorization Password *</label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={superAdminPassword}
                  onChange={(e) => setSuperAdminPassword(e.target.value)}
                  placeholder="Enter Super Admin Password to confirm..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => settargetMentor(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isSubmitting ? 'Verifying...' : 'Confirm Authorization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
