import React, { useState } from 'react';
import {
  Palette,
  Sliders,
  TrendingUp,
  SunMedium,
  Crop,
  Sparkles,
  Layers,
  Stamp,
  History,
  Camera,
  Focus,
  Aperture,
  Bandage,
  Smile,
  PersonStanding,
  CloudSun,
  Maximize2,
  Wand2,
  Film,
  Type,
  Shapes,
  LayoutGrid,
  Paintbrush,
  Brain,
  Compass,
  Columns,
  Info,
  Printer,
  Smartphone,
  Users,
  Package,
  Zap,
  Code2,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { WorkflowStageId } from '../../types/workflow';
import { UserSkillMode } from '../../types/navigation';

interface ToolTabsProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  activeStage?: WorkflowStageId;
  skillMode?: UserSkillMode;
  favorites?: string[];
  onOpenEducation?: (tabId: string) => void;
}

export const WORKFLOW_GROUPS = [
  {
    id: 'develop',
    label: 'RAW & DEVELOP',
    tools: [
      { id: 'raw-optics', label: 'RAW & Optics', icon: Camera, badge: 'RAW', proOnly: true },
      { id: 'adjust', label: 'Basic Adjustments', icon: Sliders },
      { id: 'curves', label: 'Curves', icon: TrendingUp, proOnly: true },
      { id: 'hsl', label: 'HSL & Color', icon: SunMedium, proOnly: true },
      { id: 'presets', label: 'Presets', icon: Palette },
      { id: 'film-simulation', label: 'Film Simulation', icon: Film, badge: '35MM' },
      { id: 'color-management', label: 'Color & Proofing', icon: Printer, badge: 'ICC', proOnly: true },
    ],
  },
  {
    id: 'select',
    label: 'SELECT & GEOMETRY',
    tools: [
      { id: 'crop', label: 'Crop & Rotate', icon: Crop },
      { id: 'geometry', label: 'Perspective & Warp', icon: Maximize2, proOnly: true },
      { id: 'composition', label: 'Composition AI', icon: Compass, badge: 'GUIDE' },
      { id: 'ai-understanding', label: 'AI Vision & Fix', icon: Brain, badge: 'VISION' },
    ],
  },
  {
    id: 'retouch',
    label: 'MASK & RETOUCH',
    tools: [
      { id: 'masks', label: 'Masks Studio', icon: Layers, proOnly: true },
      { id: 'retouch', label: 'Retouch & Heal', icon: Bandage, badge: 'PRO' },
      { id: 'portrait', label: 'Portrait Studio', icon: Smile },
      { id: 'body', label: 'Body Studio', icon: PersonStanding },
      { id: 'detail', label: 'Detail & NR', icon: Focus },
      { id: 'blur-depth', label: 'Blur & Depth', icon: Aperture },
    ],
  },
  {
    id: 'ai',
    label: 'AI & NEURAL',
    tools: [
      { id: 'nl-edit', label: 'Natural Language Edit', icon: Sparkles, badge: 'PROMPT' },
      { id: 'ai-native', label: 'AI Architecture', icon: Brain, badge: 'NEURAL' },
      { id: 'ai-tools', label: 'AI & Enhance', icon: Sparkles },
      { id: 'sky', label: 'Sky Studio', icon: CloudSun },
      { id: 'lighting', label: 'Lighting Studio', icon: SunMedium },
      { id: 'effects', label: 'Effects Studio', icon: Wand2 },
    ],
  },
  {
    id: 'design',
    label: 'LAYERS & COMPOSE',
    tools: [
      { id: 'layers', label: 'Layers Studio', icon: Layers, proOnly: true },
      { id: 'drawing', label: 'Draw & Paint', icon: Paintbrush },
      { id: 'typography', label: 'Typography', icon: Type },
      { id: 'graphics-design', label: 'Graphics & Design', icon: Shapes },
      { id: 'collage', label: 'Collage Studio', icon: LayoutGrid },
      { id: 'watermark', label: 'Watermark', icon: Stamp },
      { id: 'screenshot', label: 'Screenshot Studio', icon: Smartphone },
    ],
  },
  {
    id: 'diagnostics',
    label: 'INSPECTOR & SYSTEM',
    tools: [
      { id: 'metadata', label: 'EXIF & Metadata', icon: Info, badge: 'EXIF' },
      { id: 'history', label: 'History & Revisions', icon: History },
      { id: 'comparison', label: 'Before / After', icon: Columns },
      { id: 'collaboration', label: 'Collaboration', icon: Users },
      { id: 'performance', label: 'GPU & Telemetry', icon: Zap, proOnly: true },
      { id: 'security', label: 'Security & Privacy', icon: ShieldCheck, proOnly: true },
      { id: 'developer', label: 'Developer & API', icon: Code2, proOnly: true },
      { id: 'automation', label: 'Automation Engine', icon: Zap, proOnly: true },
      { id: 'plugins', label: 'Plugins', icon: Package, proOnly: true },
    ],
  },
];

export const ToolTabs: React.FC<ToolTabsProps> = ({
  activeTab,
  onSelectTab,
  skillMode = 'pro',
}) => {
  // Find which group the current activeTab belongs to
  const initialGroup = WORKFLOW_GROUPS.find((g) => g.tools.some((t) => t.id === activeTab))?.id || 'develop';
  const [selectedGroup, setSelectedGroup] = useState<string>(initialGroup);

  const currentGroup = WORKFLOW_GROUPS.find((g) => g.id === selectedGroup) || WORKFLOW_GROUPS[0];
  const visibleTools = currentGroup.tools.filter((t) => {
    if (skillMode === 'beginner' && (t as any).proOnly) return false;
    return true;
  });

  return (
    <div className="bg-zinc-950 border-b border-zinc-800 select-none">
      {/* Workflow Stage Tabs (Top Row) */}
      <div className="flex items-center gap-1 px-2 pt-1 border-b border-zinc-850 overflow-x-auto scrollbar-none text-[11px] font-mono">
        {WORKFLOW_GROUPS.map((group) => {
          const isGroupActive = selectedGroup === group.id;
          const containsActiveTab = group.tools.some((t) => t.id === activeTab);

          return (
            <button
              key={group.id}
              onClick={() => {
                setSelectedGroup(group.id);
                // Automatically switch to first tool if none in group is active
                if (!containsActiveTab && group.tools.length > 0) {
                  onSelectTab(group.tools[0].id);
                }
              }}
              className={`px-2.5 py-1 rounded-t border-t border-x transition-colors whitespace-nowrap ${
                isGroupActive
                  ? 'bg-zinc-900 text-zinc-100 font-semibold border-zinc-750'
                  : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300 border-transparent'
              }`}
            >
              {group.label}
            </button>
          );
        })}
      </div>

      {/* Specific Tools in Current Stage (Bottom Row) */}
      <div className="flex items-center gap-0.5 px-2 py-1 overflow-x-auto scrollbar-none bg-zinc-900/60">
        {visibleTools.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-zinc-300" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
