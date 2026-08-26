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
  Type,
  Square,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Paintbrush,
  ChevronUp,
  ChevronDown,
  Combine,
  Sun,
} from 'lucide-react';
import {
  LayerItem,
  LayerType,
  LayerBlendMode,
  LayerMaskData,
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
    const duplicated: LayerItem = {
      ...layer,
      id: `layer_${Date.now()}`,
      name: `${layer.name} (Copy)`,
    };
    const nextLayers = [duplicated, ...layers];
    onChange(nextLayers);
    onSelectLayer(duplicated.id);
    if (showToast) showToast('info', 'Layer Duplicated', duplicated.name);
  };

  const deleteLayer = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextLayers = layers.filter((l) => l.id !== id);
    onChange(nextLayers);
    if (activeLayerId === id) {
      onSelectLayer(nextLayers[0]?.id || null);
    }
    if (showToast) showToast('info', 'Layer Deleted');
  };

  const moveLayer = (id: string, direction: 'up' | 'down') => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx > 0) {
      const next = [...layers];
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
      onChange(next);
    } else if (direction === 'down' && idx < layers.length - 1) {
      const next = [...layers];
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
      onChange(next);
    }
  };

  const mergeLayerDown = (id: string) => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx === -1 || idx >= layers.length - 1) {
      if (showToast) showToast('info', 'Cannot Merge', 'No lower layer to merge into.');
      return;
    }
    const current = layers[idx];
    const below = layers[idx + 1];
    const mergedName = `${below.name} + ${current.name}`;
    const next = [...layers];
    next.splice(idx, 2, { ...below, name: mergedName });
    onChange(next);
    onSelectLayer(below.id);
    if (showToast) showToast('success', 'Layers Merged', mergedName);
  };

  const toggleLayerMask = () => {
    if (!selectedLayer) return;
    if (selectedLayer.mask) {
      updateSelectedLayer({
        mask: {
          ...selectedLayer.mask,
          enabled: !selectedLayer.mask.enabled,
        },
      });
    } else {
      const newMask: LayerMaskData = {
        enabled: true,
        inverted: false,
        density: 100,
        feather: 0,
        brushStrokes: [],
      };
      updateSelectedLayer({ mask: newMask });
      setActiveTab('mask');
      if (showToast) showToast('success', 'Layer Mask Attached', selectedLayer.name);
    }
  };

  return (
    <div className="p-3 space-y-3 select-none text-zinc-200 font-sans">
      {/* Header & Controls */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-1.5 font-mono">
                Layers Stack
                <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                  {layers.length}
                </span>
              </h3>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                showAddMenu
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-750'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ LAYER</span>
            </button>

            {/* Add Layer Flyout Dropdown */}
            {showAddMenu && (
              <div className="absolute right-0 top-8 w-56 p-1.5 bg-zinc-900 border border-zinc-700 rounded shadow-2xl space-y-0.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-mono font-bold uppercase text-zinc-500 px-2 py-1">
                  Create Layer Type
                </div>

                <button
                  onClick={() => addLayer('raster', `Raster Layer ${layers.length + 1}`)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left text-xs text-zinc-200"
                >
                  <Paintbrush className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Raster Paint Layer</span>
                </button>

                <button
                  onClick={() => addLayer('adjustment', `Adjustment Layer ${layers.length + 1}`)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left text-xs text-zinc-200"
                >
                  <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Adjustment Layer</span>
                </button>

                <button
                  onClick={() => addLayer('text', `Text Layer ${layers.length + 1}`)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left text-xs text-zinc-200"
                >
                  <Type className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Text Typography</span>
                </button>

                <button
                  onClick={() => addLayer('shape', `Shape Layer ${layers.length + 1}`)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left text-xs text-zinc-200"
                >
                  <Square className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Vector Shape</span>
                </button>

                <label className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left text-xs text-zinc-200 cursor-pointer">
                  <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Import Image Layer</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileUpload(e, false)}
                    className="hidden"
                  />
                </label>

                <label className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left text-xs text-zinc-200 cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Smart Object</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileUpload(e, true)}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => addLayer('group', `Group ${layers.length + 1}`)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left text-xs text-zinc-200"
                >
                  <Folder className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Layer Group</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Global Selected Layer Quick Blend Mode & Opacity Bar */}
        {selectedLayer && (
          <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {/* Blend Mode Dropdown */}
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1 block">
                  Blend Mode
                </label>
                <select
                  value={selectedLayer.blendMode || 'normal'}
                  onChange={(e) => updateSelectedLayer({ blendMode: e.target.value as LayerBlendMode })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
                >
                  {BLEND_MODE_LABELS.map((bm) => (
                    <option key={bm.id} value={bm.id}>
                      {bm.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Opacity Slider */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  <span>Opacity</span>
                  <span className="text-zinc-200">{selectedLayer.opacity ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={selectedLayer.opacity ?? 100}
                  onChange={(e) => updateSelectedLayer({ opacity: Number(e.target.value) })}
                  className="w-full accent-zinc-400 cursor-pointer mt-1"
                />
              </div>
            </div>

            {/* Quick Action Pills: Lock, Mask, Order, Duplicate, Delete */}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-850 text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => toggleLock(selectedLayer.id, e)}
                  title={selectedLayer.locked ? 'Unlock Layer' : 'Lock Layer'}
                  className={`p-1 rounded border transition-colors ${
                    selectedLayer.locked
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                      : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {selectedLayer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={toggleLayerMask}
                  title="Attach / Configure Layer Mask"
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors text-[10px] font-mono ${
                    selectedLayer.mask?.enabled
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                      : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>MASK</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveLayer(selectedLayer.id, 'up')}
                  title="Move Layer Up"
                  className="p-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => moveLayer(selectedLayer.id, 'down')}
                  title="Move Layer Down"
                  className="p-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => mergeLayerDown(selectedLayer.id)}
                  title="Merge Layer Down"
                  className="p-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
                >
                  <Combine className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => duplicateLayer(selectedLayer, e)}
                  title="Duplicate Layer"
                  className="p-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => deleteLayer(selectedLayer.id, e)}
                  title="Delete Layer"
                  className="p-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs: Layer Stack / Layer Properties / Layer Mask */}
      <div className="flex border-b border-zinc-800 gap-1 pb-1 font-mono text-[10px]">
        {[
          { id: 'stack', label: `STACK (${layers.length})` },
          { id: 'properties', label: 'PROPERTIES' },
          { id: 'mask', label: 'MASK' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-1 rounded transition-colors ${
              activeTab === tab.id
                ? 'bg-zinc-800 text-zinc-100 font-bold'
                : 'text-zinc-500 hover:text-zinc-300'
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
            <div className="text-center py-6 px-4 bg-zinc-900/40 border border-dashed border-zinc-800 rounded space-y-1.5">
              <Layers className="w-5 h-5 text-zinc-600 mx-auto" />
              <div className="text-xs font-medium text-zinc-400">No custom layers yet</div>
              <p className="text-[10px] font-mono text-zinc-500 max-w-xs mx-auto">
                Click "+ LAYER" above to create non-destructive adjustment layers, typography, or paint layers.
              </p>
            </div>
          ) : (
            <div className="space-y-1 max-h-72 overflow-y-auto pr-0.5 scrollbar-thin">
              {layers.map((layer) => {
                const isSelected = layer.id === currentLayerId;
                return (
                  <div
                    key={layer.id}
                    onClick={() => handleSelect(layer.id)}
                    className={`flex items-center justify-between p-2 rounded border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800/90 border-zinc-600 text-zinc-100'
                        : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Visibility Eye */}
                      <button
                        onClick={(e) => toggleVisibility(layer.id, e)}
                        className="p-0.5 hover:text-white text-zinc-500 transition-colors"
                        title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                      >
                        {layer.visible ? (
                          <Eye className="w-3.5 h-3.5 text-zinc-200" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-zinc-600" />
                        )}
                      </button>

                      {/* Layer Type Badge */}
                      <div className="p-1 rounded bg-zinc-950 border border-zinc-800">
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
                        className="bg-transparent font-medium text-xs text-zinc-100 border-b border-transparent hover:border-zinc-700 focus:border-zinc-500 focus:outline-none px-1 py-0.5 truncate max-w-[130px]"
                      />
                    </div>

                    <div className="flex items-center gap-1 shrink-0 text-zinc-500 text-[10px] font-mono">
                      {layer.mask?.enabled && (
                        <span className="px-1 py-0.2 rounded bg-zinc-950 text-zinc-300 border border-zinc-700">
                          MASK
                        </span>
                      )}
                      <span className="px-1 py-0.2 rounded bg-zinc-950 border border-zinc-800">
                        {layer.blendMode.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Background Base Photo Layer (Fixed Base) */}
          <div className="flex items-center justify-between p-2 rounded border border-zinc-850 bg-zinc-950 text-zinc-400 font-mono text-xs">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-zinc-900 border border-zinc-800">
                <Sun className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div>
                <span className="font-semibold text-zinc-300">Base Photo Layer</span>
                <div className="text-[10px] text-zinc-500">Master Sensor Frame</div>
              </div>
            </div>
            <Lock className="w-3.5 h-3.5 text-zinc-600" />
          </div>
        </div>
      )}

      {/* 2. Layer Properties Inspector */}
      {activeTab === 'properties' && selectedLayer && (
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded space-y-3 font-mono text-xs">
          {/* A. Text Layer Inspector */}
          {selectedLayer.type === 'text' && selectedLayer.textData && (
            <div className="space-y-2.5">
              <div className="text-zinc-200 font-bold flex items-center gap-1.5">
                <Type className="w-4 h-4 text-zinc-400" />
                <span>Text Typography Properties</span>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Text Content</label>
                <textarea
                  value={selectedLayer.textData.text}
                  onChange={(e) =>
                    updateSelectedLayer({
                      textData: { ...selectedLayer.textData!, text: e.target.value },
                    })
                  }
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500 resize-none font-sans"
                  placeholder="Enter text..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Font Size</label>
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
                    className="w-full accent-zinc-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-zinc-300">{selectedLayer.textData.fontSize}px</span>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Font Weight</label>
                  <select
                    value={selectedLayer.textData.fontWeight || '700'}
                    onChange={(e) =>
                      updateSelectedLayer({
                        textData: { ...selectedLayer.textData!, fontWeight: e.target.value as any },
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200"
                  >
                    <option value="300">Light (300)</option>
                    <option value="400">Regular (400)</option>
                    <option value="600">SemiBold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="900">Black (900)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* B. Shape Layer Inspector */}
          {selectedLayer.type === 'shape' && selectedLayer.shapeData && (
            <div className="space-y-2.5">
              <div className="text-zinc-200 font-bold flex items-center gap-1.5">
                <Square className="w-4 h-4 text-zinc-400" />
                <span>Vector Shape Properties</span>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Shape Type</label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: 'rectangle', label: 'Rect' },
                    { id: 'rounded-rect', label: 'Rounded' },
                    { id: 'circle', label: 'Circle' },
                    { id: 'triangle', label: 'Triangle' },
                    { id: 'star', label: 'Star' },
                    { id: 'polygon', label: 'Poly' },
                    { id: 'arrow', label: 'Arrow' },
                    { id: 'line', label: 'Line' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() =>
                        updateSelectedLayer({
                          shapeData: { ...selectedLayer.shapeData!, shapeType: s.id as any },
                        })
                      }
                      className={`p-1 rounded text-[10px] font-mono border transition-colors ${
                        selectedLayer.shapeData?.shapeType === s.id
                          ? 'bg-zinc-800 text-zinc-100 border-zinc-600 font-bold'
                          : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* C. Adjustment Layer Inspector */}
          {selectedLayer.type === 'adjustment' && selectedLayer.adjustmentSettings && (
            <div className="space-y-2.5">
              <div className="text-zinc-200 font-bold flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-zinc-400" />
                <span>Adjustment Layer Parameters</span>
              </div>

              {renderLayerSlider(
                'Exposure',
                selectedLayer.adjustmentSettings.exposure ?? 0,
                -100,
                100,
                (v) =>
                  updateSelectedLayer({
                    adjustmentSettings: { ...selectedLayer.adjustmentSettings, exposure: v },
                  })
              )}

              {renderLayerSlider(
                'Contrast',
                selectedLayer.adjustmentSettings.contrast ?? 0,
                -100,
                100,
                (v) =>
                  updateSelectedLayer({
                    adjustmentSettings: { ...selectedLayer.adjustmentSettings, contrast: v },
                  })
              )}

              {renderLayerSlider(
                'Highlights',
                selectedLayer.adjustmentSettings.highlights ?? 0,
                -100,
                100,
                (v) =>
                  updateSelectedLayer({
                    adjustmentSettings: { ...selectedLayer.adjustmentSettings, highlights: v },
                  })
              )}

              {renderLayerSlider(
                'Shadows',
                selectedLayer.adjustmentSettings.shadows ?? 0,
                -100,
                100,
                (v) =>
                  updateSelectedLayer({
                    adjustmentSettings: { ...selectedLayer.adjustmentSettings, shadows: v },
                  })
              )}

              {renderLayerSlider(
                'Saturation',
                selectedLayer.adjustmentSettings.saturation ?? 0,
                -100,
                100,
                (v) =>
                  updateSelectedLayer({
                    adjustmentSettings: { ...selectedLayer.adjustmentSettings, saturation: v },
                  })
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Layer Mask Settings */}
      {activeTab === 'mask' && selectedLayer && (
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div className="text-zinc-200 font-bold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-zinc-400" />
              <span>Layer Mask</span>
            </div>

            <button
              onClick={toggleLayerMask}
              className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                selectedLayer.mask?.enabled
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                  : 'bg-zinc-950 text-zinc-500 border-zinc-800'
              }`}
            >
              {selectedLayer.mask?.enabled ? 'ACTIVE' : 'DISABLED'}
            </button>
          </div>

          {selectedLayer.mask && (
            <div className="space-y-2.5 pt-1">
              <button
                onClick={() =>
                  updateSelectedLayer({
                    mask: { ...selectedLayer.mask!, inverted: !selectedLayer.mask!.inverted },
                  })
                }
                className={`w-full py-1 rounded border text-xs transition-colors ${
                  selectedLayer.mask.inverted
                    ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
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
  suffix = ''
) {
  const isPos = value > 0;
  const displayVal = isPos && min < 0 ? `+${value}${suffix}` : `${value}${suffix}`;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono">
        <span className="text-zinc-400">{label}</span>
        <span className={`font-bold ${value !== 0 ? 'text-zinc-200' : 'text-zinc-500'}`}>
          {displayVal}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-zinc-400 cursor-pointer"
      />
    </div>
  );
}

function getLayerIcon(type: LayerType) {
  switch (type) {
    case 'raster':
      return <Paintbrush className="w-3.5 h-3.5 text-zinc-400" />;
    case 'adjustment':
      return <Sliders className="w-3.5 h-3.5 text-zinc-400" />;
    case 'text':
      return <Type className="w-3.5 h-3.5 text-zinc-400" />;
    case 'shape':
      return <Square className="w-3.5 h-3.5 text-zinc-400" />;
    case 'image':
      return <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />;
    case 'smart-object':
      return <Sparkles className="w-3.5 h-3.5 text-zinc-400" />;
    case 'group':
      return <Folder className="w-3.5 h-3.5 text-zinc-400" />;
    default:
      return <Layers className="w-3.5 h-3.5 text-zinc-400" />;
  }
}
