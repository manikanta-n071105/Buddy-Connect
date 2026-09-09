import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import { CredentialSuccessModal } from '../../components/common/CredentialSuccessModal';
import { UserProfileModal } from '../../components/common/UserProfileModal';
import { GoogleAuthenticatorModal } from '../../components/common/GoogleAuthenticatorModal';
import { QrScannerModal } from '../../components/common/QrScannerModal';
import { SpotlightCard, AnimatedCounter, AcademicGridPattern, ShinyText } from '../../components/bits';
import { Users, UserPlus, Shield, Building2, BookOpen, UserCheck, GraduationCap, X, KeyRound, User as UserIcon, Search, Phone, Mail, Filter, Sparkles, ChevronRight, Layers, Lock, Bus, Home, Star, Smartphone, Gavel, QrCode } from 'lucide-react';
import { toast } from 'sonner';

import { getBranchShortCode, DEPARTMENT_OPTIONS } from '../../types';

export const UsersListPage: React.FC = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [MentorsList, setMentorsList] = useState<any[]>([]);
  const [seniorsList, setSeniorsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeRoleFilter]);

  // Profile Modal state
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Modals state
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showMentorModal, setshowMentorModal] = useState(false);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showWardenModal, setShowWardenModal] = useState(false);
  const [showSeniorModal, setShowSeniorModal] = useState(false);
  const [showJuniorModal, setShowJuniorModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);

  // Warden Form state
  const [wardenName, setWardenName] = useState('');
  const [wardenEmail, setWardenEmail] = useState('');
  const [wardenUsername, setWardenUsername] = useState('');
  const [wardenPassword, setWardenPassword] = useState('Password123!');
  const [wardenPhone, setWardenPhone] = useState('');
  const [wardenGender, setWardenGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [capacityTargetFaculty, setCapacityTargetFaculty] = useState<any>(null);
  const [newMaxJuniorsVal, setNewMaxJuniorsVal] = useState('5');
  const [resetTargetUser, setResetTargetUser] = useState<any>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('Password123!');
  const [resetAdminPasswordVal, setResetAdminPasswordVal] = useState('');

  // Disciplinary Committee Modal state
  const [showCommitteeModal, setShowCommitteeModal] = useState(false);
  const [committeeTargetUser, setCommitteeTargetUser] = useState<any>(null);
  const [committeeDesignation, setCommitteeDesignation] = useState('Committee Member');

  // Credential Success Modal state
  const [createdCredential, setCreatedCredential] = useState<{ role: string; name: string; username: string; pass: string } | null>(null);

  // 1. Admin Form state
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('Password123!');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminGender, setAdminGender] = useState<'MALE' | 'FEMALE'>('MALE');
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

  // 2. Mentor Form state
  const [mntName, setMntName] = useState('');
  const [mntEmail, setMntEmail] = useState('');
  const [mntUsername, setMntUsername] = useState('');
  const [mntPassword, setMntPassword] = useState('Password123!');
  const [mntPhone, setMntPhone] = useState('');
  const [mntGender, setMntGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [mntCode, setMntCode] = useState('');
  const [mntDepartment, setMntDepartment] = useState('CSE');
  const [mntPermissions, setMntPermissions] = useState<string[]>([]);
  const [mntSuperAdminPassword, setMntSuperAdminPassword] = useState('');
  const [mntIsFaculty, setMntIsFaculty] = useState(false);
  const [mntFacultyDept, setMntFacultyDept] = useState('CSE-A');
  const [mntFacultyYear, setMntFacultyYear] = useState('3rd Year');

  // 2.5 Faculty Form state
  const [facName, setFacName] = useState('');
  const [facEmail, setFacEmail] = useState('');
  const [facUsername, setFacUsername] = useState('');
  const [facPassword, setFacPassword] = useState('Password123!');
  const [facPhone, setFacPhone] = useState('');
  const [facGender, setFacGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [facDepartment, setFacDepartment] = useState('CSE');
  const [facYear, setFacYear] = useState('');

  // 3. Senior Form state
  const [senName, setSenName] = useState('');
  const [senEmail, setSenEmail] = useState('');
  const [senUsername, setSenUsername] = useState('');
  const [senPassword, setSenPassword] = useState('Password123!');
  const [senPhone, setSenPhone] = useState('');
  const [senGender, setSenGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [senCode, setSenCode] = useState('');
  const [senDepartment, setSenDepartment] = useState('CSE');
  const [senPermissions, setSenPermissions] = useState<string[]>([]);
  const [senSuperAdminPassword, setSenSuperAdminPassword] = useState('');
  const [senIsCr, setSenIsCr] = useState(false);
  const [selectedmentorId, setSelectedmentorId] = useState('');

  const [senResidenceStatus, setSenResidenceStatus] = useState<'DAY_SCHOLAR' | 'HOSTELLER'>('DAY_SCHOLAR');

  // 4. Junior Form state
  const [junName, setJunName] = useState('');
  const [junEmail, setJunEmail] = useState('');
  const [junUsername, setJunUsername] = useState('');
  const [junPassword, setJunPassword] = useState('Password123!');
  const [junPhone, setJunPhone] = useState('');
  const [junGender, setJunGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [junRegisterNumber, setJunRegisterNumber] = useState('');
  const [junDepartment, setJunDepartment] = useState('CSE');
  const [junBatch, setJunBatch] = useState('2025-2029');
  const [junYear, setJunYear] = useState('1st Year');
  const [junResidenceStatus, setJunResidenceStatus] = useState<'DAY_SCHOLAR' | 'HOSTELLER'>('DAY_SCHOLAR');
  const [junIsCr, setJunIsCr] = useState(false);
  const [junSuperAdminPassword, setJunSuperAdminPassword] = useState('');
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

  const fetchUsers = async (forceRefresh = false) => {
    const cacheKey = 'buddy_user_directory_cache';

    if (forceRefresh) {
      sessionStorage.removeItem(cacheKey);
    } else {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUsersList(parsed);
            setIsLoading(false);
          }
        }
      } catch (err) {
        // ignore parse error
      }
    }

    try {
      const res = await api.get('/users');
      const freshUsers = res.data.data;
      setUsersList(freshUsers);
      sessionStorage.setItem(cacheKey, JSON.stringify(freshUsers));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load user directory');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMentorsAndSeniors = async () => {
    try {
      const mentorRes = await api.get('/users/mentors');
      setMentorsList(mentorRes.data.data);
      if (mentorRes.data.data.length > 0) {
        setSelectedmentorId(mentorRes.data.data[0].mentor_id);
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
    fetchMentorsAndSeniors();
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
    if (!adminName || !adminEmail || !adminUsername || !adminPassword || !adminGender) {
      toast.error('Please fill in all required fields including Gender');
      return;
    }
    try {
      await api.post('/users/admin', {
        name: adminName.trim(),
        email: adminEmail.trim(),
        username: adminUsername.trim(),
        password: adminPassword.trim(),
        phone: adminPhone.trim(),
        gender: adminGender,
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
      fetchUsers(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    }
  };

  // 2. Create Mentor Submit
  const handleCreateMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mntName || !mntEmail || !mntUsername || !mntPassword || !mntDepartment || !mntGender) {
      toast.error('Please fill in all required mentor fields including Gender');
      return;
    }
    if (user?.role === 'SUPER_ADMIN' && mntPermissions.length > 0 && !mntSuperAdminPassword) {
      toast.error('Please enter your Super Admin password to Grant Mentor Permissions');
      return;
    }

    try {
      await api.post('/users/mentor', {
        name: mntName.trim(),
        email: mntEmail.trim(),
        username: mntUsername.trim(),
        password: mntPassword.trim(),
        phone: mntPhone.trim(),
        gender: mntGender,
        mentorCode: 'AUTO',
        department: mntDepartment.trim(),
        permissions: mntPermissions,
        superAdminPassword: mntSuperAdminPassword.trim(),
        isFaculty: mntIsFaculty,
        facultyDepartment: mntFacultyDept.trim(),
        facultyYear: mntFacultyYear
      });
      setCreatedCredential({
        role: mntIsFaculty ? 'MENTOR & FACULTY (Dual Role)' : 'MENTOR',
        name: mntName.trim(),
        username: mntUsername.trim(),
        pass: mntPassword.trim()
      });
      setshowMentorModal(false);
      setMntName(''); setMntEmail(''); setMntUsername(''); setMntPhone(''); setMntDepartment('CSE'); setMntPermissions([]); setMntSuperAdminPassword(''); setMntIsFaculty(false);
      fetchUsers(true);
      fetchMentorsAndSeniors();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create mentor');
    }
  };

  // 2.5 Create Faculty Submit
  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facName || !facEmail || !facUsername || !facPassword || !facDepartment || !facGender) {
      toast.error('Please fill in all required faculty member fields including Gender');
      return;
    }

    try {
      await api.post('/users/faculty', {
        name: facName.trim(),
        email: facEmail.trim(),
        username: facUsername.trim(),
        password: facPassword.trim(),
        phone: facPhone.trim(),
        gender: facGender,
        department: facDepartment.trim(),
        year: facYear
      });
      setCreatedCredential({
        role: 'FACULTY MEMBER',
        name: facName.trim(),
        username: facUsername.trim(),
        pass: facPassword.trim()
      });
      setShowFacultyModal(false);
      setFacName(''); setFacEmail(''); setFacUsername(''); setFacPhone(''); setFacDepartment('CSE'); setFacYear('');
      fetchUsers(true);
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
      fetchUsers(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update faculty capacity');
    }
  };

  // 2.8 Create Warden Submit
  const handleCreateWarden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wardenName || !wardenEmail || !wardenUsername || !wardenPassword || !wardenGender) {
      toast.error('Please fill in all required warden fields including Gender');
      return;
    }

    try {
      await api.post('/users/warden', {
        name: wardenName.trim(),
        email: wardenEmail.trim(),
        username: wardenUsername.trim(),
        password: wardenPassword.trim(),
        phone: wardenPhone.trim(),
        gender: wardenGender
      });
      setCreatedCredential({
        role: 'HOSTEL WARDEN',
        name: wardenName.trim(),
        username: wardenUsername.trim(),
        pass: wardenPassword.trim()
      });
      setShowWardenModal(false);
      setWardenName(''); setWardenEmail(''); setWardenUsername(''); setWardenPhone('');
      fetchUsers(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create hostel warden account');
    }
  };

  // 3. Create Senior Submit
  const handleCreateSenior = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senName || !senEmail || !senUsername || !senPassword || !senDepartment || !senGender) {
      toast.error('Please fill in all required senior mentor fields including Gender');
      return;
    }
    if ((senIsCr || (user?.role === 'SUPER_ADMIN' && senPermissions.length > 0)) && !senSuperAdminPassword) {
      toast.error('Super Admin authorization password is required for CR appointment or permission assignment.');
      return;
    }

    try {
      await api.post('/users/senior', {
        name: senName.trim(),
        email: senEmail.trim(),
        username: senUsername.trim(),
        password: senPassword.trim(),
        phone: senPhone.trim(),
        gender: senGender,
        seniorCode: 'AUTO',
        department: senDepartment.trim(),
        mentorId: selectedmentorId,
        residenceStatus: senResidenceStatus,
        isCr: senIsCr,
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
      setSenName(''); setSenEmail(''); setSenUsername(''); setSenPhone(''); setSenDepartment('CSE'); setSenResidenceStatus('DAY_SCHOLAR'); setSenIsCr(false); setSenPermissions([]); setSenSuperAdminPassword('');
      fetchUsers(true);
      fetchMentorsAndSeniors();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create senior mentor');
    }
  };

  // 4. Create Junior Submit
  const handleCreateJunior = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!junName || !junEmail || !junUsername || !junPassword || !junDepartment || !junBatch || !junYear || !junGender) {
      toast.error('Please fill in all required junior fields including Gender');
      return;
    }
    if (junIsCr && !junSuperAdminPassword) {
      toast.error('Super Admin authorization password is required to appoint Class Representative (CR).');
      return;
    }

    try {
      await api.post('/users/junior', {
        name: junName.trim(),
        email: junEmail.trim(),
        username: junUsername.trim(),
        password: junPassword.trim(),
        phone: junPhone.trim(),
        gender: junGender,
        registerNumber: 'AUTO',
        department: junDepartment.trim(),
        batch: junBatch,
        year: junYear,
        residenceStatus: junResidenceStatus,
        isCr: junIsCr,
        superAdminPassword: junSuperAdminPassword.trim(),
        seniorId: selectedSeniorId
      });
      setCreatedCredential({
        role: 'JUNIOR STUDENT',
        name: junName.trim(),
        username: junUsername.trim(),
        pass: junPassword.trim()
      });
      setShowJuniorModal(false);
      setJunName(''); setJunEmail(''); setJunUsername(''); setJunPhone(''); setJunDepartment('CSE-A'); setJunResidenceStatus('DAY_SCHOLAR'); setJunIsCr(false); setJunSuperAdminPassword('');
      fetchUsers(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create junior student');
    }
  };

  // Create Student Submit (Unified 1st, 2nd, 3rd, 4th Year Student Creation)
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!junName || !junEmail || !junUsername || !junPassword || !junDepartment || !junBatch || !junYear || !junGender) {
      toast.error('Please fill in all required student fields including Gender and Academic Year');
      return;
    }
    if (junIsCr && !junSuperAdminPassword) {
      toast.error('Super Admin authorization password is required to appoint Class Representative (CR).');
      return;
    }

    try {
      const is4thYear = junYear.toLowerCase().includes('4th');
      await api.post('/users/student', {
        name: junName.trim(),
        email: junEmail.trim(),
        username: junUsername.trim(),
        password: junPassword.trim(),
        phone: junPhone.trim(),
        gender: junGender,
        department: junDepartment.trim(),
        batch: junBatch,
        year: junYear,
        residenceStatus: junResidenceStatus,
        isCr: junIsCr,
        superAdminPassword: junSuperAdminPassword.trim(),
        seniorId: junYear.includes('1st') ? selectedSeniorId : undefined,
        mentorId: junYear.includes('4th') ? selectedmentorId : undefined
      });

      setCreatedCredential({
        role: is4thYear ? 'SENIOR MENTOR (4th Year)' : 'JUNIOR STUDENT',
        name: junName.trim(),
        username: junUsername.trim(),
        pass: junPassword.trim()
      });
      setShowStudentModal(false);
      setShowJuniorModal(false);
      setJunName(''); setJunEmail(''); setJunUsername(''); setJunPhone(''); setJunDepartment('CSE-A'); setJunYear('1st Year'); setJunResidenceStatus('DAY_SCHOLAR'); setJunIsCr(false); setJunSuperAdminPassword('');
      fetchUsers(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create student account');
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

  // Disciplinary Committee Appoint & Remove Handlers
  const handleAppointCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committeeTargetUser) return;

    try {
      await api.post('/users/disciplinary-committee/appoint', {
        userId: committeeTargetUser.id,
        designation: committeeDesignation.trim() || 'Committee Member'
      });
      toast.success(`Appointed ${committeeTargetUser.name} to Disciplinary Committee!`);
      setShowCommitteeModal(false);
      setCommitteeTargetUser(null);
      fetchUsers(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to appoint to Disciplinary Committee');
    }
  };

  const handleRemoveCommittee = async (targetUser: any) => {
    if (!window.confirm(`Are you sure you want to remove ${targetUser.name} from the Disciplinary Committee?`)) {
      return;
    }
    try {
      await api.delete(`/users/disciplinary-committee/${targetUser.id}`);
      toast.success(`Removed ${targetUser.name} from Disciplinary Committee`);
      fetchUsers(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove from Disciplinary Committee');
    }
  };

  // Filter Users by Search Term & Active Role Filter
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole =
      activeRoleFilter === 'ALL'
        ? true
        : activeRoleFilter === 'DISCIPLINARY_COMMITTEE'
        ? u.is_disciplinary_committee
        : u.role === activeRoleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  return (
    <div className="space-y-4 pb-8">
      {/* Sleek Banner Header - Matching Cohesive Design System */}
      <div className="relative overflow-hidden bg-slate-900 p-4 sm:p-5 rounded-2xl text-white shadow-md border border-slate-800">
        <AcademicGridPattern className="text-orange-500/15" />
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-orange-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider">
              <Users className="w-3 h-3" /> Identity Directory
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">User Accounts & Portal Management</h1>
            <p className="text-xs text-slate-300 font-medium">Inspect and manage accounts across all system roles.</p>
          </div>

          {/* Action Buttons Toolbar - Neatly Grouped */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 shrink-0">
            {/* Quick Tools Group */}
            {['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'FACULTY'].includes(user?.role || '') && (
              <button
                onClick={() => setShowScannerModal(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-98"
                title="Scan Student QR Code to view details"
              >
                <QrCode className="w-4 h-4" /> Scan Student QR Code
              </button>
            )}

            {/* Account Creation Suite */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800/90 shadow-2xs">
              <span className="px-2 text-[10px] font-black uppercase text-slate-400 tracking-wider hidden lg:inline">Create Accounts:</span>

              {['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'SENIOR', 'FACULTY'].includes(user?.role || '') && (
                <button
                  onClick={() => { fetchMentorsAndSeniors(); setShowStudentModal(true); }}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-extrabold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <GraduationCap className="w-3.5 h-3.5" /> Student
                </button>
              )}

              {['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') && (
                <button
                  onClick={() => setShowFacultyModal(true)}
                  className="px-3 py-1.5 bg-teal-700/90 hover:bg-teal-600 text-white font-extrabold text-xs rounded-lg border border-teal-600/50 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Faculty
                </button>
              )}

              {['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') && (
                <button
                  onClick={() => setShowWardenModal(true)}
                  className="px-3 py-1.5 bg-indigo-700/90 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-lg border border-indigo-600/50 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Building2 className="w-3.5 h-3.5" /> Warden
                </button>
              )}

              {user?.role === 'SUPER_ADMIN' && (
                <button
                  onClick={() => setshowMentorModal(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-lg border border-slate-700 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Building2 className="w-3.5 h-3.5" />Mentor</button>
              )}

              {(user?.role === 'SUPER_ADMIN' || (user?.role === 'ADMIN' && user?.permissions?.includes('CREATE_ADMIN'))) && (
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="px-3 py-1.5 bg-orange-600/90 hover:bg-orange-500 text-white font-extrabold text-xs rounded-lg border border-orange-500/50 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Shield className="w-3.5 h-3.5" /> Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Role Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-2.5">
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
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          {['ALL', 'SUPER_ADMIN', 'MENTOR', 'WARDEN', 'FACULTY', 'DISCIPLINARY_COMMITTEE', 'SENIOR', 'JUNIOR', 'ADMIN'].map((r) => (
            <button
              key={r}
              onClick={() => setActiveRoleFilter(r)}
              className={`px-3 py-2 rounded-xl font-extrabold text-[11px] transition-all shrink-0 cursor-pointer ${
                activeRoleFilter === r
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : r === 'DISCIPLINARY_COMMITTEE' ? 'Disciplinary Committee' : r.replace('_', ' ')}
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
            {paginatedUsers.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3 relative overflow-hidden">
                {/* Accent indicator line */}
                <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                  u.role === 'SUPER_ADMIN' ? 'bg-purple-600' :
                  u.role === 'MENTOR' ? 'bg-slate-900' :
                  u.role === 'WARDEN' ? 'bg-indigo-600' :
                  u.role === 'FACULTY' ? 'bg-teal-600' :
                  u.role === 'SENIOR' ? 'bg-blue-600' :
                  'bg-emerald-600'
                }`} />

                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 pl-2">
                  <div className="flex items-center gap-2.5 font-black text-slate-900 cursor-pointer" onClick={() => setSelectedProfileId(u.id)}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-xs shrink-0 ${
                      u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                      u.role === 'MENTOR' ? 'bg-slate-100 text-slate-900 border border-slate-200' :
                      u.role === 'WARDEN' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
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
                    u.role === 'MENTOR' ? 'bg-slate-900 text-white border-slate-800' :
                    u.role === 'WARDEN' ? 'bg-indigo-950 text-indigo-300 border-indigo-700' :
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
                    u.phone === 'Hidden for privacy' ? (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 font-bold italic">
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Hidden for privacy</span>
                      </span>
                    ) : (
                      <a href={`tel:${u.phone}`} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold hover:text-orange-600">
                        <Phone className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span>{u.phone}</span>
                      </a>
                    )
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {u.department && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        <Layers className="w-3 h-3 text-slate-500" />
                        <span>{getBranchShortCode(u.department)}</span>
                      </div>
                    )}
                    {['SENIOR', 'JUNIOR'].includes(u.role) && u.residence_status && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold rounded-md border ${
                        u.residence_status === 'HOSTELLER' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {u.residence_status === 'HOSTELLER' ? (
                          <>
                            <Home className="w-3 h-3 text-purple-600 shrink-0" /> Hosteller
                          </>
                        ) : (
                          <>
                            <Bus className="w-3 h-3 text-blue-600 shrink-0" /> Day Scholar
                          </>
                        )}
                      </span>
                    )}
                    {u.gender && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold rounded-md border ${
                        u.gender === 'FEMALE' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        <UserIcon className="w-3 h-3 shrink-0" /> {u.gender}
                      </span>
                    )}
                    {u.is_cr && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black rounded-md bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                        <Star className="w-3 h-3 text-amber-600 fill-amber-500 shrink-0" /> CR
                      </span>
                    )}
                    {u.is_disciplinary_committee && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black rounded-md bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
                        <Gavel className="w-3 h-3 text-purple-700 shrink-0" /> Disciplinary Committee
                      </span>
                    )}
                  </div>
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
                    {['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') && (
                      u.is_disciplinary_committee ? (
                        <button
                          onClick={() => handleRemoveCommittee(u)}
                          className="px-3 py-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Remove from Disciplinary Committee"
                        >
                          <Gavel className="w-3 h-3 text-rose-600" /> Remove Committee
                        </button>
                      ) : (u.role === 'FACULTY' || (u.role === 'MENTOR' && u.is_faculty)) ? (
                        <button
                          onClick={() => {
                            setCommitteeTargetUser(u);
                            setCommitteeDesignation('Committee Member');
                            setShowCommitteeModal(true);
                          }}
                          className="px-3 py-1.5 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Appoint to Disciplinary Committee"
                        >
                          <Gavel className="w-3 h-3 text-purple-600" /> Appoint Committee
                        </button>
                      ) : null
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (Visible on Medium+ Screens) */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="p-4 min-w-[200px]">Full Name & Username</th>
                  <th className="p-4 min-w-[260px]">Email & Details</th>
                  <th className="p-4 min-w-[130px]">Assigned Role</th>
                  <th className="p-4 min-w-[150px]">Phone Number</th>
                  <th className="p-4 min-w-[120px]">Account Status</th>
                  <th className="p-4 min-w-[140px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {paginatedUsers.map((u) => (
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
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {u.department && (
                          <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 inline-block">
                            {getBranchShortCode(u.department)}
                          </span>
                        )}
                        {['SENIOR', 'JUNIOR'].includes(u.role) && u.residence_status && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                            u.residence_status === 'HOSTELLER' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {u.residence_status === 'HOSTELLER' ? (
                              <>
                                <Home className="w-3 h-3 text-purple-600 shrink-0" /> Hosteller
                              </>
                            ) : (
                              <>
                                <Bus className="w-3 h-3 text-blue-600 shrink-0" /> Day Scholar
                              </>
                            )}
                          </span>
                        )}
                        {u.gender && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                            u.gender === 'FEMALE' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            <UserIcon className="w-3 h-3 shrink-0" /> {u.gender}
                          </span>
                        )}
                        {u.is_cr && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                            <Star className="w-3 h-3 text-amber-600 fill-amber-500 shrink-0" /> CR
                          </span>
                        )}
                        {u.is_disciplinary_committee && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
                            <Gavel className="w-3 h-3 text-purple-700 shrink-0" /> Disciplinary Committee
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full border uppercase tracking-wider shadow-2xs whitespace-nowrap ${
                        u.role === 'SUPER_ADMIN' ? 'bg-purple-950 text-purple-300 border-purple-700' :
                        u.role === 'MENTOR' ? 'bg-slate-900 text-white border-slate-800' :
                        u.role === 'WARDEN' ? 'bg-indigo-950 text-indigo-300 border-indigo-700' :
                        u.role === 'FACULTY' ? 'bg-teal-950 text-teal-300 border-teal-700' :
                        u.role === 'SENIOR' ? 'bg-blue-950 text-blue-300 border-blue-700' :
                        'bg-emerald-950 text-emerald-300 border-emerald-700'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-bold">
                      {u.phone === 'Hidden for privacy' ? (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-bold italic text-[11px]">
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Hidden for privacy
                        </span>
                      ) : (
                        u.phone || 'N/A'
                      )}
                    </td>
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
                      {['SUPER_ADMIN', 'ADMIN', 'MENTOR'].includes(user?.role || '') && (
                        u.is_disciplinary_committee ? (
                          <button
                            onClick={() => handleRemoveCommittee(u)}
                            className="px-3 py-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                            title="Remove from Disciplinary Committee"
                          >
                            <Gavel className="w-3.5 h-3.5 text-rose-600" /> Remove Committee
                          </button>
                        ) : (u.role === 'FACULTY' || (u.role === 'MENTOR' && u.is_faculty)) ? (
                          <button
                            onClick={() => {
                              setCommitteeTargetUser(u);
                              setCommitteeDesignation('Committee Member');
                              setShowCommitteeModal(true);
                            }}
                            className="px-3 py-1.5 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                            title="Appoint to Disciplinary Committee"
                          >
                            <Gavel className="w-3.5 h-3.5 text-purple-600" /> Appoint Committee
                          </button>
                        ) : null
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Navigation Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-slate-700">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-500 font-bold">
                Showing <span className="text-slate-900 font-black">{(safeCurrentPage - 1) * pageSize + 1}</span> to <span className="text-slate-900 font-black">{Math.min(safeCurrentPage * pageSize, filteredUsers.length)}</span> of <span className="text-slate-900 font-black">{filteredUsers.length}</span> users
              </span>
              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                <span className="text-slate-400 font-bold">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-900 font-black focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1 self-center sm:self-auto">
              <button
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 disabled:opacity-40 disabled:hover:bg-slate-50 disabled:hover:text-slate-700 disabled:hover:border-slate-200 transition-all font-black text-xs cursor-pointer"
              >
                Previous
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="text-slate-400 font-bold px-1">...</span>}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-xl font-black text-xs transition-all cursor-pointer ${
                            p === safeCurrentPage
                              ? 'bg-orange-600 text-white shadow-xs'
                              : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 disabled:opacity-40 disabled:hover:bg-slate-50 disabled:hover:text-slate-700 disabled:hover:border-slate-200 transition-all font-black text-xs cursor-pointer"
              >
                Next
              </button>
            </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">Phone Number</label>
                  <input type="text" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} placeholder="9998887770" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-xs" />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1">Gender Classification *</label>
                  <select required value={adminGender} onChange={(e) => setAdminGender(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-xs cursor-pointer">
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
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

      {/* 2. CREATE MENTOR MODAL */}
      {showMentorModal && createPortal(
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
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">Create Mentor Account</h3>
                  <p className="text-[11px] text-slate-300 font-medium">Assign department head credentials and supervision scope.</p>
                </div>
                <button onClick={() => setshowMentorModal(false)} className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateMentor} className="space-y-4 text-xs" autoComplete="off">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mentor Full Name *</label>
                <input type="text" required value={mntName} onChange={(e) => setMntName(e.target.value)} placeholder="Dr. Robert Vance" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Email *</label>
                  <input type="email" required value={mntEmail} onChange={(e) => setMntEmail(e.target.value)} placeholder="mentor.cs@juniorconnect.edu" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login Username *</label>
                  <input type="text" required value={mntUsername} onChange={(e) => setMntUsername(e.target.value)} placeholder="director_cs" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Password *</label>
                  <input type="password" autoComplete="new-password" required value={mntPassword} onChange={(e) => setMntPassword(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile / Phone Number *</label>
                  <input type="text" required value={mntPhone} onChange={(e) => setMntPhone(e.target.value)} placeholder="e.g. +91 9876543210" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-hidden" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mentor Code (Read-Only)</label>
                  <input type="text" readOnly disabled value="DIR-?? (Auto-assigned)" className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department *</label>
                  <select required value={mntDepartment} onChange={(e) => setMntDepartment(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden">
                    <option value="">Select Department Branch...</option>
                    {DEPARTMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Gender Classification *</label>
                <select required value={mntGender} onChange={(e) => setMntGender(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden cursor-pointer">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              {/* Dual Role Toggle: Appoint as Faculty Member */}
              <div className="bg-purple-50/80 p-3.5 rounded-2xl border border-purple-200 space-y-2.5">
                <label className="flex items-center gap-2 font-black text-purple-950 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mntIsFaculty}
                    onChange={(e) => setMntIsFaculty(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500 accent-purple-600 cursor-pointer"
                  />
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-purple-600" /> Dual Role: Also Appoint as Faculty Member (Class Teacher)
                  </span>
                </label>

                {mntIsFaculty && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-purple-950 text-[11px] mb-1">Faculty Branch / Section *</label>
                      <select
                        required
                        value={mntFacultyDept}
                        onChange={(e) => setMntFacultyDept(e.target.value)}
                        className="w-full p-2 bg-white border border-purple-300 rounded-xl font-extrabold text-slate-900 text-xs outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer"
                      >
                        <option value="">Select Branch...</option>
                        {DEPARTMENT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-purple-950 text-[11px] mb-1">Faculty Academic Year *</label>
                      <select
                        required
                        value={mntFacultyYear}
                        onChange={(e) => setMntFacultyYear(e.target.value)}
                        className="w-full p-2 bg-white border border-purple-300 rounded-xl font-extrabold text-slate-900 text-xs outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer"
                      >
                        <option value="">Select Year...</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="All Years">All Years</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              {user?.role === 'SUPER_ADMIN' && (
                <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">Super Admin: Grant Mentor Permissions (Optional)</label>
                    <div className="flex gap-2 text-[10px]">
                      <button type="button" onClick={() => setMntPermissions(availablePermissions.map(p => p.key))} className="text-orange-600 font-bold hover:underline cursor-pointer">Select All</button>
                      <button type="button" onClick={() => setMntPermissions([])} className="text-slate-500 font-bold hover:underline cursor-pointer">Deselect All</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                    {availablePermissions.map((p) => {
                      const isChecked = mntPermissions.includes(p.key);
                      return (
                        <label
                          key={p.key}
                          onClick={() => setMntPermissions(isChecked ? mntPermissions.filter(k => k !== p.key) : [...mntPermissions, p.key])}
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
                  {mntPermissions.length > 0 && (
                    <div className="pt-2">
                      <label className="block font-bold text-orange-950 mb-1">Verify Super Admin Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="Enter Super Admin Password"
                        value={mntSuperAdminPassword}
                        onChange={(e) => setMntSuperAdminPassword(e.target.value)}
                        className="w-full p-2 bg-white border border-orange-300 rounded-xl font-mono outline-hidden"
                      />
                    </div>
                  )}
                </div>
              )}
              <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-lg transition-all cursor-pointer">Create Mentor Account & Credentials</button>
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
            {/* Class Mapping Info Banner */}
            <div className="bg-teal-50 border border-teal-200 p-3 rounded-2xl text-xs text-teal-950 font-bold space-y-0.5">
              <div className="flex items-center gap-1.5 font-black text-teal-900">
                <BookOpen className="w-4 h-4 text-teal-600" /> Automatic Class Student Mapping
              </div>
              <p className="text-[11px] text-teal-800 font-medium">
                Select both <strong>Department Branch</strong> (e.g. CSE-A, CSE-B) and <strong>Academic Year</strong> (e.g. 3rd Year). All students belonging to that class will be automatically mapped to this Faculty member.
              </p>
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
                  <label className="block font-bold text-slate-700 mb-1">Department Branch / Section *</label>
                  <select required value={facDepartment} onChange={(e) => setFacDepartment(e.target.value)} className="w-full p-2.5 bg-white border border-teal-300 rounded-xl font-extrabold text-slate-900 outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer">
                    <option value="">Select Branch Section...</option>
                    {DEPARTMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Year (Class Mapping) *</label>
                  <select required value={facYear} onChange={(e) => setFacYear(e.target.value)} className="w-full p-2.5 bg-white border border-teal-300 rounded-xl font-extrabold text-slate-900 outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer">
                    <option value="">Select Academic Year...</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="All Years">All Years (Manual Mapping)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Faculty Code (Read-Only)</label>
                  <input type="text" readOnly disabled value="FAC-?? (Auto-assigned)" className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender Classification *</label>
                  <select required value={facGender} onChange={(e) => setFacGender(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden cursor-pointer">
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-teal-700 hover:bg-teal-600 text-white font-black rounded-xl shadow-lg shadow-teal-700/30 transition-all cursor-pointer">Create Faculty Account & Auto-Map Students</button>
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
                    {DEPARTMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Residence Status *</label>
                  <select value={senResidenceStatus} onChange={(e) => setSenResidenceStatus(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden">
                    <option value="DAY_SCHOLAR">Day Scholar</option>
                    <option value="HOSTELLER">Hosteller</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender Classification *</label>
                  <select required value={senGender} onChange={(e) => setSenGender(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden cursor-pointer">
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>
              <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 space-y-2.5">
                <label className="flex items-center gap-2 font-black text-amber-950 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={senIsCr}
                    onChange={(e) => setSenIsCr(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 accent-amber-600 cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> Appoint as Class Representative (CR)
                  </span>
                </label>
                {senIsCr && (
                  <div>
                    <label className="block font-extrabold text-amber-950 text-[11px] mb-1">
                      Super Administrator Authorization Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={senSuperAdminPassword}
                      onChange={(e) => setSenSuperAdminPassword(e.target.value)}
                      placeholder="Enter Super Admin Password to authorize CR appointment..."
                      className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-mono outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>
              {user?.role !== 'MENTOR' && (
                <div className="space-y-1.5 p-3.5 bg-blue-50/90 border-2 border-blue-200 rounded-2xl shadow-2xs">
                  <label className="block font-black text-blue-950 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" /> Assign Mentor *
                  </label>
                  {MentorsList.length === 0 ? (
                    <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      ⚠️ No mentors found. Please create a Mentor Account first.
                    </p>
                  ) : (
                    <select
                      required
                      value={selectedmentorId}
                      onChange={(e) => setSelectedmentorId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-blue-300 rounded-xl font-extrabold text-slate-900 text-xs outline-hidden shadow-xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="" className="text-slate-500 font-bold">-- Select Mentor --</option>
                      {MentorsList.map((d) => (
                        <option key={d.mentor_id} value={d.mentor_id} className="font-extrabold text-slate-900 bg-white">
                          {d.mentor_name} ({d.department})
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

      {/* 4. CREATE STUDENT MODAL (UNIFIED BY ACADEMIC YEAR) */}
      {(showStudentModal || showJuniorModal) && createPortal(
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-4 sm:p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-1 sm:hidden shrink-0" />

            {/* Gradient Banner Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 p-4 sm:p-4.5 rounded-2xl text-white shadow-sm">
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/20 text-white text-[9px] font-black uppercase tracking-wider">
                    <GraduationCap className="w-3 h-3" /> Student Management
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">Create Student Account</h3>
                  <p className="text-[11px] text-emerald-100 font-medium">Select Academic Year (1st, 2nd, 3rd Year = Junior Student, 4th Year = Senior Mentor).</p>
                </div>
                <button onClick={() => { setShowStudentModal(false); setShowJuniorModal(false); }} className="p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors cursor-pointer shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dynamic Role Mapping Banner */}
            <div className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center gap-2 transition-all ${
              junYear.includes('4th')
                ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-2xs'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-2xs'
            }`}>
              {junYear.includes('4th') ? (
                <>
                  <UserCheck className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                  <span>4th Year Selected $\rightarrow$ Account role will be set to <strong>SENIOR MENTOR</strong> (Mentor for Juniors).</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                  <span>{junYear} Selected $\rightarrow$ Account role will be set to <strong>JUNIOR STUDENT</strong> (Mentee).</span>
                </>
              )}
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs" autoComplete="off">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Full Name *</label>
                <input type="text" required value={junName} onChange={(e) => setJunName(e.target.value)} placeholder="Student Name" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student Email *</label>
                  <input type="email" required value={junEmail} onChange={(e) => setJunEmail(e.target.value)} placeholder="student@juniorconnect.edu" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login Username *</label>
                  <input type="text" required value={junUsername} onChange={(e) => setJunUsername(e.target.value)} placeholder="student_username" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
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
                  <label className="block font-bold text-slate-700 mb-1">Academic Year *</label>
                  <select
                    required
                    value={junYear}
                    onChange={(e) => setJunYear(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-900 outline-hidden cursor-pointer"
                  >
                    <option value="1st Year">1st Year (Junior Student)</option>
                    <option value="2nd Year">2nd Year (Junior Student)</option>
                    <option value="3rd Year">3rd Year (Junior Student)</option>
                    <option value="4th Year">4th Year (Senior Mentor)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department *</label>
                  <select required value={junDepartment} onChange={(e) => setJunDepartment(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden">
                    <option value="">Select Department Branch...</option>
                    {DEPARTMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Residence Status *</label>
                  <select value={junResidenceStatus} onChange={(e) => setJunResidenceStatus(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden">
                    <option value="DAY_SCHOLAR">Day Scholar</option>
                    <option value="HOSTELLER">Hosteller</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender Classification *</label>
                  <select required value={junGender} onChange={(e) => setJunGender(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden cursor-pointer">
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>
              <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 space-y-2.5">
                <label className="flex items-center gap-2 font-black text-amber-950 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={junIsCr}
                    onChange={(e) => setJunIsCr(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 accent-amber-600 cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> Appoint as Class Representative (CR)
                  </span>
                </label>
                {junIsCr && (
                  <div>
                    <label className="block font-extrabold text-amber-950 text-[11px] mb-1">
                      Super Administrator Authorization Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={junSuperAdminPassword}
                      onChange={(e) => setJunSuperAdminPassword(e.target.value)}
                      placeholder="Enter Super Admin Password to authorize CR appointment..."
                      className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-mono outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>
              {/* 1st Year: Optional Senior Mentor Selection */}
              {junYear.includes('1st') && user?.role !== 'SENIOR' && (
                <div className="space-y-1.5 p-3.5 bg-emerald-50/90 border-2 border-emerald-200 rounded-2xl shadow-2xs">
                  <label className="block font-black text-emerald-950 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" /> Assign Senior Mentor (Optional for 1st Year)
                  </label>
                  {seniorsList.length === 0 ? (
                    <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      ⚠️ No 4th Year Senior Mentors found. You can create a 4th Year Student account first.
                    </p>
                  ) : (
                    <select
                      value={selectedSeniorId}
                      onChange={(e) => setSelectedSeniorId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-extrabold text-slate-900 text-xs outline-hidden shadow-xs focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="" className="text-slate-500 font-bold">-- Select Senior Mentor --</option>
                      {seniorsList.map((s) => (
                        <option key={s.senior_id} value={s.senior_id} className="font-extrabold text-slate-900 bg-white">
                          {s.senior_name} (Mentor: {s.mentor_name})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* 4th Year: Required Mentor Selection */}
              {junYear.includes('4th') && user?.role !== 'MENTOR' && (
                <div className="space-y-1.5 p-3.5 bg-blue-50/90 border-2 border-blue-200 rounded-2xl shadow-2xs">
                  <label className="block font-black text-blue-950 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" /> Assign Mentor / Department Head *
                  </label>
                  {MentorsList.length === 0 ? (
                    <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      ⚠️ No mentors found. Please create a Mentor Account first.
                    </p>
                  ) : (
                    <select
                      required
                      value={selectedmentorId}
                      onChange={(e) => setSelectedmentorId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-blue-300 rounded-xl font-extrabold text-slate-900 text-xs outline-hidden shadow-xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="" className="text-slate-500 font-bold">-- Select Department Mentor --</option>
                      {MentorsList.map((d) => (
                        <option key={d.mentor_id} value={d.mentor_id} className="font-extrabold text-slate-900 bg-white">
                          {d.mentor_name} ({d.department})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer">
                Create {junYear.includes('4th') ? '4th Year Senior Mentor' : 'Junior Student'} Account
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Create Warden Modal */}
      {showWardenModal && createPortal(
        <div className="fixed inset-[0] z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-4 sm:p-4.5 rounded-2xl text-white shadow-sm">
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/20 text-white text-[9px] font-black uppercase tracking-wider">
                    <Building2 className="w-3 h-3" /> Hostel Administration
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">Create Hostel Warden Account</h3>
                  <p className="text-[11px] text-indigo-200 font-medium">Create Warden account to manage daily meal menus and headcount.</p>
                </div>
                <button onClick={() => setShowWardenModal(false)} className="p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors cursor-pointer shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateWarden} className="space-y-4 text-xs" autoComplete="off">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Warden Full Name *</label>
                <input type="text" required value={wardenName} onChange={(e) => setWardenName(e.target.value)} placeholder="Warden Name" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Warden Email *</label>
                  <input type="email" required value={wardenEmail} onChange={(e) => setWardenEmail(e.target.value)} placeholder="warden@juniorconnect.edu" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login Username *</label>
                  <input type="text" required value={wardenUsername} onChange={(e) => setWardenUsername(e.target.value)} placeholder="warden_username" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password *</label>
                  <input type="password" autoComplete="new-password" required value={wardenPassword} onChange={(e) => setWardenPassword(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile / Phone Number</label>
                  <input type="text" value={wardenPhone} onChange={(e) => setWardenPhone(e.target.value)} placeholder="e.g. +91 9876543210" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-hidden" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Gender Classification *</label>
                <select required value={wardenGender} onChange={(e) => setWardenGender(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden cursor-pointer">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer">Create Warden Account & Credentials</button>
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
        onProfileDeleted={() => fetchUsers(true)}
        onProfileUpdated={() => fetchUsers(true)}
      />

      {/* APPOINT DISCIPLINARY COMMITTEE MODAL */}
      {showCommitteeModal && committeeTargetUser && createPortal(
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-1 sm:hidden shrink-0" />
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Gavel className="w-4 h-4 text-purple-600" /> Appoint Disciplinary Member
              </h3>
              <button onClick={() => setShowCommitteeModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAppointCommittee} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Faculty Member</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900">
                  {committeeTargetUser.name} <span className="text-purple-600">(@{committeeTargetUser.username})</span>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Committee Designation / Role *</label>
                <input
                  type="text"
                  required
                  value={committeeDesignation}
                  onChange={(e) => setCommitteeDesignation(e.target.value)}
                  placeholder="e.g. Committee Convener, Member, Senior Advisor"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCommitteeModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-extrabold text-white bg-purple-700 hover:bg-purple-600 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Gavel className="w-3.5 h-3.5" /> Appoint Member
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onStudentFound={(scannedUserId) => setSelectedProfileId(scannedUserId)}
      />
    </div>
  );
};
