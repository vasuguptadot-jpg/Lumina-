import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Download,
  X,
  Sparkles,
  FileImage,
  Check,
  RefreshCw,
  HardDrive,
  Maximize2,
  ShieldCheck,
  Printer,
  Sliders,
  SlidersHorizontal,
  Palette,
  Eye,
  Zap,
  Lock,
  Unlock,
  Layers,
  FileCode,
  CheckCircle2,
} from 'lucide-react';
import { Project, FilterPreset } from '../../types/editor';
import {
  exportHighResImage,
  triggerDownload,
  ExportFormat,
  ExportColorSpace,
  OutputSharpeningMode,
} from '../../engine/exportEngine';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  customPresets?: FilterPreset[];
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

const FORMAT_OPTIONS: {
  id: ExportFormat;
  label: string;
  badge: string;
  desc: string;
  lossless?: boolean;
}[] = [
  { id: 'jpeg', label: 'JPEG', badge: 'UNIVERSAL', desc: 'Web, Social & Standard Photo' },
  { id: 'png', label: 'PNG', badge: 'LOSSLESS', desc: 'Lossless 24-bit with Alpha', lossless: true },
  { id: 'webp', label: 'WebP', badge: 'MODERN', desc: 'Compact Next-Gen Web' },
  { id: 'avif', label: 'AVIF', badge: 'ULTRA', desc: 'Next-Gen High Dynamic Range' },
  { id: 'tiff', label: 'TIFF', badge: 'PRO 24-BIT', desc: 'Uncompressed Master Print', lossless: true },
  { id: 'heic', label: 'HEIC', badge: 'APPLE/HEIF', desc: 'High Efficiency Mobile' },
  { id: 'dng', label: 'DNG', badge: 'RAW DNG', desc: 'Adobe Digital Negative RAW', lossless: true },
  { id: 'psd', label: 'PSD', badge: 'PHOTOSHOP', desc: 'Adobe PSD Compatible Master', lossless: true },
];

const PRESET_DIMENSIONS = [
  { group: 'Social Media', items: [
    { label: 'Instagram Square (1080 × 1080)', w: 1080, h: 1080 },
    { label: 'Instagram Portrait (1080 × 1350)', w: 1080, h: 1350 },
    { label: 'Instagram / TikTok Story (1080 × 1920)', w: 1080, h: 1920 },
    { label: 'Twitter / X Post (1200 × 675)', w: 1200, h: 675 },
    { label: 'YouTube 4K Thumbnail (1920 × 1080)', w: 1920, h: 1080 },
  ]},
  { group: 'Screen & Display', items: [
    { label: 'Full HD 1080p (1920 × 1080)', w: 1920, h: 1080 },
    { label: '2K QHD (2560 × 1440)', w: 2560, h: 1440 },
    { label: '4K UHD Cinema (3840 × 2160)', w: 3840, h: 2160 },
    { label: '5K Retina (5120 × 2880)', w: 5120, h: 2880 },
    { label: '8K Ultra HD (7680 × 4320)', w: 7680, h: 4320 },
  ]},
  { group: 'Standard Print @ 300 DPI', items: [
    { label: 'A4 International Print (2480 × 3508)', w: 2480, h: 3508 },
    { label: 'A3 Poster Print (3508 × 4960)', w: 3508, h: 4960 },
    { label: '8 × 10" Portrait Print (2400 × 3000)', w: 2400, h: 3000 },
    { label: '11 × 14" Gallery Print (3300 × 4200)', w: 3300, h: 4200 },
    { label: '16 × 20" Fine Art Print (4800 × 6000)', w: 4800, h: 6000 },
  ]},
];

const DPI_OPTIONS = [
  { dpi: 72, label: '72 DPI', desc: 'Standard Web & Screens' },
  { dpi: 96, label: '96 DPI', desc: 'Windows Desktop' },
  { dpi: 150, label: '150 DPI', desc: 'Draft Print Proofing' },
  { dpi: 300, label: '300 DPI', desc: 'Commercial Pro Press' },
  { dpi: 600, label: '600 DPI', desc: 'Archival Fine Art & Gallery' },
];

const COLOR_SPACES: { id: ExportColorSpace; name: string; desc: string; badge: string }[] = [
  { id: 'srgb', name: 'sRGB (IEC61966-2.1)', desc: 'Universal web, mobile & social standard', badge: 'WEB STANDARD' },
  { id: 'display-p3', name: 'Display P3 (Wide Color)', desc: 'Apple Retina & Modern OLED displays', badge: 'WIDE GAMUT' },
  { id: 'adobe-rgb', name: 'Adobe RGB (1998)', desc: 'Pro photography & commercial offset press', badge: 'PRO PRINT' },
  { id: 'prophoto-rgb', name: 'ProPhoto RGB (ROMM)', desc: 'Maximum dynamic range archival gamut', badge: 'ARCHIVAL' },
];

const SHARPENING_OPTIONS: { id: OutputSharpeningMode; label: string; desc: string }[] = [
  { id: 'off', label: 'Off', desc: 'No output sharpening' },
  { id: 'screen-standard', label: 'Screen (Standard)', desc: 'Optimized for web & mobile displays' },
  { id: 'screen-high', label: 'Screen (High Crisp)', desc: 'Extra clarity for dense retina viewports' },
  { id: 'matte-standard', label: 'Matte Paper Print', desc: 'Compensates for ink spread on art paper' },
  { id: 'glossy-standard', label: 'Glossy Paper Print', desc: 'Crisp edge contrast for photo paper' },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  customPresets = [],
  showToast,
}) => {
  if (!isOpen) return null;

  // Format & Quality
  const [format, setFormat] = useState<ExportFormat>('jpeg');
  const [quality, setQuality] = useState<number>(0.92);

  // Resolution & Scaling
  const baseW = project.image.width || 2400;
  const baseH = project.image.height || 1600;
  const aspectRatio = baseW / (baseH || 1);

  const [scaleOption, setScaleOption] = useState<'0.25x' | '0.5x' | '1x' | '2x' | '4x' | 'custom'>('1x');
  const [customW, setCustomW] = useState<number>(baseW);
  const [customH, setCustomH] = useState<number>(baseH);
  const [lockAspect, setLockAspect] = useState<boolean>(true);

  // DPI, Color Space & Sharpening
  const [dpi, setDpi] = useState<number>(300);
  const [colorSpace, setColorSpace] = useState<ExportColorSpace>('srgb');
  const [outputSharpening, setOutputSharpening] = useState<OutputSharpeningMode>('screen-standard');

  // Metadata & Privacy
  const [stripGps, setStripGps] = useState<boolean>(false);
  const [stripAllMetadata, setStripAllMetadata] = useState<boolean>(false);
  const [copyrightOnly, setCopyrightOnly] = useState<boolean>(false);

  // Watermark
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(project.watermark?.enabled ?? false);

  // Filename & Status
  const [filename, setFilename] = useState<string>(
    `${project.name.replace(/\.[^/.]+$/, '')}_Lumina_Master`
  );
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'format' | 'dimensions' | 'color-print' | 'privacy'>('format');

  // Calculate final target dimensions
  let finalW = baseW;
  let finalH = baseH;

  if (scaleOption === '0.25x') {
    finalW = Math.round(baseW * 0.25);
    finalH = Math.round(baseH * 0.25);
  } else if (scaleOption === '0.5x') {
    finalW = Math.round(baseW * 0.5);
    finalH = Math.round(baseH * 0.5);
  } else if (scaleOption === '2x') {
    finalW = Math.round(baseW * 2);
    finalH = Math.round(baseH * 2);
  } else if (scaleOption === '4x') {
    finalW = Math.round(baseW * 4);
    finalH = Math.round(baseH * 4);
  } else if (scaleOption === 'custom') {
    finalW = customW;
    finalH = customH;
  }

  const estMegaPixels = ((finalW * finalH) / 1000000).toFixed(1);
  const printWidthInches = (finalW / dpi).toFixed(1);
  const printHeightInches = (finalH / dpi).toFixed(1);
  const printWidthCm = ((finalW / dpi) * 2.54).toFixed(1);
  const printHeightCm = ((finalH / dpi) * 2.54).toFixed(1);

  const handleCustomWidthChange = (val: number) => {
    setCustomW(val);
    if (lockAspect) {
      setCustomH(Math.round(val / aspectRatio));
    }
  };

  const handleCustomHeightChange = (val: number) => {
    setCustomH(val);
    if (lockAspect) {
      setCustomW(Math.round(val * aspectRatio));
    }
  };

  const handlePresetDimensionSelect = (w: number, h: number) => {
    setScaleOption('custom');
    setCustomW(w);
    setCustomH(h);
  };

  const handleExport = async () => {
    setIsExporting(true);
    showToast('info', 'Rendering Master Export', `Encoding full-precision ${format.toUpperCase()} image...`);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load original image buffer'));
        img.src = project.image.originalUrl;
      });

      let scaleFactor = 1;
      if (scaleOption === '0.25x') scaleFactor = 0.25;
      if (scaleOption === '0.5x') scaleFactor = 0.5;
      if (scaleOption === '2x') scaleFactor = 2;
      if (scaleOption === '4x') scaleFactor = 4;

      const result = await exportHighResImage({
        sourceImage: img,
        crop: project.crop,
        adjustments: project.currentSettings,
        toneCurves: project.toneCurves,
        hsl: project.hsl,
        activePresetId: project.activePresetId,
        presetStrength: project.presetStrength,
        customPresets,
        watermark: includeWatermark ? project.watermark : undefined,
        border: project.border,
        masks: project.masks,
        retouchStrokes: project.retouchStrokes,
        typography: project.typography,
        designElements: project.designElements,
        drawingStrokes: project.drawingStrokes,
        colorManagement: project.colorManagement,
        metadata: project.image.rawMetadata,
        exportConfig: {
          format,
          quality,
          scaleFactor,
          customWidth: scaleOption === 'custom' ? customW : undefined,
          customHeight: scaleOption === 'custom' ? customH : undefined,
          dpi,
          colorSpace,
          outputSharpening,
          stripMetadata: stripAllMetadata,
          stripGps,
          copyrightOnly,
          filename: `${filename}.${format}`,
        },
      });

      triggerDownload(result.url, `${filename}.${format}`);

      // Celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (e) {}

      showToast(
        'success',
        'Master Export Downloaded',
        `${result.width} × ${result.height} px • ${format.toUpperCase()} (${(result.sizeBytes / 1024 / 1024).toFixed(2)} MB)`
      );
      onClose();
    } catch (err: any) {
      showToast('error', 'Export Failed', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-500/20">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Master High-Resolution Export Hub</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono">
                  PRO STUDIO
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Multi-Format Rasterizer, Wide Color Gamuts, DPI Print Sizing & Sharpening
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-slate-950 border-b border-slate-800 text-xs">
          {[
            { id: 'format', label: 'Format & Quality', icon: FileImage },
            { id: 'dimensions', label: 'Resolution & Scale', icon: Maximize2 },
            { id: 'color-print', label: 'Color Space & DPI', icon: Palette },
            { id: 'privacy', label: 'Metadata & Watermark', icon: ShieldCheck },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`py-2 px-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all text-center ${
                  activeTab === t.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          {/* TAB 1: FORMAT & QUALITY */}
          {activeTab === 'format' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Output Master File Format</span>
                  <span className="text-[10px] text-indigo-400 font-mono">8 SUPPORTED FORMATS</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {FORMAT_OPTIONS.map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setFormat(fmt.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all relative overflow-hidden ${
                        format === fmt.id
                          ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-white">{fmt.label}</span>
                        <span className="text-[8px] font-bold px-1 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono">
                          {fmt.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-1 line-clamp-1">
                        {fmt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality & Compression Slider (for lossy formats) */}
              {format !== 'png' && format !== 'tiff' && format !== 'dng' && format !== 'psd' && (
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Compression Quality</span>
                    </span>
                    <span className="font-mono font-black text-indigo-400">
                      {Math.round(quality * 100)}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0.1}
                    max={1.0}
                    step={0.01}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />

                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {[
                      { label: 'Draft 50%', val: 0.5 },
                      { label: 'Standard 80%', val: 0.8 },
                      { label: 'High 92%', val: 0.92 },
                      { label: 'Maximum 100%', val: 1.0 },
                    ].map((q) => (
                      <button
                        key={q.label}
                        onClick={() => setQuality(q.val)}
                        className={`py-1 text-[10px] rounded font-bold border transition-all ${
                          quality === q.val
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Lossless Indicator Banner */}
              {(format === 'png' || format === 'tiff' || format === 'dng' || format === 'psd') && (
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center gap-2.5 text-xs text-indigo-300">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>
                    <strong>Lossless Master Format:</strong> Full uncompressed color precision with zero compression artifacts.
                  </span>
                </div>
              )}

              {/* Output Sharpening Controls */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Output Sharpening Engine</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">UNSHARP MASK</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {SHARPENING_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setOutputSharpening(opt.id)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        outputSharpening === opt.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs">{opt.label}</div>
                      <div className="text-[9px] text-slate-500 leading-tight truncate">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RESOLUTION & DIMENSIONS */}
          {activeTab === 'dimensions' && (
            <div className="space-y-4">
              {/* Scale Multiplier Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Scale Multiplier</span>
                  <span className="text-[10px] text-slate-400 font-mono">Original: {baseW} × {baseH} px</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { id: '0.25x', label: '0.25x', desc: `${Math.round(baseW * 0.25)}px` },
                    { id: '0.5x', label: '0.5x', desc: `${Math.round(baseW * 0.5)}px` },
                    { id: '1x', label: '1x Native', desc: `${baseW}px` },
                    { id: '2x', label: '2x Super-Res', desc: `${baseW * 2}px` },
                    { id: '4x', label: '4x Ultra-Res', desc: `${baseW * 4}px` },
                  ].map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => setScaleOption(sc.id as any)}
                      className={`p-2 rounded-xl text-center border transition-all ${
                        scaleOption === sc.id
                          ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold">{sc.label}</div>
                      <div className="text-[9px] opacity-75">{sc.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Standard Dimension Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Quick Dimension Presets</label>
                <div className="space-y-2">
                  {PRESET_DIMENSIONS.map((group) => (
                    <div key={group.group} className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {group.group}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {group.items.map((item) => (
                          <button
                            key={item.label}
                            onClick={() => handlePresetDimensionSelect(item.w, item.h)}
                            className="p-1.5 text-left bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between"
                          >
                            <span className="truncate">{item.label}</span>
                            <span className="text-[10px] font-mono text-indigo-400 shrink-0 ml-1">
                              {item.w}×{item.h}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Dimensions Input with Aspect Ratio Lock */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Custom Dimension Override</span>
                  <button
                    onClick={() => setLockAspect(!lockAspect)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                      lockAspect
                        ? 'bg-indigo-950 border-indigo-500/40 text-indigo-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    {lockAspect ? <Lock className="w-3 h-3 text-indigo-400" /> : <Unlock className="w-3 h-3" />}
                    <span>{lockAspect ? 'Aspect Locked' : 'Aspect Free'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Width (pixels)</label>
                    <input
                      type="number"
                      value={scaleOption === 'custom' ? customW : finalW}
                      onChange={(e) => {
                        setScaleOption('custom');
                        handleCustomWidthChange(Number(e.target.value));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Height (pixels)</label>
                    <input
                      type="number"
                      value={scaleOption === 'custom' ? customH : finalH}
                      onChange={(e) => {
                        setScaleOption('custom');
                        handleCustomHeightChange(Number(e.target.value));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COLOR SPACE & DPI */}
          {activeTab === 'color-print' && (
            <div className="space-y-4">
              {/* Color Space Gamut */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Target Color Gamut & ICC Profile</span>
                  <span className="text-[10px] text-teal-400 font-mono">COLOR MANAGEMENT</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_SPACES.map((cs) => (
                    <button
                      key={cs.id}
                      onClick={() => setColorSpace(cs.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        colorSpace === cs.id
                          ? 'bg-teal-600/30 border-teal-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{cs.name}</span>
                        <span className="text-[8px] font-bold px-1 rounded bg-slate-900 text-teal-300 font-mono border border-teal-500/30">
                          {cs.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 leading-tight">{cs.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* DPI Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Output Print Resolution (DPI)</span>
                  <span className="text-[10px] text-slate-400 font-mono">PHYSICAL PRESS SPEC</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {DPI_OPTIONS.map((d) => (
                    <button
                      key={d.dpi}
                      onClick={() => setDpi(d.dpi)}
                      className={`p-2 rounded-xl text-center border transition-all ${
                        dpi === d.dpi
                          ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold">{d.label}</div>
                      <div className="text-[9px] opacity-75 truncate">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Physical Print Sizing Calculation Card */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <Printer className="w-3.5 h-3.5" />
                    Physical Print Output at {dpi} DPI:
                  </span>
                  <span className="text-emerald-400">{estMegaPixels} Megapixels</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400">Inches: </span>
                    <span className="text-white font-bold">{printWidthInches}″ × {printHeightInches}″</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Centimeters: </span>
                    <span className="text-white font-bold">{printWidthCm} × {printHeightCm} cm</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: METADATA & PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Metadata & Privacy Sanitization</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">EXIF / IPTC</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={stripGps}
                      onChange={(e) => setStripGps(e.target.checked)}
                      className="rounded border-slate-700 text-rose-500 focus:ring-0 accent-rose-500"
                    />
                    <span>Remove GPS Geolocation Coordinates (Preserve Camera Settings)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={stripAllMetadata}
                      onChange={(e) => setStripAllMetadata(e.target.checked)}
                      className="rounded border-slate-700 text-rose-500 focus:ring-0 accent-rose-500"
                    />
                    <span>Strip All Personal & Hardware EXIF Data (100% Anonymous Output)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={copyrightOnly}
                      onChange={(e) => setCopyrightOnly(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-500 focus:ring-0 accent-indigo-500"
                    />
                    <span>Embed Author & Copyright Notice Only</span>
                  </label>
                </div>
              </div>

              {/* Watermark Section */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeWatermark}
                    onChange={(e) => setIncludeWatermark(e.target.checked)}
                    className="accent-indigo-500 rounded"
                  />
                  <span className="font-bold text-white">Embed Active Signature / Watermark</span>
                </label>
                <p className="text-[11px] text-slate-400 pl-5">
                  Applies the active watermark configured in the Watermark Studio onto the final rendered master.
                </p>
              </div>
            </div>
          )}

          {/* Master Output Summary Card */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-slate-400">Dimensions: </span>
                <span className="text-white font-bold">{finalW} × {finalH} px</span>
              </div>
              <div className="text-slate-600">|</div>
              <div>
                <span className="text-slate-400">DPI: </span>
                <span className="text-indigo-400 font-bold">{dpi}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 uppercase font-black">
                {format}
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/40 text-[10px] text-indigo-300 uppercase font-bold">
                {colorSpace}
              </span>
            </div>
          </div>

          {/* Filename Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">Export Filename</label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="bg-transparent text-slate-200 w-full outline-none font-mono"
              />
              <span className="text-slate-500 font-mono">.{format}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            Output: <span className="text-slate-300">{estMegaPixels} MP</span> • <span className="text-emerald-400">{format.toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Rendering Master...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>Export & Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
