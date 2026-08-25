import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { KeyRound, Copy, Check, X, ShieldCheck } from 'lucide-react';

interface CredentialSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleName: string;
  fullName: string;
  username: string;
  passwordVal: string;
}

export const CredentialSuccessModal: React.FC<CredentialSuccessModalProps> = ({
  isOpen,
  onClose,
  roleName,
  fullName,
  username,
  passwordVal
}) => {
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, isUsername: boolean) => {
    navigator.clipboard.writeText(text);
    if (isUsername) {
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">{roleName} Created Successfully</h3>
              <p className="text-[11px] font-bold text-slate-500">{fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
          <p className="text-xs font-bold text-slate-700">Share these login credentials with the user:</p>

          {/* Username */}
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Login Username</span>
              <span className="text-xs font-black text-slate-900">{username}</span>
            </div>
            <button
              onClick={() => copyToClipboard(username, true)}
              className="px-3 py-1.5 text-xs text-orange-600 hover:bg-orange-50 border border-orange-200/80 rounded-xl flex items-center gap-1.5 transition-colors font-bold cursor-pointer"
            >
              {copiedUser ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUser ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Password */}
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Portal Password</span>
              <span className="text-xs font-black text-orange-600 font-mono">{passwordVal}</span>
            </div>
            <button
              onClick={() => copyToClipboard(passwordVal, false)}
              className="px-3 py-1.5 text-xs text-orange-600 hover:bg-orange-50 border border-orange-200/80 rounded-xl flex items-center gap-1.5 transition-colors font-bold cursor-pointer"
            >
              {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPass ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
        >
          Done & Close
        </button>
      </div>
    </div>,
    document.body
  );
};

