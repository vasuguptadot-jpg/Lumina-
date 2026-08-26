import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  FileImage,
  Layers,
  Sparkles,
  Sliders,
  Shield,
  Clock,
  HardDrive,
  Copy,
  Share2,
  RefreshCw,
  FolderOpen,
  Check,
} from 'lucide-react';
import { Project } from '../../types/editor';

interface ExportWorkspaceViewProps {
  project: Project;
  onExportMaster?: (format: string, quality: number) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

type ExportFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff' | 'dng';
type ColorSpace = 'srgb' | 'display_p3' | 'adobe_rgb' | 'rec2020';

export const ExportWorkspaceView: React.FC<ExportWorkspaceViewProps> = ({
  project,
  onExportMaster,
  showToast,
}) => {
  const [format, setFormat] = useState<ExportFormat>('jpeg');
  const [quality, setQuality] = useState<number>(92);
  const [scale, setScale] = useState<number>(1);
  const [colorSpace, setColorSpace] = useState<ColorSpace>('display_p3');
  const [stripExif, setStripExif] = useState<boolean>(false);
  const [embedIcc, setEmbedIcc] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const [exportHistory, setExportHistory] = useState([
    {
      id: 'exp_1',
      name: `${project.name}_Master.jpg`,
      format: 'JPEG (92%)',
      dimensions: '3840 × 2160',
      size: '6.4 MB',
      time: '10 mins ago',
    },
    {
      id: 'exp_2',
      name: `${project.name}_Print.tiff`,
      format: '16-bit TIFF',
      dimensions: '3840 × 2160',
      size: '48.2 MB',
      time: '1 hour ago',
    },
    {
      id: 'exp_3',
      name: `${project.name}_Social.png`,
      format: 'Lossless PNG',
      dimensions: '1920 × 1080',
      size: '3.1 MB',
      time: 'Yesterday',
    },
  ]);

  const FORMATS: { id: ExportFormat; label: string; desc: string; ext: string }[] = [
    { id: 'jpeg', label: 'JPEG', desc: 'Universal photographic compression', ext: '.jpg' },
    { id: 'png', label: 'PNG', desc: 'Lossless alpha channel graphics', ext: '.png' },
    { id: 'webp', label: 'WebP', desc: 'Modern high-efficiency web image', ext: '.webp' },
    { id: 'avif', label: 'AVIF', desc: 'Next-gen HDR 10-bit compression', ext: '.avif' },
    { id: 'tiff', label: '16-Bit TIFF', desc: 'Archival uncompressed master', ext: '.tiff' },
    { id: 'dng', label: 'Adobe DNG', desc: 'Digital Negative RAW container', ext: '.dng' },
  ];

  const handleExecuteExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      const newEntry = {
        id: `exp_${Date.now()}`,
        name: `${project.name}_Export${FORMATS.find((f) => f.id === format)?.ext || '.jpg'}`,
        format: `${format.toUpperCase()} (${quality}%)`,
        dimensions: `${Math.round((project.image?.width || 3840) * scale)} × ${Math.round(
          (project.image?.height || 2160) * scale
        )}`,
        size: format === 'tiff' ? '52.1 MB' : `${(3.2 * scale * (quality / 100)).toFixed(1)} MB`,
        time: 'Just now',
      };
      setExportHistory((prev) => [newEntry, ...prev]);
      showToast?.('success', 'Asset Exported', `Rendered ${newEntry.name}`);
    }, 800);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#000000] p-4 sm:p-8 space-y-6 select-none text-white font-sans">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-[#080808] border border-[#222222] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141414] text-[#CCCCCC] border border-[#2C2C2C] uppercase tracking-wider flex items-center gap-1.5">
              <Download className="w-3 h-3 text-[#CCCCCC]" />
              <span>EXPORT & RENDER HUB</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#141414] text-[#999999] border border-[#222222]">
              32-Bit Pipeline
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Export Studio
          </h1>
          <p className="text-xs text-[#999999]">
            Color-managed high-fidelity master exports with ICC profiling, metadata sanitization, and batch capabilities.
          </p>
        </div>

        <button
          onClick={handleExecuteExport}
          disabled={isExporting}
          className="px-5 py-2.5 rounded-lg bg-white hover:bg-[#CCCCCC] text-black text-xs font-semibold flex items-center gap-2 transition-colors active:scale-98 shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Encoding Pixels...' : 'Export Master File'}</span>
        </button>
      </div>

      {/* 2-Column Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Formats & Quality Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Format Selection Grid */}
          <div className="p-5 rounded-xl bg-[#080808] border border-[#222222] space-y-4">
            <h2 className="text-xs font-semibold uppercase font-mono tracking-wider text-white">
              Target Output Format
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {FORMATS.map((f) => {
                const isActive = format === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`p-3.5 rounded-xl border text-left transition-colors flex flex-col justify-between space-y-2 ${
                      isActive
                        ? 'bg-[#181818] border-white text-white'
                        : 'bg-[#101010] border-[#222222] text-[#999999] hover:text-white hover:border-[#444444]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs font-mono">{f.label}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <p className="text-[10px] text-[#666666] leading-tight">{f.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Precision Sliders */}
          <div className="p-5 rounded-xl bg-[#080808] border border-[#222222] space-y-5">
            <h2 className="text-xs font-semibold uppercase font-mono tracking-wider text-white">
              Encoding & Sizing Precision
            </h2>

            {/* Quality Slider (for lossy formats) */}
            {format !== 'png' && format !== 'tiff' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#999999]">Compression Quality</span>
                  <span className="font-mono text-white">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Resolution Scale */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#999999]">Resolution Multiplier</span>
                <span className="font-mono text-white">{scale}× ({Math.round((project.image?.width || 3840) * scale)} × {Math.round((project.image?.height || 2160) * scale)})</span>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[0.5, 1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    className={`py-1.5 rounded text-xs font-mono font-medium border ${
                      scale === s
                        ? 'bg-white text-black border-white'
                        : 'bg-[#101010] text-[#999999] border-[#222222] hover:text-white'
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            {/* Color Space Profile */}
            <div className="space-y-2 pt-2 border-t border-[#181818]">
              <label className="text-xs text-[#999999]">Output Color Profile (ICC)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'srgb', label: 'sRGB IEC61966' },
                  { id: 'display_p3', label: 'Display P3 Wide' },
                  { id: 'adobe_rgb', label: 'Adobe RGB 1998' },
                  { id: 'rec2020', label: 'Rec. 2020 HDR' },
                ].map((cs) => (
                  <button
                    key={cs.id}
                    onClick={() => setColorSpace(cs.id as any)}
                    className={`py-1.5 px-2 rounded text-[11px] font-mono border text-center truncate ${
                      colorSpace === cs.id
                        ? 'bg-[#181818] text-white border-white'
                        : 'bg-[#101010] text-[#999999] border-[#222222] hover:text-white'
                    }`}
                  >
                    {cs.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-[#181818] grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs text-[#CCCCCC] cursor-pointer">
                <input
                  type="checkbox"
                  checked={embedIcc}
                  onChange={(e) => setEmbedIcc(e.target.checked)}
                  className="rounded bg-[#101010] border-[#333333]"
                />
                <span>Embed ICC Color Profile Matrix</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-[#CCCCCC] cursor-pointer">
                <input
                  type="checkbox"
                  checked={stripExif}
                  onChange={(e) => setStripExif(e.target.checked)}
                  className="rounded bg-[#101010] border-[#333333]"
                />
                <span>Strip GPS & Camera Metadata</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Export Summary & Recent Exports History */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="p-5 rounded-xl bg-[#080808] border border-[#222222] space-y-3.5">
            <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-white">
              Render Preview
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#999999]">
                <span>Project Name:</span>
                <span className="font-mono text-white">{project.name}</span>
              </div>
              <div className="flex items-center justify-between text-[#999999]">
                <span>Format:</span>
                <span className="font-mono text-white">{format.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between text-[#999999]">
                <span>Resolution:</span>
                <span className="font-mono text-white">
                  {Math.round((project.image?.width || 3840) * scale)} ×{' '}
                  {Math.round((project.image?.height || 2160) * scale)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#999999]">
                <span>Estimated Size:</span>
                <span className="font-mono text-white">
                  ~{(4.2 * scale * (quality / 100)).toFixed(1)} MB
                </span>
              </div>
            </div>

            <button
              onClick={handleExecuteExport}
              disabled={isExporting}
              className="w-full py-2 rounded-lg bg-white hover:bg-[#CCCCCC] text-black text-xs font-semibold transition-colors active:scale-98"
            >
              {isExporting ? 'Encoding...' : 'Download Master'}
            </button>
          </div>

          {/* Export History */}
          <div className="p-5 rounded-xl bg-[#080808] border border-[#222222] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#666666]" />
                <span>Recent Exports</span>
              </h3>
            </div>

            <div className="space-y-2">
              {exportHistory.map((h) => (
                <div
                  key={h.id}
                  className="p-2.5 rounded-lg bg-[#101010] border border-[#222222] space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-white truncate">{h.name}</span>
                    <span className="text-[10px] text-[#666666] font-mono">{h.time}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#999999] font-mono">
                    <span>{h.format}</span>
                    <span>{h.size}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
