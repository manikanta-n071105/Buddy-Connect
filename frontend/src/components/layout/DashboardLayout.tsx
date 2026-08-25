import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { FirstTimePasswordModal } from '../common/FirstTimePasswordModal';

export const DashboardLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen h-[100dvh] max-h-screen overflow-hidden flex bg-slate-50 text-slate-900">
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1 p-3 sm:p-6 md:p-8 overflow-y-auto min-h-0">
          <Outlet />
        </main>
      </div>

      {/* Mandatory First Time Password Setup Modal */}
      <FirstTimePasswordModal />
    </div>
  );
};
