import React, { useState } from 'react';
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
  HelpCircle,
  X,
  Zap,
  Repeat,
} from 'lucide-react';
import { ComparisonViewMode } from '../../types/editor';

interface ComparisonFloatingBarProps {
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
}

export const ComparisonFloatingBar: React.FC<ComparisonFloatingBarProps> = ({
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
}) => {
  const [showControlsPopover, setShowControlsPopover] = useState(false);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  const isComparisonActive = comparisonMode !== 'off';

  return (
    <div className="absolute top-4 right-4 z-40 flex flex-col items-end gap-2 select-none pointer-events-auto">
      {/* Primary Floating Glass Bar */}
      <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-1.5 rounded-2xl shadow-2xl ring-1 ring-white/10 transition-all">
        {/* 1. Toggle Button (Before / After) */}
        <button
          onClick={() => {
            if (comparisonMode !== 'toggle') {
              onChangeMode('toggle');
            } else {
              onToggleBeforeAfter();
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            comparisonMode === 'toggle'
              ? isShowingBeforeToggle
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
          title="Toggle Before / After (Hotkey: Y)"
        >
          <Repeat className="w-3.5 h-3.5" />
          <span className="text-[11px]">
            {comparisonMode === 'toggle'
              ? isShowingBeforeToggle
                ? 'Original [Before]'
                : 'Edited [After]'
              : 'Toggle (Y)'}
          </span>
        </button>

        {/* 2. Hold to View Original */}
        <button
          onMouseDown={onHoldBeforeStart}
          onMouseUp={onHoldBeforeEnd}
          onMouseLeave={onHoldBeforeEnd}
          onTouchStart={onHoldBeforeStart}
          onTouchEnd={onHoldBeforeEnd}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isHoldingBefore
              ? 'bg-amber-500 text-slate-950 scale-95 ring-2 ring-amber-300 shadow-lg shadow-amber-500/40'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
          title="Press & Hold to Preview Original (Hotkey: \ or O)"
        >
          <Eye className={`w-3.5 h-3.5 ${isHoldingBefore ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline text-[11px]">
            {isHoldingBefore ? 'Showing Original...' : 'Hold (\\)'}
          </span>
        </button>

        <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

        {/* 3. Split Slider (Vertical) */}
        <button
          onClick={() => onChangeMode(comparisonMode === 'split-vertical' ? 'off' : 'split-vertical')}
          className={`p-1.5 rounded-xl text-xs font-bold transition-all ${
            comparisonMode === 'split-vertical'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
          }`}
          title="Vertical Split Slider (Hotkey: S)"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>

        {/* 4. Split Slider (Horizontal) */}
        <button
          onClick={() => onChangeMode(comparisonMode === 'split-horizontal' ? 'off' : 'split-horizontal')}
          className={`p-1.5 rounded-xl text-xs font-bold transition-all ${
            comparisonMode === 'split-horizontal'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
          }`}
          title="Horizontal Split Slider (Top / Bottom)"
        >
          <ArrowUpDown className="w-4 h-4" />
        </button>

        {/* 5. Side-by-Side Dual View (Split-Screen) */}
        <button
          onClick={() => onChangeMode(comparisonMode === 'side-by-side' ? 'off' : 'side-by-side')}
          className={`p-1.5 rounded-xl text-xs font-bold transition-all ${
            comparisonMode === 'side-by-side'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
          }`}
          title="Side-by-Side Dual Screen Comparison"
        >
          <SplitSquareVertical className="w-4 h-4" />
        </button>

        {/* 6. Top-Bottom Dual View */}
        <button
          onClick={() => onChangeMode(comparisonMode === 'top-bottom' ? 'off' : 'top-bottom')}
          className={`p-1.5 rounded-xl text-xs font-bold transition-all ${
            comparisonMode === 'top-bottom'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
          }`}
          title="Top & Bottom Dual Screen Comparison"
        >
          <SplitSquareHorizontal className="w-4 h-4" />
        </button>

        {/* 7. Pro Blend / Diff Controls Expand Popover */}
        <button
          onClick={() => setShowControlsPopover(!showControlsPopover)}
          className={`p-1.5 rounded-xl text-xs font-bold transition-all ${
            showControlsPopover || comparisonMode === 'opacity-blend' || comparisonMode === 'difference'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
          }`}
          title="More Comparison Modes (Crossfade, Diff Heatmap)"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Shortcuts / Help Info */}
        <button
          onClick={() => setShowHelpTooltip(!showHelpTooltip)}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
          title="Comparison Shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Close Comparison Mode if Active */}
        {isComparisonActive && (
          <button
            onClick={() => onChangeMode('off')}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-0.5"
            title="Exit Comparison Mode"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Popover for Advanced Comparison Modes (Opacity Blend & Pixel Diff) */}
      {showControlsPopover && (
        <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl ring-1 ring-white/10 w-72 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Advanced Comparison Tools
            </span>
            <button
              onClick={() => setShowControlsPopover(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Mode Buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onChangeMode('opacity-blend')}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                comparisonMode === 'opacity-blend'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-300" />
              <span>Crossfade Blend</span>
            </button>

            <button
              onClick={() => onChangeMode('difference')}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                comparisonMode === 'difference'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-300" />
              <span>Pixel Delta Diff</span>
            </button>
          </div>

          {/* Opacity Crossfade Slider */}
          {comparisonMode === 'opacity-blend' && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Mix (Original ↔ Edited):</span>
                <span className="font-mono text-purple-300">{opacityBlend}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={opacityBlend}
                onChange={(e) => onChangeOpacityBlend(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0% Original</span>
                <span>50%</span>
                <span>100% Edited</span>
              </div>
            </div>
          )}

          {/* Difference Amplification Slider */}
          {comparisonMode === 'difference' && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Diff Intensity Amp:</span>
                <span className="font-mono text-cyan-300">{differenceAmp}×</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={differenceAmp}
                onChange={(e) => onChangeDifferenceAmp(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          )}

          {/* Split Position Quick Presets */}
          {(comparisonMode === 'split-vertical' || comparisonMode === 'split-horizontal') && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Split Position:</span>
                <span className="font-mono text-indigo-300">{Math.round(splitPos * 100)}%</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[0.25, 0.5, 0.75, 1.0].map((p) => (
                  <button
                    key={p}
                    onClick={() => onChangeSplitPos(p)}
                    className={`py-1 rounded-lg text-[10px] font-mono font-bold ${
                      Math.abs(splitPos - p) < 0.05
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
        </div>
      )}

      {/* Keyboard Shortcuts Cheat Sheet Tooltip */}
      {showHelpTooltip && (
        <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl ring-1 ring-white/10 w-72 space-y-2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              Comparison Hotkeys
            </span>
            <button
              onClick={() => setShowHelpTooltip(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="flex items-center justify-between">
              <span>Hold to View Original:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-amber-300 font-bold text-[10px]">
                \ or O
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Toggle Before / After:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-indigo-300 font-bold text-[10px]">
                Y
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Toggle Split Slider:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-300 font-bold text-[10px]">
                S
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Zoom In / Out:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300 font-bold text-[10px]">
                Ctrl + Wheel
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Pan Canvas:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300 font-bold text-[10px]">
                Space + Drag
              </kbd>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
