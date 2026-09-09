import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { FirstTimePasswordModal } from '../common/FirstTimePasswordModal';
import { CollegeLogo3DIntro } from '../bits/CollegeLogo3DIntro';
import { useAuth } from '../../context/AuthContext';

export const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [show3DIntro, setShow3DIntro] = useState(false);

  return (
    <div className="h-screen h-[100dvh] max-h-screen overflow-hidden flex bg-slate-50 text-slate-900 w-full max-w-full">
      {/* 3D College Logo Splash Screen Intro */}
      {show3DIntro && (
        <CollegeLogo3DIntro
          onComplete={() => setShow3DIntro(false)}
          autoHideDuration={4000}
        />
      )}


      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onReplay3DIntro={() => setShow3DIntro(true)}
      />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden w-full max-w-full">
        <Topbar onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1 p-3 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden min-h-0 w-full max-w-full">
          <Outlet />
        </main>
      </div>

      {/* Mandatory First Time Password Setup Modal */}
      <FirstTimePasswordModal />
    </div>
  );
};
