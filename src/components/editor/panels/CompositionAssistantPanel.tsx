import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  RefreshCw,
  Check,
  RotateCcw,
  Sliders,
  Maximize2,
  Crop,
  ShieldCheck,
  Layers,
  Eye,
  ArrowRight,
  TrendingUp,
  Grid3X3,
  Divide,
  Scale,
  Film,
  User,
  Square,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Focus,
  SunMedium,
  CheckCircle2,
} from 'lucide-react';
import {
  CropSettings,
  CompositionAssistantResult,
  CompositionCropOption,
} from '../../../types/editor';
import { requestAiCompositionAssistant } from '../../../services/aiService';

interface CompositionAssistantPanelProps {
  crop: CropSettings;
  imageWidth?: number;
  imageHeight?: number;
  onChangeCrop: (crop: CropSettings) => void;
  isAiProcessing?: boolean;
  setIsAiProcessing?: (loading: boolean) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const CompositionAssistantPanel: React.FC<CompositionAssistantPanelProps> = ({
  crop,
  imageWidth = 2400,
  imageHeight = 1600,
  onChangeCrop,
  isAiProcessing = false,
  setIsAiProcessing,
  showToast,
}) => {
  const [result, setResult] = useState<CompositionAssistantResult | null>(null);
  const [selectedCropOptionId, setSelectedCropOptionId] = useState<string | null>(null);
  const [activeGuide, setActiveGuide] = useState<string>('rule_of_thirds');
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  // Analyze Composition with Gemini 3.7
  const handleAnalyzeComposition = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      showToast?.('error', 'No Canvas Image', 'Please open an image to evaluate composition.');
      return;
    }

    setIsAiProcessing?.(true);
    showToast?.('info', 'Analyzing Composition', 'AI evaluating Rule of Thirds, Leading Lines, Symmetry, Horizon & Headroom...');

    try {
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);
      const res = await requestAiCompositionAssistant(imageBase64);

      if (res.success && res.data) {
        setResult(res.data);
        if (res.data.cropOptions && res.data.cropOptions.length > 0) {
          setSelectedCropOptionId(res.data.cropOptions[0].id);
        }
        showToast?.('success', 'Composition Evaluated', 'AI synthesized framing recommendations.');
      } else {
        showToast?.('error', 'Analysis Failed', res.error || 'Failed to analyze composition.');
      }
    } catch (err: any) {
      showToast?.('error', 'Error', err.message);
    } finally {
      setIsAiProcessing?.(false);
    }
  };

  // Apply a specific crop recommendation
  const handleApplyCropOption = (option: CompositionCropOption) => {
    setSelectedCropOptionId(option.id);

    const coords = option.cropCoordinates || {
      x: option.cropDelta.leftPercent / 100,
      y: option.cropDelta.topPercent / 100,
      width: Math.max(0.2, 1 - (option.cropDelta.leftPercent + option.cropDelta.rightPercent) / 100),
      height: Math.max(0.2, 1 - (option.cropDelta.topPercent + option.cropDelta.bottomPercent) / 100),
    };

    onChangeCrop({
      ...crop,
      x: Math.max(0, Math.min(0.8, coords.x)),
      y: Math.max(0, Math.min(0.8, coords.y)),
      width: Math.max(0.1, Math.min(1 - coords.x, coords.width)),
      height: Math.max(0.1, Math.min(1 - coords.y, coords.height)),
      rotation: option.rotationDegrees ?? crop.rotation,
      aspectRatio: option.aspectRatio ?? crop.aspectRatio,
    });

    showToast?.('success', 'Applied AI Framing', `Applied "${option.title}": ${option.suggestionQuote}`);
  };

  // Manual Nudge Crop Delta
  const handleManualNudge = (side: 'left' | 'top' | 'right' | 'bottom', deltaPercent: number) => {
    let { x, y, width, height } = crop;
    const delta = deltaPercent / 100;

    if (side === 'left') {
      const newX = Math.max(0, Math.min(x + width - 0.1, x + delta));
      width = width - (newX - x);
      x = newX;
    } else if (side === 'top') {
      const newY = Math.max(0, Math.min(y + height - 0.1, y + delta));
      height = height - (newY - y);
      y = newY;
    } else if (side === 'right') {
      width = Math.max(0.1, Math.min(1 - x, width + delta));
    } else if (side === 'bottom') {
      height = Math.max(0.1, Math.min(1 - y, height + delta));
    }

    onChangeCrop({ ...crop, x, y, width, height });
  };

  return (
    <div className="p-4 space-y-4 text-slate-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-amber-400" />
            AI Composition Assistant
          </h3>
          <p className="text-[11px] text-slate-400">Rule of Thirds, Leading Lines, Horizon & Visual Balance</p>
        </div>

        <button
          onClick={handleAnalyzeComposition}
          disabled={isAiProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all"
        >
          {isAiProcessing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
          )}
          <span>{result ? 'Re-Evaluate' : 'Evaluate Framing'}</span>
        </button>
      </div>

      {/* Intro Banner if not analyzed yet */}
      {!result && !isAiProcessing && (
        <div className="bg-gradient-to-tr from-amber-950/40 via-slate-900 to-indigo-950/60 border border-amber-500/30 rounded-2xl p-5 text-center space-y-3.5 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-md">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-white">Intelligent Framing & Crop Guidance</h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              Gemini 3.7 evaluates Rule of Thirds power points, perspective leading lines, horizon tilt, headroom clearance, and negative space to generate optimal crop commands.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left text-[11px] text-slate-300 max-w-xs mx-auto pt-1">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Rule of thirds alignment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Leading lines pathways</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Bilateral & radial symmetry</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Horizon tilt & water leveling</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Headroom & gaze space</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Visual weight equilibrium</span>
            </div>
          </div>

          <button
            onClick={handleAnalyzeComposition}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Analyze Photo Composition</span>
          </button>
        </div>
      )}

      {/* Loading State */}
      {isAiProcessing && (
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-6 text-center space-y-3 animate-pulse">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <div className="text-xs font-bold text-white">AI Measuring Geometry & Framing...</div>
          <div className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Analyzing 8 core composition pillars: Rule of Thirds, Leading Lines, Symmetry, Horizon Tilt & Headroom...
          </div>
        </div>
      )}

      {/* Results View */}
      {result && !isAiProcessing && (
        <div className="space-y-4">
          {/* Main Suggestion Banner */}
          <div className="bg-gradient-to-br from-amber-950/80 via-slate-900 to-indigo-950/70 border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>AI Composition Recommendation</span>
                </span>
                <h4 className="text-xs font-black text-white">Framing Suggestion</h4>
              </div>

              <div className="text-xs font-black text-amber-400 bg-amber-950/90 border border-amber-500/40 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{result.overallScore}/100 Score</span>
              </div>
            </div>

            {/* DIRECT PROMINENT USER QUOTE SUGGESTION */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold leading-relaxed flex items-start gap-2">
              <Compass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">"{result.primarySuggestionQuote}"</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed italic">
              "{result.summary}"
            </p>

            {/* 1-Click Apply Primary Recommended Crop */}
            {result.cropOptions?.[0] && (
              <button
                onClick={() => handleApplyCropOption(result.cropOptions[0])}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Crop className="w-3.5 h-3.5 text-slate-950" />
                <span>Apply Optimal AI Crop ({result.cropOptions[0].title})</span>
              </button>
            )}
          </div>

          {/* Tailored Crop Presets Options List */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Crop className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tailored Framing Options:</span>
            </label>

            <div className="space-y-2.5">
              {result.cropOptions?.map((opt) => {
                const isSelected = selectedCropOptionId === opt.id;

                return (
                  <div
                    key={opt.id}
                    className={`rounded-2xl border p-3.5 space-y-2.5 transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-amber-500/60 ring-1 ring-amber-500/30 shadow-lg'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-white">{opt.title}</h4>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-amber-950 border border-amber-500/30 text-amber-300">
                            {opt.aspectRatioLabel || opt.targetGenre}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{opt.subtitle}</p>
                      </div>

                      <button
                        onClick={() => handleApplyCropOption(opt)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3 h-3 text-slate-950" />
                            <span>Applied</span>
                          </>
                        ) : (
                          <>
                            <Crop className="w-3 h-3" />
                            <span>Apply</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-amber-200/90 font-medium">
                      💡 "{opt.suggestionQuote}"
                    </p>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {opt.explanation}
                    </p>

                    {/* Percentage Breakdown Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono">
                      {opt.cropDelta.leftPercent > 0 && (
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300">
                          Left: -{opt.cropDelta.leftPercent}%
                        </span>
                      )}
                      {opt.cropDelta.topPercent > 0 && (
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300">
                          Top: -{opt.cropDelta.topPercent}%
                        </span>
                      )}
                      {opt.cropDelta.rightPercent > 0 && (
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300">
                          Right: -{opt.cropDelta.rightPercent}%
                        </span>
                      )}
                      {opt.cropDelta.bottomPercent > 0 && (
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300">
                          Bottom: -{opt.cropDelta.bottomPercent}%
                        </span>
                      )}
                      {opt.rotationDegrees !== 0 && (
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300">
                          Tilt: {opt.rotationDegrees > 0 ? `+${opt.rotationDegrees}°` : `${opt.rotationDegrees}°`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 8 Composition Pillars Breakdown */}
          {result.evaluations && (
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>8 Composition Pillars Evaluated:</span>
              </label>

              <div className="space-y-2">
                {/* 1. Rule of Thirds */}
                <div
                  onClick={() => setExpandedPillar(expandedPillar === 'thirds' ? null : 'thirds')}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 cursor-pointer hover:border-slate-700 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Grid3X3 className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-white">Rule of Thirds</span>
                      <span className="text-[10px] text-slate-400 font-mono">({result.evaluations.ruleOfThirds.score}/100)</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      result.evaluations.ruleOfThirds.status === 'Excellent' || result.evaluations.ruleOfThirds.status === 'Good'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}>
                      {result.evaluations.ruleOfThirds.status}
                    </span>
                  </div>
                  {expandedPillar === 'thirds' && (
                    <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                      {result.evaluations.ruleOfThirds.details}
                      {result.evaluations.ruleOfThirds.subjectAlignment && (
                        <div className="text-indigo-300 pt-0.5">Alignment: {result.evaluations.ruleOfThirds.subjectAlignment}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Leading Lines */}
                <div
                  onClick={() => setExpandedPillar(expandedPillar === 'lines' ? null : 'lines')}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 cursor-pointer hover:border-slate-700 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white">Leading Lines</span>
                      <span className="text-[10px] text-slate-400 font-mono">({result.evaluations.leadingLines.score}/100)</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-800 text-slate-300">
                      {result.evaluations.leadingLines.strength || 'Detected'}
                    </span>
                  </div>
                  {expandedPillar === 'lines' && (
                    <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                      {result.evaluations.leadingLines.details}
                      {result.evaluations.leadingLines.direction && (
                        <div className="text-cyan-300 pt-0.5">Direction: {result.evaluations.leadingLines.direction}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Symmetry */}
                <div
                  onClick={() => setExpandedPillar(expandedPillar === 'symmetry' ? null : 'symmetry')}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 cursor-pointer hover:border-slate-700 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Divide className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white">Symmetry & Geometry</span>
                      <span className="text-[10px] text-slate-400 font-mono">({result.evaluations.symmetry.score}/100)</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-purple-950 text-purple-300 border border-purple-500/30">
                      {result.evaluations.symmetry.type || 'Asymmetrical'}
                    </span>
                  </div>
                  {expandedPillar === 'symmetry' && (
                    <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                      {result.evaluations.symmetry.details}
                    </div>
                  )}
                </div>

                {/* 4. Subject Placement */}
                <div
                  onClick={() => setExpandedPillar(expandedPillar === 'subject' ? null : 'subject')}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 cursor-pointer hover:border-slate-700 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Focus className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-bold text-white">Subject Placement</span>
                      <span className="text-[10px] text-slate-400 font-mono">({result.evaluations.subjectPlacement.score}/100)</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-800 text-slate-300">
                      {result.evaluations.subjectPlacement.headroomStatus || 'Look Room'}
                    </span>
                  </div>
                  {expandedPillar === 'subject' && (
                    <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                      {result.evaluations.subjectPlacement.details}
                      {result.evaluations.subjectPlacement.focalZone && (
                        <div className="text-rose-300 pt-0.5">Zone: {result.evaluations.subjectPlacement.focalZone}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. Horizon Level */}
                <div
                  onClick={() => setExpandedPillar(expandedPillar === 'horizon' ? null : 'horizon')}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 cursor-pointer hover:border-slate-700 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">Horizon & Straightening</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      result.evaluations.horizon.levelStatus === 'Level'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}>
                      {result.evaluations.horizon.tiltDegrees ? `${result.evaluations.horizon.tiltDegrees}° Tilt` : 'Level'}
                    </span>
                  </div>
                  {expandedPillar === 'horizon' && (
                    <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                      {result.evaluations.horizon.recommendation || 'Horizon checked.'}
                    </div>
                  )}
                </div>

                {/* 6. Headroom */}
                <div
                  onClick={() => setExpandedPillar(expandedPillar === 'headroom' ? null : 'headroom')}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 cursor-pointer hover:border-slate-700 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-pink-400" />
                      <span className="text-xs font-bold text-white">Headroom Clearance</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-800 text-slate-300">
                      {result.evaluations.headroom.status || 'Balanced'}
                    </span>
                  </div>
                  {expandedPillar === 'headroom' && (
                    <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                      {result.evaluations.headroom.details}
                    </div>
                  )}
                </div>

                {/* 7. Negative Space */}
                <div
                  onClick={() => setExpandedPillar(expandedPillar === 'negative' ? null : 'negative')}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 cursor-pointer hover:border-slate-700 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Maximize2 className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white">Negative Space</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-800 text-slate-300">
                      {result.evaluations.negativeSpace.distribution || 'Balanced'}
                    </span>
                  </div>
                  {expandedPillar === 'negative' && (
                    <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                      {result.evaluations.negativeSpace.details}
                    </div>
                  )}
                </div>

                {/* 8. Visual Balance */}
                <div
                  onClick={() => setExpandedPillar(expandedPillar === 'balance' ? null : 'balance')}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 cursor-pointer hover:border-slate-700 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs font-bold text-white">Visual Balance</span>
                      <span className="text-[10px] text-slate-400 font-mono">({result.evaluations.visualBalance.score}/100)</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-800 text-slate-300">
                      {result.evaluations.visualBalance.equilibrium || 'Equilibrium'}
                    </span>
                  </div>
                  {expandedPillar === 'balance' && (
                    <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                      {result.evaluations.visualBalance.details}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Fine-Tuning Sliders */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Fine-Tune Edge Trims:</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleManualNudge('left', 2)}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 flex items-center justify-between"
              >
                <span>Trim Left (+2%)</span>
                <span className="text-[10px] text-amber-400 font-mono">{Math.round(crop.x * 100)}%</span>
              </button>

              <button
                onClick={() => handleManualNudge('top', 2)}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 flex items-center justify-between"
              >
                <span>Trim Top (+2%)</span>
                <span className="text-[10px] text-amber-400 font-mono">{Math.round(crop.y * 100)}%</span>
              </button>

              <button
                onClick={() => handleManualNudge('right', -2)}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 flex items-center justify-between"
              >
                <span>Trim Right (+2%)</span>
                <span className="text-[10px] text-amber-400 font-mono">{Math.round((1 - crop.x - crop.width) * 100)}%</span>
              </button>

              <button
                onClick={() => handleManualNudge('bottom', -2)}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 flex items-center justify-between"
              >
                <span>Trim Bottom (+2%)</span>
                <span className="text-[10px] text-amber-400 font-mono">{Math.round((1 - crop.y - crop.height) * 100)}%</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
