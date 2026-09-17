import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
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
  Cpu,
  Zap,
  Copy
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

function reconstructBatchesFromSeatings(seatings: any[]) {
  if (!seatings || !seatings.length) return [];
  const branchMap = new Map<string, { branch: string; year_batch: string; rolls: string[] }>();

  seatings.forEach(s => {
    const branchKey = (s.branch || 'GENERAL').trim().toUpperCase();
    if (!branchMap.has(branchKey)) {
      branchMap.set(branchKey, {
        branch: branchKey,
        year_batch: s.year_batch || 'III Year',
        rolls: []
      });
    }
    if (s.roll_number) {
      branchMap.get(branchKey)!.rolls.push(s.roll_number.trim().toUpperCase());
    }
  });

  const reconstructedBatches: any[] = [];
  branchMap.forEach((data, branchKey) => {
    if (data.rolls.length === 0) return;

    data.rolls.sort((a, b) => {
      const pA = parseRollNumber(a);
      const pB = parseRollNumber(b);
      if (pA.prefix !== pB.prefix) return pA.prefix.localeCompare(pB.prefix);
      return pA.value - pB.value;
    });

    const startReg = data.rolls[0];
    const endReg = data.rolls[data.rolls.length - 1];
    const expectedRange = generateStudentRange(startReg, endReg);
    const rollsSet = new Set(data.rolls);
    const excludedList = expectedRange.filter(r => !rollsSet.has(r));

    reconstructedBatches.push({
      branch: branchKey,
      subject: '',
      year_batch: data.year_batch,
      start_reg: startReg,
      end_reg: endReg,
      excluded_ids: excludedList.join(', ')
    });
  });

  return reconstructedBatches;
}

// ============================================================================
// HALL SEATING PREVIEW CARD COMPONENT (UNIQUE SEATING PER HALL VIA HALL INDEX)
// ============================================================================
const HallSeatingPreviewCard: React.FC<{
  hall: any;
  hallIndex?: number;
  seatings?: any[];
  onToggleDisabledSeat?: (seatKey: string) => void;
  onDeleteHall?: () => void;
}> = ({ hall, hallIndex = 0, seatings = [], onToggleDisabledSeat, onDeleteHall }) => {
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

  const colIndices = Array.from({ length: cols }, (_, i) => cols - i);
  const rowIndices = Array.from({ length: rows }, (_, i) => rows - i);

  const getRowLetter = (r: number) => String.fromCharCode(64 + r);

  // Pre-calculate preview grid map with hallIndex offset so Hall A and Hall B have DIFFERENT roll numbers!
  const previewMap = React.useMemo(() => {
    const map = new Map<string, { roll_number: string; branch: string; grid_row: number; grid_col: number }>();
    const branchSeatsPerHall = Math.floor((rows * cols) / 2);
    let countA = hallIndex * branchSeatsPerHall;
    let countB = hallIndex * branchSeatsPerHall;

    for (let c = 1; c <= cols; c++) {
      for (let r = 1; r <= rows; r++) {
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
  }, [rows, cols, hallIndex]);

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
    <div className="bg-white text-slate-900 rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-6">
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
        <div className="flex items-center gap-4 mb-3">
          {colIndices.map((c) => (
            <div key={c} className="w-16 text-center text-xs font-bold text-slate-400">
              {c}
            </div>
          ))}
          <div className="w-6" />
        </div>

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
  const navigate = useNavigate();
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

  const [activeTab, setActiveTab] = useState<'EXAMS_LIST' | 'STUDENT_LOOKUP' | 'INVIGILATION_DUTIES'>(
    isController ? 'EXAMS_LIST' : isFaculty ? 'INVIGILATION_DUTIES' : 'STUDENT_LOOKUP'
  );

  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExamDetails, setSelectedExamDetails] = useState<any | null>(null);

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printViewMode, setPrintViewMode] = useState<'GRID_MATRIX' | 'ATTENDANCE_LIST'>('GRID_MATRIX');
  const [selectedPrintHallId, setSelectedPrintHallId] = useState<string>('ALL');

  const [searchRollNo, setSearchRollNo] = useState<string>('');
  const [mySeatResults, setMySeatResults] = useState<any[]>([]);
  const [invigilationDuties, setInvigilationDuties] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);

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

  const fetchMySeatLookup = async (queryRoll?: string) => {
    try {
      const rollParam = queryRoll !== undefined ? queryRoll : searchRollNo;
      const res = await api.get('/exam-seating/my-seat', {
        params: { roll: rollParam }
      });
      setMySeatResults(res.data.data || []);
    } catch (err: any) {
      console.error(err);
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

  const fetchFacultyList = async () => {
    try {
      const res = await api.get('/exam-seating/faculty-list');
      setFacultyList(res.data.data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAutoAssignInvigilators = async (examId?: string) => {
    try {
      setIsLoading(true);
      const res = await api.post('/exam-seating/invigilators/auto-assign', { examId });
      toast.success(res.data.message || 'Faculty invigilators auto-assigned successfully!');
      fetchInvigilationDuties();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to auto-assign invigilators');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignInvigilator = async (examId: string, hallId: string, hallName: string, facultyId: string) => {
    if (!facultyId) return;
    try {
      const res = await api.post('/exam-seating/invigilators/assign', {
        examId,
        hallId,
        hallName,
        facultyId
      });
      toast.success(res.data.message || 'Invigilator assigned successfully!');
      fetchInvigilationDuties();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to assign invigilator');
    }
  };

  const handleRemoveInvigilator = async (id: string) => {
    try {
      await api.delete(`/exam-seating/invigilators/${id}`);
      toast.success('Invigilation duty assignment removed.');
      fetchInvigilationDuties();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to remove invigilator');
    }
  };

  useEffect(() => {
    fetchExams();
    fetchMySeatLookup();
    fetchInvigilationDuties();
    fetchFacultyList();
  }, []);

  useEffect(() => {
    if (activeTab === 'INVIGILATION_DUTIES') {
      fetchInvigilationDuties();
      fetchFacultyList();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isController && !isFaculty) {
      setActiveTab('STUDENT_LOOKUP');
    }
  }, [user, isController, isFaculty]);

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

  const handleDirectPrint = () => {
    if (!selectedExamDetails) return;

    const filteredHalls = selectedExamDetails.halls.filter(
      (h: any) => selectedPrintHallId === 'ALL' || h.id === selectedPrintHallId
    );

    let hallsHtml = '';

    filteredHalls.forEach((h: any) => {
      const hallSeats = selectedExamDetails.seatings.filter(
        (s: any) => (s.hall_id && h.id && s.hall_id === h.id) || s.hall_name === h.hall_name
      );

      const hallInvigilator = invigilationDuties.find(
        (d: any) => d.exam_id === selectedExamDetails.id && (d.hall_id === h.id || d.hall_name === h.hall_name)
      );
      const invigilatorName = hallInvigilator ? hallInvigilator.faculty_name : 'Unassigned';
      const invigilatorDept = hallInvigilator ? (hallInvigilator.department || hallInvigilator.faculty_dept || '') : '';

      const rowsCount = parseInt(h.rows_count || h.rows || 6);
      const colsCount = parseInt(h.cols_count || h.cols || 4);

      let disabledArr: string[] = [];
      if (Array.isArray(h.disabled_seats_json)) {
        disabledArr = h.disabled_seats_json;
      } else if (typeof h.disabled_seats === 'string') {
        disabledArr = h.disabled_seats.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      const disabledSet = new Set<string>(disabledArr);

      const map = new Map<string, string[]>();
      hallSeats.forEach((s: any) => {
        const b = (s.branch || 'GENERAL').toUpperCase();
        if (!map.has(b)) map.set(b, []);
        if (s.roll_number) map.get(b)!.push(s.roll_number.toUpperCase());
      });

      const branchRanges: { branch: string; min: string; max: string; count: number }[] = [];
      map.forEach((rolls, branch) => {
        rolls.sort((a, b) => {
          const pA = parseRollNumber(a);
          const pB = parseRollNumber(b);
          if (pA.prefix !== pB.prefix) return pA.prefix.localeCompare(pB.prefix);
          return pA.value - pB.value;
        });
        if (rolls.length > 0) {
          branchRanges.push({
            branch,
            min: rolls[0],
            max: rolls[rolls.length - 1],
            count: rolls.length
          });
        }
      });

      const rangesHtml = branchRanges
        .map(
          (br) =>
            `<span class="range-pill"><strong>${br.branch}</strong> (${br.count}): ${br.min} &rarr; ${br.max}</span>`
        )
        .join('');

      let contentHtml = '';

      if (printViewMode === 'GRID_MATRIX') {
        let gridRowsHtml = '';

        let colHeaders = '<div class="row-label">#</div>';
        for (let c = colsCount; c >= 1; c--) {
          colHeaders += `<div class="col-header">COL ${c}</div>`;
        }
        colHeaders += '<div class="row-label">#</div>';
        gridRowsHtml += `<div class="row-container">${colHeaders}</div>`;

        for (let r = rowsCount; r >= 1; r--) {
          const rowChar = String.fromCharCode(64 + r);
          let rowHtml = `<div class="row-label">${rowChar}</div>`;

          for (let c = colsCount; c >= 1; c--) {
            const seatKey = `${r}-${c}`;
            const isBlocked = disabledSet.has(seatKey);
            const seatInfo = hallSeats.find((s: any) => s.grid_row === r && s.grid_col === c);

            if (isBlocked) {
              rowHtml += `<div class="seat-box seat-blocked">BLOCKED</div>`;
            } else if (!seatInfo) {
              rowHtml += `<div class="seat-box seat-empty">EMPTY</div>`;
            } else {
              const shortRoll =
                seatInfo.roll_number.length > 4
                  ? seatInfo.roll_number.slice(-4)
                  : seatInfo.roll_number;
              const branch = (seatInfo.branch || '').toUpperCase();
              rowHtml += `
                <div class="seat-box seat-filled">
                  <span>${shortRoll}</span>
                  <span class="seat-branch">${branch}</span>
                </div>
              `;
            }
          }

          rowHtml += `<div class="row-label">${rowChar}</div>`;
          gridRowsHtml += `<div class="row-container">${rowHtml}</div>`;
        }

        contentHtml = `
          <div class="blackboard">[ FRONT BLACKBOARD / STAGE AREA ]</div>
          <div class="grid-canvas">${gridRowsHtml}</div>
        `;
      } else {
        let tableRows = '';
        hallSeats.forEach((s: any, sIdx: number) => {
          tableRows += `
            <tr>
              <td><strong>${sIdx + 1}</strong></td>
              <td><strong>${s.seat_number || ''}</strong></td>
              <td style="font-family: monospace; font-weight: 800;">${s.roll_number || ''}</td>
              <td style="text-align: left; font-weight: 600;">${s.student_name || ''}</td>
              <td><strong>${s.branch || ''}</strong></td>
              <td></td>
              <td></td>
            </tr>
          `;
        });

        contentHtml = `
          <table class="table-list">
            <thead>
              <tr>
                <th style="width: 40px;">S.No</th>
                <th style="width: 60px;">Seat #</th>
                <th style="width: 110px;">Roll Number</th>
                <th style="text-align: left;">Student Name</th>
                <th style="width: 70px;">Branch</th>
                <th style="width: 110px;">Answer Book #</th>
                <th style="width: 130px;">Student Signature</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        `;
      }

      hallsHtml += `
        <div class="page">
          <div>
            <div class="header">
              <h1>SANSKRITHI SCHOOL OF ENGINEERING</h1>
              <p>Approved by AICTE, Affiliated to JNTUA, Anantapuramu</p>
              <p>Beedupalli Knowledge Park, Prasanthigram, Puttaparthi - 515134</p>
              <div>
                <span class="header-badge">CONTROLLER OF EXAMINATIONS — HALL DOOR SEATING CHART</span>
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-item">
                <label>Examination</label>
                <span>${selectedExamDetails.name}</span>
              </div>
              <div class="meta-item">
                <label>Date & Session</label>
                <span>${new Date(selectedExamDetails.date).toLocaleDateString()} (${selectedExamDetails.session})</span>
              </div>
              <div class="meta-item">
                <label>Timing</label>
                <span>${selectedExamDetails.time}</span>
              </div>
              <div class="meta-item">
                <label>Exam Hall</label>
                <span style="font-size: 16px; font-weight: 900; color: #000;">${h.hall_name}</span>
                <div style="font-size: 10px; color: #334155; font-weight: 800;">(${hallSeats.length} / ${h.capacity} Seated)</div>
              </div>
              <div class="meta-item">
                <label>Assigned Invigilator</label>
                <span style="font-size: 13px; font-weight: 900; color: #1e1b4b;">${invigilatorName}</span>
                <div style="font-size: 10px; color: #475569; font-weight: 700;">${invigilatorDept}</div>
              </div>
            </div>

            <div class="ranges-bar">
              <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; margin-right: 6px;">Allocated Roll Ranges:</span>
              ${rangesHtml}
            </div>

            ${contentHtml}
          </div>

          <div class="signatures">
            <div class="sig-line">
              <span style="display: block; font-weight: 900; color: #000; font-size: 12px; margin-bottom: 2px;">${invigilatorName}</span>
              Invigilator Signature & Date
            </div>
            <div class="sig-line">Exam Cell Coordinator</div>
            <div class="sig-line">Chief Superintendent & Seal</div>
          </div>
        </div>
      `;
    });

    const fullDocumentHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Exam Door Chart - ${selectedExamDetails.name}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            color: #000000;
            background: #ffffff;
            margin: 0;
            padding: 0;
          }
          .page {
            width: 100%;
            min-height: 275mm;
            padding: 14px;
            border: 2.5px solid #000000;
            margin-bottom: 20px;
            display: flex;
            flex-direction: column;
            justify-between;
            page-break-after: always;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000000;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .header h1 {
            font-size: 20px;
            font-weight: 900;
            margin: 0;
            letter-spacing: 1px;
          }
          .header p {
            font-size: 10px;
            margin: 2px 0;
            color: #334155;
            font-weight: 600;
          }
          .header-badge {
            display: inline-block;
            background: #0f172a;
            color: #ffffff;
            font-size: 10px;
            font-weight: 900;
            padding: 4px 12px;
            border-radius: 4px;
            margin-top: 6px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            padding: 10px 14px;
            background: #f8fafc;
            border: 1.5px solid #000000;
            border-radius: 6px;
            font-size: 11px;
            margin-bottom: 12px;
          }
          .meta-item label {
            font-size: 10px;
            font-weight: 800;
            color: #475569;
            text-transform: uppercase;
            display: block;
          }
          .meta-item span {
            font-weight: 900;
            color: #000000;
          }
          .ranges-bar {
            padding: 8px 14px;
            background: #f1f5f9;
            border: 1.5px solid #000000;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 800;
            margin-bottom: 14px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
          }
          .range-pill {
            padding: 4px 10px;
            background: #ffffff;
            border: 1px solid #000000;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 800;
          }
          .blackboard {
            width: 100%;
            padding: 8px;
            background: #0f172a;
            color: #ffffff;
            text-align: center;
            font-weight: 900;
            font-size: 12px;
            letter-spacing: 3px;
            border-radius: 6px;
            margin-bottom: 14px;
            border: 1.5px solid #000000;
          }
          .grid-canvas {
            padding: 14px;
            border: 1.5px solid #000000;
            border-radius: 8px;
            background: #fafafa;
            margin-bottom: 14px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .row-container {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-bottom: 8px;
            align-items: center;
          }
          .col-header {
            width: 80px;
            text-align: center;
            font-size: 12px;
            font-weight: 900;
            color: #000000;
          }
          .row-label {
            width: 28px;
            text-align: center;
            font-size: 13px;
            font-weight: 900;
            color: #000000;
          }
          .seat-box {
            width: 80px;
            height: 58px;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: monospace;
            font-weight: 900;
            font-size: 14px;
            line-height: 1.15;
          }
          .seat-blocked {
            background: #e2e8f0;
            color: #64748b;
            font-size: 10px;
            border: 1.5px solid #94a3b8;
          }
          .seat-empty {
            border: 1.5px dashed #cbd5e1;
            color: #94a3b8;
            font-size: 10px;
            background: #ffffff;
          }
          .seat-filled {
            border: 2px solid #000000;
            background: #f8fafc;
            color: #000000;
          }
          .seat-branch {
            font-size: 10px;
            font-weight: 900;
            color: #1e293b;
            margin-top: 2px;
          }
          .table-list {
            width: 100%;
            border-collapse: collapse;
            border: 2.5px solid #000000;
            font-size: 12px;
            text-align: center;
            margin-bottom: 14px;
          }
          .table-list th {
            background: #0f172a;
            color: #ffffff;
            padding: 10px;
            border: 1.5px solid #000000;
            font-weight: 900;
            font-size: 12px;
          }
          .table-list td {
            padding: 8px 6px;
            border: 1px solid #000000;
            font-size: 12px;
          }
          .signatures {
            margin-top: auto;
            padding-top: 20px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            text-align: center;
            font-size: 12px;
            font-weight: 900;
            color: #000000;
          }
          .sig-line {
            padding-top: 45px;
            border-top: 2px solid #000000;
          }
        </style>
      </head>
      <body>
        ${hallsHtml}
      </body>
      </html>
    `;

    let iframe = document.getElementById('exam-seating-print-frame') as HTMLIFrameElement;
    if (iframe) {
      document.body.removeChild(iframe);
    }
    iframe = document.createElement('iframe');
    iframe.id = 'exam-seating-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(fullDocumentHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          const win = window.open('', '_blank', 'width=900,height=1100');
          if (win) {
            win.document.write(fullDocumentHtml);
            win.document.close();
            win.focus();
            win.print();
          }
        }
      }, 300);
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
                onClick={() => navigate('/exam-seating/allocator')}
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

      {/* Navigation Tabs Bar - Hidden for students as they only access Find My Seat */}
      {(isController || isFaculty) && (
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
              onClick={() => navigate('/exam-seating/allocator')}
              className="px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer"
            >
              <Cpu className="w-4 h-4" /> Run Seating Allocator Page
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
                <button
                  onClick={() => navigate('/exam-seating/allocator')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  Go to Seating Allocator Page
                </button>
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
                      onClick={() => {
                        navigate('/exam-seating/allocator', {
                          state: {
                            copyExam: {
                              name: selectedExamDetails.name,
                              subject: selectedExamDetails.subject || '',
                              session: selectedExamDetails.session,
                              academic_year: selectedExamDetails.academic_year,
                              year_semester: selectedExamDetails.year_semester,
                              time: selectedExamDetails.time,
                              date: selectedExamDetails.date,
                              batches: (selectedExamDetails.batches && selectedExamDetails.batches.length > 0)
                                ? selectedExamDetails.batches
                                : (selectedExamDetails.batches_json && selectedExamDetails.batches_json.length > 0)
                                ? selectedExamDetails.batches_json
                                : reconstructBatchesFromSeatings(selectedExamDetails.seatings || []),
                              rooms: (selectedExamDetails.rooms && selectedExamDetails.rooms.length > 0)
                                ? selectedExamDetails.rooms
                                : (selectedExamDetails.halls || []).map((h: any) => ({
                                    hall_name: h.hall_name,
                                    rows: h.rows_count || h.rows || 6,
                                    cols: h.cols_count || h.cols || 4,
                                    fill_strategy: h.fill_strategy || 'col',
                                    prevent_adjacency: h.prevent_adjacency !== false,
                                    aisle_interval: h.aisle_interval !== undefined ? h.aisle_interval : 2,
                                    strict_flow: h.strict_flow !== false,
                                    disabled_seats: Array.isArray(h.disabled_seats_json)
                                      ? h.disabled_seats_json.join(', ')
                                      : Array.isArray(h.disabled_seats)
                                      ? h.disabled_seats.join(', ')
                                      : (h.disabled_seats || '')
                                  }))
                            }
                          }
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                      title="Copy this exam configuration to create a new exam with editable settings"
                    >
                      <Copy className="w-4 h-4" /> Copy as New Exam
                    </button>

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
                  {selectedExamDetails.halls.map((hall: any, hIdx: number) => {
                    const hallSeats = selectedExamDetails.seatings.filter((s: any) =>
                      (s.hall_id && hall.id && s.hall_id === hall.id) || (s.hall_name === hall.hall_name)
                    );

                    return (
                      <div key={hall.id || hIdx} className="space-y-3">
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

                        {/* Rendering Complete Interactive Hall Preview Card with hallIndex offset */}
                        <HallSeatingPreviewCard hall={hall} hallIndex={hIdx} seatings={hallSeats} />
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
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mx-auto flex items-center justify-center shadow-inner">
              <Search className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900">Student Exam Seat Finder</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Enter your JNTUA Roll Number to instantly find your allocated exam hall, seat number, and visual room location preview.
              </p>
            </div>

            {/* Roll Number Search Input Box */}
            <div className="relative max-w-xl mx-auto flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchRollNo}
                  onChange={(e) => setSearchRollNo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchMySeatLookup(searchRollNo)}
                  placeholder="Enter JNTUA Roll Number (e.g. 21191A0501, 22191A0402)..."
                  className="w-full pl-12 pr-10 py-3.5 rounded-2xl border-2 border-indigo-200 focus:border-indigo-600 bg-white font-bold text-sm text-slate-900 shadow-md outline-none transition-all"
                />
                {searchRollNo && (
                  <button
                    onClick={() => {
                      setSearchRollNo('');
                      fetchMySeatLookup('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => fetchMySeatLookup(searchRollNo)}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 shrink-0"
              >
                <Search className="w-4 h-4" /> Search Seat
              </button>
            </div>
          </div>

          {mySeatResults.length === 0 ? (
            <div className="p-10 bg-amber-50 border border-amber-200 rounded-3xl text-center space-y-3 shadow-xs">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="font-extrabold text-amber-900 text-base">No Allocated Seat Found</h4>
              <p className="text-xs text-amber-700 max-w-md mx-auto">
                {searchRollNo
                  ? `No seating record found for Roll Number "${searchRollNo}". Please double check your roll number or ensure your seating plan is published.`
                  : 'Enter your Roll Number in the search box above or ensure the seating plan is published by the Controller of Examinations.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {mySeatResults.map((seat) => (
                <div key={seat.id} className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6 text-slate-900">
                  {/* Top Exam Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {seat.year_semester || 'University Examination'}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 pt-1">{seat.exam_name}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Date: <strong className="text-slate-800">{new Date(seat.exam_date).toLocaleDateString()}</strong> | Time: <strong className="text-indigo-700">{seat.exam_time} ({seat.exam_session})</strong>
                      </p>
                    </div>

                    <div className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-extrabold text-base text-center shadow-md">
                      <span className="text-[9px] uppercase tracking-wider block opacity-90 font-medium">Allocated Seat</span>
                      Seat #{seat.seat_number}
                    </div>
                  </div>

                  {/* 4 Metadata Stat Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-slate-500 text-[10px] uppercase font-bold">Exam Hall</p>
                      <p className="font-black text-indigo-900 mt-1 text-base">{seat.hall_name}</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-slate-500 text-[10px] uppercase font-bold">Grid Position</p>
                      <p className="font-black text-slate-900 mt-1 text-base">Row {seat.grid_row}, Col {seat.grid_col}</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-slate-500 text-[10px] uppercase font-bold">Roll Number</p>
                      <p className="font-black text-slate-900 mt-1 font-mono text-sm">{seat.roll_number}</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-slate-500 text-[10px] uppercase font-bold">Branch</p>
                      <p className="font-black text-indigo-700 mt-1 text-sm">{seat.branch}</p>
                    </div>
                  </div>

                  {/* 2D Room Seating Grid Matrix Preview */}
                  {seat.hall_rows && seat.hall_cols && (
                    <div className="pt-6 border-t border-slate-100 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-600" />
                          Seating Location Map — Hall {seat.hall_name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            Your Seat
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                            Occupied
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
                            {seat.hall_rows} R × {seat.hall_cols} C
                          </span>
                        </div>
                      </div>

                      {/* Professional Blackboard Banner */}
                      <div className="w-full py-2 bg-slate-900 text-white rounded-xl text-center font-bold text-xs tracking-widest uppercase border border-slate-900 shadow-xs">
                        [ FRONT BLACKBOARD / INVIGILATOR DESK ]
                      </div>

                      {/* 2D Grid Canvas Wrapper */}
                      <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 overflow-x-auto space-y-3">
                        {/* Column Headers */}
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-7 text-center text-xs font-bold text-slate-400 font-mono">#</div>
                          {Array.from({ length: parseInt(seat.hall_cols) }, (_, i) => parseInt(seat.hall_cols) - i).map((c) => (
                            <div key={c} className="w-16 sm:w-20 text-center text-xs font-mono font-extrabold text-slate-700 uppercase tracking-wider">
                              COL {c}
                            </div>
                          ))}
                          <div className="w-7 text-center text-xs font-bold text-slate-400 font-mono">#</div>
                        </div>

                        {/* Rows */}
                        {Array.from({ length: parseInt(seat.hall_rows) }, (_, i) => parseInt(seat.hall_rows) - i).map((r) => (
                          <div key={r} className="flex items-center justify-center gap-3">
                            <div className="w-7 text-center text-xs font-bold text-slate-600 font-mono bg-slate-200/60 py-1 rounded border border-slate-300">
                              {String.fromCharCode(64 + r)}
                            </div>

                            {Array.from({ length: parseInt(seat.hall_cols) }, (_, i) => parseInt(seat.hall_cols) - i).map((c) => {
                              const isTargetSeat = (seat.grid_row === r && seat.grid_col === c) || (seat.roll_number && seat.hall_seatings?.some((hs: any) => hs.grid_row === r && hs.grid_col === c && hs.roll_number?.toUpperCase() === seat.roll_number?.toUpperCase()));
                              const otherSeatInfo = seat.hall_seatings?.find((hs: any) => hs.grid_row === r && hs.grid_col === c);

                              if (isTargetSeat) {
                                return (
                                  <div
                                    key={c}
                                    className="w-16 h-14 sm:w-20 sm:h-16 rounded-xl bg-emerald-600 text-white font-extrabold flex flex-col items-center justify-center text-xs leading-tight border-2 border-emerald-700 shadow-md transform scale-105"
                                  >
                                    <span className="px-1 py-0.5 rounded bg-emerald-800 text-white text-[8px] font-black tracking-wider uppercase mb-0.5">
                                      YOUR SEAT
                                    </span>
                                    <span className="font-mono text-xs font-black text-white">{seat.roll_number}</span>
                                    <span className="text-[9px] font-bold text-emerald-100">Seat #{seat.seat_number}</span>
                                  </div>
                                );
                              }

                              if (!otherSeatInfo) {
                                return (
                                  <div key={c} className="w-16 h-14 sm:w-20 sm:h-16 rounded-xl border border-dashed border-slate-300 bg-white text-slate-300 flex items-center justify-center text-[10px] font-medium">
                                    EMPTY
                                  </div>
                                );
                              }

                              return (
                                <div key={c} className="w-16 h-14 sm:w-20 sm:h-16 rounded-xl border border-slate-200 bg-white text-slate-700 flex flex-col items-center justify-center text-xs font-mono space-y-0.5 shadow-2xs">
                                  <span className="text-slate-900 font-bold text-xs">{otherSeatInfo.roll_number?.slice(-4)}</span>
                                  <span className="text-[8px] font-bold text-slate-500 uppercase">{otherSeatInfo.branch}</span>
                                </div>
                              );
                            })}

                            <div className="w-7 text-center text-xs font-bold text-slate-600 font-mono bg-slate-200/60 py-1 rounded border border-slate-300">
                              {String.fromCharCode(64 + r)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INVIGILATION DUTIES & FACULTY ALLOCATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'INVIGILATION_DUTIES' && (isFaculty || isController) && (
        <div className="space-y-8">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Published Exams</span>
                <span className="text-xl font-black text-slate-900">
                  {exams.filter((e) => e.published || e.is_published).length}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Total Faculty Members</span>
                <span className="text-xl font-black text-slate-900">{facultyList.length}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Active Invigilation Duties</span>
                <span className="text-xl font-black text-slate-900">{invigilationDuties.length}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">My Assigned Duties</span>
                <span className="text-xl font-black text-slate-900">
                  {invigilationDuties.filter((d) => d.faculty_id === user?.id).length}
                </span>
              </div>
            </div>
          </div>

          {/* CONTROLLER SECTION: ACTIVE PUBLISHED EXAMS & FACULTY ALLOCATION GRID */}
          {isController && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    Active Published Exams & Hall Invigilator Allocations
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select a faculty member from the dropdown per exam hall or auto-assign all halls automatically.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAutoAssignInvigilators()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    Auto-Assign All Faculty Invigilators
                  </button>
                  <button
                    onClick={() => {
                      fetchInvigilationDuties();
                      fetchFacultyList();
                    }}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
                    title="Refresh Data"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {exams.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700 text-sm">No Published Exams Available</h4>
                  <p className="text-xs text-slate-500">
                    Create and publish exam seating plans in the "Exam Seating Plans" tab first to allocate invigilators.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {exams.map((exam) => {
                    const examHalls = exam.halls || [];
                    const isPub = exam.published ?? exam.is_published;
                    const examDateVal = exam.date || exam.exam_date;
                    const timeSlotVal = exam.time || exam.time_slot || '09:30 AM';

                    return (
                      <div
                        key={exam.id}
                        className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
                      >
                        {/* Exam Card Header */}
                        <div className="bg-slate-900 p-5 text-white flex flex-wrap items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-black text-base tracking-wide">{exam.name}</h4>
                              <span
                                className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isPub
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {isPub ? 'PUBLISHED & ACTIVE' : 'DRAFT PLAN'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-300 font-medium">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                {examDateVal
                                  ? new Date(examDateVal).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })
                                  : 'Scheduled Exam'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                {timeSlotVal} ({exam.session || 'FN'})
                              </span>
                              <span className="flex items-center gap-1 font-semibold text-indigo-200">
                                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                                {examHalls.length} Exam Halls
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAutoAssignInvigilators(exam.id)}
                              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                            >
                              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> Auto-Assign Faculty For Exam
                            </button>
                          </div>
                        </div>

                        {/* Exam Halls List */}
                        <div className="p-5">
                          {examHalls.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No halls configured for this exam seating plan.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {examHalls.map((hall: any) => {
                                const hallId = hall.id || hall.hall_id;
                                const assignment = invigilationDuties.find(
                                  (d) =>
                                    d.exam_id === exam.id &&
                                    (d.hall_id === hallId || d.hall_name === hall.hall_name)
                                );

                                return (
                                  <div
                                    key={hallId || hall.hall_name}
                                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                                      assignment
                                        ? 'bg-indigo-50/40 border-indigo-200'
                                        : 'bg-slate-50/70 border-slate-200'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <h5 className="font-extrabold text-sm text-slate-900">
                                          {hall.hall_name || hall.name}
                                        </h5>
                                        <span className="text-[11px] text-slate-500 font-medium block">
                                          Capacity: {hall.capacity} seats
                                        </span>
                                      </div>
                                      <span
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                          assignment
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}
                                      >
                                        {assignment ? 'Assigned' : 'Vacant'}
                                      </span>
                                    </div>

                                    {/* Faculty Assignment Control */}
                                    <div className="space-y-2 pt-2 border-t border-slate-200/80">
                                      <label className="text-[11px] font-bold text-slate-700 block">
                                        Assigned Invigilator:
                                      </label>

                                      {assignment ? (
                                        <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-indigo-200 shadow-2xs">
                                          <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                              {assignment.faculty_name ? assignment.faculty_name.charAt(0).toUpperCase() : 'F'}
                                            </div>
                                            <div className="truncate">
                                              <p className="text-xs font-bold text-slate-900 truncate">
                                                {assignment.faculty_name || 'Faculty Assigned'}
                                              </p>
                                              <p className="text-[10px] text-slate-500 truncate">
                                                {assignment.faculty_email || assignment.faculty_dept || 'Invigilator'}
                                              </p>
                                            </div>
                                          </div>

                                          <button
                                            onClick={() => handleRemoveInvigilator(assignment.id)}
                                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                                            title="Unassign Duty"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ) : (
                                        <select
                                          defaultValue=""
                                          onChange={(e) => {
                                            if (e.target.value) {
                                              handleAssignInvigilator(
                                                exam.id,
                                                hallId,
                                                hall.hall_name || hall.name,
                                                e.target.value
                                              );
                                            }
                                          }}
                                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        >
                                          <option value="">-- Select Faculty Invigilator --</option>
                                          {facultyList.map((f) => (
                                            <option key={f.id} value={f.id}>
                                              {f.name} ({f.department || f.role})
                                            </option>
                                          ))}
                                        </select>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* FACULTY ROSTER OVERVIEW SECTION */}
          {isController && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    Faculty Roster & Duty Load Overview ({facultyList.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Overview of all registered faculty members and their current exam invigilation duty count.
                  </p>
                </div>
              </div>

              {facultyList.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
                  No faculty records found in database.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {facultyList.map((f) => {
                    const dutyCount = invigilationDuties.filter((d) => d.faculty_id === f.id).length;
                    return (
                      <div
                        key={f.id}
                        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3 hover:border-indigo-300 transition-all"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
                            {f.name ? f.name.charAt(0).toUpperCase() : 'F'}
                          </div>
                          <div className="truncate">
                            <h5 className="font-extrabold text-xs text-slate-900 truncate">{f.name}</h5>
                            <p className="text-[10px] text-slate-500 truncate">
                              {f.department ? `${f.department} • ` : ''}
                              {f.role}
                            </p>
                          </div>
                        </div>

                        <span className="px-3 py-1 bg-indigo-50 text-indigo-900 font-extrabold text-xs rounded-full shrink-0">
                          {dutyCount} {dutyCount === 1 ? 'Duty' : 'Duties'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* FACULTY PERSONAL ASSIGNED DUTIES SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  My Assigned Invigilation Duties
                </h3>
                <p className="text-xs text-slate-500">
                  Invigilation duties assigned to your user account for upcoming examinations.
                </p>
              </div>
            </div>

            {invigilationDuties.filter((d) => isController || d.faculty_id === user?.id).length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
                <UserCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">No Invigilation Duties Assigned</h4>
                <p className="text-xs text-slate-500">
                  Your assigned exam invigilation duties will appear here when scheduled by the Controller of Examinations.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invigilationDuties
                  .filter((d) => isController || d.faculty_id === user?.id)
                  .map((d) => (
                    <div
                      key={d.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="inline-block px-2.5 py-0.5 bg-indigo-100 text-indigo-950 font-black text-[10px] uppercase rounded-md tracking-wider">
                            OFFICIAL DUTY
                          </span>
                          <h4 className="font-extrabold text-base text-slate-900">{d.exam_name}</h4>
                          <p className="text-xs text-slate-500 font-medium">
                            {new Date(d.exam_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}{' '}
                            | {d.exam_time}
                          </p>
                        </div>
                        <span className="px-3.5 py-1.5 bg-purple-100 text-purple-950 font-black text-sm rounded-xl shadow-2xs">
                          {d.hall_name}
                        </span>
                      </div>

                      {isController && d.faculty_name && (
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
                          <Users className="w-4 h-4 text-indigo-600" /> Assigned Faculty: {d.faculty_name}
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-semibold">Hall Capacity: {d.capacity} Seats</span>
                        <button
                          onClick={() => {
                            fetchExamDetails(d.exam_id);
                            setActiveTab('EXAMS_LIST');
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                        >
                          View Live Seating Chart <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINT FORMAL EXAM DOOR CHARTS MODAL */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* PRINT FORMAL EXAM DOOR CHARTS MODAL */}
      {/* ========================================================================= */}
      {showPrintModal && selectedExamDetails && createPortal(
        <div id="print-modal-portal" className="fixed inset-0 z-[99999] flex flex-col bg-slate-950/98 backdrop-blur-2xl overflow-hidden print:bg-white print:static print:inset-auto print:overflow-visible print:h-auto print:w-full print:block">
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm;
              }
              #root, body > *:not(#print-modal-portal) {
                display: none !important;
              }
              html, body {
                background: #ffffff !important;
                color: #000000 !important;
                height: auto !important;
                min-height: 0 !important;
                overflow: visible !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              #print-modal-portal {
                display: block !important;
                position: static !important;
                width: 100% !important;
                height: auto !important;
                min-height: 0 !important;
                overflow: visible !important;
                background: #ffffff !important;
                color: #000000 !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
              }
              .print-canvas-wrapper {
                display: block !important;
                position: static !important;
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
                padding: 0 !important;
                margin: 0 !important;
                background: #ffffff !important;
              }
              #printable-door-charts {
                display: block !important;
                position: static !important;
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
              }
              .print\\:hidden {
                display: none !important;
              }
              .print-hall-page {
                page-break-after: always !important;
                break-after: page !important;
                margin-bottom: 0 !important;
                box-shadow: none !important;
                border: 2px solid #000000 !important;
                padding: 15px !important;
                background: #ffffff !important;
                color: #000000 !important;
                display: block !important;
                width: 100% !important;
                box-sizing: border-box !important;
              }
              .print-hall-page:last-child {
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
            }
          `}</style>

          {/* Top Sticky Command Header Bar (Hidden when printing) */}
          <div className="w-full bg-slate-950 border-b border-slate-800/90 p-4 sm:px-8 text-white flex flex-wrap items-center justify-between gap-4 shrink-0 print:hidden shadow-2xl relative z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <Printer className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
                  Official Exam Door Chart Preview
                </span>
                <h3 className="text-base font-black text-white">{selectedExamDetails.name}</h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setPrintViewMode('GRID_MATRIX')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    printViewMode === 'GRID_MATRIX'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  2D Door Grid Matrix
                </button>
                <button
                  type="button"
                  onClick={() => setPrintViewMode('ATTENDANCE_LIST')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    printViewMode === 'ATTENDANCE_LIST'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Desk Sign-in List
                </button>
              </div>

              {/* Hall Filter Select */}
              <select
                value={selectedPrintHallId}
                onChange={(e) => setSelectedPrintHallId(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 font-bold text-xs text-white"
              >
                <option value="ALL">All Exam Halls ({selectedExamDetails.halls.length})</option>
                {selectedExamDetails.halls.map((h: any) => (
                  <option key={h.id} value={h.id}>{h.hall_name}</option>
                ))}
              </select>

              <button
                onClick={handleDirectPrint}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/25 cursor-pointer transition-all transform hover:-translate-y-0.5"
              >
                <Printer className="w-4 h-4" /> Print Official Door Chart
              </button>

              <button
                onClick={() => setShowPrintModal(false)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                title="Close Preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Middle Scrollable Document Canvas */}
          <div className="print-canvas-wrapper flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center bg-slate-950/50 print:bg-white print:p-0 print:overflow-visible">
            <div id="printable-door-charts" className="w-full max-w-4xl space-y-12 print:max-w-none print:w-full print:m-0">
              {selectedExamDetails.halls
                .filter((h: any) => selectedPrintHallId === 'ALL' || h.id === selectedPrintHallId)
                .map((h: any, hIdx: number) => {
                  const hallSeats = selectedExamDetails.seatings.filter((s: any) =>
                    (s.hall_id && h.id && s.hall_id === h.id) || (s.hall_name === h.hall_name)
                  );

                  const hallInvigilator = invigilationDuties.find(
                    (d: any) => d.exam_id === selectedExamDetails.id && (d.hall_id === h.id || d.hall_name === h.hall_name)
                  );

                  const rowsCount = parseInt(h.rows_count || h.rows || 6);
                  const colsCount = parseInt(h.cols_count || h.cols || 4);

                  // Extract disabled seats set
                  let disabledArr: string[] = [];
                  if (Array.isArray(h.disabled_seats_json)) {
                    disabledArr = h.disabled_seats_json;
                  } else if (typeof h.disabled_seats === 'string') {
                    disabledArr = h.disabled_seats.split(',').map((s: string) => s.trim()).filter(Boolean);
                  }
                  const disabledSet = new Set<string>(disabledArr);

                  // Group summary ranges per branch
                  const branchRanges = (() => {
                    const map = new Map<string, string[]>();
                    hallSeats.forEach((s: any) => {
                      const b = (s.branch || 'GENERAL').toUpperCase();
                      if (!map.has(b)) map.set(b, []);
                      if (s.roll_number) map.get(b)!.push(s.roll_number.toUpperCase());
                    });

                    const list: { branch: string; min: string; max: string; count: number }[] = [];
                    map.forEach((rolls, branch) => {
                      rolls.sort((a, b) => {
                        const pA = parseRollNumber(a);
                        const pB = parseRollNumber(b);
                        if (pA.prefix !== pB.prefix) return pA.prefix.localeCompare(pB.prefix);
                        return pA.value - pB.value;
                      });
                      if (rolls.length > 0) {
                        list.push({
                          branch,
                          min: rolls[0],
                          max: rolls[rolls.length - 1],
                          count: rolls.length
                        });
                      }
                    });
                    return list;
                  })();

                  return (
                    <div key={h.id || hIdx} className="print-hall-page min-h-[265mm] flex flex-col justify-between space-y-6 p-8 border-2 border-slate-900 rounded-2xl bg-white text-slate-900 shadow-xl">
                      <div>
                        {/* Official Letterhead Header */}
                        <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
                          <div className="flex items-center justify-center gap-3">
                            <GraduationCap className="w-9 h-9 text-indigo-900" />
                            <h1 className="text-2xl font-black tracking-wider uppercase text-slate-900">SANSKRITHI SCHOOL OF ENGINEERING</h1>
                          </div>
                          <p className="text-xs text-slate-700 font-semibold">Approved by AICTE, Affiliated to JNTUA, Anantapuramu</p>
                          <p className="text-[11px] text-slate-600 font-medium">Beedupalli Knowledge Park, Prasanthigram, Puttaparthi - 515134</p>
                          <div className="pt-2">
                            <span className="px-5 py-1.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-md inline-block print:bg-slate-100 print:text-black print:border print:border-black">
                              CONTROLLER OF EXAMINATIONS — HALL DOOR SEATING CHART
                            </span>
                          </div>
                        </div>

                        {/* Exam Metadata Summary 5-Column Card */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 mt-4 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Examination</span>
                            <span className="font-extrabold text-slate-900 text-sm">{selectedExamDetails.name}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Date & Session</span>
                            <span className="font-extrabold text-slate-900 text-sm">{new Date(selectedExamDetails.date).toLocaleDateString()} ({selectedExamDetails.session})</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Timing</span>
                            <span className="font-extrabold text-slate-900 text-sm">{selectedExamDetails.time}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Exam Hall</span>
                            <span className="font-black text-slate-950 text-sm block">{h.hall_name}</span>
                            <span className="text-[10px] text-slate-600 block font-bold">({hallSeats.length} / {h.capacity} Seated)</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-indigo-700 uppercase block">Assigned Invigilator</span>
                            <span className="font-black text-indigo-950 text-sm block">
                              {hallInvigilator ? hallInvigilator.faculty_name : 'Unassigned'}
                            </span>
                            {hallInvigilator && (
                              <span className="text-[10px] text-indigo-800 font-semibold block">{hallInvigilator.department || ''}</span>
                            )}
                          </div>
                        </div>

                        {/* Branch Range Summary Pills */}
                        <div className="flex flex-wrap items-center gap-2 p-3 mt-4 bg-indigo-50/70 border-2 border-slate-900 rounded-xl text-xs font-bold">
                          <span className="text-xs font-black uppercase text-indigo-950 mr-1">Allocated Roll Ranges:</span>
                          {branchRanges.map((br) => (
                            <span key={br.branch} className="px-3 py-1 bg-white border border-slate-800 text-indigo-950 rounded-lg text-xs font-extrabold shadow-2xs">
                              <strong className="text-indigo-700">{br.branch}</strong> ({br.count}): {br.min} → {br.max}
                            </span>
                          ))}
                        </div>

                        {/* MODE 1: VISUAL 2D DOOR MATRIX VIEW */}
                        {printViewMode === 'GRID_MATRIX' && (
                          <div className="space-y-4 pt-4">
                            {/* BLACKBOARD / STAGE BANNER */}
                            <div className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-center font-black text-xs tracking-widest uppercase border-2 border-slate-900 shadow-xs">
                              [ FRONT BLACKBOARD / STAGE AREA ]
                            </div>

                            {/* 2D Grid Canvas */}
                            <div className="p-5 border-2 border-slate-900 rounded-xl bg-slate-50/50 space-y-4 overflow-x-auto">
                              {/* Column Numbers Header */}
                              <div className="flex items-center justify-center gap-3">
                                <div className="w-7 text-center text-xs font-bold text-slate-400">#</div>
                                {Array.from({ length: colsCount }, (_, i) => colsCount - i).map((c) => (
                                  <div key={c} className="w-20 text-center text-xs font-black text-slate-900 font-mono">
                                    COL {c}
                                  </div>
                                ))}
                                <div className="w-7 text-center text-xs font-bold text-slate-400">#</div>
                              </div>

                              {/* Rows Matrix */}
                              {Array.from({ length: rowsCount }, (_, i) => rowsCount - i).map((r) => (
                                <div key={r} className="flex items-center justify-center gap-3">
                                  <div className="w-7 text-center text-xs font-black text-slate-900">
                                    {String.fromCharCode(64 + r)}
                                  </div>

                                  {Array.from({ length: colsCount }, (_, i) => colsCount - i).map((c) => {
                                    const seatKey = `${r}-${c}`;
                                    const isBlocked = disabledSet.has(seatKey);
                                    const seatInfo = hallSeats.find((s: any) => s.grid_row === r && s.grid_col === c);

                                    if (isBlocked) {
                                      return (
                                        <div
                                          key={c}
                                          className="w-20 h-14 rounded-xl bg-slate-200 border-2 border-slate-300 text-slate-500 flex items-center justify-center text-xs font-bold"
                                        >
                                          BLOCKED
                                        </div>
                                      );
                                    }

                                    if (!seatInfo) {
                                      return (
                                        <div
                                          key={c}
                                          className="w-20 h-14 rounded-xl border-2 border-dashed border-slate-300 bg-white text-slate-400 flex items-center justify-center text-xs font-semibold"
                                        >
                                          EMPTY
                                        </div>
                                      );
                                    }

                                    const branch = (seatInfo.branch || '').toUpperCase();
                                    let badgeStyle = 'border-2 border-blue-600 text-blue-950 bg-blue-50';
                                    if (branch.includes('ECE')) badgeStyle = 'border-2 border-emerald-600 text-emerald-950 bg-emerald-50';
                                    else if (branch.includes('EEE')) badgeStyle = 'border-2 border-purple-600 text-purple-950 bg-purple-50';
                                    else if (branch.includes('MECH')) badgeStyle = 'border-2 border-amber-600 text-amber-950 bg-amber-50';
                                    else if (branch.includes('CIVIL')) badgeStyle = 'border-2 border-rose-600 text-rose-950 bg-rose-50';

                                    const shortRoll = seatInfo.roll_number.length > 4 ? seatInfo.roll_number.slice(-4) : seatInfo.roll_number;

                                    return (
                                      <div
                                        key={c}
                                        className={`w-20 h-14 rounded-xl ${badgeStyle} flex flex-col items-center justify-center font-black font-mono text-xs leading-snug shadow-2xs`}
                                      >
                                        <span className="text-slate-900 tracking-tight text-sm">{shortRoll}</span>
                                        <span className="text-[9px] font-black uppercase opacity-90">{branch}</span>
                                      </div>
                                    );
                                  })}

                                  <div className="w-7 text-center text-xs font-black text-slate-900">
                                    {String.fromCharCode(64 + r)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* MODE 2: FORMAL ATTENDANCE DESK SIGN-IN LIST */}
                      {printViewMode === 'ATTENDANCE_LIST' && (
                        <div className="space-y-4 pt-2">
                          <table className="w-full border-collapse border-2 border-slate-900 text-xs text-center">
                            <thead>
                              <tr className="bg-slate-900 text-white font-black print:bg-slate-100 print:text-black">
                                <th className="border border-slate-900 p-2 w-10 print:border-black print:text-black">S.No</th>
                                <th className="border border-slate-900 p-2 w-16 print:border-black print:text-black">Seat #</th>
                                <th className="border border-slate-900 p-2 w-28 print:border-black print:text-black">Roll Number</th>
                                <th className="border border-slate-900 p-2 text-left print:border-black print:text-black">Student Name</th>
                                <th className="border border-slate-900 p-2 w-20 print:border-black print:text-black">Branch</th>
                                <th className="border border-slate-900 p-2 w-28 print:border-black print:text-black">Answer Book #</th>
                                <th className="border border-slate-900 p-2 w-32 print:border-black print:text-black">Student Signature</th>
                              </tr>
                            </thead>
                            <tbody>
                              {hallSeats.map((s: any, sIdx: number) => (
                                <tr key={s.id || sIdx} className="border-b border-slate-400 font-medium">
                                  <td className="border border-slate-400 p-2 font-bold">{sIdx + 1}</td>
                                  <td className="border border-slate-400 p-2 font-bold">{s.seat_number}</td>
                                  <td className="border border-slate-400 p-2 font-mono font-bold text-slate-950">{s.roll_number}</td>
                                  <td className="border border-slate-400 p-2 text-left font-semibold">{s.student_name}</td>
                                  <td className="border border-slate-400 p-2 font-black">{s.branch}</td>
                                  <td className="border border-slate-400 p-2"></td>
                                  <td className="border border-slate-400 p-2"></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Official Signatures Block at Bottom of Page */}
                      <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs font-extrabold text-slate-900">
                        <div className="pt-10 border-t border-slate-400 space-y-1">
                          <span className="block font-black text-slate-950 text-xs">
                            {hallInvigilator ? hallInvigilator.faculty_name : 'Invigilator Signature'}
                          </span>
                          <span className="text-[10px] text-slate-600 font-bold block">Invigilator Signature & Date</span>
                        </div>
                        <div className="pt-10 border-t border-slate-400">
                          <span>Exam Cell Coordinator</span>
                        </div>
                        <div className="pt-10 border-t border-slate-400">
                          <span>Chief Superintendent & Seal</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
