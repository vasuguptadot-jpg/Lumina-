import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Sliders,
  Sun,
  Palette,
  UserCheck,
  Wand2,
  Layers,
  Flame,
  Type,
  Grid,
  Camera,
  Download,
  Star,
  HelpCircle,
  ArrowRight,
  Zap,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  ToolCategoryId,
  ToolDefinition,
  UserSkillMode,
} from '../../types/navigation';
import {
  MASTER_TOOLS_LIST,
  TOOL_CATEGORIES_CONFIG,
} from '../../engine/toolRegistry';

interface FeatureExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillMode: UserSkillMode;
  onToggleSkillMode: () => void;
  favorites: string[];
  onToggleFavorite: (toolId: string) => void;
  onLaunchTool: (tool: ToolDefinition) => void;
  onOpenEducation: (tool: ToolDefinition) => void;
}

const ORDERED_CATEGORY_KEYS: ToolCategoryId[] = [
  'raw',
  'color',
  'light',
  'curves',
  'hsl',
  'masks',
  'retouch',
  'layers',
  'design',
  'typography',
  'collage',
  'ai',
  'export',
  'utility',
];

export const FeatureExplorerModal: React.FC<FeatureExplorerModalProps> = ({
  isOpen,
  onClose,
  skillMode,
  onToggleSkillMode,
  favorites,
  onToggleFavorite,
  onLaunchTool,
  onOpenEducation,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategoryId | 'all' | 'favorites'>('all');
  const [engineFilter, setEngineFilter] = useState<'all' | 'LOCAL' | 'HYBRID' | 'AI'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = useMemo(() => {
    let list = MASTER_TOOLS_LIST;

    if (skillMode === 'beginner') {
      list = list.filter((t) => !t.isProOnly);
    }

    if (engineFilter !== 'all') {
      list = list.filter((t) => (t.engineType || 'LOCAL') === engineFilter);
    }

    if (selectedCategory === 'favorites') {
      list = list.filter((t) => favorites.includes(t.id));
    } else if (selectedCategory !== 'all') {
      // Map aliases if any
      list = list.filter((t) => {
        if (t.categoryId === selectedCategory) return true;
        if (selectedCategory === 'light' && t.categoryId === 'basic') return true;
        if (selectedCategory === 'detail' && t.categoryId === 'detail') return true;
        return false;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.keywords.some((k) => k.toLowerCase().includes(q)) ||
          t.categoryId.toLowerCase().includes(q)
      );
    }

    return list;
  }, [selectedCategory, engineFilter, searchQuery, skillMode, favorites]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in select-none font-sans">
      <div
        className="w-full max-w-5xl h-[88vh] bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title & Search */}
        <div className="p-4 sm:p-5 border-b border-[#2A2A2A] bg-[#050505] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Tools
              </h2>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-[#141414] text-zinc-400 border border-[#2A2A2A]">
                {MASTER_TOOLS_LIST.length} TOTAL
              </span>
            </div>
            <p className="text-xs text-[#666666] mt-0.5">
              Comprehensive registry of photographic, neural, vector, and color grading modules.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141414] border border-[#2A2A2A] focus:border-zinc-500 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Mode Switcher */}
            <button
              onClick={onToggleSkillMode}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border border-[#2A2A2A] bg-[#141414] text-zinc-300 hover:text-white transition-colors shrink-0"
              title="Toggle Standard / Pro View"
            >
              {skillMode.toUpperCase()}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#141414] transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Explorer Layout: Category Rail + Tool Grid */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Categories Sidebar */}
          <div className="w-full md:w-56 bg-[#050505] border-b md:border-b-0 md:border-r border-[#2A2A2A] p-2.5 overflow-x-auto md:overflow-y-auto shrink-0 flex md:flex-col gap-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors shrink-0 md:w-full ${
                selectedCategory === 'all'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-[#141414]'
              }`}
            >
              <span>ALL TOOLS</span>
              <span className="text-[10px] font-mono opacity-80 hidden md:inline">
                {MASTER_TOOLS_LIST.length}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('favorites')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors shrink-0 md:w-full ${
                selectedCategory === 'favorites'
                  ? 'bg-[#1A1A1A] text-white border border-[#2A2A2A] font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-[#141414]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-current text-zinc-200" />
                <span>FAVORITES</span>
              </span>
              <span className="text-[10px] font-mono opacity-80 hidden md:inline">
                {favorites.length}
              </span>
            </button>

            <div className="h-[1px] bg-[#2A2A2A] my-1 hidden md:block" />

            {ORDERED_CATEGORY_KEYS.map((catKey) => {
              const cat = TOOL_CATEGORIES_CONFIG[catKey];
              if (!cat) return null;
              const isSelected = selectedCategory === catKey;

              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center justify-between transition-colors shrink-0 md:w-full ${
                    isSelected
                      ? 'bg-[#1A1A1A] text-white border border-[#2A2A2A] font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#141414]'
                  }`}
                >
                  <span className="truncate">{cat.badge || cat.title}</span>
                </button>
              );
            })}
          </div>

          {/* Tools Grid Area */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 bg-[#0D0D0D]">
            {/* Header info */}
            <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-[#2A2A2A]">
              <div>
                Showing <span className="font-semibold text-white">{filteredTools.length}</span> tools
              </div>
              <div className="text-[11px] text-[#666666]">
                Click ? for technical documentation
              </div>
            </div>

            {filteredTools.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 text-zinc-400">
                <Search className="w-8 h-8 text-zinc-600" />
                <h3 className="text-sm font-semibold text-white">No tools found</h3>
                <p className="text-xs text-[#666666]">
                  Try another keyword or switch category filters.
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1 rounded bg-[#141414] border border-[#2A2A2A] text-xs text-zinc-300 hover:text-white"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTools.map((tool) => {
                  const isFav = favorites.includes(tool.id);
                  const catConfig = TOOL_CATEGORIES_CONFIG[tool.categoryId];

                  return (
                    <div
                      key={tool.id}
                      className="p-3.5 rounded-xl bg-[#141414] border border-[#2A2A2A] hover:border-zinc-600 transition-colors flex flex-col justify-between group space-y-3"
                    >
                      {/* Top Header */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#0D0D0D] border border-[#2A2A2A] flex items-center justify-center text-zinc-300">
                              <Sliders className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-white group-hover:text-zinc-100 transition-colors">
                                {tool.name}
                              </h4>
                              <span className="text-[9px] font-mono text-[#666666] uppercase">
                                {catConfig ? catConfig.badge : tool.categoryId}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Favorite Button */}
                            <button
                              onClick={() => onToggleFavorite(tool.id)}
                              className={`p-1 rounded transition-colors ${
                                isFav
                                  ? 'text-white bg-[#0D0D0D] border border-[#2A2A2A]'
                                  : 'text-zinc-500 hover:text-zinc-200'
                              }`}
                              title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                            </button>

                            {/* Help Guide */}
                            <button
                              onClick={() => onOpenEducation(tool)}
                              className="p-1 rounded text-zinc-500 hover:text-white transition-colors"
                              title="Tool Guide"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-[#A0A0A0] line-clamp-2 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>

                      {/* Bottom Action */}
                      <div className="pt-2 border-t border-[#2A2A2A] flex items-center justify-between">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase">
                          {tool.engineType || 'LOCAL'}
                        </span>

                        <button
                          onClick={() => {
                            onLaunchTool(tool);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded bg-[#0D0D0D] hover:bg-white hover:text-black border border-[#2A2A2A] text-xs font-medium text-zinc-200 transition-colors flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
