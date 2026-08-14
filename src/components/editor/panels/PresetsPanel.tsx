import React, { useState } from 'react';
import { Sparkles, Plus, Check, Sliders, Bookmark } from 'lucide-react';
import { FilterPreset } from '../../../types/editor';
import { FILTER_PRESETS } from '../../../engine/presets';

interface PresetsPanelProps {
  activePresetId: string | null;
  presetStrength: number;
  customPresets: FilterPreset[];
  onSelectPreset: (presetId: string | null) => void;
  onChangeStrength: (strength: number) => void;
  onSaveAsCustomPreset: (name: string) => void;
}

export const PresetsPanel: React.FC<PresetsPanelProps> = ({
  activePresetId,
  presetStrength,
  customPresets,
  onSelectPreset,
  onChangeStrength,
  onSaveAsCustomPreset,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const allPresets = [...customPresets, ...FILTER_PRESETS];
  const categories = ['All', 'Film Emulation', 'Cinematic', 'B&W', 'Landscape', 'Portrait', 'Vintage', 'Creative', 'Custom'];

  const filteredPresets = selectedCategory === 'All'
    ? allPresets
    : selectedCategory === 'Custom'
    ? customPresets
    : allPresets.filter((p) => p.category === selectedCategory);

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    onSaveAsCustomPreset(newPresetName.trim());
    setNewPresetName('');
    setIsCreatingPreset(false);
  };

  return (
    <div className="p-4 space-y-4 select-none">
      {/* Category Pills */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Active Preset Strength Slider */}
      {activePresetId && (
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-1.5 shadow-md">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Preset Intensity
            </span>
            <span className="font-mono text-indigo-300 font-bold">{presetStrength}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="150"
            value={presetStrength}
            onChange={(e) => onChangeStrength(Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>
      )}

      {/* Preset Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Reset / None Option */}
        <button
          onClick={() => onSelectPreset(null)}
          className={`relative p-3 rounded-xl text-left border transition-all flex flex-col justify-between h-24 ${
            activePresetId === null
              ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500'
              : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <div className="w-full h-8 rounded-lg bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Natural</span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">None / Neutral</div>
            <div className="text-[10px] text-slate-500">Unfiltered look</div>
          </div>
        </button>

        {/* Preset Cards */}
        {filteredPresets.map((preset) => {
          const isSelected = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              className={`relative p-3 rounded-xl text-left border transition-all flex flex-col justify-between h-24 overflow-hidden group ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/60 shadow-lg shadow-indigo-500/10'
                  : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {/* Gradient Preview Header */}
              <div
                className={`w-full h-8 rounded-lg bg-gradient-to-r ${
                  preset.thumbnailGradient || 'from-slate-700 to-slate-800'
                } flex items-center justify-between px-2 shadow-inner`}
              >
                <span className="text-[9px] uppercase font-black tracking-wider text-slate-950 drop-shadow-sm">
                  {preset.category === 'Film Emulation' ? 'FILM' : preset.category.substring(0, 5)}
                </span>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                  {preset.name}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-1">
                  {preset.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Save Custom Preset Button */}
      <div className="pt-2">
        {isCreatingPreset ? (
          <form onSubmit={handleSaveCustom} className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-2">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              Save Current Look as Preset
            </div>
            <input
              type="text"
              placeholder="e.g. My Golden Hour Film"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-1.5 rounded-lg outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Save Preset
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingPreset(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreatingPreset(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-slate-700/80 hover:border-indigo-500/80 text-xs font-semibold text-slate-400 hover:text-indigo-300 hover:bg-slate-900/50 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Current Look as Preset</span>
          </button>
        )}
      </div>
    </div>
  );
};
