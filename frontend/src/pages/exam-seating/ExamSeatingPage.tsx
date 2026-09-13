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
  Grid,
  X,
  ArrowLeft,
  Settings,
  Cpu
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

// ============================================================================
// HALL SEATING PREVIEW CARD COMPONENT (VERTICALLY ALTERNATING BRANCH ALLOCATION)
// ============================================================================
const HallSeatingPreviewCard: React.FC<{
  hall: any;
  seatings?: any[];
  onToggleDisabledSeat?: (seatKey: string) => void;
  onDeleteHall?: () => void;
}> = ({ hall, seatings = [], onToggleDisabledSeat, onDeleteHall }) => {
  const [isBlockModeActive, setIsBlockModeActive] = useState(false);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');

  const rows = parseInt(hall.rows_count || hall.rows || 6);
  const cols = parseInt(hall.cols_count || hall.cols || 4);

  // Parse disabled seats array / string
  let disabledArr: string[] = [];
  if (Array.isArray(hall.disabled_seats_json)) {
    disabledArr = hall.disabled_seats_json;
  } else if (typeof hall.disabled_seats === 'string') {
    disabledArr = hall.disabled_seats.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  const disabledSet = new Set<string>(disabledArr);

  // Columns from cols down to 1 (e.g. 4, 3, 2, 1)
  const colIndices = Array.from({ length: cols }, (_, i) => cols - i);
  // Rows from rows down to 1 (e.g. F, E, D, C, B, A)
  const rowIndices = Array.from({ length: rows }, (_, i) => rows - i);

  const getRowLetter = (r: number) => String.fromCharCode(64 + r);

  // Pre-calculate preview grid map matching alternating Branch A / Branch B seating pattern
  const previewMap = React.useMemo(() => {
    const map = new Map<string, { roll_number: string; branch: string; grid_row: number; grid_col: number }>();
    let countA = 0;
    let countB = 0;

    for (let c = 1; c <= cols; c++) {
      for (let r = 1; r <= rows; r++) {
        // Alternating Branch A (CSE) and Branch B (ECE) vertically behind each other
        const isBranchA = (r + c) % 2 === 0;
        const branch = isBranchA ? 'CSE' : 'ECE';
        let rollNum: number;
        if (isBranchA) {
          rollNum = 501 + countA;
          countA++;
        } else {
          rollNum = 401 + countB;
          countB++;
        }

        map.set(`${r}-${c}`, {
          roll_number: `${rollNum}`,
          branch,
          grid_row: r,
          grid_col: c
        });
      }
    }
    return map;
  }, [rows, cols]);

  const getPreviewSeatInfo = (r: number, c: number) => {
    if (seatings && seatings.length > 0) {
      return seatings.find((s: any) => s.grid_row === r && s.grid_col === c);
    }
    return previewMap.get(`${r}-${c}`);
  };

  const handleSeatClick = (r: number, c: number) => {
    const seatKey = `${r}-${c}`;
    if (onToggleDisabledSeat) {
      onToggleDisabledSeat(seatKey);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-6">
      {/* Top Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          {/* Block Seat Toggle Button */}
          <button
            type="button"
            onClick={() => setIsBlockModeActive(!isBlockModeActive)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              isBlockModeActive
                ? 'bg-red-600 text-white ring-2 ring-red-400 scale-105'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            <span className="w-3 h-3 rounded-md bg-white/40" />
            Block Seat
          </button>

          {/* Branch Badges Filter Radio Options */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-600">
            {['CSE-A', 'ECE-A', 'EEE-A', 'MECH-A', 'CIVIL-A'].map((b) => (
              <label
                key={b}
                onClick={() => setSelectedBranchFilter(selectedBranchFilter === b ? 'ALL' : b)}
                className={`px-2.5 py-1 rounded-full border cursor-pointer transition-all flex items-center gap-1.5 ${
                  selectedBranchFilter === b
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  b.includes('CSE') ? 'bg-blue-500' : b.includes('ECE') ? 'bg-emerald-500' : b.includes('EEE') ? 'bg-purple-500' : b.includes('MECH') ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
                {b}
              </label>
            ))}
          </div>
        </div>

        {/* Delete Hall Button */}
        {onDeleteHall && (
          <button
            type="button"
            onClick={onDeleteHall}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Delete Hall"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Seating Canvas */}
      <div className="flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-3xl border border-slate-200/80 shadow-inner overflow-x-auto min-w-[340px]">
        {/* Column Number Headers (4, 3, 2, 1) */}
        <div className="flex items-center gap-4 mb-3">
          {colIndices.map((c) => (
            <div key={c} className="w-16 text-center text-xs font-bold text-slate-400">
              {c}
            </div>
          ))}
          <div className="w-6" />
        </div>

        {/* Rows Grid */}
        <div className="space-y-3">
          {rowIndices.map((r) => (
            <div key={r} className="flex items-center gap-4">
              {colIndices.map((c) => {
                const seatKey = `${r}-${c}`;
                const isBlocked = disabledSet.has(seatKey);
                const seatInfo = getPreviewSeatInfo(r, c);

                if (isBlocked) {
                  return (
                    <div
                      key={c}
                      onClick={() => handleSeatClick(r, c)}
                      className="w-16 h-12 rounded-2xl bg-slate-200 border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px] font-bold cursor-pointer hover:bg-slate-300 transition-all"
                      title={`Blocked Seat R${r}-C${c} (Click to Unblock)`}
                    >
                      BLOCKED
                    </div>
                  );
                }

                if (!seatInfo) {
                  return (
                    <div
                      key={c}
                      onClick={() => handleSeatClick(r, c)}
                      className="w-16 h-12 rounded-2xl border-2 border-slate-200 bg-white text-slate-300 flex items-center justify-center text-[10px] font-semibold cursor-pointer hover:border-slate-300"
                    >
                      EMPTY
                    </div>
                  );
                }

                // Color coding pills based on branch
                const branch = (seatInfo.branch || '').toUpperCase();
                let borderClass = 'border-2 border-blue-500 text-blue-900 bg-white shadow-2xs hover:scale-105';

                if (branch.includes('ECE')) {
                  borderClass = 'border-2 border-emerald-500 text-emerald-900 bg-white shadow-2xs hover:scale-105';
                } else if (branch.includes('EEE')) {
                  borderClass = 'border-2 border-purple-500 text-purple-900 bg-white shadow-2xs hover:scale-105';
                } else if (branch.includes('MECH')) {
                  borderClass = 'border-2 border-amber-500 text-amber-900 bg-white shadow-2xs hover:scale-105';
                } else if (branch.includes('CIVIL')) {
                  borderClass = 'border-2 border-rose-500 text-rose-900 bg-white shadow-2xs hover:scale-105';
                }

                const shortRoll = seatInfo.roll_number.length > 3 ? seatInfo.roll_number.slice(-3) : seatInfo.roll_number;

                return (
                  <div
                    key={c}
                    onClick={() => handleSeatClick(r, c)}
                    className={`w-16 h-12 rounded-2xl ${borderClass} flex flex-col items-center justify-center font-extrabold font-mono text-xs transition-all cursor-pointer`}
                    title={`${seatInfo.roll_number} (${seatInfo.branch}) - Click to Block/Unblock`}
                  >
                    <span>{shortRoll}</span>
                  </div>
                );
              })}

              {/* Row Letter on Right (F, E, D, C, B, A) */}
              <div className="w-6 text-left text-xs font-bold text-slate-400">
                {getRowLetter(r)}
              </div>
            </div>
          ))}
        </div>

        {/* SCREEN / STAGE BANNER */}
        <div className="w-full max-w-lg mt-6 py-3 px-8 bg-gradient-to-r from-sky-100 via-sky-50 to-sky-100 border border-sky-200/80 rounded-2xl text-center shadow-2xs">
          <span className="text-xs font-black tracking-widest uppercase text-sky-600">
            SCREEN / STAGE
          </span>
        </div>
      </div>

      {/* Bottom Branch Legends Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] font-bold text-slate-500">
        <span className="px-3 py-1 rounded-xl border-2 border-blue-500 text-blue-800 bg-white">CSE</span>
        <span className="px-3 py-1 rounded-xl border-2 border-emerald-500 text-emerald-800 bg-white">ECE</span>
        <span className="px-3 py-1 rounded-xl border-2 border-purple-500 text-purple-800 bg-white">EEE</span>
        <span className="px-3 py-1 rounded-xl border-2 border-amber-500 text-amber-800 bg-white">MECH</span>
        <span className="px-3 py-1 rounded-xl border-2 border-rose-500 text-rose-800 bg-white">CIVIL</span>
        <span className="px-3 py-1 rounded-xl border-2 border-slate-200 text-slate-400 bg-white">EMPTY</span>
        <span className="px-3 py-1 rounded-xl bg-slate-200 border-2 border-slate-300 text-slate-500 font-bold">BLOCKED</span>
      </div>
    </div>
  );
};

export const ExamSeatingPage: React.FC = () => {
  const { user } = useAuth();
  const specialRole = (user?.special_role || user?.specialRole || '').toUpperCase();
  const userRole = (user?.role || '').toUpperCase();

  const isController =
    userRole === 'SUPER_ADMIN' ||
    userRole === 'ADMIN' ||
    specialRole.includes('CONTROLLER') ||
    specialRole.includes('EXAM');

  const isFaculty = (userRole === 'FACULTY' || userRole === 'MENTOR') && !isController;
  const isStudent = userRole === 'JUNIOR' || userRole === 'SENIOR';

  const [activeTab, setActiveTab] = useState<'EXAMS_LIST' | 'STUDENT_LOOKUP' | 'INVIGILATION_DUTIES' | 'CREATE_SEATING_PLAN'>(
    isController ? 'EXAMS_LIST' : isFaculty ? 'INVIGILATION_DUTIES' : 'STUDENT_LOOKUP'
  );

  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExamDetails, setSelectedExamDetails] = useState<any | null>(null);

  // Modals
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Student Lookup Search
  const [lookupRollNumber, setLookupRollNumber] = useState('');
  const [mySeatResults, setMySeatResults] = useState<any[]>([]);
  const [isSearchingSeat, setIsSearchingSeat] = useState(false);

  // Invigilation Duty State
  const [invigilationDuties, setInvigilationDuties] = useState<any[]>([]);

  // Selected Active Hall Preview Tab in Full Page Allocator
  const [selectedPreviewHallIdx, setSelectedPreviewHallIdx] = useState(0);

  // --------------------------------------------------------------------------
  // CREATE EXAM FORM STATE & ENGINE CONFIG OPTIONS
  // --------------------------------------------------------------------------
  const [examForm, setExamForm] = useState({
    name: 'JNTUA B.Tech III-I Regular Examinations 2026',
    subject: '',
    exam_code: `EXAM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM - 01:00 PM',
    session: 'FN',
    academic_year: '2026',
    year_semester: 'III B.Tech I Sem'
  });

  const [batchesList, setBatchesList] = useState<any[]>([
    { branch: 'CSE', subject: 'Data Structures', year_batch: 'III Year', start_reg: '21121A0501', end_reg: '21121A0560', excluded_ids: '21121A0502, 21121A0504' },
    { branch: 'ECE', subject: 'Digital Signal Processing', year_batch: 'III Year', start_reg: '21121A0401', end_reg: '21121A0460', excluded_ids: '' }
  ]);

  const [roomsList, setRoomsList] = useState<any[]>([
    { hall_name: 'Hall A (Knowledge Park)', rows: 6, cols: 4, fill_strategy: 'col', prevent_adjacency: true, aisle_interval: 2, strict_flow: true, disabled_seats: '' },
    { hall_name: 'Hall B (Main Block)', rows: 6, cols: 4, fill_strategy: 'col', prevent_adjacency: true, aisle_interval: 2, strict_flow: true, disabled_seats: '' }
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
    if (isFaculty || isController) {
      fetchInvigilationDuties();
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

  // Toggle Excluded Roll Number Chip
  const toggleRollExclusion = (batchIdx: number, rollToToggle: string) => {
    const updated = [...batchesList];
    const currentExclStr = updated[batchIdx].excluded_ids || '';
    let currentExclArr = currentExclStr
      .split(',')
      .map((s: string) => s.trim().toUpperCase())
      .filter(Boolean);

    const target = rollToToggle.trim().toUpperCase();

    if (currentExclArr.includes(target)) {
      currentExclArr = currentExclArr.filter((r: string) => r !== target);
    } else {
      currentExclArr.push(target);
    }

    updated[batchIdx].excluded_ids = currentExclArr.join(', ');
    setBatchesList(updated);
  };

  // Toggle Disabled Seat in Room Setup
  const toggleDisabledSeatInRoom = (roomIdx: number, seatKey: string) => {
    const updated = [...roomsList];
    let currentDisabled = (updated[roomIdx].disabled_seats || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    if (currentDisabled.includes(seatKey)) {
      currentDisabled = currentDisabled.filter((s: string) => s !== seatKey);
    } else {
      currentDisabled.push(seatKey);
    }

    updated[roomIdx].disabled_seats = currentDisabled.join(', ');
    setRoomsList(updated);
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
        subject: b.subject,
        year_batch: b.year_batch,
        start_reg: b.start_reg,
        end_reg: b.end_reg,
        excluded_ids: b.excluded_ids ? b.excluded_ids.split(',').map((x: string) => x.trim()) : []
      }));

      const parsedRooms = roomsList.map(r => ({
        hall_name: r.hall_name,
        rows: parseInt(r.rows) || 6,
        cols: parseInt(r.cols) || 4,
        fill_strategy: r.fill_strategy,
        prevent_adjacency: r.prevent_adjacency,
        strict_flow: r.strict_flow,
        aisle_interval: parseInt(r.aisle_interval) || 2,
        disabled_seats: r.disabled_seats ? r.disabled_seats.split(',').map((x: string) => x.trim()) : []
      }));

      const res = await api.post('/exam-seating/exams', {
        ...examForm,
        name: examForm.subject ? `${examForm.name} - ${examForm.subject}` : examForm.name,
        batches: parsedBatches,
        rooms: parsedRooms
      });

      toast.success(res.data.message || 'Exam Seating Allocation Completed!');
      setActiveTab('EXAMS_LIST');
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

  if (isLoading) return <LoadingState message="Loading Exam Seating Engine & Portal..." />;

  // Calculate global summary counts across batches for the Exclude Header
  let totalGeneratedCount = 0;
  let totalExcludedCount = 0;
  batchesList.forEach(batch => {
    const rolls = generateStudentRange(batch.start_reg, batch.end_reg);
    const excl = new Set((batch.excluded_ids || '').split(',').map((x: string) => x.trim().toUpperCase()).filter(Boolean));
    totalGeneratedCount += rolls.length;
    totalExcludedCount += excl.size;
  });
  const totalReadyStudents = totalGeneratedCount - totalExcludedCount;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 backdrop-blur-md text-xs font-semibold border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
              {isController ? 'Controller of Examinations Command Center' : isFaculty ? 'Faculty Invigilation Portal' : 'Student Exam Seat Finder'}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Exam Seating Management System
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {isController
                ? 'Automatic JNTUA Roll Number Range Generator, Anti-Cheating Seat Allocation Engine, Live Invigilation Grid, and Door Charts.'
                : isFaculty
                ? 'View assigned invigilation duties, mark attendance, and report malpractice cases.'
                : 'Search your allocated exam hall, row, column, and seat number for upcoming examinations.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isController && (
              <button
                onClick={() => setActiveTab('CREATE_SEATING_PLAN')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Cpu className="w-4 h-4" /> Run Seating Allocator
              </button>
            )}

            <button
              onClick={fetchExams}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {isController && (
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

        {isController && (
          <button
            onClick={() => setActiveTab('CREATE_SEATING_PLAN')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'CREATE_SEATING_PLAN'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" /> Run Seating Allocator (Full Page)
          </button>
        )}

        <button
          onClick={() => setActiveTab('STUDENT_LOOKUP')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'STUDENT_LOOKUP'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Search className="w-4 h-4" /> Find My Seat / Roll No Lookup
        </button>

        {(isFaculty || isController) && (
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
      {/* FULL PAGE VIEW: RUN AUTOMATIC SEATING ALLOCATOR WORKFLOW */}
      {/* ========================================================================= */}
      {activeTab === 'CREATE_SEATING_PLAN' && isController && (
        <div className="space-y-8 animate-in fade-in">
          {/* Algorithm Breakdown Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest">
                  <Cpu className="w-3.5 h-3.5" /> Anti-Cheating Allocation Engine v2.0
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Configure Exam & Seating Allocator</h2>
                <p className="text-xs text-slate-500">Full-Page Seating Matrix Setup & Custom Anti-Cheating Rules</p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('EXAMS_LIST')}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Plans
              </button>
            </div>

            {/* 7-Step Algorithm Breakdown Diagram Cards */}
            <div className="space-y-3">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Multi-Stage Allocation Algorithm Breakdown:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black inline-flex items-center justify-center">1</span>
                  <p className="text-[11px] font-bold text-indigo-950">Student Queue</p>
                  <p className="text-[9px] text-indigo-700">JNTUA Alphanumeric Decode</p>
                </div>

                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-1">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black inline-flex items-center justify-center">2</span>
                  <p className="text-[11px] font-bold text-blue-950">Room Matrix</p>
                  <p className="text-[9px] text-blue-700">Rows x Cols Layout</p>
                </div>

                <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-1">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-black inline-flex items-center justify-center">3</span>
                  <p className="text-[11px] font-bold text-purple-950">Fill Strategy</p>
                  <p className="text-[9px] text-purple-700">Column vs Row Iteration</p>
                </div>

                <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-2xl space-y-1">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-black inline-flex items-center justify-center">4</span>
                  <p className="text-[11px] font-bold text-amber-950">Disabled Seats</p>
                  <p className="text-[9px] text-amber-700">Pillar & Broken Filter</p>
                </div>

                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black inline-flex items-center justify-center">5</span>
                  <p className="text-[11px] font-bold text-emerald-950">Anti-Cheating</p>
                  <p className="text-[9px] text-emerald-700">Same Branch/Paper Blocking</p>
                </div>

                <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-2xl space-y-1">
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black inline-flex items-center justify-center">6</span>
                  <p className="text-[11px] font-bold text-rose-950">Checkerboard</p>
                  <p className="text-[9px] text-rose-700">(r+c)%2 Parity Slot Selection</p>
                </div>

                <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl space-y-1">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-black inline-flex items-center justify-center">7</span>
                  <p className="text-[11px] font-bold text-slate-900">Seat Assignment</p>
                  <p className="text-[9px] text-slate-600">Door Charts & DB Save</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreateExam} className="space-y-8">
            {/* SUBJECT (OPTIONAL) INPUT FIELD - MATCHING SCREENSHOT 1 */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-2">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">Examination Paper / Subject Name (Optional)</label>
              <input
                type="text"
                placeholder="SUBJECT (OPTIONAL)"
                value={examForm.subject}
                onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-sm uppercase tracking-wider text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 shadow-2xs"
              />
            </div>

            {/* SECTION 1: EXAMINATION METADATA */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" /> 1. Examination Details & Schedule
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Examination Title *</label>
                  <input
                    type="text"
                    required
                    value={examForm.name}
                    onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Exam Code</label>
                  <input
                    type="text"
                    value={examForm.exam_code}
                    onChange={(e) => setExamForm({ ...examForm, exam_code: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={examForm.date}
                    onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot *</label>
                  <input
                    type="text"
                    required
                    value={examForm.time}
                    onChange={(e) => setExamForm({ ...examForm, time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Session</label>
                  <select
                    value={examForm.session}
                    onChange={(e) => setExamForm({ ...examForm, session: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm"
                  >
                    <option value="FN">Forenoon (FN)</option>
                    <option value="AN">Afternoon (AN)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: STUDENT BATCHES & EXCLUSIONS - MATCHING SCREENSHOT 1 */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" /> 2. Student Batches (JNTUA Alphanumeric Range Generator)
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-extrabold mt-1">
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {totalReadyStudents} Students ready
                    </span>
                    {totalExcludedCount > 0 && (
                      <span className="text-red-600 font-extrabold">
                        ({totalExcludedCount} Excluded)
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBatchesList([...batchesList, { branch: 'EEE', subject: '', year_batch: 'III Year', start_reg: '', end_reg: '', excluded_ids: '' }])}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Branch Batch
                </button>
              </div>

              {batchesList.map((batch, idx) => {
                const generatedRolls = generateStudentRange(batch.start_reg, batch.end_reg);
                const exclSet = new Set((batch.excluded_ids || '').split(',').map((x: string) => x.trim().toUpperCase()).filter(Boolean));

                return (
                  <div key={idx} className="p-6 bg-slate-50/70 border border-slate-200 rounded-3xl space-y-4 shadow-2xs">
                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 items-center text-xs">
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-600 mb-1">Branch</label>
                        <input
                          type="text"
                          value={batch.branch}
                          onChange={(e) => {
                            const updated = [...batchesList];
                            updated[idx].branch = e.target.value;
                            setBatchesList(updated);
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold bg-white text-slate-800"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-extrabold text-slate-600 mb-1">Subject Paper (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Data Structures"
                          value={batch.subject}
                          onChange={(e) => {
                            const updated = [...batchesList];
                            updated[idx].subject = e.target.value;
                            setBatchesList(updated);
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-600 mb-1">Start Roll No</label>
                        <input
                          type="text"
                          placeholder="21121A0501"
                          value={batch.start_reg}
                          onChange={(e) => {
                            const updated = [...batchesList];
                            updated[idx].start_reg = e.target.value;
                            setBatchesList(updated);
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold bg-white text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-600 mb-1">End Roll No</label>
                        <input
                          type="text"
                          placeholder="21121A0560"
                          value={batch.end_reg}
                          onChange={(e) => {
                            const updated = [...batchesList];
                            updated[idx].end_reg = e.target.value;
                            setBatchesList(updated);
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold bg-white text-slate-800"
                        />
                      </div>

                      <div className="flex items-center justify-end pt-5">
                        {batchesList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setBatchesList(batchesList.filter((_, i) => i !== idx))}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SELECT TO EXCLUDE (RED = EXCLUDED) CONTAINER - MATCHES SCREENSHOT 1 */}
                    {generatedRolls.length > 0 && (
                      <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-2">
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span>SELECT TO EXCLUDE (RED = EXCLUDED)</span>
                          <span>{generatedRolls.length} Roll Numbers Generated</span>
                        </div>

                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                          {generatedRolls.map((roll) => {
                            const isExcluded = exclSet.has(roll);
                            const shortRoll = roll.length > 3 ? roll.slice(-3) : roll;
                            return (
                              <button
                                type="button"
                                key={roll}
                                onClick={() => toggleRollExclusion(idx, roll)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shadow-2xs ${
                                  isExcluded
                                    ? 'bg-red-500 text-white border border-red-600 font-extrabold shadow-sm scale-105'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                                }`}
                                title={isExcluded ? `Excluded: ${roll} (Click to Include)` : `Included: ${roll} (Click to Exclude)`}
                              >
                                {shortRoll}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* SECTION 3: EXAM HALLS & LIVE INTERACTIVE SEATING PREVIEW */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" /> 3. Exam Halls Setup & Interactive Grid Matrix
                  </h3>
                  <p className="text-xs text-slate-500">Define hall dimensions, fill strategy, and click seats on the live canvas to block/unblock.</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newRooms = [...roomsList, { hall_name: `Hall ${String.fromCharCode(65 + roomsList.length)}`, rows: 6, cols: 4, fill_strategy: 'col', prevent_adjacency: true, aisle_interval: 2, strict_flow: true, disabled_seats: '' }];
                    setRoomsList(newRooms);
                    setSelectedPreviewHallIdx(newRooms.length - 1);
                  }}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Exam Hall
                </button>
              </div>

              {roomsList.map((room, idx) => (
                <div key={idx} className="p-5 bg-slate-50/70 border border-slate-200 rounded-3xl space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Hall Name</label>
                      <input
                        type="text"
                        value={room.hall_name}
                        onChange={(e) => {
                          const updated = [...roomsList];
                          updated[idx].hall_name = e.target.value;
                          setRoomsList(updated);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Rows x Columns</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={room.rows}
                          onChange={(e) => {
                            const updated = [...roomsList];
                            updated[idx].rows = e.target.value;
                            setRoomsList(updated);
                          }}
                          className="w-full px-2 py-2 rounded-xl border border-slate-200 bg-white text-center font-bold"
                        />
                        <span className="font-bold text-slate-400">x</span>
                        <input
                          type="number"
                          value={room.cols}
                          onChange={(e) => {
                            const updated = [...roomsList];
                            updated[idx].cols = e.target.value;
                            setRoomsList(updated);
                          }}
                          className="w-full px-2 py-2 rounded-xl border border-slate-200 bg-white text-center font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Fill Strategy</label>
                      <select
                        value={room.fill_strategy}
                        onChange={(e) => {
                          const updated = [...roomsList];
                          updated[idx].fill_strategy = e.target.value;
                          setRoomsList(updated);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                      >
                        <option value="col">Column-Wise (Vertical)</option>
                        <option value="row">Row-Wise (Horizontal)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-end pt-5">
                      {roomsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newRooms = roomsList.filter((_, i) => i !== idx);
                            setRoomsList(newRooms);
                            setSelectedPreviewHallIdx(0);
                          }}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* SINGLE ACTIVE LIVE HALL PREVIEW CARD WITH HALL SELECTOR TABS */}
              {roomsList.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">Select Hall Preview Canvas:</span>
                    <div className="flex items-center gap-2 overflow-x-auto">
                      {roomsList.map((r, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedPreviewHallIdx(i)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedPreviewHallIdx === i
                              ? 'bg-slate-900 text-white shadow-md'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {r.hall_name || `Hall ${i + 1}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <HallSeatingPreviewCard
                    hall={roomsList[selectedPreviewHallIdx] || roomsList[0]}
                    onToggleDisabledSeat={(seatKey) => toggleDisabledSeatInRoom(selectedPreviewHallIdx, seatKey)}
                    onDeleteHall={roomsList.length > 1 ? () => {
                      const newRooms = roomsList.filter((_, i) => i !== selectedPreviewHallIdx);
                      setRoomsList(newRooms);
                      setSelectedPreviewHallIdx(0);
                    } : undefined}
                  />
                </div>
              )}
            </div>

            {/* ACTION SUBMIT FOOTER */}
            <div className="flex items-center justify-between p-6 bg-slate-900 text-white rounded-3xl shadow-xl">
              <div>
                <h4 className="font-extrabold text-base">Ready to Allocate Seating?</h4>
                <p className="text-xs text-slate-400">Click below to execute the 7-stage anti-cheating seating engine and save allocations.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('EXAMS_LIST')}
                  className="px-5 py-3 rounded-xl font-bold text-xs text-slate-300 hover:bg-white/10 cursor-pointer transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingExam}
                  className="px-8 py-3.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 hover:from-indigo-600 hover:to-purple-700 shadow-xl cursor-pointer disabled:opacity-50 transform hover:-translate-y-0.5"
                >
                  {isSubmittingExam ? 'Executing Seating Engine...' : 'Run Automatic Seating Engine'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: EXAMS LIST & SEATING MATRIX (CONTROLLER & SUPER ADMIN ONLY) */}
      {/* ========================================================================= */}
      {activeTab === 'EXAMS_LIST' && isController && (
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
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
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

                    <button
                      onClick={() => setShowPrintModal(true)}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> Print Door Charts
                    </button>

                    <button
                      onClick={() => handleDeleteExam(selectedExamDetails.id)}
                      className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                      title="Delete Exam Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Halls Seating Grid Matrix Preview Cards matching Screenshot 3 */}
                <div className="space-y-6">
                  {selectedExamDetails.halls.map((hall: any) => {
                    const hallSeats = selectedExamDetails.seatings.filter((s: any) => s.hall_name === hall.hall_name);

                    return (
                      <div key={hall.id} className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                            <h4 className="font-extrabold text-sm text-slate-900">{hall.hall_name}</h4>
                            <span className="text-[11px] font-semibold text-slate-500">
                              ({hallSeats.length} / {hall.capacity} Occupied | {hall.rows_count} R x {hall.cols_count} C)
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-bold">
                            <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">Column-Major Strategy</span>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Anti-Cheating Active</span>
                          </div>
                        </div>

                        {/* Rendering Complete Interactive Hall Preview Card */}
                        <HallSeatingPreviewCard hall={hall} seatings={hallSeats} />
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
      {/* TAB 2: STUDENT SEAT LOOKUP (FOR STUDENTS & ALL ROLES) */}
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
      {/* TAB 3: INVIGILATION DUTIES */}
      {/* ========================================================================= */}
      {activeTab === 'INVIGILATION_DUTIES' && (isFaculty || isController) && (
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
