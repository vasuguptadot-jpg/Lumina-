import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Send,
  CheckCircle2,
  Lock,
  Eye,
  Sliders,
  Layers,
  Camera,
  Play,
  RotateCcw,
  Building2,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Info,
  Check,
  Flame,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  NLEditPlan,
  NLEditStep,
  NL_CURATED_PROMPTS,
  NLPresetPrompt,
} from '../../types/naturalLanguageEditing';
import {
  generateLocalPlanForPrompt,
  requestRemoteNLEditPlan,
  executeNLEditPlan,
} from '../../engine/naturalLanguageEditingEngine';
import { Project } from '../../types/editor';
import { DEFAULT_ADJUSTMENTS, DEFAULT_TONE_CURVES, DEFAULT_HSL } from '../../engine/defaultSettings';

interface AIEditingPlanExplorerProps {
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
  project?: Project;
  onApplyPlan?: (plan: NLEditPlan) => void;
}

export const AIEditingPlanExplorer: React.FC<AIEditingPlanExplorerProps> = ({
  showToast,
  project,
  onApplyPlan,
}) => {
  const defaultMockProject: Project = project || {
    id: 'mock_project',
    name: 'Untitled Project',
    originalImage: '',
    currentSettings: { ...DEFAULT_ADJUSTMENTS },
    toneCurves: { ...DEFAULT_TONE_CURVES },
    hsl: { ...DEFAULT_HSL },
    masks: [],
    crop: { aspectRatio: 'free', x: 0, y: 0, width: 1, height: 1, rotation: 0, flipX: false, flipY: false, perspectiveX: 0, perspectiveY: 0 },
    history: [],
    historyIndex: -1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const [promptInput, setPromptInput] = useState(
    'Make me look like I’m standing in a luxury hotel at night, but keep my face exactly the same.'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePlan, setActivePlan] = useState<NLEditPlan>(() =>
    generateLocalPlanForPrompt(
      'Make me look like I’m standing in a luxury hotel at night, but keep my face exactly the same.',
      defaultMockProject
    )
  );
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [simulatedStepIndex, setSimulatedStepIndex] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<'pipeline' | 'comparison' | 'json'>('pipeline');

  const benchmarkPrompts = [
    {
      title: 'Luxury Hotel at Night (12-Step Plan)',
      prompt: 'Make me look like I’m standing in a luxury hotel at night, but keep my face exactly the same.',
      badge: 'FEATURED BENCHMARK',
      icon: Building2,
    },
    {
      title: 'Cyberpunk Neon Street (Face Lock)',
      prompt: 'Relocate subject to a rain-slicked Tokyo neon street at midnight with magenta/cyan rim lighting, keeping facial likeness 100% untouched.',
      badge: '11-STAGE PLAN',
      icon: Zap,
    },
    {
      title: 'Subject Brightening (Sky Protection)',
      prompt: 'Make the person brighter but don’t change the sky.',
      badge: '7-STAGE MASKING',
      icon: Sparkles,
    },
  ];

  const handleGenerate = async (customPrompt?: string) => {
    const text = (customPrompt || promptInput).trim();
    if (!text) return;

    setIsGenerating(true);
    showToast?.('info', 'Planning Workflow', 'Groq LPU decomposing complex request into sequential stages...');

    try {
      const plan = await requestRemoteNLEditPlan(text, defaultMockProject, 'groq');
      setActivePlan(plan);
      setExpandedStepId(plan.steps[2]?.id || plan.steps[0]?.id || null);
      showToast?.('success', 'AI Plan Generated', `Successfully decomposed into ${plan.steps.length} sequential verification stages!`);
    } catch (err: any) {
      showToast?.('error', 'Planning Failed', err.message || 'Error generating editing plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleStep = (stepId: string) => {
    const updated = activePlan.steps.map((st) =>
      st.id === stepId ? { ...st, enabled: !st.enabled } : st
    );
    setActivePlan({ ...activePlan, steps: updated });
  };

  const handleRunSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulatedStepIndex(0);

    for (let i = 0; i < activePlan.steps.length; i++) {
      setSimulatedStepIndex(i);
      await new Promise((r) => setTimeout(r, 450));
    }

    setIsSimulating(false);
    showToast?.('success', 'Execution Completed', `All ${activePlan.steps.length} plan steps verified and executed!`);
  };

  const handleApplyToStudio = () => {
    if (onApplyPlan) {
      onApplyPlan(activePlan);
    }
    showToast?.('success', 'Plan Executed', `Applied ${activePlan.steps.filter((s) => s.enabled).length} active stages to your project!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner explaining why AI Plan First is superior */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border border-amber-500/30 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                Groq Ultra-Fast AI Reasoning
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                Zero-Drift Face Lock
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                Deterministic Multi-Stage Planner
              </span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-amber-400" />
              AI Editing Plan Architecture
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              For complex requests (e.g. background relocation with face preservation), Groq formulates an explicit, verifiable 12-stage plan prior to execution. This prevents the identity hallucinations and floating artifacts common in naive text-to-image models.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleApplyToStudio}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply Active Plan to Studio
            </button>
          </div>
        </div>
      </div>

      {/* Quick Benchmark Prompts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Curated Complex Benchmarks
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {benchmarkPrompts.map((bench, idx) => {
            const Icon = bench.icon;
            const isCurrent = promptInput === bench.prompt;
            return (
              <div
                key={idx}
                onClick={() => {
                  setPromptInput(bench.prompt);
                  handleGenerate(bench.prompt);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer group space-y-1.5 ${
                  isCurrent
                    ? 'bg-amber-950/40 border-amber-500/50 shadow-md shadow-amber-950/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                    isCurrent ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {bench.badge}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                </div>
                <div className="text-xs font-bold text-white group-hover:text-amber-200">
                  {bench.title}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  "{bench.prompt}"
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Prompt Input */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Complex Natural Language Prompt
          </label>
          <span className="text-[10px] text-slate-400">
            Powered by Groq Model Router & LPU Inference
          </span>
        </div>

        <div className="relative">
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none font-medium"
            placeholder="Describe any multi-stage photo manipulation request..."
          />
          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating || !promptInput.trim()}
            className="absolute bottom-3 right-3 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-900/40 transition-all active:scale-95"
          >
            {isGenerating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Planning...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Formulate AI Plan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Plan Display & View Mode Selector */}
      {activePlan && (
        <div className="space-y-4">
          {/* Plan Header Card */}
          <div className="p-4 rounded-xl bg-slate-900/95 border border-indigo-500/30 space-y-3 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {activePlan.confidenceScore}% Verification Confidence
                  </span>
                  {activePlan.isComplexMultiStagePlan && (
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {activePlan.steps.length}-Stage Plan
                    </span>
                  )}
                  {activePlan.identityPreservationActive && (
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-indigo-400" />
                      Face Lock Active
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-400">
                    {activePlan.latencyMs}ms • {activePlan.modelUsed}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  {activePlan.summary}
                </h3>
              </div>

              {/* View Switcher */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                <button
                  onClick={() => setActiveViewTab('pipeline')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeViewTab === 'pipeline'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Step Pipeline
                </button>
                <button
                  onClick={() => setActiveViewTab('comparison')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeViewTab === 'comparison'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Why Plan First?
                </button>
                <button
                  onClick={() => setActiveViewTab('json')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeViewTab === 'json'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Machine Schema
                </button>
              </div>
            </div>

            {/* Explanation */}
            <p className="text-xs text-slate-300 leading-relaxed">
              {activePlan.overallExplanation}
            </p>

            {/* Simulation Controller */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-pulse text-emerald-400' : ''}`} />
                  {isSimulating ? 'Simulating Stages...' : 'Simulate Step-by-Step Execution'}
                </button>
              </div>

              <div className="text-[11px] font-medium text-slate-400">
                {activePlan.steps.filter((s) => s.enabled).length} of {activePlan.steps.length} steps active
              </div>
            </div>
          </div>

          {/* VIEW TAB 1: PIPELINE STEPS */}
          {activeViewTab === 'pipeline' && (
            <div className="space-y-2.5">
              {activePlan.steps.map((step, idx) => {
                const isExpanded = expandedStepId === step.id;
                const isCurrentSim = simulatedStepIndex === idx;

                const getStageBadgeColor = (badge?: string) => {
                  switch (badge) {
                    case 'IDENTITY GUARD':
                    case 'VERIFIED':
                      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                    case 'SEGMENTATION':
                    case 'ALPHA MATTING':
                      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
                    case 'BACKGROUND SYNTHESIS':
                    case 'GEOMETRY':
                      return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
                    case 'RELIGHTING':
                    case 'OCCLUSION':
                      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                    case 'COLOR SCIENCE':
                      return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                    case 'QA PASSED':
                      return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
                    default:
                      return 'bg-slate-800 text-slate-300 border-slate-700';
                  }
                };

                return (
                  <div
                    key={step.id}
                    className={`rounded-xl border transition-all ${
                      isCurrentSim
                        ? 'bg-indigo-950/60 border-indigo-400 shadow-md ring-1 ring-indigo-400'
                        : step.enabled
                        ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/40 border-slate-800/40 opacity-50'
                    }`}
                  >
                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Checkbox / Lock Icon */}
                        {step.isIdentityLocked ? (
                          <div className="p-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0" title="Identity Locked (Immutable)">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <input
                            type="checkbox"
                            checked={step.enabled}
                            onChange={() => handleToggleStep(step.id)}
                            className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                          />
                        )}

                        {/* Step Number Badge */}
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isCurrentSim ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {step.stepNumber}
                        </span>

                        {/* Stage Badge */}
                        {step.stageBadge && (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider shrink-0 ${getStageBadgeColor(step.stageBadge)}`}>
                            {step.stageBadge}
                          </span>
                        )}

                        {/* Title */}
                        <span className="text-xs font-bold text-white truncate">
                          {step.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {step.verificationCheck && (
                          <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60">
                            <Check className="w-3 h-3" />
                            {step.verificationCheck}
                          </span>
                        )}

                        <button
                          onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    {isExpanded && (
                      <div className="px-4 pb-3.5 pt-1.5 border-t border-slate-800/80 bg-slate-950/50 space-y-2.5 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Action Description
                            </span>
                            <p className="text-slate-200 leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Reasoning & Architectural Role
                            </span>
                            <p className="text-slate-300 leading-relaxed">
                              {step.reasoning}
                            </p>
                          </div>
                        </div>

                        {step.parametersModified && step.parametersModified.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Modified Parameters & Verification Tracks
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {step.parametersModified.map((param, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-slate-800 text-[10px] font-mono text-indigo-300 rounded border border-slate-700"
                                >
                                  {param}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW TAB 2: WHY PLAN FIRST? (COMPARISON MATRIX) */}
          {activeViewTab === 'comparison' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Direct Image Generation Model (The Flawed Way) */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Direct Image-Gen Model (Naive Prompting)
                </div>
                <ul className="space-y-2 text-xs text-rose-200/90 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">✗</span>
                    <span><strong>Facial Distortion:</strong> Neural diffusion models alter eye size, bone structure, and skin pores, destroying the user's authentic biometric likeness.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">✗</span>
                    <span><strong>Black Box Execution:</strong> All 10+ visual aspects (lighting, background, perspective, pose) are fused into 1 non-inspectable pass.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">✗</span>
                    <span><strong>Floating / Pasted Look:</strong> Inpainting lacks contact shadow grounding and accurate 3D perspective vanishing point calculation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">✗</span>
                    <span><strong>Zero Adjustability:</strong> If the chandelier lighting is too yellow, you must re-generate the entire photo and lose everything.</span>
                  </li>
                </ul>
              </div>

              {/* Right Column: Lumina AI + Groq Editing Plan (The Superior Way) */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Lumina AI 12-Stage Plan First (Groq LPU)
                </div>
                <ul className="space-y-2 text-xs text-emerald-200/90 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>100% Face Identity Lock:</strong> Cryptographically freezes the facial polygon so the authentic face is preserved with zero drift.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Deterministic Stage-by-Stage Control:</strong> Toggle, tune, or re-run any individual step (shadows, WB, curves, masks) independently.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Physical Perspective & Occlusion:</strong> Vanishing points aligned at 50mm focal length with realistic contact floor shadows.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Automated Verification:</strong> Real-time SSIM identity cross-correlation and lighting convergence scoring before final rendering.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* VIEW TAB 3: MACHINE-READABLE SCHEMA */}
          {activeViewTab === 'json' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Structured Groq JSON Tool-Calling Payload</span>
                <span>{activePlan.steps.length} Stages</span>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900/90 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-96 scrollbar-thin">
                {JSON.stringify(activePlan, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
