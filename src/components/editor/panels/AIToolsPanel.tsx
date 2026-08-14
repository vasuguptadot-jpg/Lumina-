import React, { useState } from 'react';
import {
  Sparkles,
  Eraser,
  Image as ImageIcon,
  Wand2,
  Sun,
  Layers,
  ChevronRight,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { AdjustmentSettings, Project } from '../../../types/editor';
import {
  requestAiAutoEnhance,
  requestAiBackgroundReplacement,
  requestAiStyleTransfer,
} from '../../../services/aiService';

interface AIToolsPanelProps {
  project: Project;
  onUpdateSettings: (settings: AdjustmentSettings) => void;
  onUpdateImage: (newUrl: string, name?: string) => void;
  isAiProcessing: boolean;
  setIsAiProcessing: (loading: boolean) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

const PRESET_BACKDROPS = [
  { id: 'modern-studio', name: 'Minimalist Photo Studio', prompt: 'Clean high-end modern minimalist photo studio with warm wooden flooring and soft diffused daylight from large windows', icon: '🏛️' },
  { id: 'tokyo-neon', name: 'Cyberpunk Tokyo Rain', prompt: 'Atmospheric Tokyo alleyway at night in soft rain, glowing neon signs in cyan and magenta, wet reflections on asphalt, bokeh depth of field', icon: '🏮' },
  { id: 'sunset-beach', name: 'Golden Hour Beach', prompt: 'Scenic coastal beach with gentle turquoise waves at sunset, golden warm sunlight rays, soft bokeh background', icon: '🌅' },
  { id: 'botanical-garden', name: 'Lush Botanical Greenhouse', prompt: 'Lush tropical glass botanical greenhouse filled with exotic monstera leaves, soft misty morning backlight', icon: '🌿' },
  { id: 'nordic-minimal', name: 'Nordic Architectural Loft', prompt: 'Spacious Scandinavian concrete loft with minimalist furniture, organic stone textures, warm ambient lighting', icon: '🛋️' },
  { id: 'dark-slate', name: 'Moody Dark Slate Studio', prompt: 'Dark textured slate wall photography studio with subtle rim lighting and dramatic studio vignette', icon: '⬛' },
];

const STYLE_PRESETS = [
  { id: 'portra-film', name: 'Kodak Portra 35mm', prompt: 'Authentic 35mm Kodak Portra film look with warm golden skin tones, gentle highlight roll-off, and fine organic film grain' },
  { id: 'cinematic-relight', name: 'Dramatic Cinema Relighting', prompt: 'Cinematic Rembrandt lighting with warm key light, cool teal rim light, and deep atmospheric contrast' },
  { id: 'neon-synthwave', name: 'Synthwave Glow', prompt: 'Electric synthwave aesthetic with vibrant magenta and cyan neon backlight' },
  { id: 'vintage-polaroid', name: '1970s Vintage Polaroid', prompt: 'Warm nostalgic 1970s Polaroid print aesthetic with lifted faded blacks and soft glow' },
];

export const AIToolsPanel: React.FC<AIToolsPanelProps> = ({
  project,
  onUpdateSettings,
  onUpdateImage,
  isAiProcessing,
  setIsAiProcessing,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'object-removal' | 'background' | 'auto-enhance' | 'style'>('object-removal');
  const [customBgPrompt, setCustomBgPrompt] = useState('');
  const [customStylePrompt, setCustomStylePrompt] = useState('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  // 1. AI Auto Enhance
  const handleAutoEnhance = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    setIsAiProcessing(true);
    showToast('info', 'Analyzing Photo', 'Gemini is evaluating exposure, dynamic range, and color balance...');

    try {
      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      const res = await requestAiAutoEnhance(base64);

      if (res.success && res.data) {
        const d = res.data;
        const newSettings: AdjustmentSettings = {
          ...project.currentSettings,
          exposure: d.exposure ?? project.currentSettings.exposure,
          brightness: d.brightness ?? project.currentSettings.brightness,
          contrast: d.contrast ?? project.currentSettings.contrast,
          highlights: d.highlights ?? project.currentSettings.highlights,
          shadows: d.shadows ?? project.currentSettings.shadows,
          whites: d.whites ?? project.currentSettings.whites,
          blacks: d.blacks ?? project.currentSettings.blacks,
          temperature: d.temperature ?? project.currentSettings.temperature,
          tint: d.tint ?? project.currentSettings.tint,
          saturation: d.saturation ?? project.currentSettings.saturation,
          vibrance: d.vibrance ?? project.currentSettings.vibrance,
          clarity: d.clarity ?? project.currentSettings.clarity,
          sharpness: d.sharpness ?? project.currentSettings.sharpness,
          vignette: d.vignette ?? project.currentSettings.vignette,
        };

        onUpdateSettings(newSettings);
        setAiAnalysisResult(d.analysis || 'Enhanced lighting balance and chromatic tonality.');
        showToast('success', 'AI Auto-Tune Applied', 'Calibrated exposure, contrast, and color balance.');
      } else {
        showToast('error', 'Auto-Tune Failed', res.error || 'Could not analyze photo.');
      }
    } catch (err: any) {
      showToast('error', 'AI Auto-Tune Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // 2. AI Background Replacement
  const handleReplaceBackground = async (promptText: string) => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    setIsAiProcessing(true);
    showToast('info', 'Generating Background', 'Segmenting subject and synthesizing new environment...');

    try {
      const base64 = canvas.toDataURL('image/png');
      const res = await requestAiBackgroundReplacement(base64, promptText);

      if (res.success && res.imageUrl) {
        onUpdateImage(res.imageUrl, `AI_BG_${project.name}`);
        showToast('success', 'Background Replaced', 'Subject seamlessly blended into the new environment.');
      } else {
        showToast('error', 'Background Replacement Failed', res.message || res.error);
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // 3. AI Style Transfer
  const handleApplyStyle = async (promptText: string) => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    setIsAiProcessing(true);
    showToast('info', 'Styling Photo', 'Gemini is applying artistic lighting & color science...');

    try {
      const base64 = canvas.toDataURL('image/png');
      const res = await requestAiStyleTransfer(base64, promptText);

      if (res.success && res.imageUrl) {
        onUpdateImage(res.imageUrl, `Styled_${project.name}`);
        showToast('success', 'Style Applied', 'Artistic style transformation complete.');
      } else {
        showToast('error', 'Style Transfer Failed', res.message || res.error);
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4 select-none">
      {/* Sub Tabs */}
      <div className="grid grid-cols-2 gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('object-removal')}
          className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'object-removal' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Eraser className="w-3.5 h-3.5" />
          <span>Object Eraser</span>
        </button>

        <button
          onClick={() => setActiveSubTab('background')}
          className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'background' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>BG Studio</span>
        </button>

        <button
          onClick={() => setActiveSubTab('auto-enhance')}
          className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'auto-enhance' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Auto-Tune</span>
        </button>

        <button
          onClick={() => setActiveSubTab('style')}
          className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'style' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Relight & Style</span>
        </button>
      </div>

      {/* Tab 1: Object Removal Brush Guide */}
      {activeSubTab === 'object-removal' && (
        <div className="space-y-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Eraser className="w-4 h-4 text-rose-400" />
            <span>AI Magic Object Removal & Healing</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Paint directly over unwanted objects, blemishes, powerlines, photobombers, or clutter on the photo canvas above.
          </p>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1.5 text-xs">
            <div className="font-semibold text-indigo-300 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              Two Inpainting Modes Available:
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1 pl-1">
              <li>• <b className="text-slate-200">AI Generative Inpaint:</b> Uses Gemini to reconstruct complex backgrounds, shadows, and natural textures.</li>
              <li>• <b className="text-slate-200">Instant Fast Patch:</b> 100% offline client texture synthesis for fast skin healing and spot cleaning.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: AI Background Studio */}
      {activeSubTab === 'background' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Select a studio backdrop or type a custom prompt to replace the background automatically:
          </div>

          {/* Preset Backdrops Grid */}
          <div className="grid grid-cols-2 gap-2">
            {PRESET_BACKDROPS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => handleReplaceBackground(bg.prompt)}
                disabled={isAiProcessing}
                className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/60 text-left transition-all group disabled:opacity-50"
              >
                <div className="text-xl mb-1">{bg.icon}</div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                  {bg.name}
                </div>
              </button>
            ))}
          </div>

          {/* Custom Background Prompt */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-2">
            <div className="text-xs font-bold text-slate-300">Custom AI Background Prompt</div>
            <textarea
              rows={2}
              placeholder="e.g. Sunset in a Parisian balcony with glowing streetlamps and bokeh"
              value={customBgPrompt}
              onChange={(e) => setCustomBgPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-indigo-500 resize-none"
            />
            <button
              onClick={() => handleReplaceBackground(customBgPrompt)}
              disabled={!customBgPrompt.trim() || isAiProcessing}
              className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-lg transition-all shadow-md disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiProcessing ? 'animate-spin' : ''}`} />
              <span>Generate Background</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: AI Auto-Enhance */}
      {activeSubTab === 'auto-enhance' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Wand2 className="w-4 h-4" />
              <span>AI Photo Director & Master Colorist</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Gemini analyzes the image's dynamic range, shadows, highlights, color temperature, and contrast, and automatically dials in ideal studio corrections.
            </p>

            <button
              onClick={handleAutoEnhance}
              disabled={isAiProcessing}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Sparkles className={`w-4 h-4 ${isAiProcessing ? 'animate-spin' : ''}`} />
              <span>{isAiProcessing ? 'Analyzing & Tuning...' : 'Run 1-Click AI Auto-Tune'}</span>
            </button>
          </div>

          {aiAnalysisResult && (
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1">
              <div className="text-[11px] font-bold text-indigo-400">AI Colorist Analysis:</div>
              <p className="text-xs text-slate-300 leading-relaxed">{aiAnalysisResult}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: AI Relighting & Style */}
      {activeSubTab === 'style' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Apply generative relighting, film grain simulation, and cinematic lighting treatments:
          </div>

          <div className="space-y-2">
            {STYLE_PRESETS.map((st) => (
              <button
                key={st.id}
                onClick={() => handleApplyStyle(st.prompt)}
                disabled={isAiProcessing}
                className="w-full p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/60 text-left transition-all flex items-center justify-between group disabled:opacity-50"
              >
                <div>
                  <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300">
                    {st.name}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">{st.prompt}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
              </button>
            ))}
          </div>

          {/* Custom Style Prompt */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-2">
            <div className="text-xs font-bold text-slate-300">Custom Lighting & Style Prompt</div>
            <textarea
              rows={2}
              placeholder="e.g. Golden hour warm volumetric rays with anamorphic lens flare"
              value={customStylePrompt}
              onChange={(e) => setCustomStylePrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-indigo-500 resize-none"
            />
            <button
              onClick={() => handleApplyStyle(customStylePrompt)}
              disabled={!customStylePrompt.trim() || isAiProcessing}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiProcessing ? 'animate-spin' : ''}`} />
              <span>Apply Custom Style</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
