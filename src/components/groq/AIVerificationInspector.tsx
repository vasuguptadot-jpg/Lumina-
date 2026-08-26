import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Play,
  Layers,
  Eye,
  Sliders,
  Sparkles,
  Lock,
  ArrowRight,
  ArrowDown,
  FileText,
  Activity,
  Check,
  X,
  Wrench,
  Flame,
  ChevronDown,
  ChevronRight,
  Cpu,
} from 'lucide-react';
import {
  AIVerificationReport,
  VerificationCheckResult,
  AutoRepairPlan,
} from '../../types/aiVerification';
import {
  runFullAIVerification,
  executeAutoRepairAndReverify,
} from '../../services/aiVerificationService';
import { Project } from '../../types/editor';
import { DEFAULT_ADJUSTMENTS, DEFAULT_TONE_CURVES, DEFAULT_HSL } from '../../engine/defaultSettings';

interface AIVerificationInspectorProps {
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
  project?: Project;
}

export const AIVerificationInspector: React.FC<AIVerificationInspectorProps> = ({
  showToast,
  project,
}) => {
  const defaultMockProject: Project = project || {
    id: 'mock_project',
    name: 'Luxury Hotel Portrait',
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

  const [prompt, setPrompt] = useState(
    'Make me look like I’m standing in a luxury hotel at night, but keep my face exactly the same.'
  );
  const [simulatedFailure, setSimulatedFailure] = useState<
    'NONE' | 'FACE_DRIFT' | 'EDGE_HALO' | 'LIGHTING_MISMATCH' | 'OBJECT_RESIDUAL' | 'PROTECTED_VIOLATION'
  >('NONE');

  const [report, setReport] = useState<AIVerificationReport>(() =>
    runFullAIVerification(
      'Make me look like I’m standing in a luxury hotel at night, but keep my face exactly the same.',
      defaultMockProject,
      defaultMockProject,
      'NONE'
    )
  );

  const [isVerifying, setIsVerifying] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairStepProgress, setRepairStepProgress] = useState<number | null>(null);
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>('chk_face_identity');
  const [viewTab, setViewTab] = useState<'audits' | 'closed_loop' | 'timeline' | 'json'>('audits');

  const handleRunAudit = async (failType = simulatedFailure) => {
    setIsVerifying(true);
    showToast?.('info', 'Running AI Verification', 'Auditing 9 critical safety, identity, and artifact vectors...');

    await new Promise((r) => setTimeout(r, 450));
    const newReport = runFullAIVerification(prompt, defaultMockProject, defaultMockProject, failType);
    setReport(newReport);
    setIsVerifying(false);

    if (newReport.overallStatus === 'failed') {
      showToast?.(
        'error',
        'Verification Detected Issues',
        `${newReport.issuesDetected.length} issue(s) detected. Auto-repair plan ready for closed-loop execution.`
      );
      setExpandedCheckId(newReport.issuesDetected[0]?.checkType ? `chk_${newReport.issuesDetected[0].checkType.toLowerCase()}` : 'chk_face_identity');
    } else {
      showToast?.('success', 'Verification Passed', 'All 9 deep audits verified with 100% compliance!');
    }
  };

  const handleTriggerAutoRepair = async () => {
    if (!report.repairPlan || isRepairing) return;
    setIsRepairing(true);
    showToast?.('info', 'Executing Closed-Loop Repair', 'Groq auto-repair engine executing remedial stages...');

    try {
      const repairedReport = await executeAutoRepairAndReverify(report, (stepIdx) => {
        setRepairStepProgress(stepIdx);
      });
      setReport(repairedReport);
      setSimulatedFailure('NONE');
      showToast?.(
        'success',
        'Auto-Repair & Re-Verification Passed',
        'Closed-loop cycle completed: All anomalies resolved and certified for production!'
      );
    } catch (err: any) {
      showToast?.('error', 'Repair Error', err.message || 'Auto-repair failed');
    } finally {
      setIsRepairing(false);
      setRepairStepProgress(null);
    }
  };

  const failurePresets = [
    {
      id: 'NONE',
      label: 'Pristine Pass (All 9 Clean)',
      badge: '100% COMPLIANT',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30',
    },
    {
      id: 'FACE_DRIFT',
      label: 'Simulate Face Drift (Unconstrained Diffusion)',
      badge: 'CRITICAL AUDIT',
      color: 'border-rose-500/40 text-rose-400 bg-rose-950/30',
    },
    {
      id: 'EDGE_HALO',
      label: 'Simulate Edge Halo / Cutout Artifact',
      badge: 'FRINGE DETECTED',
      color: 'border-amber-500/40 text-amber-400 bg-amber-950/30',
    },
    {
      id: 'LIGHTING_MISMATCH',
      label: 'Simulate Lighting & Color Mismatch',
      badge: 'PHOTOMETRIC ERROR',
      color: 'border-blue-500/40 text-blue-400 bg-blue-950/30',
    },
    {
      id: 'OBJECT_RESIDUAL',
      label: 'Simulate Inpainting Ghosting Residual',
      badge: 'OBJECT RESIDUAL',
      color: 'border-purple-500/40 text-purple-400 bg-purple-950/30',
    },
    {
      id: 'PROTECTED_VIOLATION',
      label: 'Simulate Protected Polygon Bleed',
      badge: 'MASK VIOLATION',
      color: 'border-red-500/40 text-red-400 bg-red-950/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner explaining why AI Verification is essential */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border border-emerald-500/30 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Autonomous AI Verification & Auto-Repair
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-indigo-400" />
                Closed-Loop Verification Cycle
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                9-Vector Safety Audit
              </span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              AI Verification & Closed-Loop Auto-Repair Engine
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Every major AI edit undergoes an autonomous 9-vector audit (object removal, subject preservation, face identity, visual artifacts, edge halos, lighting consistency, shadows, protected masks, and resolution). If any check fails, Groq formulates an auto-repair plan, re-edits, and verifies again.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleRunAudit()}
              disabled={isVerifying || isRepairing}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
              Re-Run Full 9-Vector Audit
            </button>
          </div>
        </div>
      </div>

      {/* Closed-Loop Pipeline Flowchart Card */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Closed-Loop AI Verification Pipeline
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
              report.overallStatus === 'passed' || report.overallStatus === 'repaired'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}>
              Status: {report.overallStatus.toUpperCase()} ({report.overallScore}%)
            </span>
          </div>
        </div>

        {/* The Closed-Loop Flow Diagram */}
        <div className="py-2 grid grid-cols-2 md:grid-cols-7 gap-2 items-center text-center">
          {/* Step 1: AI PLAN */}
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Step 1</span>
            <div className="text-xs font-bold text-indigo-300 flex items-center justify-center gap-1">
              <FileText className="w-3 h-3 text-indigo-400" />
              AI PLAN
            </div>
            <p className="text-[9px] text-slate-400">Groq Reasoning</p>
          </div>

          <ArrowRight className="hidden md:block w-3.5 h-3.5 text-slate-600 mx-auto" />

          {/* Step 2: EXECUTE */}
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Step 2</span>
            <div className="text-xs font-bold text-blue-300 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-blue-400" />
              EXECUTE
            </div>
            <p className="text-[9px] text-slate-400">Parallel Workers</p>
          </div>

          <ArrowRight className="hidden md:block w-3.5 h-3.5 text-slate-600 mx-auto" />

          {/* Step 3: RESULT */}
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Step 3</span>
            <div className="text-xs font-bold text-purple-300 flex items-center justify-center gap-1">
              <Layers className="w-3 h-3 text-purple-400" />
              RESULT
            </div>
            <p className="text-[9px] text-slate-400">WebGL Composite</p>
          </div>

          <ArrowRight className="hidden md:block w-3.5 h-3.5 text-slate-600 mx-auto" />

          {/* Step 4: VERIFY */}
          <div className={`p-2.5 rounded-lg border space-y-0.5 ${
            report.overallStatus === 'failed'
              ? 'bg-rose-950/50 border-rose-500 shadow-md ring-1 ring-rose-400'
              : 'bg-emerald-950/40 border-emerald-500/60 shadow-md ring-1 ring-emerald-400'
          }`}>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Step 4</span>
            <div className={`text-xs font-bold flex items-center justify-center gap-1 ${
              report.overallStatus === 'failed' ? 'text-rose-300' : 'text-emerald-300'
            }`}>
              <ShieldCheck className="w-3 h-3" />
              VERIFY (9 Audits)
            </div>
            <p className="text-[9px] text-slate-300">
              {report.overallStatus === 'failed' ? 'Failed ➔ Repair' : '100% Passed'}
            </p>
          </div>
        </div>

        {/* If Verification Fails: Closed-Loop Repair Plan Callout */}
        {report.overallStatus === 'failed' && report.repairPlan && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/60 border border-rose-500/40 space-y-3 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    Verification Failed: {report.issuesDetected.length} Issue(s) Detected
                  </span>
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-amber-400" />
                    Groq Auto-Repair Plan Generated
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.repairPlan.explanation}
                </p>
              </div>

              <button
                onClick={handleTriggerAutoRepair}
                disabled={isRepairing}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-950/60 transition-all active:scale-95 shrink-0"
              >
                <Wrench className={`w-4 h-4 ${isRepairing ? 'animate-spin' : ''}`} />
                {isRepairing ? 'Executing Auto-Repair...' : 'Execute Repair Plan & Re-Verify'}
              </button>
            </div>

            {/* Repair Plan Steps */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Automated Remedial Actions:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {report.repairPlan.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                      repairStepProgress === idx
                        ? 'bg-amber-950/60 border-amber-400 shadow-md ring-1 ring-amber-400'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">
                          {step.stepNumber}
                        </span>
                        {step.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                    {step.deltaAfterRepair && (
                      <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Target: {step.deltaAfterRepair}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* If Repaired: Certification Badge */}
        {report.overallStatus === 'repaired' && (
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Closed-Loop Certification: Auto-Repair Plan executed & all 9 audits re-verified with 100% compliance!</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono">
              QA Certified
            </span>
          </div>
        )}
      </div>

      {/* Failure Simulation & Test Workbench */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Simulate Defect / Test Closed-Loop Verification
          </label>
          <span className="text-[10px] text-slate-400">
            Select a failure condition to test automated detection and Groq auto-repair
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {failurePresets.map((preset) => {
            const isSelected = simulatedFailure === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setSimulatedFailure(preset.id as any);
                  handleRunAudit(preset.id as any);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? `${preset.color} ring-1 ring-amber-400 shadow-md`
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-[9px] font-bold uppercase tracking-wider mb-1">
                  {preset.badge}
                </div>
                <div className="text-xs font-bold text-white leading-tight">
                  {preset.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* View Switcher & 9 Deep Verification Audits */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              The 9 Mandatory AI Verification Audits
            </h3>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewTab('audits')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewTab === 'audits'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Audits Scorecards
            </button>
            <button
              onClick={() => setViewTab('timeline')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewTab === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pipeline Timeline
            </button>
            <button
              onClick={() => setViewTab('json')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewTab === 'json'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Audit Schema
            </button>
          </div>
        </div>

        {/* TAB 1: 9 AUDIT SCORECARDS */}
        {viewTab === 'audits' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {report.checks.map((chk, idx) => {
              const isExpanded = expandedCheckId === chk.id;
              const isPassed = chk.status === 'passed';

              return (
                <div
                  key={chk.id}
                  className={`rounded-xl border transition-all space-y-2.5 p-3.5 ${
                    isPassed
                      ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      : 'bg-rose-950/40 border-rose-500 shadow-md ring-1 ring-rose-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white truncate">
                        {chk.title}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider shrink-0 ${
                      isPassed
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      {chk.status.toUpperCase()} ({chk.score}%)
                    </span>
                  </div>

                  <div className="text-[11px] font-medium text-amber-200/90 italic">
                    "{chk.question}"
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed">
                    {chk.summary}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Measured: {chk.measuredMetric}</span>
                    <button
                      onClick={() => setExpandedCheckId(isExpanded ? null : chk.id)}
                      className="p-1 text-slate-400 hover:text-white rounded"
                    >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Expanded Diagnostics */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-800 space-y-1 text-[10px] text-slate-400 bg-slate-950/60 p-2 rounded-lg">
                      <div className="font-bold text-slate-300 uppercase tracking-wider">
                        Diagnostic Telemetry:
                      </div>
                      {chk.diagnostics.map((diag, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-slate-300">
                          <span className="w-1 h-1 rounded-full bg-emerald-400" />
                          <span>{diag}</span>
                        </div>
                      ))}
                      {chk.remedyActionSuggested && (
                        <div className="mt-1.5 p-1.5 rounded bg-rose-950/40 border border-rose-500/40 text-rose-300 font-sans">
                          <strong>Remedy:</strong> {chk.remedyActionSuggested}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: PIPELINE TIMELINE */}
        {viewTab === 'timeline' && (
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Execution & Verification History Timeline
            </div>
            <div className="space-y-2">
              {report.historyTimeline.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                >
                  <div className={`p-1.5 rounded-full mt-0.5 ${
                    item.status === 'success'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : item.status === 'failure'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {item.status === 'success' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : item.status === 'failure' ? (
                      <X className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        {item.stage.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MACHINE-READABLE SCHEMA */}
        {viewTab === 'json' && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Machine-Readable Verification Report Payload</span>
              <span>Engine: {report.verifierEngine}</span>
            </div>
            <pre className="p-3 rounded-lg bg-slate-900/90 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-96 scrollbar-thin">
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
