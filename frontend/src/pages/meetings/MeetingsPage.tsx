import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import { ScheduleMeetingModal } from '../../components/common/ScheduleMeetingModal';
import {
  Calendar,
  Clock,
  MapPin,
  Link2,
  ExternalLink,
  Plus,
  Trash2,
  Check,
  UserCheck,
  GraduationCap,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMeetingModal, setShowMeetingModal] = useState(false);

  const isMentor = ['SENIOR', 'FACULTY', 'DIRECTOR', 'SUPER_ADMIN', 'ADMIN'].includes(user?.role || '');

  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/meetings');
      setMeetings(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load mentorship meetings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleUpdateStatus = async (meetingId: string, status: string) => {
    try {
      await api.patch(`/meetings/${meetingId}/status`, { status });
      toast.success(`Meeting status updated to ${status}`);
      fetchMeetings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update meeting status');
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled meeting?')) return;
    try {
      await api.delete(`/meetings/${meetingId}`);
      toast.success('Meeting cancelled successfully');
      fetchMeetings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel meeting');
    }
  };

  if (isLoading) return <LoadingState message="Loading Mentorship Meetings..." />;

  const upcomingMeetings = meetings.filter(m => m.status === 'SCHEDULED');
  const pastMeetings = meetings.filter(m => m.status !== 'SCHEDULED');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-extrabold uppercase tracking-widest">
            <Calendar className="w-3 h-3" /> Mentorship Schedule
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Mentorship Meetings</h1>
          <p className="text-xs text-slate-300">
            {isMentor
              ? 'Schedule, manage, and track review meetings for your assigned junior students.'
              : 'View upcoming mentorship review sessions, venues, online links, and agendas scheduled by your mentors.'}
          </p>
        </div>

        {isMentor && (
          <button
            onClick={() => setShowMeetingModal(true)}
            className="relative z-10 inline-flex items-center gap-2 px-4.5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-600/30 transition-all shrink-0 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" /> Schedule New Meeting
          </button>
        )}
      </div>

      {/* Upcoming Meetings List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" /> Upcoming Meetings ({upcomingMeetings.length})
          </h3>
          {isMentor && (
            <button
              onClick={() => setShowMeetingModal(true)}
              className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
            >
              + Schedule Meeting
            </button>
          )}
        </div>

        {upcomingMeetings.length === 0 ? (
          <div className="p-10 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No Upcoming Meetings</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              {isMentor
                ? 'Click "Schedule New Meeting" to set a meeting time and place for your students.'
                : 'Your mentors have not scheduled any upcoming meetings yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingMeetings.map((m) => {
              const mDate = new Date(m.meeting_date);
              return (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-white to-amber-50/20 shadow-2xs hover:shadow-md transition-all space-y-3"
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
                      <h4 className="text-sm font-black text-slate-900">{m.title}</h4>
                    </div>
                    <span className="px-2.5 py-0.5 text-[9px] font-black rounded-full bg-amber-100 text-amber-900 border border-amber-300 uppercase shrink-0">
                      SCHEDULED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-semibold bg-white p-3 rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span>{mDate.toLocaleDateString()} @ {mDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span className="truncate">{m.location}</span>
                    </div>
                  </div>

                  {m.target_junior_name && (
                    <p className="text-[11px] font-bold text-slate-700">
                      Target Student: <span className="text-orange-600">{m.target_junior_name}</span>
                    </p>
                  )}

                  {m.agenda && (
                    <p className="text-[11px] text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-100">
                      <strong>Agenda:</strong> {m.agenda}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    {m.meeting_link ? (
                      <a
                        href={m.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition-all"
                      >
                        <Link2 className="w-3.5 h-3.5" /> Join Online Meeting <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : <div />}

                    {isMentor && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateStatus(m.id, 'COMPLETED')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> Mark Completed
                        </button>
                        <button
                          onClick={() => handleDeleteMeeting(m.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                          title="Cancel Meeting"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past / Completed Meetings */}
      {pastMeetings.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Past / Completed Meetings ({pastMeetings.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastMeetings.map((m) => {
              const mDate = new Date(m.meeting_date);
              return (
                <div key={m.id} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2 opacity-80">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 text-[9px] font-black rounded-md uppercase tracking-wider bg-slate-200 text-slate-700 mb-1">
                        {m.mentor_role} MEETING • {m.mentor_name}
                      </span>
                      <h4 className="text-xs font-black text-slate-900">{m.title}</h4>
                    </div>
                    <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-full border uppercase ${
                      m.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {mDate.toLocaleDateString()} @ {mDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Venue: {m.location}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={showMeetingModal}
        onClose={() => setShowMeetingModal(false)}
        onMeetingCreated={fetchMeetings}
      />
    </div>
  );
};
