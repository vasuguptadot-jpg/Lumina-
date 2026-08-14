import JSZip from 'jszip';
import { BatchProcessingOptions, BatchQueueItem } from '../types/editor';
import { processImagePipeline } from './colorPipeline';
import { encodeCanvasToTiff } from './tiffEncoder';
import { DEFAULT_ADJUSTMENTS, DEFAULT_HSL, DEFAULT_TONE_CURVES } from './defaultSettings';

export async function processSingleBatchItem(
  item: BatchQueueItem,
  options: BatchProcessingOptions,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; filename: string }> {
  // Load source image
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load ${item.file.name}`));
    img.src = item.originalUrl;
  });

  onProgress?.(30);

  // Determine output dimensions
  let targetW = img.naturalWidth;
  let targetH = img.naturalHeight;

  if (options.resizeOption === '50%') {
    targetW = Math.round(targetW * 0.5);
    targetH = Math.round(targetH * 0.5);
  } else if (options.resizeOption === '200%') {
    targetW = Math.round(targetW * 2);
    targetH = Math.round(targetH * 2);
  } else if (options.resizeOption === 'max-width' && options.maxWidth && targetW > options.maxWidth) {
    const ratio = options.maxWidth / targetW;
    targetW = options.maxWidth;
    targetH = Math.round(targetH * ratio);
  } else if (options.resizeOption === 'max-height' && options.maxHeight && targetH > options.maxHeight) {
    const ratio = options.maxHeight / targetH;
    targetH = options.maxHeight;
    targetW = Math.round(targetW * ratio);
  }

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, targetW, targetH);

  onProgress?.(60);

  const adjustments = item.customSettings || options.applyAdjustments || DEFAULT_ADJUSTMENTS;
  const presetId = item.customPresetId || options.applyPresetId;

  // Process pipeline
  processImagePipeline({
    sourceCanvas: canvas,
    targetCanvas: canvas,
    adjustments,
    toneCurves: DEFAULT_TONE_CURVES,
    hsl: DEFAULT_HSL,
    activePresetId: presetId,
    presetStrength: options.presetStrength ?? 100,
    watermark: options.applyWatermark ? options.watermarkSettings : undefined,
    highQuality: true,
  });

  onProgress?.(85);

  // Encode
  let blob: Blob;
  const ext = options.outputFormat;

  if (ext === 'tiff') {
    blob = encodeCanvasToTiff(canvas);
  } else {
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), mime, options.quality);
    });
  }

  onProgress?.(100);

  const baseName = item.file.name.replace(/\.[^/.]+$/, '');
  const outName = `${baseName}_lumina.${ext}`;

  return { blob, filename: outName };
}

export async function createBatchZipArchive(
  items: Array<{ blob: Blob; filename: string }>,
  onZipProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  items.forEach((item) => {
    zip.file(item.filename, item.blob);
  });

  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }, (metadata) => {
    onZipProgress?.(Math.round(metadata.percent));
  });
}
