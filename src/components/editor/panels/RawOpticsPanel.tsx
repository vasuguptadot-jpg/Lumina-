import React, { useState } from 'react';
import {
  AdjustmentSettings,
  RawMetadata,
  CameraProfileId,
  RawWbPreset,
  DemosaicMethod,
  OpticsSettings,
  RawDevelopSettings,
  CameraProfileSettings,
} from '../../../types/editor';
import { CAMERA_PROFILES, getCameraProfile } from '../../../engine/cameraProfiles';
import { RAW_WB_PRESETS } from '../../../engine/rawEngine';
import {
  Camera,
  Layers,
  Sparkles,
  Sliders,
  Sun,
  ShieldCheck,
  Disc,
  Info,
  Maximize2,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface RawOpticsPanelProps {
  adjustments: AdjustmentSettings;
  metadata?: RawMetadata;
  onChangeAdjustments: (adjustments: AdjustmentSettings) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const RawOpticsPanel: React.FC<RawOpticsPanelProps> = ({
  adjustments,
  metadata,
  onChangeAdjustments,
  showToast,
}) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'wb' | 'dr' | 'optics' | 'metadata'>('profile');
  const [profileCategory, setProfileCategory] = useState<'Adobe-Like' | 'Camera Matching'>('Adobe-Like');

  // Active raw settings
  const rawDev: RawDevelopSettings = adjustments.rawDevelop || {
    wbPreset: 'as-shot',
    kelvin: metadata?.wbKelvin || 5500,
    wbTint: metadata?.wbTint || 10,
    highlightRecovery: 0,
    shadowRecovery: 0,
    blackLevel: 0,
    demosaicMethod: 'ahd',
    moireReduction: 0,
  };

  const camProfile: CameraProfileSettings = adjustments.cameraProfile || {
    profileId: 'adobe-color',
    intensity: 100,
  };

  const optics: OpticsSettings = adjustments.optics || {
    enableDistortionCorrection: false,
    distortion: 0,
    enableCACorrection: false,
    caRedCyan: 0,
    caBlueYellow: 0,
    defringeAmount: 0,
    defringeThreshold: 50,
    enableLensVignette: false,
    lensVignetteAmount: 0,
    lensVignetteMidpoint: 50,
    lensVignetteFeather: 50,
  };

  const updateRawDev = (partial: Partial<RawDevelopSettings>) => {
    onChangeAdjustments({
      ...adjustments,
      rawDevelop: {
        ...rawDev,
        ...partial,
      },
    });
  };

  const updateCamProfile = (partial: Partial<CameraProfileSettings>) => {
    onChangeAdjustments({
      ...adjustments,
      cameraProfile: {
        ...camProfile,
        ...partial,
      },
    });
  };

  const updateOptics = (partial: Partial<OpticsSettings>) => {
    onChangeAdjustments({
      ...adjustments,
      optics: {
        ...optics,
        ...partial,
      },
    });
  };

  // Preset White Balance handler
  const handleSelectWbPreset = (presetId: RawWbPreset) => {
    const preset = RAW_WB_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    if (presetId === 'as-shot') {
      updateRawDev({
        wbPreset: 'as-shot',
        kelvin: metadata?.wbKelvin || 5500,
        wbTint: metadata?.wbTint || 10,
      });
      showToast('info', 'White Balance', 'Restored sensor original As-Shot calibration');
    } else if (presetId === 'auto') {
      updateRawDev({
        wbPreset: 'auto',
        kelvin: 5200,
        wbTint: 8,
      });
      showToast('success', 'Auto WB', 'Calculated daylight balanced color temperature');
    } else {
      updateRawDev({
        wbPreset: presetId,
        kelvin: preset.kelvin,
        wbTint: preset.tint,
      });
    }
  };

  const filteredProfiles = CAMERA_PROFILES.filter((p) => p.category === profileCategory);
  const activeProfileDef = getCameraProfile(camProfile.profileId);

  return (
    <div className="p-4 space-y-6 select-none">
      {/* Sensor Metadata Badge */}
      <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950/60 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xs">
            RAW
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">
              {metadata?.cameraMake || 'Pro Sensor'} {metadata?.cameraModel || '14-Bit Digital Negative'}
            </div>
            <div className="text-[10px] text-slate-400">
              {metadata?.bayerPattern || 'RGGB'} Bayer Matrix • {metadata?.bitDepth || 14}-Bit Dynamic Latitude
            </div>
          </div>
        </div>
        <button
          onClick={() => setActiveSection(activeSection === 'metadata' ? 'profile' : 'metadata')}
          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-colors ${
            activeSection === 'metadata'
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          EXIF Info
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] font-semibold">
        <button
          onClick={() => setActiveSection('profile')}
          className={`py-1.5 rounded-lg transition-colors ${
            activeSection === 'profile'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveSection('wb')}
          className={`py-1.5 rounded-lg transition-colors ${
            activeSection === 'wb'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          WB & Temp
        </button>
        <button
          onClick={() => setActiveSection('dr')}
          className={`py-1.5 rounded-lg transition-colors ${
            activeSection === 'dr'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Recovery
        </button>
        <button
          onClick={() => setActiveSection('optics')}
          className={`py-1.5 rounded-lg transition-colors ${
            activeSection === 'optics'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Optics
        </button>
      </div>

      {/* SECTION 1: CAMERA PROFILES */}
      {activeSection === 'profile' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-indigo-400" />
              <span>Camera Profiles</span>
            </label>
            <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px]">
              <button
                onClick={() => setProfileCategory('Adobe-Like')}
                className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                  profileCategory === 'Adobe-Like' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                Adobe-Like
              </button>
              <button
                onClick={() => setProfileCategory('Camera Matching')}
                className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                  profileCategory === 'Camera Matching' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                Camera Match
              </button>
            </div>
          </div>

          {/* Profile Cards Grid */}
          <div className="grid grid-cols-2 gap-2">
            {filteredProfiles.map((p) => {
              const isSelected = camProfile.profileId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => updateCamProfile({ profileId: p.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">{p.name}</span>
                    <div className="flex gap-0.5">
                      {p.colors.map((c, i) => (
                        <span
                          key={i}
                          className="w-2 h-2 rounded-full border border-slate-950"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                    {p.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Profile Intensity Slider */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Profile Intensity</span>
              <span className="font-mono text-indigo-400">{camProfile.intensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={camProfile.intensity}
              onChange={(e) => updateCamProfile({ intensity: Number(e.target.value) })}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* SECTION 2: WHITE BALANCE & TEMPERATURE */}
      {activeSection === 'wb' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>RAW White Balance</span>
            </label>
            <button
              onClick={() => handleSelectWbPreset('auto')}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 transition-colors"
            >
              <Zap className="w-3 h-3" />
              Auto WB
            </button>
          </div>

          {/* WB Presets Pills */}
          <div className="flex flex-wrap gap-1.5">
            {RAW_WB_PRESETS.map((p) => {
              const isActive = rawDev.wbPreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectWbPreset(p.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>

          {/* Kelvin Temperature Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Temperature (Kelvin)</span>
              <span className="font-mono text-amber-400 font-bold">{rawDev.kelvin} K</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="2000"
                max="12000"
                step="50"
                value={rawDev.kelvin}
                onChange={(e) =>
                  updateRawDev({
                    kelvin: Number(e.target.value),
                    wbPreset: 'custom',
                  })
                }
                style={{
                  background:
                    'linear-gradient(to right, #ff8b14 0%, #ffe4a0 30%, #ffffff 50%, #b8dcff 70%, #60a5fa 100%)',
                }}
                className="w-full h-2 rounded-lg cursor-pointer appearance-none"
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>2000K (Candle)</span>
              <span>5500K (Daylight)</span>
              <span>12000K (Sky)</span>
            </div>
          </div>

          {/* Tint Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Tint (Green / Magenta)</span>
              <span className="font-mono text-purple-400 font-bold">
                {rawDev.wbTint > 0 ? `+${rawDev.wbTint}` : rawDev.wbTint}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="-100"
                max="100"
                value={rawDev.wbTint}
                onChange={(e) =>
                  updateRawDev({
                    wbTint: Number(e.target.value),
                    wbPreset: 'custom',
                  })
                }
                style={{
                  background:
                    'linear-gradient(to right, #22c55e 0%, #cbd5e1 50%, #ec4899 100%)',
                }}
                className="w-full h-2 rounded-lg cursor-pointer appearance-none"
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>-100 (Green)</span>
              <span>0</span>
              <span>+100 (Magenta)</span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: RAW DYNAMIC RANGE & RECOVERY */}
      {activeSection === 'dr' && (
        <div className="space-y-5">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>RAW Exposure & Dynamic Range Recovery</span>
          </label>

          {/* Highlight Recovery */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">RAW Highlight Recovery</span>
              <span className="font-mono text-emerald-400">{rawDev.highlightRecovery}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={rawDev.highlightRecovery}
              onChange={(e) => updateRawDev({ highlightRecovery: Number(e.target.value) })}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">
              Reconstructs blown sensor channels with soft specular roll-off.
            </p>
          </div>

          {/* Shadow Recovery */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">RAW Shadow Recovery</span>
              <span className="font-mono text-emerald-400">{rawDev.shadowRecovery}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={rawDev.shadowRecovery}
              onChange={(e) => updateRawDev({ shadowRecovery: Number(e.target.value) })}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">
              Lifts deep blacks while preserving sensor noise floor baseline.
            </p>
          </div>

          {/* Black Level Calibration */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Black Level Calibration</span>
              <span className="font-mono text-slate-400">
                {rawDev.blackLevel > 0 ? `+${rawDev.blackLevel}` : rawDev.blackLevel}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              value={rawDev.blackLevel}
              onChange={(e) => updateRawDev({ blackLevel: Number(e.target.value) })}
              className="w-full accent-slate-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Demosaicing Method Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>RAW Demosaicing Algorithm</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'ahd', name: 'AHD (Adaptive)', desc: 'Directional homogeneity' },
                { id: 'vng', name: 'VNG (Gradients)', desc: 'Organic fine textures' },
                { id: 'superpixel', name: 'Super-Pixel', desc: 'Crisp high acutance' },
                { id: 'bilinear', name: 'Bilinear', desc: 'Ultra-fast draft' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => updateRawDev({ demosaicMethod: m.id as DemosaicMethod })}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    rawDev.demosaicMethod === m.id
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold">{m.name}</div>
                  <div className="text-[9px] text-slate-500">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Anti-Moire & False Color Suppression */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Anti-Moire Color Suppression</span>
              <span className="font-mono text-emerald-400">{rawDev.moireReduction}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={rawDev.moireReduction}
              onChange={(e) => updateRawDev({ moireReduction: Number(e.target.value) })}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* SECTION 4: OPTICS & LENS CORRECTIONS */}
      {activeSection === 'optics' && (
        <div className="space-y-5">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Disc className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lens Profile & Optics Corrections</span>
          </label>

          {/* 1. Lens Distortion Correction */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Distortion Correction</span>
              <input
                type="checkbox"
                checked={optics.enableDistortionCorrection}
                onChange={(e) => updateOptics({ enableDistortionCorrection: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>
            {optics.enableDistortionCorrection && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Barrel (-) ↔ Pincushion (+)</span>
                  <span className="font-mono text-cyan-400">
                    {optics.distortion > 0 ? `+${optics.distortion}` : optics.distortion}
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={optics.distortion}
                  onChange={(e) => updateOptics({ distortion: Number(e.target.value) })}
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* 2. Chromatic Aberration & Defringe */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Chromatic Aberration</span>
              <input
                type="checkbox"
                checked={optics.enableCACorrection}
                onChange={(e) => updateOptics({ enableCACorrection: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>
            {optics.enableCACorrection && (
              <div className="space-y-3 pt-1">
                {/* Red/Cyan Fringe */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Lateral CA: Red / Cyan</span>
                    <span className="font-mono text-cyan-400">
                      {optics.caRedCyan > 0 ? `+${optics.caRedCyan}` : optics.caRedCyan}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={optics.caRedCyan}
                    onChange={(e) => updateOptics({ caRedCyan: Number(e.target.value) })}
                    className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Blue/Yellow Fringe */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Lateral CA: Blue / Yellow</span>
                    <span className="font-mono text-cyan-400">
                      {optics.caBlueYellow > 0 ? `+${optics.caBlueYellow}` : optics.caBlueYellow}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={optics.caBlueYellow}
                    onChange={(e) => updateOptics({ caBlueYellow: Number(e.target.value) })}
                    className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Defringe Amount */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Defringe (Purple / Green Edge)</span>
                    <span className="font-mono text-purple-400">{optics.defringeAmount}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={optics.defringeAmount}
                    onChange={(e) => updateOptics({ defringeAmount: Number(e.target.value) })}
                    className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Lens Vignetting Falloff */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Lens Vignetting Falloff</span>
              <input
                type="checkbox"
                checked={optics.enableLensVignette}
                onChange={(e) => updateOptics({ enableLensVignette: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>
            {optics.enableLensVignette && (
              <div className="space-y-2 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Vignette Amount (Corner Brighten)</span>
                    <span className="font-mono text-cyan-400">
                      {optics.lensVignetteAmount > 0 ? `+${optics.lensVignetteAmount}` : optics.lensVignetteAmount}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={optics.lensVignetteAmount}
                    onChange={(e) => updateOptics({ lensVignetteAmount: Number(e.target.value) })}
                    className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Midpoint</span>
                    <span className="font-mono text-slate-400">{optics.lensVignetteMidpoint}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={optics.lensVignetteMidpoint}
                    onChange={(e) => updateOptics({ lensVignetteMidpoint: Number(e.target.value) })}
                    className="w-full accent-slate-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: METADATA INSPECTOR */}
      {activeSection === 'metadata' && (
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>RAW Sensor & EXIF Metadata</span>
          </label>

          <div className="space-y-2 text-xs bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 font-sans">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Camera Make</span>
              <span className="font-semibold text-slate-200">{metadata?.cameraMake || 'Sony / Canon'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Camera Model</span>
              <span className="font-semibold text-slate-200">{metadata?.cameraModel || 'Alpha 7R V'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Lens Profile</span>
              <span className="font-semibold text-slate-200">{metadata?.lens || 'FE 24-70mm F2.8 GM II'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Focal Length</span>
              <span className="font-semibold text-slate-200">{metadata?.focalLength || '35mm'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Aperture</span>
              <span className="font-semibold text-slate-200">{metadata?.aperture || 'f/2.8'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Shutter Speed</span>
              <span className="font-semibold text-slate-200">{metadata?.shutterSpeed || '1/250s'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">ISO Speed</span>
              <span className="font-semibold text-slate-200">ISO {metadata?.iso || 100}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Color Space</span>
              <span className="font-semibold text-indigo-400">{metadata?.colorSpace || 'ProPhoto RGB'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Sensor Bayer Array</span>
              <span className="font-semibold text-emerald-400">{metadata?.bayerPattern || 'RGGB'} 14-Bit</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Exposure Bias</span>
              <span className="font-semibold text-slate-200">{metadata?.exposureBias || '0.0 EV'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
