import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  EditHistorySnapshot,
  Project,
  ProjectVersionBranch,
  NonDestructiveRecipe,
  AdjustmentSettings,
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
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  project,
  onRestoreSnapshot,
  onCreateSnapshot,
  onUpdateProject,
  showToast,
  onOpenExportModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'versions' | 'pipeline' | 'recipe'>('timeline');
  const [newVersionName, setNewVersionName] = useState('');
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [showConfirmRevertModal, setShowConfirmRevertModal] = useState(false);

  // Non-destructive stage bypass states (temporary parametric preview bypass)
  const [bypassColorGrading, setBypassColorGrading] = useState(false);
  const [bypassRetouch, setBypassRetouch] = useState(false);
  const [bypassMasks, setBypassMasks] = useState(false);
  const [bypassCrop, setBypassCrop] = useState(false);

  // Generate Non-Destructive Recipe JSON Object
  const generateRecipe = (): NonDestructiveRecipe => {
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
        adjustments: project.currentSettings,
        toneCurves: project.toneCurves,
        hsl: project.hsl,
        crop: project.crop,
        activePresetId: project.activePresetId,
        presetStrength: project.presetStrength,
        watermark: project.watermark,
        border: project.border,
        masks: project.masks,
        retouchStrokes: project.retouchStrokes,
        drawingStrokes: project.drawingStrokes,
        typography: project.typography,
        designElements: project.designElements,
      },
    };
  };

  // Export Non-Destructive Recipe File
  const handleExportRecipe = () => {
    const recipe = generateRecipe();
    const jsonStr = JSON.stringify(recipe, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = `${project.name.replace(/\.[^/.]+$/, '')}_recipe.json`;
    triggerDownload(url, filename);
    URL.revokeObjectURL(url);
    showToast?.('success', 'Recipe Exported', `Saved non-destructive sidecar "${filename}"`);
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
    onCreateSnapshot(`Pre-Revert Backup (${new Date().toLocaleTimeString()})`);

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
    onCreateSnapshot(newVersionName.trim());
    setNewVersionName('');
    setIsCreatingVersion(false);
    showToast?.('success', 'Version Created', `Saved version "${newVersionName.trim()}"`);
  };

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
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
        <button
          onClick={() => setActiveSubTab('timeline')}
          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'timeline'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Timeline</span>
        </button>

        <button
          onClick={() => setActiveSubTab('versions')}
          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'versions'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Versions</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pipeline')}
          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'pipeline'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Pipeline</span>
        </button>

        <button
          onClick={() => setActiveSubTab('recipe')}
          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'recipe'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>Recipe</span>
        </button>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 1. TIMELINE & UNDO/REDO TAB */}
      {/* ---------------------------------------------------------------------- */}
      {activeSubTab === 'timeline' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-slate-800">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Parametric History Stack ({project.history?.length || 0} Steps)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Step {(project.historyIndex ?? 0) + 1} of {project.history?.length || 1}
            </span>
          </div>

          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {project.history && project.history.length > 0 ? (
              project.history.map((step, idx) => {
                const isCurrent = idx === project.historyIndex;
                const isPast = idx < (project.historyIndex ?? 0);
                return (
                  <button
                    key={step.id || idx}
                    onClick={() => onRestoreSnapshot(step)}
                    className={`w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between border ${
                      isCurrent
                        ? 'bg-indigo-950/70 border-indigo-500/80 text-white font-bold shadow-md ring-1 ring-indigo-500/30'
                        : isPast
                        ? 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                        : 'bg-slate-950/40 border-slate-900 text-slate-500 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isCurrent
                            ? 'bg-indigo-400 ring-4 ring-indigo-400/30'
                            : isPast
                            ? 'bg-emerald-400'
                            : 'bg-slate-700'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-semibold">{step.label || 'Adjustment'}</div>
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
                              [ACTIVE STATE]
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] uppercase font-bold text-slate-500 hover:text-indigo-300 font-mono">
                      Jump →
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-900/40 rounded-xl border border-slate-800">
                No history steps yet. Make an edit to begin tracking.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 2. VERSION BRANCHES TAB */}
      {/* ---------------------------------------------------------------------- */}
      {activeSubTab === 'versions' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-slate-800">
            <span className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-purple-400" />
              Creative Version Branches
            </span>
            <span className="text-[10px] text-slate-500">Non-destructive variations</span>
          </div>

          {/* Create Version Branch Form */}
          {isCreatingVersion ? (
            <form
              onSubmit={handleCreateVersion}
              className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-2.5"
            >
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-purple-400" />
                <span>Save New Version Branch</span>
              </div>
              <input
                type="text"
                placeholder="Version name (e.g. Version 2 - High Key Monochrome)"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-lg outline-none focus:border-purple-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors shadow-md"
                >
                  Save Version
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingVersion(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreatingVersion(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-xs font-bold text-purple-200 hover:text-white transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Branch New Version Snapshot</span>
            </button>
          )}

          {/* Version List */}
          <div className="space-y-2">
            {project.snapshots && project.snapshots.length > 0 ? (
              project.snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="p-3 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                      <Bookmark className="w-3 h-3 text-purple-400" />
                      <span>{snap.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
                      <span>{new Date(snap.timestamp).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        onRestoreSnapshot(snap.data);
                        showToast?.('success', 'Version Loaded', `Switched to version "${snap.name}"`);
                      }}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-bold transition-colors shadow-sm"
                    >
                      Switch
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-5 text-center text-slate-500 text-xs bg-slate-900/40 rounded-xl border border-slate-800">
                No version branches yet. Create one to keep multiple creative directions for this photo.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 3. PARAMETRIC PIPELINE INSPECTOR TAB */}
      {/* ---------------------------------------------------------------------- */}
      {activeSubTab === 'pipeline' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="text-xs font-bold text-slate-300 pb-1 border-b border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Non-Destructive Render Pipeline Flow
            </span>
            <span className="text-[10px] text-indigo-400 font-mono font-bold">LIVE GPU</span>
          </div>

          <p className="text-[11px] text-slate-400">
            Every step is calculated live on the original image buffer in the GPU pipeline:
          </p>

          {/* Pipeline Flow Stages */}
          <div className="space-y-2">
            {/* Stage 1: Original Master File */}
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

            {/* Stage 2: RAW / Camera Profile & White Balance */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <div className="text-xs font-bold text-white">RAW Demosaic & Optics</div>
                  <div className="text-[10px] text-slate-400">
                    Lens Distortion, Chromatic Aberration, Temp ({project.currentSettings.temperature || 0})
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-400 font-mono">Parametric</span>
            </div>

            {/* Stage 3: Global Tone & Color Grading */}
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

            {/* Stage 4: Retouch & Selective Masks */}
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

            {/* Stage 5: Crop, Transform & Typography */}
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

            {/* Stage 6: Final Rendered Result */}
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
            Export or import the pure mathematical recipe instructions. You can apply this recipe to any other photo without touching the master image pixels.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {/* Export Recipe Button */}
            <button
              onClick={handleExportRecipe}
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

      {/* Revert Confirmation Modal */}
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
                A backup snapshot of your current edits will be automatically saved in your <strong>Versions & Snapshots</strong> tab before resetting.
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
