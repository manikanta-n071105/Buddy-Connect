  import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, Download, Copy, Check, X, ShieldCheck, Mail, Hash, User } from 'lucide-react';
import { toast } from 'sonner';
import { getBranchShortCode } from '../../types';

interface StudentQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    name?: string;
    email?: string;
    rollNo?: string;
    register_number?: string;
    senior_code?: string;
    mentor_code?: string;
    username?: string;
    department?: string;
    year?: string;
    batch?: string;
    role?: string;
  } | null;
}

export const StudentQrCodeModal: React.FC<StudentQrCodeModalProps> = ({ isOpen, onClose, student }) => {
  const [copied, setCopied] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !student) return null;

  const rollNo =
    student.rollNo ||
    student.register_number ||
    student.senior_code ||
    student.mentor_code ||
    student.username ||
    'N/A';

  const email = student.email || 'N/A';

  // QR Payload set directly to student.email matching Next.js application
  const qrDataPayload = email;

  const handleDownloadQr = () => {
    try {
      const canvas = canvasContainerRef.current?.querySelector('canvas');
      if (!canvas) {
        toast.error('QR Code canvas not available for download.');
        return;
      }
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `Student_QR_${(rollNo || student.name || 'student').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success(`Downloaded QR Code PNG for ${student.name || email}`);
    } catch (err) {
      toast.error('Failed to download QR code image.');
    }
  };

  const handleCopyData = () => {
    navigator.clipboard.writeText(qrDataPayload);
    setCopied(true);
    toast.success('QR Code email payload copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Student Verification QR Pass</h3>
              <p className="text-[10px] text-slate-500 font-medium">Matching Student App QR Pass ({email})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card matching application slate/orange theme with QR code beside details */}
        <div className="w-full rounded-3xl p-5 space-y-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 text-white flex-1">
              <h1 className="text-base font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-orange-500" /> {student.name}
              </h1>
              <p className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <Mail className="w-3.5 h-3.5 text-orange-400" /> {email}
              </p>
              {student.department && (
                <p className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                  <Hash className="w-3.5 h-3.5 text-amber-400" /> {getBranchShortCode(student.department)}
                </p>
              )}
            </div>

            {/* QR Code beside details */}
            <div className="flex flex-col items-center bg-slate-900 p-2.5 rounded-2xl border border-slate-800 shrink-0">
              <div ref={canvasContainerRef} className="p-2.5 bg-white rounded-xl shadow-md border border-slate-200">
                <QRCodeCanvas value={email} size={110} bgColor="#FFFFFF" fgColor="#000000" level="M" />
              </div>
              <span className="text-[9px] font-extrabold text-amber-400 mt-1 uppercase tracking-wider">QR Pass</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleDownloadQr}
            className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Download className="w-3.5 h-3.5" /> Download QR Code
          </button>
          <button
            onClick={handleCopyData}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            title="Copy QR Payload"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const StudentQrCodeCard: React.FC<{
  email: string;
  rollNo?: string;
  name: string;
  department?: string;
  size?: number;
  className?: string;
}> = ({ email, rollNo, name, department, size = 110, className = '' }) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    try {
      const canvas = canvasRef.current?.querySelector('canvas');
      if (!canvas) return;
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `Student_QR_${(rollNo || name).replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success(`Downloaded QR Code PNG for ${name}`);
    } catch (e) {
      toast.error('Failed to download QR code');
    }
  };

  return (
    <div
      className={`w-full rounded-2xl p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 shadow-md relative text-white border border-slate-800 flex items-center justify-between gap-4 ${className}`}
    >
      <div className="space-y-1.5 text-white flex-1">
        <h1 className="text-base font-bold flex items-center gap-2">
          <User className="w-4 h-4 text-orange-500" /> {name}
        </h1>
        <p className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
          <Mail className="w-3.5 h-3.5 text-orange-400" /> {email}
        </p>
        {department && (
          <p className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <Hash className="w-3.5 h-3.5 text-amber-400" /> {getBranchShortCode(department)}
          </p>
        )}
        <button
          onClick={handleDownload}
          className="mt-1 px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-[10px] rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
        >
          <Download className="w-3 h-3" /> Download QR
        </button>
      </div>

      <div className="flex flex-col items-center bg-slate-950 p-2 rounded-xl border border-slate-800 shrink-0">
        <div ref={canvasRef} className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
          <QRCodeCanvas value={email} size={size} bgColor="#FFFFFF" fgColor="#000000" level="M" />
        </div>
        <span className="text-[9px] font-black text-amber-400 mt-1 uppercase tracking-wider">Identity QR</span>
      </div>
    </div>
  );
};
