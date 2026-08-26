import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Layers,
  Brain,
  Sliders,
  Focus,
  Film,
  Stamp,
  Maximize2,
  Download,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  ChevronRight,
  Eye,
  Copy,
  Save,
  Trash2,
  Plus,
  X,
  UploadCloud,
  Palette,
  Compass,
  Zap,
  FolderOpen,
  ArrowRight,
  SplitSquareVertical,
  Check,
  Package,
  FileArchive,
  RefreshCw,
  Sun,
  Moon,
  Camera,
  Share2,
} from 'lucide-react';
import {
  AutomationWorkflow,
  AutomationStepType,
  AutomationStepReport,
  AutomationExecutionResult,
  AIDiagnosticReport,
} from '../../types/automation';
import { Project, FilterPreset } from '../../types/editor';
import {
  BUILTIN_AUTOMATIONS,
  executeAutomationWorkflow,
  exportWorkflowToJson,
  importWorkflowFromJson,
} from '../../engine/automationEngine';
import {
  saveAutomationToDB,
  getAllAutomationsFromDB,
  deleteAutomationFromDB,
} from '../../storage/db';
import { FILTER_CATEGORIES, FILTER_PRESETS, getPresetById } from '../../engine/presets';
import { triggerDownload } from '../../engine/exportEngine';
import { createBatchZipArchive } from '../../engine/batchEngine';
import { parseImageOrRawFile } from '../../engine/rawParser';

interface AutomationStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  customPresets?: FilterPreset[];
  onApplyToCanvas?: (canvas: HTMLCanvasElement, workflowName: string) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

// Sample demo photos for instant workflow testing
const DEMO_WORKFLOW_PHOTOS = [
  { name: 'Alpine_Landscape.jpg', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80', label: 'Landscape & Mountain' },
  { name: 'Studio_Fashion_Portrait.jpg', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1600&auto=format&fit=crop&q=80', label: 'Studio Portrait' },
  { name: 'Tokyo_Night_Street.jpg', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1600&auto=format&fit=crop&q=80', label: 'Urban Night Glow' },
  { name: 'Coffee_Artisan_Product.jpg', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&auto=format&fit=crop&q=80', label: 'E-Commerce Product' },
];

export const AutomationStudioModal: React.FC<AutomationStudioModalProps> = ({
  isOpen,
  onClose,
  project,
  customPresets = [],
  onApplyToCanvas,
  showToast,
}) => {
  // Saved and Built-in Workflows
  const [customWorkflows, setCustomWorkflows] = useState<AutomationWorkflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<AutomationWorkflow>(BUILTIN_AUTOMATIONS[0]);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [presetCategory, setPresetCategory] = useState<string>('All');

  // Execution State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<AutomationExecutionResult | null>(null);
  const [activeStepReports, setActiveStepReports] = useState<AutomationStepReport[]>([]);
  const [selectedPreviewStep, setSelectedPreviewStep] = useState<number>(-1); // -1 is final output

  // Comparison mode
  const [viewMode, setViewMode] = useState<'single' | 'split' | 'side-by-side'>('single');
  const [splitPosition, setSplitPosition] = useState<number>(50);

  // Active Source Image Canvas
  const [sourceImage, setSourceImage] = useState<{ url: string; name: string } | null>(null);
  const [sourceCanvas, setSourceCanvas] = useState<HTMLCanvasElement | null>(null);

  // Batch Queue
  const [batchFiles, setBatchFiles] = useState<Array<{ file: File; url: string; status: string; progress: number; resultBlobUrl?: string; filename?: string }>>([]);
  const [activeTab, setActiveTab] = useState<'workflow' | 'batch'>('workflow');

  // Save Modal
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');
  const [saveCategory, setSaveCategory] = useState<AutomationWorkflow['category']>('Commercial');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);

  // Load custom workflows from IndexedDB
  useEffect(() => {
    if (isOpen) {
      loadCustomWorkflows();
      initSourceImage();
    }
  }, [isOpen, project]);

  const loadCustomWorkflows = async () => {
    try {
      const list = await getAllAutomationsFromDB();
      setCustomWorkflows(list);
    } catch (err) {
      console.error('Failed to load automations:', err);
    }
  };

  const allWorkflows = useMemo(() => {
    return [...BUILTIN_AUTOMATIONS, ...customWorkflows];
  }, [customWorkflows]);

  // Initialize source image from current project or default demo photo
  const initSourceImage = () => {
    if (project?.image?.url) {
      setSourceImage({ url: project.image.url, name: project.name || 'Current Project Image' });
      loadUrlToCanvas(project.image.url);
    } else {
      const def = DEMO_WORKFLOW_PHOTOS[0];
      setSourceImage({ url: def.url, name: def.name });
      loadUrlToCanvas(def.url);
    }
  };

  const loadUrlToCanvas = (url: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || 1600;
      c.height = img.naturalHeight || 1067;
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      setSourceCanvas(c);
      setExecutionResult(null);
      setActiveStepReports([]);
      setSelectedPreviewStep(-1);
    };
    img.src = url;
  };

  // Run the full 8-step pipeline
  const handleRunAutomation = async () => {
    if (!sourceCanvas) {
      showToast('error', 'No Source Image', 'Please import or select a source image to run the automation.');
      return;
    }

    setIsExecuting(true);
    setActiveStepReports([]);
    setSelectedPreviewStep(-1);

    try {
      const result = await executeAutomationWorkflow(
        activeWorkflow,
        sourceCanvas,
        customPresets,
        (report) => {
          setActiveStepReports((prev) => {
            const filtered = prev.filter((r) => r.stepIndex !== report.stepIndex);
            return [...filtered, report].sort((a, b) => a.stepIndex - b.stepIndex);
          });
        }
      );

      setExecutionResult(result);
      showToast(
        'success',
        'Automation Completed!',
        `Executed 8 stages in ${result.totalLatencyMs}ms. Ready to export or send to canvas.`
      );
    } catch (err: any) {
      showToast('error', 'Automation Failed', err.message || 'Error occurred during workflow execution');
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle Save As Automation
  const handleSaveAutomation = async () => {
    if (!saveName.trim()) {
      showToast('error', 'Name Required', 'Please enter a name for this automation.');
      return;
    }

    const newWorkflow: AutomationWorkflow = {
      ...activeWorkflow,
      id: `custom_automation_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: saveName.trim(),
      description: saveDesc.trim() || 'Custom user saved 8-stage automation workflow.',
      category: saveCategory,
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      author: 'You',
    };

    await saveAutomationToDB(newWorkflow);
    await loadCustomWorkflows();
    setActiveWorkflow(newWorkflow);
    setIsSaveModalOpen(false);
    showToast('success', 'Automation Saved!', `"${newWorkflow.name}" is now stored in your automation library.`);
  };

  // Handle Delete Custom Automation
  const handleDeleteAutomation = async (id: string, name: string) => {
    if (confirm(`Delete automation "${name}"?`)) {
      await deleteAutomationFromDB(id);
      await loadCustomWorkflows();
      setActiveWorkflow(BUILTIN_AUTOMATIONS[0]);
      showToast('info', 'Automation Removed', `Deleted "${name}" from your library.`);
    }
  };

  // Handle Export Workflow JSON
  const handleExportJson = () => {
    const jsonStr = exportWorkflowToJson(activeWorkflow);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `${activeWorkflow.name.toLowerCase().replace(/\s+/g, '_')}.lumina-workflow.json`);
    showToast('success', 'Workflow Exported', 'Downloaded workflow recipe package.');
  };

  // Handle Import Workflow JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const jsonStr = evt.target?.result as string;
        const parsed = importWorkflowFromJson(jsonStr);
        await saveAutomationToDB(parsed);
        await loadCustomWorkflows();
        setActiveWorkflow(parsed);
        showToast('success', 'Workflow Imported', `Imported and activated "${parsed.name}".`);
      } catch (err: any) {
        showToast('error', 'Import Failed', err.message || 'Invalid JSON format');
      }
    };
    reader.readAsText(file);
  };

  // Handle Single Image Upload
  const handleSingleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseImageOrRawFile(file);
      setSourceImage({ url: parsed.previewUrl, name: file.name });
      loadUrlToCanvas(parsed.previewUrl);
      showToast('success', 'Photo Loaded', `Imported "${file.name}" for workflow execution.`);
    } catch (err: any) {
      showToast('error', 'Failed to Load Photo', err.message);
    }
  };

  // Handle Batch Files Upload
  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files: File[] = Array.from(e.target.files);

    const items = [];
    for (const f of files) {
      try {
        const parsed = await parseImageOrRawFile(f);
        items.push({
          file: f,
          url: parsed.previewUrl,
          status: 'idle',
          progress: 0,
        });
      } catch (err) {
        console.error(err);
      }
    }
    setBatchFiles((prev) => [...prev, ...items]);
    showToast('success', 'Batch Photos Added', `Loaded ${items.length} photos ready for automation.`);
  };

  // Run Automation over entire Batch Queue
  const handleRunBatchAutomation = async () => {
    if (batchFiles.length === 0) {
      showToast('info', 'Batch Queue Empty', 'Please add photos to the batch queue first.');
      return;
    }

    setIsExecuting(true);
    for (let i = 0; i < batchFiles.length; i++) {
      setBatchFiles((prev) =>
        prev.map((b, idx) => (idx === i ? { ...b, status: 'running', progress: 15 } : b))
      );

      try {
        const item = batchFiles[i];
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = rej;
          img.src = item.url;
        });

        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        setBatchFiles((prev) =>
          prev.map((b, idx) => (idx === i ? { ...b, progress: 50 } : b))
        );

        const res = await executeAutomationWorkflow(activeWorkflow, c, customPresets);

        setBatchFiles((prev) =>
          prev.map((b, idx) =>
            idx === i
              ? {
                  ...b,
                  status: 'completed',
                  progress: 100,
                  resultBlobUrl: res.finalBlobUrl,
                  filename: res.finalFilename,
                }
              : b
          )
        );
      } catch (err) {
        setBatchFiles((prev) =>
          prev.map((b, idx) => (idx === i ? { ...b, status: 'error', progress: 0 } : b))
        );
      }
    }

    setIsExecuting(false);
    showToast('success', 'Batch Automation Finished', `Processed ${batchFiles.length} photos.`);
  };

  // Download all batch results as ZIP
  const handleDownloadBatchZip = async () => {
    const completed = batchFiles.filter((b) => b.status === 'completed' && b.resultBlobUrl);
    if (completed.length === 0) return;

    showToast('info', 'Creating ZIP Archive', 'Packaging automated exports into ZIP...');
    const zipItems = [];
    for (const item of completed) {
      const response = await fetch(item.resultBlobUrl!);
      const blob = await response.blob();
      zipItems.push({ blob, filename: item.filename || `${item.file.name}_automated.jpg` });
    }

    const zipBlob = await createBatchZipArchive(zipItems);
    const zipUrl = URL.createObjectURL(zipBlob);
    triggerDownload(zipUrl, `Lumina_Automated_Batch_${Date.now()}.zip`);
    showToast('success', 'ZIP Downloaded', 'Batch automation package ready.');
  };

  // Determine which preview URL to display
  const currentDisplayPreview = useMemo(() => {
    if (selectedPreviewStep >= 0 && activeStepReports[selectedPreviewStep]?.previewUrl) {
      return activeStepReports[selectedPreviewStep].previewUrl;
    }
    if (executionResult?.finalBlobUrl) {
      return executionResult.finalBlobUrl;
    }
    return sourceImage?.url || '';
  }, [selectedPreviewStep, activeStepReports, executionResult, sourceImage]);

  if (!isOpen) return null;

  // The 8 Pipeline Stages
  const PIPELINE_STEPS: Array<{
    id: AutomationStepType;
    index: number;
    title: string;
    shortTitle: string;
    icon: any;
    isEnabled: boolean;
  }> = [
    {
      id: 'import',
      index: 0,
      title: '1. Import & Ingest',
      shortTitle: 'Import',
      icon: UploadCloud,
      isEnabled: true,
    },
    {
      id: 'ai_analysis',
      index: 1,
      title: '2. AI Vision Analysis',
      shortTitle: 'AI Analysis',
      icon: Brain,
      isEnabled: activeWorkflow.steps.aiAnalysisStep.enabled,
    },
    {
      id: 'color_correction',
      index: 2,
      title: '3. Color Correction',
      shortTitle: 'Color Balance',
      icon: Sliders,
      isEnabled: activeWorkflow.steps.colorCorrectionStep.enabled,
    },
    {
      id: 'noise_reduction',
      index: 3,
      title: '4. Noise Reduction',
      shortTitle: 'NR & Detail',
      icon: Focus,
      isEnabled: activeWorkflow.steps.noiseReductionStep.enabled,
    },
    {
      id: 'preset',
      index: 4,
      title: '5. Visual Preset',
      shortTitle: 'Preset Grade',
      icon: Film,
      isEnabled: activeWorkflow.steps.presetStep.enabled,
    },
    {
      id: 'watermark',
      index: 5,
      title: '6. Watermark Protection',
      shortTitle: 'Watermark',
      icon: Stamp,
      isEnabled: activeWorkflow.steps.watermarkStep.enabled,
    },
    {
      id: 'resize',
      index: 6,
      title: '7. Resize & Scaling',
      shortTitle: 'Resize',
      icon: Maximize2,
      isEnabled: activeWorkflow.steps.resizeStep.enabled,
    },
    {
      id: 'export',
      index: 7,
      title: '8. Master Export',
      shortTitle: 'Export',
      icon: Download,
      isEnabled: activeWorkflow.steps.exportStep.enabled,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col select-none animate-fadeIn overflow-hidden text-slate-100">
      {/* 1. TOP HEADER & WORKFLOW SELECTOR */}
      <div className="h-16 px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-xl">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 p-[1.5px] shadow-lg shadow-purple-600/30">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-tight">Automation Engine</h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/30">
                  8-Stage Pipeline
                </span>
              </div>
              <p className="text-xs text-slate-400">Import → AI analysis → Color correction → Noise reduction → Preset → Watermark → Resize → Export</p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-800 hidden md:block" />

          {/* Active Workflow Selector */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 max-w-sm">
            <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
            <select
              value={activeWorkflow.id}
              onChange={(e) => {
                const found = allWorkflows.find((w) => w.id === e.target.value);
                if (found) {
                  setActiveWorkflow(found);
                  setExecutionResult(null);
                  setActiveStepReports([]);
                }
              }}
              className="bg-transparent text-xs font-bold text-slate-200 outline-none cursor-pointer w-full"
            >
              <optgroup label="⚡ Built-In Industry Recipes">
                {BUILTIN_AUTOMATIONS.map((w) => (
                  <option key={w.id} value={w.id} className="bg-slate-900 text-slate-200">
                    {w.name} ({w.category})
                  </option>
                ))}
              </optgroup>
              {customWorkflows.length > 0 && (
                <optgroup label="💾 My Saved Automations">
                  {customWorkflows.map((w) => (
                    <option key={w.id} value={w.id} className="bg-slate-900 text-slate-200">
                      {w.name} ({w.category})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2">
          {/* Save Automation Button */}
          <button
            onClick={() => {
              setSaveName(activeWorkflow.name.replace(/\(Copy\)/g, '').trim() + ' (Custom)');
              setSaveDesc(activeWorkflow.description);
              setSaveCategory(activeWorkflow.category);
              setIsSaveModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-sm active:scale-95"
            title="Save current 8-step pipeline configuration as a reusable automation"
          >
            <Save className="w-3.5 h-3.5 text-amber-400" />
            <span>Save as Automation</span>
          </button>

          {/* Export JSON Recipe */}
          <button
            onClick={handleExportJson}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
            title="Export workflow recipe as .lumina-workflow.json"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Import JSON Recipe */}
          <button
            onClick={() => jsonImportRef.current?.click()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
            title="Import .lumina-workflow.json"
          >
            <UploadCloud className="w-4 h-4" />
          </button>
          <input
            ref={jsonImportRef}
            type="file"
            accept=".json,.lumina-workflow.json"
            onChange={handleImportJson}
            className="hidden"
          />

          {/* Delete custom if active */}
          {!activeWorkflow.isBuiltIn && (
            <button
              onClick={() => handleDeleteAutomation(activeWorkflow.id, activeWorkflow.name)}
              className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 transition-all"
              title="Delete this custom automation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <div className="h-6 w-[1px] bg-slate-800" />

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. TOP PIPELINE FLOW VISUALIZER (The 8 Steps) */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-3 shrink-0 overflow-x-auto scrollbar-none shadow-inner">
        <div className="flex items-center min-w-max gap-2 justify-between max-w-7xl mx-auto">
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = selectedStepIndex === idx;
            const report = activeStepReports.find((r) => r.stepIndex === idx);
            const isRunning = isExecuting && report?.status === 'running';
            const isDone = report?.status === 'completed';
            const isSkipped = report?.status === 'skipped';

            return (
              <React.Fragment key={step.id}>
                {/* Step Node Card */}
                <div
                  onClick={() => setSelectedStepIndex(idx)}
                  className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-950/90 to-purple-950/90 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/20'
                      : step.isEnabled
                      ? 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/60 border-dashed border-slate-800/80 opacity-50'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isRunning
                        ? 'bg-amber-500 text-slate-950 animate-pulse'
                        : isDone
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                        : isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40'
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {isRunning ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="min-w-0 pr-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-white whitespace-nowrap">
                        {step.shortTitle}
                      </span>
                      {report?.latencyMs !== undefined && isDone && (
                        <span className="text-[9px] font-mono text-emerald-400 font-semibold">
                          {report.latencyMs}ms
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">
                      {isRunning ? 'Processing...' : isDone ? 'Done' : isSkipped ? 'Bypassed' : `Stage ${idx + 1}`}
                    </div>
                  </div>

                  {/* Step Active Indicator Dot */}
                  {isSelected && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  )}
                </div>

                {/* Arrow Connector */}
                {idx < PIPELINE_STEPS.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: LEFT CONFIGURATOR + RIGHT VISUALIZER */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT COLUMN: STEP PARAMETER INSPECTOR */}
        <div className="w-full lg:w-96 xl:w-108 bg-slate-900/95 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col shrink-0 overflow-hidden shadow-2xl z-10">
          {/* Step Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">
                Stage {selectedStepIndex + 1} of 8
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-sm font-black text-white">
                {PIPELINE_STEPS[selectedStepIndex].title}
              </span>
            </div>

            {/* Toggle Enable Step (except import which is mandatory) */}
            {selectedStepIndex > 0 && selectedStepIndex < 7 && (
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-300">
                <span>{PIPELINE_STEPS[selectedStepIndex].isEnabled ? 'Enabled' : 'Bypassed'}</span>
                <input
                  type="checkbox"
                  checked={PIPELINE_STEPS[selectedStepIndex].isEnabled}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setActiveWorkflow((prev) => {
                      const copy = { ...prev, steps: { ...prev.steps } };
                      if (selectedStepIndex === 1) copy.steps.aiAnalysisStep.enabled = val;
                      if (selectedStepIndex === 2) copy.steps.colorCorrectionStep.enabled = val;
                      if (selectedStepIndex === 3) copy.steps.noiseReductionStep.enabled = val;
                      if (selectedStepIndex === 4) copy.steps.presetStep.enabled = val;
                      if (selectedStepIndex === 5) copy.steps.watermarkStep.enabled = val;
                      if (selectedStepIndex === 6) copy.steps.resizeStep.enabled = val;
                      return copy;
                    });
                  }}
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                />
              </label>
            )}
          </div>

          {/* Step Inspector Controls Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* STEP 1: IMPORT & INGEST CONFIG */}
            {selectedStepIndex === 0 && (
              <div className="space-y-4">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-indigo-400" />
                    Source Ingest & Color Space
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Choose test image source or upload RAW/JPEG files to execute the automation pipeline.
                  </p>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400">Color Space Profile</label>
                    <select
                      value={activeWorkflow.steps.importStep.colorSpace}
                      onChange={(e) =>
                        setActiveWorkflow((prev) => ({
                          ...prev,
                          steps: {
                            ...prev.steps,
                            importStep: { ...prev.steps.importStep, colorSpace: e.target.value as any },
                          },
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none font-medium"
                    >
                      <option value="sRGB">sRGB IEC61966-2.1 (Standard Web / Social)</option>
                      <option value="Display-P3">Display P3 (Wide Color Gamut Apple HDR)</option>
                      <option value="AdobeRGB">Adobe RGB 1998 (Pro Commercial Print)</option>
                    </select>
                  </div>

                  {/* Load Source Photo Buttons */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-300">Choose Test Source Image:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.raw,.dng,.cr2,.nef,.arw"
                        onChange={handleSingleImageUpload}
                        className="hidden"
                      />

                      {project?.image?.url && (
                        <button
                          onClick={() => {
                            setSourceImage({ url: project.image.url, name: project.name });
                            loadUrlToCanvas(project.image.url);
                            showToast('info', 'Loaded Project Canvas', 'Using current editor image as source.');
                          }}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          <Camera className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Active Canvas</span>
                        </button>
                      )}
                    </div>

                    {/* Quick Demo Gallery */}
                    <div className="pt-2">
                      <div className="text-[10px] text-slate-400 pb-1.5">Or test with curated scenes:</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {DEMO_WORKFLOW_PHOTOS.map((demo) => (
                          <button
                            key={demo.name}
                            onClick={() => {
                              setSourceImage({ url: demo.url, name: demo.name });
                              loadUrlToCanvas(demo.url);
                              showToast('info', 'Demo Scene Loaded', demo.label);
                            }}
                            className={`p-1.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                              sourceImage?.name === demo.name
                                ? 'bg-indigo-950/80 border-indigo-500 ring-1 ring-indigo-500'
                                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <img src={demo.url} alt="" className="w-7 h-7 rounded-lg object-cover" />
                            <div className="min-w-0">
                              <div className="text-[10px] font-bold text-slate-200 truncate">{demo.label}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: AI ANALYSIS CONFIG */}
            {selectedStepIndex === 1 && (
              <div className="space-y-4">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-purple-400" />
                    AI Neural Scene & Lighting Analysis
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Evaluates dynamic range histogram, scene categorization, ISO noise profile, and feeds optimal exposure/tone corrections forward.
                  </p>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400">Analysis Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'balanced', label: 'Balanced' },
                        { id: 'aggressive', label: 'Aggressive' },
                        { id: 'natural', label: 'Natural Subtle' },
                        { id: 'portrait_prioritized', label: 'Portrait / Skin' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() =>
                            setActiveWorkflow((prev) => ({
                              ...prev,
                              steps: {
                                ...prev.steps,
                                aiAnalysisStep: { ...prev.steps.aiAnalysisStep, mode: m.id as any },
                              },
                            }))
                          }
                          className={`p-2 rounded-xl border text-xs font-bold transition-all text-left ${
                            activeWorkflow.steps.aiAnalysisStep.mode === m.id
                              ? 'bg-purple-950/80 border-purple-500 text-purple-300 ring-1 ring-purple-500'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                      <span>Auto-Tone Feed Forward (EV Assist)</span>
                      <input
                        type="checkbox"
                        checked={activeWorkflow.steps.aiAnalysisStep.autoToneAssistance}
                        onChange={(e) =>
                          setActiveWorkflow((prev) => ({
                            ...prev,
                            steps: {
                              ...prev.steps,
                              aiAnalysisStep: { ...prev.steps.aiAnalysisStep, autoToneAssistance: e.target.checked },
                            },
                          }))
                        }
                        className="w-4 h-4 accent-indigo-500 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                      <span>Noise Profiling & Grain Detection</span>
                      <input
                        type="checkbox"
                        checked={activeWorkflow.steps.aiAnalysisStep.calculateNoiseProfile}
                        onChange={(e) =>
                          setActiveWorkflow((prev) => ({
                            ...prev,
                            steps: {
                              ...prev.steps,
                              aiAnalysisStep: { ...prev.steps.aiAnalysisStep, calculateNoiseProfile: e.target.checked },
                            },
                          }))
                        }
                        className="w-4 h-4 accent-indigo-500 rounded"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: COLOR CORRECTION & BALANCE */}
            {selectedStepIndex === 2 && (
              <div className="space-y-4">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      Color Correction & Auto-Tone
                    </span>
                    <label className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeWorkflow.steps.colorCorrectionStep.autoTone}
                        onChange={(e) =>
                          setActiveWorkflow((prev) => ({
                            ...prev,
                            steps: {
                              ...prev.steps,
                              colorCorrectionStep: { ...prev.steps.colorCorrectionStep, autoTone: e.target.checked },
                            },
                          }))
                        }
                        className="w-3.5 h-3.5 accent-indigo-500 rounded"
                      />
                      <span>AI Auto-Tone</span>
                    </label>
                  </div>

                  {/* Sliders Grid */}
                  <div className="space-y-3 pt-2">
                    {[
                      { key: 'exposure', label: 'Exposure Compensation', min: -50, max: 50 },
                      { key: 'contrast', label: 'Contrast', min: -50, max: 50 },
                      { key: 'highlights', label: 'Highlights Recovery', min: -50, max: 50 },
                      { key: 'shadows', label: 'Shadows Lift', min: -50, max: 50 },
                      { key: 'temperature', label: 'White Balance (Temp)', min: -50, max: 50 },
                      { key: 'vibrance', label: 'Smart Vibrance', min: -50, max: 50 },
                      { key: 'clarity', label: 'Clarity & Midtones', min: -50, max: 50 },
                      { key: 'dehaze', label: 'Dehaze', min: -50, max: 50 },
                    ].map((param) => {
                      const val = (activeWorkflow.steps.colorCorrectionStep as any)[param.key] || 0;
                      return (
                        <div key={param.key} className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-300">
                            <span>{param.label}</span>
                            <span className="font-mono text-indigo-300 font-bold">
                              {val > 0 ? `+${val}` : val}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={param.min}
                            max={param.max}
                            value={val}
                            onChange={(e) =>
                              setActiveWorkflow((prev) => ({
                                ...prev,
                                steps: {
                                  ...prev.steps,
                                  colorCorrectionStep: {
                                    ...prev.steps.colorCorrectionStep,
                                    [param.key]: Number(e.target.value),
                                  },
                                },
                              }))
                            }
                            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: NOISE REDUCTION & DETAIL */}
            {selectedStepIndex === 3 && (
              <div className="space-y-4">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Focus className="w-4 h-4 text-cyan-400" />
                    Noise Reduction & Edge Detail
                  </div>

                  <div className="space-y-3 pt-2">
                    {[
                      { key: 'luminanceNR', label: 'Luminance Noise Reduction', min: 0, max: 100, unit: '%' },
                      { key: 'colorNR', label: 'Color / Chroma Noise Suppression', min: 0, max: 100, unit: '%' },
                      { key: 'sharpness', label: 'Unsharp Mask Sharpening', min: 0, max: 120, unit: '%' },
                      { key: 'sharpnessMasking', label: 'Edge Masking Threshold', min: 0, max: 100, unit: '%' },
                      { key: 'texture', label: 'High-Frequency Texture', min: -50, max: 50, unit: '' },
                      { key: 'microcontrast', label: 'Microcontrast Structure', min: -50, max: 50, unit: '' },
                    ].map((param) => {
                      const val = (activeWorkflow.steps.noiseReductionStep as any)[param.key] || 0;
                      return (
                        <div key={param.key} className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-300">
                            <span>{param.label}</span>
                            <span className="font-mono text-cyan-300 font-bold">
                              {val}
                              {param.unit}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={param.min}
                            max={param.max}
                            value={val}
                            onChange={(e) =>
                              setActiveWorkflow((prev) => ({
                                ...prev,
                                steps: {
                                  ...prev.steps,
                                  noiseReductionStep: {
                                    ...prev.steps.noiseReductionStep,
                                    [param.key]: Number(e.target.value),
                                  },
                                },
                              }))
                            }
                            className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: PRESET & VISUAL GRADE */}
            {selectedStepIndex === 4 && (
              <div className="space-y-4">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-amber-400" />
                    Preset Grade & Film Simulation
                  </div>

                  {/* Category Pills */}
                  <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                    {['All', ...FILTER_CATEGORIES].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setPresetCategory(cat)}
                        className={`px-2 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                          presetCategory === cat
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Preset Dropdown */}
                  <select
                    value={activeWorkflow.steps.presetStep.presetId || ''}
                    onChange={(e) =>
                      setActiveWorkflow((prev) => ({
                        ...prev,
                        steps: {
                          ...prev.steps,
                          presetStep: { ...prev.steps.presetStep, presetId: e.target.value || null },
                        },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none font-medium cursor-pointer"
                  >
                    <option value="">None (Keep Color Correction Only)</option>
                    {[...customPresets, ...FILTER_PRESETS]
                      .filter((p) => presetCategory === 'All' || p.category === presetCategory)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category})
                        </option>
                      ))}
                  </select>

                  {/* Strength Slider */}
                  {activeWorkflow.steps.presetStep.presetId && (
                    <div className="space-y-1 pt-2 border-t border-slate-800">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Preset Intensity</span>
                        <span className="font-mono text-amber-300 font-bold">
                          {activeWorkflow.steps.presetStep.presetStrength}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={150}
                        value={activeWorkflow.steps.presetStep.presetStrength}
                        onChange={(e) =>
                          setActiveWorkflow((prev) => ({
                            ...prev,
                            steps: {
                              ...prev.steps,
                              presetStep: { ...prev.steps.presetStep, presetStrength: Number(e.target.value) },
                            },
                          }))
                        }
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 6: WATERMARK PROTECTION */}
            {selectedStepIndex === 5 && (
              <div className="space-y-4">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Stamp className="w-4 h-4 text-rose-400" />
                    Watermark Branding & Copyright
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Watermark Text</label>
                    <input
                      type="text"
                      value={activeWorkflow.steps.watermarkStep.text}
                      onChange={(e) =>
                        setActiveWorkflow((prev) => ({
                          ...prev,
                          steps: {
                            ...prev.steps,
                            watermarkStep: { ...prev.steps.watermarkStep, text: e.target.value },
                          },
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  {/* 9-Point Positioning Matrix */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[11px] font-semibold text-slate-400">Position Matrix</label>
                    <div className="grid grid-cols-3 gap-1 max-w-[200px] mx-auto">
                      {[
                        'top-left', 'top-center', 'top-right',
                        'center-left', 'center', 'center-right',
                        'bottom-left', 'bottom-center', 'bottom-right'
                      ].map((pos) => (
                        <button
                          key={pos}
                          onClick={() =>
                            setActiveWorkflow((prev) => ({
                              ...prev,
                              steps: {
                                ...prev.steps,
                                watermarkStep: { ...prev.steps.watermarkStep, position: pos as any },
                              },
                            }))
                          }
                          className={`py-1 text-[9px] font-bold rounded border transition-all uppercase ${
                            activeWorkflow.steps.watermarkStep.position === pos
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {pos.split('-').map((s) => s[0]).join('')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Opacity Slider */}
                  <div className="space-y-1 pt-2 border-t border-slate-800">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Opacity</span>
                      <span className="font-mono text-rose-300 font-bold">
                        {activeWorkflow.steps.watermarkStep.opacity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={activeWorkflow.steps.watermarkStep.opacity}
                      onChange={(e) =>
                        setActiveWorkflow((prev) => ({
                          ...prev,
                          steps: {
                            ...prev.steps,
                            watermarkStep: { ...prev.steps.watermarkStep, opacity: Number(e.target.value) },
                          },
                        }))
                      }
                      className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: RESIZE & SCALING */}
            {selectedStepIndex === 6 && (
              <div className="space-y-4">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4 text-teal-400" />
                    Resize Mode & Social Targets
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400">Resizing Mode</label>
                    <select
                      value={activeWorkflow.steps.resizeStep.mode}
                      onChange={(e) =>
                        setActiveWorkflow((prev) => ({
                          ...prev,
                          steps: {
                            ...prev.steps,
                            resizeStep: { ...prev.steps.resizeStep, mode: e.target.value as any },
                          },
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none font-medium"
                    >
                      <option value="original">Original Dimensions (100% Native Resolution)</option>
                      <option value="long-edge">Fit Long Edge (4K / 2K / 1080p)</option>
                      <option value="social-preset">Social Media Target (Auto Aspect Fit)</option>
                      <option value="percentage">Percentage Scaling</option>
                    </select>
                  </div>

                  {activeWorkflow.steps.resizeStep.mode === 'long-edge' && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <label className="text-[11px] font-semibold text-slate-400">Target Long Edge (Pixels)</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[1080, 1920, 2048, 2560, 3840, 4096].map((px) => (
                          <button
                            key={px}
                            onClick={() =>
                              setActiveWorkflow((prev) => ({
                                ...prev,
                                steps: {
                                  ...prev.steps,
                                  resizeStep: { ...prev.steps.resizeStep, longEdgePx: px },
                                },
                              }))
                            }
                            className={`py-1 text-xs font-mono font-bold rounded-lg border transition-colors ${
                              activeWorkflow.steps.resizeStep.longEdgePx === px
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {px}px
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeWorkflow.steps.resizeStep.mode === 'social-preset' && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <label className="text-[11px] font-semibold text-slate-400">Social Target</label>
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        {[
                          { id: 'insta-portrait', label: 'Instagram Portrait (1080×1350)' },
                          { id: 'insta-square', label: 'Instagram Square (1080×1080)' },
                          { id: 'story-reels', label: 'Reels / TikTok (1080×1920)' },
                          { id: 'twitter-post', label: 'Twitter / Web (1200×675)' },
                        ].map((s) => (
                          <button
                            key={s.id}
                            onClick={() =>
                              setActiveWorkflow((prev) => ({
                                ...prev,
                                steps: {
                                  ...prev.steps,
                                  resizeStep: { ...prev.steps.resizeStep, socialTarget: s.id as any },
                                },
                              }))
                            }
                            className={`p-2 text-left rounded-xl border text-xs font-semibold ${
                              activeWorkflow.steps.resizeStep.socialTarget === s.id
                                ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 8: MASTER EXPORT */}
            {selectedStepIndex === 7 && (
              <div className="space-y-4">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-400" />
                    Export Format & Token Naming
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {(['jpeg', 'png', 'webp', 'avif', 'tiff', 'dng', 'psd', 'heic'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() =>
                          setActiveWorkflow((prev) => ({
                            ...prev,
                            steps: {
                              ...prev.steps,
                              exportStep: { ...prev.steps.exportStep, format: fmt },
                            },
                          }))
                        }
                        className={`py-2 text-xs font-bold uppercase rounded-xl border transition-all ${
                          activeWorkflow.steps.exportStep.format === fmt
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <label className="text-[11px] font-semibold text-slate-400">Naming Template Pattern</label>
                    <input
                      type="text"
                      value={activeWorkflow.steps.exportStep.namingPattern}
                      onChange={(e) =>
                        setActiveWorkflow((prev) => ({
                          ...prev,
                          steps: {
                            ...prev.steps,
                            exportStep: { ...prev.steps.exportStep, namingPattern: e.target.value },
                          },
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Execution Bar */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-2">
            <button
              onClick={handleRunAutomation}
              disabled={isExecuting}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 active:scale-98"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing 8 Stages...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run Automation (8 Stages)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT / CENTER COLUMN: LIVE VISUALIZER & OUTPUT HUD */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {/* Visualizer Toolbar */}
          <div className="h-12 border-b border-slate-800 bg-slate-900/60 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                Live Stage Scrubber:
              </span>

              {/* Scrubber Buttons for each step */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px]">
                <button
                  onClick={() => setSelectedPreviewStep(-2)}
                  className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                    selectedPreviewStep === -2
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Original
                </button>

                {PIPELINE_STEPS.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedPreviewStep(idx)}
                    disabled={!activeStepReports[idx]?.previewUrl}
                    className={`px-2 py-1 rounded-lg font-bold transition-colors disabled:opacity-30 ${
                      selectedPreviewStep === idx
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}

                <button
                  onClick={() => setSelectedPreviewStep(-1)}
                  disabled={!executionResult}
                  className={`px-2 py-1 rounded-lg font-bold transition-colors disabled:opacity-30 ${
                    selectedPreviewStep === -1 && executionResult
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Final Result
                </button>
              </div>
            </div>

            {/* Quick Actions if Execution Finished */}
            {executionResult && (
              <div className="flex items-center gap-2">
                {onApplyToCanvas && (
                  <button
                    onClick={() => {
                      onApplyToCanvas(executionResult.finalCanvas, activeWorkflow.name);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply to Canvas</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    triggerDownload(executionResult.finalBlobUrl, executionResult.finalFilename);
                    showToast('success', 'Download Started', executionResult.finalFilename);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
              </div>
            )}
          </div>

          {/* Center Canvas Area */}
          <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
            {currentDisplayPreview ? (
              <div className="relative max-w-full max-h-full flex items-center justify-center">
                <img
                  src={selectedPreviewStep === -2 ? sourceImage?.url : currentDisplayPreview}
                  alt="Workflow Preview"
                  className="max-h-[60vh] lg:max-h-[65vh] object-contain rounded-2xl shadow-2xl border border-slate-800"
                />

                {/* HUD Overlay: Stage Name & Metrics Badge */}
                <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-xs shadow-xl flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-white">
                    {selectedPreviewStep === -2
                      ? 'Original Source Image'
                      : selectedPreviewStep === -1
                      ? 'Final Automation Export'
                      : PIPELINE_STEPS[selectedPreviewStep]?.title}
                  </span>
                  {executionResult && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({executionResult.width} × {executionResult.height}px)
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3 max-w-sm">
                <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-indigo-400 shadow-xl">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-white">Automation Pipeline Ready</h3>
                <p className="text-xs text-slate-400">
                  Click <strong>Run Automation</strong> to execute all 8 stages on your source image.
                </p>
              </div>
            )}
          </div>

          {/* AI Diagnostic Report HUD Bottom Bar */}
          {executionResult?.aiDiagnostics && (
            <div className="border-t border-slate-800 bg-slate-900/80 px-6 py-3 shrink-0 flex items-center justify-between text-xs overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-slate-300">AI Scene:</span>
                  <span className="text-purple-300 font-semibold">
                    {executionResult.aiDiagnostics.sceneClassification}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-slate-300">Lighting:</span>
                  <span className="text-amber-300 font-semibold">
                    {executionResult.aiDiagnostics.lightingType}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Focus className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-slate-300">Noise Level:</span>
                  <span className="text-cyan-300 font-semibold font-mono">
                    {executionResult.aiDiagnostics.estimatedNoiseLevel}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-slate-300">Total Latency:</span>
                  <span className="text-emerald-300 font-mono font-bold">
                    {executionResult.totalLatencyMs}ms
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. SAVE AS AUTOMATION MODAL */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Save className="w-4 h-4 text-amber-400" />
                Save as Custom Automation
              </h3>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Save this 8-stage workflow recipe to your library to execute in 1-click or batch apply across hundreds of photos.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Automation Name</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g. Master E-Commerce Studio"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Category</label>
                <select
                  value={saveCategory}
                  onChange={(e) => setSaveCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="Commercial">Commercial & Advertising</option>
                  <option value="Portrait">Portrait & Editorial</option>
                  <option value="Social">Social Media & Creator</option>
                  <option value="Landscape">Landscape & Architecture</option>
                  <option value="E-Commerce">E-Commerce & Product</option>
                  <option value="Fine Art">Fine Art & Monochrome</option>
                  <option value="General">General Utility</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Description</label>
                <textarea
                  value={saveDesc}
                  onChange={(e) => setSaveDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAutomation}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30"
              >
                Save Automation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
