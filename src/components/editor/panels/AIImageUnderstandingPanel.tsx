import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Zap,
  Users,
  Smile,
  Package,
  Layers,
  CloudSun,
  Building2,
  TreePine,
  Dog,
  Shirt,
  Type,
  SunMedium,
  Compass,
  Palette,
  Aperture,
  Sliders,
  Check,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Eye,
  Focus,
  Maximize2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Wand2,
  TrendingUp,
} from 'lucide-react';
import {
  Project,
  AdjustmentSettings,
  ImageUnderstandingResult,
  AiEditSuggestion,
} from '../../../types/editor';
import { DEFAULT_ADJUSTMENTS } from '../../../engine/defaultSettings';
import { requestAiUnderstandImage } from '../../../services/aiService';

interface AIImageUnderstandingPanelProps {
  project: Project;
  onUpdateSettings: (settings: AdjustmentSettings) => void;
  onUpdateImage: (newUrl: string, name?: string) => void;
  isAiProcessing: boolean;
  setIsAiProcessing: (loading: boolean) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const AIImageUnderstandingPanel: React.FC<AIImageUnderstandingPanelProps> = ({
  project,
  onUpdateSettings,
  onUpdateImage,
  isAiProcessing,
  setIsAiProcessing,
  showToast,
}) => {
  const [analysisResult, setAnalysisResult] = useState<ImageUnderstandingResult | null>(null);
  const [appliedSuggestionIds, setAppliedSuggestionIds] = useState<string[]>([]);
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'suggestions' | 'dimensions'>('suggestions');

  // Automatic or on-demand image analysis
  const handleAnalyzePhoto = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      showToast('error', 'No Image Loaded', 'Open an image to run AI Image Understanding.');
      return;
    }

    setIsAiProcessing(true);
    showToast('info', 'Analyzing Visual Elements', 'Gemini 3.7 Vision is inspecting People, Faces, Sky, Lighting, Depth, Composition & Objects...');

    try {
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);
      const res = await requestAiUnderstandImage(imageBase64);

      if (res.success && res.data) {
        setAnalysisResult(res.data);
        setAppliedSuggestionIds([]);
        showToast('success', 'Visual Intelligence Ready', `Generated ${res.data.suggestions?.length || 0} tailored edit recommendations.`);
      } else {
        showToast('error', 'Analysis Error', res.error || 'Failed to understand image.');
      }
    } catch (err: any) {
      showToast('error', 'Server Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Apply single suggestion
  const handleApplySuggestion = (suggestion: AiEditSuggestion) => {
    const isApplied = appliedSuggestionIds.includes(suggestion.id);

    if (isApplied) {
      // Toggle off - revert this suggestion
      setAppliedSuggestionIds((prev) => prev.filter((id) => id !== suggestion.id));
      showToast('info', 'Suggestion Reverted', `Undid "${suggestion.title}".`);
      return;
    }

    if (suggestion.adjustmentsPatch) {
      const newSettings: AdjustmentSettings = {
        ...project.currentSettings,
        ...suggestion.adjustmentsPatch,
      };

      // Handle specific actions
      if (suggestion.actionType === 'ai_bg_blur') {
        newSettings.blur = {
          ...(project.currentSettings.blur || DEFAULT_ADJUSTMENTS.blur!),
          enabled: true,
          mode: 'background',
          amount: 45,
        };
      }

      onUpdateSettings(newSettings);
      setAppliedSuggestionIds((prev) => [...prev, suggestion.id]);
      showToast('success', 'Applied AI Suggestion', `"${suggestion.title}" applied to photo.`);
    }
  };

  // Apply all optimal suggestions at once
  const handleApplyAllSuggestions = () => {
    if (!analysisResult?.suggestions || analysisResult.suggestions.length === 0) return;

    let mergedPatch: Partial<AdjustmentSettings> = {};
    const appliedIds: string[] = [];

    for (const sug of analysisResult.suggestions) {
      if (sug.adjustmentsPatch) {
        mergedPatch = { ...mergedPatch, ...sug.adjustmentsPatch };
        appliedIds.push(sug.id);
      }
      if (sug.actionType === 'ai_bg_blur') {
        mergedPatch.blur = {
          ...(project.currentSettings.blur || DEFAULT_ADJUSTMENTS.blur!),
          enabled: true,
          mode: 'background',
          amount: 45,
        };
      }
    }

    const updated: AdjustmentSettings = {
      ...project.currentSettings,
      ...mergedPatch,
    };

    onUpdateSettings(updated);
    setAppliedSuggestionIds(appliedIds);
    showToast('success', 'All AI Suggestions Applied', `Optimal exposure, highlights, white balance, and subject enhancements synchronized.`);
  };

  // Dimension list definition
  const getDimensionList = (dims?: any) => {
    if (!dims) return [];
    return [
      {
        id: 'people',
        name: 'People',
        icon: Users,
        badge: dims.people?.detected ? `${dims.people.count || 1} Detected` : 'None',
        status: dims.people?.detected ? 'active' : 'inactive',
        desc: dims.people?.description || 'No human subjects prominent in scene.',
        color: 'text-pink-400 bg-pink-950/40 border-pink-500/30',
      },
      {
        id: 'faces',
        name: 'Faces & Portraits',
        icon: Smile,
        badge: dims.faces?.detected ? `${dims.faces.count || 1} Face` : 'None',
        status: dims.faces?.detected ? 'active' : 'inactive',
        desc: dims.faces ? `Skin: ${dims.faces.skinTones || 'Natural'} • Lighting: ${dims.faces.lighting || 'Balanced'}` : 'No faces detected.',
        color: 'text-rose-400 bg-rose-950/40 border-rose-500/30',
      },
      {
        id: 'objects',
        name: 'Objects & Focus',
        icon: Package,
        badge: dims.objects?.focusSubject || 'Subject',
        status: 'active',
        desc: dims.objects?.keyItems?.join(', ') || 'Primary objects identified in focal plane.',
        color: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30',
      },
      {
        id: 'background',
        name: 'Background',
        icon: Layers,
        badge: dims.background?.clutterLevel || 'Clean',
        status: dims.background?.clutterLevel === 'Busy' ? 'warning' : 'active',
        desc: dims.background ? `Depth: ${dims.background.depth || 'Medium'} • Distractions: ${dims.background.distractions?.join(', ') || 'None'}` : 'Background evaluated.',
        color: 'text-purple-400 bg-purple-950/40 border-purple-500/30',
      },
      {
        id: 'sky',
        name: 'Sky & Atmosphere',
        icon: CloudSun,
        badge: dims.sky?.detected ? dims.sky.condition || 'Detected' : 'No Sky',
        status: dims.sky?.needsRecovery ? 'warning' : 'active',
        desc: dims.sky ? `${dims.sky.type || 'Natural sky'} • ${dims.sky.needsRecovery ? '⚠️ Highlights need recovery' : 'Good dynamic range'}` : 'Indoor or ground shot.',
        color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
      },
      {
        id: 'buildings',
        name: 'Buildings & Geometry',
        icon: Building2,
        badge: dims.buildings?.detected ? 'Architectural' : 'Nature',
        status: dims.buildings?.detected ? 'active' : 'inactive',
        desc: dims.buildings ? `Perspective: ${dims.buildings.perspective || 'Standard'} • Verticals: ${dims.buildings.verticals || 'Aligned'}` : 'No major architectural geometry.',
        color: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
      },
      {
        id: 'plants',
        name: 'Plants & Nature',
        icon: TreePine,
        badge: dims.plants?.detected ? 'Foliage' : 'Minimal',
        status: dims.plants?.detected ? 'active' : 'inactive',
        desc: dims.plants ? `Vibrancy: ${dims.plants.foliageVibrancy || 'Natural'} • ${dims.plants.greenCast ? '⚠️ Green tint detected' : 'Clean color cast'}` : 'No heavy plant foliage.',
        color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
      },
      {
        id: 'animals',
        name: 'Animals & Pets',
        icon: Dog,
        badge: dims.animals?.detected ? dims.animals.type || 'Animal' : 'None',
        status: dims.animals?.detected ? 'active' : 'inactive',
        desc: dims.animals?.detail || 'No animal subjects in frame.',
        color: 'text-orange-400 bg-orange-950/40 border-orange-500/30',
      },
      {
        id: 'clothing',
        name: 'Clothing & Textures',
        icon: Shirt,
        badge: dims.clothing?.colors?.[0] || 'Apparel',
        status: dims.clothing?.colors?.length ? 'active' : 'inactive',
        desc: dims.clothing ? `Palette: ${dims.clothing.colors?.join(', ')} • Texture: ${dims.clothing.textures || 'Crisp'}` : 'Fabric details evaluated.',
        color: 'text-blue-400 bg-blue-950/40 border-blue-500/30',
      },
      {
        id: 'text',
        name: 'Text & Watermarks',
        icon: Type,
        badge: dims.text?.detected ? 'Text Present' : 'Clean',
        status: dims.text?.needsRemoval ? 'warning' : 'active',
        desc: dims.text?.detected ? `Content: "${dims.text.content || 'Signage'}" • ${dims.text.needsRemoval ? '⚠️ Distracting text' : 'Subtle'}` : 'No distracting watermarks or signs.',
        color: 'text-teal-400 bg-teal-950/40 border-teal-500/30',
      },
      {
        id: 'lighting',
        name: 'Lighting & Exposure',
        icon: SunMedium,
        badge: dims.lighting?.dynamicRange || 'Balanced',
        status: 'active',
        desc: dims.lighting ? `Quality: ${dims.lighting.quality || 'Natural'} • Direction: ${dims.lighting.direction || 'Frontal'} • Harshness: ${dims.lighting.harshness || 'Soft'}` : 'Lighting evaluated.',
        color: 'text-yellow-400 bg-yellow-950/40 border-yellow-500/30',
      },
      {
        id: 'composition',
        name: 'Composition & Framing',
        icon: Compass,
        badge: dims.composition?.balance || 'Balanced',
        status: 'active',
        desc: dims.composition ? `Framing: ${dims.composition.framing || 'Rule of Thirds'} • Horizon: ${dims.composition.horizonLevel || 'Level'}` : 'Framing analyzed.',
        color: 'text-fuchsia-400 bg-fuchsia-950/40 border-fuchsia-500/30',
      },
      {
        id: 'colors',
        name: 'Colors & White Balance',
        icon: Palette,
        badge: dims.colors?.temperatureK || '5500K',
        status: 'active',
        desc: dims.colors ? `Tint: ${dims.colors.tintBalance || 'Neutral'} • Saturation: ${dims.colors.saturationStatus || 'Optimal'}` : 'Color palette mapped.',
        color: 'text-violet-400 bg-violet-950/40 border-violet-500/30',
      },
      {
        id: 'depth',
        name: 'Depth & Optics',
        icon: Aperture,
        badge: dims.depth?.dof || 'Medium DoF',
        status: 'active',
        desc: dims.depth ? `Isolation: ${dims.depth.subjectIsolation || 'Natural'} • Separation: ${dims.depth.separationQuality || 'Good'}` : 'Focal plane measured.',
        color: 'text-sky-400 bg-sky-950/40 border-sky-500/30',
      },
    ];
  };

  return (
    <div className="p-4 space-y-4 text-slate-200">
      {/* Studio Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-indigo-400" />
            AI Image Understanding & Suggestions
          </h3>
          <p className="text-[11px] text-slate-400">14-Dimension Visual Vision & One-Click Intelligent Edits</p>
        </div>

        <button
          onClick={handleAnalyzePhoto}
          disabled={isAiProcessing}
          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
        >
          {isAiProcessing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>{analysisResult ? 'Re-Analyze' : 'Analyze Photo'}</span>
        </button>
      </div>

      {/* Analysis Welcome Banner if not analyzed yet */}
      {!analysisResult && !isAiProcessing && (
        <div className="bg-gradient-to-tr from-indigo-950/70 via-purple-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 text-center space-y-3.5 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mx-auto shadow-md">
            <Brain className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-white">Full Scene & Subject Diagnostic</h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              Gemini 3.7 Vision automatically inspects people, faces, objects, background clutter, sky highlights, lighting, colors, and depth to generate pro-grade edit suggestions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left text-[11px] text-slate-300 max-w-xs mx-auto pt-1">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Improve exposure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Recover highlights</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Reduce background clutter</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Enhance subject & skin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Correct white balance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Optics & depth blur</span>
            </div>
          </div>

          <button
            onClick={handleAnalyzePhoto}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Run Deep Image Understanding</span>
          </button>
        </div>
      )}

      {/* Analysis Loading State */}
      {isAiProcessing && (
        <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-6 text-center space-y-3 animate-pulse">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <div className="text-xs font-bold text-white">Gemini 3.7 Vision Analyzing Scene...</div>
          <div className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Scanning 14 visual dimensions: Faces, People, Sky, Foliage, Lighting Direction, Dynamic Range & Background Clutter...
          </div>
        </div>
      )}

      {/* Results View */}
      {analysisResult && !isAiProcessing && (
        <div className="space-y-4">
          {/* Summary & Quality Score Banner */}
          <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/80 border border-indigo-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Photo Diagnostic</span>
                <h4 className="text-xs font-black text-white">{analysisResult.shotType || 'Scene Overview'}</h4>
              </div>

              {analysisResult.overallQualityScore && (
                <div className="text-right">
                  <div className="text-xs font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{analysisResult.overallQualityScore}/100 Quality</span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed italic">
              "{analysisResult.summary}"
            </p>

            {/* Quick Action: Apply All */}
            <div className="pt-2 border-t border-slate-800/80 flex gap-2">
              <button
                onClick={handleApplyAllSuggestions}
                className="flex-1 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Apply All Optimal Fixes</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Switcher: Suggestions vs 14 Dimensions */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveViewTab('suggestions')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeViewTab === 'suggestions'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI Suggestions ({analysisResult.suggestions?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveViewTab('dimensions')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeViewTab === 'dimensions'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>14 Visual Elements</span>
            </button>
          </div>

          {/* ================================================================ */}
          {/* VIEW A: AI SUGGESTIONS CARDS                                     */}
          {/* ================================================================ */}
          {activeViewTab === 'suggestions' && (
            <div className="space-y-3">
              {analysisResult.suggestions?.map((sug) => {
                const isApplied = appliedSuggestionIds.includes(sug.id);

                return (
                  <div
                    key={sug.id}
                    className={`rounded-2xl border p-4 space-y-3 transition-all ${
                      isApplied
                        ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/30 shadow-lg'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-white">{sug.title}</h4>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              sug.priority === 'Critical'
                                ? 'bg-rose-950 border border-rose-500/40 text-rose-300'
                                : sug.priority === 'Recommended'
                                ? 'bg-indigo-950 border border-indigo-500/40 text-indigo-300'
                                : 'bg-slate-800 border border-slate-700 text-slate-400'
                            }`}
                          >
                            {sug.priority}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{sug.impactBadge}</span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                          {sug.confidence}% Conf.
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{sug.reason}</p>

                    {/* Adjusted parameters tags */}
                    {sug.adjustmentsPatch && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {Object.entries(sug.adjustmentsPatch).map(([k, v]) => (
                          <span
                            key={k}
                            className="text-[9px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono"
                          >
                            {k}: <strong className={Number(v) >= 0 ? 'text-indigo-300' : 'text-rose-300'}>{Number(v) > 0 ? `+${v}` : v}</strong>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 1-Click Action Button */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Sliders className="w-3 h-3 text-indigo-400" />
                        <span>Non-destructive live update</span>
                      </span>

                      <button
                        onClick={() => handleApplySuggestion(sug)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isApplied
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Applied (Undo)</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Apply Fix</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW B: 14 VISUAL DIMENSION TILES                                */}
          {/* ================================================================ */}
          {activeViewTab === 'dimensions' && (
            <div className="space-y-2.5">
              {getDimensionList(analysisResult.dimensions).map((dim) => {
                const Icon = dim.icon;
                const isExpanded = expandedDimension === dim.id;

                return (
                  <div
                    key={dim.id}
                    onClick={() => setExpandedDimension(isExpanded ? null : dim.id)}
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl border ${dim.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{dim.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{dim.badge}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {dim.status === 'warning' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/30 font-bold">
                            Review
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 leading-relaxed animate-in fade-in duration-150">
                        {dim.desc}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
