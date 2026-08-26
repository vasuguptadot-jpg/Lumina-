import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  Download,
  Share2,
  Check,
  RefreshCw,
  Eye,
  Sliders,
  Maximize2,
  Copy,
  Layers,
  ZoomIn,
  ShieldCheck,
  Zap,
  Info,
  CheckSquare,
  Square,
  Play,
  Heart,
  MessageCircle,
  Bookmark,
  Music2,
  ThumbsUp,
  Volume2,
} from 'lucide-react';
import { Project } from '../../types/editor';
import { PhotoItem } from '../../types/library';
import {
  SocialPreset,
  SocialPlatform,
  SocialCropSettings,
  BackgroundFitMode,
} from '../../types/social';
import {
  SOCIAL_PRESETS,
  loadImageElement,
  renderSocialMediaExport,
  generateSocialBundleZip,
} from '../../engine/socialExportEngine';

interface SocialMediaExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  photo?: PhotoItem | null;
  sourceCanvas?: HTMLCanvasElement | null;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const SocialMediaExportModal: React.FC<SocialMediaExportModalProps> = ({
  isOpen,
  onClose,
  project,
  photo,
  sourceCanvas,
  showToast,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | SocialPlatform>('all');
  const [activePreset, setActivePreset] = useState<SocialPreset>(SOCIAL_PRESETS[0]);
  const [selectedPresetIds, setSelectedPresetIds] = useState<Set<string>>(
    new Set(SOCIAL_PRESETS.slice(0, 6).map((p) => p.id))
  );

  // Settings
  const [cropSettings, setCropSettings] = useState<SocialCropSettings>({
    focalX: 0.5,
    focalY: 0.5,
    zoom: 1.0,
    fitMode: 'smart-cover',
    addWatermark: false,
    watermarkText: '@lumina.studio',
    sharpenForScreen: true,
  });

  // UI Overlays
  const [showUiOverlay, setShowUiOverlay] = useState(true);

  // State
  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSizeBytes, setPreviewSizeBytes] = useState<number>(0);
  const [isRendering, setIsRendering] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number; title: string } | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load Source Image on Mount or when project/photo changes
  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      try {
        if (sourceCanvas) {
          const img = await loadImageElement(sourceCanvas);
          setSourceImg(img);
        } else if (project?.image?.originalUrl) {
          const img = await loadImageElement(project.image.originalUrl);
          setSourceImg(img);
        } else if (photo?.originalUrl) {
          const img = await loadImageElement(photo.originalUrl);
          setSourceImg(img);
        }
      } catch (e) {
        console.error('Failed to load source image for social export:', e);
      }
    };

    load();
  }, [isOpen, project, photo, sourceCanvas]);

  // Re-render preview whenever active preset, crop settings, or source image changes
  useEffect(() => {
    if (!sourceImg || !isOpen) return;

    let isMounted = true;
    setIsRendering(true);

    renderSocialMediaExport(sourceImg, activePreset, cropSettings)
      .then(({ url, sizeBytes, canvas }) => {
        if (isMounted) {
          setPreviewUrl(url);
          setPreviewSizeBytes(sizeBytes);
          setIsRendering(false);
        }
      })
      .catch((err) => {
        console.error('Preview render failed:', err);
        if (isMounted) setIsRendering(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sourceImg, activePreset, cropSettings, isOpen]);

  if (!isOpen) return null;

  // Filter presets by active platform
  const filteredPresets = SOCIAL_PRESETS.filter((p) => {
    if (selectedPlatform === 'all') return true;
    return p.platform === selectedPlatform;
  });

  // Toggle selection for ZIP batch export
  const togglePresetSelection = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedPresetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllPresets = () => {
    if (selectedPresetIds.size === SOCIAL_PRESETS.length) {
      setSelectedPresetIds(new Set());
    } else {
      setSelectedPresetIds(new Set(SOCIAL_PRESETS.map((p) => p.id)));
    }
  };

  // Base title for exported files
  const baseTitle = project?.name || photo?.title || 'Lumina_Photo';
  const cleanBaseTitle = baseTitle.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  // Download Single Active Preset
  const handleDownloadSingle = async () => {
    if (!sourceImg) return;
    try {
      showToast('info', 'Rendering Social Export', `Generating ${activePreset.title}...`);
      const { blob } = await renderSocialMediaExport(sourceImg, activePreset, cropSettings);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = activePreset.format === 'png' ? 'png' : activePreset.format === 'webp' ? 'webp' : 'jpg';
      a.download = `${cleanBaseTitle}_${activePreset.platform.toUpperCase()}_${activePreset.width}x${activePreset.height}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      showToast('success', 'Exported Successfully', `Downloaded ${activePreset.title} (${formatBytes(blob.size)})`);
    } catch (err: any) {
      showToast('error', 'Export Failed', err.message);
    }
  };

  // Download All Selected Presets as ZIP
  const handleExportZipBundle = async () => {
    if (!sourceImg) return;
    const presetsToExport = SOCIAL_PRESETS.filter((p) => selectedPresetIds.has(p.id));
    if (presetsToExport.length === 0) {
      showToast('info', 'No Formats Selected', 'Please check at least one format to export.');
      return;
    }

    setIsExportingZip(true);
    setZipProgress({ current: 0, total: presetsToExport.length, title: 'Initializing...' });
    showToast('info', 'Packaging Social Bundle', `Generating ${presetsToExport.length} optimized formats into ZIP...`);

    try {
      const { zipBlob } = await generateSocialBundleZip(
        sourceImg,
        presetsToExport,
        cropSettings,
        cleanBaseTitle,
        (current, total, title) => {
          setZipProgress({ current, total, title });
        }
      );

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanBaseTitle}_Social_Media_Pack_${presetsToExport.length}_Formats.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      confetti({ particleCount: 80, spread: 100, origin: { y: 0.7 } });
      showToast(
        'success',
        'Social Media Pack Ready',
        `Downloaded ${presetsToExport.length} formats in ZIP archive (${formatBytes(zipBlob.size)}).`
      );
    } catch (err: any) {
      showToast('error', 'ZIP Export Failed', err.message);
    } finally {
      setIsExportingZip(false);
      setZipProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-7xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* TOP HEADER */}
        <header className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-[1.5px] shadow-lg shadow-purple-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Share2 className="w-5 h-5 text-pink-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Social Media Optimizer & Exporter</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-pink-950 text-pink-300 border border-pink-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Auto-Dimensions & Compression
                </span>
              </div>
              <p className="text-xs text-slate-400">
                1-Click export for Instagram, YouTube, TikTok, X, Facebook & LinkedIn with UI safe-zone overlays.
              </p>
            </div>
          </div>

          {/* Quick 1-Click ZIP Export & Close */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportZipBundle}
              disabled={isExportingZip || selectedPresetIds.size === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              {isExportingZip ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>
                    Packaging ({zipProgress?.current}/{zipProgress?.total})...
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export {selectedPresetIds.size} Formats (ZIP Bundle)</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* MODAL MAIN BODY: LEFT PRESETS SELECTOR + CENTER PREVIEW + RIGHT CONTROLS */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT COLUMN: PLATFORM FILTER & PRESET LIST */}
          <div className="w-80 bg-slate-950/70 border-r border-slate-800/80 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4 flex flex-col gap-4">
              {/* Platform Selector Pills */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  <span>Platforms</span>
                  <button
                    onClick={selectAllPresets}
                    className="text-[10px] text-indigo-400 hover:text-indigo-200 capitalize font-medium"
                  >
                    {selectedPresetIds.size === SOCIAL_PRESETS.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setSelectedPlatform('all')}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition-colors ${
                      selectedPlatform === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({SOCIAL_PRESETS.length})
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('instagram')}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition-colors ${
                      selectedPlatform === 'instagram'
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    📸 Instagram
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('youtube')}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition-colors ${
                      selectedPlatform === 'youtube'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ▶️ YouTube
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('tiktok')}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition-colors ${
                      selectedPlatform === 'tiktok'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🎵 TikTok
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('x')}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition-colors ${
                      selectedPlatform === 'x'
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    𝕏 X (Twitter)
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('facebook')}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition-colors ${
                      selectedPlatform === 'facebook'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    👥 Facebook
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('linkedin')}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition-colors ${
                      selectedPlatform === 'linkedin'
                        ? 'bg-blue-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    💼 LinkedIn
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('pinterest')}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition-colors ${
                      selectedPlatform === 'pinterest'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    📌 Pinterest
                  </button>
                </div>
              </div>

              {/* Presets Cards List */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Format Presets ({filteredPresets.length})
                </span>

                {filteredPresets.map((preset) => {
                  const isActive = activePreset.id === preset.id;
                  const isChecked = selectedPresetIds.has(preset.id);

                  return (
                    <div
                      key={preset.id}
                      onClick={() => setActivePreset(preset)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isActive
                          ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/40 shadow-md'
                          : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <button
                            onClick={(e) => togglePresetSelection(preset.id, e)}
                            className={`p-0.5 rounded transition-colors ${
                              isChecked ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </button>
                          <h4 className="font-bold text-xs text-white truncate">{preset.title}</h4>
                        </div>

                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-800 text-indigo-300 border border-slate-700 shrink-0 font-mono">
                          {preset.aspectRatioLabel}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pl-6">
                        <span className="font-mono">{preset.width} × {preset.height} px</span>
                        <span className="uppercase text-slate-400 font-semibold">{preset.format}</span>
                      </div>

                      {preset.maxSizeBytes && (
                        <div className="pl-6 text-[10px] text-amber-400/90 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>Strict &lt; 2.0 MB upload cap enforced</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: INTERACTIVE VISUAL PREVIEW WITH MOCKUP UI OVERLAYS */}
          <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Top Toolbar: Aspect, Dimensions & UI Mockup Overlay Toggle */}
            <div className="absolute top-4 inset-x-6 flex items-center justify-between z-20 pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                <span className="px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-bold text-white shadow-md flex items-center gap-2">
                  <span className="text-pink-400">{activePreset.platformName}</span>
                  <span className="text-slate-500">•</span>
                  <span>{activePreset.aspectRatioLabel}</span>
                  <span className="text-slate-500">•</span>
                  <span className="font-mono text-slate-300">{activePreset.width} × {activePreset.height} px</span>
                </span>

                {previewSizeBytes > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono font-semibold text-emerald-400 shadow-md">
                    {formatBytes(previewSizeBytes)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={() => setShowUiOverlay(!showUiOverlay)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all shadow-md ${
                    showUiOverlay
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Toggle live platform UI simulation safe zones"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Platform UI Overlay</span>
                </button>
              </div>
            </div>

            {/* PREVIEW CANVAS CONTAINER */}
            <div className="relative max-h-[70vh] max-w-[90%] aspect-auto flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900/60">
              {previewUrl ? (
                <div
                  className="relative flex items-center justify-center overflow-hidden"
                  style={{
                    aspectRatio: `${activePreset.width} / ${activePreset.height}`,
                    maxHeight: '68vh',
                    maxWidth: '100%',
                  }}
                >
                  <img
                    src={previewUrl}
                    alt={activePreset.title}
                    className="w-full h-full object-contain"
                  />

                  {/* PLATFORM UI SIMULATION OVERLAYS */}
                  {showUiOverlay && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
                      {/* INSTAGRAM POST OVERLAY */}
                      {activePreset.overlayType === 'instagram_post' && (
                        <>
                          <div className="flex items-center justify-between text-white/90 drop-shadow-md">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 p-[1.5px]">
                                <div className="w-full h-full bg-black rounded-full" />
                              </div>
                              <span className="text-[11px] font-bold">lumina_photographer</span>
                            </div>
                            <span className="text-[14px] font-bold">•••</span>
                          </div>

                          <div className="flex items-center justify-between text-white/95 drop-shadow-md pt-2">
                            <div className="flex items-center gap-3">
                              <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                              <MessageCircle className="w-5 h-5" />
                              <Share2 className="w-5 h-5" />
                            </div>
                            <Bookmark className="w-5 h-5" />
                          </div>
                        </>
                      )}

                      {/* INSTAGRAM STORY OVERLAY */}
                      {activePreset.overlayType === 'instagram_story' && (
                        <>
                          <div className="flex items-center justify-between pt-2 px-1">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 p-[1.5px]">
                                <div className="w-full h-full bg-slate-900 rounded-full" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-white drop-shadow">lumina_story</span>
                                <span className="text-[9px] text-white/80 drop-shadow">2h ago</span>
                              </div>
                            </div>
                            <X className="w-5 h-5 text-white drop-shadow" />
                          </div>

                          <div className="pb-3 px-1 flex items-center justify-between gap-2">
                            <div className="flex-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full py-1.5 px-3 text-[11px] text-white/70">
                              Send message...
                            </div>
                            <Heart className="w-5 h-5 text-white drop-shadow" />
                            <Share2 className="w-5 h-5 text-white drop-shadow" />
                          </div>
                        </>
                      )}

                      {/* INSTAGRAM REEL COVER SAFE GRID ZONE (1:1 center) */}
                      {activePreset.overlayType === 'instagram_reel' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-full aspect-square border-2 border-dashed border-amber-400/80 bg-amber-500/10 flex items-center justify-center">
                            <span className="px-2 py-1 rounded bg-black/70 text-[10px] font-bold text-amber-300">
                              1:1 Profile Feed Grid Safe Zone
                            </span>
                          </div>
                        </div>
                      )}

                      {/* YOUTUBE THUMBNAIL OVERLAY */}
                      {activePreset.overlayType === 'youtube_thumb' && (
                        <>
                          <div />
                          <div className="flex items-center justify-end pb-1 pr-1">
                            <span className="px-1.5 py-0.5 rounded bg-black/90 text-[11px] font-bold font-mono text-white">
                              14:28
                            </span>
                          </div>
                        </>
                      )}

                      {/* TIKTOK VERTICAL FORMAT OVERLAY */}
                      {activePreset.overlayType === 'tiktok_vertical' && (
                        <>
                          <div />
                          <div className="flex items-end justify-between pb-4 pr-1">
                            {/* Bottom Caption Safe Zone */}
                            <div className="flex flex-col gap-1 max-w-[70%] drop-shadow-md">
                              <span className="text-xs font-bold text-white">@lumina_creator</span>
                              <p className="text-[11px] text-white/90 line-clamp-2">
                                Cinematic 4K Master shot with 14-bit RAW dynamic range #photography #cinematic
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-white/80">
                                <Music2 className="w-3 h-3" />
                                <span>Original Sound - Lumina Soundscape</span>
                              </div>
                            </div>

                            {/* Right Action Icons Safe Column */}
                            <div className="flex flex-col items-center gap-3 drop-shadow-lg">
                              <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-bold">
                                +
                              </div>
                              <div className="flex flex-col items-center">
                                <Heart className="w-6 h-6 fill-red-500 text-red-500" />
                                <span className="text-[9px] font-bold text-white">128.4K</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <MessageCircle className="w-6 h-6 fill-white text-white" />
                                <span className="text-[9px] font-bold text-white">2,410</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <Bookmark className="w-6 h-6 fill-amber-400 text-amber-400" />
                                <span className="text-[9px] font-bold text-white">8,920</span>
                              </div>
                              <div className="w-7 h-7 rounded-full bg-slate-900 border border-white/40 flex items-center justify-center animate-spin">
                                <Music2 className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-96 h-96 flex flex-col items-center justify-center text-slate-500">
                  <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                  <span className="text-xs">Rendering format preview...</span>
                </div>
              )}
            </div>

            {/* Bottom Safe Zone Tip */}
            {activePreset.safeZoneGuide && (
              <div className="mt-3 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>
                  <strong>Safe Zone Tip:</strong> {activePreset.safeZoneGuide}
                </span>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: SMART FRAMING & FIT CONTROLS */}
          <div className="w-80 bg-slate-950/70 border-l border-slate-800/80 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4 flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Framing & Matting</span>
              </h3>

              {/* Background Fit Strategy */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Background Fit Mode</label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    onClick={() => setCropSettings((s) => ({ ...s, fitMode: 'smart-cover' }))}
                    className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                      cropSettings.fitMode === 'smart-cover'
                        ? 'bg-indigo-950/80 border-indigo-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Smart Cover Crop</span>
                    <span className="text-[10px] text-slate-400 font-normal">Focal Point Centered</span>
                  </button>

                  <button
                    onClick={() => setCropSettings((s) => ({ ...s, fitMode: 'blurred-fill' }))}
                    className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                      cropSettings.fitMode === 'blurred-fill'
                        ? 'bg-indigo-950/80 border-indigo-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Blurred Backdrop</span>
                    <span className="text-[10px] text-slate-400 font-normal">100% Uncropped</span>
                  </button>

                  <button
                    onClick={() => setCropSettings((s) => ({ ...s, fitMode: 'matte-black' }))}
                    className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                      cropSettings.fitMode === 'matte-black'
                        ? 'bg-indigo-950/80 border-indigo-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Matte Black</span>
                    <span className="text-[10px] text-slate-400 font-normal">Pillarbox bars</span>
                  </button>

                  <button
                    onClick={() => setCropSettings((s) => ({ ...s, fitMode: 'matte-white' }))}
                    className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                      cropSettings.fitMode === 'matte-white'
                        ? 'bg-indigo-950/80 border-indigo-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Matte White</span>
                    <span className="text-[10px] text-slate-400 font-normal">Clean Gallery Frame</span>
                  </button>
                </div>
              </div>

              {/* Focal Point Adjuster (X & Y) */}
              {cropSettings.fitMode === 'smart-cover' && (
                <div className="flex flex-col gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-200">Focal Point Re-centering</span>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Horizontal Pan (X)</span>
                      <span className="font-mono">{Math.round(cropSettings.focalX * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={cropSettings.focalX}
                      onChange={(e) =>
                        setCropSettings((s) => ({ ...s, focalX: parseFloat(e.target.value) }))
                      }
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Vertical Pan (Y)</span>
                      <span className="font-mono">{Math.round(cropSettings.focalY * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={cropSettings.focalY}
                      onChange={(e) =>
                        setCropSettings((s) => ({ ...s, focalY: parseFloat(e.target.value) }))
                      }
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Scale / Zoom</span>
                      <span className="font-mono">{cropSettings.zoom.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={2}
                      step={0.05}
                      value={cropSettings.zoom}
                      onChange={(e) =>
                        setCropSettings((s) => ({ ...s, zoom: parseFloat(e.target.value) }))
                      }
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={() => setCropSettings((s) => ({ ...s, focalX: 0.5, focalY: 0.5, zoom: 1.0 }))}
                    className="text-[10px] text-indigo-400 hover:text-indigo-200 underline text-right"
                  >
                    Reset Focal Center
                  </button>
                </div>
              )}

              {/* Sharpening & Watermarking */}
              <div className="flex flex-col gap-2.5 pt-1">
                {/* Edge Sharpening Toggle */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer text-xs">
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">Screen Edge Sharpening</span>
                    <span className="text-[10px] text-slate-400">Compensates for mobile compression</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={cropSettings.sharpenForScreen}
                    onChange={(e) =>
                      setCropSettings((s) => ({ ...s, sharpenForScreen: e.target.checked }))
                    }
                    className="accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                  />
                </label>

                {/* Watermark Toggle & Input */}
                <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-white">Creator Handle Watermark</span>
                    <input
                      type="checkbox"
                      checked={cropSettings.addWatermark}
                      onChange={(e) =>
                        setCropSettings((s) => ({ ...s, addWatermark: e.target.checked }))
                      }
                      className="accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                    />
                  </label>

                  {cropSettings.addWatermark && (
                    <input
                      type="text"
                      value={cropSettings.watermarkText}
                      onChange={(e) =>
                        setCropSettings((s) => ({ ...s, watermarkText: e.target.value }))
                      }
                      placeholder="@username or photographer name"
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  )}
                </div>
              </div>

              {/* Preset Compression Strategy Details */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Platform Optimization Rule
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {activePreset.compressionStrategy}
                </p>
              </div>

              {/* Action: Download Active Format */}
              <button
                onClick={handleDownloadSingle}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all mt-auto"
              >
                <Download className="w-4 h-4" />
                <span>Download {activePreset.platformName} ({activePreset.aspectRatioLabel})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
