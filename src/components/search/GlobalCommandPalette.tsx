import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Sliders,
  Sparkles,
  Palette,
  FolderOpen,
  Download,
  Settings,
  CornerDownLeft,
  Terminal,
  Activity,
  ShieldCheck,
  Layers,
  Cpu,
  Compass,
} from 'lucide-react';
import { SearchResultItem, ToolDefinition } from '../../types/navigation';
import { MASTER_TOOLS_LIST, TOOL_CATEGORIES_CONFIG } from '../../engine/toolRegistry';
import { FILTER_PRESETS } from '../../engine/presets';
import { Project } from '../../types/editor';

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchTool: (tool: ToolDefinition) => void;
  onApplyPreset?: (presetId: string) => void;
  onOpenProject?: (project: Project) => void;
  onOpenExport?: () => void;
  onOpenSocialExport?: () => void;
  onOpenCloud?: () => void;
  onOpenGroqSettings?: () => void;
  onOpenEducation?: (tool: ToolDefinition) => void;
  recentProjects?: Project[];
}

export const GlobalCommandPalette: React.FC<GlobalCommandPaletteProps> = ({
  isOpen,
  onClose,
  onLaunchTool,
  onApplyPreset,
  onOpenProject,
  onOpenExport,
  onOpenSocialExport,
  onOpenCloud,
  onOpenGroqSettings,
  recentProjects = [],
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Build searchable items
  const results = useMemo<SearchResultItem[]>(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Show curated quick actions
      return [
        {
          id: 'quick_develop',
          title: 'RAW Optics & Sensor Development',
          subtitle: 'AHD/AMAZE Demosaicing, White Balance, Highlight Recovery',
          type: 'tool',
          iconName: 'Sliders',
          badge: 'RAW',
          shortcut: 'D',
          action: () => {
            const t = MASTER_TOOLS_LIST.find((x) => x.id === 'tool_raw_optics') || MASTER_TOOLS_LIST[0];
            if (t) onLaunchTool(t);
          },
        },
        {
          id: 'quick_curves',
          title: 'Tone Curves & Histogram',
          subtitle: 'Parametric RGB & Master Tone Curve adjustments',
          type: 'tool',
          iconName: 'Sliders',
          badge: 'PRO',
          shortcut: 'C',
          action: () => {
            const t = MASTER_TOOLS_LIST.find((x) => x.id === 'tool_tone_curves');
            if (t) onLaunchTool(t);
          },
        },
        {
          id: 'quick_hsl',
          title: 'HSL Color Mixer & 3D LUT Studio',
          subtitle: '8-Channel Hue, Saturation, Luminance & .cube lookup',
          type: 'tool',
          iconName: 'Palette',
          badge: 'COLOR',
          shortcut: 'H',
          action: () => {
            const t = MASTER_TOOLS_LIST.find((x) => x.id === 'tool_hsl_mixer');
            if (t) onLaunchTool(t);
          },
        },
        {
          id: 'quick_masks',
          title: 'Selective Masks & Neural Brush',
          subtitle: 'Luminance, Color Range, Gradient & AI Subject Masking',
          type: 'tool',
          iconName: 'Layers',
          badge: 'MASK',
          shortcut: 'M',
          action: () => {
            const t = MASTER_TOOLS_LIST.find((x) => x.id === 'tool_selective_masks');
            if (t) onLaunchTool(t);
          },
        },
        {
          id: 'quick_export',
          title: 'Export Master Asset',
          subtitle: '16-bit TIFF, WebP, PNG, AVIF with Color Profile Embeds',
          type: 'setting',
          iconName: 'Download',
          badge: 'OUTPUT',
          shortcut: '⌘E',
          action: () => onOpenExport?.(),
        },
        {
          id: 'quick_cloud',
          title: 'Cloud Projects & Sync Hub',
          subtitle: 'Zero Data Loss Cross-Device Synchronization',
          type: 'setting',
          iconName: 'Cloud',
          badge: 'SYNC',
          action: () => onOpenCloud?.(),
        },
        {
          id: 'quick_diagnostics',
          title: 'Engineering Diagnostics & Hardware Telemetry',
          subtitle: 'Worker threads, memory allocation, WebGL2 performance',
          type: 'setting',
          iconName: 'Terminal',
          badge: 'DIAG',
          action: () => onOpenGroqSettings?.(),
        },
      ];
    }

    const matched: SearchResultItem[] = [];

    // 1. Natural Language Intent matches
    if (q.includes('blur') || q.includes('bokeh') || q.includes('depth')) {
      matched.push({
        id: 'intent_blur',
        title: 'AI Depth & Background Blur',
        subtitle: 'Create soft bokeh depth-of-field behind subject',
        type: 'ai_intent',
        badge: 'ACTION',
        action: () => {
          const t = MASTER_TOOLS_LIST.find((x) => x.id === 'tool_ai_background_studio');
          if (t) onLaunchTool(t);
        },
      });
    }

    if (q.includes('cinematic') || q.includes('movie') || q.includes('teal')) {
      matched.push({
        id: 'intent_cinematic',
        title: 'Apply Cinematic Color Grade',
        subtitle: 'Separate skin tones with filmic contrast curve',
        type: 'ai_intent',
        badge: 'ACTION',
        action: () => {
          onApplyPreset?.('cinematic-teal-orange');
        },
      });
    }

    if (q.includes('remove') || q.includes('erase') || q.includes('clean') || q.includes('heal')) {
      matched.push({
        id: 'intent_remove',
        title: 'Heal & Inpainting Eraser',
        subtitle: 'Brush over distractions and blemishes',
        type: 'ai_intent',
        badge: 'ACTION',
        action: () => {
          const t = MASTER_TOOLS_LIST.find((x) => x.id === 'tool_ai_object_removal');
          if (t) onLaunchTool(t);
        },
      });
    }

    if (q.includes('export') || q.includes('save') || q.includes('tiff') || q.includes('jpeg') || q.includes('png')) {
      matched.push({
        id: 'intent_export',
        title: 'Export Master Asset Dialog',
        subtitle: 'Configure color space, bit depth, and compression format',
        type: 'setting',
        badge: 'EXPORT',
        action: () => onOpenExport?.(),
      });
    }

    // 2. Search Master Tools
    for (const tool of MASTER_TOOLS_LIST) {
      if (
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.toLowerCase().includes(q))
      ) {
        const catConfig = TOOL_CATEGORIES_CONFIG[tool.categoryId];
        matched.push({
          id: tool.id,
          title: tool.name,
          subtitle: tool.description,
          type: 'tool',
          category: catConfig?.title,
          shortcut: tool.shortcut,
          engineType: tool.engineType || 'LOCAL',
          badge: tool.engineType === 'LOCAL' ? 'LOCAL GPU' : 'HYBRID',
          action: () => onLaunchTool(tool),
        });
      }
    }

    // 3. Search Presets
    for (const preset of FILTER_PRESETS.slice(0, 10)) {
      if (
        preset.name.toLowerCase().includes(q) ||
        preset.category.toLowerCase().includes(q) ||
        preset.description.toLowerCase().includes(q)
      ) {
        matched.push({
          id: `preset_${preset.id}`,
          title: `Preset: ${preset.name}`,
          subtitle: `${preset.category} • ${preset.description}`,
          type: 'preset',
          category: preset.category,
          badge: 'PRESET',
          action: () => onApplyPreset?.(preset.id),
        });
      }
    }

    // 4. Search Projects
    for (const proj of recentProjects) {
      if (proj.name.toLowerCase().includes(q)) {
        matched.push({
          id: `proj_${proj.id}`,
          title: `Project: ${proj.name}`,
          subtitle: `Saved project in IndexedDB`,
          type: 'project',
          badge: 'PROJECT',
          action: () => onOpenProject?.(proj),
        });
      }
    }

    return matched;
  }, [query, onLaunchTool, onApplyPreset, onOpenExport, onOpenSocialExport, onOpenGroqSettings, onOpenCloud, onOpenProject, recentProjects]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (results.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % (results.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 p-4 bg-[#050505]/90 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#050505] border border-[rgba(230,227,222,0.15)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input bar */}
        <div className="p-3.5 border-b border-[rgba(230,227,222,0.08)] flex items-center gap-3 bg-[#050505]">
          <Search className="w-4 h-4 text-[#7A0F18] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands, tools, RAW controls, presets (e.g. 'Curves', 'Demosaic')..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-xs sm:text-sm text-[#E6E3DE] placeholder-[rgba(230,227,222,0.45)] outline-none font-sans"
          />
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#050505] text-[rgba(230,227,222,0.45)] border border-[rgba(230,227,222,0.12)]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-2 overflow-y-auto space-y-1 flex-1">
          <div className="px-2 py-1 text-[10px] font-mono font-medium text-[rgba(230,227,222,0.45)] uppercase tracking-wider flex items-center justify-between">
            <span>{query ? 'Matched Actions' : 'Command Matrix'}</span>
            <span className="text-[rgba(230,227,222,0.45)]">↑↓ to navigate • ↵ to execute</span>
          </div>

          {results.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Compass className="w-6 h-6 text-[rgba(230,227,222,0.45)] mx-auto" />
              <p className="text-xs font-mono text-[rgba(230,227,222,0.45)]">
                No commands matching &ldquo;{query}&rdquo;
              </p>
            </div>
          ) : (
            results.map((item, index) => {
              const isSelected = selectedIndex === index;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-2.5 rounded flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#7A0F18] text-[#E6E3DE] border border-[#7A0F18]'
                      : 'hover:bg-[rgba(230,227,222,0.04)] text-[rgba(230,227,222,0.70)] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded bg-[#050505] border border-[rgba(230,227,222,0.12)] flex items-center justify-center text-[#E6E3DE] shrink-0">
                      {item.type === 'ai_intent' && <Sparkles className="w-3.5 h-3.5 text-[#7A0F18]" />}
                      {item.type === 'preset' && <Palette className="w-3.5 h-3.5 text-[#E6E3DE]" />}
                      {item.type === 'tool' && <Sliders className="w-3.5 h-3.5 text-[#E6E3DE]" />}
                      {item.type === 'project' && <FolderOpen className="w-3.5 h-3.5 text-[#E6E3DE]" />}
                      {item.type === 'setting' && <Settings className="w-3.5 h-3.5 text-[#E6E3DE]" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#E6E3DE] truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium border uppercase bg-[#050505] text-[rgba(230,227,222,0.70)] border-[rgba(230,227,222,0.15)]">
                            {item.badge}
                          </span>
                        )}
                        {item.category && (
                          <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">
                            • {item.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[rgba(230,227,222,0.70)] truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#050505] text-[rgba(230,227,222,0.70)] border border-[rgba(230,227,222,0.12)]">
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-[#E6E3DE]" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-[rgba(230,227,222,0.08)] bg-[#050505] flex items-center justify-between text-[10px] font-mono text-[rgba(230,227,222,0.45)]">
          <div className="flex items-center gap-3">
            <span><strong>⌘K</strong> Command Bar</span>
            <span><strong>ESC</strong> Dismiss</span>
          </div>
          <span>Lumina Workstation UI</span>
        </div>
      </div>
    </div>
  );
};
