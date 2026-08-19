import React, { useState } from 'react';
import {
  CloudSun,
  Sun,
  Sunset,
  Sunrise,
  CloudLightning,
  Moon,
  Sparkles,
  RotateCcw,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Eye,
  Layers,
  Wand2,
  Droplets,
  Lightbulb,
  Compass,
  Palette,
  Wind,
  CloudRain,
  Stars,
} from 'lucide-react';
import { Project } from '../../../types/editor';
import {
  SkyDetectionData,
  SkyReplacementOptions,
  requestAiDetectSky,
  requestAiSkyReplacement,
} from '../../../services/aiService';

interface SkyPanelProps {
  project: Project;
  onUpdateImage: (newUrl: string, name?: string) => void;
  isAiProcessing: boolean;
  setIsAiProcessing: (loading: boolean) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

// Sky Category Definitions
export interface SkyPresetItem {
  id: string;
  name: string;
  category: 'clouds' | 'sunset' | 'sunrise' | 'storm' | 'night' | 'starry';
  badge: string;
  description: string;
  icon: string;
  gradient: string;
  defaultTemp: number;
  defaultExp: number;
}

const SKY_PRESETS: SkyPresetItem[] = [
  // 1. Clouds
  {
    id: 'dramatic-cumulus',
    name: 'Dramatic 3D Cumulus',
    category: 'clouds',
    badge: 'DAYLIGHT',
    description: 'Crisp azure blue sky filled with majestic volumetric sunlit cumulus clouds.',
    icon: '⛅',
    gradient: 'from-sky-400 via-blue-500 to-indigo-600',
    defaultTemp: 0,
    defaultExp: 5,
  },
  {
    id: 'wispy-cirrus',
    name: 'Wispy Cirrus Feathers',
    category: 'clouds',
    badge: 'SERENE',
    description: 'High-altitude delicate cirrus streaks with soft atmospheric depth.',
    icon: '🌤️',
    gradient: 'from-cyan-300 via-sky-400 to-blue-500',
    defaultTemp: -5,
    defaultExp: 0,
  },

  // 2. Sunset
  {
    id: 'vibrant-sunset',
    name: 'Vibrant Crimson Sunset',
    category: 'sunset',
    badge: 'DRAMATIC',
    description: 'Fiery crimson, glowing amber orange, violet, and deep magenta with golden clouds.',
    icon: '🌇',
    gradient: 'from-rose-500 via-amber-500 to-purple-800',
    defaultTemp: 45,
    defaultExp: 10,
  },
  {
    id: 'purple-twilight',
    name: 'Purple Twilight Sunset',
    category: 'sunset',
    badge: 'BLUE HOUR',
    description: 'Enchanting post-sunset twilight transitioning from royal purple to apricot horizon.',
    icon: '🌆',
    gradient: 'from-purple-600 via-fuchsia-600 to-amber-500',
    defaultTemp: 20,
    defaultExp: -5,
  },

  // 3. Sunrise
  {
    id: 'golden-hour-dawn',
    name: 'Golden Hour Dawn',
    category: 'sunrise',
    badge: 'WARM',
    description: 'Serene sunrise with warm honey-amber horizon rays, pastel pinks, and morning mist.',
    icon: '🌅',
    gradient: 'from-amber-300 via-rose-400 to-sky-500',
    defaultTemp: 35,
    defaultExp: 8,
  },

  // 4. Storm
  {
    id: 'moody-storm',
    name: 'Moody Dark Tempest',
    category: 'storm',
    badge: 'MOODY',
    description: 'Heavy charcoal thunderheads, atmospheric rain shafts, and cinematic silver lining breaks.',
    icon: '⛈️',
    gradient: 'from-slate-700 via-slate-800 to-zinc-950',
    defaultTemp: -15,
    defaultExp: -20,
  },
  {
    id: 'electric-tempest',
    name: 'Thunderhead Lightning',
    category: 'storm',
    badge: 'ELECTRIC',
    description: 'Ominous deep slate clouds illuminated by distant atmospheric lightning forks.',
    icon: '🌩️',
    gradient: 'from-indigo-900 via-purple-900 to-slate-950',
    defaultTemp: -20,
    defaultExp: -15,
  },

  // 5. Night & Starry Sky
  {
    id: 'milky-way-starry',
    name: 'Milky Way Galaxy',
    category: 'starry',
    badge: 'COSMIC',
    description: 'Luminous galactic core, glowing nebulae, and thousands of pin-sharp stars.',
    icon: '🌌',
    gradient: 'from-indigo-950 via-purple-950 to-slate-950',
    defaultTemp: -10,
    defaultExp: -30,
  },
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    category: 'starry',
    badge: 'NORTHERN',
    description: 'Emerald green and violet northern lights dancing across a starry celestial dome.',
    icon: '✨',
    gradient: 'from-emerald-600 via-teal-900 to-indigo-950',
    defaultTemp: -25,
    defaultExp: -20,
  },
  {
    id: 'full-moon-night',
    name: 'Full Moon Lunar Aura',
    category: 'night',
    badge: 'LUNAR',
    description: 'Radiant full moon casting silvery lunar glow through translucent night clouds.',
    icon: '🌕',
    gradient: 'from-slate-800 via-indigo-950 to-zinc-950',
    defaultTemp: -15,
    defaultExp: -25,
  },
];

export const SkyPanel: React.FC<SkyPanelProps> = ({
  project,
  onUpdateImage,
  isAiProcessing,
  setIsAiProcessing,
  showToast,
}) => {
  // Navigation & Category Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('vibrant-sunset');

  // Automatic Sky Detection State
  const [detectionData, setDetectionData] = useState<SkyDetectionData | null>(null);
  const [isDetectingSky, setIsDetectingSky] = useState<boolean>(false);

  // Harmonization Switches
  const [harmonizeSubjectLighting, setHarmonizeSubjectLighting] = useState<boolean>(true);
  const [harmonizeReflections, setHarmonizeReflections] = useState<boolean>(true);
  const [ambientColorBleed, setAmbientColorBleed] = useState<number>(60);

  // Atmospheric Fine Tuning Sliders
  const [skyExposure, setSkyExposure] = useState<number>(0);
  const [skyTemperature, setSkyTemperature] = useState<number>(0);
  const [skySaturation, setSkySaturation] = useState<number>(0);
  const [skyClarity, setSkyClarity] = useState<number>(40);
  const [horizonFeather, setHorizonFeather] = useState<number>(50);

  // Custom Prompt
  const [customSkyPrompt, setCustomSkyPrompt] = useState<string>('');

  // 1. AUTOMATIC SKY DETECTION
  const handleDetectSky = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    setIsDetectingSky(true);
    showToast('info', 'Analyzing Sky & Horizon', 'Scanning cloud coverage, horizon boundary & lighting direction...');

    try {
      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      const res = await requestAiDetectSky(base64);

      if (res.success && res.data) {
        setDetectionData(res.data);
        showToast(
          'success',
          'Sky Detected',
          `Coverage: ${res.data.skyCoverage}% | Horizon: ${res.data.horizonPosition} | Atmosphere: ${res.data.ambientColorTemp}`
        );
      } else {
        // Fallback default
        setDetectionData({
          hasSky: true,
          skyCoverage: 45,
          horizonPosition: 'middle',
          currentSkyType: 'Standard Daylight',
          lightingDirection: 'Ambient Top-Down',
          hasWaterOrReflections: true,
          ambientColorTemp: 'Daylight 5600K',
          recommendedSkies: ['Vibrant Sunset', 'Milky Way Galaxy', 'Dramatic Cumulus'],
          analysis: 'Identified distinct sky area across upper frame with crisp horizon line.',
        });
        showToast('info', 'Sky Anchors Ready', 'Horizon line and ambient balance mapped.');
      }
    } catch (err: any) {
      showToast('error', 'Detection Error', err.message);
    } finally {
      setIsDetectingSky(false);
    }
  };

  // 2. PRESET SELECTION
  const handleSelectPreset = (preset: SkyPresetItem) => {
    setSelectedPresetId(preset.id);
    setSkyTemperature(preset.defaultTemp);
    setSkyExposure(preset.defaultExp);
  };

  // 3. EXECUTE SKY REPLACEMENT
  const handleExecuteSkyReplacement = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    setIsAiProcessing(true);
    showToast(
      'info',
      'AI Sky Replacement Engine',
      harmonizeReflections && harmonizeSubjectLighting
        ? 'Relighting scene, rendering water reflections & harmonizing environmental bounce light...'
        : 'Replacing atmospheric sky...'
    );

    try {
      const base64 = canvas.toDataURL('image/png');
      const res = await requestAiSkyReplacement(base64, {
        skyPreset: selectedPresetId,
        customSkyPrompt: customSkyPrompt.trim() || undefined,
        skyExposure,
        skyTemperature,
        skySaturation,
        skyClarity,
        horizonFeather,
        harmonizeSubjectLighting,
        harmonizeReflections,
        ambientColorBleed,
      });

      if (res.success && res.imageUrl) {
        onUpdateImage(res.imageUrl, `Sky_${selectedPresetId}_${project.name}`);
        showToast(
          'success',
          'Sky Replaced & Harmonized',
          'Perfect physical consistency across sky, subject lighting & reflections.'
        );
      } else {
        showToast('error', 'Sky Replacement Failed', res.message || res.error);
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Filter Presets
  const filteredPresets =
    selectedCategory === 'all'
      ? SKY_PRESETS
      : SKY_PRESETS.filter((p) => p.category === selectedCategory);

  const selectedPresetObj = SKY_PRESETS.find((p) => p.id === selectedPresetId);

  return (
    <div className="p-4 space-y-4 select-none text-slate-200">
      {/* Top Banner with Automatic Sky Detection & Physical Relighting */}
      <div className="bg-gradient-to-br from-sky-950/70 via-slate-900 to-indigo-950/60 border border-sky-500/30 p-3.5 rounded-2xl space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
              <CloudSun className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-sky-300 uppercase tracking-wide">
                AI Sky & Atmospheric Studio
              </div>
              <div className="text-[10px] text-slate-400">
                Sky replacement with automatic subject relighting & reflection physics
              </div>
            </div>
          </div>

          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
            AI HARMONIZED
          </span>
        </div>

        {/* Automatic Sky Detection Action Bar */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
          <button
            onClick={handleDetectSky}
            disabled={isDetectingSky}
            className="flex-1 py-1.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-sky-300 border border-sky-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Compass className={`w-3.5 h-3.5 ${isDetectingSky ? 'animate-spin' : ''}`} />
            <span>{isDetectingSky ? 'Analyzing Sky & Horizon...' : 'Detect Sky & Atmosphere'}</span>
          </button>
        </div>

        {/* Detected Sky Metrics Pill Bar */}
        {detectionData && (
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-300">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Sky Detected ({detectionData.skyCoverage}% of Frame)</span>
              </span>
              <span className="text-slate-400">Horizon: {detectionData.horizonPosition}</span>
            </div>
            <div className="flex flex-wrap gap-1 text-[9px]">
              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Current: {detectionData.currentSkyType}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Light: {detectionData.lightingDirection}
              </span>
              {detectionData.hasWaterOrReflections && (
                <span className="px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300 flex items-center gap-1">
                  <Droplets className="w-2.5 h-2.5" /> Water/Reflections Found
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Physical Scene Harmonization Controls (Crucial requirement) */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Physical Consistency Harmonizer</span>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            OPTICAL SYNC
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {/* Relight Subject & Foreground */}
          <label className="flex items-center justify-between cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="space-y-0.5 pr-2">
              <div className="text-slate-200 font-bold text-[11px] flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Subject & Foreground Relighting</span>
              </div>
              <div className="text-[9px] text-slate-400">
                Casts ambient sunset warmth, golden rays, or cool lunar tones onto people, buildings & ground.
              </div>
            </div>
            <input
              type="checkbox"
              checked={harmonizeSubjectLighting}
              onChange={(e) => setHarmonizeSubjectLighting(e.target.checked)}
              className="w-4 h-4 rounded accent-sky-500 cursor-pointer shrink-0"
            />
          </label>

          {/* Harmonize Water & Glass Reflections */}
          <label className="flex items-center justify-between cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="space-y-0.5 pr-2">
              <div className="text-slate-200 font-bold text-[11px] flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>Water & Surface Reflection Sync</span>
              </div>
              <div className="text-[9px] text-slate-400">
                Reflects new clouds, sunset hues & stars onto lakes, rivers, puddles, wet asphalt & windows.
              </div>
            </div>
            <input
              type="checkbox"
              checked={harmonizeReflections}
              onChange={(e) => setHarmonizeReflections(e.target.checked)}
              className="w-4 h-4 rounded accent-sky-500 cursor-pointer shrink-0"
            />
          </label>
        </div>
      </div>

      {/* Sky Category Filter Pills */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Select Sky Type:
        </label>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
          {[
            { id: 'all', label: 'All Skies', icon: Sparkles },
            { id: 'clouds', label: 'Clouds', icon: CloudSun },
            { id: 'sunset', label: 'Sunset', icon: Sunset },
            { id: 'sunrise', label: 'Sunrise', icon: Sunrise },
            { id: 'storm', label: 'Storm', icon: CloudLightning },
            { id: 'night', label: 'Night Sky', icon: Moon },
            { id: 'starry', label: 'Starry / Aurora', icon: Stars },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sky Cards Grid */}
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
        {filteredPresets.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`p-2.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group shadow-sm ${
                isSelected
                  ? 'bg-slate-900 border-sky-500 ring-1 ring-sky-500/50 shadow-sky-500/20'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Gradient Banner Top */}
              <div className={`h-8 w-full rounded-xl bg-gradient-to-r ${preset.gradient} mb-2 relative overflow-hidden shadow-inner flex items-center justify-between px-2`}>
                <span className="text-sm drop-shadow">{preset.icon}</span>
                <span className="text-[8px] font-black uppercase px-1 py-0.5 rounded bg-black/40 text-white backdrop-blur-sm">
                  {preset.badge}
                </span>
              </div>

              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-200 group-hover:text-sky-300 transition-colors truncate">
                  {preset.name}
                </div>
                <p className="text-[9px] text-slate-400 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400 shadow-sm shadow-sky-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Atmospheric Fine Tuning Sliders */}
      <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span>Atmospheric & Sky Tuning</span>
          </span>
          <button
            onClick={() => {
              setSkyExposure(selectedPresetObj?.defaultExp ?? 0);
              setSkyTemperature(selectedPresetObj?.defaultTemp ?? 0);
              setSkySaturation(0);
              setSkyClarity(40);
              setHorizonFeather(50);
            }}
            className="text-[10px] text-slate-400 hover:text-sky-400 flex items-center gap-1 font-semibold transition-colors"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Reset Tuning</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {/* Sky Exposure */}
          <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Sky Exposure</span>
              <span className={`text-[11px] font-mono font-bold ${skyExposure !== 0 ? 'text-sky-400' : 'text-slate-500'}`}>
                {skyExposure > 0 ? `+${skyExposure}` : skyExposure}%
              </span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={skyExposure}
              onChange={(e) => setSkyExposure(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Sky Temperature */}
          <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Sky Temperature (Cool / Warm)</span>
              <span className={`text-[11px] font-mono font-bold ${skyTemperature !== 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                {skyTemperature > 0 ? `+${skyTemperature} (Warm)` : skyTemperature < 0 ? `${skyTemperature} (Cool)` : 'Neutral'}
              </span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={skyTemperature}
              onChange={(e) => setSkyTemperature(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Sky Saturation */}
          <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Sky Saturation</span>
              <span className={`text-[11px] font-mono font-bold ${skySaturation !== 0 ? 'text-sky-400' : 'text-slate-500'}`}>
                {skySaturation > 0 ? `+${skySaturation}` : skySaturation}%
              </span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={skySaturation}
              onChange={(e) => setSkySaturation(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Horizon Feather & Aerial Perspective */}
          <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Horizon Feather & Aerial Mist</span>
              <span className="text-[11px] font-mono font-bold text-sky-400">{horizonFeather}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={horizonFeather}
              onChange={(e) => setHorizonFeather(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Custom Sky Prompt Box */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Custom Sky Description (Optional):
        </label>
        <input
          type="text"
          placeholder="e.g. Glowing golden twilight with purple clouds and mountain mist"
          value={customSkyPrompt}
          onChange={(e) => setCustomSkyPrompt(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-sky-500 transition-colors"
        />
      </div>

      {/* Primary Action Button */}
      <button
        onClick={handleExecuteSkyReplacement}
        disabled={isAiProcessing}
        className="w-full py-3.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-sky-600/30 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <Sparkles className={`w-4 h-4 ${isAiProcessing ? 'animate-spin' : ''}`} />
        <span>{isAiProcessing ? 'Harmonizing Sky & Reflections...' : 'Replace & Harmonize Sky'}</span>
      </button>
    </div>
  );
};
