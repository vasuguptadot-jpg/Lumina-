import React, { useState } from 'react';
import {
  Aperture,
  Sparkles,
  Layers,
  Eye,
  EyeOff,
  RotateCcw,
  Sliders,
  Move,
  Maximize2,
  Compass,
  Circle,
  Hexagon,
  Heart,
  Star,
  Disc,
  Diamond,
  Wind,
  Focus,
  Sun,
  Activity,
  User,
  Trees,
  Mountain,
} from 'lucide-react';
import { AdjustmentSettings, BlurMode, BokehShape, DepthZoneAdjustments } from '../../../types/editor';

interface BlurDepthPanelProps {
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

export const BlurDepthPanel: React.FC<BlurDepthPanelProps> = ({
  adjustments,
  onChange,
  showToast,
}) => {
  const [activeSection, setActiveSection] = useState<'blur' | 'depth-zones'>('blur');
  const [activeDepthZone, setActiveDepthZone] = useState<'foreground' | 'subject' | 'background'>('subject');

  const blur = adjustments.blur || {
    enabled: false,
    mode: 'lens',
    amount: 30,
    bokehShape: 'circle',
    bokehIntensity: 40,
    bokehThreshold: 75,
    bokehSphericalAberration: 0,
    bokehBladeCurvature: 80,
    motionAngle: 0,
    motionDistance: 25,
    radialCenterX: 0.5,
    radialCenterY: 0.5,
    radialAngle: 15,
    zoomCenterX: 0.5,
    zoomCenterY: 0.5,
    zoomStrength: 25,
    tiltShiftCenterX: 0.5,
    tiltShiftCenterY: 0.5,
    tiltShiftAngle: 0,
    tiltShiftFocusWidth: 25,
    tiltShiftFeather: 35,
    focusDepth: 0.5,
    depthOfField: 0.25,
    apertureFStop: 'f/1.8',
    invertDepth: false,
    selectiveType: 'radial',
    selectiveCenterX: 0.5,
    selectiveCenterY: 0.5,
    selectiveRadius: 0.35,
    selectiveFeather: 0.3,
    selectiveInvert: false,
  };

  const aiDepth = adjustments.aiDepth || {
    enabled: false,
    depthEstimationMethod: 'neural-gradient',
    showDepthMapOverlay: false,
    depthColorMap: 'turbo',
    foregroundThreshold: 0.30,
    backgroundThreshold: 0.65,
    feather: 0.15,
    foreground: {
      exposure: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      temperature: 0,
      tint: 0,
      saturation: 0,
      vibrance: 0,
      clarity: 0,
      texture: 0,
      sharpness: 0,
      blur: 0,
      dehaze: 0,
    },
    subject: {
      exposure: 5,
      contrast: 5,
      highlights: 0,
      shadows: 5,
      temperature: 0,
      tint: 0,
      saturation: 5,
      vibrance: 5,
      clarity: 10,
      texture: 10,
      sharpness: 20,
      blur: 0,
      dehaze: 0,
    },
    background: {
      exposure: -5,
      contrast: -5,
      highlights: -10,
      shadows: 0,
      temperature: 0,
      tint: 0,
      saturation: -5,
      vibrance: -5,
      clarity: -10,
      texture: -10,
      sharpness: 0,
      blur: 25,
      dehaze: -5,
    },
    simulatedFocalDepth: 0.5,
    dofAperture: 0.25,
  };

  const updateBlur = (partial: Partial<typeof blur>) => {
    onChange({
      ...adjustments,
      blur: { ...blur, ...partial },
    });
  };

  const updateAIDepth = (partial: Partial<typeof aiDepth>) => {
    onChange({
      ...adjustments,
      aiDepth: { ...aiDepth, ...partial },
    });
  };

  const updateCurrentZone = (partial: Partial<DepthZoneAdjustments>) => {
    const currentZoneAdj = aiDepth[activeDepthZone];
    updateAIDepth({
      [activeDepthZone]: { ...currentZoneAdj, ...partial },
    });
  };

  // Preset Configurations
  const applyPreset = (name: string) => {
    if (name === 'portrait-bokeh') {
      updateBlur({
        enabled: true,
        mode: 'lens',
        amount: 45,
        bokehShape: 'hexagon',
        bokehIntensity: 55,
        bokehThreshold: 70,
        bokehSphericalAberration: 15,
      });
      updateAIDepth({
        enabled: true,
        subject: { ...aiDepth.subject, exposure: 8, clarity: 15, sharpness: 25 },
        background: { ...aiDepth.background, exposure: -12, saturation: -10, blur: 40 },
      });
      showToast?.('success', 'Portrait Bokeh Pop Applied', 'Isolated subject with 6-blade optical aperture blur');
    } else if (name === 'tilt-shift') {
      updateBlur({
        enabled: true,
        mode: 'tilt-shift',
        amount: 50,
        tiltShiftAngle: 0,
        tiltShiftFocusWidth: 20,
        tiltShiftFeather: 30,
      });
      showToast?.('success', 'Cinematic Miniature Applied', 'Horizontal tilt-shift focal plane with miniature optics');
    } else if (name === 'speed-motion') {
      updateBlur({
        enabled: true,
        mode: 'motion',
        amount: 40,
        motionAngle: 15,
        motionDistance: 35,
      });
      showToast?.('success', 'Motion Panning Applied', 'Dynamic directional motion blur along 15° axis');
    } else if (name === 'depth-aware') {
      updateBlur({
        enabled: true,
        mode: 'depth-aware',
        amount: 45,
        focusDepth: 0.45,
        depthOfField: 0.2,
      });
      showToast?.('success', 'Depth-Aware DoF Applied', 'Continuous circle of confusion calibrated to depth map');
    } else if (name === 'reset') {
      updateBlur({
        enabled: false,
        amount: 0,
      });
      updateAIDepth({
        enabled: false,
        showDepthMapOverlay: false,
      });
      showToast?.('info', 'Blur & Depth Reset', 'All blur and depth effects cleared');
    }
  };

  const blurModes: Array<{ id: BlurMode; label: string; desc: string }> = [
    { id: 'lens', label: 'Lens & Bokeh', desc: 'Optical aperture simulation with specular highlight discs' },
    { id: 'gaussian', label: 'Gaussian', desc: 'Smooth mathematical defocus across the frame' },
    { id: 'depth-aware', label: 'Depth-Aware', desc: 'Photographic circle of confusion guided by AI depth' },
    { id: 'tilt-shift', label: 'Tilt-Shift', desc: 'Miniature diorama effect with adjustable focal band' },
    { id: 'motion', label: 'Motion', desc: 'Directional kinetic speed blur along an angle' },
    { id: 'radial', label: 'Radial (Spin)', desc: 'Rotational vortex blur around a center axis' },
    { id: 'zoom', label: 'Zoom', desc: 'Explosive radial scaling blur from focal center' },
    { id: 'background', label: 'Background Only', desc: 'Defocuses distant background while keeping subject sharp' },
    { id: 'foreground', label: 'Foreground Only', desc: 'Defocuses close foreground objects for cinematic depth' },
    { id: 'selective', label: 'Selective', desc: 'Custom radial or linear region blur' },
  ];

  const bokehShapes: Array<{ id: BokehShape; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'circle', label: 'Circle', icon: Circle },
    { id: 'hexagon', label: 'Hexagon (6-Blade)', icon: Hexagon },
    { id: 'octagon', label: 'Octagon (8-Blade)', icon: Disc },
    { id: 'heart', label: 'Heart', icon: Heart },
    { id: 'star', label: 'Star', icon: Star },
    { id: 'diamond', label: 'Diamond', icon: Diamond },
    { id: 'swirl', label: 'Petzval Swirl', icon: Wind },
  ];

  const currentZoneData = aiDepth[activeDepthZone];

  return (
    <div className="p-4 space-y-6 select-none">
      {/* Header & Preset Buttons */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Aperture className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Blur & AI Depth Suite
            </h3>
          </div>
          <button
            onClick={() => applyPreset('reset')}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>

        {/* Quick Style Presets */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            onClick={() => applyPreset('portrait-bokeh')}
            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-purple-500 hover:text-white transition-all"
          >
            Portrait Bokeh Pop
          </button>
          <button
            onClick={() => applyPreset('tilt-shift')}
            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-purple-500 hover:text-white transition-all"
          >
            Tilt-Shift Miniature
          </button>
          <button
            onClick={() => applyPreset('depth-aware')}
            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-purple-500 hover:text-white transition-all"
          >
            Depth-Aware DoF
          </button>
          <button
            onClick={() => applyPreset('speed-motion')}
            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-purple-500 hover:text-white transition-all"
          >
            Motion Panning
          </button>
        </div>
      </div>

      {/* Main Suite Tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] font-semibold">
        <button
          onClick={() => setActiveSection('blur')}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeSection === 'blur' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Aperture className="w-3.5 h-3.5" />
          <span>Blur & Bokeh Types</span>
        </button>
        <button
          onClick={() => setActiveSection('depth-zones')}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeSection === 'depth-zones' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>AI 3-Zone Depth</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: BLUR & BOKEH CONTROLS                                         */}
      {/* ========================================================================= */}
      {activeSection === 'blur' && (
        <div className="space-y-4">
          {/* Master Enable & Overall Amount */}
          <div className="p-3.5 bg-slate-900/50 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={blur.enabled}
                  onChange={(e) => updateBlur({ enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-800 border-slate-700 focus:ring-purple-500"
                />
                <span className="text-xs font-bold text-slate-200">Enable Photographic Blur</span>
              </label>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/50">
                {blur.mode}
              </span>
            </div>

            {blur.enabled && (
              <SliderControl
                label="Blur Strength (Amount)"
                value={blur.amount}
                min={0}
                max={100}
                defaultValue={30}
                colorClass="accent-purple-500"
                tooltip="Overall intensity of the active blur effect"
                onChange={(val) => updateBlur({ amount: val })}
              />
            )}
          </div>

          {/* Blur Mode Selector */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Select Blur Algorithm
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {blurModes.map((m) => {
                const isSelected = blur.mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => updateBlur({ mode: m.id, enabled: true })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-sm'
                        : 'bg-slate-900/40 border-slate-800/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{m.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode-Specific Fine Controls */}
          {blur.enabled && (
            <div className="p-3.5 bg-slate-900/50 rounded-2xl border border-slate-800/80 space-y-4">
              {/* LENS BLUR & BOKEH CONFIGURATION */}
              {blur.mode === 'lens' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Bokeh Aperture Shape</span>
                  </div>

                  {/* Shape Grid */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {bokehShapes.map((shape) => {
                      const Icon = shape.icon;
                      const isSel = blur.bokehShape === shape.id;
                      return (
                        <button
                          key={shape.id}
                          onClick={() => updateBlur({ bokehShape: shape.id })}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all ${
                            isSel
                              ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm'
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSel ? 'text-purple-300' : 'text-slate-400'}`} />
                          <span className="text-[10px] text-center leading-tight">{shape.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bokeh Tuning Sliders */}
                  <div className="space-y-3 pt-2 border-t border-slate-800/60">
                    <SliderControl
                      label="Specular Highlight Intensity"
                      value={blur.bokehIntensity ?? 40}
                      min={0}
                      max={100}
                      defaultValue={40}
                      colorClass="accent-purple-400"
                      tooltip="Boosts luminous glow discs in out-of-focus background highlights"
                      onChange={(val) => updateBlur({ bokehIntensity: val })}
                    />

                    <SliderControl
                      label="Specular Luminance Threshold"
                      value={blur.bokehThreshold ?? 75}
                      min={0}
                      max={100}
                      defaultValue={75}
                      colorClass="accent-purple-400"
                      tooltip="Lower values generate bokeh discs from midtones; higher values isolate specular points"
                      onChange={(val) => updateBlur({ bokehThreshold: val })}
                    />

                    <SliderControl
                      label="Spherical Aberration (Cat-Eye)"
                      value={blur.bokehSphericalAberration ?? 0}
                      min={-100}
                      max={100}
                      defaultValue={0}
                      colorClass="accent-purple-400"
                      tooltip="Simulates vintage lens optical vignetting that elongates bokeh discs towards corners"
                      onChange={(val) => updateBlur({ bokehSphericalAberration: val })}
                    />

                    <SliderControl
                      label="Blade Curvature (Roundness)"
                      value={blur.bokehBladeCurvature ?? 80}
                      min={0}
                      max={100}
                      defaultValue={80}
                      colorClass="accent-purple-400"
                      tooltip="Rounds off aperture polygon blades for circular softness"
                      onChange={(val) => updateBlur({ bokehBladeCurvature: val })}
                    />
                  </div>
                </div>
              )}

              {/* MOTION BLUR CONTROLS */}
              {blur.mode === 'motion' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <Move className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Motion Vector</span>
                  </div>

                  <SliderControl
                    label="Motion Angle"
                    value={blur.motionAngle ?? 0}
                    min={-180}
                    max={180}
                    step={1}
                    defaultValue={0}
                    unit="°"
                    colorClass="accent-indigo-400"
                    tooltip="Directional angle of kinetic motion streak"
                    onChange={(val) => updateBlur({ motionAngle: val })}
                  />

                  <SliderControl
                    label="Streak Distance"
                    value={blur.motionDistance ?? 25}
                    min={1}
                    max={100}
                    defaultValue={25}
                    unit=" px"
                    colorClass="accent-indigo-400"
                    tooltip="Length of the motion blur trajectory"
                    onChange={(val) => updateBlur({ motionDistance: val })}
                  />
                </div>
              )}

              {/* RADIAL SPIN BLUR */}
              {blur.mode === 'radial' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Spin Parameters</span>
                  </div>

                  <SliderControl
                    label="Angular Spin Power"
                    value={blur.radialAngle ?? 15}
                    min={1}
                    max={100}
                    defaultValue={15}
                    colorClass="accent-cyan-400"
                    tooltip="Rotational angle spread around center"
                    onChange={(val) => updateBlur({ radialAngle: val })}
                  />

                  <SliderControl
                    label="Center X Position"
                    value={Math.round((blur.radialCenterX ?? 0.5) * 100)}
                    min={0}
                    max={100}
                    defaultValue={50}
                    unit="%"
                    colorClass="accent-cyan-400"
                    onChange={(val) => updateBlur({ radialCenterX: val / 100 })}
                  />

                  <SliderControl
                    label="Center Y Position"
                    value={Math.round((blur.radialCenterY ?? 0.5) * 100)}
                    min={0}
                    max={100}
                    defaultValue={50}
                    unit="%"
                    colorClass="accent-cyan-400"
                    onChange={(val) => updateBlur({ radialCenterY: val / 100 })}
                  />
                </div>
              )}

              {/* ZOOM BLUR */}
              {blur.mode === 'zoom' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Zoom Burst Origin</span>
                  </div>

                  <SliderControl
                    label="Zoom Burst Intensity"
                    value={blur.zoomStrength ?? 25}
                    min={1}
                    max={100}
                    defaultValue={25}
                    colorClass="accent-amber-400"
                    onChange={(val) => updateBlur({ zoomStrength: val })}
                  />

                  <SliderControl
                    label="Zoom Center X"
                    value={Math.round((blur.zoomCenterX ?? 0.5) * 100)}
                    min={0}
                    max={100}
                    defaultValue={50}
                    unit="%"
                    colorClass="accent-amber-400"
                    onChange={(val) => updateBlur({ zoomCenterX: val / 100 })}
                  />

                  <SliderControl
                    label="Zoom Center Y"
                    value={Math.round((blur.zoomCenterY ?? 0.5) * 100)}
                    min={0}
                    max={100}
                    defaultValue={50}
                    unit="%"
                    colorClass="accent-amber-400"
                    onChange={(val) => updateBlur({ zoomCenterY: val / 100 })}
                  />
                </div>
              )}

              {/* TILT-SHIFT MINIATURE */}
              {blur.mode === 'tilt-shift' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <Compass className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tilt-Shift Plane of Focus</span>
                  </div>

                  <SliderControl
                    label="Focal Band Angle"
                    value={blur.tiltShiftAngle ?? 0}
                    min={-90}
                    max={90}
                    defaultValue={0}
                    unit="°"
                    colorClass="accent-emerald-400"
                    tooltip="Orientation angle of the sharp in-focus strip"
                    onChange={(val) => updateBlur({ tiltShiftAngle: val })}
                  />

                  <SliderControl
                    label="In-Focus Band Width"
                    value={blur.tiltShiftFocusWidth ?? 25}
                    min={5}
                    max={80}
                    defaultValue={25}
                    unit="%"
                    colorClass="accent-emerald-400"
                    tooltip="Width of the sharp subject slice"
                    onChange={(val) => updateBlur({ tiltShiftFocusWidth: val })}
                  />

                  <SliderControl
                    label="Defocus Feather (Falloff)"
                    value={blur.tiltShiftFeather ?? 35}
                    min={5}
                    max={80}
                    defaultValue={35}
                    unit="%"
                    colorClass="accent-emerald-400"
                    tooltip="Smoothness of transition into out-of-focus blur"
                    onChange={(val) => updateBlur({ tiltShiftFeather: val })}
                  />

                  <SliderControl
                    label="Plane Center Y"
                    value={Math.round((blur.tiltShiftCenterY ?? 0.5) * 100)}
                    min={0}
                    max={100}
                    defaultValue={50}
                    unit="%"
                    colorClass="accent-emerald-400"
                    onChange={(val) => updateBlur({ tiltShiftCenterY: val / 100 })}
                  />
                </div>
              )}

              {/* DEPTH-AWARE DEFOCUS */}
              {blur.mode === 'depth-aware' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <Focus className="w-3.5 h-3.5 text-rose-400" />
                      <span>Focal Plane & Aperture Simulation</span>
                    </div>
                  </div>

                  {/* Aperture F-Stop Buttons */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Simulated Lens Aperture:</span>
                    <div className="grid grid-cols-6 gap-1">
                      {['f/1.2', 'f/1.4', 'f/1.8', 'f/2.8', 'f/4.0', 'f/8.0'].map((f) => {
                        const isSel = blur.apertureFStop === f;
                        return (
                          <button
                            key={f}
                            onClick={() => {
                              const dofMap: Record<string, number> = {
                                'f/1.2': 0.08,
                                'f/1.4': 0.12,
                                'f/1.8': 0.18,
                                'f/2.8': 0.30,
                                'f/4.0': 0.50,
                                'f/8.0': 0.85,
                              };
                              updateBlur({ apertureFStop: f, depthOfField: dofMap[f] || 0.25 });
                            }}
                            className={`py-1 text-[10px] font-bold rounded-lg border transition-all ${
                              isSel
                                ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {f}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <SliderControl
                    label="Focus Depth Distance"
                    value={Math.round((blur.focusDepth ?? 0.5) * 100)}
                    min={0}
                    max={100}
                    defaultValue={50}
                    unit="%"
                    colorClass="accent-rose-400"
                    tooltip="0% = Near Foreground Focus, 100% = Infinity Horizon Focus"
                    onChange={(val) => updateBlur({ focusDepth: val / 100 })}
                  />

                  <SliderControl
                    label="Depth of Field (DoF Width)"
                    value={Math.round((blur.depthOfField ?? 0.25) * 100)}
                    min={5}
                    max={100}
                    defaultValue={25}
                    unit="%"
                    colorClass="accent-rose-400"
                    tooltip="Breadth of the in-focus depth slice"
                    onChange={(val) => updateBlur({ depthOfField: val / 100 })}
                  />
                </div>
              )}

              {/* SELECTIVE REGION BLUR */}
              {blur.mode === 'selective' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                    <span>Selective Radial Zone</span>
                    <button
                      onClick={() => updateBlur({ selectiveInvert: !blur.selectiveInvert })}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        blur.selectiveInvert
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {blur.selectiveInvert ? 'Inverted (Blur Outside)' : 'Normal (Blur Inside)'}
                    </button>
                  </div>

                  <SliderControl
                    label="Radius"
                    value={Math.round((blur.selectiveRadius ?? 0.35) * 100)}
                    min={5}
                    max={100}
                    defaultValue={35}
                    unit="%"
                    colorClass="accent-purple-400"
                    onChange={(val) => updateBlur({ selectiveRadius: val / 100 })}
                  />

                  <SliderControl
                    label="Edge Feather"
                    value={Math.round((blur.selectiveFeather ?? 0.3) * 100)}
                    min={0}
                    max={100}
                    defaultValue={30}
                    unit="%"
                    colorClass="accent-purple-400"
                    onChange={(val) => updateBlur({ selectiveFeather: val / 100 })}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: AI 3-ZONE DEPTH INDEPENDENT EDITING                           */}
      {/* ========================================================================= */}
      {activeSection === 'depth-zones' && (
        <div className="space-y-4">
          {/* Master Enable & Depth Map Overlay Toggle */}
          <div className="p-3.5 bg-slate-900/50 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiDepth.enabled}
                  onChange={(e) => updateAIDepth({ enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-800 border-slate-700 focus:ring-purple-500"
                />
                <span className="text-xs font-bold text-slate-200">Enable AI 3-Zone Processing</span>
              </label>

              {/* Live False-Color Overlay Toggle */}
              <button
                onClick={() => {
                  const next = !aiDepth.showDepthMapOverlay;
                  updateAIDepth({ showDepthMapOverlay: next, enabled: true });
                  if (next && showToast) {
                    showToast('info', 'AI Depth Map Preview', 'Showing false-color depth segmentation map');
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-colors ${
                  aiDepth.showDepthMapOverlay
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Preview False-Color Depth Map"
              >
                {aiDepth.showDepthMapOverlay ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>{aiDepth.showDepthMapOverlay ? 'Depth Map Active' : 'View Depth Map'}</span>
              </button>
            </div>

            {/* Depth Colormap Selector */}
            {aiDepth.showDepthMapOverlay && (
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold">Colormap:</span>
                <div className="flex gap-1">
                  {(['turbo', 'plasma', 'viridis', 'inferno', 'grayscale'] as const).map((cm) => (
                    <button
                      key={cm}
                      onClick={() => updateAIDepth({ depthColorMap: cm })}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase transition-colors ${
                        aiDepth.depthColorMap === cm
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cm}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3-ZONE SELECTOR TABS: Foreground -> Subject -> Background */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Active Zone to Edit
              </span>
              <span className="text-[10px] text-purple-400 font-medium">Independent Controls</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveDepthZone('foreground')}
                className={`py-2 px-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  activeDepthZone === 'foreground'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Mountain className="w-4 h-4" />
                <span className="text-[11px] font-bold">1. Foreground</span>
              </button>

              <button
                onClick={() => setActiveDepthZone('subject')}
                className={`py-2 px-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  activeDepthZone === 'subject'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="text-[11px] font-bold">2. Subject</span>
              </button>

              <button
                onClick={() => setActiveDepthZone('background')}
                className={`py-2 px-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  activeDepthZone === 'background'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Trees className="w-4 h-4" />
                <span className="text-[11px] font-bold">3. Background</span>
              </button>
            </div>
          </div>

          {/* ACTIVE ZONE EDITING CONTROLS */}
          <div className="p-3.5 bg-slate-900/50 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
              <span className="text-xs font-bold text-slate-200 capitalize">
                {activeDepthZone} Zone Adjustments
              </span>
              <button
                onClick={() => {
                  updateAIDepth({
                    [activeDepthZone]: {
                      exposure: 0,
                      contrast: 0,
                      highlights: 0,
                      shadows: 0,
                      temperature: 0,
                      tint: 0,
                      saturation: 0,
                      vibrance: 0,
                      clarity: 0,
                      texture: 0,
                      sharpness: 0,
                      blur: 0,
                      dehaze: 0,
                    },
                  });
                  showToast?.('info', `Reset ${activeDepthZone} Adjustments`);
                }}
                className="text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Reset Zone
              </button>
            </div>

            <div className="space-y-3">
              <SliderControl
                label="Exposure (Light Level)"
                value={currentZoneData.exposure}
                min={-100}
                max={100}
                defaultValue={0}
                colorClass="accent-amber-400"
                tooltip={`Adjust exposure specifically within the ${activeDepthZone} layer`}
                onChange={(val) => updateCurrentZone({ exposure: val })}
              />

              <SliderControl
                label="Contrast"
                value={currentZoneData.contrast}
                min={-100}
                max={100}
                defaultValue={0}
                colorClass="accent-amber-400"
                onChange={(val) => updateCurrentZone({ contrast: val })}
              />

              <SliderControl
                label="Highlights"
                value={currentZoneData.highlights}
                min={-100}
                max={100}
                defaultValue={0}
                colorClass="accent-amber-400"
                onChange={(val) => updateCurrentZone({ highlights: val })}
              />

              <SliderControl
                label="Shadows"
                value={currentZoneData.shadows}
                min={-100}
                max={100}
                defaultValue={0}
                colorClass="accent-amber-400"
                onChange={(val) => updateCurrentZone({ shadows: val })}
              />

              <div className="pt-2 border-t border-slate-800/60" />

              <SliderControl
                label="Temperature (Warmth)"
                value={currentZoneData.temperature}
                min={-100}
                max={100}
                defaultValue={0}
                colorClass="accent-orange-400"
                tooltip="Cool or warm color balance for this zone"
                onChange={(val) => updateCurrentZone({ temperature: val })}
              />

              <SliderControl
                label="Saturation"
                value={currentZoneData.saturation}
                min={-100}
                max={100}
                defaultValue={0}
                colorClass="accent-rose-400"
                onChange={(val) => updateCurrentZone({ saturation: val })}
              />

              <div className="pt-2 border-t border-slate-800/60" />

              <SliderControl
                label="Clarity & Local Depth"
                value={currentZoneData.clarity}
                min={-100}
                max={100}
                defaultValue={0}
                colorClass="accent-cyan-400"
                onChange={(val) => updateCurrentZone({ clarity: val })}
              />

              <SliderControl
                label="Dehaze"
                value={currentZoneData.dehaze}
                min={-100}
                max={100}
                defaultValue={0}
                colorClass="accent-teal-400"
                onChange={(val) => updateCurrentZone({ dehaze: val })}
              />
            </div>
          </div>

          {/* ZONE BOUNDARIES & FEATHER CALIBRATION */}
          <div className="p-3.5 bg-slate-900/50 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Zone Segmentation Thresholds</span>
            </div>

            <SliderControl
              label="Foreground Cutoff Plane"
              value={Math.round(aiDepth.foregroundThreshold * 100)}
              min={5}
              max={45}
              defaultValue={30}
              unit="%"
              colorClass="accent-amber-500"
              tooltip="Depth distance where foreground ends"
              onChange={(val) => updateAIDepth({ foregroundThreshold: val / 100 })}
            />

            <SliderControl
              label="Background Start Plane"
              value={Math.round(aiDepth.backgroundThreshold * 100)}
              min={55}
              max={95}
              defaultValue={65}
              unit="%"
              colorClass="accent-emerald-500"
              tooltip="Depth distance where background begins"
              onChange={(val) => updateAIDepth({ backgroundThreshold: val / 100 })}
            />

            <SliderControl
              label="Boundary Soft Feather"
              value={Math.round(aiDepth.feather * 100)}
              min={1}
              max={40}
              defaultValue={15}
              unit="%"
              colorClass="accent-purple-400"
              tooltip="Soft transition width between adjacent depth zones"
              onChange={(val) => updateAIDepth({ feather: val / 100 })}
            />
          </div>
        </div>
      )}
    </div>
  );
};
