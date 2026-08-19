import React, { useState, useMemo, useEffect } from 'react';
import {
  History,
  Bookmark,
  Plus,
  Check,
  Clock,
  ShieldCheck,
  RotateCcw,
  Download,
  Upload,
  Copy,
  Layers,
  Sliders,
  Sparkles,
  Zap,
  ArrowRight,
  Eye,
  EyeOff,
  GitBranch,
  FileCode2,
  FileImage,
  Share2,
  CheckCircle2,
  AlertTriangle,
  FolderDown,
  Trash2,
  Edit2,
  CopyPlus,
  ArrowLeftRight,
  Columns,
  Search,
  Filter,
  Play,
  Pause,
  ChevronRight,
  ChevronDown,
  Tag,
  SlidersHorizontal,
  Scissors,
  Paintbrush,
  Type,
  Maximize2,
  Sparkle,
} from 'lucide-react';
import {
  EditHistorySnapshot,
  Project,
  ProjectVersionBranch,
  NonDestructiveRecipe,
  AdjustmentSettings,
  ComparisonViewMode,
} from '../../../types/editor';
import { DEFAULT_ADJUSTMENTS, DEFAULT_CROP, DEFAULT_HSL, DEFAULT_TONE_CURVES } from '../../../engine/defaultSettings';
import { triggerDownload } from '../../../engine/exportEngine';

interface HistoryPanelProps {
  project: Project;
  onRestoreSnapshot: (snapshot: EditHistorySnapshot) => void;
  onCreateSnapshot: (name: string) => void;
  onUpdateProject?: (project: Project) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
  onOpenExportModal?: () => void;
  onSelectComparisonMode?: (mode: ComparisonViewMode) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  project,
  onRestoreSnapshot,
  onCreateSnapshot,
  onUpdateProject,
  showToast,
  onOpenExportModal,
  onSelectComparisonMode,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'versions' | 'compare' | 'recipe' | 'pipeline'>('timeline');

  // Timeline state
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistoryStep, setSelectedHistoryStep] = useState<EditHistorySnapshot | null>(null);
  const [isPlayingHistory, setIsPlayingHistory] = useState(false);

  // Version Branching state
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDesc, setNewVersionDesc] = useState('');
  const [newVersionTag, setNewVersionTag] = useState<'creative' | 'editorial' | 'black-white' | 'cinematic' | 'client-proof' | 'master'>('creative');
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [editVersionName, setEditVersionName] = useState('');

  // Version Comparison State
  const [compareVersionAId, setCompareVersionAId] = useState<string>('current');
  const [compareVersionBId, setCompareVersionBId] = useState<string>('master');
  const [compareDiffFilter, setCompareDiffFilter] = useState<'all' | 'changed-only'>('changed-only');

  // Selective Parameter Restore (Cherry-Pick) Modal State
  const [cherryPickSnapshot, setCherryPickSnapshot] = useState<{ name: string; data: EditHistorySnapshot } | null>(null);
  const [cherryPickOptions, setCherryPickOptions] = useState({
    tone: true,
    curves: true,
    hsl: true,
    crop: false,
    preset: true,
    masks: false,
    retouch: false,
    typography: false,
  });

  // Master Revert Confirmation Modal
  const [showConfirmRevertModal, setShowConfirmRevertModal] = useState(false);

  // Filtered History steps
  const filteredHistory = useMemo(() => {
    const hist = project.history || [];
    if (!historySearch.trim()) return hist;
    const q = historySearch.toLowerCase();
    return hist.filter((step) => step.label.toLowerCase().includes(q));
  }, [project.history, historySearch]);

  // History Playback Animation effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingHistory && project.history && project.history.length > 1) {
      timer = setInterval(() => {
        const nextIdx = ((project.historyIndex ?? 0) + 1) % project.history.length;
        const targetStep = project.history[nextIdx];
        if (targetStep) {
          onRestoreSnapshot(targetStep);
        }
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isPlayingHistory, project.history, project.historyIndex, onRestoreSnapshot]);

  // Generate Non-Destructive Recipe JSON Object
  const generateRecipe = (customSnapshot?: EditHistorySnapshot): NonDestructiveRecipe => {
    const settings = customSnapshot?.settings || project.currentSettings;
    const toneCurves = customSnapshot?.toneCurves || project.toneCurves;
    const hsl = customSnapshot?.hsl || project.hsl;
    const crop = customSnapshot?.crop || project.crop;
    const activePresetId = customSnapshot ? customSnapshot.activePresetId : project.activePresetId;
    const presetStrength = customSnapshot ? customSnapshot.presetStrength : project.presetStrength;
    const watermark = customSnapshot?.watermark || project.watermark;
    const border = customSnapshot?.border || project.border;
    const masks = customSnapshot?.masks || project.masks;
    const retouchStrokes = customSnapshot?.retouchStrokes || project.retouchStrokes;
    const drawingStrokes = customSnapshot?.drawingStrokes || project.drawingStrokes;
    const typography = customSnapshot?.typography || project.typography;
    const designElements = customSnapshot?.designElements || project.designElements;

    return {
      version: '2.0-lumina-recipe',
      name: `${project.name} Non-Destructive Recipe`,
      createdAt: project.createdAt || Date.now(),
      updatedAt: Date.now(),
      sourceImage: {
        name: project.image.name,
        width: project.image.width,
        height: project.image.height,
        format: project.image.format,
      },
      instructions: {
        adjustments: settings,
        toneCurves: toneCurves,
        hsl: hsl,
        crop: crop,
        activePresetId,
        presetStrength,
        watermark,
        border,
        masks,
        retouchStrokes,
        drawingStrokes,
        typography,
        designElements,
      },
    };
  };

  // Export Non-Destructive Recipe File
  const handleExportRecipe = (customSnapshot?: EditHistorySnapshot, customName?: string) => {
    const recipe = generateRecipe(customSnapshot);
    const jsonStr = JSON.stringify(recipe, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const prefix = customName ? customName.replace(/\s+/g, '_').toLowerCase() : project.name.replace(/\.[^/.]+$/, '');
    const filename = `${prefix}_recipe.json`;
    triggerDownload(url, filename);
    URL.revokeObjectURL(url);
    showToast?.('success', 'Recipe Exported', `Saved sidecar "${filename}"`);
  };

  // Copy Recipe to Clipboard
  const handleCopyRecipeToClipboard = () => {
    const recipe = generateRecipe();
    navigator.clipboard.writeText(JSON.stringify(recipe, null, 2));
    showToast?.('success', 'Recipe Copied', 'Non-destructive instructions copied to clipboard!');
  };

  // Import Recipe File
  const handleImportRecipeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.instructions && onUpdateProject) {
          const updated: Project = {
            ...project,
            currentSettings: parsed.instructions.adjustments || project.currentSettings,
            toneCurves: parsed.instructions.toneCurves || project.toneCurves,
            hsl: parsed.instructions.hsl || project.hsl,
            crop: parsed.instructions.crop || project.crop,
            activePresetId: parsed.instructions.activePresetId || null,
            presetStrength: parsed.instructions.presetStrength ?? 100,
            watermark: parsed.instructions.watermark || project.watermark,
            border: parsed.instructions.border || project.border,
            masks: parsed.instructions.masks || project.masks,
            retouchStrokes: parsed.instructions.retouchStrokes || project.retouchStrokes,
            drawingStrokes: parsed.instructions.drawingStrokes || project.drawingStrokes,
            typography: parsed.instructions.typography || project.typography,
            designElements: parsed.instructions.designElements || project.designElements,
            updatedAt: Date.now(),
          };
          onUpdateProject(updated);
          showToast?.('success', 'Recipe Applied', 'Applied non-destructive instructions to image!');
        } else {
          showToast?.('error', 'Invalid Recipe', 'File does not contain valid Lumina recipe instructions.');
        }
      } catch (err: any) {
        showToast?.('error', 'Import Failed', err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 1-Click Master Original Recovery (Revert Instructions without touching master file)
  const handleRevertToMaster = () => {
    if (!onUpdateProject) return;

    // Create a backup snapshot before resetting so work is never permanently lost
    onCreateSnapshot(`Pre-Revert Backup (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);

    const pristineProject: Project = {
      ...project,
      currentSettings: { ...DEFAULT_ADJUSTMENTS },
      toneCurves: { ...DEFAULT_TONE_CURVES },
      hsl: { ...DEFAULT_HSL },
      crop: { ...DEFAULT_CROP },
      activePresetId: null,
      presetStrength: 100,
      masks: [],
      retouchStrokes: [],
      drawingStrokes: [],
      typography: [],
      designElements: [],
      historyIndex: 0,
      updatedAt: Date.now(),
    };

    onUpdateProject(pristineProject);
    setShowConfirmRevertModal(false);
    showToast?.('success', 'Master Restored', 'Reverted instructions to original master image. Previous state saved in Snapshots.');
  };

  // Create Named Version Branch
  const handleCreateVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionName.trim()) return;

    const newSnapshot = {
      id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newVersionName.trim(),
      timestamp: Date.now(),
      description: newVersionDesc.trim(),
      tag: newVersionTag,
      data: {
        id: `snap_step_${Date.now()}`,
        timestamp: Date.now(),
        label: newVersionName.trim(),
        settings: { ...project.currentSettings },
        toneCurves: { ...project.toneCurves },
        hsl: { ...project.hsl },
        crop: { ...project.crop },
        activePresetId: project.activePresetId,
        presetStrength: project.presetStrength,
        watermark: { ...project.watermark },
        border: { ...project.border },
        masks: [...(project.masks || [])],
        layers: [...(project.layers || [])],
        typography: [...(project.typography || [])],
        designElements: [...(project.designElements || [])],
        retouchStrokes: [...(project.retouchStrokes || [])],
        drawingStrokes: [...(project.drawingStrokes || [])],
        collage: project.collage ? { ...project.collage } : undefined,
      },
    };

    const updatedSnapshots = [...(project.snapshots || []), newSnapshot];
    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        snapshots: updatedSnapshots,
        updatedAt: Date.now(),
      });
    }

    setNewVersionName('');
    setNewVersionDesc('');
    setIsCreatingVersion(false);
    showToast?.('success', 'Version Created', `Saved version "${newSnapshot.name}"`);
  };

  // Delete Version Snapshot
  const handleDeleteSnapshot = (id: string) => {
    if (!onUpdateProject) return;
    const updated = (project.snapshots || []).filter((s) => s.id !== id);
    onUpdateProject({
      ...project,
      snapshots: updated,
      updatedAt: Date.now(),
    });
    showToast?.('info', 'Version Removed', 'Deleted version snapshot.');
  };

  // Rename Version Snapshot
  const handleSaveRenameSnapshot = (id: string) => {
    if (!onUpdateProject || !editVersionName.trim()) return;
    const updated = (project.snapshots || []).map((s) => {
      if (s.id === id) {
        return { ...s, name: editVersionName.trim() };
      }
      return s;
    });
    onUpdateProject({
      ...project,
      snapshots: updated,
      updatedAt: Date.now(),
    });
    setEditingVersionId(null);
    setEditVersionName('');
    showToast?.('success', 'Version Renamed', 'Updated version title.');
  };

  // Duplicate Version Snapshot
  const handleDuplicateSnapshot = (snap: any) => {
    if (!onUpdateProject) return;
    const duplicated = {
      ...snap,
      id: `ver_${Date.now()}_copy`,
      name: `${snap.name} (Copy)`,
      timestamp: Date.now(),
    };
    const updatedSnapshots = [...(project.snapshots || []), duplicated];
    onUpdateProject({
      ...project,
      snapshots: updatedSnapshots,
      updatedAt: Date.now(),
    });
    showToast?.('success', 'Version Duplicated', `Created "${duplicated.name}"`);
  };

  // Apply Selective Parameters from Version (Cherry-Pick)
  const handleApplyCherryPick = () => {
    if (!cherryPickSnapshot || !onUpdateProject) return;

    // Safety snapshot before selective apply
    onCreateSnapshot(`Pre-Merge Backup (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);

    const data = cherryPickSnapshot.data;
    const updated: Project = {
      ...project,
      currentSettings: cherryPickOptions.tone
        ? { ...data.settings }
        : { ...project.currentSettings },
      toneCurves: cherryPickOptions.curves
        ? { ...data.toneCurves }
        : { ...project.toneCurves },
      hsl: cherryPickOptions.hsl
        ? { ...data.hsl }
        : { ...project.hsl },
      crop: cherryPickOptions.crop
        ? { ...data.crop }
        : { ...project.crop },
      activePresetId: cherryPickOptions.preset
        ? data.activePresetId
        : project.activePresetId,
      presetStrength: cherryPickOptions.preset
        ? (data.presetStrength ?? 100)
        : project.presetStrength,
      masks: cherryPickOptions.masks
        ? [...(data.masks || [])]
        : project.masks,
      retouchStrokes: cherryPickOptions.retouch
        ? [...(data.retouchStrokes || [])]
        : project.retouchStrokes,
      typography: cherryPickOptions.typography
        ? [...(data.typography || [])]
        : project.typography,
      updatedAt: Date.now(),
    };

    onUpdateProject(updated);
    setCherryPickSnapshot(null);
    showToast?.('success', 'Attributes Applied', `Merged selected attributes from "${cherryPickSnapshot.name}"`);
  };

  // Extract snapshot object by key ('current' | 'master' | id)
  const getSnapshotByKey = (key: string): EditHistorySnapshot => {
    if (key === 'current') {
      return {
        id: 'current',
        timestamp: Date.now(),
        label: 'Current Active Edit',
        settings: project.currentSettings,
        toneCurves: project.toneCurves,
        hsl: project.hsl,
        crop: project.crop,
        activePresetId: project.activePresetId,
        presetStrength: project.presetStrength,
        watermark: project.watermark,
        border: project.border,
        masks: project.masks || [],
        layers: project.layers || [],
        typography: project.typography || [],
        designElements: project.designElements || [],
        retouchStrokes: project.retouchStrokes || [],
      };
    }
    if (key === 'master') {
      return {
        id: 'master',
        timestamp: project.createdAt || Date.now(),
        label: 'Untouched Master Original',
        settings: DEFAULT_ADJUSTMENTS,
        toneCurves: DEFAULT_TONE_CURVES,
        hsl: DEFAULT_HSL,
        crop: DEFAULT_CROP,
        activePresetId: null,
        presetStrength: 100,
        watermark: project.watermark,
        border: project.border,
        masks: [],
        layers: [],
        typography: [],
        designElements: [],
        retouchStrokes: [],
      };
    }
    const found = (project.snapshots || []).find((s) => s.id === key);
    if (found) return found.data;
    return getSnapshotByKey('current');
  };

  const snapA = getSnapshotByKey(compareVersionAId);
  const snapB = getSnapshotByKey(compareVersionBId);

  // Compute parameter differences between Version A and Version B
  const paramDifferences = useMemo(() => {
    const diffs: Array<{ key: string; label: string; valA: any; valB: any; isDiff: boolean; unit?: string }> = [];

    const checkNum = (key: keyof AdjustmentSettings, label: string, unit: string = '') => {
      const vA = (snapA.settings as any)[key] ?? 0;
      const vB = (snapB.settings as any)[key] ?? 0;
      diffs.push({
        key: String(key),
        label,
        valA: vA,
        valB: vB,
        isDiff: Math.abs(vA - vB) > 0.001,
        unit,
      });
    };

    checkNum('exposure', 'Exposure', 'EV');
    checkNum('contrast', 'Contrast');
    checkNum('highlights', 'Highlights');
    checkNum('shadows', 'Shadows');
    checkNum('whites', 'Whites');
    checkNum('blacks', 'Blacks');
    checkNum('temperature', 'Temperature', 'K');
    checkNum('tint', 'Tint');
    checkNum('vibrance', 'Vibrance');
    checkNum('saturation', 'Saturation');
    checkNum('clarity', 'Clarity');
    checkNum('dehaze', 'Dehaze');
    checkNum('texture', 'Texture');
    checkNum('sharpness', 'Sharpness');
    checkNum('vignette', 'Vignette');
    checkNum('filmGrain', 'Film Grain');

    // Preset check
    diffs.push({
      key: 'preset',
      label: 'Active Filter / Preset',
      valA: snapA.activePresetId || 'None',
      valB: snapB.activePresetId || 'None',
      isDiff: snapA.activePresetId !== snapB.activePresetId,
    });

    // Masks Count
    const masksA = snapA.masks?.length || 0;
    const masksB = snapB.masks?.length || 0;
    diffs.push({
      key: 'masks',
      label: 'Selective Masks',
      valA: `${masksA} layers`,
      valB: `${masksB} layers`,
      isDiff: masksA !== masksB,
    });

    // Retouch Count
    const retA = snapA.retouchStrokes?.length || 0;
    const retB = snapB.retouchStrokes?.length || 0;
    diffs.push({
      key: 'retouch',
      label: 'Retouch Strokes',
      valA: `${retA} strokes`,
      valB: `${retB} strokes`,
      isDiff: retA !== retB,
    });

    // Crop Rotation
    const rotA = snapA.crop?.rotation || 0;
    const rotB = snapB.crop?.rotation || 0;
    diffs.push({
      key: 'crop_rot',
      label: 'Crop Rotation',
      valA: `${rotA}°`,
      valB: `${rotB}°`,
      isDiff: rotA !== rotB,
    });

    return diffs;
  }, [snapA, snapB]);

  const displayedDiffs = compareDiffFilter === 'changed-only' ? paramDifferences.filter((d) => d.isDiff) : paramDifferences;

  return (
    <div className="p-4 space-y-4 select-none overflow-y-auto max-h-full pb-16 text-slate-200">
      {/* Master Integrity Guarantee Card */}
      <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-3.5 space-y-2.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <span>Non-Destructive Master</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold uppercase">
                  Protected
                </span>
              </div>
              <p className="text-[10px] text-emerald-400/80">Original master pixel buffer is 100% untouched</p>
            </div>
          </div>

          <button
            onClick={() => setShowConfirmRevertModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 text-[11px] font-bold transition-all"
            title="Reset instructions back to pristine untouched original"
          >
            <RotateCcw className="w-3 h-3 text-rose-400" />
            <span>Revert Master</span>
          </button>
        </div>

        {/* Master File Metadata Badges */}
        <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono pt-1">
          <div className="bg-slate-950/80 border border-slate-800 px-2 py-1 rounded-lg">
            <span className="text-slate-500 block text-[9px]">SOURCE:</span>
            <span className="text-slate-200 font-bold uppercase truncate block">
              {project.image.format} {project.image.rawMetadata?.isRaw ? 'RAW' : ''}
            </span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 px-2 py-1 rounded-lg">
            <span className="text-slate-500 block text-[9px]">NATIVE RES:</span>
            <span className="text-amber-300 font-bold block truncate">
              {project.image.width} × {project.image.height}
            </span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 px-2 py-1 rounded-lg">
            <span className="text-slate-500 block text-[9px]">PIPELINE:</span>
            <span className="text-indigo-300 font-bold block truncate">
              Parametric
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl text-[11px]">
        <button
          onClick={() => setActiveSubTab('timeline')}
          className={`py-1.5 px-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
            activeSubTab === 'timeline'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Unlimited Step-by-Step Edit History Stack"
        >
          <History className="w-3.5 h-3.5" />
          <span className="truncate">History</span>
        </button>

        <button
          onClick={() => setActiveSubTab('versions')}
          className={`py-1.5 px-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
            activeSubTab === 'versions'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Creative Named Versions & Snapshots"
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span className="truncate">Versions</span>
          {(project.snapshots?.length ?? 0) > 0 && (
            <span className="text-[9px] px-1 py-0.2 rounded-full bg-purple-500/30 text-purple-200">
              {project.snapshots?.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('compare')}
          className={`py-1.5 px-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
            activeSubTab === 'compare'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Compare Any Two Versions & Parameter Diff"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span className="truncate">Diff</span>
        </button>

        <button
          onClick={() => setActiveSubTab('recipe')}
          className={`py-1.5 px-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
            activeSubTab === 'recipe'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Non-Destructive Recipe Sidecar (.json)"
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span className="truncate">Recipe</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pipeline')}
          className={`py-1.5 px-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
            activeSubTab === 'pipeline'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="GPU Parametric Render Pipeline"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="truncate">Pipeline</span>
        </button>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 1. TIMELINE & UNLIMITED UNDO / REDO TAB */}
      {/* ---------------------------------------------------------------------- */}
      {activeSubTab === 'timeline' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-slate-800">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Edit History ({project.history?.length || 0} Steps)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlayingHistory(!isPlayingHistory)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  isPlayingHistory
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Play history evolution timelapse"
              >
                {isPlayingHistory ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                <span>{isPlayingHistory ? 'Stop' : 'Replay'}</span>
              </button>
              <span className="text-[10px] text-slate-500 font-mono">
                {(project.historyIndex ?? 0) + 1} / {project.history?.length || 1}
              </span>
            </div>
          </div>

          {/* Quick Search & Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search history steps (e.g. Curves, Exposure, Filter)..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>

          {/* History Steps Stack */}
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((step, idx) => {
                const isCurrent = idx === project.historyIndex;
                const isPast = idx < (project.historyIndex ?? 0);
                const isSelected = selectedHistoryStep?.id === step.id;

                return (
                  <div
                    key={step.id || idx}
                    className={`group rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-indigo-950/70 border-indigo-500/80 text-white ring-1 ring-indigo-500/30'
                        : isPast
                        ? 'bg-slate-900/70 border-slate-800/80 text-slate-300 hover:bg-slate-850'
                        : 'bg-slate-950/40 border-slate-900 text-slate-500 hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="p-2.5 flex items-center justify-between">
                      <button
                        onClick={() => onRestoreSnapshot(step)}
                        className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                      >
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isCurrent
                              ? 'bg-indigo-400 ring-4 ring-indigo-400/30'
                              : isPast
                              ? 'bg-emerald-400'
                              : 'bg-slate-700'
                          }`}
                        />
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate">{step.label || 'Adjustment'}</div>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                            <span>
                              {new Date(step.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                            {isCurrent && (
                              <span className="text-indigo-400 font-bold uppercase text-[9px]">
                                [ACTIVE]
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Fork New Version Branch from this step */}
                        <button
                          onClick={() => {
                            onCreateSnapshot(`Branch from Step ${idx + 1}: ${step.label}`);
                            showToast?.('success', 'Branch Forked', `Created version checkpoint from "${step.label}"`);
                          }}
                          className="p-1 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded transition-colors"
                          title="Save this step as a permanent Version Snapshot"
                        >
                          <Bookmark className="w-3 h-3" />
                        </button>

                        {/* Toggle Inspector */}
                        <button
                          onClick={() => setSelectedHistoryStep(isSelected ? null : step)}
                          className="p-1 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors"
                          title="Inspect step parameters"
                        >
                          {isSelected ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Step Detail Inspector Drawer */}
                    {isSelected && (
                      <div className="px-3 pb-2.5 pt-1 border-t border-slate-800/60 bg-slate-950/60 rounded-b-xl text-[10px] space-y-1.5 text-slate-400 font-mono">
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <span className="text-slate-500">Exposure: </span>
                            <span className="text-slate-200">
                              {step.settings.exposure > 0 ? `+${step.settings.exposure}` : step.settings.exposure} EV
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Contrast: </span>
                            <span className="text-slate-200">{step.settings.contrast}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Temp: </span>
                            <span className="text-slate-200">{step.settings.temperature} K</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Preset: </span>
                            <span className="text-indigo-300">{step.activePresetId || 'None'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1 text-[9px]">
                          <button
                            onClick={() => onRestoreSnapshot(step)}
                            className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold"
                          >
                            Jump to This State
                          </button>
                          <button
                            onClick={() => handleExportRecipe(step, `history_step_${idx + 1}`)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold"
                          >
                            Export Step Recipe
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-900/40 rounded-xl border border-slate-800">
                No matching history steps.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 2. NAMED VERSIONS & VERSION SNAPSHOTS TAB */}
      {/* ---------------------------------------------------------------------- */}
      {activeSubTab === 'versions' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-slate-800">
            <span className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-purple-400" />
              Named Versions & Creative Variations
            </span>
            <span className="text-[10px] text-purple-300 font-mono">
              {project.snapshots?.length || 0} Variations
            </span>
          </div>

          {/* Create Version Branch Form */}
          {isCreatingVersion ? (
            <form
              onSubmit={handleCreateVersion}
              className="p-3.5 bg-slate-900 border border-purple-500/40 rounded-2xl space-y-3 shadow-xl"
            >
              <div className="text-xs font-black text-white flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-purple-400" />
                  <span>Snapshot Current State as Version</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingVersion(false)}
                  className="text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Version Title</label>
                <input
                  type="text"
                  placeholder="e.g. Version 2 - Moody Monochrome Noir"
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-xl outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Optional Notes / Intended Look</label>
                <input
                  type="text"
                  placeholder="e.g. Deep blacks, high grain, split-toned highlights"
                  value={newVersionDesc}
                  onChange={(e) => setNewVersionDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-1.5 rounded-xl outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Tag Category</label>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  {(
                    [
                      { id: 'creative', label: 'Creative', color: 'text-purple-400 border-purple-500/30' },
                      { id: 'cinematic', label: 'Cinematic', color: 'text-amber-400 border-amber-500/30' },
                      { id: 'black-white', label: 'B & W', color: 'text-slate-300 border-slate-600' },
                      { id: 'editorial', label: 'Editorial', color: 'text-cyan-400 border-cyan-500/30' },
                      { id: 'client-proof', label: 'Proof', color: 'text-emerald-400 border-emerald-500/30' },
                      { id: 'master', label: 'Master Grade', color: 'text-rose-400 border-rose-500/30' },
                    ] as const
                  ).map((tagItem) => (
                    <button
                      key={tagItem.id}
                      type="button"
                      onClick={() => setNewVersionTag(tagItem.id)}
                      className={`py-1 px-2 rounded-lg border text-center font-semibold transition-all ${
                        newVersionTag === tagItem.id
                          ? 'bg-purple-900/50 border-purple-500 text-white shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tagItem.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                >
                  Save Version Snapshot
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingVersion(false)}
                  className="px-3 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreatingVersion(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-xs font-bold text-purple-200 hover:text-white transition-all shadow-sm group"
            >
              <Plus className="w-4 h-4 text-purple-400 group-hover:rotate-90 transition-transform" />
              <span>Snapshot Current Edit as Named Version</span>
            </button>
          )}

          {/* Versions List */}
          <div className="space-y-2.5">
            {project.snapshots && project.snapshots.length > 0 ? (
              project.snapshots.map((snap: any) => {
                const isEditing = editingVersionId === snap.id;

                return (
                  <div
                    key={snap.id}
                    className="p-3.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all space-y-2 group shadow-md"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editVersionName}
                              onChange={(e) => setEditVersionName(e.target.value)}
                              autoFocus
                              className="w-full bg-slate-950 border border-purple-500 text-xs text-white px-2 py-1 rounded-lg outline-none"
                            />
                            <button
                              onClick={() => handleSaveRenameSnapshot(snap.id)}
                              className="p-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white group-hover:text-purple-300 transition-colors truncate">
                              {snap.name}
                            </span>
                            {snap.tag && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded uppercase font-bold bg-purple-950 border border-purple-500/30 text-purple-300">
                                {snap.tag}
                              </span>
                            )}
                          </div>
                        )}

                        {snap.description && (
                          <p className="text-[10px] text-slate-400 italic truncate">{snap.description}</p>
                        )}

                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-mono pt-0.5">
                          <span>{new Date(snap.timestamp).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* Top Action Icons */}
                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingVersionId(snap.id);
                            setEditVersionName(snap.name);
                          }}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="Rename version"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDuplicateSnapshot(snap)}
                          className="p-1 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded transition-colors"
                          title="Duplicate version"
                        >
                          <CopyPlus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteSnapshot(snap.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          title="Delete version"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Version Parameter Badges */}
                    <div className="grid grid-cols-3 gap-1 text-[9px] font-mono bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                      <div>
                        <span className="text-slate-500">Exp: </span>
                        <span className="text-slate-200">
                          {snap.data.settings?.exposure > 0 ? `+${snap.data.settings.exposure}` : snap.data.settings?.exposure || 0} EV
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Preset: </span>
                        <span className="text-indigo-300 truncate block">
                          {snap.data.activePresetId || 'Custom'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Masks: </span>
                        <span className="text-purple-300">
                          {snap.data.masks?.length || 0}
                        </span>
                      </div>
                    </div>

                    {/* Primary Restore & Compare Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      {/* Full Restore */}
                      <button
                        onClick={() => {
                          onRestoreSnapshot(snap.data);
                          showToast?.('success', 'Version Restored', `Restored "${snap.name}"`);
                        }}
                        className="py-1.5 px-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1"
                        title="Restore this entire version"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Restore</span>
                      </button>

                      {/* Cherry Pick Attributes */}
                      <button
                        onClick={() => setCherryPickSnapshot(snap)}
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-[11px] font-semibold transition-all border border-slate-700 flex items-center justify-center gap-1"
                        title="Merge only selected parameters from this version"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
                        <span>Merge...</span>
                      </button>

                      {/* Compare with Current */}
                      <button
                        onClick={() => {
                          setCompareVersionAId('current');
                          setCompareVersionBId(snap.id);
                          setActiveSubTab('compare');
                          if (onSelectComparisonMode) {
                            onSelectComparisonMode('split-vertical');
                          }
                        }}
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-[11px] font-semibold transition-all border border-slate-700 flex items-center justify-center gap-1"
                        title="Compare against active edit"
                      >
                        <ArrowLeftRight className="w-3 h-3 text-cyan-400" />
                        <span>Compare</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800 space-y-1">
                <Bookmark className="w-5 h-5 mx-auto text-slate-600 mb-1" />
                <div className="font-bold text-slate-400">No Version Snapshots Saved Yet</div>
                <p className="text-[11px]">
                  Click the button above to snapshot your color grade, curves, and crops into named variations.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 3. COMPARE VERSIONS & PARAMETER DIFF TAB */}
      {/* ---------------------------------------------------------------------- */}
      {activeSubTab === 'compare' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-slate-800">
            <span className="flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
              Version Comparison Matrix & Parameter Diff
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              {displayedDiffs.filter((d) => d.isDiff).length} Differences
            </span>
          </div>

          {/* Selectors for Version A and Version B */}
          <div className="grid grid-cols-2 gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Target A</label>
              <select
                value={compareVersionAId}
                onChange={(e) => setCompareVersionAId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-xl outline-none focus:border-cyan-500"
              >
                <option value="current">Current Active Edit</option>
                <option value="master">Untouched Master Original</option>
                {(project.snapshots || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Target B</label>
              <select
                value={compareVersionBId}
                onChange={(e) => setCompareVersionBId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-xl outline-none focus:border-cyan-500"
              >
                <option value="master">Untouched Master Original</option>
                <option value="current">Current Active Edit</option>
                {(project.snapshots || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Viewport Comparison Launch Modes */}
          {onSelectComparisonMode && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400">Launch Interactive Canvas Comparison:</div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => onSelectComparisonMode('split-vertical')}
                  className="p-2 bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-[10px] font-bold text-slate-300 hover:text-cyan-300 transition-all flex flex-col items-center gap-1"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Split Screen</span>
                </button>
                <button
                  onClick={() => onSelectComparisonMode('side-by-side')}
                  className="p-2 bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-[10px] font-bold text-slate-300 hover:text-cyan-300 transition-all flex flex-col items-center gap-1"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Side-by-Side</span>
                </button>
                <button
                  onClick={() => onSelectComparisonMode('difference')}
                  className="p-2 bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-[10px] font-bold text-slate-300 hover:text-cyan-300 transition-all flex flex-col items-center gap-1"
                >
                  <Sparkle className="w-3.5 h-3.5" />
                  <span>Difference Heatmap</span>
                </button>
              </div>
            </div>
          )}

          {/* Filter changed parameters */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-bold text-slate-300">Parameter Difference Delta</span>
            <div className="flex items-center gap-1 text-[10px] bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setCompareDiffFilter('changed-only')}
                className={`px-2 py-0.5 rounded font-semibold ${
                  compareDiffFilter === 'changed-only' ? 'bg-cyan-600 text-white' : 'text-slate-400'
                }`}
              >
                Changed Only
              </button>
              <button
                onClick={() => setCompareDiffFilter('all')}
                className={`px-2 py-0.5 rounded font-semibold ${
                  compareDiffFilter === 'all' ? 'bg-cyan-600 text-white' : 'text-slate-400'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Parameter Delta Diff Table */}
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {displayedDiffs.length > 0 ? (
              displayedDiffs.map((diff) => (
                <div
                  key={diff.key}
                  className={`p-2 rounded-xl text-xs flex items-center justify-between border ${
                    diff.isDiff
                      ? 'bg-cyan-950/20 border-cyan-500/30 text-white font-medium'
                      : 'bg-slate-950/40 border-slate-900 text-slate-400'
                  }`}
                >
                  <span className="text-slate-300 font-semibold">{diff.label}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className={diff.isDiff ? 'text-cyan-300 font-bold' : 'text-slate-400'}>
                      {String(diff.valA)}
                    </span>
                    <span className="text-slate-600">vs</span>
                    <span className={diff.isDiff ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                      {String(diff.valB)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500 text-xs bg-slate-900/40 rounded-xl border border-slate-800">
                No differences detected between selected targets.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 4. RECIPE SIDECAR (.JSON / .XMP) TAB */}
      {/* ---------------------------------------------------------------------- */}
      {activeSubTab === 'recipe' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          <div className="text-xs font-bold text-slate-300 pb-1 border-b border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
              Non-Destructive Recipe Sidecar (.json)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">v2.0 Spec</span>
          </div>

          <p className="text-[11px] text-slate-400">
            Export or import pure mathematical recipe instructions. You can apply this recipe to any other photo without touching master image pixels.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {/* Export Recipe Button */}
            <button
              onClick={() => handleExportRecipe()}
              className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left space-y-1.5 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Download className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Export Recipe</div>
              <div className="text-[10px] text-slate-400">Download .recipe.json sidecar file</div>
            </button>

            {/* Copy Recipe to Clipboard */}
            <button
              onClick={handleCopyRecipeToClipboard}
              className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left space-y-1.5 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Copy className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Copy Recipe</div>
              <div className="text-[10px] text-slate-400">Copy parameters to clipboard</div>
            </button>
          </div>

          {/* Import Recipe File */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-2">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Import Recipe Sidecar File</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Select a Lumina .json recipe or preset file to apply its color grading, curves, and settings to this photo.
            </p>
            <label className="block w-full text-center py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-md">
              <Upload className="w-3.5 h-3.5 inline-block mr-1.5" />
              Choose .recipe.json File
              <input
                type="file"
                accept=".json,.lumina"
                onChange={handleImportRecipeFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Export Profiles Shortcut */}
          {onOpenExportModal && (
            <button
              onClick={onOpenExportModal}
              className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-200 hover:text-white transition-all shadow-md group"
            >
              <div className="flex items-center gap-2">
                <FolderDown className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Open Multi-Profile Export Hub</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 5. PARAMETRIC PIPELINE INSPECTOR TAB */}
      {/* ---------------------------------------------------------------------- */}
      {activeSubTab === 'pipeline' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="text-xs font-bold text-slate-300 pb-1 border-b border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Non-Destructive GPU Pipeline Flow
            </span>
            <span className="text-[10px] text-indigo-400 font-mono font-bold">LIVE GPU</span>
          </div>

          <p className="text-[11px] text-slate-400">
            Every step is evaluated mathematically on the GPU without altering original image bits:
          </p>

          <div className="space-y-2">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Original Master Buffer</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {project.image.name} ({project.image.width} × {project.image.height} px)
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Untouched</span>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <div className="text-xs font-bold text-white">RAW Demosaic & Optics</div>
                  <div className="text-[10px] text-slate-400">
                    Lens Distortion, Chromatic Aberration, Temp ({project.currentSettings.temperature || 0}K)
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-400 font-mono">Parametric</span>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Curves & HSL Color Recipe</div>
                  <div className="text-[10px] text-slate-400">
                    Exposure ({project.currentSettings.exposure > 0 ? `+${project.currentSettings.exposure}` : project.currentSettings.exposure}), Contrast, Spline Curves
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-400 font-mono">Parametric</span>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Vector Retouch & Mask Layers</div>
                  <div className="text-[10px] text-slate-400">
                    {project.retouchStrokes?.length || 0} Retouch Strokes, {project.masks?.length || 0} Selective Masks
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-purple-400 font-mono">Vectors</span>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                  5
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Crop, Geometry & Graphics</div>
                  <div className="text-[10px] text-slate-400">
                    Crop ({Math.round(project.crop.width * 100)}% × {Math.round(project.crop.height * 100)}%), Rotate ({project.crop.rotation}°), {project.typography?.length || 0} Text Layers
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-cyan-400 font-mono">Dynamic</span>
            </div>

            <div className="p-3 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 rounded-xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                  6
                </div>
                <div>
                  <div className="text-xs font-black text-white">Rendered Output Result</div>
                  <div className="text-[10px] text-indigo-300">
                    Real-time GPU Viewport & High-Precision Export Engine
                  </div>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* SELECTIVE PARAMETER RESTORE (CHERRY-PICK) MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {cherryPickSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-md w-full p-5 rounded-2xl shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400">
                <SlidersHorizontal className="w-5 h-5" />
                <h4 className="text-sm font-black text-white">
                  Selective Attribute Merge
                </h4>
              </div>
              <button
                onClick={() => setCherryPickSnapshot(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Choose which parameters from <strong className="text-purple-300 font-bold">"{cherryPickSnapshot.name}"</strong> you want to apply to your current edit:
            </p>

            <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={cherryPickOptions.tone}
                  onChange={(e) => setCherryPickOptions({ ...cherryPickOptions, tone: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Basic Tone (Exposure, Contrast, Highlights, Shadows, Temp)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={cherryPickOptions.curves}
                  onChange={(e) => setCherryPickOptions({ ...cherryPickOptions, curves: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Tone Curves (RGB, Red, Green, Blue Splines)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={cherryPickOptions.hsl}
                  onChange={(e) => setCherryPickOptions({ ...cherryPickOptions, hsl: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>HSL Color Mixer (Hue, Saturation, Luminance channels)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={cherryPickOptions.preset}
                  onChange={(e) => setCherryPickOptions({ ...cherryPickOptions, preset: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Active Creative Filter / Film Profile</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={cherryPickOptions.crop}
                  onChange={(e) => setCherryPickOptions({ ...cherryPickOptions, crop: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Crop, Framing & Aspect Ratio</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={cherryPickOptions.masks}
                  onChange={(e) => setCherryPickOptions({ ...cherryPickOptions, masks: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Selective Masks & Local Adjustments ({cherryPickSnapshot.data.masks?.length || 0})</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={cherryPickOptions.retouch}
                  onChange={(e) => setCherryPickOptions({ ...cherryPickOptions, retouch: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Retouch & Blemish Healing Strokes</span>
              </label>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={handleApplyCherryPick}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-indigo-600/30"
              >
                Apply Selected Attributes
              </button>
              <button
                onClick={() => setCherryPickSnapshot(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* REVERT CONFIRMATION MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {showConfirmRevertModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-md w-full p-5 rounded-2xl shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">Revert to Untouched Master?</h4>
                <p className="text-[11px] text-slate-400">All current parametric adjustments will be reset to zero.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Data Loss Guarantee:</span>
              </div>
              <p className="text-[11px] text-slate-400">
                A backup snapshot of your current edits will be automatically saved in your <strong>Versions</strong> tab before resetting.
              </p>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={handleRevertToMaster}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-rose-600/30"
              >
                Yes, Revert to Original Master
              </button>
              <button
                onClick={() => setShowConfirmRevertModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
