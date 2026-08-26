import React, { useState } from 'react';
import { Sparkles, Send, Zap, ChevronRight, Layers } from 'lucide-react';
import { Project } from '../../types/editor';
import {
  generateLocalPlanForPrompt,
  requestRemoteNLEditPlan,
  executeNLEditPlan,
} from '../../engine/naturalLanguageEditingEngine';

interface NaturalLanguageEditorBarProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onPushHistory: (label: string, partial: Partial<Project>) => void;
  onOpenFullNLPanel: () => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const NaturalLanguageEditorBar: React.FC<NaturalLanguageEditorBarProps> = ({
  project,
  onUpdateProject,
  onPushHistory,
  onOpenFullNLPanel,
  showToast,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = [
    'Make the person brighter but don’t change the sky.',
    'Make this look like a professional movie still.',
    'Warm golden hour sunset glow with amber highlights.',
    'Moody Nordic street photography with deep crushed blacks.',
  ];

  const handleQuickExecute = async (overridePrompt?: string) => {
    const text = (overridePrompt || prompt).trim();
    if (!text) return;

    setIsProcessing(true);
    setShowSuggestions(false);
    showToast?.('info', 'Processing Intent', `Executing "${text.slice(0, 35)}..."`);

    try {
      const plan = await requestRemoteNLEditPlan(text, project, 'groq');
      const { updatedProject, appliedStepsCount } = executeNLEditPlan(plan, project);

      onPushHistory(`NL Edit: "${text.slice(0, 32)}"`, {
        currentSettings: updatedProject.currentSettings,
        toneCurves: updatedProject.toneCurves,
        hsl: updatedProject.hsl,
        masks: updatedProject.masks,
        crop: updatedProject.crop,
      });

      showToast?.(
        'success',
        'AI Edit Applied',
        `Routed to ${plan.modelUsed || 'Groq AI'} • ${appliedStepsCount} steps in ${plan.latencyMs || 20}ms`
      );
      setPrompt('');
    } catch (err: any) {
      showToast?.('error', 'Execution Error', err.message || 'Failed to execute natural language edit.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto px-2 py-1.5 z-30">
      <div className="relative flex items-center bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 focus-within:border-indigo-500 rounded-full shadow-lg shadow-black/40 backdrop-blur-md transition-all">
        <div className="pl-3.5 pr-2 flex items-center gap-1.5 text-indigo-400">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>

        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleQuickExecute();
            }
          }}
          placeholder="Ask Lumina AI to edit anything... (e.g. &quot;Make the person brighter but don't change the sky&quot;)"
          className="w-full bg-transparent text-xs text-white placeholder-slate-400 py-2 focus:outline-none"
        />

        <div className="flex items-center gap-1.5 pr-1.5">
          {prompt.trim() && (
            <button
              onClick={() => handleQuickExecute()}
              disabled={isProcessing}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all"
            >
              {isProcessing ? (
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  Apply
                </>
              )}
            </button>
          )}

          <button
            onClick={onOpenFullNLPanel}
            title="Open Full AI Deconstruction Studio"
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full text-[11px] font-medium flex items-center gap-1 border border-slate-700 transition-all"
          >
            <Layers className="w-3 h-3 text-indigo-300" />
            <span className="hidden sm:inline">Plan View</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick Suggestions Popup */}
      {showSuggestions && !prompt && (
        <div className="absolute top-full left-2 right-2 mt-1.5 p-2 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md space-y-1 z-40">
          <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Suggested Prompts</span>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-slate-500 hover:text-slate-300 text-[10px]"
            >
              Close
            </button>
          </div>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(s);
                handleQuickExecute(s);
              }}
              className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg flex items-center justify-between transition-colors"
            >
              <span>"{s}"</span>
              <span className="text-[10px] text-indigo-400 font-semibold">Run →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
