/**
 * AI Depth Estimation & 3-Zone Segmentation Engine
 * Computes depth maps using multi-cue spatial geometry, high-frequency focus energy,
 * atmospheric haze gradients, and bilateral edge snapping.
 * Enables independent photographic adjustments for Foreground, Subject, and Background.
 */

import { AIDepthSettings, DepthZoneAdjustments } from '../types/editor';

// Cached depth map buffer to avoid recomputing every slider frame if source image hasn't changed
let cachedDepthKey: string | null = null;
let cachedDepthMap: Float32Array | null = null;
let cachedWidth = 0;
let cachedHeight = 0;

/**
 * Computes or retrieves a normalized Float32 depth map (0.0 = closest foreground, 1.0 = farthest background)
 */
export function getOrComputeDepthMap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  method: 'neural-gradient' | 'saliency-frequency' | 'geometric-perspective' = 'neural-gradient'
): Float32Array {
  const currentKey = `${width}x${height}_${method}`;

  if (cachedDepthMap && cachedDepthKey === currentKey && cachedWidth === width && cachedHeight === height) {
    return cachedDepthMap;
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = width * height;
  const depth = new Float32Array(len);

  // 1. Compute High-Frequency Sharpness Energy (Focus cue)
  const focusEnergy = new Float32Array(len);
  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    const tRow = (y - 1) * width;
    const bRow = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      const idx = (row + x) * 4;
      const lumCenter = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const lumT = 0.299 * data[(tRow + x) * 4] + 0.587 * data[(tRow + x) * 4 + 1] + 0.114 * data[(tRow + x) * 4 + 2];
      const lumB = 0.299 * data[(bRow + x) * 4] + 0.587 * data[(bRow + x) * 4 + 1] + 0.114 * data[(bRow + x) * 4 + 2];
      const lumL = 0.299 * data[(row + x - 1) * 4] + 0.587 * data[(row + x - 1) * 4 + 1] + 0.114 * data[(row + x - 1) * 4 + 2];
      const lumR = 0.299 * data[(row + x + 1) * 4] + 0.587 * data[(row + x + 1) * 4 + 1] + 0.114 * data[(row + x + 1) * 4 + 2];

      const laplacian = Math.abs(lumT + lumB + lumL + lumR - 4 * lumCenter);
      focusEnergy[row + x] = Math.min(1.0, laplacian / 35.0);
    }
  }

  // 2. Synthesize multi-cue depth estimation
  for (let y = 0; y < height; y++) {
    const row = y * width;
    const normY = y / (height - 1); // 0 at top (sky/background), 1 at bottom (ground/foreground)

    // Vertical linear perspective gradient (ground plane tilts away towards upper horizon)
    const perspectiveCue = 1.0 - Math.pow(normY, 0.85);

    for (let x = 0; x < width; x++) {
      const idx = (row + x) * 4;
      const i = row + x;
      const normX = x / (width - 1);

      const r = data[idx] / 255;
      const g = data[idx + 1] / 255;
      const b = data[idx + 2] / 255;

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Atmospheric haze cue: distant sky/horizons have high brightness, lower saturation, and blue shift
      const hazeCue = Math.min(1.0, lum * (1.0 - sat * 0.7) * (b / (r + 0.05)));

      // Central subject saliency prior: center of frame is likely the primary subject (depth ~ 0.45)
      const dx = (normX - 0.5) * 2;
      const dy = (normY - 0.55) * 2;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);
      const centerPrior = Math.max(0, 1.0 - distFromCenter * 0.7);

      // Focus energy inverted: high sharpness -> subject at focal plane (~0.4), low sharpness -> extreme near or far
      const energy = focusEnergy[i];

      let estimatedDepth = 0.5;

      if (method === 'geometric-perspective') {
        estimatedDepth = perspectiveCue * 0.8 + hazeCue * 0.2;
      } else if (method === 'saliency-frequency') {
        const subjectScore = centerPrior * 0.5 + energy * 0.5;
        estimatedDepth = (1.0 - subjectScore) * perspectiveCue;
      } else {
        // neural-gradient balanced multi-cue
        const subjectLikelihood = Math.min(1.0, centerPrior * 0.55 + energy * 0.45);
        if (subjectLikelihood > 0.4) {
          // Subject band
          estimatedDepth = 0.42 + (1.0 - subjectLikelihood) * 0.15;
        } else if (normY > 0.75) {
          // Foreground floor
          estimatedDepth = (1.0 - normY) * 0.6;
        } else {
          // Background
          estimatedDepth = 0.55 + perspectiveCue * 0.3 + hazeCue * 0.15;
        }
      }

      depth[i] = Math.max(0.0, Math.min(1.0, estimatedDepth));
    }
  }

  // 3. Bilateral Edge-Guided Depth Smoothing (align depth contours precisely with photo edges)
  const smoothed = new Float32Array(depth);
  const radius = 2;

  for (let y = radius; y < height - radius; y += 1) {
    const row = y * width;
    for (let x = radius; x < width - radius; x += 1) {
      const idx = (row + x) * 4;
      const centerLum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const centerD = depth[row + x];

      let sumD = 0;
      let sumW = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        const curRow = (y + dy) * width;
        for (let dx = -radius; dx <= radius; dx++) {
          const nIdx = (curRow + x + dx) * 4;
          const nLum = 0.299 * data[nIdx] + 0.587 * data[nIdx + 1] + 0.114 * data[nIdx + 2];
          const lumDiff = Math.abs(centerLum - nLum);

          const rangeW = Math.exp(-(lumDiff * lumDiff) / 250);
          const spatialW = 1 / (1 + dx * dx + dy * dy);
          const w = rangeW * spatialW;

          sumD += depth[curRow + x + dx] * w;
          sumW += w;
        }
      }

      smoothed[row + x] = sumD / sumW;
    }
  }

  cachedDepthKey = currentKey;
  cachedDepthMap = smoothed;
  cachedWidth = width;
  cachedHeight = height;

  return smoothed;
}

/**
 * Resets cached depth map when image changes
 */
export function invalidateDepthCache() {
  cachedDepthKey = null;
  cachedDepthMap = null;
}

/**
 * Color map interpolation for visualizing depth maps
 */
export function getDepthColormapColor(
  d: number, // 0 to 1
  colormap: 'turbo' | 'plasma' | 'viridis' | 'inferno' | 'grayscale'
): [number, number, number] {
  const val = Math.max(0, Math.min(1, d));

  if (colormap === 'grayscale') {
    const g = Math.round(val * 255);
    return [g, g, g];
  }

  if (colormap === 'viridis') {
    // Viridis: Purple -> Teal -> Yellow
    const r = Math.round(255 * (0.28 + 0.7 * val));
    const g = Math.round(255 * (0.01 + 0.9 * val));
    const b = Math.round(255 * (0.33 + 0.1 * (1 - val) + 0.1 * Math.sin(val * Math.PI)));
    return [r, g, b];
  }

  if (colormap === 'plasma') {
    // Plasma: Blue -> Magenta -> Yellow
    const r = Math.round(255 * Math.sin(val * Math.PI * 0.75));
    const g = Math.round(255 * Math.pow(val, 2));
    const b = Math.round(255 * (1 - val * 0.8));
    return [r, g, b];
  }

  if (colormap === 'inferno') {
    // Inferno: Black -> Red -> Orange -> Yellow
    const r = Math.round(255 * Math.min(1, val * 1.5));
    const g = Math.round(255 * Math.max(0, (val - 0.3) * 1.4));
    const b = Math.round(255 * Math.max(0, (val - 0.7) * 3.3));
    return [r, g, b];
  }

  // Turbo Colormap (Default: Deep Blue -> Cyan -> Green -> Yellow -> Red)
  const x = val;
  const r = Math.round(255 * Math.max(0, Math.min(1, 0.1357 + x * (4.5974 + x * (-42.681 + x * (132.13 + x * (-152.94 + x * 59.286)))))));
  const g = Math.round(255 * Math.max(0, Math.min(1, 0.0914 + x * (2.1856 + x * (4.8052 + x * (-14.019 + x * (4.2109 + x * 2.7747)))))));
  const b = Math.round(255 * Math.max(0, Math.min(1, 0.1067 + x * (12.583 + x * (-76.888 + x * (195.80 + x * (-215.31 + x * 84.654)))))));

  return [r, g, b];
}

/**
 * Renders the false-color Depth Map overlay on the target canvas
 */
export function renderDepthMapOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  depth: Float32Array,
  colormap: 'turbo' | 'plasma' | 'viridis' | 'inferno' | 'grayscale'
) {
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;
  const len = width * height;

  for (let i = 0; i < len; i++) {
    const d = depth[i];
    const [r, g, b] = getDepthColormapColor(d, colormap);
    const idx = i * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Applies Independent 3-Zone Adjustments (Foreground / Subject / Background)
 */
export function applyAIDepthAdjustments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  aiDepth: AIDepthSettings
) {
  if (!aiDepth.enabled) return;

  const depth = getOrComputeDepthMap(ctx, width, height, aiDepth.depthEstimationMethod);

  // If user enabled depth map preview, render the visualization overlay directly
  if (aiDepth.showDepthMapOverlay) {
    renderDepthMapOverlay(ctx, width, height, depth, aiDepth.depthColorMap);
    return;
  }

  const fg = aiDepth.foreground;
  const sub = aiDepth.subject;
  const bg = aiDepth.background;

  const hasFgAdj = hasAnyAdjustment(fg);
  const hasSubAdj = hasAnyAdjustment(sub);
  const hasBgAdj = hasAnyAdjustment(bg);

  if (!hasFgAdj && !hasSubAdj && !hasBgAdj) {
    return;
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = width * height;

  const t1 = aiDepth.foregroundThreshold ?? 0.30;
  const t2 = aiDepth.backgroundThreshold ?? 0.65;
  const feather = Math.max(0.01, aiDepth.feather ?? 0.15);

  // Pre-calculate adjustment multipliers
  const fgParams = prepareZoneParams(fg);
  const subParams = prepareZoneParams(sub);
  const bgParams = prepareZoneParams(bg);

  for (let i = 0; i < len; i++) {
    const idx = i * 4;
    const z = depth[i];

    // Compute smooth soft-feathered zone weights
    // Foreground: 1.0 at z=0 up to t1 - feather/2, then ramps down to 0 at t1 + feather/2
    let wFg = 0;
    if (z < t1 - feather / 2) {
      wFg = 1.0;
    } else if (z < t1 + feather / 2) {
      wFg = 0.5 * (1 + Math.cos(Math.PI * (z - (t1 - feather / 2)) / feather));
    }

    // Background: 0 up to t2 - feather/2, then ramps up to 1.0 at t2 + feather/2
    let wBg = 0;
    if (z > t2 + feather / 2) {
      wBg = 1.0;
    } else if (z > t2 - feather / 2) {
      wBg = 0.5 * (1 - Math.cos(Math.PI * (z - (t2 - feather / 2)) / feather));
    }

    // Subject: whatever remains in the middle
    let wSub = Math.max(0, 1.0 - wFg - wBg);

    let r = data[idx];
    let g = data[idx + 1];
    let b = data[idx + 2];

    // Process Foreground
    if (hasFgAdj && wFg > 0.001) {
      const [rFg, gFg, bFg] = applySingleZonePixel(r, g, b, fgParams);
      r = r * (1 - wFg) + rFg * wFg;
      g = g * (1 - wFg) + gFg * wFg;
      b = b * (1 - wFg) + bFg * wFg;
    }

    // Process Subject
    if (hasSubAdj && wSub > 0.001) {
      const [rSub, gSub, bSub] = applySingleZonePixel(r, g, b, subParams);
      r = r * (1 - wSub) + rSub * wSub;
      g = g * (1 - wSub) + gSub * wSub;
      b = b * (1 - wSub) + bSub * wSub;
    }

    // Process Background
    if (hasBgAdj && wBg > 0.001) {
      const [rBg, gBg, bBg] = applySingleZonePixel(r, g, b, bgParams);
      r = r * (1 - wBg) + rBg * wBg;
      g = g * (1 - wBg) + gBg * wBg;
      b = b * (1 - wBg) + bBg * wBg;
    }

    data[idx] = Math.max(0, Math.min(255, Math.round(r)));
    data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
    data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }

  ctx.putImageData(imgData, 0, 0);
}

function hasAnyAdjustment(adj: DepthZoneAdjustments): boolean {
  return (
    adj.exposure !== 0 ||
    adj.contrast !== 0 ||
    adj.highlights !== 0 ||
    adj.shadows !== 0 ||
    adj.temperature !== 0 ||
    adj.tint !== 0 ||
    adj.saturation !== 0 ||
    adj.vibrance !== 0 ||
    adj.clarity !== 0 ||
    adj.texture !== 0 ||
    adj.sharpness !== 0 ||
    adj.blur !== 0 ||
    adj.dehaze !== 0
  );
}

interface PreparedZoneParams {
  expMult: number;
  contrastK: number;
  tempR: number;
  tempB: number;
  tintG: number;
  tintRB: number;
  satMult: number;
  highMult: number;
  shadowMult: number;
  dehazeVal: number;
}

function prepareZoneParams(adj: DepthZoneAdjustments): PreparedZoneParams {
  const expMult = Math.pow(2, adj.exposure / 50);
  const contrastK = adj.contrast / 100;
  const temp = adj.temperature / 100;
  const tint = adj.tint / 100;

  return {
    expMult,
    contrastK,
    tempR: temp > 0 ? 1 + temp * 0.35 : 1,
    tempB: temp < 0 ? 1 + Math.abs(temp) * 0.35 : 1,
    tintG: tint < 0 ? 1 + Math.abs(tint) * 0.25 : 1,
    tintRB: tint > 0 ? 1 + tint * 0.2 : 1,
    satMult: 1 + adj.saturation / 100,
    highMult: adj.highlights / 100,
    shadowMult: adj.shadows / 100,
    dehazeVal: adj.dehaze / 100,
  };
}

function applySingleZonePixel(
  r: number,
  g: number,
  b: number,
  p: PreparedZoneParams
): [number, number, number] {
  // 1. Exposure
  r *= p.expMult;
  g *= p.expMult;
  b *= p.expMult;

  // 2. Highlights & Shadows
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  if (p.highMult !== 0 && lum > 128) {
    const factor = ((lum - 128) / 127) * p.highMult * 0.35;
    r += r * factor;
    g += g * factor;
    b += b * factor;
  }
  if (p.shadowMult !== 0 && lum < 128) {
    const factor = ((128 - lum) / 128) * p.shadowMult * 0.4;
    r += r * factor;
    g += g * factor;
    b += b * factor;
  }

  // 3. Contrast (S-Curve about 128)
  if (p.contrastK !== 0) {
    r = 128 + (r - 128) * (1 + p.contrastK);
    g = 128 + (g - 128) * (1 + p.contrastK);
    b = 128 + (b - 128) * (1 + p.contrastK);
  }

  // 4. White Balance (Temp & Tint)
  r *= p.tempR * p.tintRB;
  g *= p.tintG;
  b *= p.tempB * p.tintRB;

  // 5. Dehaze
  if (p.dehazeVal !== 0) {
    const dehazeShift = p.dehazeVal * 20;
    r = r * (1 + p.dehazeVal * 0.2) - dehazeShift;
    g = g * (1 + p.dehazeVal * 0.2) - dehazeShift;
    b = b * (1 + p.dehazeVal * 0.2) - dehazeShift;
  }

  // 6. Saturation
  if (p.satMult !== 1) {
    const curLum = 0.299 * r + 0.587 * g + 0.114 * b;
    r = curLum + (r - curLum) * p.satMult;
    g = curLum + (g - curLum) * p.satMult;
    b = curLum + (b - curLum) * p.satMult;
  }

  return [r, g, b];
}

/**
 * Returns estimated depth at normalized coordinate (normX, normY)
 */
export function getDepthAtCoordinate(
  depth: Float32Array,
  width: number,
  height: number,
  normX: number,
  normY: number
): number {
  const x = Math.max(0, Math.min(width - 1, Math.round(normX * (width - 1))));
  const y = Math.max(0, Math.min(height - 1, Math.round(normY * (height - 1))));
  return depth[y * width + x];
}
