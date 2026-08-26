import React, { useState } from 'react';
import {
  Download,
  X,
  FileImage,
  RefreshCw,
  Maximize2,
  ShieldCheck,
  Printer,
  Sliders,
  Palette,
  Zap,
  Lock,
  Unlock,
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
  { id: 'avif', label: 'AVIF', badge: 'HDR', desc: 'Next-Gen High Dynamic Range' },
  { id: 'tiff', label: 'TIFF', badge: 'PRO 24-BIT', desc: 'Uncompressed Master Print', lossless: true },
  { id: 'dng', label: 'DNG', badge: 'RAW DNG', desc: 'Adobe Digital Negative RAW', lossless: true },
  { id: 'psd', label: 'PSD', badge: 'PSD MASTER', desc: 'Adobe PSD Compatible Layers', lossless: true },
];

const PRESET_DIMENSIONS = [
  { group: 'Social Media', items: [
    { label: 'Instagram Square (1080 × 1080)', w: 1080, h: 1080 },
    { label: 'Instagram Portrait (1080 × 1350)', w: 1080, h: 1350 },
    { label: 'Story / TikTok (1080 × 1920)', w: 1080, h: 1920 },
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
    { label: 'A4 Print (2480 × 3508)', w: 2480, h: 3508 },
    { label: 'A3 Poster (3508 × 4960)', w: 3508, h: 4960 },
    { label: '8 × 10" Portrait (2400 × 3000)', w: 2400, h: 3000 },
    { label: '11 × 14" Gallery (3300 × 4200)', w: 3300, h: 4200 },
    { label: '16 × 20" Fine Art (4800 × 6000)', w: 4800, h: 6000 },
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
  { id: 'srgb', name: 'sRGB (IEC61966-2.1)', desc: 'Universal web & standard mobile gamut', badge: 'WEB' },
  { id: 'display-p3', name: 'Display P3 (Wide Color)', desc: 'Apple Retina & OLED displays', badge: 'WIDE' },
  { id: 'adobe-rgb', name: 'Adobe RGB (1998)', desc: 'Pro photography & commercial press', badge: 'PRINT' },
  { id: 'prophoto-rgb', name: 'ProPhoto RGB (ROMM)', desc: 'Maximum dynamic range archival gamut', badge: 'ARCHIVAL' },
];

const SHARPENING_OPTIONS: { id: OutputSharpeningMode; label: string; desc: string }[] = [
  { id: 'off', label: 'Off', desc: 'No output sharpening' },
  { id: 'screen-standard', label: 'Screen (Standard)', desc: 'Optimized for web & mobile displays' },
  { id: 'screen-high', label: 'Screen (High Crisp)', desc: 'Extra clarity for dense retina viewports' },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  customPresets = [],
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'format' | 'dimensions' | 'color-print' | 'privacy'>('format');
  const [format, setFormat] = useState<ExportFormat>('jpeg');
  const [quality, setQuality] = useState<number>(0.92);
  const [scaleOption, setScaleOption] = useState<'1x' | '0.5x' | '0.25x' | '2x' | '4x' | 'custom'>('1x');
  const [customW, setCustomW] = useState<number>(project.image.width || 1920);
  const [customH, setCustomH] = useState<number>(project.image.height || 1080);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [dpi, setDpi] = useState<number>(300);
  const [colorSpace, setColorSpace] = useState<ExportColorSpace>('srgb');
  const [outputSharpening, setOutputSharpening] = useState<OutputSharpeningMode>('screen-standard');
  const [stripMetadata, setStripMetadata] = useState<boolean>(false);
  const [stripGps, setStripGps] = useState<boolean>(true);
  const [stripAllMetadata, setStripAllMetadata] = useState<boolean>(false);
  const [copyrightOnly, setCopyrightOnly] = useState<boolean>(false);
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(true);
  const [filename, setFilename] = useState<string>(project.name.replace(/\.[^/.]+$/, '') + '_master');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const baseW = project.image.width || 1920;
  const baseH = project.image.height || 1080;
  const aspect = baseW / baseH;

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

  const handleCustomWidthChange = (w: number) => {
    setCustomW(w);
    if (lockAspect) {
      setCustomH(Math.round(w / aspect));
    }
  };

  const handleCustomHeightChange = (h: number) => {
    setCustomH(h);
    if (lockAspect) {
      setCustomW(Math.round(h * aspect));
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image buffer'));
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

      showToast(
        'success',
        'Master Export Complete',
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans text-zinc-100">
      <div className="bg-[#0D0D0D] border border-[#2A2A2A] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between bg-[#050505]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#141414] border border-[#2A2A2A] text-white">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>Master Export Hub</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#141414] border border-[#2A2A2A] text-zinc-400 font-mono">
                  PRO
                </span>
              </h3>
              <p className="text-[11px] text-[#A0A0A0]">
                Lossless rasterization, wide color gamuts, DPI print sizing & sharpening
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#141414] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-[#050505] border-b border-[#2A2A2A] text-xs">
          {[
            { id: 'format', label: 'Format & Quality', icon: FileImage },
            { id: 'dimensions', label: 'Resolution & Scale', icon: Maximize2 },
            { id: 'color-print', label: 'Color Space & DPI', icon: Palette },
            { id: 'privacy', label: 'Metadata & Privacy', icon: ShieldCheck },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`py-1.5 px-1 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors text-center text-xs ${
                  activeTab === t.id
                    ? 'bg-[#141414] text-white border border-[#2A2A2A]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#0D0D0D]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* TAB 1: FORMAT & QUALITY */}
          {activeTab === 'format' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Output Master File Format</span>
                  <span className="text-[10px] text-zinc-500 font-mono">7 FORMATS</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FORMAT_OPTIONS.map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setFormat(fmt.id)}
                      className={`p-2.5 rounded-xl text-left border transition-colors relative overflow-hidden ${
                        format === fmt.id
                          ? 'bg-[#141414] border-white text-white'
                          : 'bg-[#0D0D0D] border-[#2A2A2A] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-white">{fmt.label}</span>
                        <span className="text-[8px] font-mono px-1 rounded bg-[#050505] border border-[#2A2A2A] text-zinc-400">
                          {fmt.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 leading-tight mt-1 line-clamp-1">
                        {fmt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Slider for lossy formats */}
              {format !== 'png' && format !== 'tiff' && format !== 'dng' && format !== 'psd' && (
                <div className="p-3.5 bg-[#141414] border border-[#2A2A2A] rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Compression Quality</span>
                    </span>
                    <span className="font-mono font-bold text-white">
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
                    className="w-full accent-white cursor-pointer bg-[#050505]"
                  />

                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {[
                      { label: 'Draft 50%', val: 0.5 },
                      { label: 'Standard 80%', val: 0.8 },
                      { label: 'High 92%', val: 0.92 },
                      { label: 'Max 100%', val: 1.0 },
                    ].map((q) => (
                      <button
                        key={q.label}
                        onClick={() => setQuality(q.val)}
                        className={`py-1 text-[10px] rounded font-mono border transition-colors ${
                          quality === q.val
                            ? 'bg-white text-black font-bold'
                            : 'bg-[#0D0D0D] border-[#2A2A2A] text-zinc-400 hover:text-white'
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
                <div className="p-3 bg-[#141414] border border-[#2A2A2A] rounded-xl flex items-center gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-zinc-200 shrink-0" />
                  <span>
                    <strong>Lossless Master Format:</strong> Full uncompressed color precision with zero compression artifacts.
                  </span>
                </div>
              )}

              {/* Output Sharpening Controls */}
              <div className="p-3.5 bg-[#141414] border border-[#2A2A2A] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Output Sharpening Engine</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">UNSHARP MASK</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {SHARPENING_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setOutputSharpening(opt.id)}
                      className={`p-2 rounded-lg border text-left transition-colors ${
                        outputSharpening === opt.id
                          ? 'bg-[#0D0D0D] border-white text-white font-semibold'
                          : 'bg-[#0D0D0D] border-[#2A2A2A] text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="text-xs">{opt.label}</div>
                      <div className="text-[9px] text-zinc-500 leading-tight truncate">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RESOLUTION & DIMENSIONS */}
          {activeTab === 'dimensions' && (
            <div className="space-y-4">
              {/* Scale Factors */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Output Scale Multiplier</span>
                  <span className="text-[10px] text-zinc-500 font-mono">ORIGINAL: {baseW}×{baseH}</span>
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {(['0.25x', '0.5x', '1x', '2x', '4x', 'custom'] as const).map((sc) => (
                    <button
                      key={sc}
                      onClick={() => setScaleOption(sc)}
                      className={`py-2 rounded-lg text-xs font-mono font-medium border transition-colors ${
                        scaleOption === sc
                          ? 'bg-white text-black font-bold'
                          : 'bg-[#141414] border-[#2A2A2A] text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {sc.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Standard Dimensions Presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">Preset Crop & Display Formats</label>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {PRESET_DIMENSIONS.map((group) => (
                    <div key={group.group} className="space-y-1">
                      <div className="text-[10px] font-mono text-zinc-500 uppercase">{group.group}</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {group.items.map((item) => (
                          <button
                            key={item.label}
                            onClick={() => {
                              setScaleOption('custom');
                              setCustomW(item.w);
                              setCustomH(item.h);
                            }}
                            className="p-1.5 rounded-lg text-left bg-[#141414] border border-[#2A2A2A] hover:border-zinc-600 text-zinc-300 hover:text-white transition-colors flex items-center justify-between"
                          >
                            <span className="text-[11px] truncate">{item.label}</span>
                            <span className="text-[9px] font-mono text-zinc-500 shrink-0 ml-1">
                              {item.w}×{item.h}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Dimensions */}
              <div className="p-3.5 bg-[#141414] border border-[#2A2A2A] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                  <span>Custom Dimension Override</span>
                  <button
                    onClick={() => setLockAspect(!lockAspect)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                      lockAspect
                        ? 'bg-[#0D0D0D] border-zinc-600 text-white'
                        : 'bg-[#0D0D0D] border-[#2A2A2A] text-zinc-500'
                    }`}
                  >
                    {lockAspect ? <Lock className="w-3 h-3 text-zinc-200" /> : <Unlock className="w-3 h-3" />}
                    <span>{lockAspect ? 'LOCKED' : 'FREE'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-mono">Width (px)</label>
                    <input
                      type="number"
                      value={scaleOption === 'custom' ? customW : finalW}
                      onChange={(e) => {
                        setScaleOption('custom');
                        handleCustomWidthChange(Number(e.target.value));
                      }}
                      className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-mono">Height (px)</label>
                    <input
                      type="number"
                      value={scaleOption === 'custom' ? customH : finalH}
                      onChange={(e) => {
                        setScaleOption('custom');
                        handleCustomHeightChange(Number(e.target.value));
                      }}
                      className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COLOR SPACE & DPI */}
          {activeTab === 'color-print' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Target Color Gamut & ICC Profile</span>
                  <span className="text-[10px] text-zinc-500 font-mono">COLOR ENGINE</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_SPACES.map((cs) => (
                    <button
                      key={cs.id}
                      onClick={() => setColorSpace(cs.id)}
                      className={`p-2.5 rounded-xl text-left border transition-colors ${
                        colorSpace === cs.id
                          ? 'bg-[#141414] border-white text-white'
                          : 'bg-[#0D0D0D] border-[#2A2A2A] text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{cs.name}</span>
                        <span className="text-[8px] font-mono font-bold px-1 rounded bg-[#050505] text-zinc-400 border border-[#2A2A2A]">
                          {cs.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1 leading-tight">{cs.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* DPI Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Output Print Resolution (DPI)</span>
                  <span className="text-[10px] text-zinc-500 font-mono">PHYSICAL PRESS</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {DPI_OPTIONS.map((d) => (
                    <button
                      key={d.dpi}
                      onClick={() => setDpi(d.dpi)}
                      className={`p-2 rounded-xl text-center border transition-colors ${
                        dpi === d.dpi
                          ? 'bg-white text-black font-bold'
                          : 'bg-[#141414] border-[#2A2A2A] text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="text-xs font-bold">{d.label}</div>
                      <div className="text-[9px] opacity-75 truncate">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Physical Print Sizing Calculation Card */}
              <div className="p-3.5 bg-[#141414] border border-[#2A2A2A] rounded-xl space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-zinc-300 font-bold border-b border-[#2A2A2A] pb-1.5">
                  <span className="flex items-center gap-1.5 text-zinc-200">
                    <Printer className="w-3.5 h-3.5 text-zinc-400" />
                    Print Output @ {dpi} DPI:
                  </span>
                  <span className="text-white font-bold">{estMegaPixels} MP</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-zinc-500">Inches: </span>
                    <span className="text-white font-semibold">{printWidthInches}″ × {printHeightInches}″</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Centimeters: </span>
                    <span className="text-white font-semibold">{printWidthCm} × {printHeightCm} cm</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: METADATA & PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#141414] border border-[#2A2A2A] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Metadata & Privacy Sanitization</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">EXIF / IPTC</span>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                    <input
                      type="checkbox"
                      checked={stripGps}
                      onChange={(e) => setStripGps(e.target.checked)}
                      className="rounded border-[#2A2A2A] accent-white"
                    />
                    <span>Remove GPS Geolocation Coordinates</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                    <input
                      type="checkbox"
                      checked={stripAllMetadata}
                      onChange={(e) => setStripAllMetadata(e.target.checked)}
                      className="rounded border-[#2A2A2A] accent-white"
                    />
                    <span>Strip All Personal & Hardware EXIF Data</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                    <input
                      type="checkbox"
                      checked={copyrightOnly}
                      onChange={(e) => setCopyrightOnly(e.target.checked)}
                      className="rounded border-[#2A2A2A] accent-white"
                    />
                    <span>Embed Author & Copyright Notice Only</span>
                  </label>
                </div>
              </div>

              {/* Watermark Section */}
              <div className="p-3.5 bg-[#141414] border border-[#2A2A2A] rounded-xl space-y-2">
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeWatermark}
                    onChange={(e) => setIncludeWatermark(e.target.checked)}
                    className="accent-white rounded"
                  />
                  <span className="font-semibold text-white">Embed Signature / Watermark</span>
                </label>
                <p className="text-[11px] text-[#A0A0A0] pl-5">
                  Applies the active watermark configured in the Watermark Studio onto the rendered master.
                </p>
              </div>
            </div>
          )}

          {/* Master Output Summary Card */}
          <div className="p-3 bg-[#050505] border border-[#2A2A2A] rounded-xl flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-zinc-500">Dimensions: </span>
                <span className="text-white font-bold">{finalW} × {finalH} px</span>
              </div>
              <div className="text-zinc-700">|</div>
              <div>
                <span className="text-zinc-500">DPI: </span>
                <span className="text-white font-bold">{dpi}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.2 rounded bg-[#141414] border border-[#2A2A2A] text-[10px] text-zinc-300 uppercase font-mono font-bold">
                {format}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-[#141414] border border-[#2A2A2A] text-[10px] text-zinc-400 uppercase font-mono">
                {colorSpace}
              </span>
            </div>
          </div>

          {/* Filename Input */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400">Export Filename</label>
            <div className="flex items-center bg-[#050505] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="bg-transparent text-white w-full outline-none font-mono"
              />
              <span className="text-zinc-500 font-mono">.{format}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#050505] border-t border-[#2A2A2A] flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 font-mono">
            Output: <span className="text-zinc-300">{estMegaPixels} MP</span> • <span className="text-white">{format.toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-[#141414] hover:bg-[#1A1A1A] text-zinc-300 text-xs font-medium rounded-lg border border-[#2A2A2A] transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-lg disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Rendering Master...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
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
