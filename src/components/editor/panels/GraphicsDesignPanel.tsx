import React, { useState } from 'react';
import {
  Shapes,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Layers,
  Sparkles,
  Palette,
  Sliders,
  Maximize2,
  RotateCcw,
  Search,
  Check,
  Zap,
  Flame,
  Star,
  Heart,
  Smile,
  Stamp,
  Camera,
  Layout,
  Grid,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Box,
  Feather,
  Compass,
  Tag,
  Gift,
  HelpCircle,
  FolderOpen,
} from 'lucide-react';
import {
  DesignElementItem,
  DesignElementType,
  DesignShapeType,
  DesignLineStyle,
  DesignLineEnd,
  DesignStickerType,
  DesignIconType,
  DesignIllustrationType,
  DesignFrameType,
  DesignPatternType,
  DesignTemplate,
  Project,
  LayerBlendMode,
} from '../../../types/editor';
import {
  createDefaultDesignElement,
  CANVA_TEMPLATES,
} from '../../../engine/designEngine';
import { GRADIENT_PRESETS } from '../../../engine/typographyEngine';

interface GraphicsDesignPanelProps {
  project: Project;
  onChangeDesignElements: (elements: DesignElementItem[]) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

// Icon list metadata
const ICON_ITEMS: Array<{ type: DesignIconType; label: string; icon: string }> = [
  { type: 'camera', label: 'Camera', icon: '📷' },
  { type: 'heart', label: 'Heart', icon: '❤️' },
  { type: 'star', label: 'Star', icon: '⭐' },
  { type: 'sparkles', label: 'Sparkles', icon: '✨' },
  { type: 'flame', label: 'Fire', icon: '🔥' },
  { type: 'crown', label: 'Crown', icon: '👑' },
  { type: 'music', label: 'Music', icon: '🎵' },
  { type: 'coffee', label: 'Coffee', icon: '☕' },
  { type: 'map-pin', label: 'Pin', icon: '📍' },
  { type: 'shopping-bag', label: 'Shop', icon: '🛍️' },
  { type: 'lightbulb', label: 'Idea', icon: '💡' },
  { type: 'message-circle', label: 'Chat', icon: '💬' },
  { type: 'thumbs-up', label: 'Like', icon: '👍' },
  { type: 'plane', label: 'Travel', icon: '✈️' },
  { type: 'trophy', label: 'Trophy', icon: '🏆' },
  { type: 'eye', label: 'Eye', icon: '👁️' },
  { type: 'leaf', label: 'Leaf', icon: '🍃' },
  { type: 'sun', label: 'Sun', icon: '☀️' },
  { type: 'moon', label: 'Moon', icon: '🌙' },
  { type: 'diamond', label: 'Gem', icon: '💎' },
  { type: 'compass', label: 'Compass', icon: '🧭' },
  { type: 'zap', label: 'Lightning', icon: '⚡' },
  { type: 'gift', label: 'Gift', icon: '🎁' },
  { type: 'bell', label: 'Bell', icon: '🔔' },
  { type: 'anchor', label: 'Anchor', icon: '⚓' },
  { type: 'bookmark', label: 'Bookmark', icon: '🔖' },
  { type: 'check-circle', label: 'Verified', icon: '✅' },
  { type: 'instagram', label: 'Instagram', icon: '📸' },
  { type: 'youtube', label: 'YouTube', icon: '▶️' },
  { type: 'tiktok', label: 'TikTok', icon: '🎵' },
  { type: 'twitter', label: 'Twitter', icon: '🐦' },
];

// Sticker list metadata
const STICKER_ITEMS: Array<{ type: DesignStickerType; label: string; preview: string }> = [
  { type: 'sale-50', label: '50% OFF', preview: '🏷️ 50%' },
  { type: 'hot-deal', label: 'HOT DEAL', preview: '🔥 HOT' },
  { type: 'best-seller', label: 'BEST SELLER', preview: '👑 TOP #1' },
  { type: 'verified-badge', label: 'VERIFIED', preview: '☑️ VERIFIED' },
  { type: 'retro-smiley', label: '90s SMILEY', preview: '🙂 ACID' },
  { type: 'heart-eyes', label: 'HEART EYES', preview: '😍 LOVE' },
  { type: 'washi-tape-yellow', label: 'WASHI TAPE (YEL)', preview: '🟡 TAPE' },
  { type: 'washi-tape-pink', label: 'WASHI TAPE (PNK)', preview: '🌸 TAPE' },
  { type: 'washi-tape-grid', label: 'WASHI TAPE (GRID)', preview: '🏁 TAPE' },
  { type: 'stamp-approved', label: 'APPROVED STAMP', preview: '🔴 STAMP' },
  { type: 'fire-flame', label: 'FIRE EMOJI', preview: '🔥 FLAME' },
  { type: 'crown-gold', label: 'GOLD CROWN', preview: '👑 CROWN' },
  { type: '100-percent', label: '100% REAL', preview: '💯 100%' },
];

// Illustration list metadata
const ILLUSTRATION_ITEMS: Array<{ type: DesignIllustrationType; label: string; icon: string }> = [
  { type: 'botanical-monstera', label: 'Monstera Leaf', icon: '🌿' },
  { type: 'botanical-palm', label: 'Palm Fronds', icon: '🌴' },
  { type: 'botanical-branch', label: 'Olive Branch', icon: '🌱' },
  { type: 'abstract-organic-blob-1', label: 'Organic Blob #1', icon: '🫧' },
  { type: 'abstract-organic-blob-2', label: 'Organic Blob #2', icon: '💧' },
  { type: 'sunburst-retro', label: 'Retro Sunburst', icon: '🔆' },
  { type: 'vintage-flourish-corner', label: 'Vintage Corner', icon: '⚜️' },
  { type: 'circuit-cyberpunk', label: 'Tech Circuits', icon: '🔌' },
];

// Shape list metadata
const SHAPE_ITEMS: Array<{ type: DesignShapeType; label: string; icon: any }> = [
  { type: 'rectangle', label: 'Rectangle', icon: Square },
  { type: 'rounded-rect', label: 'Rounded Rect', icon: Box },
  { type: 'circle', label: 'Circle', icon: Circle },
  { type: 'star-5', label: 'Star', icon: Star },
  { type: 'heart', label: 'Heart', icon: Heart },
  { type: 'sparkle', label: 'Sparkle Flare', icon: Sparkles },
  { type: 'diamond', label: 'Diamond', icon: Shapes },
  { type: 'triangle', label: 'Triangle', icon: Shapes },
  { type: 'polygon-6', label: 'Hexagon', icon: Box },
  { type: 'shield', label: 'Shield Badge', icon: Box },
  { type: 'cloud', label: 'Cloud', icon: Box },
  { type: 'speech-bubble', label: 'Speech Bubble', icon: Box },
  { type: 'sunburst', label: 'Sunburst Badge', icon: Sparkles },
  { type: 'ribbon', label: 'Ribbon Banner', icon: Box },
  { type: 'badge-seal', label: 'Notched Seal', icon: Box },
  { type: 'flower', label: 'Daisy Petals', icon: Box },
];

// Frames metadata
const FRAME_ITEMS: Array<{ type: DesignFrameType; label: string; desc: string }> = [
  { type: 'polaroid-classic', label: 'Polaroid Classic', desc: 'Glossy photo card with caption chin' },
  { type: 'film-strip-slide', label: '35mm Film Slide', desc: 'Retro cinema sprocket holes' },
  { type: 'postage-stamp', label: 'Postage Stamp', desc: 'Perforated scalloped edges' },
  { type: 'arch-window', label: 'Arch Window', desc: 'Minimalist rounded arch cutout' },
  { type: 'circle-badge-frame', label: 'Circle Gold Seal', desc: 'Circular medallion cutout' },
  { type: 'washi-tape-photo', label: 'Washi Tape Frame', desc: 'Corner-taped gallery photo' },
  { type: 'neon-cyber-frame', label: 'Neon Cyber Bracket', desc: 'Sci-fi glow bracket frame' },
  { type: 'minimalist-thin-border', label: 'Thin Gallery Border', desc: 'Offset modern thin outline' },
];

// Patterns metadata
const PATTERN_ITEMS: Array<{ type: DesignPatternType; label: string; desc: string }> = [
  { type: 'polka-dots', label: 'Polka Dots', desc: 'Classic dotted backdrop' },
  { type: 'grid-graph', label: 'Graph Grid', desc: 'Modern aesthetic grid lines' },
  { type: 'diagonal-stripes', label: 'Diagonal Stripes', desc: 'Dynamic linear diagonal texture' },
  { type: 'memphis-geo', label: 'Memphis Shapes', desc: '90s playful geometric motifs' },
  { type: 'topographic-contours', label: 'Topographic Map', desc: 'Organic elevation contour lines' },
  { type: 'checkerboard', label: 'Checkerboard', desc: 'Retro monochrome checker' },
  { type: 'wavy-ripples', label: 'Wavy Ripples', desc: 'Fluid liquid wave curves' },
];

export const GraphicsDesignPanel: React.FC<GraphicsDesignPanelProps> = ({
  project,
  onChangeDesignElements,
  showToast,
}) => {
  const elements = project.designElements || [];
  const [selectedElementId, setSelectedElementId] = useState<string | null>(elements[0]?.id || null);

  // Top Category Tabs
  const [activeCategory, setActiveCategory] = useState<
    'templates' | 'shapes' | 'lines' | 'stickers' | 'icons' | 'illustrations' | 'frames' | 'patterns'
  >('templates');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Selected element
  const currentElement = elements.find((el) => el.id === selectedElementId) || elements[0] || null;

  // Auto select first element if none selected
  React.useEffect(() => {
    if (!selectedElementId && elements.length > 0) {
      setSelectedElementId(elements[0].id);
    }
  }, [elements, selectedElementId]);

  // Update current selected element
  const updateCurrentElement = (updates: Partial<DesignElementItem>) => {
    if (!currentElement) return;
    const nextElements = elements.map((el) =>
      el.id === currentElement.id ? { ...el, ...updates } : el
    );
    onChangeDesignElements(nextElements);
  };

  // Add Element helper
  const handleAddElement = (type: DesignElementType, extra?: Partial<DesignElementItem>) => {
    const newEl = createDefaultDesignElement(type, {
      position: { x: 0.5, y: 0.35 + (elements.length % 4) * 0.08 },
      ...extra,
    });
    const next = [...elements, newEl];
    onChangeDesignElements(next);
    setSelectedElementId(newEl.id);
    showToast('success', 'Element Added', `Created new ${newEl.type} layer.`);
  };

  // Duplicate Element
  const handleDuplicate = (el: DesignElementItem) => {
    const dup = createDefaultDesignElement(el.type, {
      ...el,
      id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${el.name} Copy`,
      position: { x: Math.min(0.9, el.position.x + 0.05), y: Math.min(0.9, el.position.y + 0.05) },
    });
    const next = [...elements, dup];
    onChangeDesignElements(next);
    setSelectedElementId(dup.id);
    showToast('info', 'Layer Duplicated', `Duplicated "${el.name}"`);
  };

  // Delete Element
  const handleDelete = (id: string) => {
    const next = elements.filter((el) => el.id !== id);
    onChangeDesignElements(next);
    if (selectedElementId === id) {
      setSelectedElementId(next[0]?.id || null);
    }
    showToast('info', 'Element Removed', 'Deleted graphic element.');
  };

  // Reorder Element (Up / Down)
  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    const index = elements.findIndex((el) => el.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index + 1 : index - 1;
    if (targetIndex < 0 || targetIndex >= elements.length) return;

    const next = [...elements];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    onChangeDesignElements(next);
  };

  // Apply Full Canva Template
  const handleApplyTemplate = (tmpl: DesignTemplate) => {
    // Clone template elements
    const clonedElements = tmpl.elements.map((el) => ({
      ...el,
      id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    }));

    onChangeDesignElements(clonedElements);
    setSelectedElementId(clonedElements[0]?.id || null);
    showToast('success', `Applied ${tmpl.name}`, 'Template loaded onto canvas layout.');
  };

  return (
    <div className="p-4 space-y-4 select-none text-slate-200">
      {/* Studio Header */}
      <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/70 border border-indigo-500/30 p-3.5 rounded-2xl space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Shapes className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-indigo-300 uppercase tracking-wide">
                Canva-Style Graphics &amp; Design Studio
              </div>
              <div className="text-[10px] text-slate-400">
                Shapes, Arrows, Stickers, Icons, Illustrations, Frames, Grids &amp; Patterns
              </div>
            </div>
          </div>

          <button
            onClick={() => handleAddElement('shape')}
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Graphic</span>
          </button>
        </div>

        {/* Canva Categories Tabs Carousel */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pt-1 border-t border-slate-800/80 pb-0.5">
          {[
            { id: 'templates', label: 'Templates', icon: Layout },
            { id: 'shapes', label: 'Shapes', icon: Square },
            { id: 'lines', label: 'Lines & Arrows', icon: ArrowRight },
            { id: 'stickers', label: 'Stickers & Badges', icon: Stamp },
            { id: 'icons', label: 'Icons', icon: Star },
            { id: 'illustrations', label: 'Illustrations', icon: Feather },
            { id: 'frames', label: 'Photo Frames', icon: Camera },
            { id: 'patterns', label: 'Patterns & Grids', icon: Grid },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950/70 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. TEMPLATES BROWSER */}
      {activeCategory === 'templates' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span>Ready-to-Use 1-Click Design Layouts</span>
            <span className="text-[10px] text-indigo-400 font-mono">5 Presets</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {CANVA_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{tmpl.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                        {tmpl.aspectRatio}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">{tmpl.description}</div>
                  </div>

                  <button
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow transition-all shrink-0"
                  >
                    Apply Layout
                  </button>
                </div>

                {/* Palette Swatches */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-900">
                  <span className="text-[9px] text-slate-500 font-mono uppercase">Palette:</span>
                  {tmpl.palette.map((col, idx) => (
                    <div
                      key={idx}
                      className="w-4 h-4 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. SHAPES BROWSER */}
      {activeCategory === 'shapes' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="text-xs font-bold text-slate-200">Geometric &amp; Organic Shapes</div>
          <div className="grid grid-cols-4 gap-2">
            {SHAPE_ITEMS.map((shp) => {
              const Icon = shp.icon;
              return (
                <button
                  key={shp.type}
                  onClick={() => handleAddElement('shape', { shapeType: shp.type, name: shp.label })}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:bg-slate-900 text-slate-300 hover:text-white transition-all group"
                >
                  <Icon className="w-5 h-5 mb-1 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-medium text-center truncate w-full">{shp.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. LINES & ARROWS */}
      {activeCategory === 'lines' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="text-xs font-bold text-slate-200">Lines, Curves &amp; Directional Arrows</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Straight Solid Arrow', lineStyle: 'solid', lineEnd: 'arrow', curvature: 0 },
              { label: 'Curved Arc Arrow', lineStyle: 'solid', lineEnd: 'arrow', curvature: 45 },
              { label: 'Barbed Callout Arrow', lineStyle: 'solid', lineEnd: 'barbed-arrow', curvature: 0 },
              { label: 'Dashed Pointer Line', lineStyle: 'dashed', lineEnd: 'arrow', curvature: 0 },
              { label: 'Wavy Decorative Line', lineStyle: 'wavy', lineEnd: 'none', curvature: 0 },
              { label: 'Zigzag Line', lineStyle: 'zigzag', lineEnd: 'none', curvature: 0 },
              { label: 'Diamond End Line', lineStyle: 'solid', lineStart: 'diamond', lineEnd: 'diamond', curvature: 0 },
              { label: 'Circle End Line', lineStyle: 'solid', lineStart: 'circle', lineEnd: 'circle', curvature: 0 },
            ].map((ln, idx) => (
              <button
                key={idx}
                onClick={() =>
                  handleAddElement('arrow', {
                    name: ln.label,
                    lineStyle: ln.lineStyle as any,
                    lineStart: (ln as any).lineStart || 'none',
                    lineEnd: ln.lineEnd as any,
                    curvature: ln.curvature,
                    strokeWidth: 4,
                  })
                }
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:bg-slate-900 text-left transition-all"
              >
                <div className="text-xs font-bold text-slate-200 truncate">{ln.label}</div>
                <div className="text-[10px] text-indigo-400 font-mono mt-1">
                  {ln.lineStyle.toUpperCase()} {ln.lineEnd !== 'none' && '• ARROW'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. STICKERS & BADGES */}
      {activeCategory === 'stickers' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="text-xs font-bold text-slate-200">Vibrant Stickers, Seals &amp; Tape</div>
          <div className="grid grid-cols-3 gap-2">
            {STICKER_ITEMS.map((stk) => (
              <button
                key={stk.type}
                onClick={() => handleAddElement('sticker', { stickerType: stk.type, name: stk.label })}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:bg-slate-900 flex flex-col items-center justify-center text-center transition-all group"
              >
                <div className="text-sm font-black text-rose-400 group-hover:scale-110 transition-transform">
                  {stk.preview}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold mt-1 truncate w-full">{stk.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. ICONS */}
      {activeCategory === 'icons' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Vector Icons</span>
            <div className="relative w-40">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2 py-1 text-[11px] text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {ICON_ITEMS.filter((ic) => ic.label.toLowerCase().includes(searchQuery.toLowerCase())).map((ic) => (
              <button
                key={ic.type}
                onClick={() =>
                  handleAddElement('icon', {
                    iconType: ic.type,
                    name: `${ic.label} Icon`,
                    fillColor: '#ffffff',
                  })
                }
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:bg-slate-900 text-slate-300 hover:text-white transition-all group"
              >
                <span className="text-lg mb-0.5 group-hover:scale-125 transition-transform">{ic.icon}</span>
                <span className="text-[10px] font-medium truncate w-full text-center">{ic.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. ILLUSTRATIONS */}
      {activeCategory === 'illustrations' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="text-xs font-bold text-slate-200">Vector Artwork &amp; Botanical Motifs</div>
          <div className="grid grid-cols-2 gap-2">
            {ILLUSTRATION_ITEMS.map((ill) => (
              <button
                key={ill.type}
                onClick={() =>
                  handleAddElement('illustration', {
                    illustrationType: ill.type,
                    name: ill.label,
                    fillColor: '#6366f1',
                  })
                }
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:bg-slate-900 flex items-center gap-2 text-left transition-all"
              >
                <span className="text-xl shrink-0">{ill.icon}</span>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-200 truncate">{ill.label}</div>
                  <div className="text-[9px] text-slate-500 font-mono">VECTOR ART</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 7. PHOTO FRAMES */}
      {activeCategory === 'frames' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="text-xs font-bold text-slate-200">Photo Framing &amp; Cutout Masks</div>
          <div className="grid grid-cols-2 gap-2">
            {FRAME_ITEMS.map((frm) => (
              <button
                key={frm.type}
                onClick={() =>
                  handleAddElement('frame', {
                    frameType: frm.type,
                    name: frm.label,
                    width: 0.6,
                    height: 0.6,
                  })
                }
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:bg-slate-900 text-left transition-all"
              >
                <div className="text-xs font-bold text-slate-200 truncate">{frm.label}</div>
                <div className="text-[10px] text-slate-400">{frm.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 8. PATTERNS & GRIDS */}
      {activeCategory === 'patterns' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="text-xs font-bold text-slate-200">Seamless Textures &amp; Background Patterns</div>
          <div className="grid grid-cols-2 gap-2">
            {PATTERN_ITEMS.map((pat) => (
              <button
                key={pat.type}
                onClick={() =>
                  handleAddElement('pattern', {
                    patternType: pat.type,
                    name: `${pat.label} Pattern`,
                    width: 1.0,
                    height: 1.0,
                    patternScale: 1.2,
                    patternColor: 'rgba(255, 255, 255, 0.15)',
                  })
                }
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:bg-slate-900 text-left transition-all"
              >
                <div className="text-xs font-bold text-slate-200 truncate">{pat.label}</div>
                <div className="text-[10px] text-slate-400">{pat.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Element Layer Stack Selector */}
      {elements.length > 0 && (
        <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase px-1">
            <span>Graphics Layers ({elements.length})</span>
            <span className="text-indigo-400 font-mono">Order &amp; Edit</span>
          </div>

          <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {elements.map((el, idx) => {
              const isSelected = el.id === currentElement?.id;
              return (
                <div
                  key={el.id}
                  onClick={() => setSelectedElementId(el.id)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-950 border-indigo-500 ring-1 ring-indigo-500/50 text-white font-semibold'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Shapes className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="truncate max-w-[130px]">{el.name}</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 uppercase">
                      {el.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleMoveLayer(el.id, 'down')}
                      disabled={idx === 0}
                      className="p-1 hover:text-white text-slate-500 disabled:opacity-30"
                      title="Send Backward"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleMoveLayer(el.id, 'up')}
                      disabled={idx === elements.length - 1}
                      className="p-1 hover:text-white text-slate-500 disabled:opacity-30"
                      title="Bring Forward"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => updateCurrentElement({ visible: !el.visible })}
                      className="p-1 hover:text-white text-slate-500"
                    >
                      {el.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-rose-400" />}
                    </button>

                    <button
                      onClick={() => handleDuplicate(el)}
                      className="p-1 hover:text-indigo-300 text-slate-500"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(el.id)}
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

      {/* Selected Element Property Inspector */}
      {currentElement && (
        <div className="space-y-3 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-100">Properties: {currentElement.name}</span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md">
              {currentElement.type}
            </span>
          </div>

          {/* Color & Fill Mode */}
          {currentElement.type !== 'frame' && currentElement.type !== 'line' && currentElement.type !== 'arrow' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">Fill Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentElement.fillColor || '#6366f1'}
                    onChange={(e) => updateCurrentElement({ fillColor: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-slate-300 uppercase">{currentElement.fillColor}</span>
                </div>
              </div>

              {/* Gradient Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                {GRADIENT_PRESETS.slice(0, 6).map((gp) => (
                  <button
                    key={gp.name}
                    onClick={() =>
                      updateCurrentElement({
                        fillType: 'gradient',
                        fillGradient: {
                          type: 'linear',
                          angle: 90,
                          stops: gp.stops,
                        },
                      })
                    }
                    className="w-5 h-5 rounded-lg border border-slate-700 shrink-0 shadow-sm"
                    style={{
                      background: `linear-gradient(90deg, ${gp.stops.map((s) => s.color).join(', ')})`,
                    }}
                    title={gp.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stroke / Outline */}
          <div className="space-y-2 pt-1 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Outline / Stroke</span>
              <input
                type="checkbox"
                checked={currentElement.strokeEnabled}
                onChange={(e) => updateCurrentElement({ strokeEnabled: e.target.checked })}
                className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
              />
            </div>

            {currentElement.strokeEnabled && (
              <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Stroke Width</span>
                  <span className="text-[11px] font-mono text-indigo-400 font-bold">{currentElement.strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={currentElement.strokeWidth}
                  onChange={(e) => updateCurrentElement({ strokeWidth: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-300">Stroke Color</span>
                  <input
                    type="color"
                    value={currentElement.strokeColor || '#ffffff'}
                    onChange={(e) => updateCurrentElement({ strokeColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Glow Effect */}
          <div className="space-y-2 pt-1 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">Neon Glow</span>
              </div>
              <input
                type="checkbox"
                checked={currentElement.glowEnabled}
                onChange={(e) => updateCurrentElement({ glowEnabled: e.target.checked })}
                className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
              />
            </div>

            {currentElement.glowEnabled && (
              <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Glow Radius</span>
                  <span className="text-[11px] font-mono text-cyan-400 font-bold">{currentElement.glowRadius}px</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={60}
                  value={currentElement.glowRadius}
                  onChange={(e) => updateCurrentElement({ glowRadius: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-300">Glow Color</span>
                  <input
                    type="color"
                    value={currentElement.glowColor || '#00f2fe'}
                    onChange={(e) => updateCurrentElement({ glowColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Spatial Controls (Scale, Position, Rotation & Opacity) */}
          <div className="space-y-2.5 pt-1 border-t border-slate-800/80">
            <div className="text-xs font-bold text-slate-200">Transform &amp; Scale</div>

            {/* Size Width & Height */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Width</span>
                  <span className="text-[11px] font-mono text-indigo-400 font-bold">
                    {Math.round(currentElement.width * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={1.2}
                  step={0.01}
                  value={currentElement.width}
                  onChange={(e) => updateCurrentElement({ width: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Height</span>
                  <span className="text-[11px] font-mono text-indigo-400 font-bold">
                    {Math.round(currentElement.height * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={1.2}
                  step={0.01}
                  value={currentElement.height}
                  onChange={(e) => updateCurrentElement({ height: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* Rotation & Opacity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Rotation</span>
                  <span className="text-[11px] font-mono text-indigo-400 font-bold">{currentElement.rotation}°</span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={currentElement.rotation}
                  onChange={(e) => updateCurrentElement({ rotation: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Opacity</span>
                  <span className="text-[11px] font-mono text-indigo-400 font-bold">{currentElement.opacity}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={currentElement.opacity}
                  onChange={(e) => updateCurrentElement({ opacity: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* Position X & Y */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Pos X</span>
                  <span className="text-[11px] font-mono text-indigo-400 font-bold">
                    {Math.round(currentElement.position.x * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={currentElement.position.x}
                  onChange={(e) =>
                    updateCurrentElement({
                      position: { ...currentElement.position, x: Number(e.target.value) },
                    })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Pos Y</span>
                  <span className="text-[11px] font-mono text-indigo-400 font-bold">
                    {Math.round(currentElement.position.y * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={currentElement.position.y}
                  onChange={(e) =>
                    updateCurrentElement({
                      position: { ...currentElement.position, y: Number(e.target.value) },
                    })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
