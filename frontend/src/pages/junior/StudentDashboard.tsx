import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import {
  GraduationCap,
  Vote,
  Calendar,
  Megaphone,
  Heart,
  UtensilsCrossed,
  Lightbulb,
  BookOpen,
  Phone,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle2,
  Building2,
  Bell,
  FileSpreadsheet
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activePollsCount, setActivePollsCount] = useState<number>(0);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudentDashboardData = async () => {
      try {
        const [annRes, pollsRes, eventsRes] = await Promise.all([
          api.get('/info/announcements'),
          api.get('/polls'),
          api.get('/events')
        ]);
        setAnnouncements(annRes.data.data.slice(0, 4) || []);
        setActivePollsCount((pollsRes.data.data || []).length);
        setEvents((eventsRes.data.data || []).slice(0, 3));
      } catch (err) {
        console.error('Failed to load student dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudentDashboardData();
  }, []);

  if (isLoading) return <LoadingState message="Loading Student Dashboard..." />;

  const isHosteller = user?.residence_status === 'HOSTELLER';
  const displayYear = user?.year || 'Student';

  return (
    <div className="space-y-6 pb-12">
      {/* Sleek Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-full bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-black uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" /> {displayYear} Student Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-xs text-slate-300 font-medium max-w-xl">
              Stay connected with campus circulars, department polls, upcoming college events, and student resources.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 relative z-10 shrink-0">
            <Link
              to="/quizzes"
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 active:scale-98 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> Class Quizzes
            </Link>
            <Link
              to="/polls"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 active:scale-98 cursor-pointer"
            >
              <Vote className="w-4 h-4" /> Campus Polls ({activePollsCount})
            </Link>
            <Link
              to="/counseling"
              className="px-4 py-2.5 bg-rose-600/90 hover:bg-rose-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 active:scale-98 cursor-pointer"
            >
              <Heart className="w-4 h-4 text-rose-200 fill-rose-300" /> Mental Health
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <Link
          to="/polls"
          className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all text-center flex flex-col items-center gap-2 group"
        >
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
            <Vote className="w-5 h-5" />
          </div>
          <span className="text-xs font-extrabold text-slate-900">Campus Polls</span>
        </Link>

        <Link
          to="/events"
          className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all text-center flex flex-col items-center gap-2 group"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-xs font-extrabold text-slate-900">Events & Schedule</span>
        </Link>

        <Link
          to="/announcements"
          className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all text-center flex flex-col items-center gap-2 group"
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
            <Megaphone className="w-5 h-5" />
          </div>
          <span className="text-xs font-extrabold text-slate-900">Announcements</span>
        </Link>

        {isHosteller && (
          <Link
            to="/hostel-mess"
            className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all text-center flex flex-col items-center gap-2 group"
          >
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="text-xs font-extrabold text-slate-900">Hostel Mess RSVP</span>
          </Link>
        )}

        <Link
          to="/suggestions"
          className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all text-center flex flex-col items-center gap-2 group"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
            <Lightbulb className="w-5 h-5" />
          </div>
          <span className="text-xs font-extrabold text-slate-900">Suggestions</span>
        </Link>

        <Link
          to="/college-info"
          className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all text-center flex flex-col items-center gap-2 group"
        >
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-xs font-extrabold text-slate-900">College Guide</span>
        </Link>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Announcements & Events */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcements Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Official Announcements & Circulars</h3>
              </div>
              <Link to="/announcements" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {announcements.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium">No active circulars at this moment.</div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {ann.category || 'General Notice'}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900">{ann.title}</h4>
                    <p className="text-xs text-slate-600 font-medium line-clamp-2">{ann.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* College Events Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Upcoming Events & Workshops</h3>
              </div>
              <Link to="/events" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View Calendar <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {events.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium">No upcoming college events scheduled.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {events.map((ev) => (
                  <div key={ev.id} className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1 text-xs">
                    <span className="text-[10px] font-black uppercase text-blue-700 block">{ev.event_date || 'Upcoming'}</span>
                    <h4 className="font-black text-slate-900 line-clamp-1">{ev.title}</h4>
                    <p className="text-[11px] text-slate-500 font-medium line-clamp-2">{ev.description || 'College event'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Counseling & Emergency Contacts */}
        <div className="space-y-6">
          {/* Mental Health Counseling Promotion */}
          <div className="bg-gradient-to-br from-rose-900 via-rose-800 to-pink-900 text-white rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 blur-2xl rounded-full" />
            <div className="relative z-10 flex items-center gap-2">
              <div className="p-2 bg-white/10 rounded-xl">
                <Heart className="w-5 h-5 text-rose-300 fill-rose-300" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-rose-100">Mental Health & Wellness</h3>
            </div>
            <p className="text-xs text-rose-100 font-medium leading-relaxed relative z-10">
              Need to talk? Book confidential, 1-on-1 counseling appointments with licensed campus mental health counselors.
            </p>
            <Link
              to="/counseling"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 bg-white text-rose-950 font-black text-xs rounded-xl shadow-md hover:bg-rose-50 transition-all cursor-pointer relative z-10"
            >
              Book Appointment
            </Link>
          </div>

          {/* Quick Help & Campus Contacts */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Phone className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Campus Helpline & Safety</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">Quick access to medical emergency, security, and department helplines.</p>
            <Link
              to="/emergency"
              className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" /> Emergency Directory
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
