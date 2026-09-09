import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import { CounselingAppointment, getBranchShortCode } from '../../types';
import { Heart, Calendar, Clock, MapPin, Video, Send, CheckCircle2, XCircle, AlertCircle, UserCheck, Shield, Sparkles, MessageSquare, Phone, Mail, Building2, User as UserIcon, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { fetchWithCache } from '../../utils/swr';

export const MentalHealthPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const isStudent = user?.role === 'JUNIOR' || user?.role === 'SENIOR';
  const isCounselorOrAdmin = Boolean(user?.is_counselor) || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'BOOK' | 'MY_APPOINTMENTS' | 'COUNSELOR_DASHBOARD'>(
    user?.is_counselor ? 'COUNSELOR_DASHBOARD' : 'BOOK'
  );

  if (!isStudent && !isCounselorOrAdmin) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-2xs max-w-lg mx-auto my-12">
        <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
          <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-900">Restricted Access</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            Mental Health Counseling features are reserved exclusively for Students and appointed Mental Health Counselors.
          </p>
        </div>
      </div>
    );
  }

  // State
  const [counselors, setCounselors] = useState<any[]>([]);
  const [myAppointments, setMyAppointments] = useState<CounselingAppointment[]>([]);
  const [counselorAppointments, setCounselorAppointments] = useState<CounselingAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State
  const [myApptsPage, setMyApptsPage] = useState(1);
  const [counselorApptsPage, setCounselorApptsPage] = useState(1);
  const pageSize = 5;

  const myApptsTotalPages = Math.ceil(myAppointments.length / pageSize) || 1;
  const safeMyApptsPage = Math.min(myApptsPage, myApptsTotalPages);
  const paginatedMyAppointments = myAppointments.slice((safeMyApptsPage - 1) * pageSize, safeMyApptsPage * pageSize);

  const counselorApptsTotalPages = Math.ceil(counselorAppointments.length / pageSize) || 1;
  const safeCounselorApptsPage = Math.min(counselorApptsPage, counselorApptsTotalPages);
  const paginatedCounselorAppointments = counselorAppointments.slice((safeCounselorApptsPage - 1) * pageSize, safeCounselorApptsPage * pageSize);

  // Booking Modal State
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState<any>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM');
  const [mode, setMode] = useState<'IN_PERSON' | 'ONLINE'>('IN_PERSON');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update Status Modal State
  const [selectedApptForUpdate, setSelectedApptForUpdate] = useState<CounselingAppointment | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'APPROVED' | 'COMPLETED' | 'CANCELLED'>('APPROVED');
  const [counselorNotes, setCounselorNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchCounselors = async (forceRefresh = false) => {
    await fetchWithCache<any[]>(
      'swr_counselors',
      '/counseling/counselors',
      (data) => setCounselors(data || []),
      { forceRefresh }
    );
  };

  const fetchMyAppointments = async (forceRefresh = false) => {
    await fetchWithCache<CounselingAppointment[]>(
      'swr_my_counseling_appts',
      '/counseling/my',
      (data) => setMyAppointments(data || []),
      { forceRefresh }
    );
  };

  const fetchCounselorAppointments = async (forceRefresh = false) => {
    await fetchWithCache<CounselingAppointment[]>(
      'swr_counselor_requests',
      '/counseling/counselor-requests',
      (data) => setCounselorAppointments(data || []),
      { forceRefresh }
    );
  };

  const loadData = async (forceRefresh = false) => {
    await Promise.all([
      fetchCounselors(forceRefresh),
      fetchMyAppointments(forceRefresh),
      isCounselorOrAdmin ? fetchCounselorAppointments(forceRefresh) : Promise.resolve()
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshUser();
    loadData();
  }, []);

  const handleOpenBookModal = (counselor: any) => {
    setSelectedCounselor(counselor);
    // Default to tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setAppointmentDate(tomorrow.toISOString().split('T')[0]);
    setAppointmentTime('10:00 AM');
    setMode('IN_PERSON');
    setReason('');
    setShowBookModal(true);
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCounselor || !appointmentDate || !appointmentTime) {
      toast.error('Please select date and time slot for your appointment.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/counseling/book', {
        counselorUserId: selectedCounselor.user_id,
        appointmentDate,
        appointmentTime,
        mode,
        reason: reason.trim()
      });

      toast.success('Counseling appointment booked successfully! Pending confirmation.');
      setShowBookModal(false);
      fetchMyAppointments(true);
      setActiveTab('MY_APPOINTMENTS');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApptForUpdate) return;

    try {
      setIsUpdating(true);
      await api.patch(`/counseling/${selectedApptForUpdate.id}/status`, {
        status: updateStatus,
        counselorNotes: counselorNotes.trim()
      });

      toast.success(`Appointment status updated to ${updateStatus}`);
      setSelectedApptForUpdate(null);
      fetchCounselorAppointments(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update appointment status');
    } finally {
      setIsUpdating(false);
    }
  };

  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Sleek Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 p-5 rounded-2xl text-white shadow-md border border-rose-900/50">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-rose-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-black uppercase tracking-wider">
            <Heart className="w-3 h-3 text-rose-400 fill-rose-400" /> Student Wellness & Support
          </div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            Mental Health & Counseling Portal
          </h1>
          <p className="text-xs text-rose-200/80 font-medium max-w-2xl">
            Book confidential 1-on-1 counseling appointments with appointed <strong className="text-rose-200">Mental Health Counselor Teachers</strong>. Safe, supportive, and strictly confidential.
          </p>
        </div>
      </div>

      {/* Tab Navigation Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('BOOK')}
          className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'BOOK'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" /> Book Appointment
        </button>

        <button
          onClick={() => setActiveTab('MY_APPOINTMENTS')}
          className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'MY_APPOINTMENTS'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" /> My Booked Sessions ({myAppointments.length})
        </button>

        {isCounselorOrAdmin && (
          <button
            onClick={() => setActiveTab('COUNSELOR_DASHBOARD')}
            className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'COUNSELOR_DASHBOARD'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4 text-rose-400" /> Counselor Requests Hub ({counselorAppointments.length})
          </button>
        )}
      </div>

      {/* TAB 1: BOOK APPOINTMENT */}
      {activeTab === 'BOOK' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-rose-600" /> Appointed Mental Health Counseling Teachers
            </h3>
            <span className="text-xs text-slate-500 font-semibold">({counselors.length} Available)</span>
          </div>

          {isLoading ? (
            <LoadingState message="Fetching appointed Mental Health Counselors..." />
          ) : counselors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-2xs">
              <Heart className="w-8 h-8 text-rose-500 mx-auto" />
              <h4 className="text-xs font-black text-slate-900 uppercase">No Counselors Appointed Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Super Administrator has not yet appointed any Mental Health Counseling Teachers. Please check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {counselors.map((c) => (
                <div key={c.user_id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-600 flex items-center justify-center font-black text-white text-sm shadow-md">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900">{c.name}</h4>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 mt-0.5">
                            <Heart className="w-3 h-3 text-rose-500 fill-rose-400" /> Counselor Teacher
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 font-semibold">
                      <p className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Department: <strong className="text-slate-900">{getBranchShortCode(c.department)}</strong></span>
                      </p>
                      <p className="flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Gender: <strong className="text-slate-900">{c.gender}</strong></span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenBookModal(c)}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-xs cursor-pointer mt-4"
                  >
                    <Calendar className="w-4 h-4" /> Book Counseling Appointment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY BOOKED SESSIONS */}
      {activeTab === 'MY_APPOINTMENTS' && (
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-600" /> Your Booked Appointments ({myAppointments.length})
          </h3>

          {isLoading ? (
            <LoadingState message="Loading your booked counseling appointments..." />
          ) : myAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-2xs">
              <Calendar className="w-8 h-8 text-rose-500 mx-auto" />
              <h4 className="text-xs font-black text-slate-900 uppercase">No Appointments Booked Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Switch to the "Book Appointment" tab to schedule your first mental health counseling session.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {paginatedMyAppointments.map((appt) => (
                  <div key={appt.id} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Counselor Teacher</span>
                        <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-rose-600 shrink-0" />
                          {appt.counselor_name} ({getBranchShortCode(appt.counselor_department)})
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-[10px] font-black rounded-full border uppercase tracking-wider ${
                          appt.mode === 'ONLINE' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {appt.mode === 'ONLINE' ? '🌐 Online Video' : '🏫 In-Person'}
                        </span>

                        <span className={`px-3 py-1 text-[10px] font-black rounded-full border uppercase tracking-wider ${
                          appt.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                          appt.status === 'COMPLETED' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                          appt.status === 'CANCELLED' ? 'bg-rose-100 text-rose-900 border-rose-300' :
                          'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {appt.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-rose-600" />
                        <span>Scheduled Date: <strong className="text-slate-900">{appt.appointment_date}</strong></span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-rose-600" />
                        <span>Time Slot: <strong className="text-slate-900">{appt.appointment_time}</strong></span>
                      </p>
                    </div>

                    {appt.reason && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Your Confidential Reason / Note:</p>
                        <p className="text-xs text-slate-800 font-medium">"{appt.reason}"</p>
                      </div>
                    )}

                    {appt.counselor_notes && (
                      <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200">
                        <p className="text-[10px] font-black uppercase text-rose-900 tracking-wider flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-rose-600" /> Counselor Notes / Meeting Details:
                        </p>
                        <p className="text-xs text-rose-950 font-bold mt-0.5">{appt.counselor_notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Clean Pagination Bar */}
              {myApptsTotalPages > 1 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-slate-700">
                  <span className="text-slate-500 font-bold">
                    Showing <span className="text-slate-900 font-black">{(safeMyApptsPage - 1) * pageSize + 1}</span> to <span className="text-slate-900 font-black">{Math.min(safeMyApptsPage * pageSize, myAppointments.length)}</span> of <span className="text-slate-900 font-black">{myAppointments.length}</span> appointments
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={safeMyApptsPage <= 1}
                      onClick={() => setMyApptsPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 disabled:opacity-40 disabled:hover:bg-slate-50 disabled:hover:text-slate-700 transition-all font-black text-xs cursor-pointer"
                    >
                      Previous
                    </button>

                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-900 font-black">
                      Page {safeMyApptsPage} of {myApptsTotalPages}
                    </span>

                    <button
                      disabled={safeMyApptsPage >= myApptsTotalPages}
                      onClick={() => setMyApptsPage((p) => Math.min(myApptsTotalPages, p + 1))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 disabled:opacity-40 disabled:hover:bg-slate-50 disabled:hover:text-slate-700 transition-all font-black text-xs cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COUNSELOR REQUESTS HUB (COUNSELOR mentors ONLY) */}
      {activeTab === 'COUNSELOR_DASHBOARD' && (
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-rose-600" /> Student Appointment Requests Assigned to You ({counselorAppointments.length})
          </h3>

          {isLoading ? (
            <LoadingState message="Loading student appointment requests..." />
          ) : counselorAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-2xs">
              <Calendar className="w-8 h-8 text-rose-500 mx-auto" />
              <h4 className="text-xs font-black text-slate-900 uppercase">No Incoming Student Appointments</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                There are currently no student appointments booked for your counseling schedule.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3.5">
                {paginatedCounselorAppointments.map((appt) => (
                  <div key={appt.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 text-[10px] font-black rounded-md bg-rose-100 text-rose-900 border border-rose-300 uppercase tracking-wider">
                            Student: {appt.student_name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {appt.student_role} ({getBranchShortCode(appt.student_department)})
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-semibold flex items-center gap-3 pt-1">
                          <span>Email: <strong className="text-slate-900">{appt.student_email}</strong></span>
                          <span>Phone: <strong className="text-slate-900">{appt.student_phone}</strong></span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-[10px] font-black rounded-full border uppercase tracking-wider ${
                          appt.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                          appt.status === 'COMPLETED' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                          appt.status === 'CANCELLED' ? 'bg-rose-100 text-rose-900 border-rose-300' :
                          'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {appt.status}
                        </span>

                        <button
                          onClick={() => {
                            setSelectedApptForUpdate(appt);
                            setUpdateStatus(appt.status === 'PENDING' ? 'APPROVED' : appt.status);
                            setCounselorNotes(appt.counselor_notes || '');
                          }}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                        >
                          Manage Status & Notes
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-rose-600" /> Date: <strong className="text-slate-900">{appt.appointment_date}</strong>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-rose-600" /> Time: <strong className="text-slate-900">{appt.appointment_time}</strong>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-rose-600" /> Mode: <strong className="text-slate-900">{appt.mode === 'ONLINE' ? 'Online Video' : 'In-Person'}</strong>
                      </p>
                    </div>

                    {appt.reason && (
                      <div className="text-xs text-slate-800 font-medium">
                        <span className="font-bold text-slate-500 uppercase text-[10px] block mb-0.5">Student Confidential Reason / Notes:</span>
                        "{appt.reason}"
                      </div>
                    )}

                    {appt.counselor_notes && (
                      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs">
                        <span className="font-black text-emerald-950 uppercase text-[10px] block mb-0.5">Your Counselor Response Notes:</span>
                        <p className="text-emerald-900 font-bold">{appt.counselor_notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Clean Pagination Bar */}
              {counselorApptsTotalPages > 1 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-slate-700">
                  <span className="text-slate-500 font-bold">
                    Showing <span className="text-slate-900 font-black">{(safeCounselorApptsPage - 1) * pageSize + 1}</span> to <span className="text-slate-900 font-black">{Math.min(safeCounselorApptsPage * pageSize, counselorAppointments.length)}</span> of <span className="text-slate-900 font-black">{counselorAppointments.length}</span> requests
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={safeCounselorApptsPage <= 1}
                      onClick={() => setCounselorApptsPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 disabled:opacity-40 disabled:hover:bg-slate-50 disabled:hover:text-slate-700 transition-all font-black text-xs cursor-pointer"
                    >
                      Previous
                    </button>

                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-900 font-black">
                      Page {safeCounselorApptsPage} of {counselorApptsTotalPages}
                    </span>

                    <button
                      disabled={safeCounselorApptsPage >= counselorApptsTotalPages}
                      onClick={() => setCounselorApptsPage((p) => Math.min(counselorApptsTotalPages, p + 1))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 disabled:opacity-40 disabled:hover:bg-slate-50 disabled:hover:text-slate-700 transition-all font-black text-xs cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* BOOK APPOINTMENT MODAL */}
      {showBookModal && selectedCounselor && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600 fill-rose-500" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Book Counseling Session</h3>
              </div>
              <button onClick={() => setShowBookModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-3 text-xs font-semibold">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <p className="text-[10px] font-black text-rose-900 uppercase tracking-wider">Selected Counselor Teacher:</p>
                <h4 className="font-extrabold text-xs text-rose-950">{selectedCounselor.name} ({getBranchShortCode(selectedCounselor.department)})</h4>
                <p className="text-[11px] text-rose-800 font-medium">{selectedCounselor.email}</p>
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Appointment Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Preferred Time Slot *</label>
                <select
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden focus:border-rose-500"
                >
                  {timeSlots.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Meeting Mode *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('IN_PERSON')}
                    className={`p-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      mode === 'IN_PERSON'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" /> In-Person Office
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('ONLINE')}
                    className={`p-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      mode === 'ONLINE'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" /> Online Video
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Confidential Note / Reason (Optional)</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Share anything you would like your counselor teacher to know beforehand..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE STATUS MODAL FOR COUNSELOR mentors */}
      {selectedApptForUpdate && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Update Counseling Appointment</h3>
              <button onClick={() => setSelectedApptForUpdate(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Appointment Status *</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden"
                >
                  <option value="APPROVED">APPROVED (Confirmed Appointment)</option>
                  <option value="COMPLETED">COMPLETED (Session Finished)</option>
                  <option value="CANCELLED">CANCELLED (Declined / Rescheduled)</option>
                </select>
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Counselor Response Notes / Meeting Location Link</label>
                <textarea
                  rows={3}
                  value={counselorNotes}
                  onChange={(e) => setCounselorNotes(e.target.value)}
                  placeholder="e.g. Office Room 204 or Google Meet link for online appointment..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApptForUpdate(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isUpdating ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
