import React, { useState, useMemo } from 'react';
import {
  Palette,
  Search,
  Star,
  SlidersHorizontal,
  ArrowRight,
} from 'lucide-react';
import { FilterCategory, FilterPreset } from '../../types/editor';
import { FILTER_PRESETS, FILTER_CATEGORIES } from '../../engine/presets';

interface PresetsShowcaseViewProps {
  onApplyPreset: (presetId: string, intensity?: number) => void;
  onOpenEditor: () => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const PresetsShowcaseView: React.FC<PresetsShowcaseViewProps> = ({
  onApplyPreset,
  onOpenEditor,
  showToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory | 'All' | 'Favorites'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [presetIntensity, setPresetIntensity] = useState(100);
  const [favoritePresetIds, setFavoritePresetIds] = useState<string[]>([
    'cinematic-teal-orange',
    'film-kodak-portra-400',
    'portrait-golden-hour',
  ]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoritePresetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredPresets = useMemo(() => {
    let list = FILTER_PRESETS;

    if (selectedCategory === 'Favorites') {
      list = list.filter((p) => favoritePresetIds.includes(p.id));
    } else if (selectedCategory !== 'All') {
      list = list.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [selectedCategory, searchQuery, favoritePresetIds]);

  const handleApply = (preset: FilterPreset) => {
    setActivePresetId(preset.id);
    onApplyPreset(preset.id, presetIntensity);
    showToast?.('success', 'Preset Applied', `Applied "${preset.name}" at ${presetIntensity}% strength.`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] p-4 sm:p-8 space-y-6 select-none font-sans text-zinc-100">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-[#0D0D0D] border border-[#2A2A2A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#141414] text-zinc-300 border border-[#2A2A2A] uppercase tracking-wider flex items-center gap-1">
              <Palette className="w-3 h-3 text-zinc-300" />
              Master Preset Laboratory
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#141414] text-zinc-400 border border-[#2A2A2A] uppercase tracking-wider">
              {FILTER_PRESETS.length} Profiles
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Cinematic Looks & Film Simulations
          </h1>
          <p className="text-xs text-[#A0A0A0] max-w-xl leading-relaxed">
            Authentic analog film, black & white grain, and cinema color grades with floating-point curve calculations.
          </p>
        </div>

        {/* Global Preset Strength Slider */}
        <div className="p-3.5 rounded-xl bg-[#141414] border border-[#2A2A2A] space-y-2 w-full md:w-60">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
              Mix Intensity
            </span>
            <span className="font-mono font-bold text-white">{presetIntensity}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={200}
            value={presetIntensity}
            onChange={(e) => setPresetIntensity(Number(e.target.value))}
            className="w-full h-1.5 bg-[#0D0D0D] rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
              selectedCategory === 'All'
                ? 'bg-white text-black font-semibold'
                : 'bg-[#0D0D0D] text-zinc-400 hover:text-white border border-[#2A2A2A]'
            }`}
          >
            All Presets ({FILTER_PRESETS.length})
          </button>

          <button
            onClick={() => setSelectedCategory('Favorites')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors flex items-center gap-1 ${
              selectedCategory === 'Favorites'
                ? 'bg-[#1A1A1A] text-white border border-[#2A2A2A] font-semibold'
                : 'bg-[#0D0D0D] text-zinc-400 hover:text-white border border-[#2A2A2A]'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current text-zinc-200" />
            <span>Favorites ({favoritePresetIds.length})</span>
          </button>

          {FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#1A1A1A] text-white border border-[#2A2A2A] font-semibold'
                  : 'bg-[#0D0D0D] text-zinc-400 hover:text-zinc-200 border border-[#2A2A2A]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search film looks, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-[#2A2A2A] focus:border-zinc-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPresets.map((preset) => {
          const isFav = favoritePresetIds.includes(preset.id);
          const isCurrent = activePresetId === preset.id;

          return (
            <div
              key={preset.id}
              onClick={() => handleApply(preset)}
              className={`p-4 rounded-2xl border transition-colors cursor-pointer flex flex-col justify-between space-y-3 group ${
                isCurrent
                  ? 'bg-[#141414] border-white'
                  : 'bg-[#0D0D0D] border-[#2A2A2A] hover:border-zinc-500'
              }`}
            >
              {/* Thumbnail Visual */}
              <div className="w-full h-28 rounded-xl bg-[#141414] border border-[#2A2A2A] relative overflow-hidden flex flex-col justify-between p-2.5">
                <div className="flex items-center justify-between z-10">
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-black/80 text-zinc-300 border border-zinc-800">
                    {preset.category}
                  </span>
                  <button
                    onClick={(e) => toggleFavorite(preset.id, e)}
                    className={`p-1 rounded transition-colors ${
                      isFav ? 'bg-black text-white border border-zinc-700' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="z-10 flex items-center justify-between text-[9px] text-zinc-400 font-mono">
                  <span>32-BIT RAW</span>
                  <span>{presetIntensity}% MIX</span>
                </div>
              </div>

              {/* Text Info */}
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-zinc-100 transition-colors">
                  {preset.name}
                </h3>
                <p className="text-[11px] text-[#A0A0A0] line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-[#2A2A2A] flex items-center justify-between gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApply(preset);
                    onOpenEditor();
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-[#141414] hover:bg-white hover:text-black text-zinc-200 border border-[#2A2A2A] text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Apply & Edit</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
