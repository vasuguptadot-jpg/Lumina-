import React, { useState } from 'react';
import {
  Type,
  Shapes,
  PenTool,
  Grid,
  Sparkles,
  ArrowRight,
  Download,
  LayoutTemplate,
  Layers,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';
import { Project } from '../../types/editor';

interface DesignStudioViewProps {
  project: Project;
  onOpenEditorWithTool: (toolId: string) => void;
  onOpenCollage: () => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const DesignStudioView: React.FC<DesignStudioViewProps> = ({
  project,
  onOpenEditorWithTool,
  onOpenCollage,
  showToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'social' | 'marketing' | 'creative'>('all');

  const DESIGN_TEMPLATES = [
    {
      id: 'tpl_yt_thumb',
      title: 'YouTube High-CTR Thumbnail',
      dimensions: '1920 × 1080 (16:9)',
      category: 'social',
      tag: '16:9 Banner',
      toolId: 'tool_typography_text',
    },
    {
      id: 'tpl_insta_story',
      title: 'Instagram Story / TikTok Reel',
      dimensions: '1080 × 1920 (9:16)',
      category: 'social',
      tag: '9:16 Vertical',
      toolId: 'tool_typography_text',
    },
    {
      id: 'tpl_insta_post',
      title: 'Instagram High-Impact Post',
      dimensions: '1080 × 1350 (4:5)',
      category: 'social',
      tag: '4:5 Feed',
      toolId: 'tool_typography_text',
    },
    {
      id: 'tpl_movie_poster',
      title: 'Cinematic Film Poster',
      dimensions: '2000 × 3000 (2:3)',
      category: 'creative',
      tag: '2:3 Poster',
      toolId: 'tool_typography_text',
    },
    {
      id: 'tpl_sale_banner',
      title: 'Commercial Promo Banner',
      dimensions: '1200 × 628 (1.91:1)',
      category: 'marketing',
      tag: 'Ad Banner',
      toolId: 'tool_shapes_stickers',
    },
    {
      id: 'tpl_album_art',
      title: 'Album Cover & Vinyl Art',
      dimensions: '3000 × 3000 (1:1)',
      category: 'creative',
      tag: '1:1 Square',
      toolId: 'tool_typography_text',
    },
  ];

  const filteredTemplates = DESIGN_TEMPLATES.filter(
    (t) => selectedCategory === 'all' || t.category === selectedCategory
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#000000] p-4 sm:p-8 space-y-6 select-none text-white font-sans">
      {/* Top Header */}
      <div className="p-6 rounded-2xl bg-[#080808] border border-[#222222] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141414] text-[#CCCCCC] border border-[#2C2C2C] uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-3 h-3 text-[#CCCCCC]" />
              <span>DESIGN STUDIO WORKSPACE</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Graphic Design, Typography & Templates
          </h1>
          <p className="text-xs text-[#999999] max-w-xl">
            Vector typography, geometric shapes, branding badges, social banners, and layout composition.
          </p>
        </div>

        {/* Quick Direct Modules */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenEditorWithTool('tool_typography_text')}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-[#CCCCCC] text-black text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm active:scale-98"
          >
            <Type className="w-3.5 h-3.5" />
            <span>Typography</span>
          </button>

          <button
            onClick={() => onOpenEditorWithTool('tool_shapes_stickers')}
            className="px-3.5 py-2 rounded-lg bg-[#141414] hover:bg-[#181818] border border-[#222222] text-[#CCCCCC] hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Shapes className="w-3.5 h-3.5" />
            <span>Shapes & Badges</span>
          </button>

          <button
            onClick={() => onOpenEditorWithTool('tool_vector_drawing')}
            className="px-3.5 py-2 rounded-lg bg-[#141414] hover:bg-[#181818] border border-[#222222] text-[#CCCCCC] hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Vector Brush</span>
          </button>

          <button
            onClick={onOpenCollage}
            className="px-3.5 py-2 rounded-lg bg-[#141414] hover:bg-[#181818] border border-[#222222] text-[#CCCCCC] hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Collage Studio</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `All Formats (${DESIGN_TEMPLATES.length})` },
          { id: 'social', label: 'Social Media (YouTube, Insta, TikTok)' },
          { id: 'creative', label: 'Posters & Album Covers' },
          { id: 'marketing', label: 'Banners & Ads' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border shrink-0 ${
              selectedCategory === tab.id
                ? 'bg-[#181818] text-white border-[#444444]'
                : 'bg-[#080808] text-[#999999] hover:text-white border-[#222222]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => {
              onOpenEditorWithTool(template.toolId);
              showToast?.('info', 'Template Loaded', `Opening ${template.title} layout.`);
            }}
            className="p-4 rounded-xl bg-[#080808] border border-[#222222] hover:border-[#444444] transition-colors cursor-pointer group flex flex-col justify-between space-y-3.5"
          >
            {/* Visual Canvas Card */}
            <div className="w-full h-36 rounded-lg bg-[#141414] border border-[#181818] relative overflow-hidden flex flex-col justify-between p-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-black/80 text-white border border-[#333333]">
                  {template.tag}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-[#666666]" />
              </div>

              <div className="text-[#CCCCCC] text-xs font-medium font-mono">
                {template.dimensions}
              </div>
            </div>

            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#CCCCCC] transition-colors">
                {template.title}
              </h3>
              <p className="text-[11px] text-[#999999] mt-0.5">
                Calibrated composition with non-destructive vector layers.
              </p>
            </div>

            <div className="pt-2 border-t border-[#181818] flex items-center justify-between text-xs text-[#666666] group-hover:text-white transition-colors">
              <span>Open in Studio</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
