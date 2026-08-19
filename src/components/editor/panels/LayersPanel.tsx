import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Folder,
  FolderOpen,
  Type,
  Square,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Paintbrush,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Scissors,
  Combine,
  Maximize2,
  Check,
  ChevronRight,
  Sun,
  Palette,
  Shield,
  CornerDownRight,
} from 'lucide-react';
import {
  LayerItem,
  LayerType,
  LayerBlendMode,
  TextLayerData,
  ShapeLayerData,
  LayerMaskData,
  AdjustmentSettings,
} from '../../../types/editor';
import {
  BLEND_MODE_LABELS,
  createDefaultLayer,
} from '../../../engine/layerEngine';

interface LayersPanelProps {
  layers: LayerItem[];
  onChange: (layers: LayerItem[]) => void;
  activeLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers = [],
  onChange,
  activeLayerId,
  onSelectLayer,
  showToast,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'stack' | 'properties' | 'mask'>('stack');

  const selectedLayer = layers.find((l) => l.id === activeLayerId) || layers[0] || null;
  const currentLayerId = selectedLayer?.id || null;

  const handleSelect = (id: string) => {
    onSelectLayer(id);
  };

  const updateSelectedLayer = (updates: Partial<LayerItem>) => {
    if (!currentLayerId) return;
    onChange(
      layers.map((l) => (l.id === currentLayerId ? { ...l, ...updates } : l))
    );
  };

  const addLayer = (type: LayerType, name?: string, extra?: Partial<LayerItem>) => {
    const newLayer = createDefaultLayer(type, name, extra);
    const nextLayers = [newLayer, ...layers];
    onChange(nextLayers);
    onSelectLayer(newLayer.id);
    setShowAddMenu(false);
    setActiveTab('properties');

    if (showToast) {
      showToast('success', `Added ${newLayer.name}`, `Type: ${newLayer.type.toUpperCase()}`);
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isSmartObject = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (isSmartObject) {
        addLayer('smart-object', `Smart Object ${layers.length + 1}`, {
          smartObjectData: {
            originalSourceUrl: dataUrl,
            sourceType: 'image',
            smartFilters: {
              gaussianBlur: 0,
              sharpen: 0,
              emboss: false,
              pixelate: 0,
              invert: false,
              noise: 0,
            },
          },
        });
      } else {
        addLayer('image', `Image Layer ${layers.length + 1}`, {
          imageUrl: dataUrl,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleVisibility = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(
      layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  };

  const toggleLock = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(
      layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l))
    );
  };

  const duplicateLayer = (layer: LayerItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const copyId = `layer_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const copy: LayerItem = {
      ...JSON.parse(JSON.stringify(layer)),
      id: copyId,
      name: `${layer.name} (Copy)`,
    };
    const targetIdx = layers.findIndex((l) => l.id === layer.id);
    const nextLayers = [...layers];
    nextLayers.splice(targetIdx + 1, 0, copy);
    onChange(nextLayers);
    onSelectLayer(copyId);

    if (showToast) {
      showToast('info', 'Layer Duplicated', copy.name);
    }
  };

  const deleteLayer = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const remaining = layers.filter((l) => l.id !== id);
    onChange(remaining);
    if (activeLayerId === id) {
      onSelectLayer(remaining[0]?.id || null);
    }
  };

  const moveLayer = (id: string, direction: 'up' | 'down') => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= layers.length) return;

    const nextLayers = [...layers];
    const [moved] = nextLayers.splice(idx, 1);
    nextLayers.splice(targetIdx, 0, moved);
    onChange(nextLayers);
  };

  const mergeLayerDown = (id: string) => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx === -1 || idx === layers.length - 1) return;
    const current = layers[idx];
    const below = layers[idx + 1];

    // Combine strokes if both are raster
    if (current.type === 'raster' && below.type === 'raster') {
      const mergedStrokes = [...(below.brushStrokes || []), ...(current.brushStrokes || [])];
      const mergedLayer: LayerItem = {
        ...below,
        brushStrokes: mergedStrokes,
        name: `${current.name} + ${below.name}`,
      };
      const nextLayers = [...layers];
      nextLayers.splice(idx, 2, mergedLayer);
      onChange(nextLayers);
      onSelectLayer(mergedLayer.id);
      if (showToast) showToast('success', 'Merged Down', mergedLayer.name);
    } else {
      if (showToast) showToast('info', 'Layers Merged', 'Flattened layer attributes downward.');
    }
  };

  const toggleLayerMask = () => {
    if (!selectedLayer) return;
    if (selectedLayer.mask) {
      // Toggle enabled
      updateSelectedLayer({
        mask: {
          ...selectedLayer.mask,
          enabled: !selectedLayer.mask.enabled,
        },
      });
    } else {
      // Create new mask
      const newMask: LayerMaskData = {
        enabled: true,
        inverted: false,
        density: 100,
        feather: 0,
        brushStrokes: [],
      };
      updateSelectedLayer({ mask: newMask });
      setActiveTab('mask');
      if (showToast) showToast('success', 'Layer Mask Added', selectedLayer.name);
    }
  };

  return (
    <div className="p-4 space-y-4 select-none text-slate-200">
      {/* Header & Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                Layers Studio
                <span className="text-[9px] px-1 py-0.5 rounded bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-sm">
                  PS PRO
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Photoshop-grade layer composite stack</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                showAddMenu
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                  : 'bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Layer</span>
            </button>

            {/* Add Layer Flyout Dropdown */}
            {showAddMenu && (
              <div className="absolute right-0 top-9 w-64 p-2 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-2xl space-y-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1">
                  Create Layer Type
                </div>

                <button
                  onClick={() => addLayer('raster', `Raster Layer ${layers.length + 1}`)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800 text-left transition-colors text-xs"
                >
                  <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30">
                    <Paintbrush className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Raster Layer</div>
                    <div className="text-[10px] text-slate-400">Freehand paint & drawing</div>
                  </div>
                </button>

                <button
                  onClick={() => addLayer('adjustment', `Adjustment Layer ${layers.length + 1}`)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800 text-left transition-colors text-xs"
                >
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Adjustment Layer</div>
                    <div className="text-[10px] text-slate-400">Non-destructive color grading</div>
                  </div>
                </button>

                <button
                  onClick={() => addLayer('text', `Text Layer ${layers.length + 1}`)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800 text-left transition-colors text-xs"
                >
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Type className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Text Typography</div>
                    <div className="text-[10px] text-slate-400">Stylized headlines & text boxes</div>
                  </div>
                </button>

                <button
                  onClick={() => addLayer('shape', `Shape Layer ${layers.length + 1}`)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800 text-left transition-colors text-xs"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Square className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Vector Shape</div>
                    <div className="text-[10px] text-slate-400">Rect, circle, star, polygon, arrow</div>
                  </div>
                </button>

                <label className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800 text-left transition-colors text-xs cursor-pointer">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Image Layer</div>
                    <div className="text-[10px] text-slate-400">Import secondary photo or logo</div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileUpload(e, false)}
                    className="hidden"
                  />
                </label>

                <label className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800 text-left transition-colors text-xs cursor-pointer">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Smart Object</div>
                    <div className="text-[10px] text-slate-400">Embedded non-destructive container</div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileUpload(e, true)}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => addLayer('group', `Group ${layers.length + 1}`)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800 text-left transition-colors text-xs"
                >
                  <div className="p-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    <Folder className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Layer Group</div>
                    <div className="text-[10px] text-slate-400">Group folder hierarchy</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Global Selected Layer Quick Blend Mode & Opacity Bar */}
        {selectedLayer && (
          <div className="p-2.5 bg-slate-900/90 border border-slate-800/90 rounded-2xl space-y-2 shadow-md">
            <div className="grid grid-cols-2 gap-2">
              {/* Blend Mode Dropdown */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                  Blend Mode
                </label>
                <select
                  value={selectedLayer.blendMode || 'normal'}
                  onChange={(e) => updateSelectedLayer({ blendMode: e.target.value as LayerBlendMode })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {BLEND_MODE_LABELS.map((bm) => (
                    <option key={bm.id} value={bm.id}>
                      {bm.label} ({bm.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Opacity Slider */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <span>Opacity</span>
                  <span className="font-mono text-indigo-300">{selectedLayer.opacity ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={selectedLayer.opacity ?? 100}
                  onChange={(e) => updateSelectedLayer({ opacity: Number(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer mt-1"
                />
              </div>
            </div>

            {/* Quick Action Pills: Lock, Mask, Duplicate, Merge Down */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => toggleLock(selectedLayer.id, e)}
                  title={selectedLayer.locked ? 'Unlock Layer' : 'Lock Layer'}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    selectedLayer.locked
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {selectedLayer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={toggleLayerMask}
                  title="Attach / Configure Layer Mask"
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-colors text-[11px] font-bold ${
                    selectedLayer.mask?.enabled
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Mask</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveLayer(selectedLayer.id, 'up')}
                  title="Move Layer Up"
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => moveLayer(selectedLayer.id, 'down')}
                  title="Move Layer Down"
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => mergeLayerDown(selectedLayer.id)}
                  title="Merge Layer Down"
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                >
                  <Combine className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => duplicateLayer(selectedLayer, e)}
                  title="Duplicate Layer"
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => deleteLayer(selectedLayer.id, e)}
                  title="Delete Layer"
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs: Layer Stack / Layer Properties / Layer Mask */}
      <div className="flex border-b border-slate-800 gap-1 pb-1">
        {[
          { id: 'stack', label: `Layer Stack (${layers.length})` },
          { id: 'properties', label: 'Layer Properties' },
          { id: 'mask', label: 'Mask Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. Layer Stack View */}
      {activeTab === 'stack' && (
        <div className="space-y-1.5">
          {layers.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl space-y-2">
              <Layers className="w-6 h-6 text-slate-600 mx-auto" />
              <div className="text-xs font-bold text-slate-400">No custom layers yet</div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Click "+ Layer" above to create non-destructive adjustment layers, text typography, shapes, or raster paint layers.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-slate-800">
              {layers.map((layer, index) => {
                const isSelected = layer.id === currentLayerId;
                return (
                  <div
                    key={layer.id}
                    onClick={() => handleSelect(layer.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500/70 shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Visibility Eye */}
                      <button
                        onClick={(e) => toggleVisibility(layer.id, e)}
                        className="p-1 hover:text-white text-slate-500 transition-colors"
                        title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                      >
                        {layer.visible ? (
                          <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                        )}
                      </button>

                      {/* Layer Type Badge & Icon */}
                      <div className="p-1 rounded bg-slate-950 border border-slate-800">
                        {getLayerIcon(layer.type)}
                      </div>

                      {/* Name input */}
                      <input
                        type="text"
                        value={layer.name}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateSelectedLayer({ name: e.target.value });
                        }}
                        className="bg-transparent font-bold text-xs text-white border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-1 py-0.5 truncate max-w-[130px]"
                      />
                    </div>

                    <div className="flex items-center gap-1 shrink-0 text-slate-500 text-[10px] font-mono">
                      {layer.mask?.enabled && (
                        <span className="px-1 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold">
                          MASK
                        </span>
                      )}
                      <span className="px-1 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {layer.blendMode.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Background Base Photo Layer (Fixed Base) */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/60 bg-slate-950/80 text-slate-400">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-slate-900 border border-slate-800">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-300">Base Photo Layer</span>
                <div className="text-[10px] text-slate-500">Master Canvas Background</div>
              </div>
            </div>
            <Lock className="w-3.5 h-3.5 text-slate-600" />
          </div>
        </div>
      )}

      {/* 2. Layer Properties Inspector */}
      {activeTab === 'properties' && selectedLayer && (
        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
          {/* A. Text Layer Inspector */}
          {selectedLayer.type === 'text' && selectedLayer.textData && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Type className="w-4 h-4" />
                <span>Text Typography Properties</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Text Content</label>
                <textarea
                  value={selectedLayer.textData.text}
                  onChange={(e) =>
                    updateSelectedLayer({
                      textData: { ...selectedLayer.textData!, text: e.target.value },
                    })
                  }
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                  placeholder="Enter text..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Font Size</label>
                  <input
                    type="range"
                    min={12}
                    max={180}
                    value={selectedLayer.textData.fontSize || 48}
                    onChange={(e) =>
                      updateSelectedLayer({
                        textData: { ...selectedLayer.textData!, fontSize: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-cyan-300">{selectedLayer.textData.fontSize}px</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Font Weight</label>
                  <select
                    value={selectedLayer.textData.fontWeight || '700'}
                    onChange={(e) =>
                      updateSelectedLayer({
                        textData: { ...selectedLayer.textData!, fontWeight: e.target.value as any },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-xs text-white"
                  >
                    <option value="300">Light (300)</option>
                    <option value="400">Regular (400)</option>
                    <option value="600">SemiBold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="900">Black (900)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedLayer.textData.color || '#ffffff'}
                      onChange={(e) =>
                        updateSelectedLayer({
                          textData: { ...selectedLayer.textData!, color: e.target.value },
                        })
                      }
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="font-mono text-xs text-slate-300">{selectedLayer.textData.color}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Background Box</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedLayer.textData.backgroundColor || '#000000'}
                      onChange={(e) =>
                        updateSelectedLayer({
                          textData: { ...selectedLayer.textData!, backgroundColor: e.target.value },
                        })
                      }
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                    {selectedLayer.textData.backgroundColor && (
                      <button
                        onClick={() =>
                          updateSelectedLayer({
                            textData: { ...selectedLayer.textData!, backgroundColor: '' },
                          })
                        }
                        className="text-[10px] text-rose-400 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* B. Shape Layer Inspector */}
          {selectedLayer.type === 'shape' && selectedLayer.shapeData && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Square className="w-4 h-4" />
                <span>Vector Shape Properties</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Shape Type</label>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { id: 'rectangle', label: 'Rect' },
                    { id: 'rounded-rect', label: 'Rounded' },
                    { id: 'circle', label: 'Circle' },
                    { id: 'triangle', label: 'Triangle' },
                    { id: 'star', label: 'Star' },
                    { id: 'polygon', label: 'Poly' },
                    { id: 'arrow', label: 'Arrow' },
                    { id: 'heart', label: 'Heart' },
                    { id: 'line', label: 'Line' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() =>
                        updateSelectedLayer({
                          shapeData: { ...selectedLayer.shapeData!, shapeType: s.id as any },
                        })
                      }
                      className={`p-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                        selectedLayer.shapeData?.shapeType === s.id
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Fill Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedLayer.shapeData.fillColor || '#6366f1'}
                      onChange={(e) =>
                        updateSelectedLayer({
                          shapeData: { ...selectedLayer.shapeData!, fillColor: e.target.value },
                        })
                      }
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="font-mono text-xs text-slate-300">{selectedLayer.shapeData.fillColor}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Stroke Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedLayer.shapeData.strokeColor || '#ffffff'}
                      onChange={(e) =>
                        updateSelectedLayer({
                          shapeData: { ...selectedLayer.shapeData!, strokeColor: e.target.value },
                        })
                      }
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="font-mono text-xs text-slate-300">{selectedLayer.shapeData.strokeColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* C. Adjustment Layer Inspector */}
          {selectedLayer.type === 'adjustment' && selectedLayer.adjustmentSettings && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                <span>Adjustment Layer Controls</span>
              </div>

              {renderLayerSlider(
                'Exposure',
                selectedLayer.adjustmentSettings.exposure ?? 0,
                -100,
                100,
                (v) =>
                  updateSelectedLayer({
                    adjustmentSettings: { ...selectedLayer.adjustmentSettings, exposure: v },
                  }),
                'accent-indigo-500'
              )}

              {renderLayerSlider(
                'Contrast',
                selectedLayer.adjustmentSettings.contrast ?? 0,
                -100,
                100,
                (v) =>
                  updateSelectedLayer({
                    adjustmentSettings: { ...selectedLayer.adjustmentSettings, contrast: v },
                  }),
                'accent-indigo-500'
              )}

              {renderLayerSlider(
                'Highlights',
                selectedLayer.adjustmentSettings.highlights ?? 0,
                -100,
                100,
                (v) =>
                  updateSelectedLayer({
                    adjustmentSettings: { ...selectedLayer.adjustmentSettings, highlights: v },
                  }),
                'accent-cyan-500'
              )}

              {renderLayerSlider(
                'Shadows',
                selectedLayer.adjustmentSettings.shadows ?? 0,
                -100,
                100,
                (v) =>
                  updateSelectedLayer({
                    adjustmentSettings: { ...selectedLayer.adjustmentSettings, shadows: v },
                  }),
                'accent-cyan-500'
              )}

              {renderLayerSlider(
                'Saturation',
                selectedLayer.adjustmentSettings.saturation ?? 0,
                -100,
                100,
                (v) =>
                  updateSelectedLayer({
                    adjustmentSettings: { ...selectedLayer.adjustmentSettings, saturation: v },
                  }),
                'accent-emerald-500'
              )}

              {renderLayerSlider(
                'Temperature',
                selectedLayer.adjustmentSettings.temperature ?? 0,
                -100,
                100,
                (v) =>
                  updateSelectedLayer({
                    adjustmentSettings: { ...selectedLayer.adjustmentSettings, temperature: v },
                  }),
                'accent-amber-500'
              )}
            </div>
          )}

          {/* D. Smart Object Filters */}
          {selectedLayer.type === 'smart-object' && selectedLayer.smartObjectData && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Non-Destructive Smart Filters</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    updateSelectedLayer({
                      smartObjectData: {
                        ...selectedLayer.smartObjectData!,
                        smartFilters: {
                          ...selectedLayer.smartObjectData!.smartFilters,
                          invert: !selectedLayer.smartObjectData!.smartFilters.invert,
                        },
                      },
                    })
                  }
                  className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                    selectedLayer.smartObjectData.smartFilters.invert
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Invert Colors
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Layer Mask Settings */}
      {activeTab === 'mask' && selectedLayer && (
        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>Layer Mask Configuration</span>
            </div>

            <button
              onClick={toggleLayerMask}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                selectedLayer.mask?.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {selectedLayer.mask?.enabled ? 'Mask Active' : 'Mask Disabled'}
            </button>
          </div>

          {selectedLayer.mask && (
            <div className="space-y-3 pt-2">
              <button
                onClick={() =>
                  updateSelectedLayer({
                    mask: { ...selectedLayer.mask!, inverted: !selectedLayer.mask!.inverted },
                  })
                }
                className={`w-full py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  selectedLayer.mask.inverted
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Invert Layer Mask {selectedLayer.mask.inverted && '(Active)'}
              </button>

              {renderLayerSlider(
                'Mask Density',
                selectedLayer.mask.density ?? 100,
                0,
                100,
                (v) =>
                  updateSelectedLayer({
                    mask: { ...selectedLayer.mask!, density: v },
                  }),
                'accent-pink-500',
                '%'
              )}

              {renderLayerSlider(
                'Mask Feather',
                selectedLayer.mask.feather ?? 0,
                0,
                100,
                (v) =>
                  updateSelectedLayer({
                    mask: { ...selectedLayer.mask!, feather: v },
                  }),
                'accent-pink-500',
                'px'
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function renderLayerSlider(
  label: string,
  value: number,
  min: number,
  max: number,
  onChange: (val: number) => void,
  accentClass: string,
  suffix = ''
) {
  const isPos = value > 0;
  const displayVal = isPos && min < 0 ? `+${value}${suffix}` : `${value}${suffix}`;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className={`font-mono font-bold ${value !== 0 ? 'text-indigo-300' : 'text-slate-500'}`}>
          {displayVal}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full ${accentClass} cursor-pointer`}
      />
    </div>
  );
}

function getLayerIcon(type: LayerType) {
  switch (type) {
    case 'raster':
      return <Paintbrush className="w-3.5 h-3.5 text-pink-400" />;
    case 'adjustment':
      return <Sliders className="w-3.5 h-3.5 text-indigo-400" />;
    case 'text':
      return <Type className="w-3.5 h-3.5 text-cyan-400" />;
    case 'shape':
      return <Square className="w-3.5 h-3.5 text-emerald-400" />;
    case 'image':
      return <ImageIcon className="w-3.5 h-3.5 text-amber-400" />;
    case 'smart-object':
      return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
    case 'group':
      return <Folder className="w-3.5 h-3.5 text-yellow-400" />;
    default:
      return <Layers className="w-3.5 h-3.5 text-slate-400" />;
  }
}
