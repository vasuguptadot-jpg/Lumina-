import React, { useState } from 'react';
import {
  Sun,
  Sparkles,
  Contrast,
  Sliders,
  RotateCcw,
  Zap,
  Wand2,
  SlidersHorizontal,
  Flame,
  Activity,
  Layers,
  Thermometer,
  CircleDot,
  Eye,
  ArrowDownUp,
  Droplets,
  Feather,
} from 'lucide-react';
import { AdjustmentSettings } from '../../../types/editor';
import { DEFAULT_ADJUSTMENTS } from '../../../engine/defaultSettings';
import {
  calculateAutoExposure,
  calculateAutoContrast,
  calculateAutoTone,
} from '../../../engine/autoToneEngine';

interface AdjustPanelProps {
  adjustments: AdjustmentSettings;
  onChange: (adjustments: AdjustmentSettings) => void;
  onResetAdjustments: () => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  colorClass?: string;
  tooltip?: string;
  onChange: (val: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  defaultValue = 0,
  unit = '',
  colorClass = 'accent-indigo-500',
  tooltip,
  onChange,
}) => {
  const isChanged = value !== defaultValue;

  return (
    <div className="space-y-1 group">
      <div className="flex items-center justify-between text-xs">
        <button
          onClick={() => onChange(defaultValue)}
          className={`font-medium transition-colors text-left flex items-center gap-1 ${
            isChanged ? 'text-slate-200 hover:text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
          title={tooltip || 'Click to reset to default'}
        >
          <span>{label}</span>
        </button>
        <span
          onClick={() => onChange(defaultValue)}
          className={`font-mono text-[11px] cursor-pointer ${
            isChanged ? 'text-indigo-400 font-bold' : 'text-slate-500'
          }`}
          title="Click to reset"
        >
          {value > 0 ? `+${value}` : value}
          {unit}
        </span>
      </div>

      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${colorClass}`}
        />
      </div>
    </div>
  );
};

export const AdjustPanel: React.FC<AdjustPanelProps> = ({
  adjustments,
  onChange,
  onResetAdjustments,
  showToast,
}) => {
  const [activeSection, setActiveSection] = useState<'basic' | 'advanced' | 'color' | 'effects'>('basic');

  const updateField = (field: keyof AdjustmentSettings, val: any) => {
    onChange({
      ...adjustments,
      [field]: val,
    });
  };

  const updateSplitToning = (field: string, val: number) => {
    onChange({
      ...adjustments,
      splitToning: {
        ...(adjustments.splitToning || { shadowHue: 210, shadowSat: 0, highlightHue: 40, highlightSat: 0, balance: 0 }),
        [field]: val,
      },
    });
  };

  // 1. Auto Exposure Tool
  const handleAutoExposure = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    try {
      const autoExp = calculateAutoExposure(canvas);
      updateField('exposure', autoExp);
      showToast?.('success', 'Auto Exposure Applied', `Calculated EV shift of ${autoExp > 0 ? `+${autoExp}` : autoExp}.`);
    } catch (err: any) {
      showToast?.('error', 'Auto Exposure Failed', err.message);
    }
  };

  // 2. Auto Contrast Tool
  const handleAutoContrast = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    try {
      const autoCont = calculateAutoContrast(canvas);
      updateField('contrast', autoCont);
      showToast?.('success', 'Auto Contrast Applied', `Dynamic range optimized to ${autoCont > 0 ? `+${autoCont}` : autoCont}.`);
    } catch (err: any) {
      showToast?.('error', 'Auto Contrast Failed', err.message);
    }
  };

  // 3. Auto Tone Tool (Full Exposure + Highlights + Shadows + Whites + Blacks + Brilliance)
  const handleAutoTone = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    try {
      const autoToneSettings = calculateAutoTone(canvas);
      onChange({
        ...adjustments,
        ...autoToneSettings,
      });
      showToast?.('success', 'Auto Tone Master Balanced', 'Intelligently equalized exposure, highlights recovery, shadow fill, and brilliance.');
    } catch (err: any) {
      showToast?.('error', 'Auto Tone Failed', err.message);
    }
  };

  return (
    <div className="p-4 space-y-5 select-none overflow-y-auto max-h-full pb-16">
      {/* Auto Optimization Toolbar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            AI Auto Optimization
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={handleAutoTone}
            className="py-2 px-2 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white rounded-xl text-[11px] font-bold shadow-md shadow-amber-500/10 flex flex-col items-center gap-1 transition-all active:scale-95"
            title="Intelligently optimize full tonal range"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-200" />
            <span>Auto Tone</span>
          </button>

          <button
            onClick={handleAutoExposure}
            className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all active:scale-95"
            title="Zone-system middle gray exposure correction"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto Exposure</span>
          </button>

          <button
            onClick={handleAutoContrast}
            className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all active:scale-95"
            title="Maximize histogram dynamic range spread"
          >
            <Contrast className="w-3.5 h-3.5 text-indigo-400" />
            <span>Auto Contrast</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
        {[
          { id: 'basic', label: 'Light', icon: Sun },
          { id: 'advanced', label: 'Tonal Pro', icon: SlidersHorizontal },
          { id: 'color', label: 'Color', icon: Thermometer },
          { id: 'effects', label: 'Texture', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
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

      {/* 1. BASIC LIGHT & EXPOSURE SECTION */}
      {activeSection === 'basic' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Light & Exposure Fundamentals
            </span>
          </div>

          <SliderControl
            label="Exposure"
            value={adjustments.exposure}
            min={-100}
            max={100}
            colorClass="accent-amber-400"
            tooltip="Overall scene EV exposure brightness"
            onChange={(v) => updateField('exposure', v)}
          />
          <SliderControl
            label="Brightness"
            value={adjustments.brightness}
            min={-100}
            max={100}
            tooltip="Direct baseline luminance offset"
            onChange={(v) => updateField('brightness', v)}
          />
          <SliderControl
            label="Contrast"
            value={adjustments.contrast}
            min={-100}
            max={100}
            colorClass="accent-indigo-400"
            tooltip="Tonal separation between light and dark"
            onChange={(v) => updateField('contrast', v)}
          />
          <SliderControl
            label="Highlights"
            value={adjustments.highlights}
            min={-100}
            max={100}
            colorClass="accent-sky-400"
            tooltip="Recover blown clouds/highlights or boost glow"
            onChange={(v) => updateField('highlights', v)}
          />
          <SliderControl
            label="Shadows"
            value={adjustments.shadows}
            min={-100}
            max={100}
            colorClass="accent-violet-400"
            tooltip="Lift dark shadow details without washing out blacks"
            onChange={(v) => updateField('shadows', v)}
          />
          <SliderControl
            label="Whites"
            value={adjustments.whites}
            min={-100}
            max={100}
            tooltip="Defines absolute specular highlights ceiling"
            onChange={(v) => updateField('whites', v)}
          />
          <SliderControl
            label="Blacks"
            value={adjustments.blacks}
            min={-100}
            max={100}
            tooltip="Defines deep shadow floor and rich contrast anchors"
            onChange={(v) => updateField('blacks', v)}
          />
        </div>
      )}

      {/* 2. ADVANCED TONAL PRO CONTROLS */}
      {activeSection === 'advanced' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
              Advanced Tonal Architecture
            </span>
          </div>

          <SliderControl
            label="Brilliance"
            value={adjustments.brilliance || 0}
            min={-100}
            max={100}
            colorClass="accent-teal-400"
            tooltip="Apple-style intelligent shadow brightening with specular highlight preservation"
            onChange={(v) => updateField('brilliance', v)}
          />

          <SliderControl
            label="HDR Tone Mapping"
            value={adjustments.hdr || 0}
            min={0}
            max={100}
            colorClass="accent-amber-400"
            tooltip="Compress high dynamic range, lifting shadow detail and taming hot spots"
            onChange={(v) => updateField('hdr', v)}
          />

          <SliderControl
            label="Midtones"
            value={adjustments.midtones || 0}
            min={-100}
            max={100}
            tooltip="Bell-curve brightness targeted at middle gray (128)"
            onChange={(v) => updateField('midtones', v)}
          />

          <SliderControl
            label="Gamma"
            value={adjustments.gamma || 0}
            min={-100}
            max={100}
            tooltip="Logarithmic power-law curve compression and expansion"
            onChange={(v) => updateField('gamma', v)}
          />

          <SliderControl
            label="Film Matte Fade"
            value={adjustments.fade || 0}
            min={0}
            max={100}
            colorClass="accent-stone-400"
            tooltip="Lifts pure blacks to a smooth vintage film matte tone"
            onChange={(v) => updateField('fade', v)}
          />

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <ArrowDownUp className="w-3.5 h-3.5 text-indigo-400" />
              Levels Black & White Points
            </div>
            <SliderControl
              label="Black Point Threshold"
              value={adjustments.blackPoint || 0}
              min={0}
              max={50}
              defaultValue={0}
              tooltip="Set input black clipping floor"
              onChange={(v) => updateField('blackPoint', v)}
            />
            <SliderControl
              label="White Point Threshold"
              value={adjustments.whitePoint ?? 100}
              min={50}
              max={100}
              defaultValue={100}
              tooltip="Set input white clipping ceiling"
              onChange={(v) => updateField('whitePoint', v)}
            />
          </div>
        </div>
      )}

      {/* 3. COLOR & WHITE BALANCE */}
      {activeSection === 'color' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-sky-400" />
              Color & White Balance
            </span>
          </div>

          <SliderControl
            label="Temperature (Warmth)"
            value={adjustments.temperature}
            min={-100}
            max={100}
            colorClass="accent-amber-500"
            tooltip="Cool blue (-100) to Warm amber (+100)"
            onChange={(v) => updateField('temperature', v)}
          />
          <SliderControl
            label="Tint (Green / Magenta)"
            value={adjustments.tint}
            min={-100}
            max={100}
            colorClass="accent-fuchsia-500"
            tooltip="Green tint (-100) to Magenta tint (+100)"
            onChange={(v) => updateField('tint', v)}
          />
          <SliderControl
            label="Vibrance (Skin-Safe)"
            value={adjustments.vibrance}
            min={-100}
            max={100}
            colorClass="accent-emerald-400"
            tooltip="Boosts muted tones while preserving already saturated colors and skin"
            onChange={(v) => updateField('vibrance', v)}
          />
          <SliderControl
            label="Saturation"
            value={adjustments.saturation}
            min={-100}
            max={100}
            colorClass="accent-rose-500"
            tooltip="Uniform color intensity across all channels"
            onChange={(v) => updateField('saturation', v)}
          />

          {/* Split Toning / Color Grading */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3 mt-2">
            <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              Split Toning (Shadows & Highlights)
            </div>

            <SliderControl
              label="Shadow Hue"
              value={adjustments.splitToning?.shadowHue ?? 210}
              min={0}
              max={360}
              defaultValue={210}
              unit="°"
              onChange={(v) => updateSplitToning('shadowHue', v)}
            />
            <SliderControl
              label="Shadow Saturation"
              value={adjustments.splitToning?.shadowSat ?? 0}
              min={0}
              max={100}
              defaultValue={0}
              onChange={(v) => updateSplitToning('shadowSat', v)}
            />

            <div className="pt-2 border-t border-slate-800">
              <SliderControl
                label="Highlight Hue"
                value={adjustments.splitToning?.highlightHue ?? 40}
                min={0}
                max={360}
                defaultValue={40}
                unit="°"
                onChange={(v) => updateSplitToning('highlightHue', v)}
              />
              <SliderControl
                label="Highlight Saturation"
                value={adjustments.splitToning?.highlightSat ?? 0}
                min={0}
                max={100}
                defaultValue={0}
                onChange={(v) => updateSplitToning('highlightSat', v)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. DETAIL, TEXTURE, DEHAZE & GRAIN */}
      {activeSection === 'effects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Texture, Detail & Dehaze
            </span>
          </div>

          <SliderControl
            label="Texture"
            value={adjustments.texture || 0}
            min={-100}
            max={100}
            colorClass="accent-indigo-400"
            tooltip="Enhances fine surface details (hair, foliage, fabric) without haloing"
            onChange={(v) => updateField('texture', v)}
          />

          <SliderControl
            label="Structure"
            value={adjustments.structure || 0}
            min={-100}
            max={100}
            colorClass="accent-indigo-400"
            tooltip="Mid-frequency contour depth for architectural and geometric separation"
            onChange={(v) => updateField('structure', v)}
          />

          <SliderControl
            label="Clarity (Midtone Contrast)"
            value={adjustments.clarity}
            min={-100}
            max={100}
            colorClass="accent-purple-400"
            tooltip="Local contrast enhancement in midtone frequencies"
            onChange={(v) => updateField('clarity', v)}
          />

          <SliderControl
            label="Microcontrast"
            value={adjustments.microcontrast || 0}
            min={-100}
            max={100}
            colorClass="accent-purple-400"
            tooltip="Surface tonal micro-gradients for tactile presence and dimensionality"
            onChange={(v) => updateField('microcontrast', v)}
          />

          <SliderControl
            label="Dehaze"
            value={adjustments.dehaze || 0}
            min={-100}
            max={100}
            colorClass="accent-sky-400"
            tooltip="Eliminates atmospheric fog and restores distant contrast"
            onChange={(v) => updateField('dehaze', v)}
          />

          <SliderControl
            label="Sharpness"
            value={adjustments.sharpness}
            min={0}
            max={150}
            colorClass="accent-teal-400"
            tooltip="Edge definition enhancement via unsharp masking"
            onChange={(v) => updateField('sharpness', v)}
          />

          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <CircleDot className="w-3.5 h-3.5 text-purple-400" />
              Vignette & Organic Grain
            </div>

            <SliderControl
              label="Vignette Amount"
              value={adjustments.vignette}
              min={-100}
              max={100}
              tooltip="Darkens edges (-100) or creates high-key white vignette (+100)"
              onChange={(v) => updateField('vignette', v)}
            />

            <SliderControl
              label="Film Grain"
              value={adjustments.filmGrain}
              min={0}
              max={100}
              tooltip="Adds authentic analog silver halide film grain"
              onChange={(v) => updateField('filmGrain', v)}
            />

            {adjustments.filmGrain > 0 && (
              <SliderControl
                label="Grain Particle Size"
                value={adjustments.filmGrainSize || 2}
                min={1}
                max={4}
                defaultValue={2}
                onChange={(v) => updateField('filmGrainSize', v)}
              />
            )}
          </div>
        </div>
      )}

      {/* Global Reset Button */}
      <button
        onClick={onResetAdjustments}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-rose-300 text-xs font-bold transition-colors border border-slate-800 shadow-sm"
      >
        <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
        <span>Reset All Light & Tone Controls</span>
      </button>
    </div>
  );
};
