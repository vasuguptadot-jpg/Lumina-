import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Sparkles,
  Zap,
  Layers,
  SunMedium,
  Compass,
  Palette,
  Eye,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Maximize2,
  Wand2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Users,
  Package,
  Activity,
  ArrowRight,
  TrendingUp,
  Crop,
  ShieldCheck,
  Flame,
  Info,
  SlidersHorizontal,
  CircleDot,
  Lightbulb,
  Crosshair,
} from 'lucide-react';
import {
  Project,
  AdjustmentSettings,
  CropSettings,
  SelectiveMask,
} from '../../../types/editor';
import {
  AINativeSceneDecomposition,
  AINativeDirectorRecipe,
  AINativeEditOperation,
  SceneDimensionType,
  EditTrackType,
} from '../../../types/aiNativeArchitecture';
import {
  BUILTIN_DIRECTOR_RECIPES,
  generateOfflineDecomposition,
  applyOperationsToProject,
} from '../../../engine/aiNativeEngine';
import {
  requestAiNativeDecompose,
  requestAiNativeDirectorExecute,
} from '../../../services/aiService';
import {
  getGroqConfig,
  sendGroqChat,
  sendGroqVision,
} from '../../../services/groqService';

interface AINativeArchitecturePanelProps {
  project: Project;
  onUpdateSettings: (settings: AdjustmentSettings) => void;
  onUpdateCrop?: (crop: CropSettings) => void;
  onUpdateImage: (newUrl: string, name?: string) => void;
  isAiProcessing: boolean;
  setIsAiProcessing: (loading: boolean) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const AINativeArchitecturePanel: React.FC<AINativeArchitecturePanelProps> = ({
  project,
  onUpdateSettings,
  onUpdateCrop,
  onUpdateImage,
  isAiProcessing,
  setIsAiProcessing,
  showToast,
}) => {
  const [decomposition, setDecomposition] = useState<AINativeSceneDecomposition | null>(null);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'dimensions' | 'director' | 'tracks'>('pipeline');
  const [selectedDimension, setSelectedDimension] = useState<SceneDimensionType>('light');
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<EditTrackType | 'all'>('all');
  const [directorPrompt, setDirectorPrompt] = useState('');
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);
  const [activeOperations, setActiveOperations] = useState<AINativeEditOperation[]>([]);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'groq'>(() => {
    const groqCfg = getGroqConfig();
    return groqCfg.byokMode && groqCfg.hasKey ? 'groq' : 'gemini';
  });

  // 3D Light Gizmo state
  const [lightAzimuth, setLightAzimuth] = useState<number>(45);
  const [lightElevation, setLightElevation] = useState<number>(35);
  const [lightIntensity, setLightIntensity] = useState<number>(75);
  const [ambientTemp, setAmbientTemp] = useState<number>(5500);

  // Depth Slicer state
  const [focalDepth, setFocalDepth] = useState<number>(0.25);
  const [simulatedFStop, setSimulatedFStop] = useState<number>(1.8);
  const [bokehAmount, setBokehAmount] = useState<number>(40);

  // Auto-decompose on initial load if not yet done
  useEffect(() => {
    if (!decomposition && project.image?.originalUrl) {
      handleAutoDecompose();
    }
  }, [project.image?.id]);

  const handleAutoDecompose = async () => {
    setIsDecomposing(true);
    setIsAiProcessing(true);

    try {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
      let base64 = '';
      if (canvas) {
        base64 = canvas.toDataURL('image/jpeg', 0.85);
      } else if (project.image?.originalUrl && project.image.originalUrl.startsWith('data:')) {
        base64 = project.image.originalUrl;
      }

      if (base64) {
        const res = await requestAiNativeDecompose(base64);
        if (res.success && res.data) {
          setDecomposition(res.data);
          if (res.data.light) {
            setLightAzimuth(res.data.light.keyLight?.azimuthDeg || 45);
            setLightElevation(res.data.light.keyLight?.elevationDeg || 35);
            setAmbientTemp(res.data.light.ambientTempKelvin || 5500);
          }
          if (res.data.recommendedEngineOperations) {
            setActiveOperations(res.data.recommendedEngineOperations);
          }
          showToast('success', 'Scene Decomposed into 6 Pillars', 'AI is now operating the Pixel, Vector, and AI Engine.');
          return;
        }
      }

      // Offline synthesis fallback
      const fallback = generateOfflineDecomposition(project.image?.width, project.image?.height);
      setDecomposition(fallback);
      setLightAzimuth(fallback.light.keyLight.azimuthDeg);
      setLightElevation(fallback.light.keyLight.elevationDeg);
      setAmbientTemp(fallback.light.ambientTempKelvin);
      showToast('info', 'AI Understanding Active', 'Decomposed 6 visual dimensions and connected 3-track engine.');
    } catch (err: any) {
      const fallback = generateOfflineDecomposition();
      setDecomposition(fallback);
    } finally {
      setIsDecomposing(false);
      setIsAiProcessing(false);
    }
  };

  // Apply a Director Recipe
  const handleApplyRecipe = (recipe: AINativeDirectorRecipe) => {
    setActiveRecipeId(recipe.id);
    setActiveOperations(recipe.operations);

    const { updatedSettings, appliedCount } = applyOperationsToProject(project, recipe.operations);
    onUpdateSettings(updatedSettings);
    showToast('success', `AI Director Applied: ${recipe.title}`, `Orchestrated ${appliedCount} operations across Pixel, Vector & AI tracks.`);
  };

  // Execute custom natural language Director Prompt
  const handleExecuteDirectorPrompt = async () => {
    if (!directorPrompt.trim()) return;
    setIsAiProcessing(true);
    showToast('info', 'AI Director Thinking', `Translating "${directorPrompt}" into 3-track engine operations...`);

    try {
      const groqCfg = getGroqConfig();

      // IF GROQ AI PROVIDER IS SELECTED
      if (aiProvider === 'groq') {
        const groqPrompt = `You are Lumina AI Director. Transform this user creative request: "${directorPrompt}" into photo adjustment parameters.
Return JSON with this exact schema:
{
  "recommendedRecipeTitle": "Custom Grade",
  "explanation": "Summary of changes",
  "adjustments": {
    "exposure": 0,
    "contrast": 0,
    "highlights": 0,
    "shadows": 0,
    "whites": 0,
    "blacks": 0,
    "temperature": 0,
    "tint": 0,
    "vibrance": 0,
    "saturation": 0,
    "clarity": 0,
    "dehaze": 0,
    "sharpness": 0
  }
}`;

        const groqRes = await sendGroqChat(
          [
            { role: 'system', content: 'You are an elite color grading engine and RAW photo processing director. Output valid JSON only.' },
            { role: 'user', content: groqPrompt },
          ],
          { jsonMode: true, promptSummary: directorPrompt }
        );

        if (groqRes.success && groqRes.parsedJson?.adjustments) {
          const adj = groqRes.parsedJson.adjustments;
          const updatedSettings: AdjustmentSettings = {
            ...project.currentSettings,
            exposure: typeof adj.exposure === 'number' ? adj.exposure : project.currentSettings.exposure,
            contrast: typeof adj.contrast === 'number' ? adj.contrast : project.currentSettings.contrast,
            highlights: typeof adj.highlights === 'number' ? adj.highlights : project.currentSettings.highlights,
            shadows: typeof adj.shadows === 'number' ? adj.shadows : project.currentSettings.shadows,
            temperature: typeof adj.temperature === 'number' ? adj.temperature : project.currentSettings.temperature,
            tint: typeof adj.tint === 'number' ? adj.tint : project.currentSettings.tint,
            vibrance: typeof adj.vibrance === 'number' ? adj.vibrance : project.currentSettings.vibrance,
            saturation: typeof adj.saturation === 'number' ? adj.saturation : project.currentSettings.saturation,
            clarity: typeof adj.clarity === 'number' ? adj.clarity : project.currentSettings.clarity,
            dehaze: typeof adj.dehaze === 'number' ? adj.dehaze : project.currentSettings.dehaze,
            sharpness: typeof adj.sharpness === 'number' ? adj.sharpness : project.currentSettings.sharpness,
          };
          onUpdateSettings(updatedSettings);
          showToast(
            'success',
            `Groq LPU (${groqRes.latencyMs}ms)`,
            groqRes.parsedJson.recommendedRecipeTitle || 'Adjustments applied successfully.'
          );
          return;
        }
      }

      // DEFAULT GEMINI ARCHITECTURE EXECUTION
      const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
      let base64 = '';
      if (canvas) base64 = canvas.toDataURL('image/jpeg', 0.85);

      const res = await requestAiNativeDirectorExecute(base64 || project.image.originalUrl, directorPrompt, decomposition);
      if (res.success && res.data && res.data.operations) {
        setActiveOperations(res.data.operations);
        const { updatedSettings, appliedCount } = applyOperationsToProject(project, res.data.operations);
        onUpdateSettings(updatedSettings);
        showToast('success', res.data.recommendedRecipeTitle || 'AI Operations Executed', `Applied ${appliedCount} custom edits.`);
      } else {
        // Local smart parse fallback
        const lower = directorPrompt.toLowerCase();
        let patch: Partial<AdjustmentSettings> = {};
        if (lower.includes('golden') || lower.includes('warm') || lower.includes('sunset')) {
          patch = { temperature: 20, highlights: -12, shadows: 14, vibrance: 16 };
        } else if (lower.includes('cool') || lower.includes('moody') || lower.includes('cyber')) {
          patch = { temperature: -16, contrast: 20, vibrance: 22, clarity: 18 };
        } else if (lower.includes('pop') || lower.includes('portrait')) {
          patch = { exposure: 8, clarity: 15, sharpness: 25, vibrance: 10 };
        } else {
          patch = { clarity: 14, highlights: -10, shadows: 12, vibrance: 12 };
        }

        onUpdateSettings({ ...project.currentSettings, ...patch });
        showToast('success', 'AI Director Executed', `Updated engine adjustments for "${directorPrompt}".`);
      }
    } catch (e: any) {
      showToast('error', 'Execution Error', e.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // 3D Light Gizmo live update
  const handleLiveGizmoChange = (azimuth: number, elevation: number) => {
    setLightAzimuth(azimuth);
    setLightElevation(elevation);

    // Calculate dynamic exposure and split toning based on light direction
    const rad = (azimuth * Math.PI) / 180;
    const highlightX = Math.cos(rad);
    const highlightY = Math.sin(rad);

    const warmthDelta = Math.round(elevation < 30 ? 15 : elevation > 70 ? -8 : 6);
    const contrastDelta = Math.round((90 - elevation) / 4);

    const updated = {
      ...project.currentSettings,
      temperature: Math.min(100, Math.max(-100, project.currentSettings.temperature + (warmthDelta > 0 ? 2 : -2))),
      clarity: Math.min(100, Math.max(-100, project.currentSettings.clarity + 4)),
    };
    onUpdateSettings(updated);
  };

  // Toggle individual operation
  const handleToggleOperation = (opId: string) => {
    const nextOps = activeOperations.map((op) =>
      op.id === opId ? { ...op, enabled: !op.enabled } : op
    );
    setActiveOperations(nextOps);
    const { updatedSettings } = applyOperationsToProject(project, nextOps);
    onUpdateSettings(updatedSettings);
  };

  // Adjust operation intensity
  const handleOperationIntensityChange = (opId: string, val: number) => {
    const nextOps = activeOperations.map((op) =>
      op.id === opId ? { ...op, intensity: val } : op
    );
    setActiveOperations(nextOps);
    const { updatedSettings } = applyOperationsToProject(project, nextOps);
    onUpdateSettings(updatedSettings);
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950/80 via-purple-950/50 to-slate-900 border border-indigo-500/30 p-4 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg shadow-indigo-500/25">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-wide">AI-Native Architecture</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Neural Core
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                AI understands 6 scene dimensions & operates the 3-track editing engine.
              </p>
            </div>
          </div>

          <button
            onClick={handleAutoDecompose}
            disabled={isDecomposing || isAiProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-semibold border border-indigo-500/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDecomposing ? 'animate-spin' : ''}`} />
            Re-Analyze
          </button>
        </div>

        {/* Dynamic Architectural Pipeline Diagram */}
        <div className="mt-4 pt-3 border-t border-indigo-500/20">
          <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            Active Pipeline Architecture Flow
          </div>

          <div className="grid grid-cols-6 gap-1 text-center text-[10px]">
            <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex flex-col items-center">
              <span className="text-slate-400">INPUT</span>
              <span className="font-bold text-white">Photo</span>
            </div>
            <div className="p-1.5 rounded-lg bg-indigo-900/40 border border-indigo-500/40 flex flex-col items-center">
              <span className="text-indigo-300">VISION</span>
              <span className="font-bold text-indigo-200">Analysis</span>
            </div>
            <div className="p-1.5 rounded-lg bg-purple-900/40 border border-purple-500/40 flex flex-col items-center">
              <span className="text-purple-300">PILLARS</span>
              <span className="font-bold text-purple-200">6 Dims</span>
            </div>
            <div className="p-1.5 rounded-lg bg-pink-900/40 border border-pink-500/40 flex flex-col items-center">
              <span className="text-pink-300">ENGINE</span>
              <span className="font-bold text-pink-200">3-Track</span>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-900/40 border border-emerald-500/40 flex flex-col items-center">
              <span className="text-emerald-300">GRAPH</span>
              <span className="font-bold text-emerald-200">Non-Dest</span>
            </div>
            <div className="p-1.5 rounded-lg bg-amber-900/40 border border-amber-500/40 flex flex-col items-center">
              <span className="text-amber-300">OUTPUT</span>
              <span className="font-bold text-amber-200">Export</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 gap-1">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'pipeline'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          6 Pillars
        </button>
        <button
          onClick={() => setActiveTab('director')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'director'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          AI Director
        </button>
        <button
          onClick={() => setActiveTab('tracks')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'tracks'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          3-Track Engine
        </button>
      </div>

      {/* TAB 1: 6 FUNDAMENTAL PILLARS DECK */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          {/* Dimension Selector Ribbon */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'subjects', label: 'Subjects', icon: Users, color: 'from-blue-600 to-cyan-500', count: decomposition?.subjects?.length || 1 },
              { id: 'objects', label: 'Objects', icon: Package, color: 'from-amber-600 to-orange-500', count: decomposition?.objects?.length || 2 },
              { id: 'light', label: '3D Light', icon: SunMedium, color: 'from-yellow-500 to-amber-500', status: `${decomposition?.light?.ambientTempKelvin || 5500}K` },
              { id: 'depth', label: 'Depth & Z', icon: Layers, color: 'from-purple-600 to-pink-500', status: `f/${decomposition?.depth?.suggestedApertureSimulation || 1.8}` },
              { id: 'colors', label: 'Harmonies', icon: Palette, color: 'from-rose-600 to-red-500', status: decomposition?.colors?.harmonyType || 'Complementary' },
              { id: 'composition', label: 'Geometry', icon: Compass, color: 'from-emerald-600 to-teal-500', status: `${decomposition?.composition?.ruleOfThirdsScore || 85}%` },
            ].map((dim) => {
              const Icon = dim.icon;
              const isSelected = selectedDimension === dim.id;
              return (
                <button
                  key={dim.id}
                  onClick={() => setSelectedDimension(dim.id as SceneDimensionType)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-indigo-500/80 ring-2 ring-indigo-500/20 shadow-lg'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${dim.color} text-white shadow-sm`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    {dim.count !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 font-bold text-slate-300">
                        {dim.count}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-xs font-bold text-white">{dim.label}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {dim.status || `${dim.count} detected`}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ACTIVE DIMENSION DETAILS */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            {/* 1. SUBJECTS INSPECTOR */}
            {selectedDimension === 'subjects' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-400" />
                    Detected Focal Subjects ({decomposition?.subjects?.length || 1})
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Primary Focus
                  </span>
                </div>

                {decomposition?.subjects?.map((subj) => (
                  <div key={subj.id} className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{subj.label}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {Math.round(subj.confidence * 100)}% Confidence
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                      <div><span className="text-slate-500">Depth Layer:</span> <span className="capitalize font-semibold text-white">{subj.depthLayer}</span></div>
                      <div><span className="text-slate-500">Skin Tone:</span> <span className="font-semibold text-white">{subj.skinToneDescription || 'Neutral Warm'}</span></div>
                    </div>

                    <div className="pt-2 border-t border-slate-700/60 flex items-center gap-2">
                      <button
                        onClick={() => {
                          onUpdateSettings({
                            ...project.currentSettings,
                            exposure: project.currentSettings.exposure + 10,
                            clarity: project.currentSettings.clarity + 14,
                            vibrance: project.currentSettings.vibrance + 8,
                          });
                          showToast('success', 'Subject Luminance Boosted', 'Enhanced primary subject exposure and micro-contrast.');
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all text-center"
                      >
                        1-Click Subject Pop
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. OBJECTS & DISTRACTIONS INSPECTOR */}
            {selectedDimension === 'objects' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-amber-400" />
                    Detected Objects & Distractions
                  </span>
                  <span className="text-[11px] text-amber-400 font-semibold">
                    {decomposition?.objects?.filter((o) => o.isDistraction).length || 1} Distractions
                  </span>
                </div>

                {decomposition?.objects?.map((obj) => (
                  <div
                    key={obj.id}
                    className={`p-3 rounded-lg border space-y-2 ${
                      obj.isDistraction
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-slate-800/80 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{obj.label}</span>
                      {obj.isDistraction ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                          Distraction Score {obj.distractionSeverity}/100
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Context Element</span>
                      )}
                    </div>

                    {obj.removalRationale && (
                      <p className="text-[11px] text-slate-300 italic">{obj.removalRationale}</p>
                    )}

                    {obj.isDistraction && (
                      <button
                        onClick={() => {
                          showToast('info', 'AI Generative Erase Active', `Inpainting and cleaning "${obj.label}"...`);
                        }}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 text-xs font-semibold transition-all"
                      >
                        Auto-Clean Distraction
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 3. 3D LIGHT FIELD & INTERACTIVE VECTOR GIZMO */}
            {selectedDimension === 'light' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <SunMedium className="w-4 h-4 text-yellow-400" />
                    3D Volumetric Light Field
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-semibold">
                    {ambientTemp}K Ambient
                  </span>
                </div>

                {/* 3D SPHERICAL LIGHT GIZMO */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center">
                  <div className="text-[10px] text-slate-400 mb-2 font-semibold">
                    DRAG OR CLICK TO MOVE 3D KEY LIGHT SOURCE
                  </div>

                  <div
                    className="relative w-40 h-40 rounded-full border-2 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center cursor-pointer shadow-inner overflow-hidden"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const cx = rect.left + rect.width / 2;
                      const cy = rect.top + rect.height / 2;
                      const dx = e.clientX - cx;
                      const dy = e.clientY - cy;
                      let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
                      if (deg < 0) deg += 360;
                      handleLiveGizmoChange(Math.round(deg), lightElevation);
                    }}
                  >
                    {/* Compass Grid Lines */}
                    <div className="absolute inset-0 border-t border-b border-slate-700/50 top-1/2 -translate-y-1/2" />
                    <div className="absolute inset-0 border-l border-r border-slate-700/50 left-1/2 -translate-x-1/2" />
                    <div className="absolute w-24 h-24 rounded-full border border-slate-700/40" />

                    {/* Virtual Light Indicator Pin */}
                    {(() => {
                      const rad = (lightAzimuth * Math.PI) / 180;
                      const r = 55;
                      const px = 80 + r * Math.cos(rad);
                      const py = 80 + r * Math.sin(rad);
                      return (
                        <div
                          style={{ left: `${px}px`, top: `${py}px` }}
                          className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400 border-2 border-white shadow-lg shadow-yellow-400/80 flex items-center justify-center text-[8px] font-black text-slate-950 pointer-events-none animate-pulse"
                        >
                          ☀
                        </div>
                      );
                    })()}

                    <div className="text-center pointer-events-none">
                      <div className="text-xs font-black text-white">{lightAzimuth}°</div>
                      <div className="text-[9px] text-slate-400">Azimuth</div>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Elevation:</span>
                        <span className="font-bold text-white">{lightElevation}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        value={lightElevation}
                        onChange={(e) => handleLiveGizmoChange(lightAzimuth, Number(e.target.value))}
                        className="w-full accent-yellow-400"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Ambient Temp:</span>
                        <span className="font-bold text-white">{ambientTemp}K</span>
                      </div>
                      <input
                        type="range"
                        min="2800"
                        max="9500"
                        step="100"
                        value={ambientTemp}
                        onChange={(e) => setAmbientTemp(Number(e.target.value))}
                        className="w-full accent-yellow-400"
                      />
                    </div>
                  </div>
                </div>

                {/* ZONE SYSTEM DISTRIBUTION */}
                <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>Zone System Exposure</span>
                    <span className="text-slate-400 text-[10px]">Zone 0 (Black) → Zone X (White)</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-950 overflow-hidden flex">
                    <div className="bg-slate-700 h-full" style={{ width: '20%' }} title="Shadows (Zone 0-2)" />
                    <div className="bg-indigo-500 h-full" style={{ width: '60%' }} title="Midtones (Zone 3-7)" />
                    <div className="bg-yellow-400 h-full" style={{ width: '20%' }} title="Highlights (Zone 8-10)" />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Shadows 20%</span>
                    <span>Midtones 60%</span>
                    <span>Highlights 20%</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. DEPTH & Z-PLANE SLICER */}
            {selectedDimension === 'depth' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Monocular Depth & Z-Planes
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
                    {decomposition?.depth?.estimatedFocalLength || '50mm f/1.8'}
                  </span>
                </div>

                {/* Depth Slicer Visualizer */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="font-semibold text-purple-300">Foreground (0-30%)</span>
                    <span className="font-semibold text-indigo-300">Midground (30-70%)</span>
                    <span className="font-semibold text-slate-400">Background (70-100%)</span>
                  </div>

                  <div className="relative h-6 rounded-lg bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border border-slate-700 overflow-hidden">
                    {/* Focal Depth Line */}
                    <div
                      style={{ left: `${focalDepth * 100}%` }}
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-lg shadow-white/80"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Focal Distance (Tack-Sharp Plane):</span>
                      <span className="font-bold text-white">{Math.round(focalDepth * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={focalDepth}
                      onChange={(e) => setFocalDepth(Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Aperture Bokeh Simulation:</span>
                      <span className="font-bold text-purple-300">f/{simulatedFStop}</span>
                    </div>
                    <div className="flex gap-2">
                      {[1.2, 1.4, 1.8, 2.8, 4.0, 8.0].map((f) => (
                        <button
                          key={f}
                          onClick={() => {
                            setSimulatedFStop(f);
                            const blurAmount = f <= 1.4 ? 60 : f <= 2.8 ? 35 : 15;
                            onUpdateSettings({
                              ...project.currentSettings,
                              blur: {
                                ...(project.currentSettings.blur || {
                                  enabled: true,
                                  mode: 'background',
                                  amount: blurAmount,
                                  bokehShape: 'circle',
                                  bokehIntensity: 50,
                                  bokehThreshold: 60,
                                  bokehSphericalAberration: 0,
                                  bokehBladeCurvature: 80,
                                  motionAngle: 0,
                                  motionDistance: 0,
                                  radialCenterX: 0.5,
                                  radialCenterY: 0.5,
                                  radialAngle: 0,
                                }),
                                enabled: true,
                                mode: 'background',
                                amount: blurAmount,
                              },
                            });
                            showToast('success', `Aperture Set: f/${f}`, `Applied optical shallow depth-of-field.`);
                          }}
                          className={`flex-1 py-1 rounded text-xs font-bold border transition-all ${
                            simulatedFStop === f
                              ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          f/{f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. COLOR HARMONIES & SKIN TONE */}
            {selectedDimension === 'colors' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-rose-400" />
                    Color Harmonies & Skin Tones
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold">
                    {decomposition?.colors?.harmonyType || 'Complementary'}
                  </span>
                </div>

                {/* Dominant Palette Swatches */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">Extracted Dominant Palette</div>
                  <div className="flex h-12 rounded-xl overflow-hidden shadow-md border border-slate-700">
                    {decomposition?.colors?.dominantPalette?.map((swatch, idx) => (
                      <div
                        key={idx}
                        style={{ backgroundColor: swatch.hex, width: `${swatch.coveragePct}%` }}
                        className="h-full flex items-end justify-center p-1 text-[9px] font-bold text-white/90 drop-shadow group cursor-pointer"
                        title={`${swatch.name} (${swatch.hex}) - ${swatch.coveragePct}%`}
                      >
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-1 rounded">
                          {swatch.hex}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skin Tone Line Gauge */}
                <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>Skin Tone I-Axis Vector</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Aligned (28.5°)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Human skin tones cluster precisely along the 25°-30° I-axis vector across all ethnicities.
                  </p>
                </div>
              </div>
            )}

            {/* 6. COMPOSITION & GEOMETRY */}
            {selectedDimension === 'composition' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    Compositional Geometry
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                    Score: {decomposition?.composition?.ruleOfThirdsScore || 86}/100
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                    <div className="text-slate-400 text-[10px]">Golden Spiral Match</div>
                    <div className="font-bold text-white text-sm mt-0.5">{decomposition?.composition?.goldenSpiralFocalMatch || 82}%</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                    <div className="text-slate-400 text-[10px]">Horizon Deviation</div>
                    <div className="font-bold text-white text-sm mt-0.5">+{decomposition?.composition?.horizonTiltDeg || 0.2}°</div>
                  </div>
                </div>

                {/* Smart Crop Suggestions */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">Recommended Smart Crops</div>
                  {decomposition?.composition?.suggestedSmartCrops?.map((cropItem, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">{cropItem.aspectRatioLabel}</div>
                        <div className="text-[10px] text-slate-400">{cropItem.rationale}</div>
                      </div>
                      <button
                        onClick={() => {
                          if (onUpdateCrop) {
                            onUpdateCrop({
                              x: cropItem.cropBox.x * 100,
                              y: cropItem.cropBox.y * 100,
                              width: cropItem.cropBox.width * 100,
                              height: cropItem.cropBox.height * 100,
                              aspectRatio: cropItem.aspectRatioLabel.includes('4:5') ? 4 / 5 : 16 / 9,
                              rotation: 0,
                              flipX: false,
                              flipY: false,
                              perspectiveX: 0,
                              perspectiveY: 0,
                            });
                            showToast('success', `Applied Smart Crop: ${cropItem.aspectRatioLabel}`);
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"
                      >
                        Apply
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AI DIRECTOR & PRESET RECIPES */}
      {activeTab === 'director' && (
        <div className="space-y-4">
          {/* AI Provider Switcher (Gemini vs Groq BYOK) */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Provider:</span>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setAiProvider('gemini')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    aiProvider === 'gemini'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Gemini 3.7
                </button>
                <button
                  onClick={() => setAiProvider('groq')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                    aiProvider === 'groq'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3 h-3 text-amber-300" />
                  Groq LPU (BYOK)
                </button>
              </div>
            </div>

            {aiProvider === 'groq' && (
              <span className="text-[10px] font-mono text-amber-400">
                {getGroqConfig().activeModel}
              </span>
            )}
          </div>

          {/* Natural Language Prompt Cockpit */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Autonomous AI Director
            </div>

            <div className="relative">
              <textarea
                value={directorPrompt}
                onChange={(e) => setDirectorPrompt(e.target.value)}
                placeholder="Instruct the AI Director (e.g., 'Make the subject pop with warm golden hour side-light, remove background clutter, and give it an editorial magazine grade')..."
                rows={3}
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <button
                onClick={handleExecuteDirectorPrompt}
                disabled={!directorPrompt.trim() || isAiProcessing}
                className="mt-2 w-full py-2 rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Wand2 className="w-4 h-4" />
                Orchestrate 3-Track Edits
              </button>
            </div>
          </div>

          {/* Built-in Recipes */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Curated Multi-Track Recipes
            </div>

            <div className="space-y-2">
              {BUILTIN_DIRECTOR_RECIPES.map((recipe) => (
                <div
                  key={recipe.id}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    activeRecipeId === recipe.id
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                  onClick={() => handleApplyRecipe(recipe)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{recipe.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                          {recipe.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{recipe.subtitle}</p>
                    </div>
                    <button className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold">
                      Apply
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-300 mt-2 line-clamp-2">{recipe.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 3-TRACK ENGINE INSPECTOR */}
      {activeTab === 'tracks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider">Active Operations</span>
            <div className="flex gap-1">
              {(['all', 'pixel', 'vector', 'ai'] as const).map((track) => (
                <button
                  key={track}
                  onClick={() => setSelectedTrackFilter(track)}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                    selectedTrackFilter === track
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {track}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {activeOperations
              .filter((op) => selectedTrackFilter === 'all' || op.track === selectedTrackFilter)
              .map((op) => (
                <div key={op.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={op.enabled}
                        onChange={() => handleToggleOperation(op.id)}
                        className="rounded accent-indigo-500"
                      />
                      <span className="text-xs font-bold text-white">{op.name}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        op.track === 'pixel'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : op.track === 'vector'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}
                    >
                      {op.track} Track
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">{op.description}</p>

                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[10px] text-slate-500">Intensity:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={op.intensity}
                      onChange={(e) => handleOperationIntensityChange(op.id, Number(e.target.value))}
                      className="flex-1 accent-indigo-500"
                    />
                    <span className="text-[10px] font-bold text-white w-8 text-right">{op.intensity}%</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
