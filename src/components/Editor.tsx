import React, { useState, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  Sliders,
  RotateCcw,
  Palette,
  Eye,
  Wand2,
} from 'lucide-react';
import {
  AdjustmentSettings,
  BorderSettings,
  CropSettings,
  EditHistorySnapshot,
  FilterPreset,
  HSLSettings,
  Project,
  SelectiveMask,
  ToneCurves,
  WatermarkSettings,
} from '../types/editor';
import { CanvasViewport } from './editor/CanvasViewport';
import { HistogramView } from './editor/HistogramView';
import { ToolTabs } from './editor/ToolTabs';
import { PresetsPanel } from './editor/panels/PresetsPanel';
import { AdjustPanel } from './editor/panels/AdjustPanel';
import { CurvesPanel } from './editor/panels/CurvesPanel';
import { HSLPanel } from './editor/panels/HSLPanel';
import { CropPanel } from './editor/panels/CropPanel';
import { AIToolsPanel } from './editor/panels/AIToolsPanel';
import { MasksPanel } from './editor/panels/MasksPanel';
import { LayersPanel } from './editor/panels/LayersPanel';
import { WatermarkPanel } from './editor/panels/WatermarkPanel';
import { HistoryPanel } from './editor/panels/HistoryPanel';
import { RawOpticsPanel } from './editor/panels/RawOpticsPanel';
import { DetailPanel } from './editor/panels/DetailPanel';
import { BlurDepthPanel } from './editor/panels/BlurDepthPanel';
import { parseImageOrRawFile } from '../engine/rawParser';
import { DEFAULT_ADJUSTMENTS, DEFAULT_CROP, DEFAULT_HSL, DEFAULT_PROJECT_STATE, DEFAULT_TONE_CURVES } from '../engine/defaultSettings';
import { getAllCustomPresetsFromDB, saveCustomPresetToDB, saveProjectToDB } from '../storage/db';
import { requestAiAutoEnhance } from '../services/aiService';

interface EditorProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onOpenSampleGallery: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const Editor: React.FC<EditorProps> = ({
  project,
  onUpdateProject,
  onOpenSampleGallery,
  showToast,
}) => {
  const [activeToolTab, setActiveToolTab] = useState<string>('adjust');
  const [customPresets, setCustomPresets] = useState<FilterPreset[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);

  // Load user's saved custom presets from IndexedDB
  useEffect(() => {
    getAllCustomPresetsFromDB().then((list) => setCustomPresets(list));
  }, []);

  // Push new state to history stack helper
  const pushHistoryStep = useCallback(
    (label: string, partial: Partial<Project>) => {
      const updatedProject: Project = {
        ...project,
        ...partial,
        updatedAt: Date.now(),
        cloudSyncStatus: project.cloudSyncStatus === 'synced' ? 'local-only' : project.cloudSyncStatus,
      };

      const newStep: EditHistorySnapshot = {
        id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        label,
        settings: { ...updatedProject.currentSettings },
        toneCurves: { ...updatedProject.toneCurves },
        hsl: { ...updatedProject.hsl },
        crop: { ...updatedProject.crop },
        activePresetId: updatedProject.activePresetId,
        presetStrength: updatedProject.presetStrength,
        watermark: { ...updatedProject.watermark },
        border: { ...updatedProject.border },
        masks: [...(updatedProject.masks || [])],
      };

      // Truncate forward history if we made an edit in the past
      const currentHistory = project.history || [];
      const newHistory = currentHistory.slice(0, (project.historyIndex ?? currentHistory.length - 1) + 1);
      newHistory.push(newStep);

      // Keep max 40 history states to avoid memory bloat
      if (newHistory.length > 40) newHistory.shift();

      updatedProject.history = newHistory;
      updatedProject.historyIndex = newHistory.length - 1;

      onUpdateProject(updatedProject);
      saveProjectToDB(updatedProject);
    },
    [project, onUpdateProject]
  );

  // File Upload Handler (JPEG, PNG, WebP, TIFF, RAW .CR2, .NEF, .ARW, .DNG)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    try {
      showToast('info', 'Importing Photo', `Decoding ${file.name}...`);
      const parsed = await parseImageOrRawFile(file);

      const newProject: Project = {
        ...DEFAULT_PROJECT_STATE,
        id: `proj_${Date.now()}`,
        name: file.name,
        image: parsed.imageFile,
        updatedAt: Date.now(),
        createdAt: Date.now(),
        history: [
          {
            id: 'step_init',
            timestamp: Date.now(),
            label: `Opened ${file.name}`,
            settings: { ...DEFAULT_PROJECT_STATE.currentSettings },
            toneCurves: { ...DEFAULT_PROJECT_STATE.toneCurves },
            hsl: { ...DEFAULT_PROJECT_STATE.hsl },
            crop: { ...DEFAULT_PROJECT_STATE.crop },
            activePresetId: null,
            presetStrength: 100,
            watermark: { ...DEFAULT_PROJECT_STATE.watermark },
            border: { ...DEFAULT_PROJECT_STATE.border },
            masks: [],
          },
        ],
        historyIndex: 0,
      };

      onUpdateProject(newProject);
      saveProjectToDB(newProject);
      if (parsed.metadata.isRaw) {
        setActiveToolTab('raw-optics');
      }
      showToast('success', 'Photo Loaded', `Imported ${parsed.imageFile.width} × ${parsed.imageFile.height} px`);
    } catch (err: any) {
      showToast('error', 'Import Failed', err.message);
    }
  };

  // 1. Update Adjustments
  const handleUpdateAdjustments = (newSettings: AdjustmentSettings) => {
    onUpdateProject({
      ...project,
      currentSettings: newSettings,
      updatedAt: Date.now(),
    });
  };

  // 2. Update Tone Curves
  const handleUpdateCurves = (newCurves: ToneCurves) => {
    onUpdateProject({
      ...project,
      toneCurves: newCurves,
      updatedAt: Date.now(),
    });
  };

  // 3. Update HSL
  const handleUpdateHSL = (newHsl: HSLSettings) => {
    onUpdateProject({
      ...project,
      hsl: newHsl,
      updatedAt: Date.now(),
    });
  };

  // 4. Update Crop & Rotation
  const handleUpdateCrop = (newCrop: CropSettings) => {
    pushHistoryStep('Transformed Crop / Orientation', { crop: newCrop });
  };

  // 5. Select Preset
  const handleSelectPreset = (presetId: string | null) => {
    pushHistoryStep(presetId ? `Applied Preset` : 'Reset Preset', {
      activePresetId: presetId,
    });
  };

  // 6. Update Preset Strength
  const handleChangePresetStrength = (strength: number) => {
    onUpdateProject({
      ...project,
      presetStrength: strength,
      updatedAt: Date.now(),
    });
  };

  // 7. Save Custom Preset
  const handleSaveCustomPreset = async (name: string) => {
    const custom: FilterPreset = {
      id: `custom_${Date.now()}`,
      name,
      category: 'Custom',
      description: 'User created color profile',
      thumbnailGradient: 'from-amber-500 to-indigo-600',
      settings: { ...project.currentSettings },
    };

    await saveCustomPresetToDB(custom);
    setCustomPresets((prev) => [custom, ...prev]);
    showToast('success', 'Custom Preset Saved', `Saved "${name}" to your preset library.`);
  };

  // 8. Update Image URL (e.g. after AI inpainting, background replacement)
  const handleUpdateImageUrl = (newUrl: string, name?: string) => {
    const updatedImg = {
      ...project.image,
      originalUrl: newUrl,
    };
    pushHistoryStep(name || 'AI Image Transformation', { image: updatedImg });
  };

  // 9. Restore Snapshot
  const handleRestoreSnapshot = (snapshot: EditHistorySnapshot) => {
    const restored: Project = {
      ...project,
      currentSettings: { ...snapshot.settings },
      toneCurves: { ...snapshot.toneCurves },
      hsl: { ...snapshot.hsl },
      crop: { ...snapshot.crop },
      activePresetId: snapshot.activePresetId,
      presetStrength: snapshot.presetStrength ?? 100,
      updatedAt: Date.now(),
    };
    onUpdateProject(restored);
    saveProjectToDB(restored);
    showToast('info', 'State Restored', `Restored "${snapshot.label || 'snapshot'}"`);
  };

  // 10. Create Snapshot
  const handleCreateSnapshot = (name: string) => {
    const newSnapshot = {
      id: `snap_${Date.now()}`,
      name,
      timestamp: Date.now(),
      data: {
        id: `snap_step_${Date.now()}`,
        timestamp: Date.now(),
        label: name,
        settings: { ...project.currentSettings },
        toneCurves: { ...project.toneCurves },
        hsl: { ...project.hsl },
        crop: { ...project.crop },
        activePresetId: project.activePresetId,
        presetStrength: project.presetStrength,
        watermark: { ...project.watermark },
        border: { ...project.border },
        masks: [...(project.masks || [])],
      },
    };

    const updatedSnapshots = [...(project.snapshots || []), newSnapshot];
    onUpdateProject({
      ...project,
      snapshots: updatedSnapshots,
    });
    saveProjectToDB({
      ...project,
      snapshots: updatedSnapshots,
    });
    showToast('success', 'Snapshot Created', `Created checkpoint "${name}"`);
  };

  // 11. Reset Adjustments
  const handleResetAdjustments = () => {
    pushHistoryStep('Reset Adjustments', {
      currentSettings: DEFAULT_ADJUSTMENTS,
      toneCurves: DEFAULT_TONE_CURVES,
      hsl: DEFAULT_HSL,
      activePresetId: null,
      presetStrength: 100,
    });
    showToast('info', 'Adjustments Reset', 'Reverted color parameters to default values.');
  };

  // 12. Active Mask & Layer Selection State
  const [activeMaskId, setActiveMaskId] = useState<string | null>(null);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  // If no photo is loaded yet, display rich drag & drop welcome landing
  if (!project.image?.originalUrl) {
    return (
      <div className="flex-1 h-full bg-slate-950 flex flex-col items-center justify-center p-6 select-none">
        <div className="max-w-xl w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-bold shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Next-Gen Pro Photo Studio</span>
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Professional Editing, RAW Engine & AI
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              Non-destructive color grading, 14-bit RAW processing, AI object removal, background replacement, and lossless master exports.
            </p>
          </div>

          {/* Big Drag and Drop Dropzone */}
          <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/80 bg-slate-900/40 hover:bg-slate-900/80 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
              Open Image or RAW Sensor File
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Supports DNG, CR2, CR3, NEF, ARW, RAF, ORF, RW2, PEF, TIFF, PNG, JPEG (Up to 100 MP)
            </div>

            <input
              type="file"
              accept="image/*,.dng,.cr2,.cr3,.nef,.arw,.raf,.orf,.rw2,.pef,.srw,.raw,.tiff,.tif"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Quick Demo Gallery Button */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <span className="text-xs text-slate-500">or start with high-res sample photos:</span>
            <button
              onClick={onOpenSampleGallery}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-amber-300 hover:border-amber-500/40 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Browse Demo Gallery</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col lg:flex-row overflow-hidden bg-slate-950 select-none">
      {/* Center Interactive Canvas Viewport */}
      <div className="flex-1 h-full flex flex-col min-w-0">
        <CanvasViewport
          project={project}
          onUpdateSettings={handleUpdateAdjustments}
          onUpdateCrop={handleUpdateCrop}
          onUpdateImage={handleUpdateImageUrl}
          onUpdateMasks={(newMasks) => pushHistoryStep('Updated Masks', { masks: newMasks })}
          activeMaskId={activeMaskId}
          onSelectMask={setActiveMaskId}
          onUpdateLayers={(newLayers) => pushHistoryStep('Updated Layers', { layers: newLayers })}
          activeLayerId={activeLayerId}
          onSelectLayer={setActiveLayerId}
          activeToolTab={activeToolTab}
          isAiProcessing={isAiProcessing}
          setIsAiProcessing={setIsAiProcessing}
          showToast={showToast}
        />
      </div>

      {/* Right Side Tools & Adjustments Studio Sidebar */}
      <aside className="w-full lg:w-84 xl:w-96 bg-slate-950/95 border-t lg:border-t-0 lg:border-l border-slate-800/80 flex flex-col shrink-0 h-80 lg:h-full z-10 shadow-2xl">
        {/* Real-time RGB Histogram & Camera EXIF Bar */}
        <HistogramView metadata={project.image.rawMetadata} />

        {/* Studio Tool Switcher Navigation Tabs */}
        <ToolTabs activeTab={activeToolTab} onSelectTab={setActiveToolTab} />

        {/* Tool Active Panel Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeToolTab === 'raw-optics' && (
            <RawOpticsPanel
              adjustments={project.currentSettings}
              metadata={project.image.rawMetadata}
              onChangeAdjustments={handleUpdateAdjustments}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'presets' && (
            <PresetsPanel
              activePresetId={project.activePresetId}
              presetStrength={project.presetStrength ?? 100}
              customPresets={customPresets}
              onSelectPreset={handleSelectPreset}
              onChangeStrength={handleChangePresetStrength}
              onSaveAsCustomPreset={handleSaveCustomPreset}
            />
          )}

          {activeToolTab === 'adjust' && (
            <AdjustPanel
              adjustments={project.currentSettings}
              onChange={handleUpdateAdjustments}
              onResetAdjustments={handleResetAdjustments}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'detail' && (
            <DetailPanel
              adjustments={project.currentSettings}
              onChange={handleUpdateAdjustments}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'blur-depth' && (
            <BlurDepthPanel
              adjustments={project.currentSettings}
              onChange={handleUpdateAdjustments}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'curves' && (
            <CurvesPanel
              toneCurves={project.toneCurves}
              onChange={handleUpdateCurves}
            />
          )}

          {activeToolTab === 'hsl' && (
            <HSLPanel
              adjustments={project.currentSettings}
              hsl={project.hsl}
              toneCurves={project.toneCurves}
              onChange={handleUpdateHSL}
              onUpdateAdjustments={handleUpdateAdjustments}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'crop' && (
            <CropPanel
              crop={project.crop}
              border={project.border}
              imageWidth={project.image.width}
              imageHeight={project.image.height}
              onChange={handleUpdateCrop}
              onChangeBorder={(b) => pushHistoryStep('Updated Frame / Border', { border: b })}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'ai-tools' && (
            <AIToolsPanel
              project={project}
              onUpdateSettings={handleUpdateAdjustments}
              onUpdateImage={handleUpdateImageUrl}
              isAiProcessing={isAiProcessing}
              setIsAiProcessing={setIsAiProcessing}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'masks' && (
            <MasksPanel
              masks={project.masks || []}
              onChange={(newMasks) => pushHistoryStep('Updated Masks', { masks: newMasks })}
              activeMaskId={activeMaskId}
              onSelectMask={setActiveMaskId}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'layers' && (
            <LayersPanel
              layers={project.layers || []}
              onChange={(newLayers) => pushHistoryStep('Updated Layers', { layers: newLayers })}
              activeLayerId={activeLayerId}
              onSelectLayer={setActiveLayerId}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'watermark' && (
            <WatermarkPanel
              watermark={project.watermark}
              border={project.border}
              onChangeWatermark={(w) => onUpdateProject({ ...project, watermark: w })}
              onChangeBorder={(b) => onUpdateProject({ ...project, border: b })}
            />
          )}

          {activeToolTab === 'history' && (
            <HistoryPanel
              project={project}
              onRestoreSnapshot={handleRestoreSnapshot}
              onCreateSnapshot={handleCreateSnapshot}
            />
          )}
        </div>
      </aside>
    </div>
  );
};
