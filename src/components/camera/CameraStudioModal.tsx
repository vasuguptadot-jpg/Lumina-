import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  X,
  Sparkles,
  Sliders,
  Sun,
  Moon,
  Zap,
  Activity,
  Layers,
  RotateCcw,
  Check,
  Download,
  Eye,
  Grid,
  Compass,
  Maximize2,
  RefreshCw,
  Clock,
  Focus,
  Volume2,
  VolumeX,
  ChevronRight,
  Shield,
  Smartphone,
  Aperture,
  Flame,
  Smile,
  AlertTriangle,
  Award,
  Wand2,
} from 'lucide-react';
import {
  CameraSettings,
  DEFAULT_CAMERA_SETTINGS,
  CameraCaptureMode,
  CameraWbPreset,
  CameraGridType,
  CameraPeakingColor,
  CapturedPhotoResult,
  AiCameraAnalysis,
  AiBurstFrame,
  AiSceneType,
} from '../../types/camera';
import {
  playMechanicalShutterSound,
  computeLiveHistogram,
  drawHistogramCanvas,
  applyFocusPeakingOverlay,
  applyZebraPatternOverlay,
  drawCompositionGrid,
  drawHorizonLevel,
  captureFinalPhoto,
} from '../../engine/cameraEngine';
import {
  analyzeLiveCameraFrame,
  captureBestFrameBurst,
} from '../../engine/aiCameraEngine';
import { Project, ImageFile } from '../../types/editor';
import confetti from 'canvas-confetti';

interface CameraStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (captured: CapturedPhotoResult) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const CameraStudioModal: React.FC<CameraStudioModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
  showToast,
}) => {
  const [settings, setSettings] = useState<CameraSettings>(DEFAULT_CAMERA_SETTINGS);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhotoResult | null>(null);
  const [activeControlTab, setActiveControlTab] = useState<'ai' | 'exposure' | 'wb' | 'focus' | 'mode-opts'>('ai');
  const [hasCameraHardware, setHasCameraHardware] = useState<boolean | null>(null);

  // AI Real-Time Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<AiCameraAnalysis>({
    scene: 'general',
    sceneConfidence: 85,
    suggestedIso: 100,
    suggestedShutter: '1/250',
    suggestedKelvin: 5600,
    faces: [],
    blurScore: 85,
    isBlurry: false,
    isLowLight: false,
    lowLightBoostActive: false,
    composition: { tip: 'AI Director: Viewfinder active', score: 90, type: 'good' },
    smileDetected: false,
  });

  // Best Frame Burst Results State
  const [burstFrames, setBurstFrames] = useState<AiBurstFrame[] | null>(null);
  const [selectedBurstFrame, setSelectedBurstFrame] = useState<AiBurstFrame | null>(null);

  // Orientation / Horizon sensors
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const histCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const zebraTickRef = useRef<number>(0);
  const lastAiAnalyzeTimeRef = useRef<number>(0);
  const smileHoldTimeRef = useRef<number>(0);

  // 1. Initialize Camera Hardware Stream
  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    let isSubscribed = true;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera MediaDevices API not available');
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: settings.facingMode,
            width: { ideal: 3840, min: 1280 },
            height: { ideal: 2160, min: 720 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isSubscribed) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setHasCameraHardware(true);
        }
      } catch (err: any) {
        console.warn('Hardware camera unavailable, activating simulated sensor feed:', err.message);
        if (isSubscribed) {
          setHasCameraHardware(false);
        }
      }
    };

    startCamera();

    // Setup Device Orientation listener for digital horizon
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        setRoll(e.gamma);
        setPitch(e.beta - 90);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      isSubscribed = false;
      window.removeEventListener('deviceorientation', handleOrientation);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, settings.facingMode]);

  // 2. Viewfinder & AI Real-Time Loop
  useEffect(() => {
    if (!isOpen) return;

    let tick = 0;
    const processViewfinder = async () => {
      tick++;
      zebraTickRef.current = tick;

      const video = videoRef.current;
      const overlay = overlayCanvasRef.current;
      const histCanvas = histCanvasRef.current;
      const fallback = fallbackCanvasRef.current;

      const width = overlay?.width || 1280;
      const height = overlay?.height || 720;

      // Draw simulated scene if hardware camera stream is unavailable
      if (fallback && (!video || video.readyState < 2)) {
        const fctx = fallback.getContext('2d');
        if (fctx) {
          fctx.fillStyle = '#090d16';
          fctx.fillRect(0, 0, width, height);

          // Simulated studio lighting and scene gradient
          const grad = fctx.createRadialGradient(
            width * 0.5 + Math.sin(tick * 0.02) * 50,
            height * 0.4 + Math.cos(tick * 0.02) * 30,
            40,
            width * 0.5,
            height * 0.5,
            width * 0.6
          );
          grad.addColorStop(0, '#f97316');
          grad.addColorStop(0.3, '#7c3aed');
          grad.addColorStop(0.7, '#1e1b4b');
          grad.addColorStop(1, '#050508');
          fctx.fillStyle = grad;
          fctx.fillRect(0, 0, width, height);

          // Simulated subject silhouette in center
          fctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          fctx.beginPath();
          fctx.arc(width / 2, height / 2 - 40, 50, 0, Math.PI * 2);
          fctx.fill();

          fctx.beginPath();
          fctx.roundRect(width / 2 - 80, height / 2 + 25, 160, 180, 24);
          fctx.fill();

          // Simulated fine details for focus peaking
          fctx.strokeStyle = '#ffffff';
          fctx.lineWidth = 3;
          fctx.strokeRect(width / 2 - 90, height / 2 - 100, 180, 320);
        }
      }

      // AI Analysis sampling (every 300ms for high performance)
      const now = Date.now();
      if (now - lastAiAnalyzeTimeRef.current > 300 && settings.aiDirectorEnabled) {
        lastAiAnalyzeTimeRef.current = now;
        const sourceEl = video && video.readyState >= 2 ? video : fallback;
        if (sourceEl) {
          try {
            const analysis = await analyzeLiveCameraFrame(sourceEl, width, height, roll, pitch);
            setAiAnalysis(analysis);

            // Auto-Exposure & Auto-WB if enabled
            if (settings.aiAutoExposure && settings.autoIso) {
              setSettings((p) => ({
                ...p,
                iso: analysis.suggestedIso,
                shutterSpeed: analysis.suggestedShutter,
              }));
            }
            if (settings.aiAutoWb && settings.wbPreset === 'auto') {
              setSettings((p) => ({
                ...p,
                kelvin: analysis.suggestedKelvin,
              }));
            }

            // Smile Shutter Automatic Trigger
            if (settings.aiSmileShutter && analysis.smileDetected && !isCapturing) {
              smileHoldTimeRef.current += 300;
              if (smileHoldTimeRef.current >= 600) {
                smileHoldTimeRef.current = 0;
                handleShutter();
              }
            } else {
              smileHoldTimeRef.current = 0;
            }
          } catch (e) {}
        }
      }

      if (overlay) {
        const octx = overlay.getContext('2d');
        if (octx) {
          octx.clearRect(0, 0, width, height);

          // Offscreen sampling for histogram & assist filters
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = Math.min(320, width);
          tempCanvas.height = Math.min(180, height);
          const tctx = tempCanvas.getContext('2d');

          if (tctx) {
            if (video && video.readyState >= 2) {
              tctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
            } else if (fallback) {
              tctx.drawImage(fallback, 0, 0, tempCanvas.width, tempCanvas.height);
            }

            const imgData = tctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

            // Live Histogram
            if (settings.showHistogram && histCanvas) {
              const hctx = histCanvas.getContext('2d');
              if (hctx) {
                const hist = computeLiveHistogram(imgData);
                drawHistogramCanvas(hctx, histCanvas.width, histCanvas.height, hist, settings.histogramChannel);
              }
            }

            // Focus Peaking
            if (settings.focusPeaking) {
              applyFocusPeakingOverlay(
                tctx,
                octx,
                width,
                height,
                settings.peakingColor,
                settings.peakingSensitivity
              );
            }

            // Zebra Pattern
            if (settings.zebraEnabled) {
              applyZebraPatternOverlay(
                tctx,
                octx,
                width,
                height,
                settings.zebraThreshold,
                tick
              );
            }
          }

          // Composition Grids
          if (settings.grid !== 'none') {
            drawCompositionGrid(octx, width, height, settings.grid);
          }

          // Digital Horizon Level
          if (settings.horizonLevel) {
            drawHorizonLevel(octx, width, height, pitch, roll);
          }

          // AI Face & Smile Detection Overlay Boxes
          if (settings.aiDirectorEnabled && aiAnalysis.faces.length > 0) {
            aiAnalysis.faces.forEach((face) => {
              const fx = (face.x / 100) * width;
              const fy = (face.y / 100) * height;
              const fw = (face.width / 100) * width;
              const fh = (face.height / 100) * height;

              octx.save();
              octx.strokeStyle = face.isSmiling ? '#10b981' : '#06b6d4';
              octx.lineWidth = 2.5;

              // Corner brackets
              const cornerSize = Math.min(24, fw * 0.25);
              // Top-left
              octx.beginPath();
              octx.moveTo(fx, fy + cornerSize);
              octx.lineTo(fx, fy);
              octx.lineTo(fx + cornerSize, fy);
              // Top-right
              octx.moveTo(fx + fw - cornerSize, fy);
              octx.lineTo(fx + fw, fy);
              octx.lineTo(fx + fw, fy + cornerSize);
              // Bottom-left
              octx.moveTo(fx, fy + fh - cornerSize);
              octx.lineTo(fx, fy + fh);
              octx.lineTo(fx + cornerSize, fy + fh);
              // Bottom-right
              octx.moveTo(fx + fw - cornerSize, fy + fh);
              octx.lineTo(fx + fw, fy + fh);
              octx.lineTo(fx + fw, fy + fh - cornerSize);
              octx.stroke();

              // Badge
              octx.fillStyle = face.isSmiling ? 'rgba(16, 185, 129, 0.9)' : 'rgba(6, 182, 212, 0.9)';
              octx.font = 'bold 11px -apple-system, sans-serif';
              const label = face.isSmiling ? `😄 Smile ${face.smileScore}%` : `Face AF ${(face.confidence * 100).toFixed(0)}%`;
              const textWidth = octx.measureText(label).width;
              octx.fillRect(fx, fy - 20, textWidth + 12, 18);
              octx.fillStyle = '#000000';
              octx.fillText(label, fx + 6, fy - 7);
              octx.restore();
            });
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(processViewfinder);
    };

    animFrameRef.current = requestAnimationFrame(processViewfinder);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, settings, pitch, roll, aiAnalysis.faces, isCapturing]);

  // 3. Shutter Trigger Action
  const handleShutter = async () => {
    if (isCapturing) return;

    if (settings.timerSec > 0) {
      showToast('info', 'Self Timer Activated', `Capturing in ${settings.timerSec} seconds...`);
      await new Promise((res) => setTimeout(res, settings.timerSec * 1000));
    }

    setIsCapturing(true);
    setCaptureProgress(0);

    // Audio & Haptic Feedback
    if (settings.shutterSound) {
      playMechanicalShutterSound();
    }
    if (navigator.vibrate) {
      navigator.vibrate([40, 30, 40]);
    }

    try {
      // AI Best-Frame Rapid Burst Mode
      if (settings.aiBestFrameBurst) {
        showToast('info', 'AI Micro-Burst Active', 'Capturing 6-frame burst to select sharpest smile...');
        const burstResult = await captureBestFrameBurst(videoRef.current, fallbackCanvasRef.current, 6);
        setBurstFrames(burstResult.frames);
        setSelectedBurstFrame(burstResult.bestFrame);

        const photo = await captureFinalPhoto(videoRef.current, fallbackCanvasRef.current, settings);
        photo.imageUrl = burstResult.bestFrame.url;
        photo.thumbnailUrl = burstResult.bestFrame.url;
        setCapturedPhoto(photo);

        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.85 } });
        } catch (e) {}

        showToast('success', 'AI Best Frame Selected', `Sharpness: ${burstResult.bestFrame.sharpness}% • Smile: ${burstResult.bestFrame.smileScore}%`);
        return;
      }

      // Computational Multi-Frame Modes
      if (settings.mode === 'hdr' || settings.mode === 'long-exposure' || settings.mode === 'night') {
        const duration = settings.mode === 'long-exposure' ? settings.longExposureSec * 1000 : 1200;
        const startTime = Date.now();
        while (Date.now() - startTime < duration) {
          const p = Math.min(100, Math.round(((Date.now() - startTime) / duration) * 100));
          setCaptureProgress(p);
          await new Promise((r) => setTimeout(r, 60));
        }
      }

      const photo = await captureFinalPhoto(videoRef.current, fallbackCanvasRef.current, settings);
      setCapturedPhoto(photo);

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.85 } });
      } catch (e) {}

      showToast(
        'success',
        settings.mode === 'raw' ? '14-Bit RAW DNG Captured' : 'Photo Captured',
        `${photo.width} × ${photo.height} • ${photo.metadata.iso} ISO • ${photo.metadata.shutterSpeed}`
      );
    } catch (err: any) {
      showToast('error', 'Capture Failed', err.message);
    } finally {
      setIsCapturing(false);
      setCaptureProgress(0);
    }
  };

  const handleOpenInEditor = () => {
    if (!capturedPhoto) return;
    onPhotoCaptured(capturedPhoto);
    onClose();
  };

  const handleApplyAiOptimizations = () => {
    setSettings((p) => ({
      ...p,
      iso: aiAnalysis.suggestedIso,
      shutterSpeed: aiAnalysis.suggestedShutter,
      kelvin: aiAnalysis.suggestedKelvin,
      autoIso: true,
      autoShutter: true,
    }));
    showToast('success', 'AI Optical Parameters Applied', `ISO ${aiAnalysis.suggestedIso} • ${aiAnalysis.suggestedShutter} • ${aiAnalysis.suggestedKelvin}K`);
  };

  if (!isOpen) return null;

  const sceneIconMap: Record<AiSceneType, any> = {
    portrait: Sparkles,
    landscape: Sun,
    sunset: Flame,
    night: Moon,
    macro: Focus,
    food: Zap,
    architecture: Grid,
    action: Activity,
    document: Layers,
    general: Camera,
  };
  const SceneIcon = sceneIconMap[aiAnalysis.scene] || Camera;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none overflow-hidden text-slate-200">
      {/* Top Professional Status & Quick Assist Bar */}
      <div className="h-14 bg-gradient-to-b from-black/90 via-black/60 to-transparent px-4 flex items-center justify-between z-20">
        {/* Left: Close & Hardware Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Exit Camera Studio"
          >
            <X className="w-4 h-4" />
          </button>

          {/* AI Scene Recognition Live Badge */}
          {settings.aiSceneRecognition && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-xs font-mono text-indigo-300 shadow-sm shadow-indigo-500/20">
              <SceneIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-bold uppercase text-white">{aiAnalysis.scene}</span>
              <span className="text-indigo-400 font-semibold">{aiAnalysis.sceneConfidence}%</span>
            </div>
          )}

          {/* Low Light Indicator */}
          {aiAnalysis.isLowLight && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-[11px] font-bold text-amber-300 animate-pulse hidden md:flex">
              <Moon className="w-3 h-3 text-amber-400" />
              <span>Low-Light Boost Active</span>
            </div>
          )}
        </div>

        {/* Center: Live Real-time Histogram Overlay */}
        {settings.showHistogram && (
          <div className="relative rounded-lg overflow-hidden border border-slate-700/80 shadow-lg bg-black/60 backdrop-blur-md hidden sm:block">
            <canvas
              ref={histCanvasRef}
              width={140}
              height={38}
              className="w-[140px] h-[38px]"
            />
          </div>
        )}

        {/* Right: Assist Toggles (Histogram, Peaking, Zebra, Grid, Level) */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-700/80 backdrop-blur-md">
          {/* Peaking */}
          <button
            onClick={() => setSettings((p) => ({ ...p, focusPeaking: !p.focusPeaking }))}
            className={`p-1.5 rounded-xl text-xs font-bold transition-all ${
              settings.focusPeaking ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Focus Peaking (High-Pass Edge Detection)"
          >
            <Focus className="w-4 h-4" />
          </button>

          {/* Zebra */}
          <button
            onClick={() => setSettings((p) => ({ ...p, zebraEnabled: !p.zebraEnabled }))}
            className={`p-1.5 rounded-xl text-xs font-bold transition-all ${
              settings.zebraEnabled ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Zebra Overexposure Warning"
          >
            <Shield className="w-4 h-4" />
          </button>

          {/* Grid */}
          <button
            onClick={() =>
              setSettings((p) => ({
                ...p,
                grid:
                  p.grid === 'none'
                    ? 'rule-of-thirds'
                    : p.grid === 'rule-of-thirds'
                    ? 'golden-ratio'
                    : p.grid === 'golden-ratio'
                    ? 'diagonal'
                    : 'none',
              }))
            }
            className={`p-1.5 rounded-xl text-xs font-bold transition-all ${
              settings.grid !== 'none' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Composition Framing Guides"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Horizon Level */}
          <button
            onClick={() => setSettings((p) => ({ ...p, horizonLevel: !p.horizonLevel }))}
            className={`p-1.5 rounded-xl text-xs font-bold transition-all ${
              settings.horizonLevel ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Digital Horizon Level Sensor"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Shutter Sound */}
          <button
            onClick={() => setSettings((p) => ({ ...p, shutterSound: !p.shutterSound }))}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            {settings.shutterSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* AI Director Composition & Blur Guidance Banner */}
      {settings.aiDirectorEnabled && (
        <div className="relative z-20 px-4 -mt-2 mb-2 flex items-center justify-center">
          <div
            className={`px-4 py-1.5 rounded-full backdrop-blur-md border text-xs font-semibold flex items-center gap-2 shadow-lg transition-all ${
              aiAnalysis.isBlurry
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-200 animate-bounce'
                : aiAnalysis.composition.type === 'horizon'
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-200'
                : aiAnalysis.smileDetected
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200 shadow-emerald-500/20'
                : 'bg-slate-900/80 border-slate-700/80 text-slate-200'
            }`}
          >
            {aiAnalysis.isBlurry ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            ) : aiAnalysis.smileDetected ? (
              <Smile className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>{aiAnalysis.composition.tip}</span>
            <span className="text-[10px] opacity-75 font-mono">
              Score: {aiAnalysis.composition.score}%
            </span>
          </div>
        </div>
      )}

      {/* Main Viewfinder Canvas & Camera Feed */}
      <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Hardware Stream Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${hasCameraHardware ? 'block' : 'hidden'}`}
          style={{
            filter: `brightness(${
              1 + settings.exposureComp * 0.18 + (aiAnalysis.isLowLight && settings.aiLowLightEnhance ? 0.35 : 0)
            }) saturate(${settings.mode === 'raw' ? 1.05 : 1.0})`,
          }}
        />

        {/* Fallback Simulation Canvas if no webcam available */}
        <canvas
          ref={fallbackCanvasRef}
          width={1920}
          height={1080}
          className={`absolute inset-0 w-full h-full object-cover ${hasCameraHardware ? 'hidden' : 'block'}`}
        />

        {/* Overlay Canvas for Peaking, Zebra, Horizon, Grids, and Face Tracking */}
        <canvas
          ref={overlayCanvasRef}
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />

        {/* Live Exposure Readout HUD Overlay */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 font-mono text-xs text-white">
          <span className="text-amber-400 font-bold">ISO {settings.iso}</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400 font-bold">{settings.shutterSpeed}</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400 font-bold">
            {settings.exposureComp >= 0 ? '+' : ''}{settings.exposureComp.toFixed(1)} EV
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-purple-400 font-bold">{settings.kelvin}K</span>
          <span className="text-slate-500">|</span>
          <span className="text-teal-400 font-bold">Sharpness {aiAnalysis.blurScore}%</span>
        </div>

        {/* Long Exposure / HDR Capture Progress Ring */}
        {isCapturing && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin" />
              <span className="absolute text-xs font-mono font-bold text-white">{captureProgress}%</span>
            </div>
            <div className="text-sm font-bold text-white tracking-wide">
              {settings.mode === 'hdr'
                ? 'Synthesizing 3-Bracket HDR Frame...'
                : 'Accumulating Long Exposure Buffer...'}
            </div>
          </div>
        )}
      </div>

      {/* AI Burst Best-Frame Review Drawer */}
      {burstFrames && (
        <div className="bg-slate-900 border-t border-slate-800 p-3 z-30 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              AI Best-Frame Burst Review
            </span>
            <button
              onClick={() => setBurstFrames(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {burstFrames.map((frame) => {
              const isSelected = selectedBurstFrame?.id === frame.id;
              return (
                <div
                  key={frame.id}
                  onClick={() => {
                    setSelectedBurstFrame(frame);
                    if (capturedPhoto) {
                      setCapturedPhoto({
                        ...capturedPhoto,
                        imageUrl: frame.url,
                        thumbnailUrl: frame.url,
                      });
                    }
                  }}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                    isSelected ? 'border-amber-400 scale-105 shadow-md shadow-amber-400/30' : 'border-slate-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={frame.url} alt="Burst" className="w-full h-full object-cover" />
                  {frame.isBest && (
                    <span className="absolute top-1 right-1 bg-amber-400 text-slate-950 font-black text-[9px] px-1 rounded shadow">
                      BEST
                    </span>
                  )}
                  <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] font-mono text-white px-1 rounded">
                    {frame.score}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode Switcher Ribbon */}
      <div className="h-11 bg-slate-950 border-t border-slate-900 flex items-center justify-center gap-2 px-4 overflow-x-auto scrollbar-none z-20">
        {[
          { id: 'photo', label: 'PHOTO' },
          { id: 'raw', label: 'RAW DNG', badge: '14-BIT' },
          { id: 'hdr', label: 'HDR PRO' },
          { id: 'long-exposure', label: 'LONG EXP' },
          { id: 'night', label: 'NIGHT' },
          { id: 'portrait', label: 'PORTRAIT' },
        ].map((m) => {
          const isActive = settings.mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setSettings((p) => ({ ...p, mode: m.id as CameraCaptureMode }))}
              className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{m.label}</span>
              {m.badge && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-black ${
                    isActive ? 'bg-black text-amber-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {m.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Manual & AI Controls Dock & Shutter Action */}
      <div className="bg-slate-950/95 border-t border-slate-800/80 p-4 flex flex-col gap-3 z-20">
        {/* Parameter Subtabs */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'ai', label: 'AI Assist', icon: Sparkles },
            { id: 'exposure', label: 'ISO / Shutter', icon: Sliders },
            { id: 'wb', label: 'White Balance', icon: Sun },
            { id: 'focus', label: 'Manual Focus', icon: Focus },
            { id: 'mode-opts', label: 'Mode Options', icon: Aperture },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeControlTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveControlTab(tab.id as any)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  isActive
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 0. AI ASSISTANT DIRECTOR TAB */}
        {activeControlTab === 'ai' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 text-xs">
            {/* AI Director Toggle */}
            <button
              onClick={() => setSettings((p) => ({ ...p, aiDirectorEnabled: !p.aiDirectorEnabled }))}
              className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                settings.aiDirectorEnabled
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold">AI Director</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="text-[10px] text-slate-400">Composition & framing</span>
            </button>

            {/* Smile Shutter Toggle */}
            <button
              onClick={() => setSettings((p) => ({ ...p, aiSmileShutter: !p.aiSmileShutter }))}
              className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                settings.aiSmileShutter
                  ? 'bg-emerald-600/20 border-emerald-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold">Smile Shutter</span>
                <Smile className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-[10px] text-slate-400">Auto-snap on smile</span>
            </button>

            {/* AI Best Frame Burst */}
            <button
              onClick={() => setSettings((p) => ({ ...p, aiBestFrameBurst: !p.aiBestFrameBurst }))}
              className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                settings.aiBestFrameBurst
                  ? 'bg-amber-600/20 border-amber-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold">Best-Frame Burst</span>
                <Award className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-[10px] text-slate-400">6-shot AI selection</span>
            </button>

            {/* Apply AI Auto Exposure & WB */}
            <button
              onClick={handleApplyAiOptimizations}
              className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold flex flex-col items-start gap-1 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <div className="flex items-center justify-between w-full">
                <span>Apply AI Settings</span>
                <Wand2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] text-indigo-200">ISO {aiAnalysis.suggestedIso} • {aiAnalysis.suggestedKelvin}K</span>
            </button>
          </div>
        )}

        {/* 1. EXPOSURE TAB: ISO & SHUTTER & EV */}
        {activeControlTab === 'exposure' && (
          <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
            {/* ISO */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>ISO</span>
                <span className="font-mono text-amber-400 font-bold">{settings.iso}</span>
              </div>
              <select
                value={settings.iso}
                onChange={(e) => setSettings((p) => ({ ...p, iso: Number(e.target.value) }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
              >
                {[50, 100, 200, 400, 800, 1600, 3200, 6400, 12800].map((iso) => (
                  <option key={iso} value={iso}>
                    ISO {iso}
                  </option>
                ))}
              </select>
            </div>

            {/* Shutter Speed */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Shutter</span>
                <span className="font-mono text-cyan-400 font-bold">{settings.shutterSpeed}</span>
              </div>
              <select
                value={settings.shutterSpeed}
                onChange={(e) => setSettings((p) => ({ ...p, shutterSpeed: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
              >
                {[
                  '1/8000',
                  '1/4000',
                  '1/2000',
                  '1/1000',
                  '1/500',
                  '1/250',
                  '1/125',
                  '1/60',
                  '1/30',
                  '1/15',
                  '1/8',
                  '1/4',
                  '0.5s',
                  '1s',
                  '2s',
                  '5s',
                  '10s',
                  '30s',
                ].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Exposure Compensation (EV) */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>EV Comp</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {settings.exposureComp >= 0 ? '+' : ''}
                  {settings.exposureComp.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.33}
                value={settings.exposureComp}
                onChange={(e) => setSettings((p) => ({ ...p, exposureComp: Number(e.target.value) }))}
                className="w-full accent-emerald-500 mt-2"
              />
            </div>
          </div>
        )}

        {/* 2. WHITE BALANCE TAB */}
        {activeControlTab === 'wb' && (
          <div className="flex flex-col gap-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Kelvin Color Temperature</span>
              <span className="font-mono text-amber-400 font-bold">{settings.kelvin}K</span>
            </div>
            <input
              type="range"
              min={2000}
              max={10000}
              step={100}
              value={settings.kelvin}
              onChange={(e) => setSettings((p) => ({ ...p, kelvin: Number(e.target.value), wbPreset: 'custom' }))}
              className="w-full accent-amber-500"
            />
            <div className="grid grid-cols-4 gap-1.5 text-[11px] pt-1">
              {[
                { k: 3200, label: 'Tungsten (3200K)' },
                { k: 4000, label: 'Fluorescent (4000K)' },
                { k: 5600, label: 'Daylight (5600K)' },
                { k: 7500, label: 'Shade (7500K)' },
              ].map((preset) => (
                <button
                  key={preset.k}
                  onClick={() => setSettings((p) => ({ ...p, kelvin: preset.k }))}
                  className={`py-1 rounded-lg border text-center font-medium ${
                    settings.kelvin === preset.k
                      ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. MANUAL FOCUS TAB */}
        {activeControlTab === 'focus' && (
          <div className="flex flex-col gap-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Focus Distance Plane</span>
              <span className="font-mono text-cyan-400 font-bold">
                {settings.focusDistance === 100 ? 'Infinity (∞)' : `${(settings.focusDistance * 0.05).toFixed(2)}m`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.focusDistance}
              onChange={(e) => setSettings((p) => ({ ...p, focusDistance: Number(e.target.value), focusMode: 'mf' }))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Macro 5cm</span>
              <span>1.0m Portrait</span>
              <span>Infinity (∞)</span>
            </div>
          </div>
        )}

        {/* 4. MODE OPTIONS TAB */}
        {activeControlTab === 'mode-opts' && (
          <div className="flex flex-col gap-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 text-xs">
            {settings.mode === 'portrait' && (
              <div>
                <div className="flex items-center justify-between text-slate-300 mb-1">
                  <span>Aperture Bokeh Simulation</span>
                  <span className="font-mono text-pink-400 font-bold">f/{settings.portraitAperture}</span>
                </div>
                <input
                  type="range"
                  min={1.4}
                  max={16}
                  step={0.4}
                  value={settings.portraitAperture}
                  onChange={(e) => setSettings((p) => ({ ...p, portraitAperture: Number(e.target.value) }))}
                  className="w-full accent-pink-500"
                />
              </div>
            )}

            {settings.mode === 'long-exposure' && (
              <div>
                <div className="flex items-center justify-between text-slate-300 mb-1">
                  <span>Exposure Accumulation Duration</span>
                  <span className="font-mono text-purple-400 font-bold">{settings.longExposureSec}s</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={30}
                  step={0.5}
                  value={settings.longExposureSec}
                  onChange={(e) => setSettings((p) => ({ ...p, longExposureSec: Number(e.target.value) }))}
                  className="w-full accent-purple-500"
                />
              </div>
            )}

            {settings.mode === 'raw' && (
              <div className="flex items-center justify-between text-slate-300">
                <span>RAW Sensor Bit Depth</span>
                <span className="font-mono text-amber-400 font-bold">14-Bit Linear DNG</span>
              </div>
            )}
          </div>
        )}

        {/* Bottom Shutter & Gallery Thumbnail Row */}
        <div className="flex items-center justify-between px-6 pt-1">
          {/* Last Photo Thumbnail Quick Review */}
          <div className="w-12 h-12 rounded-xl border border-slate-800 overflow-hidden bg-slate-900 flex items-center justify-center shadow-md">
            {capturedPhoto ? (
              <img
                src={capturedPhoto.thumbnailUrl}
                alt="Last Capture"
                className="w-full h-full object-cover cursor-pointer"
                onClick={handleOpenInEditor}
                title="Click to develop in Studio Editor"
              />
            ) : (
              <Camera className="w-5 h-5 text-slate-600" />
            )}
          </div>

          {/* Master Shutter Button */}
          <button
            onClick={handleShutter}
            disabled={isCapturing}
            className="w-18 h-18 rounded-full border-4 border-white/80 p-1 flex items-center justify-center active:scale-95 transition-transform shadow-2xl disabled:opacity-50"
            title="Trigger Mechanical Shutter"
          >
            <div
              className={`w-full h-full rounded-full transition-all ${
                settings.mode === 'raw'
                  ? 'bg-amber-400'
                  : settings.mode === 'hdr'
                  ? 'bg-gradient-to-tr from-indigo-500 to-pink-500'
                  : 'bg-white'
              }`}
            />
          </button>

          {/* Quick Actions / Develop Button */}
          {capturedPhoto ? (
            <button
              onClick={handleOpenInEditor}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              <span>Develop</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-12 h-12" />
          )}
        </div>
      </div>
    </div>
  );
};
