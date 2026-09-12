import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import {
  GraduationCap,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Printer,
  RefreshCw,
  Building2,
  Users,
  Layers,
  Sparkles,
  ShieldCheck,
  Calendar,
  FileSpreadsheet,
  Trash2,
  Eye,
  CheckSquare,
  AlertCircle,
  ChevronRight,
  UserCheck,
  UserX,
  FileWarning,
  Sliders,
  Grid
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// JNTUA ALPHANUMERIC GENERATOR FOR FRONTEND LIVE PREVIEW
// ============================================================================
const JNTU_CHARS = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','J','K','L','M','N','P','R','S','T','U','V','W','X','Y','Z'];

function parseRollNumber(roll: string) {
  if (!roll) return { prefix: '', value: 0 };
  roll = roll.trim().toUpperCase();
  if (roll.length < 2) return { prefix: roll, value: 0 };
  const suffix = roll.substring(roll.length - 2);
  const prefix = roll.substring(0, roll.length - 2);
  const t = suffix[0];
  const u = suffix[1];
  const units = parseInt(u);
  if (isNaN(units)) {
    const val = parseInt(suffix, 36);
    return { prefix, value: isNaN(val) ? 0 : val };
  }
  let tens = JNTU_CHARS.indexOf(t);
  if (tens === -1) tens = t.charCodeAt(0) - 55;
  return { prefix, value: tens * 10 + units };
}

function numToJntuSuffix(value: number) {
  const units = value % 10;
  const tensIdx = Math.floor(value / 10);
  const t = JNTU_CHARS[tensIdx] || 'Z';
  return `${t}${units}`;
}

function generateStudentRange(startReg: string, endReg: string): string[] {
  if (!startReg || !endReg) return [];
  const startObj = parseRollNumber(startReg);
  const endObj = parseRollNumber(endReg);
  if (startObj.prefix !== endObj.prefix) {
    return [startReg.trim().toUpperCase(), endReg.trim().toUpperCase()];
  }
  const list: string[] = [];
  for (let v = startObj.value; v <= endObj.value; v++) {
    list.push(`${startObj.prefix}${numToJntuSuffix(v)}`);
  }
  return list;
}

export const ExamSeatingPage: React.FC = () => {
  const { user } = useAuth();
  const specialRole = (user?.special_role || user?.specialRole || '').toUpperCase();
  const userRole = (user?.role || '').toUpperCase();

  const isController =
    userRole === 'SUPER_ADMIN' ||
    userRole === 'ADMIN' ||
    specialRole.includes('CONTROLLER') ||
    specialRole.includes('EXAM');

  const isFaculty = userRole === 'FACULTY' || userRole === 'MENTOR' || isController;

  const [activeTab, setActiveTab] = useState<'EXAMS_LIST' | 'STUDENT_LOOKUP' | 'INVIGILATION_DUTIES' | 'MALPRACTICE_LOGS'>('EXAMS_LIST');
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExamDetails, setSelectedExamDetails] = useState<any | null>(null);

  // Modals
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showMalpracticeModal, setShowMalpracticeModal] = useState(false);

  // Student Lookup Search
  const [lookupRollNumber, setLookupRollNumber] = useState('');
  const [mySeatResults, setMySeatResults] = useState<any[]>([]);
  const [isSearchingSeat, setIsSearchingSeat] = useState(false);

  // Invigilation Duty State
  const [invigilationDuties, setInvigilationDuties] = useState<any[]>([]);
  const [activeHallAttendance, setActiveHallAttendance] = useState<{ [seatingId: string]: string }>({});

  // Malpractice Modal Form State
  const [targetSeatingForMalpractice, setTargetSeatingForMalpractice] = useState<any | null>(null);
  const [malpracticeOffense, setMalpracticeOffense] = useState('');
  const [malpracticeEvidence, setMalpracticeEvidence] = useState('');

  // --------------------------------------------------------------------------
  // CREATE EXAM FORM STATE
  // --------------------------------------------------------------------------
  const [examForm, setExamForm] = useState({
    name: 'JNTUA B.Tech III-I Regular Examinations 2026',
    exam_code: `EXAM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM - 01:00 PM',
    session: 'FN',
    academic_year: '2026',
    year_semester: 'III B.Tech I Sem'
  });

  const [batchesList, setBatchesList] = useState<any[]>([
    { branch: 'CSE', year_batch: 'III Year', start_reg: '21121A0501', end_reg: '21121A0560', excluded_ids: '' },
    { branch: 'ECE', year_batch: 'III Year', start_reg: '21121A0401', end_reg: '21121A0460', excluded_ids: '' }
  ]);

  const [roomsList, setRoomsList] = useState<any[]>([
    { hall_name: 'Hall A (Knowledge Park)', rows: 8, cols: 6, fill_strategy: 'col', prevent_adjacency: true, aisle_interval: 2, disabled_seats: '1-2, 4-5' },
    { hall_name: 'Hall B (Main Block)', rows: 6, cols: 8, fill_strategy: 'col', prevent_adjacency: true, aisle_interval: 2, disabled_seats: '' }
  ]);

  const [isSubmittingExam, setIsSubmittingExam] = useState(false);

  const fetchExams = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/exam-seating/exams');
      setExams(res.data.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load exam seating records');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMySeatLookup = async () => {
    try {
      setIsSearchingSeat(true);
      const res = await api.get('/exam-seating/my-seat');
      setMySeatResults(res.data.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSearchingSeat(false);
    }
  };

  const fetchInvigilationDuties = async () => {
    try {
      const res = await api.get('/exam-seating/invigilation');
      setInvigilationDuties(res.data.data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExams();
    fetchMySeatLookup();
    if (isFaculty) {
      fetchInvigilationDuties();
    }
    if (!isController && !isFaculty) {
      setActiveTab('STUDENT_LOOKUP');
    }
  }, []);

  const fetchExamDetails = async (id: string) => {
    try {
      const res = await api.get(`/exam-seating/exams/${id}`);
      setSelectedExamDetails(res.data.data);
    } catch (err: any) {
      toast.error('Failed to fetch exam details');
    }
  };

  const handleTogglePublish = async (examId: string, currentPublished: boolean) => {
    try {
      await api.post(`/exam-seating/exams/${examId}/publish`, { published: !currentPublished });
      toast.success(`Exam seating status updated to ${!currentPublished ? 'PUBLISHED' : 'UNPUBLISHED'}`);
      fetchExams();
      if (selectedExamDetails?.id === examId) {
        fetchExamDetails(examId);
      }
    } catch (err: any) {
      toast.error('Failed to update publish status');
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!window.confirm('Are you sure you want to delete this exam seating plan?')) return;
    try {
      await api.delete(`/exam-seating/exams/${examId}`);
      toast.success('Exam seating allocation deleted.');
      if (selectedExamDetails?.id === examId) {
        setSelectedExamDetails(null);
      }
      fetchExams();
    } catch (err: any) {
      toast.error('Failed to delete exam seating allocation');
    }
  };

  // Run Automatic Seating Allocation Engine
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.name.trim() || !examForm.date || !examForm.time) {
      toast.error('Please complete all mandatory exam details');
      return;
    }

    try {
      setIsSubmittingExam(true);
      const parsedBatches = batchesList.map(b => ({
        branch: b.branch,
        year_batch: b.year_batch,
        start_reg: b.start_reg,
        end_reg: b.end_reg,
        excluded_ids: b.excluded_ids ? b.excluded_ids.split(',').map((x: string) => x.trim()) : []
      }));

      const parsedRooms = roomsList.map(r => ({
        hall_name: r.hall_name,
        rows: parseInt(r.rows) || 8,
        cols: parseInt(r.cols) || 6,
        fill_strategy: r.fill_strategy,
        prevent_adjacency: r.prevent_adjacency,
        aisle_interval: parseInt(r.aisle_interval) || 2,
        disabled_seats: r.disabled_seats ? r.disabled_seats.split(',').map((x: string) => x.trim()) : []
      }));

      const res = await api.post('/exam-seating/exams', {
        ...examForm,
        batches: parsedBatches,
        rooms: parsedRooms
      });

      toast.success(res.data.message || 'Exam Seating Allocation Completed!');
      setShowCreateExamModal(false);
      fetchExams();
      if (res.data.data?.id) {
        fetchExamDetails(res.data.data.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to allocate exam seating');
    } finally {
      setIsSubmittingExam(false);
    }
  };

  // Submit Hall Attendance
  const handleSaveAttendance = async (examId: string, hallId: string) => {
    const attendancePayload = Object.keys(activeHallAttendance).map(seatingId => ({
      seatingId,
      attendance_status: activeHallAttendance[seatingId]
    }));

    if (attendancePayload.length === 0) {
      toast.error('No changes to save.');
      return;
    }

    try {
      await api.post('/exam-seating/invigilation/attendance', {
        examId,
        hallId,
        attendanceData: attendancePayload
      });
      toast.success('Attendance updated successfully for hall!');
      fetchExamDetails(examId);
    } catch (err: any) {
      toast.error('Failed to update attendance');
    }
  };

  // Submit Malpractice Log
  const handleLogMalpractice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSeatingForMalpractice || !malpracticeOffense.trim()) return;

    try {
      await api.post('/exam-seating/malpractice', {
        examId: targetSeatingForMalpractice.exam_id,
        seatingId: targetSeatingForMalpractice.id,
        rollNumber: targetSeatingForMalpractice.roll_number,
        studentName: targetSeatingForMalpractice.student_name,
        hallName: targetSeatingForMalpractice.hall_name,
        offenseDetails: malpracticeOffense,
        evidenceNotes: malpracticeEvidence,
        actionTaken: 'BOOKED_UNDER_MALPRACTICE'
      });

      toast.success(`Malpractice case booked for student ${targetSeatingForMalpractice.roll_number}`);
      setShowMalpracticeModal(false);
      setMalpracticeOffense('');
      setMalpracticeEvidence('');
      if (selectedExamDetails) {
        fetchExamDetails(selectedExamDetails.id);
      }
    } catch (err: any) {
      toast.error('Failed to log malpractice incident');
    }
  };

  // Calculate live preview count for batch builder
  const getBatchCount = (startReg: string, endReg: string, excludedStr: string) => {
    const list = generateStudentRange(startReg, endReg);
    const excl = new Set((excludedStr || '').split(',').map(x => x.trim().toUpperCase()));
    return list.filter(x => !excl.has(x)).length;
  };

  // Color helper for branches
  const getBranchBadgeStyle = (branch: string) => {
    switch ((branch || '').toUpperCase()) {
      case 'CSE': return 'bg-indigo-500 text-white border-indigo-600';
      case 'ECE': return 'bg-blue-600 text-white border-blue-700';
      case 'EEE': return 'bg-amber-600 text-white border-amber-700';
      case 'MECH': return 'bg-rose-600 text-white border-rose-700';
      case 'CIVIL': return 'bg-emerald-600 text-white border-emerald-700';
      default: return 'bg-purple-600 text-white border-purple-700';
    }
  };

  if (isLoading) return <LoadingState message="Loading Exam Seating Engine & Portal..." />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 backdrop-blur-md text-xs font-semibold border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" /> Controller of Examinations Portal
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Exam Seating Management System
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Automatic JNTUA Roll Number Range Generator, Anti-Cheating Seat Allocation Engine, Live Invigilation Grid, and Door Charts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isController && (
              <button
                onClick={() => setShowCreateExamModal(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus className="w-4 h-4" /> Run Seating Allocator
              </button>
            )}

            <button
              onClick={fetchExams}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {(isController || isFaculty) && (
          <button
            onClick={() => setActiveTab('EXAMS_LIST')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'EXAMS_LIST'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" /> Exam Seating Plans ({exams.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('STUDENT_LOOKUP')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'STUDENT_LOOKUP'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Search className="w-4 h-4" /> Student Seat Lookup
        </button>

        {isFaculty && (
          <button
            onClick={() => setActiveTab('INVIGILATION_DUTIES')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'INVIGILATION_DUTIES'
                ? 'bg-purple-700 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Invigilation Duties & Attendance
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXAMS LIST & SEATING MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'EXAMS_LIST' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left List of Exams */}
          <div className={`space-y-4 ${selectedExamDetails ? 'lg:col-span-4' : 'lg:col-span-12'}`}>
            {exams.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No Exam Seating Plans Created</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click "Run Seating Allocator" above to define student batches, set room grids, and generate automatic anti-cheating seating plans.
                </p>
              </div>
            ) : (
              exams.map((ex) => {
                const isSelected = selectedExamDetails?.id === ex.id;
                return (
                  <div
                    key={ex.id}
                    onClick={() => fetchExamDetails(ex.id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-900 to-slate-900 text-white border-indigo-700 shadow-lg'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md text-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-indigo-500/30 text-indigo-300' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          {ex.exam_code || 'EXAM'}
                        </span>
                        <h3 className="font-extrabold text-sm tracking-tight">{ex.name}</h3>
                        <p className={`text-xs flex items-center gap-2 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          <Calendar className="w-3.5 h-3.5" /> {new Date(ex.date).toLocaleDateString()} | <Clock className="w-3.5 h-3.5" /> {ex.time} ({ex.session})
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {ex.published ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Published
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Draft (Unpublished)
                          </span>
                        )}

                        <div className="text-[11px] font-bold text-slate-400">
                          {ex.total_students} Seats | {ex.total_halls} Halls
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Selected Exam Details & Seating Matrix */}
          {selectedExamDetails && (
            <div className="lg:col-span-8 space-y-6 animate-in fade-in">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md">
                      {selectedExamDetails.year_semester || 'Exam Seating Plan'}
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-1">{selectedExamDetails.name}</h2>
                    <p className="text-xs font-semibold text-slate-500">
                      Date: {new Date(selectedExamDetails.date).toLocaleDateString()} | Time: {selectedExamDetails.time} ({selectedExamDetails.session})
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isController && (
                      <button
                        onClick={() => handleTogglePublish(selectedExamDetails.id, selectedExamDetails.published)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          selectedExamDetails.published
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                        }`}
                      >
                        {selectedExamDetails.published ? 'Unpublish Plan' : 'Publish Plan to Portal'}
                      </button>
                    )}

                    <button
                      onClick={() => setShowPrintModal(true)}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> Print Door Charts
                    </button>

                    {isController && (
                      <button
                        onClick={() => handleDeleteExam(selectedExamDetails.id)}
                        className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        title="Delete Exam Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Halls Seating Grid Matrix */}
                <div className="space-y-6">
                  {selectedExamDetails.halls.map((hall: any) => {
                    const hallSeats = selectedExamDetails.seatings.filter((s: any) => s.hall_name === hall.hall_name);
                    const disabledSet = new Set<string>(hall.disabled_seats_json || []);

                    return (
                      <div key={hall.id} className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                            <h4 className="font-extrabold text-sm text-slate-900">{hall.hall_name}</h4>
                            <span className="text-[11px] font-semibold text-slate-500">
                              ({hallSeats.length} / {hall.capacity} Occupied | {hall.rows_count} R x {hall.cols_count} C)
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-bold">
                            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">Column Fill Strategy</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Anti-Cheating Enabled</span>
                          </div>
                        </div>

                        {/* Interactive Seating Grid Visualization */}
                        <div className="overflow-x-auto p-4 bg-white rounded-xl border border-slate-200 shadow-inner">
                          <div
                            className="grid gap-2 min-w-[500px]"
                            style={{
                              gridTemplateColumns: `repeat(${hall.cols_count}, minmax(0, 1fr))`
                            }}
                          >
                            {Array.from({ length: hall.rows_count * hall.cols_count }).map((_, idx) => {
                              const r = Math.floor(idx / hall.cols_count) + 1;
                              const c = (idx % hall.cols_count) + 1;
                              const seatKey = `${r}-${c}`;
                              const isBroken = disabledSet.has(seatKey);
                              const matchedSeat = hallSeats.find((s: any) => s.grid_row === r && s.grid_col === c);

                              if (isBroken) {
                                return (
                                  <div
                                    key={idx}
                                    className="h-16 rounded-xl border border-dashed border-rose-300 bg-rose-50/50 flex flex-col items-center justify-center text-[10px] text-rose-400 font-bold"
                                  >
                                    <span>Disabled</span>
                                    <span>Seat</span>
                                  </div>
                                );
                              }

                              if (!matchedSeat) {
                                return (
                                  <div
                                    key={idx}
                                    className="h-16 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-[10px] text-slate-400 font-semibold"
                                  >
                                    <span>R{r}-C{c}</span>
                                    <span>Empty</span>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={idx}
                                  className={`h-16 p-1.5 rounded-xl border flex flex-col justify-between text-left transition-all ${getBranchBadgeStyle(matchedSeat.branch)}`}
                                >
                                  <div className="flex items-center justify-between text-[9px] font-bold opacity-90">
                                    <span>R{r}-C{c}</span>
                                    <span>{matchedSeat.branch}</span>
                                  </div>
                                  <div>
                                    <p className="font-extrabold text-[11px] font-mono leading-tight truncate">{matchedSeat.roll_number}</p>
                                    <p className="text-[9px] opacity-80 truncate">{matchedSeat.student_name}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STUDENT SEAT LOOKUP */}
      {/* ========================================================================= */}
      {activeTab === 'STUDENT_LOOKUP' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mx-auto flex items-center justify-center">
              <Search className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Student Exam Seat Lookup</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Lookup your allocated exam hall, row, column, and seat number for all published examinations.
            </p>
          </div>

          {mySeatResults.length === 0 ? (
            <div className="p-8 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
              <h4 className="font-bold text-amber-900 text-sm">No Published Seating Plans Found</h4>
              <p className="text-xs text-amber-700">Seating plans for your upcoming exams will appear here once published by the Controller of Examinations.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mySeatResults.map((seat) => (
                <div key={seat.id} className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-800 space-y-4">
                  <div className="flex items-start justify-between border-b border-white/10 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-indigo-500/30 text-indigo-300">
                        {seat.year_semester || 'University Exam'}
                      </span>
                      <h3 className="text-lg font-black mt-2">{seat.exam_name}</h3>
                      <p className="text-xs text-slate-300">
                        Date: {new Date(seat.exam_date).toLocaleDateString()} | Time: {seat.exam_time} ({seat.exam_session})
                      </p>
                    </div>

                    <div className="px-4 py-2 rounded-2xl bg-orange-500 text-white font-extrabold text-sm text-center shadow">
                      Seat #{seat.seat_number}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Exam Hall</p>
                      <p className="font-black text-white mt-1 text-sm">{seat.hall_name}</p>
                    </div>

                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Grid Position</p>
                      <p className="font-black text-amber-400 mt-1 text-sm">Row {seat.grid_row}, Col {seat.grid_col}</p>
                    </div>

                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Roll Number</p>
                      <p className="font-black text-white mt-1 font-mono">{seat.roll_number}</p>
                    </div>

                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Branch</p>
                      <p className="font-black text-indigo-300 mt-1">{seat.branch}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INVIGILATION DUTIES & ATTENDANCE */}
      {/* ========================================================================= */}
      {activeTab === 'INVIGILATION_DUTIES' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-lg font-black text-slate-900">Faculty Invigilation Assignments</h3>
            <p className="text-xs text-slate-500">View assigned exam halls, mark student attendance, and book malpractice cases.</p>
          </div>

          {invigilationDuties.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <UserCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm">No Active Invigilation Duties</h4>
              <p className="text-xs text-slate-500">Your assigned exam invigilation duties will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invigilationDuties.map((d) => (
                <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{d.exam_name}</h4>
                      <p className="text-xs text-slate-500">{new Date(d.exam_date).toLocaleDateString()} | {d.exam_time}</p>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-900 font-extrabold text-xs rounded-full">
                      {d.hall_name}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-semibold">Capacity: {d.capacity} seats</span>
                    <button
                      onClick={() => {
                        fetchExamDetails(d.exam_id);
                        setActiveTab('EXAMS_LIST');
                      }}
                      className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      View Live Seating Chart <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RUN AUTOMATIC SEATING ALLOCATION ENGINE */}
      {/* ========================================================================= */}
      {showCreateExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  Automatic Engine
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">Configure Exam & Seating Engine</h3>
              </div>
              <button onClick={() => setShowCreateExamModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-6 text-xs font-medium">
              {/* Exam Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Examination Title *</label>
                  <input
                    type="text"
                    required
                    value={examForm.name}
                    onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exam Code</label>
                  <input
                    type="text"
                    value={examForm.exam_code}
                    onChange={(e) => setExamForm({ ...examForm, exam_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={examForm.date}
                    onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Slot *</label>
                  <input
                    type="text"
                    required
                    value={examForm.time}
                    onChange={(e) => setExamForm({ ...examForm, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Session</label>
                  <select
                    value={examForm.session}
                    onChange={(e) => setExamForm({ ...examForm, session: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="FN">Forenoon (FN)</option>
                    <option value="AN">Afternoon (AN)</option>
                  </select>
                </div>
              </div>

              {/* Student Batches Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm">1. Student Batches (JNTUA Roll Number Ranges)</h4>
                  <button
                    type="button"
                    onClick={() => setBatchesList([...batchesList, { branch: 'EEE', year_batch: 'III Year', start_reg: '', end_reg: '', excluded_ids: '' }])}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-200 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Branch Batch
                  </button>
                </div>

                {batchesList.map((batch, idx) => {
                  const studentCount = getBatchCount(batch.start_reg, batch.end_reg, batch.excluded_ids);
                  return (
                    <div key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-6 gap-3 items-center">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Branch</label>
                        <input
                          type="text"
                          value={batch.branch}
                          onChange={(e) => {
                            const updated = [...batchesList];
                            updated[idx].branch = e.target.value;
                            setBatchesList(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Start Roll No</label>
                        <input
                          type="text"
                          placeholder="21121A0501"
                          value={batch.start_reg}
                          onChange={(e) => {
                            const updated = [...batchesList];
                            updated[idx].start_reg = e.target.value;
                            setBatchesList(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">End Roll No</label>
                        <input
                          type="text"
                          placeholder="21121A0560"
                          value={batch.end_reg}
                          onChange={(e) => {
                            const updated = [...batchesList];
                            updated[idx].end_reg = e.target.value;
                            setBatchesList(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Excluded Roll Numbers</label>
                        <input
                          type="text"
                          placeholder="21121A0512, 21121A0545"
                          value={batch.excluded_ids}
                          onChange={(e) => {
                            const updated = [...batchesList];
                            updated[idx].excluded_ids = e.target.value;
                            setBatchesList(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-indigo-600 text-xs">{studentCount} Students</span>
                        {batchesList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setBatchesList(batchesList.filter((_, i) => i !== idx))}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Exam Halls Setup */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm">2. Exam Halls & Grid Strategy</h4>
                  <button
                    type="button"
                    onClick={() => setRoomsList([...roomsList, { hall_name: `Hall ${String.fromCharCode(65 + roomsList.length)}`, rows: 8, cols: 6, fill_strategy: 'col', prevent_adjacency: true, aisle_interval: 2, disabled_seats: '' }])}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-200 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Exam Hall
                  </button>
                </div>

                {roomsList.map((room, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Hall Name</label>
                        <input
                          type="text"
                          value={room.hall_name}
                          onChange={(e) => {
                            const updated = [...roomsList];
                            updated[idx].hall_name = e.target.value;
                            setRoomsList(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Rows x Columns</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={room.rows}
                            onChange={(e) => {
                              const updated = [...roomsList];
                              updated[idx].rows = e.target.value;
                              setRoomsList(updated);
                            }}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-center font-bold"
                          />
                          <span>x</span>
                          <input
                            type="number"
                            value={room.cols}
                            onChange={(e) => {
                              const updated = [...roomsList];
                              updated[idx].cols = e.target.value;
                              setRoomsList(updated);
                            }}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-center font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Fill Strategy</label>
                        <select
                          value={room.fill_strategy}
                          onChange={(e) => {
                            const updated = [...roomsList];
                            updated[idx].fill_strategy = e.target.value;
                            setRoomsList(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                        >
                          <option value="col">Column-Major (Recommended)</option>
                          <option value="row">Row-Major</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Broken / Disabled Seats</label>
                        <input
                          type="text"
                          placeholder="1-2, 4-5"
                          value={room.disabled_seats}
                          onChange={(e) => {
                            const updated = [...roomsList];
                            updated[idx].disabled_seats = e.target.value;
                            setRoomsList(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-4">
                        <input
                          type="checkbox"
                          id={`prev-${idx}`}
                          checked={room.prevent_adjacency}
                          onChange={(e) => {
                            const updated = [...roomsList];
                            updated[idx].prevent_adjacency = e.target.checked;
                            setRoomsList(updated);
                          }}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <label htmlFor={`prev-${idx}`} className="font-bold text-slate-700">Prevent Adjacent Same Branch</label>
                      </div>

                      <div className="flex items-center justify-end pt-4">
                        {roomsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setRoomsList(roomsList.filter((_, i) => i !== idx))}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" /> Remove Hall
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateExamModal(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingExam}
                  className="px-6 py-2.5 rounded-xl font-extrabold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingExam ? 'Allocating Seating...' : 'Run Automatic Seating Engine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINT FORMAL EXAM DOOR CHARTS MODAL */}
      {/* ========================================================================= */}
      {showPrintModal && selectedExamDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <span className="font-bold text-sm text-slate-700">Printable Exam Seating Door Charts</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Door Chart
                </button>

                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Body */}
            <div className="space-y-8 p-6 border border-slate-300 rounded-xl bg-white leading-relaxed">
              <div className="text-center space-y-1 pb-4 border-b border-slate-400">
                <h2 className="text-2xl font-black tracking-wider uppercase">SANSKRITHI SCHOOL OF ENGINEERING</h2>
                <p className="text-xs text-slate-700">Behind SSSS Hospital, Beedupalli Knowledge Park, Prasanthigram, Puttaparthi - 515134</p>
                <p className="text-xs text-slate-600 font-bold mt-2">CONTROLLER OF EXAMINATIONS - SEATING ARRANGEMENT CHART</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-bold border-b border-slate-300 pb-4">
                <div>
                  <p>Examination: <span className="font-normal">{selectedExamDetails.name}</span></p>
                  <p>Date: <span className="font-normal">{new Date(selectedExamDetails.date).toLocaleDateString()} ({selectedExamDetails.session})</span></p>
                </div>
                <div>
                  <p>Time: <span className="font-normal">{selectedExamDetails.time}</span></p>
                  <p>Academic Year / Sem: <span className="font-normal">{selectedExamDetails.year_semester}</span></p>
                </div>
              </div>

              {selectedExamDetails.halls.map((h: any) => {
                const hallSeats = selectedExamDetails.seatings.filter((s: any) => s.hall_name === h.hall_name);
                return (
                  <div key={h.id} className="space-y-3">
                    <h3 className="font-black text-sm uppercase bg-slate-100 p-2 border border-slate-300">
                      HALL NAME: {h.hall_name} (Total Students: {hallSeats.length})
                    </h3>

                    <table className="w-full border-collapse border border-slate-400 text-xs text-center">
                      <thead>
                        <tr className="bg-slate-200">
                          <th className="border border-slate-400 p-2">Seat No</th>
                          <th className="border border-slate-400 p-2">Roll Number</th>
                          <th className="border border-slate-400 p-2">Student Name</th>
                          <th className="border border-slate-400 p-2">Branch</th>
                          <th className="border border-slate-400 p-2">Invigilator Sign</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hallSeats.map((s: any) => (
                          <tr key={s.id} className="border-b border-slate-300">
                            <td className="border border-slate-300 p-2 font-bold">{s.seat_number}</td>
                            <td className="border border-slate-300 p-2 font-mono font-bold">{s.roll_number}</td>
                            <td className="border border-slate-300 p-2 font-semibold text-left">{s.student_name}</td>
                            <td className="border border-slate-300 p-2 font-bold">{s.branch}</td>
                            <td className="border border-slate-300 p-2"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
