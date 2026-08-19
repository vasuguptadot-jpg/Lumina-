import React, { useState, useMemo, useRef } from 'react';
import {
  UploadCloud,
  Layers,
  Sparkles,
  Download,
  FileArchive,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Palette,
  Sliders,
  Settings,
  Copy,
  ClipboardCheck,
  RotateCcw,
  Eye,
  CheckSquare,
  Square,
  Type,
  Maximize2,
  Stamp,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  Check,
  Flame,
  Camera,
  Film,
  Sparkle,
  X,
  Play,
  Pause,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  BatchProcessingOptions,
  BatchQueueItem,
  BatchResizeMode,
  BatchSocialTarget,
  BatchSyncChecklist,
  FilterPreset,
  Project,
  WatermarkSettings,
  AdjustmentSettings,
  ToneCurves,
  HSLSettings,
} from '../../types/editor';
import { FILTER_CATEGORIES, FILTER_PRESETS, getPresetById } from '../../engine/presets';
import { processSingleBatchItem, createBatchZipArchive, computeBatchFilename } from '../../engine/batchEngine';
import { parseImageOrRawFile } from '../../engine/rawParser';
import { triggerDownload } from '../../engine/exportEngine';
import { DEFAULT_ADJUSTMENTS, DEFAULT_HSL, DEFAULT_TONE_CURVES, DEFAULT_WATERMARK } from '../../engine/defaultSettings';

interface BatchProcessorProps {
  currentProject?: Project;
  customPresets?: FilterPreset[];
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

// Sample demo photos for instant batch testing
const BATCH_SAMPLE_PHOTOS = [
  { name: 'Landscape_Alpine_Lake.jpg', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80', w: 1600, h: 1067 },
  { name: 'Portrait_Studio_Light.jpg', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1600&auto=format&fit=crop&q=80', w: 1600, h: 1067 },
  { name: 'Street_Tokyo_Night.jpg', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1600&auto=format&fit=crop&q=80', w: 1600, h: 1067 },
  { name: 'Architecture_Minimalist.jpg', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&auto=format&fit=crop&q=80', w: 1600, h: 1067 },
  { name: 'Food_Artisan_Coffee.jpg', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&auto=format&fit=crop&q=80', w: 1600, h: 1067 },
  { name: 'Fashion_Editorial_Runway.jpg', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600&auto=format&fit=crop&q=80', w: 1600, h: 1067 },
  { name: 'Travel_Santorini_Sunset.jpg', url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&auto=format&fit=crop&q=80', w: 1600, h: 1067 },
  { name: 'Vintage_Car_Classic.jpg', url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1600&auto=format&fit=crop&q=80', w: 1600, h: 1067 },
];

export const BatchProcessor: React.FC<BatchProcessorProps> = ({
  currentProject,
  customPresets = [],
  showToast,
}) => {
  const [queue, setQueue] = useState<BatchQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'recipe' | 'resize' | 'rename' | 'watermark' | 'format'>('recipe');

  // Selected preset category filter in batch
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Clipboard adjustments from current project or copied item
  const [copiedSettings, setCopiedSettings] = useState<{
    adjustments: AdjustmentSettings;
    toneCurves: ToneCurves;
    hsl: HSLSettings;
    presetId: string | null;
    presetStrength: number;
    watermark: WatermarkSettings;
    sourceName: string;
  } | null>(null);

  // Sync checklist modal state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncChecklist, setSyncChecklist] = useState<BatchSyncChecklist>({
    basicTone: true,
    whiteBalance: true,
    colorGrade: true,
    detailSharpness: true,
    curves: true,
    hsl: true,
    preset: true,
    watermark: false,
    border: false,
  });

  // Inspection modal state for single item preview
  const [inspectingItem, setInspectingItem] = useState<BatchQueueItem | null>(null);

  // Master batch configuration options
  const [options, setOptions] = useState<BatchProcessingOptions>({
    applyPresetId: 'cinematic-teal-orange',
    presetStrength: 100,
    autoEnhance: false,
    resizeOption: 'original',
    scalePercent: 100,
    longEdgePx: 2048,
    shortEdgePx: 1080,
    maxWidth: 2400,
    maxHeight: 1600,
    socialTarget: 'insta-portrait',
    outputFormat: 'jpeg',
    quality: 0.92,
    applyWatermark: false,
    watermarkSettings: {
      enabled: true,
      text: '© Lumina Studio Pro',
      font: 'sans-serif',
      fontSize: 24,
      color: '#ffffff',
      opacity: 80,
      position: 'bottom-right',
      hasShadow: true,
      padding: 24,
    },
    namingPattern: '{name}_lumina',
    namePrefix: '',
    nameSuffix: '',
    findText: '',
    replaceText: '',
    startSeqIndex: 1,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered preset list by category
  const allAvailablePresets = useMemo(() => {
    return [...customPresets, ...FILTER_PRESETS];
  }, [customPresets]);

  const filteredPresetList = useMemo(() => {
    if (selectedCategory === 'All') return allAvailablePresets;
    if (selectedCategory === 'Custom') return customPresets;
    return allAvailablePresets.filter((p) => p.category === selectedCategory);
  }, [selectedCategory, allAvailablePresets, customPresets]);

  // Handle Multi-file Upload
  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files: File[] = Array.from(e.target.files);

    const newItems: BatchQueueItem[] = [];
    for (const file of files) {
      try {
        const parsed = await parseImageOrRawFile(file);
        newItems.push({
          id: `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          file,
          originalUrl: parsed.previewUrl,
          thumbnailUrl: parsed.previewUrl,
          width: parsed.imageFile.width,
          height: parsed.imageFile.height,
          status: 'idle',
          progress: 0,
          selected: true,
        });
      } catch (err) {
        console.error(`Failed to parse batch item ${file.name}:`, err);
      }
    }

    setQueue((prev) => [...prev, ...newItems]);
    showToast('success', 'Photos Added to Batch Queue', `Loaded ${newItems.length} photos ready for batch processing.`);
  };

  // Load sample photos for instant batch demo
  const handleLoadSampleBatch = () => {
    const demoItems: BatchQueueItem[] = BATCH_SAMPLE_PHOTOS.map((s, idx) => ({
      id: `sample_${Date.now()}_${idx}`,
      file: { name: s.name, type: 'image/jpeg', size: 1024 * 750 },
      originalUrl: s.url,
      thumbnailUrl: s.url,
      width: s.w,
      height: s.h,
      status: 'idle',
      progress: 0,
      selected: true,
    }));

    setQueue((prev) => [...prev, ...demoItems]);
    showToast('success', 'Sample Batch Loaded', `Added ${demoItems.length} curated pro sample photos to queue.`);
  };

  // Copy adjustments from current active editor project
  const handleCopyFromEditor = () => {
    if (!currentProject) {
      showToast('error', 'No Active Project', 'Open an image in the editor to copy its adjustments.');
      return;
    }

    setCopiedSettings({
      adjustments: { ...currentProject.currentSettings },
      toneCurves: { ...currentProject.toneCurves },
      hsl: { ...currentProject.hsl },
      presetId: currentProject.activePresetId,
      presetStrength: currentProject.presetStrength ?? 100,
      watermark: { ...currentProject.watermark },
      sourceName: currentProject.name || 'Current Active Photo',
    });

    showToast('success', 'Adjustments Copied', `Copied color profile & settings from "${currentProject.name}".`);
  };

  // Paste / Sync adjustments to all or selected photos in batch
  const handleApplySyncToQueue = (target: 'selected' | 'all') => {
    if (!copiedSettings) {
      showToast('error', 'Nothing Copied', 'Copy adjustments from active photo or a queue item first.');
      return;
    }

    setQueue((prev) =>
      prev.map((item) => {
        if (target === 'selected' && !item.selected) return item;

        const updatedSettings: AdjustmentSettings = {
          ...(item.customSettings || options.applyAdjustments || DEFAULT_ADJUSTMENTS),
        };

        if (syncChecklist.basicTone) {
          updatedSettings.exposure = copiedSettings.adjustments.exposure;
          updatedSettings.contrast = copiedSettings.adjustments.contrast;
          updatedSettings.highlights = copiedSettings.adjustments.highlights;
          updatedSettings.shadows = copiedSettings.adjustments.shadows;
          updatedSettings.whites = copiedSettings.adjustments.whites;
          updatedSettings.blacks = copiedSettings.adjustments.blacks;
        }

        if (syncChecklist.whiteBalance) {
          updatedSettings.temperature = copiedSettings.adjustments.temperature;
          updatedSettings.tint = copiedSettings.adjustments.tint;
          updatedSettings.saturation = copiedSettings.adjustments.saturation;
          updatedSettings.vibrance = copiedSettings.adjustments.vibrance;
        }

        if (syncChecklist.colorGrade) {
          updatedSettings.splitToning = copiedSettings.adjustments.splitToning
            ? { ...copiedSettings.adjustments.splitToning }
            : undefined;
        }

        if (syncChecklist.detailSharpness) {
          updatedSettings.clarity = copiedSettings.adjustments.clarity;
          updatedSettings.texture = copiedSettings.adjustments.texture;
          updatedSettings.sharpness = copiedSettings.adjustments.sharpness;
          updatedSettings.dehaze = copiedSettings.adjustments.dehaze;
          updatedSettings.filmGrain = copiedSettings.adjustments.filmGrain;
          updatedSettings.vignette = copiedSettings.adjustments.vignette;
        }

        return {
          ...item,
          customSettings: updatedSettings,
          customToneCurves: syncChecklist.curves ? { ...copiedSettings.toneCurves } : item.customToneCurves,
          customHsl: syncChecklist.hsl ? { ...copiedSettings.hsl } : item.customHsl,
          customPresetId: syncChecklist.preset ? (copiedSettings.presetId || undefined) : item.customPresetId,
          customWatermark: syncChecklist.watermark ? { ...copiedSettings.watermark } : item.customWatermark,
        };
      })
    );

    setIsSyncModalOpen(false);
    showToast(
      'success',
      'Edits Synchronized',
      `Synchronized ${target === 'selected' ? 'selected' : 'all'} photos with copied settings.`
    );
  };

  // Run Batch Processing on selected or entire queue
  const handleStartBatch = async () => {
    const itemsToProcess = queue.filter((q) => q.status !== 'completed');
    if (itemsToProcess.length === 0) {
      showToast('info', 'All Photos Processed', 'All photos in queue have already completed.');
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    setOverallProgress(0);

    const processedResults: Array<{ blob: Blob; filename: string }> = [];

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status === 'completed') continue;

      // Update item to processing
      setQueue((prev) =>
        prev.map((q, idx) => (idx === i ? { ...q, status: 'processing', progress: 10 } : q))
      );

      try {
        const result = await processSingleBatchItem(
          item,
          options,
          i,
          customPresets,
          (prog) => {
            setQueue((prev) =>
              prev.map((q, idx) => (idx === i ? { ...q, progress: prog } : q))
            );
          }
        );

        const resultUrl = URL.createObjectURL(result.blob);
        processedResults.push(result);

        setQueue((prev) =>
          prev.map((q, idx) =>
            idx === i
              ? {
                  ...q,
                  status: 'completed',
                  progress: 100,
                  resultBlobUrl: resultUrl,
                  resultSize: result.blob.size,
                  outputFilename: result.filename,
                }
              : q
          )
        );
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q, idx) =>
            idx === i
              ? { ...q, status: 'error', progress: 0, errorMessage: err.message }
              : q
          )
        );
      }

      setOverallProgress(Math.round(((i + 1) / queue.length) * 100));
    }

    setIsProcessing(false);
    showToast('success', 'Batch Processing Complete', `Successfully processed ${processedResults.length} photos.`);
  };

  // Download All as ZIP Archive
  const handleDownloadAllZip = async () => {
    const completed = queue.filter((q) => q.status === 'completed' && q.resultBlobUrl);
    if (completed.length === 0) return;

    showToast('info', 'Packaging ZIP Archive', 'Bundling high-resolution exports into ZIP...');

    const zipItems: Array<{ blob: Blob; filename: string }> = [];
    for (const item of completed) {
      const response = await fetch(item.resultBlobUrl!);
      const blob = await response.blob();
      const fname = item.outputFilename || `${item.file.name.replace(/\.[^/.]+$/, '')}_lumina.${options.outputFormat}`;
      zipItems.push({ blob, filename: fname });
    }

    const zipBlob = await createBatchZipArchive(zipItems);
    const zipUrl = URL.createObjectURL(zipBlob);
    triggerDownload(zipUrl, `Lumina_Batch_Export_${Date.now()}.zip`);
    showToast('success', 'ZIP Archive Downloaded', 'Batch zip package ready.');
  };

  // Selection toggle helpers
  const toggleSelectItem = (id: string) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, selected: !q.selected } : q)));
  };

  const selectAll = (val: boolean) => {
    setQueue((prev) => prev.map((q) => ({ ...q, selected: val })));
  };

  const removeSelected = () => {
    setQueue((prev) => prev.filter((q) => !q.selected));
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const selectedCount = queue.filter((q) => q.selected).length;
  const completedCount = queue.filter((q) => q.status === 'completed').length;

  return (
    <div className="flex-1 h-full bg-slate-950 text-slate-100 flex flex-col lg:flex-row overflow-hidden select-none">
      {/* LEFT COLUMN: BATCH STUDIO CONTROLS & RECIPES */}
      <div className="w-full lg:w-96 xl:w-104 bg-slate-900/95 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col shrink-0 overflow-hidden shadow-2xl z-10">
        {/* Studio Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-1.5">
                Batch Studio Pro
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-bold uppercase">
                  100+ Photos
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Parallel Editing, Resizing & Format Conversion</p>
            </div>
          </div>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 overflow-x-auto scrollbar-none text-xs font-semibold">
          {[
            { id: 'recipe', label: 'Color & Preset', icon: Palette },
            { id: 'resize', label: 'Resize & Scale', icon: Maximize2 },
            { id: 'rename', label: 'Rename', icon: Type },
            { id: 'watermark', label: 'Watermark', icon: Stamp },
            { id: 'format', label: 'Export Format', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400 bg-slate-900/90'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Panel Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: RECIPE & PRESETS */}
          {activeTab === 'recipe' && (
            <div className="space-y-4">
              {/* Copy / Sync Adjustments Card */}
              <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-3.5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ClipboardCheck className="w-4 h-4 text-indigo-400" />
                    Copy & Sync Settings
                  </span>
                  {copiedSettings && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      Ready to Sync
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Copy color adjustments from your active project photo and synchronize selectively across all 100+ queue images.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopyFromEditor}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Copy from Editor</span>
                  </button>

                  <button
                    onClick={() => setIsSyncModalOpen(true)}
                    disabled={!copiedSettings}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Sync Edits...</span>
                  </button>
                </div>
              </div>

              {/* 16 Category Filter Preset Selector */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-md">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-indigo-400" />
                    Apply Filter Preset
                  </span>
                  <span className="text-[10px] text-slate-400">{filteredPresetList.length} Presets</span>
                </div>

                {/* Category Pills */}
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                  {['All', ...FILTER_CATEGORIES].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Dropdown Selector */}
                <select
                  value={options.applyPresetId || ''}
                  onChange={(e) => setOptions({ ...options, applyPresetId: e.target.value || undefined })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-medium cursor-pointer"
                >
                  <option value="">None (Keep Original Color)</option>
                  {filteredPresetList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>

                {/* Intensity Slider */}
                {options.applyPresetId && (
                  <div className="space-y-1.5 pt-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span className="font-semibold">Preset Intensity</span>
                      <span className="font-mono text-indigo-300 font-bold">{options.presetStrength}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={150}
                      value={options.presetStrength}
                      onChange={(e) => setOptions({ ...options, presetStrength: Number(e.target.value) })}
                      className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RESIZE & SCALE */}
          {activeTab === 'resize' && (
            <div className="space-y-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-md">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-emerald-400" />
                Batch Resize & Scale
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-400">Resizing Mode</label>
                <select
                  value={options.resizeOption}
                  onChange={(e) => setOptions({ ...options, resizeOption: e.target.value as BatchResizeMode })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="original">Original Dimensions (100% Native Resolution)</option>
                  <option value="percentage">Percentage Scaling</option>
                  <option value="long-edge">Fit Long Edge (Maintain Aspect Ratio)</option>
                  <option value="short-edge">Fit Short Edge</option>
                  <option value="fit-box">Fit Inside Max Width × Height Box</option>
                  <option value="social-preset">Social Media Target (Auto Aspect Fit)</option>
                </select>
              </div>

              {/* Percentage Scaling Options */}
              {options.resizeOption === 'percentage' && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Scale Percentage</span>
                    <span className="font-mono text-indigo-300 font-bold">{options.scalePercent || 100}%</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[25, 50, 75, 150, 200].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setOptions({ ...options, scalePercent: pct })}
                        className={`py-1 text-xs font-bold rounded-lg border transition-colors ${
                          options.scalePercent === pct
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Long Edge Options */}
              {options.resizeOption === 'long-edge' && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-[11px] font-semibold text-slate-400">Target Long Edge (Pixels)</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1080, 1920, 2048, 2560, 3840, 4096].map((px) => (
                      <button
                        key={px}
                        onClick={() => setOptions({ ...options, longEdgePx: px })}
                        className={`py-1 text-xs font-mono font-bold rounded-lg border transition-colors ${
                          options.longEdgePx === px
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

              {/* Social Presets */}
              {options.resizeOption === 'social-preset' && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-[11px] font-semibold text-slate-400">Social Format Target</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'insta-portrait', label: 'Insta Portrait (1080×1350)' },
                      { id: 'insta-square', label: 'Insta Square (1080×1080)' },
                      { id: 'story-reels', label: 'Story / TikTok (1080×1920)' },
                      { id: 'twitter-post', label: 'Twitter / Web (1200×675)' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setOptions({ ...options, socialTarget: s.id as BatchSocialTarget })}
                        className={`p-2 text-left rounded-xl border transition-all text-xs font-semibold ${
                          options.socialTarget === s.id
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
          )}

          {/* TAB 3: BATCH RENAME */}
          {activeTab === 'rename' && (
            <div className="space-y-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-md">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-purple-400" />
                Batch File Renaming
              </div>

              {/* Renaming Pattern */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Naming Template Pattern</label>
                <input
                  type="text"
                  value={options.namingPattern}
                  onChange={(e) => setOptions({ ...options, namingPattern: e.target.value })}
                  placeholder="{name}_lumina"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-indigo-500"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {['{name}', '{seq3}', '{seq}', '{date}', '{preset}', '{w}x{h}'].map((token) => (
                    <button
                      key={token}
                      onClick={() => setOptions({ ...options, namingPattern: `${options.namingPattern}_${token}` })}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-indigo-300 hover:text-white"
                    >
                      +{token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prefix & Suffix */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Prefix</label>
                  <input
                    type="text"
                    value={options.namePrefix || ''}
                    onChange={(e) => setOptions({ ...options, namePrefix: e.target.value })}
                    placeholder="e.g. Master_"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Suffix</label>
                  <input
                    type="text"
                    value={options.nameSuffix || ''}
                    onChange={(e) => setOptions({ ...options, nameSuffix: e.target.value })}
                    placeholder="e.g. _Final"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Find and Replace */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Find Text</label>
                  <input
                    type="text"
                    value={options.findText || ''}
                    onChange={(e) => setOptions({ ...options, findText: e.target.value })}
                    placeholder="e.g. IMG_"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Replace With</label>
                  <input
                    type="text"
                    value={options.replaceText || ''}
                    onChange={(e) => setOptions({ ...options, replaceText: e.target.value })}
                    placeholder="e.g. Photo_"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Live Preview */}
              {queue.length > 0 && (
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-2.5 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400">Live Renaming Preview:</div>
                  <div className="text-[11px] font-mono text-indigo-300 truncate">
                    {computeBatchFilename(queue[0].file.name, options, 0, queue[0].width, queue[0].height, options.applyPresetId)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BATCH WATERMARK */}
          {activeTab === 'watermark' && (
            <div className="space-y-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Stamp className="w-4 h-4 text-rose-400" />
                  Batch Watermark Protection
                </span>
                <input
                  type="checkbox"
                  checked={options.applyWatermark}
                  onChange={(e) => setOptions({ ...options, applyWatermark: e.target.checked })}
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                />
              </div>

              {options.applyWatermark && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  {/* Current Project Sync Button */}
                  {currentProject?.watermark && (
                    <button
                      onClick={() => {
                        setOptions({
                          ...options,
                          applyWatermark: true,
                          watermarkSettings: { ...currentProject.watermark, enabled: true },
                        });
                        showToast('success', 'Synced Project Watermark', 'Batch queue will apply current project watermark styling');
                      }}
                      className="w-full py-1.5 px-3 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sync Watermark from Active Project</span>
                    </button>
                  )}

                  {/* Watermark Type Selector */}
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: 'text', label: 'Text' },
                      { id: 'logo', label: 'Logo' },
                      { id: 'image', label: 'Stamp' },
                      { id: 'pattern-tile', label: 'Tiling' },
                    ].map((m) => {
                      const curType = options.watermarkSettings?.isTiled
                        ? 'pattern-tile'
                        : options.watermarkSettings?.type || 'text';
                      const isSel = curType === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            const cur = options.watermarkSettings || DEFAULT_WATERMARK;
                            if (m.id === 'pattern-tile') {
                              setOptions({
                                ...options,
                                watermarkSettings: { ...cur, type: 'pattern-tile', isTiled: true },
                              });
                            } else {
                              setOptions({
                                ...options,
                                watermarkSettings: { ...cur, type: m.id as any, isTiled: false },
                              });
                            }
                          }}
                          className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                            isSel
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Text Watermark Input */}
                  {(options.watermarkSettings?.type === 'text' || options.watermarkSettings?.isTiled || !options.watermarkSettings?.type) && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">Watermark Text</label>
                      <input
                        type="text"
                        value={options.watermarkSettings?.text || '© Lumina Studio Pro'}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            watermarkSettings: {
                              ...(options.watermarkSettings || DEFAULT_WATERMARK),
                              text: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                      />
                    </div>
                  )}

                  {/* 9-Point Positioning Matrix */}
                  {!options.watermarkSettings?.isTiled && options.watermarkSettings?.type !== 'pattern-tile' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400">Position Matrix</label>
                      <div className="grid grid-cols-3 gap-1 max-w-[200px] mx-auto">
                        {[
                          'top-left', 'top-center', 'top-right',
                          'center-left', 'center', 'center-right',
                          'bottom-left', 'bottom-center', 'bottom-right'
                        ].map((pos) => (
                          <button
                            key={pos}
                            onClick={() =>
                              setOptions({
                                ...options,
                                watermarkSettings: {
                                  ...(options.watermarkSettings || DEFAULT_WATERMARK),
                                  position: pos as any,
                                },
                              })
                            }
                            className={`py-1 text-[9px] font-bold rounded border transition-all uppercase ${
                              (options.watermarkSettings?.position || 'bottom-right') === pos
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {pos.split('-').map(s => s[0]).join('')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size and Opacity Sliders */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">Scale ({options.watermarkSettings?.size || 100}%)</label>
                      <input
                        type="range"
                        min={30}
                        max={200}
                        value={options.watermarkSettings?.size || 100}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            watermarkSettings: {
                              ...(options.watermarkSettings || DEFAULT_WATERMARK),
                              size: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">Opacity ({options.watermarkSettings?.opacity || 80}%)</label>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={options.watermarkSettings?.opacity || 80}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            watermarkSettings: {
                              ...(options.watermarkSettings || DEFAULT_WATERMARK),
                              opacity: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FORMAT & COMPRESSION */}
          {activeTab === 'format' && (
            <div className="space-y-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-md">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-teal-400" />
                Master Export Format
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {(['jpeg', 'png', 'webp', 'avif', 'tiff', 'heic', 'dng', 'psd'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setOptions({ ...options, outputFormat: fmt })}
                    className={`py-2 text-xs font-bold uppercase rounded-xl border transition-all ${
                      options.outputFormat === fmt
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              {options.outputFormat === 'jpeg' && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>JPEG Quality</span>
                    <span className="font-mono text-indigo-300 font-bold">{Math.round(options.quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={1.0}
                    step={0.01}
                    value={options.quality}
                    onChange={(e) => setOptions({ ...options, quality: Number(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              )}

              {options.outputFormat === 'webp' && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>WebP Compression Quality</span>
                    <span className="font-mono text-indigo-300 font-bold">{Math.round(options.quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={1.0}
                    step={0.01}
                    value={options.quality}
                    onChange={(e) => setOptions({ ...options, quality: Number(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Master Run Action Bar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 space-y-2.5">
          {isProcessing && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Overall Batch Progress</span>
                <span className="font-mono font-bold text-indigo-300">{overallProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleStartBatch}
              disabled={queue.length === 0 || isProcessing}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/25 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing ({overallProgress}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Process All {queue.length} Photos</span>
                </>
              )}
            </button>

            {completedCount > 0 && (
              <button
                onClick={handleDownloadAllZip}
                title="Download All Finished as ZIP"
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-colors"
              >
                <FileArchive className="w-4 h-4" />
                <span>ZIP</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: INTERACTIVE BATCH QUEUE & PHOTO GRID */}
      <div className="flex-1 h-full p-5 flex flex-col overflow-hidden space-y-4">
        {/* Top Queue Action Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white">
              Queue: {queue.length} Photos
            </span>
            {selectedCount > 0 && (
              <span className="text-xs text-indigo-300 bg-indigo-950 border border-indigo-500/40 px-2.5 py-0.5 rounded-full font-semibold">
                {selectedCount} Selected
              </span>
            )}
            {completedCount > 0 && (
              <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                {completedCount} Completed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSampleBatch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-amber-300 hover:border-amber-500/40 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Load 8 Sample Photos</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Add Photos (100+)</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.dng,.cr2,.cr3,.nef,.arw,.raf,.orf,.rw2,.pef,.tiff,.tif"
              onChange={handleFilesUpload}
              className="hidden"
            />

            {queue.length > 0 && (
              <>
                <button
                  onClick={() => selectAll(selectedCount !== queue.length)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium"
                >
                  {selectedCount === queue.length ? 'Deselect All' : 'Select All'}
                </button>

                <button
                  onClick={clearQueue}
                  className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Clear Queue"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Empty State / Dropzone */}
        {queue.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 border-2 border-dashed border-slate-800 hover:border-indigo-500/80 bg-slate-900/30 hover:bg-slate-900/60 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
              Add Photos for Batch Editing
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
              Drag and drop 50–100+ RAW or JPEG photos to apply color presets, batch resize, rename, watermark, and convert formats in parallel.
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLoadSampleBatch();
              }}
              className="mt-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Or Start with 8 Demo Photos</span>
            </button>
          </div>
        ) : (
          /* Dynamic Queue Grid */
          <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 pr-1">
            {queue.map((item, idx) => {
              const isSelected = item.selected;
              return (
                <div
                  key={item.id}
                  className={`relative rounded-2xl border bg-slate-900/80 overflow-hidden flex flex-col justify-between transition-all group ${
                    isSelected
                      ? 'border-indigo-500/80 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Thumbnail Container */}
                  <div className="relative w-full h-36 bg-slate-950 overflow-hidden">
                    <img
                      src={item.resultBlobUrl || item.thumbnailUrl}
                      alt={item.file.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Checkbox Overlay */}
                    <button
                      onClick={() => toggleSelectItem(item.id)}
                      className={`absolute top-2 left-2 p-1.5 rounded-lg backdrop-blur-md transition-colors ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-black/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    </button>

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {item.status === 'completed' && (
                        <div className="p-1 rounded-lg bg-emerald-600 text-white shadow-md">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {item.status === 'processing' && (
                        <div className="p-1 rounded-lg bg-indigo-600 text-white shadow-md animate-spin">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {item.status === 'error' && (
                        <div className="p-1 rounded-lg bg-rose-600 text-white shadow-md">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Inspect Button */}
                    <button
                      onClick={() => setInspectingItem(item)}
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs font-semibold backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Metadata & Progress */}
                  <div className="p-3 space-y-1.5">
                    <div className="text-xs font-bold text-slate-200 truncate">{item.file.name}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{item.width} × {item.height} px</span>
                      <span>{item.status === 'completed' && item.resultSize ? `${(item.resultSize / 1024).toFixed(0)} KB` : ''}</span>
                    </div>

                    {item.status === 'processing' && (
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-indigo-500 transition-all duration-200"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Single Item Action */}
                    {item.status === 'completed' && item.resultBlobUrl && (
                      <div className="pt-1">
                        <button
                          onClick={() => triggerDownload(item.resultBlobUrl!, item.outputFilename || item.file.name)}
                          className="w-full py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download Single</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SELECTIVE SYNC EDITS MODAL */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Synchronize Settings</h3>
              </div>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select which adjustment modules from "{copiedSettings?.sourceName}" to apply:
            </p>

            <div className="space-y-2 text-xs">
              {[
                { id: 'basicTone', label: 'Basic Tone (Exposure, Contrast, Highlights, Shadows)' },
                { id: 'whiteBalance', label: 'White Balance & Vibrance' },
                { id: 'colorGrade', label: 'Color Balance & Split Toning' },
                { id: 'detailSharpness', label: 'Detail, Clarity, Texture & Grain' },
                { id: 'curves', label: 'Tone Curves' },
                { id: 'hsl', label: 'HSL Color Mixer (8 Channels)' },
                { id: 'preset', label: 'Active Film Preset Profile' },
                { id: 'watermark', label: 'Watermark' },
              ].map((item) => (
                <label key={item.id} className="flex items-center gap-2.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={(syncChecklist as any)[item.id]}
                    onChange={(e) => setSyncChecklist({ ...syncChecklist, [item.id]: e.target.checked })}
                    className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleApplySyncToQueue('selected')}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                Apply to Selected ({selectedCount})
              </button>
              <button
                onClick={() => handleApplySyncToQueue('all')}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Apply to All ({queue.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTION PREVIEW MODAL */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">{inspectingItem.file.name}</h3>
              </div>
              <button
                onClick={() => setInspectingItem(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={inspectingItem.resultBlobUrl || inspectingItem.originalUrl}
                alt="Preview"
                className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-2xl border border-slate-800"
              />
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
              <div>Dimensions: {inspectingItem.width} × {inspectingItem.height} px</div>
              {inspectingItem.resultBlobUrl && (
                <button
                  onClick={() => triggerDownload(inspectingItem.resultBlobUrl!, inspectingItem.outputFilename || inspectingItem.file.name)}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Output</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
