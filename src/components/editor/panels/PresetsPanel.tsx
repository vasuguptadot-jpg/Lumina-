import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Check,
  Sliders,
  Bookmark,
  Search,
  Star,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Flame,
  Layers,
  Palette,
  Eye,
  SlidersHorizontal,
  Copy,
  Trash2,
  Edit3,
  Sun,
  Camera,
  Film,
  Compass,
  Utensils,
  Share2,
  Tv,
  Aperture,
  Wind,
  Moon,
  CloudSun,
  ShieldCheck,
  Download,
  Upload,
  Globe,
  Wand2,
  Lightbulb,
  Heart,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Code,
  FileCode,
  FileJson,
  X,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Tag,
  User,
  Sliders as SlidersIcon,
  ShoppingBag,
} from 'lucide-react';
import {
  FilterPreset,
  FilterCategory,
  AdjustmentSettings,
  HSLSettings,
  Project,
  PresetRecommendation,
  AiPresetGenerationResult,
} from '../../../types/editor';
import {
  FILTER_CATEGORIES,
  FILTER_PRESETS,
  MARKETPLACE_PRESETS,
  getPresetById,
  searchPresets,
  exportPresetAsJsonFile,
  exportPresetAsXmpFile,
  generatePresetShareCode,
  parsePresetShareCode,
} from '../../../engine/presets';
import { requestAiGeneratePreset, requestAiRecommendPresets } from '../../../services/aiService';

interface PresetsPanelProps {
  project?: Project;
  activePresetId: string | null;
  presetStrength: number;
  customPresets: FilterPreset[];
  onSelectPreset: (presetId: string | null) => void;
  onChangeStrength: (strength: number) => void;
  onSaveAsCustomPreset: (name: string, presetData?: Partial<FilterPreset>) => void;
  onUpdateCustomPreset?: (preset: FilterPreset) => void;
  onDeleteCustomPreset?: (presetId: string) => void;
  onBatchImportPresets?: (presets: FilterPreset[]) => void;
  onApplyPresetToBaseSettings?: (preset: FilterPreset, strength: number) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  All: <Sparkles className="w-3.5 h-3.5" />,
  Marketplace: <Globe className="w-3.5 h-3.5 text-indigo-400" />,
  Recommendations: <Lightbulb className="w-3.5 h-3.5 text-amber-400" />,
  Favorites: <Star className="w-3.5 h-3.5 text-amber-400" />,
  Custom: <Bookmark className="w-3.5 h-3.5 text-emerald-400" />,
  Cinematic: <Film className="w-3.5 h-3.5 text-rose-400" />,
  Portrait: <Camera className="w-3.5 h-3.5 text-pink-400" />,
  Landscape: <Compass className="w-3.5 h-3.5 text-emerald-400" />,
  Street: <Aperture className="w-3.5 h-3.5 text-amber-400" />,
  Food: <Utensils className="w-3.5 h-3.5 text-orange-400" />,
  Travel: <Compass className="w-3.5 h-3.5 text-cyan-400" />,
  Fashion: <Flame className="w-3.5 h-3.5 text-fuchsia-400" />,
  Vintage: <Tv className="w-3.5 h-3.5 text-yellow-500" />,
  Film: <Film className="w-3.5 h-3.5 text-purple-400" />,
  'Black & white': <Layers className="w-3.5 h-3.5 text-slate-300" />,
  Moody: <Moon className="w-3.5 h-3.5 text-slate-400" />,
  Bright: <Sun className="w-3.5 h-3.5 text-yellow-300" />,
  Warm: <Flame className="w-3.5 h-3.5 text-orange-500" />,
  Cool: <Wind className="w-3.5 h-3.5 text-blue-400" />,
  Professional: <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />,
  'Social media': <Share2 className="w-3.5 h-3.5 text-pink-500" />,
};

// Gradient color options for new preset creation
const PRESET_GRADIENTS = [
  'from-indigo-600 to-purple-600',
  'from-amber-500 via-orange-600 to-rose-600',
  'from-teal-500 to-emerald-700',
  'from-rose-600 via-pink-600 to-amber-400',
  'from-cyan-600 to-blue-800',
  'from-violet-700 via-fuchsia-600 to-pink-500',
  'from-zinc-800 to-slate-950',
  'from-yellow-400 via-amber-500 to-red-600',
];

// Quick inspiration prompts for AI preset generation
const AI_INSPIRATION_PROMPTS = [
  'Cinematic Teal & Warm Gold with soft highlights and deep filmic shadows',
  'Vintage 1970s Kodachrome road trip with warm golden sun and faded olive greens',
  'Moody Nordic pine forest with desaturated greens and high atmospheric clarity',
  'Cyberpunk neon night in Tokyo with electric cyan midtones and magenta glow',
  'Editorial French Vogue studio portrait with high contrast and porcelain skin',
  'Golden hour Mediterranean terracotta with turquoise ocean saturation',
  'Fine Art Leica Monochrom with rich Zone System dynamic range and organic grain',
  'Warm Aesthetic pastel dream with creamy highlights and matte shadows',
];

export const PresetsPanel: React.FC<PresetsPanelProps> = ({
  project,
  activePresetId,
  presetStrength,
  customPresets,
  onSelectPreset,
  onChangeStrength,
  onSaveAsCustomPreset,
  onUpdateCustomPreset,
  onDeleteCustomPreset,
  onBatchImportPresets,
  onApplyPresetToBaseSettings,
  showToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'presets' | 'ai-studio' | 'recommendations' | 'marketplace'>('presets');

  // Favorites
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lumina_fav_presets');
      return saved ? JSON.parse(saved) : ['cinematic-teal-orange', 'film-kodak-portra-400', 'mkt-amalfi-sun'];
    } catch {
      return ['cinematic-teal-orange', 'film-kodak-portra-400'];
    }
  });

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [selectedPresetForAction, setSelectedPresetForAction] = useState<FilterPreset | null>(null);

  // New preset form state
  const [newPresetForm, setNewPresetForm] = useState({
    name: '',
    category: 'Cinematic',
    description: '',
    tags: 'cinematic, warm, tone',
    gradient: PRESET_GRADIENTS[0],
    includeToneCurves: true,
    includeHsl: true,
  });

  // Share Modal state
  const [shareCodeString, setShareCodeString] = useState('');
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  // Import Modal state
  const [importShareCodeInput, setImportShareCodeInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Preset Generator state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMood, setAiMood] = useState('Cinematic Blockbuster');
  const [aiTargetCategory, setAiTargetCategory] = useState('Cinematic');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGeneratedResult, setAiGeneratedResult] = useState<AiPresetGenerationResult | null>(null);

  // AI Recommendations state
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [recommendations, setRecommendations] = useState<PresetRecommendation[]>([]);
  const [sceneAnalysisText, setSceneAnalysisText] = useState('');

  // Marketplace filter
  const [marketplaceFilter, setMarketplaceFilter] = useState<'trending' | 'top-rated' | 'downloads' | 'newest'>('trending');

  // Parameter fine-tuning state
  const [showParameterEditor, setShowParameterEditor] = useState(false);
  const [activeParamTab, setActiveParamTab] = useState<'tone' | 'color' | 'detail' | 'hsl'>('tone');
  const [customizedPresetOverrides, setCustomizedPresetOverrides] = useState<Record<string, Partial<AdjustmentSettings>>>({});
  const [customizedHslOverrides, setCustomizedHslOverrides] = useState<Record<string, Partial<HSLSettings>>>({});

  // Toggle favorite
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id];
      try {
        localStorage.setItem('lumina_fav_presets', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Base active preset
  const baseActivePreset = useMemo(() => {
    return getPresetById(activePresetId, customPresets);
  }, [activePresetId, customPresets]);

  // Current active preset with in-memory overrides
  const currentActivePreset = useMemo(() => {
    if (!baseActivePreset) return undefined;
    const pId = baseActivePreset.id;
    const settingsOverride = customizedPresetOverrides[pId] || {};
    const hslOverride = customizedHslOverrides[pId] || {};

    return {
      ...baseActivePreset,
      settings: { ...baseActivePreset.settings, ...settingsOverride },
      hsl: baseActivePreset.hsl ? { ...baseActivePreset.hsl, ...hslOverride } : undefined,
    };
  }, [baseActivePreset, customizedPresetOverrides, customizedHslOverrides]);

  // All combined presets
  const allPresets = useMemo(() => {
    return [...customPresets, ...MARKETPLACE_PRESETS, ...FILTER_PRESETS];
  }, [customPresets]);

  // Filtered preset list
  const filteredPresets = useMemo(() => {
    if (selectedCategory === 'Marketplace') {
      return MARKETPLACE_PRESETS;
    }
    return searchPresets(
      searchQuery,
      selectedCategory === 'Favorites' ? 'All' : selectedCategory,
      customPresets,
      selectedCategory === 'Favorites',
      favoriteIds
    );
  }, [searchQuery, selectedCategory, customPresets, favoriteIds]);

  // Filtered marketplace items
  const sortedMarketplacePresets = useMemo(() => {
    const list = [...MARKETPLACE_PRESETS];
    if (marketplaceFilter === 'trending') {
      return list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    }
    if (marketplaceFilter === 'top-rated') {
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    if (marketplaceFilter === 'downloads') {
      return list.sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0));
    }
    return list;
  }, [marketplaceFilter]);

  // --------------------------------------------------------------------------
  // CREATE & SAVE PRESET
  // --------------------------------------------------------------------------
  const handleOpenCreateModal = () => {
    if (!project) {
      showToast?.('error', 'No Active Photo', 'Open an image first to capture its adjustments.');
      return;
    }
    setNewPresetForm({
      name: `${project.name || 'My Photo'} Preset`,
      category: 'Cinematic',
      description: 'Custom stylized color grade created in Lumina Studio',
      tags: 'custom, lumina, tone',
      gradient: PRESET_GRADIENTS[Math.floor(Math.random() * PRESET_GRADIENTS.length)],
      includeToneCurves: true,
      includeHsl: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveNewPreset = () => {
    if (!newPresetForm.name.trim()) {
      showToast?.('error', 'Name Required', 'Please provide a name for your preset.');
      return;
    }

    const tagList = newPresetForm.tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const presetData: Partial<FilterPreset> = {
      category: newPresetForm.category,
      description: newPresetForm.description,
      thumbnailGradient: newPresetForm.gradient,
      tags: tagList.length > 0 ? tagList : ['custom'],
      settings: project ? { ...project.currentSettings } : {},
      toneCurves: newPresetForm.includeToneCurves && project ? { ...project.toneCurves } : undefined,
      hsl: newPresetForm.includeHsl && project ? { ...project.hsl } : undefined,
      author: 'You (Creator)',
      createdAt: Date.now(),
    };

    onSaveAsCustomPreset(newPresetForm.name.trim(), presetData);
    setIsCreateModalOpen(false);
  };

  // --------------------------------------------------------------------------
  // SHARE PRESET
  // --------------------------------------------------------------------------
  const handleOpenShareModal = (preset: FilterPreset, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedPresetForAction(preset);
    const code = generatePresetShareCode(preset);
    setShareCodeString(code);
    setIsCodeCopied(false);
    setIsShareModalOpen(true);
  };

  const handleCopyShareCode = () => {
    navigator.clipboard.writeText(shareCodeString);
    setIsCodeCopied(true);
    showToast?.('success', 'Share Code Copied', 'Paste this code anywhere for instant 1-click import.');
    setTimeout(() => setIsCodeCopied(false), 3000);
  };

  const handleCopyJsonSnippet = () => {
    if (!selectedPresetForAction) return;
    const jsonStr = JSON.stringify(selectedPresetForAction, null, 2);
    navigator.clipboard.writeText(jsonStr);
    showToast?.('success', 'JSON Copied', 'Preset JSON payload copied to clipboard.');
  };

  // --------------------------------------------------------------------------
  // IMPORT PRESET
  // --------------------------------------------------------------------------
  const handleImportFromShareCode = () => {
    if (!importShareCodeInput.trim()) {
      showToast?.('error', 'Empty Code', 'Please paste a valid Lumina Share Code.');
      return;
    }

    const parsed = parsePresetShareCode(importShareCodeInput);
    if (!parsed) {
      showToast?.('error', 'Invalid Share Code', 'Could not parse the provided preset share code.');
      return;
    }

    onSaveAsCustomPreset(parsed.name, parsed);
    setImportShareCodeInput('');
    setIsImportModalOpen(false);
    showToast?.('success', 'Preset Imported!', `Added "${parsed.name}" to your preset library.`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const importedList: FilterPreset[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        const json = JSON.parse(text);

        if (json.name && (json.settings || json.hsl)) {
          importedList.push({
            id: `file_imported_${Date.now()}_${i}`,
            name: json.name,
            category: json.category || 'Custom',
            description: json.description || 'Imported preset file',
            thumbnailGradient: json.thumbnailGradient || 'from-indigo-600 to-purple-600',
            settings: json.settings || {},
            hsl: json.hsl,
            toneCurves: json.toneCurves,
            tags: json.tags || ['imported'],
            author: json.author || 'Imported File',
            createdAt: Date.now(),
          });
        }
      } catch (err) {
        console.error(`Failed to parse file ${file.name}:`, err);
      }
    }

    if (importedList.length > 0) {
      if (onBatchImportPresets) {
        onBatchImportPresets(importedList);
      } else {
        importedList.forEach((p) => onSaveAsCustomPreset(p.name, p));
      }
      setIsImportModalOpen(false);
      showToast?.('success', 'Presets Imported', `Successfully imported ${importedList.length} presets.`);
    } else {
      showToast?.('error', 'Import Failed', 'No valid Lumina preset JSON found in selected files.');
    }
  };

  // --------------------------------------------------------------------------
  // EXPORT PRESET
  // --------------------------------------------------------------------------
  const handleExportJson = (preset: FilterPreset, e?: React.MouseEvent) => {
    e?.stopPropagation();
    exportPresetAsJsonFile(preset);
    showToast?.('success', 'Preset Downloaded', `Exported "${preset.name}" as JSON.`);
  };

  const handleExportXmp = (preset: FilterPreset, e?: React.MouseEvent) => {
    e?.stopPropagation();
    exportPresetAsXmpFile(preset);
    showToast?.('success', 'Lightroom XMP Exported', `Exported "${preset.name}.xmp" compatible with Adobe Lightroom & Camera Raw.`);
  };

  const handleExportAllCustomBundle = () => {
    if (customPresets.length === 0) {
      showToast?.('info', 'No Custom Presets', 'Create some custom presets first to export a bundle.');
      return;
    }
    const data = JSON.stringify(customPresets, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lumina_Custom_Presets_Bundle_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast?.('success', 'Preset Bundle Exported', `Exported all ${customPresets.length} custom presets.`);
  };

  // --------------------------------------------------------------------------
  // INSTALL MARKETPLACE PRESET
  // --------------------------------------------------------------------------
  const handleInstallMarketplacePreset = (mktPreset: FilterPreset) => {
    const installed: FilterPreset = {
      ...mktPreset,
      id: `installed_${mktPreset.id}_${Date.now()}`,
      category: mktPreset.category,
      createdAt: Date.now(),
    };

    onSaveAsCustomPreset(installed.name, installed);
    showToast?.('success', 'Installed to Library', `"${installed.name}" by ${mktPreset.author || 'Community'} added to your presets.`);
  };

  // --------------------------------------------------------------------------
  // AI PRESET GENERATOR
  // --------------------------------------------------------------------------
  const handleGenerateAiPreset = async (overridePrompt?: string) => {
    const promptToUse = overridePrompt || aiPrompt;
    if (!promptToUse.trim()) {
      showToast?.('error', 'Prompt Required', 'Please enter a description or vibe for your AI preset.');
      return;
    }

    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    let imageBase64: string | undefined = undefined;
    if (canvas) {
      try {
        imageBase64 = canvas.toDataURL('image/jpeg', 0.85);
      } catch {}
    }

    setIsAiGenerating(true);
    setAiGeneratedResult(null);
    showToast?.('info', 'Analyzing Photo & Synthesizing Look', 'Gemini 3.7 is analyzing your image to calculate custom Exposure, Contrast, Curves, HSL, Color Grading, Grain, Sharpening & Vignette...');

    try {
      const res = await requestAiGeneratePreset(promptToUse, aiMood, aiTargetCategory, imageBase64);
      if (res.success && res.data?.preset) {
        setAiGeneratedResult(res.data);
        // Automatically save and activate this preset
        onSaveAsCustomPreset(res.data.preset.name, res.data.preset);
        onSelectPreset(res.data.preset.id);
        showToast?.('success', 'AI Preset Generated & Saved!', `Applied "${res.data.preset.name}" to your image and saved to library.`);
      } else {
        showToast?.('error', 'Generation Error', res.error || 'Could not generate preset from prompt.');
      }
    } catch (err: any) {
      showToast?.('error', 'AI Server Error', err.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSaveAiGeneratedPreset = () => {
    if (!aiGeneratedResult?.preset) return;
    const p = aiGeneratedResult.preset;
    onSaveAsCustomPreset(p.name, p);
    onSelectPreset(p.id);
    showToast?.('success', 'AI Preset Saved', `"${p.name}" is saved to your custom preset collection.`);
  };

  // --------------------------------------------------------------------------
  // AI PRESET RECOMMENDATIONS
  // --------------------------------------------------------------------------
  const handleRunAiRecommendations = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      showToast?.('error', 'No Image Canvas', 'Load an image in the editor to run recommendations.');
      return;
    }

    setIsAnalyzingImage(true);
    setRecommendations([]);
    setSceneAnalysisText('');
    showToast?.('info', 'Analyzing Scene', 'Gemini is evaluating lighting, subject matter, and color temperature...');

    try {
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);
      const res = await requestAiRecommendPresets(imageBase64, allPresets);

      if (res.success && res.data?.recommendations) {
        const enriched: PresetRecommendation[] = res.data.recommendations.map((rec: any) => {
          const matchObj = getPresetById(rec.presetId, customPresets) || allPresets[0];
          return {
            presetId: rec.presetId,
            preset: matchObj,
            matchScore: rec.matchScore || 92,
            reason: rec.reason || 'Harmonizes scene lighting and color tones.',
            suggestedStrength: rec.suggestedStrength || 100,
            tags: rec.tags || ['Recommended'],
          };
        });

        setRecommendations(enriched);
        setSceneAnalysisText(res.data.sceneAnalysis || 'Scene analyzed successfully.');
        showToast?.('success', 'Recommendations Ready', `Found ${enriched.length} curated presets tailored to this shot.`);
      } else {
        showToast?.('error', 'Analysis Failed', res.error || 'Could not analyze scene.');
      }
    } catch (err: any) {
      showToast?.('error', 'AI Recommendation Error', err.message);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // --------------------------------------------------------------------------
  // PARAMETER FINE-TUNING
  // --------------------------------------------------------------------------
  const handleUpdateParameter = (key: keyof AdjustmentSettings, val: number) => {
    if (!baseActivePreset) return;
    const pId = baseActivePreset.id;
    setCustomizedPresetOverrides((prev) => ({
      ...prev,
      [pId]: {
        ...(prev[pId] || baseActivePreset.settings),
        [key]: val,
      },
    }));
  };

  const handleUpdateSplitToningParam = (
    field: 'shadowHue' | 'shadowSat' | 'highlightHue' | 'highlightSat' | 'balance',
    val: number
  ) => {
    if (!baseActivePreset) return;
    const pId = baseActivePreset.id;
    const currentSettings = customizedPresetOverrides[pId] || baseActivePreset.settings;
    const currentST = currentSettings.splitToning || {
      shadowHue: 210,
      shadowSat: 0,
      highlightHue: 40,
      highlightSat: 0,
      balance: 0,
    };

    setCustomizedPresetOverrides((prev) => ({
      ...prev,
      [pId]: {
        ...currentSettings,
        splitToning: {
          ...currentST,
          [field]: val,
        },
      },
    }));
  };

  const handleResetParameters = () => {
    if (!baseActivePreset) return;
    const pId = baseActivePreset.id;
    setCustomizedPresetOverrides((prev) => {
      const next = { ...prev };
      delete next[pId];
      return next;
    });
    setCustomizedHslOverrides((prev) => {
      const next = { ...prev };
      delete next[pId];
      return next;
    });
    showToast?.('info', 'Parameters Reset', `Reverted "${baseActivePreset.name}" to factory default values.`);
  };

  const handleApplyToBase = () => {
    if (!currentActivePreset || !onApplyPresetToBaseSettings) return;
    onApplyPresetToBaseSettings(currentActivePreset, presetStrength);
    showToast?.(
      'success',
      'Baked to Adjustments',
      `Merged preset "${currentActivePreset.name}" into basic photo controls.`
    );
  };

  return (
    <div className="p-4 space-y-4 text-slate-200">
      {/* Studio Header & Main Mode Navigation */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-indigo-400" />
            Preset Studio Pro
          </h3>
          <p className="text-[11px] text-slate-400">Library, Marketplace, AI Generation & Recommendations</p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsImportModalOpen(true)}
            title="Import Presets (.json, .xmp, Share Code)"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleExportAllCustomBundle}
            title="Export All Custom Presets"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleOpenCreateModal}
            title="Create New Preset from Active Photo"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* Main Studio Navigation Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] font-bold">
        {[
          { id: 'presets', label: 'Library', icon: Bookmark },
          { id: 'marketplace', label: 'Market', icon: Globe },
          { id: 'ai-studio', label: 'AI Create', icon: Wand2 },
          { id: 'recommendations', label: 'AI Pick', icon: Lightbulb },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: PRESET LIBRARY (Browser & Categories)                         */}
      {/* ==================================================================== */}
      {activeTab === 'presets' && (
        <div className="space-y-4">
          {/* Active Preset Intensity Banner */}
          {currentActivePreset && (
            <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-3.5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${currentActivePreset.thumbnailGradient} shadow-md flex items-center justify-center text-white text-xs font-bold`}>
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{currentActivePreset.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-semibold uppercase">
                        {currentActivePreset.category}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">{currentActivePreset.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenShareModal(currentActivePreset)}
                    title="Share Preset"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleExportJson(currentActivePreset)}
                    title="Export JSON"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <FileJson className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleExportXmp(currentActivePreset)}
                    title="Export Lightroom XMP"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onSelectPreset(null)}
                    title="Remove Preset"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Intensity Slider */}
              <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="font-semibold flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    Preset Strength / Opacity
                  </span>
                  <span className="font-mono text-indigo-300 font-bold">{presetStrength}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={150}
                  value={presetStrength}
                  onChange={(e) => onChangeStrength(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
              </div>

              {/* Actions: Fine-tune / Bake to Base */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowParameterEditor(!showParameterEditor)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{showParameterEditor ? 'Hide Fine-Tune' : 'Fine-Tune Sliders'}</span>
                </button>
                <button
                  onClick={handleApplyToBase}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-500/40 text-xs font-semibold text-indigo-200 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Bake to Base</span>
                </button>
              </div>

              {/* Parameter Editor Drawer */}
              {showParameterEditor && (
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex border-b border-slate-800 text-[10px] font-bold">
                    {(['tone', 'color', 'detail', 'hsl'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveParamTab(tab)}
                        className={`px-3 py-1.5 uppercase transition-colors border-b-2 ${
                          activeParamTab === tab
                            ? 'border-indigo-500 text-indigo-300'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                    <div className="flex-1" />
                    <button
                      onClick={handleResetParameters}
                      title="Reset parameters to preset default"
                      className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Reset</span>
                    </button>
                  </div>

                  {activeParamTab === 'tone' && (
                    <div className="space-y-2 text-xs">
                      {(
                        [
                          { key: 'exposure', label: 'Exposure', min: -50, max: 50 },
                          { key: 'contrast', label: 'Contrast', min: -50, max: 50 },
                          { key: 'highlights', label: 'Highlights', min: -50, max: 50 },
                          { key: 'shadows', label: 'Shadows', min: -50, max: 50 },
                        ] as const
                      ).map(({ key, label, min, max }) => {
                        const val = currentActivePreset.settings[key] || 0;
                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>{label}</span>
                              <span className="font-mono text-slate-200">{val}</span>
                            </div>
                            <input
                              type="range"
                              min={min}
                              max={max}
                              value={val}
                              onChange={(e) => handleUpdateParameter(key, Number(e.target.value))}
                              className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeParamTab === 'color' && (
                    <div className="space-y-2 text-xs">
                      {(
                        [
                          { key: 'temperature', label: 'Temp', min: -50, max: 50 },
                          { key: 'tint', label: 'Tint', min: -50, max: 50 },
                          { key: 'saturation', label: 'Saturation', min: -50, max: 50 },
                          { key: 'vibrance', label: 'Vibrance', min: -50, max: 50 },
                        ] as const
                      ).map(({ key, label, min, max }) => {
                        const val = currentActivePreset.settings[key] || 0;
                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>{label}</span>
                              <span className="font-mono text-slate-200">{val}</span>
                            </div>
                            <input
                              type="range"
                              min={min}
                              max={max}
                              value={val}
                              onChange={(e) => handleUpdateParameter(key, Number(e.target.value))}
                              className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeParamTab === 'detail' && (
                    <div className="space-y-2 text-xs">
                      {(
                        [
                          { key: 'clarity', label: 'Clarity', min: -50, max: 50 },
                          { key: 'sharpness', label: 'Sharpness', min: 0, max: 80 },
                          { key: 'filmGrain', label: 'Film Grain', min: 0, max: 80 },
                          { key: 'vignette', label: 'Vignette', min: -60, max: 60 },
                        ] as const
                      ).map(({ key, label, min, max }) => {
                        const val = currentActivePreset.settings[key] || 0;
                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>{label}</span>
                              <span className="font-mono text-slate-200">{val}</span>
                            </div>
                            <input
                              type="range"
                              min={min}
                              max={max}
                              value={val}
                              onChange={(e) => handleUpdateParameter(key, Number(e.target.value))}
                              className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search presets, film stocks, tags, styles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categories Horizontal Carousel */}
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none text-[11px]">
            {['All', 'Favorites', 'Custom', ...FILTER_CATEGORIES].map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || <Palette className="w-3.5 h-3.5" />;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                  }`}
                >
                  {Icon}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Preset Cards Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {filteredPresets.map((preset) => {
              const isActive = activePresetId === preset.id;
              const isFav = favoriteIds.includes(preset.id);
              const isCustom = customPresets.some((cp) => cp.id === preset.id);

              return (
                <div
                  key={preset.id}
                  onClick={() => onSelectPreset(isActive ? null : preset.id)}
                  className={`relative rounded-2xl border p-3 cursor-pointer transition-all duration-200 group flex flex-col justify-between h-36 ${
                    isActive
                      ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                  }`}
                >
                  {/* Top Header: Gradient Swatch & Star */}
                  <div className="flex items-start justify-between">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${preset.thumbnailGradient} shadow-md flex items-center justify-center text-white`}>
                      {isActive ? <Check className="w-4 h-4" /> : null}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => toggleFavorite(preset.id, e)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-400 fill-amber-400' : ''}`} />
                      </button>

                      {/* Dropdown / Share Trigger */}
                      <button
                        onClick={(e) => handleOpenShareModal(preset, e)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Share / Export"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {isCustom && onDeleteCustomPreset && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCustomPreset(preset.id);
                          }}
                          className="p-1 rounded-lg hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete Custom Preset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Preset Info */}
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                      <span>{preset.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">{preset.description}</div>
                  </div>

                  {/* Badges / Category Tag */}
                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <span className="font-semibold uppercase tracking-wider text-indigo-400/90">{preset.category}</span>
                    {preset.rating && (
                      <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        {preset.rating}
                      </span>
                    )}
                    {isCustom && <span className="text-emerald-400 font-bold">Custom</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPresets.length === 0 && (
            <div className="text-center py-10 space-y-2 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-xs font-bold text-slate-300">No Presets Found</div>
              <div className="text-[11px] text-slate-500 max-w-xs mx-auto">
                No matching presets found in "{selectedCategory}". Try changing your search query or generate one with AI.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: PRESET MARKETPLACE (Community Curations)                     */}
      {/* ==================================================================== */}
      {activeTab === 'marketplace' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-tr from-indigo-950/80 via-purple-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-3.5 space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-400" />
                Community Preset Hub
              </span>
              <span className="text-[10px] text-indigo-300 bg-indigo-950 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                Free & Verified
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Explore pro color grading profiles crafted by Hollywood colorists, Vogue retouchers, and film enthusiasts.
            </p>
          </div>

          {/* Marketplace Sub-Filter Tabs */}
          <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
            {[
              { id: 'trending', label: 'Trending', icon: TrendingUp },
              { id: 'top-rated', label: 'Top 5★', icon: Star },
              { id: 'downloads', label: 'Popular', icon: Download },
            ].map((f) => {
              const Icon = f.icon;
              const isSelected = marketplaceFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setMarketplaceFilter(f.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all ${
                    isSelected ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* Marketplace Preset List */}
          <div className="space-y-3">
            {sortedMarketplacePresets.map((mkt) => {
              const isAlreadyInstalled = customPresets.some((cp) => cp.name === mkt.name);
              const isActive = activePresetId === mkt.id;

              return (
                <div
                  key={mkt.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${mkt.thumbnailGradient} shadow-md flex items-center justify-center text-white shrink-0`}>
                        <Film className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{mkt.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-semibold">
                            {mkt.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          {mkt.authorAvatar ? (
                            <img src={mkt.authorAvatar} alt={mkt.author} className="w-3.5 h-3.5 rounded-full object-cover" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>By {mkt.author}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                            <Star className="w-2.5 h-2.5 fill-amber-400" />
                            {mkt.rating}
                          </span>
                          <span>•</span>
                          <span>{((mkt.downloadsCount || 0) / 1000).toFixed(1)}k DLs</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">{mkt.description}</p>

                  {/* Recommended Scene Tags */}
                  {mkt.recommendedFor && (
                    <div className="flex flex-wrap gap-1">
                      {mkt.recommendedFor.map((rec) => (
                        <span key={rec} className="text-[9px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-medium">
                          {rec}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => onSelectPreset(isActive ? null : mkt.id)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Active on Canvas' : 'Preview / Test'}</span>
                    </button>

                    <button
                      onClick={() => handleInstallMarketplacePreset(mkt)}
                      disabled={isAlreadyInstalled}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isAlreadyInstalled ? 'Installed' : 'Install'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: AI-GENERATED PRESETS (Gemini 3.7 Studio)                     */}
      {/* ==================================================================== */}
      {activeTab === 'ai-studio' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-tr from-purple-950/80 via-indigo-950/50 to-slate-900 border border-purple-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/40">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">AI Color Profile Synthesizer</h4>
                  <p className="text-[10px] text-purple-300">Powered by Gemini 3.7 Color Science</p>
                </div>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-purple-900/80 text-purple-200 border border-purple-400/30 font-bold">
                Smart S-Curves & HSL
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Describe any aesthetic, movie look, film stock, or lighting vibe. Gemini generates exact mathematical slider values, 8-channel HSL mixer, and tone curves.
            </p>

            {/* Prompt Input */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-bold text-slate-200">Describe Your Desired Look</label>
              <textarea
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. 1990s Tokyo rainy night cyber film with cyan shadows, deep blacks, magenta neon highlights and subtle warm skin tones..."
                className="w-full bg-slate-900 border border-purple-500/30 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-400 transition-colors"
              />
            </div>

            {/* Quick Inspiration Pills */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-400">Quick Inspiration Styles:</label>
              <div className="space-y-1">
                {/* Highlighted Dark Cinematic Button */}
                <button
                  onClick={() => {
                    setAiPrompt('Make this photo look like a dark cinematic movie with moody cyan shadows, warm skin tones, lifted film blacks, and atmospheric film grain.');
                    handleGenerateAiPreset('Make this photo look like a dark cinematic movie with moody cyan shadows, warm skin tones, lifted film blacks, and atmospheric film grain.');
                  }}
                  className="w-full text-[11px] p-2 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-200 hover:text-white font-bold transition-all text-left flex items-center justify-between group shadow-sm"
                >
                  <span className="flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-purple-400" />
                    <span>"Make this photo look like a dark cinematic movie"</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {AI_INSPIRATION_PROMPTS.slice(1, 5).map((p) => (
                    <button
                      key={p}
                      onClick={() => setAiPrompt(p)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-900/50 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-white transition-all text-left truncate max-w-full"
                    >
                      ✨ {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={() => handleGenerateAiPreset()}
              disabled={isAiGenerating || !aiPrompt.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
            >
              {isAiGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Photo & Computing Settings...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate & Apply Custom Preset</span>
                </>
              )}
            </button>
          </div>

          {/* AI Result Card */}
          {aiGeneratedResult && (
            <div className="bg-slate-900/90 border border-purple-500/50 rounded-2xl p-4 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${aiGeneratedResult.preset.thumbnailGradient} shadow-md flex items-center justify-center text-white shrink-0`}>
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                      <span>{aiGeneratedResult.preset.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold">
                        Auto-Saved
                      </span>
                    </h4>
                    <span className="text-[10px] text-purple-300 font-medium">Category: {aiGeneratedResult.preset.category}</span>
                  </div>
                </div>

                <button
                  onClick={handleSaveAiGeneratedPreset}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-md shadow-purple-600/30 transition-all"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save Preset</span>
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{aiGeneratedResult.preset.description}</p>

              {/* Comprehensive Calibrated Parameter Breakdown */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-3">
                <div className="text-xs font-bold text-purple-300 flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <SlidersIcon className="w-3.5 h-3.5 text-purple-400" />
                    AI Calibrated Parameter Recipe
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Real-Time Computed</span>
                </div>

                {/* 1. Exposure & Dynamic Range */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Exposure & Contrast</span>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Exposure</span>
                      <span className="text-white font-bold">{aiGeneratedResult.preset.settings.exposure ?? 0}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Contrast</span>
                      <span className="text-white font-bold">{aiGeneratedResult.preset.settings.contrast ?? 0}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Highlights</span>
                      <span className="text-white font-bold">{aiGeneratedResult.preset.settings.highlights ?? 0}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Shadows</span>
                      <span className="text-white font-bold">{aiGeneratedResult.preset.settings.shadows ?? 0}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Whites</span>
                      <span className="text-white font-bold">{aiGeneratedResult.preset.settings.whites ?? 0}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Blacks</span>
                      <span className="text-white font-bold">{aiGeneratedResult.preset.settings.blacks ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Color Grading & Split Toning */}
                {aiGeneratedResult.preset.settings.splitToning && (
                  <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Color Grading (Split Toning)</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex justify-between text-slate-400 font-medium">
                          <span>Shadow Tone</span>
                          <span className="font-mono text-cyan-300 font-bold">{aiGeneratedResult.preset.settings.splitToning.shadowHue}° ({aiGeneratedResult.preset.settings.splitToning.shadowSat}%)</span>
                        </div>
                        <div
                          className="h-2 rounded w-full"
                          style={{
                            backgroundColor: `hsl(${aiGeneratedResult.preset.settings.splitToning.shadowHue}, ${aiGeneratedResult.preset.settings.splitToning.shadowSat}%, 30%)`,
                          }}
                        />
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex justify-between text-slate-400 font-medium">
                          <span>Highlight Tone</span>
                          <span className="font-mono text-amber-300 font-bold">{aiGeneratedResult.preset.settings.splitToning.highlightHue}° ({aiGeneratedResult.preset.settings.splitToning.highlightSat}%)</span>
                        </div>
                        <div
                          className="h-2 rounded w-full"
                          style={{
                            backgroundColor: `hsl(${aiGeneratedResult.preset.settings.splitToning.highlightHue}, ${aiGeneratedResult.preset.settings.splitToning.highlightSat}%, 70%)`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Texture, Grain, Sharpness & Vignette */}
                <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Atmosphere & Optics</span>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Film Grain</span>
                      <span className="text-amber-300 font-bold">{aiGeneratedResult.preset.settings.filmGrain ?? 0}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Sharpening</span>
                      <span className="text-emerald-300 font-bold">{aiGeneratedResult.preset.settings.sharpness ?? 0}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Vignette</span>
                      <span className="text-purple-300 font-bold">{aiGeneratedResult.preset.settings.vignette ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Tone Curves */}
                {aiGeneratedResult.preset.toneCurves && (
                  <div className="pt-1 border-t border-slate-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Custom S-Curves</span>
                    <div className="flex gap-2 text-[10px] text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Master 5-pt S-Curve</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">RGB Shadow Lift</span>
                    </div>
                  </div>
                )}
              </div>

              {aiGeneratedResult.analysis && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300 leading-relaxed">
                  <span className="font-bold text-purple-300">Colorist Scene Diagnostic: </span>
                  {aiGeneratedResult.analysis}
                </div>
              )}

              {/* Color Palette Swatches */}
              {aiGeneratedResult.colorPalette && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Tonal Palette Harmony:</span>
                  <div className="flex gap-1.5 h-6 rounded-lg overflow-hidden">
                    {aiGeneratedResult.colorPalette.map((col, idx) => (
                      <div key={idx} className="flex-1 h-full rounded" style={{ backgroundColor: col }} title={col} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: PRESET RECOMMENDATIONS (AI Vision Analysis)                  */}
      {/* ==================================================================== */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-tr from-amber-950/70 via-slate-900 to-indigo-950/50 border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/40">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Smart Match Recommendations</h4>
                  <p className="text-[10px] text-amber-300">AI Scene & Dynamic Range Diagnostic</p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Gemini analyzes the active canvas image to detect subject type (landscape, portrait, street, night), lighting balance, and color temperature to recommend top complementary presets.
            </p>

            <button
              onClick={handleRunAiRecommendations}
              disabled={isAnalyzingImage}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
            >
              {isAnalyzingImage ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Scanning Photo Lighting & Subject...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Analyze Photo & Recommend Presets</span>
                </>
              )}
            </button>
          </div>

          {sceneAnalysisText && (
            <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Scene Analysis: </span>
                {sceneAnalysisText}
              </div>
            </div>
          )}

          {/* Recommendations Cards List */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              {recommendations.map((rec) => {
                const isActive = activePresetId === rec.preset.id;

                return (
                  <div
                    key={rec.presetId}
                    onClick={() => onSelectPreset(isActive ? null : rec.preset.id)}
                    className={`rounded-2xl border p-3.5 cursor-pointer transition-all space-y-2.5 ${
                      isActive
                        ? 'bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${rec.preset.thumbnailGradient} shadow-md flex items-center justify-center text-white`}>
                          {isActive ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{rec.preset.name}</div>
                          <div className="text-[10px] text-slate-400">{rec.preset.category}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-amber-400 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          {rec.matchScore}% Match
                        </span>
                        <div className="text-[9px] text-slate-400 mt-0.5">Rec: {rec.suggestedStrength}% strength</div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed italic">
                      "{rec.reason}"
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                      <div className="flex gap-1">
                        {rec.tags.map((t) => (
                          <span key={t} className="px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                            {t}
                          </span>
                        ))}
                      </div>
                      <span className="text-amber-300 font-bold flex items-center gap-1">
                        {isActive ? 'Active on Canvas' : 'Click to Apply'}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: CREATE PRESET FORM                                          */}
      {/* ==================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-indigo-400" />
                Create New Custom Preset
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Preset Name</label>
                <input
                  type="text"
                  value={newPresetForm.name}
                  onChange={(e) => setNewPresetForm({ ...newPresetForm, name: e.target.value })}
                  placeholder="e.g. Vintage Amber Glow"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Category</label>
                  <select
                    value={newPresetForm.category}
                    onChange={(e) => setNewPresetForm({ ...newPresetForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  >
                    {FILTER_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={newPresetForm.tags}
                    onChange={(e) => setNewPresetForm({ ...newPresetForm, tags: e.target.value })}
                    placeholder="warm, sunset, vintage"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Description</label>
                <input
                  type="text"
                  value={newPresetForm.description}
                  onChange={(e) => setNewPresetForm({ ...newPresetForm, description: e.target.value })}
                  placeholder="Atmospheric warm look with filmic tones"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Gradient Color Selection */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-300">Thumbnail Gradient Card Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_GRADIENTS.map((grad) => (
                    <button
                      key={grad}
                      type="button"
                      onClick={() => setNewPresetForm({ ...newPresetForm, gradient: grad })}
                      className={`h-8 rounded-xl bg-gradient-to-tr ${grad} border-2 transition-all ${
                        newPresetForm.gradient === grad ? 'border-white ring-2 ring-indigo-500 scale-105' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Include Options */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPresetForm.includeToneCurves}
                    onChange={(e) => setNewPresetForm({ ...newPresetForm, includeToneCurves: e.target.checked })}
                    className="w-4 h-4 accent-indigo-500 rounded"
                  />
                  <span>Capture Custom Tone Curves</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPresetForm.includeHsl}
                    onChange={(e) => setNewPresetForm({ ...newPresetForm, includeHsl: e.target.checked })}
                    className="w-4 h-4 accent-indigo-500 rounded"
                  />
                  <span>Capture 8-Channel HSL Color Mixer</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewPreset}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: SHARE PRESET MODAL                                         */}
      {/* ==================================================================== */}
      {isShareModalOpen && selectedPresetForAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${selectedPresetForAction.thumbnailGradient} flex items-center justify-center text-white`}>
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Share "{selectedPresetForAction.name}"</h3>
                  <p className="text-[10px] text-slate-400">Share Code & Multi-Format Exports</p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Share Code Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200">1-Click Share Code</label>
              <p className="text-[11px] text-slate-400">
                Send this compact code to other photographers. They can paste it in the Import dialog for instant recipe loading.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareCodeString}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-indigo-300 outline-none select-all truncate"
                />
                <button
                  onClick={handleCopyShareCode}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
                >
                  {isCodeCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{isCodeCopied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Download Formats Section */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-200">Download File Formats</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleExportJson(selectedPresetForAction)}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition-colors"
                >
                  <FileJson className="w-4 h-4 text-amber-400" />
                  <span>Lumina JSON</span>
                </button>

                <button
                  onClick={() => handleExportXmp(selectedPresetForAction)}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition-colors"
                >
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span>Lightroom (.xmp)</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleCopyJsonSnippet}
              className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Code className="w-3.5 h-3.5 text-indigo-400" />
              <span>Copy Raw JSON Payload</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: IMPORT PRESET MODAL                                        */}
      {/* ==================================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                Import Presets
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Option A: Paste Share Code */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200">Import with Share Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste LUMINA_... code here"
                  value={importShareCodeInput}
                  onChange={(e) => setImportShareCodeInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleImportFromShareCode}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Import
                </button>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800" />
              <span className="flex-shrink mx-3 text-[10px] font-bold uppercase text-slate-500">OR FILE UPLOAD</span>
              <div className="flex-grow border-t border-slate-800" />
            </div>

            {/* Option B: File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-indigo-500/80 bg-slate-950/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-center space-y-2"
            >
              <FileJson className="w-8 h-8 text-indigo-400" />
              <div className="text-xs font-bold text-white">Upload .json or .lumina-preset files</div>
              <div className="text-[10px] text-slate-400">Supports single preset files or bulk bundle archives</div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".json,.lumina-preset"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
