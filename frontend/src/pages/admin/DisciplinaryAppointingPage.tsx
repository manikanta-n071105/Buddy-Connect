import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import { getBranchShortCode } from '../../types';
import { Gavel, Heart, ShieldCheck, ShieldAlert, Search, Plus, Trash2, X, KeyRound, User as UserIcon, Sparkles, Edit3, CheckCircle2, AlertTriangle, Clock, Smartphone, Scissors, CreditCard, UserX, FileWarning } from 'lucide-react';
import { toast } from 'sonner';
import { FileDisciplinaryComplaintModal } from '../../components/common/FileDisciplinaryComplaintModal';
import { fetchWithCache } from '../../utils/swr';

export const DisciplinaryAppointingPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'SPECIAL_ROLES' | 'DISCIPLINARY' | 'COUNSELOR' | 'COMPLAINTS'>('SPECIAL_ROLES');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showFileInfractionModal, setShowFileInfractionModal] = useState(false);

  // Special Roles State
  const [showSpecialRoleModal, setShowSpecialRoleModal] = useState(false);
  const [targetFacultyForSpecialRole, setTargetFacultyForSpecialRole] = useState<any>(null);
  const [selectedSpecialRoleVal, setSelectedSpecialRoleVal] = useState('DIRECTOR');
  const [customSpecialRoleVal, setCustomSpecialRoleVal] = useState('');
  const [isSubmittingSpecialRole, setIsSubmittingSpecialRole] = useState(false);

  // Disciplinary Committee State
  const [committeeMembers, setCommitteeMembers] = useState<any[]>([]);
  const [isLoadingCommittee, setIsLoadingCommittee] = useState(true);
  const [showAppointCommitteeModal, setShowAppointCommitteeModal] = useState(false);
  const [facultyOptions, setFacultyOptions] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [committeeDesignation, setCommitteeDesignation] = useState('Committee Member');
  const [isSubmittingCommittee, setIsSubmittingCommittee] = useState(false);

  // Counseling Teachers State
  const [counselorsList, setCounselorsList] = useState<any[]>([]);
  const [isLoadingCounselors, setIsLoadingCounselors] = useState(true);
  const [showCounselorModal, setShowCounselorModal] = useState(false);
  const [targetCounselorUser, setTargetCounselorUser] = useState<any>(null);
  const [counselorActionType, setCounselorActionType] = useState<'APPOINT' | 'REMOVE'>('APPOINT');
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [isSubmittingCounselor, setIsSubmittingCounselor] = useState(false);

  // Disciplinary Complaints State
  const [complaintsList, setComplaintsList] = useState<any[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCommitteeMembers = async (forceRefresh = false) => {
    await fetchWithCache<any[]>(
      'swr_disciplinary_committee',
      '/users/disciplinary-committee',
      (data) => {
        setCommitteeMembers(data || []);
        setIsLoadingCommittee(false);
      },
      { forceRefresh }
    );
  };

  const fetchCounselors = async (forceRefresh = false) => {
    await fetchWithCache<any[]>(
      'swr_counselors_list',
      '/counseling/counselors',
      (data) => {
        setCounselorsList(data || []);
        setIsLoadingCounselors(false);
      },
      { forceRefresh }
    );
  };

  const fetchFacultyCandidates = async (forceRefresh = false) => {
    await fetchWithCache<any[]>(
      'swr_faculty_candidates',
      '/users',
      (data) => {
        const candidates = (data || []).filter((u: any) => ['FACULTY', 'MENTOR'].includes(u.role));
        setFacultyOptions(candidates);
        if (candidates.length > 0 && !selectedUserId) {
          setSelectedUserId(candidates[0].id);
        }
      },
      { forceRefresh }
    );
  };

  const fetchAllComplaints = async (forceRefresh = false) => {
    await fetchWithCache<any[]>(
      'swr_disciplinary_complaints_all',
      '/users/disciplinary-complaints/all',
      (data) => {
        setComplaintsList(data || []);
        setIsLoadingComplaints(false);
      },
      { forceRefresh }
    );
  };

  useEffect(() => {
    fetchCommitteeMembers();
    fetchCounselors();
    fetchFacultyCandidates();
    fetchAllComplaints();
  }, []);

  // Handlers for Special Roles Appointing
  const handleAssignSpecialRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFacultyForSpecialRole) {
      toast.error('Please select a faculty member');
      return;
    }
    const finalRole = selectedSpecialRoleVal === 'CUSTOM' ? customSpecialRoleVal.trim() : selectedSpecialRoleVal;

    setIsSubmittingSpecialRole(true);
    try {
      await api.put(`/users/${targetFacultyForSpecialRole.id}`, {
        specialRole: finalRole || '',
        special_role: finalRole || ''
      });
      toast.success(`Special Role "${finalRole || 'None'}" updated for ${targetFacultyForSpecialRole.name}!`);
      setShowSpecialRoleModal(false);
      setTargetFacultyForSpecialRole(null);
      setCustomSpecialRoleVal('');
      fetchFacultyCandidates(true);
      fetchCommitteeMembers(true);
      fetchCounselors(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update special role');
    } finally {
      setIsSubmittingSpecialRole(false);
    }
  };

  const handleClearSpecialRole = async (u: any) => {
    if (!window.confirm(`Are you sure you want to remove the special role for ${u.name}?`)) return;
    try {
      await api.put(`/users/${u.id}`, {
        specialRole: '',
        special_role: '',
        isDisciplinaryCommittee: false,
        isCounselor: false
      });
      toast.success(`Special role removed for ${u.name}`);
      fetchFacultyCandidates(true);
      fetchCommitteeMembers(true);
      fetchCounselors(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove special role');
    }
  };

  // Handlers for Disciplinary Committee
  const handleAppointCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error('Please select a faculty member');
      return;
    }

    try {
      setIsSubmittingCommittee(true);
      await api.post('/users/disciplinary-committee/appoint', {
        userId: selectedUserId,
        designation: committeeDesignation.trim() || 'Committee Member'
      });

      const appointedUser = facultyOptions.find((f) => f.id === selectedUserId);
      toast.success(`Appointed ${appointedUser?.name || 'Faculty'} to Disciplinary Committee!`);
      setShowAppointCommitteeModal(false);
      setCommitteeDesignation('Committee Member');
      fetchCommitteeMembers(true);
      fetchFacultyCandidates(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to appoint to Disciplinary Committee');
    } finally {
      setIsSubmittingCommittee(false);
    }
  };

  const handleRemoveCommitteeMember = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the Disciplinary Committee?`)) return;
    try {
      await api.post('/users/disciplinary-committee/remove', { userId });
      toast.success(`Removed ${name} from Disciplinary Committee`);
      fetchCommitteeMembers(true);
      fetchFacultyCandidates(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  // Handlers for Mental Health Counselors
  const handleOpenCounselorModal = (userObj: any, action: 'APPOINT' | 'REMOVE') => {
    setTargetCounselorUser(userObj);
    setCounselorActionType(action);
    setSuperAdminPassword('');
    setShowCounselorModal(true);
  };

  const handleConfirmCounselorToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCounselorUser || !superAdminPassword.trim()) {
      toast.error('Super Administrator authorization password is required.');
      return;
    }

    const nextStatus = counselorActionType === 'APPOINT';

    try {
      setIsSubmittingCounselor(true);
      await api.patch(`/counseling/${targetCounselorUser.id || targetCounselorUser.user_id}/counselor-status`, {
        isCounselor: nextStatus,
        superAdminPassword: superAdminPassword.trim()
      });

      toast.success(
        `${targetCounselorUser.name} has been ${nextStatus ? 'appointed as' : 'removed from'} Mental Health Counseling Teachers!`
      );
      setShowCounselorModal(false);
      setTargetCounselorUser(null);
      setSuperAdminPassword('');
      fetchCounselors(true);
      fetchFacultyCandidates(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update counselor status');
    } finally {
      setIsSubmittingCounselor(false);
    }
  };

  // Filtering Logic
  const specialRoleFaculty = facultyOptions.filter((u) => {
    if (!searchTerm.trim() && roleFilter === 'ALL') return true;
    const t = searchTerm.toLowerCase();
    const name = (u.name || '').toLowerCase();
    const dept = (u.department || '').toLowerCase();
    const roleStr = (u.special_role || '').toLowerCase();
    const matchesSearch = name.includes(t) || dept.includes(t) || roleStr.includes(t);
    
    if (roleFilter === 'ALL') return matchesSearch;
    const uRole = (u.special_role || '').toUpperCase();
    if (roleFilter === 'DIRECTOR') return matchesSearch && uRole.includes('DIRECTOR');
    if (roleFilter === 'VICE_PRINCIPAL') return matchesSearch && uRole.includes('VICE');
    if (roleFilter === 'PRINCIPAL') return matchesSearch && (uRole.includes('PRINCIPAL') && !uRole.includes('VICE'));
    if (roleFilter === 'DEAN') return matchesSearch && uRole.includes('DEAN');
    if (roleFilter === 'HOD') return matchesSearch && uRole.includes('HOD');
    if (roleFilter === 'CONTROLLER') return matchesSearch && uRole.includes('CONTROLLER');
    if (roleFilter === 'COUNSELOR') return matchesSearch && (uRole.includes('COUNSELOR') || u.is_counselor);
    if (roleFilter === 'DISCIPLINARY') return matchesSearch && (uRole.includes('DISCIPLINARY') || u.is_disciplinary_committee);
    if (roleFilter === 'HR') return matchesSearch && uRole.includes('HR');
    if (roleFilter === 'ACCOUNTS') return matchesSearch && uRole.includes('ACCOUNT');
    return matchesSearch;
  });

  const filteredCommittee = committeeMembers.filter((m) => {
    if (!searchTerm.trim()) return true;
    const t = searchTerm.toLowerCase();
    const name = (m.name || m.faculty_name || '').toLowerCase();
    const username = (m.username || '').toLowerCase();
    const dept = (m.department || '').toLowerCase();
    const desig = (m.designation || '').toLowerCase();
    return name.includes(t) || username.includes(t) || dept.includes(t) || desig.includes(t);
  });

  const filteredCounselors = counselorsList.filter((c) => {
    if (!searchTerm.trim()) return true;
    const t = searchTerm.toLowerCase();
    const name = (c.name || '').toLowerCase();
    const dept = (c.department || '').toLowerCase();
    const code = (c.code || '').toLowerCase();
    return name.includes(t) || dept.includes(t) || code.includes(t);
  });

  const availableNonCommitteeCandidates = facultyOptions.filter(
    (f) => !committeeMembers.some((m) => m.user_id === f.id || m.id === f.id)
  );

  const availableNonCounselorCandidates = facultyOptions.filter(
    (f) => !counselorsList.some((c) => c.user_id === f.id || c.id === f.id)
  );

  const canAppoint = ['SUPER_ADMIN', 'ADMIN'].includes(currentUser?.role || '');

  const totalSpecialRoleHolders = facultyOptions.filter(
    (f) => f.special_role || f.is_disciplinary_committee || f.is_counselor
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 p-5 rounded-2xl text-white shadow-md border border-slate-800">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-purple-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Administrative Leadership Hub
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Special Roles & Committee Appointing Hub
            </h1>
            <p className="text-xs text-slate-300 font-medium max-w-2xl">
              Centralized administrative hub to appoint, manage, and assign all <strong className="text-amber-300">Special Roles & Designations</strong> (Director, Vice Principal, Dean, HOD, Counselor, Disciplinary Committee, HR, Accounts).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {(['SUPER_ADMIN', 'ADMIN'].includes(currentUser?.role || '') || Boolean(currentUser?.is_disciplinary_committee)) && (
              <button
                onClick={() => setShowFileInfractionModal(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <ShieldAlert className="w-4 h-4" /> Report Student Infraction
              </button>
            )}

            {canAppoint && activeTab === 'SPECIAL_ROLES' && (
              <button
                onClick={() => {
                  setTargetFacultyForSpecialRole(facultyOptions[0] || null);
                  setSelectedSpecialRoleVal('DIRECTOR');
                  setCustomSpecialRoleVal('');
                  setShowSpecialRoleModal(true);
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" /> Appoint Special Role
              </button>
            )}

            {canAppoint && activeTab === 'DISCIPLINARY' && (
              <button
                onClick={() => setShowAppointCommitteeModal(true)}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Appoint Committee Member
              </button>
            )}

            {canAppoint && activeTab === 'COUNSELOR' && (
              <button
                onClick={() => {
                  if (availableNonCounselorCandidates.length > 0) {
                    handleOpenCounselorModal(availableNonCounselorCandidates[0], 'APPOINT');
                  } else {
                    toast.info('All Faculty and mentors are already appointed as Counseling Teachers.');
                  }
                }}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Appoint Counseling Teacher
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('SPECIAL_ROLES')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'SPECIAL_ROLES'
                ? 'bg-slate-900 text-amber-300 shadow-sm border border-slate-700'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400/20" /> All Special Roles ({totalSpecialRoleHolders})
          </button>
          <button
            onClick={() => setActiveTab('DISCIPLINARY')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'DISCIPLINARY'
                ? 'bg-purple-950 text-purple-200 shadow-sm border border-purple-800'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Gavel className="w-4 h-4 text-purple-400" /> Disciplinary Committee ({committeeMembers.length})
          </button>
          <button
            onClick={() => setActiveTab('COUNSELOR')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'COUNSELOR'
                ? 'bg-rose-950 text-rose-200 shadow-sm border border-rose-800'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400/30" /> Counseling Teachers ({counselorsList.length})
          </button>
          <button
            onClick={() => setActiveTab('COMPLAINTS')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'COMPLAINTS'
                ? 'bg-amber-950 text-amber-200 shadow-sm border border-amber-800'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" /> Student Infractions Log ({complaintsList.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, department, or title..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>
      </div>

      {/* TAB 0: ALL SPECIAL ROLES & DESIGNATIONS */}
      {activeTab === 'SPECIAL_ROLES' && (
        <div className="space-y-4">
          {/* Sub-filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap bg-slate-100/70 p-2 rounded-2xl border border-slate-200/80">
            {[
              { key: 'ALL', label: 'All Faculty & Mentors' },
              { key: 'DIRECTOR', label: 'Directors' },
              { key: 'VICE_PRINCIPAL', label: 'Vice Principals' },
              { key: 'PRINCIPAL', label: 'Principals' },
              { key: 'DEAN', label: 'Deans' },
              { key: 'HOD', label: 'HODs' },
              { key: 'CONTROLLER', label: 'Controllers' },
              { key: 'COUNSELOR', label: 'Counselors' },
              { key: 'DISCIPLINARY', label: 'Disciplinary Committee' },
              { key: 'HR', label: 'HR' },
              { key: 'ACCOUNTS', label: 'Accounts' }
            ].map((chip) => (
              <button
                key={chip.key}
                onClick={() => setRoleFilter(chip.key)}
                className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition-all cursor-pointer ${
                  roleFilter === chip.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Special Roles Faculty Cards Grid */}
          {specialRoleFaculty.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-2xs">
              <Sparkles className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="text-sm font-black text-slate-900 uppercase">No Faculty Members Found for Selected Designation</h3>
              <p className="text-xs text-slate-500">Click "Appoint Special Role" above to assign leadership titles to faculty members.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialRoleFaculty.map((f) => {
                const displaySpecialRole = f.special_role || (f.is_disciplinary_committee ? 'DISCIPLINARY COMMITTEE' : f.is_counselor ? 'MENTAL HEALTH COUNSELOR' : null);

                return (
                  <div key={f.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all space-y-3 relative overflow-hidden flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0">
                            {f.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">{f.name}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{f.department || 'General Faculty'}</p>
                          </div>
                        </div>

                        {displaySpecialRole ? (
                          <span className="px-2.5 py-1 text-[9px] font-black rounded-xl bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs uppercase tracking-wider whitespace-nowrap flex items-center gap-1 shrink-0">
                            <Sparkles className="w-3 h-3 text-purple-700 shrink-0" /> {displaySpecialRole}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-[9px] font-bold rounded-xl bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider shrink-0">
                            Standard Staff
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <p className="font-medium truncate"><strong className="text-slate-800">Email:</strong> {f.email}</p>
                        {f.phone && <p className="font-medium"><strong className="text-slate-800">Phone:</strong> {f.phone}</p>}
                      </div>
                    </div>

                    {canAppoint && (
                      <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setTargetFacultyForSpecialRole(f);
                            setSelectedSpecialRoleVal(f.special_role || 'DIRECTOR');
                            setCustomSpecialRoleVal('');
                            setShowSpecialRoleModal(true);
                          }}
                          className="flex-1 py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-600" /> Edit Role
                        </button>
                        {displaySpecialRole && (
                          <button
                            onClick={() => handleClearSpecialRole(f)}
                            className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer"
                            title="Remove Special Role"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: DISCIPLINARY COMMITTEE MEMBERS */}
      {activeTab === 'DISCIPLINARY' && (
        <div className="space-y-4">
          {isLoadingCommittee ? (
            <LoadingState message="Fetching Disciplinary Committee members..." />
          ) : filteredCommittee.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-2xs">
              <Gavel className="w-10 h-10 text-purple-500 mx-auto" />
              <h3 className="text-sm font-black text-slate-900 uppercase">No Disciplinary Committee Members Found</h3>
              <p className="text-xs text-slate-500">Click "Appoint Committee Member" above to appoint faculty to the Disciplinary Committee.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCommittee.map((m) => (
                <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-purple-950 text-purple-200 flex items-center justify-center font-black text-sm shrink-0">
                          <Gavel className="w-4.5 h-4.5 text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">{m.name || m.faculty_name}</h4>
                          <p className="text-[10px] text-purple-700 font-extrabold uppercase tracking-wider">{m.designation || 'Committee Member'}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-black rounded-lg bg-purple-100 text-purple-900 border border-purple-200 uppercase tracking-wider shrink-0">
                        Active
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="font-medium truncate"><strong className="text-slate-800">Email:</strong> {m.email}</p>
                      {m.department && <p className="font-medium"><strong className="text-slate-800">Branch:</strong> {getBranchShortCode(m.department)}</p>}
                    </div>
                  </div>

                  {canAppoint && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleRemoveCommitteeMember(m.user_id || m.id, m.name || m.faculty_name)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Remove Member
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MENTAL HEALTH COUNSELING TEACHERS */}
      {activeTab === 'COUNSELOR' && (
        <div className="space-y-4">
          {isLoadingCounselors ? (
            <LoadingState message="Fetching Counseling Teachers..." />
          ) : filteredCounselors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-2xs">
              <Heart className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="text-sm font-black text-slate-900 uppercase">No Counseling Teachers Appointed Yet</h3>
              <p className="text-xs text-slate-500">Click "Appoint Counseling Teacher" above to designate faculty for confidential student counseling.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCounselors.map((c) => (
                <div key={c.id || c.mentor_id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-rose-950 text-rose-200 flex items-center justify-center font-black text-sm shrink-0">
                          <Heart className="w-4.5 h-4.5 text-rose-400 fill-rose-400/40" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">{c.name || c.mentor_name}</h4>
                          <p className="text-[10px] text-rose-700 font-extrabold uppercase tracking-wider">Mental Health Counselor</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-black rounded-lg bg-rose-100 text-rose-900 border border-rose-200 uppercase tracking-wider shrink-0">
                        Confidential
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="font-medium truncate"><strong className="text-slate-800">Email:</strong> {c.email}</p>
                      {c.department && <p className="font-medium"><strong className="text-slate-800">Branch:</strong> {getBranchShortCode(c.department)}</p>}
                    </div>
                  </div>

                  {canAppoint && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleOpenCounselorModal(c, 'REMOVE')}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Revoke Status
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STUDENT INFRACTIONS LOG */}
      {activeTab === 'COMPLAINTS' && (
        <div className="space-y-4">
          {isLoadingComplaints ? (
            <LoadingState message="Fetching Disciplinary Infractions Log..." />
          ) : complaintsList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-2xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-black text-slate-900 uppercase">Clean Record: No Infractions Logged</h3>
              <p className="text-xs text-slate-500">No disciplinary complaints or infractions have been filed against students.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complaintsList.map((c) => {
                const IconComp =
                  c.complaint_type === 'LATE_COMER' ? Clock :
                  c.complaint_type === 'UNIFORM_VIOLATION' ? UserX :
                  c.complaint_type === 'IMPROPER_BEARD_HAIRCUT' ? Scissors :
                  c.complaint_type === 'ID_CARD_MISSING' ? CreditCard :
                  c.complaint_type === 'MOBILE_USAGE' ? Smartphone :
                  c.complaint_type === 'MISBEHAVIOR' ? AlertTriangle : FileWarning;

                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 relative overflow-hidden">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-1 text-[10px] font-black rounded-xl bg-rose-100 text-rose-900 border border-rose-300 uppercase tracking-wider inline-flex items-center gap-1.5">
                            <IconComp className="w-3.5 h-3.5 text-rose-700" />
                            {c.complaint_type.replace(/_/g, ' ')}
                          </span>
                          {c.offense_number && (
                            <span className="px-2 py-0.5 text-[9px] font-black rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                              {c.offense_number === 1 ? '1st Offense' : c.offense_number === 2 ? '2nd Repeat' : c.offense_number === 3 ? '3rd Repeat' : `${c.offense_number}th Offense`}
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 pt-0.5">
                          Student: <span className="text-orange-600 underline">{c.student_name}</span> (@{c.student_username})
                        </h4>
                        <p className="text-[10px] text-slate-500 font-semibold">{c.student_email}</p>
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-xl uppercase tracking-wider shrink-0 shadow-2xs ${
                        c.severity === 'CRITICAL' ? 'bg-rose-600 text-white' :
                        c.severity === 'HIGH' ? 'bg-orange-500 text-white' :
                        c.severity === 'MEDIUM' ? 'bg-amber-500 text-white' :
                        'bg-slate-700 text-white'
                      }`}>
                        {c.severity}
                      </span>
                    </div>

                    {c.description && (
                      <p className="text-xs text-slate-700 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        "{c.description}"
                      </p>
                    )}

                    {c.action_taken && (
                      <div className="p-2 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-[11px] font-bold">
                        <span>Action Taken: </span>
                        <span className="font-normal">{c.action_taken}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-2 border-t border-slate-100">
                      <span>Logged by: {c.complainant_name}</span>
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: APPOINT / EDIT SPECIAL ROLE */}
      {showSpecialRoleModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-amber-500 fill-amber-400" /> Appoint Special Role / Designation
              </h3>
              <button onClick={() => setShowSpecialRoleModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSpecialRole} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Faculty / Staff Member *</label>
                <select
                  required
                  value={targetFacultyForSpecialRole?.id || ''}
                  onChange={(e) => {
                    const found = facultyOptions.find((f) => f.id === e.target.value);
                    setTargetFacultyForSpecialRole(found);
                    if (found) setSelectedSpecialRoleVal(found.special_role || 'DIRECTOR');
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden focus:border-amber-500 cursor-pointer"
                >
                  {facultyOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.department || 'Faculty'}) - Current Role: {f.special_role || 'Standard Staff'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign Special Role / Designation *</label>
                <select
                  value={selectedSpecialRoleVal}
                  onChange={(e) => setSelectedSpecialRoleVal(e.target.value)}
                  className="w-full p-2.5 bg-white border border-amber-300 rounded-xl font-extrabold text-slate-900 outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">None (Remove Special Role)</option>
                  <option value="DIRECTOR">Director</option>
                  <option value="VICE PRINCIPAL">Vice Principal</option>
                  <option value="PRINCIPAL">Principal</option>
                  <option value="DEAN">Dean</option>
                  <option value="HOD">HOD (Head of Department)</option>
                  <option value="CONTROLLER OF EXAMINATIONS">Controller of Examinations</option>
                  <option value="MENTAL HEALTH COUNSELOR">Mental Health Counselor</option>
                  <option value="DISCIPLINARY COMMITTEE">Disciplinary Committee Member</option>
                  <option value="HR">HR (Human Resources)</option>
                  <option value="ACCOUNTS DEPT">Accounts Department</option>
                  <option value="CUSTOM">Other / Custom Designation...</option>
                </select>
              </div>

              {selectedSpecialRoleVal === 'CUSTOM' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Custom Designation Title *</label>
                  <input
                    type="text"
                    required
                    value={customSpecialRoleVal}
                    onChange={(e) => setCustomSpecialRoleVal(e.target.value)}
                    placeholder="e.g. Vice Principal, Exam Controller"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden focus:border-amber-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSpecialRoleModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSpecialRole || !targetFacultyForSpecialRole}
                  className="px-4 py-2 text-xs font-extrabold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" /> Confirm Designation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APPOINT DISCIPLINARY COMMITTEE MEMBER */}
      {showAppointCommitteeModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Gavel className="w-4.5 h-4.5 text-purple-600" /> Appoint Disciplinary Member
              </h3>
              <button onClick={() => setShowAppointCommitteeModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAppointCommittee} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Faculty Member / Mentor *</label>
                {availableNonCommitteeCandidates.length === 0 ? (
                  <p className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl font-bold">
                    ⚠️ All available Faculty members and mentors are already appointed to the committee.
                  </p>
                ) : (
                  <select
                    required
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden focus:border-purple-500 cursor-pointer"
                  >
                    {availableNonCommitteeCandidates.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} (@{f.username}) - {f.role} [{getBranchShortCode(f.department)}]
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Committee Designation / Role Title *</label>
                <input
                  type="text"
                  required
                  value={committeeDesignation}
                  onChange={(e) => setCommitteeDesignation(e.target.value)}
                  placeholder="e.g. Committee Convener, Senior Member, Member"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAppointCommitteeModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCommittee || availableNonCommitteeCandidates.length === 0}
                  className="px-4 py-2 text-xs font-extrabold text-white bg-purple-700 hover:bg-purple-600 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Gavel className="w-3.5 h-3.5" /> Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TOGGLE MENTAL HEALTH COUNSELOR STATUS */}
      {showCounselorModal && targetCounselorUser && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Heart className="w-4.5 h-4.5 text-rose-600 fill-rose-400" />
                {counselorActionType === 'APPOINT' ? 'Appoint Counseling Teacher' : 'Remove Counselor Status'}
              </h3>
              <button onClick={() => setShowCounselorModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCounselorToggle} className="space-y-4 text-xs">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <p className="font-extrabold text-rose-950 text-xs">{targetCounselorUser.name} (@{targetCounselorUser.username})</p>
                <p className="text-[11px] text-rose-700 font-medium">
                  {counselorActionType === 'APPOINT'
                    ? 'Appointing as Mental Health Counseling Teacher for students.'
                    : 'Removing from active Mental Health Counseling Teachers list.'}
                </p>
              </div>

              {counselorActionType === 'APPOINT' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Candidate *</label>
                  <select
                    value={targetCounselorUser.id}
                    onChange={(e) => {
                      const found = availableNonCounselorCandidates.find((c) => c.id === e.target.value);
                      if (found) setTargetCounselorUser(found);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden cursor-pointer"
                  >
                    {availableNonCounselorCandidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (@{c.username}) - {c.role} [{getBranchShortCode(c.department)}]
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Super Administrator Authorization Password *</label>
                <input
                  type="password"
                  required
                  value={superAdminPassword}
                  onChange={(e) => setSuperAdminPassword(e.target.value)}
                  placeholder="Enter Super Admin Password..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCounselorModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCounselor}
                  className="px-4 py-2 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Authorize Status Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REPORT STUDENT INFRACTION */}
      <FileDisciplinaryComplaintModal
        isOpen={showFileInfractionModal}
        onClose={() => setShowFileInfractionModal(false)}
        targetStudent={null}
        onComplaintSubmitted={() => fetchAllComplaints()}
      />
    </div>
  );
};
