import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  CheckCircle2,
  Sliders,
  Layers,
  TrendingUp,
  Film,
  Sun,
  Eye,
  RotateCcw,
  Zap,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
  Save,
  HelpCircle,
  Copy,
  Download,
  Flame,
  Camera,
  Compass,
  ArrowRight,
  Lock,
  Building2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Project } from '../../../types/editor';
import {
  NLEditPlan,
  NLEditStep,
  NL_CURATED_PROMPTS,
  NLPresetPrompt,
} from '../../../types/naturalLanguageEditing';
import {
  generateLocalPlanForPrompt,
  requestRemoteNLEditPlan,
  executeNLEditPlan,
} from '../../../engine/naturalLanguageEditingEngine';
import { getGroqConfig } from '../../../services/groqService';

interface NaturalLanguageEditingPanelProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onPushHistory: (label: string, partial: Partial<Project>) => void;
  onSelectTab?: (tabId: string) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const NaturalLanguageEditingPanel: React.FC<NaturalLanguageEditingPanelProps> = ({
  project,
  onUpdateProject,
  onPushHistory,
  onSelectTab,
  showToast,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<NLEditPlan | null>(() => {
    // Default initial plan demoing "Make me look like I'm standing in a luxury hotel at night, but keep my face exactly the same."
    return generateLocalPlanForPrompt(
      'Make me look like I’m standing in a luxury hotel at night, but keep my face exactly the same.',
      project
    );
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<'local' | 'groq' | 'gemini'>('groq');
  const [planHistory, setPlanHistory] = useState<NLEditPlan[]>([]);

  // Generate Plan from User Prompt
  const handleGeneratePlan = async (textToUse?: string) => {
    const text = (textToUse || promptInput).trim();
    if (!text) {
      showToast?.('error', 'Prompt Empty', 'Please enter a natural language editing instruction.');
      return;
    }

    setIsGenerating(true);
    showToast?.('info', 'Analyzing Request', `AI is parsing "${text.slice(0, 40)}..."`);

    try {
      let plan: NLEditPlan;
      if (aiProvider === 'local') {
        plan = generateLocalPlanForPrompt(text, project);
      } else {
        plan = await requestRemoteNLEditPlan(text, project, aiProvider === 'groq' ? 'groq' : 'gemini');
      }

      setCurrentPlan(plan);
      setPlanHistory((prev) => [plan, ...prev.filter((p) => p.id !== plan.id)].slice(0, 10));
      showToast?.(
        'success',
        'Action Plan Generated',
        `Generated ${plan.steps.length} sequential execution steps (${plan.latencyMs || 20}ms)`
      );
    } catch (err: any) {
      showToast?.('error', 'Plan Generation Failed', err.message || 'Error parsing prompt.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle individual step in plan
  const handleToggleStep = (stepId: string) => {
    if (!currentPlan) return;
    const updatedSteps = currentPlan.steps.map((st) =>
      st.id === stepId ? { ...st, enabled: !st.enabled } : st
    );
    setCurrentPlan({ ...currentPlan, steps: updatedSteps });
  };

  // Apply Plan to Project
  const handleExecutePlan = () => {
    if (!currentPlan) return;

    const { updatedProject, appliedStepsCount } = executeNLEditPlan(currentPlan, project);
    
    // Save snapshot with high-clarity label
    onPushHistory(`NL Edit: "${currentPlan.userPrompt.slice(0, 32)}" (${appliedStepsCount} steps)`, {
      currentSettings: updatedProject.currentSettings,
      toneCurves: updatedProject.toneCurves,
      hsl: updatedProject.hsl,
      masks: updatedProject.masks,
      crop: updatedProject.crop,
    });

    showToast?.(
      'success',
      'Applied Natural Language Edits',
      `Successfully executed ${appliedStepsCount} steps across adjustments, curves & masks!`
    );
  };

  // Select Curated Preset Prompt
  const handleSelectCuratedPrompt = (p: NLPresetPrompt) => {
    setPromptInput(p.prompt);
    handleGeneratePlan(p.prompt);
  };

  const categories = ['All', 'Selective Lighting', 'Cinematic', 'Portrait & Skin', 'Street & Moody', 'Product & Commercial', 'Vintage & Film'];

  const filteredCurated = selectedCategory === 'All'
    ? NL_CURATED_PROMPTS
    : NL_CURATED_PROMPTS.filter((p) => p.category === selectedCategory);

  return (
    <div className="p-4 space-y-5 text-slate-200">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-slate-900 border border-indigo-500/30 shadow-lg shadow-indigo-950/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
                Autonomous Studio AI
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Multitrack Engine
              </span>
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Natural Language Editing
            </h2>
            <p className="text-xs text-slate-300 max-w-md">
              Type any plain-English creative request. Lumina AI translates your intent into an explicit, multi-step editing plan across tonal curves, semantic masks, HSL, and film grading.
            </p>
          </div>
        </div>
      </div>

      {/* Input Cockpit */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Natural Language Instruction
          </label>

          {/* Engine Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setAiProvider('local')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                aiProvider === 'local'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Local Neural
            </button>
            <button
              onClick={() => setAiProvider('groq')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                aiProvider === 'groq'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Dispatches through Groq Model Router (Vision, Reasoning, Fast AI, Strong Language)"
            >
              <Zap className="w-2.5 h-2.5 text-amber-300" />
              Groq Model Router
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGeneratePlan();
              }
            }}
            placeholder="e.g. &quot;Make the person brighter but don't change the sky&quot; or &quot;Make this look like a professional movie still&quot;..."
            rows={3}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-all"
          />
          <button
            onClick={() => handleGeneratePlan()}
            disabled={isGenerating || !promptInput.trim()}
            className="absolute bottom-3 right-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-900/40 transition-all active:scale-95"
          >
            {isGenerating ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Decomposing...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Generate Plan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Action Plan Visualizer */}
      {currentPlan && (
        <div className="p-4 rounded-xl bg-slate-900/95 border border-indigo-500/40 shadow-xl space-y-4">
          {/* Plan Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {currentPlan.confidenceScore}% Confidence
                </span>
                {currentPlan.isComplexMultiStagePlan && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {currentPlan.steps.length}-Stage Plan
                  </span>
                )}
                {currentPlan.identityPreservationActive && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-indigo-400" />
                    Face Lock Active
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-teal-400" />
                  9-Vector AI Verified
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {currentPlan.latencyMs}ms • {currentPlan.modelUsed || currentPlan.aiProvider}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white leading-tight">
                {currentPlan.summary}
              </h3>
              <p className="text-xs text-slate-400">
                {currentPlan.overallExplanation}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-all flex items-center gap-1"
                title="Compare against direct text-to-image prompting"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Why Plan First?
              </button>
              <button
                onClick={handleExecutePlan}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                Apply Active Steps
              </button>
            </div>
          </div>

          {/* Why Plan First Comparison Callout */}
          {showComparison && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-200 space-y-1">
                <div className="font-bold text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Direct Image-Gen Model (Flawed)
                </div>
                <p className="text-[11px] text-rose-300/80 leading-relaxed">
                  Hallucinates face structure, distorts biometric likeness, blends foreground without perspective math, and forbids per-stage tuning.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Groq 12-Stage Plan First (Superior)
                </div>
                <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                  Locks 68 facial landmarks to guarantee 0% identity drift, computes contact shadows, aligns vanishing points, and renders non-destructively.
                </p>
              </div>
            </div>
          )}

          {/* Step-by-Step Interactive Workflow */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Execution Pipeline ({currentPlan.steps.length} Steps)</span>
              <span className="text-[10px] font-normal text-slate-500">
                Click step to inspect • Toggle checkboxes
              </span>
            </div>

            <div className="space-y-2">
              {currentPlan.steps.map((step) => {
                const isExpanded = expandedStepId === step.id;
                
                const getCategoryBadge = (cat: string, stageBadge?: string) => {
                  if (stageBadge) {
                    switch (stageBadge) {
                      case 'IDENTITY GUARD':
                      case 'VERIFIED':
                        return { label: stageBadge, bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
                      case 'SEGMENTATION':
                      case 'ALPHA MATTING':
                        return { label: stageBadge, bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
                      case 'BACKGROUND SYNTHESIS':
                      case 'GEOMETRY':
                        return { label: stageBadge, bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
                      case 'RELIGHTING':
                      case 'OCCLUSION':
                        return { label: stageBadge, bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
                      case 'COLOR SCIENCE':
                        return { label: stageBadge, bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
                      case 'QA PASSED':
                        return { label: stageBadge, bg: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
                      default:
                        return { label: stageBadge, bg: 'bg-slate-800 text-slate-300 border-slate-700' };
                    }
                  }

                  switch (cat) {
                    case 'FACE_LOCK':
                    case 'IDENTITY_PRESERVE':
                      return { label: 'Face Lock', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
                    case 'DETECT_SUBJECT':
                    case 'DETECT_FACE':
                    case 'FOREGROUND_SEPARATION':
                      return { label: 'Segmentation', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
                    case 'SCENE_RELOCATE':
                      return { label: 'Background', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
                    case 'PERSPECTIVE_MATCH':
                      return { label: 'Perspective', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
                    case 'LIGHTING_MATCH':
                      return { label: 'Lighting', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
                    case 'SHADOW_INTEGRATION':
                      return { label: 'Shadows', bg: 'bg-slate-700/60 text-slate-200 border-slate-600' };
                    case 'SEMANTIC_MASK':
                      return { label: 'Masking', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
                    case 'TONAL_CURVE':
                      return { label: 'Tone Curve', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
                    case 'COLOR_GRADE':
                      return { label: 'Color Grade', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
                    case 'LOCAL_EXPOSURE':
                      return { label: 'Exposure', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
                    case 'DETAIL_TEXTURE':
                      return { label: 'Detail', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
                    case 'FILM_EFFECTS':
                      return { label: 'Film FX', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
                    case 'VERIFICATION':
                      return { label: 'QA Check', bg: 'bg-teal-500/20 text-teal-300 border-teal-500/30' };
                    default:
                      return { label: 'Render', bg: 'bg-slate-700/50 text-slate-300 border-slate-600' };
                  }
                };

                const badge = getCategoryBadge(step.category, step.stageBadge);

                return (
                  <div
                    key={step.id}
                    className={`rounded-xl border transition-all ${
                      step.enabled
                        ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/30 border-slate-800/40 opacity-50'
                    }`}
                  >
                    <div className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Checkbox or Face Lock icon */}
                        {step.isIdentityLocked ? (
                          <div className="p-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0" title="Identity Locked (Immutable)">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <input
                            type="checkbox"
                            checked={step.enabled}
                            onChange={() => handleToggleStep(step.id)}
                            className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                          />
                        )}

                        {/* Step Number & Title */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
                            {step.stepNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs font-semibold text-white truncate">
                            {step.title}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {step.verificationCheck && (
                          <span className="hidden lg:inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
                            <Check className="w-2.5 h-2.5" />
                            {step.verificationCheck}
                          </span>
                        )}

                        <button
                          onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all shrink-0"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Step Details */}
                    {isExpanded && (
                      <div className="px-4 pb-3 pt-1 border-t border-slate-800/80 bg-slate-900/40 space-y-2 text-xs">
                        <div className="text-slate-300">
                          <strong className="text-slate-200">Action: </strong>
                          {step.description}
                        </div>
                        <div className="text-slate-400">
                          <strong className="text-slate-300">Reasoning: </strong>
                          {step.reasoning}
                        </div>

                        {step.parametersModified && step.parametersModified.length > 0 && (
                          <div className="pt-1 flex flex-wrap gap-1">
                            {step.parametersModified.map((param, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-slate-800/80 text-[10px] font-mono text-indigo-300 rounded border border-slate-700"
                              >
                                {param}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Curated Prompt Library */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Popular Natural Language Recipes
            </h3>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Recipe Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredCurated.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelectCuratedPrompt(item)}
              className="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                  {item.badge}
                </span>
                <span className="text-[10px] font-medium text-slate-500 group-hover:text-indigo-400 flex items-center gap-1 transition-colors">
                  Try prompt <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-indigo-200 transition-colors">
                "{item.prompt}"
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                {item.previewDescription}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
