import React, { useState, useEffect } from 'react';
import {
  GitFork,
  Cpu,
  Brain,
  Eye,
  Zap,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
  ShieldAlert,
  Search,
  Check,
  ChevronDown,
  Info,
  Play,
  RotateCcw,
  Sparkle,
} from 'lucide-react';
import {
  GroqRouterConfig,
  GroqTaskCategory,
  RouterDecision,
  TASK_DEFINITIONS,
  DEFAULT_TASK_MODEL_MAPPING,
} from '../../types/groqRouter';
import { GroqModelInfo } from '../../types/groq';
import {
  getGroqRouterConfig,
  saveGroqRouterConfig,
  updateTaskModelMapping,
  getAllKnownGroqModels,
  syncGroqCatalogOnline,
  routeGroqRequest,
  executeRoutedGroqCall,
} from '../../services/groqModelRouter';

interface GroqModelRouterViewProps {
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
  compact?: boolean;
}

export const GroqModelRouterView: React.FC<GroqModelRouterViewProps> = ({
  showToast,
  compact = false,
}) => {
  const [routerConfig, setRouterConfig] = useState<GroqRouterConfig>(getGroqRouterConfig());
  const [knownModels, setKnownModels] = useState<GroqModelInfo[]>(getAllKnownGroqModels());
  const [isSyncing, setIsSyncing] = useState(false);

  // Live Simulator state
  const [simPrompt, setSimPrompt] = useState('Make the person brighter but don’t change the sky');
  const [simHasImage, setSimHasImage] = useState(false);
  const [simDecision, setSimDecision] = useState<RouterDecision>(() =>
    routeGroqRequest({ prompt: 'Make the person brighter but don’t change the sky', hasImage: false })
  );
  const [isExecutingSim, setIsExecutingSim] = useState(false);
  const [simExecutionResult, setSimExecutionResult] = useState<any | null>(null);

  // Recalculate simulation on prompt or image toggle or config change
  useEffect(() => {
    const decision = routeGroqRequest({
      prompt: simPrompt,
      hasImage: simHasImage,
    });
    setSimDecision(decision);
  }, [simPrompt, simHasImage, routerConfig]);

  const handleSyncCatalog = async () => {
    setIsSyncing(true);
    showToast?.('info', 'Syncing Catalog', 'Querying Groq API for available LPU models...');

    try {
      const res = await syncGroqCatalogOnline();
      if (res.success) {
        setKnownModels(res.models);
        setRouterConfig(getGroqRouterConfig());
        showToast?.(
          'success',
          'Catalog Synced',
          `Catalog updated! Total ${res.models.length} Groq models available (${res.discoveredCount} newly registered).`
        );
      } else {
        showToast?.('error', 'Sync Failed', res.error || 'Failed to fetch model catalog.');
      }
    } catch (err: any) {
      showToast?.('error', 'Sync Error', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateTaskModel = (task: GroqTaskCategory, modelId: string) => {
    const updated = updateTaskModelMapping(task, modelId);
    setRouterConfig(updated);
    showToast?.('success', 'Model Route Updated', `Task "${TASK_DEFINITIONS[task].title}" is now routed to ${modelId}`);
  };

  const handleUpdateRouterMode = (mode: GroqRouterConfig['mode']) => {
    const updated = saveGroqRouterConfig({ mode });
    setRouterConfig(updated);
    showToast?.('info', 'Router Mode Changed', `Groq Model Router set to ${mode.toUpperCase()} mode.`);
  };

  const handleUpdateStrategy = (strategy: GroqRouterConfig['strategy']) => {
    const updated = saveGroqRouterConfig({ strategy });
    setRouterConfig(updated);
    showToast?.('info', 'Routing Strategy Updated', `Optimization strategy set to ${strategy.replace('_', ' ')}.`);
  };

  const handleResetToDefaults = () => {
    const updated = saveGroqRouterConfig({
      mode: 'auto',
      strategy: 'balanced',
      taskMapping: { ...DEFAULT_TASK_MODEL_MAPPING },
    });
    setRouterConfig(updated);
    showToast?.('info', 'Defaults Restored', 'Model Router mapping reset to recommended defaults.');
  };

  const handleExecuteLiveTest = async () => {
    if (!simPrompt.trim()) return;
    setIsExecutingSim(true);
    setSimExecutionResult(null);

    try {
      const res = await executeRoutedGroqCall(simPrompt, {
        hasImage: simHasImage,
        jsonMode: false,
      });
      setSimExecutionResult(res);
      if (res.success) {
        showToast?.('success', 'Router Executed', `Executed on ${res.modelExecuted} in ${res.latencyMs}ms`);
      } else {
        showToast?.('error', 'Execution Failed', res.error);
      }
    } catch (err: any) {
      showToast?.('error', 'Router Error', err.message);
    } finally {
      setIsExecutingSim(false);
    }
  };

  const samplePrompts = [
    { label: 'Simple edit', text: 'Increase exposure by +0.35 and add +10 contrast', hasImg: false },
    { label: 'Complex plan', text: 'Make the person brighter but don’t change the sky', hasImg: false },
    { label: 'Image analysis', text: 'Diagnose dynamic range, highlight clipping and shadows', hasImg: true },
    { label: 'Object segment', text: 'Classify subject boundaries, sky horizon and skin tones', hasImg: true },
    { label: 'Batch macro', text: 'Batch normalize color temperature across 100 portrait files', hasImg: false },
    { label: 'Creative film', text: 'Color grade with cinematic 35mm Hollywood warm teal tones', hasImg: false },
  ];

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Vision':
        return <Eye className="w-4 h-4 text-purple-400" />;
      case 'Reasoning':
        return <Brain className="w-4 h-4 text-blue-400" />;
      case 'Fast AI':
        return <Zap className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* 1. Header & Router Topology Diagram */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <GitFork className="w-3 h-3" />
                Adaptive AI Orchestrator
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {knownModels.length} Models Registered
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
              Groq Dynamic Model Router
            </h3>
            <p className="text-xs text-slate-400 max-w-xl mt-0.5">
              Instead of hardcoding a single static model, Lumina dynamically routes incoming AI requests to the optimal LPU model based on task intent, visual frame presence, reasoning complexity, and latency requirements.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSyncCatalog}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Query Groq API to discover newly added models"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
              Sync Groq Catalog
            </button>

            <button
              onClick={handleResetToDefaults}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs transition-all"
              title="Reset mapping to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic ASCII / Graphical Pipeline Chart */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-xs relative z-10 overflow-x-auto">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              Live Routing Pipeline
            </span>
            <span className="text-[10px] text-slate-500">
              Active Track: <strong className="text-white">{simDecision.taskCategory}</strong> → <strong className="text-indigo-300">{simDecision.selectedModel}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {/* Track 1: Vision */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                simDecision.isVisionCapable
                  ? 'bg-purple-950/30 border-purple-500/60 ring-2 ring-purple-500/20'
                  : 'bg-slate-900/50 border-slate-800/80 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-white text-xs">Vision Track</span>
                </div>
                {simDecision.isVisionCapable && (
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Image understanding, spatial classification & segmentation.</p>
              <div className="mt-2 text-[10px] font-mono text-purple-300 bg-purple-950/50 px-2 py-1 rounded border border-purple-800/40 truncate">
                {routerConfig.taskMapping.image_understanding}
              </div>
            </div>

            {/* Track 2: Reasoning */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                simDecision.speedTier === 'deep_reasoning' || simDecision.taskCategory === 'complex_plan'
                  ? 'bg-blue-950/30 border-blue-500/60 ring-2 ring-blue-500/20'
                  : 'bg-slate-900/50 border-slate-800/80 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white text-xs">Reasoning Track</span>
                </div>
                {(simDecision.speedTier === 'deep_reasoning' || simDecision.taskCategory === 'complex_plan') && (
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Complex multi-track plans, tone-curve math & exclusion logic.</p>
              <div className="mt-2 text-[10px] font-mono text-blue-300 bg-blue-950/50 px-2 py-1 rounded border border-blue-800/40 truncate">
                {routerConfig.taskMapping.complex_plan}
              </div>
            </div>

            {/* Track 3: Fast AI / Instant */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                simDecision.speedTier === 'ultra_fast' && !simDecision.isVisionCapable
                  ? 'bg-emerald-950/30 border-emerald-500/60 ring-2 ring-emerald-500/20'
                  : 'bg-slate-900/50 border-slate-800/80 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-xs">Fast AI Track</span>
                </div>
                {simDecision.speedTier === 'ultra_fast' && !simDecision.isVisionCapable && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Single-parameter micro-edits, instant sliders & batch macros.</p>
              <div className="mt-2 text-[10px] font-mono text-emerald-300 bg-emerald-950/50 px-2 py-1 rounded border border-emerald-800/40 truncate">
                {routerConfig.taskMapping.simple_command}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Routing Mode & Strategy Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Router Mode */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Router Dispatch Mode
            </span>
            <span className="text-[10px] font-mono text-indigo-300 uppercase">
              Mode: {routerConfig.mode}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'auto', label: 'Auto Router', desc: 'AI classifies task & dispatches' },
              { id: 'policy', label: 'Policy Mode', desc: 'Cost & speed optimization' },
              { id: 'manual', label: 'Manual Lock', desc: 'Fixed single model' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => handleUpdateRouterMode(m.id as any)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  routerConfig.mode === m.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold">{m.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Optimization Strategy */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Optimization Strategy
            </span>
            <span className="text-[10px] font-mono text-amber-300 uppercase">
              {routerConfig.strategy.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'balanced', label: 'Balanced', desc: 'Optimal trade-off' },
              { id: 'speed_optimized', label: 'Speed-First', desc: 'Sub-100ms response' },
              { id: 'quality_optimized', label: 'Quality-First', desc: 'Deep 70B reasoning' },
              { id: 'cost_optimized', label: 'Cost-First', desc: 'Lowest token price' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => handleUpdateStrategy(s.id as any)}
                className={`p-2 rounded-xl text-left border transition-all ${
                  routerConfig.strategy === s.id
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold">{s.label}</div>
                <div className="text-[10px] text-slate-400 leading-tight">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Task-to-Model Mapping Interactive Matrix */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Task-to-Model Mapping Matrix
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize which Groq LPU model handles each specific photographic workflow category. Update mappings as Groq releases new models.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(Object.keys(TASK_DEFINITIONS) as GroqTaskCategory[]).map((taskKey) => {
            const def = TASK_DEFINITIONS[taskKey];
            const currentModelId = routerConfig.taskMapping[taskKey];
            const currentModelInfo = knownModels.find((m) => m.id === currentModelId);

            return (
              <div
                key={taskKey}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 space-y-2.5 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      {getTierIcon(def.targetTier)}
                      <span className="text-xs font-bold text-white">{def.title}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-slate-800 text-slate-300">
                        {def.targetTier}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{def.description}</p>
                  </div>
                </div>

                {/* Example query */}
                <div className="text-[10px] text-slate-500 italic bg-slate-900/60 px-2 py-1 rounded border border-slate-800/40">
                  Example: {def.examplePrompt}
                </div>

                {/* Model Selector Dropdown */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-semibold shrink-0">Assigned Model:</span>
                  <select
                    value={currentModelId}
                    onChange={(e) => handleUpdateTaskModel(taskKey, e.target.value)}
                    className="flex-1 max-w-[240px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-indigo-200 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    {knownModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.speedTier.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Live Interactive Router Sandbox & Simulator */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Live Router Test Bench & Intent Simulator
            </h4>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <input
              type="checkbox"
              checked={simHasImage}
              onChange={(e) => setSimHasImage(e.target.checked)}
              className="rounded accent-purple-500"
            />
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            <span>Image Frame Attached</span>
          </label>
        </div>

        {/* Quick Sample Prompts */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {samplePrompts.map((sp, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSimPrompt(sp.text);
                setSimHasImage(sp.hasImg);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white border border-slate-800 whitespace-nowrap transition-all"
            >
              {sp.label}
            </button>
          ))}
        </div>

        {/* Input & Execution Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={simPrompt}
            onChange={(e) => setSimPrompt(e.target.value)}
            placeholder="Type any test instruction (e.g. 'Make the person brighter but preserve the sky')..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleExecuteLiveTest}
            disabled={isExecutingSim || !simPrompt.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 transition-all disabled:opacity-50"
          >
            {isExecutingSim ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-amber-300" />
            )}
            Execute Route
          </button>
        </div>

        {/* Real-Time Routing Decision Card */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Routing Decision:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wide">
                {simDecision.taskCategory}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {simDecision.confidenceScore}% Confidence
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span>Target LPU: <strong className="text-white">{simDecision.selectedModel}</strong></span>
              <span>•</span>
              <span>Tier: <strong className="text-amber-300">{simDecision.speedTier.replace('_', ' ')}</strong></span>
              <span>•</span>
              <span>~{simDecision.estimatedLatencyMs}ms</span>
            </div>
          </div>

          <div className="text-xs text-slate-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Router Rationale: </strong>
              {simDecision.reason}
            </span>
          </div>

          {/* If Live Execution occurred, show response snippet */}
          {simExecutionResult && (
            <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Live Execution Result ({simExecutionResult.modelExecuted})
                </span>
                <span className="text-slate-400 font-mono text-[10px]">
                  {simExecutionResult.latencyMs}ms latency
                </span>
              </div>
              <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto bg-slate-950 p-2 rounded border border-slate-800">
                {simExecutionResult.content || JSON.stringify(simExecutionResult.parsedJson, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
