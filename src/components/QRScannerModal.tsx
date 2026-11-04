import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import jsQR from 'jsqr';
import {
  X,
  Camera,
  CameraOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  QrCode,
  Zap,
  Upload,
  Volume2,
  VolumeX,
  Trash2,
  User,
  ShieldCheck,
} from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBadges?: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onOpenBadges,
}) => {
  const {
    students,
    processQRScan,
    qrScanLogs,
    clearQRLogs,
    selectedDate,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'camera' | 'simulator' | 'upload' | 'history'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScanResult, setLastScanResult] = useState<{
    success: boolean;
    isDuplicate?: boolean;
    message: string;
    studentName?: string;
    rollNumber?: string;
    avatarUrl?: string;
    timestamp: string;
  } | null>(null);

  const [searchSimQuery, setSearchSimQuery] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastScannedCodeRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  // Synthesized Sound Effects via Web Audio API
  const playSound = useCallback((type: 'success' | 'duplicate' | 'error') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'success') {
        // High upbeat double-chime (880Hz -> 1320Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        gain1.gain.setValueAtTime(0.15, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.1);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
        gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.12);
        osc2.stop(ctx.currentTime + 0.28);
      } else if (type === 'duplicate') {
        // Medium informational note (587Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } else {
        // Low error buzz (220Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // Audio context might be restricted
    }
  }, [soundEnabled]);

  // Handle scanned payload
  const handlePayloadScanned = useCallback(
    (payload: string, source: string = 'Camera Scanner') => {
      const now = Date.now();
      // Debounce repeated scans within 2.5s for the same payload
      if (lastScannedCodeRef.current === payload && now - lastScanTimeRef.current < 2500) {
        return;
      }
      lastScannedCodeRef.current = payload;
      lastScanTimeRef.current = now;

      // Haptic feedback if available on mobile
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100);
      }

      const res = processQRScan(payload, source);

      if (res.success) {
        if (res.isDuplicate) {
          playSound('duplicate');
        } else {
          playSound('success');
        }
        setLastScanResult({
          success: true,
          isDuplicate: res.isDuplicate,
          message: res.message,
          studentName: res.student?.name,
          rollNumber: res.student?.rollNumber,
          avatarUrl: res.student?.avatarUrl,
          timestamp: res.timestamp,
        });
      } else {
        playSound('error');
        setLastScanResult({
          success: false,
          isDuplicate: false,
          message: res.message,
          timestamp: res.timestamp,
        });
      }
    },
    [processQRScan, playSound]
  );

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser environment. Please use Simulator Mode.');
      setActiveTab('simulator');
      return;
    }

    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      let errorMsg = 'Could not access camera. Check device permissions or use Simulator Mode.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission was denied. Please allow camera permissions in browser settings, or use the instant Simulator tab below.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No camera hardware found on this device. Switching to instant Simulator tab.';
      }
      setCameraError(errorMsg);
      setCameraActive(false);
      // Auto-fallback to simulator for frictionless testing
      setActiveTab('simulator');
    }
  }, [facingMode]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Continuous Video Frame Scanning via jsQR
  useEffect(() => {
    if (!cameraActive || activeTab !== 'camera') {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }

    let isScanning = true;

    const scanFrame = () => {
      if (!isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            handlePayloadScanned(code.data, 'Live Camera Feed');
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameIdRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [cameraActive, activeTab, handlePayloadScanned]);

  // Lifecycle when modal opens/closes or tab changes
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  if (!isOpen) return null;

  // Toggle front/back camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Handle Image File Upload to scan QR
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handlePayloadScanned(code.data, `Uploaded File (${file.name})`);
        } else {
          playSound('error');
          setLastScanResult({
            success: false,
            message: 'No readable QR code found in uploaded image. Please try a clearer picture.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const filteredSimStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchSimQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchSimQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30 text-emerald-400">
              <Camera className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                  Farqaleet GGSS
                </span>
                <span className="text-xs text-slate-300">Live Roll Call Scanner</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight font-display text-white">
                QR Attendance Scanner
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-semibold overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('camera')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'camera'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Badge Simulator (Instant)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px]">
              Easy Test
            </span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Today's Log ({qrScanLogs.length})</span>
          </button>
        </div>

        {/* Scan Status Toast / Banner */}
        {lastScanResult && (
          <div
            className={`px-4 py-3 border-b transition-all flex items-center justify-between gap-3 ${
              lastScanResult.success
                ? lastScanResult.isDuplicate
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {lastScanResult.avatarUrl ? (
                <img
                  src={lastScanResult.avatarUrl}
                  alt={lastScanResult.studentName || ''}
                  className="w-9 h-9 rounded-full object-cover border border-emerald-300 shrink-0 shadow-xs"
                />
              ) : (
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    lastScanResult.success
                      ? lastScanResult.isDuplicate
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-emerald-200 text-emerald-800'
                      : 'bg-rose-200 text-rose-800'
                  }`}
                >
                  {lastScanResult.success ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
              )}

              <div className="min-w-0">
                <div className="text-xs font-bold flex items-center gap-2">
                  <span>{lastScanResult.studentName || 'Scanner Notification'}</span>
                  {lastScanResult.rollNumber && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/70 border border-current">
                      {lastScanResult.rollNumber}
                    </span>
                  )}
                  <span className="text-[10px] font-normal opacity-75">
                    ({lastScanResult.timestamp})
                  </span>
                </div>
                <div className="text-xs truncate">{lastScanResult.message}</div>
              </div>
            </div>

            <button
              onClick={() => setLastScanResult(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* TAB 1: LIVE CAMERA SCANNER */}
          {activeTab === 'camera' && (
            <div className="flex flex-col items-center">
              {/* Viewfinder Window */}
              <div className="relative w-full max-w-md aspect-4/3 rounded-2xl overflow-hidden bg-black shadow-inner border border-slate-700 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Reticle / Viewfinder Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Outer dark vignette */}
                  <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-emerald-400 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm"></div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm"></div>
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm"></div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-sm"></div>

                    {/* Animated Scanning Laser Line */}
                    <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></div>

                    <div className="absolute bottom-2 inset-x-0 text-center">
                      <span className="px-2 py-0.5 bg-black/60 rounded text-[10px] text-emerald-300 font-mono tracking-wider font-semibold uppercase">
                        Align Badge QR
                      </span>
                    </div>
                  </div>
                </div>

                {/* Camera Inactive / Error Overlay */}
                {(!cameraActive || cameraError) && (
                  <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-white">
                    <CameraOff className="w-10 h-10 text-slate-400 mb-2" />
                    <h3 className="text-sm font-bold">Camera Standby / Unavailable</h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xs">
                      {cameraError || 'Allow camera permission or use the instant Simulator tab to test without a webcam.'}
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={startCamera}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Camera</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('simulator')}
                        className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Use Simulator Tab
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls Bar */}
              <div className="flex items-center justify-between w-full max-w-md mt-3 px-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleFacingMode}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Flip Camera</span>
                  </button>
                  <button
                    onClick={cameraActive ? stopCamera : startCamera}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    {cameraActive ? 'Pause' : 'Resume'}
                  </button>
                </div>

                {onOpenBadges && (
                  <button
                    onClick={onOpenBadges}
                    className="text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1 hover:underline"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View Student Badges</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INSTANT BADGE SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 flex items-start gap-3">
                <Zap className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950">
                  <div className="font-bold">Instant 1-Tap Attendance Simulator</div>
                  <div className="text-emerald-800 mt-0.5">
                    Click any student below to simulate an immediate QR code badge scan at the school entrance. It marks attendance, calculates check-in time, and verifies against duplicates.
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter student name or roll number..."
                  value={searchSimQuery}
                  onChange={(e) => setSearchSimQuery(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white shadow-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Student Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredSimStudents.map((st) => (
                  <div
                    key={st.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={st.avatarUrl}
                        alt={st.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {st.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {st.rollNumber}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handlePayloadScanned(
                          JSON.stringify({
                            school: 'Farqaleet GGSS',
                            studentId: st.id,
                            rollNumber: st.rollNumber,
                            name: st.name,
                          }),
                          'Simulator (Gate 1)'
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0 shadow-xs"
                    >
                      <Zap className="w-3 h-3 text-emerald-200" />
                      <span>Scan Badge</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD QR IMAGE FILE */}
          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 hover:bg-slate-50 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Upload Student ID Badge Image
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Select a photo, screenshot, or downloaded QR card from your device to instantly decode student attendance.
              </p>
              <label className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-xs">
                Browse Image File
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* TAB 4: TODAY'S QR SCAN LOG */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-200">
                <span>
                  Date: <strong className="text-slate-800">{selectedDate}</strong>
                </span>
                {qrScanLogs.length > 0 && (
                  <button
                    onClick={clearQRLogs}
                    className="text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Scan Logs</span>
                  </button>
                )}
              </div>

              {qrScanLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No QR scans recorded yet for today. Use the live camera or badge simulator to check in students!
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {qrScanLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                        log.status === 'success'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : log.status === 'duplicate'
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-rose-50/50 border-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            log.status === 'success'
                              ? 'bg-emerald-100 text-emerald-700'
                              : log.status === 'duplicate'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {log.status === 'success' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : log.status === 'duplicate' ? (
                            <Clock className="w-4 h-4" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                            <span>{log.studentName}</span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {log.rollNumber}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 truncate">
                            {log.message}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-semibold text-slate-800">
                          {log.timestamp}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {log.scannerDevice}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted QR Check-In Protocol</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenBadges && (
              <button
                onClick={onOpenBadges}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition-colors"
              >
                Print / View Badges
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
