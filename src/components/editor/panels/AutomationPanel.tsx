import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  Layers,
  Sparkles,
  Sliders,
  Focus,
  Film,
  Stamp,
  Maximize2,
  Download,
  Settings,
  CheckCircle2,
  Clock,
  Brain,
  UploadCloud,
  ChevronRight,
  ExternalLink,
  Save,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { Project, FilterPreset } from '../../../types/editor';
import {
  AutomationWorkflow,
  AutomationExecutionResult,
  AutomationStepReport,
} from '../../../types/automation';
import {
  BUILTIN_AUTOMATIONS,
  executeAutomationWorkflow,
} from '../../../engine/automationEngine';
import { getAllAutomationsFromDB } from '../../../storage/db';

interface AutomationPanelProps {
  project: Project;
  customPresets?: FilterPreset[];
  onOpenAutomationStudio: () => void;
  onApplyResultToProject?: (canvas: HTMLCanvasElement, name: string) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const AutomationPanel: React.FC<AutomationPanelProps> = ({
  project,
  customPresets = [],
  onOpenAutomationStudio,
  onApplyResultToProject,
  showToast,
}) => {
  const [automations, setAutomations] = useState<AutomationWorkflow[]>(BUILTIN_AUTOMATIONS);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(BUILTIN_AUTOMATIONS[0].id);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<AutomationExecutionResult | null>(null);
  const [activeReports, setActiveReports] = useState<AutomationStepReport[]>([]);

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    try {
      const custom = await getAllAutomationsFromDB();
      setAutomations([...BUILTIN_AUTOMATIONS, ...custom]);
    } catch (e) {
      console.error(e);
    }
  };

  const currentWorkflow = automations.find((a) => a.id === selectedWorkflowId) || BUILTIN_AUTOMATIONS[0];

  const handleRunOnActiveCanvas = async () => {
    if (!project?.image?.url) {
      showToast('error', 'No Image Loaded', 'Open an image first to run the automation pipeline.');
      return;
    }

    setIsExecuting(true);
    setActiveReports([]);
    setLastResult(null);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = rej;
        img.src = project.image.url;
      });

      const c = document.createElement('canvas');
      c.width = img.naturalWidth || 1600;
      c.height = img.naturalHeight || 1067;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const result = await executeAutomationWorkflow(
        currentWorkflow,
        c,
        customPresets,
        (report) => {
          setActiveReports((prev) => {
            const filtered = prev.filter((r) => r.stepIndex !== report.stepIndex);
            return [...filtered, report].sort((a, b) => a.stepIndex - b.stepIndex);
          });
        }
      );

      setLastResult(result);
      if (onApplyResultToProject) {
        onApplyResultToProject(result.finalCanvas, currentWorkflow.name);
      }

      showToast(
        'success',
        'Automation Completed!',
        `Executed 8 stages in ${result.totalLatencyMs}ms. Image updated in canvas.`
      );
    } catch (err: any) {
      showToast('error', 'Automation Error', err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const stepsList = [
    { title: '1. Import & Ingest', icon: UploadCloud, enabled: true },
    { title: '2. AI Scene & Vision Analysis', icon: Brain, enabled: currentWorkflow.steps.aiAnalysisStep.enabled },
    { title: '3. Color Correction & Auto Tone', icon: Sliders, enabled: currentWorkflow.steps.colorCorrectionStep.enabled },
    { title: '4. Noise Reduction & Detail', icon: Focus, enabled: currentWorkflow.steps.noiseReductionStep.enabled },
    { title: '5. Visual Preset & Grade', icon: Film, enabled: currentWorkflow.steps.presetStep.enabled },
    { title: '6. Watermark Protection', icon: Stamp, enabled: currentWorkflow.steps.watermarkStep.enabled },
    { title: '7. Resize & Scaling', icon: Maximize2, enabled: currentWorkflow.steps.resizeStep.enabled },
    { title: '8. Master Export', icon: Download, enabled: currentWorkflow.steps.exportStep.enabled },
  ];

  return (
    <div className="p-4 space-y-4 text-slate-100 select-none">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20 border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black uppercase text-white tracking-wider">
              Workflow Engine
            </span>
          </div>
          <button
            onClick={onOpenAutomationStudio}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 px-2 py-0.5 rounded-lg transition-all"
          >
            <span>Open Studio</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Execute the complete 8-stage automated editing pipeline in a single click:
          <strong className="text-amber-300 block pt-0.5">
            Import → AI analysis → Color correction → Noise reduction → Preset → Watermark → Resize → Export
          </strong>
        </p>
      </div>

      {/* Workflow Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-300">Choose Active Automation</label>
        <select
          value={selectedWorkflowId}
          onChange={(e) => setSelectedWorkflowId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-indigo-500 cursor-pointer"
        >
          {automations.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.category})
            </option>
          ))}
        </select>
        <p className="text-[10px] text-slate-400 leading-normal">{currentWorkflow.description}</p>
      </div>

      {/* 8-Stage Execution Roadmap */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-2">
        <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
          <span>8-Stage Pipeline Stages:</span>
          {lastResult && (
            <span className="text-emerald-400 font-mono text-[10px] font-bold">
              ⚡ {lastResult.totalLatencyMs}ms Total
            </span>
          )}
        </div>

        <div className="space-y-1">
          {stepsList.map((step, idx) => {
            const Icon = step.icon;
            const report = activeReports.find((r) => r.stepIndex === idx);
            const isDone = report?.status === 'completed';
            const isRunning = isExecuting && report?.status === 'running';

            return (
              <div
                key={step.title}
                className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors ${
                  step.enabled ? 'bg-slate-900/60 text-slate-200' : 'bg-slate-900/20 text-slate-500 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isRunning
                        ? 'bg-amber-500/20 text-amber-300 animate-spin'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isRunning ? (
                      <RefreshCw className="w-3 h-3" />
                    ) : isDone ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                  </div>
                  <span className="text-[11px] font-medium truncate">{step.title}</span>
                </div>

                <div className="text-[10px] shrink-0 font-mono">
                  {report?.latencyMs !== undefined ? (
                    <span className="text-emerald-400">{report.latencyMs}ms</span>
                  ) : step.enabled ? (
                    <span className="text-slate-500">Ready</span>
                  ) : (
                    <span className="text-slate-600">Bypassed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Diagnostic Output if run */}
      {lastResult?.aiDiagnostics && (
        <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-3 space-y-1.5 text-xs">
          <div className="font-bold text-purple-300 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" />
            AI Diagnostic Insights
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
            <div>Scene: <span className="text-white font-semibold">{lastResult.aiDiagnostics.sceneClassification}</span></div>
            <div>Noise: <span className="text-white font-semibold">{lastResult.aiDiagnostics.estimatedNoiseLevel}</span></div>
            <div>DR Score: <span className="text-white font-semibold">{lastResult.aiDiagnostics.dynamicRangeScore}%</span></div>
            <div>EV Offset: <span className="text-white font-semibold">{lastResult.aiDiagnostics.recommendedEVOffset}</span></div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleRunOnActiveCanvas}
        disabled={isExecuting}
        className="w-full py-3 bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 active:scale-98"
      >
        {isExecuting ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Running Pipeline Stages...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-white" />
            <span>Run 8-Stage Automation</span>
          </>
        )}
      </button>
    </div>
  );
};
