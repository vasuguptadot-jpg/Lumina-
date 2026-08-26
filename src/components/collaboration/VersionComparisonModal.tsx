import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Split,
  Columns,
  Layers,
  Sparkles,
  Sliders,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { Project, EditHistorySnapshot } from '../../types/editor';
import {
  ComparisonMode,
  VersionComparisonState,
} from '../../types/collaboration';
import { computeSnapshotDifferences, SettingDiffItem } from '../../services/collaborationService';
import { processImagePipeline } from '../../engine/colorPipeline';

interface VersionComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onRestoreSnapshot: (snapshot: EditHistorySnapshot) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const VersionComparisonModal: React.FC<VersionComparisonModalProps> = ({
  isOpen,
  onClose,
  project,
  onRestoreSnapshot,
  showToast,
}) => {
  const history = project.history || [];
  const [baseIndex, setBaseIndex] = useState<number>(0);
  const [compareIndex, setCompareIndex] = useState<number>(
    Math.max(0, project.historyIndex ?? history.length - 1)
  );
  const [mode, setMode] = useState<ComparisonMode>('split-slider');
  const [splitPos, setSplitPos] = useState<number>(50); // percentage 0 - 100
  const [onionOpacity, setOnionOpacity] = useState<number>(0.5);

  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const compareCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const diffCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingSplitRef = useRef(false);

  const baseSnapshot = history[baseIndex] || history[0];
  const compareSnapshot = history[compareIndex] || history[history.length - 1];

  const diffItems: SettingDiffItem[] = (baseSnapshot && compareSnapshot)
    ? computeSnapshotDifferences(baseSnapshot, compareSnapshot)
    : [];

  // Render both snapshot states onto respective canvas buffers
  useEffect(() => {
    if (!isOpen || !project.image.originalUrl || !baseSnapshot || !compareSnapshot) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = project.image.originalUrl;
    img.onload = () => {
      // 1. Render Base Version Canvas
      if (baseCanvasRef.current) {
        const c1 = baseCanvasRef.current;
        c1.width = Math.min(1280, project.image.width || 1280);
        c1.height = Math.min(720, project.image.height || 720);
        processImagePipeline({
          sourceCanvas: img,
          targetCanvas: c1,
          adjustments: baseSnapshot.settings,
          toneCurves: baseSnapshot.toneCurves,
          hsl: baseSnapshot.hsl,
          activePresetId: baseSnapshot.activePresetId,
          presetStrength: baseSnapshot.presetStrength ?? 100,
          masks: baseSnapshot.masks || [],
          watermark: baseSnapshot.watermark,
          border: baseSnapshot.border,
          highQuality: true,
        });
      }

      // 2. Render Compare Version Canvas
      if (compareCanvasRef.current) {
        const c2 = compareCanvasRef.current;
        c2.width = Math.min(1280, project.image.width || 1280);
        c2.height = Math.min(720, project.image.height || 720);
        processImagePipeline({
          sourceCanvas: img,
          targetCanvas: c2,
          adjustments: compareSnapshot.settings,
          toneCurves: compareSnapshot.toneCurves,
          hsl: compareSnapshot.hsl,
          activePresetId: compareSnapshot.activePresetId,
          presetStrength: compareSnapshot.presetStrength ?? 100,
          masks: compareSnapshot.masks || [],
          watermark: compareSnapshot.watermark,
          border: compareSnapshot.border,
          highQuality: true,
        });
      }
    };
  }, [isOpen, baseSnapshot, compareSnapshot, project]);

  if (!isOpen) return null;

  const handlePointerDownSplit = (e: React.PointerEvent) => {
    isDraggingSplitRef.current = true;
  };

  const handlePointerMoveSplit = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSplitRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    setSplitPos(xPct);
  };

  const handlePointerUpSplit = () => {
    isDraggingSplitRef.current = false;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col select-none text-slate-200 animate-in fade-in zoom-in-95 duration-150">
      {/* Header Controls Bar */}
      <div className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
            <Split className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Version Comparison & Diff Inspector</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {diffItems.length} Parameter Changes
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive split-slider, side-by-side loupe, and tonal diff comparison
            </p>
          </div>
        </div>

        {/* View Mode Ribbon */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
          {[
            { id: 'split-slider', label: 'Split Slider', icon: Split },
            { id: 'side-by-side', label: 'Side-by-Side', icon: Columns },
            { id: 'onion-skin', label: 'Onion Skin', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id as ComparisonMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Version Selector Sub-bar */}
      <div className="h-12 border-b border-slate-850 px-6 flex items-center justify-between bg-slate-950/40 text-xs">
        {/* Version A (Base) */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-400 uppercase text-[10px]">Version A (Before):</span>
          <select
            value={baseIndex}
            onChange={(e) => setBaseIndex(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1 text-white font-medium outline-none"
          >
            {history.map((h, i) => (
              <option key={h.id || i} value={i}>
                v{i + 1}: {h.label || `Milestone ${i + 1}`} ({new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </option>
            ))}
          </select>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-600" />

        {/* Version B (Compare) */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-400 uppercase text-[10px]">Version B (After):</span>
          <select
            value={compareIndex}
            onChange={(e) => setCompareIndex(Number(e.target.value))}
            className="bg-slate-900 border border-indigo-500/50 rounded-xl px-3 py-1 text-indigo-300 font-medium outline-none"
          >
            {history.map((h, i) => (
              <option key={h.id || i} value={i}>
                v{i + 1}: {h.label || `Milestone ${i + 1}`} ({new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              onRestoreSnapshot(baseSnapshot);
              showToast('success', 'Version Reverted', `Loaded "${baseSnapshot.label}"`);
              onClose();
            }}
            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold ml-3"
          >
            Revert to v{baseIndex + 1}
          </button>
        </div>
      </div>

      {/* Main Viewport & Diff Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Center: Visual Comparison Viewport */}
        <div
          className="flex-1 bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden select-none"
          onPointerMove={handlePointerMoveSplit}
          onPointerUp={handlePointerUpSplit}
        >
          {/* 1. SPLIT SLIDER MODE */}
          {mode === 'split-slider' && (
            <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
              {/* Compare Canvas (Full) */}
              <canvas ref={compareCanvasRef} className="max-h-[65vh] w-auto block object-contain" />

              {/* Base Canvas (Clipped by split percentage) */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: `${splitPos}%` }}
              >
                <canvas ref={baseCanvasRef} className="max-h-[65vh] w-auto block object-contain" />
              </div>

              {/* Draggable Divider Bar */}
              <div
                style={{ left: `${splitPos}%` }}
                onPointerDown={handlePointerDownSplit}
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-2xl flex items-center justify-center -translate-x-1/2"
              >
                <div className="w-7 h-7 rounded-full bg-white text-slate-950 shadow-xl flex items-center justify-center font-bold text-[10px] border-2 border-slate-900">
                  <Split className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Floating Labels */}
              <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-white border border-white/10 pointer-events-none">
                Before: v{baseIndex + 1} ({baseSnapshot.label})
              </span>
              <span className="absolute top-3 right-3 bg-indigo-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-300 border border-indigo-500/30 pointer-events-none">
                After: v{compareIndex + 1} ({compareSnapshot.label})
              </span>
            </div>
          )}

          {/* 2. SIDE-BY-SIDE MODE */}
          {mode === 'side-by-side' && (
            <div className="grid grid-cols-2 gap-4 max-w-full max-h-full p-2">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900/50 flex flex-col items-center justify-center">
                <canvas ref={baseCanvasRef} className="max-h-[60vh] w-auto block object-contain" />
                <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-white border border-white/10">
                  Version {baseIndex + 1}: {baseSnapshot.label}
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-indigo-500/30 shadow-xl bg-slate-900/50 flex flex-col items-center justify-center">
                <canvas ref={compareCanvasRef} className="max-h-[60vh] w-auto block object-contain" />
                <span className="absolute top-3 left-3 bg-indigo-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-300 border border-indigo-500/40">
                  Version {compareIndex + 1}: {compareSnapshot.label}
                </span>
              </div>
            </div>
          )}

          {/* 3. ONION SKIN MODE */}
          {mode === 'onion-skin' && (
            <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
              <canvas ref={baseCanvasRef} className="max-h-[65vh] w-auto block object-contain" />
              <div
                className="absolute inset-0 pointer-events-none transition-opacity"
                style={{ opacity: onionOpacity }}
              >
                <canvas ref={compareCanvasRef} className="max-h-[65vh] w-auto block object-contain" />
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3 text-xs">
                <span>Onion Blend:</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={onionOpacity}
                  onChange={(e) => setOnionOpacity(Number(e.target.value))}
                  className="w-32 accent-indigo-500"
                />
                <span className="font-mono text-indigo-300 font-bold">{Math.round(onionOpacity * 100)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Parameter Diff Inspector Table */}
        <div className="w-80 border-l border-slate-800 bg-slate-950/95 flex flex-col p-4 overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-850">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Parameter Diff Audit
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {diffItems.length} changes
            </span>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2">
            {diffItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No adjustment parameter differences between selected versions.
              </div>
            ) : (
              diffItems.map((item) => {
                const isPositive = typeof item.delta === 'number' && item.delta > 0;
                return (
                  <div
                    key={item.key}
                    className="bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-300 block">{item.label}</span>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                        <span className="text-slate-400">{String(item.baseVal)}</span>
                        <span>→</span>
                        <span className="text-white font-bold">{String(item.compareVal)}</span>
                      </div>
                    </div>

                    {item.delta !== undefined && (
                      <div
                        className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold ${
                          isPositive
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{isPositive ? `+${item.delta}` : item.delta}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
