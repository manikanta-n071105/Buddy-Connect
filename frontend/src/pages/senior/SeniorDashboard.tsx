import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { CredentialSuccessModal } from '../../components/common/CredentialSuccessModal';
import { ScheduleMeetingModal } from '../../components/common/ScheduleMeetingModal';
import {
  Users,
  CircleAlert,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  UserPlus,
  X,
  ClipboardCheck,
  FileQuestion,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const SeniorDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showJuniorModal, setShowJuniorModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);

  // Credential Modal State
  const [createdCredential, setCreatedCredential] = useState<{ role: string; name: string; username: string; pass: string } | null>(null);

  // Junior creation form
  const [junName, setJunName] = useState('');
  const [junEmail, setJunEmail] = useState('');
  const [junUsername, setJunUsername] = useState('');
  const [junPassword, setJunPassword] = useState('Password123!');
  const [junPhone, setJunPhone] = useState('');
  const [junReg, setJunReg] = useState('');
  const [junDept, setJunDept] = useState('Computer Science & Engineering');
  const [junBatch, setJunBatch] = useState('2025-2029');

  const fetchData = async () => {
    try {
      const [statsRes, indRes, meetRes] = await Promise.all([
        api.get('/reports/dashboard-stats'),
        api.get('/surveys/support-indicators'),
        api.get('/meetings')
      ]);
      setStats(statsRes.data.data);
      setIndicators(indRes.data.data);
      setMeetings(meetRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (meetingId: string, status: string) => {
    try {
      await api.patch(`/meetings/${meetingId}/status`, { status });
      toast.success(`Meeting status updated to ${status}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update meeting status');
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this meeting?')) return;
    try {
      await api.delete(`/meetings/${meetingId}`);
      toast.success('Meeting cancelled successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel meeting');
    }
  };

  const handleCreateJunior = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!junName || !junEmail || !junUsername || !junPassword) {
      toast.error('Please complete all required student details');
      return;
    }

    try {
      await api.post('/users/junior', {
        name: junName.trim(),
        email: junEmail.trim(),
        username: junUsername.trim(),
        password: junPassword.trim(),
        phone: junPhone.trim(),
        registerNumber: junReg.trim() || undefined,
        department: junDept,
        batch: junBatch,
        year: '1st Year'
      });

      setCreatedCredential({
        role: 'Junior Student',
        name: junName.trim(),
        username: junUsername.trim(),
        pass: junPassword.trim()
      });

      setShowJuniorModal(false);
      // Reset form
      setJunName('');
      setJunEmail('');
      setJunUsername('');
      setJunPassword('Password123!');
      setJunPhone('');
      setJunReg('');

      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create Junior Student');
    }
  };

  if (isLoading) return <LoadingState message="Loading Senior Mentor Workspace..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-extrabold uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" /> Mentorship Portal
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Senior Mentor Workspace</h1>
          <p className="text-xs text-slate-300">Manage assigned Juniors, schedule meetings, resolve issues, and monitor support indicators</p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-2.5">
          <button
            onClick={() => setShowMeetingModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-600/30 transition-all shrink-0 cursor-pointer active:scale-98"
          >
            <Calendar className="w-4 h-4" /> Schedule Meeting
          </button>
          <button
            onClick={() => setShowJuniorModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all shrink-0 cursor-pointer active:scale-98"
          >
            <UserPlus className="w-4 h-4" /> Create Junior Student
          </button>
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all shrink-0 active:scale-98"
          >
            <MessageCircle className="w-4 h-4" /> Mentor Chat
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all group">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase block">Assigned Juniors</span>
          <p className="text-3xl font-black text-slate-900 mt-2">{indicators.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all group">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase block flex items-center gap-1">
            Avg Onboarding
          </span>
          <p className="text-3xl font-black text-indigo-600 mt-2">{stats?.overallOnboardingRate || 0}%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all group">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase block flex items-center gap-1">
            Avg Questions
          </span>
          <p className="text-3xl font-black text-emerald-600 mt-2">{stats?.overallQuestionsRate || 0}%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all group">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase block">Open Issues</span>
          <p className="text-3xl font-black text-amber-600 mt-2">{stats?.openIssues || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all group">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase block">Voting Issues</span>
          <p className="text-3xl font-black text-purple-600 mt-2">{stats?.votingIssues || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all group">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase block">Satisfaction</span>
          <p className="text-3xl font-black text-teal-600 mt-2">{stats?.satisfactionRate || 100}%</p>
        </div>
      </div>

      {/* Assigned Juniors & Support Indicators */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4 overflow-hidden">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-orange-600" /> Assigned Juniors Support Indicators
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Student Name</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Onboarding</th>
                <th className="p-3.5">Open Issues</th>
                <th className="p-3.5">Support Indicator Status</th>
                <th className="p-3.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {indicators.map((ind) => (
                <tr key={ind.junior_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900">{ind.junior_name}</td>
                  <td className="p-3.5 text-slate-500">{ind.junior_email}</td>
                  <td className="p-3.5 font-bold text-indigo-600">{ind.onboardingProgress}%</td>
                  <td className="p-3.5 text-amber-600 font-extrabold">{ind.open_issues_count}</td>
                  <td className="p-3.5">
                    <StatusBadge status={ind.supportStatus} type="support" />
                  </td>
                  <td className="p-3.5">
                    <Link
                      to={`/chat?juniorId=${ind.junior_id}`}
                      className="text-xs font-extrabold text-orange-600 hover:text-orange-700 hover:underline inline-flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Message
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scheduled Mentorship Meetings Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Scheduled Mentorship Meetings ({meetings.length})</h3>
              <p className="text-[11px] text-slate-500">Meetings you scheduled for your assigned juniors</p>
            </div>
          </div>
          <button
            onClick={() => setShowMeetingModal(true)}
            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule New Meeting
          </button>
        </div>

        {meetings.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No Meetings Scheduled</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">Click "Schedule New Meeting" above to set a meeting time and place for your assigned juniors.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map((m) => {
              const mDate = new Date(m.meeting_date);
              return (
                <div key={m.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 text-[9px] font-black rounded-md uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200 mb-1">
                        Target: {m.target_junior_name ? m.target_junior_name : 'All Assigned Juniors'}
                      </span>
                      <h4 className="text-xs font-black text-slate-900">{m.title}</h4>
                    </div>
                    <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-full border uppercase ${
                      m.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                      m.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                      'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {m.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-semibold bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span>{mDate.toLocaleDateString()} @ {mDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span className="truncate">{m.location}</span>
                    </div>
                  </div>

                  {m.agenda && (
                    <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                      <strong>Agenda:</strong> {m.agenda}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                    {m.status === 'SCHEDULED' ? (
                      <button
                        onClick={() => handleUpdateStatus(m.id, 'COMPLETED')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Mark Completed
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{m.status}</span>
                    )}

                    <button
                      onClick={() => handleDeleteMeeting(m.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                      title="Cancel Meeting"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Junior Creation Modal */}
      {showJuniorModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Create Junior Student Account</h3>
              <button onClick={() => setShowJuniorModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateJunior} className="space-y-3.5 text-xs" autoComplete="off">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Full Name *</label>
                <input type="text" required value={junName} onChange={(e) => setJunName(e.target.value)} placeholder="Student Name" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email *</label>
                  <input type="email" required value={junEmail} onChange={(e) => setJunEmail(e.target.value)} placeholder="junior@juniorconnect.edu" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username *</label>
                  <input type="text" required value={junUsername} onChange={(e) => setJunUsername(e.target.value)} placeholder="junior_username" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Portal Password *</label>
                  <input type="password" autoComplete="new-password" required value={junPassword} onChange={(e) => setJunPassword(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile / Phone Number *</label>
                  <input type="text" required value={junPhone} onChange={(e) => setJunPhone(e.target.value)} placeholder="e.g. +91 9876543210" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all" />
                </div>
              </div>
              <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowJuniorModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-extrabold shadow-md shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer">Create Junior Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={showMeetingModal}
        onClose={() => setShowMeetingModal(false)}
        onMeetingCreated={fetchData}
      />

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
