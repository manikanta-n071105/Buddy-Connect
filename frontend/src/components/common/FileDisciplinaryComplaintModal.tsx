import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  AlertTriangle, X, ShieldAlert, Clock, Smartphone, Scissors, 
  CreditCard, UserX, FileWarning, CheckCircle2, Shield, Sparkles, TrendingUp, Search
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

interface TargetStudent {
  id: string;
  name: string;
  email?: string;
  username?: string;
  role?: string;
}

interface FileDisciplinaryComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStudent: TargetStudent | null;
  onComplaintSubmitted?: () => void;
}

const COMPLAINT_TYPES = [
  { key: 'LATE_COMER', label: 'Late Comer / Delayed Arrival', icon: Clock, baseSeverity: 'LOW', description: 'Arriving late to classes, labs, or morning assembly' },
  { key: 'UNIFORM_VIOLATION', label: 'No Proper Uniform', icon: UserX, baseSeverity: 'LOW', description: 'Improper dress code, wrong shoes, or unapproved attire' },
  { key: 'IMPROPER_BEARD_HAIRCUT', label: 'Improper Beard / Haircut', icon: Scissors, baseSeverity: 'LOW', description: 'Ungroomed beard, styled/long haircut breaking policy' },
  { key: 'ID_CARD_MISSING', label: 'Missing Student ID Card', icon: CreditCard, baseSeverity: 'LOW', description: 'Not wearing or carrying official college identity tag' },
  { key: 'MOBILE_USAGE', label: 'Mobile Phone Violation', icon: Smartphone, baseSeverity: 'MEDIUM', description: 'Using mobile phones during lectures, labs, or exams' },
  { key: 'MISBEHAVIOR', label: 'Misbehavior / Indiscipline', icon: AlertTriangle, baseSeverity: 'HIGH', description: 'Rough behavior, disrespect to faculty, or disturbance' },
  { key: 'OTHER', label: 'Other Conduct Violation', icon: FileWarning, baseSeverity: 'MEDIUM', description: 'Any other general campus regulation infraction' },
];

export const FileDisciplinaryComplaintModal: React.FC<FileDisciplinaryComplaintModalProps> = ({
  isOpen,
  onClose,
  targetStudent: initialTargetStudent,
  onComplaintSubmitted,
}) => {
  const [selectedStudent, setSelectedStudent] = useState<TargetStudent | null>(initialTargetStudent);
  const [allStudentsList, setAllStudentsList] = useState<TargetStudent[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const [complaintType, setComplaintType] = useState('LATE_COMER');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousComplaintsCount, setPreviousComplaintsCount] = useState<number>(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    setSelectedStudent(initialTargetStudent);
  }, [initialTargetStudent, isOpen]);

  // If initial target student is null, load list of all students for selection
  useEffect(() => {
    if (isOpen && !initialTargetStudent) {
      setIsLoadingStudents(true);
      api.get('/users')
        .then((res) => {
          const list = (res.data.data || []).filter((u: any) => ['JUNIOR', 'SENIOR'].includes(u.role));
          setAllStudentsList(list);
          if (list.length > 0 && !selectedStudent) {
            setSelectedStudent(list[0]);
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setIsLoadingStudents(false));
    }
  }, [isOpen, initialTargetStudent]);

  // Fetch student's prior infractions count to calculate offense number & repetition escalation
  useEffect(() => {
    if (isOpen && selectedStudent?.id) {
      setIsLoadingHistory(true);
      api.get(`/users/disciplinary-complaints/student/${selectedStudent.id}`)
        .then((res) => {
          const complaints = res.data.data || [];
          setPreviousComplaintsCount(complaints.length);
        })
        .catch((e) => console.error(e))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [isOpen, selectedStudent?.id]);

  // Intelligent severity auto-calculation based on selected type and repetition count
  useEffect(() => {
    const selected = COMPLAINT_TYPES.find((t) => t.key === complaintType);
    const baseSev = (selected?.baseSeverity || 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    const offenseNum = previousComplaintsCount + 1;

    let computed: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = baseSev;
    if (offenseNum === 2) {
      computed = baseSev === 'LOW' ? 'MEDIUM' : baseSev === 'MEDIUM' ? 'HIGH' : 'CRITICAL';
    } else if (offenseNum === 3) {
      computed = baseSev === 'LOW' ? 'HIGH' : 'CRITICAL';
    } else if (offenseNum >= 4) {
      computed = 'CRITICAL';
    }

    setSeverity(computed);
  }, [complaintType, previousComplaintsCount]);

  if (!isOpen) return null;

  const offenseNumber = previousComplaintsCount + 1;
  const offenseOrdinal =
    offenseNumber === 1 ? '1st Offense' :
    offenseNumber === 2 ? '2nd Repeat Offense' :
    offenseNumber === 3 ? '3rd Repeat Offense' :
    `${offenseNumber}th Repeat Offense`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error('Please select a target student to report');
      return;
    }
    if (!complaintType) {
      toast.error('Please select an infraction complaint type');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/users/disciplinary-complaints', {
        studentUserId: selectedStudent.id,
        complaintType,
        severity,
        description: description.trim(),
        actionTaken: actionTaken.trim(),
      });

      toast.success(res.data.message || `Disciplinary complaint recorded against ${selectedStudent.name}!`);
      setDescription('');
      setActionTaken('');
      onComplaintSubmitted?.();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to file disciplinary complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = allStudentsList.filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.username && s.username.toLowerCase().includes(q)) || (s.email && s.email.toLowerCase().includes(q));
  });

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                File Student Conduct Violation
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Record student conduct infractions for committee review.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Selector if not pre-selected */}
        {!initialTargetStudent ? (
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="block text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
              Select Target Student *
            </label>
            {isLoadingStudents ? (
              <p className="text-slate-500 italic text-xs">Loading students list...</p>
            ) : (
              <select
                value={selectedStudent?.id || ''}
                onChange={(e) => {
                  const found = allStudentsList.find((s) => s.id === e.target.value);
                  if (found) setSelectedStudent(found);
                }}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-rose-500/20 cursor-pointer"
              >
                {filteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (@{s.username}) - {s.role} [{s.email}]
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-rose-950">Target Student:</span>
            <span className="text-xs font-black text-slate-900">{selectedStudent?.name} (@{selectedStudent?.username})</span>
          </div>
        )}

        {/* Smart Repetition & Escalation Alert Banner */}
        {selectedStudent && (
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
            offenseNumber >= 3
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : offenseNumber === 2
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <TrendingUp className={`w-4 h-4 shrink-0 mt-0.5 ${
              offenseNumber >= 3 ? 'text-rose-600' : offenseNumber === 2 ? 'text-amber-600' : 'text-slate-500'
            }`} />
            <div className="text-[11px] leading-tight font-medium">
              <span className="font-extrabold">Infraction Frequency: </span>
              <span className="font-black text-slate-950">{offenseOrdinal}</span>
              {previousComplaintsCount > 0 ? (
                <span className="block text-[10px] opacity-90 mt-0.5 font-semibold">
                  ⚠️ Student has {previousComplaintsCount} prior recorded infraction{previousComplaintsCount > 1 ? 's' : ''}. Severity auto-escalated based on repetition.
                </span>
              ) : (
                <span className="block text-[10px] opacity-75 mt-0.5">
                  First recorded infraction for this student. Default severity applied.
                </span>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Infraction Category Selector */}
          <div className="space-y-1.5">
            <label className="block text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
              Select Violation Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50">
              {COMPLAINT_TYPES.map((type) => {
                const IconComponent = type.icon;
                const isSelected = complaintType === type.key;
                return (
                  <div
                    key={type.key}
                    onClick={() => setComplaintType(type.key)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-xs ring-2 ring-rose-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-[11px] leading-tight truncate">{type.label}</p>
                      <p className="text-[9px] text-slate-500 font-medium leading-tight mt-0.5 line-clamp-1">
                        {type.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Severity Level */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                Infraction Severity Level
              </label>
              <span className="text-[10px] font-bold text-rose-600">Auto-calculated: {severity}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { key: 'LOW', label: 'Notice', color: 'bg-slate-100 text-slate-700 border-slate-300' },
                { key: 'MEDIUM', label: 'Warning', color: 'bg-amber-100 text-amber-900 border-amber-300' },
                { key: 'HIGH', label: 'Serious', color: 'bg-orange-100 text-orange-900 border-orange-300' },
                { key: 'CRITICAL', label: 'Critical', color: 'bg-rose-100 text-rose-900 border-rose-300' },
              ].map((sev) => (
                <button
                  type="button"
                  key={sev.key}
                  onClick={() => setSeverity(sev.key as any)}
                  className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                    severity === sev.key
                      ? 'ring-2 ring-rose-500 shadow-xs scale-102 ' + sev.color
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {sev.label}
                </button>
              ))}
            </div>
          </div>

          {/* Incident Remarks */}
          <div className="space-y-1">
            <label className="block text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
              Infraction Details & Remarks
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Student arrived 25 minutes late without proper uniform shoes and ID card..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-hidden transition-all"
            />
          </div>

          {/* Action Taken / Immediate Warning */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                Action Taken / Warning Issued
              </label>
              <span className="text-[10px] text-slate-400 font-bold">Quick Presets:</span>
            </div>
            <input
              type="text"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="e.g. Verbal warning issued; Parent notified regarding repeated lateness."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-hidden transition-all"
            />
            {/* Clickable Quick Recommended Action Chips */}
            <div className="flex flex-wrap gap-1 pt-1">
              {(offenseNumber === 1 ? [
                'Verbal warning issued; Undertaking signed.',
                'Student briefed on campus conduct rules.'
              ] : offenseNumber === 2 ? [
                '⚠️ 2nd Offense: Telephonic parent advisory issued.',
                'Mandatory dress code & punctuality pledge signed.'
              ] : offenseNumber === 3 ? [
                '🚨 3rd Offense: Official parent call & Disciplinary Inquiry scheduled.',
                'Referred for mandatory Counseling & Disciplinary Review.'
              ] : [
                '🔥 CRITICAL REPEAT OFFENDER: Disciplinary Suspension Review & Official Parent Summon.',
                'Formal Disciplinary Board Hearing initiated.'
              ]).map((chipText) => (
                <button
                  type="button"
                  key={chipText}
                  onClick={() => setActionTaken(chipText)}
                  className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[9.5px] font-extrabold rounded-lg transition-colors cursor-pointer text-left"
                >
                  + {chipText}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedStudent}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{isSubmitting ? 'Logging Infraction...' : `Submit Complaint (${offenseOrdinal})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
