import React, { useState } from 'react';
import Lanyard from './Lanyard';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, EyeOff, ShieldCheck, Move3d, Maximize2, X, RefreshCw, QrCode, ZoomIn, ZoomOut } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface DashboardBackgroundLanyardProps {
  children?: React.ReactNode;
}

export const DashboardBackgroundLanyard: React.FC<DashboardBackgroundLanyardProps> = ({ children }) => {
  const { user } = useAuth();
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showCardModal, setShowCardModal] = useState<boolean>(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isCloseUp, setIsCloseUp] = useState<boolean>(true);

  const name = (user?.name || 'N MANIKANTA').toUpperCase();
  const department = (user?.department || 'CSE - B').toUpperCase();
  const registerNo = (user?.register_number || user?.username || '23KF1A0591').toUpperCase();
  const role = (user?.role || 'SENIOR MENTOR').toUpperCase();
  const residence = (user?.residence_status || 'DAY SCHOLAR').toUpperCase();
  const bloodGroup = (user?.blood_group || 'O +VE').toUpperCase();
  const academicYear = '2025 - 2026';
  const validUpto = 'MAY 2027';

  const verifyUrl = `https://buddy-connect-xi.vercel.app/verify?reg=${registerNo}&name=${encodeURIComponent(name)}&dept=${encodeURIComponent(department)}&role=${encodeURIComponent(role)}`;

  return (
    <div className="w-full max-w-full">
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        {/* Main Dashboard Content Column - 100% visible, zero overlap */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {children}
        </div>

        {/* Dedicated 3D Campus ID Card Showcase Panel */}
        {!isMinimized && (
          <aside className="w-full xl:w-[380px] 2xl:w-[410px] shrink-0 xl:sticky xl:top-4 z-10 transition-all duration-300">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 relative overflow-hidden flex flex-col">
              {/* Header Bar */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center font-black text-xs border border-orange-500/20">
                    <ShieldCheck className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 tracking-tight leading-tight">Campus 3D ID Pass</h4>
                    <p className="text-[10px] font-bold text-slate-400">Sanskrithi School of Engg.</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsCloseUp(!isCloseUp)}
                    className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                    title={isCloseUp ? 'Switch to Full Lanyard View' : 'Focus Card Close-up'}
                  >
                    {isCloseUp ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{isCloseUp ? 'Zoom Out' : 'Zoom In'}</span>
                  </button>
                  <button
                    onClick={() => setShowCardModal(true)}
                    className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                    title="Enlarge and inspect all details on ID card"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Inspect</span>
                  </button>
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Minimize ID Badge showcase for full dashboard width"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Realistic Top Strap Mount Bracket */}
              <div className="relative flex justify-center pt-2">
                <div className="w-20 h-3 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-full shadow-inner flex items-center justify-center border border-slate-600">
                  <div className="w-4 h-1.5 bg-orange-500 rounded-full shadow-xs" />
                </div>
              </div>

              {/* 3D Interactive Lanyard Physics Canvas */}
              <div className="w-full h-[520px] sm:h-[580px] relative select-none">
                <Lanyard
                  position={isCloseUp ? [0, -1.35, 9.2] : [0, -0.3, 14]}
                  gravity={[0, -40, 0]}
                  fov={isCloseUp ? 22 : 24}
                  bandColor="#c84724"
                  userName={name}
                  department={department}
                  registerNo={registerNo}
                  userRole={role}
                  residenceStatus={residence}
                  bloodGroup={bloodGroup}
                  academicYear={academicYear}
                  validUpto={validUpto}
                  className="w-full h-full"
                />
              </div>

              {/* Interactive Footer Hints & Quick Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5 font-bold text-slate-600">
                  <Move3d className="w-3.5 h-3.5 text-orange-600" />
                  <span>Click & Drag to swing</span>
                </div>
                <button
                  onClick={() => setShowCardModal(true)}
                  className="font-extrabold text-orange-600 hover:text-orange-700 uppercase text-[10px] tracking-wider cursor-pointer underline flex items-center gap-1"
                >
                  <QrCode className="w-3 h-3" /> View All Details
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Floating Restore Button when Minimized */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900/95 hover:bg-orange-600 border border-orange-500/40 hover:border-orange-500 text-orange-400 hover:text-white text-xs font-black shadow-xl shadow-slate-950/20 backdrop-blur-md transition-all duration-200 cursor-pointer group"
          title="Show 3D Campus ID Card Badge"
        >
          <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300" />
          <span>Show 3D ID Badge</span>
        </button>
      )}

      {/* Full-Screen High-Definition ID Card Inspector Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Top Bar */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-sm">
                  S
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">Official Campus Identity Badge</h3>
                  <p className="text-[10px] text-slate-400">Sanskrithi School of Engineering • Puttaparthi</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 hover:text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Flip between Front and Back of the badge"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isFlipped ? 'Show Front' : 'Show Back'}</span>
                </button>
                <button
                  onClick={() => setShowCardModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Card Preview Area */}
            <div className="p-6 overflow-y-auto bg-slate-100/80 flex justify-center">
              {!isFlipped ? (
                /* FRONT FACE (All details & QR Code side-by-side) */
                <div className="w-full max-w-md bg-white rounded-2xl border-2 border-slate-300 shadow-xl overflow-hidden text-slate-900 flex flex-col">
                  {/* College Header */}
                  <div className="p-4 bg-gradient-to-r from-red-800 via-orange-600 to-orange-500 text-white flex items-center gap-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-300" />
                    <div className="w-12 h-12 bg-white rounded-xl p-1 shadow-md flex items-center justify-center shrink-0 border-2 border-orange-200">
                      <img
                        src="/assets/sse-s-logo.jpg"
                        alt="Sanskrithi Logo"
                        className="w-full h-full object-contain rounded-lg"
                        onError={(e) => {
                          (e.target as any).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-white uppercase leading-tight tracking-tight drop-shadow-xs">
                        SANSKRITHI SCHOOL OF ENGINEERING
                      </h4>
                      <div className="inline-block bg-black/25 px-2 py-0.5 rounded-full mt-1">
                        <p className="text-[8px] font-black text-orange-100 uppercase tracking-wider">
                          AUTONOMOUS • AFFILIATED TO JNTUA • APPROVED BY AICTE
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Identity Card Sub-banner */}
                  <div className="bg-slate-900 text-amber-300 text-[10px] font-black uppercase tracking-wider text-center py-1">
                    ★ STUDENT IDENTITY CARD • ACADEMIC YEAR {academicYear} ★
                  </div>

                  {/* Side-by-Side Main Body */}
                  <div className="p-4 grid grid-cols-12 gap-3.5 items-stretch bg-slate-100/70">
                    {/* Left Column: Smart Pass & QR Code Side */}
                    <div className="col-span-5 bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between text-center shadow-xs">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full block">
                          Digital Campus Pass
                        </span>

                        {/* Smart Chip & Contactless indicator */}
                        <div className="flex items-center justify-between mt-2 px-1">
                          <div className="w-9 h-7 rounded-sm bg-gradient-to-br from-yellow-200 via-amber-400 to-amber-600 border border-amber-800 p-0.5 shadow-2xs flex flex-col justify-between">
                            <div className="w-full h-0.5 bg-amber-800/40" />
                            <div className="w-full h-1 border-t border-b border-amber-800/40" />
                            <div className="w-full h-0.5 bg-amber-800/40" />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-bold text-xs select-none">)))</span>
                            <span className="text-[7px] font-black uppercase text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded">
                              ● SECURE
                            </span>
                          </div>
                        </div>

                        <div className="p-1.5 bg-white rounded-lg border border-slate-200 my-2 shadow-2xs">
                          <QRCodeSVG value={verifyUrl} size={114} level="H" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded block">
                          REG ID: {registerNo}
                        </span>
                        <span className="inline-block text-[8px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 w-full">
                          ✓ SSE AUTHORIZED
                        </span>
                      </div>
                    </div>

                    {/* Right Column: All Profile Details */}
                    <div className="col-span-7 bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
                      <div className="text-[9px] font-black uppercase tracking-wider bg-orange-600 text-white text-center py-1 rounded-md shadow-2xs">
                        Official Student Credentials
                      </div>

                      <div className="space-y-1.5 text-left">
                        {/* Student Name */}
                        <div className="bg-slate-50 rounded-lg p-2 border-l-4 border-l-orange-600 border border-slate-200 shadow-2xs">
                          <span className="text-[8px] font-black uppercase tracking-wider text-orange-600 block leading-tight">Full Name</span>
                          <span className="text-xs font-black text-slate-900 leading-tight block truncate">{name}</span>
                        </div>

                        {/* Roll / Reg No */}
                        <div className="bg-slate-50 rounded-lg p-1.5 border-l-4 border-l-orange-600 border border-slate-200 shadow-2xs">
                          <span className="text-[8px] font-black uppercase tracking-wider text-orange-600 block leading-tight">Roll / Register Number</span>
                          <span className="text-xs font-black font-mono text-[#c84724] leading-tight block">{registerNo}</span>
                        </div>

                        {/* Branch / Course */}
                        <div className="bg-slate-50 rounded-lg p-1.5 border-l-4 border-l-slate-400 border border-slate-200 shadow-2xs">
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block leading-tight">Branch & Specialization</span>
                          <span className="text-[11px] font-black text-slate-900 leading-tight block">{department}</span>
                        </div>

                        {/* Designation / Role */}
                        <div className="bg-slate-50 rounded-lg p-1.5 border-l-4 border-l-orange-500 border border-slate-200 shadow-2xs flex items-center justify-between">
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block leading-tight">Campus Designation</span>
                            <span className="text-[11px] font-black text-slate-900 leading-tight block">{role}</span>
                          </div>
                          <span className="text-[8px] font-black uppercase text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded-full border border-orange-300">
                            MENTOR
                          </span>
                        </div>

                        {/* Residence */}
                        <div className="bg-slate-50 rounded-lg p-1.5 border-l-4 border-l-slate-400 border border-slate-200 shadow-2xs">
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block leading-tight">Residence Status</span>
                          <span className="text-[11px] font-black text-slate-900 leading-tight block">{residence}</span>
                        </div>

                        {/* Split: Blood Group & Validity */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="bg-slate-50 rounded-lg p-1.5 border-l-4 border-l-red-500 border border-slate-200 shadow-2xs">
                            <span className="text-[8px] font-black uppercase tracking-wider text-red-600 block leading-tight">Blood Group</span>
                            <span className="text-[11px] font-black text-red-700 leading-tight block">{bloodGroup}</span>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-1.5 border-l-4 border-l-emerald-500 border border-slate-200 shadow-2xs">
                            <span className="text-[8px] font-black uppercase tracking-wider text-emerald-600 block leading-tight">Valid Upto</span>
                            <span className="text-[11px] font-black text-slate-900 leading-tight block">{validUpto}</span>
                          </div>
                        </div>

                        {/* Helpline */}
                        <div className="bg-slate-50 rounded-lg p-1.5 border-l-4 border-l-slate-400 border border-slate-200 shadow-2xs">
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block leading-tight">24×7 Campus Helpline</span>
                          <span className="text-[10px] font-black text-slate-900 leading-tight block">+91 91009 67666</span>
                        </div>
                      </div>

                      <div className="text-[7px] text-center font-bold text-slate-400 pt-0.5">
                        DIRECTORATE OF ACADEMIC AFFAIRS • ISSUED UNDER SSE ACT
                      </div>
                    </div>
                  </div>

                  {/* Footer Barcode */}
                  <div className="p-3 bg-white border-t border-slate-200 text-center space-y-1">
                    <div className="h-6 mx-auto w-3/4 flex items-center justify-center gap-0.5">
                      {Array.from({ length: 48 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-full ${i % 3 === 0 ? 'w-1 bg-slate-900' : 'w-0.5 bg-slate-700'}`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-600 block">* {registerNo} *</span>
                    <span className="text-[9px] text-slate-500 font-semibold block">
                      Campus Helpline: +91 91009 67666 | www.sseptp.org
                    </span>
                  </div>
                </div>
              ) : (
                /* BACK FACE (Campus Directory & Emergency Helpline) */
                <div className="w-full max-w-md bg-white rounded-2xl border-2 border-slate-300 shadow-xl overflow-hidden text-slate-900 flex flex-col">
                  <div className="p-3.5 bg-orange-600 text-white text-center">
                    <h4 className="text-xs font-black uppercase tracking-tight">SANSKRITHI SCHOOL OF ENGINEERING</h4>
                    <p className="text-[10px] font-bold text-orange-200">CAMPUS EMERGENCY DIRECTORY & REGULATIONS</p>
                  </div>
                  <div className="p-5 space-y-3.5 text-xs text-slate-700 bg-slate-50/50">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                      <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider block">Important Helplines</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="font-bold text-slate-900 block">Campus Security:</span>
                          <span className="text-slate-600">+91 91009 67666</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">Hostel Office:</span>
                          <span className="text-slate-600">08555-287222</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">Medical Emergency:</span>
                          <span className="text-rose-600 font-bold">108 / 104</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">Anti-Ragging Squad:</span>
                          <span className="text-slate-600">1800-180-5522</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-[11px] shadow-2xs">
                      <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider block">Rules & Regulations</span>
                      <ul className="list-disc list-inside space-y-1 text-slate-600">
                        <li>This card is non-transferable and must be worn inside campus.</li>
                        <li>Loss of card must be reported immediately to Admin Office.</li>
                        <li>Valid across library, laboratories, and hostel facilities.</li>
                      </ul>
                    </div>

                    <div className="text-center pt-2">
                      <div className="inline-block p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <QRCodeSVG value={verifyUrl} size={90} level="M" />
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 block mt-1">Official Student Verification Code</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900 text-white text-center text-[10px] font-bold">
                    ISSUED BY DIRECTORATE OF STUDENT AFFAIRS • PUTTAPARTHI
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Close Button */}
            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowCardModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Close Badge Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
