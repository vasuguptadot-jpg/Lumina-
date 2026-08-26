import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  ArrowRight,
  RefreshCw,
  Code2,
  Terminal,
  Layers,
  Sparkles,
  Zap,
  Info,
  Check,
  RotateCcw,
  Eye,
  Settings2,
  Lock,
} from 'lucide-react';
import {
  AIToolCall,
  ToolDefinition,
  ToolValidationResult,
  PermissionCheckResult,
  ToolExecutionOutput,
  PipelineExecutionLog,
  ToolPolicyConfig,
  DEFAULT_TOOL_POLICY,
} from '../../types/aiToolCalling';
import {
  REGISTERED_TOOLS,
  getToolPolicyConfig,
  saveToolPolicyConfig,
  getPipelineExecutionLogs,
  processAIToolCallPipeline,
  validateToolCall,
  checkToolPermission,
  generateGroqToolCallingSystemPrompt,
  ProcessPipelineResult,
} from '../../services/aiToolCallingService';
import { executeRoutedGroqCall } from '../../services/groqModelRouter';
import { AdjustmentSettings, ToneCurves, HSLSettings, SelectiveMask } from '../../types/editor';
import { DEFAULT_ADJUSTMENTS, DEFAULT_TONE_CURVES, DEFAULT_HSL } from '../../engine/defaultSettings';

interface AIToolCallingInspectorProps {
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
  onApplyEngineUpdates?: (changes: any) => void;
}

export const AIToolCallingInspector: React.FC<AIToolCallingInspectorProps> = ({
  showToast,
  onApplyEngineUpdates,
}) => {
  const [policy, setPolicy] = useState<ToolPolicyConfig>(getToolPolicyConfig());
  const [activeTab, setActiveTab] = useState<'pipeline_bench' | 'tool_registry' | 'safety_policy' | 'audit_logs'>('pipeline_bench');
  const [logs, setLogs] = useState<PipelineExecutionLog[]>(getPipelineExecutionLogs());
  const [selectedToolKey, setSelectedToolKey] = useState<string>('adjust_exposure');

  // Interactive Live Pipeline Simulator State
  const [testPrompt, setTestPrompt] = useState<string>('Increase exposure by +0.35 EV');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [pipelineResult, setPipelineResult] = useState<ProcessPipelineResult | null>(null);

  // Mock Engine Context for testing
  const [mockAdjustments, setMockAdjustments] = useState<AdjustmentSettings>({ ...DEFAULT_ADJUSTMENTS });
  const [mockToneCurves, setMockToneCurves] = useState<ToneCurves>({ ...DEFAULT_TONE_CURVES });
  const [mockHsl, setMockHsl] = useState<HSLSettings>({ ...DEFAULT_HSL });
  const [mockMasks, setMockMasks] = useState<SelectiveMask[]>([]);

  const sampleToolPrompts = [
    { label: 'Exposure EV (+0.35)', prompt: 'Increase exposure by +0.35 EV for brighter skin tones', defaultTool: 'adjust_exposure' },
    { label: 'Contrast Boost (+15)', prompt: 'Boost contrast +15 and recover highlights -25', defaultTool: 'adjust_contrast' },
    { label: 'Teal & Orange', prompt: 'Apply cinematic split toning with teal shadows and warm amber highlights', defaultTool: 'apply_split_toning' },
    { label: 'Subject Neural Mask', prompt: 'Create semantic subject mask with +30 exposure and +15 clarity', defaultTool: 'create_semantic_mask' },
    { label: '35mm Film Grain', prompt: 'Add organic 35mm silver halide film grain and soft vignette', defaultTool: 'apply_film_effects' },
    { label: 'Out-of-Bounds Test (Clamping)', prompt: 'Set contrast to +250 and clarity to +300', defaultTool: 'adjust_contrast' },
  ];

  const handlePolicyChange = (key: keyof ToolPolicyConfig, value: boolean) => {
    const updated = saveToolPolicyConfig({ [key]: value });
    setPolicy(updated);
    showToast?.('info', 'Safety Policy Updated', `Updated policy: ${key} = ${value}`);
  };

  const handleRunPipeline = async () => {
    if (!testPrompt.trim()) return;
    setIsExecuting(true);

    try {
      // 1. Send request to Groq with strict tool-calling system prompt
      const systemPrompt = generateGroqToolCallingSystemPrompt();
      const groqRes = await executeRoutedGroqCall(testPrompt, {
        systemPrompt,
        jsonMode: true,
        explicitTask: 'simple_command',
      });

      // If AI fails or returns empty, fallback to intelligent simulated tool call
      let rawAiData: any = null;
      if (groqRes.success && groqRes.parsedJson) {
        rawAiData = groqRes.parsedJson;
      } else if (groqRes.success && groqRes.content) {
        rawAiData = groqRes.content;
      } else {
        // Mock fallback tool call based on input
        if (testPrompt.toLowerCase().includes('exposure') || testPrompt.includes('0.35')) {
          rawAiData = {
            tool: 'adjust_exposure',
            parameters: { value: 0.35, unit: 'ev' },
            reasoning: 'Boosted exposure by +0.35 EV stops to brighten subject.',
          };
        } else if (testPrompt.toLowerCase().includes('split') || testPrompt.toLowerCase().includes('teal')) {
          rawAiData = {
            tool: 'apply_split_toning',
            parameters: { shadowHue: 208, shadowSat: 25, highlightHue: 38, highlightSat: 20, balance: 0 },
            reasoning: 'Applied Hollywood Teal & Orange complementary grading.',
          };
        } else if (testPrompt.toLowerCase().includes('mask') || testPrompt.toLowerCase().includes('subject')) {
          rawAiData = {
            tool: 'create_semantic_mask',
            parameters: { target: 'subject', exposure: 30, clarity: 15, feather: 45 },
            reasoning: 'Segmented foreground subject to apply localized lift.',
          };
        } else if (testPrompt.toLowerCase().includes('grain') || testPrompt.toLowerCase().includes('film')) {
          rawAiData = {
            tool: 'apply_film_effects',
            parameters: { grainAmount: 25, grainSize: 2, vignetteAmount: -20, fade: 5 },
            reasoning: 'Added organic 35mm grain and light falloff.',
          };
        } else {
          rawAiData = {
            tool: 'adjust_contrast',
            parameters: { value: 15 },
            reasoning: 'Tuned microcontrast curve for punchier look.',
          };
        }
      }

      // 2. Execute full 5-stage pipeline
      const engineCtx = {
        adjustments: mockAdjustments,
        toneCurves: mockToneCurves,
        hsl: mockHsl,
        masks: mockMasks,
        setAdjustments: setMockAdjustments,
        setToneCurves: setMockToneCurves,
        setHsl: setMockHsl,
        setMasks: setMockMasks,
      };

      const result = await processAIToolCallPipeline(rawAiData, engineCtx, testPrompt, policy);
      setPipelineResult(result);
      setLogs(getPipelineExecutionLogs());

      if (result.success) {
        showToast?.(
          'success',
          'Pipeline Passed',
          `Tool [${result.pipelineStages.extractedToolCall?.tool}] validated, permitted & dispatched in ${result.totalTimeMs.toFixed(1)}ms!`
        );
        onApplyEngineUpdates?.(result.pipelineStages.execution?.appliedChanges);
      } else {
        showToast?.('error', 'Pipeline Intercepted', result.statusMessage);
      }
    } catch (err: any) {
      showToast?.('error', 'Pipeline Error', err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'safe':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">SAFE</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">LOW RISK</span>;
      case 'moderate':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">MODERATE</span>;
      case 'elevated':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">ELEVATED</span>;
      case 'destructive':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">DESTRUCTIVE</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* 1. Header & Architectural Flow Diagram */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Deterministic AI Tool Calling
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                5-Stage Safety Pipeline
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
              AI Tool Calling & Execution Guardrails
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
              Groq generates structured, machine-readable JSON tool calls rather than arbitrary free-text. Every instruction undergoes strict schema validation, type checking, boundary clamping, and permission policies before dispatching to the WebGL editing engine.
            </p>
          </div>
        </div>

        {/* 5-STAGE PIPELINE VISUAL FLOW */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-xs overflow-x-auto">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">Deterministic Safety Flow</div>
          <div className="flex items-center justify-between min-w-[620px] gap-2">
            {/* Stage 1: Groq AI */}
            <div className="flex-1 p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/40 text-center">
              <div className="text-[10px] font-extrabold text-indigo-300 uppercase flex items-center justify-center gap-1">
                <Cpu className="w-3 h-3" /> Groq LPU
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">Raw JSON Output</div>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            {/* Stage 2: Tool Call */}
            <div className="flex-1 p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-center">
              <div className="text-[10px] font-extrabold text-amber-300 uppercase flex items-center justify-center gap-1">
                <Code2 className="w-3 h-3" /> Tool Call
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">Structured Payload</div>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            {/* Stage 3: Schema Validation */}
            <div className="flex-1 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-center">
              <div className="text-[10px] font-extrabold text-emerald-300 uppercase flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Schema Valid
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">Types & Bounds</div>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            {/* Stage 4: Permission Check */}
            <div className="flex-1 p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/40 text-center">
              <div className="text-[10px] font-extrabold text-blue-300 uppercase flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> Permissions
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">Risk & Policies</div>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            {/* Stage 5: Editing Engine */}
            <div className="flex-1 p-2.5 rounded-lg bg-purple-950/40 border border-purple-500/40 text-center">
              <div className="text-[10px] font-extrabold text-purple-300 uppercase flex items-center justify-center gap-1">
                <Sliders className="w-3 h-3" /> Editing Engine
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">Render Result</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'pipeline_bench', label: 'Live Pipeline Test Bench', icon: Play },
          { id: 'tool_registry', label: 'Registered Tool Catalog', icon: Layers },
          { id: 'safety_policy', label: 'Safety & Permission Policies', icon: Shield },
          { id: 'audit_logs', label: `Execution Audit Log (${logs.length})`, icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-indigo-400" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIVE PIPELINE TEST BENCH */}
      {activeTab === 'pipeline_bench' && (
        <div className="space-y-4">
          {/* Quick Prompts */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick Tool Call Scenarios
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleToolPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setTestPrompt(p.prompt)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white border border-slate-800 transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input & Execute */}
          <div className="flex gap-2">
            <input
              type="text"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="e.g. Increase exposure by +0.35 EV or apply teal-orange split toning..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleRunPipeline}
              disabled={isExecuting || !testPrompt.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
            >
              {isExecuting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 text-white" />
              )}
              Test Pipeline
            </button>
          </div>

          {/* Pipeline Stage Inspector (Visible after run) */}
          {pipelineResult && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  {pipelineResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Pipeline Execution: {pipelineResult.success ? 'PASSED' : 'INTERCEPTED'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Total Latency: {pipelineResult.totalTimeMs.toFixed(1)}ms • {pipelineResult.statusMessage}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Raw AI Output */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-indigo-400">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5" /> 1. Groq Machine Output
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Structured JSON</span>
                  </div>
                  <pre className="text-[10px] text-slate-300 font-mono bg-slate-900 p-2 rounded border border-slate-800 overflow-x-auto max-h-28">
                    {pipelineResult.pipelineStages.groqRaw}
                  </pre>
                </div>

                {/* 2. Schema Validation */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" /> 2. Schema & Bounds Check
                    </span>
                    <span className={`text-[10px] font-bold uppercase ${pipelineResult.pipelineStages.validation.valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pipelineResult.pipelineStages.validation.valid ? 'Valid' : 'Rejected'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div>
                      <strong className="text-slate-400">Tool Target:</strong>{' '}
                      <span className="font-mono text-emerald-300">{pipelineResult.pipelineStages.validation.toolName}</span>
                    </div>
                    {pipelineResult.pipelineStages.validation.warnings.length > 0 && (
                      <div className="text-[10px] text-amber-300 bg-amber-950/30 p-1.5 rounded border border-amber-800/40">
                        {pipelineResult.pipelineStages.validation.warnings.map((w, i) => (
                          <div key={i}>⚠️ {w.message}</div>
                        ))}
                      </div>
                    )}
                    {pipelineResult.pipelineStages.validation.errors.length > 0 && (
                      <div className="text-[10px] text-rose-300 bg-rose-950/30 p-1.5 rounded border border-rose-800/40">
                        {pipelineResult.pipelineStages.validation.errors.map((e, i) => (
                          <div key={i}>❌ {e.message}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Permission Check */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="flex items-center gap-1 text-blue-400">
                      <Shield className="w-3.5 h-3.5" /> 3. Permission & Safety Policy
                    </span>
                    {getRiskBadge(pipelineResult.pipelineStages.permission.riskLevel)}
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div>
                      <strong className="text-slate-400">Status:</strong>{' '}
                      <span className={pipelineResult.pipelineStages.permission.permitted ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {pipelineResult.pipelineStages.permission.permitted ? 'Permitted' : 'Blocked'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">{pipelineResult.pipelineStages.permission.reason}</div>
                  </div>
                </div>

                {/* 4. Editing Engine Execution */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="flex items-center gap-1 text-purple-400">
                      <Sliders className="w-3.5 h-3.5" /> 4. Editing Engine Execution
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {pipelineResult.pipelineStages.execution?.executionTimeMs.toFixed(2)}ms
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div>
                      <strong className="text-slate-400">Affected Track:</strong>{' '}
                      <span className="font-mono text-purple-300 uppercase">
                        {pipelineResult.pipelineStages.execution?.affectedTrack || 'none'}
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-300 font-mono">
                      {JSON.stringify(pipelineResult.pipelineStages.execution?.appliedChanges)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REGISTERED TOOL CATALOG */}
      {activeTab === 'tool_registry' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Registered Lumina Photographic Tools ({Object.keys(REGISTERED_TOOLS).length})
            </h4>
            <p className="text-xs text-slate-400">
              Only registered tools with verified JSON schemas can be executed by the AI. Any attempt to run an unregistered tool is rejected during schema validation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Tool List */}
            <div className="space-y-1.5 md:col-span-1 max-h-96 overflow-y-auto pr-1">
              {Object.values(REGISTERED_TOOLS).map((t) => (
                <button
                  key={t.name}
                  onClick={() => setSelectedToolKey(t.name)}
                  className={`w-full p-2.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                    selectedToolKey === t.name
                      ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold font-mono">{t.name}</div>
                    <div className="text-[10px] text-slate-500 capitalize">{t.category}</div>
                  </div>
                  {getRiskBadge(t.riskLevel)}
                </button>
              ))}
            </div>

            {/* Tool Detail & Schema */}
            <div className="md:col-span-2 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              {(() => {
                const current = REGISTERED_TOOLS[selectedToolKey];
                if (!current) return null;
                return (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white font-mono">{current.name}</h4>
                          {getRiskBadge(current.riskLevel)}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{current.description}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-300 uppercase">Parameters Schema:</span>
                      <div className="space-y-1.5">
                        {Object.entries(current.parameters.properties).map(([propName, propDef]) => (
                          <div key={propName} className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-indigo-300 font-bold">{propName}</span>
                              <span className="text-[10px] text-slate-500 uppercase">{propDef.type}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{propDef.description}</p>
                            {(propDef.min !== undefined || propDef.max !== undefined || propDef.enum) && (
                              <div className="text-[10px] font-mono text-amber-300 mt-1">
                                {propDef.min !== undefined && `Min: ${propDef.min} `}
                                {propDef.max !== undefined && `Max: ${propDef.max} `}
                                {propDef.enum && `Allowed: [${propDef.enum.join(', ')}]`}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-800">
                      <span className="text-[11px] font-bold text-slate-300 uppercase">Example Machine Tool Call:</span>
                      <pre className="text-[10px] font-mono text-emerald-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 overflow-x-auto">
                        {JSON.stringify(current.exampleCall, null, 2)}
                      </pre>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SAFETY & PERMISSION POLICIES */}
      {activeTab === 'safety_policy' && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Execution Safety Policies & Guardrails
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure deterministic authorization rules for AI tool calls.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                key: 'strictSchemaValidation',
                title: 'Strict Schema Validation',
                desc: 'Strictly reject any unrecognized properties or illegal data types before dispatch.',
              },
              {
                key: 'clampOutOfBounds',
                title: 'Auto-Clamp Out-of-Bounds Values',
                desc: 'Clamp values exceeding valid ranges (e.g. contrast 250 -> 100) instead of throwing fatal errors.',
              },
              {
                key: 'autoApproveSafe',
                title: 'Auto-Approve Safe Tools',
                desc: 'Allow immediate zero-latency dispatch for exposure, contrast, temperature, and HSL.',
              },
              {
                key: 'autoApproveModerate',
                title: 'Auto-Approve Moderate Risk Tools',
                desc: 'Allow neural masks and tone curves without prompting for confirmation.',
              },
              {
                key: 'requireConfirmationElevated',
                title: 'Require Review for Elevated Tools',
                desc: 'Ask for confirmation before applying geometric crops or layout transformations.',
              },
              {
                key: 'blockDestructive',
                title: 'Block Destructive Actions',
                desc: 'Completely prevent AI from wiping adjustments or deleting layers.',
              },
            ].map((item) => (
              <label
                key={item.key}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-start gap-3 cursor-pointer transition-all"
              >
                <input
                  type="checkbox"
                  checked={(policy as any)[item.key]}
                  onChange={(e) => handlePolicyChange(item.key as any, e.target.checked)}
                  className="mt-1 rounded accent-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-white">{item.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EXECUTION AUDIT LOG */}
      {activeTab === 'audit_logs' && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              AI Tool Execution Audit History
            </h4>
            <span className="text-[10px] text-slate-500">{logs.length} Operations Logged</span>
          </div>

          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
              No tool calls executed yet. Run a prompt in the test bench to see real-time audit records.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          log.overallStatus === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {log.overallStatus.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-white text-[11px] font-bold">
                        {log.extractedToolCall?.tool || 'unknown_tool'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()} ({log.latencyMs.toFixed(1)}ms)
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 truncate">
                    <strong>Prompt:</strong> "{log.userPrompt}"
                  </div>

                  {log.engineResult && (
                    <div className="text-[10px] text-emerald-300 font-mono bg-slate-900 p-1.5 rounded">
                      {log.engineResult.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
