import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { ShieldCheck, Copy, Check, Lock, Smartphone, X, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

interface GoogleAuthenticatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GoogleAuthenticatorModal: React.FC<GoogleAuthenticatorModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetch2FASetup = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/2fa/setup');
      setQrCodeUrl(res.data.data.qrCodeUrl);
      setSecretKey(res.data.data.secret);
      setIs2FAEnabled(res.data.data.totpEnabled);
    } catch (err: any) {
      toast.error('Failed to initialize Google Authenticator 2FA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetch2FASetup();
      setOtpCode('');
    }
  }, [isOpen]);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    toast.success('Secret key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      toast.error('Please enter the 6-digit code from Google Authenticator App');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await api.post('/auth/2fa/verify-setup', { code: otpCode.trim() });
      toast.success(res.data.message || 'Google Authenticator 2FA enabled successfully!');
      setIs2FAEnabled(true);
      onSuccess?.();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid 6-digit code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      toast.error('Enter 6-digit Google Authenticator code to disable 2FA');
      return;
    }

    if (!window.confirm('Are you sure you want to disable Google Authenticator 2FA? Permission updates will no longer require 2FA authentication.')) {
      return;
    }

    setIsVerifying(true);
    try {
      const res = await api.post('/auth/2fa/disable', { code: otpCode.trim() });
      toast.success(res.data.message || 'Google Authenticator 2FA disabled.');
      setIs2FAEnabled(false);
      fetch2FASetup();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-[9999] animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-sm sm:max-w-md w-full p-5 space-y-4 max-h-[85vh] flex flex-col justify-between relative overflow-hidden my-auto">
        
        {/* Header (Shrink-0) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Google Authenticator 2FA</h3>
              <p className="text-[11px] text-slate-500 font-medium">Super Admin Permission Authorization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center space-y-2 flex-1 flex flex-col items-center justify-center">
            <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-semibold">Generating Google Authenticator QR Code...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {/* Status Banner */}
            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold ${
              is2FAEnabled
                ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                : 'bg-amber-50 text-amber-950 border-amber-200'
            }`}>
              <ShieldCheck className={`w-4 h-4 shrink-0 ${is2FAEnabled ? 'text-emerald-600' : 'text-amber-600'}`} />
              <div>
                <p className="font-extrabold text-xs">
                  {is2FAEnabled ? 'Google Authenticator 2FA Active' : '2FA Setup Required'}
                </p>
                <p className="text-[10px] opacity-85 leading-tight">
                  {is2FAEnabled
                    ? 'Your account is secured. Permission updates require a 6-digit Google Authenticator code.'
                    : 'Scan the QR code below using Google Authenticator App on your phone.'}
                </p>
              </div>
            </div>

            {/* Setup Instructions & QR Code */}
            {!is2FAEnabled && (
              <div className="space-y-3 bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80">
                <div className="space-y-1.5 text-[11px] text-slate-700 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center shrink-0">1</span>
                    <span>Install <strong>Google Authenticator</strong> from App Store / Play Store.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center shrink-0">2</span>
                    <span>Tap <strong>"+"</strong> in app and scan this QR code:</span>
                  </div>
                </div>

                {/* QR Code Canvas Display */}
                {qrCodeUrl && (
                  <div className="flex flex-col items-center justify-center p-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
                    <img src={qrCodeUrl} alt="Google Authenticator QR Code" className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-lg" />
                    <p className="text-[9px] text-slate-400 font-extrabold mt-1 uppercase tracking-wider">Scan with Google Authenticator</p>
                  </div>
                )}

                {/* Manual Secret Key Backup */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Manual Entry Secret Key:</span>
                  <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <code className="text-[11px] font-mono font-bold text-slate-900 tracking-wider flex-1 truncate">{secretKey}</code>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* OTP Code Input Verification Form */}
            <form onSubmit={handleVerify2FA} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  {is2FAEnabled ? 'Verify 6-Digit Code' : 'Step 3: Enter 6-Digit Code from App *'}
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    placeholder="e.g. 482910"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-black tracking-widest text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all text-center"
                  />
                </div>
              </div>

              <div className="pt-1">
                {!is2FAEnabled ? (
                  <button
                    type="submit"
                    disabled={isVerifying || otpCode.length !== 6}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isVerifying ? 'Verifying Code...' : 'Verify & Enable Google 2FA'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDisable2FA}
                    disabled={isVerifying || otpCode.length !== 6}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    Disable 2FA Security
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
