import { AdjustmentSettings } from '../types/editor';

export interface AutoAnalysisResult {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  brilliance: number;
  gamma: number;
  temperature: number;
  tint: number;
  saturation: number;
  vibrance: number;
  clarity: number;
  dehaze: number;
}

/**
 * Fast client-side image luminance and histogram statistics analysis
 */
export function analyzeImageStats(canvas: HTMLCanvasElement): {
  meanLum: number;
  medianLum: number;
  stdDevLum: number;
  minLum: number;
  maxLum: number;
  p1: number;
  p5: number;
  p50: number;
  p95: number;
  p99: number;
  meanR: number;
  meanG: number;
  meanB: number;
  highlightRatio: number;
  shadowRatio: number;
} {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || canvas.width === 0 || canvas.height === 0) {
    return {
      meanLum: 128,
      medianLum: 128,
      stdDevLum: 50,
      minLum: 0,
      maxLum: 255,
      p1: 5,
      p5: 15,
      p50: 128,
      p95: 240,
      p99: 250,
      meanR: 128,
      meanG: 128,
      meanB: 128,
      highlightRatio: 0.05,
      shadowRatio: 0.05,
    };
  }

  const step = Math.max(1, Math.floor(Math.sqrt((canvas.width * canvas.height) / 100000)));
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  const histogram = new Uint32Array(256);
  let sumLum = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

    histogram[l]++;
    sumLum += l;
    sumR += r;
    sumG += g;
    sumB += b;
    count++;
  }

  if (count === 0) count = 1;

  const meanLum = sumLum / count;
  const meanR = sumR / count;
  const meanG = sumG / count;
  const meanB = sumB / count;

  // Calculate standard deviation
  let varianceSum = 0;
  for (let i = 0; i < 256; i++) {
    varianceSum += histogram[i] * Math.pow(i - meanLum, 2);
  }
  const stdDevLum = Math.sqrt(varianceSum / count);

  // Cumulative percentiles
  let cumulative = 0;
  let p1 = 0, p5 = 0, p50 = 128, p95 = 255, p99 = 255;
  let minLum = -1, maxLum = 255;

  for (let i = 0; i < 256; i++) {
    cumulative += histogram[i];
    const frac = cumulative / count;
    if (minLum === -1 && histogram[i] > 0) minLum = i;
    if (histogram[i] > 0) maxLum = i;

    if (p1 === 0 && frac >= 0.01) p1 = i;
    if (p5 === 0 && frac >= 0.05) p5 = i;
    if (p50 === 128 && frac >= 0.50) p50 = i;
    if (p95 === 255 && frac >= 0.95) p95 = i;
    if (p99 === 255 && frac >= 0.99) p99 = i;
  }

  let shadowCount = 0;
  let highlightCount = 0;
  for (let i = 0; i < 30; i++) shadowCount += histogram[i];
  for (let i = 225; i < 256; i++) highlightCount += histogram[i];

  return {
    meanLum,
    medianLum: p50,
    stdDevLum,
    minLum: minLum === -1 ? 0 : minLum,
    maxLum,
    p1,
    p5,
    p50,
    p95,
    p99,
    meanR,
    meanG,
    meanB,
    highlightRatio: shadowCount / count,
    shadowRatio: highlightCount / count,
  };
}

/**
 * Auto Exposure: calculates optimal EV exposure compensation based on zone system midtone target (128)
 */
export function calculateAutoExposure(canvas: HTMLCanvasElement): number {
  const stats = analyzeImageStats(canvas);
  // Target 18% middle gray (128 in 8-bit sRGB)
  const targetLum = 128;
  const currentMedian = stats.medianLum || 128;

  // EV = log2(target / current) * 50
  const ratio = targetLum / Math.max(20, Math.min(235, currentMedian));
  const evOffset = Math.log2(ratio) * 45;

  return Math.round(Math.max(-60, Math.min(60, evOffset)));
}

/**
 * Auto Contrast: maximizes dynamic range expansion while preventing clipping
 */
export function calculateAutoContrast(canvas: HTMLCanvasElement): number {
  const stats = analyzeImageStats(canvas);
  // Contrast dynamic range span: p95 - p5
  const dynamicRange = stats.p95 - stats.p5;
  const idealRange = 210; // desired spread

  const diff = idealRange - dynamicRange;
  const contrastBoost = Math.round((diff / 210) * 40);

  return Math.max(-20, Math.min(45, contrastBoost));
}

/**
 * Auto Tone: full intelligent balance of Exposure, Contrast, Highlights, Shadows, Whites, Blacks, Brilliance
 */
export function calculateAutoTone(canvas: HTMLCanvasElement): Partial<AdjustmentSettings> {
  const stats = analyzeImageStats(canvas);

  // 1. Exposure calculation
  const targetMedian = 126;
  const currentMedian = stats.medianLum || 128;
  const ratio = targetMedian / Math.max(20, Math.min(235, currentMedian));
  const autoExposure = Math.round(Math.max(-45, Math.min(45, Math.log2(ratio) * 38)));

  // 2. Highlights & Shadows recovery
  let autoHighlights = 0;
  let autoShadows = 0;

  if (stats.p95 > 230 || stats.highlightRatio > 0.08) {
    // Blown highlights -> pull down
    autoHighlights = -Math.round(Math.min(50, ((stats.p95 - 220) / 35) * 35));
  } else if (stats.p95 < 190) {
    // Dull highlights -> boost slightly
    autoHighlights = Math.round(((190 - stats.p95) / 50) * 20);
  }

  if (stats.p5 < 25 || stats.shadowRatio > 0.08) {
    // Crushed dark shadows -> lift shadows
    autoShadows = Math.round(Math.min(55, ((30 - stats.p5) / 30) * 40 + 15));
  } else if (stats.p5 > 50) {
    // Washed out shadows -> deepen slightly
    autoShadows = -Math.round(((stats.p5 - 50) / 40) * 20);
  }

  // 3. Whites & Blacks anchor points
  const autoWhites = stats.p99 < 240 ? Math.round(((245 - stats.p99) / 40) * 25) : -Math.round(((stats.p99 - 245) / 10) * 20);
  const autoBlacks = stats.p1 > 10 ? -Math.round(((stats.p1 - 10) / 30) * 25) : Math.round(((10 - stats.p1) / 10) * 15);

  // 4. Contrast & Brilliance
  const dynamicRange = stats.p95 - stats.p5;
  const autoContrast = Math.round(Math.max(-10, Math.min(30, ((200 - dynamicRange) / 200) * 25)));
  const autoBrilliance = Math.round(Math.max(-10, Math.min(35, (autoShadows * 0.4 - autoHighlights * 0.3))));

  // 5. Smart Vibrance & Dehaze
  const autoVibrance = 12;
  const autoClarity = 8;
  const autoDehaze = stats.stdDevLum < 45 ? 10 : 0;

  return {
    exposure: autoExposure,
    contrast: autoContrast,
    highlights: autoHighlights,
    shadows: autoShadows,
    whites: Math.max(-40, Math.min(40, autoWhites)),
    blacks: Math.max(-40, Math.min(40, autoBlacks)),
    brilliance: autoBrilliance,
    vibrance: autoVibrance,
    clarity: autoClarity,
    dehaze: autoDehaze,
  };
}
