import React, { useState } from 'react';
import {
  Crop,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Compass,
  Maximize2,
  Sparkles,
  Layers,
  Palette,
  Square,
  Wand2,
  Lock,
  Unlock,
  Move,
  Sliders,
  Check,
  Building,
  Scan,
} from 'lucide-react';
import { BorderSettings, CropSettings } from '../../../types/editor';
import {
  ASPECT_RATIOS,
  calculateSmartCrop,
  calculateAutoStraighten,
  calculateAutoPerspective,
} from '../../../engine/cropEngine';
import { DEFAULT_BORDER, DEFAULT_CROP } from '../../../engine/defaultSettings';

interface CropPanelProps {
  crop: CropSettings;
  border?: BorderSettings;
  imageWidth?: number;
  imageHeight?: number;
  onChange: (crop: CropSettings) => void;
  onChangeBorder?: (border: BorderSettings) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const CropPanel: React.FC<CropPanelProps> = ({
  crop,
  border = DEFAULT_BORDER,
  imageWidth = 2400,
  imageHeight = 1600,
  onChange,
  onChangeBorder,
  showToast,
}) => {
  const [activeSubSection, setActiveSubSection] = useState<'crop' | 'transform' | 'expand' | 'resize' | 'frame'>('crop');
  const [customRatioW, setCustomRatioW] = useState<number>(4);
  const [customRatioH, setCustomRatioH] = useState<number>(3);
  const [isSmartCalculating, setIsSmartCalculating] = useState(false);

  // Select Aspect Ratio
  const selectAspectRatio = (ratio: number | 'free') => {
    let newW = crop.width;
    let newH = crop.height;

    if (ratio !== 'free') {
      const srcAspect = (imageWidth * (1 - crop.x)) / (imageHeight * (1 - crop.y));
      if (srcAspect >= ratio) {
        newH = Math.min(1 - crop.y, 0.9);
        newW = Math.min(1 - crop.x, (newH * ratio * imageHeight) / imageWidth);
      } else {
        newW = Math.min(1 - crop.x, 0.9);
        newH = Math.min(1 - crop.y, (newW * imageWidth) / (ratio * imageHeight));
      }
    }

    onChange({
      ...crop,
      aspectRatio: ratio,
      width: Math.max(0.1, Math.min(1 - crop.x, newW)),
      height: Math.max(0.1, Math.min(1 - crop.y, newH)),
    });
  };

  // Custom Numeric Aspect Ratio Apply
  const applyCustomRatio = () => {
    if (customRatioW > 0 && customRatioH > 0) {
      const numRatio = customRatioW / customRatioH;
      selectAspectRatio(numRatio);
      showToast?.('info', 'Aspect Ratio Set', `Custom ratio ${customRatioW}:${customRatioH} applied.`);
    }
  };

  // Smart AI Composition / Crop
  const handleSmartCrop = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    setIsSmartCalculating(true);
    try {
      const bestBox = calculateSmartCrop(canvas, crop.aspectRatio);
      onChange({
        ...crop,
        x: bestBox.x,
        y: bestBox.y,
        width: bestBox.width,
        height: bestBox.height,
      });
      showToast?.('success', 'Smart Framing Applied', 'Calculated optimal rule-of-thirds composition around primary subject.');
    } catch (err: any) {
      showToast?.('error', 'Smart Crop Failed', err.message);
    } finally {
      setIsSmartCalculating(false);
    }
  };

  // Auto Straighten
  const handleAutoStraighten = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    try {
      const angle = calculateAutoStraighten(canvas);
      onChange({
        ...crop,
        rotation: angle,
      });
      showToast?.('success', 'Horizon Leveled', `Automatically aligned horizon by ${angle > 0 ? `+${angle}` : angle}°.`);
    } catch (err: any) {
      showToast?.('error', 'Auto Straighten Failed', err.message);
    }
  };

  // Auto Perspective
  const handleAutoPerspective = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    try {
      const p = calculateAutoPerspective(canvas);
      onChange({
        ...crop,
        perspectiveX: p.perspectiveX,
        perspectiveY: p.perspectiveY,
      });
      showToast?.('success', 'Perspective Corrected', `Aligned vertical keystoning (Tilt Y: ${p.perspectiveY}).`);
    } catch (err: any) {
      showToast?.('error', 'Auto Perspective Failed', err.message);
    }
  };

  // 90 Deg Steps
  const rotateCw = () => {
    onChange({ ...crop, rotation: (crop.rotation + 90) % 360 });
  };
  const rotateCcw = () => {
    onChange({ ...crop, rotation: (crop.rotation - 90 + 360) % 360 });
  };
  const rotate180 = () => {
    onChange({ ...crop, rotation: (crop.rotation + 180) % 360 });
  };

  const toggleFlipX = () => onChange({ ...crop, flipX: !crop.flipX });
  const toggleFlipY = () => onChange({ ...crop, flipY: !crop.flipY });

  // Reset to default
  const resetAllCrop = () => {
    onChange(DEFAULT_CROP);
    if (onChangeBorder) onChangeBorder(DEFAULT_BORDER);
    showToast?.('info', 'Transforms Reset', 'Crop, orientation, and perspective cleared.');
  };

  return (
    <div className="p-4 space-y-4 select-none">
      {/* Header with Sub-tabs */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <Crop className="w-4 h-4 text-indigo-400" />
          Core Transform Studio
        </span>
        <button
          onClick={resetAllCrop}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 font-semibold transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Sub Navigation Section Buttons */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
        {[
          { id: 'crop', label: 'Crop', icon: Crop },
          { id: 'transform', label: 'Rotate/Tilt', icon: Compass },
          { id: 'expand', label: 'Expand', icon: Maximize2 },
          { id: 'resize', label: 'Resize', icon: Sliders },
          { id: 'frame', label: 'Frames', icon: Square },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubSection(tab.id as any)}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. CROP & ASPECT RATIOS SECTION */}
      {activeSubSection === 'crop' && (
        <div className="space-y-4">
          {/* Smart AI Crop Button */}
          <button
            onClick={handleSmartCrop}
            disabled={isSmartCalculating}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 hover:from-indigo-500 hover:to-amber-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Smart Crop (AI Composition)</span>
          </button>

          {/* Aspect Ratio Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span>Aspect Ratio Presets</span>
              <span className="text-indigo-400 font-mono text-[10px]">
                {typeof crop.aspectRatio === 'number'
                  ? `${crop.aspectRatio.toFixed(2)}:1`
                  : 'Freeform'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {ASPECT_RATIOS.map((ar) => {
                const isSelected = crop.aspectRatio === ar.ratio;
                return (
                  <button
                    key={ar.id}
                    onClick={() => selectAspectRatio(ar.ratio)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/50 text-white ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold truncate flex items-center justify-between">
                      <span>{ar.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-indigo-400 shrink-0" />}
                    </div>
                    <div className="text-[9px] text-slate-500 truncate mt-0.5">{ar.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Aspect Ratio Inputs */}
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
            <div className="text-[11px] font-bold text-slate-300">Custom Aspect Ratio</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="100"
                value={customRatioW}
                onChange={(e) => setCustomRatioW(Math.max(1, Number(e.target.value)))}
                className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white text-center font-mono outline-none focus:border-indigo-500"
                placeholder="W"
              />
              <span className="text-slate-500 font-bold">:</span>
              <input
                type="number"
                min="1"
                max="100"
                value={customRatioH}
                onChange={(e) => setCustomRatioH(Math.max(1, Number(e.target.value)))}
                className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white text-center font-mono outline-none focus:border-indigo-500"
                placeholder="H"
              />
              <button
                onClick={applyCustomRatio}
                className="flex-1 py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors"
              >
                Apply Ratio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ROTATE, STRAIGHTEN & PERSPECTIVE SECTION */}
      {activeSubSection === 'transform' && (
        <div className="space-y-4">
          {/* Quick 90° Rotates & Flips */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400">Orientation & Flips</div>
            <div className="grid grid-cols-5 gap-1.5">
              <button
                onClick={rotateCcw}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors"
                title="Rotate 90° CCW"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                <span>-90°</span>
              </button>

              <button
                onClick={rotateCw}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors"
                title="Rotate 90° CW"
              >
                <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>+90°</span>
              </button>

              <button
                onClick={rotate180}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors"
                title="Rotate 180°"
              >
                <Move className="w-3.5 h-3.5 text-indigo-400" />
                <span>180°</span>
              </button>

              <button
                onClick={toggleFlipX}
                className={`p-2 rounded-xl border text-[10px] font-semibold flex flex-col items-center gap-1 transition-all ${
                  crop.flipX
                    ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400'
                }`}
                title="Flip Horizontal"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span>Flip H</span>
              </button>

              <button
                onClick={toggleFlipY}
                className={`p-2 rounded-xl border text-[10px] font-semibold flex flex-col items-center gap-1 transition-all ${
                  crop.flipY
                    ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400'
                }`}
                title="Flip Vertical"
              >
                <FlipVertical className="w-3.5 h-3.5" />
                <span>Flip V</span>
              </button>
            </div>
          </div>

          {/* Horizon Straightener */}
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                Horizon Straightener
              </span>
              <button
                onClick={handleAutoStraighten}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-bold hover:bg-amber-900/60 transition-colors"
              >
                <Wand2 className="w-3 h-3" />
                <span>Auto Level</span>
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Angle</span>
                <span className="text-amber-300 font-bold">{crop.rotation}°</span>
              </div>
              <input
                type="range"
                min={-45}
                max={45}
                step={0.1}
                value={crop.rotation}
                onChange={(e) => onChange({ ...crop, rotation: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <button onClick={() => onChange({ ...crop, rotation: -45 })}> -45°</button>
                <button
                  onClick={() => onChange({ ...crop, rotation: 0 })}
                  className="hover:text-white font-bold text-slate-400"
                >
                  0° Level
                </button>
                <button onClick={() => onChange({ ...crop, rotation: 45 })}>+45°</button>
              </div>
            </div>
          </div>

          {/* 3D Perspective Keystoning */}
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-teal-400" />
                Perspective Correction (3D Tilt)
              </span>
              <button
                onClick={handleAutoPerspective}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-950/80 border border-teal-500/40 text-teal-300 text-[10px] font-bold hover:bg-teal-900/60 transition-colors"
              >
                <Wand2 className="w-3 h-3" />
                <span>Auto Fix</span>
              </button>
            </div>

            {/* Vertical Perspective */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Vertical Tilt (Keystoning)</span>
                <span className="font-mono text-teal-300 font-bold">{crop.perspectiveY || 0}</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={crop.perspectiveY || 0}
                onChange={(e) => onChange({ ...crop, perspectiveY: Number(e.target.value) })}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>

            {/* Horizontal Perspective */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Horizontal Tilt (Yaw)</span>
                <span className="font-mono text-teal-300 font-bold">{crop.perspectiveX || 0}</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={crop.perspectiveX || 0}
                onChange={(e) => onChange({ ...crop, perspectiveX: Number(e.target.value) })}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. CANVAS EXPANSION & BACKGROUND FILL */}
      {activeSubSection === 'expand' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Expand Canvas / Outcrop</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={crop.expandCanvas || false}
                onChange={(e) => onChange({ ...crop, expandCanvas: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {crop.expandCanvas && (
            <div className="space-y-4">
              {/* Expansion Mode: Uniform vs Individual */}
              <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Canvas Padding</span>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={crop.expandUniform ?? true}
                      onChange={(e) => onChange({ ...crop, expandUniform: e.target.checked })}
                      className="accent-indigo-500 rounded"
                    />
                    <span>Uniform Sides</span>
                  </label>
                </div>

                {crop.expandUniform ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>All Margins</span>
                      <span className="text-indigo-400 font-bold">{crop.expandTop || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={300}
                      value={crop.expandTop || 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        onChange({
                          ...crop,
                          expandTop: val,
                          expandBottom: val,
                          expandLeft: val,
                          expandRight: val,
                        });
                      }}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400">Top ({crop.expandTop || 0}px)</span>
                      <input
                        type="range"
                        min={0}
                        max={300}
                        value={crop.expandTop || 0}
                        onChange={(e) => onChange({ ...crop, expandTop: Number(e.target.value) })}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Bottom ({crop.expandBottom || 0}px)</span>
                      <input
                        type="range"
                        min={0}
                        max={300}
                        value={crop.expandBottom || 0}
                        onChange={(e) => onChange({ ...crop, expandBottom: Number(e.target.value) })}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Left ({crop.expandLeft || 0}px)</span>
                      <input
                        type="range"
                        min={0}
                        max={300}
                        value={crop.expandLeft || 0}
                        onChange={(e) => onChange({ ...crop, expandLeft: Number(e.target.value) })}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Right ({crop.expandRight || 0}px)</span>
                      <input
                        type="range"
                        min={0}
                        max={300}
                        value={crop.expandRight || 0}
                        onChange={(e) => onChange({ ...crop, expandRight: Number(e.target.value) })}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Background Fill Type */}
              <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-300">Background Fill Style</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'color', label: 'Solid Color' },
                    { id: 'gradient', label: 'Gradient' },
                    { id: 'blur', label: 'Photo Blur' },
                  ].map((fill) => (
                    <button
                      key={fill.id}
                      onClick={() => onChange({ ...crop, bgFillType: fill.id as any })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                        (crop.bgFillType || 'color') === fill.id
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {fill.label}
                    </button>
                  ))}
                </div>

                {/* Solid Color Options */}
                {crop.bgFillType === 'color' && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={crop.bgColor || '#000000'}
                        onChange={(e) => onChange({ ...crop, bgColor: e.target.value })}
                        className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={crop.bgColor || '#000000'}
                        onChange={(e) => onChange({ ...crop, bgColor: e.target.value })}
                        className="bg-slate-950 border border-slate-800 text-xs font-mono text-white px-2 py-1 rounded-lg w-24 outline-none"
                      />
                    </div>

                    {/* Quick Swatches */}
                    <div className="flex items-center gap-1.5">
                      {['#ffffff', '#000000', '#0f172a', '#1e293b', '#f5efe6', '#ff007a'].map((c) => (
                        <button
                          key={c}
                          onClick={() => onChange({ ...crop, bgColor: c })}
                          className="w-6 h-6 rounded-md border border-slate-700 shadow-sm transition-transform hover:scale-110"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Gradient Options */}
                {crop.bgFillType === 'gradient' && (
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span>Start & End Color</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={crop.bgGradient?.color1 || '#0f172a'}
                          onChange={(e) =>
                            onChange({
                              ...crop,
                              bgGradient: {
                                ...(crop.bgGradient || { type: 'linear', angle: 135, color1: '#0f172a', color2: '#020617' }),
                                color1: e.target.value,
                              },
                            })
                          }
                          className="w-7 h-7 rounded border border-slate-700 cursor-pointer"
                        />
                        <input
                          type="color"
                          value={crop.bgGradient?.color2 || '#020617'}
                          onChange={(e) =>
                            onChange({
                              ...crop,
                              bgGradient: {
                                ...(crop.bgGradient || { type: 'linear', angle: 135, color1: '#0f172a', color2: '#020617' }),
                                color2: e.target.value,
                              },
                            })
                          }
                          className="w-7 h-7 rounded border border-slate-700 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Ambient Blur Slider */}
                {crop.bgFillType === 'blur' && (
                  <div className="space-y-1 pt-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Backdrop Blur Intensity</span>
                      <span className="font-mono text-indigo-300 font-bold">{crop.blurAmount || 24}px</span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={60}
                      value={crop.blurAmount || 24}
                      onChange={(e) => onChange({ ...crop, blurAmount: Number(e.target.value) })}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. RESIZE & PIXEL DIMENSIONS */}
      {activeSubSection === 'resize' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Custom Dimensions</span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={crop.customResizeEnabled || false}
                  onChange={(e) =>
                    onChange({
                      ...crop,
                      customResizeEnabled: e.target.checked,
                      targetWidth: crop.targetWidth || imageWidth,
                      targetHeight: crop.targetHeight || imageHeight,
                    })
                  }
                  className="accent-indigo-500 rounded"
                />
                <span>Enable Resize</span>
              </label>
            </div>

            {crop.customResizeEnabled && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">Width (px)</label>
                    <input
                      type="number"
                      min="100"
                      max="12000"
                      value={crop.targetWidth || imageWidth}
                      onChange={(e) => {
                        const newW = Number(e.target.value);
                        let newH = crop.targetHeight || imageHeight;
                        if (crop.lockAspectRatio && imageWidth > 0) {
                          newH = Math.round((newW / imageWidth) * imageHeight);
                        }
                        onChange({ ...crop, targetWidth: newW, targetHeight: newH });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    onClick={() => onChange({ ...crop, lockAspectRatio: !crop.lockAspectRatio })}
                    className={`p-2 rounded-lg border mt-4 transition-colors ${
                      crop.lockAspectRatio
                        ? 'bg-indigo-950 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                    title={crop.lockAspectRatio ? 'Aspect Ratio Locked' : 'Aspect Ratio Unlocked'}
                  >
                    {crop.lockAspectRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">Height (px)</label>
                    <input
                      type="number"
                      min="100"
                      max="12000"
                      value={crop.targetHeight || imageHeight}
                      onChange={(e) => {
                        const newH = Number(e.target.value);
                        let newW = crop.targetWidth || imageWidth;
                        if (crop.lockAspectRatio && imageHeight > 0) {
                          newW = Math.round((newH / imageHeight) * imageWidth);
                        }
                        onChange({ ...crop, targetHeight: newH, targetWidth: newW });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Quick Resolution Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400">Popular Output Sizes</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: '4K UHD (3840×2160)', w: 3840, h: 2160 },
                      { label: 'Full HD (1920×1080)', w: 1920, h: 1080 },
                      { label: 'Instagram (1080×1350)', w: 1080, h: 1350 },
                      { label: 'Avatar (800×800)', w: 800, h: 800 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() =>
                          onChange({
                            ...crop,
                            targetWidth: preset.w,
                            targetHeight: preset.h,
                          })
                        }
                        className="py-1 px-2 text-[10px] font-semibold bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-left truncate"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. BORDERS, FRAMES & ROUNDED CORNERS */}
      {activeSubSection === 'frame' && onChangeBorder && (
        <div className="space-y-4">
          {/* Rounded Corners */}
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-200">
              <span>Rounded Corners</span>
              <span className="font-mono text-indigo-300 font-bold">{border.radius || 0}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={border.radius || 0}
              onChange={(e) => onChangeBorder({ ...border, radius: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <button onClick={() => onChangeBorder({ ...border, radius: 0 })}>Square (0)</button>
              <button onClick={() => onChangeBorder({ ...border, radius: 32 })}>Soft (32px)</button>
              <button onClick={() => onChangeBorder({ ...border, radius: 100 })}>Pill (100px)</button>
            </div>
          </div>

          {/* Frame Style Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Frame Style</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={border.enabled}
                  onChange={(e) => onChangeBorder({ ...border, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {border.enabled && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'solid', label: 'Solid Border' },
                    { id: 'gallery', label: 'Art Gallery' },
                    { id: 'polaroid', label: 'Polaroid Chin' },
                    { id: 'film', label: '35mm Sprocket' },
                    { id: 'minimal', label: 'Double Line' },
                    { id: 'vintage-frame', label: 'Vintage Gold' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => onChangeBorder({ ...border, type: style.id as any })}
                      className={`p-2 rounded-xl text-center text-xs font-bold border transition-all ${
                        border.type === style.id
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>

                {/* Border Size Slider */}
                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Frame Thickness</span>
                    <span className="font-mono text-indigo-400 font-bold">{border.size}px</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={80}
                    value={border.size}
                    onChange={(e) => onChangeBorder({ ...border, size: Number(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Frame Color Picker */}
                <div className="flex items-center justify-between p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-xs font-bold text-slate-300">Border Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={border.color || '#ffffff'}
                      onChange={(e) => onChangeBorder({ ...border, color: e.target.value })}
                      className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-400">{border.color || '#ffffff'}</span>
                  </div>
                </div>

                {/* Polaroid Caption Input */}
                {border.type === 'polaroid' && (
                  <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Handwritten Polaroid Caption</label>
                    <input
                      type="text"
                      placeholder="e.g. Summer Memories 2026"
                      value={border.captionText || ''}
                      onChange={(e) => onChangeBorder({ ...border, captionText: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-3 py-1.5 rounded-lg outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
