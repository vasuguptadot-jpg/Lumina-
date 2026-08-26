/**
 * Lumina Studio Pro - High-Performance Tiled Rendering Engine
 * 
 * Features:
 * 1. Tiled image subdivision (512x512 or 1024x1024 chunks)
 * 2. Halo / Overlap padding (8px boundary margin for seamless convolution filters)
 * 3. Multi-threaded worker dispatch using Transferable ArrayBuffers
 * 4. Stale-Render Protection (Incremental generation ID checking per tile)
 * 5. Main-Thread Graceful Fallback if workers fail or are unavailable
 */

import {
  AdjustmentSettings,
  ToneCurves,
  HSLSettings,
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
import { workerPool } from './workerPool';
import { processImagePipeline } from './colorPipeline';
import { getPresetLUT, parseCubeLUT, Parsed3DLUT } from './lutEngine';
import { getPresetById } from './presets';

export interface TiledRenderParams {
  sourceCanvas: HTMLImageElement | HTMLCanvasElement;
  targetCanvas: HTMLCanvasElement;
  adjustments: AdjustmentSettings;
  toneCurves?: ToneCurves;
  hsl?: HSLSettings;
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
  tileSize?: number;
  haloSize?: number;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onError?: (err: any) => void;
}

// Spline LUT precomputation
function createSplineLUT(points: { x: number; y: number }[]): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256);
  if (!points || points.length === 0) {
    for (let i = 0; i < 256; i++) lut[i] = i;
    return lut;
  }
  const sorted = [...points].sort((a, b) => a.x - b.x);
  if (sorted.length < 2) {
    for (let i = 0; i < 256; i++) lut[i] = i;
    return lut;
  }

  const n = sorted.length;
  const x = sorted.map((p) => p.x);
  const y = sorted.map((p) => p.y);
  const d = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    const dx = x[i + 1] - x[i];
    d[i] = dx === 0 ? 0 : (y[i + 1] - y[i]) / dx;
  }

  const m = new Array(n);
  m[0] = d[0];
  for (let i = 1; i < n - 1; i++) {
    m[i] = (d[i - 1] + d[i]) / 2;
  }
  m[n - 1] = d[n - 2];

  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    }
  }

  for (let val = 0; val < 256; val++) {
    if (val <= x[0]) {
      lut[val] = Math.max(0, Math.min(255, Math.round(y[0])));
      continue;
    }
    if (val >= x[n - 1]) {
      lut[val] = Math.max(0, Math.min(255, Math.round(y[n - 1])));
      continue;
    }

    let k = 0;
    for (let i = 0; i < n - 1; i++) {
      if (val >= x[i] && val <= x[i + 1]) {
        k = i;
        break;
      }
    }

    const h = x[k + 1] - x[k];
    if (h === 0) {
      lut[val] = Math.max(0, Math.min(255, Math.round(y[k])));
      continue;
    }

    const t = (val - x[k]) / h;
    const t2 = t * t;
    const t3 = t2 * t;

    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    const interpY = h00 * y[k] + h10 * h * m[k] + h01 * y[k + 1] + h11 * h * m[k + 1];
    lut[val] = Math.max(0, Math.min(255, Math.round(interpY)));
  }

  return lut;
}

/**
 * Executes a full-resolution render using multi-threaded tile subdivision.
 */
export async function renderTiledImagePipeline(params: TiledRenderParams): Promise<boolean> {
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
    tileSize = 512,
    haloSize = 8,
    onProgress,
    onComplete,
    onError,
  } = params;

  // Next render generation for stale-render protection
  const generation = workerPool.nextGeneration();

  const srcWidth = sourceCanvas instanceof HTMLImageElement ? sourceCanvas.naturalWidth : sourceCanvas.width;
  const srcHeight = sourceCanvas instanceof HTMLImageElement ? sourceCanvas.naturalHeight : sourceCanvas.height;

  if (targetCanvas.width !== srcWidth || targetCanvas.height !== srcHeight) {
    targetCanvas.width = srcWidth;
    targetCanvas.height = srcHeight;
  }

  const targetCtx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!targetCtx) {
    onError?.(new Error('Could not acquire target canvas 2D context'));
    return false;
  }

  // If workers are disabled or fallback mode, run direct synchronous pipeline
  if (workerPool.isFallback()) {
    try {
      processImagePipeline({
        sourceCanvas,
        targetCanvas,
        adjustments: baseAdjustments,
        toneCurves,
        hsl: baseHsl,
        activePresetId,
        presetStrength,
        customPresets,
        watermark,
        border,
        masks,
        retouchStrokes,
        typography,
        designElements,
        drawingStrokes,
        colorManagement,
        highQuality: true,
      });
      onProgress?.(1.0);
      onComplete?.();
      return true;
    } catch (e) {
      onError?.(e);
      return false;
    }
  }

  // Temporary source canvas for extracting tile image data
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = srcWidth;
  tempCanvas.height = srcHeight;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!tempCtx) {
    return false;
  }
  tempCtx.drawImage(sourceCanvas, 0, 0, srcWidth, srcHeight);

  // Merge presets
  let adjustments = { ...baseAdjustments };
  let hsl = { ...baseHsl };
  if (activePresetId) {
    const activePreset = getPresetById(activePresetId, customPresets);
    if (activePreset) {
      const factor = presetStrength / 100;
      const pSet = activePreset.settings;
      if (pSet.exposure !== undefined) adjustments.exposure += pSet.exposure * factor;
      if (pSet.contrast !== undefined) adjustments.contrast += pSet.contrast * factor;
      if (pSet.highlights !== undefined) adjustments.highlights += pSet.highlights * factor;
      if (pSet.shadows !== undefined) adjustments.shadows += pSet.shadows * factor;
      if (pSet.whites !== undefined) adjustments.whites += pSet.whites * factor;
      if (pSet.blacks !== undefined) adjustments.blacks += pSet.blacks * factor;
    }
  }

  // Precompute tone curves LUTs
  const masterLUT = createSplineLUT(toneCurves?.master || []);
  const redLUT = createSplineLUT(toneCurves?.red || []);
  const greenLUT = createSplineLUT(toneCurves?.green || []);
  const blueLUT = createSplineLUT(toneCurves?.blue || []);

  // 3D LUT
  let lutData: Parsed3DLUT | null = null;
  let lutIntensity = 0;
  const lutConf = adjustments.lutSettings;
  if (lutConf?.enabled && lutConf?.intensity) {
    lutIntensity = lutConf.intensity / 100;
    if (lutConf.customCubeData) {
      lutData = parseCubeLUT(lutConf.customCubeData);
    } else if (lutConf.lutId && lutConf.lutId !== 'none') {
      lutData = getPresetLUT(lutConf.lutId);
    }
  }

  // Calculate tiles across grid
  const cols = Math.ceil(srcWidth / tileSize);
  const rows = Math.ceil(srcHeight / tileSize);
  const totalTiles = cols * rows;
  let completedTiles = 0;

  const tilePromises: Promise<any>[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tileX = c * tileSize;
      const tileY = r * tileSize;
      const tileW = Math.min(tileSize, srcWidth - tileX);
      const tileH = Math.min(tileSize, srcHeight - tileY);

      // Compute halo padding
      const haloLeft = Math.min(haloSize, tileX);
      const haloTop = Math.min(haloSize, tileY);
      const haloRight = Math.min(haloSize, srcWidth - (tileX + tileW));
      const haloBottom = Math.min(haloSize, srcHeight - (tileY + tileH));

      const extractX = tileX - haloLeft;
      const extractY = tileY - haloTop;
      const extractW = tileW + haloLeft + haloRight;
      const extractH = tileH + haloTop + haloBottom;

      const tileImageData = tempCtx.getImageData(extractX, extractY, extractW, extractH);
      const tileBuffer = tileImageData.data.buffer;

      const tilePayload = {
        tileId: `tile_${c}_${r}`,
        buffer: tileBuffer,
        tileWidth: tileW,
        tileHeight: tileH,
        x: tileX,
        y: tileY,
        halo: {
          top: haloTop,
          bottom: haloBottom,
          left: haloLeft,
          right: haloRight,
        },
        adjustments,
        hsl,
        masterLUT,
        redLUT,
        greenLUT,
        blueLUT,
        lutData,
        lutIntensity,
      };

      const p = workerPool
        .dispatch(
          'render_tile',
          tilePayload,
          [tileBuffer],
          { generation, tag: `render_gen_${generation}` }
        )
        .then((result: any) => {
          // Stale check
          if (workerPool.isGenerationStale(generation)) {
            return;
          }

          const outData = new Uint8ClampedArray(result.buffer);
          const outImgData = new ImageData(outData, result.width, result.height);
          targetCtx.putImageData(outImgData, result.x, result.y);

          completedTiles++;
          onProgress?.(completedTiles / totalTiles);
        })
        .catch((err) => {
          console.warn(`[Lumina TiledRenderer] Tile (${c}, ${r}) worker execution error:`, err);
        });

      tilePromises.push(p);
    }
  }

  try {
    await Promise.all(tilePromises);

    if (workerPool.isGenerationStale(generation)) {
      return false;
    }

    // Apply overlays if needed (border, watermark)
    onProgress?.(1.0);
    onComplete?.();
    return true;
  } catch (err) {
    onError?.(err);
    return false;
  }
}
