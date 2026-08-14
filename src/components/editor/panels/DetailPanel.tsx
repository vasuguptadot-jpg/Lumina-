import React, { useState } from 'react';
import {
  Focus,
  Zap,
  Activity,
  Shield,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
  RotateCcw,
  Sliders,
  SlidersHorizontal,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { AdjustmentSettings } from '../../../types/editor';

interface DetailPanelProps {
  adjustments: AdjustmentSettings;
  onChange: (adjustments: AdjustmentSettings) => void;
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

export const DetailPanel: React.FC<DetailPanelProps> = ({
  adjustments,
  onChange,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'sharpen' | 'structure' | 'noise'>('all');

  const updateAdj = (partial: Partial<AdjustmentSettings>) => {
    onChange({
      ...adjustments,
      ...partial,
      // Keep legacy noiseReduction in sync with luminanceNR
      ...(partial.luminanceNR !== undefined ? { noiseReduction: partial.luminanceNR } : {}),
      ...(partial.noiseReduction !== undefined ? { luminanceNR: partial.noiseReduction } : {}),
    });
  };

  const isMaskPreviewOn = !!adjustments.previewSharpnessMask;

  const toggleMaskPreview = () => {
    const next = !isMaskPreviewOn;
    updateAdj({ previewSharpnessMask: next });
    if (next && showToast) {
      showToast('info', 'Edge Mask Preview Active', 'Showing B&W edge detection mask for sharpening calibration');
    }
  };

  // Quick One-Click Detail Profiles
  const applyDetailPreset = (presetName: string) => {
    if (presetName === 'landscape') {
      updateAdj({
        sharpness: 65,
        sharpnessRadius: 1.2,
        sharpnessDetail: 35,
        sharpnessMasking: 45,
        edgeSharpening: 20,
        clarity: 15,
        texture: 25,
        structure: 20,
        microcontrast: 15,
        luminanceNR: 10,
        colorNoiseReduction: 25,
      });
      showToast?.('success', 'Landscape Detail Applied', 'High acutance edge separation with 45% sky masking');
    } else if (presetName === 'portrait') {
      updateAdj({
        sharpness: 40,
        sharpnessRadius: 0.9,
        sharpnessDetail: 15,
        sharpnessMasking: 70,
        edgeSharpening: 10,
        clarity: -5,
        texture: 5,
        structure: 0,
        microcontrast: 5,
        luminanceNR: 20,
        luminanceDetail: 60,
        colorNoiseReduction: 35,
      });
      showToast?.('success', 'Portrait Smooth Applied', 'Soft skin preservation with 70% edge masking on eyes/hair');
    } else if (presetName === 'denoise') {
      updateAdj({
        sharpness: 35,
        sharpnessRadius: 1.0,
        sharpnessDetail: 20,
        sharpnessMasking: 60,
        luminanceNR: 45,
        luminanceDetail: 45,
        colorNoiseReduction: 60,
        colorNoiseDetail: 50,
        colorNoiseSmoothness: 65,
      });
      showToast?.('success', 'High-ISO Denoise Applied', 'Bilateral smoothing with chroma blotch suppression');
    } else if (presetName === 'architecture') {
      updateAdj({
        sharpness: 75,
        sharpnessRadius: 1.4,
        sharpnessDetail: 40,
        sharpnessMasking: 25,
        edgeSharpening: 35,
        clarity: 25,
        texture: 30,
        structure: 35,
        microcontrast: 25,
        luminanceNR: 5,
        colorNoiseReduction: 25,
      });
      showToast?.('success', 'Architectural Depth Applied', 'Reinforced microcontrast and geometric contours');
    } else if (presetName === 'reset') {
      updateAdj({
        sharpness: 0,
        sharpnessRadius: 1.0,
        sharpnessDetail: 25,
        sharpnessMasking: 0,
        edgeSharpening: 0,
        previewSharpnessMask: false,
        clarity: 0,
        texture: 0,
        structure: 0,
        microcontrast: 0,
        luminanceNR: 0,
        noiseReduction: 0,
        luminanceDetail: 50,
        colorNoiseReduction: 25,
        colorNoiseDetail: 50,
        colorNoiseSmoothness: 50,
      });
      showToast?.('info', 'Detail Reset', 'Restored baseline sharpness and noise reduction');
    }
  };

  return (
    <div className="p-4 space-y-6 select-none">
      {/* Header with Quick Presets */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Focus className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Detail, Sharpness & NR
            </h3>
          </div>
          <button
            onClick={() => applyDetailPreset('reset')}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>

        {/* Quick Style Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            onClick={() => applyDetailPreset('landscape')}
            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-indigo-500 hover:text-white transition-all"
          >
            Landscape Crisp
          </button>
          <button
            onClick={() => applyDetailPreset('portrait')}
            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-indigo-500 hover:text-white transition-all"
          >
            Portrait Smooth
          </button>
          <button
            onClick={() => applyDetailPreset('architecture')}
            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-indigo-500 hover:text-white transition-all"
          >
            Architecture
          </button>
          <button
            onClick={() => applyDetailPreset('denoise')}
            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-indigo-500 hover:text-white transition-all"
          >
            High-ISO Denoise
          </button>
        </div>
      </div>

      {/* Sub-Filter Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] font-semibold">
        <button
          onClick={() => setActiveSubTab('all')}
          className={`py-1.5 rounded-lg transition-colors ${
            activeSubTab === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveSubTab('sharpen')}
          className={`py-1.5 rounded-lg transition-colors ${
            activeSubTab === 'sharpen' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Sharpen
        </button>
        <button
          onClick={() => setActiveSubTab('structure')}
          className={`py-1.5 rounded-lg transition-colors ${
            activeSubTab === 'structure' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Structure
        </button>
        <button
          onClick={() => setActiveSubTab('noise')}
          className={`py-1.5 rounded-lg transition-colors ${
            activeSubTab === 'noise' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Noise Red.
        </button>
      </div>

      {/* 1. SHARPENING SECTION */}
      {(activeSubTab === 'all' || activeSubTab === 'sharpen') && (
        <div className="space-y-4 p-3.5 bg-slate-900/40 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">Sharpening</span>
            </div>
            {/* Visual Masking Preview Toggle */}
            <button
              onClick={toggleMaskPreview}
              className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-colors ${
                isMaskPreviewOn
                  ? 'bg-rose-600 text-white border-rose-500 shadow-sm animate-pulse'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Preview black and white edge detection mask"
            >
              {isMaskPreviewOn ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{isMaskPreviewOn ? 'Mask Active' : 'Preview Mask'}</span>
            </button>
          </div>

          <div className="space-y-3">
            <SliderControl
              label="Sharpen Amount"
              value={adjustments.sharpness || 0}
              min={0}
              max={150}
              defaultValue={0}
              colorClass="accent-indigo-500"
              tooltip="Unsharp mask strength applied to high-contrast edges"
              onChange={(val) => updateAdj({ sharpness: val })}
            />

            <SliderControl
              label="Radius"
              value={adjustments.sharpnessRadius ?? 1.0}
              min={0.5}
              max={3.0}
              step={0.1}
              defaultValue={1.0}
              unit=" px"
              colorClass="accent-indigo-400"
              tooltip="Spatial width of the edge sharpening halo"
              onChange={(val) => updateAdj({ sharpnessRadius: val })}
            />

            <SliderControl
              label="Detail"
              value={adjustments.sharpnessDetail ?? 25}
              min={0}
              max={100}
              defaultValue={25}
              colorClass="accent-indigo-400"
              tooltip="Suppresses fine grain at low values, reveals micro-textures at high values"
              onChange={(val) => updateAdj({ sharpnessDetail: val })}
            />

            <SliderControl
              label="Masking (Edge Threshold)"
              value={adjustments.sharpnessMasking ?? 0}
              min={0}
              max={100}
              defaultValue={0}
              colorClass="accent-indigo-400"
              tooltip="Protects flat smooth areas (skies, skin) by only sharpening edges"
              onChange={(val) => updateAdj({ sharpnessMasking: val })}
            />

            <SliderControl
              label="Edge Sharpening"
              value={adjustments.edgeSharpening ?? 0}
              min={0}
              max={100}
              defaultValue={0}
              colorClass="accent-indigo-400"
              tooltip="Targeted high-acutance enhancement for prominent contours"
              onChange={(val) => updateAdj({ edgeSharpening: val })}
            />
          </div>
        </div>
      )}

      {/* 2. STRUCTURE, CLARITY, TEXTURE & MICROCONTRAST */}
      {(activeSubTab === 'all' || activeSubTab === 'structure') && (
        <div className="space-y-4 p-3.5 bg-slate-900/40 rounded-2xl border border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">Structure & Microcontrast</span>
          </div>

          <div className="space-y-3">
            <SliderControl
              label="Structure"
              value={adjustments.structure ?? 0}
              min={-100}
              max={100}
              defaultValue={0}
              colorClass="accent-cyan-500"
              tooltip="Mid-frequency contour depth for architectural and geometric separation"
              onChange={(val) => updateAdj({ structure: val })}
            />

            <SliderControl
              label="Clarity"
              value={adjustments.clarity || 0}
              min={-100}
              max={100}
              defaultValue={0}
              colorClass="accent-cyan-500"
              tooltip="Local midtone contrast enhancement without clipping shadows/highlights"
              onChange={(val) => updateAdj({ clarity: val })}
            />

            <SliderControl
              label="Texture"
              value={adjustments.texture || 0}
              min={-100}
              max={100}
              defaultValue={0}
              colorClass="accent-cyan-400"
              tooltip="Enhances fine frequency details (fabric, bark, hair) without harsh edge halos"
              onChange={(val) => updateAdj({ texture: val })}
            />

            <SliderControl
              label="Microcontrast"
              value={adjustments.microcontrast ?? 0}
              min={-100}
              max={100}
              defaultValue={0}
              colorClass="accent-cyan-400"
              tooltip="Surface tonal micro-gradients for tactile presence and dimensionality"
              onChange={(val) => updateAdj({ microcontrast: val })}
            />
          </div>
        </div>
      )}

      {/* 3. NOISE REDUCTION SECTION */}
      {(activeSubTab === 'all' || activeSubTab === 'noise') && (
        <div className="space-y-4 p-3.5 bg-slate-900/40 rounded-2xl border border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">Noise Reduction</span>
          </div>

          <div className="space-y-3">
            {/* Luminance Noise Reduction */}
            <SliderControl
              label="Luminance NR"
              value={adjustments.luminanceNR !== undefined ? adjustments.luminanceNR : (adjustments.noiseReduction || 0)}
              min={0}
              max={100}
              defaultValue={0}
              colorClass="accent-emerald-500"
              tooltip="Smooths grainy luminance noise using an edge-preserving bilateral filter"
              onChange={(val) => updateAdj({ luminanceNR: val, noiseReduction: val })}
            />

            <SliderControl
              label="Luminance Detail Recovery"
              value={adjustments.luminanceDetail ?? 50}
              min={0}
              max={100}
              defaultValue={50}
              colorClass="accent-emerald-400"
              tooltip="Preserves fine edge textures from being smoothed away"
              onChange={(val) => updateAdj({ luminanceDetail: val })}
            />

            <div className="pt-2 border-t border-slate-800/60" />

            {/* Color / Chroma Noise Reduction */}
            <SliderControl
              label="Color Noise Reduction"
              value={adjustments.colorNoiseReduction ?? 25}
              min={0}
              max={100}
              defaultValue={25}
              colorClass="accent-emerald-500"
              tooltip="Suppresses color speckling (red/blue salt-and-pepper noise)"
              onChange={(val) => updateAdj({ colorNoiseReduction: val })}
            />

            <SliderControl
              label="Color Detail"
              value={adjustments.colorNoiseDetail ?? 50}
              min={0}
              max={100}
              defaultValue={50}
              colorClass="accent-emerald-400"
              tooltip="Protects color edges (lips, petals) from chroma bleed"
              onChange={(val) => updateAdj({ colorNoiseDetail: val })}
            />

            <SliderControl
              label="Color Smoothness"
              value={adjustments.colorNoiseSmoothness ?? 50}
              min={0}
              max={100}
              defaultValue={50}
              colorClass="accent-emerald-400"
              tooltip="Eliminates low-frequency color blotches across shadows"
              onChange={(val) => updateAdj({ colorNoiseSmoothness: val })}
            />
          </div>
        </div>
      )}
    </div>
  );
};
