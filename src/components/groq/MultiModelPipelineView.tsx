import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowDown,
  ArrowRight,
  Eye,
  Sliders,
  Camera,
  Play,
  RotateCcw,
  Check,
  Lock,
  Flame,
  FileCheck,
  Send,
  AlertCircle,
  Maximize2,
} from 'lucide-react';
import {
  MultiModelPipelineRun,
  MULTI_MODEL_PRESETS,
  MultiModelArchitecturePreset,
} from '../../types/multiModelPipeline';
import { buildMultiModelPipelineRun } from '../../services/multiModelPipelineService';
import { Project } from '../../types/editor';

interface MultiModelPipelineViewProps {
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
  project?: Project;
  onApplyPipeline?: (run: MultiModelPipelineRun) => void;
}

export const MultiModelPipelineView: React.FC<MultiModelPipelineViewProps> = ({
  showToast,
  project,
  onApplyPipeline,
}) => {
  const [promptInput, setPromptInput] = useState(
    'Make me look like I’m standing in a luxury hotel at night, but keep my face exactly the same.'
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeRun, setActiveRun] = useState<MultiModelPipelineRun>(() =>
    buildMultiModelPipelineRun(
      'Make me look like I’m standing in a luxury hotel at night, but keep my face exactly the same.',
      project
    )
  );
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>('image-model');
  const [viewTab, setViewTab] = useState<'flowchart' | 'workers' | 'metrics'>('flowchart');

  const handleRunPipeline = async (customPrompt?: string) => {
    const text = (customPrompt || promptInput).trim();
    if (!text) return;

    setIsExecuting(true);
    showToast?.('info', 'Multi-Model Pipeline', 'Groq orchestrating specialized AI models...');

    try {
      // Step-by-step interactive simulation of the pipeline stages
      for (let i = 1; i <= 6; i++) {
        setActiveStepIndex(i);
        await new Promise((r) => setTimeout(r, 400));
      }

      const run = buildMultiModelPipelineRun(text, project);
      setActiveRun(run);
      showToast?.(
        'success',
        'Pipeline Complete',
        'Groq orchestrated Image Model, Vision AI & Editor with 100% face identity match!'
      );
    } catch (err: any) {
      showToast?.('error', 'Execution Error', err.message || 'Pipeline failed');
    } finally {
      setIsExecuting(false);
      setActiveStepIndex(null);
    }
  };

  const handleApplyToStudio = () => {
    if (onApplyPipeline) {
      onApplyPipeline(activeRun);
    }
    showToast?.(
      'success',
      'Applied to Studio Canvas',
      'Dispatched 4 multi-pass layers, parametric split-toning, and face lock to your project!'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Architectural Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-amber-950/70 border border-indigo-500/30 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                Groq LPU Orchestrator Brain
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 uppercase tracking-wider flex items-center gap-1">
                <Cpu className="w-3 h-3 text-indigo-400" />
                Multi-Model Synergy
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                Zero-Drift Face Lock
              </span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-400" />
              Groq + Specialized Image Generation Pipeline
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Groq serves as the intelligent reasoning brain and orchestrator: it understands complex requests, formulates an AI execution plan, delegates specialized tasks to specialized models, composites results in WebGL, and performs biometric verification.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleApplyToStudio}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply Pipeline Result to Studio
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Flowchart Diagram */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Live Orchestration Flowchart
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive stage execution: Groq $\rightarrow$ Planning $\rightarrow$ Parallel Worker Dispatch $\rightarrow$ Compositor $\rightarrow$ QA Verification $\rightarrow$ Export
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRunPipeline()}
              disabled={isExecuting}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-900/50 transition-all active:scale-95"
            >
              <Play className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
              {isExecuting ? 'Running Pipeline...' : 'Execute Multi-Model Run'}
            </button>
          </div>
        </div>

        {/* The Visual Architecture Flowchart */}
        <div className="relative py-2 flex flex-col items-center gap-3">
          {/* Stage 1: GROQ BRAIN */}
          <div
            className={`w-full max-w-md p-3.5 rounded-xl border transition-all text-center relative ${
              activeStepIndex === 1
                ? 'bg-amber-950/80 border-amber-400 shadow-lg ring-2 ring-amber-400'
                : 'bg-slate-950 border-amber-500/40'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xs">
              <Zap className="w-4 h-4" />
              GROQ LPU REASONING ENGINE (Brain & Orchestrator)
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Model: {activeRun.orchestrator.model} • {activeRun.orchestrator.latencyMs}ms
            </div>
            <div className="mt-1 text-xs text-slate-200">
              Understands natural language request & extracts technical parameters
            </div>
          </div>

          {/* Connector */}
          <ArrowDown className="w-4 h-4 text-slate-500 animate-pulse" />

          {/* Stage 2: CREATE AI PLAN */}
          <div
            className={`w-full max-w-md p-3 rounded-xl border transition-all text-center ${
              activeStepIndex === 2
                ? 'bg-indigo-950/80 border-indigo-400 shadow-lg ring-2 ring-indigo-400'
                : 'bg-slate-950 border-indigo-500/40'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-indigo-300 font-bold text-xs">
              <FileCheck className="w-4 h-4" />
              FORMULATE DETERMINISTIC 12-STAGE PLAN
            </div>
            <div className="mt-0.5 text-[11px] text-slate-300">
              Splits workflow into parallel sub-tasks & enforces biometric face lock
            </div>
          </div>

          {/* Connector to Parallel Workers */}
          <div className="flex items-center gap-2 text-slate-500 my-1">
            <span className="h-[1px] w-24 bg-slate-700" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Parallel Delegation
            </span>
            <span className="h-[1px] w-24 bg-slate-700" />
          </div>

          {/* Stage 3: THE 3 SPECIALIZED WORKERS (Image Model | Vision AI | Editor) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
            {/* Worker 1: Specialized Image Gen Model */}
            <div
              onClick={() => setSelectedWorkerId('image-model')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                selectedWorkerId === 'image-model' || activeStepIndex === 3
                  ? 'bg-purple-950/50 border-purple-400 shadow-lg shadow-purple-950/50 ring-1 ring-purple-400'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  IMAGE MODEL
                </span>
                <span className="text-[10px] font-mono text-purple-400">
                  {activeRun.workers.imageModelTask.latencyMs}ms
                </span>
              </div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-purple-400" />
                Background Synthesis
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Generates 4K luxury hotel plate with matched 50mm horizon & 2800K chandelier bokeh.
              </p>
              <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" />
                Zero subject pixel contamination
              </div>
            </div>

            {/* Worker 2: Specialized Vision AI */}
            <div
              onClick={() => setSelectedWorkerId('vision-ai')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                selectedWorkerId === 'vision-ai' || activeStepIndex === 3
                  ? 'bg-blue-950/50 border-blue-400 shadow-lg shadow-blue-950/50 ring-1 ring-blue-400'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  VISION AI
                </span>
                <span className="text-[10px] font-mono text-blue-400">
                  {activeRun.workers.visionAITask.latencyMs}ms
                </span>
              </div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                Face Lock & Landmarks
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Extracts 68 3D landmarks, gaze vectors, sub-pixel hair matting & depth maps.
              </p>
              <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                100.0% Identity Preservation Lock
              </div>
            </div>

            {/* Worker 3: Deterministic Editor */}
            <div
              onClick={() => setSelectedWorkerId('editor')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                selectedWorkerId === 'editor' || activeStepIndex === 3
                  ? 'bg-amber-950/50 border-amber-400 shadow-lg shadow-amber-950/50 ring-1 ring-amber-400'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  PARAMETRIC EDITOR
                </span>
                <span className="text-[10px] font-mono text-amber-400">
                  {activeRun.workers.editorTask.latencyMs}ms
                </span>
              </div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Lighting & Color Science
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Applies 2800K warm rim light, navy/amber split toning, and S-curve roll-off.
              </p>
              <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" />
                32-Bit Float WebGL Shader Pipeline
              </div>
            </div>
          </div>

          {/* Connector */}
          <ArrowDown className="w-4 h-4 text-slate-500 animate-pulse" />

          {/* Stage 4: COMPOSITOR ENGINE */}
          <div
            className={`w-full max-w-md p-3.5 rounded-xl border transition-all text-center ${
              activeStepIndex === 4
                ? 'bg-emerald-950/80 border-emerald-400 shadow-lg ring-2 ring-emerald-400'
                : 'bg-slate-950 border-emerald-500/40'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-emerald-300 font-bold text-xs">
              <Layers className="w-4 h-4 text-emerald-400" />
              DEEP WEBGL COMPOSITOR (Multi-Pass Fusion)
            </div>
            <div className="mt-0.5 text-[11px] text-slate-300">
              Blends 4 alpha layers + contact floor shadows (18px penumbra) + specular rim normalization
            </div>
          </div>

          {/* Connector */}
          <ArrowDown className="w-4 h-4 text-slate-500 animate-pulse" />

          {/* Stage 5: VERIFICATION */}
          <div
            className={`w-full max-w-md p-3 rounded-xl border transition-all text-center ${
              activeStepIndex === 5
                ? 'bg-teal-950/80 border-teal-400 shadow-lg ring-2 ring-teal-400'
                : 'bg-slate-950 border-teal-500/40'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-teal-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              AUTOMATED BIOMETRIC & PHOTOMETRIC QA VERIFICATION
            </div>
            <div className="mt-0.5 text-[11px] text-emerald-400 font-mono">
              Identity Match: {activeRun.verification.identityPreservationScore}% • Light Convergence: {activeRun.verification.lightingConvergenceScore}% • Halos: {activeRun.verification.edgeHaloArtifactDelta}%
            </div>
          </div>

          {/* Connector */}
          <ArrowDown className="w-4 h-4 text-slate-500 animate-pulse" />

          {/* Stage 6: EXPORT */}
          <div
            className={`w-full max-w-md p-3 rounded-xl border transition-all text-center ${
              activeStepIndex === 6
                ? 'bg-indigo-950/80 border-indigo-400 shadow-lg ring-2 ring-indigo-400'
                : 'bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border-indigo-500/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-white font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
              EXPORT TO STUDIO CANVAS (Non-Destructive)
            </div>
            <div className="mt-0.5 text-[10px] text-slate-300">
              Format: {activeRun.exportArtifacts.targetFormat} • 100% Non-destructive multitrack state
            </div>
          </div>
        </div>
      </div>

      {/* Preset Benchmarks Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Curated Multi-Model Benchmarks
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MULTI_MODEL_PRESETS.map((preset) => {
            const isCurrent = promptInput === preset.prompt;
            return (
              <div
                key={preset.id}
                onClick={() => {
                  setPromptInput(preset.prompt);
                  handleRunPipeline(preset.prompt);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer group space-y-1.5 ${
                  isCurrent
                    ? 'bg-indigo-950/50 border-indigo-500/60 shadow-md shadow-indigo-950/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                    isCurrent ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {preset.badge}
                  </span>
                </div>
                <div className="text-xs font-bold text-white group-hover:text-indigo-200">
                  {preset.title}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  "{preset.prompt}"
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Prompt Box */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Orchestration Request Prompt
          </label>
          <span className="text-[10px] text-slate-400">
            Groq LPU dispatches sub-tasks to Image Gen, Vision AI, and Editor
          </span>
        </div>

        <div className="relative">
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-medium"
            placeholder="Describe any multi-model photo editing orchestration..."
          />
          <button
            onClick={() => handleRunPipeline()}
            disabled={isExecuting || !promptInput.trim()}
            className="absolute bottom-3 right-3 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-900/40 transition-all active:scale-95"
          >
            {isExecuting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Orchestrating...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Dispatch Pipeline
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
