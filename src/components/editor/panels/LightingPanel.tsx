import React, { useState } from 'react';
import {
  SunMedium,
  Compass,
  Sparkles,
  RotateCcw,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Sun,
  Moon,
  Flame,
  Zap,
  Palette,
  Eye,
  Camera,
  Layers,
  Circle,
  Lightbulb,
  Maximize2,
} from 'lucide-react';
import { Project } from '../../../types/editor';
import {
  RelightingOptions,
  requestAiRelight,
} from '../../../services/aiService';

interface LightingPanelProps {
  project: Project;
  onUpdateImage: (newUrl: string, name?: string) => void;
  isAiProcessing: boolean;
  setIsAiProcessing: (loading: boolean) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

// Light Direction Vectors
const DIRECTION_PRESETS = [
  { id: 'top-left', label: 'Top-Left (Key)', angle: 315, icon: '↖️' },
  { id: 'overhead', label: 'Overhead / Top', angle: 0, icon: '⬆️' },
  { id: 'top-right', label: 'Top-Right (Key)', angle: 45, icon: '↗️' },
  { id: 'left-side', label: 'Side Left (90°)', angle: 270, icon: '⬅️' },
  { id: 'front-direct', label: 'Front Direct', angle: 180, icon: '⏺️' },
  { id: 'right-side', label: 'Side Right (90°)', angle: 90, icon: '➡️' },
  { id: 'bottom-up', label: 'Low Angle Under', angle: 180, icon: '⬇️' },
  { id: 'backlight-rim', label: 'Backlight / Rim', angle: 0, icon: '🔆' },
];

// Color Swatches
const LIGHT_COLORS = [
  { id: 'Natural Daylight', hex: '#ffffff', label: 'Neutral Daylight (5600K)' },
  { id: 'Golden Hour Sunset', hex: '#f59e0b', label: 'Golden Hour (3200K)' },
  { id: 'Warm Candlelight', hex: '#fbbf24', label: 'Candlelight (2400K)' },
  { id: 'Cool Blue Moonlight', hex: '#38bdf8', label: 'Lunar Blue (7500K)' },
  { id: 'Cyberpunk Cyan', hex: '#06b6d4', label: 'Electric Cyan' },
  { id: 'Neon Magenta', hex: '#ec4899', label: 'Neon Magenta' },
  { id: 'Emerald Glow', hex: '#10b981', label: 'Emerald Glow' },
];

// Studio Presets
const STUDIO_PRESETS = [
  {
    id: 'golden-hour',
    name: 'Golden-Hour Sunburst',
    badge: 'WARM SUN',
    icon: '🌅',
    desc: 'Low-angle warm amber sunlight with long atmospheric shadows and honey skin tones.',
    direction: 'top-left',
    angle: 315,
    intensity: 85,
    softness: 65,
    colorTemp: 60,
    colorName: 'Golden Hour Sunset',
    shadowStrength: 60,
    ambientFill: 40,
    faceLighting: 75,
    studioSetup: 'none',
    rim: { enabled: true, intensity: 65, color: 'Warm Golden' },
  },
  {
    id: 'rembrandt-portrait',
    name: 'Rembrandt Studio Master',
    badge: 'CLASSIC',
    icon: '🎨',
    desc: '45° key light creating the iconic triangle of light on shadow cheek with soft fill.',
    direction: 'top-left',
    angle: 315,
    intensity: 80,
    softness: 55,
    colorTemp: 10,
    colorName: 'Natural Daylight',
    shadowStrength: 75,
    ambientFill: 35,
    faceLighting: 90,
    studioSetup: 'rembrandt',
    rim: { enabled: true, intensity: 40, color: 'Warm White' },
  },
  {
    id: 'butterfly-beauty',
    name: 'Butterfly / High-Key Beauty',
    badge: 'BEAUTY',
    icon: '🦋',
    desc: 'Centered overhead key light producing sculpted cheekbones and flattering under-chin shadow.',
    direction: 'overhead',
    angle: 0,
    intensity: 85,
    softness: 80,
    colorTemp: 0,
    colorName: 'Natural Daylight',
    shadowStrength: 45,
    ambientFill: 60,
    faceLighting: 95,
    studioSetup: 'butterfly-beauty',
    rim: { enabled: false, intensity: 0, color: 'Crisp White' },
  },
  {
    id: 'dramatic-rim',
    name: 'Dramatic Edge & Rim Glow',
    badge: 'EDGE GLOW',
    icon: '✨',
    desc: 'Intense backlight creating a radiant halo tracing hair, shoulders, and silhouette.',
    direction: 'backlight-rim',
    angle: 0,
    intensity: 90,
    softness: 40,
    colorTemp: 0,
    colorName: 'Natural Daylight',
    shadowStrength: 80,
    ambientFill: 25,
    faceLighting: 50,
    studioSetup: 'none',
    rim: { enabled: true, intensity: 95, color: 'Crisp White' },
  },
  {
    id: 'night-ambient',
    name: 'Cinematic Blue Hour Night',
    badge: 'LUNAR',
    icon: '🌙',
    desc: 'Deep cool shadows with moody ambient illumination and soft moonlight highlights.',
    direction: 'top-right',
    angle: 45,
    intensity: 65,
    softness: 70,
    colorTemp: -50,
    colorName: 'Cool Blue Moonlight',
    shadowStrength: 85,
    ambientFill: 30,
    faceLighting: 60,
    studioSetup: 'none',
    rim: { enabled: true, intensity: 50, color: 'Ice Blue' },
  },
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Dual-Tone Neon',
    badge: 'NEON',
    icon: '⚡',
    desc: 'Vibrant electric cyan key light paired with vivid neon magenta rim edge lighting.',
    direction: 'left-side',
    angle: 270,
    intensity: 90,
    softness: 45,
    colorTemp: 0,
    colorName: 'Cyberpunk Cyan',
    shadowStrength: 80,
    ambientFill: 20,
    faceLighting: 80,
    studioSetup: 'split-dramatic',
    rim: { enabled: true, intensity: 90, color: 'Neon Magenta' },
  },
];

export const LightingPanel: React.FC<LightingPanelProps> = ({
  project,
  onUpdateImage,
  isAiProcessing,
  setIsAiProcessing,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'direction' | 'studio' | 'rim' | 'presets'>('direction');

  // Core Lighting State
  const [lightDirection, setLightDirection] = useState<string>('top-left');
  const [lightAngle, setLightAngle] = useState<number>(315);
  const [lightIntensity, setLightIntensity] = useState<number>(75);
  const [lightSoftness, setLightSoftness] = useState<number>(60);
  const [lightColorTemp, setLightColorTemp] = useState<number>(0);
  const [lightColorName, setLightColorName] = useState<string>('Natural Daylight');

  // Shadows & Ambient Fill
  const [shadowStrength, setShadowStrength] = useState<number>(65);
  const [ambientFill, setAmbientFill] = useState<number>(45);

  // Portrait & Face Modeling
  const [faceLighting, setFaceLighting] = useState<number>(70);
  const [studioSetup, setStudioSetup] = useState<'none' | 'rembrandt' | 'butterfly-beauty' | 'split-dramatic' | '3-point-studio'>('none');

  // Rim Lighting
  const [rimEnabled, setRimEnabled] = useState<boolean>(false);
  const [rimIntensity, setRimIntensity] = useState<number>(60);
  const [rimColor, setRimColor] = useState<string>('Warm Golden');

  // Custom Prompt Notes
  const [customNotes, setCustomNotes] = useState<string>('');

  const handleResetLighting = () => {
    setLightDirection('top-left');
    setLightAngle(315);
    setLightIntensity(75);
    setLightSoftness(60);
    setLightColorTemp(0);
    setLightColorName('Natural Daylight');
    setShadowStrength(65);
    setAmbientFill(45);
    setFaceLighting(70);
    setStudioSetup('none');
    setRimEnabled(false);
    setRimIntensity(60);
    setRimColor('Warm Golden');
    showToast('info', 'Lighting Reset', 'Restored default neutral key light setup.');
  };

  const handleApplyPreset = (preset: typeof STUDIO_PRESETS[0]) => {
    setLightDirection(preset.direction);
    setLightAngle(preset.angle);
    setLightIntensity(preset.intensity);
    setLightSoftness(preset.softness);
    setLightColorTemp(preset.colorTemp);
    setLightColorName(preset.colorName);
    setShadowStrength(preset.shadowStrength);
    setAmbientFill(preset.ambientFill);
    setFaceLighting(preset.faceLighting);
    setStudioSetup(preset.studioSetup as any);
    setRimEnabled(preset.rim.enabled);
    setRimIntensity(preset.rim.intensity);
    setRimColor(preset.rim.color);
    showToast('info', `Preset: ${preset.name}`, 'Lighting parameters loaded.');
  };

  const handleExecuteRelight = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    setIsAiProcessing(true);
    showToast(
      'info',
      'Computational Relighting',
      'Calculating 3D surface normals, light transport, specular falloff & ray-traced shadows...'
    );

    try {
      const base64 = canvas.toDataURL('image/png');
      const res = await requestAiRelight(base64, {
        lightDirection,
        lightAngle,
        lightIntensity,
        lightSoftness,
        lightColorTemp,
        lightColorName,
        shadowStrength,
        ambientFill,
        faceLighting,
        studioSetup,
        rimLighting: {
          enabled: rimEnabled,
          intensity: rimIntensity,
          color: rimColor,
        },
        customNotes: customNotes.trim() || undefined,
      });

      if (res.success && res.imageUrl) {
        onUpdateImage(res.imageUrl, `Relit_${lightDirection}_${project.name}`);
        showToast('success', 'Relighting Complete', 'Scene re-illuminated with photorealistic light physics.');
      } else {
        showToast('error', 'Relighting Failed', res.message || res.error);
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4 select-none text-slate-200">
      {/* Studio Header Banner */}
      <div className="bg-gradient-to-br from-amber-950/60 via-slate-900 to-indigo-950/60 border border-amber-500/30 p-3.5 rounded-2xl space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <SunMedium className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-300 uppercase tracking-wide">
                Computational Lighting Studio
              </div>
              <div className="text-[10px] text-slate-400">
                3D ray-traced relighting, light direction & studio shadow synthesis
              </div>
            </div>
          </div>

          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            3D RAYTRACED
          </span>
        </div>

        {/* Quick Reset & Status */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Key: <strong className="text-amber-300 capitalize">{lightDirection.replace('-', ' ')}</strong></span>
          </div>
          <button
            onClick={handleResetLighting}
            className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 font-semibold transition-colors"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Reset Setup</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold overflow-x-auto scrollbar-none shadow-inner">
        <button
          onClick={() => setActiveTab('direction')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'direction'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Light Direction</span>
        </button>

        <button
          onClick={() => setActiveTab('studio')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'studio'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Studio & Face</span>
        </button>

        <button
          onClick={() => setActiveTab('rim')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'rim'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Rim & Edge Glow</span>
        </button>

        <button
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'presets'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>AI Presets</span>
        </button>
      </div>

      {/* 1. SUB-PANEL: LIGHT DIRECTION & QUALITY */}
      {activeTab === 'direction' && (
        <div className="space-y-3.5 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>3D Light Position & Angle</span>
            </span>
            <span className="text-[11px] font-mono text-amber-400">{lightAngle}°</span>
          </label>

          {/* Interactive Direction Grid */}
          <div className="grid grid-cols-4 gap-1.5 text-xs">
            {DIRECTION_PRESETS.map((dir) => {
              const isSelected = lightDirection === dir.id;
              return (
                <button
                  key={dir.id}
                  onClick={() => {
                    setLightDirection(dir.id);
                    setLightAngle(dir.angle);
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all ${
                    isSelected
                      ? 'bg-slate-950 border-amber-500 text-amber-300 font-bold ring-1 ring-amber-500/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span className="text-base">{dir.icon}</span>
                  <span className="text-[10px] leading-tight line-clamp-1">{dir.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sliders for Intensity, Softness, Shadows & Fill */}
          <div className="space-y-2.5 pt-1">
            {/* Light Intensity */}
            <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Light Intensity</span>
                <span className="text-[11px] font-mono font-bold text-amber-400">{lightIntensity}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={lightIntensity}
                onChange={(e) => setLightIntensity(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Light Softness / Diffusion */}
            <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Light Softness & Diffusion</span>
                <span className="text-[10px] text-slate-400">
                  {lightSoftness < 30 ? 'Hard Fresnel' : lightSoftness > 75 ? 'Diffused Octabox' : 'Studio Softbox'}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={lightSoftness}
                onChange={(e) => setLightSoftness(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Shadow Strength */}
            <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Shadow Depth & Contrast</span>
                <span className="text-[11px] font-mono font-bold text-amber-400">{shadowStrength}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={shadowStrength}
                onChange={(e) => setShadowStrength(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Ambient Fill Light */}
            <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Ambient Fill Light</span>
                <span className="text-[11px] font-mono font-bold text-amber-400">{ambientFill}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={ambientFill}
                onChange={(e) => setAmbientFill(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Light Color Chromatic Cast */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Light Color Temperature / Tint:
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {LIGHT_COLORS.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => setLightColorName(col.id)}
                    className={`py-1.5 px-2 rounded-xl border text-[11px] flex items-center gap-1.5 transition-all ${
                      lightColorName === col.id
                        ? 'bg-slate-950 border-amber-500 text-white font-bold ring-1 ring-amber-500/50'
                        : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span className="truncate">{col.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUB-PANEL: STUDIO & FACE LIGHTING */}
      {activeTab === 'studio' && (
        <div className="space-y-3.5 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Studio Portraits & Face Modeling</span>
            </span>
          </div>

          {/* Studio Setup Architectures */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Studio Lighting Configuration:
            </label>
            <div className="space-y-1.5">
              {[
                {
                  id: 'none',
                  name: 'Standard Computational Key',
                  desc: 'Natural single-source key illumination with balanced shadows.',
                },
                {
                  id: 'rembrandt',
                  name: 'Rembrandt Master Lighting',
                  desc: '45° classic key light creating the iconic small triangle of light on the shadow cheek.',
                },
                {
                  id: 'butterfly-beauty',
                  name: 'Paramount / Butterfly Beauty',
                  desc: 'High-key overhead light creating symmetrical butterfly shadow under nose and cheek sculpt.',
                },
                {
                  id: 'split-dramatic',
                  name: '90° Split Chiaroscuro',
                  desc: 'Dramatic split lighting illuminating exactly half the face with high-contrast shadow.',
                },
                {
                  id: '3-point-studio',
                  name: 'Complete 3-Point Studio Rig',
                  desc: 'Professional combination of Key Light, Fill Light, and Hair Separation Rim Light.',
                },
              ].map((setup) => {
                const isSelected = studioSetup === setup.id;
                return (
                  <button
                    key={setup.id}
                    onClick={() => setStudioSetup(setup.id as any)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-950 border-amber-500 ring-1 ring-amber-500/40 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-amber-300">{setup.name}</div>
                    <div className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{setup.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Face Sculpting Slider */}
          <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Facial Sculpting & Catchlights</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-400">{faceLighting}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={faceLighting}
              onChange={(e) => setFaceLighting(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      )}

      {/* 3. SUB-PANEL: RIM & EDGE GLOW */}
      {activeTab === 'rim' && (
        <div className="space-y-3.5 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Rim Light & Silhouette Separation</span>
            </span>
          </div>

          <label className="flex items-center justify-between cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="space-y-0.5">
              <div className="text-slate-200 font-bold text-[11px]">Enable Rim & Hair Separation Light</div>
              <div className="text-[9px] text-slate-400">Traces silhouettes and hair edges with luminous edge glow.</div>
            </div>
            <input
              type="checkbox"
              checked={rimEnabled}
              onChange={(e) => setRimEnabled(e.target.checked)}
              className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
            />
          </label>

          {rimEnabled && (
            <div className="space-y-3 pt-1">
              {/* Rim Intensity */}
              <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Rim Light Intensity</span>
                  <span className="text-[11px] font-mono font-bold text-amber-400">{rimIntensity}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={rimIntensity}
                  onChange={(e) => setRimIntensity(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Rim Color */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Rim Light Color:
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    'Warm Golden',
                    'Crisp White',
                    'Ice Blue',
                    'Neon Magenta',
                    'Electric Cyan',
                    'Sunset Coral',
                  ].map((c) => (
                    <button
                      key={c}
                      onClick={() => setRimColor(c)}
                      className={`py-1.5 px-2 rounded-xl border text-[11px] flex items-center justify-between transition-all ${
                        rimColor === c
                          ? 'bg-slate-950 border-amber-500 text-white font-bold ring-1 ring-amber-500/50'
                          : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{c}</span>
                      {rimColor === c && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. SUB-PANEL: AI PRESETS */}
      {activeTab === 'presets' && (
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            1-Click Computational Lighting Scenarios:
          </label>

          <div className="space-y-2">
            {STUDIO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className="w-full bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-3 rounded-2xl text-left transition-all flex items-start justify-between group shadow-sm"
              >
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{preset.icon}</span>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                      {preset.name}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{preset.desc}</p>
                </div>

                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-amber-400 group-hover:border-amber-500/40 transition-all shrink-0">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Guidance Prompt Box */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Custom Relighting Direction (Optional):
        </label>
        <input
          type="text"
          placeholder="e.g. Dramatic low-angle cinematic sunset beam through window"
          value={customNotes}
          onChange={(e) => setCustomNotes(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
        />
      </div>

      {/* Primary Action Button */}
      <button
        onClick={handleExecuteRelight}
        disabled={isAiProcessing}
        className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-400 hover:via-orange-500 hover:to-rose-500 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-amber-600/30 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <Sparkles className={`w-4 h-4 ${isAiProcessing ? 'animate-spin' : ''}`} />
        <span>{isAiProcessing ? 'Synthesizing 3D Lighting & Shadows...' : 'Execute 3D Scene Relight'}</span>
      </button>
    </div>
  );
};
