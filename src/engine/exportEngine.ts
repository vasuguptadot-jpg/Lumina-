import { AdjustmentSettings, BorderSettings, CropSettings, HSLSettings, SelectiveMask, ToneCurves, WatermarkSettings } from '../types/editor';
import { applyCropAndTransform } from './cropEngine';
import { processImagePipeline } from './colorPipeline';
import { encodeCanvasToTiff } from './tiffEncoder';

export interface ExportConfig {
  format: 'png' | 'jpeg' | 'webp' | 'tiff';
  quality: number; // 0.1 to 1.0
  scaleFactor: number; // 0.5, 1, 2, 4 or custom
  customWidth?: number;
  customHeight?: number;
  filename: string;
}

export interface FullRenderOptions {
  sourceImage: HTMLImageElement | HTMLCanvasElement;
  crop: CropSettings;
  adjustments: AdjustmentSettings;
  toneCurves: ToneCurves;
  hsl: HSLSettings;
  activePresetId?: string | null;
  presetStrength?: number;
  watermark?: WatermarkSettings;
  border?: BorderSettings;
  masks?: SelectiveMask[];
  exportConfig: ExportConfig;
}

export async function exportHighResImage(options: FullRenderOptions): Promise<{ blob: Blob; url: string; width: number; height: number; sizeBytes: number }> {
  const {
    sourceImage,
    crop,
    adjustments,
    toneCurves,
    hsl,
    activePresetId,
    presetStrength,
    watermark,
    border,
    masks,
    exportConfig,
  } = options;

  // 1. First apply Crop and Transform at full native image resolution
  const croppedCanvas = applyCropAndTransform(sourceImage, crop);

  // 2. Determine target export dimensions
  let targetW = croppedCanvas.width;
  let targetH = croppedCanvas.height;

  if (exportConfig.customWidth && exportConfig.customHeight) {
    targetW = Math.round(exportConfig.customWidth);
    targetH = Math.round(exportConfig.customHeight);
  } else if (exportConfig.scaleFactor && exportConfig.scaleFactor !== 1) {
    targetW = Math.round(targetW * exportConfig.scaleFactor);
    targetH = Math.round(targetH * exportConfig.scaleFactor);
  }

  // 3. Upscale / Downscale canvas if necessary with high quality smoothing
  let renderSourceCanvas: HTMLCanvasElement = croppedCanvas;
  if (targetW !== croppedCanvas.width || targetH !== croppedCanvas.height) {
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = targetW;
    scaledCanvas.height = targetH;
    const sCtx = scaledCanvas.getContext('2d')!;
    sCtx.imageSmoothingEnabled = true;
    sCtx.imageSmoothingQuality = 'high';
    sCtx.drawImage(croppedCanvas, 0, 0, targetW, targetH);
    renderSourceCanvas = scaledCanvas;
  }

  // 4. Run the complete color grading & filtering pipeline at full export resolution
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetW;
  finalCanvas.height = targetH;

  processImagePipeline({
    sourceCanvas: renderSourceCanvas,
    targetCanvas: finalCanvas,
    adjustments,
    toneCurves,
    hsl,
    activePresetId,
    presetStrength,
    watermark,
    border,
    masks,
    highQuality: true,
  });

  // 5. Encode output format
  let blob: Blob;

  if (exportConfig.format === 'tiff') {
    blob = encodeCanvasToTiff(finalCanvas);
  } else {
    const mimeType = exportConfig.format === 'png' ? 'image/png' : exportConfig.format === 'webp' ? 'image/webp' : 'image/jpeg';
    blob = await new Promise<Blob>((resolve) => {
      finalCanvas.toBlob((b) => resolve(b || new Blob()), mimeType, exportConfig.quality);
    });
  }

  const url = URL.createObjectURL(blob);
  return {
    blob,
    url,
    width: targetW,
    height: targetH,
    sizeBytes: blob.size,
  };
}

export function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
