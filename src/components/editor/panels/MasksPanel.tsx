import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Circle,
  Minus,
  Paintbrush,
  Eraser,
  Pipette,
  Sun,
  User,
  CloudSun,
  Image as ImageIcon,
  Smile,
  Sparkles,
  Scissors,
  Shirt,
  Crosshair,
  Sliders,
  RotateCcw,
  Copy,
  ChevronDown,
  ChevronRight,
  Flame,
  Check,
} from 'lucide-react';
import { SelectiveMask, SelectiveMaskType, MaskAdjustments } from '../../../types/editor';

interface MasksPanelProps {
  masks: SelectiveMask[];
  onChange: (masks: SelectiveMask[]) => void;
  activeMaskId?: string | null;
  onSelectMask?: (id: string | null) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

const DEFAULT_MASK_ADJUSTMENTS: MaskAdjustments = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  tint: 0,
  saturation: 0,
  vibrance: 0,
  sharpness: 0,
  blur: 0,
  clarity: 0,
  texture: 0,
  dehaze: 0,
  hueShift: 0,
  colorTint: '',
  colorTintOpacity: 40,
  noiseReduction: 0,
};

export const MasksPanel: React.FC<MasksPanelProps> = ({
  masks,
  onChange,
  activeMaskId,
  onSelectMask,
  showToast,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [activeSection, setActiveSection] = useState<'light' | 'color' | 'detail' | 'refine'>('light');

  const selectedMask = masks.find((m) => m.id === activeMaskId) || masks[0] || null;
  const currentMaskId = selectedMask?.id || null;

  const handleSelectMask = (id: string) => {
    if (onSelectMask) {
      onSelectMask(id);
    }
  };

  const createMask = (type: SelectiveMaskType, name: string, initialAdjustments?: Partial<MaskAdjustments>) => {
    const id = `mask_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newMask: SelectiveMask = {
      id,
      name,
      type,
      visible: true,
      inverted: false,
      feather: 50,
      opacity: 100,
      showOverlay: true,
      overlayColor: 'ruby',
      // Coordinates / defaults based on type
      centerX: 0.5,
      centerY: 0.5,
      radiusX: 0.35,
      radiusY: 0.35,
      startX: 0.5,
      startY: 0.75,
      endX: 0.5,
      endY: 1.0,
      targetColor: '#3b82f6',
      colorFuzziness: 35,
      lumMin: 140,
      lumMax: 255,
      lumFeather: 25,
      aiSensitivity: 50,
      brushStrokes: [],
      adjustments: {
        ...DEFAULT_MASK_ADJUSTMENTS,
        ...initialAdjustments,
      },
    };

    const nextMasks = [newMask, ...masks];
    onChange(nextMasks);
    if (onSelectMask) {
      onSelectMask(id);
    }
    setShowAddMenu(false);

    if (showToast) {
      showToast('success', `Created ${name}`, 'Adjust sliders or click canvas to refine mask.');
    }
  };

  const toggleMaskVisibility = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(
      masks.map((m) => (m.id === id ? { ...m, visible: !m.visible } : m))
    );
  };

  const toggleMaskOverlay = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(
      masks.map((m) => (m.id === id ? { ...m, showOverlay: !m.showOverlay } : m))
    );
  };

  const toggleMaskInvert = (id: string) => {
    onChange(
      masks.map((m) => (m.id === id ? { ...m, inverted: !m.inverted } : m))
    );
  };

  const deleteMask = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const remaining = masks.filter((m) => m.id !== id);
    onChange(remaining);
    if (activeMaskId === id && onSelectMask) {
      onSelectMask(remaining[0]?.id || null);
    }
  };

  const duplicateMask = (mask: SelectiveMask, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const dup: SelectiveMask = {
      ...mask,
      id: `mask_${Date.now()}`,
      name: `${mask.name} (Copy)`,
    };
    onChange([dup, ...masks]);
    if (onSelectMask) {
      onSelectMask(dup.id);
    }
  };

  const updateSelectedMask = (updates: Partial<SelectiveMask>) => {
    if (!currentMaskId) return;
    onChange(
      masks.map((m) => (m.id === currentMaskId ? { ...m, ...updates } : m))
    );
  };

  const updateAdjustment = (key: keyof MaskAdjustments, value: any) => {
    if (!selectedMask) return;
    const nextAdj = {
      ...selectedMask.adjustments,
      [key]: value,
    };
    updateSelectedMask({ adjustments: nextAdj });
  };

  const resetMaskAdjustments = () => {
    if (!selectedMask) return;
    updateSelectedMask({ adjustments: { ...DEFAULT_MASK_ADJUSTMENTS } });
    if (showToast) {
      showToast('info', 'Adjustments Reset', 'Reverted mask sliders to default zero values.');
    }
  };

  return (
    <div className="p-4 space-y-4 select-none text-slate-200">
      {/* Header & Add Mask Button */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                Selective Editing
                <span className="text-[9px] px-1 py-0.5 rounded bg-indigo-600/30 text-indigo-400 font-bold border border-indigo-500/30">
                  PRO
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Targeted adjustments per layer</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              showAddMenu
                ? 'bg-indigo-600 text-white shadow-indigo-500/25 ring-2 ring-indigo-400'
                : 'bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Mask</span>
          </button>
        </div>

        {/* Add Mask Selection Menu Popup */}
        {showAddMenu && (
          <div className="p-3 bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* 1. Freehand & Shapes */}
            <div>
              <div className="text-[10px] font-black uppercase text-indigo-300 tracking-wider mb-1.5">
                Manual Tools
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => createMask('brush', `Brush Mask ${masks.length + 1}`, { exposure: 20 })}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/40 text-left transition-all text-xs font-medium"
                >
                  <Paintbrush className="w-4 h-4 text-pink-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Brush</div>
                    <div className="text-[10px] text-slate-400">Paint custom strokes</div>
                  </div>
                </button>

                <button
                  onClick={() => createMask('eraser', `Eraser Mask ${masks.length + 1}`)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/40 text-left transition-all text-xs font-medium"
                >
                  <Eraser className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Eraser</div>
                    <div className="text-[10px] text-slate-400">Erase / subtract</div>
                  </div>
                </button>

                <button
                  onClick={() => createMask('linear', `Linear Gradient ${masks.length + 1}`, { exposure: -30 })}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/40 text-left transition-all text-xs font-medium"
                >
                  <Minus className="w-4 h-4 text-cyan-400 shrink-0 rotate-45" />
                  <div>
                    <div className="font-bold text-slate-200">Linear Grad</div>
                    <div className="text-[10px] text-slate-400">Directional falloff</div>
                  </div>
                </button>

                <button
                  onClick={() => createMask('radial', `Radial Gradient ${masks.length + 1}`, { exposure: 25 })}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/40 text-left transition-all text-xs font-medium"
                >
                  <Circle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Radial Grad</div>
                    <div className="text-[10px] text-slate-400">Spotlight / Vignette</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Color & Luminance Ranges */}
            <div>
              <div className="text-[10px] font-black uppercase text-indigo-300 tracking-wider mb-1.5">
                Color & Luminance Ranges
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => createMask('color-range', `Color Range ${masks.length + 1}`, { saturation: 35 })}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/40 text-left transition-all text-xs font-medium"
                >
                  <Pipette className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Color Range</div>
                    <div className="text-[10px] text-slate-400">Sample exact hue</div>
                  </div>
                </button>

                <button
                  onClick={() => createMask('luminance-range', `Luminance Range ${masks.length + 1}`, { highlights: -25 })}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/40 text-left transition-all text-xs font-medium"
                >
                  <Sun className="w-4 h-4 text-amber-300 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Luminance</div>
                    <div className="text-[10px] text-slate-400">Tone isolation</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 3. AI Semantic Selections */}
            <div>
              <div className="text-[10px] font-black uppercase text-emerald-400 tracking-wider mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI Smart Selections
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => createMask('ai-subject', `Subject Selection ${masks.length + 1}`, { exposure: 15, clarity: 15, sharpness: 25 })}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 text-left transition-all text-xs font-medium"
                >
                  <User className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Subject</div>
                    <div className="text-[10px] text-slate-400">Auto hero subject</div>
                  </div>
                </button>

                <button
                  onClick={() => createMask('ai-sky', `Sky Selection ${masks.length + 1}`, { exposure: -20, saturation: 20, dehaze: 25 })}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-left transition-all text-xs font-medium"
                >
                  <CloudSun className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Sky</div>
                    <div className="text-[10px] text-slate-400">Sky & clouds</div>
                  </div>
                </button>

                <button
                  onClick={() => createMask('ai-background', `Background Selection ${masks.length + 1}`, { exposure: -10, blur: 20 })}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-left transition-all text-xs font-medium"
                >
                  <ImageIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Background</div>
                    <div className="text-[10px] text-slate-400">Environment depth</div>
                  </div>
                </button>

                <button
                  onClick={() => createMask('ai-face', `Face Selection ${masks.length + 1}`, { exposure: 10, texture: -10, clarity: -5 })}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-left transition-all text-xs font-medium"
                >
                  <Smile className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Face</div>
                    <div className="text-[10px] text-slate-400">Facial retouch</div>
                  </div>
                </button>

                <button
                  onClick={() => createMask('ai-skin', `Skin Selection ${masks.length + 1}`, { texture: -15, clarity: -10, warmth: 5 } as any)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 hover:bg-orange-950/40 border border-slate-800 hover:border-orange-500/40 text-left transition-all text-xs font-medium"
                >
                  <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Skin Tone</div>
                    <div className="text-[10px] text-slate-400">Body & skin soften</div>
                  </div>
                </button>

                <button
                  onClick={() => createMask('ai-hair', `Hair Selection ${masks.length + 1}`, { clarity: 20, sharpness: 30, contrast: 10 })}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 text-left transition-all text-xs font-medium"
                >
                  <Scissors className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Hair</div>
                    <div className="text-[10px] text-slate-400">Hair texture & gloss</div>
                  </div>
                </button>

                <button
                  onClick={() => createMask('ai-clothes', `Clothes Selection ${masks.length + 1}`, { saturation: 20, contrast: 15 })}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 hover:bg-teal-950/40 border border-slate-800 hover:border-teal-500/40 text-left transition-all text-xs font-medium"
                >
                  <Shirt className="w-4 h-4 text-teal-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Clothes</div>
                    <div className="text-[10px] text-slate-400">Apparel & garments</div>
                  </div>
                </button>

                <button
                  onClick={() => createMask('ai-object', `Object Selection ${masks.length + 1}`, { saturation: 20, clarity: 15 })}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 hover:bg-violet-950/40 border border-slate-800 hover:border-violet-500/40 text-left transition-all text-xs font-medium"
                >
                  <Crosshair className="w-4 h-4 text-violet-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Object Select</div>
                    <div className="text-[10px] text-slate-400">Click any element</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mask Layers Stack */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
          <span>Active Mask Layers ({masks.length})</span>
          {masks.length > 0 && (
            <span className="text-[10px] text-slate-500">Click to configure</span>
          )}
        </div>

        {masks.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl space-y-2">
            <Layers className="w-6 h-6 text-slate-600 mx-auto" />
            <div className="text-xs font-bold text-slate-400">No selective masks yet</div>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Click "+ New Mask" above to isolate areas like Subject, Sky, Skin, Gradients or Brushes with dedicated photographic adjustments.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-slate-800">
            {masks.map((mask) => {
              const isSelected = mask.id === currentMaskId;
              return (
                <div
                  key={mask.id}
                  onClick={() => handleSelectMask(mask.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={(e) => toggleMaskVisibility(mask.id, e)}
                      title={mask.visible ? 'Hide mask' : 'Show mask'}
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      {mask.visible ? (
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </button>

                    <div className="flex items-center gap-2 truncate">
                      {getMaskIcon(mask.type)}
                      <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {mask.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Ruby Overlay Toggle */}
                    <button
                      onClick={(e) => toggleMaskOverlay(mask.id, e)}
                      title={mask.showOverlay ? 'Hide red overlay on canvas' : 'Show red overlay on canvas'}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                        mask.showOverlay
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-800 text-slate-500 border-transparent hover:text-slate-300'
                      }`}
                    >
                      Overlay
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={(e) => duplicateMask(mask, e)}
                      title="Duplicate mask"
                      className="p-1 hover:text-indigo-300 text-slate-500 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => deleteMask(mask.id, e)}
                      title="Delete mask"
                      className="p-1 hover:text-rose-400 text-slate-500 transition-colors"
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

      {/* Selected Mask Configuration & Adjustments */}
      {selectedMask && (
        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
          {/* Mask Title & Quick Controls */}
          <div className="space-y-2.5 pb-2 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getMaskIcon(selectedMask.type)}
                <input
                  type="text"
                  value={selectedMask.name}
                  onChange={(e) => updateSelectedMask({ name: e.target.value })}
                  className="bg-transparent font-bold text-xs text-white border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-1 py-0.5 transition-colors"
                />
              </div>

              <button
                onClick={resetMaskAdjustments}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Sliders</span>
              </button>
            </div>

            {/* Invert, Opacity & Feather Quick Controls */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => toggleMaskInvert(selectedMask.id)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                  selectedMask.inverted
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>Invert Mask {selectedMask.inverted && '(Active)'}</span>
              </button>

              <button
                onClick={() => toggleMaskOverlay(selectedMask.id)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                  selectedMask.showOverlay
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Flame className="w-3 h-3 text-rose-400" />
                <span>Show Ruby Overlay</span>
              </button>
            </div>

            {/* Type-Specific Refinement Bars */}
            {selectedMask.type === 'color-range' && (
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Pipette className="w-3.5 h-3.5 text-purple-400" />
                    Target Color Sample
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedMask.targetColor || '#3b82f6'}
                      onChange={(e) => updateSelectedMask({ targetColor: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="font-mono text-[11px] text-purple-300">
                      {selectedMask.targetColor || '#3b82f6'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Color Tolerance / Fuzziness</span>
                    <span className="font-mono text-purple-300">{selectedMask.colorFuzziness ?? 35}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    value={selectedMask.colorFuzziness ?? 35}
                    onChange={(e) => updateSelectedMask({ colorFuzziness: Number(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {selectedMask.type === 'luminance-range' && (
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-300" />
                    Luminance Range
                  </span>
                  <span className="text-[11px] font-mono text-amber-300">
                    {selectedMask.lumMin ?? 140} - {selectedMask.lumMax ?? 255}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Min Luminance (Shadow Cutoff)</span>
                    <span className="font-mono text-amber-300">{selectedMask.lumMin ?? 140}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={255}
                    value={selectedMask.lumMin ?? 140}
                    onChange={(e) => updateSelectedMask({ lumMin: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Max Luminance (Highlight Cutoff)</span>
                    <span className="font-mono text-amber-300">{selectedMask.lumMax ?? 255}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={255}
                    value={selectedMask.lumMax ?? 255}
                    onChange={(e) => updateSelectedMask({ lumMax: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {selectedMask.type === 'ai-object' && (
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-violet-300">
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Click-to-Select Object</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Click any object directly on the main canvas photo to isolate and snap to its boundary contours.
                </p>
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>AI Object Sensitivity</span>
                    <span className="font-mono text-violet-300">{selectedMask.aiSensitivity ?? 50}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={selectedMask.aiSensitivity ?? 50}
                    onChange={(e) => updateSelectedMask({ aiSensitivity: Number(e.target.value) })}
                    className="w-full accent-violet-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Adjustment Category Tabs */}
          <div className="flex border-b border-slate-800 gap-1 pb-1">
            {[
              { id: 'light', label: 'Light' },
              { id: 'color', label: 'Color' },
              { id: 'detail', label: 'Detail & Effects' },
              { id: 'refine', label: 'Feather & Opacity' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
                  activeSection === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 1. Light & Tone Controls */}
          {activeSection === 'light' && (
            <div className="space-y-3">
              {renderSlider(
                'Exposure',
                selectedMask.adjustments.exposure,
                -100,
                100,
                (v) => updateAdjustment('exposure', v),
                'accent-indigo-500'
              )}

              {renderSlider(
                'Contrast',
                selectedMask.adjustments.contrast,
                -100,
                100,
                (v) => updateAdjustment('contrast', v),
                'accent-indigo-500'
              )}

              {renderSlider(
                'Highlights',
                selectedMask.adjustments.highlights,
                -100,
                100,
                (v) => updateAdjustment('highlights', v),
                'accent-cyan-500'
              )}

              {renderSlider(
                'Shadows',
                selectedMask.adjustments.shadows,
                -100,
                100,
                (v) => updateAdjustment('shadows', v),
                'accent-cyan-500'
              )}

              {renderSlider(
                'Whites',
                selectedMask.adjustments.whites ?? 0,
                -100,
                100,
                (v) => updateAdjustment('whites', v),
                'accent-slate-300'
              )}

              {renderSlider(
                'Blacks',
                selectedMask.adjustments.blacks ?? 0,
                -100,
                100,
                (v) => updateAdjustment('blacks', v),
                'accent-slate-400'
              )}
            </div>
          )}

          {/* 2. Color & Tint Controls */}
          {activeSection === 'color' && (
            <div className="space-y-3">
              {renderSlider(
                'Temperature (Warmth)',
                selectedMask.adjustments.temperature,
                -100,
                100,
                (v) => updateAdjustment('temperature', v),
                'accent-amber-500'
              )}

              {renderSlider(
                'Tint (Green / Magenta)',
                selectedMask.adjustments.tint ?? 0,
                -100,
                100,
                (v) => updateAdjustment('tint', v),
                'accent-pink-500'
              )}

              {renderSlider(
                'Saturation',
                selectedMask.adjustments.saturation,
                -100,
                100,
                (v) => updateAdjustment('saturation', v),
                'accent-emerald-500'
              )}

              {renderSlider(
                'Vibrance',
                selectedMask.adjustments.vibrance ?? 0,
                -100,
                100,
                (v) => updateAdjustment('vibrance', v),
                'accent-teal-500'
              )}

              {renderSlider(
                'Hue Shift',
                selectedMask.adjustments.hueShift ?? 0,
                -180,
                180,
                (v) => updateAdjustment('hueShift', v),
                'accent-purple-500',
                '°'
              )}

              {/* Color Tint Overlay */}
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Color Tint Overlay</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedMask.adjustments.colorTint || '#ff5500'}
                      onChange={(e) => updateAdjustment('colorTint', e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                    />
                    {selectedMask.adjustments.colorTint && (
                      <button
                        onClick={() => updateAdjustment('colorTint', '')}
                        className="text-[10px] text-rose-400 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {selectedMask.adjustments.colorTint && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Tint Strength</span>
                      <span className="font-mono text-indigo-300">
                        {selectedMask.adjustments.colorTintOpacity ?? 40}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={selectedMask.adjustments.colorTintOpacity ?? 40}
                      onChange={(e) => updateAdjustment('colorTintOpacity', Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Detail & Effects Controls */}
          {activeSection === 'detail' && (
            <div className="space-y-3">
              {renderSlider(
                'Sharpness',
                selectedMask.adjustments.sharpness,
                0,
                100,
                (v) => updateAdjustment('sharpness', v),
                'accent-cyan-500'
              )}

              {renderSlider(
                'Blur (Defocus)',
                selectedMask.adjustments.blur ?? 0,
                0,
                100,
                (v) => updateAdjustment('blur', v),
                'accent-indigo-500'
              )}

              {renderSlider(
                'Clarity (Midtone Punch)',
                selectedMask.adjustments.clarity,
                -100,
                100,
                (v) => updateAdjustment('clarity', v),
                'accent-teal-500'
              )}

              {renderSlider(
                'Texture (Micro-Contrast)',
                selectedMask.adjustments.texture ?? 0,
                -100,
                100,
                (v) => updateAdjustment('texture', v),
                'accent-emerald-500'
              )}

              {renderSlider(
                'Dehaze (Atmospheric Clarity)',
                selectedMask.adjustments.dehaze ?? 0,
                -100,
                100,
                (v) => updateAdjustment('dehaze', v),
                'accent-amber-500'
              )}
            </div>
          )}

          {/* 4. Feather & Opacity Refine Controls */}
          {activeSection === 'refine' && (
            <div className="space-y-3">
              {renderSlider(
                'Overall Mask Opacity',
                selectedMask.opacity ?? 100,
                0,
                100,
                (v) => updateSelectedMask({ opacity: v }),
                'accent-indigo-500',
                '%'
              )}

              {renderSlider(
                'Feather (Edge Softness)',
                selectedMask.feather,
                0,
                100,
                (v) => updateSelectedMask({ feather: v }),
                'accent-pink-500',
                '%'
              )}

              {/* Overlay Color Selector */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400">Mask Overlay Tint Color</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { id: 'ruby', label: 'Ruby', bg: 'bg-rose-500' },
                    { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
                    { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-500' },
                    { id: 'amber', label: 'Amber', bg: 'bg-amber-500' },
                    { id: 'grayscale', label: 'White', bg: 'bg-slate-200' },
                  ].map((col) => (
                    <button
                      key={col.id}
                      onClick={() => updateSelectedMask({ overlayColor: col.id as any })}
                      className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border text-[10px] font-bold transition-all ${
                        selectedMask.overlayColor === col.id
                          ? 'border-indigo-400 bg-indigo-950/60 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full ${col.bg}`} />
                      <span>{col.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function renderSlider(
  label: string,
  value: number,
  min: number,
  max: number,
  onChange: (val: number) => void,
  accentClass: string,
  suffix = ''
) {
  const isPos = value > 0;
  const displayVal = isPos && min < 0 ? `+${value}${suffix}` : `${value}${suffix}`;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className={`font-mono font-bold ${value !== 0 ? 'text-indigo-300' : 'text-slate-500'}`}>
          {displayVal}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full ${accentClass} cursor-pointer`}
      />
    </div>
  );
}

function getMaskIcon(type: SelectiveMaskType) {
  switch (type) {
    case 'brush':
      return <Paintbrush className="w-3.5 h-3.5 text-pink-400 shrink-0" />;
    case 'eraser':
      return <Eraser className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    case 'linear':
      return <Minus className="w-3.5 h-3.5 text-cyan-400 shrink-0 rotate-45" />;
    case 'radial':
      return <Circle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case 'color-range':
      return <Pipette className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    case 'luminance-range':
      return <Sun className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
    case 'ai-subject':
      return <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    case 'ai-sky':
      return <CloudSun className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    case 'ai-background':
      return <ImageIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
    case 'ai-face':
      return <Smile className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    case 'ai-skin':
      return <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
    case 'ai-hair':
      return <Scissors className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case 'ai-clothes':
      return <Shirt className="w-3.5 h-3.5 text-teal-400 shrink-0" />;
    case 'ai-object':
      return <Crosshair className="w-3.5 h-3.5 text-violet-400 shrink-0" />;
    default:
      return <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  }
}
