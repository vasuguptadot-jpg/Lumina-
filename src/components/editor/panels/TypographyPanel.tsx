import React, { useState, useEffect, useRef } from 'react';
import {
  Type,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Sliders,
  Sparkles,
  Palette,
  Layers,
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Sun,
  Flame,
  Box,
  Compass,
  UploadCloud,
  Search,
  Check,
  Zap,
  Maximize2,
  ChevronDown,
  ChevronUp,
  FolderOpen,
} from 'lucide-react';
import {
  TypographyItem,
  TypographyGradient,
  TypographyOutline,
  TypographyShadow,
  TypographyGlow,
  Typography3D,
  TypographyCurved,
  TypographyWarp,
  TypographyMask,
  TypographyBadge,
  Project,
} from '../../../types/editor';
import {
  POPULAR_FONTS,
  GRADIENT_PRESETS,
  createDefaultTypographyItem,
  ensureFontLoaded,
  FontOption,
} from '../../../engine/typographyEngine';

interface TypographyPanelProps {
  project: Project;
  onChangeTypography: (items: TypographyItem[]) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

// Quick Style Templates
const TYPOGRAPHY_TEMPLATES = [
  {
    name: 'Cyberpunk Glow',
    icon: '🏮',
    font: 'Space Grotesk',
    weight: '700' as const,
    fillType: 'gradient' as const,
    gradient: {
      type: 'linear' as const,
      angle: 90,
      stops: [
        { offset: 0, color: '#00f2fe' },
        { offset: 1, color: '#4facfe' },
      ],
    },
    glow: { enabled: true, color: '#00f2fe', radius: 28, intensity: 85 },
    threeD: { enabled: false, depth: 0, angle: 45, color: '#000000', darkenFactor: 50, bevel: false },
    curved: { enabled: false, curvature: 0, direction: 'clockwise' as const },
    warp: { enabled: false, style: 'none' as const, bend: 0 },
    outline: { enabled: false, color: '#000000', width: 0 },
  },
  {
    name: '3D Gold Extrusion',
    icon: '👑',
    font: 'Cinzel',
    weight: '900' as const,
    fillType: 'gradient' as const,
    gradient: {
      type: 'linear' as const,
      angle: 135,
      stops: [
        { offset: 0, color: '#f6d365' },
        { offset: 0.5, color: '#fda085' },
        { offset: 1, color: '#f6d365' },
      ],
    },
    glow: { enabled: false, color: '#f6d365', radius: 0, intensity: 0 },
    threeD: { enabled: true, depth: 22, angle: 45, color: '#7a3e08', darkenFactor: 70, bevel: true },
    curved: { enabled: false, curvature: 0, direction: 'clockwise' as const },
    warp: { enabled: false, style: 'none' as const, bend: 0 },
    outline: { enabled: true, color: '#451a03', width: 2 },
  },
  {
    name: 'Curved Vintage Arc',
    icon: '🎪',
    font: 'Bebas Neue',
    weight: '400' as const,
    fillType: 'solid' as const,
    color: '#ffdd59',
    glow: { enabled: false, color: '', radius: 0, intensity: 0 },
    threeD: { enabled: true, depth: 12, angle: 90, color: '#1e272e', darkenFactor: 60, bevel: false },
    curved: { enabled: true, curvature: 90, direction: 'clockwise' as const },
    warp: { enabled: false, style: 'none' as const, bend: 0 },
    outline: { enabled: true, color: '#1e272e', width: 4 },
  },
  {
    name: 'Wave Warp Banner',
    icon: '🌊',
    font: 'Righteous',
    weight: '400' as const,
    fillType: 'gradient' as const,
    gradient: {
      type: 'linear' as const,
      angle: 90,
      stops: [
        { offset: 0, color: '#f857a6' },
        { offset: 1, color: '#ff5858' },
      ],
    },
    glow: { enabled: false, color: '', radius: 0, intensity: 0 },
    threeD: { enabled: false, depth: 0, angle: 45, color: '#000000', darkenFactor: 50, bevel: false },
    curved: { enabled: false, curvature: 0, direction: 'clockwise' as const },
    warp: { enabled: true, style: 'wave' as const, bend: 45 },
    outline: { enabled: true, color: '#000000', width: 3 },
  },
  {
    name: 'Photo Clipping Mask',
    icon: '🖼️',
    font: 'Anton',
    weight: '400' as const,
    fillType: 'solid' as const,
    color: '#ffffff',
    glow: { enabled: false, color: '', radius: 0, intensity: 0 },
    threeD: { enabled: false, depth: 0, angle: 45, color: '#000000', darkenFactor: 50, bevel: false },
    curved: { enabled: false, curvature: 0, direction: 'clockwise' as const },
    warp: { enabled: false, style: 'none' as const, bend: 0 },
    outline: { enabled: true, color: '#ffffff', width: 2 },
    mask: { enabled: true, mode: 'clip-photo' as const },
  },
];

export const TypographyPanel: React.FC<TypographyPanelProps> = ({
  project,
  onChangeTypography,
  showToast,
}) => {
  const items = project.typography || [];
  const [selectedItemId, setSelectedItemId] = useState<string | null>(items[0]?.id || null);

  // Sub-tabs for the selected text item
  const [activeTab, setActiveTab] = useState<
    'content-font' | 'color-gradient' | 'effects-3d' | 'warp-curve' | 'mask-badge' | 'transform'
  >('content-font');

  // Font search & category filter
  const [fontSearch, setFontSearch] = useState('');
  const [fontCategory, setFontCategory] = useState<'all' | 'sans' | 'serif' | 'display' | 'script' | 'mono'>('all');

  // Custom Font Import State
  const [customFontInput, setCustomFontInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active item
  const currentItem = items.find((i) => i.id === selectedItemId) || items[0] || null;

  // Auto select first item if none selected
  useEffect(() => {
    if (!selectedItemId && items.length > 0) {
      setSelectedItemId(items[0].id);
    }
  }, [items, selectedItemId]);

  // Ensure current item's font is loaded into DOM
  useEffect(() => {
    if (currentItem?.fontFamily) {
      ensureFontLoaded(currentItem.fontFamily, currentItem.customFontUrl);
    }
  }, [currentItem?.fontFamily, currentItem?.customFontUrl]);

  // Update selected item
  const updateCurrentItem = (updates: Partial<TypographyItem>) => {
    if (!currentItem) return;
    const nextItems = items.map((it) => (it.id === currentItem.id ? { ...it, ...updates } : it));
    onChangeTypography(nextItems);
  };

  // Add new typography layer
  const handleAddTypography = () => {
    const newItem = createDefaultTypographyItem('LUMINA STUDIO', {
      position: { x: 0.5, y: 0.3 + (items.length % 5) * 0.1 },
    });
    const next = [...items, newItem];
    onChangeTypography(next);
    setSelectedItemId(newItem.id);
    ensureFontLoaded(newItem.fontFamily);
    showToast('success', 'Typography Added', 'New text layer created on canvas.');
  };

  // Duplicate layer
  const handleDuplicate = (item: TypographyItem) => {
    const dup = createDefaultTypographyItem(item.text, {
      ...item,
      id: `type_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${item.name} Copy`,
      position: { x: Math.min(0.9, item.position.x + 0.04), y: Math.min(0.9, item.position.y + 0.04) },
    });
    const next = [...items, dup];
    onChangeTypography(next);
    setSelectedItemId(dup.id);
    showToast('info', 'Layer Duplicated', `Created copy of "${item.text.slice(0, 16)}"`);
  };

  // Delete layer
  const handleDelete = (id: string) => {
    const next = items.filter((it) => it.id !== id);
    onChangeTypography(next);
    if (selectedItemId === id) {
      setSelectedItemId(next[0]?.id || null);
    }
    showToast('info', 'Text Layer Removed', 'Deleted typography layer.');
  };

  // Apply Quick Template
  const handleApplyTemplate = (tmpl: typeof TYPOGRAPHY_TEMPLATES[0]) => {
    if (!currentItem) {
      // Add new with template
      const newItem = createDefaultTypographyItem('HEADLINE', {
        fontFamily: tmpl.font,
        fontWeight: tmpl.weight,
        fillType: tmpl.fillType,
        color: (tmpl as any).color || '#ffffff',
        gradient: (tmpl as any).gradient || createDefaultTypographyItem().gradient,
        glow: tmpl.glow,
        threeD: tmpl.threeD,
        curved: tmpl.curved,
        warp: tmpl.warp,
        outline: tmpl.outline,
        mask: (tmpl as any).mask || { enabled: false, mode: 'none' },
      });
      onChangeTypography([...items, newItem]);
      setSelectedItemId(newItem.id);
      ensureFontLoaded(tmpl.font);
      showToast('success', `Applied ${tmpl.name}`, 'Template loaded onto new typography layer.');
      return;
    }

    ensureFontLoaded(tmpl.font);
    updateCurrentItem({
      fontFamily: tmpl.font,
      fontWeight: tmpl.weight,
      fillType: tmpl.fillType,
      color: (tmpl as any).color || currentItem.color,
      gradient: (tmpl as any).gradient || currentItem.gradient,
      glow: tmpl.glow,
      threeD: tmpl.threeD,
      curved: tmpl.curved,
      warp: tmpl.warp,
      outline: tmpl.outline,
      mask: (tmpl as any).mask || currentItem.mask,
    });
    showToast('success', `Applied ${tmpl.name}`, 'Typography styled with template.');
  };

  // Font Selection
  const handleSelectFont = async (font: FontOption) => {
    await ensureFontLoaded(font.family);
    updateCurrentItem({
      fontFamily: font.family,
      isCustomFont: false,
    });
    showToast('info', `Font: ${font.family}`, `Category: ${font.category.toUpperCase()}`);
  };

  // Custom Google Font Family Import
  const handleImportGoogleFont = async () => {
    const familyName = customFontInput.trim();
    if (!familyName) return;
    const success = await ensureFontLoaded(familyName);
    if (success) {
      updateCurrentItem({
        fontFamily: familyName,
        isCustomFont: true,
      });
      setCustomFontInput('');
      showToast('success', 'Font Loaded', `Google Font "${familyName}" registered successfully.`);
    } else {
      showToast('error', 'Font Import Failed', `Could not load font "${familyName}". Check spelling.`);
    }
  };

  // Custom Font File Upload (.ttf / .otf / .woff)
  const handleFontFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fontName = file.name.replace(/\.[^/.]+$/, '');
    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      try {
        const fontFace = new FontFace(fontName, buffer);
        const loadedFace = await fontFace.load();
        (document.fonts as any).add(loadedFace);
        updateCurrentItem({
          fontFamily: fontName,
          isCustomFont: true,
        });
        showToast('success', 'Custom Font Loaded', `Imported "${fontName}" from local file.`);
      } catch (err: any) {
        showToast('error', 'Font Upload Error', err.message || 'Invalid font file format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Filtered Fonts
  const filteredFonts = POPULAR_FONTS.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(fontSearch.toLowerCase()) ||
      f.family.toLowerCase().includes(fontSearch.toLowerCase());
    const matchesCat = fontCategory === 'all' || f.category === fontCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-4 space-y-4 select-none text-slate-200">
      {/* Studio Header */}
      <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-purple-950/60 border border-indigo-500/30 p-3.5 rounded-2xl space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-indigo-300 uppercase tracking-wide">
                Pro Typography & Text Studio
              </div>
              <div className="text-[10px] text-slate-400">
                Google Fonts, 3D Extrusions, Curved Arcs, Warps, Gradients & Masks
              </div>
            </div>
          </div>

          <button
            onClick={handleAddTypography}
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Text</span>
          </button>
        </div>

        {/* 1-Click Style Templates Carousel */}
        <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            ⚡ 1-Click Typography Presets:
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {TYPOGRAPHY_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                onClick={() => handleApplyTemplate(tmpl)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-[11px] font-medium text-slate-300 hover:text-indigo-200 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>{tmpl.icon}</span>
                <span className="whitespace-nowrap">{tmpl.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Typography Layer Stack Selector */}
      {items.length > 0 && (
        <div className="space-y-1.5 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase px-1">
            <span>Text Layers ({items.length})</span>
            <span className="text-indigo-400">Click to edit</span>
          </div>

          <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {items.map((item) => {
              const isSelected = item.id === currentItem?.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-950 border-indigo-500 ring-1 ring-indigo-500/50 text-white font-semibold'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Type className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="truncate max-w-[150px]">{item.text || 'Empty Text'}</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                      {item.fontFamily}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() =>
                        updateCurrentItem({
                          visible: !item.visible,
                        })
                      }
                      className="p-1 hover:text-white text-slate-500"
                    >
                      {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-rose-400" />}
                    </button>

                    <button
                      onClick={() => handleDuplicate(item)}
                      className="p-1 hover:text-indigo-300 text-slate-500"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 hover:text-rose-400 text-slate-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* If No Items */}
      {items.length === 0 && (
        <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Type className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-200">No Typography Layers Yet</div>
            <div className="text-[11px] text-slate-400">
              Click &quot;Add Text&quot; or choose a preset above to create stunning headlines and graphics.
            </div>
          </div>
          <button
            onClick={handleAddTypography}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            Create First Text Layer
          </button>
        </div>
      )}

      {/* Selected Item Editor Controls */}
      {currentItem && (
        <div className="space-y-4">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold overflow-x-auto scrollbar-none shadow-inner">
            {[
              { id: 'content-font', label: 'Font & Metrics', icon: Type },
              { id: 'color-gradient', label: 'Color & Gradient', icon: Palette },
              { id: 'effects-3d', label: '3D, Shadow & Glow', icon: Flame },
              { id: 'warp-curve', label: 'Curved & Warp', icon: Compass },
              { id: 'mask-badge', label: 'Masks & Badges', icon: Box },
              { id: 'transform', label: 'Position & Scale', icon: Maximize2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 1. CONTENT & FONT SELECTION */}
          {activeTab === 'content-font' && (
            <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
              {/* Text Area */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Text Content</span>
                  <div className="flex items-center gap-1">
                    {(['none', 'uppercase', 'lowercase', 'capitalize'] as const).map((trans) => (
                      <button
                        key={trans}
                        onClick={() => updateCurrentItem({ textTransform: trans })}
                        className={`text-[9px] px-1.5 py-0.5 rounded border uppercase transition-colors ${
                          currentItem.textTransform === trans
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {trans === 'none' ? 'Aa' : trans.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={currentItem.text}
                  onChange={(e) => updateCurrentItem({ text: e.target.value })}
                  placeholder="Enter your headline or caption..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 font-sans resize-none"
                />
              </div>

              {/* Font Import Bar */}
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Import Custom or Google Font</span>
                  </span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 underline"
                  >
                    <FolderOpen className="w-3 h-3" />
                    <span>Upload .TTF/.OTF</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={handleFontFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Enter Google Font name (e.g. Bungee, Syne, Pacifico)"
                    value={customFontInput}
                    onChange={(e) => setCustomFontInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleImportGoogleFont()}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleImportGoogleFont}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shrink-0"
                  >
                    Load
                  </button>
                </div>
              </div>

              {/* Font Picker Browser */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search Google fonts..."
                      value={fontSearch}
                      onChange={(e) => setFontSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                    {(['all', 'sans', 'serif', 'display', 'script', 'mono'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFontCategory(cat)}
                        className={`px-2 py-1 text-[10px] font-bold uppercase rounded-lg border transition-colors ${
                          fontCategory === cat
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {filteredFonts.map((font) => {
                    const isSelected = currentItem.fontFamily === font.family;
                    return (
                      <button
                        key={font.family}
                        onClick={() => handleSelectFont(font)}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-slate-950 border-indigo-500 ring-1 ring-indigo-500/50'
                            : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-200 truncate" style={{ fontFamily: font.family }}>
                          {font.name}
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5">
                          <span className="uppercase">{font.category}</span>
                          {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size & Weight */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Font Size</span>
                    <span className="text-[11px] font-mono text-indigo-400 font-bold">{currentItem.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={240}
                    value={currentItem.fontSize}
                    onChange={(e) => updateCurrentItem({ fontSize: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Font Weight</span>
                    <span className="text-[11px] font-mono text-indigo-400 font-bold">{currentItem.fontWeight}</span>
                  </div>
                  <select
                    value={currentItem.fontWeight}
                    onChange={(e) => updateCurrentItem({ fontWeight: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  >
                    <option value="100">100 - Thin</option>
                    <option value="300">300 - Light</option>
                    <option value="400">400 - Regular</option>
                    <option value="500">500 - Medium</option>
                    <option value="600">600 - SemiBold</option>
                    <option value="700">700 - Bold</option>
                    <option value="800">800 - ExtraBold</option>
                    <option value="900">900 - Black</option>
                  </select>
                </div>
              </div>

              {/* Spacing & Alignment */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Letter Spacing</span>
                    <span className="text-[11px] font-mono text-indigo-400 font-bold">{currentItem.letterSpacing}px</span>
                  </div>
                  <input
                    type="range"
                    min={-5}
                    max={30}
                    value={currentItem.letterSpacing}
                    onChange={(e) => updateCurrentItem({ letterSpacing: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Line Height</span>
                    <span className="text-[11px] font-mono text-indigo-400 font-bold">{currentItem.lineHeight}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.7}
                    max={2.5}
                    step={0.05}
                    value={currentItem.lineHeight}
                    onChange={(e) => updateCurrentItem({ lineHeight: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              {/* Alignment Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="text-xs text-slate-300 font-semibold">Text Alignment</span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {[
                    { id: 'left', icon: AlignLeft },
                    { id: 'center', icon: AlignCenter },
                    { id: 'right', icon: AlignRight },
                    { id: 'justify', icon: AlignJustify },
                  ].map((al) => {
                    const Icon = al.icon;
                    const isSelected = currentItem.align === al.id;
                    return (
                      <button
                        key={al.id}
                        onClick={() => updateCurrentItem({ align: al.id as any })}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSelected ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2. COLOR, GRADIENTS & OUTLINE */}
          {activeTab === 'color-gradient' && (
            <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
              {/* Fill Mode Switcher */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200">Fill Mode</span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => updateCurrentItem({ fillType: 'solid' })}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      currentItem.fillType === 'solid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Solid Color
                  </button>
                  <button
                    onClick={() => updateCurrentItem({ fillType: 'gradient' })}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      currentItem.fillType === 'gradient'
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Gradient Text
                  </button>
                </div>
              </div>

              {/* Solid Color Controls */}
              {currentItem.fillType === 'solid' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-medium">Text Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={currentItem.color || '#ffffff'}
                        onChange={(e) => updateCurrentItem({ color: e.target.value })}
                        className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-slate-300 uppercase">{currentItem.color}</span>
                    </div>
                  </div>

                  {/* Swatches */}
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                    {[
                      '#ffffff',
                      '#000000',
                      '#ffdd59',
                      '#ff5e57',
                      '#00d8d6',
                      '#05c46b',
                      '#575fcf',
                      '#f8a5c2',
                      '#f3a683',
                      '#e77f67',
                    ].map((col) => (
                      <button
                        key={col}
                        onClick={() => updateCurrentItem({ color: col })}
                        className="w-6 h-6 rounded-full border border-black/40 shadow-sm shrink-0"
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Gradient Controls */}
              {currentItem.fillType === 'gradient' && (
                <div className="space-y-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Gradient Presets:</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {GRADIENT_PRESETS.map((gp) => (
                      <button
                        key={gp.name}
                        onClick={() =>
                          updateCurrentItem({
                            gradient: {
                              ...currentItem.gradient,
                              stops: gp.stops,
                              presetName: gp.name,
                            },
                          })
                        }
                        className="p-2 rounded-xl border border-slate-800 hover:border-indigo-500/50 bg-slate-950 flex items-center gap-2 text-left"
                      >
                        <div
                          className="w-5 h-5 rounded-lg shrink-0 shadow-sm"
                          style={{
                            background: `linear-gradient(90deg, ${gp.stops.map((s) => s.color).join(', ')})`,
                          }}
                        />
                        <span className="text-[10px] font-semibold text-slate-300 truncate">{gp.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Gradient Angle */}
                  <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Gradient Angle</span>
                      <span className="text-[11px] font-mono text-indigo-400 font-bold">
                        {currentItem.gradient.angle}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={currentItem.gradient.angle}
                      onChange={(e) =>
                        updateCurrentItem({
                          gradient: { ...currentItem.gradient, angle: Number(e.target.value) },
                        })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Text Outline / Stroke */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Text Outline / Stroke</span>
                  <input
                    type="checkbox"
                    checked={currentItem.outline?.enabled}
                    onChange={(e) =>
                      updateCurrentItem({
                        outline: { ...currentItem.outline, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                </div>

                {currentItem.outline?.enabled && (
                  <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Stroke Width</span>
                      <span className="text-[11px] font-mono text-indigo-400 font-bold">
                        {currentItem.outline.width}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={40}
                      value={currentItem.outline.width}
                      onChange={(e) =>
                        updateCurrentItem({
                          outline: { ...currentItem.outline, width: Number(e.target.value) },
                        })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-300">Stroke Color</span>
                      <input
                        type="color"
                        value={currentItem.outline.color || '#000000'}
                        onChange={(e) =>
                          updateCurrentItem({
                            outline: { ...currentItem.outline, color: e.target.value },
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

          {/* 3. 3D TEXT, SHADOW & NEON GLOW */}
          {activeTab === 'effects-3d' && (
            <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
              {/* 3D Extrusion */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">3D Text Extrusion</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentItem.threeD?.enabled}
                    onChange={(e) =>
                      updateCurrentItem({
                        threeD: { ...currentItem.threeD, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                  />
                </div>

                {currentItem.threeD?.enabled && (
                  <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Extrusion Depth</span>
                      <span className="text-[11px] font-mono text-amber-400 font-bold">
                        {currentItem.threeD.depth}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={50}
                      value={currentItem.threeD.depth}
                      onChange={(e) =>
                        updateCurrentItem({
                          threeD: { ...currentItem.threeD, depth: Number(e.target.value) },
                        })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-300">Extrusion Angle</span>
                      <span className="text-[11px] font-mono text-amber-400 font-bold">
                        {currentItem.threeD.angle}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      value={currentItem.threeD.angle}
                      onChange={(e) =>
                        updateCurrentItem({
                          threeD: { ...currentItem.threeD, angle: Number(e.target.value) },
                        })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-300">3D Extrusion Base Color</span>
                      <input
                        type="color"
                        value={currentItem.threeD.color || '#1a1a1a'}
                        onChange={(e) =>
                          updateCurrentItem({
                            threeD: { ...currentItem.threeD, color: e.target.value },
                          })
                        }
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Neon & Soft Glow */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-200">Neon Radiance & Glow</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentItem.glow?.enabled}
                    onChange={(e) =>
                      updateCurrentItem({
                        glow: { ...currentItem.glow, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                  />
                </div>

                {currentItem.glow?.enabled && (
                  <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Glow Radius</span>
                      <span className="text-[11px] font-mono text-cyan-400 font-bold">
                        {currentItem.glow.radius}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={70}
                      value={currentItem.glow.radius}
                      onChange={(e) =>
                        updateCurrentItem({
                          glow: { ...currentItem.glow, radius: Number(e.target.value) },
                        })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-300">Glow Color</span>
                      <input
                        type="color"
                        value={currentItem.glow.color || '#00f2fe'}
                        onChange={(e) =>
                          updateCurrentItem({
                            glow: { ...currentItem.glow, color: e.target.value },
                          })
                        }
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Drop Shadow */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Drop Shadow</span>
                  <input
                    type="checkbox"
                    checked={currentItem.shadow?.enabled}
                    onChange={(e) =>
                      updateCurrentItem({
                        shadow: { ...currentItem.shadow, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                </div>

                {currentItem.shadow?.enabled && (
                  <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Shadow Blur</span>
                      <span className="text-[11px] font-mono text-indigo-400 font-bold">
                        {currentItem.shadow.blur}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={currentItem.shadow.blur}
                      onChange={(e) =>
                        updateCurrentItem({
                          shadow: { ...currentItem.shadow, blur: Number(e.target.value) },
                        })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400">Offset X: {currentItem.shadow.offsetX}px</span>
                        <input
                          type="range"
                          min={-30}
                          max={30}
                          value={currentItem.shadow.offsetX}
                          onChange={(e) =>
                            updateCurrentItem({
                              shadow: { ...currentItem.shadow, offsetX: Number(e.target.value) },
                            })
                          }
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Offset Y: {currentItem.shadow.offsetY}px</span>
                        <input
                          type="range"
                          min={-30}
                          max={30}
                          value={currentItem.shadow.offsetY}
                          onChange={(e) =>
                            updateCurrentItem({
                              shadow: { ...currentItem.shadow, offsetY: Number(e.target.value) },
                            })
                          }
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. CURVED & WARP DEFORMATIONS */}
          {activeTab === 'warp-curve' && (
            <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
              {/* Curved / Arc Text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-200">Curved / Circular Arc Text</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentItem.curved?.enabled}
                    onChange={(e) =>
                      updateCurrentItem({
                        curved: { ...currentItem.curved, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                </div>

                {currentItem.curved?.enabled && (
                  <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Curvature Angle</span>
                      <span className="text-[11px] font-mono text-indigo-400 font-bold">
                        {currentItem.curved.curvature}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={180}
                      value={currentItem.curved.curvature}
                      onChange={(e) =>
                        updateCurrentItem({
                          curved: { ...currentItem.curved, curvature: Number(e.target.value) },
                        })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-slate-300">Curve Direction</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            updateCurrentItem({
                              curved: { ...currentItem.curved, direction: 'clockwise' },
                            })
                          }
                          className={`px-2 py-1 rounded text-[10px] font-bold ${
                            currentItem.curved.direction === 'clockwise'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          Convex
                        </button>
                        <button
                          onClick={() =>
                            updateCurrentItem({
                              curved: { ...currentItem.curved, direction: 'counter-clockwise' },
                            })
                          }
                          className={`px-2 py-1 rounded text-[10px] font-bold ${
                            currentItem.curved.direction === 'counter-clockwise'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          Concave
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Text Warp Deformations */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Text Warp & Mesh Distortions</span>
                  <input
                    type="checkbox"
                    checked={currentItem.warp?.enabled}
                    onChange={(e) =>
                      updateCurrentItem({
                        warp: { ...currentItem.warp, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                </div>

                {currentItem.warp?.enabled && (
                  <div className="space-y-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Warp Style:</div>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {[
                        { id: 'arch', label: 'Arch', icon: '🏛️' },
                        { id: 'wave', label: 'Wave', icon: '🌊' },
                        { id: 'bulge', label: 'Bulge', icon: '🎈' },
                        { id: 'flag', label: 'Flag', icon: '🚩' },
                        { id: 'rise', label: 'Rise', icon: '📈' },
                        { id: 'twist', label: 'Twist', icon: '🌀' },
                        { id: 'fish', label: 'Fish-Eye', icon: '🐟' },
                        { id: 'squeeze', label: 'Squeeze', icon: '⏳' },
                      ].map((w) => (
                        <button
                          key={w.id}
                          onClick={() =>
                            updateCurrentItem({
                              warp: { ...currentItem.warp, style: w.id as any },
                            })
                          }
                          className={`p-1.5 rounded-xl border text-center transition-all ${
                            currentItem.warp.style === w.id
                              ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs">{w.icon}</div>
                          <div className="text-[10px]">{w.label}</div>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">Bend Amount</span>
                        <span className="text-[11px] font-mono text-indigo-400 font-bold">
                          {currentItem.warp.bend}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-100}
                        max={100}
                        value={currentItem.warp.bend}
                        onChange={(e) =>
                          updateCurrentItem({
                            warp: { ...currentItem.warp, bend: Number(e.target.value) },
                          })
                        }
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. TEXT MASKS & BADGES */}
          {activeTab === 'mask-badge' && (
            <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
              {/* Text Mask Modes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Text Masks & Clipping</span>
                  <input
                    type="checkbox"
                    checked={currentItem.mask?.enabled}
                    onChange={(e) =>
                      updateCurrentItem({
                        mask: { ...currentItem.mask, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                </div>

                {currentItem.mask?.enabled && (
                  <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'clip-photo', label: 'Clip Photo to Text', desc: 'Fills text with background' },
                        { id: 'knockout', label: 'Knockout Cutout', desc: 'Punches transparent hole' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() =>
                            updateCurrentItem({
                              mask: { ...currentItem.mask, mode: m.id as any },
                            })
                          }
                          className={`p-2 rounded-xl border text-left transition-all ${
                            currentItem.mask.mode === m.id
                              ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="text-[11px] font-semibold">{m.label}</div>
                          <div className="text-[9px] text-slate-300/80">{m.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Badge Background Pill */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Background Badge / Pill</span>
                  <input
                    type="checkbox"
                    checked={currentItem.badge?.enabled}
                    onChange={(e) =>
                      updateCurrentItem({
                        badge: { ...currentItem.badge, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                </div>

                {currentItem.badge?.enabled && (
                  <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Corner Radius</span>
                      <span className="text-[11px] font-mono text-indigo-400 font-bold">
                        {currentItem.badge.borderRadius}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={currentItem.badge.borderRadius}
                      onChange={(e) =>
                        updateCurrentItem({
                          badge: { ...currentItem.badge, borderRadius: Number(e.target.value) },
                        })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400">Padding X: {currentItem.badge.paddingX}px</span>
                        <input
                          type="range"
                          min={4}
                          max={60}
                          value={currentItem.badge.paddingX}
                          onChange={(e) =>
                            updateCurrentItem({
                              badge: { ...currentItem.badge, paddingX: Number(e.target.value) },
                            })
                          }
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Padding Y: {currentItem.badge.paddingY}px</span>
                        <input
                          type="range"
                          min={4}
                          max={40}
                          value={currentItem.badge.paddingY}
                          onChange={(e) =>
                            updateCurrentItem({
                              badge: { ...currentItem.badge, paddingY: Number(e.target.value) },
                            })
                          }
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. POSITION, ROTATION & SCALE */}
          {activeTab === 'transform' && (
            <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Horizontal Position (X)</span>
                  <span className="text-[11px] font-mono text-indigo-400 font-bold">
                    {Math.round(currentItem.position.x * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.95}
                  step={0.01}
                  value={currentItem.position.x}
                  onChange={(e) =>
                    updateCurrentItem({
                      position: { ...currentItem.position, x: Number(e.target.value) },
                    })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Vertical Position (Y)</span>
                  <span className="text-[11px] font-mono text-indigo-400 font-bold">
                    {Math.round(currentItem.position.y * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.95}
                  step={0.01}
                  value={currentItem.position.y}
                  onChange={(e) =>
                    updateCurrentItem({
                      position: { ...currentItem.position, y: Number(e.target.value) },
                    })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Rotation</span>
                  <span className="text-[11px] font-mono text-indigo-400 font-bold">{currentItem.rotation}°</span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={currentItem.rotation}
                  onChange={(e) => updateCurrentItem({ rotation: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Scale / Zoom</span>
                  <span className="text-[11px] font-mono text-indigo-400 font-bold">{currentItem.scale}x</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={3.0}
                  step={0.05}
                  value={currentItem.scale}
                  onChange={(e) => updateCurrentItem({ scale: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
