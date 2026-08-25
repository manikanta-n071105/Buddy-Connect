import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserProfileModal } from '../common/UserProfileModal';
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
  Building2,
  UserCheck,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  if (!user) return null;

  const getNavItems = () => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Hierarchy Tree', path: '/hierarchy', icon: Network },
          { label: 'User Directory', path: '/users', icon: Users },
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
          { label: 'Hierarchy Tree', path: '/hierarchy', icon: Network },
          { label: 'User Directory', path: '/users', icon: Users },
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

      case 'DIRECTOR':
        return [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Hierarchy Tree', path: '/hierarchy', icon: Network },
          { label: 'Seniors & Juniors', path: '/users', icon: Users },
          { label: 'Director Chat', path: '/chat', icon: MessageCircle },
          { label: 'College Events', path: '/events', icon: Calendar },
          { label: 'Announcements', path: '/announcements', icon: Megaphone },
          { label: 'Campus Polls', path: '/polls', icon: Vote },
          { label: 'Department Issues', path: '/issues', icon: CircleAlert },
          { label: 'Onboarding Checklist', path: '/onboarding', icon: ClipboardCheck },
          { label: 'Common Questions', path: '/questions', icon: FileQuestion },
          { label: 'Student Suggestions', path: '/suggestions', icon: Lightbulb },
          { label: 'Support Indicators', path: '/support-indicators', icon: ShieldCheck },
          { label: 'Analytics', path: '/reports', icon: BarChart3 }
        ];

      case 'SENIOR':
        return [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'My Assigned Juniors', path: '/users', icon: Users },
          { label: 'College Events', path: '/events', icon: Calendar },
          { label: 'Announcements', path: '/announcements', icon: Megaphone },
          { label: 'Campus Polls', path: '/polls', icon: Vote },
          { label: 'Assigned Issues', path: '/issues', icon: CircleAlert },
          { label: 'Onboarding Checklist', path: '/onboarding', icon: ClipboardCheck },
          { label: 'Common Questions', path: '/questions', icon: FileQuestion },
          { label: 'Student Suggestions', path: '/suggestions', icon: Lightbulb },
          { label: 'Support Indicators', path: '/support-indicators', icon: ShieldCheck },
          { label: 'Mentor Messages', path: '/chat', icon: MessageCircle }
        ];

      case 'FACULTY':
        return [
          { label: 'Faculty Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { label: 'My Assigned Juniors', path: '/users', icon: Users },
          { label: 'Student Messages', path: '/chat', icon: MessageCircle },
          { label: 'Student Issues', path: '/issues', icon: CircleAlert },
          { label: 'Student Suggestions', path: '/suggestions', icon: Lightbulb }
        ];

      case 'JUNIOR':
        return [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
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

      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const userPerms = user.permissions || [];

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
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/90 bg-slate-950">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src="/assets/sse-reveal.png"
              alt="Sanskrithi School of Engineering"
              className="h-9 w-auto object-contain max-w-[175px] drop-shadow-md"
            />
          </div>

          {/* Close button on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900 md:hidden rounded-lg cursor-pointer transition-colors"
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
            className="flex items-center gap-3 p-2.5 bg-slate-900/80 hover:bg-slate-900 rounded-xl border border-slate-800/90 hover:border-slate-700 cursor-pointer transition-all group"
            title="Click to view your profile"
          >
            <div className="w-9.5 h-9.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 p-2 group-hover:bg-orange-500/20 transition-colors">
              {user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? (
                <Crown className="w-4 h-4 text-orange-400" />
              ) : user.role === 'DIRECTOR' ? (
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
              <p className="text-[10px] text-orange-400 font-extrabold uppercase tracking-wider">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

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
                  `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/30 scale-[1.01]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 hover:translate-x-0.5'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 opacity-90" />
                <span className="tracking-wide">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / Fixed Logout */}
        <div className="p-3.5 border-t border-slate-800/90 bg-slate-950 mt-auto sticky bottom-0 z-30 shadow-2xl backdrop-blur-md">
          <button
            onClick={() => {
              if (onClose) onClose();
              logout();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer border border-slate-800 hover:border-rose-900/40 bg-slate-900/60"
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
      </aside>
    </>
  );
};
