import React from 'react';
import {
  HelpCircle,
  X,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Zap,
  Info,
  BookOpen,
} from 'lucide-react';
import { ToolDefinition } from '../../types/navigation';
import { TOOL_CATEGORIES_CONFIG } from '../../engine/toolRegistry';

interface ToolEducationModalProps {
  tool: ToolDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onLaunchTool?: (tool: ToolDefinition) => void;
}

export const ToolEducationModal: React.FC<ToolEducationModalProps> = ({
  tool,
  isOpen,
  onClose,
  onLaunchTool,
}) => {
  if (!isOpen || !tool) return null;

  const categoryConfig = TOOL_CATEGORIES_CONFIG[tool.categoryId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg ${
                categoryConfig ? `${categoryConfig.accentBg} ${categoryConfig.accentBorder}` : 'bg-indigo-500/20 border-indigo-500/30'
              }`}
            >
              <HelpCircle className={`w-5 h-5 ${categoryConfig ? categoryConfig.accentColor : 'text-indigo-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {tool.name}
                </h3>
                {tool.isProOnly && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                    PRO
                  </span>
                )}
                {tool.isAiPowered && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Category: {categoryConfig ? categoryConfig.title : tool.categoryId}
                {tool.shortcut ? ` • Shortcut: [ ${tool.shortcut} ]` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Overview */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Info className="w-3 h-3 text-indigo-400" />
              Summary
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {tool.description}
            </p>
          </div>

          {/* What it does */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              What It Does
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              {tool.education.whatItDoes}
            </p>
          </div>

          {/* When to use */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              When to Use It
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              {tool.education.whenToUse}
            </p>
          </div>

          {/* Pro Tip */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              Mastery Pro Tip
            </span>
            <p className="text-xs text-slate-200 leading-relaxed">
              {tool.education.proTip}
            </p>
          </div>

          {/* Sample Effect */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              Visual Transformation Example
            </h4>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
              {tool.education.sampleEffect}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Close Guide
          </button>

          {onLaunchTool && (
            <button
              onClick={() => {
                onLaunchTool(tool);
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
            >
              <span>Open & Activate Tool</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
