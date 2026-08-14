import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  RotateCcw,
  SunMedium,
  Sliders,
  Sparkles,
  Download,
  Upload,
  Layers,
  Wand2,
  CircleDot,
  Check,
  Plus,
  Trash2,
  FileCode,
  SlidersHorizontal,
  Flame,
  Droplets,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { AdjustmentSettings, HSLSettings, ColorChannelName, ToneCurves } from '../../../types/editor';
import { DEFAULT_ADJUSTMENTS, DEFAULT_HSL } from '../../../engine/defaultSettings';
import { PRESET_LUTS, PresetLUTInfo, exportToCubeLUT } from '../../../engine/lutEngine';
import { extractDominantHue, generateHarmonies, HarmonyPalette } from '../../../engine/colorHarmonizer';

interface ColorGradingPanelProps {
  adjustments: AdjustmentSettings;
  hsl: HSLSettings;
  toneCurves?: ToneCurves;
  onUpdateAdjustments: (adjustments: AdjustmentSettings) => void;
  onUpdateHSL: (hsl: HSLSettings) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

const COLOR_CHANNELS: Array<{ id: ColorChannelName; label: string; bgClass: string; hex: string }> = [
  { id: 'red', label: 'Red', bgClass: 'bg-red-500', hex: '#ef4444' },
  { id: 'orange', label: 'Orange', bgClass: 'bg-orange-500', hex: '#f97316' },
  { id: 'yellow', label: 'Yellow', bgClass: 'bg-yellow-400', hex: '#eab308' },
  { id: 'green', label: 'Green', bgClass: 'bg-emerald-500', hex: '#10b981' },
  { id: 'aqua', label: 'Aqua', bgClass: 'bg-cyan-400', hex: '#06b6d4' },
  { id: 'blue', label: 'Blue', bgClass: 'bg-blue-500', hex: '#3b82f6' },
  { id: 'purple', label: 'Purple', bgClass: 'bg-purple-500', hex: '#a855f7' },
  { id: 'magenta', label: 'Magenta', bgClass: 'bg-pink-500', hex: '#ec4899' },
];

/**
 * Interactive 2D Circular Color Wheel Component
 */
const ColorWheelDisc: React.FC<{
  label: string;
  hue: number;        // 0 to 360
  sat: number;        // 0 to 100
  lum: number;        // -100 to 100
  onChange: (hue: number, sat: number, lum: number) => void;
  onReset: () => void;
}> = ({ label, hue, sat, lum, onChange, onReset }) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const radius = 42; // px
  const centerX = 50;
  const centerY = 50;

  // Convert Hue & Saturation to Cartesian position (in %)
  const rad = ((hue - 90) * Math.PI) / 180;
  const dist = (sat / 100) * radius;
  const puckX = centerX + dist * Math.cos(rad);
  const puckY = centerY + dist * Math.sin(rad);

  const updateFromMouseEvent = (e: React.MouseEvent | MouseEvent) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const angleRad = Math.atan2(y, x);
    let deg = Math.round((angleRad * 180) / Math.PI) + 90;
    if (deg < 0) deg += 360;

    const distance = Math.sqrt(x * x + y * y);
    const maxRadius = rect.width / 2;
    const s = Math.round(Math.min(100, (distance / maxRadius) * 100));

    onChange(deg, s, lum);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateFromMouseEvent(e);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => updateFromMouseEvent(e);
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, lum]);

  const hasEdits = sat > 0 || lum !== 0;

  return (
    <div className="flex flex-col items-center bg-slate-900/70 border border-slate-800 rounded-2xl p-2.5 space-y-2">
      <div className="w-full flex items-center justify-between px-1">
        <span className="text-[11px] font-bold text-slate-300">{label}</span>
        {hasEdits && (
          <button
            onClick={onReset}
            className="text-[10px] text-slate-500 hover:text-rose-400 font-mono transition-colors"
            title="Reset Wheel"
          >
            Reset
          </button>
        )}
      </div>

      {/* 2D Wheel Disc */}
      <div
        ref={wheelRef}
        onMouseDown={handleMouseDown}
        className="relative w-24 h-24 rounded-full cursor-crosshair shadow-inner border border-slate-700/80 overflow-hidden select-none"
        style={{
          background: `conic-gradient(
            from 0deg,
            #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000
          )`,
        }}
      >
        {/* Radial Saturation Mask */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(128,128,128,1) 0%, rgba(128,128,128,0) 80%)',
          }}
        />

        {/* Center Crosshair Grid */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-2 h-2 rounded-full border border-white/30" />
        </div>

        {/* Draggable Puck */}
        <div
          className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform"
          style={{
            left: `${puckX}%`,
            top: `${puckY}%`,
            backgroundColor: sat > 0 ? `hsl(${hue}, 100%, 50%)` : '#94a3b8',
          }}
        />
      </div>

      {/* Numerical Hue & Sat Readout */}
      <div className="flex items-center justify-between w-full text-[10px] font-mono text-slate-400 px-1">
        <span>{hue}°</span>
        <span>{sat}% sat</span>
      </div>

      {/* Luminance Offset Slider */}
      <div className="w-full space-y-0.5">
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>Lum</span>
          <span className="font-mono text-slate-300 font-bold">{lum > 0 ? `+${lum}` : lum}</span>
        </div>
        <input
          type="range"
          min={-100}
          max={100}
          value={lum}
          onChange={(e) => onChange(hue, sat, Number(e.target.value))}
          className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-400"
        />
      </div>
    </div>
  );
};

export const ColorGradingPanel: React.FC<ColorGradingPanelProps> = ({
  adjustments,
  hsl,
  toneCurves,
  onUpdateAdjustments,
  onUpdateHSL,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'hsl' | 'wheels' | 'selective' | 'lut'>('basic');
  const [selectedHslChannel, setSelectedHslChannel] = useState<ColorChannelName>('red');
  const [colorBalanceTone, setColorBalanceTone] = useState<'shadows' | 'midtones' | 'highlights'>('midtones');
  const [lutFilterCategory, setLutFilterCategory] = useState<string>('All');
  const [harmonies, setHarmonies] = useState<HarmonyPalette[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentHsl = hsl[selectedHslChannel] || { hue: 0, saturation: 0, luminance: 0 };
  const currentWheels = adjustments.colorWheels || {
    shadows: { hue: 210, sat: 0, lum: 0 },
    midtones: { hue: 45, sat: 0, lum: 0 },
    highlights: { hue: 40, sat: 0, lum: 0 },
    global: { hue: 0, sat: 0, lum: 0 },
  };

  const updateAdjustField = (field: keyof AdjustmentSettings, val: any) => {
    onUpdateAdjustments({
      ...adjustments,
      [field]: val,
    });
  };

  const updateHslChannel = (param: 'hue' | 'saturation' | 'luminance', val: number) => {
    onUpdateHSL({
      ...hsl,
      [selectedHslChannel]: {
        ...currentHsl,
        [param]: val,
      },
    });
  };

  const updateColorBalance = (axis: 'cyanRed' | 'magentaGreen' | 'yellowBlue', val: number) => {
    const prevCb = adjustments.colorBalance || {
      shadows: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
      midtones: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
      highlights: { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 },
    };

    onUpdateAdjustments({
      ...adjustments,
      colorBalance: {
        ...prevCb,
        [colorBalanceTone]: {
          ...prevCb[colorBalanceTone],
          [axis]: val,
        },
      },
    });
  };

  const updateWheel = (zone: 'shadows' | 'midtones' | 'highlights' | 'global', hue: number, sat: number, lum: number) => {
    onUpdateAdjustments({
      ...adjustments,
      colorWheels: {
        ...currentWheels,
        [zone]: { hue, sat, lum },
      },
    });
  };

  // Generate Harmonies on demand
  const handleScanHarmonies = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    const domHue = canvas ? extractDominantHue(canvas) : 35;
    const generated = generateHarmonies(domHue);
    setHarmonies(generated);
    showToast?.('info', 'Palette Harmonies Analyzed', `Extracted dominant tone of ${domHue}°.`);
  };

  const handleApplyHarmony = (harmony: HarmonyPalette) => {
    onUpdateAdjustments({
      ...adjustments,
      ...harmony.adjustments,
    });
    showToast?.('success', 'Harmonization Applied', `Applied ${harmony.name} color scheme.`);
  };

  // 3D LUT Actions
  const handleSelectPresetLUT = (lut: PresetLUTInfo) => {
    onUpdateAdjustments({
      ...adjustments,
      lutSettings: {
        enabled: true,
        lutId: lut.id,
        lutName: lut.name,
        intensity: adjustments.lutSettings?.intensity || 100,
        customCubeData: undefined,
      },
    });
    showToast?.('success', '3D LUT Applied', `Applied "${lut.name}" at ${adjustments.lutSettings?.intensity || 100}% intensity.`);
  };

  const handleClearLUT = () => {
    onUpdateAdjustments({
      ...adjustments,
      lutSettings: {
        enabled: false,
        lutId: '',
        lutName: '',
        intensity: 100,
        customCubeData: undefined,
      },
    });
  };

  const handleImportCubeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;

      onUpdateAdjustments({
        ...adjustments,
        lutSettings: {
          enabled: true,
          lutId: 'custom_imported',
          lutName: file.name.replace(/\.cube$/i, ''),
          intensity: 100,
          customCubeData: text,
        },
      });
      showToast?.('success', 'Custom .cube LUT Imported', `Successfully loaded "${file.name}" 3D LUT.`);
    };
    reader.readAsText(file);
  };

  const handleExportCube = () => {
    try {
      const cubeStr = exportToCubeLUT(
        'Custom Grade',
        (r, g, b) => {
          // Simple pipeline evaluation
          return [r, g, b];
        },
        33
      );

      const blob = new Blob([cubeStr], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ColorGrade_${Date.now()}.cube`;
      a.click();
      URL.revokeObjectURL(url);
      showToast?.('success', '3D LUT Exported', 'Downloaded .cube 33x33x33 LUT file.');
    } catch (err: any) {
      showToast?.('error', 'LUT Export Failed', err.message);
    }
  };

  const filteredPresetLuts = lutFilterCategory === 'All'
    ? PRESET_LUTS
    : PRESET_LUTS.filter((p) => p.category === lutFilterCategory);

  return (
    <div className="p-4 space-y-4 select-none overflow-y-auto max-h-full pb-20">
      {/* Top Header & Reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-500 flex items-center justify-center text-white shadow-sm">
            <Palette className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-200">Color Grading Suite</h3>
            <p className="text-[10px] text-slate-500">HSL, 3-Way Wheels, Harmonization & LUTs</p>
          </div>
        </div>

        <button
          onClick={() => {
            onUpdateAdjustments({
              ...adjustments,
              temperature: 0,
              tint: 0,
              saturation: 0,
              vibrance: 0,
              globalHue: 0,
              colorBalance: DEFAULT_ADJUSTMENTS.colorBalance,
              colorWheels: DEFAULT_ADJUSTMENTS.colorWheels,
              selectiveColors: [],
              colorReplacement: DEFAULT_ADJUSTMENTS.colorReplacement,
              lutSettings: DEFAULT_ADJUSTMENTS.lutSettings,
            });
            onUpdateHSL(DEFAULT_HSL);
          }}
          className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-rose-400 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Sub-tab Switcher Navigation */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
        {[
          { id: 'basic', label: 'Basic' },
          { id: 'hsl', label: '8-HSL' },
          { id: 'wheels', label: 'Wheels' },
          { id: 'selective', label: 'Selective' },
          { id: 'lut', label: '3D LUT' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all text-center ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. BASIC COLOR & COLOR BALANCE TAB */}
      {activeTab === 'basic' && (
        <div className="space-y-4">
          <div className="space-y-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <SunMedium className="w-3.5 h-3.5 text-amber-400" />
                Global White Balance & Vibrance
              </span>
            </div>

            {/* Temperature */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Temperature (Cool / Warm)</span>
                <span className="font-mono text-amber-400 font-bold">
                  {adjustments.temperature > 0 ? `+${adjustments.temperature}` : adjustments.temperature}
                </span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={adjustments.temperature}
                onChange={(e) => updateAdjustField('temperature', Number(e.target.value))}
                className="w-full h-1.5 bg-gradient-to-r from-blue-500 via-slate-700 to-amber-500 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Tint */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Tint (Green / Magenta)</span>
                <span className="font-mono text-fuchsia-400 font-bold">
                  {adjustments.tint > 0 ? `+${adjustments.tint}` : adjustments.tint}
                </span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={adjustments.tint}
                onChange={(e) => updateAdjustField('tint', Number(e.target.value))}
                className="w-full h-1.5 bg-gradient-to-r from-emerald-500 via-slate-700 to-fuchsia-500 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Vibrance */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Vibrance (Skin-Safe)</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {adjustments.vibrance > 0 ? `+${adjustments.vibrance}` : adjustments.vibrance}
                </span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={adjustments.vibrance}
                onChange={(e) => updateAdjustField('vibrance', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Saturation</span>
                <span className="font-mono text-rose-400 font-bold">
                  {adjustments.saturation > 0 ? `+${adjustments.saturation}` : adjustments.saturation}
                </span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={adjustments.saturation}
                onChange={(e) => updateAdjustField('saturation', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>

            {/* Global Hue Shift */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Global Hue Rotation</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {(adjustments.globalHue || 0) > 0 ? `+${adjustments.globalHue}` : (adjustments.globalHue || 0)}°
                </span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                value={adjustments.globalHue || 0}
                onChange={(e) => updateAdjustField('globalHue', Number(e.target.value))}
                className="w-full h-1.5 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* 3-Way Color Balance (Cyan-Red, Magenta-Green, Yellow-Blue) */}
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
                Color Balance (3-Way Tonal Split)
              </span>
            </div>

            {/* Tone Selector: Shadows / Midtones / Highlights */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-bold">
              {(['shadows', 'midtones', 'highlights'] as const).map((tone) => (
                <button
                  key={tone}
                  onClick={() => setColorBalanceTone(tone)}
                  className={`py-1 rounded capitalize transition-all ${
                    colorBalanceTone === tone
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>

            {/* 3 Color Balance Sliders */}
            {(() => {
              const currentToneCb = adjustments.colorBalance?.[colorBalanceTone] || { cyanRed: 0, magentaGreen: 0, yellowBlue: 0 };
              return (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Cyan ↔ Red</span>
                      <span className="font-mono text-slate-300 font-bold">{currentToneCb.cyanRed > 0 ? `+${currentToneCb.cyanRed}` : currentToneCb.cyanRed}</span>
                    </div>
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      value={currentToneCb.cyanRed}
                      onChange={(e) => updateColorBalance('cyanRed', Number(e.target.value))}
                      className="w-full h-1.5 bg-gradient-to-r from-cyan-500 via-slate-700 to-red-500 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Magenta ↔ Green</span>
                      <span className="font-mono text-slate-300 font-bold">{currentToneCb.magentaGreen > 0 ? `+${currentToneCb.magentaGreen}` : currentToneCb.magentaGreen}</span>
                    </div>
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      value={currentToneCb.magentaGreen}
                      onChange={(e) => updateColorBalance('magentaGreen', Number(e.target.value))}
                      className="w-full h-1.5 bg-gradient-to-r from-fuchsia-500 via-slate-700 to-emerald-500 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Yellow ↔ Blue</span>
                      <span className="font-mono text-slate-300 font-bold">{currentToneCb.yellowBlue > 0 ? `+${currentToneCb.yellowBlue}` : currentToneCb.yellowBlue}</span>
                    </div>
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      value={currentToneCb.yellowBlue}
                      onChange={(e) => updateColorBalance('yellowBlue', Number(e.target.value))}
                      className="w-full h-1.5 bg-gradient-to-r from-yellow-500 via-slate-700 to-blue-500 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 2. 8-CHANNEL HSL MIXER TAB */}
      {activeTab === 'hsl' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span>8 Color Channels</span>
            <button
              onClick={() => onUpdateHSL(DEFAULT_HSL)}
              className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset HSL</span>
            </button>
          </div>

          {/* Color Channel Swatch Grid */}
          <div className="grid grid-cols-4 gap-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
            {COLOR_CHANNELS.map((ch) => {
              const isSelected = selectedHslChannel === ch.id;
              const chData = hsl[ch.id];
              const hasEdits = chData && (chData.hue !== 0 || chData.saturation !== 0 || chData.luminance !== 0);

              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedHslChannel(ch.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 shadow-md ring-1 ring-slate-600'
                      : 'hover:bg-slate-800/40 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="relative">
                    <div className={`w-5 h-5 rounded-full ${ch.bgClass} shadow-sm`} />
                    {hasEdits && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white ring-1 ring-black" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-300">{ch.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Channel Sliders */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 capitalize flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLOR_CHANNELS.find((c) => c.id === selectedHslChannel)?.hex }}
                />
                {selectedHslChannel} Channel
              </span>
              <button
                onClick={() =>
                  onUpdateHSL({
                    ...hsl,
                    [selectedHslChannel]: { hue: 0, saturation: 0, luminance: 0 },
                  })
                }
                className="text-[10px] text-slate-500 hover:text-rose-400 font-mono"
              >
                Reset Channel
              </button>
            </div>

            {/* Hue */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Hue Shift</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {currentHsl.hue > 0 ? `+${currentHsl.hue}` : currentHsl.hue}°
                </span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={currentHsl.hue}
                onChange={(e) => updateHslChannel('hue', Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Saturation</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {currentHsl.saturation > 0 ? `+${currentHsl.saturation}` : currentHsl.saturation}%
                </span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={currentHsl.saturation}
                onChange={(e) => updateHslChannel('saturation', Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Luminance */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Luminance (Lightness)</span>
                <span className="font-mono text-amber-400 font-bold">
                  {currentHsl.luminance > 0 ? `+${currentHsl.luminance}` : currentHsl.luminance}%
                </span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={currentHsl.luminance}
                onChange={(e) => updateHslChannel('luminance', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. 3-WAY COLOR WHEELS & HARMONIZATION TAB */}
      {activeTab === 'wheels' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span>3-Way Color Wheels</span>
            <button
              onClick={() => updateAdjustField('colorWheels', DEFAULT_ADJUSTMENTS.colorWheels)}
              className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Wheels</span>
            </button>
          </div>

          {/* 3-Way Wheels Grid: Shadows, Midtones, Highlights */}
          <div className="grid grid-cols-3 gap-2">
            <ColorWheelDisc
              label="Shadows"
              hue={currentWheels.shadows?.hue ?? 210}
              sat={currentWheels.shadows?.sat ?? 0}
              lum={currentWheels.shadows?.lum ?? 0}
              onChange={(h, s, l) => updateWheel('shadows', h, s, l)}
              onReset={() => updateWheel('shadows', 210, 0, 0)}
            />
            <ColorWheelDisc
              label="Midtones"
              hue={currentWheels.midtones?.hue ?? 45}
              sat={currentWheels.midtones?.sat ?? 0}
              lum={currentWheels.midtones?.lum ?? 0}
              onChange={(h, s, l) => updateWheel('midtones', h, s, l)}
              onReset={() => updateWheel('midtones', 45, 0, 0)}
            />
            <ColorWheelDisc
              label="Highlights"
              hue={currentWheels.highlights?.hue ?? 40}
              sat={currentWheels.highlights?.sat ?? 0}
              lum={currentWheels.highlights?.lum ?? 0}
              onChange={(h, s, l) => updateWheel('highlights', h, s, l)}
              onReset={() => updateWheel('highlights', 40, 0, 0)}
            />
          </div>

          {/* Global Master Wheel */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-4">
              <ColorWheelDisc
                label="Global Offset"
                hue={currentWheels.global?.hue ?? 0}
                sat={currentWheels.global?.sat ?? 0}
                lum={currentWheels.global?.lum ?? 0}
                onChange={(h, s, l) => updateWheel('global', h, s, l)}
                onReset={() => updateWheel('global', 0, 0, 0)}
              />
              <div className="flex-1 space-y-2 text-xs text-slate-400">
                <div className="font-bold text-slate-200">Global Master Wheel</div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Uniformly shifts overall scene color temperature and tint across the entire luminance spectrum.
                </p>
              </div>
            </div>
          </div>

          {/* AI Color Harmonization Generator */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                Color Harmonization Engine
              </span>
              <button
                onClick={handleScanHarmonies}
                className="py-1 px-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Scan Harmony</span>
              </button>
            </div>

            {harmonies.length > 0 && (
              <div className="space-y-2 pt-1">
                {harmonies.map((harm) => (
                  <div
                    key={harm.scheme}
                    onClick={() => handleApplyHarmony(harm)}
                    className="p-2.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300">
                        {harm.name}
                      </div>
                      <div className="text-[10px] text-slate-500">{harm.description}</div>
                    </div>

                    <div className="flex items-center gap-1">
                      {harm.colors.map((c, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SELECTIVE COLOR & COLOR REPLACEMENT TAB */}
      {activeTab === 'selective' && (
        <div className="space-y-4">
          {/* Color Replacement Module */}
          <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                Target Color Replacement
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={adjustments.colorReplacement?.enabled || false}
                  onChange={(e) =>
                    updateAdjustField('colorReplacement', {
                      ...(adjustments.colorReplacement || DEFAULT_ADJUSTMENTS.colorReplacement),
                      enabled: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            {adjustments.colorReplacement?.enabled && (
              <div className="space-y-3 pt-2">
                {/* Source Hue & Tolerance */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: `hsl(${adjustments.colorReplacement.sourceHue}, 100%, 50%)` }}
                      />
                      Source Target Hue
                    </span>
                    <span className="font-mono text-slate-300">{adjustments.colorReplacement.sourceHue}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={adjustments.colorReplacement.sourceHue}
                    onChange={(e) =>
                      updateAdjustField('colorReplacement', {
                        ...adjustments.colorReplacement,
                        sourceHue: Number(e.target.value),
                      })
                    }
                    className="w-full h-1.5 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Hue Tolerance (Bandwidth)</span>
                    <span className="font-mono text-slate-300">±{adjustments.colorReplacement.sourceTolerance}°</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    value={adjustments.colorReplacement.sourceTolerance}
                    onChange={(e) =>
                      updateAdjustField('colorReplacement', {
                        ...adjustments.colorReplacement,
                        sourceTolerance: Number(e.target.value),
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                </div>

                {/* Target Replacement Hue */}
                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: `hsl(${adjustments.colorReplacement.targetHue}, 100%, 50%)` }}
                      />
                      Replacement Hue
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">{adjustments.colorReplacement.targetHue}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={adjustments.colorReplacement.targetHue}
                    onChange={(e) =>
                      updateAdjustField('colorReplacement', {
                        ...adjustments.colorReplacement,
                        targetHue: Number(e.target.value),
                      })
                    }
                    className="w-full h-1.5 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Edge Feather Blend</span>
                    <span className="font-mono text-slate-300">{adjustments.colorReplacement.feather || 20}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={adjustments.colorReplacement.feather || 20}
                    onChange={(e) =>
                      updateAdjustField('colorReplacement', {
                        ...adjustments.colorReplacement,
                        feather: Number(e.target.value),
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. 3D LUT STUDIO TAB */}
      {activeTab === 'lut' && (
        <div className="space-y-4">
          {/* Active LUT Status & Intensity */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                3D LUT Processor (.cube)
              </span>
              {adjustments.lutSettings?.enabled && (
                <button
                  onClick={handleClearLUT}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
                >
                  Remove LUT
                </button>
              )}
            </div>

            {adjustments.lutSettings?.enabled ? (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      {adjustments.lutSettings.lutName || 'Active 3D LUT'}
                    </div>
                    <div className="text-[10px] text-slate-400">Trilinear 3D Interpolation Active</div>
                  </div>
                  <span className="text-xs font-mono text-indigo-400 font-bold">
                    {adjustments.lutSettings.intensity}%
                  </span>
                </div>

                {/* Intensity Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>LUT Opacity & Intensity</span>
                    <span className="font-mono text-slate-300 font-bold">{adjustments.lutSettings.intensity}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={adjustments.lutSettings.intensity}
                    onChange={(e) =>
                      updateAdjustField('lutSettings', {
                        ...adjustments.lutSettings,
                        intensity: Number(e.target.value),
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-1">
                No LUT currently applied. Select a cinematic preset below or import any custom .cube file.
              </div>
            )}
          </div>

          {/* Import / Export Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Import .cube LUT</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".cube"
              onChange={handleImportCubeFile}
              className="hidden"
            />

            <button
              onClick={handleExportCube}
              className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export as .cube</span>
            </button>
          </div>

          {/* Built-in Curated Pro LUT Library */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Cinematic Pro 3D LUTs</span>
              <span className="text-[10px] text-slate-500">{PRESET_LUTS.length} Looks</span>
            </div>

            <div className="space-y-1.5">
              {PRESET_LUTS.map((lut) => {
                const isSelected = adjustments.lutSettings?.enabled && adjustments.lutSettings?.lutId === lut.id;
                return (
                  <div
                    key={lut.id}
                    onClick={() => handleSelectPresetLUT(lut)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-lg shadow-inner shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${lut.colorPreview[0]}, ${lut.colorPreview[1]})`,
                        }}
                      />
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-200">{lut.name}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{lut.description}</div>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
