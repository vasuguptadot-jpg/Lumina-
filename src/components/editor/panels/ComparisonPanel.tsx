import React from 'react';
import {
  Columns,
  Eye,
  ArrowLeftRight,
  ArrowUpDown,
  SplitSquareVertical,
  SplitSquareHorizontal,
  Layers,
  Sliders,
  Sparkles,
  Zap,
  Repeat,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Maximize2,
  ShieldCheck,
} from 'lucide-react';
import { ComparisonViewMode, Project } from '../../../types/editor';

interface ComparisonPanelProps {
  project: Project;
  comparisonMode: ComparisonViewMode;
  onChangeMode: (mode: ComparisonViewMode) => void;
  isShowingBeforeToggle: boolean;
  onToggleBeforeAfter: () => void;
  isHoldingBefore: boolean;
  onHoldBeforeStart: () => void;
  onHoldBeforeEnd: () => void;
  splitPos: number;
  onChangeSplitPos: (pos: number) => void;
  opacityBlend: number;
  onChangeOpacityBlend: (val: number) => void;
  differenceAmp: number;
  onChangeDifferenceAmp: (val: number) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  project,
  comparisonMode,
  onChangeMode,
  isShowingBeforeToggle,
  onToggleBeforeAfter,
  isHoldingBefore,
  onHoldBeforeStart,
  onHoldBeforeEnd,
  splitPos,
  onChangeSplitPos,
  opacityBlend,
  onChangeOpacityBlend,
  differenceAmp,
  onChangeDifferenceAmp,
  showToast,
}) => {
  return (
    <div className="p-4 space-y-5 text-slate-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-1.5">
            <Columns className="w-4 h-4 text-indigo-400" />
            Before / After Comparison Studio
          </h3>
          <p className="text-[11px] text-slate-400">
            Compare original unedited image against graded & retouched edit
          </p>
        </div>

        {comparisonMode !== 'off' && (
          <button
            onClick={() => {
              onChangeMode('off');
              showToast?.('info', 'Comparison Closed', 'Returned to standard single-view canvas.');
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset View</span>
          </button>
        )}
      </div>

      {/* Primary Interaction Cards: Toggle & Hold */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Toggle Button */}
        <button
          onClick={() => {
            if (comparisonMode !== 'toggle') {
              onChangeMode('toggle');
            } else {
              onToggleBeforeAfter();
            }
          }}
          className={`p-3.5 rounded-2xl border text-left space-y-1.5 transition-all relative overflow-hidden group ${
            comparisonMode === 'toggle'
              ? isShowingBeforeToggle
                ? 'bg-amber-950/40 border-amber-500/80 ring-1 ring-amber-500/40'
                : 'bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/40'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <Repeat
              className={`w-4 h-4 ${
                comparisonMode === 'toggle' ? 'text-amber-400' : 'text-slate-400'
              }`}
            />
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-slate-300">
              Y
            </kbd>
          </div>
          <div>
            <div className="text-xs font-black text-white">1-Click Toggle</div>
            <div className="text-[11px] text-slate-400">
              {comparisonMode === 'toggle'
                ? isShowingBeforeToggle
                  ? '👁️ Viewing: Original (Before)'
                  : '✨ Viewing: Edited (After)'
                : 'Switch Before ↔ After'}
            </div>
          </div>
          {comparisonMode === 'toggle' && (
            <div className="absolute bottom-1 right-2">
              <span
                className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                  isShowingBeforeToggle
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {isShowingBeforeToggle ? 'ORIGINAL' : 'EDITED'}
              </span>
            </div>
          )}
        </button>

        {/* Hold to View Original */}
        <button
          onMouseDown={onHoldBeforeStart}
          onMouseUp={onHoldBeforeEnd}
          onMouseLeave={onHoldBeforeEnd}
          onTouchStart={onHoldBeforeStart}
          onTouchEnd={onHoldBeforeEnd}
          className={`p-3.5 rounded-2xl border text-left space-y-1.5 transition-all relative overflow-hidden active:scale-95 ${
            isHoldingBefore
              ? 'bg-amber-950/70 border-amber-400 ring-2 ring-amber-400 shadow-lg shadow-amber-500/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <Eye
              className={`w-4 h-4 ${
                isHoldingBefore ? 'text-amber-400 animate-pulse' : 'text-slate-400'
              }`}
            />
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-slate-300">
              \ or O
            </kbd>
          </div>
          <div>
            <div className="text-xs font-black text-white">Hold for Original</div>
            <div className="text-[11px] text-slate-400">
              {isHoldingBefore ? 'Showing Original (Release to return)' : 'Press & Hold to preview'}
            </div>
          </div>
        </button>
      </div>

      {/* Comparison Modes Selection Grid */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Columns className="w-3.5 h-3.5 text-indigo-400" />
          <span>Comparison Display Modes:</span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          {/* Vertical Split Slider */}
          <button
            onClick={() => onChangeMode('split-vertical')}
            className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
              comparisonMode === 'split-vertical'
                ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500/40 shadow-md'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-mono font-bold text-indigo-300">
                {comparisonMode === 'split-vertical' ? `${Math.round(splitPos * 100)}%` : '↔'}
              </span>
            </div>
            <div className="text-xs font-bold text-white">Vertical Split Slider</div>
            <div className="text-[10px] text-slate-400">Draggable divider (Left/Right)</div>
          </button>

          {/* Horizontal Split Slider */}
          <button
            onClick={() => onChangeMode('split-horizontal')}
            className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
              comparisonMode === 'split-horizontal'
                ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500/40 shadow-md'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <ArrowUpDown className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-mono font-bold text-indigo-300">
                {comparisonMode === 'split-horizontal' ? `${Math.round(splitPos * 100)}%` : '↕'}
              </span>
            </div>
            <div className="text-xs font-bold text-white">Horizontal Split Slider</div>
            <div className="text-[10px] text-slate-400">Draggable divider (Top/Bottom)</div>
          </button>

          {/* Side-by-Side Dual View */}
          <button
            onClick={() => onChangeMode('side-by-side')}
            className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
              comparisonMode === 'side-by-side'
                ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500/40 shadow-md'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <SplitSquareVertical className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-mono font-bold text-purple-300">1:1 Dual</span>
            </div>
            <div className="text-xs font-bold text-white">Side-by-Side View</div>
            <div className="text-[10px] text-slate-400">Synchronized Dual Viewports</div>
          </button>

          {/* Top-and-Bottom Dual View */}
          <button
            onClick={() => onChangeMode('top-bottom')}
            className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
              comparisonMode === 'top-bottom'
                ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500/40 shadow-md'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <SplitSquareHorizontal className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-mono font-bold text-purple-300">Stacked</span>
            </div>
            <div className="text-xs font-bold text-white">Top-and-Bottom View</div>
            <div className="text-[10px] text-slate-400">Ideal for Portrait orientation</div>
          </button>

          {/* Opacity Crossfade Blend */}
          <button
            onClick={() => onChangeMode('opacity-blend')}
            className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
              comparisonMode === 'opacity-blend'
                ? 'bg-purple-950/50 border-purple-500 ring-1 ring-purple-500/40 shadow-md'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-mono font-bold text-purple-300">{opacityBlend}%</span>
            </div>
            <div className="text-xs font-bold text-white">Crossfade Blend</div>
            <div className="text-[10px] text-slate-400">Smooth 0-100% opacity mix</div>
          </button>

          {/* Pixel Delta Difference */}
          <button
            onClick={() => onChangeMode('difference')}
            className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
              comparisonMode === 'difference'
                ? 'bg-cyan-950/50 border-cyan-500 ring-1 ring-cyan-500/40 shadow-md'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold text-cyan-300">{differenceAmp}×</span>
            </div>
            <div className="text-xs font-bold text-white">Pixel Delta Heatmap</div>
            <div className="text-[10px] text-slate-400">Inspect exact pixel shifts</div>
          </button>
        </div>
      </div>

      {/* Split Slider Interactive Adjustment */}
      {(comparisonMode === 'split-vertical' || comparisonMode === 'split-horizontal') && (
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Split Slider Position:</span>
            <span className="font-mono text-indigo-400">{Math.round(splitPos * 100)}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(splitPos * 100)}
            onChange={(e) => onChangeSplitPos(Number(e.target.value) / 100)}
            className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />

          <div className="grid grid-cols-4 gap-1 pt-1">
            {[0.25, 0.5, 0.75, 1.0].map((p) => (
              <button
                key={p}
                onClick={() => onChangeSplitPos(p)}
                className={`py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  Math.abs(splitPos - p) < 0.04
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {Math.round(p * 100)}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Opacity Crossfade Slider */}
      {comparisonMode === 'opacity-blend' && (
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Blend Mix (Original ↔ Edited):</span>
            <span className="font-mono text-purple-400">{opacityBlend}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={opacityBlend}
            onChange={(e) => onChangeOpacityBlend(Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />

          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>0% (Original)</span>
            <span>50% (Equal Mix)</span>
            <span>100% (Edited)</span>
          </div>
        </div>
      )}

      {/* Pixel Diff Amplification */}
      {comparisonMode === 'difference' && (
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Difference Amplification:</span>
            <span className="font-mono text-cyan-400">{differenceAmp}×</span>
          </div>

          <input
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={differenceAmp}
            onChange={(e) => onChangeDifferenceAmp(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />

          <p className="text-[11px] text-slate-400">
            Highlights modified pixels in high-contrast color to reveal subtle skin retouching, color shifts, and tone curve adjustments.
          </p>
        </div>
      )}

      {/* Image Specs & Active Edits Overview */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Active Edit Summary:
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {project.image.width} × {project.image.height} px
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
          <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Exposure:</span>
            <span className="font-mono text-amber-300">
              {project.currentSettings.exposure > 0 ? `+${project.currentSettings.exposure}` : project.currentSettings.exposure}
            </span>
          </div>

          <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Contrast:</span>
            <span className="font-mono text-indigo-300">
              {project.currentSettings.contrast > 0 ? `+${project.currentSettings.contrast}` : project.currentSettings.contrast}
            </span>
          </div>

          <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Preset:</span>
            <span className="font-mono text-purple-300 truncate max-w-[80px]">
              {project.activePresetId || 'None'}
            </span>
          </div>

          <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Retouching:</span>
            <span className="font-mono text-emerald-300">
              {project.retouchStrokes?.length || 0} strokes
            </span>
          </div>
        </div>
      </div>

      {/* Hotkey Guide Card */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-3.5 space-y-2 text-xs">
        <div className="font-bold text-slate-300 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Keyboard Shortcuts Reference:</span>
        </div>

        <div className="space-y-1.5 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span>Hold to preview Original:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-amber-300 font-bold text-[10px]">
              \ or O
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Toggle Before ↔ After:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-indigo-300 font-bold text-[10px]">
              Y
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Toggle Vertical Split:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-cyan-300 font-bold text-[10px]">
              S
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Zoom in/out:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-300 font-bold text-[10px]">
              Ctrl + Wheel
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
