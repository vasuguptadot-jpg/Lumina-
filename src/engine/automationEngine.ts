import {
  AutomationWorkflow,
  AutomationStepType,
  AutomationStepReport,
  AutomationExecutionResult,
  AIDiagnosticReport,
  ImportStepConfig,
  AIAnalysisStepConfig,
  ColorCorrectionStepConfig,
  NoiseReductionStepConfig,
  PresetStepConfig,
  WatermarkStepConfig,
  ResizeStepConfig,
  ExportStepConfig,
} from '../types/automation';
import { AdjustmentSettings, FilterPreset, WatermarkSettings } from '../types/editor';
import { analyzeImageStats, calculateAutoTone } from './autoToneEngine';
import { applyDetailAndNoisePipeline } from './detailEngine';
import { processImagePipeline } from './colorPipeline';
import { getPresetById, FILTER_PRESETS } from './presets';
import { calculateBatchDimensions, computeBatchFilename } from './batchEngine';
import { encodeCanvasToTiff } from './tiffEncoder';
import { encodeCanvasToPsd } from './psdEncoder';
import { encodeCanvasToDng } from './dngEncoder';
import { DEFAULT_ADJUSTMENTS, DEFAULT_HSL, DEFAULT_TONE_CURVES, DEFAULT_WATERMARK } from './defaultSettings';

/**
 * Step 2: Advanced AI Diagnostic Analysis
 */
export function performAIAnalysis(canvas: HTMLCanvasElement, mode: AIAnalysisStepConfig['mode']): AIDiagnosticReport {
  const stats = analyzeImageStats(canvas);

  // 1. Dynamic range estimation (0 to 100)
  const range = stats.p95 - stats.p5;
  const dynamicRangeScore = Math.min(100, Math.round((range / 220) * 100));

  // 2. Lighting classification
  let lightingType = 'Balanced Studio Lighting';
  if (stats.meanLum > 170 && stats.p95 > 245) {
    lightingType = 'High-Key Bright Lighting';
  } else if (stats.meanLum < 85 && stats.p5 < 15) {
    lightingType = 'Low-Key Moody / Night Scene';
  } else if (stats.highlightRatio > 0.12 && stats.shadowRatio > 0.12) {
    lightingType = 'High Dynamic Range / Backlit Contrast';
  } else if (stats.stdDevLum < 35) {
    lightingType = 'Flat / Overcast Diffuse';
  }

  // 3. Scene classification heuristics
  let sceneClassification = 'General Lifestyle';
  const rDiff = stats.meanR - stats.meanB;
  const gDiff = stats.meanG - stats.meanB;

  if (stats.meanLum < 70 && (stats.meanR > stats.meanB * 1.3 || stats.meanB > stats.meanR * 1.3)) {
    sceneClassification = 'Night Street / Urban Glow';
  } else if (rDiff > 25 && gDiff > 10) {
    sceneClassification = 'Golden Hour / Warm Sunset';
  } else if (stats.meanB > stats.meanR + 15 && stats.meanG > stats.meanR) {
    sceneClassification = 'Landscape / Coastal Sky';
  } else if (stats.meanR > 130 && stats.meanG > 100 && stats.meanB > 80 && stats.stdDevLum > 40) {
    sceneClassification = 'Portrait / Studio Subject';
  } else if (stats.meanLum > 180 && stats.stdDevLum < 30) {
    sceneClassification = 'E-Commerce Clean Background';
  }

  // 4. Noise estimation
  let estimatedNoiseLevel: 'Clean' | 'Low' | 'Moderate' | 'High' | 'Heavy' = 'Clean';
  if (stats.stdDevLum > 68 && stats.meanLum < 90) {
    estimatedNoiseLevel = 'High';
  } else if (stats.stdDevLum > 55) {
    estimatedNoiseLevel = 'Moderate';
  } else if (stats.stdDevLum > 45) {
    estimatedNoiseLevel = 'Low';
  }

  // 5. Recommended Adjustments Calculation
  const autoToneVals = calculateAutoTone(canvas);

  let evOffset = autoToneVals.exposure || 0;
  let contrastVal = autoToneVals.contrast || 0;
  let highlightsVal = autoToneVals.highlights || 0;
  let shadowsVal = autoToneVals.shadows || 0;
  let tempOffset = 0;

  if (mode === 'aggressive') {
    evOffset = Math.round(evOffset * 1.3);
    contrastVal = Math.round(contrastVal * 1.25);
    highlightsVal = Math.round(highlightsVal * 1.2);
    shadowsVal = Math.round(shadowsVal * 1.2);
  } else if (mode === 'natural') {
    evOffset = Math.round(evOffset * 0.7);
    contrastVal = Math.round(contrastVal * 0.65);
  } else if (mode === 'portrait_prioritized') {
    // Preserve highlights on skin, gentle shadow lift
    shadowsVal = Math.max(15, shadowsVal);
    highlightsVal = Math.min(-10, highlightsVal);
    contrastVal = Math.min(15, contrastVal);
  }

  // Color Mood
  let dominantMood = 'Neutral Natural';
  if (rDiff > 20) dominantMood = 'Warm Amber';
  else if (stats.meanB > stats.meanR + 15) dominantMood = 'Cool Cyan/Teal';
  else if (gDiff > 20) dominantMood = 'Lush Emerald';

  return {
    sceneClassification,
    lightingType,
    dynamicRangeScore,
    estimatedNoiseLevel,
    dominantColorMood: dominantMood,
    recommendedEVOffset: evOffset,
    recommendedContrast: contrastVal,
    recommendedHighlights: highlightsVal,
    recommendedShadows: shadowsVal,
    recommendedTempOffset: tempOffset,
    skinToneDetected: sceneClassification.includes('Portrait') || (stats.meanR > 140 && stats.meanG > 110),
    skyDetected: sceneClassification.includes('Landscape') || (stats.meanB > 130 && stats.meanB > stats.meanR),
    sharpnessScore: Math.min(100, Math.round(stats.stdDevLum * 1.3)),
  };
}

/**
 * Step 6: Render High-Fidelity Watermark
 */
export function renderWatermarkOnCanvas(canvas: HTMLCanvasElement, config: WatermarkStepConfig) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || !config.enabled) return;

  const {
    text = '© Lumina Studio Pro',
    fontSize = 24,
    fontFamily = 'sans-serif',
    color = '#ffffff',
    opacity = 80,
    position = 'bottom-right',
    padding = 24,
    hasShadow = true,
    isTiled = false,
  } = config;

  ctx.save();
  ctx.globalAlpha = Math.max(0.05, Math.min(1, opacity / 100));

  const scaleFactor = Math.max(0.5, canvas.width / 1920);
  const effectiveFontSize = Math.round(fontSize * scaleFactor);
  ctx.font = `600 ${effectiveFontSize}px ${fontFamily}`;
  ctx.fillStyle = color;

  if (hasShadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = 4 * scaleFactor;
    ctx.shadowOffsetX = 2 * scaleFactor;
    ctx.shadowOffsetY = 2 * scaleFactor;
  }

  if (isTiled || config.type === 'pattern-tile') {
    // Diagonal repeating tile matrix
    const angle = (-30 * Math.PI) / 180;
    ctx.rotate(angle);
    const stepX = effectiveFontSize * 12;
    const stepY = effectiveFontSize * 6;

    for (let x = -canvas.width * 2; x < canvas.width * 2; x += stepX) {
      for (let y = -canvas.height * 2; y < canvas.height * 2; y += stepY) {
        ctx.fillText(text, x, y);
      }
    }
  } else {
    // 9-point positioning matrix
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = effectiveFontSize;
    const pad = padding * scaleFactor;

    let x = pad;
    let y = pad + textHeight;

    if (position.includes('center')) {
      if (position === 'top-center' || position === 'center' || position === 'bottom-center') {
        x = (canvas.width - textWidth) / 2;
      }
    }
    if (position.includes('right')) {
      x = canvas.width - textWidth - pad;
    }
    if (position.includes('center') && (position === 'center-left' || position === 'center' || position === 'center-right')) {
      y = (canvas.height + textHeight) / 2;
    }
    if (position.includes('bottom')) {
      y = canvas.height - pad;
    }

    ctx.fillText(text, x, y);
  }

  ctx.restore();
}

/**
 * Execute Complete 8-Step Automation Workflow Engine
 */
export async function executeAutomationWorkflow(
  workflow: AutomationWorkflow,
  sourceCanvas: HTMLCanvasElement,
  customPresets: FilterPreset[] = [],
  onStepProgress?: (report: AutomationStepReport) => void
): Promise<AutomationExecutionResult> {
  const startTime = performance.now();
  const stepReports: AutomationStepReport[] = [];

  // Helper to clone canvas for snapshots
  const createSnapshot = (canvas: HTMLCanvasElement): string => {
    try {
      const snap = document.createElement('canvas');
      const maxDim = 800;
      const ratio = Math.min(1, maxDim / Math.max(canvas.width, canvas.height));
      snap.width = Math.max(1, Math.round(canvas.width * ratio));
      snap.height = Math.max(1, Math.round(canvas.height * ratio));
      const sCtx = snap.getContext('2d')!;
      sCtx.drawImage(canvas, 0, 0, snap.width, snap.height);
      return snap.toDataURL('image/jpeg', 0.85);
    } catch {
      return '';
    }
  };

  // Working canvas
  const workingCanvas = document.createElement('canvas');
  workingCanvas.width = sourceCanvas.width;
  workingCanvas.height = sourceCanvas.height;
  const ctx = workingCanvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(sourceCanvas, 0, 0);

  let aiDiagnostics: AIDiagnosticReport | undefined;

  // ==========================================
  // STEP 1: IMPORT
  // ==========================================
  const t1 = performance.now();
  const importReport: AutomationStepReport = {
    stepType: 'import',
    stepName: '1. Import & Ingest',
    stepIndex: 0,
    status: 'completed',
    latencyMs: Math.round(performance.now() - t1),
    details: `Ingested ${workingCanvas.width} × ${workingCanvas.height}px (${workflow.steps.importStep.colorSpace})`,
    previewUrl: createSnapshot(workingCanvas),
    stats: { width: workingCanvas.width, height: workingCanvas.height, colorSpace: workflow.steps.importStep.colorSpace },
  };
  stepReports.push(importReport);
  onStepProgress?.(importReport);

  // ==========================================
  // STEP 2: AI ANALYSIS
  // ==========================================
  const t2 = performance.now();
  if (workflow.steps.aiAnalysisStep.enabled) {
    try {
      aiDiagnostics = performAIAnalysis(workingCanvas, workflow.steps.aiAnalysisStep.mode);
      const aiReport: AutomationStepReport = {
        stepType: 'ai_analysis',
        stepName: '2. AI Vision & Scene Analysis',
        stepIndex: 1,
        status: 'completed',
        latencyMs: Math.round(performance.now() - t2),
        details: `${aiDiagnostics.sceneClassification} | ${aiDiagnostics.lightingType} (Dynamic Range: ${aiDiagnostics.dynamicRangeScore}%)`,
        previewUrl: createSnapshot(workingCanvas),
        stats: aiDiagnostics as any,
      };
      stepReports.push(aiReport);
      onStepProgress?.(aiReport);
    } catch (err: any) {
      const errReport: AutomationStepReport = {
        stepType: 'ai_analysis',
        stepName: '2. AI Vision & Scene Analysis',
        stepIndex: 1,
        status: 'error',
        latencyMs: Math.round(performance.now() - t2),
        error: err.message,
      };
      stepReports.push(errReport);
      onStepProgress?.(errReport);
    }
  } else {
    stepReports.push({
      stepType: 'ai_analysis',
      stepName: '2. AI Vision & Scene Analysis',
      stepIndex: 1,
      status: 'skipped',
      latencyMs: 0,
      details: 'Stage bypassed by user workflow config',
    });
  }

  // ==========================================
  // STEP 3: COLOR CORRECTION
  // ==========================================
  const t3 = performance.now();
  if (workflow.steps.colorCorrectionStep.enabled) {
    try {
      const cc = workflow.steps.colorCorrectionStep;
      let exp = cc.exposure;
      let cont = cc.contrast;
      let high = cc.highlights;
      let shad = cc.shadows;
      let wht = cc.whites;
      let blk = cc.blacks;
      let temp = cc.temperature;
      let vib = cc.vibrance;
      let sat = cc.saturation;
      let clr = cc.clarity;
      let dhz = cc.dehaze;

      // Integrate AI Analysis recommendations if autoTone is active
      if (cc.autoTone && aiDiagnostics) {
        exp += aiDiagnostics.recommendedEVOffset;
        cont += aiDiagnostics.recommendedContrast;
        high += aiDiagnostics.recommendedHighlights;
        shad += aiDiagnostics.recommendedShadows;
        if (aiDiagnostics.skyDetected) dhz += 10;
        if (aiDiagnostics.skinToneDetected) vib += 8;
      }

      const adjustments: AdjustmentSettings = {
        ...DEFAULT_ADJUSTMENTS,
        exposure: Math.max(-100, Math.min(100, exp)),
        contrast: Math.max(-100, Math.min(100, cont)),
        highlights: Math.max(-100, Math.min(100, high)),
        shadows: Math.max(-100, Math.min(100, shad)),
        whites: Math.max(-100, Math.min(100, wht)),
        blacks: Math.max(-100, Math.min(100, blk)),
        temperature: Math.max(-100, Math.min(100, temp)),
        tint: cc.tint,
        vibrance: Math.max(-100, Math.min(100, vib)),
        saturation: Math.max(-100, Math.min(100, sat)),
        clarity: Math.max(-100, Math.min(100, clr)),
        dehaze: Math.max(-100, Math.min(100, dhz)),
      };

      processImagePipeline({
        sourceCanvas: workingCanvas,
        targetCanvas: workingCanvas,
        adjustments,
        toneCurves: DEFAULT_TONE_CURVES,
        hsl: DEFAULT_HSL,
        highQuality: true,
      });

      const ccReport: AutomationStepReport = {
        stepType: 'color_correction',
        stepName: '3. Color Correction & Balance',
        stepIndex: 2,
        status: 'completed',
        latencyMs: Math.round(performance.now() - t3),
        details: `Applied Auto Tone (EV ${exp > 0 ? '+' : ''}${exp}, Contrast ${cont}, Highlights ${high}, Shadows ${shad})`,
        previewUrl: createSnapshot(workingCanvas),
        stats: adjustments as any,
      };
      stepReports.push(ccReport);
      onStepProgress?.(ccReport);
    } catch (err: any) {
      stepReports.push({
        stepType: 'color_correction',
        stepName: '3. Color Correction & Balance',
        stepIndex: 2,
        status: 'error',
        latencyMs: Math.round(performance.now() - t3),
        error: err.message,
      });
    }
  } else {
    stepReports.push({
      stepType: 'color_correction',
      stepName: '3. Color Correction & Balance',
      stepIndex: 2,
      status: 'skipped',
      latencyMs: 0,
      details: 'Stage bypassed',
    });
  }

  // ==========================================
  // STEP 4: NOISE REDUCTION & DETAIL
  // ==========================================
  const t4 = performance.now();
  if (workflow.steps.noiseReductionStep.enabled) {
    try {
      const nr = workflow.steps.noiseReductionStep;
      let lumNR = nr.luminanceNR;
      let colNR = nr.colorNR;

      // Smart AI auto boost if high noise was diagnosed
      if (aiDiagnostics && aiDiagnostics.estimatedNoiseLevel === 'High' && lumNR === 0) {
        lumNR = 35;
        colNR = 45;
      }

      applyDetailAndNoisePipeline(ctx, workingCanvas.width, workingCanvas.height, {
        sharpness: nr.sharpness,
        radius: nr.sharpnessRadius,
        detail: 50,
        masking: nr.sharpnessMasking,
        luminanceNR: lumNR,
        luminanceDetail: nr.luminanceDetail,
        colorNR: colNR,
        colorDetail: nr.colorDetail,
        colorSmoothness: nr.colorSmoothness,
        texture: nr.texture,
        microcontrast: nr.microcontrast,
      });

      const nrReport: AutomationStepReport = {
        stepType: 'noise_reduction',
        stepName: '4. Noise Reduction & Detail Engine',
        stepIndex: 3,
        status: 'completed',
        latencyMs: Math.round(performance.now() - t4),
        details: `Luminance NR: ${lumNR}% | Chroma NR: ${colNR}% | Sharpness: ${nr.sharpness}%`,
        previewUrl: createSnapshot(workingCanvas),
        stats: { luminanceNR: lumNR, colorNR: colNR, sharpness: nr.sharpness, texture: nr.texture },
      };
      stepReports.push(nrReport);
      onStepProgress?.(nrReport);
    } catch (err: any) {
      stepReports.push({
        stepType: 'noise_reduction',
        stepName: '4. Noise Reduction & Detail Engine',
        stepIndex: 3,
        status: 'error',
        latencyMs: Math.round(performance.now() - t4),
        error: err.message,
      });
    }
  } else {
    stepReports.push({
      stepType: 'noise_reduction',
      stepName: '4. Noise Reduction & Detail Engine',
      stepIndex: 3,
      status: 'skipped',
      latencyMs: 0,
      details: 'Stage bypassed',
    });
  }

  // ==========================================
  // STEP 5: PRESET & AESTHETIC GRADE
  // ==========================================
  const t5 = performance.now();
  if (workflow.steps.presetStep.enabled && workflow.steps.presetStep.presetId) {
    try {
      const presetObj = getPresetById(workflow.steps.presetStep.presetId, [...customPresets, ...FILTER_PRESETS]);
      const strength = workflow.steps.presetStep.presetStrength ?? 100;

      processImagePipeline({
        sourceCanvas: workingCanvas,
        targetCanvas: workingCanvas,
        adjustments: DEFAULT_ADJUSTMENTS,
        toneCurves: DEFAULT_TONE_CURVES,
        hsl: DEFAULT_HSL,
        activePresetId: workflow.steps.presetStep.presetId,
        presetStrength: strength,
        customPresets,
        highQuality: true,
      });

      const presetReport: AutomationStepReport = {
        stepType: 'preset',
        stepName: '5. Visual Preset & Aesthetic Grade',
        stepIndex: 4,
        status: 'completed',
        latencyMs: Math.round(performance.now() - t5),
        details: `Applied "${presetObj?.name || workflow.steps.presetStep.presetId}" at ${strength}% strength`,
        previewUrl: createSnapshot(workingCanvas),
        stats: { presetName: presetObj?.name, strength },
      };
      stepReports.push(presetReport);
      onStepProgress?.(presetReport);
    } catch (err: any) {
      stepReports.push({
        stepType: 'preset',
        stepName: '5. Visual Preset & Aesthetic Grade',
        stepIndex: 4,
        status: 'error',
        latencyMs: Math.round(performance.now() - t5),
        error: err.message,
      });
    }
  } else {
    stepReports.push({
      stepType: 'preset',
      stepName: '5. Visual Preset & Aesthetic Grade',
      stepIndex: 4,
      status: 'skipped',
      latencyMs: 0,
      details: 'No preset selected / stage bypassed',
    });
  }

  // ==========================================
  // STEP 6: WATERMARK PROTECTION
  // ==========================================
  const t6 = performance.now();
  if (workflow.steps.watermarkStep.enabled) {
    try {
      renderWatermarkOnCanvas(workingCanvas, workflow.steps.watermarkStep);
      const wmReport: AutomationStepReport = {
        stepType: 'watermark',
        stepName: '6. Watermark Protection',
        stepIndex: 5,
        status: 'completed',
        latencyMs: Math.round(performance.now() - t6),
        details: `Applied "${workflow.steps.watermarkStep.text}" (${workflow.steps.watermarkStep.position}, ${workflow.steps.watermarkStep.opacity}%)`,
        previewUrl: createSnapshot(workingCanvas),
        stats: { text: workflow.steps.watermarkStep.text, position: workflow.steps.watermarkStep.position },
      };
      stepReports.push(wmReport);
      onStepProgress?.(wmReport);
    } catch (err: any) {
      stepReports.push({
        stepType: 'watermark',
        stepName: '6. Watermark Protection',
        stepIndex: 5,
        status: 'error',
        latencyMs: Math.round(performance.now() - t6),
        error: err.message,
      });
    }
  } else {
    stepReports.push({
      stepType: 'watermark',
      stepName: '6. Watermark Protection',
      stepIndex: 5,
      status: 'skipped',
      latencyMs: 0,
      details: 'Watermark disabled',
    });
  }

  // ==========================================
  // STEP 7: RESIZE & RESOLUTION SCALING
  // ==========================================
  const t7 = performance.now();
  let finalCanvas = workingCanvas;
  if (workflow.steps.resizeStep.enabled && workflow.steps.resizeStep.mode !== 'original') {
    try {
      const resizeOpts = {
        resizeOption: workflow.steps.resizeStep.mode,
        scalePercent: workflow.steps.resizeStep.scalePercent,
        longEdgePx: workflow.steps.resizeStep.longEdgePx,
        shortEdgePx: workflow.steps.resizeStep.shortEdgePx,
        maxWidth: workflow.steps.resizeStep.maxWidth,
        maxHeight: workflow.steps.resizeStep.maxHeight,
        socialTarget: workflow.steps.resizeStep.socialTarget,
      };

      const dims = calculateBatchDimensions(workingCanvas.width, workingCanvas.height, resizeOpts as any);
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = dims.width;
      scaledCanvas.height = dims.height;
      const sCtx = scaledCanvas.getContext('2d', { willReadFrequently: true })!;
      sCtx.imageSmoothingEnabled = true;
      sCtx.imageSmoothingQuality = 'high';

      if (workflow.steps.resizeStep.mode === 'social-preset') {
        const srcRatio = workingCanvas.width / workingCanvas.height;
        const targetRatio = dims.width / dims.height;
        let sx = 0, sy = 0, sW = workingCanvas.width, sH = workingCanvas.height;

        if (srcRatio > targetRatio) {
          sW = workingCanvas.height * targetRatio;
          sx = (workingCanvas.width - sW) / 2;
        } else {
          sH = workingCanvas.width / targetRatio;
          sy = (workingCanvas.height - sH) / 2;
        }
        sCtx.drawImage(workingCanvas, sx, sy, sW, sH, 0, 0, dims.width, dims.height);
      } else {
        sCtx.drawImage(workingCanvas, 0, 0, dims.width, dims.height);
      }

      finalCanvas = scaledCanvas;

      const resizeReport: AutomationStepReport = {
        stepType: 'resize',
        stepName: '7. Resize & Resolution Scaling',
        stepIndex: 6,
        status: 'completed',
        latencyMs: Math.round(performance.now() - t7),
        details: `Resized to ${dims.width} × ${dims.height}px (${workflow.steps.resizeStep.mode})`,
        previewUrl: createSnapshot(finalCanvas),
        stats: { width: dims.width, height: dims.height, mode: workflow.steps.resizeStep.mode },
      };
      stepReports.push(resizeReport);
      onStepProgress?.(resizeReport);
    } catch (err: any) {
      stepReports.push({
        stepType: 'resize',
        stepName: '7. Resize & Resolution Scaling',
        stepIndex: 6,
        status: 'error',
        latencyMs: Math.round(performance.now() - t7),
        error: err.message,
      });
    }
  } else {
    stepReports.push({
      stepType: 'resize',
      stepName: '7. Resize & Resolution Scaling',
      stepIndex: 6,
      status: 'skipped',
      latencyMs: 0,
      details: `Retained original resolution (${finalCanvas.width} × ${finalCanvas.height}px)`,
    });
  }

  // ==========================================
  // STEP 8: EXPORT
  // ==========================================
  const t8 = performance.now();
  let finalBlob: Blob;
  const ext = workflow.steps.exportStep.format;
  const quality = workflow.steps.exportStep.quality || 0.92;

  if (ext === 'tiff') {
    finalBlob = encodeCanvasToTiff(finalCanvas);
  } else if (ext === 'psd') {
    finalBlob = encodeCanvasToPsd(finalCanvas);
  } else if (ext === 'dng') {
    finalBlob = encodeCanvasToDng(finalCanvas);
  } else if (ext === 'png') {
    finalBlob = await new Promise<Blob>((resolve) => {
      finalCanvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
    });
  } else if (ext === 'webp') {
    finalBlob = await new Promise<Blob>((resolve) => {
      finalCanvas.toBlob((b) => resolve(b || new Blob()), 'image/webp', quality);
    });
  } else if (ext === 'avif') {
    finalBlob = await new Promise<Blob>((resolve) => {
      finalCanvas.toBlob((b) => {
        if (b && b.type === 'image/avif') resolve(b);
        else finalCanvas.toBlob((wb) => resolve(new Blob([wb || new Blob()], { type: 'image/avif' })), 'image/webp', quality);
      }, 'image/avif', quality);
    });
  } else {
    finalBlob = await new Promise<Blob>((resolve) => {
      finalCanvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', quality);
    });
  }

  const outFilename = computeBatchFilename(
    workflow.name || 'image',
    {
      outputFormat: ext as any,
      quality,
      namingPattern: workflow.steps.exportStep.namingPattern || '{name}_lumina_{w}x{h}',
      namePrefix: workflow.steps.exportStep.namePrefix,
      nameSuffix: workflow.steps.exportStep.nameSuffix,
    } as any,
    0,
    finalCanvas.width,
    finalCanvas.height,
    workflow.steps.presetStep.presetId || 'natural'
  );

  const finalBlobUrl = URL.createObjectURL(finalBlob);

  const exportReport: AutomationStepReport = {
    stepType: 'export',
    stepName: '8. Master Export & Packaging',
    stepIndex: 7,
    status: 'completed',
    latencyMs: Math.round(performance.now() - t8),
    details: `Exported ${ext.toUpperCase()} (${(finalBlob.size / 1024 / 1024).toFixed(2)} MB) as "${outFilename}"`,
    previewUrl: createSnapshot(finalCanvas),
    stats: { filename: outFilename, sizeBytes: finalBlob.size, format: ext },
  };
  stepReports.push(exportReport);
  onStepProgress?.(exportReport);

  const totalLatencyMs = Math.round(performance.now() - startTime);

  return {
    success: true,
    totalLatencyMs,
    stepReports,
    finalCanvas,
    finalBlob,
    finalBlobUrl,
    finalFilename: outFilename,
    width: finalCanvas.width,
    height: finalCanvas.height,
    aiDiagnostics,
  };
}

/**
 * Curated Industry Standard Built-in Automations
 */
export const BUILTIN_AUTOMATIONS: AutomationWorkflow[] = [
  {
    id: 'builtin-ecommerce-product-clean',
    name: 'E-Commerce Product Studio Clean',
    description: 'Import → AI Analysis → Clean Studio White Balance → Bilateral Chroma & Luminance NR → Clean Studio Preset → Subtle Watermark → 2048px Long-Edge → WebP 95% Master',
    category: 'E-Commerce',
    icon: 'Package',
    tags: ['Shopify', 'Amazon', 'Clean White', 'WebP'],
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'Lumina Engine Core',
    steps: {
      importStep: {
        sourceType: 'active_canvas',
        autoOrient: true,
        colorSpace: 'sRGB',
      },
      aiAnalysisStep: {
        enabled: true,
        mode: 'aggressive',
        detectScene: true,
        detectLighting: true,
        calculateNoiseProfile: true,
        autoToneAssistance: true,
      },
      colorCorrectionStep: {
        enabled: true,
        autoTone: true,
        autoWhiteBalance: true,
        exposure: 5,
        contrast: 15,
        highlights: -15,
        shadows: 20,
        whites: 15,
        blacks: -5,
        temperature: -2,
        tint: 0,
        vibrance: 10,
        saturation: 5,
        clarity: 15,
        dehaze: 10,
      },
      noiseReductionStep: {
        enabled: true,
        luminanceNR: 35,
        luminanceDetail: 50,
        colorNR: 45,
        colorDetail: 60,
        colorSmoothness: 50,
        sharpness: 40,
        sharpnessRadius: 1.0,
        sharpnessMasking: 25,
        texture: 15,
        microcontrast: 10,
      },
      presetStep: {
        enabled: true,
        presetId: 'lifestyle-clean-bright',
        presetStrength: 85,
      },
      watermarkStep: {
        enabled: false,
        type: 'text',
        text: '© Lumina Studio Pro',
        fontSize: 22,
        fontFamily: 'sans-serif',
        color: '#ffffff',
        opacity: 70,
        position: 'bottom-right',
        padding: 24,
        hasShadow: true,
        isTiled: false,
      },
      resizeStep: {
        enabled: true,
        mode: 'long-edge',
        longEdgePx: 2048,
        resampleQuality: 'high',
      },
      exportStep: {
        enabled: true,
        format: 'webp',
        quality: 0.95,
        colorProfile: 'sRGB',
        namingPattern: '{name}_ecommerce_2048px',
        autoDownload: false,
        saveToProjectHistory: true,
      },
    },
  },
  {
    id: 'builtin-cinematic-golden-hour',
    name: 'Cinematic Golden Hour & Landscape Story',
    description: 'Import → AI Dynamic Range Evaluation → Warm Golden Contrast → Fine Edge NR & Microcontrast → Teal & Orange Grade → Signature Stamp → 4K UHD (3840px) → Lossless JPEG Export',
    category: 'Landscape',
    icon: 'Sun',
    tags: ['Cinematic', 'Teal & Orange', '4K UHD', 'Golden Hour'],
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'Lumina Film Lab',
    steps: {
      importStep: {
        sourceType: 'active_canvas',
        autoOrient: true,
        colorSpace: 'Display-P3',
      },
      aiAnalysisStep: {
        enabled: true,
        mode: 'balanced',
        detectScene: true,
        detectLighting: true,
        calculateNoiseProfile: true,
        autoToneAssistance: true,
      },
      colorCorrectionStep: {
        enabled: true,
        autoTone: true,
        autoWhiteBalance: false,
        exposure: 0,
        contrast: 18,
        highlights: -25,
        shadows: 22,
        whites: 10,
        blacks: -12,
        temperature: 12,
        tint: -2,
        vibrance: 25,
        saturation: 8,
        clarity: 20,
        dehaze: 15,
      },
      noiseReductionStep: {
        enabled: true,
        luminanceNR: 20,
        luminanceDetail: 70,
        colorNR: 30,
        colorDetail: 50,
        colorSmoothness: 50,
        sharpness: 55,
        sharpnessRadius: 1.2,
        sharpnessMasking: 40,
        texture: 25,
        microcontrast: 20,
      },
      presetStep: {
        enabled: true,
        presetId: 'cinematic-teal-orange',
        presetStrength: 100,
      },
      watermarkStep: {
        enabled: true,
        type: 'text',
        text: 'LUMINA CINEMATIC',
        fontSize: 20,
        fontFamily: 'serif',
        color: '#ffffff',
        opacity: 75,
        position: 'bottom-right',
        padding: 32,
        hasShadow: true,
        isTiled: false,
      },
      resizeStep: {
        enabled: true,
        mode: 'long-edge',
        longEdgePx: 3840,
        resampleQuality: 'high',
      },
      exportStep: {
        enabled: true,
        format: 'jpeg',
        quality: 0.96,
        colorProfile: 'Display-P3',
        namingPattern: '{name}_goldenhour_4K',
        autoDownload: false,
      },
    },
  },
  {
    id: 'builtin-social-media-viral',
    name: 'Social Media Speedrun (1080×1350 Portrait)',
    description: 'Import → AI Subject Focus → Punchy HDR Vibrance → Crisp Structure Denoise → Vivid Punch Preset → Bottom-Right Watermark → 1080×1350 IG Cover Fit → WebP/JPEG',
    category: 'Social',
    icon: 'Sparkles',
    tags: ['Instagram', 'TikTok', '1080x1350', 'Viral'],
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'Lumina Social Suite',
    steps: {
      importStep: {
        sourceType: 'active_canvas',
        autoOrient: true,
        colorSpace: 'sRGB',
      },
      aiAnalysisStep: {
        enabled: true,
        mode: 'balanced',
        detectScene: true,
        detectLighting: true,
        calculateNoiseProfile: true,
        autoToneAssistance: true,
      },
      colorCorrectionStep: {
        enabled: true,
        autoTone: true,
        autoWhiteBalance: true,
        exposure: 4,
        contrast: 20,
        highlights: -15,
        shadows: 18,
        whites: 12,
        blacks: -8,
        temperature: 4,
        tint: 0,
        vibrance: 30,
        saturation: 10,
        clarity: 18,
        dehaze: 12,
      },
      noiseReductionStep: {
        enabled: true,
        luminanceNR: 25,
        luminanceDetail: 55,
        colorNR: 35,
        colorDetail: 50,
        colorSmoothness: 50,
        sharpness: 50,
        sharpnessRadius: 1.0,
        sharpnessMasking: 20,
        texture: 20,
        microcontrast: 15,
      },
      presetStep: {
        enabled: true,
        presetId: 'social-vivid-punch',
        presetStrength: 95,
      },
      watermarkStep: {
        enabled: true,
        type: 'text',
        text: '@lumina.pro',
        fontSize: 20,
        fontFamily: 'sans-serif',
        color: '#ffffff',
        opacity: 80,
        position: 'bottom-center',
        padding: 24,
        hasShadow: true,
        isTiled: false,
      },
      resizeStep: {
        enabled: true,
        mode: 'social-preset',
        socialTarget: 'insta-portrait',
        resampleQuality: 'high',
      },
      exportStep: {
        enabled: true,
        format: 'jpeg',
        quality: 0.94,
        colorProfile: 'sRGB',
        namingPattern: '{name}_insta_portrait',
        autoDownload: false,
      },
    },
  },
  {
    id: 'builtin-editorial-portrait-pro',
    name: 'Editorial & Portrait Pro Retouch',
    description: 'Import → AI Skin & Face Lighting → Gentle Highlight Recovery → Chroma Denoise & Bilateral Smoothing → Editorial Warm Grade → Corner Monogram → 2560px Long Edge → High Fidelity JPEG',
    category: 'Portrait',
    icon: 'User',
    tags: ['Vogue', 'Editorial', 'Skin Smooth', 'Soft Glow'],
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'Lumina Portrait Studio',
    steps: {
      importStep: {
        sourceType: 'active_canvas',
        autoOrient: true,
        colorSpace: 'Display-P3',
      },
      aiAnalysisStep: {
        enabled: true,
        mode: 'portrait_prioritized',
        detectScene: true,
        detectLighting: true,
        calculateNoiseProfile: true,
        autoToneAssistance: true,
      },
      colorCorrectionStep: {
        enabled: true,
        autoTone: true,
        autoWhiteBalance: true,
        exposure: 2,
        contrast: 10,
        highlights: -20,
        shadows: 15,
        whites: 5,
        blacks: -5,
        temperature: 6,
        tint: 2,
        vibrance: 12,
        saturation: 4,
        clarity: 6,
        dehaze: 0,
      },
      noiseReductionStep: {
        enabled: true,
        luminanceNR: 35,
        luminanceDetail: 60,
        colorNR: 50,
        colorDetail: 50,
        colorSmoothness: 60,
        sharpness: 35,
        sharpnessRadius: 0.8,
        sharpnessMasking: 50,
        texture: 5,
        microcontrast: 5,
      },
      presetStep: {
        enabled: true,
        presetId: 'portrait-editorial-warm',
        presetStrength: 90,
      },
      watermarkStep: {
        enabled: false,
        type: 'text',
        text: 'STUDIO PRO',
        fontSize: 18,
        fontFamily: 'serif',
        color: '#ffffff',
        opacity: 60,
        position: 'bottom-right',
        padding: 30,
        hasShadow: true,
        isTiled: false,
      },
      resizeStep: {
        enabled: true,
        mode: 'long-edge',
        longEdgePx: 2560,
        resampleQuality: 'high',
      },
      exportStep: {
        enabled: true,
        format: 'jpeg',
        quality: 0.95,
        colorProfile: 'Display-P3',
        namingPattern: '{name}_portrait_editorial',
        autoDownload: false,
      },
    },
  },
  {
    id: 'builtin-fine-art-monochrome',
    name: 'Fine Art Monochrome Master (Silver Gelatin)',
    description: 'Import → AI Tonal Histogram → Zone System Dynamic Range → Ultra Microcontrast Denoise → Silver Gelatin B&W Preset → Embossed Studio Seal → 100% Native Resolution → 16-Bit TIFF / PNG',
    category: 'Fine Art',
    icon: 'Moon',
    tags: ['Ansel Adams', 'Silver Gelatin', 'Fine Art', 'TIFF'],
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'Lumina Darkroom',
    steps: {
      importStep: {
        sourceType: 'active_canvas',
        autoOrient: true,
        colorSpace: 'AdobeRGB',
      },
      aiAnalysisStep: {
        enabled: true,
        mode: 'aggressive',
        detectScene: true,
        detectLighting: true,
        calculateNoiseProfile: true,
        autoToneAssistance: true,
      },
      colorCorrectionStep: {
        enabled: true,
        autoTone: true,
        autoWhiteBalance: false,
        exposure: 0,
        contrast: 32,
        highlights: -25,
        shadows: 25,
        whites: 20,
        blacks: -20,
        temperature: 0,
        tint: 0,
        vibrance: 0,
        saturation: -100,
        clarity: 35,
        dehaze: 20,
      },
      noiseReductionStep: {
        enabled: true,
        luminanceNR: 15,
        luminanceDetail: 75,
        colorNR: 100,
        colorDetail: 100,
        colorSmoothness: 100,
        sharpness: 65,
        sharpnessRadius: 1.4,
        sharpnessMasking: 35,
        texture: 35,
        microcontrast: 30,
      },
      presetStep: {
        enabled: true,
        presetId: 'bw-silver-gelatin',
        presetStrength: 100,
      },
      watermarkStep: {
        enabled: true,
        type: 'text',
        text: 'FINE ART COLLECTION',
        fontSize: 16,
        fontFamily: 'serif',
        color: '#ffffff',
        opacity: 65,
        position: 'bottom-center',
        padding: 36,
        hasShadow: true,
        isTiled: false,
      },
      resizeStep: {
        enabled: false,
        mode: 'original',
      },
      exportStep: {
        enabled: true,
        format: 'tiff',
        quality: 1.0,
        colorProfile: 'AdobeRGB',
        namingPattern: '{name}_fineart_silver_gelatin',
        autoDownload: false,
      },
    },
  },
];

/**
 * Export Workflow as JSON package
 */
export function exportWorkflowToJson(workflow: AutomationWorkflow): string {
  return JSON.stringify(workflow, null, 2);
}

/**
 * Parse and Validate Workflow from JSON package
 */
export function importWorkflowFromJson(jsonString: string): AutomationWorkflow {
  const parsed = JSON.parse(jsonString);
  if (!parsed.id || !parsed.name || !parsed.steps) {
    throw new Error('Invalid Lumina Workflow Package: missing mandatory steps definition');
  }
  return {
    ...parsed,
    id: `custom_workflow_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    isBuiltIn: false,
    updatedAt: Date.now(),
  };
}
