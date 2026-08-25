import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import {
  PlusCircle,
  ClipboardList,
  ClipboardCheck,
  FileQuestion,
  MessageCircle,
  Megaphone,
  Phone,
  BookOpen,
  UserCheck,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Link2,
  ExternalLink,
  GraduationCap
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const JuniorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [onboarding, setOnboarding] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [openIssues, setOpenIssues] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [onbRes, annRes, issRes, meetRes] = await Promise.all([
          api.get('/onboarding/progress'),
          api.get('/info/announcements'),
          api.get('/issues?status=OPEN'),
          api.get('/meetings')
        ]);
        setOnboarding(onbRes.data.data);
        setAnnouncements(annRes.data.data.slice(0, 3));
        setOpenIssues(issRes.data.data);
        setMeetings(meetRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <LoadingState message="Loading Student Portal..." />;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-extrabold uppercase tracking-widest">
            <UserCheck className="w-3 h-3" /> Junior Portal
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Welcome back, {user?.name}</h1>
          <p className="text-xs text-slate-300">Your senior and faculty mentors are available for guidance. Check scheduled mentorship meetings below.</p>
        </div>
        <Link
          to="/issues/new"
          className="relative z-10 inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-600/30 transition-all shrink-0 cursor-pointer active:scale-98"
        >
          <PlusCircle className="w-4 h-4" /> Raise New Issue
        </Link>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <Link
          to="/issues/new"
          className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all text-center flex flex-col items-center gap-2.5 group"
        >
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-110 transition-transform"><PlusCircle className="w-5 h-5" /></div>
          <span className="text-xs font-black text-slate-900">Raise Issue</span>
        </Link>

        <Link
          to="/issues"
          className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all text-center flex flex-col items-center gap-2.5 group"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><ClipboardList className="w-5 h-5" /></div>
          <span className="text-xs font-black text-slate-900">My Issues ({openIssues.length})</span>
        </Link>

        <Link
          to="/onboarding"
          className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all text-center flex flex-col items-center gap-2.5 group"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><ClipboardCheck className="w-5 h-5" /></div>
          <span className="text-xs font-black text-slate-900">Onboarding ({onboarding?.progressPercent}%)</span>
        </Link>

        <Link
          to="/questions"
          className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all text-center flex flex-col items-center gap-2.5 group"
        >
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform"><FileQuestion className="w-5 h-5" /></div>
          <span className="text-xs font-black text-slate-900">Common Questions</span>
        </Link>

        <Link
          to="/chat"
          className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all text-center flex flex-col items-center gap-2.5 group"
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform"><MessageCircle className="w-5 h-5" /></div>
          <span className="text-xs font-black text-slate-900">Contact Mentor</span>
        </Link>
      </div>

      {/* SCHEDULED MENTORSHIP MEETINGS CARD SECTION FOR JUNIORS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Scheduled Mentorship Meetings ({meetings.length})</h3>
              <p className="text-[11px] text-slate-500 font-medium">Meetings assigned to you by your Senior Mentor, Faculty Mentor, or Director</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-black rounded-full border border-orange-200">
            {meetings.filter(m => m.status === 'SCHEDULED').length} Upcoming
          </span>
        </div>

        {meetings.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No Mentorship Meetings Scheduled</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">When your Senior Mentor, Faculty Mentor, or Director schedules a meeting, the time and location will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {meetings.map((m) => {
              const mDate = new Date(m.meeting_date);
              const isPast = mDate < new Date();
              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 relative overflow-hidden ${
                    m.status === 'COMPLETED'
                      ? 'bg-slate-50 border-slate-200 opacity-75'
                      : m.status === 'CANCELLED'
                      ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                      : 'bg-gradient-to-br from-white to-amber-50/30 border-amber-200/90 shadow-xs hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`inline-block px-2 py-0.5 text-[9px] font-black rounded-md uppercase tracking-wider mb-1 ${
                        m.mentor_role === 'FACULTY' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                        m.mentor_role === 'DIRECTOR' ? 'bg-slate-900 text-white' :
                        'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {m.mentor_role} MEETING • {m.mentor_name}
                      </span>
                      <h4 className="text-xs font-black text-slate-900 leading-snug">{m.title}</h4>
                    </div>
                    <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-full border uppercase shrink-0 ${
                      m.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                      m.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                      'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {m.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-semibold bg-white/80 p-2.5 rounded-xl border border-slate-100">
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
                    <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <strong>Agenda:</strong> {m.agenda}
                    </p>
                  )}

                  {m.meeting_link && (
                    <a
                      href={m.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition-all"
                    >
                      <Link2 className="w-3.5 h-3.5" /> Join Online Meeting <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Onboarding Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ClipboardCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Onboarding Progress Checklist</h3>
          </div>
          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full shadow-2xs">
            {onboarding?.completedCount} / {onboarding?.totalCount} Completed ({onboarding?.progressPercent}%)
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${onboarding?.progressPercent || 0}%` }}
          />
        </div>
      </div>

      {/* Announcements Feed */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Megaphone className="w-5 h-5 text-orange-600" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Campus Announcements</h3>
          </div>
          <Link to="/announcements" className="text-xs font-extrabold text-orange-600 hover:text-orange-700 hover:underline">View All →</Link>
        </div>

        <div className="space-y-3">
          {announcements.map((ann) => (
            <div key={ann.id} className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl hover:border-orange-500/30 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-slate-900">{ann.title}</h4>
                <span className="text-[10px] font-semibold text-slate-400">
                  {new Date(ann.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{ann.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
