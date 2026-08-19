import React, { useState } from 'react';
import {
  Palette,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  Printer,
  ShieldAlert,
  Sun,
  Activity,
  Sliders,
  Check,
  Info,
  HelpCircle,
  Zap,
  RotateCcw,
  Monitor,
  Maximize2,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  ColorManagementSettings,
  WorkingColorSpace,
  SoftProofProfileId,
  RenderingIntent,
  ProcessingBitDepth,
  GamutWarningColor,
} from '../../../types/editor';
import {
  COLOR_SPACES_DATA,
  SOFT_PROOF_PROFILES,
} from '../../../engine/colorManagementEngine';
import { DEFAULT_COLOR_MANAGEMENT } from '../../../engine/defaultSettings';

interface ColorManagementPanelProps {
  settings?: ColorManagementSettings;
  onChange: (settings: ColorManagementSettings) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const ColorManagementPanel: React.FC<ColorManagementPanelProps> = ({
  settings = DEFAULT_COLOR_MANAGEMENT,
  onChange,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'soft-proof' | 'bit-depth' | 'hdr' | 'icc-info'>('soft-proof');

  const updateSetting = <K extends keyof ColorManagementSettings>(
    key: K,
    val: ColorManagementSettings[K]
  ) => {
    onChange({
      ...settings,
      [key]: val,
    });
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_COLOR_MANAGEMENT });
    showToast?.('info', 'Color Management Reset', 'Restored default Display P3 16-bit profile.');
  };

  const activeSpaceData = COLOR_SPACES_DATA[settings.workingSpace] || COLOR_SPACES_DATA['display-p3'];
  const activeProofData = SOFT_PROOF_PROFILES[settings.proofProfile] || SOFT_PROOF_PROFILES['cmyk-gracol-2006'];

  return (
    <div className="space-y-4 text-xs select-none">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 flex items-center gap-1.5">
              <span>Color Management Studio</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono font-black border border-indigo-500/40">
                PRO ICC
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Gamut Profiles, Prepress CMYK Soft Proofing, HDR & 32-bit Precision
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          title="Reset to Factory Defaults"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sub-Tab Switcher */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800/80 text-[10px]">
        {[
          { id: 'soft-proof', label: 'Soft Proof', icon: Printer },
          { id: 'profile', label: 'Color Space', icon: Palette },
          { id: 'bit-depth', label: 'Bit Depth', icon: Layers },
          { id: 'hdr', label: 'HDR / EDR', icon: Sun },
          { id: 'icc-info', label: 'ICC Specs', icon: FileCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-1.5 px-1 rounded-lg font-bold flex flex-col items-center gap-1 transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SOFT PROOFING & CMYK PREPRESS */}
      {activeTab === 'soft-proof' && (
        <div className="space-y-3.5">
          {/* Main Soft Proof Master Toggle */}
          <div className="p-3 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${settings.softProofEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100 flex items-center gap-1.5">
                    <span>Soft Proofing Simulation</span>
                    <span className="text-[9px] font-mono text-slate-400">(Live Press Proof)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Preview exact on-paper ink absorption, dot gain and color clipping
                  </div>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.softProofEnabled}
                  onChange={(e) => updateSetting('softProofEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>
          </div>

          {/* Target Proof Profile Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
              <span>Target Press / Display Profile</span>
              <span className="text-[10px] text-indigo-400 font-mono">
                {activeProofData.type} • {activeProofData.totalAreaCoverage}
              </span>
            </label>

            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto scrollbar-thin p-0.5">
              {Object.values(SOFT_PROOF_PROFILES).map((p) => {
                const isSelected = settings.proofProfile === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => updateSetting('proofProfile', p.id)}
                    className={`p-2 rounded-xl text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-100">
                        <span>{p.name}</span>
                        <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold ${
                          p.type === 'CMYK'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                            : p.type === 'PAPER'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {p.type}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{p.description}</div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rendering Intent Selector */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
              <span>Rendering Intent</span>
              <span className="text-[10px] text-slate-500 font-mono">ICC SPEC</span>
            </label>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'relative-colorimetric', label: 'Relative Colorimetric', desc: 'Standard prepress, maps exact in-gamut colors' },
                { id: 'perceptual', label: 'Perceptual (Photographic)', desc: 'Compresses entire gamut, preserves relationships' },
                { id: 'absolute-colorimetric', label: 'Absolute Colorimetric', desc: 'Simulates paper white point and substrate tint' },
                { id: 'saturation', label: 'Saturation (Graphics)', desc: 'Maximizes vividness for charts and illustrations' },
              ].map((intent) => (
                <button
                  key={intent.id}
                  onClick={() => updateSetting('renderingIntent', intent.id as any)}
                  className={`p-2 rounded-lg text-left border transition-all ${
                    settings.renderingIntent === intent.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-[11px]">{intent.label}</div>
                  <div className="text-[9px] text-slate-500 leading-tight truncate">{intent.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Paper White & Black Ink DMax Simulators */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
            <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
              <span>Substrate & Ink Characteristics</span>
              <span className="text-[10px] text-slate-500 font-mono">DMAX / DOT GAIN</span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-pointer text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full border border-slate-700 inline-block shadow-inner"
                    style={{ backgroundColor: activeProofData.paperTint }}
                  />
                  <span>Simulate Paper White Substrate</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.simulatePaperWhite}
                  onChange={(e) => updateSetting('simulatePaperWhite', e.target.checked)}
                  className="accent-indigo-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300">
                <span>Simulate Black Ink Dynamic Range (DMax)</span>
                <input
                  type="checkbox"
                  checked={settings.simulateBlackInk}
                  onChange={(e) => updateSetting('simulateBlackInk', e.target.checked)}
                  className="accent-indigo-500 rounded"
                />
              </label>
            </div>
          </div>

          {/* Out of Gamut Warning Mask Controls */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="font-bold text-slate-200 text-xs">Out-of-Gamut Warning Alert</div>
                  <div className="text-[10px] text-slate-400">Highlights clipped unprintable colors in real-time</div>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.gamutWarningEnabled}
                  onChange={(e) => updateSetting('gamutWarningEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-rose-500" />
              </label>
            </div>

            {settings.gamutWarningEnabled && (
              <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Gamut Warning Mask Color</label>
                  <div className="grid grid-cols-5 gap-1">
                    {[
                      { id: 'neon-red', label: 'Neon Red', color: '#ff0055' },
                      { id: 'neon-cyan', label: 'Neon Cyan', color: '#00ffff' },
                      { id: 'neon-magenta', label: 'Magenta', color: '#ff00ff' },
                      { id: 'neon-green', label: 'Neon Green', color: '#00ff66' },
                      { id: 'zebra', label: 'Zebra Band', color: '#fbbf24' },
                    ].map((gColor) => (
                      <button
                        key={gColor.id}
                        onClick={() => updateSetting('gamutWarningColor', gColor.id as any)}
                        className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                          settings.gamutWarningColor === gColor.id
                            ? 'border-white bg-slate-800 text-white'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: gColor.color }} />
                        <span className="truncate">{gColor.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Gamut Sensitivity Threshold</span>
                    <span className="font-mono text-slate-200">{settings.gamutThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={settings.gamutThreshold}
                    onChange={(e) => updateSetting('gamutThreshold', Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WORKING COLOR SPACE */}
      {activeTab === 'profile' && (
        <div className="space-y-3.5">
          {/* CIE 1931 Chromaticity Triangle Visualizer */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
              <span>CIE 1931 Chromaticity Diagram</span>
              <span className="text-[10px] font-mono text-indigo-400">
                Spectrum: {activeSpaceData.gamutCoveragePercent}
              </span>
            </div>

            <div className="relative w-full h-36 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
              {/* Horseshoe Gamut SVG Representation */}
              <svg viewBox="0 0 400 350" className="w-full h-full p-2">
                {/* Visible Spectrum Spectral Locus Horseshoe Curve */}
                <path
                  d="M 50,300 Q 30,180 80,80 Q 140,20 220,20 Q 330,60 370,180 L 370,300 Z"
                  fill="url(#rainbow-grad)"
                  opacity="0.25"
                  stroke="#475569"
                  strokeWidth="1.5"
                />

                <defs>
                  <linearGradient id="rainbow-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="30%" stopColor="#10b981" />
                    <stop offset="70%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>

                {/* sRGB Reference Triangle (dotted) */}
                <polygon
                  points="280,210 150,100 80,270"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />

                {/* Active Gamut Triangle */}
                {settings.workingSpace === 'srgb' && (
                  <polygon points="280,210 150,100 80,270" fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" strokeWidth="2.5" />
                )}
                {settings.workingSpace === 'display-p3' && (
                  <polygon points="300,210 135,70 80,270" fill="rgba(20, 184, 166, 0.35)" stroke="#14b8a6" strokeWidth="2.5" />
                )}
                {settings.workingSpace === 'adobe-rgb' && (
                  <polygon points="280,210 110,50 80,270" fill="rgba(245, 158, 11, 0.35)" stroke="#f59e0b" strokeWidth="2.5" />
                )}
                {settings.workingSpace === 'prophoto-rgb' && (
                  <polygon points="360,240 85,15 45,295" fill="rgba(236, 72, 153, 0.35)" stroke="#ec4899" strokeWidth="2.5" />
                )}
                {settings.workingSpace === 'rec2020' && (
                  <polygon points="320,225 95,30 70,280" fill="rgba(59, 130, 246, 0.35)" stroke="#3b82f6" strokeWidth="2.5" />
                )}
                {settings.workingSpace === 'acescg' && (
                  <polygon points="330,225 90,25 65,285" fill="rgba(168, 85, 247, 0.35)" stroke="#a855f7" strokeWidth="2.5" />
                )}

                {/* D65 / D50 White Point Mark */}
                <circle cx="170" cy="180" r="4" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
                <text x="180" y="184" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
                  {activeSpaceData.whitePoint}
                </text>
              </svg>
            </div>
          </div>

          {/* Color Space Selection Grid */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300">Working Gamut Profiles</label>
            <div className="grid grid-cols-1 gap-1.5">
              {Object.values(COLOR_SPACES_DATA).map((cs) => {
                const isSelected = settings.workingSpace === cs.id;
                return (
                  <button
                    key={cs.id}
                    onClick={() => updateSetting('workingSpace', cs.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">{cs.name}</span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-900 border border-slate-700 text-indigo-300">
                          {cs.gamutCoveragePercent}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-tight">{cs.description}</div>
                    <div className="text-[9px] text-slate-500 mt-1 font-mono">
                      Illuminant: {cs.whitePoint} • Gamma: {cs.gamma} • Best for: {cs.bestFor}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BIT DEPTH & PRECISION */}
      {activeTab === 'bit-depth' && (
        <div className="space-y-3.5">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                Processing Bit Depth Precision
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                {settings.bitDepth === '8-bit' ? '16.7M Colors' : settings.bitDepth === '16-bit' ? '281 Trillion Colors' : 'Floating Point Linear'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Higher bit depths eliminate posterization and banding in sky gradients, shadows, and fine retouching.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              {
                id: '8-bit',
                title: '8-bit Standard',
                levels: '256 levels/channel',
                desc: 'Standard web output & fast preview rendering',
                badge: 'SDR 24-BIT',
              },
              {
                id: '16-bit',
                title: '16-bit Pro Precision',
                levels: '65,536 levels/channel',
                desc: 'Recommended for RAW photos & smooth gradients',
                badge: '48-BIT MASTER',
              },
              {
                id: '32-bit-float',
                title: '32-bit Floating Point',
                levels: 'Infinite range',
                desc: 'Cinematic VFX, unclipped specular highlights',
                badge: 'HDR FLOAT',
              },
            ].map((bd) => {
              const isSelected = settings.bitDepth === bd.id;
              return (
                <button
                  key={bd.id}
                  onClick={() => updateSetting('bitDepth', bd.id as any)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-[9px] font-mono text-indigo-400 font-bold">{bd.badge}</div>
                  <div className="text-xs font-bold text-slate-100 mt-0.5">{bd.title}</div>
                  <div className="text-[10px] text-slate-300 font-mono mt-1">{bd.levels}</div>
                  <div className="text-[9px] text-slate-500 mt-1 leading-tight">{bd.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Dynamic Range Precision Scope Visualizer */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="text-[10px] font-bold text-slate-400 flex items-center justify-between">
              <span>Channel Quantization Fidelity</span>
              <span className="font-mono text-indigo-300">
                {settings.bitDepth === '8-bit' ? '8 bits (0-255)' : settings.bitDepth === '16-bit' ? '16 bits (0-65535)' : '32-bit Float (-∞ to +∞)'}
              </span>
            </div>

            <div className="h-3 rounded-full bg-slate-900 overflow-hidden flex border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-300"
                style={{
                  width: settings.bitDepth === '8-bit' ? '33%' : settings.bitDepth === '16-bit' ? '66%' : '100%',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HDR DISPLAY & EDR */}
      {activeTab === 'hdr' && (
        <div className="space-y-3.5">
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-bold text-slate-200 text-xs">HDR Display & EDR Headroom</div>
                  <div className="text-[10px] text-slate-400">Extended dynamic range rendering for Apple XDR and OLED panels</div>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.hdrDisplayEnabled}
                  onChange={(e) => updateSetting('hdrDisplayEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>

            {settings.hdrDisplayEnabled && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Peak Target Luminance (Nits)</span>
                    <span className="font-mono text-amber-300 font-bold">{settings.hdrPeakLuminanceNits} Nits</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={1600}
                    step={50}
                    value={settings.hdrPeakLuminanceNits}
                    onChange={(e) => updateSetting('hdrPeakLuminanceNits', Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                    <span>SDR 200 nits</span>
                    <span>HDR 1000 nits (Cinema)</span>
                    <span>1600 nits (XDR Pro)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Highlight Specular Recovery</span>
                    <span className="font-mono text-slate-200">{settings.hdrHighlightRecovery}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.hdrHighlightRecovery}
                    onChange={(e) => updateSetting('hdrHighlightRecovery', Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer pt-1">
                  <span>Enable macOS EDR Headroom Expansion</span>
                  <input
                    type="checkbox"
                    checked={settings.edrBoost}
                    onChange={(e) => updateSetting('edrBoost', e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ICC SPECS & METADATA */}
      {activeTab === 'icc-info' && (
        <div className="space-y-3">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 font-mono text-xs">
            <div className="text-slate-300 font-bold border-b border-slate-800 pb-1.5 flex items-center gap-1.5 text-indigo-400">
              <FileCheck className="w-4 h-4" />
              Active Color Space ICC Profile Header
            </div>

            <div className="space-y-1.5 text-[11px] pt-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Profile Name:</span>
                <span className="font-bold text-white">{activeSpaceData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Profile Class:</span>
                <span>Display Device Profile (display)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Illuminant:</span>
                <span>CIE Standard Illuminant {activeSpaceData.whitePoint}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transfer Curve:</span>
                <span>{activeSpaceData.gamma}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Red Primary (xy):</span>
                <span>[{activeSpaceData.primaries.r.join(', ')}]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Green Primary (xy):</span>
                <span>[{activeSpaceData.primaries.g.join(', ')}]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Blue Primary (xy):</span>
                <span>[{activeSpaceData.primaries.b.join(', ')}]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">White Point (xy):</span>
                <span>[{activeSpaceData.primaries.w.join(', ')}]</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
