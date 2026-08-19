import {
  AdjustmentSettings,
  ToneCurves,
  HSLSettings,
  CurvePoint,
  BorderSettings,
  WatermarkSettings,
  SelectiveMask,
  FilterPreset,
  RetouchStroke,
  TypographyItem,
  DesignElementItem,
  DrawingStroke,
  ColorManagementSettings,
} from '../types/editor';
import { FILTER_PRESETS, getPresetById } from './presets';
import { getPresetLUT, parseCubeLUT, sample3DLUT, Parsed3DLUT } from './lutEngine';
import { getCameraProfile, applyCameraProfilePixel } from './cameraProfiles';
import { kelvinAndTintToRGBGains, applyRawExposureRecovery, applyDemosaicAndMoire } from './rawEngine';
import { applyLensDistortion, applyChromaticAberrationCorrection, applyLensVignetteCorrection } from './opticsEngine';
import { applyDetailAndNoisePipeline } from './detailEngine';
import { applyAIDepthAdjustments } from './depthEngine';
import { applyBlurAndDepthPipeline } from './blurEngine';
import { applySelectiveMasksPipeline } from './selectiveEngine';
import { applyRetouchStrokesPipeline } from './retouchEngine';
import { compositeTypographyStack } from './typographyEngine';
import { compositeDesignStack } from './designEngine';
import { compositeDrawingStack } from './drawingEngine';
import { applySoftProofingToCanvas, applyBitDepthPipeline, applyHdrDisplayHeadroom } from './colorManagementEngine';

// Cached custom LUT parsing for performance
let lastCustomCubeText: string | null = null;
let lastCustomParsedLUT: Parsed3DLUT | null = null;

// Monotonic Cubic Spline Interpolation for Tone Curves
function createSplineLUT(points: CurvePoint[]): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256);
  if (!points || points.length === 0) {
    for (let i = 0; i < 256; i++) lut[i] = i;
    return lut;
  }

  // Sort points by X ascending
  const sorted = [...points].sort((a, b) => a.x - b.x);

  // If only 1 point or degenerate, return linear
  if (sorted.length < 2) {
    for (let i = 0; i < 256; i++) lut[i] = i;
    return lut;
  }

  const n = sorted.length;
  const x = sorted.map((p) => p.x);
  const y = sorted.map((p) => p.y);

  // Slopes of secant lines
  const d = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    const dx = x[i + 1] - x[i];
    d[i] = dx === 0 ? 0 : (y[i + 1] - y[i]) / dx;
  }

  // Tangents at control points
  const m = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    m[i] = (d[i - 1] + d[i]) / 2;
  }

  // Evaluate spline for all 256 integer levels
  for (let val = 0; val < 256; val++) {
    if (val <= x[0]) {
      lut[val] = Math.max(0, Math.min(255, Math.round(y[0])));
      continue;
    }
    if (val >= x[n - 1]) {
      lut[val] = Math.max(0, Math.min(255, Math.round(y[n - 1])));
      continue;
    }

    // Find interval [x[i], x[i+1]]
    let i = 0;
    while (i < n - 1 && val > x[i + 1]) {
      i++;
    }

    const h = x[i + 1] - x[i];
    if (h === 0) {
      lut[val] = Math.max(0, Math.min(255, Math.round(y[i])));
      continue;
    }

    const t = (val - x[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;

    // Hermite basis functions
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    const interpolatedY = h00 * y[i] + h10 * h * m[i] + h01 * y[i + 1] + h11 * h * m[i + 1];
    lut[val] = Math.max(0, Math.min(255, Math.round(interpolatedY)));
  }

  return lut;
}

// Parametric Tone Curve LUT Generator (Highlights, Lights, Darks, Shadows)
function createParametricCurveLUT(p?: { highlights: number; lights: number; darks: number; shadows: number }): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256);
  if (!p || (p.highlights === 0 && p.lights === 0 && p.darks === 0 && p.shadows === 0)) {
    for (let i = 0; i < 256; i++) lut[i] = i;
    return lut;
  }

  const hAdj = (p.highlights || 0) * 0.4;
  const lAdj = (p.lights || 0) * 0.45;
  const dAdj = (p.darks || 0) * 0.45;
  const sAdj = (p.shadows || 0) * 0.4;

  const points: CurvePoint[] = [
    { x: 0, y: Math.max(0, Math.min(255, sAdj * 0.4)) },
    { x: 64, y: Math.max(0, Math.min(255, 64 + sAdj * 0.6 + dAdj * 0.5)) },
    { x: 128, y: Math.max(0, Math.min(255, 128 + dAdj * 0.5 + lAdj * 0.5)) },
    { x: 192, y: Math.max(0, Math.min(255, 192 + lAdj * 0.5 + hAdj * 0.6)) },
    { x: 255, y: Math.max(0, Math.min(255, 255 + hAdj * 0.4)) },
  ];

  return createSplineLUT(points);
}

// Convert RGB to HSL (H: 0-360, S: 0-1, L: 0-1)
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return [h, s, l];
}

// Convert HSL to RGB (R, G, B in 0-255)
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

// Determine dominant HSL color channel weight
function getHslWeights(h: number): Record<string, number> {
  // Hue ranges: Red: 345-15, Orange: 15-45, Yellow: 45-75, Green: 75-150, Aqua: 150-195, Blue: 195-255, Purple: 255-295, Magenta: 295-345
  const normH = ((h % 360) + 360) % 360;
  const centers: Record<string, number> = {
    red: 0,
    orange: 30,
    yellow: 60,
    green: 120,
    aqua: 180,
    blue: 230,
    purple: 280,
    magenta: 320,
  };

  const weights: Record<string, number> = {};
  let totalWeight = 0;

  for (const [key, center] of Object.entries(centers)) {
    let diff = Math.abs(normH - center);
    if (diff > 180) diff = 360 - diff;
    // Gaussian-like falloff
    const w = Math.max(0, 1 - diff / 40);
    weights[key] = w;
    totalWeight += w;
  }

  if (totalWeight > 0) {
    for (const key in weights) {
      weights[key] /= totalWeight;
    }
  }

  return weights;
}

export interface RenderPipelineParams {
  sourceCanvas: HTMLCanvasElement | HTMLImageElement;
  targetCanvas: HTMLCanvasElement;
  adjustments: AdjustmentSettings;
  toneCurves: ToneCurves;
  hsl: HSLSettings;
  activePresetId?: string | null;
  presetStrength?: number;
  customPresets?: FilterPreset[];
  watermark?: WatermarkSettings;
  border?: BorderSettings;
  masks?: SelectiveMask[];
  retouchStrokes?: RetouchStroke[];
  typography?: TypographyItem[];
  designElements?: DesignElementItem[];
  drawingStrokes?: DrawingStroke[];
  colorManagement?: ColorManagementSettings;
  // If true, apply high quality effects like unsharp mask sharpness
  highQuality?: boolean;
}

export function processImagePipeline(params: RenderPipelineParams) {
  const {
    sourceCanvas,
    targetCanvas,
    adjustments: baseAdjustments,
    toneCurves,
    hsl: baseHsl,
    activePresetId,
    presetStrength = 100,
    customPresets = [],
    watermark,
    border,
    masks = [],
    retouchStrokes = [],
    typography = [],
    designElements = [],
    drawingStrokes = [],
    colorManagement,
    highQuality = true,
  } = params;

  // Merge active preset into adjustments if present
  let adjustments = { ...baseAdjustments };
  let hsl = { ...baseHsl };
  let activePreset: FilterPreset | undefined;

  if (activePresetId) {
    activePreset = getPresetById(activePresetId, customPresets);
    if (activePreset) {
      const factor = presetStrength / 100;
      const pSet = activePreset.settings;
      if (pSet.exposure !== undefined) adjustments.exposure += pSet.exposure * factor;
      if (pSet.contrast !== undefined) adjustments.contrast += pSet.contrast * factor;
      if (pSet.highlights !== undefined) adjustments.highlights += pSet.highlights * factor;
      if (pSet.shadows !== undefined) adjustments.shadows += pSet.shadows * factor;
      if (pSet.whites !== undefined) adjustments.whites += pSet.whites * factor;
      if (pSet.blacks !== undefined) adjustments.blacks += pSet.blacks * factor;
      if (pSet.temperature !== undefined) adjustments.temperature += pSet.temperature * factor;
      if (pSet.tint !== undefined) adjustments.tint += pSet.tint * factor;
      if (pSet.saturation !== undefined) adjustments.saturation += pSet.saturation * factor;
      if (pSet.vibrance !== undefined) adjustments.vibrance += pSet.vibrance * factor;
      if (pSet.clarity !== undefined) adjustments.clarity += pSet.clarity * factor;
      if (pSet.texture !== undefined) adjustments.texture = (adjustments.texture || 0) + pSet.texture * factor;
      if (pSet.sharpness !== undefined) adjustments.sharpness += pSet.sharpness * factor;
      if (pSet.dehaze !== undefined) adjustments.dehaze = (adjustments.dehaze || 0) + pSet.dehaze * factor;
      if (pSet.filmGrain !== undefined) adjustments.filmGrain += pSet.filmGrain * factor;
      if (pSet.filmGrainSize !== undefined) adjustments.filmGrainSize = pSet.filmGrainSize;
      if (pSet.vignette !== undefined) adjustments.vignette += pSet.vignette * factor;
      if (pSet.splitToning) {
        adjustments.splitToning = {
          shadowHue: pSet.splitToning.shadowHue,
          shadowSat: (pSet.splitToning.shadowSat || 0) * factor,
          highlightHue: pSet.splitToning.highlightHue,
          highlightSat: (pSet.splitToning.highlightSat || 0) * factor,
          balance: pSet.splitToning.balance,
        };
      }

      // Merge preset HSL if present
      if (activePreset.hsl) {
        const mergedHsl: any = { ...hsl };
        for (const [chan, vals] of Object.entries(activePreset.hsl)) {
          if (vals && mergedHsl[chan]) {
            mergedHsl[chan] = {
              hue: mergedHsl[chan].hue + (vals.hue || 0) * factor,
              saturation: mergedHsl[chan].saturation + (vals.saturation || 0) * factor,
              luminance: mergedHsl[chan].luminance + (vals.luminance || 0) * factor,
            };
          }
        }
        hsl = mergedHsl;
      }
    }
  }

  const srcWidth = sourceCanvas instanceof HTMLImageElement ? sourceCanvas.naturalWidth : sourceCanvas.width;
  const srcHeight = sourceCanvas instanceof HTMLImageElement ? sourceCanvas.naturalHeight : sourceCanvas.height;

  if (targetCanvas.width !== srcWidth || targetCanvas.height !== srcHeight) {
    targetCanvas.width = srcWidth;
    targetCanvas.height = srcHeight;
  }

  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  // Draw initial source
  ctx.drawImage(sourceCanvas, 0, 0, srcWidth, srcHeight);
  const imageData = ctx.getImageData(0, 0, srcWidth, srcHeight);
  const data = imageData.data;
  const len = data.length;

  // Precompute Curve LUTs
  const masterLUT = toneCurves?.mode === 'parametric'
    ? createParametricCurveLUT(toneCurves?.parametric)
    : createSplineLUT(toneCurves?.master || []);
  const redLUT = createSplineLUT(toneCurves?.red || []);
  const greenLUT = createSplineLUT(toneCurves?.green || []);
  const blueLUT = createSplineLUT(toneCurves?.blue || []);

  // Precompute Basic parameters
  // Exposure factor: -100 to 100 maps to 2^(exposure / 50)
  const exposureMult = Math.pow(2, (adjustments.exposure || 0) / 50);
  const brightnessOffset = ((adjustments.brightness || 0) / 100) * 128;
  const contrastFactor = Math.tan((((adjustments.contrast || 0) + 100) * Math.PI) / 400); // 0 to infinity
  const highlightsAdj = (adjustments.highlights || 0) / 100;
  const shadowsAdj = (adjustments.shadows || 0) / 100;
  const whitesAdj = (adjustments.whites || 0) / 100;
  const blacksAdj = (adjustments.blacks || 0) / 100;

  // Advanced tonal parameters
  const gammaExp = Math.pow(2, -(adjustments.gamma || 0) / 50); // >1 brightens midtones, <1 darkens
  const midtonesAdj = (adjustments.midtones || 0) / 100;
  const hdrAmount = (adjustments.hdr || 0) / 100;
  const brillianceAdj = (adjustments.brilliance || 0) / 100;
  const fadeAmount = (adjustments.fade || 0) / 100;
  const bpMin = ((adjustments.blackPoint || 0) / 100) * 80;
  const wpMax = 255 - ((100 - (adjustments.whitePoint ?? 100)) / 100) * 80;
  const dehazeVal = (adjustments.dehaze || 0) / 100;

  // Color temperature & tint balance
  const temp = (adjustments.temperature || 0) / 100; // -1 to 1
  const tintVal = (adjustments.tint || 0) / 100;     // -1 to 1
  const rTempMult = temp > 0 ? 1 + temp * 0.4 : 1;
  const bTempMult = temp < 0 ? 1 + Math.abs(temp) * 0.4 : 1;
  const gTintMult = tintVal < 0 ? 1 + Math.abs(tintVal) * 0.3 : 1;
  const rbTintMult = tintVal > 0 ? 1 + tintVal * 0.25 : 1;

  // Saturation & Vibrance
  const satMult = 1 + (adjustments.saturation || 0) / 100;
  const vibranceVal = (adjustments.vibrance || 0) / 100;

  // Split toning
  const st = adjustments.splitToning || { shadowHue: 210, shadowSat: 0, highlightHue: 40, highlightSat: 0, balance: 0 };
  const hasSplitToning = (st.shadowSat > 0 || st.highlightSat > 0);
  const [stShadowR, stShadowG, stShadowB] = hasSplitToning && st.shadowSat > 0
    ? hslToRgb(st.shadowHue, 1, 0.5)
    : [0, 0, 0];
  const [stHighR, stHighG, stHighB] = hasSplitToning && st.highlightSat > 0
    ? hslToRgb(st.highlightHue, 1, 0.5)
    : [255, 255, 255];

  // Color Balance (Cyan-Red, Magenta-Green, Yellow-Blue)
  const cb = adjustments.colorBalance;
  const hasColorBalance = cb && (
    cb.shadows.cyanRed !== 0 || cb.shadows.magentaGreen !== 0 || cb.shadows.yellowBlue !== 0 ||
    cb.midtones.cyanRed !== 0 || cb.midtones.magentaGreen !== 0 || cb.midtones.yellowBlue !== 0 ||
    cb.highlights.cyanRed !== 0 || cb.highlights.magentaGreen !== 0 || cb.highlights.yellowBlue !== 0
  );

  // 3-Way Color Wheels
  const cw = adjustments.colorWheels;
  const hasColorWheels = cw && (
    (cw.shadows && (cw.shadows.sat > 0 || cw.shadows.lum !== 0)) ||
    (cw.midtones && (cw.midtones.sat > 0 || cw.midtones.lum !== 0)) ||
    (cw.highlights && (cw.highlights.sat > 0 || cw.highlights.lum !== 0)) ||
    (cw.global && (cw.global.sat > 0 || cw.global.lum !== 0))
  );

  const [cwShadowR, cwShadowG, cwShadowB] = cw?.shadows?.sat ? hslToRgb(cw.shadows.hue, 1, 0.5) : [128, 128, 128];
  const [cwMidR, cwMidG, cwMidB] = cw?.midtones?.sat ? hslToRgb(cw.midtones.hue, 1, 0.5) : [128, 128, 128];
  const [cwHighR, cwHighG, cwHighB] = cw?.highlights?.sat ? hslToRgb(cw.highlights.hue, 1, 0.5) : [128, 128, 128];
  const [cwGlobalR, cwGlobalG, cwGlobalB] = cw?.global?.sat ? hslToRgb(cw.global.hue, 1, 0.5) : [128, 128, 128];

  // Global Hue shift
  const globalHueShift = adjustments.globalHue || 0;

  // Selective Colors & Color Replacement
  const selectiveList = (adjustments.selectiveColors || []).filter(
    (sc) => sc.shiftHue !== 0 || sc.shiftSat !== 0 || sc.shiftLum !== 0
  );
  const cr = adjustments.colorReplacement;
  const hasColorReplacement = cr && cr.enabled;

  // 3D LUT Setup
  const lutConf = adjustments.lutSettings;
  let active3DLUT: Parsed3DLUT | null = null;
  const lutIntensity = (lutConf?.enabled && lutConf?.intensity) ? lutConf.intensity / 100 : 0;

  if (lutIntensity > 0) {
    if (lutConf?.customCubeData) {
      if (lutConf.customCubeData === lastCustomCubeText && lastCustomParsedLUT) {
        active3DLUT = lastCustomParsedLUT;
      } else {
        active3DLUT = parseCubeLUT(lutConf.customCubeData);
        lastCustomCubeText = lutConf.customCubeData;
        lastCustomParsedLUT = active3DLUT;
      }
    } else if (lutConf?.lutId) {
      active3DLUT = getPresetLUT(lutConf.lutId);
    }
  }

  // RAW White Balance & Sensor Gains
  const rawDev = adjustments.rawDevelop;
  const rawKelvin = rawDev?.kelvin ?? 5500;
  const rawWbTint = rawDev?.wbTint ?? 10;
  const hasCustomRawWB = rawKelvin !== 5500 || rawWbTint !== 10;
  const [rawRGain, rawGGain, rawBGain] = hasCustomRawWB
    ? kelvinAndTintToRGBGains(rawKelvin, rawWbTint)
    : [1, 1, 1];

  const rawHighlightRec = rawDev?.highlightRecovery ?? 0;
  const rawShadowRec = rawDev?.shadowRecovery ?? 0;
  const rawBlackLevel = rawDev?.blackLevel ?? 0;
  const hasRawRecovery = rawHighlightRec > 0 || rawShadowRec > 0 || rawBlackLevel !== 0;

  // Camera Profile setup
  const camProfileConf = adjustments.cameraProfile;
  const camProfile = camProfileConf?.profileId ? getCameraProfile(camProfileConf.profileId) : null;
  const camProfileIntensity = camProfileConf?.intensity ?? 100;

  // Pixel Manipulation Main Loop
  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 0. RAW White Balance Sensor Gains
    if (hasCustomRawWB) {
      r *= rawRGain;
      g *= rawGGain;
      b *= rawBGain;
    }

    // 0.5 RAW Dynamic Range & Highlight / Shadow Recovery
    if (hasRawRecovery) {
      [r, g, b] = applyRawExposureRecovery(r, g, b, rawHighlightRec, rawShadowRec, rawBlackLevel);
    }

    // 1. Exposure
    if (adjustments.exposure) {
      r *= exposureMult;
      g *= exposureMult;
      b *= exposureMult;
    }

    // 2. White Balance / Temperature & Tint
    if (adjustments.temperature || adjustments.tint) {
      r = r * rTempMult * (tintVal > 0 ? rbTintMult : 1);
      g = g * gTintMult;
      b = b * bTempMult * (tintVal > 0 ? rbTintMult : 1);
    }

    // 3. Brightness & Contrast
    if (adjustments.brightness) {
      r += brightnessOffset;
      g += brightnessOffset;
      b += brightnessOffset;
    }

    if (adjustments.contrast) {
      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;
    }

    // 4. Dynamic Range: Highlights, Shadows, Whites, Blacks
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const normLum = Math.max(0, Math.min(1, lum / 255));

    // Highlights recovery / boost (targets upper range lum > 0.5)
    if (highlightsAdj !== 0) {
      const highWeight = Math.max(0, (normLum - 0.5) * 2);
      const highDelta = highlightsAdj * 50 * highWeight;
      r += highDelta;
      g += highDelta;
      b += highDelta;
    }

    // Shadows recovery / boost (targets lower range lum < 0.5)
    if (shadowsAdj !== 0) {
      const shadowWeight = Math.max(0, (0.5 - normLum) * 2);
      const shadowDelta = shadowsAdj * 50 * shadowWeight;
      r += shadowDelta;
      g += shadowDelta;
      b += shadowDelta;
    }

    // Whites & Blacks
    if (whitesAdj !== 0) {
      const whiteWeight = Math.pow(normLum, 2);
      const whiteDelta = whitesAdj * 40 * whiteWeight;
      r += whiteDelta;
      g += whiteDelta;
      b += whiteDelta;
    }

    if (blacksAdj !== 0) {
      const blackWeight = Math.pow(1 - normLum, 2);
      const blackDelta = blacksAdj * 40 * blackWeight;
      r += blackDelta;
      g += blackDelta;
      b += blackDelta;
    }

    // 5. Brilliance & HDR Tone Mapping
    if (brillianceAdj !== 0) {
      // Brilliance lifts deep shadows, enriches midtones, preserves highlight roll-off
      const shadowLift = Math.max(0, 1 - normLum * 1.6) * brillianceAdj * 45;
      const highlightTame = Math.max(0, (normLum - 0.7) * 3.33) * (-brillianceAdj * 30);
      const briDelta = shadowLift + highlightTame;
      r += briDelta;
      g += briDelta;
      b += briDelta;
    }

    if (hdrAmount > 0) {
      // HDR Tone Mapping: compress dynamic range logarithmically, lift shadows, pull blown highlights
      const toneMappedLum = Math.log(1 + normLum * 3) / Math.log(4);
      const hdrDelta = (toneMappedLum - normLum) * 255 * hdrAmount;
      r += hdrDelta;
      g += hdrDelta;
      b += hdrDelta;
    }

    // 6. Midtones & Gamma Curve
    if (midtonesAdj !== 0) {
      // Gaussian midtone bell curve peaking at normLum = 0.5
      const midWeight = Math.exp(-Math.pow((normLum - 0.5) / 0.28, 2));
      const midDelta = midtonesAdj * 40 * midWeight;
      r += midDelta;
      g += midDelta;
      b += midDelta;
    }

    if (adjustments.gamma && adjustments.gamma !== 0) {
      const gNormR = Math.pow(Math.max(0, Math.min(1, r / 255)), gammaExp) * 255;
      const gNormG = Math.pow(Math.max(0, Math.min(1, g / 255)), gammaExp) * 255;
      const gNormB = Math.pow(Math.max(0, Math.min(1, b / 255)), gammaExp) * 255;
      r = gNormR;
      g = gNormG;
      b = gNormB;
    }

    // 7. Dehaze (Removes atmospheric haze or adds dreamy haze)
    if (dehazeVal !== 0) {
      // Dehaze increases dark saturation and restores dark edge contrast
      const hazeDepth = 1 - normLum;
      const dehazeBoost = dehazeVal * 35 * hazeDepth;
      r = r * (1 + dehazeVal * 0.15) - dehazeBoost * 0.4;
      g = g * (1 + dehazeVal * 0.15) - dehazeBoost * 0.4;
      b = b * (1 + dehazeVal * 0.15) - dehazeBoost * 0.4;
    }

    // 8. Black Point & White Point Clipping Levels
    if (bpMin > 0 || wpMax < 255) {
      const span = Math.max(1, wpMax - bpMin);
      r = ((r - bpMin) / span) * 255;
      g = ((g - bpMin) / span) * 255;
      b = ((b - bpMin) / span) * 255;
    }

    // 9. Film Matte Fade
    if (fadeAmount > 0) {
      // Lifts the bottom black floor to a smooth matte charcoal film look
      const fadeLift = fadeAmount * 45;
      r = fadeLift + r * (1 - fadeAmount * 0.18);
      g = fadeLift + g * (1 - fadeAmount * 0.18);
      b = fadeLift + b * (1 - fadeAmount * 0.18);
    }

    // Clamp
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    // 10. Tone Curves & Channel Curves
    r = redLUT[masterLUT[Math.round(r)]];
    g = greenLUT[masterLUT[Math.round(g)]];
    b = blueLUT[masterLUT[Math.round(b)]];

    // 11. Saturation & Vibrance
    const currentLum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (adjustments.saturation || adjustments.vibrance) {
      // Saturation
      if (adjustments.saturation) {
        r = currentLum + (r - currentLum) * satMult;
        g = currentLum + (g - currentLum) * satMult;
        b = currentLum + (b - currentLum) * satMult;
      }

      // Vibrance: Smart saturation prioritizing muted colors over already saturated skin tones
      if (vibranceVal !== 0) {
        const maxCh = Math.max(r, g, b);
        const minCh = Math.min(r, g, b);
        const currentSat = maxCh === 0 ? 0 : (maxCh - minCh) / maxCh;
        const vibFactor = 1 + vibranceVal * (1 - currentSat);
        r = currentLum + (r - currentLum) * vibFactor;
        g = currentLum + (g - currentLum) * vibFactor;
        b = currentLum + (b - currentLum) * vibFactor;
      }
    }

    // 12. Split Toning / Color Grading
    if (hasSplitToning) {
      const balanceShift = ((st.balance || 0) / 100) * 0.2;
      const midPoint = 0.5 + balanceShift;
      const curNormLum = Math.max(0, Math.min(1, currentLum / 255));

      // Shadows toning
      if (st.shadowSat > 0 && curNormLum < midPoint) {
        const shadowIntensity = (1 - curNormLum / midPoint) * (st.shadowSat / 100) * 0.5;
        r = r * (1 - shadowIntensity) + stShadowR * shadowIntensity;
        g = g * (1 - shadowIntensity) + stShadowG * shadowIntensity;
        b = b * (1 - shadowIntensity) + stShadowB * shadowIntensity;
      }

      // Highlights toning
      if (st.highlightSat > 0 && curNormLum > midPoint) {
        const highIntensity = ((curNormLum - midPoint) / (1 - midPoint)) * (st.highlightSat / 100) * 0.5;
        r = r * (1 - highIntensity) + stHighR * highIntensity;
        g = g * (1 - highIntensity) + stHighG * highIntensity;
        b = b * (1 - highIntensity) + stHighB * highIntensity;
      }
    }

    // 13. Color Balance (Cyan-Red, Magenta-Green, Yellow-Blue)
    if (hasColorBalance && cb) {
      const curNormLum = Math.max(0, Math.min(1, currentLum / 255));
      const sWeight = Math.max(0, 1 - curNormLum * 1.6);
      const mWeight = Math.exp(-Math.pow((curNormLum - 0.5) / 0.28, 2));
      const hWeight = Math.max(0, (curNormLum - 0.4) * 1.66);

      const deltaR = ((cb.shadows.cyanRed * sWeight) + (cb.midtones.cyanRed * mWeight) + (cb.highlights.cyanRed * hWeight)) * 0.45;
      const deltaG = ((cb.shadows.magentaGreen * sWeight) + (cb.midtones.magentaGreen * mWeight) + (cb.highlights.magentaGreen * hWeight)) * 0.45;
      const deltaB = ((cb.shadows.yellowBlue * sWeight) + (cb.midtones.yellowBlue * mWeight) + (cb.highlights.yellowBlue * hWeight)) * 0.45;

      r += deltaR;
      g += deltaG;
      b += deltaB;
    }

    // 14. 3-Way Color Wheels (Shadows, Midtones, Highlights, Global)
    if (hasColorWheels && cw) {
      const curNormLum = Math.max(0, Math.min(1, (0.299 * r + 0.587 * g + 0.114 * b) / 255));
      const sWeight = Math.max(0, 1 - curNormLum * 1.5);
      const mWeight = Math.exp(-Math.pow((curNormLum - 0.5) / 0.28, 2));
      const hWeight = Math.max(0, (curNormLum - 0.4) * 1.6);

      // Shadows wheel
      if (cw.shadows) {
        if (cw.shadows.sat > 0) {
          const intensity = (cw.shadows.sat / 100) * sWeight * 0.45;
          r = r * (1 - intensity) + cwShadowR * intensity;
          g = g * (1 - intensity) + cwShadowG * intensity;
          b = b * (1 - intensity) + cwShadowB * intensity;
        }
        if (cw.shadows.lum !== 0) {
          const lumShift = cw.shadows.lum * sWeight * 0.4;
          r += lumShift; g += lumShift; b += lumShift;
        }
      }

      // Midtones wheel
      if (cw.midtones) {
        if (cw.midtones.sat > 0) {
          const intensity = (cw.midtones.sat / 100) * mWeight * 0.45;
          r = r * (1 - intensity) + cwMidR * intensity;
          g = g * (1 - intensity) + cwMidG * intensity;
          b = b * (1 - intensity) + cwMidB * intensity;
        }
        if (cw.midtones.lum !== 0) {
          const lumShift = cw.midtones.lum * mWeight * 0.4;
          r += lumShift; g += lumShift; b += lumShift;
        }
      }

      // Highlights wheel
      if (cw.highlights) {
        if (cw.highlights.sat > 0) {
          const intensity = (cw.highlights.sat / 100) * hWeight * 0.45;
          r = r * (1 - intensity) + cwHighR * intensity;
          g = g * (1 - intensity) + cwHighG * intensity;
          b = b * (1 - intensity) + cwHighB * intensity;
        }
        if (cw.highlights.lum !== 0) {
          const lumShift = cw.highlights.lum * hWeight * 0.4;
          r += lumShift; g += lumShift; b += lumShift;
        }
      }

      // Global Master wheel
      if (cw.global) {
        if (cw.global.sat > 0) {
          const intensity = (cw.global.sat / 100) * 0.35;
          r = r * (1 - intensity) + cwGlobalR * intensity;
          g = g * (1 - intensity) + cwGlobalG * intensity;
          b = b * (1 - intensity) + cwGlobalB * intensity;
        }
        if (cw.global.lum !== 0) {
          const lumShift = cw.global.lum * 0.35;
          r += lumShift; g += lumShift; b += lumShift;
        }
      }
    }

    // 15. HSL Color Mixer (8 Channels: Red, Orange, Yellow, Green, Aqua, Blue, Purple, Magenta)
    if (hsl || globalHueShift !== 0 || selectiveList.length > 0 || hasColorReplacement) {
      let [h, s, l] = rgbToHsl(r, g, b);

      // Global Hue Shift
      if (globalHueShift !== 0 && s > 0.04) {
        h = (h + globalHueShift + 360) % 360;
      }

      // 8-Channel HSL Mixer
      if (hsl && s > 0.05) {
        const weights = getHslWeights(h);
        let deltaH = 0;
        let deltaS = 0;
        let deltaL = 0;

        for (const [chName, w] of Object.entries(weights)) {
          if (w > 0) {
            const ch = (hsl as any)[chName];
            if (ch) {
              deltaH += (ch.hue || 0) * w;
              deltaS += (ch.saturation || 0) * w;
              deltaL += (ch.luminance || 0) * w;
            }
          }
        }

        if (deltaH !== 0 || deltaS !== 0 || deltaL !== 0) {
          h = (h + deltaH * 0.5 + 360) % 360;
          s = Math.max(0, Math.min(1, s * (1 + deltaS / 100)));
          l = Math.max(0, Math.min(1, l * (1 + deltaL / 100)));
        }
      }

      // Selective Color isolation
      if (selectiveList.length > 0 && s > 0.08) {
        for (const sc of selectiveList) {
          let diff = Math.abs(h - sc.targetHue);
          if (diff > 180) diff = 360 - diff;
          const range = sc.range || 30;
          if (diff < range) {
            const factor = Math.cos((diff / range) * (Math.PI / 2));
            h = (h + sc.shiftHue * factor + 360) % 360;
            s = Math.max(0, Math.min(1, s * (1 + (sc.shiftSat / 100) * factor)));
            l = Math.max(0, Math.min(1, l * (1 + (sc.shiftLum / 100) * factor)));
          }
        }
      }

      // Color Replacement
      if (hasColorReplacement && cr && s > 0.08) {
        let diff = Math.abs(h - cr.sourceHue);
        if (diff > 180) diff = 360 - diff;
        const tol = cr.sourceTolerance || 25;
        if (diff < tol) {
          const blend = Math.pow(1 - diff / tol, 1 + (cr.feather || 20) / 40);
          h = (h * (1 - blend) + cr.targetHue * blend + 360) % 360;
          s = Math.max(0, Math.min(1, s * (1 - blend) + (cr.targetSat / 100) * blend));
          if (cr.targetLum !== 0) {
            l = Math.max(0, Math.min(1, l + (cr.targetLum / 100) * 0.4 * blend));
          }
        }
      }

      const [nr, ng, nb] = hslToRgb(h, s, l);
      r = nr;
      g = ng;
      b = nb;
    }

    // 16. 3D LUT Application (Trilinear Interpolation with Intensity Blend)
    if (active3DLUT && lutIntensity > 0) {
      const [lutR, lutG, lutB] = sample3DLUT(
        Math.max(0, Math.min(1, r / 255)),
        Math.max(0, Math.min(1, g / 255)),
        Math.max(0, Math.min(1, b / 255)),
        active3DLUT
      );

      r = r * (1 - lutIntensity) + lutR * lutIntensity;
      g = g * (1 - lutIntensity) + lutG * lutIntensity;
      b = b * (1 - lutIntensity) + lutB * lutIntensity;
    }

    // 17. Camera Profile (Adobe-like & Camera Matching Profiles)
    if (camProfile && camProfileIntensity > 0 && camProfileConf?.profileId !== 'adobe-standard') {
      [r, g, b] = applyCameraProfilePixel(r, g, b, camProfile, camProfileIntensity);
    }

    data[i] = Math.max(0, Math.min(255, Math.round(r)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }

  // Put transformed base pixels back
  ctx.putImageData(imageData, 0, 0);

  // 18. RAW Demosaicing Simulation & Anti-Moire Pass
  if (rawDev && (rawDev.demosaicMethod !== 'bilinear' || rawDev.moireReduction > 0)) {
    applyDemosaicAndMoire(ctx, srcWidth, srcHeight, rawDev.demosaicMethod, rawDev.moireReduction);
  }

  // 19. Lens Distortion Correction (Barrel / Pincushion)
  const optics = adjustments.optics;
  if (optics && optics.enableDistortionCorrection && optics.distortion !== 0) {
    applyLensDistortion(ctx, srcWidth, srcHeight, optics.distortion);
  }

  // 20. Chromatic Aberration & Edge Defringe Correction
  if (optics && optics.enableCACorrection && (optics.caRedCyan !== 0 || optics.caBlueYellow !== 0 || optics.defringeAmount > 0)) {
    applyChromaticAberrationCorrection(
      ctx,
      srcWidth,
      srcHeight,
      optics.caRedCyan,
      optics.caBlueYellow,
      optics.defringeAmount,
      optics.defringeThreshold
    );
  }

  // 21. Optical Lens Vignetting Falloff Correction
  if (optics && optics.enableLensVignette && optics.lensVignetteAmount !== 0) {
    applyLensVignetteCorrection(
      ctx,
      srcWidth,
      srcHeight,
      optics.lensVignetteAmount,
      optics.lensVignetteMidpoint,
      optics.lensVignetteFeather
    );
  }

  // 9. Comprehensive Detail, Sharpness, Structure & Noise Reduction Pipeline
  if (highQuality) {
    applyDetailAndNoisePipeline(ctx, srcWidth, srcHeight, {
      sharpness: adjustments.sharpness || 0,
      radius: adjustments.sharpnessRadius ?? 1.0,
      detail: adjustments.sharpnessDetail ?? 25,
      masking: adjustments.sharpnessMasking ?? 0,
      edgeSharpening: adjustments.edgeSharpening ?? 0,
      previewMask: !!adjustments.previewSharpnessMask,
      clarity: adjustments.clarity || 0,
      texture: adjustments.texture || 0,
      structure: adjustments.structure || 0,
      microcontrast: adjustments.microcontrast || 0,
      luminanceNR: adjustments.luminanceNR !== undefined ? adjustments.luminanceNR : (adjustments.noiseReduction || 0),
      luminanceDetail: adjustments.luminanceDetail ?? 50,
      colorNR: adjustments.colorNoiseReduction || 0,
      colorDetail: adjustments.colorNoiseDetail ?? 50,
      colorSmoothness: adjustments.colorNoiseSmoothness ?? 50,
    });
  }

  // 10. AI Depth 3-Zone Independent Editing (Foreground -> Subject -> Background)
  if (highQuality && adjustments.aiDepth?.enabled) {
    applyAIDepthAdjustments(ctx, srcWidth, srcHeight, adjustments.aiDepth);
  }

  // 11. Blur, Bokeh Simulation & Depth of Field Pipeline
  if (highQuality && adjustments.blur?.enabled) {
    applyBlurAndDepthPipeline(ctx, srcWidth, srcHeight, adjustments.blur);
  }

  // 12. Vignette Effect
  if (adjustments.vignette !== 0) {
    applyVignette(
      ctx,
      srcWidth,
      srcHeight,
      adjustments.vignette,
      adjustments.vignetteMidpoint,
      adjustments.vignetteFeather
    );
  }

  // 13. Organic Film Grain
  if (adjustments.filmGrain > 0) {
    applyFilmGrain(ctx, srcWidth, srcHeight, adjustments.filmGrain, adjustments.filmGrainSize);
  }

  // 14. Selective Adjustment Masks (Brush, Gradients, Color/Luminance & AI Selections)
  if (masks && masks.length > 0) {
    applySelectiveMasksPipeline(ctx, srcWidth, srcHeight, masks);
  }

  // 14b. Retouching Studio Strokes (Healing, Clone Stamp, Skin Smoothing, Wrinkles, Red-Eye, Dust)
  if (retouchStrokes && retouchStrokes.length > 0) {
    applyRetouchStrokesPipeline(ctx, srcWidth, srcHeight, retouchStrokes);
  }

  // 14c. Drawing, Painting & Illustration Studio Stack (Brushes, Pencils, Markers, Pens, Custom Brushes, Shapes)
  if (drawingStrokes && drawingStrokes.length > 0) {
    const basePhotoScratch = document.createElement('canvas');
    basePhotoScratch.width = srcWidth;
    basePhotoScratch.height = srcHeight;
    const bCtx = basePhotoScratch.getContext('2d');
    bCtx?.drawImage(targetCanvas, 0, 0);

    compositeDrawingStack(ctx, drawingStrokes, srcWidth, srcHeight, basePhotoScratch);
  }

  // 14d. Graphics & Canva-Style Design Elements Stack (Shapes, Lines, Arrows, Stickers, Icons, Illustrations, Frames, Patterns)
  if (designElements && designElements.length > 0) {
    const basePhotoScratch = document.createElement('canvas');
    basePhotoScratch.width = srcWidth;
    basePhotoScratch.height = srcHeight;
    const bCtx = basePhotoScratch.getContext('2d');
    bCtx?.drawImage(targetCanvas, 0, 0);

    compositeDesignStack(ctx, designElements, srcWidth, srcHeight, basePhotoScratch);
  }

  // 15. Typography Studio Layer Stack
  if (typography && typography.length > 0) {
    const basePhotoScratch = document.createElement('canvas');
    basePhotoScratch.width = srcWidth;
    basePhotoScratch.height = srcHeight;
    const bCtx = basePhotoScratch.getContext('2d');
    bCtx?.drawImage(targetCanvas, 0, 0);

    compositeTypographyStack(ctx, typography, srcWidth, srcHeight, basePhotoScratch);
  }

  // 16. Watermark
  if (watermark && watermark.enabled && watermark.text.trim()) {
    applyWatermark(ctx, srcWidth, srcHeight, watermark);
  }

  // 17. Border Frame
  if (border && border.enabled && border.type !== 'none') {
    applyBorder(ctx, srcWidth, srcHeight, border);
  }

  // 18. Bit-Depth High-Precision Dithering & Tone Simulation (8-bit, 16-bit, 32-bit float)
  if (colorManagement && colorManagement.bitDepth) {
    applyBitDepthPipeline(targetCanvas, colorManagement.bitDepth);
  }

  // 19. HDR Display Headroom & Peak Luminance Mapping
  if (colorManagement && colorManagement.hdrDisplayEnabled) {
    applyHdrDisplayHeadroom(targetCanvas, colorManagement);
  }

  // 20. Soft Proofing & Out-of-Gamut Warning Masks (CMYK, Paper, Press & Gamut Warning)
  if (colorManagement && (colorManagement.softProofEnabled || colorManagement.gamutWarningEnabled)) {
    applySoftProofingToCanvas(targetCanvas, colorManagement);
  }
}

// Unsharp Mask, Local Contrast Clarity, and High-Frequency Texture
function applyClaritySharpnessAndTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  clarity: number,
  sharpness: number,
  texture: number
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);

  const sharpAmount = sharpness / 100;
  const clarityAmount = clarity / 100;
  const textureAmount = texture / 100;

  if (sharpAmount <= 0 && clarityAmount === 0 && textureAmount === 0) return;

  // Unsharp mask weight + Clarity local contrast weight + Texture fine frequency weight
  const k = sharpAmount * 0.45 + Math.max(0, clarityAmount) * 0.28 + textureAmount * 0.35;

  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    const topRow = (y - 1) * width;
    const botRow = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      const idx = (row + x) * 4;
      const topIdx = (topRow + x) * 4;
      const botIdx = (botRow + x) * 4;
      const leftIdx = (row + x - 1) * 4;
      const rightIdx = (row + x + 1) * 4;

      for (let c = 0; c < 3; c++) {
        const center = data[idx + c];
        const sumNeighbors =
          data[topIdx + c] +
          data[botIdx + c] +
          data[leftIdx + c] +
          data[rightIdx + c];

        // If texture is negative, smooth fine details without blunting edges
        let sharpened = center * (1 + 4 * k) - sumNeighbors * k;
        if (textureAmount < 0) {
          const blurred = (center * 2 + sumNeighbors) / 6;
          sharpened = center * (1 + textureAmount) - blurred * textureAmount;
        }

        output[idx + c] = Math.max(0, Math.min(255, Math.round(sharpened)));
      }
    }
  }

  ctx.putImageData(new ImageData(output, width, height), 0, 0);
}

// Vignette Shader
function applyVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number,
  midpoint: number,
  feather: number
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
  const innerRadius = maxRadius * (midpoint / 100) * 0.8;
  const outerRadius = maxRadius * (1 + (feather / 100) * 0.4);

  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    Math.max(0, innerRadius),
    centerX,
    centerY,
    outerRadius
  );

  const strength = Math.abs(amount) / 100;
  const color = amount < 0 ? 'rgba(0,0,0,' : 'rgba(255,255,255,';

  gradient.addColorStop(0, `${color}0)`);
  gradient.addColorStop(0.5, `${color}${0.3 * strength})`);
  gradient.addColorStop(1, `${color}${0.85 * strength})`);

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

// Organic Gaussian Film Grain
function applyFilmGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number,
  size: number
) {
  const grainCanvas = document.createElement('canvas');
  // Scale down for grain texture size
  const scale = Math.max(1, Math.min(4, size));
  const gw = Math.ceil(width / scale);
  const gh = Math.ceil(height / scale);

  grainCanvas.width = gw;
  grainCanvas.height = gh;
  const gctx = grainCanvas.getContext('2d');
  if (!gctx) return;

  const gImgData = gctx.createImageData(gw, gh);
  const gData = gImgData.data;
  const intensity = (amount / 100) * 80;

  for (let i = 0; i < gData.length; i += 4) {
    // Fast Box-Muller approximation for gaussian noise
    const noise = (Math.random() - 0.5) * 2 * intensity;
    const v = Math.max(0, Math.min(255, 128 + noise));
    gData[i] = v;
    gData[i + 1] = v;
    gData[i + 2] = v;
    gData[i + 3] = Math.min(255, intensity * 2.2);
  }

  gctx.putImageData(gImgData, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(grainCanvas, 0, 0, width, height);
  ctx.restore();
}

// Watermark Renderer
// Vector Logo Drawer helper
function drawVectorWatermarkLogo(
  ctx: CanvasRenderingContext2D,
  preset: string,
  size: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, size * 0.05);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const r = size / 2;

  switch (preset) {
    case 'camera-shutter': {
      // Aperture / Camera lens icon
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.stroke();

      // Shutter blades
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * (r * 0.35), Math.sin(angle) * (r * 0.35));
        ctx.lineTo(Math.cos(angle + 0.6) * (r * 0.85), Math.sin(angle + 0.6) * (r * 0.85));
        ctx.stroke();
      }
      break;
    }

    case 'studio-aperture': {
      // Precision aperture octagon
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x = Math.cos(angle) * r * 0.85;
        const y = Math.sin(angle) * r * 0.85;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'crown-luxury': {
      // Luxury crown icon
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, r * 0.5);
      ctx.lineTo(r * 0.8, r * 0.5);
      ctx.lineTo(r * 0.7, -r * 0.4);
      ctx.lineTo(r * 0.35, r * 0.1);
      ctx.lineTo(0, -r * 0.6);
      ctx.lineTo(-r * 0.35, r * 0.1);
      ctx.lineTo(-r * 0.7, -r * 0.4);
      ctx.closePath();
      ctx.stroke();

      // Jewels
      ctx.beginPath();
      ctx.arc(0, -r * 0.65, r * 0.08, 0, Math.PI * 2);
      ctx.arc(-r * 0.7, -r * 0.45, r * 0.08, 0, Math.PI * 2);
      ctx.arc(r * 0.7, -r * 0.45, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'diamond-crest': {
      // Diamond crest
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.85);
      ctx.lineTo(r * 0.75, 0);
      ctx.lineTo(0, r * 0.85);
      ctx.lineTo(-r * 0.75, 0);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -r * 0.85);
      ctx.lineTo(0, r * 0.85);
      ctx.moveTo(-r * 0.75, 0);
      ctx.lineTo(r * 0.75, 0);
      ctx.stroke();
      break;
    }

    case 'copyright-seal': {
      // Copyright badge seal
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = `bold ${Math.round(r * 0.9)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('©', 0, 0);
      break;
    }

    case 'signature-script': {
      // Elegant calligraphy flourish
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, 0);
      ctx.bezierCurveTo(-r * 0.4, -r * 0.7, 0, r * 0.7, r * 0.4, -r * 0.3);
      ctx.bezierCurveTo(r * 0.6, -r * 0.8, r * 0.8, 0.4, r * 0.8, r * 0.3);
      ctx.stroke();
      break;
    }

    default: {
      // Minimalist cross / target
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
      ctx.moveTo(-r * 0.9, 0);
      ctx.lineTo(r * 0.9, 0);
      ctx.moveTo(0, -r * 0.9);
      ctx.lineTo(0, r * 0.9);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

// Global Image Cache for custom image watermarks
const watermarkImageCache = new Map<string, HTMLImageElement>();

// Watermark Renderer supporting Text, Vector Logos, Image Stamps, 9-Point Anchoring, Rotation & Tiling
function applyWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  watermark: WatermarkSettings
) {
  if (!watermark.enabled) return;

  const minDim = Math.min(width, height);
  const opacity = (watermark.opacity ?? 80) / 100;
  if (opacity <= 0) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  if (watermark.blendMode && watermark.blendMode !== 'normal') {
    ctx.globalCompositeOperation = watermark.blendMode as any;
  }

  if (watermark.hasShadow) {
    ctx.shadowColor = watermark.shadowColor || 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = watermark.shadowBlur || 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }

  const baseScale = (watermark.size ?? 100) / 100;
  const fontSize = Math.max(12, Math.round((watermark.fontSize || 24) * (minDim / 1000) * baseScale));
  const logoSize = Math.max(24, Math.round(64 * (minDim / 1000) * baseScale));
  const color = watermark.color || '#ffffff';
  const weight = watermark.fontWeight || '600';
  const font = watermark.font || 'Inter, sans-serif';
  const text = watermark.text || '© Lumina Studio';

  // ----------------------------------------------------
  // 1. REPEATING / TILED WATERMARK (Proofing / Anti-Theft Grid)
  // ----------------------------------------------------
  if (watermark.isTiled || watermark.type === 'pattern-tile') {
    const spacingX = Math.max(80, Math.round((watermark.tileSpacingX || 180) * (minDim / 1000) * baseScale));
    const spacingY = Math.max(60, Math.round((watermark.tileSpacingY || 120) * (minDim / 1000) * baseScale));
    const rotationRad = ((watermark.tileRotation ?? -25) * Math.PI) / 180;

    ctx.font = `${weight} ${fontSize}px ${font}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const diag = Math.sqrt(width * width + height * height);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(rotationRad);

    const startX = -diag;
    const endX = diag;
    const startY = -diag;
    const endY = diag;

    let row = 0;
    for (let y = startY; y < endY; y += spacingY) {
      const offsetX = (row % 2 === 0) ? 0 : spacingX / 2;
      for (let x = startX; x < endX; x += spacingX) {
        if (watermark.type === 'logo' && watermark.logoPreset) {
          ctx.save();
          ctx.translate(x + offsetX, y);
          drawVectorWatermarkLogo(ctx, watermark.logoPreset, logoSize, color);
          ctx.restore();
        } else {
          ctx.fillText(text, x + offsetX, y);
        }
      }
      row++;
    }
    ctx.restore();
    ctx.restore();
    return;
  }

  // ----------------------------------------------------
  // 2. SINGLE ANCHORED WATERMARK (Text, Logo, Image)
  // ----------------------------------------------------
  const padding = Math.max(12, Math.round((watermark.padding ?? 32) * (minDim / 1000)));

  // Determine anchor point
  let anchorX = padding;
  let anchorY = padding;

  // Measure bounds
  ctx.font = `${weight} ${fontSize}px ${font}`;
  const metrics = ctx.measureText(text);
  const textW = metrics.width;
  const textH = fontSize;

  const contentW = watermark.type === 'logo' ? logoSize : watermark.type === 'image' ? (logoSize * 1.5) : textW;
  const contentH = watermark.type === 'logo' ? logoSize : watermark.type === 'image' ? (logoSize * 1.5) : textH;

  switch (watermark.position) {
    case 'top-left':
      anchorX = padding + contentW / 2;
      anchorY = padding + contentH / 2;
      break;
    case 'top-center':
      anchorX = width / 2;
      anchorY = padding + contentH / 2;
      break;
    case 'top-right':
      anchorX = width - padding - contentW / 2;
      anchorY = padding + contentH / 2;
      break;
    case 'center-left':
      anchorX = padding + contentW / 2;
      anchorY = height / 2;
      break;
    case 'center':
      anchorX = width / 2;
      anchorY = height / 2;
      break;
    case 'center-right':
      anchorX = width - padding - contentW / 2;
      anchorY = height / 2;
      break;
    case 'bottom-left':
      anchorX = padding + contentW / 2;
      anchorY = height - padding - contentH / 2;
      break;
    case 'bottom-center':
      anchorX = width / 2;
      anchorY = height - padding - contentH / 2;
      break;
    case 'custom':
      anchorX = ((watermark.customX ?? 50) / 100) * width;
      anchorY = ((watermark.customY ?? 50) / 100) * height;
      break;
    case 'bottom-right':
    default:
      anchorX = width - padding - contentW / 2;
      anchorY = height - padding - contentH / 2;
      break;
  }

  // Apply positioning & custom rotation
  ctx.translate(anchorX, anchorY);
  if (watermark.rotation && watermark.rotation !== 0) {
    ctx.rotate((watermark.rotation * Math.PI) / 180);
  }

  // Draw Specific Content Type
  if (watermark.type === 'logo' && watermark.logoPreset) {
    drawVectorWatermarkLogo(ctx, watermark.logoPreset, logoSize, color);
  } else if (watermark.type === 'image' && watermark.imageUrl) {
    let img = watermarkImageCache.get(watermark.imageUrl);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = watermark.imageUrl;
      watermarkImageCache.set(watermark.imageUrl, img);
    }
    if (img.complete && img.naturalWidth > 0) {
      const imgW = logoSize * 1.5;
      const imgH = img.naturalHeight ? (imgW * img.naturalHeight) / img.naturalWidth : imgW;
      ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH);
    }
  } else {
    // Text Watermark
    ctx.font = `${weight} ${fontSize}px ${font}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);
  }

  ctx.restore();
}

// Frame & Border Renderer with Rounded Corners, Matting, Shadows & Film Strips
function applyBorder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  border: BorderSettings
) {
  if (!border.enabled && (!border.radius || border.radius <= 0)) return;

  const minDim = Math.min(width, height);
  const borderPx = Math.max(2, Math.round(border.size * (minDim / 1000)));
  const radiusPx = border.radius > 0 ? Math.round(border.radius * (minDim / 1000)) : 0;

  ctx.save();

  // 1. Handle Rounded Corners clipping if radius > 0
  if (radiusPx > 0) {
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(0, 0, width, height, radiusPx);
    } else {
      ctx.moveTo(radiusPx, 0);
      ctx.lineTo(width - radiusPx, 0);
      ctx.quadraticCurveTo(width, 0, width, radiusPx);
      ctx.lineTo(width, height - radiusPx);
      ctx.quadraticCurveTo(width, height, width - radiusPx, height);
      ctx.lineTo(radiusPx, height);
      ctx.quadraticCurveTo(0, height, 0, height - radiusPx);
      ctx.lineTo(0, radiusPx);
      ctx.quadraticCurveTo(0, 0, radiusPx, 0);
      ctx.closePath();
    }
    // Clip the outer corners transparent/neatly
    ctx.strokeStyle = border.enabled ? (border.color || '#ffffff') : 'transparent';
    ctx.lineWidth = border.enabled ? borderPx * 2 : 0;
    if (border.enabled) {
      ctx.stroke();
    }
  }

  if (!border.enabled || border.type === 'none') {
    ctx.restore();
    return;
  }

  // 2. Render Border Frames
  if (border.type === 'solid') {
    ctx.lineWidth = borderPx * 2;
    ctx.strokeStyle = border.color || '#ffffff';
    ctx.strokeRect(0, 0, width, height);
  } else if (border.type === 'minimal') {
    ctx.lineWidth = Math.max(1, Math.round(borderPx * 0.35));
    ctx.strokeStyle = border.color || '#ffffff';
    const inset = borderPx * 2;
    ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
  } else if (border.type === 'gallery') {
    // Elegant Art Gallery Matting (thick outer passe-partout + fine inner accent line)
    const mattingSize = borderPx * 2.5;
    ctx.fillStyle = border.color || '#fdfdfc';
    ctx.fillRect(0, 0, width, mattingSize);
    ctx.fillRect(0, height - mattingSize, width, mattingSize);
    ctx.fillRect(0, 0, mattingSize, height);
    ctx.fillRect(width - mattingSize, 0, mattingSize, height);

    // Inner fine bevel line
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = Math.max(1, Math.round(borderPx * 0.15));
    ctx.strokeRect(mattingSize, mattingSize, width - mattingSize * 2, height - mattingSize * 2);
  } else if (border.type === 'polaroid') {
    const bottomExtra = borderPx * 3.8;
    ctx.fillStyle = border.color || '#fcfbf7';
    // Top border
    ctx.fillRect(0, 0, width, borderPx * 1.2);
    // Left border
    ctx.fillRect(0, 0, borderPx * 1.2, height);
    // Right border
    ctx.fillRect(width - borderPx * 1.2, 0, borderPx * 1.2, height);
    // Bottom polaroid chin
    ctx.fillRect(0, height - bottomExtra, width, bottomExtra);

    // Optional handwritten polaroid caption
    if (border.captionText) {
      ctx.save();
      ctx.fillStyle = '#222222';
      const capFontSize = Math.max(14, Math.round(bottomExtra * 0.35));
      ctx.font = `italic 600 ${capFontSize}px "Caveat", "Dancing Script", cursive, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(border.captionText, width / 2, height - bottomExtra * 0.35);
      ctx.restore();
    }
  } else if (border.type === 'film') {
    ctx.fillStyle = '#080808';
    const stripH = borderPx * 1.8;
    ctx.fillRect(0, 0, width, stripH);
    ctx.fillRect(0, height - stripH, width, stripH);

    // Sprocket holes
    ctx.fillStyle = '#ffffff';
    const sprocketW = stripH * 0.45;
    const sprocketH = stripH * 0.35;
    const step = stripH * 1.2;
    for (let x = step / 2; x < width; x += step) {
      ctx.fillRect(x, stripH * 0.3, sprocketW, sprocketH);
      ctx.fillRect(x, height - stripH * 0.65, sprocketW, sprocketH);
    }
  } else if (border.type === 'shadow') {
    // Inner shadow vignette frame
    const shadowSize = borderPx * 3;
    const gradTop = ctx.createLinearGradient(0, 0, 0, shadowSize);
    gradTop.addColorStop(0, border.shadowColor || 'rgba(0,0,0,0.7)');
    gradTop.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradTop;
    ctx.fillRect(0, 0, width, shadowSize);

    const gradBottom = ctx.createLinearGradient(0, height, 0, height - shadowSize);
    gradBottom.addColorStop(0, border.shadowColor || 'rgba(0,0,0,0.7)');
    gradBottom.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradBottom;
    ctx.fillRect(0, height - shadowSize, width, shadowSize);
  } else if (border.type === 'vintage-frame') {
    // Double ornate vintage outline
    ctx.strokeStyle = border.color || '#d4af37';
    ctx.lineWidth = Math.max(2, Math.round(borderPx * 0.5));
    ctx.strokeRect(borderPx, borderPx, width - borderPx * 2, height - borderPx * 2);

    ctx.lineWidth = Math.max(1, Math.round(borderPx * 0.2));
    const innerInset = borderPx * 1.5;
    ctx.strokeRect(innerInset, innerInset, width - innerInset * 2, height - innerInset * 2);
  }

  ctx.restore();
}

/**
 * Apply core photographic adjustments to an ImageData buffer (used by Adjustment Layers)
 */
export function applyCoreAdjustments(imageData: ImageData, adjustments: AdjustmentSettings): ImageData {
  const result = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
  const data = result.data;
  const len = data.length;

  const exposureMult = Math.pow(2, (adjustments.exposure || 0) / 50);
  const brightnessOffset = ((adjustments.brightness || 0) / 100) * 128;
  const contrastFactor = Math.tan((((adjustments.contrast || 0) + 100) * Math.PI) / 400);
  const highlightsAdj = (adjustments.highlights || 0) / 100;
  const shadowsAdj = (adjustments.shadows || 0) / 100;
  const whitesAdj = (adjustments.whites || 0) / 100;
  const blacksAdj = (adjustments.blacks || 0) / 100;

  const temp = (adjustments.temperature || 0) / 100;
  const tintVal = (adjustments.tint || 0) / 100;
  const rTempMult = temp > 0 ? 1 + temp * 0.4 : 1;
  const bTempMult = temp < 0 ? 1 + Math.abs(temp) * 0.4 : 1;
  const gTintMult = tintVal < 0 ? 1 + Math.abs(tintVal) * 0.3 : 1;
  const rbTintMult = tintVal > 0 ? 1 + tintVal * 0.25 : 1;

  const satMult = 1 + (adjustments.saturation || 0) / 100;
  const vibranceVal = (adjustments.vibrance || 0) / 100;

  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // White Balance
    r = Math.min(255, r * rTempMult * rbTintMult);
    g = Math.min(255, g * gTintMult);
    b = Math.min(255, b * bTempMult * rbTintMult);

    // Exposure & Brightness
    r = r * exposureMult + brightnessOffset;
    g = g * exposureMult + brightnessOffset;
    b = b * exposureMult + brightnessOffset;

    // Contrast
    r = (r - 128) * contrastFactor + 128;
    g = (g - 128) * contrastFactor + 128;
    b = (b - 128) * contrastFactor + 128;

    // Luminance for tone zones
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (highlightsAdj !== 0 && lum > 128) {
      const w = (lum - 128) / 127;
      r += highlightsAdj * 40 * w;
      g += highlightsAdj * 40 * w;
      b += highlightsAdj * 40 * w;
    }

    if (shadowsAdj !== 0 && lum < 128) {
      const w = (128 - lum) / 128;
      r += shadowsAdj * 40 * w;
      g += shadowsAdj * 40 * w;
      b += shadowsAdj * 40 * w;
    }

    if (whitesAdj !== 0 && lum > 200) {
      const w = (lum - 200) / 55;
      r += whitesAdj * 35 * w;
      g += whitesAdj * 35 * w;
      b += whitesAdj * 35 * w;
    }

    if (blacksAdj !== 0 && lum < 55) {
      const w = (55 - lum) / 55;
      r += blacksAdj * 35 * w;
      g += blacksAdj * 35 * w;
      b += blacksAdj * 35 * w;
    }

    // Saturation & Vibrance
    if (satMult !== 1 || vibranceVal !== 0) {
      const currLum = 0.299 * r + 0.587 * g + 0.114 * b;
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const currentSat = maxC === minC ? 0 : (maxC - minC) / (maxC || 1);
      const vibMult = 1 + vibranceVal * (1 - currentSat);
      const totalSat = satMult * vibMult;

      r = currLum + (r - currLum) * totalSat;
      g = currLum + (g - currLum) * totalSat;
      b = currLum + (b - currLum) * totalSat;
    }

    data[i] = Math.max(0, Math.min(255, Math.round(r)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }

  return result;
}
