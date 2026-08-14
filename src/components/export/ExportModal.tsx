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
} from 'lucide-react';
import { Project } from '../../types/editor';
import { exportHighResImage, triggerDownload } from '../../engine/exportEngine';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  showToast,
}) => {
  if (!isOpen) return null;

  const [format, setFormat] = useState<'jpeg' | 'png' | 'webp' | 'tiff'>('jpeg');
  const [quality, setQuality] = useState(0.92);
  const [scaleOption, setScaleOption] = useState<'1x' | '0.5x' | '2x' | '4x' | 'custom'>('1x');
  const [customW, setCustomW] = useState(project.image.width || 3840);
  const [customH, setCustomH] = useState(project.image.height || 2160);
  const [includeWatermark, setIncludeWatermark] = useState(project.watermark.enabled);
  const [filename, setFilename] = useState(
    `${project.name.replace(/\.[^/.]+$/, '')}_Lumina_Master`
  );
  const [isExporting, setIsExporting] = useState(false);

  // Calculate final target dimensions
  const baseW = project.image.width || 2400;
  const baseH = project.image.height || 1600;

  let finalW = baseW;
  let finalH = baseH;

  if (scaleOption === '0.5x') {
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

  const handleExport = async () => {
    setIsExporting(true);
    showToast('info', 'Rendering High-Res Export', 'Applying full-precision color grading pipeline...');

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for master render'));
        img.src = project.image.originalUrl;
      });

      let scaleFactor = 1;
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
        watermark: includeWatermark ? project.watermark : undefined,
        border: project.border,
        masks: project.masks,
        exportConfig: {
          format,
          quality,
          scaleFactor,
          customWidth: scaleOption === 'custom' ? customW : undefined,
          customHeight: scaleOption === 'custom' ? customH : undefined,
          filename: `${filename}.${format}`,
        },
      });

      triggerDownload(result.url, `${filename}.${format}`);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (e) {}

      showToast('success', 'Export Downloaded', `${result.width} × ${result.height} px (${(result.sizeBytes / 1024 / 1024).toFixed(2)} MB)`);
      onClose();
    } catch (err: any) {
      showToast('error', 'Export Failed', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Master High-Resolution Export</h3>
              <p className="text-[11px] text-slate-400">Lossless & High Dynamic Range Output</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileImage className="w-3.5 h-3.5 text-indigo-400" />
              File Format
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'jpeg', label: 'JPEG', desc: 'Standard Web & Print' },
                { id: 'png', label: 'PNG', desc: 'Lossless 24-bit' },
                { id: 'webp', label: 'WebP', desc: 'Modern Compact' },
                { id: 'tiff', label: 'TIFF', desc: 'Pro Master 24-bit' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setFormat(fmt.id as any)}
                  className={`p-2.5 rounded-xl text-center border transition-all ${
                    format === fmt.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-black uppercase">{fmt.label}</div>
                  <div className="text-[9px] opacity-75 truncate">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* JPEG Quality Slider */}
          {format === 'jpeg' && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>JPEG Encoding Quality</span>
                <span className="font-mono text-indigo-400 font-bold">{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.6}
                max={1.0}
                step={0.01}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          )}

          {/* Resolution Scaling */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              Output Resolution
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: '0.5x', label: '0.5x', desc: 'Web Preview' },
                { id: '1x', label: '1x (Native)', desc: `${baseW}px` },
                { id: '2x', label: '2x Super-Res', desc: `${baseW * 2}px` },
                { id: '4x', label: '4x Ultra-Res', desc: 'Large Print' },
              ].map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => setScaleOption(sc.id as any)}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    scaleOption === sc.id
                      ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold">{sc.label}</div>
                  <div className="text-[9px] opacity-75">{sc.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Output Specs Info Card */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-400">Dimensions: </span>
              <span className="text-white font-bold">{finalW} × {finalH} px</span>
            </div>
            <div>
              <span className="text-slate-400">Resolution: </span>
              <span className="text-emerald-400 font-bold">{estMegaPixels} MP</span>
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

          {/* Watermark Checkbox */}
          {project.watermark.text && (
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={includeWatermark}
                onChange={(e) => setIncludeWatermark(e.target.checked)}
                className="accent-indigo-500 rounded"
              />
              <span>Include Signature Watermark ("{project.watermark.text}")</span>
            </label>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all active:scale-95"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Rendering High-Res...</span>
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
  );
};
