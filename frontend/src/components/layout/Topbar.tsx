import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserProfileModal } from '../common/UserProfileModal';
import { Bell, Search, Activity, User as UserIcon, CheckCheck, Menu } from 'lucide-react';
import { Notification } from '../../types';
import api from '../../services/api';
import { Link } from 'react-router-dom';

interface TopbarProps {
  onToggleMobileMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileMenu }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const triggerSampleNotifications = async () => {
    try {
      await api.post('/notifications/send-sample');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs transition-all">
      {/* Left Area: Hamburger Button on Mobile & Search Input */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl md:hidden transition-colors cursor-pointer"
            aria-label="Toggle Mobile Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Search Input */}
        <div className="relative w-44 sm:w-64 md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search issues, guides..."
            className="w-full pl-10 pr-3 py-1.5 bg-slate-100/70 border border-slate-200/80 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white text-slate-800 placeholder-slate-400 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Diagnostic System Health Link (Super Admin Only) */}
        {user?.role === 'SUPER_ADMIN' && (
          <Link
            to="/diagnosis"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 rounded-xl border border-slate-200/80 transition-all shadow-2xs"
            title="Portal Health & Diagnosis (Super Admin)"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Activity className="w-3.5 h-3.5 text-orange-600" />
            <span className="hidden sm:inline">System Status</span>
          </Link>
        )}

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-orange-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md shadow-orange-600/40">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200/90 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider shrink-0">Notifications</h4>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={triggerSampleNotifications}
                    className="text-[10px] font-black text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200/80 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-all"
                    title="Send upcoming event, poll, and voting notifications"
                  >
                    + Sample Alerts
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <CheckCheck className="w-3 h-3" /> Mark read
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-5 text-center space-y-2">
                    <p className="text-xs text-slate-400 font-medium">No notifications yet</p>
                    <button
                      onClick={triggerSampleNotifications}
                      className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      Send Sample Alerts
                    </button>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs transition-colors ${n.is_read ? 'bg-white' : 'bg-orange-50/40 font-medium'}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-extrabold text-slate-900 leading-tight">{n.title}</span>
                        {n.type && (
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shrink-0 ${
                            n.type === 'EVENT' ? 'bg-purple-100 text-purple-700' :
                            n.type === 'POLL' ? 'bg-blue-100 text-blue-700' :
                            n.type === 'VOTING' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {n.type}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 leading-relaxed mb-1">{n.message}</p>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Click to Open Profile */}
        <div
          onClick={() => user && setSelectedProfileId(user.id)}
          className="flex items-center gap-2 sm:gap-2.5 pl-2.5 sm:pl-3.5 border-l border-slate-200/80 cursor-pointer group"
          title="Click to view your profile card"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-md border border-slate-700/60 group-hover:scale-105 transition-transform">
            <UserIcon className="w-4 h-4 text-orange-400" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-orange-600 transition-colors">{user?.name}</p>
            <p className="text-[10px] text-orange-600 font-extrabold uppercase tracking-wider">{user?.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <UserProfileModal
        userId={selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
      />
    </header>
  );
};
