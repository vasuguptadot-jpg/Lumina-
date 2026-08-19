import React, { useState } from 'react';
import {
  PersonStanding,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Shirt,
  Wand2,
  Lock,
  Grid,
  CheckCircle2,
  ChevronRight,
  MoveVertical,
  Activity,
  Sliders,
  Scale,
  Maximize2,
  Minimize2,
  Scissors,
  Check,
} from 'lucide-react';
import { Project } from '../../../types/editor';
import {
  BodyRetouchOptions,
  ClothingAdjustmentSettings,
  requestAiBodyRetouch,
} from '../../../services/aiService';

interface BodyPanelProps {
  project: Project;
  onUpdateImage: (newUrl: string, name?: string) => void;
  isAiProcessing: boolean;
  setIsAiProcessing: (loading: boolean) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

const DEFAULT_CLOTHING: ClothingAdjustmentSettings = {
  wrinkleSmoothing: true,
  tailoredFit: false,
  drapeRefinement: true,
  colorAdjustment: 'original',
};

// Curated Body & Posture Presets
const BODY_PRESETS = [
  {
    id: 'natural-posture',
    name: 'Natural Posture & Stature',
    badge: 'SUBTLE',
    icon: '🧍',
    desc: 'Gentle spine de-slumping, shoulder leveling, and subtle vertical stature balance.',
    settings: {
      height: 6,
      proportions: 5,
      waist: -4,
      shoulders: 4,
      arms: -3,
      legs: 6,
      posture: 40,
      clothing: { wrinkleSmoothing: true, tailoredFit: false, drapeRefinement: true, colorAdjustment: 'original' },
    },
  },
  {
    id: 'athletic-tone',
    name: 'Athletic Definition',
    badge: 'TONED',
    icon: '💪',
    desc: 'Square shoulders, toned arms, midsection contouring, and wrinkle cleanup.',
    settings: {
      height: 4,
      proportions: 8,
      waist: -8,
      shoulders: 10,
      arms: -8,
      legs: 5,
      posture: 50,
      clothing: { wrinkleSmoothing: true, tailoredFit: true, drapeRefinement: true, colorAdjustment: 'original' },
    },
  },
  {
    id: 'editorial-runway',
    name: 'Editorial Runway Elegance',
    badge: 'FASHION',
    icon: '✨',
    desc: 'Golden-ratio vertical elongation, tailored garment drape, and poise.',
    settings: {
      height: 10,
      proportions: 12,
      waist: -6,
      shoulders: 6,
      arms: -5,
      legs: 12,
      posture: 45,
      clothing: { wrinkleSmoothing: true, tailoredFit: true, drapeRefinement: true, colorAdjustment: 'original' },
    },
  },
  {
    id: 'casual-confident',
    name: 'Casual Headshot Polish',
    badge: 'PRO',
    icon: '👔',
    desc: 'Clean relaxed posture, collar and sleeve wrinkle smoothing.',
    settings: {
      height: 0,
      proportions: 0,
      waist: 0,
      shoulders: 4,
      arms: 0,
      legs: 0,
      posture: 35,
      clothing: { wrinkleSmoothing: true, tailoredFit: false, drapeRefinement: true, colorAdjustment: 'original' },
    },
  },
];

// Garment Color Swatches
const CLOTHING_COLORS = [
  { id: 'original', label: 'Original Garment', hex: '#64748b' },
  { id: 'navy-blue', label: 'Midnight Navy', hex: '#1e3a8a' },
  { id: 'charcoal-black', label: 'Charcoal Black', hex: '#18181b' },
  { id: 'ivory-white', label: 'Crisp Ivory', hex: '#f8fafc' },
  { id: 'emerald', label: 'Deep Emerald', hex: '#065f46' },
  { id: 'burgundy', label: 'Rich Burgundy', hex: '#881337' },
  { id: 'camel-tan', label: 'Camel Tan', hex: '#b45309' },
];

export const BodyPanel: React.FC<BodyPanelProps> = ({
  project,
  onUpdateImage,
  isAiProcessing,
  setIsAiProcessing,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'shaping' | 'posture' | 'clothing' | 'presets'>('shaping');

  // Background Protection Guard (CRITICAL)
  const [backgroundProtection, setBackgroundProtection] = useState<boolean>(true);
  const [isSubtleMode, setIsSubtleMode] = useState<boolean>(true);

  // Body Metrics State
  const [height, setHeight] = useState<number>(0);
  const [proportions, setProportions] = useState<number>(0);
  const [waist, setWaist] = useState<number>(0);
  const [shoulders, setShoulders] = useState<number>(0);
  const [arms, setArms] = useState<number>(0);
  const [legs, setLegs] = useState<number>(0);
  const [posture, setPosture] = useState<number>(0);

  // Clothing Settings State
  const [clothing, setClothing] = useState<ClothingAdjustmentSettings>(DEFAULT_CLOTHING);
  const [customNotes, setCustomNotes] = useState<string>('');

  const handleResetBody = () => {
    setHeight(0);
    setProportions(0);
    setWaist(0);
    setShoulders(0);
    setArms(0);
    setLegs(0);
    setPosture(0);
    showToast('info', 'Body Settings Reset', 'All anatomical sliders returned to neutral.');
  };

  const handleApplyPreset = (preset: typeof BODY_PRESETS[0]) => {
    setHeight(preset.settings.height);
    setProportions(preset.settings.proportions);
    setWaist(preset.settings.waist);
    setShoulders(preset.settings.shoulders);
    setArms(preset.settings.arms);
    setLegs(preset.settings.legs);
    setPosture(preset.settings.posture);
    setClothing(preset.settings.clothing);
    showToast('info', `Preset: ${preset.name}`, 'Adjustments loaded. Ready to execute retouch.');
  };

  const handleExecuteBodyRetouch = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    setIsAiProcessing(true);
    showToast(
      'info',
      'AI Body Retoucher Active',
      backgroundProtection
        ? 'Segmenting subject & locking background architecture (walls, door frames, tiles)...'
        : 'Processing anatomical shaping...'
    );

    try {
      const base64 = canvas.toDataURL('image/png');
      const res = await requestAiBodyRetouch(base64, {
        height,
        proportions,
        waist,
        shoulders,
        arms,
        legs,
        posture,
        clothing,
        backgroundProtection,
        isSubtleMode,
        customNotes: customNotes.trim() || undefined,
      });

      if (res.success && res.imageUrl) {
        onUpdateImage(res.imageUrl, `Body_Retouched_${project.name}`);
        showToast(
          'success',
          'Body Editing Complete',
          'Applied subtle anatomical shaping with 100% rigid background protection.'
        );
      } else {
        showToast('error', 'Body Editing Failed', res.message || res.error);
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Slider helper component
  const RenderSlider = ({
    label,
    value,
    min = -50,
    max = 50,
    unit = '%',
    onChange,
    onReset,
    icon: Icon,
  }: {
    label: string;
    value: number;
    min?: number;
    max?: number;
    unit?: string;
    onChange: (val: number) => void;
    onReset?: () => void;
    icon?: any;
  }) => {
    const isZero = value === 0;
    return (
      <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            {Icon && <Icon className="w-3.5 h-3.5 text-indigo-400" />}
            <span>{label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-mono font-bold ${!isZero ? 'text-indigo-400' : 'text-slate-500'}`}>
              {value > 0 ? `+${value}` : value}
              {unit}
            </span>
            {onReset && !isZero && (
              <button
                onClick={onReset}
                title="Reset"
                className="text-slate-500 hover:text-indigo-400 transition-colors p-0.5"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        <div className="relative flex items-center">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
          />
          {min < 0 && max > 0 && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-2.5 bg-slate-600 pointer-events-none" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4 select-none text-slate-200">
      {/* Background Protection Guarantee Header */}
      <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-sky-950/60 border border-indigo-500/30 p-3.5 rounded-2xl space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <PersonStanding className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-indigo-300 uppercase tracking-wide">
                Body Editing & Posture Studio
              </div>
              <div className="text-[10px] text-slate-400">
                Non-destructive anatomy shaping, golden proportions & apparel refinement
              </div>
            </div>
          </div>

          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            <span>BG LOCKED</span>
          </span>
        </div>

        {/* Automatic Background Warp Protection Banner */}
        <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Automatic Background Protection</span>
            </div>
            <button
              onClick={() => setBackgroundProtection(!backgroundProtection)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${
                backgroundProtection
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}
            >
              {backgroundProtection ? 'ACTIVE (Walls & Doors Safe)' : 'DISABLED'}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Neural segmentation protects straight door frames, wall moldings, tiles, and horizons from bending or warping when reshaping body contours.
          </p>
        </div>
      </div>

      {/* Subtle Safeguard Bar */}
      <div className="flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-slate-200">Subtle Natural Restraint</span>
        </div>
        <button
          onClick={() => setIsSubtleMode(!isSubtleMode)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
            isSubtleMode
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}
        >
          {isSubtleMode ? 'NATURAL' : 'EXTENDED'}
        </button>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold overflow-x-auto scrollbar-none shadow-inner">
        <button
          onClick={() => setActiveTab('shaping')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'shaping'
              ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <PersonStanding className="w-3.5 h-3.5" />
          <span>Body Shaping</span>
        </button>

        <button
          onClick={() => setActiveTab('posture')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'posture'
              ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Posture Alignment</span>
        </button>

        <button
          onClick={() => setActiveTab('clothing')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'clothing'
              ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Shirt className="w-3.5 h-3.5" />
          <span>Clothing Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'presets'
              ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>AI Presets</span>
        </button>
      </div>

      {/* 1. SUB-PANEL: BODY SHAPING */}
      {activeTab === 'shaping' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <PersonStanding className="w-3.5 h-3.5 text-indigo-400" />
              <span>Anatomical Shaping</span>
            </span>
            <button
              onClick={handleResetBody}
              className="text-[10px] text-slate-400 hover:text-indigo-400 flex items-center gap-1 font-semibold transition-colors"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset Shaping</span>
            </button>
          </div>

          <div className="space-y-2.5">
            <RenderSlider
              label="Height & Vertical Stature"
              value={height}
              onChange={setHeight}
              onReset={() => setHeight(0)}
            />

            <RenderSlider
              label="Golden Body Proportions"
              value={proportions}
              onChange={setProportions}
              onReset={() => setProportions(0)}
            />

            <RenderSlider
              label="Waistline & Midsection Contour"
              value={waist}
              onChange={setWaist}
              onReset={() => setWaist(0)}
            />

            <RenderSlider
              label="Shoulder Width & Leveling"
              value={shoulders}
              onChange={setShoulders}
              onReset={() => setShoulders(0)}
            />

            <RenderSlider
              label="Arm & Bicep Toning"
              value={arms}
              onChange={setArms}
              onReset={() => setArms(0)}
            />

            <RenderSlider
              label="Leg Elongation & Calves"
              value={legs}
              onChange={setLegs}
              onReset={() => setLegs(0)}
            />
          </div>
        </div>
      )}

      {/* 2. SUB-PANEL: POSTURE ALIGNMENT */}
      {activeTab === 'posture' && (
        <div className="space-y-3.5 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>Spine & Neck Posture Alignment</span>
            </span>
            <button
              onClick={() => setPosture(0)}
              className="text-[10px] text-slate-400 hover:text-indigo-400 flex items-center gap-1 font-semibold transition-colors"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset Posture</span>
            </button>
          </div>

          <div className="space-y-3">
            <RenderSlider
              label="Spine Alignment & De-Slumping"
              min={0}
              max={100}
              value={posture}
              onChange={setPosture}
              onReset={() => setPosture(0)}
            />

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Posture Correction Elements:</span>
              </div>
              <ul className="text-[10px] text-slate-400 space-y-1 pl-4 list-disc">
                <li>Straightens rounded shoulders and forward-head slumping.</li>
                <li>Levels uneven clavicles and shoulder slopes.</li>
                <li>Elongates the cervical spine and neck line with natural poise.</li>
                <li>Preserves authentic body symmetry and natural confidence.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUB-PANEL: CLOTHING ADJUSTMENT */}
      {activeTab === 'clothing' && (
        <div className="space-y-3.5 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Shirt className="w-3.5 h-3.5 text-indigo-400" />
              <span>Clothing & Apparel Tailoring</span>
            </span>
            <button
              onClick={() => setClothing(DEFAULT_CLOTHING)}
              className="text-[10px] text-slate-400 hover:text-indigo-400 flex items-center gap-1 font-semibold transition-colors"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset Clothing</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Toggles */}
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="space-y-0.5">
                  <div className="text-slate-200 font-bold text-[11px]">Fabric Wrinkle Smoothing</div>
                  <div className="text-[9px] text-slate-400">Eliminates creases, bunching & fold lines on shirts and trousers.</div>
                </div>
                <input
                  type="checkbox"
                  checked={clothing.wrinkleSmoothing}
                  onChange={(e) => setClothing((p) => ({ ...p, wrinkleSmoothing: e.target.checked }))}
                  className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="space-y-0.5">
                  <div className="text-slate-200 font-bold text-[11px]">Bespoke Tailored Fit</div>
                  <div className="text-[9px] text-slate-400">Tapers loose seams around waist, cuffs, and shoulders.</div>
                </div>
                <input
                  type="checkbox"
                  checked={clothing.tailoredFit}
                  onChange={(e) => setClothing((p) => ({ ...p, tailoredFit: e.target.checked }))}
                  className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="space-y-0.5">
                  <div className="text-slate-200 font-bold text-[11px]">Silhouette & Drape Refinement</div>
                  <div className="text-[9px] text-slate-400">Enhances natural hem flow and cloth physics.</div>
                </div>
                <input
                  type="checkbox"
                  checked={clothing.drapeRefinement}
                  onChange={(e) => setClothing((p) => ({ ...p, drapeRefinement: e.target.checked }))}
                  className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Garment Color Harmonization */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Harmonize Apparel Color:
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {CLOTHING_COLORS.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => setClothing((p) => ({ ...p, colorAdjustment: col.id }))}
                    className={`py-1.5 px-2 rounded-xl border text-[11px] flex items-center gap-1.5 transition-all ${
                      clothing.colorAdjustment === col.id
                        ? 'bg-slate-950 border-indigo-500 text-white font-bold ring-1 ring-indigo-500/50'
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

      {/* 4. SUB-PANEL: AI PRESETS */}
      {activeTab === 'presets' && (
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            1-Click Body & Posture Presets:
          </label>

          <div className="space-y-2">
            {BODY_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className="w-full bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-3 rounded-2xl text-left transition-all flex items-start justify-between group shadow-sm"
              >
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{preset.icon}</span>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                      {preset.name}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{preset.desc}</p>
                </div>

                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/40 transition-all shrink-0">
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
          Custom Body Editing Guidance (Optional):
        </label>
        <input
          type="text"
          placeholder="e.g. Straighten posture, subtle leg lengthening, remove jacket creases"
          value={customNotes}
          onChange={(e) => setCustomNotes(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Primary Execution Action */}
      <button
        onClick={handleExecuteBodyRetouch}
        disabled={isAiProcessing}
        className="w-full py-3.5 bg-gradient-to-r from-indigo-500 via-sky-600 to-emerald-600 hover:from-indigo-400 hover:via-sky-500 hover:to-emerald-500 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <Sparkles className={`w-4 h-4 ${isAiProcessing ? 'animate-spin' : ''}`} />
        <span>{isAiProcessing ? 'Rendering Body & Background Lock...' : 'Execute AI Body Retouch'}</span>
      </button>
    </div>
  );
};
