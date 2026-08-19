import React, { useState } from 'react';
import {
  Paintbrush,
  Pencil,
  Highlighter,
  PenTool,
  Eraser,
  Wind,
  Fingerprint,
  Shapes,
  Sparkles,
  Pipette,
  Zap,
  Star,
  Circle,
  Square,
  Droplets,
  Grid,
  Feather,
  Leaf,
  Cloud,
  Flame,
  Undo2,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  ChevronRight,
  Check,
  Palette,
  Sliders,
  Maximize2,
  ArrowRight,
  MoveHorizontal,
  Triangle,
  Heart,
  MessageSquare,
  Hexagon,
  Copy,
} from 'lucide-react';
import {
  DrawingStroke,
  DrawingToolType,
  DrawingShapeType,
  CustomBrushType,
  LayerBlendMode,
  Project,
} from '../../../types/editor';
import {
  CUSTOM_BRUSH_PRESETS,
  DRAWING_PALETTES,
  GRADIENT_STROKE_PRESETS,
} from '../../../engine/drawingEngine';

interface DrawingPanelProps {
  project: Project;
  onUpdateDrawingStrokes: (strokes: DrawingStroke[]) => void;
  activeDrawingTool: DrawingToolType;
  onChangeActiveDrawingTool: (tool: DrawingToolType) => void;
  brushSize: number;
  onChangeBrushSize: (size: number) => void;
  brushOpacity: number;
  onChangeBrushOpacity: (opacity: number) => void;
  brushFlow: number;
  onChangeBrushFlow: (flow: number) => void;
  brushHardness: number;
  onChangeBrushHardness: (hardness: number) => void;
  brushSmoothing: number;
  onChangeBrushSmoothing: (smoothing: number) => void;
  pressureSensitivity: boolean;
  onChangePressureSensitivity: (enabled: boolean) => void;
  brushColor: string;
  onChangeBrushColor: (color: string) => void;
  activeShapeType: DrawingShapeType;
  onChangeActiveShapeType: (shape: DrawingShapeType) => void;
  shapeFilled: boolean;
  onChangeShapeFilled: (filled: boolean) => void;
  shapeFillColor: string;
  onChangeShapeFillColor: (color: string) => void;
  activeCustomBrush: CustomBrushType;
  onChangeActiveCustomBrush: (type: CustomBrushType) => void;
  glowEnabled: boolean;
  onChangeGlowEnabled: (enabled: boolean) => void;
  glowColor: string;
  onChangeGlowColor: (color: string) => void;
  glowRadius: number;
  onChangeGlowRadius: (radius: number) => void;
  blendMode: LayerBlendMode;
  onChangeBlendMode: (mode: LayerBlendMode) => void;
  isEyedropperActive: boolean;
  onToggleEyedropper: (active: boolean) => void;
  recentColors: string[];
  onAddRecentColor: (color: string) => void;
  onBurnDrawingsToImage?: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const DrawingPanel: React.FC<DrawingPanelProps> = ({
  project,
  onUpdateDrawingStrokes,
  activeDrawingTool,
  onChangeActiveDrawingTool,
  brushSize,
  onChangeBrushSize,
  brushOpacity,
  onChangeBrushOpacity,
  brushFlow,
  onChangeBrushFlow,
  brushHardness,
  onChangeBrushHardness,
  brushSmoothing,
  onChangeBrushSmoothing,
  pressureSensitivity,
  onChangePressureSensitivity,
  brushColor,
  onChangeBrushColor,
  activeShapeType,
  onChangeActiveShapeType,
  shapeFilled,
  onChangeShapeFilled,
  shapeFillColor,
  onChangeShapeFillColor,
  activeCustomBrush,
  onChangeActiveCustomBrush,
  glowEnabled,
  onChangeGlowEnabled,
  glowColor,
  onChangeGlowColor,
  glowRadius,
  onChangeGlowRadius,
  blendMode,
  onChangeBlendMode,
  isEyedropperActive,
  onToggleEyedropper,
  recentColors,
  onAddRecentColor,
  onBurnDrawingsToImage,
  showToast,
}) => {
  const strokes = project.drawingStrokes || [];
  const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null);
  const [activePaletteIndex, setActivePaletteIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'tools' | 'color' | 'strokes'>('tools');

  const toolsList: Array<{
    id: DrawingToolType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    description: string;
  }> = [
    { id: 'brush', label: 'Paint Brush', icon: Paintbrush, description: 'Smooth acrylic & oil painter with natural blending' },
    { id: 'pencil', label: 'Pencil', icon: Pencil, badge: '2B', description: 'Textured graphite pencil with paper tooth grain' },
    { id: 'marker', label: 'Marker', icon: Highlighter, badge: 'GLAZE', description: 'Chisel tip highlighter with glaze multiply layering' },
    { id: 'pen', label: 'Calligraphy Pen', icon: PenTool, description: 'Dynamic fountain & calligraphy nib with angle thickness' },
    { id: 'airbrush', label: 'Airbrush', icon: Wind, badge: 'SPRAY', description: 'Soft mist spray with radial Gaussian falloff' },
    { id: 'smudge', label: 'Smudge', icon: Fingerprint, badge: 'BLEND', description: 'Finger blur & directional pixel smearing' },
    { id: 'eraser', label: 'Eraser', icon: Eraser, description: 'Hard & soft feathered eraser' },
    { id: 'shape', label: 'Shapes', icon: Shapes, badge: 'VECTOR', description: 'Geometric lines, arrows, rectangles, circles, stars' },
    { id: 'custom-brush', label: 'Custom FX', icon: Sparkles, badge: 'STAMPS', description: 'Neon glow, sparkles, bokeh, halftone & foliage' },
    { id: 'eyedropper', label: 'Eyedropper', icon: Pipette, badge: 'SAMPLE', description: 'Sample exact pixel colors from the photo canvas' },
  ];

  const shapesList: Array<{ id: DrawingShapeType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'line', label: 'Line', icon: MoveHorizontal },
    { id: 'arrow', label: 'Arrow', icon: ArrowRight },
    { id: 'double-arrow', label: 'Double Arrow', icon: MoveHorizontal },
    { id: 'rectangle', label: 'Rectangle', icon: Square },
    { id: 'rounded-rect', label: 'Rounded Box', icon: Square },
    { id: 'circle', label: 'Circle', icon: Circle },
    { id: 'triangle', label: 'Triangle', icon: Triangle },
    { id: 'star', label: 'Star', icon: Star },
    { id: 'heart', label: 'Heart', icon: Heart },
    { id: 'speech-bubble', label: 'Speech Bubble', icon: MessageSquare },
    { id: 'polygon', label: 'Hexagon', icon: Hexagon },
  ];

  const blendModes: LayerBlendMode[] = [
    'normal',
    'multiply',
    'screen',
    'overlay',
    'color-dodge',
    'luminosity',
  ];

  const quickSizes = [2, 6, 14, 28, 48, 80, 120];

  // Stroke management
  const handleUndoLastStroke = () => {
    if (strokes.length === 0) return;
    const nextStrokes = strokes.slice(0, -1);
    onUpdateDrawingStrokes(nextStrokes);
    showToast('info', 'Undo Drawing', 'Removed last stroke');
  };

  const handleClearAllStrokes = () => {
    if (strokes.length === 0) return;
    if (confirm('Clear all drawing strokes?')) {
      onUpdateDrawingStrokes([]);
      setSelectedStrokeId(null);
      showToast('info', 'Drawings Cleared', 'All canvas strokes removed');
    }
  };

  const handleDeleteStroke = (id: string) => {
    const next = strokes.filter((s) => s.id !== id);
    onUpdateDrawingStrokes(next);
    if (selectedStrokeId === id) setSelectedStrokeId(null);
  };

  const handleToggleStrokeVisibility = (id: string) => {
    const next = strokes.map((s) => (s.id === id ? { ...s, visible: s.visible === false ? true : false } : s));
    onUpdateDrawingStrokes(next);
  };

  const handleSelectColor = (color: string) => {
    onChangeBrushColor(color);
    onAddRecentColor(color);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/95 text-slate-200 divide-y divide-slate-800/80 select-none">
      {/* Top Header & Sub-Tabs */}
      <div className="p-4 bg-slate-950/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/25">
              <Paintbrush className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Drawing & Illustration
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  STUDIO
                </span>
              </h2>
              <p className="text-xs text-slate-400">Brushes, pens, markers, shapes, custom textures & eyedropper</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUndoLastStroke}
              disabled={strokes.length === 0}
              title="Undo last stroke (Ctrl+Z)"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClearAllStrokes}
              disabled={strokes.length === 0}
              title="Clear all drawing strokes"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-40 disabled:pointer-events-none text-slate-400 transition-all text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('tools')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'tools'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Tools & Brushes
          </button>
          <button
            onClick={() => setActiveTab('color')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'color'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Color & Palettes
          </button>
          <button
            onClick={() => setActiveTab('strokes')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'strokes'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Strokes ({strokes.length})
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {/* ========================================================= */}
        {/* TAB 1: TOOLS & BRUSH PHYSICS */}
        {/* ========================================================= */}
        {activeTab === 'tools' && (
          <>
            {/* Primary Tool Selector Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Drawing Tools</span>
                <span className="text-[11px] text-indigo-400 font-medium capitalize">
                  {activeDrawingTool.replace('-', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {toolsList.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = activeDrawingTool === tool.id;

                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        onChangeActiveDrawingTool(tool.id);
                        if (tool.id === 'eyedropper') {
                          onToggleEyedropper(true);
                        } else {
                          onToggleEyedropper(false);
                        }
                      }}
                      className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/10'
                          : 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title={tool.description}
                    >
                      <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-semibold text-center leading-tight truncate w-full">
                        {tool.label.split(' ')[0]}
                      </span>
                      {tool.badge && (
                        <span className="absolute -top-1.5 -right-1 text-[8px] font-black px-1 py-0.2 rounded bg-indigo-500 text-white shadow-xs">
                          {tool.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* If Custom Brush Tool is Active */}
            {activeDrawingTool === 'custom-brush' && (
              <div className="p-3 bg-indigo-950/20 rounded-xl border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Custom Texture & Particle Brushes
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {CUSTOM_BRUSH_PRESETS.map((preset) => {
                    const isSelected = activeCustomBrush === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => onChangeActiveCustomBrush(preset.id)}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md'
                            : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{preset.name}</span>
                          <span className="text-[9px] px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                            {preset.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{preset.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* If Shapes Tool is Active */}
            {activeDrawingTool === 'shape' && (
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Shapes className="w-3.5 h-3.5 text-indigo-400" />
                  Geometric Freehand Shapes
                </span>

                <div className="grid grid-cols-6 gap-1.5">
                  {shapesList.map((shape) => {
                    const Icon = shape.icon;
                    const isSelected = activeShapeType === shape.id;
                    return (
                      <button
                        key={shape.id}
                        onClick={() => onChangeActiveShapeType(shape.id)}
                        title={shape.label}
                        className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-0.5" />
                        <span className="text-[9px] truncate w-full text-center">{shape.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Fill Mode */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shapeFilled}
                      onChange={(e) => onChangeShapeFilled(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-300 font-medium">Fill Shape Interior</span>
                  </label>

                  {shapeFilled && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Fill Color:</span>
                      <input
                        type="color"
                        value={shapeFillColor}
                        onChange={(e) => onChangeShapeFillColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Brush Physics & Geometry Sliders */}
            <div className="space-y-4 pt-1">
              {/* Brush Size */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Stroke Size</span>
                  <span className="font-mono text-indigo-400 font-bold">{brushSize}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="160"
                  value={brushSize}
                  onChange={(e) => onChangeBrushSize(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex items-center gap-1 pt-1 overflow-x-auto">
                  {quickSizes.map((qs) => (
                    <button
                      key={qs}
                      onClick={() => onChangeBrushSize(qs)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                        brushSize === qs
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {qs}px
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity & Flow */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Opacity</span>
                    <span className="font-mono text-slate-300 text-[11px]">{brushOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={brushOpacity}
                    onChange={(e) => onChangeBrushOpacity(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Flow / Buildup</span>
                    <span className="font-mono text-slate-300 text-[11px]">{brushFlow}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={brushFlow}
                    onChange={(e) => onChangeBrushFlow(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              {/* Hardness & Smoothing */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Edge Hardness</span>
                    <span className="font-mono text-slate-300 text-[11px]">{brushHardness}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={brushHardness}
                    onChange={(e) => onChangeBrushHardness(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Streamline Smoothing</span>
                    <span className="font-mono text-slate-300 text-[11px]">{brushSmoothing}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={brushSmoothing}
                    onChange={(e) => onChangeBrushSmoothing(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              {/* Pressure Sensitivity Toggle */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Feather className="w-3.5 h-3.5 text-indigo-400" />
                    Pressure Sensitivity Dynamics
                  </span>
                  <p className="text-[10px] text-slate-400">Stylus pressure + simulated velocity taper</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pressureSensitivity}
                    onChange={(e) => onChangePressureSensitivity(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Glow / Neon Effect Toggle */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Neon & Halo Glow FX
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={glowEnabled}
                      onChange={(e) => onChangeGlowEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {glowEnabled && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Glow Color:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">{glowColor}</span>
                        <input
                          type="color"
                          value={glowColor}
                          onChange={(e) => onChangeGlowColor(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Glow Radius</span>
                        <span className="font-mono text-indigo-400">{glowRadius}px</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="60"
                        value={glowRadius}
                        onChange={(e) => onChangeGlowRadius(Number(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Blend Mode */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Stroke Blend Mode</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {blendModes.map((bm) => (
                    <button
                      key={bm}
                      onClick={() => onChangeBlendMode(bm)}
                      className={`py-1.5 px-2 rounded-lg text-xs capitalize font-medium transition-all ${
                        blendMode === bm
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {bm}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* TAB 2: COLOR PICKER & PALETTES */}
        {/* ========================================================= */}
        {activeTab === 'color' && (
          <div className="space-y-5">
            {/* Active Color & Eyedropper Card */}
            <div className="p-3.5 bg-slate-950/50 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Active Drawing Color</span>
                <span className="text-xs font-mono font-bold text-indigo-400">{brushColor.toUpperCase()}</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Visual Swatch */}
                <div
                  className="w-14 h-14 rounded-2xl shadow-inner border-2 border-white/20 relative overflow-hidden flex items-center justify-center shrink-0 cursor-pointer"
                  style={{ backgroundColor: brushColor }}
                >
                  <input
                    type="color"
                    value={brushColor.startsWith('#') ? brushColor : '#ffffff'}
                    onChange={(e) => handleSelectColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Open native color picker"
                  />
                </div>

                <div className="flex-1 space-y-1.5">
                  {/* Hex Text Field */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={brushColor}
                      onChange={(e) => handleSelectColor(e.target.value)}
                      placeholder="#ffffff"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Eyedropper Button */}
                  <button
                    onClick={() => onToggleEyedropper(!isEyedropperActive)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isEyedropperActive
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Pipette className="w-3.5 h-3.5" />
                    {isEyedropperActive ? 'Click Canvas to Sample' : 'Sample from Photo (Eyedropper)'}
                  </button>
                </div>
              </div>
            </div>

            {/* Gradient Stroke Presets */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Gradient Stroke Presets</span>
              <div className="grid grid-cols-2 gap-2">
                {GRADIENT_STROKE_PRESETS.map((grad) => {
                  const gradientCss = `linear-gradient(90deg, ${grad.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ')})`;
                  return (
                    <button
                      key={grad.name}
                      onClick={() => {
                        handleSelectColor(grad.stops[0].color);
                        showToast('info', 'Gradient Selected', `Applied ${grad.name} color palette`);
                      }}
                      className="p-2 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all text-left space-y-1.5"
                    >
                      <div className="h-4 rounded-md w-full shadow-inner" style={{ background: gradientCss }} />
                      <span className="text-[11px] font-semibold text-slate-300 block truncate">{grad.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Color Swatches */}
            {recentColors.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Colors</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {recentColors.map((color, idx) => (
                    <button
                      key={`${color}-${idx}`}
                      onClick={() => handleSelectColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-7 h-7 rounded-lg border transition-all ${
                        brushColor.toLowerCase() === color.toLowerCase()
                          ? 'border-white scale-110 shadow-md ring-2 ring-indigo-500'
                          : 'border-slate-700/60 hover:scale-105'
                      }`}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Curated Theme Palettes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Curated Palettes</span>
                <select
                  value={activePaletteIndex}
                  onChange={(e) => setActivePaletteIndex(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-300 focus:outline-none"
                >
                  {DRAWING_PALETTES.map((p, idx) => (
                    <option key={p.name} value={idx}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-400 mb-2">
                  {DRAWING_PALETTES[activePaletteIndex].name} Swatches
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {DRAWING_PALETTES[activePaletteIndex].colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleSelectColor(c)}
                      style={{ backgroundColor: c }}
                      className={`h-8 rounded-lg border transition-all flex items-center justify-center ${
                        brushColor.toLowerCase() === c.toLowerCase()
                          ? 'border-white ring-2 ring-indigo-500 scale-105'
                          : 'border-slate-700/60 hover:scale-105'
                      }`}
                      title={c}
                    >
                      {brushColor.toLowerCase() === c.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: STROKE LAYERS & HISTORY */}
        {/* ========================================================= */}
        {activeTab === 'strokes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Created Strokes ({strokes.length})
              </span>
              {strokes.length > 0 && (
                <button
                  onClick={onBurnDrawingsToImage}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20 flex items-center gap-1"
                  title="Flatten vector strokes into photo raster"
                >
                  <Flame className="w-3 h-3" />
                  Flatten to Photo
                </button>
              )}
            </div>

            {strokes.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/30 rounded-2xl border border-dashed border-slate-800 space-y-2">
                <Paintbrush className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">No drawing strokes yet</p>
                <p className="text-[11px] text-slate-500">
                  Select a brush, pencil, marker or pen and draw on the canvas viewport.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {[...strokes].reverse().map((stroke, idx) => {
                  const actualIdx = strokes.length - 1 - idx;
                  const isSelected = selectedStrokeId === stroke.id;

                  return (
                    <div
                      key={stroke.id}
                      onClick={() => setSelectedStrokeId(stroke.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500/80 text-white'
                          : 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-4 h-4 rounded-full border border-white/20 shrink-0 shadow-xs"
                          style={{ backgroundColor: stroke.color }}
                        />
                        <div>
                          <div className="text-xs font-semibold capitalize flex items-center gap-1.5">
                            {stroke.tool}
                            {stroke.shapeType && ` (${stroke.shapeType})`}
                            <span className="text-[10px] text-slate-500 font-mono">#{actualIdx + 1}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {stroke.size}px • {stroke.opacity}% op • {stroke.points.length} pts
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStrokeVisibility(stroke.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white"
                          title={stroke.visible === false ? 'Show' : 'Hide'}
                        >
                          {stroke.visible === false ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStroke(stroke.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-red-400"
                          title="Delete stroke"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
