import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { LoadingState } from './LoadingState';
import { User, ShieldCheck, Mail, Phone, Calendar, Clock, KeyRound, Building2, BookOpen, UserCheck, GraduationCap, X, Edit3, Trash2, AlertTriangle, ShieldAlert, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

interface UserProfileModalProps {
  userId: string | null;
  onClose: () => void;
  onProfileDeleted?: () => void;
  onProfileUpdated?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, onClose, onProfileDeleted, onProfileUpdated }) => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showResetForm, setShowResetForm] = useState(false);
  const [showPermissionsForm, setShowPermissionsForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  const [newPasswordVal, setNewPasswordVal] = useState('Password123!');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [superAdminPasswordVal, setSuperAdminPasswordVal] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editCodeOrReg, setEditCodeOrReg] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editYear, setEditYear] = useState('');

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
  const isDirector = currentUser?.role === 'DIRECTOR';
  const isSelf = currentUser?.id === userId;

  // Faculty Assignment state for Junior
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [isSavingFaculty, setIsSavingFaculty] = useState(false);

  const fetchProfile = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/users/${userId}/profile`);
      const p = res.data.data;
      setProfile(p);
      setSelectedPermissions(p.permissions || []);
      setSelectedFacultyId(p.junior_faculty_id || p.faculty_id || '');

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
      setEditCodeOrReg(p.director_code || p.senior_code || p.register_number || '');
      setEditBatch(p.batch || '');
      setEditYear(p.year || '');
    } catch (err) {
      toast.error('Failed to load user profile');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFacultyAssignment = async () => {
    if (!profile) return;
    const juniorId = profile.junior_id || profile.id;
    try {
      setIsSavingFaculty(true);
      if (selectedFacultyId) {
        await api.post('/users/faculty/assign-junior', {
          facultyId: selectedFacultyId,
          juniorId
        });
        toast.success(`Faculty mentor assigned to ${profile.name} successfully!`);
      } else {
        await api.post('/users/faculty/unassign-junior', { juniorId });
        toast.success(`Faculty mentor unassigned from ${profile.name}!`);
      }
      fetchProfile();
      if (onProfileUpdated) onProfileUpdated();
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

  const canEditOrDelete = isSuperAdminOrAdmin || isSelf || (isDirector && profile && ['SENIOR', 'JUNIOR', 'DIRECTOR'].includes(profile.role));

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
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
        superAdminPassword: superAdminPasswordVal.trim()
      });
      toast.success(`Permissions for @${profile.username} updated successfully!`);
      setShowPermissionsForm(false);
      setSuperAdminPasswordVal('');
      fetchProfile();
      onProfileUpdated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user permissions');
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
    setIsSaving(true);
    try {
      await api.put(`/users/${userId}`, {
        name: editName,
        email: editEmail,
        username: editUsername,
        phone: editPhone,
        department: editDepartment,
        directorCode: profile.role === 'DIRECTOR' ? editCodeOrReg : undefined,
        seniorCode: profile.role === 'SENIOR' ? editCodeOrReg : undefined,
        registerNumber: profile.role === 'JUNIOR' ? editCodeOrReg : undefined,
        batch: editBatch,
        year: editYear
      });

      toast.success('User profile updated successfully!');
      setIsEditing(false);
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
            {/* Identity Banner */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 text-white rounded-2xl flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-600 flex items-center justify-center font-black text-base shadow-md border border-orange-400/30">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white tracking-wide">{profile.name}</h4>
                  <p className="text-[11px] text-orange-400 font-extrabold">@{profile.username}</p>
                </div>
              </div>
              <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full border tracking-wider uppercase shadow-2xs ${
                profile.role === 'SUPER_ADMIN' ? 'bg-purple-950 text-purple-300 border-purple-700' :
                profile.role === 'DIRECTOR' ? 'bg-indigo-950 text-indigo-300 border-indigo-700' :
                profile.role === 'SENIOR' ? 'bg-blue-950 text-blue-300 border-blue-700' :
                'bg-emerald-950 text-emerald-300 border-emerald-700'
              }`}>
                {profile.role.replace('_', ' ')}
              </span>
            </div>

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
                    <label className="block font-bold text-slate-700 mb-1">Email *</label>
                    <input type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-hidden" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Username *</label>
                    <input type="text" required value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-hidden" />
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
                      <option value="Computer Science & Engineering">Computer Science & Engineering (CSE)</option>
                      <option value="Electronics & Communication Engineering">Electronics & Communication Engineering (ECE)</option>
                      <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering (EEE)</option>
                      <option value="Mechanical Engineering">Mechanical Engineering (MECH)</option>
                      <option value="Civil Engineering">Civil Engineering (CIVIL)</option>
                    </select>
                  </div>
                </div>
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
                    <span className="font-bold text-slate-900">{profile.phone || 'N/A'}</span>
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
                </div>

                {/* Role Specific Entity Details */}
                {profile.role === 'DIRECTOR' && (
                  <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200/80 space-y-2">
                    <h5 className="font-extrabold text-indigo-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                      <Building2 className="w-4 h-4 text-indigo-600" /> Director Department Overview
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-slate-700 font-semibold">
                      <p>Director Code: <strong className="text-slate-900">{profile.director_code}</strong></p>
                      <p>Department: <strong className="text-slate-900">{profile.department}</strong></p>
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
                      <p>Department: <strong className="text-slate-900">{profile.department}</strong></p>
                      <p>Assigned Director: <strong className="text-slate-900">{profile.director_name || 'N/A'}</strong></p>
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
                      <p>Department: <strong className="text-slate-900">{profile.department}</strong></p>
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
              </>
            )}

            {/* Action Bar */}
            {canEditOrDelete && !isEditing && (
              <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2">
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
                  <h5 className="font-extrabold text-purple-950 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600" /> Super Admin: Update Permissions for @{profile.username}
                  </h5>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1 text-xs">
                  {availablePermissions.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        onClick={() => handleTogglePermission(perm.key)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-purple-950 text-purple-100 border-purple-800 shadow-sm'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-4 h-4 mt-0.5 rounded-md border flex items-center justify-center shrink-0 ${isChecked ? 'bg-purple-500 text-white border-purple-400' : 'border-slate-400 bg-slate-50'}`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-black tracking-wide leading-tight">{perm.label}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <div className="pt-2 border-t border-purple-200/80 space-y-2">
                  <div>
                    <label className="block font-bold text-purple-950 mb-1">Verify Super Admin Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter your Super Admin Password"
                      value={superAdminPasswordVal}
                      onChange={(e) => setSuperAdminPasswordVal(e.target.value)}
                      className="w-full p-2 bg-white border border-purple-300 rounded-xl font-mono text-slate-900 outline-hidden focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowPermissionsForm(false)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">Cancel</button>
                    <button type="submit" disabled={isSavingPermissions} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl shadow-md cursor-pointer">
                      {isSavingPermissions ? 'Saving...' : 'Confirm & Save Permissions'}
                    </button>
                  </div>
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
      </div>
    </div>,
    document.body
  );
};
