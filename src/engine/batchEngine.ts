import JSZip from 'jszip';
import { BatchProcessingOptions, BatchQueueItem, FilterPreset } from '../types/editor';
import { processImagePipeline } from './colorPipeline';
import { encodeCanvasToTiff } from './tiffEncoder';
import { encodeCanvasToPsd } from './psdEncoder';
import { encodeCanvasToDng } from './dngEncoder';
import { DEFAULT_ADJUSTMENTS, DEFAULT_HSL, DEFAULT_TONE_CURVES } from './defaultSettings';
import { getPresetById } from './presets';

// Helper to compute formatted batch output filename
export function computeBatchFilename(
  originalName: string,
  options: BatchProcessingOptions,
  index: number,
  width: number,
  height: number,
  presetName?: string
): string {
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  const seqNum = (options.startSeqIndex || 1) + index;
  const seqStr = String(seqNum);
  const seq2Str = String(seqNum).padStart(2, '0');
  const seq3Str = String(seqNum).padStart(3, '0');

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

  let pattern = options.namingPattern || '{name}_lumina';
  let formatted = pattern
    .replace(/\{name\}/gi, baseName)
    .replace(/\{seq3\}/gi, seq3Str)
    .replace(/\{seq2\}/gi, seq2Str)
    .replace(/\{seq\}/gi, seqStr)
    .replace(/\{date\}/gi, dateStr)
    .replace(/\{time\}/gi, timeStr)
    .replace(/\{preset\}/gi, presetName ? presetName.replace(/\s+/g, '_') : 'natural')
    .replace(/\{w\}/gi, String(width))
    .replace(/\{h\}/gi, String(height))
    .replace(/\{ext\}/gi, options.outputFormat);

  // Apply Prefix / Suffix
  if (options.namePrefix) {
    formatted = `${options.namePrefix}${formatted}`;
  }
  if (options.nameSuffix) {
    formatted = `${formatted}${options.nameSuffix}`;
  }

  // Apply Find & Replace
  if (options.findText) {
    formatted = formatted.replaceAll(options.findText, options.replaceText || '');
  }

  // Ensure valid extension
  return `${formatted}.${options.outputFormat}`;
}

// Compute scaled dimensions based on chosen mode
export function calculateBatchDimensions(
  srcW: number,
  srcH: number,
  options: BatchProcessingOptions
): { width: number; height: number } {
  const mode = options.resizeOption || 'original';

  if (mode === 'original') {
    return { width: srcW, height: srcH };
  }

  if (mode === 'percentage' || mode === '50%' || mode === '200%') {
    let scale = 1;
    if (mode === '50%') scale = 0.5;
    else if (mode === '200%') scale = 2.0;
    else if (options.scalePercent) scale = options.scalePercent / 100;

    return {
      width: Math.max(1, Math.round(srcW * scale)),
      height: Math.max(1, Math.round(srcH * scale)),
    };
  }

  if (mode === 'long-edge') {
    const targetLong = options.longEdgePx || 2048;
    const isLandscape = srcW >= srcH;
    if (isLandscape) {
      const ratio = targetLong / srcW;
      return { width: targetLong, height: Math.max(1, Math.round(srcH * ratio)) };
    } else {
      const ratio = targetLong / srcH;
      return { width: Math.max(1, Math.round(srcW * ratio)), height: targetLong };
    }
  }

  if (mode === 'short-edge') {
    const targetShort = options.shortEdgePx || 1080;
    const isLandscape = srcW >= srcH;
    if (isLandscape) {
      const ratio = targetShort / srcH;
      return { width: Math.max(1, Math.round(srcW * ratio)), height: targetShort };
    } else {
      const ratio = targetShort / srcW;
      return { width: targetShort, height: Math.max(1, Math.round(srcH * ratio)) };
    }
  }

  if (mode === 'fit-box' || mode === 'max-width' || mode === 'max-height' || mode === 'custom') {
    const maxW = options.maxWidth || (mode === 'max-width' ? 2400 : 3840);
    const maxH = options.maxHeight || (mode === 'max-height' ? 1600 : 2160);

    const scaleW = maxW / srcW;
    const scaleH = maxH / srcH;
    const scale = Math.min(scaleW, scaleH, 1); // Fit within without stretching

    return {
      width: Math.max(1, Math.round(srcW * scale)),
      height: Math.max(1, Math.round(srcH * scale)),
    };
  }

  if (mode === 'social-preset') {
    const target = options.socialTarget || 'insta-portrait';
    switch (target) {
      case 'insta-square':
        return { width: 1080, height: 1080 };
      case 'insta-portrait':
        return { width: 1080, height: 1350 };
      case 'insta-landscape':
        return { width: 1080, height: 566 };
      case 'story-reels':
        return { width: 1080, height: 1920 };
      case 'twitter-post':
        return { width: 1200, height: 675 };
      case 'youtube-thumb':
        return { width: 1280, height: 720 };
      default:
        return { width: 1080, height: 1080 };
    }
  }

  return { width: srcW, height: srcH };
}

// Process a single queue item with full fidelity
export async function processSingleBatchItem(
  item: BatchQueueItem,
  options: BatchProcessingOptions,
  index: number = 0,
  customPresets: FilterPreset[] = [],
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; filename: string; width: number; height: number }> {
  // 1. Load source image
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image "${item.file.name}"`));
    img.src = item.originalUrl;
  });

  onProgress?.(25);

  // 2. Calculate final target dimensions
  const dims = calculateBatchDimensions(img.naturalWidth, img.naturalHeight, options);
  const targetW = dims.width;
  const targetH = dims.height;

  // 3. Create canvas and scale
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // If social preset mode with fixed aspect ratio, use cover-fit
  if (options.resizeOption === 'social-preset') {
    const srcRatio = img.naturalWidth / img.naturalHeight;
    const targetRatio = targetW / targetH;
    let sx = 0, sy = 0, sW = img.naturalWidth, sH = img.naturalHeight;

    if (srcRatio > targetRatio) {
      sW = img.naturalHeight * targetRatio;
      sx = (img.naturalWidth - sW) / 2;
    } else {
      sH = img.naturalWidth / targetRatio;
      sy = (img.naturalHeight - sH) / 2;
    }
    ctx.drawImage(img, sx, sy, sW, sH, 0, 0, targetW, targetH);
  } else {
    ctx.drawImage(img, 0, 0, targetW, targetH);
  }

  onProgress?.(55);

  // 4. Resolve adjustments, curves, HSL, presets & watermarks
  const adjustments = item.customSettings || options.applyAdjustments || DEFAULT_ADJUSTMENTS;
  const toneCurves = item.customToneCurves || options.applyToneCurves || DEFAULT_TONE_CURVES;
  const hsl = item.customHsl || options.applyHsl || DEFAULT_HSL;
  const presetId = item.customPresetId || options.applyPresetId || null;
  const watermark = options.applyWatermark ? (item.customWatermark || options.watermarkSettings) : undefined;

  // 5. Execute professional color processing pipeline
  processImagePipeline({
    sourceCanvas: canvas,
    targetCanvas: canvas,
    adjustments,
    toneCurves,
    hsl,
    activePresetId: presetId,
    presetStrength: options.presetStrength ?? 100,
    customPresets,
    watermark,
    highQuality: true,
  });

  onProgress?.(80);

  // 6. Encode to target output format
  let blob: Blob;
  const ext = options.outputFormat;

  if (ext === 'tiff') {
    blob = encodeCanvasToTiff(canvas);
  } else if (ext === 'psd') {
    blob = encodeCanvasToPsd(canvas);
  } else if (ext === 'dng') {
    blob = encodeCanvasToDng(canvas);
  } else if (ext === 'heic') {
    blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(new Blob([b || new Blob()], { type: 'image/heic' })), 'image/webp', options.quality);
    });
  } else if (ext === 'avif') {
    blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => {
        if (b && b.type === 'image/avif') {
          resolve(b);
        } else {
          canvas.toBlob((wb) => resolve(new Blob([wb || new Blob()], { type: 'image/avif' })), 'image/webp', options.quality);
        }
      }, 'image/avif', options.quality);
    });
  } else if (ext === 'png') {
    blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
    });
  } else if (ext === 'webp') {
    blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), 'image/webp', options.quality);
    });
  } else {
    blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', options.quality);
    });
  }

  onProgress?.(100);

  // 7. Resolve preset name for naming template
  const presetObj = presetId ? getPresetById(presetId, customPresets) : undefined;
  const outName = computeBatchFilename(item.file.name, options, index, targetW, targetH, presetObj?.name);

  return { blob, filename: outName, width: targetW, height: targetH };
}

// Generate ZIP package of all completed items
export async function createBatchZipArchive(
  items: Array<{ blob: Blob; filename: string }>,
  onZipProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  items.forEach((item) => {
    zip.file(item.filename, item.blob);
  });

  return await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onZipProgress?.(Math.round(metadata.percent));
    }
  );
}
