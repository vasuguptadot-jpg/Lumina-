import React from 'react';
import {
  BrainCircuit,
  Sparkles,
  Image as ImageIcon,
  Eraser,
  Sun,
  UserCheck,
  Zap,
  ArrowRight,
  ShieldCheck,
  Key,
} from 'lucide-react';
import { Project } from '../../types/editor';
import { getGroqConfig } from '../../services/groqService';

interface AIStudioMasterViewProps {
  project: Project;
  onOpenEditorWithTool: (toolId: string) => void;
  onOpenAICreativeDirector: () => void;
  onOpenGroqSettings: () => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const AIStudioMasterView: React.FC<AIStudioMasterViewProps> = ({
  project,
  onOpenEditorWithTool,
  onOpenAICreativeDirector,
  onOpenGroqSettings,
  showToast,
}) => {
  const config = getGroqConfig();

  const AI_STUDIO_MODULES = [
    {
      id: 'mod_creative_director',
      title: 'AI Creative Director',
      subtitle: 'Natural language reasoning engine for multi-step creative editing plans',
      icon: BrainCircuit,
      badge: 'REASONING',
      action: onOpenAICreativeDirector,
    },
    {
      id: 'mod_gen_fill',
      title: 'Generative Fill & Outpaint',
      subtitle: 'Contextual diffusion synthesis for seamless content synthesis and canvas expansion',
      icon: Sparkles,
      badge: 'GENERATIVE',
      action: () => onOpenEditorWithTool('tool_ai_generative_fill'),
    },
    {
      id: 'mod_obj_removal',
      title: 'Magic Eraser & Inpainting',
      subtitle: 'Seamless Poisson reconstruction for tourists, powerlines & dust spots',
      icon: Eraser,
      badge: 'INPAINT',
      action: () => onOpenEditorWithTool('tool_ai_object_removal'),
    },
    {
      id: 'mod_bg_studio',
      title: 'AI Background Studio & Depth',
      subtitle: 'Hair-strand alpha cutouts, synthetic bokeh & studio background swaps',
      icon: ImageIcon,
      badge: 'MATTING',
      action: () => onOpenEditorWithTool('tool_ai_background_studio'),
    },
    {
      id: 'mod_portrait_ai',
      title: 'Biometric Portrait AI',
      subtitle: '68-landmark face lock, skin frequency separation & eye brightening',
      icon: UserCheck,
      badge: 'PORTRAIT',
      action: () => onOpenEditorWithTool('tool_skin_smoothing'),
    },
    {
      id: 'mod_3d_relight',
      title: 'AI 3D Light Studio',
      subtitle: 'Synthetic 3D normal-mapped point lights, rim lights & softboxes',
      icon: Sun,
      badge: 'PHOTOMETRIC',
      action: () => onOpenEditorWithTool('tool_ai_relight'),
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#000000] p-4 sm:p-8 space-y-6 select-none text-white font-sans">
      {/* Top Banner: Strict Monochrome */}
      <div className="p-6 rounded-2xl bg-[#080808] border border-[#222222] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141414] text-[#CCCCCC] border border-[#2C2C2C] uppercase tracking-wider flex items-center gap-1.5">
              <BrainCircuit className="w-3 h-3 text-[#CCCCCC]" />
              <span>AI STUDIO WORKSPACE</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#141414] text-[#999999] border border-[#222222] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#CCCCCC]" />
              <span>Zero-Loss Pipeline</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            AI Studio Lab
          </h1>
          <p className="text-xs text-[#999999] max-w-2xl leading-relaxed">
            Neural inpainting, sub-pixel alpha matting, biometric facial retouching, photometric 3D relighting, and AI Creative Director.
          </p>
        </div>

        {/* Engine Status & BYOK Badge */}
        <div className="p-3.5 rounded-xl bg-[#101010] border border-[#222222] space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-[#999999] font-medium">Inference Provider:</span>
            <span className="text-white font-bold font-mono">
              {config.hasKey ? 'BYOK Groq' : 'Local Hybrid'}
            </span>
          </div>
          <button
            onClick={onOpenGroqSettings}
            className="w-full py-1.5 px-3 rounded-lg bg-white hover:bg-[#CCCCCC] text-black text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Configure Keys</span>
          </button>
        </div>
      </div>

      {/* Grid of AI Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AI_STUDIO_MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <div
              key={module.id}
              onClick={module.action}
              className="p-5 rounded-xl bg-[#080808] border border-[#222222] hover:border-[#444444] transition-colors cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-[#141414] border border-[#2C2C2C] flex items-center justify-center text-[#CCCCCC] group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#141414] text-[#999999] border border-[#222222] uppercase tracking-wider">
                    {module.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#CCCCCC] transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-[11px] text-[#999999] leading-relaxed mt-1">
                    {module.subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#181818] flex items-center justify-between text-xs text-[#666666] group-hover:text-white transition-colors">
                <span className="font-medium">Launch AI Module</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
