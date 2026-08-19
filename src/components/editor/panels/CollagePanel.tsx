import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutGrid,
  Sparkles,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sliders,
  Palette,
  Layers,
  Wand2,
  Camera,
  Grid,
  RotateCw,
  Maximize2,
  Square,
  Compass,
  Download,
  Check,
  RefreshCw,
  Stamp,
  Zap,
  Tag,
  ArrowRight,
  Move,
  Crop,
  Eye,
} from 'lucide-react';
import {
  Project,
  CollageSettings,
  CollageItem,
  CollageLayoutType,
  CollagePinType,
  DesignPatternType,
} from '../../../types/editor';
import {
  COLLAGE_LAYOUTS,
  createCollageFromImages,
  generateAutoCollage,
  renderCollageToCanvas,
} from '../../../engine/collageEngine';
import { requestAiCollageSuggest, requestAiCollageGenerate } from '../../../services/aiService';
import { GRADIENT_PRESETS } from '../../../engine/typographyEngine';

interface CollagePanelProps {
  project: Project;
  onChangeCollage: (settings: CollageSettings) => void;
  onUpdateImage: (newUrl: string, name?: string) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

// Sample demo photos for instant collage testing
const SAMPLE_COLLAGE_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
];

const AI_PROMPT_PRESETS = [
  { label: '90s Film Scrapbook', prompt: '90s vintage analog film scrapbook with warm paper tones, washi tape, and polaroid scatter' },
  { label: 'Kyoto Travel Diary', prompt: 'Japanese aesthetic travel diary with clean minimalist spacing, soft sage background, and elegant photo frames' },
  { label: 'Neon Cyberpunk Night', prompt: 'Futuristic cyberpunk collage with neon blue-violet gradient, sharp contrast, and dark geometric grid' },
  { label: 'Vogue Magazine Spread', prompt: 'High fashion editorial magazine spread with bold asymmetric hero layout and crisp white borders' },
  { label: 'Romantic Polaroids', prompt: 'Heartwarming romantic polaroid cluster with rose gold tones, handwritten captions, and soft shadows' },
];

export const CollagePanel: React.FC<CollagePanelProps> = ({
  project,
  onChangeCollage,
  onUpdateImage,
  showToast,
}) => {
  const collage = project.collage || {
    enabled: true,
    mode: 'grid',
    aspectRatio: '1:1',
    layout: 'grid-2x2',
    spacing: 16,
    padding: 24,
    cornerRadius: 12,
    outerBorder: { enabled: false, size: 16, color: '#ffffff', style: 'solid' },
    background: { type: 'solid', solidColor: '#0f172a' },
    items: [],
    activeItemId: null,
  };

  const [activeTab, setActiveTab] = useState<'grid' | 'freeform' | 'ai' | 'styling'>('grid');
  const [layoutCategory, setLayoutCategory] = useState<'All' | 'Grid' | 'Split' | 'Magazine' | 'Creative' | 'Story'>('All');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(collage.items[0]?.id || null);

  // Hidden file input for uploading photos into collage
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image cache map for preview canvas rendering
  const imagesMapRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [imagesLoadedCount, setImagesLoadedCount] = useState(0);

  // Auto-populate collage with current project image if empty
  useEffect(() => {
    if (collage.items.length === 0 && project.image?.originalUrl) {
      const initial = createCollageFromImages([project.image.originalUrl], 'grid-1x2', collage.aspectRatio);
      onChangeCollage(initial);
    }
  }, []);

  // Preload images into map for canvas rendering
  useEffect(() => {
    collage.items.forEach((item) => {
      if (!imagesMapRef.current.has(item.imageUrl)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = item.imageUrl;
        img.onload = () => {
          imagesMapRef.current.set(item.imageUrl, img);
          setImagesLoadedCount((c) => c + 1);
        };
      }
    });
  }, [collage.items]);

  // Update Collage Helper
  const updateCollage = (updates: Partial<CollageSettings>) => {
    const next = { ...collage, ...updates };
    onChangeCollage(next);
  };

  // Update Individual Item Helper
  const updateItem = (id: string, updates: Partial<CollageItem>) => {
    const nextItems = collage.items.map((it) => (it.id === id ? { ...it, ...updates } : it));
    updateCollage({ items: nextItems });
  };

  // Add Uploaded Photos
  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files) as File[];

    const newUrls: string[] = [];
    files.forEach((file: File) => {
      const url = URL.createObjectURL(file);
      newUrls.push(url);
    });

    const allUrls = [...collage.items.map((i) => i.imageUrl), ...newUrls];
    const newCollage = createCollageFromImages(allUrls, collage.layout, collage.aspectRatio);
    newCollage.spacing = collage.spacing;
    newCollage.padding = collage.padding;
    newCollage.cornerRadius = collage.cornerRadius;
    newCollage.background = collage.background;
    newCollage.outerBorder = collage.outerBorder;

    onChangeCollage(newCollage);
    showToast('success', 'Photos Added', `Added ${newUrls.length} photo(s) to collage.`);
  };

  // Load Demo Photos
  const handleLoadDemoPhotos = () => {
    const newCollage = createCollageFromImages(SAMPLE_COLLAGE_PHOTOS, 'grid-2x2', collage.aspectRatio);
    onChangeCollage(newCollage);
    showToast('info', 'Demo Photos Loaded', 'Loaded 5 sample photos into collage.');
  };

  // Remove Photo Item
  const handleRemoveItem = (id: string) => {
    const remaining = collage.items.filter((i) => i.id !== id);
    if (remaining.length === 0) {
      showToast('error', 'Cannot remove', 'At least 1 photo is required.');
      return;
    }
    const next = createCollageFromImages(
      remaining.map((i) => i.imageUrl),
      collage.layout,
      collage.aspectRatio
    );
    next.spacing = collage.spacing;
    next.padding = collage.padding;
    next.cornerRadius = collage.cornerRadius;
    next.background = collage.background;
    next.outerBorder = collage.outerBorder;

    onChangeCollage(next);
    showToast('info', 'Photo Removed', 'Removed photo from collage.');
  };

  // Change Layout
  const handleSelectLayout = (layoutType: CollageLayoutType) => {
    const urls = collage.items.map((i) => i.imageUrl);
    const next = createCollageFromImages(urls, layoutType, collage.aspectRatio);
    next.spacing = collage.spacing;
    next.padding = collage.padding;
    next.cornerRadius = collage.cornerRadius;
    next.background = collage.background;
    next.outerBorder = collage.outerBorder;

    onChangeCollage(next);
    showToast('success', 'Layout Updated', `Switched to ${layoutType}`);
  };

  // AI Collage Suggestion
  const handleAiSuggestCollage = async (promptToUse?: string) => {
    const prompt = promptToUse || aiPrompt;
    if (!prompt.trim()) {
      showToast('error', 'Prompt Required', 'Please type a theme or select a preset.');
      return;
    }

    try {
      setIsAiLoading(true);
      showToast('info', 'AI Designing Collage', `Generating layout for "${prompt}"...`);

      const result = await requestAiCollageSuggest(prompt, collage.items.length || 4);

      if (result.success && result.data) {
        const d = result.data;
        const urls = collage.items.length > 0 ? collage.items.map((i) => i.imageUrl) : SAMPLE_COLLAGE_PHOTOS;
        const next = createCollageFromImages(urls, d.recommendedLayout || 'grid-2x2', d.aspectRatio || '1:1');

        if (d.spacing !== undefined) next.spacing = d.spacing;
        if (d.padding !== undefined) next.padding = d.padding;
        if (d.cornerRadius !== undefined) next.cornerRadius = d.cornerRadius;
        if (d.background) next.background = d.background;
        if (d.outerBorder) next.outerBorder = d.outerBorder;
        if (d.pinType) {
          next.items.forEach((it) => {
            it.pinType = d.pinType;
            if (d.pinType === 'polaroid' && d.titleText) {
              it.caption = d.titleText;
            }
          });
        }

        onChangeCollage(next);
        showToast('success', 'AI Design Applied!', d.styleDescription || 'Collage successfully styled.');
      } else {
        showToast('error', 'AI Failed', result.error || 'Could not generate suggestions.');
      }
    } catch (e: any) {
      showToast('error', 'AI Error', e.message || 'Server error during AI generation.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Render & Apply Collage onto Canvas as Main Image
  const handleApplyToCanvas = () => {
    try {
      const offscreen = document.createElement('canvas');
      const size = 2048; // High resolution 2K render

      let w = size;
      let h = size;
      if (collage.aspectRatio === '4:3') {
        w = size;
        h = Math.round(size * (3 / 4));
      } else if (collage.aspectRatio === '3:4') {
        w = Math.round(size * (3 / 4));
        h = size;
      } else if (collage.aspectRatio === '16:9') {
        w = size;
        h = Math.round(size * (9 / 16));
      } else if (collage.aspectRatio === '9:16') {
        w = Math.round(size * (9 / 16));
        h = size;
      }

      offscreen.width = w;
      offscreen.height = h;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      renderCollageToCanvas(ctx, w, h, collage, imagesMapRef.current);
      const dataUrl = offscreen.toDataURL('image/png', 0.95);

      onUpdateImage(dataUrl, 'Rendered Multi-Photo Collage');
      showToast('success', 'Collage Applied', 'Rasterized high-resolution collage to master canvas.');
    } catch (e: any) {
      showToast('error', 'Render Error', e.message || 'Failed to rasterize collage.');
    }
  };

  const selectedItem = collage.items.find((i) => i.id === selectedItemId) || collage.items[0];

  const filteredLayouts = layoutCategory === 'All'
    ? COLLAGE_LAYOUTS
    : COLLAGE_LAYOUTS.filter((l) => l.category === layoutCategory);

  return (
    <div className="p-4 space-y-4 select-none text-slate-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-cyan-950/70 border border-indigo-500/30 p-3.5 rounded-2xl space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-indigo-300 uppercase tracking-wide">
                Collage Studio Pro
              </div>
              <div className="text-[10px] text-slate-400">
                Grid, Freeform, Photo Layouts, Auto Collage &amp; AI Generator
              </div>
            </div>
          </div>

          <button
            onClick={handleApplyToCanvas}
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply to Image</span>
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pt-1 border-t border-slate-800/80 pb-0.5">
          {[
            { id: 'grid', label: 'Grid Layouts', icon: Grid },
            { id: 'styling', label: 'Spacing & Borders', icon: Sliders },
            { id: 'freeform', label: 'Pins & Freeform', icon: Move },
            { id: 'ai', label: 'AI Collage', icon: Wand2, badge: 'AI' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950/70 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[9px] px-1 rounded bg-amber-400 text-slate-950 font-black">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Photos Ribbon Manager */}
      <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <div className="flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-indigo-400" />
            <span>Collage Photos ({collage.items.length})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-[11px] font-bold rounded-lg transition-all"
            >
              <Plus className="w-3 h-3" />
              <span>Add Photos</span>
            </button>

            <button
              onClick={handleLoadDemoPhotos}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-lg transition-all"
              title="Load high-res sample photos"
            >
              Demo Set
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleAddPhotos}
            className="hidden"
          />
        </div>

        {/* Thumbnail Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 pb-1">
          {collage.items.map((item, idx) => {
            const isSelected = item.id === selectedItemId;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className={`relative group shrink-0 w-16 h-16 rounded-xl overflow-hidden border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-400 ring-2 ring-indigo-500/50 scale-105 shadow-md'
                    : 'border-slate-800 opacity-80 hover:opacity-100 hover:border-slate-600'
                }`}
              >
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />

                <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-[9px] font-bold px-1 rounded text-slate-200">
                  #{idx + 1}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveItem(item.id);
                  }}
                  className="absolute top-1 right-1 p-0.5 rounded bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove photo"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 1. GRID LAYOUTS TAB */}
      {activeTab === 'grid' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Layout Presets</span>

            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {(['All', 'Grid', 'Split', 'Magazine', 'Creative', 'Story'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setLayoutCategory(cat)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                    layoutCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredLayouts.map((l) => {
              const isSelected = collage.layout === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => handleSelectLayout(l.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">{l.name}</span>
                    <span className="text-[9px] px-1 rounded bg-slate-800 text-indigo-300 font-mono">
                      {l.idealCount}P
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 truncate">{l.description}</div>
                </button>
              );
            })}
          </div>

          {/* Quick Auto-Collage Button */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Automatic Smart Fit:</span>
            <div className="flex items-center gap-1.5">
              {(['modern', 'vintage', 'minimal', 'story'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    const auto = generateAutoCollage(
                      collage.items.map((i) => i.imageUrl),
                      m
                    );
                    onChangeCollage(auto);
                    showToast('success', 'Auto-Collage', `Generated ${m} layout.`);
                  }}
                  className="px-2 py-1 rounded bg-slate-950 border border-slate-800 hover:border-indigo-500 text-[10px] font-bold capitalize text-slate-300 hover:text-white"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. SPACING, CORNERS & BORDERS TAB */}
      {activeTab === 'styling' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="text-xs font-bold text-slate-200">Spacing, Padding &amp; Corners</div>

          {/* Aspect Ratio */}
          <div className="space-y-1.5">
            <div className="text-xs text-slate-300 font-semibold">Canvas Aspect Ratio</div>
            <div className="grid grid-cols-4 gap-1.5">
              {(['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2'] as const).map((ar) => (
                <button
                  key={ar}
                  onClick={() => updateCollage({ aspectRatio: ar })}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    collage.aspectRatio === ar
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          {/* Spacing & Padding Sliders */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Photo Gap Spacing</span>
                <span className="text-[11px] font-mono text-indigo-400 font-bold">{collage.spacing}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                value={collage.spacing}
                onChange={(e) => updateCollage({ spacing: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Outer Margin Padding</span>
                <span className="text-[11px] font-mono text-indigo-400 font-bold">{collage.padding}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={80}
                value={collage.padding}
                onChange={(e) => updateCollage({ padding: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Photo Rounded Corners</span>
                <span className="text-[11px] font-mono text-indigo-400 font-bold">{collage.cornerRadius}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                value={collage.cornerRadius}
                onChange={(e) => updateCollage({ cornerRadius: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          {/* Background Customizer */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Background Styling</span>
              <div className="flex items-center gap-1">
                {(['solid', 'gradient', 'pattern', 'blur-backdrop'] as const).map((bgType) => (
                  <button
                    key={bgType}
                    onClick={() =>
                      updateCollage({
                        background: { ...collage.background, type: bgType },
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-all ${
                      collage.background.type === bgType
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {bgType.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Solid Color / Swatches */}
            {collage.background.type === 'solid' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Background Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={collage.background.solidColor}
                      onChange={(e) =>
                        updateCollage({
                          background: { ...collage.background, solidColor: e.target.value },
                        })
                      }
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-slate-300 uppercase">
                      {collage.background.solidColor}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  {['#0f172a', '#020617', '#ffffff', '#f8fafc', '#f5ede0', '#1e1b4b', '#172554', '#064e3b', '#701a75', '#450a0a'].map(
                    (col) => (
                      <button
                        key={col}
                        onClick={() =>
                          updateCollage({
                            background: { ...collage.background, solidColor: col },
                          })
                        }
                        className="w-5 h-5 rounded-full border border-slate-700 shadow-sm shrink-0"
                        style={{ backgroundColor: col }}
                      />
                    )
                  )}
                </div>
              </div>
            )}

            {/* Gradient Options */}
            {collage.background.type === 'gradient' && (
              <div className="space-y-2">
                <div className="text-xs text-slate-300 font-semibold">Preset Gradients</div>
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                  {GRADIENT_PRESETS.map((gp) => (
                    <button
                      key={gp.name}
                      onClick={() =>
                        updateCollage({
                          background: {
                            ...collage.background,
                            type: 'gradient',
                            gradient: {
                              type: 'linear',
                              angle: 135,
                              stops: gp.stops,
                            },
                          },
                        })
                      }
                      className="w-6 h-6 rounded-lg border border-slate-700 shrink-0 shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, ${gp.stops.map((s) => s.color).join(', ')})`,
                      }}
                      title={gp.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pattern Options */}
            {collage.background.type === 'pattern' && (
              <div className="space-y-2">
                <div className="text-xs text-slate-300 font-semibold">Textured Patterns</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      'polka-dots',
                      'grid-graph',
                      'diagonal-stripes',
                      'memphis-geo',
                      'topographic-contours',
                      'checkerboard',
                      'wavy-ripples',
                    ] as DesignPatternType[]
                  ).map((pat) => (
                    <button
                      key={pat}
                      onClick={() =>
                        updateCollage({
                          background: { ...collage.background, pattern: pat },
                        })
                      }
                      className={`p-1.5 rounded-lg border text-left text-xs font-medium capitalize truncate ${
                        collage.background.pattern === pat
                          ? 'bg-indigo-950 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pat.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Blur Backdrop */}
            {collage.background.type === 'blur-backdrop' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Photo Backdrop Blur</span>
                  <span className="text-[11px] font-mono text-indigo-400 font-bold">
                    {collage.background.blurAmount || 30}px
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={60}
                  value={collage.background.blurAmount || 30}
                  onChange={(e) =>
                    updateCollage({
                      background: { ...collage.background, blurAmount: Number(e.target.value) },
                    })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Outer Border Controls */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Outer Frame Border</span>
              <input
                type="checkbox"
                checked={collage.outerBorder.enabled}
                onChange={(e) =>
                  updateCollage({
                    outerBorder: { ...collage.outerBorder, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
              />
            </div>

            {collage.outerBorder.enabled && (
              <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div className="grid grid-cols-4 gap-1">
                  {(['solid', 'dashed', 'double', 'vintage'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() =>
                        updateCollage({
                          outerBorder: { ...collage.outerBorder, style: st },
                        })
                      }
                      className={`py-1 rounded text-[10px] font-bold capitalize ${
                        collage.outerBorder.style === st
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-300">Border Color</span>
                  <input
                    type="color"
                    value={collage.outerBorder.color}
                    onChange={(e) =>
                      updateCollage({
                        outerBorder: { ...collage.outerBorder, color: e.target.value },
                      })
                    }
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. PINS & FREEFORM CONTROLS TAB */}
      {activeTab === 'freeform' && selectedItem && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="text-xs font-bold text-slate-200">Selected Photo: {selectedItem.name}</div>
            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded">
              Z-Index: {selectedItem.zIndex}
            </span>
          </div>

          {/* Pin & Tape Decoration */}
          <div className="space-y-1.5">
            <div className="text-xs text-slate-300 font-semibold">Pin / Tape Style</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'none', label: 'None' },
                  { id: 'tape-top', label: 'Top Tape' },
                  { id: 'tape-corners', label: 'Corner Tape' },
                  { id: 'pushpin', label: 'Pushpin' },
                  { id: 'polaroid', label: 'Polaroid Chin' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => updateItem(selectedItem.id, { pinType: p.id })}
                  className={`p-1.5 rounded-lg border text-center text-xs font-medium truncate transition-all ${
                    selectedItem.pinType === p.id
                      ? 'bg-indigo-950 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Caption Input if Polaroid */}
          {selectedItem.pinType === 'polaroid' && (
            <div className="space-y-1">
              <span className="text-xs text-slate-300">Polaroid Caption</span>
              <input
                type="text"
                placeholder="e.g. Summer Memories '24"
                value={selectedItem.caption || ''}
                onChange={(e) => updateItem(selectedItem.id, { caption: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Rotation & Shadow */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Rotation Angle</span>
                <span className="text-[11px] font-mono text-indigo-400 font-bold">{selectedItem.rotation}°</span>
              </div>
              <input
                type="range"
                min={-45}
                max={45}
                value={selectedItem.rotation}
                onChange={(e) => updateItem(selectedItem.id, { rotation: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300">Inner Photo Border</span>
              <input
                type="range"
                min={0}
                max={20}
                value={selectedItem.borderWidth || 0}
                onChange={(e) => updateItem(selectedItem.id, { borderWidth: Number(e.target.value) })}
                className="w-32 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. AI COLLAGE GENERATOR TAB */}
      {activeTab === 'ai' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Wand2 className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Thematic Collage Generator</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
              Gemini 3.7
            </span>
          </div>

          <div className="space-y-2">
            <textarea
              rows={2}
              placeholder="Describe your desired collage aesthetic (e.g. '90s disposable camera scrapbook with warm tones, yellow tape, and polaroid scatter')..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 resize-none"
            />

            <button
              onClick={() => handleAiSuggestCollage()}
              disabled={isAiLoading}
              className="w-full py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-600 hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
            >
              {isAiLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Designing Custom Layout...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate AI Collage Style</span>
                </>
              )}
            </button>
          </div>

          {/* Quick AI Presets */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Instant AI Theme Presets</div>
            <div className="grid grid-cols-1 gap-1.5">
              {AI_PROMPT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setAiPrompt(p.prompt);
                    handleAiSuggestCollage(p.prompt);
                  }}
                  disabled={isAiLoading}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-left transition-all group"
                >
                  <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 flex items-center justify-between">
                    <span>{p.label}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">{p.prompt}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
