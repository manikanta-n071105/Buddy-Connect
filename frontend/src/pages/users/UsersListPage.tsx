import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import { CredentialSuccessModal } from '../../components/common/CredentialSuccessModal';
import { UserProfileModal } from '../../components/common/UserProfileModal';
import { Users, UserPlus, Shield, Building2, BookOpen, UserCheck, GraduationCap, X, KeyRound, User as UserIcon, Search, Phone, Mail, Filter, Sparkles, ChevronRight, Layers } from 'lucide-react';
import { toast } from 'sonner';

export const UsersListPage: React.FC = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [directorsList, setDirectorsList] = useState<any[]>([]);
  const [seniorsList, setSeniorsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState('ALL');

  // Profile Modal state
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Modals state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showDirectorModal, setShowDirectorModal] = useState(false);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showSeniorModal, setShowSeniorModal] = useState(false);
  const [showJuniorModal, setShowJuniorModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [capacityTargetFaculty, setCapacityTargetFaculty] = useState<any>(null);
  const [newMaxJuniorsVal, setNewMaxJuniorsVal] = useState('5');
  const [resetTargetUser, setResetTargetUser] = useState<any>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('Password123!');
  const [resetAdminPasswordVal, setResetAdminPasswordVal] = useState('');

  // Credential Success Modal state
  const [createdCredential, setCreatedCredential] = useState<{ role: string; name: string; username: string; pass: string } | null>(null);

  // 1. Admin Form state
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('Password123!');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPermissions, setAdminPermissions] = useState<string[]>([
    'CREATE',
    'READ',
    'UPDATE',
    'DELETE',
    'MANAGE_USERS',
    'CREATE_ADMIN',
    'MANAGE_POLLS',
    'MANAGE_ISSUES',
    'MANAGE_EVENTS',
    'MANAGE_ANNOUNCEMENTS',
    'MANAGE_ONBOARDING',
    'MANAGE_QUESTIONS',
    'MANAGE_SUGGESTIONS',
    'MANAGE_EMERGENCY',
    'MANAGE_COLLEGE_GUIDE',
    'MANAGE_SYSTEM_DIAGNOSIS',
    'MANAGE_SYSTEM_SETTINGS',
    'MANAGE_SURVEYS',
    'VIEW_ANALYTICS'
  ]);

  // 2. Director Form state
  const [dirName, setDirName] = useState('');
  const [dirEmail, setDirEmail] = useState('');
  const [dirUsername, setDirUsername] = useState('');
  const [dirPassword, setDirPassword] = useState('Password123!');
  const [dirPhone, setDirPhone] = useState('');
  const [dirCode, setDirCode] = useState('');
  const [dirDepartment, setDirDepartment] = useState('Computer Science & Engineering');
  const [dirPermissions, setDirPermissions] = useState<string[]>([]);
  const [dirSuperAdminPassword, setDirSuperAdminPassword] = useState('');

  // 2.5 Faculty Form state
  const [facName, setFacName] = useState('');
  const [facEmail, setFacEmail] = useState('');
  const [facUsername, setFacUsername] = useState('');
  const [facPassword, setFacPassword] = useState('Password123!');
  const [facPhone, setFacPhone] = useState('');
  const [facDepartment, setFacDepartment] = useState('Computer Science & Engineering');

  // 3. Senior Form state
  const [senName, setSenName] = useState('');
  const [senEmail, setSenEmail] = useState('');
  const [senUsername, setSenUsername] = useState('');
  const [senPassword, setSenPassword] = useState('Password123!');
  const [senPhone, setSenPhone] = useState('');
  const [senCode, setSenCode] = useState('');
  const [senDepartment, setSenDepartment] = useState('Computer Science & Engineering');
  const [senPermissions, setSenPermissions] = useState<string[]>([]);
  const [senSuperAdminPassword, setSenSuperAdminPassword] = useState('');
  const [selectedDirectorId, setSelectedDirectorId] = useState('');

  // 4. Junior Form state
  const [junName, setJunName] = useState('');
  const [junEmail, setJunEmail] = useState('');
  const [junUsername, setJunUsername] = useState('');
  const [junPassword, setJunPassword] = useState('Password123!');
  const [junPhone, setJunPhone] = useState('');
  const [junRegisterNumber, setJunRegisterNumber] = useState('');
  const [junDepartment, setJunDepartment] = useState('Computer Science & Engineering');
  const [junBatch, setJunBatch] = useState('2025-2029');
  const [junYear, setJunYear] = useState('1st Year');
  const [selectedSeniorId, setSelectedSeniorId] = useState('');

  const availablePermissions = [
    { key: 'MANAGE_USERS', label: 'Manage Users & Directory' },
    { key: 'CREATE_ADMIN', label: 'Create & Manage Admin Accounts' },
    { key: 'MANAGE_POLLS', label: 'Create & Manage Campus Student Polls' },
    { key: 'MANAGE_ISSUES', label: 'Manage Student Issues & SLA' },
    { key: 'MANAGE_EVENTS', label: 'Manage Events & Schedules' },
    { key: 'MANAGE_ANNOUNCEMENTS', label: 'Broadcast Official Circulars' },
    { key: 'MANAGE_ONBOARDING', label: 'Manage Orientation Checklist' },
    { key: 'MANAGE_QUESTIONS', label: 'Manage Common Questions FAQs' },
    { key: 'MANAGE_SUGGESTIONS', label: 'Review Student Proposals' },
    { key: 'MANAGE_EMERGENCY', label: 'Manage Emergency Contacts' },
    { key: 'MANAGE_COLLEGE_GUIDE', label: 'Manage College Info Guide' },
    { key: 'MANAGE_SYSTEM_DIAGNOSIS', label: 'Run System Health Diagnosis' },
    { key: 'MANAGE_SYSTEM_SETTINGS', label: 'Modify Platform Settings' },
    { key: 'VIEW_ANALYTICS', label: 'View Reports & Analytics' }
  ];

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsersList(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load user directory');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDirectorsAndSeniors = async () => {
    try {
      const dirRes = await api.get('/users/directors');
      setDirectorsList(dirRes.data.data);
      if (dirRes.data.data.length > 0) {
        setSelectedDirectorId(dirRes.data.data[0].director_id);
      }

      const senRes = await api.get('/users/seniors');
      setSeniorsList(senRes.data.data);
      if (senRes.data.data.length > 0) {
        setSelectedSeniorId(senRes.data.data[0].senior_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDirectorsAndSeniors();
  }, []);

  const togglePermission = (key: string) => {
    if (adminPermissions.includes(key)) {
      setAdminPermissions(adminPermissions.filter((p) => p !== key));
    } else {
      setAdminPermissions([...adminPermissions, key]);
    }
  };

  // 1. Create Admin Submit
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName || !adminEmail || !adminUsername || !adminPassword) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await api.post('/users/admin', {
        name: adminName.trim(),
        email: adminEmail.trim(),
        username: adminUsername.trim(),
        password: adminPassword.trim(),
        phone: adminPhone.trim(),
        permissions: adminPermissions
      });
      setCreatedCredential({
        role: 'ADMINISTRATOR',
        name: adminName.trim(),
        username: adminUsername.trim(),
        pass: adminPassword.trim()
      });
      setShowAdminModal(false);
      setAdminName(''); setAdminEmail(''); setAdminUsername(''); setAdminPhone('');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    }
  };

  // 2. Create Director Submit
  const handleCreateDirector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirName || !dirEmail || !dirUsername || !dirPassword || !dirDepartment) {
      toast.error('Please fill in all required director fields');
      return;
    }
    if (user?.role === 'SUPER_ADMIN' && dirPermissions.length > 0 && !dirSuperAdminPassword) {
      toast.error('Please enter your Super Admin password to grant Director permissions');
      return;
    }

    try {
      await api.post('/users/director', {
        name: dirName.trim(),
        email: dirEmail.trim(),
        username: dirUsername.trim(),
        password: dirPassword.trim(),
        phone: dirPhone.trim(),
        directorCode: 'AUTO',
        department: dirDepartment.trim(),
        permissions: dirPermissions,
        superAdminPassword: dirSuperAdminPassword.trim()
      });
      setCreatedCredential({
        role: 'DIRECTOR',
        name: dirName.trim(),
        username: dirUsername.trim(),
        pass: dirPassword.trim()
      });
      setShowDirectorModal(false);
      setDirName(''); setDirEmail(''); setDirUsername(''); setDirPhone(''); setDirDepartment('Computer Science & Engineering'); setDirPermissions([]); setDirSuperAdminPassword('');
      fetchUsers();
      fetchDirectorsAndSeniors();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create director');
    }
  };

  // 2.5 Create Faculty Submit
  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facName || !facEmail || !facUsername || !facPassword || !facDepartment) {
      toast.error('Please fill in all required faculty member fields');
      return;
    }

    try {
      await api.post('/users/faculty', {
        name: facName.trim(),
        email: facEmail.trim(),
        username: facUsername.trim(),
        password: facPassword.trim(),
        phone: facPhone.trim(),
        department: facDepartment.trim()
      });
      setCreatedCredential({
        role: 'FACULTY MEMBER',
        name: facName.trim(),
        username: facUsername.trim(),
        pass: facPassword.trim()
      });
      setShowFacultyModal(false);
      setFacName(''); setFacEmail(''); setFacUsername(''); setFacPhone(''); setFacDepartment('Computer Science & Engineering');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create faculty member');
    }
  };

  // Update Faculty Capacity Submit (SuperAdmin)
  const handleUpdateFacultyCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capacityTargetFaculty || !newMaxJuniorsVal) return;

    try {
      const facId = capacityTargetFaculty.faculty_id || capacityTargetFaculty.id;
      await api.put(`/users/faculty/${facId}/capacity`, {
        maxJuniors: parseInt(newMaxJuniorsVal)
      });
      toast.success(`Capacity for ${capacityTargetFaculty.name} updated to ${newMaxJuniorsVal} juniors!`);
      setShowCapacityModal(false);
      setCapacityTargetFaculty(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update faculty capacity');
    }
  };

  // 3. Create Senior Submit
  const handleCreateSenior = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senName || !senEmail || !senUsername || !senPassword || !senDepartment) {
      toast.error('Please fill in all required senior mentor fields');
      return;
    }
    if (user?.role === 'SUPER_ADMIN' && senPermissions.length > 0 && !senSuperAdminPassword) {
      toast.error('Please enter your Super Admin password to grant Senior permissions');
      return;
    }

    try {
      await api.post('/users/senior', {
        name: senName.trim(),
        email: senEmail.trim(),
        username: senUsername.trim(),
        password: senPassword.trim(),
        phone: senPhone.trim(),
        seniorCode: 'AUTO',
        department: senDepartment.trim(),
        directorId: selectedDirectorId,
        permissions: senPermissions,
        superAdminPassword: senSuperAdminPassword.trim()
      });
      setCreatedCredential({
        role: 'SENIOR MENTOR',
        name: senName.trim(),
        username: senUsername.trim(),
        pass: senPassword.trim()
      });
      setShowSeniorModal(false);
      setSenName(''); setSenEmail(''); setSenUsername(''); setSenPhone(''); setSenDepartment('Computer Science & Engineering'); setSenPermissions([]); setSenSuperAdminPassword('');
      fetchUsers();
      fetchDirectorsAndSeniors();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create senior mentor');
    }
  };

  // 4. Create Junior Submit
  const handleCreateJunior = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!junName || !junEmail || !junUsername || !junPassword || !junDepartment) {
      toast.error('Please fill in all required student fields');
      return;
    }

    try {
      await api.post('/users/junior', {
        name: junName.trim(),
        email: junEmail.trim(),
        username: junUsername.trim(),
        password: junPassword.trim(),
        phone: junPhone.trim(),
        registerNumber: 'AUTO',
        department: junDepartment.trim(),
        batch: junBatch,
        year: junYear,
        seniorId: selectedSeniorId
      });
      setCreatedCredential({
        role: 'JUNIOR STUDENT',
        name: junName.trim(),
        username: junUsername.trim(),
        pass: junPassword.trim()
      });
      setShowJuniorModal(false);
      setJunName(''); setJunEmail(''); setJunUsername(''); setJunPhone(''); setJunDepartment('Computer Science & Engineering');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create junior student');
    }
  };

  // Reset Password Submit
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !resetPasswordVal || !resetAdminPasswordVal) {
      toast.error('Please enter both the target user password and your administrator password');
      return;
    }
    try {
      await api.post(`/users/${resetTargetUser.id}/reset-password`, {
        newPassword: resetPasswordVal.trim(),
        adminPassword: resetAdminPasswordVal.trim()
      });
      toast.success(`Password for @${resetTargetUser.username} reset to "${resetPasswordVal.trim()}"!`, { duration: 8000 });
      setShowResetModal(false);
      setResetAdminPasswordVal('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  // Filter Users by Search Term & Active Role Filter
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = activeRoleFilter === 'ALL' || u.role === activeRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Sleek Banner Header - Matching Cohesive Design System */}
      <div className="relative overflow-hidden bg-slate-900 p-4 sm:p-5 rounded-2xl text-white shadow-md border border-slate-800">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-orange-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider">
              <Users className="w-3 h-3" /> Identity Directory
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">User Accounts & Portal Management</h1>
            <p className="text-xs text-slate-300 font-medium">Click any user card or profile button to inspect and update user accounts.</p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
            {(user?.role === 'SUPER_ADMIN' || (user?.role === 'ADMIN' && user?.permissions?.includes('CREATE_ADMIN'))) && (
              <button
                onClick={() => setShowAdminModal(true)}
                className="w-full sm:w-auto px-3.5 py-2.5 sm:py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 min-h-[42px] sm:min-h-0"
              >
                <Shield className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> Create Admin
              </button>
            )}

            {user?.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => setShowDirectorModal(true)}
                className="w-full sm:w-auto px-3.5 py-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-750 text-white font-extrabold text-xs rounded-xl border border-slate-700 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 min-h-[42px] sm:min-h-0"
              >
                <Building2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> Create Director
              </button>
            )}

            {['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') && (
              <button
                onClick={() => setShowFacultyModal(true)}
                className="w-full sm:w-auto px-3.5 py-2.5 sm:py-1.5 bg-teal-700 hover:bg-teal-600 text-white font-extrabold text-xs rounded-xl border border-teal-600 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 min-h-[42px] sm:min-h-0"
              >
                <BookOpen className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> Create Faculty
              </button>
            )}

            {['SUPER_ADMIN', 'ADMIN', 'DIRECTOR'].includes(user?.role || '') && (
              <button
                onClick={() => { fetchDirectorsAndSeniors(); setShowSeniorModal(true); }}
                className="w-full sm:w-auto px-3.5 py-2.5 sm:py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 min-h-[42px] sm:min-h-0"
              >
                <UserCheck className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> Create Senior
              </button>
            )}

            {['SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'SENIOR', 'FACULTY'].includes(user?.role || '') && (
              <button
                onClick={() => { fetchDirectorsAndSeniors(); setShowJuniorModal(true); }}
                className="w-full sm:w-auto px-3.5 py-2.5 sm:py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 min-h-[42px] sm:min-h-0"
              >
                <GraduationCap className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> Create Junior
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-Friendly Search & Role Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by name, username (@handle), email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden transition-all shadow-2xs"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {['ALL', 'DIRECTOR', 'FACULTY', 'SENIOR', 'JUNIOR', 'ADMIN'].map((r) => (
            <button
              key={r}
              onClick={() => setActiveRoleFilter(r)}
              className={`px-3 py-2 rounded-xl font-extrabold text-[11px] transition-all shrink-0 cursor-pointer ${
                activeRoleFilter === r
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Users Content */}
      {isLoading ? (
        <LoadingState message="Loading directory users & profiles..." />
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-2xs">
          <Users className="w-8 h-8 text-orange-500 mx-auto" />
          <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase">No Matching Users Found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">Try clearing search keywords or changing role filters.</p>
        </div>
      ) : (
        <>
          {/* Mobile Touch-Optimized Cards (Visible on Mobile Screens) */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {filteredUsers.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3 relative overflow-hidden">
                {/* Accent indicator line */}
                <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                  u.role === 'SUPER_ADMIN' ? 'bg-purple-600' :
                  u.role === 'DIRECTOR' ? 'bg-slate-900' :
                  u.role === 'FACULTY' ? 'bg-teal-600' :
                  u.role === 'SENIOR' ? 'bg-blue-600' :
                  'bg-emerald-600'
                }`} />

                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 pl-2">
                  <div className="flex items-center gap-2.5 font-black text-slate-900 cursor-pointer" onClick={() => setSelectedProfileId(u.id)}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-xs shrink-0 ${
                      u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                      u.role === 'DIRECTOR' ? 'bg-slate-100 text-slate-900 border border-slate-200' :
                      u.role === 'FACULTY' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                      u.role === 'SENIOR' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 hover:text-orange-600 hover:underline truncate">{u.name}</h4>
                      <p className="text-[10px] text-orange-600 font-extrabold truncate">@{u.username}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-full border uppercase tracking-wider shrink-0 ${
                    u.role === 'SUPER_ADMIN' ? 'bg-purple-950 text-purple-300 border-purple-700' :
                    u.role === 'DIRECTOR' ? 'bg-slate-900 text-white border-slate-800' :
                    u.role === 'FACULTY' ? 'bg-teal-950 text-teal-300 border-teal-700' :
                    u.role === 'SENIOR' ? 'bg-blue-950 text-blue-300 border-blue-700' :
                    'bg-emerald-950 text-emerald-300 border-emerald-700'
                  }`}>
                    {u.role.replace('_', ' ')}
                  </span>
                </div>

                {/* Contact Info & Department Badges */}
                <div className="space-y-1.5 text-xs pl-2">
                  <a href={`mailto:${u.email}`} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold hover:text-orange-600 truncate">
                    <Mail className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </a>
                  {u.phone && (
                    <a href={`tel:${u.phone}`} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold hover:text-orange-600">
                      <Phone className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span>{u.phone}</span>
                    </a>
                  )}
                  {u.department && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 mt-1">
                      <Layers className="w-3 h-3 text-slate-500" />
                      <span>{u.department}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px] pl-2">
                  <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md border uppercase ${u.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {u.is_active ? 'ACTIVE' : 'DISABLED'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedProfileId(u.id)}
                      className="px-3 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200/80 rounded-xl transition-colors cursor-pointer"
                    >
                      Profile
                    </button>
                    {['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') && (
                      <button
                        onClick={() => { setResetTargetUser(u); setShowResetModal(true); }}
                        className="px-3 py-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="w-3 h-3 text-amber-600" /> Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (Visible on Medium+ Screens) */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Full Name & Username</th>
                  <th className="p-4">Email & Department</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-black text-orange-600 hover:text-orange-700 hover:underline cursor-pointer" onClick={() => setSelectedProfileId(u.id)}>
                      <span className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-orange-500 shrink-0" />
                        <div>
                          <span>{u.name}</span>
                          <span className="block text-[10px] text-orange-600 font-extrabold">@{u.username}</span>
                        </div>
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-900 font-bold">{u.email}</p>
                      {u.department && (
                        <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 inline-block mt-0.5">
                          {u.department}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full border uppercase tracking-wider shadow-2xs ${
                        u.role === 'SUPER_ADMIN' ? 'bg-purple-950 text-purple-300 border-purple-700' :
                        u.role === 'DIRECTOR' ? 'bg-slate-900 text-white border-slate-800' :
                        u.role === 'FACULTY' ? 'bg-teal-950 text-teal-300 border-teal-700' :
                        u.role === 'SENIOR' ? 'bg-blue-950 text-blue-300 border-blue-700' :
                        'bg-emerald-950 text-emerald-300 border-emerald-700'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-bold">{u.phone || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full border uppercase tracking-wider ${u.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                        {u.is_active ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => setSelectedProfileId(u.id)}
                        className="px-3 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200/80 rounded-xl transition-colors cursor-pointer"
                      >
                        Profile
                      </button>
                      {user?.role === 'SUPER_ADMIN' && u.role === 'FACULTY' && (
                        <button
                          onClick={() => {
                            setCapacityTargetFaculty(u);
                            setNewMaxJuniorsVal((u.max_juniors || 5).toString());
                            setShowCapacityModal(true);
                          }}
                          className="px-3 py-1.5 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Edit Faculty Junior Capacity Limit"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-teal-600" /> Limit: {u.max_juniors || 5}
                        </button>
                      )}
                      {['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') && (
                        <button
                          onClick={() => { setResetTargetUser(u); setShowResetModal(true); }}
                          className="px-3 py-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" /> Reset Password
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Profile Card Modal */}
      <UserProfileModal
        userId={selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
      />

      {/* RESET PASSWORD MODAL */}
      {showResetModal && resetTargetUser && createPortal(
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-1 sm:hidden shrink-0" />
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" /> Reset Password for @{resetTargetUser.username}
              </h3>
              <button onClick={() => setShowResetModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target User Temporary Password *</label>
                <input
                  type="text"
                  required
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-orange-600 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Administrator Password (to authorize reset) *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter your current password"
                  value={resetAdminPasswordVal}
                  onChange={(e) => setResetAdminPasswordVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-hidden"
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer">Authorize & Reset Password</button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 1. CREATE ADMIN MODAL */}
      {showAdminModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-4 sm:p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-1 sm:hidden shrink-0" />

            {/* Gradient Banner Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 p-4 sm:p-4.5 rounded-2xl text-white shadow-sm">
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/20 text-white text-[9px] font-black uppercase tracking-wider">
                    <Shield className="w-3 h-3" /> System Administration
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">Create Admin Account</h3>
                  <p className="text-[11px] text-orange-100 font-medium">Grant platform management and administrative access.</p>
                </div>
                <button onClick={() => setShowAdminModal(false)} className="p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors cursor-pointer shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3.5 text-xs" autoComplete="off">
              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Full Name *</label>
                <input type="text" required value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="e.g. Sarah Jenkins" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-xs" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">Email Address *</label>
                  <input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@juniorconnect.edu" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-xs" />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">Login Username *</label>
                  <input type="text" required value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} placeholder="admin_sarah" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">Portal Password *</label>
                  <input type="password" autoComplete="new-password" required value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-xs" />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">Phone Number</label>
                  <input type="text" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} placeholder="9998887770" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-xs" />
                </div>
              </div>
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block font-black text-slate-900 uppercase text-[10px] tracking-wider">Assign Granular Permissions *</label>
                  <div className="flex gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setAdminPermissions(availablePermissions.map((p) => p.key))}
                      className="text-orange-600 font-black hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setAdminPermissions([])}
                      className="text-slate-500 font-bold hover:underline cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                  {availablePermissions.map((p) => {
                    const isChecked = adminPermissions.includes(p.key);
                    return (
                      <label
                        key={p.key}
                        onClick={() => togglePermission(p.key)}
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-orange-50 text-orange-950 border-orange-300 font-extrabold shadow-2xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded-md text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-[11px] font-extrabold tracking-wide leading-tight">{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black rounded-xl shadow-md transition-all cursor-pointer text-xs">Create Admin Account & Credentials</button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 2. CREATE DIRECTOR MODAL */}
      {showDirectorModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-4 sm:p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-1 sm:hidden shrink-0" />

            {/* Gradient Banner Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-4.5 rounded-2xl text-white shadow-sm border border-slate-800">
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[9px] font-black uppercase tracking-wider border border-indigo-500/30">
                    <Building2 className="w-3 h-3" /> Department Leadership
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">Create Director Account</h3>
                  <p className="text-[11px] text-slate-300 font-medium">Assign department head credentials and supervision scope.</p>
                </div>
                <button onClick={() => setShowDirectorModal(false)} className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateDirector} className="space-y-4 text-xs" autoComplete="off">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Director Full Name *</label>
                <input type="text" required value={dirName} onChange={(e) => setDirName(e.target.value)} placeholder="Dr. Robert Vance" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Email *</label>
                  <input type="email" required value={dirEmail} onChange={(e) => setDirEmail(e.target.value)} placeholder="director.cs@juniorconnect.edu" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login Username *</label>
                  <input type="text" required value={dirUsername} onChange={(e) => setDirUsername(e.target.value)} placeholder="director_cs" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Password *</label>
                  <input type="password" autoComplete="new-password" required value={dirPassword} onChange={(e) => setDirPassword(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile / Phone Number *</label>
                  <input type="text" required value={dirPhone} onChange={(e) => setDirPhone(e.target.value)} placeholder="e.g. +91 9876543210" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-hidden" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Director Code (Read-Only)</label>
                  <input type="text" readOnly disabled value="DIR-?? (Auto-assigned)" className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department *</label>
                  <select required value={dirDepartment} onChange={(e) => setDirDepartment(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden">
                    <option value="">Select Department Branch...</option>
                    <option value="Computer Science & Engineering">Computer Science & Engineering (CSE)</option>
                    <option value="Electronics & Communication Engineering">Electronics & Communication Engineering (ECE)</option>
                    <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering (EEE)</option>
                    <option value="Mechanical Engineering">Mechanical Engineering (MECH)</option>
                    <option value="Civil Engineering">Civil Engineering (CIVIL)</option>
                  </select>
                </div>
              </div>
              {user?.role === 'SUPER_ADMIN' && (
                <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">Super Admin: Grant Director Permissions (Optional)</label>
                    <div className="flex gap-2 text-[10px]">
                      <button type="button" onClick={() => setDirPermissions(availablePermissions.map(p => p.key))} className="text-orange-600 font-bold hover:underline cursor-pointer">Select All</button>
                      <button type="button" onClick={() => setDirPermissions([])} className="text-slate-500 font-bold hover:underline cursor-pointer">Deselect All</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                    {availablePermissions.map((p) => {
                      const isChecked = dirPermissions.includes(p.key);
                      return (
                        <label
                          key={p.key}
                          onClick={() => setDirPermissions(isChecked ? dirPermissions.filter(k => k !== p.key) : [...dirPermissions, p.key])}
                          className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                            isChecked ? 'bg-orange-50 text-orange-950 border-orange-300 font-extrabold shadow-2xs' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <input type="checkbox" checked={isChecked} onChange={() => {}} className="rounded-md text-orange-600 focus:ring-orange-500" />
                          <span className="text-[11px] font-extrabold tracking-wide leading-tight">{p.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {dirPermissions.length > 0 && (
                    <div className="pt-2">
                      <label className="block font-bold text-orange-950 mb-1">Verify Super Admin Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="Enter Super Admin Password"
                        value={dirSuperAdminPassword}
                        onChange={(e) => setDirSuperAdminPassword(e.target.value)}
                        className="w-full p-2 bg-white border border-orange-300 rounded-xl font-mono outline-hidden"
                      />
                    </div>
                  )}
                </div>
              )}
              <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-lg transition-all cursor-pointer">Create Director Account & Credentials</button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 2.5 CREATE FACULTY MODAL */}
      {showFacultyModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-4 sm:p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-1 sm:hidden shrink-0" />
            <div className="relative overflow-hidden bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 p-4 sm:p-4.5 rounded-2xl text-white shadow-sm">
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/20 text-white text-[9px] font-black uppercase tracking-wider">
                    <BookOpen className="w-3 h-3" /> Academic Faculty
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">Create Faculty Account</h3>
                  <p className="text-[11px] text-teal-100 font-medium">Faculty members operate outside the senior tree & receive junior assignments.</p>
                </div>
                <button onClick={() => setShowFacultyModal(false)} className="p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors cursor-pointer shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateFaculty} className="space-y-4 text-xs" autoComplete="off">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Faculty Full Name *</label>
                <input type="text" required value={facName} onChange={(e) => setFacName(e.target.value)} placeholder="Prof. Jane Doe" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Faculty Email *</label>
                  <input type="email" required value={facEmail} onChange={(e) => setFacEmail(e.target.value)} placeholder="faculty@college.edu" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username *</label>
                  <input type="text" required value={facUsername} onChange={(e) => setFacUsername(e.target.value)} placeholder="prof_jane" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password *</label>
                  <input type="password" autoComplete="new-password" required value={facPassword} onChange={(e) => setFacPassword(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input type="text" value={facPhone} onChange={(e) => setFacPhone(e.target.value)} placeholder="+91 9876543210" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-hidden" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Faculty Code (Read-Only)</label>
                  <input type="text" readOnly disabled value="FAC-?? (Auto-assigned)" className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department *</label>
                  <input type="text" required value={facDepartment} onChange={(e) => setFacDepartment(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-teal-700 hover:bg-teal-600 text-white font-black rounded-xl shadow-lg shadow-teal-700/30 transition-all cursor-pointer">Create Faculty Account</button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT FACULTY CAPACITY MODAL (SuperAdmin) */}
      {showCapacityModal && capacityTargetFaculty && createPortal(
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600" />
                Fix Faculty Junior Limit
              </h3>
              <button onClick={() => setShowCapacityModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateFacultyCapacity} className="space-y-4 text-xs">
              <p className="text-slate-600">
                Update the maximum number of junior students that can be assigned to <strong>{capacityTargetFaculty.name}</strong>.
              </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Max Assigned Juniors Limit</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={newMaxJuniorsVal}
                  onChange={(e) => setNewMaxJuniorsVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-900 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCapacityModal(false)} className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-teal-700 hover:bg-teal-600 text-white font-extrabold rounded-xl shadow-md">Update Capacity Limit</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 3. CREATE SENIOR MODAL */}
      {showSeniorModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-4 sm:p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-1 sm:hidden shrink-0" />

            {/* Gradient Banner Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 p-4 sm:p-4.5 rounded-2xl text-white shadow-sm">
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/20 text-white text-[9px] font-black uppercase tracking-wider">
                    <UserCheck className="w-3 h-3" /> Senior Mentorship
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">Create Senior Mentor Account</h3>
                  <p className="text-[11px] text-blue-100 font-medium">Setup mentor credentials to guide assigned junior students.</p>
                </div>
                <button onClick={() => setShowSeniorModal(false)} className="p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors cursor-pointer shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateSenior} className="space-y-4 text-xs" autoComplete="off">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Senior Full Name *</label>
                <input type="text" required value={senName} onChange={(e) => setSenName(e.target.value)} placeholder="Alex Harrison" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input type="email" required value={senEmail} onChange={(e) => setSenEmail(e.target.value)} placeholder="senior.cs@juniorconnect.edu" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login Username *</label>
                  <input type="text" required value={senUsername} onChange={(e) => setSenUsername(e.target.value)} placeholder="senior_alex" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password *</label>
                  <input type="password" autoComplete="new-password" required value={senPassword} onChange={(e) => setSenPassword(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile / Phone Number *</label>
                  <input type="text" required value={senPhone} onChange={(e) => setSenPhone(e.target.value)} placeholder="e.g. +91 9876543210" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-hidden" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Senior Code (Read-Only)</label>
                  <input type="text" readOnly disabled value="SRS-?? (Auto-assigned)" className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department *</label>
                  <select required value={senDepartment} onChange={(e) => setSenDepartment(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden">
                    <option value="">Select Department Branch...</option>
                    <option value="Computer Science & Engineering">Computer Science & Engineering (CSE)</option>
                    <option value="Electronics & Communication Engineering">Electronics & Communication Engineering (ECE)</option>
                    <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering (EEE)</option>
                    <option value="Mechanical Engineering">Mechanical Engineering (MECH)</option>
                    <option value="Civil Engineering">Civil Engineering (CIVIL)</option>
                  </select>
                </div>
              </div>
              {user?.role !== 'DIRECTOR' && (
                <div className="space-y-1.5 p-3.5 bg-blue-50/90 border-2 border-blue-200 rounded-2xl shadow-2xs">
                  <label className="block font-black text-blue-950 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" /> Assign Director Mentor *
                  </label>
                  {directorsList.length === 0 ? (
                    <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      ⚠️ No Directors found. Please create a Director account first.
                    </p>
                  ) : (
                    <select
                      required
                      value={selectedDirectorId}
                      onChange={(e) => setSelectedDirectorId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-blue-300 rounded-xl font-extrabold text-slate-900 text-xs outline-hidden shadow-xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="" className="text-slate-500 font-bold">-- Select Director Mentor --</option>
                      {directorsList.map((d) => (
                        <option key={d.director_id} value={d.director_id} className="font-extrabold text-slate-900 bg-white">
                          {d.director_name} ({d.department})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              {user?.role === 'SUPER_ADMIN' && (
                <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">Super Admin: Grant Senior Permissions (Optional)</label>
                    <div className="flex gap-2 text-[10px]">
                      <button type="button" onClick={() => setSenPermissions(availablePermissions.map(p => p.key))} className="text-blue-600 font-bold hover:underline cursor-pointer">Select All</button>
                      <button type="button" onClick={() => setSenPermissions([])} className="text-slate-500 font-bold hover:underline cursor-pointer">Deselect All</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                    {availablePermissions.map((p) => {
                      const isChecked = senPermissions.includes(p.key);
                      return (
                        <label
                          key={p.key}
                          onClick={() => setSenPermissions(isChecked ? senPermissions.filter(k => k !== p.key) : [...senPermissions, p.key])}
                          className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                            isChecked ? 'bg-blue-50 text-blue-950 border-blue-300 font-extrabold shadow-2xs' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <input type="checkbox" checked={isChecked} onChange={() => {}} className="rounded-md text-blue-600 focus:ring-blue-500" />
                          <span className="text-[11px] font-extrabold tracking-wide leading-tight">{p.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {senPermissions.length > 0 && (
                    <div className="pt-2">
                      <label className="block font-bold text-blue-950 mb-1">Verify Super Admin Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="Enter Super Admin Password"
                        value={senSuperAdminPassword}
                        onChange={(e) => setSenSuperAdminPassword(e.target.value)}
                        className="w-full p-2 bg-white border border-blue-300 rounded-xl font-mono outline-hidden"
                      />
                    </div>
                  )}
                </div>
              )}
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer">Create Senior Account & Credentials</button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 4. CREATE JUNIOR MODAL */}
      {showJuniorModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-4 sm:p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-1 sm:hidden shrink-0" />

            {/* Gradient Banner Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-4 sm:p-4.5 rounded-2xl text-white shadow-sm">
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/20 text-white text-[9px] font-black uppercase tracking-wider">
                    <GraduationCap className="w-3 h-3" /> Student Orientation
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">Create Junior Student Account</h3>
                  <p className="text-[11px] text-emerald-100 font-medium">Register student account for campus orientation and tracking.</p>
                </div>
                <button onClick={() => setShowJuniorModal(false)} className="p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors cursor-pointer shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateJunior} className="space-y-4 text-xs" autoComplete="off">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Full Name *</label>
                <input type="text" required value={junName} onChange={(e) => setJunName(e.target.value)} placeholder="Student Name" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student Email *</label>
                  <input type="email" required value={junEmail} onChange={(e) => setJunEmail(e.target.value)} placeholder="junior@juniorconnect.edu" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login Username *</label>
                  <input type="text" required value={junUsername} onChange={(e) => setJunUsername(e.target.value)} placeholder="junior_username" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password *</label>
                  <input type="password" autoComplete="new-password" required value={junPassword} onChange={(e) => setJunPassword(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile / Phone Number *</label>
                  <input type="text" required value={junPhone} onChange={(e) => setJunPhone(e.target.value)} placeholder="e.g. +91 9876543210" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-hidden" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Register Number (Read-Only)</label>
                  <input type="text" readOnly disabled value="JRS-?? (Auto-assigned)" className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department *</label>
                  <select required value={junDepartment} onChange={(e) => setJunDepartment(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden">
                    <option value="">Select Department Branch...</option>
                    <option value="Computer Science & Engineering">Computer Science & Engineering (CSE)</option>
                    <option value="Electronics & Communication Engineering">Electronics & Communication Engineering (ECE)</option>
                    <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering (EEE)</option>
                    <option value="Mechanical Engineering">Mechanical Engineering (MECH)</option>
                    <option value="Civil Engineering">Civil Engineering (CIVIL)</option>
                  </select>
                </div>
              </div>
              {user?.role !== 'SENIOR' && (
                <div className="space-y-1.5 p-3.5 bg-emerald-50/90 border-2 border-emerald-200 rounded-2xl shadow-2xs">
                  <label className="block font-black text-emerald-950 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" /> Assign Senior Mentor *
                  </label>
                  {seniorsList.length === 0 ? (
                    <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      ⚠️ No Senior Mentors found. Please create a Senior Mentor account first.
                    </p>
                  ) : (
                    <select
                      required
                      value={selectedSeniorId}
                      onChange={(e) => setSelectedSeniorId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-extrabold text-slate-900 text-xs outline-hidden shadow-xs focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="" className="text-slate-500 font-bold">-- Select Senior Mentor --</option>
                      {seniorsList.map((s) => (
                        <option key={s.senior_id} value={s.senior_id} className="font-extrabold text-slate-900 bg-white">
                          {s.senior_name} (Director: {s.director_name})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer">Create Junior Account & Credentials</button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Credential Success Modal */}
      <CredentialSuccessModal
        isOpen={!!createdCredential}
        onClose={() => setCreatedCredential(null)}
        roleName={createdCredential?.role || ''}
        fullName={createdCredential?.name || ''}
        username={createdCredential?.username || ''}
        passwordVal={createdCredential?.pass || ''}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        userId={selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
        onProfileDeleted={fetchUsers}
        onProfileUpdated={fetchUsers}
      />
    </div>
  );
};
