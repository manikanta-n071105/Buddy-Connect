import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import { UserProfileModal } from '../../components/common/UserProfileModal';
import { ScheduleMeetingModal } from '../../components/common/ScheduleMeetingModal';
import {
  Users,
  BookOpen,
  MessageCircle,
  GraduationCap,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Link2,
  ExternalLink,
  Plus,
  Trash2,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assignedJuniors, setAssignedJuniors] = useState<any[]>([]);
  const [facultyInfo, setFacultyInfo] = useState<any>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);

  const fetchFacultyData = async () => {
    try {
      setIsLoading(true);
      // 1. Fetch Faculty's assigned juniors & meetings
      const [junRes, allUsersRes, meetRes] = await Promise.all([
        api.get('/users/faculty/juniors'),
        api.get('/users'),
        api.get('/meetings')
      ]);

      setAssignedJuniors(junRes.data.data || []);
      setMeetings(meetRes.data.data || []);

      const allUsers = allUsersRes.data.data || [];
      const me = allUsers.find((u: any) => u.id === user?.id || u.faculty_id === user?.facultyId);
      if (me) {
        setFacultyInfo(me);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load Faculty dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const handleUpdateStatus = async (meetingId: string, status: string) => {
    try {
      await api.patch(`/meetings/${meetingId}/status`, { status });
      toast.success(`Meeting status updated to ${status}`);
      fetchFacultyData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update meeting status');
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled meeting?')) return;
    try {
      await api.delete(`/meetings/${meetingId}`);
      toast.success('Meeting cancelled successfully');
      fetchFacultyData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel meeting');
    }
  };

  const maxCapacity = facultyInfo?.max_juniors || user?.max_juniors || 5;
  const currentCount = assignedJuniors.length;
  const isAtCapacity = currentCount >= maxCapacity;

  if (isLoading) return <LoadingState message="Loading Faculty Portal..." />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-emerald-700/30">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              Faculty Academic Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, Prof. {user?.name}
            </h1>
            <p className="text-emerald-100/80 text-sm max-w-xl">
              View your assigned junior students, schedule mentorship review meetings, and provide guidance outside the main senior-director tree.
            </p>
          </div>

          {/* Capacity Card */}
          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-emerald-500/30 min-w-64 w-full md:w-auto shadow-lg">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-xs font-bold text-emerald-200">Mentorship Capacity</span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                isAtCapacity ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/30 text-emerald-300'
              }`}>
                {currentCount} / {maxCapacity} Assigned
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-500 ${
                  isAtCapacity ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${Math.min(100, (currentCount / maxCapacity) * 100)}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-300">
              {isAtCapacity ? (
                <span className="text-amber-300 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 inline" /> Maximum capacity limit reached (Controlled by SuperAdmin)
                </span>
              ) : (
                `Mentorship capacity limit set by SuperAdmin: ${maxCapacity} student(s)`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/chat"
          className="flex items-center justify-between p-5 rounded-2xl bg-white hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Faculty Live Chat Center</p>
              <p className="text-xs text-slate-500">Communicate directly with your assigned junior students</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <button
          onClick={() => setShowMeetingModal(true)}
          className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md hover:shadow-lg transition-all group cursor-pointer text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-white">Schedule Mentorship Meeting</p>
              <p className="text-xs text-orange-100">Set meeting date, time, and location for assigned students</p>
            </div>
          </div>
          <Plus className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      {/* Scheduled Meetings Card Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              Scheduled Mentorship Meetings ({meetings.length})
            </h3>
            <p className="text-xs text-slate-500">
              Meetings you have scheduled for your assigned junior students
            </p>
          </div>
          <button
            onClick={() => setShowMeetingModal(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Schedule New Meeting
          </button>
        </div>

        {meetings.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No Meetings Scheduled Yet</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">Click "Schedule New Meeting" to set a time and venue for your students.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map((m) => {
              const mDate = new Date(m.meeting_date);
              return (
                <div key={m.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 text-[9px] font-black rounded-md uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200 mb-1">
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

      {/* Assigned Juniors Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              Assigned Junior Students ({assignedJuniors.length})
            </h3>
            <p className="text-xs text-slate-500">
              Student list assigned to your academic mentorship by SuperAdmin
            </p>
          </div>
        </div>

        {assignedJuniors.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-800">No Students Assigned Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                SuperAdmin has not assigned any junior students to your faculty mentorship.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Student Name & Register No.</th>
                  <th className="px-6 py-3.5">Department & Year</th>
                  <th className="px-6 py-3.5">Contact Info</th>
                  <th className="px-6 py-3.5">Senior Mentor</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {assignedJuniors.map((j) => (
                  <tr key={j.junior_id || j.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs shadow-xs">
                          {j.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-xs">{j.name}</p>
                          <p className="text-[10px] text-emerald-600 font-bold">Reg: {j.register_number || 'JRS'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{j.department || 'CSE'}</p>
                      <p className="text-[10px] text-slate-500">{j.batch || ''} • {j.year || ''}</p>
                    </td>
                    <td className="px-6 py-4 space-y-0.5">
                      <p className="text-slate-900 font-semibold">{j.email}</p>
                      {j.phone && <p className="text-[10px] text-slate-500">{j.phone}</p>}
                    </td>
                    <td className="px-6 py-4">
                      {j.senior_name ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 text-[11px] font-bold border border-blue-200/80">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>{j.senior_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedProfileId(j.user_id || j.id)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => navigate(`/chat?juniorId=${j.junior_id}`)}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="Chat with Junior"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={showMeetingModal}
        onClose={() => setShowMeetingModal(false)}
        onMeetingCreated={fetchFacultyData}
      />

      {/* User Profile View Modal */}
      <UserProfileModal
        userId={selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
      />
    </div>
  );
};
