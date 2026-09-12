import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { LoadingState } from './LoadingState';
import { GoogleAuthenticatorModal } from './GoogleAuthenticatorModal';
import { QRCodeCanvas } from 'qrcode.react';
import { User, ShieldCheck, Mail, Phone, Calendar, Clock, KeyRound, Building2, BookOpen, UserCheck, GraduationCap, X, Edit3, Trash2, AlertTriangle, ShieldAlert, Check, Lock, Bus, Home, Star, Heart, Smartphone, Gavel, QrCode, Scissors, CreditCard, UserX, FileWarning, Droplet, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

import { getBranchShortCode, DEPARTMENT_OPTIONS } from '../../types';
import { StudentQrCodeCard } from './StudentQrCodeModal';
import { FileDisciplinaryComplaintModal } from './FileDisciplinaryComplaintModal';

interface UserProfileModalProps {
  userId: string | null;
  onClose: () => void;
  onProfileDeleted?: () => void;
  onProfileUpdated?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, onClose, onProfileDeleted, onProfileUpdated }) => {
  const { user: currentUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showResetForm, setShowResetForm] = useState(false);
  const [showPermissionsForm, setShowPermissionsForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // Disciplinary Complaints state
  const [disciplinaryComplaints, setDisciplinaryComplaints] = useState<any[]>([]);
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  const [newPasswordVal, setNewPasswordVal] = useState('Password123!');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [superAdminPasswordVal, setSuperAdminPasswordVal] = useState('');
  const [totpCodeVal, setTotpCodeVal] = useState('');
  const [show2FAModal, setShow2FAModal] = useState(false);

  // Quick blood group inline edit
  const [isQuickEditingBloodGroup, setIsQuickEditingBloodGroup] = useState(false);
  const [quickBloodGroup, setQuickBloodGroup] = useState('');
  const [isSavingQuickBloodGroup, setIsSavingQuickBloodGroup] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editCodeOrReg, setEditCodeOrReg] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editResidenceStatus, setEditResidenceStatus] = useState<'DAY_SCHOLAR' | 'HOSTELLER'>('DAY_SCHOLAR');
  const [editGender, setEditGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [editBloodGroup, setEditBloodGroup] = useState('');
  const [editSpecialRole, setEditSpecialRole] = useState('');
  const [editCustomSpecialRole, setEditCustomSpecialRole] = useState('');
  const [editIsCr, setEditIsCr] = useState(false);
  const [editIsCounselor, setEditIsCounselor] = useState(false);
  const [editIsDisciplinaryCommittee, setEditIsDisciplinaryCommittee] = useState(false);
  const [editCommitteeDesignation, setEditCommitteeDesignation] = useState('Committee Member');
  const [editSuperAdminPassword, setEditSuperAdminPassword] = useState('');

  const availablePermissions = [
    { key: 'MANAGE_USERS', label: 'Manage Users & Directory' },
    { key: 'CREATE_ADMIN', label: 'Create & Manage Admin Accounts' },
    { key: 'MANAGE_POLLS', label: 'Create & Manage Campus Student Polls' },
    { key: 'MANAGE_ISSUES', label: 'Manage Student Issues & SLA' },
    { key: 'MANAGE_EVENTS', label: 'Manage College Events' },
    { key: 'MANAGE_ANNOUNCEMENTS', label: 'Manage Broadcast Announcements' },
    { key: 'MANAGE_ONBOARDING', label: 'Manage Onboarding Checklist' },
    { key: 'MANAGE_QUESTIONS', label: 'Manage FAQ & Common Questions' },
    { key: 'MANAGE_SUGGESTIONS', label: 'Manage Student Suggestions' },
    { key: 'MANAGE_EMERGENCY', label: 'Manage Emergency Contacts' },
    { key: 'MANAGE_COLLEGE_GUIDE', label: 'Manage College Guide & Info' },
    { key: 'MANAGE_SYSTEM_DIAGNOSIS', label: 'Manage System Diagnosis Hub' },
    { key: 'MANAGE_SYSTEM_SETTINGS', label: 'Manage System Settings' },
    { key: 'MANAGE_SURVEYS', label: 'Manage Surveys & Feedback' },
    { key: 'VIEW_ANALYTICS', label: 'View Reports & Analytics' },
    { key: 'CREATE', label: 'Create Records' },
    { key: 'READ', label: 'Read Records' },
    { key: 'UPDATE', label: 'Update Records' },
    { key: 'DELETE', label: 'Delete Records' }
  ];

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isSuperAdminOrAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(currentUser?.role || '');
  const isMentor = currentUser?.role === 'MENTOR';
  const isSelf = currentUser?.id === userId;

  // Faculty Assignment state for Junior
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [isSavingFaculty, setIsSavingFaculty] = useState(false);

  const fetchDisciplinaryComplaints = async () => {
    if (!userId) return;
    try {
      const res = await api.get(`/users/disciplinary-complaints/student/${userId}`);
      setDisciplinaryComplaints(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProfile = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/users/${userId}/profile`);
      const p = res.data.data;
      setProfile(p);
      setSelectedPermissions(p.permissions || []);
      setSelectedFacultyId(p.junior_faculty_id || p.faculty_id || '');

      if (['JUNIOR', 'SENIOR'].includes(p.role)) {
        fetchDisciplinaryComplaints();
      }

      if (p.role === 'JUNIOR' && isSuperAdminOrAdmin) {
        try {
          const facRes = await api.get('/users/faculty');
          setFacultyList(facRes.data.data || []);
        } catch (e) {
          console.error(e);
        }
      }

      // Populate edit state
      setEditName(p.name || '');
      setEditEmail(p.email || '');
      setEditUsername(p.username || '');
      setEditPhone(p.phone === 'Hidden for privacy' ? '' : p.phone || '');
      setEditDepartment(p.department || '');
      setEditCodeOrReg(p.mentor_code || p.senior_code || p.register_number || '');
      setEditBatch(p.batch || '');
      setEditYear(p.year || '');
      setEditResidenceStatus(p.residence_status || 'DAY_SCHOLAR');
      setEditGender(p.gender || 'MALE');
      setEditBloodGroup(p.blood_group || '');
      setEditSpecialRole(p.special_role || '');
      setEditCustomSpecialRole(
        p.special_role && !['DIRECTOR', 'HR', 'ACCOUNTS DEPT', 'HOD', 'DEAN', 'PRINCIPAL'].includes(p.special_role)
          ? p.special_role
          : ''
      );
      setEditIsCr(p.is_cr || false);
      setEditIsCounselor(p.is_counselor || false);
      setEditIsDisciplinaryCommittee(p.is_disciplinary_committee || false);
      setEditCommitteeDesignation(p.committee_designation || 'Committee Member');
    } catch (err) {
      toast.error('Failed to load user profile');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFacultyAssignment = async () => {
    if (!userId) return;
    setIsSavingFaculty(true);
    try {
      await api.patch(`/users/${userId}/faculty-assignment`, { facultyId: selectedFacultyId || null });
      toast.success('Faculty assignment updated successfully');
      fetchProfile();
      onProfileUpdated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update faculty assignment');
    } finally {
      setIsSavingFaculty(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  if (!userId) return null;

  const canEditOrDelete = isSuperAdminOrAdmin || isSelf || (isMentor && profile && ['SENIOR', 'JUNIOR', 'MENTOR'].includes(profile.role));

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!superAdminPasswordVal.trim()) {
      toast.error('Super Administrator authorization password is required.');
      return;
    }
    try {
      await api.post(`/users/${userId}/reset-password`, { newPassword: newPasswordVal, adminPassword: superAdminPasswordVal });
      toast.success(`Password for @${profile.username} reset to "${newPasswordVal}"`);
      setShowResetForm(false);
      setSuperAdminPasswordVal('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleTogglePermission = (permKey: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
    );
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!superAdminPasswordVal.trim()) {
      toast.error('Super Administrator authorization password is required.');
      return;
    }
    setIsSavingPermissions(true);
    try {
      await api.patch(`/users/${userId}/permissions`, {
        permissions: selectedPermissions,
        superAdminPassword: superAdminPasswordVal.trim(),
        totpCode: totpCodeVal.trim()
      });
      toast.success(`Permissions for @${profile.username} updated successfully with 2FA authorization!`);
      setShowPermissionsForm(false);
      setSuperAdminPasswordVal('');
      setTotpCodeVal('');
      fetchProfile();
      onProfileUpdated?.();
    } catch (err: any) {
      if (err.response?.data?.requires2FA) {
        toast.error(err.response?.data?.message || 'Google Authenticator 2FA 6-digit code required.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to update user permissions');
      }
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      await api.patch(`/users/${userId}/status`, { isActive: !profile.is_active });
      toast.success(`User status updated to ${!profile.is_active ? 'ACTIVE' : 'DISABLED'}`);
      setProfile({ ...profile, is_active: !profile.is_active });
      onProfileUpdated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (editIsCr !== Boolean(profile?.is_cr) || editIsCounselor !== Boolean(profile?.is_counselor)) &&
      !editSuperAdminPassword.trim()
    ) {
      toast.error('Super Administrator authorization password is required to change CR or Mental Health Counselor status.');
      return;
    }

    setIsSaving(true);
    try {
      const finalSpecialRole = editSpecialRole === 'CUSTOM' ? editCustomSpecialRole.trim() : editSpecialRole;
      await api.put(`/users/${userId}`, {
        name: editName,
        email: editEmail,
        username: editUsername,
        phone: editPhone,
        department: editDepartment,
        mentorCode: profile.role === 'MENTOR' ? editCodeOrReg : undefined,
        seniorCode: profile.role === 'SENIOR' ? editCodeOrReg : undefined,
        registerNumber: profile.role === 'JUNIOR' ? editCodeOrReg : undefined,
        batch: editBatch,
        year: editYear,
        residenceStatus: editResidenceStatus,
        gender: editGender,
        blood_group: editBloodGroup,
        specialRole: finalSpecialRole || '',
        special_role: finalSpecialRole || '',
        isCr: editIsCr,
        isCounselor: editIsCounselor,
        isDisciplinaryCommittee: editIsDisciplinaryCommittee,
        committeeDesignation: editCommitteeDesignation,
        superAdminPassword: editSuperAdminPassword.trim()
      });

      toast.success('User profile updated successfully!');
      setIsEditing(false);
      setEditSuperAdminPassword('');
      fetchProfile();
      onProfileUpdated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/users/${userId}`);
      toast.success(`User profile @${profile.username} deleted successfully`);
      setShowDeleteConfirm(false);
      onClose();
      onProfileDeleted?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user profile');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickSaveBloodGroup = async (bg: string) => {
    if (!bg) {
      toast.error('Please select a blood group');
      return;
    }
    setIsSavingQuickBloodGroup(true);
    try {
      if (isSelf) {
        await api.put('/blood/user/blood-group', { blood_group: bg });
      } else {
        await api.put(`/users/${userId}`, { blood_group: bg });
      }
      setProfile((prev: any) => ({ ...prev, blood_group: bg }));
      setEditBloodGroup(bg);
      setIsQuickEditingBloodGroup(false);
      toast.success(`Blood group updated to ${bg} successfully!`);
      if (isSelf && refreshUser) await refreshUser();
      onProfileUpdated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update blood group');
    } finally {
      setIsSavingQuickBloodGroup(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-orange-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">User Identity Profile</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {isLoading || !profile ? (
          <LoadingState message="Fetching detailed user profile..." />
        ) : (
          <div className="space-y-4 text-xs">
            {/* Identity Banner with QR Code Pass (Above & Beside User Details) */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 shadow-md border border-slate-800">
              <div className="space-y-3 flex-1 w-full">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-600 flex items-center justify-center font-black text-base shadow-md border border-orange-400/30 shrink-0">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white tracking-wide">{profile.name}</h4>
                    <p className="text-[11px] text-orange-400 font-extrabold">@{profile.username}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {profile.is_cr && (
                    <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-amber-400 text-amber-950 border border-amber-300 tracking-wider uppercase shadow-xs flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-950 text-amber-950" /> CR
                    </span>
                  )}
                  {profile.is_counselor && (
                    <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-rose-500 text-white border border-rose-400 tracking-wider uppercase shadow-xs flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-white text-white" /> Counselor
                    </span>
                  )}
                  {profile.is_disciplinary_committee && (
                    <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-purple-600 text-white border border-purple-400 tracking-wider uppercase shadow-xs flex items-center gap-1">
                      <Gavel className="w-3.5 h-3.5 fill-white text-white" /> Committee Member
                    </span>
                  )}
                  {profile.special_role && (
                    <span className="px-3 py-1 text-[10px] font-black rounded-full bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white border border-purple-400/40 tracking-wider uppercase shadow-md flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
                      Special Role: <span className="text-amber-200">{profile.special_role}</span>
                    </span>
                  )}
                  <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full border tracking-wider uppercase shadow-2xs ${
                    profile.role === 'SUPER_ADMIN' ? 'bg-purple-950 text-purple-300 border-purple-700' :
                    profile.role === 'MENTOR' ? 'bg-indigo-950 text-indigo-300 border-indigo-700' :
                    profile.role === 'SENIOR' ? 'bg-blue-950 text-blue-300 border-blue-700' :
                    'bg-emerald-950 text-emerald-300 border-emerald-700'
                  }`}>
                    {profile.role.replace('_', ' ')}
                  </span>
                </div>

                {/* Blood Group Badge with Quick Edit Option below role text */}
                <div className="pt-0.5 flex flex-wrap items-center gap-2">
                  {isQuickEditingBloodGroup ? (
                    <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-rose-500/60 shadow-lg animate-in fade-in">
                      <select
                        value={quickBloodGroup}
                        onChange={(e) => setQuickBloodGroup(e.target.value)}
                        className="p-1 bg-slate-950 text-white border border-rose-400/40 rounded-lg text-xs font-black outline-hidden"
                      >
                        <option value="">Select Group</option>
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleQuickSaveBloodGroup(quickBloodGroup)}
                        disabled={isSavingQuickBloodGroup || !quickBloodGroup}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] rounded-lg transition-all cursor-pointer shadow-xs"
                      >
                        {isSavingQuickBloodGroup ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsQuickEditingBloodGroup(false)}
                        className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] rounded-lg font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/90 text-rose-300 border border-rose-700/60 font-black text-[10px] tracking-wider uppercase shadow-xs">
                        <Droplet className="w-3.5 h-3.5 fill-rose-400 text-rose-400 shrink-0" />
                        Blood Group: <span className="text-white font-extrabold">{profile.blood_group || 'Not Set'}</span>
                      </span>
                      {(isSelf || isSuperAdminOrAdmin) && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuickBloodGroup(profile.blood_group || 'O+');
                            setIsQuickEditingBloodGroup(true);
                          }}
                          className="px-2 py-0.5 bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 border border-white/10"
                          title="Change Blood Group"
                        >
                          <Edit3 className="w-2.5 h-2.5" /> Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code Pass Card (Positioned Above & Beside Details) */}
              <div className="flex flex-col items-center justify-center bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 shrink-0 shadow-lg">
                <div className="p-2 bg-white rounded-xl shadow-md border border-slate-200">
                  <QRCodeCanvas value={profile.email} size={105} bgColor="#FFFFFF" fgColor="#000000" level="M" />
                </div>
                <span className="text-[9px] font-extrabold text-amber-400 mt-1 uppercase tracking-wider flex items-center gap-1">
                  <QrCode className="w-3 h-3 text-orange-500" /> Identity QR Pass
                </span>
              </div>
            </div>

            {/* REPEAT OFFENDER WARNING BANNER */}
            {['JUNIOR', 'SENIOR'].includes(profile.role) && disciplinaryComplaints.length >= 2 && (
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-md ${
                disciplinaryComplaints.length >= 3
                  ? 'bg-rose-950 text-white border-rose-700 animate-pulse'
                  : 'bg-amber-950 text-white border-amber-700'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    disciplinaryComplaints.length >= 3 ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-xs uppercase tracking-wider">
                        {disciplinaryComplaints.length >= 3 ? '🚨 CRITICAL REPEAT OFFENDER ALERT' : '⚠️ REPEAT OFFENDER NOTICE'}
                      </h4>
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-white/20 text-white uppercase">
                        {disciplinaryComplaints.length} Infractions Logged
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-200 font-medium mt-0.5">
                      {disciplinaryComplaints.length >= 3
                        ? 'This student has repeated conduct violations! Urgent Parent Summon & Committee Inquiry Recommended.'
                        : 'Student has 2 recorded conduct violations. Further infractions will trigger committee escalation.'}
                    </p>
                  </div>
                </div>
                {(['SUPER_ADMIN', 'ADMIN'].includes(currentUser?.role || '') || Boolean(currentUser?.is_disciplinary_committee)) && (
                  <button
                    type="button"
                    onClick={() => setShowComplaintModal(true)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
                  >
                    + File Infraction
                  </button>
                )}
              </div>
            )}

            {/* Inline Edit Form */}
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h5 className="font-black text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <Edit3 className="w-4 h-4 text-orange-600" /> Edit Profile Details
                </h5>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold outline-hidden" />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                    <input type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold outline-hidden" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Username (@handle) *</label>
                    <input type="text" required value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold outline-hidden" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mobile / Phone Number</label>
                    <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-hidden" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Department</label>
                    <select value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold outline-hidden text-xs">
                      <option value="">Select Department Branch...</option>
                      {DEPARTMENT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {['SENIOR', 'JUNIOR'].includes(profile.role) && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Residence Status</label>
                      <select value={editResidenceStatus} onChange={(e) => setEditResidenceStatus(e.target.value as any)} className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold outline-hidden text-xs">
                        <option value="DAY_SCHOLAR">Day Scholar</option>
                        <option value="HOSTELLER">Hosteller</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gender / Classification</label>
                    <select value={editGender} onChange={(e) => setEditGender(e.target.value as any)} className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold outline-hidden text-xs">
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Blood Group</label>
                    <select value={editBloodGroup} onChange={(e) => setEditBloodGroup(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold outline-hidden text-xs text-slate-800">
                      <option value="">Not Set / Select Blood Group...</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                        <option key={bg} value={bg}>{bg} Blood Group</option>
                      ))}
                    </select>
                  </div>
                </div>
                {(profile.role === 'FACULTY' || isSuperAdminOrAdmin) && (
                  <div className="space-y-2 pt-1 border-t border-slate-200/60">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1 text-xs">Special Role / Designation (e.g. Director, HR, Accounts)</label>
                      <select
                        value={['', 'DIRECTOR', 'HR', 'ACCOUNTS DEPT', 'HOD', 'DEAN', 'PRINCIPAL'].includes(editSpecialRole) ? editSpecialRole : 'CUSTOM'}
                        onChange={(e) => setEditSpecialRole(e.target.value)}
                        className="w-full p-2 bg-white border border-purple-300 rounded-xl font-extrabold text-slate-900 outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer text-xs"
                      >
                        <option value="">None (Standard Staff / Faculty)</option>
                        <option value="DIRECTOR">Director</option>
                        <option value="HR">HR (Human Resources)</option>
                        <option value="ACCOUNTS DEPT">Accounts Department</option>
                        <option value="HOD">HOD (Head of Department)</option>
                        <option value="DEAN">Dean</option>
                        <option value="PRINCIPAL">Principal</option>
                        <option value="CUSTOM">Other / Custom Designation...</option>
                      </select>
                    </div>
                    {(['CUSTOM'].includes(editSpecialRole) || (editSpecialRole && !['', 'DIRECTOR', 'HR', 'ACCOUNTS DEPT', 'HOD', 'DEAN', 'PRINCIPAL'].includes(editSpecialRole))) && (
                      <div>
                        <label className="block font-bold text-slate-800 mb-1 text-xs">Custom Designation Title *</label>
                        <input
                          type="text"
                          required
                          value={editCustomSpecialRole}
                          onChange={(e) => setEditCustomSpecialRole(e.target.value)}
                          placeholder="e.g. Vice Principal, Controller of Examinations"
                          className="w-full p-2 bg-white border border-purple-300 rounded-xl font-bold text-slate-900 outline-hidden text-xs"
                        />
                      </div>
                    )}
                  </div>
                )}
                {['SENIOR', 'JUNIOR'].includes(profile.role) && (
                  <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 space-y-2">
                    <label className="flex items-center gap-2 font-extrabold text-amber-950 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editIsCr}
                        onChange={(e) => setEditIsCr(e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded-md accent-amber-600 cursor-pointer"
                      />
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" /> Appointed Class Representative (CR)
                      </span>
                    </label>
                    {editIsCr !== Boolean(profile.is_cr) && (
                      <div>
                        <label className="block font-extrabold text-amber-950 text-[11px] mb-1">
                          Super Administrator Authorization Password *
                        </label>
                        <input
                          type="password"
                          required
                          value={editSuperAdminPassword}
                          onChange={(e) => setEditSuperAdminPassword(e.target.value)}
                          placeholder="Enter Super Admin Password..."
                          className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-mono outline-hidden"
                        />
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-3.5 py-1.5 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={isSaving} className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer">
                    {isSaving ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Base Contact & Account Info */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block flex items-center gap-1">
                      <Mail className="w-3 h-3 text-orange-600" /> Email Address
                    </span>
                    <span className="font-bold text-slate-900">{profile.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block flex items-center gap-1">
                      <Phone className="w-3 h-3 text-orange-600" /> Phone Number
                    </span>
                    <span className="font-bold text-slate-900">
                      {profile.phone === 'Hidden for privacy' ? (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-bold italic text-xs">
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Hidden for privacy
                        </span>
                      ) : (
                        profile.phone || 'N/A'
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-orange-600" /> Joined Date
                    </span>
                    <span className="font-bold text-slate-900">{new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block flex items-center gap-1">
                      <Clock className="w-3 h-3 text-orange-600" /> Account Status
                    </span>
                    <span className={`font-black ${profile.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {profile.is_active ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block flex items-center gap-1">
                      <User className="w-3 h-3 text-orange-600" /> Gender
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 mt-1 text-[11px] font-black rounded-lg border ${
                      profile.gender === 'FEMALE' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      <User className="w-3.5 h-3.5 shrink-0" />
                      {profile.gender === 'FEMALE' ? 'FEMALE' : 'MALE'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block flex items-center gap-1">
                        <Droplet className="w-3 h-3 text-rose-600 fill-rose-600/30" /> Blood Group
                      </span>
                      {(isSelf || isSuperAdminOrAdmin) && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuickBloodGroup(profile.blood_group || 'O+');
                            setIsQuickEditingBloodGroup(true);
                          }}
                          className="text-[10px] text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer"
                        >
                          Change
                        </button>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 mt-1 text-[11px] font-black rounded-lg border ${
                      profile.blood_group ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      <Droplet className="w-3.5 h-3.5 text-rose-600 fill-rose-600/40 shrink-0" />
                      {profile.blood_group || 'Not Set'}
                    </span>
                  </div>
                  {['SENIOR', 'JUNIOR'].includes(profile.role) && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-orange-600" /> Residence Status
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 mt-1 text-[11px] font-black rounded-lg border ${
                        profile.residence_status === 'HOSTELLER' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {profile.residence_status === 'HOSTELLER' ? (
                          <>
                            <Home className="w-3.5 h-3.5 text-purple-600 shrink-0" /> HOSTELLER
                          </>
                        ) : (
                          <>
                            <Bus className="w-3.5 h-3.5 text-blue-600 shrink-0" /> DAY SCHOLAR
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Role Specific Entity Details */}
                {profile.role === 'MENTOR' && (
                  <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200/80 space-y-2">
                    <h5 className="font-extrabold text-indigo-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                      <Building2 className="w-4 h-4 text-indigo-600" /> Mentor Department Overview
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-slate-700 font-semibold">
                      <p>Mentor Code: <strong className="text-slate-900">{profile.mentor_code}</strong></p>
                      <p>Department: <strong className="text-slate-900">{getBranchShortCode(profile.department)}</strong></p>
                    </div>
                  </div>
                )}

                {profile.role === 'SENIOR' && (
                  <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200/80 space-y-2">
                    <h5 className="font-extrabold text-blue-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                      <UserCheck className="w-4 h-4 text-blue-600" /> Senior Mentor Scope
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-slate-700 font-semibold">
                      <p>Senior Code: <strong className="text-slate-900">{profile.senior_code}</strong></p>
                      <p>Department: <strong className="text-slate-900">{getBranchShortCode(profile.department)}</strong></p>
                      <p>Assigned Director: <strong className="text-slate-900">{profile.mentor_name || 'N/A'}</strong></p>
                    </div>
                  </div>
                )}

                {profile.role === 'JUNIOR' && (
                  <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 space-y-3">
                    <h5 className="font-extrabold text-emerald-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                      <GraduationCap className="w-4 h-4 text-emerald-600" /> Junior Student Profile
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-slate-700 font-semibold">
                      <p>Register Number: <strong className="text-slate-900">{profile.register_number}</strong></p>
                      <p>Department: <strong className="text-slate-900">{getBranchShortCode(profile.department)}</strong></p>
                      <p>Batch / Year: <strong className="text-slate-900">{profile.batch} ({profile.year})</strong></p>
                      <p>Senior Mentor: <strong className="text-indigo-600">{profile.senior_name || 'N/A'}</strong></p>
                      <p className="col-span-2">Assigned Faculty Mentor: <strong className="text-teal-700">{profile.faculty_name ? `${profile.faculty_name} (${profile.faculty_code || 'FAC'})` : 'None (Unassigned)'}</strong></p>
                    </div>

                    {/* Super Admin Faculty Mentor Selector */}
                    {isSuperAdminOrAdmin && (
                      <div className="pt-3 border-t border-emerald-200/80 space-y-2.5">
                        <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-teal-700 shrink-0" /> Assign Faculty Mentor (SuperAdmin Control)
                        </label>
                        <select
                          value={selectedFacultyId}
                          onChange={(e) => setSelectedFacultyId(e.target.value)}
                          className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-bold text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer shadow-xs truncate"
                        >
                          <option value="">-- None / Unassigned --</option>
                          {facultyList.map((f: any) => {
                            const facName = f.faculty_name || f.name || 'Faculty Member';
                            return (
                              <option key={f.faculty_id || f.id} value={f.faculty_id || f.id}>
                                Prof. {facName} ({f.faculty_code || 'FAC'}) - {f.department || ''} [{f.assigned_juniors_count || 0}/{f.max_juniors || 5}]
                              </option>
                            );
                          })}
                        </select>
                        <button
                          type="button"
                          onClick={handleSaveFacultyAssignment}
                          disabled={isSavingFaculty}
                          className="w-full py-2.5 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md text-xs cursor-pointer transition-all flex items-center justify-center gap-2"
                        >
                          {isSavingFaculty ? 'Saving Assignment...' : 'Save Faculty Assignment'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Granted Permissions List Preview for Non-Juniors */}
                {profile.role !== 'JUNIOR' && (
                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                    <h5 className="font-extrabold text-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-amber-600" /> Granted Custom Permissions ({profile.permissions?.length || 0})
                    </h5>
                    {profile.permissions && profile.permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {profile.permissions.map((perm: string) => (
                          <span key={perm} className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200/90 rounded-lg text-[10px] font-bold">
                            {perm}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-[11px]">No custom permissions granted.</p>
                    )}
                  </div>
                )}

                {/* Disciplinary Infractions & Complaints Section for Students */}
                {['JUNIOR', 'SENIOR'].includes(profile.role) && (
                  <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200/90 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h5 className="font-extrabold text-rose-950 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                        <ShieldAlert className="w-4 h-4 text-rose-600" /> Disciplinary Infractions Record ({disciplinaryComplaints.length})
                      </h5>
                      {(['SUPER_ADMIN', 'ADMIN'].includes(currentUser?.role || '') || Boolean(currentUser?.is_disciplinary_committee)) && (
                        <button
                          type="button"
                          onClick={() => setShowComplaintModal(true)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                          + File Infraction
                        </button>
                      )}
                    </div>

                    {disciplinaryComplaints.length === 0 ? (
                      <p className="text-slate-500 italic text-[11px]">Clean Record: No disciplinary infractions or complaints recorded.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {disciplinaryComplaints.map((c) => {
                          const IconComp =
                            c.complaint_type === 'LATE_COMER' ? Clock :
                            c.complaint_type === 'UNIFORM_VIOLATION' ? UserX :
                            c.complaint_type === 'IMPROPER_BEARD_HAIRCUT' ? Scissors :
                            c.complaint_type === 'ID_CARD_MISSING' ? CreditCard :
                            c.complaint_type === 'MOBILE_USAGE' ? Smartphone :
                            c.complaint_type === 'MISBEHAVIOR' ? AlertTriangle : FileWarning;

                          return (
                            <div key={c.id} className="p-2.5 bg-white rounded-xl border border-rose-200 shadow-2xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-[11px] text-slate-900 flex items-center gap-1.5">
                                  <IconComp className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  {c.complaint_type.replace(/_/g, ' ')}
                                  {c.offense_number && (
                                    <span className="px-1.5 py-0.5 text-[9px] font-black rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                                      {c.offense_number === 1 ? '1st Offense' : c.offense_number === 2 ? '2nd Repeat' : c.offense_number === 3 ? '3rd Repeat' : `${c.offense_number}th Offense`}
                                    </span>
                                  )}
                                </span>
                                <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider ${
                                  c.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                                  c.severity === 'HIGH' ? 'bg-orange-100 text-orange-900 border border-orange-300' :
                                  'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}>
                                  {c.severity}
                                </span>
                              </div>
                              {c.description && <p className="text-slate-600 text-[11px] font-medium leading-tight">{c.description}</p>}
                              {c.action_taken && <p className="text-rose-700 text-[10px] font-bold">Action Taken: {c.action_taken}</p>}
                              <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold pt-1 border-t border-slate-100">
                                <span>Reported by {c.complainant_name}</span>
                                <span>{new Date(c.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Action Bar */}
            {canEditOrDelete && !isEditing && (
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                {(['SUPER_ADMIN', 'ADMIN'].includes(currentUser?.role || '') || Boolean(currentUser?.is_disciplinary_committee)) && ['JUNIOR', 'SENIOR'].includes(profile.role) && (
                  <button
                    onClick={() => setShowComplaintModal(true)}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl shadow-xs border border-rose-600 transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <ShieldAlert className="w-4 h-4" /> File Infraction
                  </button>
                )}

                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-extrabold border border-orange-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </button>

                {isSuperAdmin && profile.role !== 'JUNIOR' && profile.role !== 'SUPER_ADMIN' && (
                  <button
                    onClick={() => setShowPermissionsForm(!showPermissionsForm)}
                    className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold border border-purple-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> Update Permissions
                  </button>
                )}

                {isSuperAdminOrAdmin && (
                  <>
                    <button
                      onClick={() => setShowResetForm(!showResetForm)}
                      className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold border border-amber-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" /> Reset Password
                    </button>
                    <button
                      onClick={handleToggleStatus}
                      className={`px-3 py-2 font-extrabold border rounded-xl transition-colors cursor-pointer ${
                        profile.is_active
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {profile.is_active ? 'Disable' : 'Activate'}
                    </button>
                  </>
                )}

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold border border-rose-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Profile
                </button>
              </div>
            )}

            {/* Super Admin Permissions Management Panel */}
            {showPermissionsForm && isSuperAdmin && (
              <form onSubmit={handleSavePermissions} className="p-4 bg-purple-50/90 border border-purple-200/90 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-purple-200/80 pb-2">
                  <h5 className="font-extrabold text-purple-950 uppercase text-xs tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-purple-600" /> Manage System Permissions
                  </h5>
                  <button type="button" onClick={() => setShowPermissionsForm(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {availablePermissions.map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-purple-200/80 text-[11px] font-semibold text-slate-800 cursor-pointer hover:bg-purple-100/50">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.key)}
                        onChange={() => {
                          if (selectedPermissions.includes(perm.key)) {
                            setSelectedPermissions(selectedPermissions.filter((p) => p !== perm.key));
                          } else {
                            setSelectedPermissions([...selectedPermissions, perm.key]);
                          }
                        }}
                        className="rounded-sm border-purple-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
                <div className="pt-2 border-t border-purple-200/80 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPermissionsForm(false)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPermissions}
                    className="px-4 py-1.5 bg-purple-700 hover:bg-purple-600 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    {isSavingPermissions ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              </form>
            )}

            {/* Reset Password Form */}
            {showResetForm && (
              <form onSubmit={handleResetPassword} className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <label className="block font-bold text-amber-900">Set New Password for @{profile.username}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    className="flex-1 p-2 bg-white border border-amber-300 rounded-lg font-mono outline-hidden"
                  />
                  <button type="submit" className="px-3.5 py-2 bg-amber-600 text-white font-bold rounded-lg cursor-pointer">Save</button>
                </div>
              </form>
            )}

            {/* Delete Confirmation Warning Modal Box */}
            {showDeleteConfirm && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
                <div className="flex items-start gap-2.5 text-rose-900">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-extrabold text-xs uppercase tracking-wider">Confirm Profile Deletion</h5>
                    <p className="text-[11px] text-rose-700 font-medium mt-0.5">
                      Are you sure you want to permanently delete profile <strong>@{profile.username}</strong> ({profile.name})? All associated records, tickets, and messages will be removed.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1 border-t border-rose-200/80">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProfile}
                    disabled={isDeleting}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete Profile'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <GoogleAuthenticatorModal isOpen={show2FAModal} onClose={() => setShow2FAModal(false)} />
        <FileDisciplinaryComplaintModal
          isOpen={showComplaintModal}
          onClose={() => setShowComplaintModal(false)}
          targetStudent={profile}
          onComplaintSubmitted={() => {
            fetchDisciplinaryComplaints();
            fetchProfile();
          }}
        />
      </div>
    </div>,
    document.body
  );
};
