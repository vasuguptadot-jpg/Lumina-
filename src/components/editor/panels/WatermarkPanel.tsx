import React, { useState, useRef } from 'react';
import {
  Stamp,
  Square,
  Grid,
  Type,
  Image as ImageIcon,
  Shield,
  Layers,
  Sparkles,
  RotateCw,
  Move,
  Eye,
  Sliders,
  Copy,
  Check,
  Upload,
  Trash2,
  Maximize2,
  Crown,
  Aperture,
  FileBadge,
  Feather,
  Shuffle,
} from 'lucide-react';
import {
  WatermarkSettings,
  BorderSettings,
  WatermarkPosition,
  WatermarkType,
  WatermarkLogoPreset,
} from '../../../types/editor';

interface WatermarkPanelProps {
  watermark: WatermarkSettings;
  border: BorderSettings;
  onChangeWatermark: (w: WatermarkSettings) => void;
  onChangeBorder: (b: BorderSettings) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

const NINE_POSITIONS: { id: WatermarkPosition; label: string; row: number; col: number }[] = [
  { id: 'top-left', label: 'TL', row: 1, col: 1 },
  { id: 'top-center', label: 'TC', row: 1, col: 2 },
  { id: 'top-right', label: 'TR', row: 1, col: 3 },
  { id: 'center-left', label: 'CL', row: 2, col: 1 },
  { id: 'center', label: 'C', row: 2, col: 2 },
  { id: 'center-right', label: 'CR', row: 2, col: 3 },
  { id: 'bottom-left', label: 'BL', row: 3, col: 1 },
  { id: 'bottom-center', label: 'BC', row: 3, col: 2 },
  { id: 'bottom-right', label: 'BR', row: 3, col: 3 },
];

const FONT_FAMILIES = [
  { name: 'Inter (Modern Sans)', value: 'Inter, -apple-system, sans-serif' },
  { name: 'Playfair (Classic Serif)', value: '"Playfair Display", Georgia, serif' },
  { name: 'Cinzel (Luxury Roman)', value: 'Cinzel, Times New Roman, serif' },
  { name: 'Montserrat (Bold Clean)', value: 'Montserrat, sans-serif' },
  { name: 'Caveat (Calligraphy Script)', value: 'Caveat, "Dancing Script", cursive' },
  { name: 'JetBrains Mono (Technical)', value: '"JetBrains Mono", monospace' },
  { name: 'Courier Prime (Vintage Type)', value: '"Courier New", Courier, monospace' },
];

const LOGO_PRESETS: { id: WatermarkLogoPreset; label: string; desc: string; icon: any }[] = [
  { id: 'camera-shutter', label: 'Camera Shutter', desc: 'Optics & 6-blade aperture', icon: Aperture },
  { id: 'studio-aperture', label: 'Studio Octagon', desc: 'Precision geometric mark', icon: Shield },
  { id: 'crown-luxury', label: 'Royal Crown', desc: 'Luxury editorial monogram', icon: Crown },
  { id: 'diamond-crest', label: 'Diamond Crest', desc: 'Fine-art photography crest', icon: Sparkles },
  { id: 'copyright-seal', label: 'Copyright Seal', desc: 'Universal © protected mark', icon: FileBadge },
  { id: 'signature-script', label: 'Signature Script', desc: 'Handcrafted artist emblem', icon: Feather },
  { id: 'minimal-cross', label: 'Minimal Cross', desc: 'Clean modernist crosshair', icon: Maximize2 },
];

const WATERMARK_TEMPLATES: {
  name: string;
  desc: string;
  badge: string;
  settings: Partial<WatermarkSettings>;
}[] = [
  {
    name: 'Modern Studio Minimal',
    desc: 'Clean Inter font in bottom-right corner with soft drop shadow',
    badge: 'MINIMAL',
    settings: {
      type: 'text',
      text: '© Lumina Studio Pro',
      font: 'Inter, sans-serif',
      fontSize: 22,
      fontWeight: '600',
      color: '#ffffff',
      opacity: 85,
      position: 'bottom-right',
      hasShadow: true,
      shadowBlur: 6,
      padding: 32,
      isTiled: false,
      rotation: 0,
      size: 100,
    },
  },
  {
    name: 'Luxury Gold Crest',
    desc: 'Golden crown vector logo with high-opacity corner anchor',
    badge: 'LUXURY',
    settings: {
      type: 'logo',
      logoPreset: 'crown-luxury',
      color: '#f59e0b',
      opacity: 90,
      position: 'bottom-right',
      hasShadow: true,
      shadowBlur: 8,
      padding: 36,
      isTiled: false,
      rotation: 0,
      size: 120,
    },
  },
  {
    name: 'Artist Calligraphy Signature',
    desc: 'Handcrafted cursive signature with subtle italic slope',
    badge: 'ARTIST',
    settings: {
      type: 'text',
      text: 'Captured by Lumina',
      font: 'Caveat, "Dancing Script", cursive',
      fontSize: 34,
      fontWeight: 'bold',
      color: '#ffffff',
      opacity: 90,
      position: 'bottom-right',
      hasShadow: true,
      shadowBlur: 4,
      padding: 28,
      rotation: -3,
      isTiled: false,
      size: 110,
    },
  },
  {
    name: 'Anti-Theft Proofing Grid',
    desc: 'Repeating diagonal tiled watermark for client review & anti-piracy',
    badge: 'PROOF',
    settings: {
      type: 'pattern-tile',
      text: 'PROOF • DO NOT COPY • LUMINA PRO',
      font: 'Montserrat, sans-serif',
      fontSize: 20,
      fontWeight: '900',
      color: '#ffffff',
      opacity: 35,
      isTiled: true,
      tileRotation: -30,
      tileSpacingX: 200,
      tileSpacingY: 140,
      hasShadow: true,
      shadowBlur: 3,
    },
  },
  {
    name: 'Editorial Copyright Seal',
    desc: 'Official copyright seal stamp in bottom-left corner',
    badge: 'SEAL',
    settings: {
      type: 'logo',
      logoPreset: 'copyright-seal',
      color: '#ffffff',
      opacity: 80,
      position: 'bottom-left',
      hasShadow: true,
      shadowBlur: 6,
      padding: 32,
      isTiled: false,
      size: 100,
      rotation: 0,
    },
  },
];

export const WatermarkPanel: React.FC<WatermarkPanelProps> = ({
  watermark,
  border,
  onChangeWatermark,
  onChangeBorder,
  showToast,
}) => {
  const [activeSection, setActiveSection] = useState<'watermark' | 'border' | 'templates'>('watermark');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onChangeWatermark({
        ...watermark,
        type: 'image',
        imageUrl: url,
        enabled: true,
      });
      if (showToast) {
        showToast('success', 'Custom Watermark Loaded', file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const applyTemplate = (tpl: typeof WATERMARK_TEMPLATES[0]) => {
    onChangeWatermark({
      ...watermark,
      enabled: true,
      ...tpl.settings,
    });
    if (showToast) {
      showToast('info', 'Template Applied', tpl.name);
    }
  };

  return (
    <div className="p-4 space-y-5 select-none overflow-y-auto max-h-full pb-20 scrollbar-thin">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400">
            <Stamp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Watermark & Frame Studio</h3>
            <p className="text-[11px] text-slate-400">Copyright, Logos, Tiling & Framing</p>
          </div>
        </div>

        {/* Master Watermark Power Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={watermark.enabled}
            onChange={(e) => onChangeWatermark({ ...watermark, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {/* Sub-Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveSection('watermark')}
          className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSection === 'watermark'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Stamp className="w-3.5 h-3.5" />
          <span>Watermark</span>
        </button>

        <button
          onClick={() => setActiveSection('templates')}
          className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSection === 'templates'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Presets</span>
        </button>

        <button
          onClick={() => setActiveSection('border')}
          className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSection === 'border'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Square className="w-3.5 h-3.5" />
          <span>Frame & Mat</span>
        </button>
      </div>

      {/* ========================================================== */}
      {/* SECTION 1: WATERMARK CONFIGURATION                         */}
      {/* ========================================================== */}
      {activeSection === 'watermark' && (
        <div className="space-y-4">
          {/* Watermark Type Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Watermark Mode</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'text', label: 'Text', icon: Type },
                { id: 'logo', label: 'Logo', icon: Shield },
                { id: 'image', label: 'Custom Stamp', icon: ImageIcon },
                { id: 'pattern-tile', label: 'Tiling Grid', icon: Grid },
              ].map((m) => {
                const Icon = m.icon;
                const isCur = (watermark.type || 'text') === m.id || (m.id === 'pattern-tile' && watermark.isTiled);
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      if (m.id === 'pattern-tile') {
                        onChangeWatermark({
                          ...watermark,
                          type: 'pattern-tile',
                          isTiled: true,
                          enabled: true,
                        });
                      } else {
                        onChangeWatermark({
                          ...watermark,
                          type: m.id as WatermarkType,
                          isTiled: false,
                          enabled: true,
                        });
                      }
                    }}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      isCur
                        ? 'bg-indigo-600/90 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] font-bold">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1. TEXT WATERMARK CONTROLS */}
          {((watermark.type || 'text') === 'text' || watermark.type === 'pattern-tile') && (
            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Watermark Text Content</label>
                <input
                  type="text"
                  value={watermark.text || ''}
                  onChange={(e) => onChangeWatermark({ ...watermark, text: e.target.value })}
                  placeholder="e.g. © 2026 Lumina Studio Pro"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              {/* Dynamic Macro Quick Insert */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500">Quick Tokens:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: '© Copyright', insert: '© 2026' },
                    { label: '• All Rights Reserved', insert: ' • All Rights Reserved' },
                    { label: 'PROOF', insert: 'PROOF ONLY • DO NOT DISTRIBUTE' },
                    { label: 'Captured by', insert: 'Captured by ' },
                  ].map((tok) => (
                    <button
                      key={tok.label}
                      onClick={() =>
                        onChangeWatermark({
                          ...watermark,
                          text: watermark.text ? `${watermark.text} ${tok.insert}` : tok.insert,
                        })
                      }
                      className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-indigo-300 hover:text-white"
                    >
                      +{tok.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography Font Family */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Typography Font</label>
                <select
                  value={watermark.font || 'Inter, sans-serif'}
                  onChange={(e) => onChangeWatermark({ ...watermark, font: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                >
                  {FONT_FAMILIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Weight and Color */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Font Weight</label>
                  <select
                    value={watermark.fontWeight || '600'}
                    onChange={(e) => onChangeWatermark({ ...watermark, fontWeight: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none"
                  >
                    <option value="300">Light (300)</option>
                    <option value="normal">Regular (400)</option>
                    <option value="600">Semibold (600)</option>
                    <option value="bold">Bold (700)</option>
                    <option value="900">Black (900)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Text Color</label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
                    <input
                      type="color"
                      value={watermark.color || '#ffffff'}
                      onChange={(e) => onChangeWatermark({ ...watermark, color: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-[11px] font-mono text-slate-300 uppercase">{watermark.color || '#FFFFFF'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. VECTOR LOGO WATERMARK CONTROLS */}
          {watermark.type === 'logo' && (
            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <label className="text-[11px] font-semibold text-slate-300">Vector Emblem / Badge</label>
              <div className="grid grid-cols-2 gap-2">
                {LOGO_PRESETS.map((lp) => {
                  const Icon = lp.icon;
                  const isCur = (watermark.logoPreset || 'camera-shutter') === lp.id;
                  return (
                    <button
                      key={lp.id}
                      onClick={() => onChangeWatermark({ ...watermark, logoPreset: lp.id })}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                        isCur
                          ? 'bg-indigo-600/30 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isCur ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <div>
                        <div className="text-xs font-bold text-slate-200">{lp.label}</div>
                        <div className="text-[10px] text-slate-400 leading-tight">{lp.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Logo Color */}
              <div className="space-y-1 pt-1 border-t border-slate-800">
                <label className="text-[11px] font-semibold text-slate-300">Emblem Color</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
                  <input
                    type="color"
                    value={watermark.color || '#ffffff'}
                    onChange={(e) => onChangeWatermark({ ...watermark, color: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-slate-300">{watermark.color || '#FFFFFF'}</span>
                  <div className="flex items-center gap-1 ml-auto">
                    {['#ffffff', '#f59e0b', '#3b82f6', '#10b981', '#000000'].map((c) => (
                      <button
                        key={c}
                        onClick={() => onChangeWatermark({ ...watermark, color: c })}
                        style={{ backgroundColor: c }}
                        className="w-4 h-4 rounded-full border border-slate-700 hover:scale-110 transition-transform"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. CUSTOM IMAGE STAMP CONTROLS */}
          {watermark.type === 'image' && (
            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />

              {watermark.imageUrl ? (
                <div className="space-y-2">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden p-1">
                        <img
                          src={watermark.imageUrl}
                          alt="Custom watermark stamp"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Custom Logo Stamp</div>
                        <div className="text-[10px] text-emerald-400">Active Transparent Overlay</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Replace image"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onChangeWatermark({ ...watermark, imageUrl: undefined, type: 'text' })}
                        className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-white transition-all bg-slate-950/60"
                >
                  <Upload className="w-5 h-5 text-indigo-400" />
                  <div className="text-xs font-bold">Upload Transparent PNG / SVG Stamp</div>
                  <div className="text-[10px] text-slate-500">Supports transparent logos and signatures</div>
                </button>
              )}
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* POSITIONING & 9-GRID                                 */}
          {/* ---------------------------------------------------- */}
          {!watermark.isTiled && watermark.type !== 'pattern-tile' && (
            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-indigo-400" />
                  Anchor Position (9-Point Matrix)
                </label>
                <span className="text-[10px] font-mono text-indigo-300 uppercase">
                  {watermark.position?.replace('-', ' ')}
                </span>
              </div>

              {/* 3x3 Grid of Buttons */}
              <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto">
                {NINE_POSITIONS.map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => onChangeWatermark({ ...watermark, position: pos.id })}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      watermark.position === pos.id
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>

              {/* Edge Margin / Padding */}
              <div className="space-y-1 pt-2 border-t border-slate-800">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Edge Inset Padding</span>
                  <span className="font-mono text-indigo-300">{watermark.padding || 32}px</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={96}
                  value={watermark.padding || 32}
                  onChange={(e) => onChangeWatermark({ ...watermark, padding: Number(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* TILING CONTROLS (Proofing / Anti-Theft Grid)         */}
          {/* ---------------------------------------------------- */}
          {(watermark.isTiled || watermark.type === 'pattern-tile') && (
            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5 text-indigo-400" />
                  Repeating Tiling Pattern Grid
                </label>
                <span className="text-[10px] text-amber-400 font-mono">PROOFING</span>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Tile Angle Rotation</span>
                    <span className="font-mono text-indigo-300">{watermark.tileRotation ?? -25}°</span>
                  </div>
                  <input
                    type="range"
                    min={-45}
                    max={45}
                    value={watermark.tileRotation ?? -25}
                    onChange={(e) => onChangeWatermark({ ...watermark, tileRotation: Number(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Horizontal Spacing</span>
                    <span className="font-mono text-indigo-300">{watermark.tileSpacingX || 180}px</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={400}
                    value={watermark.tileSpacingX || 180}
                    onChange={(e) => onChangeWatermark({ ...watermark, tileSpacingX: Number(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Vertical Spacing</span>
                    <span className="font-mono text-indigo-300">{watermark.tileSpacingY || 120}px</span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={300}
                    value={watermark.tileSpacingY || 120}
                    onChange={(e) => onChangeWatermark({ ...watermark, tileSpacingY: Number(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* OPACITY, SIZE, ROTATION & SHADOW SLIDERS             */}
          {/* ---------------------------------------------------- */}
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3.5">
            {/* Opacity Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  Watermark Opacity
                </span>
                <span className="font-mono text-indigo-400 font-bold">{watermark.opacity}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                value={watermark.opacity}
                onChange={(e) => onChangeWatermark({ ...watermark, opacity: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Size Scale Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                  Size Scaling
                </span>
                <span className="font-mono text-indigo-400 font-bold">{watermark.size || 100}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={250}
                value={watermark.size || 100}
                onChange={(e) => onChangeWatermark({ ...watermark, size: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Rotation Slider (Single Mode) */}
            {!watermark.isTiled && watermark.type !== 'pattern-tile' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                    Rotation Angle
                  </span>
                  <span className="font-mono text-indigo-400 font-bold">{watermark.rotation || 0}°</span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={watermark.rotation || 0}
                  onChange={(e) => onChangeWatermark({ ...watermark, rotation: Number(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex gap-1 pt-1">
                  {[-90, -45, 0, 45, 90].map((deg) => (
                    <button
                      key={deg}
                      onClick={() => onChangeWatermark({ ...watermark, rotation: deg })}
                      className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 hover:text-white"
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Drop Shadow Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300">Drop Shadow Elevation</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={watermark.hasShadow}
                  onChange={(e) => onChangeWatermark({ ...watermark, hasShadow: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SECTION 2: WATERMARK PRESETS / TEMPLATES                   */}
      {/* ========================================================== */}
      {activeSection === 'templates' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            One-click watermark layouts designed for commercial proofing, branding, and luxury photography.
          </p>

          <div className="space-y-2">
            {WATERMARK_TEMPLATES.map((tpl) => (
              <div
                key={tpl.name}
                className="p-3 bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl space-y-2 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {tpl.name}
                  </div>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-500/40 text-indigo-300">
                    {tpl.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{tpl.desc}</p>
                <button
                  onClick={() => applyTemplate(tpl)}
                  className="w-full py-1.5 bg-slate-950 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all"
                >
                  Apply Preset
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SECTION 3: BORDER & FRAME MAT                              */}
      {/* ========================================================== */}
      {activeSection === 'border' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Square className="w-3.5 h-3.5 text-amber-400" />
              Frame & Passe-Partout Matting
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={border.enabled}
                onChange={(e) => onChangeBorder({ ...border, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="text-[11px] font-semibold text-slate-300">Frame Archetype</label>
              <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                {[
                  { id: 'solid', label: 'Solid Border' },
                  { id: 'minimal', label: 'Fine Inset' },
                  { id: 'gallery', label: 'Gallery Mat' },
                  { id: 'polaroid', label: 'Polaroid Instant' },
                  { id: 'film', label: '35mm Film Strip' },
                  { id: 'vintage-frame', label: 'Vintage Double' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => onChangeBorder({ ...border, type: type.id as any, enabled: true })}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      border.type === type.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Thickness */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Frame Thickness</span>
                <span className="font-mono text-amber-300">{border.size}px</span>
              </div>
              <input
                type="range"
                min={4}
                max={90}
                value={border.size}
                onChange={(e) => onChangeBorder({ ...border, size: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Corner Radius */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Corner Rounding Radius</span>
                <span className="font-mono text-amber-300">{border.radius || 0}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                value={border.radius || 0}
                onChange={(e) => onChangeBorder({ ...border, radius: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Frame Color */}
            <div className="space-y-1 pt-1 border-t border-slate-800">
              <label className="text-[11px] font-semibold text-slate-300">Border Color</label>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
                <input
                  type="color"
                  value={border.color || '#ffffff'}
                  onChange={(e) => onChangeBorder({ ...border, color: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-slate-300 uppercase">{border.color || '#FFFFFF'}</span>
                <div className="flex items-center gap-1 ml-auto">
                  {['#ffffff', '#000000', '#fcfbf7', '#d4af37', '#1e293b'].map((c) => (
                    <button
                      key={c}
                      onClick={() => onChangeBorder({ ...border, color: c })}
                      style={{ backgroundColor: c }}
                      className="w-4 h-4 rounded-full border border-slate-700 hover:scale-110 transition-transform"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Optional Polaroid Caption */}
            {border.type === 'polaroid' && (
              <div className="space-y-1 pt-1 border-t border-slate-800">
                <label className="text-[11px] font-semibold text-slate-300">Handwritten Polaroid Caption</label>
                <input
                  type="text"
                  value={border.captionText || ''}
                  onChange={(e) => onChangeBorder({ ...border, captionText: e.target.value })}
                  placeholder="e.g. Summer in Kyoto '26"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
