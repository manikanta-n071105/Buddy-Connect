import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserProfileModal } from '../common/UserProfileModal';
import { QrScannerModal } from '../common/QrScannerModal';
import { AcademicGridPattern, ShinyText } from '../bits';
import {
  LayoutDashboard,
  Users,
  Network,
  Settings,
  CircleAlert,
  ClipboardCheck,
  FileQuestion,
  Lightbulb,
  BookOpen,
  Phone,
  MessageCircle,
  BarChart3,
  Megaphone,
  ShieldCheck,
  Calendar,
  CalendarDays,
  Vote,
  LogOut,
  X,
  Crown,
  FileSpreadsheet,
  Building2,
  UserCheck,
  GraduationCap,
  UtensilsCrossed,
  Star,
  Heart,
  HeartHandshake,
  Gavel,
  QrCode,
  Smartphone
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onReplay3DIntro?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onReplay3DIntro }) => {
  const { user, logout } = useAuth();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPwa(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setCanInstallPwa(false);
      }
      setDeferredPrompt(null);
    } else {
      alert('📲 How to Install App on Phone:\n\n1. Open this website in Chrome (Android) or Safari (iPhone).\n2. Tap the Menu (⋮ or Share icon).\n3. Select "Add to Home Screen" or "Install App".\n\nYour app will be added directly to your mobile home screen with an app icon!');
    }
  };

  if (!user) return null;

  const getNavItems = () => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Approvals & Requisitions', path: '/approvals', icon: FileSpreadsheet },
          { label: 'Hierarchy Tree', path: '/hierarchy', icon: Network },
          { label: 'User Directory', path: '/users', icon: Users },
          { label: 'Special Roles Appointing Hub', path: '/admin/disciplinary-hub', icon: Gavel },
          { label: 'Mental Health Counseling', path: '/counseling', icon: Heart },
          { label: 'College Events', path: '/events', icon: Calendar },
          { label: 'Announcements', path: '/announcements', icon: Megaphone },
          { label: 'Campus Polls', path: '/polls', icon: Vote },
          { label: 'All Issues', path: '/issues', icon: CircleAlert },
          { label: 'Onboarding Checklist', path: '/onboarding', icon: ClipboardCheck },
          { label: 'Common Questions', path: '/questions', icon: FileQuestion },
          { label: 'Student Suggestions', path: '/suggestions', icon: Lightbulb },
          { label: 'Analytics & Reports', path: '/reports', icon: BarChart3 },
          { label: 'System Settings', path: '/settings', icon: Settings }
        ];

      case 'ADMIN':
        return [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Approvals & Requisitions', path: '/approvals', icon: FileSpreadsheet },
          { label: 'Hierarchy Tree', path: '/hierarchy', icon: Network },
          { label: 'User Directory', path: '/users', icon: Users },
          { label: 'Special Roles Appointing Hub', path: '/admin/disciplinary-hub', icon: Gavel },
          { label: 'Mental Health Counseling', path: '/counseling', icon: Heart },
          { label: 'College Events', path: '/events', icon: Calendar },
          { label: 'Announcements', path: '/announcements', icon: Megaphone },
          { label: 'Campus Polls', path: '/polls', icon: Vote },
          { label: 'Issues', path: '/issues', icon: CircleAlert },
          { label: 'Onboarding Checklist', path: '/onboarding', icon: ClipboardCheck },
          { label: 'Common Questions', path: '/questions', icon: FileQuestion },
          { label: 'Student Suggestions', path: '/suggestions', icon: Lightbulb },
          { label: 'College Guide', path: '/college-info', icon: BookOpen },
          { label: 'Emergency Contacts', path: '/emergency', icon: Phone },
          { label: 'Analytics', path: '/reports', icon: BarChart3 }
        ];

      case 'MENTOR': {
        const isFacultyDirector = Boolean(user.facultyId || user.is_faculty);
        const isCounselor = Boolean(user.is_counselor);
        return [
          { label: 'Director Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Approvals & Requisitions', path: '/approvals', icon: FileSpreadsheet },
          { label: 'Hierarchy Tree', path: '/hierarchy', icon: Network },
          { label: 'Seniors & Juniors', path: '/users', icon: Users },
          ...(isFacultyDirector ? [
            { label: 'Faculty Meetings', path: '/meetings', icon: CalendarDays },
            { label: 'CR Class Feedbacks', path: '/cr-feedbacks', icon: Star },
            { label: 'Class Quizzes & Analytics', path: '/quizzes', icon: FileSpreadsheet }
          ] : []),
          { label: 'Chat Center', path: '/chat', icon: MessageCircle },
          ...(isCounselor ? [{ label: 'Mental Health Counseling', path: '/counseling', icon: Heart }] : []),
          { label: 'College Events', path: '/events', icon: Calendar },
          { label: 'Announcements', path: '/announcements', icon: Megaphone },
          { label: 'Campus Polls', path: '/polls', icon: Vote },
          { label: 'Department Issues', path: '/issues', icon: CircleAlert },
          { label: 'Onboarding Checklist', path: '/onboarding', icon: ClipboardCheck },
          { label: 'Common Questions', path: '/questions', icon: FileQuestion },
          { label: 'Student Suggestions', path: '/suggestions', icon: Lightbulb },
          { label: 'Support Indicators', path: '/support-indicators', icon: ShieldCheck },
          { label: 'College Guide', path: '/college-info', icon: BookOpen },
          { label: 'Emergency Contacts', path: '/emergency', icon: Phone },
          { label: 'Analytics', path: '/reports', icon: BarChart3 }
        ];
      }

      case 'SENIOR': {
        const isMentoringSenior = user.assigned_juniors_count && user.assigned_juniors_count > 0;
        if (!isMentoringSenior) {
          // Non-mentoring senior: Hide issue pages, my juniors, onboarding, FAQs, and mentor chat
          return [
            { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
            { label: 'Class Quizzes', path: '/quizzes', icon: FileSpreadsheet },
            { label: 'Mental Health Counseling', path: '/counseling', icon: Heart },
            { label: 'College Events', path: '/events', icon: Calendar },
            { label: 'Announcements', path: '/announcements', icon: Megaphone },
            { label: 'College Guide', path: '/college-info', icon: BookOpen },
            { label: 'Emergency Contacts', path: '/emergency', icon: Phone }
          ];
        }
        return [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Class Quizzes', path: '/quizzes', icon: FileSpreadsheet },
          { label: 'My Assigned Juniors', path: '/users', icon: Users },
          { label: 'Mental Health Counseling', path: '/counseling', icon: Heart },
          { label: 'College Events', path: '/events', icon: Calendar },
          { label: 'Announcements', path: '/announcements', icon: Megaphone },
          { label: 'Assigned Issues', path: '/issues', icon: CircleAlert },
          { label: 'Onboarding Checklist', path: '/onboarding', icon: ClipboardCheck },
          { label: 'Common Questions', path: '/questions', icon: FileQuestion },
          { label: 'Student Suggestions', path: '/suggestions', icon: Lightbulb },
          { label: 'Support Indicators', path: '/support-indicators', icon: ShieldCheck },
          { label: 'Mentor Messages', path: '/chat', icon: MessageCircle },
          { label: 'College Guide', path: '/college-info', icon: BookOpen },
          { label: 'Emergency Contacts', path: '/emergency', icon: Phone }
        ];
      }

      case 'FACULTY': {
        const isCounselor = Boolean(user.is_counselor);
        return [
          { label: 'Faculty Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Approvals & Requisitions', path: '/approvals', icon: FileSpreadsheet },
          { label: 'My Class Students', path: '/users', icon: Users },
          { label: 'Faculty Meetings', path: '/meetings', icon: CalendarDays },
          { label: 'Class Quizzes & Analytics', path: '/quizzes', icon: FileSpreadsheet },
          ...(isCounselor ? [{ label: 'Mental Health Counseling', path: '/counseling', icon: Heart }] : []),
          { label: 'College Guide', path: '/college-info', icon: BookOpen },
          { label: 'Emergency Contacts', path: '/emergency', icon: Phone }
        ];
      }

      case 'JUNIOR': {
        const is2ndOr3rdYear = user.year && (user.year.includes('2nd') || user.year.includes('3rd'));
        if (is2ndOr3rdYear) {
          return [
            { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
            { label: 'Class Quizzes', path: '/quizzes', icon: FileSpreadsheet },
            { label: 'Mental Health Counseling', path: '/counseling', icon: Heart },
            { label: 'College Events', path: '/events', icon: Calendar },
            { label: 'Announcements', path: '/announcements', icon: Megaphone },
            { label: 'Campus Polls', path: '/polls', icon: Vote },
            { label: 'Student Suggestions', path: '/suggestions', icon: Lightbulb },
            { label: 'College Guide', path: '/college-info', icon: BookOpen },
            { label: 'Emergency Contacts', path: '/emergency', icon: Phone }
          ];
        }
        return [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Class Quizzes', path: '/quizzes', icon: FileSpreadsheet },
          { label: 'Mental Health Counseling', path: '/counseling', icon: Heart },
          { label: 'Mentorship Meetings', path: '/meetings', icon: CalendarDays },
          { label: 'College Events', path: '/events', icon: Calendar },
          { label: 'Announcements', path: '/announcements', icon: Megaphone },
          { label: 'Campus Polls', path: '/polls', icon: Vote },
          { label: 'My Issues', path: '/issues', icon: CircleAlert },
          { label: 'Onboarding Checklist', path: '/onboarding', icon: ClipboardCheck },
          { label: 'Common Questions', path: '/questions', icon: FileQuestion },
          { label: 'Student Suggestions', path: '/suggestions', icon: Lightbulb },
          { label: 'Chat Center', path: '/chat', icon: MessageCircle },
          { label: 'College Guide', path: '/college-info', icon: BookOpen },
          { label: 'Emergency Contacts', path: '/emergency', icon: Phone }
        ];
      }

      case 'WARDEN':
        return [
          { label: 'Warden Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Hostel Mess Headcount', path: '/hostel-mess', icon: UtensilsCrossed }
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const userPerms = user.permissions || [];

  // Append Hostel Mess link for any Hosteller student or Warden if not already present
  if ((user.residence_status === 'HOSTELLER' || user.role === 'WARDEN') && !navItems.some((i) => i.path === '/hostel-mess')) {
    const label = user.role === 'WARDEN' ? 'Hostel Mess Headcount' : 'Hostel Mess & RSVP';
    navItems.splice(1, 0, { label, path: '/hostel-mess', icon: UtensilsCrossed });
  }

  // Append items dynamically based on granted custom permissions
  if (userPerms.includes('MANAGE_EMERGENCY') && !navItems.some((i) => i.path === '/emergency')) {
    navItems.push({ label: 'Emergency Contacts', path: '/emergency', icon: Phone });
  }
  if (userPerms.includes('MANAGE_COLLEGE_GUIDE') && !navItems.some((i) => i.path === '/college-info')) {
    navItems.push({ label: 'College Guide', path: '/college-info', icon: BookOpen });
  }
  if (userPerms.includes('MANAGE_SYSTEM_SETTINGS') && !navItems.some((i) => i.path === '/settings')) {
    navItems.push({ label: 'System Settings', path: '/settings', icon: Settings });
  }

  // Appointed Class Representative (CR) confidential feedback page
  if (Boolean(user.is_cr) && !navItems.some((i) => i.path === '/cr-feedback')) {
    navItems.push({ label: 'CR Class Feedback', path: '/cr-feedback', icon: Star });
  }

  // Super Admin CR Feedbacks Audit page
  if (user.role === 'SUPER_ADMIN' && !navItems.some((i) => i.path === '/admin/cr-feedbacks')) {
    navItems.push({ label: 'CR Feedbacks Audit', path: '/admin/cr-feedbacks', icon: ShieldCheck });
  }

  // Mental Health Counseling link for Juniors, Seniors, and mentors
  if (['JUNIOR', 'SENIOR', 'MENTOR'].includes(user.role) && !navItems.some((i) => i.path === '/counseling')) {
    navItems.push({ label: 'Mental Health Counseling', path: '/counseling', icon: Heart });
  }

  // Super Admin Counselors Management page
  if (user.role === 'SUPER_ADMIN' && !navItems.some((i) => i.path === '/admin/counselors')) {
    navItems.push({ label: 'Counselors Management', path: '/admin/counselors', icon: UserCheck });
  }

  // Appointed Disciplinary Committee Members (Faculty, Director, etc.) Hub & Infractions Log
  if (Boolean(user.is_disciplinary_committee) && !navItems.some((i) => i.path === '/admin/disciplinary-hub')) {
    navItems.splice(2, 0, { label: 'Disciplinary & Infractions Hub', path: '/admin/disciplinary-hub', icon: Gavel });
  }

  // Blood Bank & Donors for ALL roles
  if (!navItems.some((i) => i.path === '/blood-bank')) {
    navItems.push({ label: 'Blood Bank & Donors', path: '/blood-bank', icon: HeartHandshake });
  }

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`w-64 bg-slate-950 text-slate-300 flex flex-col h-full h-[100dvh] max-h-screen border-r border-slate-800/90 fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="relative h-16 px-4 flex items-center justify-between border-b border-slate-800/90 bg-slate-950 overflow-hidden">
          <AcademicGridPattern className="text-orange-500/15" />
          <div
            onClick={onReplay3DIntro}
            className="relative z-10 flex items-center gap-2 overflow-hidden cursor-pointer group"
            title="Click to replay 3D College Logo Intro Animation"
          >
            <img
              src="/assets/sse-reveal.png"
              alt="Sanskrithi School of Engineering"
              className="h-7 w-auto object-contain max-w-[155px] drop-shadow-md group-hover:scale-105 transition-transform"
            />
          </div>

          {/* Close button on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="relative z-10 p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900 md:hidden rounded-lg cursor-pointer transition-colors"
              aria-label="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Profile Card & Role Badge in Sidebar */}
        <div className="px-3.5 py-3 bg-slate-950 border-b border-slate-800/80">
          <div
            onClick={() => {
              if (onClose) onClose();
              setSelectedProfileId(user.id);
            }}
            className="relative overflow-hidden flex items-center gap-3 p-2.5 bg-slate-900/80 hover:bg-slate-900 rounded-xl border border-slate-800/90 hover:border-slate-700 cursor-pointer transition-all group"
            title="Click to view your profile"
          >
            <div className="w-9.5 h-9.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 p-2 group-hover:bg-orange-500/20 transition-colors">
              {user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? (
                <Crown className="w-4 h-4 text-orange-400" />
              ) : user.role === 'MENTOR' ? (
                <Building2 className="w-4 h-4 text-orange-400" />
              ) : user.role === 'FACULTY' ? (
                <BookOpen className="w-4 h-4 text-orange-400" />
              ) : user.role === 'SENIOR' ? (
                <UserCheck className="w-4 h-4 text-orange-400" />
              ) : (
                <GraduationCap className="w-4 h-4 text-orange-400" />
              )}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-extrabold text-slate-100 truncate group-hover:text-orange-400 transition-colors">{user.name}</p>
              <p className="text-[10px] text-orange-400 font-extrabold uppercase tracking-wider">
                <ShinyText text={user.role.replace('_', ' ')} />
              </p>
            </div>
          </div>


        </div>

        {/* Scan Student QR Code Button for Admins, mentors & Faculty */}
        {['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'FACULTY'].includes(user.role) && (
          <div className="px-3.5 pt-2 pb-1">
            <button
              onClick={() => {
                if (onClose) onClose();
                setShowScannerModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-98"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan Student QR Code</span>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 text-white shadow-lg shadow-orange-600/30 scale-[1.01] border border-orange-400/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/90 hover:translate-x-1 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-amber-400'}`} />
                    <span className="tracking-wide">{item.label}</span>
                    {isActive && (
                      <span className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / Fixed Install PWA & Logout */}
        <div className="p-3.5 border-t border-slate-800/90 bg-slate-950 mt-auto sticky bottom-0 z-30 shadow-2xl backdrop-blur-md space-y-2">
          <button
            onClick={() => {
              if (onClose) onClose();
              handleInstallPWA();
            }}
            className="w-full flex items-center justify-center gap-2.5 px-3.5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer border border-indigo-500/30 active:scale-98"
          >
            <Smartphone className="w-4 h-4 text-blue-300 animate-pulse" />
            <span>Install Mobile App</span>
          </button>

          <button
            onClick={() => {
              if (onClose) onClose();
              logout();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer border border-slate-800/80 hover:border-rose-900/40 bg-slate-900/40"
          >
            <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
            <span>Sign Out / Logout</span>
          </button>
        </div>

        {/* Profile Modal */}
        <UserProfileModal
          userId={selectedProfileId}
          onClose={() => setSelectedProfileId(null)}
        />

        {/* QR Scanner Modal */}
        <QrScannerModal
          isOpen={showScannerModal}
          onClose={() => setShowScannerModal(false)}
          onStudentFound={(scannedUserId) => setSelectedProfileId(scannedUserId)}
        />
      </aside>
    </>
  );
};
