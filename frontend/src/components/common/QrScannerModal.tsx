import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, Camera, Upload, X, Search, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentFound: (userId: string) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose, onStudentFound }) => {
  const [activeMode, setActiveMode] = useState<'CAMERA' | 'FILE' | 'MANUAL'>('CAMERA');
  const [manualInput, setManualInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [matchingCandidates, setMatchingCandidates] = useState<any[] | null>(null);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'student-qr-reader';

  const processQrPayload = async (rawPayload: string) => {
    if (!rawPayload || !rawPayload.trim()) return;

    try {
      setIsSearching(true);
      const res = await api.get('/users/scan-qr', {
        params: { payload: rawPayload.trim() }
      });

      if (res.data.isMultiple && Array.isArray(res.data.matches)) {
        setMatchingCandidates(res.data.matches);
        toast.info(`Found ${res.data.matches.length} matching student profiles. Please select one below.`);
      } else if (res.data.data && res.data.data.id) {
        setMatchingCandidates(null);
        toast.success(`Successfully scanned QR for ${res.data.data.name} (@${res.data.data.username})!`);
        stopCamera();
        onClose();
        onStudentFound(res.data.data.id);
      } else {
        toast.error('Student record not found.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No matching student found for scanned QR Code.');
    } finally {
      setIsSearching(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      await html5QrcodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 }
        },
        (decodedText) => {
          processQrPayload(decodedText);
        },
        () => {
          // ignore scan errors per frame
        }
      );

      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera Scanner Error:', err);
      setCameraError('Camera access denied or unavailable. You can upload a QR image or type student email below.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrcodeRef.current && isCameraActive) {
      try {
        await html5QrcodeRef.current.stop();
        await html5QrcodeRef.current.clear();
      } catch (e) {
        console.error(e);
      } finally {
        setIsCameraActive(false);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSearching(true);
      const html5Qrcode = new Html5Qrcode('file-scanner-temp');
      const decodedText = await html5Qrcode.scanFile(file, true);
      html5Qrcode.clear();
      processQrPayload(decodedText);
    } catch (err: any) {
      toast.error('Could not detect QR code in uploaded image. Try pasting email or scanning via camera.');
      setIsSearching(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      toast.error('Please enter student Email, Roll Number, or Username');
      return;
    }
    processQrPayload(manualInput.trim());
  };

  // Automatic Debounced Search when user types or pastes input
  useEffect(() => {
    if (activeMode !== 'MANUAL' || !manualInput.trim() || manualInput.trim().length < 3) {
      return;
    }

    const timer = setTimeout(() => {
      processQrPayload(manualInput.trim());
    }, 450);

    return () => clearTimeout(timer);
  }, [manualInput, activeMode]);

  useEffect(() => {
    if (isOpen && activeMode === 'CAMERA') {
      setTimeout(() => {
        startCamera();
      }, 100);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div id="file-scanner-temp" className="hidden" />
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Scan Student QR Code</h3>
              <p className="text-[11px] text-slate-500 font-medium">Scan QR to inspect student profile & data instantly</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-extrabold">
          <button
            onClick={() => setActiveMode('CAMERA')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'CAMERA' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Camera Scanner
          </button>
          <button
            onClick={() => setActiveMode('FILE')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'FILE' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Upload Image
          </button>
          <button
            onClick={() => setActiveMode('MANUAL')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'MANUAL' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Manual Search
          </button>
        </div>

        {/* MODE 1: CAMERA SCANNER */}
        {activeMode === 'CAMERA' && (
          <div className="space-y-3">
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[240px]">
              <div id={scannerContainerId} className="w-full h-full text-white" />
              {cameraError && (
                <div className="p-4 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-semibold">{cameraError}</p>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium text-center">
              Point student QR code at camera frame to scan automatically.
            </p>
          </div>
        )}

        {/* MODE 2: UPLOAD IMAGE SCANNER */}
        {activeMode === 'FILE' && (
          <div className="p-6 border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-2xl text-center space-y-3 bg-slate-50 transition-colors">
            <Upload className="w-10 h-10 text-orange-600 mx-auto" />
            <div>
              <h4 className="font-bold text-xs text-slate-900">Upload Student QR Code Image</h4>
              <p className="text-[11px] text-slate-500 font-medium">Select PNG, JPG, or screenshot of QR pass</p>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5" /> Browse QR Image File
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}

        {/* MULTIPLE MATCHING CANDIDATES LIST */}
        {matchingCandidates && matchingCandidates.length > 0 && (
          <div className="space-y-2.5 p-3.5 bg-orange-50/75 rounded-2xl border border-orange-200 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                {matchingCandidates.length} Matching Profiles Found:
              </span>
              <button
                type="button"
                onClick={() => setMatchingCandidates(null)}
                className="text-[10px] text-orange-700 hover:text-orange-900 font-extrabold cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {matchingCandidates.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 bg-white hover:bg-orange-100/60 border border-slate-200 hover:border-orange-400 rounded-xl flex items-center justify-between gap-2 shadow-2xs transition-all"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-xs text-slate-900 truncate">{c.name}</span>
                      {c.code && (
                        <span className="px-1.5 py-0.2 bg-slate-900 text-white text-[10px] font-black rounded-md font-mono">
                          {c.code}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 font-bold truncate">
                      {c.department || 'Dept'} {c.year ? `• ${c.year}` : ''} • @{c.username}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMatchingCandidates(null);
                      stopCamera();
                      onClose();
                      onStudentFound(c.id);
                    }}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
                  >
                    Open Profile
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODE 3: MANUAL SEARCH BY EMAIL / ROLL */}
        {activeMode === 'MANUAL' && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enter Student Email, Username, or Roll No (Auto-Searches)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Type email, roll no, or paste QR payload..."
                  className="w-full p-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-hidden focus:border-orange-500"
                />
                {isSearching ? (
                  <Loader2 className="w-4 h-4 text-orange-500 animate-spin absolute right-3 top-3" />
                ) : (
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-500 shrink-0" /> Searches automatically as you type 3+ characters.
            </p>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
