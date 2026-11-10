import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, Camera, Upload, X, Search, AlertCircle, Loader2, Sparkles } from 'lucide-react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [matchingCandidates, setMatchingCandidates] = useState<any[] | null>(null);

  const isProcessingRef = useRef(false);
  const lastScannedPayloadRef = useRef<{ text: string; time: number } | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'student-qr-reader';

  const resetScannerState = (delayMs = 1500) => {
    setTimeout(() => {
      isProcessingRef.current = false;
      setIsProcessing(false);
      try {
        if (html5QrcodeRef.current && isCameraActive) {
          html5QrcodeRef.current.resume();
        }
      } catch (e) {
        // ignore resume errors if camera already stopped
      }
    }, delayMs);
  };

  const processQrPayload = async (rawPayload: string) => {
    if (!rawPayload || !rawPayload.trim()) {
      isProcessingRef.current = false;
      setIsProcessing(false);
      return;
    }

    try {
      setIsProcessing(true);
      isProcessingRef.current = true;

      const res = await api.get('/users/scan-qr', {
        params: { payload: rawPayload.trim() }
      });

      if (res.data.isMultiple && Array.isArray(res.data.matches)) {
        setMatchingCandidates(res.data.matches);
        toast.info(`Found ${res.data.matches.length} matching students. Please select one below.`);
        resetScannerState(2000);
      } else if (res.data.data && res.data.data.id) {
        setMatchingCandidates(null);
        toast.success(`Scanned QR for ${res.data.data.name} (@${res.data.data.username})!`);
        stopCamera();
        onClose();
        onStudentFound(res.data.data.id);
      } else {
        toast.error('Student record not found for scanned QR code.');
        resetScannerState(1500);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No matching student found for this QR code.');
      resetScannerState(1500);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      const html5Qrcode = new Html5Qrcode('file-scanner-temp');
      const decodedText = await html5Qrcode.scanFile(file, true);
      html5Qrcode.clear();
      await processQrPayload(decodedText);
    } catch (err: any) {
      toast.error('Could not detect a QR code in the uploaded image. Please ensure the QR code is clear and well-lit.');
      resetScannerState(1000);
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
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edge = Math.floor(minEdge * 0.72);
            return { width: edge, height: edge };
          }
        },
        (decodedText) => {
          // Prevent multiple scans while processing
          if (isProcessingRef.current) return;

          const now = Date.now();
          if (
            lastScannedPayloadRef.current &&
            lastScannedPayloadRef.current.text === decodedText &&
            now - lastScannedPayloadRef.current.time < 3000
          ) {
            return; // Ignore duplicate scans of identical code within 3 seconds
          }

          isProcessingRef.current = true;
          lastScannedPayloadRef.current = { text: decodedText, time: now };

          // Pause video stream immediately upon reading QR code
          try {
            html5QrcodeRef.current?.pause(true);
          } catch (e) {}

          processQrPayload(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );

      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera Scanner Error:', err);
      setCameraError('Camera access denied or unavailable. Please enable camera permission or upload a QR image below.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrcodeRef.current && isCameraActive) {
      try {
        await html5QrcodeRef.current.stop();
        await html5QrcodeRef.current.clear();
      } catch (e) {
        // ignore stop errors
      } finally {
        setIsCameraActive(false);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      toast.error('Please enter student Roll Number, Email, or Username');
      return;
    }
    if (isProcessingRef.current) return;
    processQrPayload(manualInput.trim());
  };

  // Debounced auto-search when typing in manual tab
  useEffect(() => {
    if (activeMode !== 'MANUAL' || !manualInput.trim() || manualInput.trim().length < 3) {
      return;
    }

    const timer = setTimeout(() => {
      if (!isProcessingRef.current) {
        processQrPayload(manualInput.trim());
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [manualInput, activeMode]);

  // Lifecycle for camera start/stop
  useEffect(() => {
    if (isOpen && activeMode === 'CAMERA') {
      const timer = setTimeout(() => {
        startCamera();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
      <div id="file-scanner-temp" className="hidden" />

      {/* Main Container: Mobile bottom sheet, centered rounded dialog on desktop */}
      <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col relative overflow-hidden transition-all pb-safe">
        
        {/* Mobile Swipe / Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-xl shadow-xs shrink-0">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider truncate">
                Scan Student QR Code
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
                Point camera at student QR code to view profile instantly
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-extrabold shrink-0">
            <button
              onClick={() => setActiveMode('CAMERA')}
              className={`flex-1 py-2 sm:py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                activeMode === 'CAMERA' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" /> <span>Camera Scanner</span>
            </button>
            <button
              onClick={() => setActiveMode('FILE')}
              className={`flex-1 py-2 sm:py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                activeMode === 'FILE' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> <span>Upload QR Image</span>
            </button>
            <button
              onClick={() => setActiveMode('MANUAL')}
              className={`flex-1 py-2 sm:py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                activeMode === 'MANUAL' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" /> <span>Manual Search</span>
            </button>
          </div>

          {/* MODE 1: CAMERA SCANNER */}
          {activeMode === 'CAMERA' && (
            <div className="space-y-3">
              {/* Responsive Camera Viewport */}
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center aspect-[4/3] max-h-[36vh] sm:max-h-[300px] w-full shadow-inner">
                <div id={scannerContainerId} className="w-full h-full text-white [&_video]:object-cover" />

                {/* Viewfinder Overlay with Tech Corners */}
                <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-xl flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-orange-500 rounded-tl-md" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-orange-500 rounded-tr-md" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-orange-500 rounded-bl-md" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-orange-500 rounded-br-md" />

                  {/* Active Laser Scan Line */}
                  {!isProcessing && isCameraActive && (
                    <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_10px_rgba(249,115,22,0.9)] animate-pulse" />
                  )}

                  <div className="bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-orange-400" /> Align QR code inside frame
                  </div>
                </div>

                {/* In-Flight Processing Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 p-4 z-20 animate-in fade-in">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    <p className="text-xs text-white font-extrabold tracking-wide text-center">Reading QR Code...</p>
                    <p className="text-[10px] text-slate-400 font-medium text-center">
                      Looking up student record
                    </p>
                  </div>
                )}

                {cameraError && (
                  <div className="p-4 text-center space-y-1.5 z-10">
                    <AlertCircle className="w-7 h-7 text-rose-400 mx-auto" />
                    <p className="text-xs text-slate-300 font-semibold">{cameraError}</p>
                  </div>
                )}
              </div>

              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium text-center flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-500 shrink-0" />
                Hold student QR code in front of camera — scans automatically!
              </p>
            </div>
          )}

          {/* MODE 2: UPLOAD QR IMAGE */}
          {activeMode === 'FILE' && (
            <div className="space-y-3">
              <div className="p-6 border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-2xl text-center space-y-3 bg-slate-50 transition-colors">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl inline-flex mx-auto">
                  <QrCode className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">Upload Student QR Code</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                    Upload a PNG, JPG, or screenshot of the student's QR pass
                  </p>
                </div>

                <div>
                  <label className="inline-flex items-center justify-center gap-2 py-2.5 px-5 bg-orange-600 hover:bg-orange-500 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all touch-manipulation">
                    <Upload className="w-4 h-4" /> Browse QR Code Image
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isProcessing}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {isProcessing && (
                <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center gap-2 text-orange-800 text-xs font-bold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                  Decoding QR code & searching student profile...
                </div>
              )}
            </div>
          )}

          {/* MULTIPLE MATCHING CANDIDATES LIST */}
          {matchingCandidates && matchingCandidates.length > 0 && (
            <div className="space-y-2 p-3 bg-orange-50/75 rounded-2xl border border-orange-200 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-orange-950 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-orange-500" />
                  {matchingCandidates.length} Matching Profiles Found:
                </span>
                <button
                  type="button"
                  onClick={() => setMatchingCandidates(null)}
                  className="text-[10px] text-orange-700 hover:text-orange-900 font-extrabold cursor-pointer"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {matchingCandidates.map((c) => (
                  <div
                    key={c.id}
                    className="p-2 bg-white hover:bg-orange-100/60 border border-slate-200 hover:border-orange-400 rounded-xl flex items-center justify-between gap-2 shadow-2xs transition-all"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-xs text-slate-900 truncate">{c.name}</span>
                        {c.code && (
                          <span className="px-1.5 py-0.2 bg-slate-900 text-white text-[9px] font-black rounded font-mono">
                            {c.code}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-600 font-bold truncate">
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
                      className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-lg shadow-xs transition-all shrink-0 cursor-pointer"
                    >
                      Open Profile
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODE 3: MANUAL SEARCH */}
          {activeMode === 'MANUAL' && (
            <form onSubmit={handleManualSubmit} className="space-y-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter Student Roll Number, Email, or Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g. 23KF1A0591, name, or username..."
                    className="w-full p-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-hidden focus:border-orange-500"
                  />
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 text-orange-500 animate-spin absolute right-3 top-3" />
                  ) : (
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  )}
                </div>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-500 shrink-0" /> Auto-searches after 3 characters.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
