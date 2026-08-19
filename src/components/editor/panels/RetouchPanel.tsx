import React from 'react';
import {
  Bandage,
  Stamp,
  Sparkles,
  Scissors,
  Eye,
  Trash2,
  Undo2,
  CheckCircle2,
  Sliders,
  Crosshair,
  Info,
  Flame,
} from 'lucide-react';
import { Project, RetouchStroke, RetouchToolType } from '../../../types/editor';

interface RetouchPanelProps {
  project: Project;
  strokes: RetouchStroke[];
  onChangeStrokes: (strokes: RetouchStroke[]) => void;
  activeRetouchTool: RetouchToolType;
  onChangeRetouchTool: (tool: RetouchToolType) => void;
  brushRadius: number;
  onChangeBrushRadius: (radius: number) => void;
  brushFeather: number;
  onChangeBrushFeather: (feather: number) => void;
  brushOpacity: number;
  onChangeBrushOpacity: (opacity: number) => void;
  cloneSource: { x: number; y: number } | null;
  onSetCloneSource: (pt: { x: number; y: number } | null) => void;
  isSettingSource: boolean;
  onToggleSettingSource: () => void;
  isAiProcessing: boolean;
  setIsAiProcessing: (loading: boolean) => void;
  onCommitRetouchToImage?: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const RetouchPanel: React.FC<RetouchPanelProps> = ({
  project,
  strokes,
  onChangeStrokes,
  activeRetouchTool,
  onChangeRetouchTool,
  brushRadius,
  onChangeBrushRadius,
  brushFeather,
  onChangeBrushFeather,
  brushOpacity,
  onChangeBrushOpacity,
  cloneSource,
  onSetCloneSource,
  isSettingSource,
  onToggleSettingSource,
  isAiProcessing,
  setIsAiProcessing,
  showToast,
}) => {
  const tools: Array<{
    id: RetouchToolType;
    label: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    category: 'heal' | 'clone' | 'portrait' | 'clean';
  }> = [
    {
      id: 'healing-brush',
      label: 'Healing Brush',
      description: 'Seamless Poisson texture blending with surrounding color & lighting tone',
      icon: Bandage,
      category: 'heal',
    },
    {
      id: 'spot-removal',
      label: 'Spot & Blemish',
      description: 'Instant localized auto-sampled blemish & acne removal',
      icon: Crosshair,
      category: 'heal',
    },
    {
      id: 'clone-stamp',
      label: 'Clone Stamp',
      description: 'Sample clean pixels from another part of the image (Alt+Click to sample)',
      icon: Stamp,
      category: 'clone',
    },
    {
      id: 'skin-smoothing',
      label: 'Skin Smoothing',
      description: 'Frequency separation: smooths uneven skin tone while preserving natural pores',
      icon: Sparkles,
      category: 'portrait',
    },
    {
      id: 'wrinkle-reduction',
      label: 'Wrinkle Reduction',
      description: 'Attenuates deep skin crease shadows while keeping organic facial lighting',
      icon: Flame,
      category: 'portrait',
    },
    {
      id: 'red-eye',
      label: 'Red-Eye Fix',
      description: 'Removes camera flash red reflex while keeping shiny catchlights',
      icon: Eye,
      category: 'portrait',
    },
    {
      id: 'dust-removal',
      label: 'Dust & Scratches',
      description: 'Outlier filter removes film dust specks and camera sensor spots',
      icon: Scissors,
      category: 'clean',
    },
  ];

  const handleClearStrokes = () => {
    onChangeStrokes([]);
    showToast('info', 'Retouch Reset', 'All retouch strokes cleared');
  };

  const handleUndoStroke = () => {
    if (strokes.length > 0) {
      onChangeStrokes(strokes.slice(0, -1));
      showToast('info', 'Undo', 'Removed last retouch stroke');
    }
  };

  const handleToggleStroke = (index: number) => {
    const updated = strokes.map((s, idx) => (idx === index ? { ...s, active: s.active === false ? true : false } : s));
    onChangeStrokes(updated);
  };

  const handleDeleteStroke = (index: number) => {
    const updated = strokes.filter((_, idx) => idx !== index);
    onChangeStrokes(updated);
  };

  return (
    <div className="p-4 space-y-5 text-slate-200">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Bandage className="w-4 h-4 text-rose-400" />
            <span>Retouch & Healing Studio</span>
          </h3>
          <p className="text-[11px] text-slate-400">Non-destructive professional photo retouching</p>
        </div>

        {strokes.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndoStroke}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
              title="Undo Last Stroke"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClearStrokes}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 transition-colors"
              title="Clear All Strokes"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Tool Selector Grid */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Tool</label>
        <div className="grid grid-cols-2 gap-2">
          {tools.map((t) => {
            const Icon = t.icon;
            const isSelected = activeRetouchTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChangeRetouchTool(t.id)}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  isSelected
                    ? 'bg-rose-950/60 border-rose-500 text-rose-200 shadow-md shadow-rose-950/40 ring-1 ring-rose-500'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-rose-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold leading-tight">{t.label}</span>
                </div>
                <span className="text-[10px] text-slate-400 line-clamp-2 leading-snug">{t.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clone / Healing Sample Source Controller */}
      {(activeRetouchTool === 'clone-stamp' || activeRetouchTool === 'healing-brush') && (
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-rose-400" />
              <span>Clone / Healing Source</span>
            </span>

            {cloneSource && (
              <span className="text-[10px] font-mono text-rose-300">
                ({Math.round(cloneSource.x * 100)}%, {Math.round(cloneSource.y * 100)}%)
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Click <strong className="text-rose-300">Set Source</strong> below or hold <strong className="text-rose-300">Alt</strong> on the photo to choose sample area.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSettingSource}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                isSettingSource
                  ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>{isSettingSource ? 'Click Canvas to Set...' : 'Set Source Point'}</span>
            </button>

            {cloneSource && (
              <button
                onClick={() => onSetCloneSource(null)}
                className="py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 bg-slate-800 border border-slate-700 transition-colors"
                title="Reset to default offset"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Brush Parameters Sliders */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-rose-400" />
          <span>Brush Dynamics</span>
        </span>

        {/* Brush Size */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Brush Size</span>
            <span className="font-mono text-rose-300 font-bold">{brushRadius} px</span>
          </div>
          <input
            type="range"
            min="2"
            max="200"
            value={brushRadius}
            onChange={(e) => onChangeBrushRadius(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
        </div>

        {/* Brush Feather */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Feather (Softness)</span>
            <span className="font-mono text-rose-300 font-bold">{brushFeather}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={brushFeather}
            onChange={(e) => onChangeBrushFeather(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
        </div>

        {/* Brush Opacity */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Stroke Opacity</span>
            <span className="font-mono text-rose-300 font-bold">{brushOpacity}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            value={brushOpacity}
            onChange={(e) => onChangeBrushOpacity(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
        </div>
      </div>

      {/* Applied Strokes History List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Applied Retouch Strokes ({strokes.length})
          </label>
        </div>

        {strokes.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center bg-slate-900/30">
            <Info className="w-5 h-5 text-slate-500 mx-auto mb-1.5" />
            <p className="text-xs text-slate-400">Paint directly on the image to retouch blemishes, skin, or unwanted elements.</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {strokes.map((stroke, index) => (
              <div
                key={stroke.id || index}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => handleToggleStroke(index)}
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                      stroke.active !== false
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    {stroke.active !== false && <CheckCircle2 className="w-3 h-3" />}
                  </button>
                  <span className="font-semibold text-slate-200 capitalize truncate">
                    {stroke.type.replace('-', ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {stroke.radius}px • {stroke.points.length} pts
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteStroke(index)}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Remove stroke"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
