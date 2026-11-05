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
  ExternalLink,
  Video,
  Sparkles,
  Info,
  Maximize2,
  HelpCircle,
  ChevronDown,
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
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraErrorCode, setCameraErrorCode] = useState<
    'PERMISSION_DENIED' | 'NOT_FOUND' | 'IN_USE' | 'IFRAME_BLOCKED' | 'OVERCONSTRAINED' | 'UNKNOWN' | null
  >(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isVirtualCamActive, setIsVirtualCamActive] = useState<boolean>(false);
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
  const [virtualPresentingStudent, setVirtualPresentingStudent] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastScannedCodeRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const lastFrameScanTimeRef = useRef<number>(0);
  const barcodeDetectorRef = useRef<any>(null);

  // Initialize BarcodeDetector if natively supported (Chrome, Edge, Android)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        barcodeDetectorRef.current = new (window as any).BarcodeDetector({
          formats: ['qr_code'],
        });
      } catch (e) {
        console.warn('Native BarcodeDetector not available:', e);
      }
    }
  }, []);

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
        // Warning notification tone (587Hz)
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

  // Enumerate camera video input devices
  const updateAvailableDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);
    } catch (err) {
      console.warn('Could not enumerate media devices:', err);
    }
  }, []);

  // Multi-tier MediaStream getter with progressive fallbacks
  const requestMediaStream = async (deviceId?: string, mode: 'environment' | 'user' = facingMode): Promise<MediaStream> => {
    // Attempt 1: Explicit device ID if chosen by user
    if (deviceId) {
      return await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false,
      });
    }

    // Attempt 2: High resolution with ideal facingMode
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err1: any) {
      console.warn('Tier 1 constraints failed, trying basic facingMode:', err1?.message);
      // Attempt 3: Loose facingMode
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode } },
          audio: false,
        });
      } catch (err2: any) {
        console.warn('Tier 2 constraints failed, trying generic video (desktop webcam):', err2?.message);
        // Attempt 4: Generic video (solves OverconstrainedError on desktop webcams without environment capability)
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
    }
  };

  // Start Camera Stream with comprehensive error detection
  const startCamera = useCallback(async (forcedDeviceId?: string) => {
    setCameraLoading(true);
    setCameraError(null);
    setCameraErrorCode(null);

    // Check basic WebRTC support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Webcam access is not supported by this browser. You can use the Virtual Camera Feed or Badge Simulator below.');
      setCameraErrorCode('NOT_FOUND');
      setCameraLoading(false);
      return;
    }

    try {
      // Clean up previous active stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const stream = await requestMediaStream(forcedDeviceId || selectedDeviceId, facingMode);
      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('muted', 'true');
        video.muted = true;

        // Ensure video is playing cleanly
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            video.play()
              .then(() => resolve())
              .catch((e) => {
                console.warn('Video play interrupted:', e);
                resolve();
              });
          };
          // Timeout fallback in case loadedmetadata doesn't fire immediately
          setTimeout(resolve, 800);
        });

        setCameraActive(true);
        setIsVirtualCamActive(false);
        updateAvailableDevices();
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      const name = err.name || '';
      const message = err.message || '';

      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setCameraErrorCode('PERMISSION_DENIED');
        setCameraError(
          'Camera permission is currently blocked. If you are inside an embedded frame, click "Open App in New Tab" below or allow Camera in your browser URL bar.'
        );
      } else if (name === 'SecurityError' || message.includes('permissions policy') || message.includes('disallowed')) {
        setCameraErrorCode('IFRAME_BLOCKED');
        setCameraError(
          'Camera access is restricted by the preview iframe security policy. Click "Open App in New Tab" to test live camera with full native permissions.'
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCameraErrorCode('NOT_FOUND');
        setCameraError('No webcam hardware was detected on this device. You can test live scanning using the Virtual Camera Feed below.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setCameraErrorCode('IN_USE');
        setCameraError('Your camera is currently in use by another application (e.g., Zoom, Google Meet, MS Teams). Please close other apps and retry.');
      } else if (name === 'OverconstrainedError') {
        setCameraErrorCode('OVERCONSTRAINED');
        setCameraError('Camera resolution constraints could not be satisfied. Retrying with default device settings...');
      } else {
        setCameraErrorCode('UNKNOWN');
        setCameraError(`Camera connection issue: ${message || 'Unknown device error'}. You can use the Virtual Camera Feed or Badge Simulator.`);
      }

      setCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  }, [facingMode, selectedDeviceId, updateAvailableDevices]);

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

  // Continuous Video Frame Scanning via Hardware BarcodeDetector + jsQR Fallback
  useEffect(() => {
    if (!cameraActive || activeTab !== 'camera' || isVirtualCamActive) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }

    let isScanning = true;

    const scanFrame = async () => {
      if (!isScanning) return;

      const video = videoRef.current;
      const now = performance.now();

      // Throttle scanning to every 90ms for optimal battery, thermals, and speed
      if (now - lastFrameScanTimeRef.current >= 90) {
        lastFrameScanTimeRef.current = now;

        if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          let detected = false;

          // FAST PATH: Modern native hardware-accelerated BarcodeDetector
          if (barcodeDetectorRef.current) {
            try {
              const barcodes = await barcodeDetectorRef.current.detect(video);
              if (barcodes && barcodes.length > 0 && barcodes[0]?.rawValue) {
                detected = true;
                handlePayloadScanned(barcodes[0].rawValue, 'Live Camera (Hardware)');
              }
            } catch {
              // Fallback to canvas
            }
          }

          // COMPATIBILITY PATH: jsQR with canvas
          if (!detected) {
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                // Resize internal canvas to reasonable scanning resolution
                const scanWidth = Math.min(video.videoWidth, 640);
                const scanHeight = Math.round((scanWidth / video.videoWidth) * video.videoHeight);
                canvas.width = scanWidth;
                canvas.height = scanHeight;

                ctx.drawImage(video, 0, 0, scanWidth, scanHeight);
                const imageData = ctx.getImageData(0, 0, scanWidth, scanHeight);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: 'dontInvert',
                });

                if (code && code.data) {
                  handlePayloadScanned(code.data, 'Live Camera (jsQR)');
                }
              }
            }
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
  }, [cameraActive, activeTab, isVirtualCamActive, handlePayloadScanned]);

  // Lifecycle when modal opens/closes or tab changes
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      if (!isVirtualCamActive) {
        startCamera();
      }
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, isVirtualCamActive, startCamera, stopCamera]);

  if (!isOpen) return null;

  // Toggle front/back camera
  const toggleFacingMode = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    setSelectedDeviceId('');
  };

  // Switch camera device
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    startCamera(deviceId);
  };

  // Activate Virtual Live Camera Feed (allows instant testing in iframes or on devices without webcams)
  const enableVirtualCamera = () => {
    stopCamera();
    setIsVirtualCamActive(true);
    setCameraError(null);
    setCameraErrorCode(null);
  };

  // Virtual badge presenter action
  const simulateVirtualScan = (student: typeof students[0]) => {
    setVirtualPresentingStudent(student.name);
    setTimeout(() => {
      handlePayloadScanned(
        JSON.stringify({
          school: 'Farqaleet GGSS',
          studentId: student.id,
          rollNumber: student.rollNumber,
          name: student.name,
        }),
        'Virtual Gate 1 Camera'
      );
      setTimeout(() => {
        setVirtualPresentingStudent(null);
      }, 1000);
    }, 400);
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
            message: 'No readable QR code found in uploaded image. Please try a clearer picture of the student badge.',
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

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
            onClick={() => {
              setActiveTab('camera');
              if (isVirtualCamActive) {
                // keep virtual if active
              } else if (!cameraActive) {
                startCamera();
              }
            }}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'camera'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
            {cameraActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-0.5" />
            )}
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
            <span>Badge Simulator</span>
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
            className={`px-4 py-2.5 border-b transition-all flex items-center justify-between gap-3 ${
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
              {/* Top Mode Notice or Camera Switcher */}
              <div className="w-full max-w-md flex items-center justify-between gap-2 mb-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      isVirtualCamActive
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : cameraActive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {isVirtualCamActive ? (
                      <>
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>Virtual Live Camera Feed</span>
                      </>
                    ) : cameraActive ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Physical Webcam Active</span>
                      </>
                    ) : (
                      <>
                        <CameraOff className="w-3 h-3 text-slate-400" />
                        <span>Camera Standby</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isVirtualCamActive ? (
                    <button
                      onClick={() => {
                        setIsVirtualCamActive(false);
                        startCamera();
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-medium inline-flex items-center gap-1 hover:underline text-[11px]"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Use Physical Webcam</span>
                    </button>
                  ) : (
                    <button
                      onClick={enableVirtualCamera}
                      className="text-indigo-700 hover:text-indigo-900 font-medium inline-flex items-center gap-1 hover:underline text-[11px]"
                      title="Switch to simulated live camera feed"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span>Virtual Feed Mode</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Viewfinder Window */}
              <div className="relative w-full max-w-md aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 shadow-inner border border-slate-800 flex items-center justify-center">
                {/* 1. PHYSICAL CAMERA FEED */}
                {!isVirtualCamActive && (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                )}

                {/* 2. VIRTUAL LIVE CAMERA FEED */}
                {isVirtualCamActive && (
                  <div className="w-full h-full bg-radial from-slate-800 to-slate-950 relative flex flex-col items-center justify-center overflow-hidden">
                    {/* Simulated security gate background */}
                    <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
                    
                    {/* Gate watermark & timecode */}
                    <div className="absolute top-3 left-3 text-left font-mono text-[10px] text-emerald-400 space-y-0.5 pointer-events-none select-none z-10">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        <span>LIVE [REC] 60FPS</span>
                      </div>
                      <div className="text-slate-400">FARQALEET GGSS • GATE 1</div>
                      <div className="text-slate-500">{new Date().toLocaleTimeString()}</div>
                    </div>

                    {/* Virtual student badge being presented under scanner */}
                    {virtualPresentingStudent ? (
                      <div className="relative z-20 flex flex-col items-center animate-in zoom-in-75 duration-200">
                        <div className="w-48 p-3 rounded-xl bg-white text-slate-900 shadow-2xl border-2 border-emerald-400 text-center">
                          <div className="text-[10px] font-bold text-emerald-800 uppercase">
                            Farqaleet GGSS Badge
                          </div>
                          <div className="text-xs font-extrabold mt-1 truncate">
                            {virtualPresentingStudent}
                          </div>
                          <div className="w-20 h-20 mx-auto my-1.5 border border-slate-300 rounded-lg p-1 bg-white flex items-center justify-center">
                            <QrCode className="w-16 h-16 text-slate-900" />
                          </div>
                          <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                            SCANNING IN PROGRESS...
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-6 z-10 max-w-xs">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2">
                          <QrCode className="w-6 h-6 animate-pulse" />
                        </div>
                        <h4 className="text-xs font-bold text-white">Virtual Camera Standby</h4>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Click any student card below the camera window to present their badge to this lens.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reticle / Viewfinder Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-sm" />

                    {/* Animated Scanning Laser Line */}
                    <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-500 shadow-[0_0_12px_#10b981] animate-pulse top-1/2 -translate-y-1/2" />

                    <div className="absolute bottom-2.5 inset-x-0 text-center">
                      <span className="px-2 py-0.5 bg-black/70 rounded text-[10px] text-emerald-300 font-mono tracking-wider font-semibold uppercase">
                        Align Student QR Badge
                      </span>
                    </div>
                  </div>
                </div>

                {/* Camera Loading Spinner */}
                {cameraLoading && (
                  <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center text-white p-4">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
                    <span className="text-xs font-medium">Connecting to camera stream...</span>
                  </div>
                )}

                {/* Camera Inactive / Error Overlay */}
                {!cameraLoading && !isVirtualCamActive && (!cameraActive || cameraError) && (
                  <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-5 text-center text-white">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-2.5">
                      <CameraOff className="w-6 h-6" />
                    </div>

                    <h3 className="text-sm font-bold text-white">Camera Access Notice</h3>

                    <p className="text-xs text-slate-300 mt-1 max-w-sm leading-relaxed">
                      {cameraError ||
                        'Camera permission is required to scan badges live. If running inside an embedded preview iframe, open in a dedicated browser tab or switch to Virtual Feed mode.'}
                    </p>

                    {/* Action buttons inside error overlay */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                      {/* Direct standalone link to open without iframe restriction */}
                      <a
                        href={typeof window !== 'undefined' ? window.location.href : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in Dedicated Tab</span>
                      </a>

                      <button
                        onClick={enableVirtualCamera}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Use Virtual Cam</span>
                      </button>

                      <button
                        onClick={() => startCamera()}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setActiveTab('simulator')}
                      className="mt-3 text-[11px] text-emerald-300 hover:text-emerald-200 underline"
                    >
                      Or switch to 1-Tap Student Badge Simulator &rarr;
                    </button>
                  </div>
                )}
              </div>

              {/* Camera Controls & Hardware Switchers */}
              <div className="w-full max-w-md mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    {!isVirtualCamActive && (
                      <>
                        <button
                          onClick={toggleFacingMode}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs font-medium"
                          title="Switch between front and back camera"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Flip ({facingMode === 'environment' ? 'Back' : 'Front'})</span>
                        </button>

                        <button
                          onClick={cameraActive ? stopCamera : () => startCamera()}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs font-medium"
                        >
                          {cameraActive ? 'Pause' : 'Resume'}
                        </button>
                      </>
                    )}

                    {isVirtualCamActive && (
                      <span className="text-[11px] text-slate-500 font-medium">
                        Click student cards below to test scans live &darr;
                      </span>
                    )}
                  </div>

                  {onOpenBadges && (
                    <button
                      onClick={onOpenBadges}
                      className="text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1 hover:underline text-xs"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View Badges</span>
                    </button>
                  )}
                </div>

                {/* Camera Selector Dropdown (if multiple video inputs detected) */}
                {availableDevices.length > 1 && !isVirtualCamActive && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 shrink-0 font-medium">Camera:</span>
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => handleDeviceChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">Default / Auto Detect</option>
                      {availableDevices.map((dev, idx) => (
                        <option key={dev.deviceId || idx} value={dev.deviceId}>
                          {dev.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* VIRTUAL LIVE CAMERA: Interactive Badge Presentation Tray */}
                {isVirtualCamActive && (
                  <div className="mt-3 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Present Student Badges to Lens</span>
                      </div>
                      <span className="text-[10px] text-indigo-600 font-normal">
                        1-Click Test Scans
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                      {students.slice(0, 9).map((st) => (
                        <button
                          key={st.id}
                          onClick={() => simulateVirtualScan(st)}
                          disabled={virtualPresentingStudent !== null}
                          className="p-2 rounded-lg bg-white border border-indigo-100 hover:border-indigo-400 hover:shadow-xs transition-all text-left flex items-center gap-2 group disabled:opacity-50"
                        >
                          <img
                            src={st.avatarUrl}
                            alt={st.name}
                            className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-slate-800 truncate group-hover:text-indigo-700">
                              {st.name}
                            </div>
                            <div className="text-[9px] font-mono text-slate-400 truncate">
                              {st.rollNumber}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Helpful Diagnostics Card & Urdu Tips */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-600">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Camera Troubleshooting & Tips (رہنمائی)</span>
                  </div>
                  <ul className="text-[11px] space-y-1 text-slate-500 list-disc list-inside">
                    <li>
                      <strong>Iframe Preview / اندرونی فریم:</strong> اگر کیمرہ بلاک نظر آئے تو اوپر دیے گئے{' '}
                      <span className="font-semibold text-emerald-700">"Open in Dedicated Tab"</span> لنک پر کلک کریں تاکہ مکمل براؤزر میں کیمرہ پرمیشن فعال ہو سکے۔
                    </li>
                    <li>
                      <strong>Browser Permission:</strong> Ensure camera is allowed in your browser address bar (lock icon &rarr; Site settings &rarr; Camera: Allow).
                    </li>
                    <li>
                      <strong>Hardware:</strong> If your PC does not have a physical webcam, use the{' '}
                      <span className="font-semibold text-indigo-700">"Virtual Feed Mode"</span> or the{' '}
                      <span className="font-semibold text-amber-700">"Badge Simulator"</span> tab.
                    </li>
                  </ul>
                </div>
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
                  No QR scans recorded yet for today. Use the live camera, virtual feed, or badge simulator to check in students!
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
            <span className="hidden sm:inline">Encrypted QR Check-In Protocol</span>
            <span className="sm:hidden">QR Protocol</span>
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
