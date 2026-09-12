import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import { UserProfileModal } from '../../components/common/UserProfileModal';
import { ScheduleMeetingModal } from '../../components/common/ScheduleMeetingModal';
import { FileDisciplinaryComplaintModal } from '../../components/common/FileDisciplinaryComplaintModal';
import {
  Users,
  BookOpen,
  MessageCircle,
  GraduationCap,
  UserCheck,
  AlertCircle,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Check,
  FileSpreadsheet,
  Sparkles,
  Gavel,
  Heart,
  ShieldCheck,
  ShieldAlert,
  Network,
  Award,
  FileText,
  Building2,
  Layers
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
  const [showInfractionModal, setShowInfractionModal] = useState(false);

  const fetchFacultyData = async () => {
    try {
      setIsLoading(true);
      // Fetch Faculty's assigned juniors, users info, & meetings
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

  // Special Role Detection
  const specialRole = (facultyInfo?.special_role || user?.special_role || '').trim();
  const isCounselor = Boolean(facultyInfo?.is_counselor || user?.is_counselor || specialRole.toUpperCase().includes('COUNSELOR'));
  const isDisciplinary = Boolean(facultyInfo?.is_disciplinary_committee || user?.is_disciplinary_committee || specialRole.toUpperCase().includes('DISCIPLINARY'));
  const hasSpecialRole = Boolean(specialRole || isCounselor || isDisciplinary);

  const isExecutiveRole = Boolean(
    specialRole &&
    ['DIRECTOR', 'VICE PRINCIPAL', 'PRINCIPAL', 'DEAN', 'HOD', 'CONTROLLER OF EXAMINATIONS', 'HR', 'ACCOUNTS DEPT'].some(r => specialRole.toUpperCase().includes(r))
  );

  if (isLoading) return <LoadingState message="Loading Faculty Dashboard & Special Role Hub..." />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Dynamic Top Banner */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl border ${
        hasSpecialRole
          ? 'bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-purple-500/30'
          : 'bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border-emerald-700/30'
      }`}>
        <div className={`absolute right-0 top-0 -mr-12 -mt-12 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          hasSpecialRole ? 'bg-purple-500/15' : 'bg-emerald-500/10'
        }`} />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              hasSpecialRole
                ? 'bg-purple-500/20 border border-purple-400/30 text-purple-300'
                : 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-300'
            }`}>
              {hasSpecialRole ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  {specialRole || (isDisciplinary ? 'DISCIPLINARY COMMITTEE' : 'MENTAL HEALTH COUNSELOR')}
                </>
              ) : (
                <>
                  <BookOpen className="w-3.5 h-3.5" />
                  Standard Faculty Academic Portal
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {specialRole ? specialRole.toLowerCase().includes('director') || specialRole.toLowerCase().includes('principal') ? specialRole : `Prof. ${user?.name}` : `Prof. ${user?.name}`}
            </h1>

            <p className="text-slate-200/90 text-sm max-w-xl">
              {hasSpecialRole ? (
                <>
                  Administrative Leadership Dashboard for <strong className="text-amber-300">{specialRole || 'Special Role Appointee'}</strong>. Manage campus operations, mentorship, and special duties.
                </>
              ) : (
                'View your assigned junior students, schedule mentorship review meetings, and conduct class quizzes from spreadsheets.'
              )}
            </p>

            <div className="pt-1 flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/quizzes')}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <FileSpreadsheet className="w-4 h-4" /> Conduct Class Quiz (Spreadsheet)
              </button>
              {hasSpecialRole && (
                <button
                  onClick={() => navigate('/admin/appointing-hub')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4" /> Special Roles Hub
                </button>
              )}
            </div>
          </div>

          {/* Mentorship Capacity Card */}
          <div className={`backdrop-blur-md rounded-2xl p-4 sm:p-5 border min-w-64 w-full md:w-auto shadow-lg ${
            hasSpecialRole ? 'bg-slate-950/70 border-purple-500/30' : 'bg-slate-950/60 border-emerald-500/30'
          }`}>
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-xs font-bold text-slate-200">Mentorship Capacity</span>
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
              />
            </div>
            <p className="text-[11px] text-slate-300">
              {isAtCapacity ? (
                <span className="text-amber-300 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 inline" /> Maximum capacity limit reached (Configurable in Profile)
                </span>
              ) : (
                `Mentorship capacity limit set: ${maxCapacity} student(s)`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* SPECIAL ROLE DASHBOARD PANELS */}

      {/* Panel 1: Executive Leadership Command Bar (Director, Vice Principal, HOD, Dean, etc.) */}
      {(isExecutiveRole || hasSpecialRole) && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  {specialRole || 'Executive Leadership'} Command Controls
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Quick administrative access for {specialRole || 'Special Role Holders'}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-purple-100 text-purple-900 border border-purple-300 uppercase tracking-wider">
              Special Duty Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
            <Link
              to="/users"
              className="p-3 bg-slate-50 hover:bg-purple-50 rounded-2xl border border-slate-200 hover:border-purple-300 transition-all text-center space-y-1 group cursor-pointer"
            >
              <Users className="w-5 h-5 text-purple-600 mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-xs font-extrabold text-slate-900">User Directory</p>
              <p className="text-[10px] text-slate-400">Manage Identity</p>
            </Link>

            <Link
              to="/hierarchy"
              className="p-3 bg-slate-50 hover:bg-purple-50 rounded-2xl border border-slate-200 hover:border-purple-300 transition-all text-center space-y-1 group cursor-pointer"
            >
              <Network className="w-5 h-5 text-indigo-600 mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-xs font-extrabold text-slate-900">Hierarchy Tree</p>
              <p className="text-[10px] text-slate-400">Department Structure</p>
            </Link>

            <Link
              to="/admin/appointing-hub"
              className="p-3 bg-slate-50 hover:bg-purple-50 rounded-2xl border border-slate-200 hover:border-purple-300 transition-all text-center space-y-1 group cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-amber-500 mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-xs font-extrabold text-slate-900">Special Roles Hub</p>
              <p className="text-[10px] text-slate-400">Appoint & Assign</p>
            </Link>

            <Link
              to="/admin/appointing-hub"
              className="p-3 bg-slate-50 hover:bg-purple-50 rounded-2xl border border-slate-200 hover:border-purple-300 transition-all text-center space-y-1 group cursor-pointer"
            >
              <Gavel className="w-5 h-5 text-purple-700 mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-xs font-extrabold text-slate-900">Disciplinary Log</p>
              <p className="text-[10px] text-slate-400">Conduct Records</p>
            </Link>

            <Link
              to="/meetings"
              className="p-3 bg-slate-50 hover:bg-purple-50 rounded-2xl border border-slate-200 hover:border-purple-300 transition-all text-center space-y-1 group cursor-pointer"
            >
              <Calendar className="w-5 h-5 text-teal-600 mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-xs font-extrabold text-slate-900">Meetings Calendar</p>
              <p className="text-[10px] text-slate-400">Schedule Review</p>
            </Link>

            <Link
              to="/admin/cr-feedbacks"
              className="p-3 bg-slate-50 hover:bg-purple-50 rounded-2xl border border-slate-200 hover:border-purple-300 transition-all text-center space-y-1 group cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 text-blue-600 mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-xs font-extrabold text-slate-900">CR Feedbacks</p>
              <p className="text-[10px] text-slate-400">Class Feedback</p>
            </Link>
          </div>
        </div>
      )}

      {/* Panel 2: Mental Health Counselor Dedicated Panel */}
      {isCounselor && (
        <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-pink-950 p-5 rounded-3xl text-white shadow-md border border-rose-700/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 text-rose-300 fill-rose-300/40" />
            </div>
            <div className="space-y-0.5">
              <span className="px-2 py-0.5 text-[9px] font-black rounded-md bg-rose-500/30 text-rose-200 uppercase tracking-wider">
                Appointed Mental Health Counselor
              </span>
              <h4 className="text-sm sm:text-base font-black text-white">Student Well-being & Counseling Portal</h4>
              <p className="text-xs text-rose-200/80">Manage confidential 1-on-1 student counseling appointments and well-being requests.</p>
            </div>
          </div>

          <Link
            to="/counseling"
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <Heart className="w-4 h-4 fill-white" /> Open Counseling Portal
          </Link>
        </div>
      )}

      {/* Panel 3: Disciplinary Committee Member Dedicated Panel */}
      {isDisciplinary && (
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-5 rounded-3xl text-white shadow-md border border-purple-700/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
              <Gavel className="w-6 h-6 text-purple-300" />
            </div>
            <div className="space-y-0.5">
              <span className="px-2 py-0.5 text-[9px] font-black rounded-md bg-purple-500/30 text-purple-200 uppercase tracking-wider">
                Disciplinary Committee Member
              </span>
              <h4 className="text-sm sm:text-base font-black text-white">Student Infractions & Conduct Enforcement</h4>
              <p className="text-xs text-purple-200/80">File student conduct complaints, review infractions log, and track repeat offenders.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowInfractionModal(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" /> Report Student Infraction
            </button>
            <Link
              to="/admin/appointing-hub"
              className="px-4 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Gavel className="w-4 h-4" /> Committee Log
            </Link>
          </div>
        </div>
      )}

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

      {/* Scheduled Meetings Section */}
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
              Student list assigned to your academic mentorship
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
                No junior students currently assigned to your mentorship.
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

      {/* Report Student Infraction Modal */}
      <FileDisciplinaryComplaintModal
        isOpen={showInfractionModal}
        onClose={() => setShowInfractionModal(false)}
        targetStudent={null}
        onComplaintSubmitted={fetchFacultyData}
      />
    </div>
  );
};
