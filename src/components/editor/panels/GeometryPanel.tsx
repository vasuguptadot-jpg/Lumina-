import React, { useState, useRef } from 'react';
import {
  Maximize2,
  Compass,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Sparkles,
  RotateCcw as ResetIcon,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Eye,
  Grid,
  Grid3X3,
  Box,
  Layers,
  Wand2,
  Camera,
  Scissors,
  Move,
  Anchor,
  CircleDot,
  Radio,
  Flame,
  Zap,
} from 'lucide-react';
import { Project } from '../../../types/editor';
import {
  GeometryOptions,
  requestAiGeometryCorrection,
} from '../../../services/aiService';

interface GeometryPanelProps {
  project: Project;
  onUpdateImage: (newUrl: string, name?: string) => void;
  isAiProcessing: boolean;
  setIsAiProcessing: (loading: boolean) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const GeometryPanel: React.FC<GeometryPanelProps> = ({
  project,
  onUpdateImage,
  isAiProcessing,
  setIsAiProcessing,
  showToast,
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'perspective' | 'lens' | 'warp' | 'liquify' | 'puppet' | 'transform'
  >('perspective');

  // 1. Perspective & Upright State
  const [verticalCorrection, setVerticalCorrection] = useState<number>(0);
  const [horizontalCorrection, setHorizontalCorrection] = useState<number>(0);
  const [pitchAngle, setPitchAngle] = useState<number>(0);
  const [yawAngle, setYawAngle] = useState<number>(0);
  const [autoFillEdges, setAutoFillEdges] = useState<boolean>(true);

  // 2. Lens & Optics Correction State
  const [lensDistortion, setLensDistortion] = useState<number>(0); // -100 barrel to +100 pincushion
  const [fisheyeDefishStrength, setFisheyeDefishStrength] = useState<number>(75);
  const [wideAngleStretchCorrection, setWideAngleStretchCorrection] = useState<number>(60);
  const [caDefringe, setCaDefringe] = useState<boolean>(true);
  const [vignetteCompensation, setVignetteCompensation] = useState<number>(40);

  // 3. Warp & Distort State
  const [warpType, setWarpType] = useState<
    'arch' | 'fisheye' | 'wave' | 'twist' | 'cylinder' | 'bulge' | 'pinch'
  >('arch');
  const [warpBend, setWarpBend] = useState<number>(35);
  const [warpHorizontalDistortion, setWarpHorizontalDistortion] = useState<number>(0);
  const [warpVerticalDistortion, setWarpVerticalDistortion] = useState<number>(0);

  // 4. Liquify & Sculpt State
  const [liquifyMode, setLiquifyMode] = useState<
    'forward-warp' | 'bloat' | 'pucker' | 'twirl-cw' | 'twirl-ccw' | 'reconstruct'
  >('forward-warp');
  const [brushSize, setBrushSize] = useState<number>(50);
  const [brushDensity, setBrushDensity] = useState<number>(60);
  const [brushPressure, setBrushPressure] = useState<number>(50);
  const [liquifyTargetArea, setLiquifyTargetArea] = useState<string>('Selected region / subject silhouette');

  // 5. Puppet Warp State
  const [puppetPins, setPuppetPins] = useState<
    Array<{ id: string; name: string; x: number; y: number; pinned: boolean }>
  >([
    { id: 'pin-1', name: 'Anchor Point A', x: 25, y: 30, pinned: true },
    { id: 'pin-2', name: 'Deform Joint B', x: 50, y: 50, pinned: false },
    { id: 'pin-3', name: 'Anchor Point C', x: 75, y: 70, pinned: true },
  ]);
  const [meshDensity, setMeshDensity] = useState<'normal' | 'more-points' | 'rigid'>('normal');

  // 6. Transform & Skew State
  const [skewX, setSkewX] = useState<number>(0);
  const [skewY, setSkewY] = useState<number>(0);
  const [rotateDeg, setRotateDeg] = useState<number>(0);
  const [scaleX, setScaleX] = useState<number>(100);
  const [scaleY, setScaleY] = useState<number>(100);

  // Custom Prompt
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // 1-Click Perspective Upright Action
  const handleAutoUpright = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    setIsAiProcessing(true);
    showToast('info', 'Auto Upright Geometry', 'Detecting architectural lines, squaring verticals & leveling horizon...');

    try {
      const base64 = canvas.toDataURL('image/png');
      const res = await requestAiGeometryCorrection(base64, {
        operation: 'auto-upright',
        autoFillEdges,
      });

      if (res.success && res.imageUrl) {
        onUpdateImage(res.imageUrl, `Upright_${project.name}`);
        showToast('success', 'Upright Corrected', 'Verticals straightened and horizon leveled with seamless edge fill.');
      } else {
        showToast('error', 'Correction Failed', res.message || res.error);
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Execute Correction by Active Tab
  const handleExecuteCorrection = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    setIsAiProcessing(true);
    showToast('info', 'Processing Geometry & Optics', 'Applying non-destructive geometric transformations...');

    try {
      const base64 = canvas.toDataURL('image/png');
      let options: GeometryOptions = {
        operation: 'auto-upright',
        autoFillEdges,
        customPrompt: customPrompt.trim() || undefined,
      };

      if (activeTab === 'perspective') {
        if (Math.abs(verticalCorrection) >= Math.abs(horizontalCorrection)) {
          options = {
            operation: 'vertical-keystone',
            verticalCorrection,
            horizontalCorrection,
            autoFillEdges,
            customPrompt,
          };
        } else {
          options = {
            operation: 'horizontal-perspective',
            verticalCorrection,
            horizontalCorrection,
            autoFillEdges,
            customPrompt,
          };
        }
      } else if (activeTab === 'lens') {
        if (fisheyeDefishStrength > 50) {
          options = {
            operation: 'fisheye-defish',
            fisheyeStrength: fisheyeDefishStrength,
            barrelDistortion: lensDistortion,
            autoFillEdges,
            customPrompt: `Defish curvilinear distortion, remove lens chromatic aberration, vignetting compensation ${vignetteCompensation}%`,
          };
        } else {
          options = {
            operation: 'wide-angle-correction',
            wideAngleStrechCorrection: wideAngleStretchCorrection,
            barrelDistortion: lensDistortion,
            autoFillEdges,
            customPrompt,
          };
        }
      } else if (activeTab === 'warp') {
        options = {
          operation: 'custom-warp',
          meshWarpNotes: `${warpType.toUpperCase()} Warp with ${warpBend}% bend, H-Distort ${warpHorizontalDistortion}%, V-Distort ${warpVerticalDistortion}%`,
          autoFillEdges,
          customPrompt,
        };
      } else if (activeTab === 'liquify') {
        options = {
          operation: 'liquify',
          liquifyMode,
          liquifyIntensity: brushPressure,
          liquifyTargetArea,
          autoFillEdges,
          customPrompt,
        };
      } else if (activeTab === 'puppet') {
        options = {
          operation: 'puppet-warp',
          puppetPins: puppetPins.map((p) => ({
            id: p.id,
            x: p.x,
            y: p.y,
            pinned: p.pinned,
          })),
          meshWarpNotes: `Mesh Density: ${meshDensity}, Articulate joints deform with anatomical preservation.`,
          autoFillEdges,
          customPrompt,
        };
      } else if (activeTab === 'transform') {
        options = {
          operation: 'skew-transform',
          skewX,
          skewY,
          rotateAngle: rotateDeg,
          scaleX,
          scaleY,
          autoFillEdges,
          customPrompt,
        };
      }

      const res = await requestAiGeometryCorrection(base64, options);

      if (res.success && res.imageUrl) {
        onUpdateImage(res.imageUrl, `Geom_${activeTab}_${project.name}`);
        showToast('success', 'Geometric Transform Applied', 'High-fidelity perspective & optical rectification complete.');
      } else {
        showToast('error', 'Transform Failed', res.message || res.error);
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleResetCurrentTab = () => {
    if (activeTab === 'perspective') {
      setVerticalCorrection(0);
      setHorizontalCorrection(0);
      setPitchAngle(0);
      setYawAngle(0);
    } else if (activeTab === 'lens') {
      setLensDistortion(0);
      setFisheyeDefishStrength(75);
      setWideAngleStretchCorrection(60);
      setVignetteCompensation(40);
    } else if (activeTab === 'warp') {
      setWarpBend(35);
      setWarpHorizontalDistortion(0);
      setWarpVerticalDistortion(0);
    } else if (activeTab === 'liquify') {
      setBrushSize(50);
      setBrushDensity(60);
      setBrushPressure(50);
    } else if (activeTab === 'transform') {
      setSkewX(0);
      setSkewY(0);
      setRotateDeg(0);
      setScaleX(100);
      setScaleY(100);
    }
    showToast('info', 'Values Reset', 'Default geometry parameters restored.');
  };

  return (
    <div className="p-4 space-y-4 select-none text-slate-200">
      {/* Studio Header Banner */}
      <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-cyan-950/60 border border-indigo-500/30 p-3.5 rounded-2xl space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Maximize2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-indigo-300 uppercase tracking-wide">
                Perspective & Geometry Studio
              </div>
              <div className="text-[10px] text-slate-400">
                Vertical/Horizontal keystone, Liquify, Mesh Warp, Lens & Fisheye Defish
              </div>
            </div>
          </div>

          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            PRO OPTICS
          </span>
        </div>

        {/* 1-Click Auto Upright Bar */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
          <button
            onClick={handleAutoUpright}
            disabled={isAiProcessing}
            className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Auto Upright & Level</span>
          </button>

          <button
            onClick={handleResetCurrentTab}
            className="py-1.5 px-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-all flex items-center gap-1"
          >
            <ResetIcon className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Mode Sub-Tabs */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold overflow-x-auto scrollbar-none shadow-inner">
        {[
          { id: 'perspective', label: 'Perspective', icon: Compass },
          { id: 'lens', label: 'Lens & Fisheye', icon: Camera },
          { id: 'warp', label: 'Warp & Distort', icon: Grid },
          { id: 'liquify', label: 'Liquify Sculpt', icon: Wand2 },
          { id: 'puppet', label: 'Puppet Warp', icon: Anchor },
          { id: 'transform', label: 'Skew & Transform', icon: Move },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content-Aware Edge Fill Switch */}
      <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
        <div className="space-y-0.5 pr-2">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Generative Edge Inpainting (Zero Crop Loss)</span>
          </div>
          <div className="text-[9px] text-slate-400">
            Automatically synthesizes blank wedge corners created by keystoning/perspective tilts.
          </div>
        </div>
        <input
          type="checkbox"
          checked={autoFillEdges}
          onChange={(e) => setAutoFillEdges(e.target.checked)}
          className="w-4 h-4 rounded accent-indigo-500 cursor-pointer shrink-0"
        />
      </div>

      {/* 1. PERSPECTIVE & KEYSTONE PANEL */}
      {activeTab === 'perspective' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Architectural Keystone & Perspective Correction</span>
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              onClick={() => {
                setVerticalCorrection(30);
                setHorizontalCorrection(0);
              }}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 font-semibold text-center"
            >
              🏛️ Upward Tilt (Tall)
            </button>
            <button
              onClick={() => {
                setVerticalCorrection(-30);
                setHorizontalCorrection(0);
              }}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 font-semibold text-center"
            >
              🏢 Top-Down Pitch
            </button>
            <button
              onClick={() => {
                setVerticalCorrection(0);
                setHorizontalCorrection(35);
              }}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 font-semibold text-center"
            >
              📐 Yaw Off-Angle
            </button>
          </div>

          {/* Vertical Keystone Slider */}
          <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Vertical Keystone (Converging Lines)</span>
              <span className="text-[11px] font-mono font-bold text-indigo-400">
                {verticalCorrection > 0 ? `+${verticalCorrection}` : verticalCorrection}%
              </span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={verticalCorrection}
              onChange={(e) => setVerticalCorrection(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Horizontal Perspective Slider */}
          <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Horizontal Perspective (Off-Axis Yaw)</span>
              <span className="text-[11px] font-mono font-bold text-indigo-400">
                {horizontalCorrection > 0 ? `+${horizontalCorrection}` : horizontalCorrection}%
              </span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={horizontalCorrection}
              onChange={(e) => setHorizontalCorrection(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      )}

      {/* 2. LENS & FISHEYE CORRECTION PANEL */}
      {activeTab === 'lens' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Optical Defish & Lens Rectification</span>
            </span>
          </div>

          {/* 1-Click Defish Quick Button */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => {
                setFisheyeDefishStrength(85);
                setLensDistortion(-45);
              }}
              className="p-2.5 rounded-xl bg-slate-950 border border-cyan-500/50 hover:bg-slate-900 text-cyan-300 font-bold flex items-center justify-center gap-1.5"
            >
              <span>🌐 180° Fisheye Defish</span>
            </button>
            <button
              onClick={() => {
                setWideAngleStretchCorrection(75);
                setLensDistortion(-20);
              }}
              className="p-2.5 rounded-xl bg-slate-950 border border-indigo-500/50 hover:bg-slate-900 text-indigo-300 font-bold flex items-center justify-center gap-1.5"
            >
              <span>📷 14-24mm Ultra-Wide Fix</span>
            </button>
          </div>

          {/* Fisheye Defish Strength */}
          <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Fisheye Defish (Spherical to Rectilinear)</span>
              <span className="text-[11px] font-mono font-bold text-cyan-400">{fisheyeDefishStrength}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={fisheyeDefishStrength}
              onChange={(e) => setFisheyeDefishStrength(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Wide-Angle Corner Stretch Correction */}
          <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Wide-Angle Corner Stretch Rectifier</span>
              <span className="text-[11px] font-mono font-bold text-cyan-400">{wideAngleStretchCorrection}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={wideAngleStretchCorrection}
              onChange={(e) => setWideAngleStretchCorrection(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Optical Barrel / Pincushion Distortion */}
          <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Barrel (-) / Pincushion (+) Distortion</span>
              <span className="text-[11px] font-mono font-bold text-cyan-400">
                {lensDistortion > 0 ? `+${lensDistortion}` : lensDistortion}%
              </span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={lensDistortion}
              onChange={(e) => setLensDistortion(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        </div>
      )}

      {/* 3. WARP & DISTORT PANEL */}
      {activeTab === 'warp' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mesh Warp & Curvilinear Distortion</span>
            </span>
          </div>

          {/* Warp Shapes */}
          <div className="grid grid-cols-4 gap-1.5 text-xs">
            {[
              { id: 'arch', label: 'Arch / Bridge', icon: '🌈' },
              { id: 'cylinder', label: 'Cylinder', icon: '🥫' },
              { id: 'wave', label: 'Wave', icon: '🌊' },
              { id: 'twist', label: 'Twist / Vortex', icon: '🌀' },
              { id: 'bulge', label: 'Bulge / Sphere', icon: '🔮' },
              { id: 'pinch', label: 'Pinch / Inward', icon: '⏳' },
              { id: 'fisheye', label: 'Fisheye Lens', icon: '👁️' },
            ].map((shape) => {
              const isSelected = warpType === shape.id;
              return (
                <button
                  key={shape.id}
                  onClick={() => setWarpType(shape.id as any)}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all ${
                    isSelected
                      ? 'bg-slate-950 border-indigo-500 text-indigo-300 font-bold ring-1 ring-indigo-500/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{shape.icon}</span>
                  <span className="text-[10px] leading-tight truncate">{shape.label}</span>
                </button>
              );
            })}
          </div>

          {/* Warp Bend Slider */}
          <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Warp Bend & Amplitude</span>
              <span className="text-[11px] font-mono font-bold text-indigo-400">{warpBend}%</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={warpBend}
              onChange={(e) => setWarpBend(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Horizontal / Vertical Bias */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">H-Distort</span>
                <span className="text-[10px] font-mono text-indigo-400">{warpHorizontalDistortion}%</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={warpHorizontalDistortion}
                onChange={(e) => setWarpHorizontalDistortion(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
            <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">V-Distort</span>
                <span className="text-[10px] font-mono text-indigo-400">{warpVerticalDistortion}%</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={warpVerticalDistortion}
                onChange={(e) => setWarpVerticalDistortion(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. LIQUIFY & SCULPT PANEL */}
      {activeTab === 'liquify' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Liquify & Organic Pixel Sculpting</span>
            </span>
          </div>

          {/* Liquify Tools */}
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {[
              { id: 'forward-warp', label: 'Forward Push', icon: '👆' },
              { id: 'bloat', label: 'Bloat / Expand', icon: '🎈' },
              { id: 'pucker', label: 'Pucker / Pinch', icon: '🤏' },
              { id: 'twirl-cw', label: 'Twirl Clockwise', icon: '🔄' },
              { id: 'twirl-ccw', label: 'Twirl Counter', icon: '🔁' },
              { id: 'reconstruct', label: 'Reconstruct', icon: '🩹' },
            ].map((tool) => {
              const isSelected = liquifyMode === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setLiquifyMode(tool.id as any)}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all ${
                    isSelected
                      ? 'bg-slate-950 border-indigo-500 text-indigo-300 font-bold ring-1 ring-indigo-500/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{tool.icon}</span>
                  <span className="text-[10px] leading-tight truncate">{tool.label}</span>
                </button>
              );
            })}
          </div>

          {/* Brush Controls */}
          <div className="space-y-2 pt-1">
            <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Brush Size</span>
                <span className="text-[11px] font-mono text-indigo-400">{brushSize}px</span>
              </div>
              <input
                type="range"
                min={10}
                max={150}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Pressure & Sculpting Flow</span>
                <span className="text-[11px] font-mono text-indigo-400">{brushPressure}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={brushPressure}
                onChange={(e) => setBrushPressure(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. PUPPET WARP PANEL */}
      {activeTab === 'puppet' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Anchor className="w-3.5 h-3.5 text-indigo-400" />
              <span>Puppet Warp & Articulated Mesh Pins</span>
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Active Control Pins ({puppetPins.length})</span>
              <button
                onClick={() => {
                  const newPin = {
                    id: `pin-${Date.now()}`,
                    name: `Joint Pin ${puppetPins.length + 1}`,
                    x: 50,
                    y: 50,
                    pinned: false,
                  };
                  setPuppetPins([...puppetPins, newPin]);
                  showToast('info', 'Pin Added', 'New deformation joint placed at center.');
                }}
                className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold"
              >
                + Add Pin Joint
              </button>
            </div>

            <div className="space-y-1.5">
              {puppetPins.map((pin, idx) => (
                <div
                  key={pin.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CircleDot className={`w-3.5 h-3.5 ${pin.pinned ? 'text-amber-400' : 'text-indigo-400'}`} />
                    <span className="font-semibold text-slate-200">{pin.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({pin.x}%, {pin.y}%)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setPuppetPins(
                          puppetPins.map((p) => (p.id === pin.id ? { ...p, pinned: !p.pinned } : p))
                        );
                      }}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        pin.pinned
                          ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                          : 'bg-indigo-950 text-indigo-300 border-indigo-500/40'
                      }`}
                    >
                      {pin.pinned ? 'Anchor' : 'Free Joint'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. SKEW & TRANSFORM PANEL */}
      {activeTab === 'transform' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-indigo-400" />
              <span>Affine Skew, Rotation & Free Transform</span>
            </span>
          </div>

          {/* Quick 90 deg Rotate & Flip Buttons */}
          <div className="grid grid-cols-4 gap-1.5 text-xs">
            <button
              onClick={() => setRotateDeg((prev) => (prev + 90) % 360)}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 font-semibold flex items-center justify-center gap-1"
            >
              <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>+90°</span>
            </button>
            <button
              onClick={() => setRotateDeg((prev) => (prev - 90) % 360)}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 font-semibold flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>-90°</span>
            </button>
            <button
              onClick={() => setScaleX((prev) => (prev === 100 ? -100 : 100))}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 font-semibold flex items-center justify-center gap-1"
            >
              <FlipHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Flip H</span>
            </button>
            <button
              onClick={() => setScaleY((prev) => (prev === 100 ? -100 : 100))}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 font-semibold flex items-center justify-center gap-1"
            >
              <FlipVertical className="w-3.5 h-3.5 text-indigo-400" />
              <span>Flip V</span>
            </button>
          </div>

          {/* Skew X */}
          <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Horizontal Skew (Shear X)</span>
              <span className="text-[11px] font-mono font-bold text-indigo-400">{skewX}°</span>
            </div>
            <input
              type="range"
              min={-45}
              max={45}
              value={skewX}
              onChange={(e) => setSkewX(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Skew Y */}
          <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Vertical Skew (Shear Y)</span>
              <span className="text-[11px] font-mono font-bold text-indigo-400">{skewY}°</span>
            </div>
            <input
              type="range"
              min={-45}
              max={45}
              value={skewY}
              onChange={(e) => setSkewY(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Custom Prompt Box */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Custom Geometry / Distortion Directives (Optional):
        </label>
        <input
          type="text"
          placeholder="e.g. Unbend curved building columns and level horizon strictly"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Primary Execution Button */}
      <button
        onClick={handleExecuteCorrection}
        disabled={isAiProcessing}
        className="w-full py-3.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-600 hover:from-indigo-400 hover:via-purple-500 hover:to-cyan-500 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <Sparkles className={`w-4 h-4 ${isAiProcessing ? 'animate-spin' : ''}`} />
        <span>{isAiProcessing ? 'Rectifying Perspective & Geometry...' : 'Apply Geometric Correction'}</span>
      </button>
    </div>
  );
};
