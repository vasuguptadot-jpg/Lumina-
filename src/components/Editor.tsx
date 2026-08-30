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
  RetouchStroke,
  RetouchToolType,
  TypographyItem,
  DesignElementItem,
  CollageSettings,
  DrawingStroke,
  DrawingToolType,
  DrawingShapeType,
  CustomBrushType,
  LayerBlendMode,
  ComparisonViewMode,
  ColorManagementSettings,
} from '../types/editor';
import { CanvasViewport } from './editor/CanvasViewport';
import { HistogramView } from './editor/HistogramView';
import { ToolTabs } from './editor/ToolTabs';
import { ComparisonPanel } from './editor/panels/ComparisonPanel';
import { ColorManagementPanel } from './editor/panels/ColorManagementPanel';
import { PresetsPanel } from './editor/panels/PresetsPanel';
import { FilmSimulationPanel } from './editor/panels/FilmSimulationPanel';
import { TypographyPanel } from './editor/panels/TypographyPanel';
import { GraphicsDesignPanel } from './editor/panels/GraphicsDesignPanel';
import { CollagePanel } from './editor/panels/CollagePanel';
import { DrawingPanel } from './editor/panels/DrawingPanel';
import { AdjustPanel } from './editor/panels/AdjustPanel';
import { EffectsPanel } from './editor/panels/EffectsPanel';
import { LightingPanel } from './editor/panels/LightingPanel';
import { PortraitPanel } from './editor/panels/PortraitPanel';
import { BodyPanel } from './editor/panels/BodyPanel';
import { SkyPanel } from './editor/panels/SkyPanel';
import { GeometryPanel } from './editor/panels/GeometryPanel';
import { RetouchPanel } from './editor/panels/RetouchPanel';
import { CurvesPanel } from './editor/panels/CurvesPanel';
import { HSLPanel } from './editor/panels/HSLPanel';
import { CropPanel } from './editor/panels/CropPanel';
import { AIToolsPanel } from './editor/panels/AIToolsPanel';
import { MasksPanel } from './editor/panels/MasksPanel';
import { LayersPanel } from './editor/panels/LayersPanel';
import { WatermarkPanel } from './editor/panels/WatermarkPanel';
import { HistoryPanel } from './editor/panels/HistoryPanel';
import { MetadataPanel } from './editor/panels/MetadataPanel';
import { RawOpticsPanel } from './editor/panels/RawOpticsPanel';
import { DetailPanel } from './editor/panels/DetailPanel';
import { BlurDepthPanel } from './editor/panels/BlurDepthPanel';
import { AIImageUnderstandingPanel } from './editor/panels/AIImageUnderstandingPanel';
import { AINativeArchitecturePanel } from './editor/panels/AINativeArchitecturePanel';
import { NaturalLanguageEditingPanel } from './editor/panels/NaturalLanguageEditingPanel';
import { NaturalLanguageEditorBar } from './editor/NaturalLanguageEditorBar';
import { CompositionAssistantPanel } from './editor/panels/CompositionAssistantPanel';
import { ScreenshotStudioPanel } from './editor/panels/ScreenshotStudioPanel';
import { parseImageOrRawFile } from '../engine/rawParser';
import { DEFAULT_ADJUSTMENTS, DEFAULT_CROP, DEFAULT_HSL, DEFAULT_PROJECT_STATE, DEFAULT_TONE_CURVES } from '../engine/defaultSettings';
import { getAllCustomPresetsFromDB, saveCustomPresetToDB, deleteCustomPresetFromDB, saveBatchCustomPresetsToDB, saveProjectToDB } from '../storage/db';
import { requestAiAutoEnhance } from '../services/aiService';
import { CollaborationPanel } from './editor/panels/CollaborationPanel';
import { PluginsPanel } from './editor/panels/PluginsPanel';
import { AutomationPanel } from './editor/panels/AutomationPanel';
import { DeveloperPanel } from './editor/panels/DeveloperPanel';
import { SecurityPrivacyPanel } from './editor/panels/SecurityPrivacyPanel';
import { PerformancePanel } from './editor/panels/PerformancePanel';
import { CanvasCommentsOverlay } from './collaboration/CanvasCommentsOverlay';
import { DesktopStatusBar } from './navigation/DesktopStatusBar';
import { User } from 'firebase/auth';
import { WorkflowStageId } from '../types/workflow';

interface EditorProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onOpenSampleGallery: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
  onOpenExportModal?: () => void;
  currentUser?: User | null;
  activeStage?: WorkflowStageId;
  requestedToolTab?: string;
  skillMode?: 'beginner' | 'pro';
  onOpenToolEducation?: (toolId: string) => void;
  onOpenCollaborationModal?: () => void;
  onOpenVersionComparison?: () => void;
  onOpenClientReview?: () => void;
  onOpenPluginModal?: () => void;
  onOpenAutomationStudio?: () => void;
  onOpenDeveloperPlatform?: () => void;
  onOpenSecurityGovernance?: () => void;
  onOpenPerformanceModal?: () => void;
  onOpenUnsplashModal?: () => void;
  isCommentModeActive?: boolean;
  onToggleCommentMode?: () => void;
}

export const Editor: React.FC<EditorProps> = ({
  project,
  onUpdateProject,
  onOpenSampleGallery,
  showToast,
  onOpenExportModal,
  currentUser = null,
  activeStage = 'develop',
  requestedToolTab,
  skillMode = 'pro',
  onOpenToolEducation,
  onOpenCollaborationModal = () => {},
  onOpenVersionComparison = () => {},
  onOpenClientReview = () => {},
  onOpenPluginModal = () => {},
  onOpenAutomationStudio = () => {},
  onOpenDeveloperPlatform = () => {},
  onOpenSecurityGovernance = () => {},
  onOpenPerformanceModal = () => {},
  onOpenUnsplashModal = () => {},
  isCommentModeActive = false,
  onToggleCommentMode = () => {},
}) => {
  const [activeToolTab, setActiveToolTab] = useState<string>('adjust');

  useEffect(() => {
    if (requestedToolTab) {
      setActiveToolTab(requestedToolTab);
    }
  }, [requestedToolTab]);
  const [customPresets, setCustomPresets] = useState<FilterPreset[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);

  // Sync tool tab with workflow stage change
  useEffect(() => {
    switch (activeStage) {
      case 'develop':
        setActiveToolTab('adjust');
        break;
      case 'select':
        setActiveToolTab('composition');
        break;
      case 'mask':
        setActiveToolTab('masks');
        break;
      case 'retouch':
        setActiveToolTab('retouch');
        break;
      case 'layers':
        setActiveToolTab('layers');
        break;
      case 'ai':
        setActiveToolTab('ai-tools');
        break;
      case 'design':
        setActiveToolTab('typography');
        break;
      default:
        break;
    }
  }, [activeStage]);

  // Retouching Studio State
  const [activeRetouchTool, setActiveRetouchTool] = useState<RetouchToolType>('healing-brush');
  const [retouchBrushRadius, setRetouchBrushRadius] = useState<number>(28);
  const [retouchBrushFeather, setRetouchBrushFeather] = useState<number>(60);
  const [retouchBrushOpacity, setRetouchBrushOpacity] = useState<number>(100);
  const [cloneSource, setCloneSource] = useState<{ x: number; y: number } | null>(null);
  const [isSettingCloneSource, setIsSettingCloneSource] = useState<boolean>(false);

  // Drawing & Painting Studio State
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolType>('brush');
  const [drawingBrushSize, setDrawingBrushSize] = useState<number>(16);
  const [drawingBrushOpacity, setDrawingBrushOpacity] = useState<number>(100);
  const [drawingBrushFlow, setDrawingBrushFlow] = useState<number>(100);
  const [drawingBrushHardness, setDrawingBrushHardness] = useState<number>(80);
  const [drawingBrushSmoothing, setDrawingBrushSmoothing] = useState<number>(25);
  const [drawingPressureSensitivity, setDrawingPressureSensitivity] = useState<boolean>(true);
  const [drawingBrushColor, setDrawingBrushColor] = useState<string>('#6366f1');
  const [drawingActiveShape, setDrawingActiveShape] = useState<DrawingShapeType>('arrow');
  const [drawingShapeFilled, setDrawingShapeFilled] = useState<boolean>(false);
  const [drawingShapeFillColor, setDrawingShapeFillColor] = useState<string>('#6366f1');
  const [drawingActiveCustomBrush, setDrawingActiveCustomBrush] = useState<CustomBrushType>('neon-glow');
  const [drawingGlowEnabled, setDrawingGlowEnabled] = useState<boolean>(false);
  const [drawingGlowColor, setDrawingGlowColor] = useState<string>('#a855f7');
  const [drawingGlowRadius, setDrawingGlowRadius] = useState<number>(15);
  const [drawingBlendMode, setDrawingBlendMode] = useState<LayerBlendMode>('normal');
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);
  const [recentDrawingColors, setRecentDrawingColors] = useState<string[]>([
    '#ffffff',
    '#000000',
    '#ef4444',
    '#f59e0b',
    '#10b981',
    '#06b6d4',
    '#6366f1',
    '#ec4899',
  ]);

  // Before / After Comparison System State
  const [comparisonMode, setComparisonMode] = useState<ComparisonViewMode>('off');
  const [splitPos, setSplitPos] = useState<number>(0.5);
  const [isShowingBeforeToggle, setIsShowingBeforeToggle] = useState<boolean>(false);
  const [isHoldingBefore, setIsHoldingBefore] = useState<boolean>(false);
  const [opacityBlend, setOpacityBlend] = useState<number>(50);
  const [differenceAmp, setDifferenceAmp] = useState<number>(2);

  const handleSelectDrawingColor = (color: string) => {
    setDrawingBrushColor(color);
    setRecentDrawingColors((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== color.toLowerCase());
      return [color, ...filtered].slice(0, 14);
    });
  };

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
        typography: [...(updatedProject.typography || [])],
        designElements: [...(updatedProject.designElements || [])],
        retouchStrokes: [...(updatedProject.retouchStrokes || [])],
        drawingStrokes: [...(updatedProject.drawingStrokes || [])],
        collage: updatedProject.collage ? { ...updatedProject.collage } : undefined,
      };

      // Truncate forward history if we made an edit in the past
      const currentHistory = project.history || [];
      const newHistory = currentHistory.slice(0, (project.historyIndex ?? currentHistory.length - 1) + 1);
      newHistory.push(newStep);

      // Keep high-capacity history states (150 steps) for unlimited undo/redo depth
      if (newHistory.length > 150) newHistory.shift();

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

  // 1b. Update Color Management & Soft Proofing Settings
  const handleUpdateColorManagement = (newSettings: ColorManagementSettings) => {
    onUpdateProject({
      ...project,
      colorManagement: newSettings,
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
  const handleSaveCustomPreset = async (name: string, presetData?: Partial<FilterPreset>) => {
    const custom: FilterPreset = {
      id: `custom_${Date.now()}`,
      name,
      category: 'Custom',
      description: presetData?.description || 'User created color profile',
      thumbnailGradient: presetData?.thumbnailGradient || 'from-amber-500 to-indigo-600',
      settings: presetData?.settings ? { ...presetData.settings } : { ...project.currentSettings },
      hsl: presetData?.hsl ? { ...presetData.hsl } : { ...project.hsl },
      toneCurves: presetData?.toneCurves ? { ...presetData.toneCurves } : { ...project.toneCurves },
    };

    await saveCustomPresetToDB(custom);
    setCustomPresets((prev) => [custom, ...prev]);
    showToast('success', 'Custom Preset Saved', `Saved "${name}" to your preset library.`);
  };

  const handleUpdateCustomPreset = async (preset: FilterPreset) => {
    await saveCustomPresetToDB(preset);
    setCustomPresets((prev) => prev.map((p) => (p.id === preset.id ? preset : p)));
    showToast('success', 'Preset Updated', `Saved changes to "${preset.name}".`);
  };

  const handleDeleteCustomPreset = async (presetId: string) => {
    await deleteCustomPresetFromDB(presetId);
    setCustomPresets((prev) => prev.filter((p) => p.id !== presetId));
    if (project.activePresetId === presetId) {
      handleSelectPreset(null);
    }
    showToast('info', 'Preset Removed', 'Custom preset deleted.');
  };

  const handleBatchImportPresets = async (presets: FilterPreset[]) => {
    await saveBatchCustomPresetsToDB(presets);
    setCustomPresets((prev) => [...presets, ...prev]);
    showToast('success', 'Presets Imported', `Imported ${presets.length} presets into your library.`);
  };

  // 7b. Bake Preset into Base Adjustments
  const handleApplyPresetToBaseSettings = (preset: FilterPreset, strength: number = 100) => {
    const factor = strength / 100;
    const adj = { ...project.currentSettings };
    const pSet = preset.settings;

    if (pSet.exposure !== undefined) adj.exposure = (adj.exposure || 0) + pSet.exposure * factor;
    if (pSet.contrast !== undefined) adj.contrast = (adj.contrast || 0) + pSet.contrast * factor;
    if (pSet.highlights !== undefined) adj.highlights = (adj.highlights || 0) + pSet.highlights * factor;
    if (pSet.shadows !== undefined) adj.shadows = (adj.shadows || 0) + pSet.shadows * factor;
    if (pSet.whites !== undefined) adj.whites = (adj.whites || 0) + pSet.whites * factor;
    if (pSet.blacks !== undefined) adj.blacks = (adj.blacks || 0) + pSet.blacks * factor;
    if (pSet.temperature !== undefined) adj.temperature = (adj.temperature || 0) + pSet.temperature * factor;
    if (pSet.tint !== undefined) adj.tint = (adj.tint || 0) + pSet.tint * factor;
    if (pSet.saturation !== undefined) adj.saturation = (adj.saturation || 0) + pSet.saturation * factor;
    if (pSet.vibrance !== undefined) adj.vibrance = (adj.vibrance || 0) + pSet.vibrance * factor;
    if (pSet.clarity !== undefined) adj.clarity = (adj.clarity || 0) + pSet.clarity * factor;
    if (pSet.texture !== undefined) adj.texture = (adj.texture || 0) + pSet.texture * factor;
    if (pSet.sharpness !== undefined) adj.sharpness = (adj.sharpness || 0) + pSet.sharpness * factor;
    if (pSet.dehaze !== undefined) adj.dehaze = (adj.dehaze || 0) + pSet.dehaze * factor;
    if (pSet.filmGrain !== undefined) adj.filmGrain = (adj.filmGrain || 0) + pSet.filmGrain * factor;
    if (pSet.vignette !== undefined) adj.vignette = (adj.vignette || 0) + pSet.vignette * factor;
    if (pSet.splitToning) {
      adj.splitToning = {
        shadowHue: pSet.splitToning.shadowHue,
        shadowSat: (pSet.splitToning.shadowSat || 0) * factor,
        highlightHue: pSet.splitToning.highlightHue,
        highlightSat: (pSet.splitToning.highlightSat || 0) * factor,
        balance: pSet.splitToning.balance,
      };
    }

    let updatedHsl = { ...project.hsl };
    if (preset.hsl) {
      const merged: any = { ...project.hsl };
      for (const [chan, vals] of Object.entries(preset.hsl)) {
        if (vals && merged[chan]) {
          merged[chan] = {
            hue: merged[chan].hue + (vals.hue || 0) * factor,
            saturation: merged[chan].saturation + (vals.saturation || 0) * factor,
            luminance: merged[chan].luminance + (vals.luminance || 0) * factor,
          };
        }
      }
      updatedHsl = merged;
    }

    pushHistoryStep(`Baked Filter: ${preset.name}`, {
      currentSettings: adj,
      hsl: updatedHsl,
      activePresetId: null,
      presetStrength: 100,
    });
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
      watermark: { ...snapshot.watermark },
      border: { ...snapshot.border },
      masks: snapshot.masks ? [...snapshot.masks] : [],
      layers: snapshot.layers ? [...snapshot.layers] : [],
      typography: snapshot.typography ? [...snapshot.typography] : [],
      designElements: snapshot.designElements ? [...snapshot.designElements] : [],
      retouchStrokes: snapshot.retouchStrokes ? [...snapshot.retouchStrokes] : [],
      collage: snapshot.collage ? { ...snapshot.collage } : undefined,
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
        layers: [...(project.layers || [])],
        typography: [...(project.typography || [])],
        retouchStrokes: [...(project.retouchStrokes || [])],
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
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);

  // If no photo is loaded yet, display rich drag & drop welcome landing
  if (!project.image?.originalUrl) {
    return (
      <div className="flex-1 h-full bg-[#050505] flex flex-col items-center justify-center p-6 select-none font-sans text-[#E6E3DE]">
        <div className="max-w-xl w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#050505] border border-[rgba(230,227,222,0.15)] text-[#E6E3DE] text-xs font-mono">
            <Sliders className="w-3.5 h-3.5 text-[#7A0F18]" />
            <span>LUMINA WORKSTATION • ZERO DATA LOSS CERTIFIED</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#E6E3DE]">
              Professional RAW & Color Workstation
            </h1>
            <p className="text-xs sm:text-sm text-[rgba(230,227,222,0.70)] mt-2 max-w-md mx-auto leading-relaxed">
              Deterministic 32-bit floating-point image pipeline, 100+ RAW camera sensor profiles, selective neural masking, and lossless master exports.
            </p>
          </div>

          {/* Big Drag and Drop Dropzone */}
          <label className="border-2 border-dashed border-[rgba(230,227,222,0.15)] hover:border-[#7A0F18] bg-[#050505] hover:bg-[rgba(230,227,222,0.04)] rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer transition-colors group shadow-2xl">
            <div className="w-14 h-14 rounded-lg bg-[#050505] border border-[rgba(230,227,222,0.15)] flex items-center justify-center text-[#E6E3DE] group-hover:border-[#7A0F18] transition-colors mb-4">
              <UploadCloud className="w-7 h-7 text-[#7A0F18]" />
            </div>

            <div className="text-xs sm:text-sm font-semibold text-[#E6E3DE] group-hover:text-[#E6E3DE] transition-colors">
              Open Master Image or RAW Sensor File
            </div>
            <div className="text-[11px] font-mono text-[rgba(230,227,222,0.45)] mt-1">
              Supports DNG, CR2, CR3, NEF, ARW, RAF, ORF, RW2, PEF, TIFF, PNG, JPEG
            </div>

            <input
              type="file"
              accept="image/*,.dng,.cr2,.cr3,.nef,.arw,.raf,.orf,.rw2,.pef,.srw,.raw,.tiff,.tif"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Quick Demo Gallery Button */}
          <div className="pt-2 flex items-center justify-center gap-3 font-mono text-xs">
            <span className="text-[rgba(230,227,222,0.45)]">or load calibrated reference asset:</span>
            <button
              onClick={onOpenSampleGallery}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#050505] hover:bg-[rgba(230,227,222,0.08)] border border-[rgba(230,227,222,0.15)] text-xs text-[#E6E3DE] transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[rgba(230,227,222,0.70)]" />
              <span>Browse Camera Corpus</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col lg:flex-row overflow-hidden bg-[#050505] select-none text-[#E6E3DE]">
      {/* Center Interactive Canvas Viewport */}
      <div className="flex-1 h-full flex flex-col min-w-0 relative bg-[#050505]">
        {/* Floating Natural Language Prompt Bar */}
        <div className="bg-[#050505] border-b border-[rgba(230,227,222,0.08)] px-4 py-1 flex items-center justify-between gap-2">
          <div className="flex-1 flex justify-center">
            <NaturalLanguageEditorBar
              project={project}
              onUpdateProject={onUpdateProject}
              onPushHistory={pushHistoryStep}
              onOpenFullNLPanel={() => setActiveToolTab('nl-edit')}
              showToast={showToast}
            />
          </div>
          {/* Distraction-Free Toggle */}
          <button
            onClick={() => setIsInspectorCollapsed(!isInspectorCollapsed)}
            className="hidden lg:flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono bg-[#050505] hover:bg-[rgba(230,227,222,0.08)] text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] border border-[rgba(230,227,222,0.12)] transition-colors"
            title={isInspectorCollapsed ? 'Show Inspector Panel' : 'Distraction-Free Canvas Mode'}
          >
            <span>{isInspectorCollapsed ? '◀ SHOW INSPECTOR' : 'FULL CANVAS ▶'}</span>
          </button>
        </div>

        <CanvasViewport
          project={project}
          customPresets={customPresets}
          comparisonMode={comparisonMode}
          onChangeComparisonMode={setComparisonMode}
          onUpdateSettings={handleUpdateAdjustments}
          onUpdateCrop={handleUpdateCrop}
          onUpdateImage={handleUpdateImageUrl}
          onUpdateMasks={(newMasks) => pushHistoryStep('Updated Masks', { masks: newMasks })}
          activeMaskId={activeMaskId}
          onSelectMask={setActiveMaskId}
          onUpdateRetouchStrokes={(newStrokes) => pushHistoryStep('Retouch Stroke', { retouchStrokes: newStrokes })}
          activeRetouchTool={activeRetouchTool}
          retouchBrushRadius={retouchBrushRadius}
          onChangeRetouchBrushRadius={setRetouchBrushRadius}
          retouchBrushFeather={retouchBrushFeather}
          onChangeRetouchBrushFeather={setRetouchBrushFeather}
          retouchBrushOpacity={retouchBrushOpacity}
          onChangeRetouchBrushOpacity={setRetouchBrushOpacity}
          cloneSource={cloneSource}
          onSetCloneSource={setCloneSource}
          isSettingCloneSource={isSettingCloneSource}
          onToggleSettingCloneSource={() => setIsSettingCloneSource(!isSettingCloneSource)}
          onUpdateDrawingStrokes={(newStrokes) => pushHistoryStep('Drawing Stroke', { drawingStrokes: newStrokes })}
          activeDrawingTool={activeDrawingTool}
          onChangeActiveDrawingTool={setActiveDrawingTool}
          drawingBrushSize={drawingBrushSize}
          onChangeDrawingBrushSize={setDrawingBrushSize}
          drawingBrushOpacity={drawingBrushOpacity}
          onChangeDrawingBrushOpacity={setDrawingBrushOpacity}
          drawingBrushFlow={drawingBrushFlow}
          drawingBrushHardness={drawingBrushHardness}
          drawingBrushSmoothing={drawingBrushSmoothing}
          drawingPressureSensitivity={drawingPressureSensitivity}
          drawingBrushColor={drawingBrushColor}
          onChangeDrawingBrushColor={handleSelectDrawingColor}
          drawingActiveShape={drawingActiveShape}
          drawingShapeFilled={drawingShapeFilled}
          drawingShapeFillColor={drawingShapeFillColor}
          drawingActiveCustomBrush={drawingActiveCustomBrush}
          drawingGlowEnabled={drawingGlowEnabled}
          drawingGlowColor={drawingGlowColor}
          drawingGlowRadius={drawingGlowRadius}
          drawingBlendMode={drawingBlendMode}
          isEyedropperActive={isEyedropperActive}
          onToggleEyedropper={setIsEyedropperActive}
          onSampleEyedropperColor={handleSelectDrawingColor}
          activeToolTab={activeToolTab}
          isAiProcessing={isAiProcessing}
          setIsAiProcessing={setIsAiProcessing}
          showToast={showToast}
        />

        {/* Live Collaborative Canvas Pinned Comments & Markup */}
        <CanvasCommentsOverlay
          projectId={project.id}
          currentUser={currentUser}
          isCommentModeActive={isCommentModeActive}
          onToggleCommentMode={onToggleCommentMode}
          showToast={showToast}
        />

        {/* Workstation Canvas Bottom Status Bar */}
        <DesktopStatusBar
          project={project}
          activeTab={activeToolTab}
          isBeforeAfterActive={isShowingBeforeToggle}
          onToggleBeforeAfter={() => setIsShowingBeforeToggle((prev) => !prev)}
          onOpenDiagnostics={onOpenPerformanceModal}
        />
      </div>

      {/* Right Side Tools & Adjustments Studio Sidebar (Collapsible) */}
      {!isInspectorCollapsed && (
        <aside className="w-full lg:w-84 xl:w-96 bg-[#050505] border-t lg:border-t-0 lg:border-l border-[rgba(230,227,222,0.08)] flex flex-col shrink-0 h-80 lg:h-full z-10 shadow-2xl">
          {/* Real-time RGB Histogram & Camera EXIF Bar */}
          <HistogramView metadata={project.image.rawMetadata} />

          {/* Studio Tool Switcher Navigation Tabs */}
          <ToolTabs
            activeTab={activeToolTab}
            onSelectTab={setActiveToolTab}
            activeStage={activeStage}
            skillMode={skillMode}
          />

          {/* Tool Active Panel Content Area */}
          <div className="flex-1 overflow-y-auto bg-[#050505]">
          {activeToolTab === 'performance' && (
            <PerformancePanel
              project={project}
              onOpenPerformanceModal={onOpenPerformanceModal}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'security' && (
            <SecurityPrivacyPanel
              project={project}
              onOpenSecurityModal={onOpenSecurityGovernance}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'developer' && (
            <DeveloperPanel
              project={project}
              onOpenDeveloperPlatform={onOpenDeveloperPlatform}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'automation' && (
            <AutomationPanel
              project={project}
              customPresets={customPresets}
              onOpenAutomationStudio={onOpenAutomationStudio}
              onApplyResultToProject={(canvas, name) => {
                handleUpdateImageUrl(canvas.toDataURL('image/png'));
                showToast('success', 'Automation Applied', name);
              }}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'plugins' && (
            <PluginsPanel
              project={project}
              currentUser={currentUser}
              onOpenPluginModal={onOpenPluginModal}
              onOpenUnsplashModal={onOpenUnsplashModal}
              onApplyProjectSettings={(newSettings) => {
                onUpdateProject({
                  ...project,
                  currentSettings: {
                    ...project.currentSettings,
                    ...newSettings,
                  },
                });
              }}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'collaboration' && (
            <CollaborationPanel
              project={project}
              currentUser={currentUser}
              onOpenCollaborationModal={onOpenCollaborationModal}
              onOpenVersionComparison={onOpenVersionComparison}
              onOpenClientReview={onOpenClientReview}
              isCommentModeActive={isCommentModeActive}
              onToggleCommentMode={onToggleCommentMode}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'comparison' && (
            <ComparisonPanel
              project={project}
              comparisonMode={comparisonMode}
              onChangeMode={setComparisonMode}
              isShowingBeforeToggle={isShowingBeforeToggle}
              onToggleBeforeAfter={() => setIsShowingBeforeToggle((prev) => !prev)}
              isHoldingBefore={isHoldingBefore}
              onHoldBeforeStart={() => setIsHoldingBefore(true)}
              onHoldBeforeEnd={() => setIsHoldingBefore(false)}
              splitPos={splitPos}
              onChangeSplitPos={setSplitPos}
              opacityBlend={opacityBlend}
              onChangeOpacityBlend={setOpacityBlend}
              differenceAmp={differenceAmp}
              onChangeDifferenceAmp={setDifferenceAmp}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'color-management' && (
            <ColorManagementPanel
              settings={project.colorManagement}
              onChange={handleUpdateColorManagement}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'ai-understanding' && (
            <AIImageUnderstandingPanel
              project={project}
              onUpdateSettings={handleUpdateAdjustments}
              onUpdateImage={handleUpdateImageUrl}
              isAiProcessing={isAiProcessing}
              setIsAiProcessing={setIsAiProcessing}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'composition' && (
            <CompositionAssistantPanel
              crop={project.crop}
              imageWidth={project.image.width}
              imageHeight={project.image.height}
              onChangeCrop={handleUpdateCrop}
              isAiProcessing={isAiProcessing}
              setIsAiProcessing={setIsAiProcessing}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'nl-edit' && (
            <NaturalLanguageEditingPanel
              project={project}
              onUpdateProject={onUpdateProject}
              onPushHistory={pushHistoryStep}
              onSelectTab={setActiveToolTab}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'ai-native' && (
            <AINativeArchitecturePanel
              project={project}
              onUpdateSettings={handleUpdateAdjustments}
              onUpdateCrop={handleUpdateCrop}
              onUpdateImage={handleUpdateImageUrl}
              isAiProcessing={isAiProcessing}
              setIsAiProcessing={setIsAiProcessing}
              showToast={showToast}
            />
          )}

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
              project={project}
              activePresetId={project.activePresetId}
              presetStrength={project.presetStrength ?? 100}
              customPresets={customPresets}
              onSelectPreset={handleSelectPreset}
              onChangeStrength={handleChangePresetStrength}
              onSaveAsCustomPreset={handleSaveCustomPreset}
              onUpdateCustomPreset={handleUpdateCustomPreset}
              onDeleteCustomPreset={handleDeleteCustomPreset}
              onBatchImportPresets={handleBatchImportPresets}
              onApplyPresetToBaseSettings={handleApplyPresetToBaseSettings}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'film-simulation' && (
            <FilmSimulationPanel
              project={project}
              onUpdateImage={handleUpdateImageUrl}
              isAiProcessing={isAiProcessing}
              setIsAiProcessing={setIsAiProcessing}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'typography' && (
            <TypographyPanel
              project={project}
              onChangeTypography={(newItems) => pushHistoryStep('Updated Typography', { typography: newItems })}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'graphics-design' && (
            <GraphicsDesignPanel
              project={project}
              onChangeDesignElements={(newItems) => pushHistoryStep('Updated Graphics & Elements', { designElements: newItems })}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'collage' && (
            <CollagePanel
              project={project}
              onChangeCollage={(newCollage) => pushHistoryStep('Updated Collage Layout', { collage: newCollage })}
              onUpdateImage={handleUpdateImageUrl}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'drawing' && (
            <DrawingPanel
              project={project}
              onChangeDrawingStrokes={(newStrokes) => pushHistoryStep('Drawing Strokes', { drawingStrokes: newStrokes })}
              activeTool={activeDrawingTool}
              onChangeActiveTool={setActiveDrawingTool}
              brushSize={drawingBrushSize}
              onChangeBrushSize={setDrawingBrushSize}
              brushOpacity={drawingBrushOpacity}
              onChangeBrushOpacity={setDrawingBrushOpacity}
              brushFlow={drawingBrushFlow}
              onChangeBrushFlow={setDrawingBrushFlow}
              brushHardness={drawingBrushHardness}
              onChangeBrushHardness={setDrawingBrushHardness}
              brushSmoothing={drawingBrushSmoothing}
              onChangeBrushSmoothing={setDrawingBrushSmoothing}
              pressureSensitivity={drawingPressureSensitivity}
              onChangePressureSensitivity={setDrawingPressureSensitivity}
              brushColor={drawingBrushColor}
              onChangeBrushColor={handleSelectDrawingColor}
              activeShape={drawingActiveShape}
              onChangeActiveShape={setDrawingActiveShape}
              shapeFilled={drawingShapeFilled}
              onChangeShapeFilled={setDrawingShapeFilled}
              shapeFillColor={drawingShapeFillColor}
              onChangeShapeFillColor={setDrawingShapeFillColor}
              activeCustomBrush={drawingActiveCustomBrush}
              onChangeActiveCustomBrush={setDrawingActiveCustomBrush}
              glowEnabled={drawingGlowEnabled}
              onChangeGlowEnabled={setDrawingGlowEnabled}
              glowColor={drawingGlowColor}
              onChangeGlowColor={setDrawingGlowColor}
              glowRadius={drawingGlowRadius}
              onChangeGlowRadius={setDrawingGlowRadius}
              blendMode={drawingBlendMode}
              onChangeBlendMode={setDrawingBlendMode}
              isEyedropperActive={isEyedropperActive}
              onToggleEyedropper={setIsEyedropperActive}
              recentColors={recentDrawingColors}
              onSelectRecentColor={handleSelectDrawingColor}
              showToast={showToast}
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

          {activeToolTab === 'effects' && (
            <EffectsPanel
              project={project}
              onUpdateImage={handleUpdateImageUrl}
              isAiProcessing={isAiProcessing}
              setIsAiProcessing={setIsAiProcessing}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'lighting' && (
            <LightingPanel
              project={project}
              onUpdateImage={handleUpdateImageUrl}
              isAiProcessing={isAiProcessing}
              setIsAiProcessing={setIsAiProcessing}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'portrait' && (
            <PortraitPanel
              project={project}
              onUpdateImage={handleUpdateImageUrl}
              isAiProcessing={isAiProcessing}
              setIsAiProcessing={setIsAiProcessing}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'body' && (
            <BodyPanel
              project={project}
              onUpdateImage={handleUpdateImageUrl}
              isAiProcessing={isAiProcessing}
              setIsAiProcessing={setIsAiProcessing}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'sky' && (
            <SkyPanel
              project={project}
              onUpdateImage={handleUpdateImageUrl}
              isAiProcessing={isAiProcessing}
              setIsAiProcessing={setIsAiProcessing}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'geometry' && (
            <GeometryPanel
              project={project}
              onUpdateImage={handleUpdateImageUrl}
              isAiProcessing={isAiProcessing}
              setIsAiProcessing={setIsAiProcessing}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'retouch' && (
            <RetouchPanel
              project={project}
              strokes={project.retouchStrokes || []}
              onChangeStrokes={(newStrokes) => pushHistoryStep('Updated Retouch', { retouchStrokes: newStrokes })}
              activeRetouchTool={activeRetouchTool}
              onChangeRetouchTool={setActiveRetouchTool}
              brushRadius={retouchBrushRadius}
              onChangeBrushRadius={setRetouchBrushRadius}
              brushFeather={retouchBrushFeather}
              onChangeBrushFeather={setRetouchBrushFeather}
              brushOpacity={retouchBrushOpacity}
              onChangeBrushOpacity={setRetouchBrushOpacity}
              cloneSource={cloneSource}
              onSetCloneSource={setCloneSource}
              isSettingSource={isSettingCloneSource}
              onToggleSettingSource={() => setIsSettingCloneSource(!isSettingCloneSource)}
              isAiProcessing={isAiProcessing}
              setIsAiProcessing={setIsAiProcessing}
              onCommitRetouchToImage={() => {}}
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

          {activeToolTab === 'screenshot' && (
            <ScreenshotStudioPanel
              project={project}
              onUpdateImage={handleUpdateImageUrl}
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

          {activeToolTab === 'metadata' && (
            <MetadataPanel
              project={project}
              onUpdateProject={onUpdateProject}
              showToast={showToast}
            />
          )}

          {activeToolTab === 'history' && (
            <HistoryPanel
              project={project}
              onRestoreSnapshot={handleRestoreSnapshot}
              onCreateSnapshot={handleCreateSnapshot}
              onUpdateProject={onUpdateProject}
              showToast={showToast}
              onOpenExportModal={onOpenExportModal}
              onSelectComparisonMode={setComparisonMode}
            />
          )}
        </div>
      </aside>
      )}
    </div>
  );
};
