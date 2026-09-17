import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Cpu,
  ArrowLeft,
  Calendar,
  Users,
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Printer,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';

// JNTUA Alphanumeric Roll Number Generator
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
// HALL SEATING PREVIEW CARD COMPONENT
// ============================================================================
const HallSeatingPreviewCard: React.FC<{
  hall: any;
  hallIndex?: number;
  batchesList?: any[];
  onToggleDisabledSeat?: (seatKey: string) => void;
  onDeleteHall?: () => void;
}> = ({ hall, hallIndex = 0, batchesList = [], onToggleDisabledSeat, onDeleteHall }) => {
  const [isBlockModeActive, setIsBlockModeActive] = useState(false);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');

  const rows = parseInt(hall.rows_count || hall.rows || 6);
  const cols = parseInt(hall.cols_count || hall.cols || 4);

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

  const previewMap = React.useMemo(() => {
    const map = new Map<string, { roll_number: string; branch: string; grid_row: number; grid_col: number }>();

    // 1. Build queues for ALL branches in batchesList
    const batchQueues: { branch: string; students: string[] }[] = [];

    if (batchesList && batchesList.length > 0) {
      batchesList.forEach((b) => {
        const branchName = (b.branch || 'BRANCH').trim().toUpperCase();
        const fullRange = generateStudentRange(b.start_reg, b.end_reg);
        const exclSet = new Set(
          (b.excluded_ids || '')
            .split(',')
            .map((s: string) => s.trim().toUpperCase())
            .filter(Boolean)
        );
        const validList = fullRange.filter((r) => !exclSet.has(r));
        if (validList.length > 0) {
          batchQueues.push({
            branch: branchName,
            students: [...validList]
          });
        }
      });
    }

    // Fallback default queues if user hasn't added batches yet
    if (batchQueues.length === 0) {
      batchQueues.push(
        { branch: 'CSE', students: Array.from({ length: 60 }, (_, i) => `21121A05${(i + 1).toString().padStart(2, '0')}`) },
        { branch: 'ECE', students: Array.from({ length: 60 }, (_, i) => `21121A04${(i + 1).toString().padStart(2, '0')}`) }
      );
    }

    // Initialize Double-Branch Alternating seating slots
    let activeBatch1: number | null = null;
    let activeBatch2: number | null = null;

    for (let i = 0; i < batchQueues.length; i++) {
      if (batchQueues[i] && batchQueues[i].students.length > 0) {
        activeBatch1 = i;
        break;
      }
    }

    for (let i = 0; i < batchQueues.length; i++) {
      if (i !== activeBatch1 && batchQueues[i] && batchQueues[i].students.length > 0) {
        activeBatch2 = i;
        break;
      }
    }

    // 2. Simulate room-by-room seating allocation up to hallIndex
    for (let h = 0; h <= hallIndex; h++) {
      const isTargetHall = h === hallIndex;
      const gridAllocatedBranches: { [key: string]: string } = {};

      for (let c = 1; c <= cols; c++) {
        for (let r = 1; r <= rows; r++) {
          const seatKey = `${r}-${c}`;
          if (disabledSet.has(seatKey)) continue;

          const leftBranch = gridAllocatedBranches[`${r}-${c - 1}`];
          const topBranch = gridAllocatedBranches[`${r - 1}-${c}`];

          const blockedBatches = new Set<number>();
          batchQueues.forEach((q, idx) => {
            if (leftBranch && q.branch === leftBranch) {
              blockedBatches.add(idx);
            }
            if (topBranch && q.branch === topBranch) {
              blockedBatches.add(idx);
            }
          });

          // Ensure activeBatch1 has students, or find next in branch order
          if (activeBatch1 !== null && batchQueues[activeBatch1].students.length === 0) {
            let nextBatch: number | null = null;
            for (let i = 0; i < batchQueues.length; i++) {
              if (i !== activeBatch2 && batchQueues[i] && batchQueues[i].students.length > 0) {
                nextBatch = i;
                break;
              }
            }
            activeBatch1 = nextBatch;
          }

          // Ensure activeBatch2 has students, or find next in branch order
          if (activeBatch2 !== null && batchQueues[activeBatch2].students.length === 0) {
            let nextBatch: number | null = null;
            for (let i = 0; i < batchQueues.length; i++) {
              if (i !== activeBatch1 && batchQueues[i] && batchQueues[i].students.length > 0) {
                nextBatch = i;
                break;
              }
            }
            activeBatch2 = nextBatch;
          }

          let chosenBatch: number | null = null;
          const preferredSlot = (r + c) % 2 === 0 ? 1 : 2;

          if (preferredSlot === 1) {
            if (activeBatch1 !== null && batchQueues[activeBatch1].students.length > 0 && !blockedBatches.has(activeBatch1)) {
              chosenBatch = activeBatch1;
            } else if (activeBatch2 !== null && batchQueues[activeBatch2].students.length > 0 && !blockedBatches.has(activeBatch2)) {
              chosenBatch = activeBatch2;
            }
          } else {
            if (activeBatch2 !== null && batchQueues[activeBatch2].students.length > 0 && !blockedBatches.has(activeBatch2)) {
              chosenBatch = activeBatch2;
            } else if (activeBatch1 !== null && batchQueues[activeBatch1].students.length > 0 && !blockedBatches.has(activeBatch1)) {
              chosenBatch = activeBatch1;
            }
          }

          if (chosenBatch !== null) {
            const q = batchQueues[chosenBatch];
            const roll = q.students.shift()!;
            gridAllocatedBranches[seatKey] = q.branch;

            if (isTargetHall) {
              map.set(seatKey, {
                roll_number: roll,
                branch: q.branch,
                grid_row: r,
                grid_col: c
              });
            }
          }
        }
      }
    }

    return map;
  }, [rows, cols, hallIndex, batchesList, disabledSet]);

  return (
    <div className="bg-white text-slate-900 rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-6">
      {/* Top Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
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
                const seatInfo = previewMap.get(seatKey);

                if (isBlocked) {
                  return (
                    <div
                      key={c}
                      onClick={() => onToggleDisabledSeat && onToggleDisabledSeat(seatKey)}
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
                      onClick={() => onToggleDisabledSeat && onToggleDisabledSeat(seatKey)}
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
                    onClick={() => onToggleDisabledSeat && onToggleDisabledSeat(seatKey)}
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

        {/* SCREEN / STAGE 3D TRAPEZOID BANNER */}
        <div className="mt-8 mb-2 w-full flex flex-col items-center">
          <div className="relative w-full max-w-lg h-11 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-sky-100/90 border-t-4 border-sky-400 rounded-xl shadow-sm"
              style={{
                perspective: '500px',
                transform: 'rotateX(20deg) scale(0.95)',
                boxShadow: '0 10px 20px -5px rgba(14, 165, 233, 0.15)'
              }}
            ></div>
            <span className="relative z-10 text-[10px] font-black text-sky-600 uppercase tracking-[0.3em]">
              SCREEN / STAGE
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Branch Legends Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] font-bold text-slate-500">
        {(() => {
          const activeBranches = Array.from(
            new Set(
              (batchesList && batchesList.length > 0
                ? batchesList.map((b) => (b.branch || '').trim().toUpperCase()).filter(Boolean)
                : ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'])
            )
          );

          const getBadgeStyle = (bName: string) => {
            const b = bName.toUpperCase();
            if (b.includes('CSE')) return 'border-2 border-blue-500 text-blue-800 bg-white';
            if (b.includes('ECE')) return 'border-2 border-emerald-500 text-emerald-800 bg-white';
            if (b.includes('EEE')) return 'border-2 border-purple-500 text-purple-800 bg-white';
            if (b.includes('MECH')) return 'border-2 border-amber-500 text-amber-800 bg-white';
            if (b.includes('CIVIL')) return 'border-2 border-rose-500 text-rose-800 bg-white';
            if (b.includes('IT')) return 'border-2 border-cyan-500 text-cyan-800 bg-white';
            if (b.includes('AI')) return 'border-2 border-indigo-500 text-indigo-800 bg-white';
            return 'border-2 border-teal-500 text-teal-800 bg-white';
          };

          return (
            <>
              {activeBranches.map((bName) => (
                <span key={bName} className={`px-3 py-1 rounded-xl font-black ${getBadgeStyle(bName)}`}>
                  {bName}
                </span>
              ))}
              <span className="px-3 py-1 rounded-xl border-2 border-slate-200 text-slate-400 bg-white font-bold">EMPTY</span>
              <span className="px-3 py-1 rounded-xl bg-slate-200 border-2 border-slate-300 text-slate-500 font-bold">BLOCKED</span>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export const SeatingAllocatorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const specialRole = (user?.special_role || user?.specialRole || '').toUpperCase();
  const userRole = (user?.role || '').toUpperCase();

  const isController =
    userRole === 'SUPER_ADMIN' ||
    userRole === 'ADMIN' ||
    specialRole.includes('CONTROLLER') ||
    specialRole.includes('EXAM');

  const [selectedPreviewHallIdx, setSelectedPreviewHallIdx] = useState(0);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);

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

  // Load passed template or copied exam configuration if present
  useEffect(() => {
    if (location.state?.copyExam) {
      const src = location.state.copyExam;
      const newCode = `EXAM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const baseName = (src.name || 'JNTUA Exam').replace(/\s*\(\s*Copy.*?\)/gi, '');

      setExamForm({
        name: `${baseName} (Copy)`,
        subject: src.subject || '',
        exam_code: newCode,
        date: src.date ? new Date(src.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        time: src.time || '10:00 AM - 01:00 PM',
        session: src.session || 'FN',
        academic_year: src.academic_year || '2026',
        year_semester: src.year_semester || 'III B.Tech I Sem'
      });

      let activeBatches = src.batches;
      if (!Array.isArray(activeBatches) || activeBatches.length === 0) {
        if (src.seatings && Array.isArray(src.seatings) && src.seatings.length > 0) {
          activeBatches = reconstructBatchesFromSeatings(src.seatings);
        }
      }

      if (Array.isArray(activeBatches) && activeBatches.length > 0) {
        setBatchesList(activeBatches.map((b: any) => ({
          branch: b.branch || 'CSE',
          subject: b.subject || '',
          year_batch: b.year_batch || b.year || 'III Year',
          start_reg: b.start_reg || '',
          end_reg: b.end_reg || '',
          excluded_ids: Array.isArray(b.excluded_ids)
            ? b.excluded_ids.join(', ')
            : (b.excluded_ids || '')
        })));
      }
      if (src.rooms && Array.isArray(src.rooms) && src.rooms.length > 0) {
        setRoomsList(src.rooms.map((r: any) => ({
          hall_name: r.hall_name || r.name || 'Hall A',
          rows: r.rows_count || r.rows || 6,
          cols: r.cols_count || r.cols || 4,
          fill_strategy: r.fill_strategy || 'col',
          prevent_adjacency: r.prevent_adjacency !== false,
          aisle_interval: r.aisle_interval !== undefined ? r.aisle_interval : 2,
          strict_flow: r.strict_flow !== false,
          disabled_seats: Array.isArray(r.disabled_seats_json)
            ? r.disabled_seats_json.join(', ')
            : Array.isArray(r.disabled_seats)
            ? r.disabled_seats.join(', ')
            : (r.disabled_seats || '')
        })));
      }

      toast.info('Copied all exam settings & halls into a new draft! Adjust details and run seating engine.', {
        icon: <Copy className="w-5 h-5 text-indigo-500" />
      });
    }
  }, [location.state]);

  // Duplicate current exam configuration into a new exam draft
  const handleCopyExamConfig = () => {
    const newCode = `EXAM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const baseName = examForm.name.replace(/\s*\(\s*Copy.*?\)/gi, '');
    const newName = `${baseName} (Copy ${Math.floor(100 + Math.random() * 900)})`;

    setExamForm(prev => ({
      ...prev,
      name: newName,
      exam_code: newCode
    }));

    toast.success('Exam configuration copied into a new draft!', {
      description: `New Exam Code: ${newCode}. You can now make changes and run allocation for a new exam.`,
      icon: <Copy className="w-5 h-5 text-indigo-500" />
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isController) {
    return (
      <div className="p-8 text-center space-y-4">
        <h3 className="text-xl font-bold text-rose-600">Access Denied</h3>
        <p className="text-sm text-slate-500">Only the Controller of Examinations or Super Admin can access the Seating Allocator Page.</p>
        <button
          onClick={() => navigate('/exam-seating')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs"
        >
          Return to Exam Seating
        </button>
      </div>
    );
  }

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
      navigate('/exam-seating');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to allocate exam seating');
    } finally {
      setIsSubmittingExam(false);
    }
  };

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
    <div className="min-h-screen bg-slate-50/80 w-full p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest">
              <Cpu className="w-3.5 h-3.5" /> Anti-Cheating Allocation Engine v2.0
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Configure Exam & Seating Allocator</h1>
            <p className="text-xs text-slate-500">Dedicated Seating Matrix Setup & Custom Anti-Cheating Rules</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopyExamConfig}
              className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer border border-indigo-200"
              title="Duplicate this exam configuration into a new draft to quickly make changes"
            >
              <Copy className="w-4 h-4" /> Copy as New Exam
            </button>

            <button
              type="button"
              onClick={() => navigate('/exam-seating')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Exam Plans
            </button>
          </div>
        </div>

        {/* 7-Step Algorithm Breakdown Cards */}
        <div className="space-y-3">
          <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Multi-Stage Allocation Algorithm Breakdown:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-1">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black inline-flex items-center justify-center">1</span>
              <p className="text-[11px] font-bold text-indigo-950">Student Queue</p>
              <p className="text-[9px] text-indigo-700">JNTUA Alphanumeric</p>
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
              <p className="text-[9px] text-emerald-700">Same Branch/Paper</p>
            </div>

            <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-2xl space-y-1">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black inline-flex items-center justify-center">6</span>
              <p className="text-[11px] font-bold text-rose-950">Checkerboard</p>
              <p className="text-[9px] text-rose-700">(r+c)%2 Parity Slot</p>
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

          {/* Hall Setup Cards (2 Columns Grid View) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roomsList.map((room, idx) => (
              <div key={idx} className="p-5 bg-slate-50/70 border border-slate-200 rounded-3xl space-y-4 shadow-2xs">
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
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Rows x Cols</label>
                    <div className="flex items-center gap-1.5">
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
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-[11px]"
                    >
                      <option value="col">Column-Wise</option>
                      <option value="row">Row-Wise</option>
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
                        title="Remove Hall"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

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
                hallIndex={selectedPreviewHallIdx}
                batchesList={batchesList}
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
              onClick={handleCopyExamConfig}
              className="px-5 py-3 rounded-xl font-bold text-xs text-indigo-300 hover:text-white hover:bg-white/10 border border-indigo-500/30 flex items-center gap-2 cursor-pointer transition-colors"
              title="Duplicate this exam configuration into a new draft to quickly make changes"
            >
              <Copy className="w-4 h-4 text-indigo-400" /> Duplicate Config
            </button>

            <button
              type="button"
              onClick={() => navigate('/exam-seating')}
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
    </div>
  );
};
