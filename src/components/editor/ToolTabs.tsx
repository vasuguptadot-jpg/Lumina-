import React from 'react';
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
} from 'lucide-react';

interface ToolTabsProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

export const ToolTabs: React.FC<ToolTabsProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'comparison', label: 'Before / After', icon: Columns, badge: 'COMPARE' },
    { id: 'color-management', label: 'Color & Proofing', icon: Printer, badge: 'ICC' },
    { id: 'metadata', label: 'Metadata & EXIF', icon: Info, badge: 'EXIF' },
    { id: 'ai-understanding', label: 'AI Vision & Fix', icon: Brain, badge: 'VISION' },
    { id: 'composition', label: 'Composition AI', icon: Compass, badge: 'GUIDE' },
    { id: 'raw-optics', label: 'RAW & Optics', icon: Camera, badge: 'RAW' },
    { id: 'presets', label: 'Presets', icon: Palette },
    { id: 'film-simulation', label: 'Film Simulation', icon: Film, badge: '35MM' },
    { id: 'drawing', label: 'Draw & Paint', icon: Paintbrush, badge: 'STUDIO' },
    { id: 'typography', label: 'Text & Typography', icon: Type, badge: 'TYPE' },
    { id: 'graphics-design', label: 'Graphics & Design', icon: Shapes, badge: 'CANVA' },
    { id: 'collage', label: 'Collage Studio', icon: LayoutGrid, badge: 'GRID' },
    { id: 'effects', label: 'Effects Studio', icon: Wand2, badge: 'FX' },
    { id: 'adjust', label: 'Adjust', icon: Sliders },
    { id: 'lighting', label: 'Lighting Studio', icon: SunMedium, badge: 'PRO' },
    { id: 'portrait', label: 'Portrait Studio', icon: Smile, badge: 'FACE' },
    { id: 'body', label: 'Body Studio', icon: PersonStanding, badge: 'BODY' },
    { id: 'sky', label: 'Sky Studio', icon: CloudSun, badge: 'SKY' },
    { id: 'geometry', label: 'Perspective & Warp', icon: Maximize2, badge: 'PRO' },
    { id: 'retouch', label: 'Retouch & Heal', icon: Bandage, badge: 'PRO' },
    { id: 'detail', label: 'Detail & NR', icon: Focus },
    { id: 'blur-depth', label: 'Blur & Depth', icon: Aperture, badge: 'AI' },
    { id: 'curves', label: 'Curves', icon: TrendingUp },
    { id: 'hsl', label: 'Color & LUTs', icon: SunMedium },
    { id: 'crop', label: 'Crop & Rotate', icon: Crop },
    { id: 'ai-tools', label: 'AI & Enhance', icon: Sparkles, badge: 'AI' },
    { id: 'masks', label: 'Masks', icon: Layers },
    { id: 'layers', label: 'Layers Studio', icon: Layers, badge: 'PS' },
    { id: 'watermark', label: 'Watermark', icon: Stamp },
    { id: 'history', label: 'History & Versions', icon: History, badge: 'MASTER' },
  ];

  return (
    <div className="flex border-b border-slate-800/80 bg-slate-950/90 overflow-x-auto scrollbar-none select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              isActive
                ? 'text-indigo-400 bg-slate-900/90'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950">
                {tab.badge}
              </span>
            )}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
            )}
          </button>
        );
      })}
    </div>
  );
};
