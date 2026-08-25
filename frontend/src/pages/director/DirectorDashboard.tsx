import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import { CredentialSuccessModal } from '../../components/common/CredentialSuccessModal';
import { Users, CircleAlert, CheckCircle2, Flame, ShieldCheck, UserPlus, Building2, X, ClipboardCheck, FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const DirectorDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSeniorModal, setShowSeniorModal] = useState(false);

  // Credential Modal State
  const [createdCredential, setCreatedCredential] = useState<{ role: string; name: string; username: string; pass: string } | null>(null);

  // Senior creation form
  const [senName, setSenName] = useState('');
  const [senEmail, setSenEmail] = useState('');
  const [senUsername, setSenUsername] = useState('');
  const [senPassword, setSenPassword] = useState('Password123!');
  const [senPhone, setSenPhone] = useState('');
  const [senCode, setSenCode] = useState('');
  const [senDept, setSenDept] = useState('Computer Science & Engineering');

  const fetchData = async () => {
    try {
      const statsRes = await api.get('/reports/dashboard-stats');
      setStats(statsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSenior = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senName || !senEmail || !senUsername || !senPassword) {
      toast.error('Please complete all required mentor details');
      return;
    }

    try {
      await api.post('/users/senior', {
        name: senName.trim(),
        email: senEmail.trim(),
        username: senUsername.trim(),
        password: senPassword.trim(),
        phone: senPhone.trim(),
        seniorCode: senCode.trim() || undefined,
        department: senDept
      });

      setCreatedCredential({
        role: 'Senior Mentor',
        name: senName.trim(),
        username: senUsername.trim(),
        pass: senPassword.trim()
      });

      setShowSeniorModal(false);
      // Reset form
      setSenName('');
      setSenEmail('');
      setSenUsername('');
      setSenPassword('Password123!');
      setSenPhone('');
      setSenCode('');

      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create Senior Mentor');
    }
  };

  if (isLoading || !stats) return <LoadingState message="Loading Director Workspace..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-extrabold uppercase tracking-widest">
            <Building2 className="w-3 h-3" /> Department Leadership
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Director Management Dashboard</h1>
          <p className="text-xs text-slate-300">Oversee Senior Mentors, department metrics, and resolution scorecards</p>
        </div>
        <button
          onClick={() => setShowSeniorModal(true)}
          className="relative z-10 inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-600/30 transition-all shrink-0 cursor-pointer active:scale-98"
        >
          <UserPlus className="w-4 h-4" /> Create Senior Mentor
        </button>
      </div>

      {/* Aggregated Summary Cards for Director */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase">Assigned Seniors</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{stats.seniorPerformance.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase">Open Issues</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CircleAlert className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600 mt-2">{stats.openIssues}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase flex items-center gap-1">
              Onboarding %
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-indigo-600 mt-2">{stats.overallOnboardingRate}%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase flex items-center gap-1">
              Questions %
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileQuestion className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-2">{stats.overallQuestionsRate}%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase">Satisfaction</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-purple-600 mt-2">{stats.satisfactionRate}%</p>
        </div>
      </div>

      {/* Senior Mentors Scorecard Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4 overflow-hidden">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-orange-600" /> Senior Mentors Performance & Assigned Juniors
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Senior Name</th>
                <th className="p-3.5">Senior Code</th>
                <th className="p-3.5">Assigned Mentees</th>
                <th className="p-3.5">Avg Onboarding</th>
                <th className="p-3.5">Avg Questions</th>
                <th className="p-3.5">Open Issues</th>
                <th className="p-3.5">Resolved Issues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {stats.seniorPerformance.map((sen: any) => (
                <tr key={sen.senior_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900">{sen.senior_name}</td>
                  <td className="p-3.5 text-slate-500 font-mono text-[11px]">{sen.senior_code}</td>
                  <td className="p-3.5 font-bold text-indigo-600">{sen.junior_count} Juniors</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-extrabold rounded-full shadow-2xs">
                      {sen.avg_junior_onboarding_pct}%
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-extrabold rounded-full shadow-2xs">
                      {sen.avg_junior_questions_pct}%
                    </span>
                  </td>
                  <td className="p-3.5 text-amber-600 font-bold">{sen.open_issues}</td>
                  <td className="p-3.5 text-emerald-600 font-bold">{sen.resolved_issues}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Senior Creation Modal */}
      {showSeniorModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Create Senior Mentor Account</h3>
              <button onClick={() => setShowSeniorModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateSenior} className="space-y-3.5 text-xs" autoComplete="off">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Senior Full Name *</label>
                <input type="text" required value={senName} onChange={(e) => setSenName(e.target.value)} placeholder="e.g. Alex Harrison" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email *</label>
                  <input type="email" required value={senEmail} onChange={(e) => setSenEmail(e.target.value)} placeholder="senior@juniorconnect.edu" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username *</label>
                  <input type="text" required value={senUsername} onChange={(e) => setSenUsername(e.target.value)} placeholder="senior_username" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Portal Password *</label>
                  <input type="password" autoComplete="new-password" required value={senPassword} onChange={(e) => setSenPassword(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile / Phone Number *</label>
                  <input type="text" required value={senPhone} onChange={(e) => setSenPhone(e.target.value)} placeholder="e.g. +91 9876543210" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department *</label>
                <input type="text" required value={senDept} onChange={(e) => setSenDept(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all" />
              </div>
              <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowSeniorModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-extrabold shadow-md shadow-orange-600/30 hover:from-orange-500 hover:to-amber-500 transition-all cursor-pointer">Create Senior Mentor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credential Success Modal */}
      <CredentialSuccessModal
        isOpen={!!createdCredential}
        onClose={() => setCreatedCredential(null)}
        roleName={createdCredential?.role || ''}
        fullName={createdCredential?.name || ''}
        username={createdCredential?.username || ''}
        passwordVal={createdCredential?.pass || ''}
      />
    </div>
  );
};
