import React, { useState } from 'react';
import {
  Sparkles,
  Film,
  Tv,
  Zap,
  Flame,
  Palette,
  SunMedium,
  Sun,
  Eye,
  Sliders,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Camera,
  Layers,
  Wand2,
  Grid,
  Radio,
} from 'lucide-react';
import { Project } from '../../../types/editor';
import {
  EffectStudioOptions,
  requestAiEffectsStudio,
} from '../../../services/aiService';

interface EffectsPanelProps {
  project: Project;
  onUpdateImage: (newUrl: string, name?: string) => void;
  isAiProcessing: boolean;
  setIsAiProcessing: (loading: boolean) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

interface EffectItem {
  id: string;
  name: string;
  icon: string;
  badge: string;
  desc: string;
  secondaryLabel?: string;
  defaultIntensity?: number;
  defaultSecondary?: number;
}

const EFFECT_CATEGORIES = [
  { id: 'film-vintage', label: 'Film & Vintage', icon: Film },
  { id: 'cinematic-cyber', label: 'Cinematic & Cyber', icon: Zap },
  { id: 'analog-digital', label: 'VHS & Glitch', icon: Tv },
  { id: 'art-media', label: 'Art & Sketch', icon: Palette },
  { id: 'optical-light', label: 'Optical & Flares', icon: SunMedium },
  { id: 'retro-textures', label: 'Textures & Duotone', icon: Layers },
];

const EFFECTS_REGISTRY: Record<string, EffectItem[]> = {
  'film-vintage': [
    {
      id: 'film-kodak-portra',
      name: 'Kodak Portra 400',
      icon: '🎞️',
      badge: '35MM',
      desc: 'Iconic warm portrait film with fine organic grain, soft pastel highlights, and creamy skin tones.',
      secondaryLabel: 'Film Grain Density',
      defaultIntensity: 85,
      defaultSecondary: 45,
    },
    {
      id: 'film-fujifilm-provia',
      name: 'Fujifilm Provia 100F',
      icon: '🏔️',
      badge: 'SLIDE',
      desc: 'Punchy slide film with rich chromatic clarity, vibrant sky blues, and velvety deep blacks.',
      secondaryLabel: 'Color Richness',
      defaultIntensity: 80,
      defaultSecondary: 60,
    },
    {
      id: 'film-ilford-hp5',
      name: 'Ilford HP5 Plus 400',
      icon: '🏁',
      badge: 'B&W',
      desc: 'Legendary silver-halide monochrome film with rich midtone contrast and authentic textured grain.',
      secondaryLabel: 'Silver Grain Texture',
      defaultIntensity: 90,
      defaultSecondary: 70,
    },
    {
      id: 'vintage-1970s',
      name: '1970s Polaroid Super 8',
      icon: '📷',
      badge: '70s',
      desc: 'Faded warm dye couplers, gentle edge halation, amber cast, and nostalgic vignette.',
      secondaryLabel: 'Color Fade & Halation',
      defaultIntensity: 80,
      defaultSecondary: 55,
    },
    {
      id: 'sepia-antique',
      name: 'Antique Sepia Daguerreotype',
      icon: '📜',
      badge: 'SEPIA',
      desc: '19th-century chocolate-brown and warm ochre tones with delicate aged patina.',
      secondaryLabel: 'Patina & Weathering',
      defaultIntensity: 85,
      defaultSecondary: 50,
    },
    {
      id: 'black-and-white-noir',
      name: 'Film Noir Silver-Gelatin',
      icon: '🕶️',
      badge: 'NOIR',
      desc: 'Chiaroscuro high-contrast black and white with deep inky shadows and crisp specular whites.',
      secondaryLabel: 'Chiaroscuro Contrast',
      defaultIntensity: 90,
      defaultSecondary: 65,
    },
  ],

  'cinematic-cyber': [
    {
      id: 'cinematic-teal-orange',
      name: 'Blockbuster Teal & Orange',
      icon: '🎬',
      badge: 'CINEMA',
      desc: 'Hollywood cinematic color grade with warm amber skin tones balanced against deep cyan shadows.',
      secondaryLabel: 'Color Separation',
      defaultIntensity: 85,
      defaultSecondary: 60,
    },
    {
      id: 'cinematic-moody-anomorphic',
      name: 'Moody Anamorphic Cinema',
      icon: '🎥',
      badge: '2.39:1',
      desc: 'Atmospheric widescreen cinema tonality with misty shadows and subtle horizontal light streaks.',
      secondaryLabel: 'Atmospheric Mist',
      defaultIntensity: 80,
      defaultSecondary: 50,
    },
    {
      id: 'cyberpunk-neon-city',
      name: 'Cyberpunk Night City',
      icon: '⚡',
      badge: 'CYBER',
      desc: 'Vibrant neon cyan & magenta street illumination with wet asphalt reflections.',
      secondaryLabel: 'Neon Saturation',
      defaultIntensity: 90,
      defaultSecondary: 75,
    },
    {
      id: 'neon-glow-night',
      name: 'Fluorescent Neon Glow',
      icon: '💡',
      badge: 'NEON',
      desc: 'Intense glowing neon halos around contours against a deep cinematic low-key backdrop.',
      secondaryLabel: 'Glow Radius',
      defaultIntensity: 85,
      defaultSecondary: 70,
    },
    {
      id: 'retro-1980s-synth',
      name: '1980s Synthwave Sunset',
      icon: '🌴',
      badge: 'SYNTH',
      desc: 'Dual-tone magenta and cyan gradient lighting with dream bloom and retro glow.',
      secondaryLabel: 'Retro Dream Bloom',
      defaultIntensity: 85,
      defaultSecondary: 60,
    },
  ],

  'analog-digital': [
    {
      id: 'vhs-tape-retro',
      name: '1990s VHS Tape Artifacts',
      icon: '📼',
      badge: 'VHS',
      desc: 'Authentic magnetic tape tracking noise, horizontal scanline jitter, and NTSC color bleeding.',
      secondaryLabel: 'Tape Glitch Noise',
      defaultIntensity: 80,
      defaultSecondary: 65,
    },
    {
      id: 'digital-glitch-datamosh',
      name: 'Digital Datamosh Glitch',
      icon: '👾',
      badge: 'GLITCH',
      desc: 'RGB channel split displacement, pixel corruption slices, and digital compression artifacting.',
      secondaryLabel: 'RGB Channel Shift',
      defaultIntensity: 85,
      defaultSecondary: 70,
    },
    {
      id: 'halftone-comic-print',
      name: 'Pop-Art Halftone Print',
      icon: '🗞️',
      badge: 'HALFTONE',
      desc: 'Vintage CMYK Ben-Day dots pattern with stippled newsprint texture and comic book aesthetic.',
      secondaryLabel: 'Dot Grid Density',
      defaultIntensity: 90,
      defaultSecondary: 75,
    },
    {
      id: 'pixelation-8bit',
      name: 'Retro 8-Bit Pixelation',
      icon: '🕹️',
      badge: '8-BIT',
      desc: 'Stylized arcade pixel mosaic grid with retro indexed color palette.',
      secondaryLabel: 'Pixel Grid Size',
      defaultIntensity: 80,
      defaultSecondary: 50,
    },
    {
      id: 'posterize-pop-art',
      name: 'Graphic Posterization',
      icon: '🎨',
      badge: 'POSTER',
      desc: 'Reduces tonal levels into bold graphic color planes and sharp illustrative contours.',
      secondaryLabel: 'Tonal Quantization',
      defaultIntensity: 85,
      defaultSecondary: 60,
    },
  ],

  'art-media': [
    {
      id: 'sketch-pencil-graphite',
      name: 'Graphite Pencil Sketch',
      icon: '✏️',
      badge: 'SKETCH',
      desc: 'Hand-drawn fine pencil cross-hatching with delicate contour line work and paper texture.',
      secondaryLabel: 'Cross-Hatch Density',
      defaultIntensity: 90,
      defaultSecondary: 70,
    },
    {
      id: 'sketch-charcoal-dramatic',
      name: 'Dramatic Fine Charcoal',
      icon: '🖌️',
      badge: 'CHARCOAL',
      desc: 'Bold expressive carbon strokes, smudged shadows, and raw textured drawing paper.',
      secondaryLabel: 'Smudge Shading',
      defaultIntensity: 90,
      defaultSecondary: 75,
    },
    {
      id: 'oil-painting-impressionist',
      name: 'Impressionist Oil Painting',
      icon: '🖼️',
      badge: 'OIL',
      desc: 'Visible textured impasto brushstrokes, rich blended pigments, and woven canvas texture.',
      secondaryLabel: 'Impasto Texture',
      defaultIntensity: 85,
      defaultSecondary: 65,
    },
    {
      id: 'watercolor-aquarelle',
      name: 'Luminous Watercolor Wash',
      icon: '🎨',
      badge: 'AQUARELLE',
      desc: 'Wet-on-wet fluid pigment blooms, soft organic color bleeds, and cold-press paper grain.',
      secondaryLabel: 'Pigment Bloom Bleed',
      defaultIntensity: 85,
      defaultSecondary: 70,
    },
    {
      id: 'cartoon-anime-cel',
      name: 'Modern Anime / Cel Shade',
      icon: '✨',
      badge: 'ANIME',
      desc: 'Clean ink contour lines with vibrant flat cel shading and polished anime specular highlights.',
      secondaryLabel: 'Ink Line Sharpness',
      defaultIntensity: 85,
      defaultSecondary: 60,
    },
  ],

  'optical-light': [
    {
      id: 'hdr-hyper-dynamic',
      name: 'Hyper-Dynamic HDR Pro',
      icon: '🌟',
      badge: 'HDR',
      desc: 'Expanded dynamic range with deep shadow recovery, clear highlights, and rich micro-contrast.',
      secondaryLabel: 'Micro-Contrast Clarity',
      defaultIntensity: 80,
      defaultSecondary: 65,
    },
    {
      id: 'bloom-dreamy-glow',
      name: 'Pro-Mist Dreamy Bloom',
      icon: '✨',
      badge: 'BLOOM',
      desc: 'Organic highlight diffusion bloom that softens digital sharpness into an ethereal glow.',
      secondaryLabel: 'Bloom Halo Radius',
      defaultIntensity: 75,
      defaultSecondary: 60,
    },
    {
      id: 'light-leak-analog',
      name: 'Analog Warm Light Leak',
      icon: '🔥',
      badge: 'LIGHT LEAK',
      desc: 'Fiery amber and ruby-red light streaks bleeding organically from the frame edge.',
      secondaryLabel: 'Streak Warmth & Flare',
      defaultIntensity: 80,
      defaultSecondary: 70,
    },
    {
      id: 'lens-flare-anamorphic',
      name: 'Anamorphic Lens Flare',
      icon: '💫',
      badge: 'FLARE',
      desc: 'Horizontal blue and gold optical streak flares with ray-traced glass refraction rings.',
      secondaryLabel: 'Flare Streak Length',
      defaultIntensity: 85,
      defaultSecondary: 65,
    },
    {
      id: 'prism-rainbow-refraction',
      name: 'Prism Rainbow Dispersion',
      icon: '🌈',
      badge: 'PRISM',
      desc: 'Prismatic crystal glass refraction casting spectral rainbow flares across the composition.',
      secondaryLabel: 'Spectral Dispersion',
      defaultIntensity: 80,
      defaultSecondary: 60,
    },
    {
      id: 'chromatic-aberration-rgb',
      name: 'Optical Chromatic Dispersion',
      icon: '🔴',
      badge: 'RGB SPLIT',
      desc: 'Edge RGB dispersion (red/cyan and blue/yellow color fringing) on silhouette contours.',
      secondaryLabel: 'Fringe Dispersion',
      defaultIntensity: 75,
      defaultSecondary: 50,
    },
  ],

  'retro-textures': [
    {
      id: 'duotone-editorial',
      name: 'Editorial Duotone Gradient',
      icon: '🎭',
      badge: 'DUOTONE',
      desc: 'Maps the tonal range into two striking contrasting artistic hues with clean separation.',
      secondaryLabel: 'Duotone Saturation',
      defaultIntensity: 85,
      defaultSecondary: 70,
    },
    {
      id: 'analog-grain-heavy',
      name: 'Heavy 35mm Silver Halide Grain',
      icon: '🎞️',
      badge: 'GRAIN',
      desc: 'Authentic non-uniform silver halide grain particles across shadows and midtones.',
      secondaryLabel: 'Grain Particle Roughness',
      defaultIntensity: 80,
      defaultSecondary: 75,
    },
  ],
};

export const EffectsPanel: React.FC<EffectsPanelProps> = ({
  project,
  onUpdateImage,
  isAiProcessing,
  setIsAiProcessing,
  showToast,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('film-vintage');
  const [selectedEffectId, setSelectedEffectId] = useState<string>('film-kodak-portra');
  const [intensity, setIntensity] = useState<number>(85);
  const [secondaryIntensity, setSecondaryIntensity] = useState<number>(50);
  const [customDirectives, setCustomDirectives] = useState<string>('');

  const currentEffects = EFFECTS_REGISTRY[activeCategory] || [];
  const selectedEffect =
    currentEffects.find((e) => e.id === selectedEffectId) ||
    Object.values(EFFECTS_REGISTRY)
      .flat()
      .find((e) => e.id === selectedEffectId) ||
    currentEffects[0];

  const handleSelectEffect = (effect: EffectItem) => {
    setSelectedEffectId(effect.id);
    if (effect.defaultIntensity) setIntensity(effect.defaultIntensity);
    if (effect.defaultSecondary) setSecondaryIntensity(effect.defaultSecondary);
    showToast('info', `Selected: ${effect.name}`, 'Adjust effect intensity or execute application.');
  };

  const handleApplyEffect = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    setIsAiProcessing(true);
    showToast(
      'info',
      'Applying Photographic Effect',
      `Synthesizing ${selectedEffect?.name || 'effect'} with neural texture & optical grading...`
    );

    try {
      const base64 = canvas.toDataURL('image/png');
      const res = await requestAiEffectsStudio(base64, {
        category: activeCategory as any,
        effectId: selectedEffectId,
        intensity,
        secondaryIntensity,
        customDirectives: customDirectives.trim() || undefined,
      });

      if (res.success && res.imageUrl) {
        onUpdateImage(res.imageUrl, `Fx_${selectedEffectId}_${project.name}`);
        showToast('success', 'Effect Applied', `${selectedEffect?.name} rendered successfully.`);
      } else {
        showToast('error', 'Effect Failed', res.message || res.error);
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4 select-none text-slate-200">
      {/* Studio Header */}
      <div className="bg-gradient-to-br from-pink-950/60 via-slate-900 to-indigo-950/60 border border-pink-500/30 p-3.5 rounded-2xl space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-pink-300 uppercase tracking-wide">
                Effects & Optics Mega-Studio
              </div>
              <div className="text-[10px] text-slate-400">
                Film stocks, Vintage, Cyberpunk, VHS glitch, Art media & Prism flares
              </div>
            </div>
          </div>

          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
            28+ EFFECTS
          </span>
        </div>
      </div>

      {/* Categories Sub-Tabs */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold overflow-x-auto scrollbar-none shadow-inner">
        {EFFECT_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                const firstEffect = EFFECTS_REGISTRY[cat.id]?.[0];
                if (firstEffect) {
                  setSelectedEffectId(firstEffect.id);
                  if (firstEffect.defaultIntensity) setIntensity(firstEffect.defaultIntensity);
                  if (firstEffect.defaultSecondary) setSecondaryIntensity(firstEffect.defaultSecondary);
                }
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-md shadow-pink-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Effects Grid for Active Category */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-0.5">
          <span>Choose Effect / Stock ({currentEffects.length})</span>
          <span className="text-[10px] text-pink-400 font-mono">Neural Grade</span>
        </div>

        <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {currentEffects.map((eff) => {
            const isSelected = selectedEffectId === eff.id;
            return (
              <button
                key={eff.id}
                onClick={() => handleSelectEffect(eff)}
                className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start justify-between group shadow-sm ${
                  isSelected
                    ? 'bg-slate-900 border-pink-500 ring-1 ring-pink-500/50'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{eff.icon}</span>
                    <span
                      className={`text-xs font-bold transition-colors ${
                        isSelected ? 'text-pink-300' : 'text-slate-200 group-hover:text-pink-300'
                      }`}
                    >
                      {eff.name}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-950/60 text-pink-300 border border-pink-500/30">
                      {eff.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{eff.desc}</p>
                </div>

                <div
                  className={`p-2 rounded-xl border transition-all shrink-0 ${
                    isSelected
                      ? 'bg-pink-600 border-pink-500 text-white shadow-md shadow-pink-600/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 group-hover:text-pink-400'
                  }`}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tuners & Intensity Controls */}
      <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-pink-400" />
            <span>Effect Dynamics & Fine-Tuning</span>
          </span>
          <span className="text-[10px] font-bold text-pink-300 uppercase">{selectedEffect?.name}</span>
        </div>

        {/* Master Intensity */}
        <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Master Effect Strength</span>
            <span className="text-[11px] font-mono font-bold text-pink-400">{intensity}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
          />
        </div>

        {/* Secondary Parameter */}
        <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">
              {selectedEffect?.secondaryLabel || 'Texture & Optical Depth'}
            </span>
            <span className="text-[11px] font-mono font-bold text-pink-400">{secondaryIntensity}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={secondaryIntensity}
            onChange={(e) => setSecondaryIntensity(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
          />
        </div>

        {/* Custom Directive Input */}
        <div className="space-y-1 pt-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Custom Artistic Guidance (Optional):
          </label>
          <input
            type="text"
            placeholder="e.g. Subtle magenta light leak on top right edge, heavy film grain"
            value={customDirectives}
            onChange={(e) => setCustomDirectives(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-pink-500 transition-colors"
          />
        </div>
      </div>

      {/* Primary Action Execution Button */}
      <button
        onClick={handleApplyEffect}
        disabled={isAiProcessing}
        className="w-full py-3.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:via-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-pink-600/30 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <Sparkles className={`w-4 h-4 ${isAiProcessing ? 'animate-spin' : ''}`} />
        <span>{isAiProcessing ? 'Rendering Photographic Effect...' : `Apply ${selectedEffect?.name || 'Effect'}`}</span>
      </button>
    </div>
  );
};
