import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, Camera, Upload, X, Search, AlertCircle, Loader2, Sparkles, CreditCard, ScanLine, Check, Zap } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentFound: (userId: string) => void;
}

// Client-side image downscaling for ultra-fast network transfer & sub-second OCR
const downscaleImageForOcr = async (fileOrDataUrl: File | string, maxDim = 850): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      // Fast, lightweight JPEG (under 40-50KB)
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
};

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose, onStudentFound }) => {
  const [activeMode, setActiveMode] = useState<'CAMERA' | 'FILE' | 'MANUAL'>('CAMERA');
  const [manualInput, setManualInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [matchingCandidates, setMatchingCandidates] = useState<any[] | null>(null);
  const [lastExtracted, setLastExtracted] = useState<{ registerNumber?: string | null; name?: string | null; department?: string | null } | null>(null);

  // Synchronous ref locks to absolutely prevent duplicate multiple scans
  const isProcessingRef = useRef(false);
  const lastScannedPayloadRef = useRef<{ text: string; time: number } | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'student-qr-reader';

  const resetProcessingState = (delayMs = 1200) => {
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
        toast.info(`Found ${res.data.matches.length} matching students. Please select one.`);
        resetProcessingState(1500);
      } else if (res.data.data && res.data.data.id) {
        setMatchingCandidates(null);
        toast.success(`Found student: ${res.data.data.name} (@${res.data.data.username})!`);
        stopCamera();
        onClose();
        onStudentFound(res.data.data.id);
      } else {
        toast.error('Student record not found.');
        resetProcessingState(1500);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No matching student found.');
      resetProcessingState(1500);
    }
  };

  const processIdCardImage = async (dataUrl: string) => {
    if (isProcessingRef.current) return;

    try {
      isProcessingRef.current = true;
      setIsProcessing(true);

      // 1. Client-side downscaling for sub-second network transfer
      const optimizedImage = await downscaleImageForOcr(dataUrl);

      // 2. Pause camera preview while analyzing
      try {
        html5QrcodeRef.current?.pause(true);
      } catch (e) {}

      const res = await api.post('/users/scan-id-card', {
        image: optimizedImage
      });

      if (res.data.extracted) {
        setLastExtracted(res.data.extracted);
      }

      if (res.data.isMultiple && Array.isArray(res.data.matches)) {
        setMatchingCandidates(res.data.matches);
        toast.info(
          `Extracted Roll: ${res.data.extracted?.registerNumber || 'N/A'}. Found ${res.data.matches.length} students.`
        );
        resetProcessingState(1800);
      } else if (res.data.data && res.data.data.id) {
        setMatchingCandidates(null);
        toast.success(
          `Found Student: ${res.data.data.name} (${res.data.extracted?.registerNumber || res.data.data.username || res.data.data.code})!`
        );
        stopCamera();
        onClose();
        onStudentFound(res.data.data.id);
      } else {
        toast.error(res.data.message || 'Student record not found.');
        resetProcessingState(1500);
      }
    } catch (err: any) {
      const extractedInfo = err.response?.data?.extracted;
      if (extractedInfo) {
        setLastExtracted(extractedInfo);
      }
      toast.error(
        err.response?.data?.message || 'Could not extract student details from ID card. Ensure card is clear & well-lit.'
      );
      resetProcessingState(1500);
    }
  };

  const captureCameraFrameAndScanIdCard = async () => {
    if (isProcessingRef.current) return;

    try {
      const container = document.getElementById(scannerContainerId);
      const video = container?.querySelector('video');
      if (!video) {
        toast.error('Camera preview is not ready. Please make sure camera is active.');
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      await processIdCardImage(rawDataUrl);
    } catch (err: any) {
      toast.error('Failed to capture camera frame: ' + err.message);
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

  const processFile = async (file: File) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      // First try QR scanning
      const html5Qrcode = new Html5Qrcode('file-scanner-temp');
      try {
        const decodedText = await html5Qrcode.scanFile(file, true);
        html5Qrcode.clear();
        await processQrPayload(decodedText);
        return;
      } catch (qrErr) {
        // QR not found in file -> auto fallback to ID Card OCR
        html5Qrcode.clear();
      }

      // Read & downscale for lightning-fast ID card OCR
      const optimizedDataUrl = await downscaleImageForOcr(file);
      isProcessingRef.current = false; // Release for processIdCardImage
      await processIdCardImage(optimizedDataUrl);
    } catch (err: any) {
      toast.error('Could not read or process image file: ' + err.message);
      resetProcessingState(1200);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      const qrboxSize = Math.min(window.innerWidth * 0.65, 230);

      await html5QrcodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 8, // Optimized 8 FPS reduces CPU heat on mobile
          qrbox: { width: Math.floor(qrboxSize), height: Math.floor(qrboxSize) }
        },
        (decodedText) => {
          // Strictly prevent duplicate callbacks while processing
          if (isProcessingRef.current) return;

          const now = Date.now();
          if (
            lastScannedPayloadRef.current &&
            lastScannedPayloadRef.current.text === decodedText &&
            now - lastScannedPayloadRef.current.time < 3500
          ) {
            return; // Ignore duplicate scans of same code within 3.5s
          }

          isProcessingRef.current = true;
          lastScannedPayloadRef.current = { text: decodedText, time: now };

          // Immediately pause video scanner to prevent duplicate frames
          try {
            html5QrcodeRef.current?.pause(true);
          } catch (e) {}

          processQrPayload(decodedText);
        },
        () => {
          // Ignore scanning frame errors
        }
      );

      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera Scanner Error:', err);
      setCameraError('Camera access denied or unavailable. Please enable camera permission or upload a photo below.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrcodeRef.current && isCameraActive) {
      try {
        await html5QrcodeRef.current.stop();
        await html5QrcodeRef.current.clear();
      } catch (e) {
        // ignore camera stop errors
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

  // Debounced auto-search when typing
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

      {/* Main Responsive Container: Bottom sheet on mobile, rounded card on desktop */}
      <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col relative overflow-hidden transition-all pb-safe">
        
        {/* Mobile Swipe / Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-xl shadow-xs shrink-0">
              <ScanLine className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider truncate">
                  Student Scanner
                </h3>
                <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black rounded-md flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5 text-emerald-600" /> 0 Tokens
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
                Scan QR Code or Physical ID Card (Roll No)
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
              <Camera className="w-3.5 h-3.5" /> <span>Camera</span>
            </button>
            <button
              onClick={() => setActiveMode('FILE')}
              className={`flex-1 py-2 sm:py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                activeMode === 'FILE' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> <span>Upload</span>
            </button>
            <button
              onClick={() => setActiveMode('MANUAL')}
              className={`flex-1 py-2 sm:py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                activeMode === 'MANUAL' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" /> <span>Search</span>
            </button>
          </div>

          {/* MODE 1: CAMERA SCANNER (QR + INSTANT ID CARD SNAPSHOT) */}
          {activeMode === 'CAMERA' && (
            <div className="space-y-3">
              {/* Responsive Camera Viewport */}
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center aspect-[4/3] max-h-[36vh] sm:max-h-[280px] w-full">
                <div id={scannerContainerId} className="w-full h-full text-white [&_video]:object-cover" />

                {/* Card Viewfinder Overlay with Tech Corners */}
                <div className="absolute inset-3 sm:inset-4 pointer-events-none border border-white/20 rounded-xl flex items-center justify-center">
                  {/* Top-Left Corner */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-orange-500 rounded-tl-md" />
                  {/* Top-Right Corner */}
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-orange-500 rounded-tr-md" />
                  {/* Bottom-Left Corner */}
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-orange-500 rounded-bl-md" />
                  {/* Bottom-Right Corner */}
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-orange-500 rounded-br-md" />

                  {/* Active Laser Scan Line (shows camera is live) */}
                  {!isProcessing && isCameraActive && (
                    <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse" />
                  )}

                  {/* Framing badge */}
                  <div className="bg-black/65 backdrop-blur-xs text-white/90 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-orange-400" /> Align ID Card or QR inside
                  </div>
                </div>

                {/* In-Flight Processing Overlay (Prevents clicking or scanning again) */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 p-4 z-20 animate-in fade-in">
                    <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
                    <p className="text-xs text-white font-extrabold tracking-wide text-center">Reading Student Record...</p>
                    <p className="text-[10px] text-slate-400 font-medium text-center">
                      Extracting Roll Number with fast local OCR
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

              {/* Main Action Button (Mobile Thumb Friendly) */}
              <button
                type="button"
                disabled={isProcessing || !isCameraActive}
                onClick={captureCameraFrameAndScanIdCard}
                className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-98 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Scanning Card...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" /> 📸 Capture & Scan ID Card
                  </>
                )}
              </button>

              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium text-center flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-500 shrink-0" />
                QR codes scan automatically. For ID cards, align and tap button.
              </p>
            </div>
          )}

          {/* MODE 2: UPLOAD IMAGE SCANNER */}
          {activeMode === 'FILE' && (
            <div className="space-y-3">
              <div className="p-4 sm:p-5 border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-2xl text-center space-y-3 bg-slate-50 transition-colors">
                <div className="flex items-center justify-center gap-2">
                  <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                    <QrCode className="w-5 h-5" />
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">Upload ID Card or QR Code Image</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                    Auto-resizes & detects QR codes or extracts Roll No from ID Card photo
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 pt-1">
                  <label className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-orange-600 hover:bg-orange-500 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer transition-all touch-manipulation">
                    <CreditCard className="w-3.5 h-3.5" /> Upload ID Card Photo
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isProcessing}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) processFile(f);
                      }}
                      className="hidden"
                    />
                  </label>
                  <label className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer transition-all touch-manipulation">
                    <QrCode className="w-3.5 h-3.5" /> Upload QR Code File
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isProcessing}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) processFile(f);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {isProcessing && (
                <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center gap-2 text-orange-800 text-xs font-bold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                  Processing card image with local OCR...
                </div>
              )}
            </div>
          )}

          {/* LAST EXTRACTED BADGE */}
          {lastExtracted && (lastExtracted.registerNumber || lastExtracted.name) && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div className="space-y-0.5 min-w-0 pr-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Detected Roll / Student:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {lastExtracted.registerNumber && (
                    <span className="font-mono font-black text-slate-900 bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-[11px]">
                      {lastExtracted.registerNumber}
                    </span>
                  )}
                  {lastExtracted.name && <span className="font-bold text-slate-700 truncate">{lastExtracted.name}</span>}
                  {lastExtracted.department && (
                    <span className="text-[10px] text-slate-500">({lastExtracted.department})</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLastExtracted(null)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1 shrink-0 cursor-pointer"
              >
                ✕
              </button>
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
                      Open
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
