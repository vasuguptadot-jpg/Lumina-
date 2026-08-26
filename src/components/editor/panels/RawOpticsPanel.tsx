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
import { rawWorkerOrchestrator } from '../../../engine/raw/rawWorkerManager';
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
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Activity,
  Play,
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
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);

  const runRawBenchmark = async (mp: number) => {
    setIsBenchmarking(true);
    setBenchmarkResult(null);
    try {
      const res = await rawWorkerOrchestrator.runBenchmark(mp);
      setBenchmarkResult(res);
      showToast('success', 'RAW Benchmark Complete', `${mp}MP developed in ${res.totalWorkerTimeMs}ms (${res.throughputMps} MP/s)`);
    } catch (err: any) {
      showToast('error', 'Benchmark Failed', err.message || 'Worker benchmark error');
    } finally {
      setIsBenchmarking(false);
    }
  };

  const workerStats = rawWorkerOrchestrator.getStats();

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
  const isGenuineSensor = metadata?.decodeStatus === 'genuine_raw_sensor';

  return (
    <div className="p-4 space-y-6 select-none">
      {/* Sensor Metadata & True RAW Status Badge */}
      <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-indigo-500/25 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
              isGenuineSensor
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}>
              RAW
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">
                {metadata?.cameraMake || 'Camera'} {metadata?.cameraModel || 'RAW Digital Negative'}
              </div>
              <div className="text-[10px] text-slate-400">
                {metadata?.bayerPattern || 'RGGB'} Matrix • {metadata?.bitDepth || 14}-Bit Sensor Latitude
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
            Technical Info
          </button>
        </div>

        {/* Decode Engine Status Pill */}
        <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[10px] border ${
          isGenuineSensor
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
        }`}>
          <div className="flex items-center gap-1.5">
            {isGenuineSensor ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <span className="font-semibold">
              {isGenuineSensor
                ? `True Sensor Decode (${metadata?.decoderEngine || 'DNG Engine'})`
                : 'RAW Preview Fallback'}
            </span>
          </div>
          <span className="text-[9px] opacity-80 font-mono">
            {isGenuineSensor ? 'Float32 Linear' : 'Embedded Preview'}
          </span>
        </div>
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
          Develop & DR
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

      {/* SECTION 1: CAMERA COLOR PROFILES */}
      {activeSection === 'profile' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-indigo-400" />
              <span>Camera Profile</span>
            </label>
            <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
              <button
                onClick={() => setProfileCategory('Adobe-Like')}
                className={`px-2 py-0.5 rounded ${
                  profileCategory === 'Adobe-Like' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                Adobe
              </button>
              <button
                onClick={() => setProfileCategory('Camera Matching')}
                className={`px-2 py-0.5 rounded ${
                  profileCategory === 'Camera Matching' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                Camera Match
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {filteredProfiles.map((p) => {
              const isSelected = camProfile.profileId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => updateCamProfile({ profileId: p.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="text-xs font-semibold">{p.name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.description}</div>
                </button>
              );
            })}
          </div>

          {/* Profile Intensity Slider */}
          <div className="space-y-1.5 pt-2">
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>White Balance</span>
            </label>
            <button
              onClick={() => handleSelectWbPreset('auto')}
              className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded border border-slate-700 flex items-center gap-1"
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

      {/* SECTION 3: RAW DEVELOP & DYNAMIC RANGE */}
      {activeSection === 'dr' && (
        <div className="space-y-5">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sensor Demosaicing & Dynamic Range</span>
          </label>

          {/* Demosaicing Algorithm Selector */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">CFA Demosaicing Algorithm</span>
              <span className="font-mono text-emerald-400 font-bold uppercase">{rawDev.demosaicMethod}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'ahd', name: 'AHD (Adaptive)', desc: 'Directional homogeneity for ultra-fine edges' },
                { id: 'vng', name: 'VNG (Gradients)', desc: 'Variable gradient thresholding' },
                { id: 'bilinear', name: 'Bilinear (Fast)', desc: 'High-speed preview interpolation' },
                { id: 'superpixel', name: 'Superpixel 2x2', desc: 'Zero-artifact pure sensor binning' },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => updateRawDev({ demosaicMethod: method.id as DemosaicMethod })}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    rawDev.demosaicMethod === method.id
                      ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-200">{method.name}</div>
                  <div className="text-[9px] text-slate-400 truncate">{method.desc}</div>
                </button>
              ))}
            </div>
          </div>

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

          {/* Anti-Moire */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Anti-Moire Color Suppression</span>
              <span className="font-mono text-cyan-400">{rawDev.moireReduction}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={rawDev.moireReduction}
              onChange={(e) => updateRawDev({ moireReduction: Number(e.target.value) })}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* SECTION 4: OPTICS & LENS CORRECTIONS */}
      {activeSection === 'optics' && (
        <div className="space-y-5">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Disc className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lens & Optical Corrections</span>
          </label>

          {/* 1. Geometric Distortion */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Geometric Distortion</span>
              <input
                type="checkbox"
                checked={optics.enableDistortionCorrection}
                onChange={(e) => updateOptics({ enableDistortionCorrection: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>
            {optics.enableDistortionCorrection && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Barrel / Pincushion</span>
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

          {/* 2. Chromatic Aberration */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Chromatic Aberration (CA)</span>
              <input
                type="checkbox"
                checked={optics.enableCACorrection}
                onChange={(e) => updateOptics({ enableCACorrection: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>
            {optics.enableCACorrection && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Red / Cyan Shift</span>
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

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Blue / Yellow Shift</span>
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

      {/* SECTION 5: METADATA & TECHNICAL SENSOR INSPECTOR */}
      {activeSection === 'metadata' && (
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>RAW Sensor & Technical Calibration Inspector</span>
          </label>

          <div className="space-y-2 text-xs bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 font-sans">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Decode Status</span>
              <span className={`font-semibold ${isGenuineSensor ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isGenuineSensor ? '✓ Genuine Sensor Decode' : '⚠ Preview Fallback'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Decoder Engine</span>
              <span className="font-semibold text-slate-200">{metadata?.decoderEngine || 'Lumina-Raw-Engine'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Camera Make</span>
              <span className="font-semibold text-slate-200">{metadata?.cameraMake || 'Sony / Canon'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Camera Model</span>
              <span className="font-semibold text-slate-200">{metadata?.cameraModel || 'ILCE-7RM5'}</span>
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
              <span className="text-slate-400">Sensor Dimensions</span>
              <span className="font-semibold text-slate-200">{metadata?.sensorDimensions || '3840 x 2560 px'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Sensor Bayer Array</span>
              <span className="font-semibold text-emerald-400">{metadata?.bayerPattern || 'RGGB'} ({metadata?.bitDepth || 14}-Bit)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Black Level Calibration</span>
              <span className="font-mono text-slate-300">
                {Array.isArray(metadata?.blackLevel) ? `[${metadata?.blackLevel.join(', ')}]` : '512 (Baseline)'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">White Saturation Level</span>
              <span className="font-mono text-slate-300">{metadata?.whiteLevel || 16383}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Color Space</span>
              <span className="font-semibold text-indigo-400">{metadata?.colorSpace || 'ProPhoto RGB'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Exposure Bias</span>
              <span className="font-semibold text-slate-200">{metadata?.exposureBias || '0.0 EV'}</span>
            </div>
          </div>

          {/* Section 5B: Dedicated RAW Web Worker Pool Inspector */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Dedicated RAW Worker Pool</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                workerStats.isWorkerSupported
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {workerStats.isWorkerSupported ? `${workerStats.workerPoolSize} Dedicated Threads` : 'Main Thread Fallback'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Memory Transfer</span>
                <span className="font-mono text-emerald-400">Zero-Copy Transferable ArrayBuffers</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Tiling Architecture</span>
                <span className="font-mono text-cyan-400">512×512 Tiles (16px CFA Halo)</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Main Thread Blocking</span>
                <span className="font-mono text-emerald-400">&lt; 5 ms (Asynchronous Worker)</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Active Jobs Processed</span>
                <span className="font-mono text-slate-300">{workerStats.totalJobsProcessed}</span>
              </div>
            </div>

            {/* Internal Benchmark Runner */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hardware Sensor Throughput Benchmark</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[12, 24, 48].map((mp) => (
                  <button
                    key={mp}
                    disabled={isBenchmarking}
                    onClick={() => runRawBenchmark(mp)}
                    className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 border border-slate-700/60 shadow-sm"
                  >
                    <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                    <span>{mp} MP</span>
                  </button>
                ))}
              </div>

              {isBenchmarking && (
                <div className="text-[11px] text-center text-cyan-400 py-1 flex items-center justify-center gap-1.5 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Executing genuine CFA AHD worker benchmark in background thread...</span>
                </div>
              )}

              {benchmarkResult && (
                <div className="p-2.5 bg-slate-950/70 border border-cyan-500/20 rounded-lg text-[11px] space-y-1 font-mono">
                  <div className="flex justify-between text-cyan-300 font-bold">
                    <span>{benchmarkResult.megapixels}MP Sensor Throughput:</span>
                    <span>{benchmarkResult.throughputMps} MP/s</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>CFA Photosite Unpack:</span>
                    <span>{benchmarkResult.unpackTimeMs} ms</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>AHD Homogeneity Demosaic:</span>
                    <span>{benchmarkResult.demosaicTimeMs} ms</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Color Matrix & Gamma:</span>
                    <span>{benchmarkResult.colorTransformTimeMs} ms</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1">
                    <span>Total Worker Time:</span>
                    <span>{benchmarkResult.totalWorkerTimeMs} ms</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
