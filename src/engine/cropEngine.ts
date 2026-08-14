import { CropSettings } from '../types/editor';

export interface AspectRatioPreset {
  id: string;
  label: string;
  ratio: number | 'free';
  iconName?: string;
  description: string;
  category: 'Social' | 'Standard' | 'Cinema' | 'Print';
}

export const ASPECT_RATIOS: AspectRatioPreset[] = [
  { id: 'free', label: 'Freeform', ratio: 'free', description: 'Unconstrained selection', category: 'Standard' },
  { id: '1:1', label: '1:1 Square', ratio: 1, description: 'Instagram, Avatar, Profile', category: 'Social' },
  { id: '4:5', label: '4:5 Portrait', ratio: 4 / 5, description: 'Instagram Feed Portrait', category: 'Social' },
  { id: '16:9', label: '16:9 Cinema', ratio: 16 / 9, description: 'YouTube, 4K Screen, Landscape', category: 'Cinema' },
  { id: '9:16', label: '9:16 Story', ratio: 9 / 16, description: 'Reels, TikTok, Shorts, Stories', category: 'Social' },
  { id: '3:4', label: '3:4 Portrait', ratio: 3 / 4, description: 'Standard Portrait & Print', category: 'Print' },
  { id: '4:3', label: '4:3 Standard', ratio: 4 / 3, description: 'iPad, Micro 4/3, Monitor', category: 'Standard' },
  { id: '3:2', label: '3:2 Classic', ratio: 3 / 2, description: 'Standard 35mm DSLR/Mirrorless', category: 'Standard' },
  { id: '2:3', label: '2:3 Vertical', ratio: 2 / 3, description: 'Vertical 35mm Classic', category: 'Standard' },
  { id: '2.39:1', label: '2.39:1 Anamorphic', ratio: 2.39, description: 'Cinematic Widescreen Scope', category: 'Cinema' },
  { id: 'golden', label: 'Golden Ratio', ratio: 1.618, description: '1.618 Divine Harmonic Proportion', category: 'Print' },
];

/**
 * Intelligent Smart Crop algorithm:
 * Uses edge-gradient variance and luminance energy map to detect the primary subject
 * and calculate the best composition box (Rule-of-Thirds).
 */
export function calculateSmartCrop(
  source: HTMLCanvasElement | HTMLImageElement,
  targetRatio: number | 'free' = 'free'
): { x: number; y: number; width: number; height: number } {
  const srcW = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const srcH = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  if (srcW <= 0 || srcH <= 0) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }

  // Create low-res analysis canvas
  const sampleW = Math.min(256, srcW);
  const sampleH = Math.round((sampleW / srcW) * srcH);

  const canvas = document.createElement('canvas');
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { x: 0, y: 0, width: 1, height: 1 };

  ctx.drawImage(source, 0, 0, sampleW, sampleH);
  const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
  const d = imgData.data;

  // Saliency energy grid (16x16 blocks)
  const gridX = 16;
  const gridY = 16;
  const blockW = sampleW / gridX;
  const blockH = sampleH / gridY;
  const energy = new Float32Array(gridX * gridY);

  let totalEnergy = 0;
  let weightedCenterX = 0;
  let weightedCenterY = 0;

  for (let gy = 0; gy < gridY; gy++) {
    for (let gx = 0; gx < gridX; gx++) {
      let blockGrad = 0;
      const startX = Math.floor(gx * blockW);
      const endX = Math.floor((gx + 1) * blockW);
      const startY = Math.floor(gy * blockH);
      const endY = Math.floor((gy + 1) * blockH);

      for (let y = startY; y < endY - 1; y += 2) {
        for (let x = startX; x < endX - 1; x += 2) {
          const idx = (y * sampleW + x) * 4;
          const idxRight = (y * sampleW + (x + 1)) * 4;
          const idxDown = ((y + 1) * sampleW + x) * 4;

          const l = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
          const lR = 0.299 * d[idxRight] + 0.587 * d[idxRight + 1] + 0.114 * d[idxRight + 2];
          const lD = 0.299 * d[idxDown] + 0.587 * d[idxDown + 1] + 0.114 * d[idxDown + 2];

          const gxVal = Math.abs(lR - l);
          const gyVal = Math.abs(lD - l);
          blockGrad += Math.sqrt(gxVal * gxVal + gyVal * gyVal);
        }
      }

      // Center bias weight
      const normCenterX = (gx + 0.5) / gridX - 0.5;
      const normCenterY = (gy + 0.5) / gridY - 0.5;
      const distFromCenter = Math.sqrt(normCenterX * normCenterX + normCenterY * normCenterY);
      const centerWeight = Math.max(0.2, 1.0 - distFromCenter * 0.9);

      const cellEnergy = blockGrad * centerWeight;
      energy[gy * gridX + gx] = cellEnergy;
      totalEnergy += cellEnergy;

      weightedCenterX += (gx + 0.5) * cellEnergy;
      weightedCenterY += (gy + 0.5) * cellEnergy;
    }
  }

  const focusNormX = totalEnergy > 0 ? (weightedCenterX / totalEnergy) / gridX : 0.5;
  const focusNormY = totalEnergy > 0 ? (weightedCenterY / totalEnergy) / gridY : 0.5;

  let cropW = 1;
  let cropH = 1;

  if (targetRatio === 'free') {
    // Smart framing: crop 80% around focal center
    cropW = 0.85;
    cropH = 0.85;
  } else {
    const srcAspect = srcW / srcH;
    if (srcAspect > targetRatio) {
      // Source is wider than target ratio
      cropH = 0.92;
      cropW = (cropH * targetRatio) / srcAspect;
    } else {
      // Source is taller than target ratio
      cropW = 0.92;
      cropH = (cropW * srcAspect) / targetRatio;
    }
  }

  // Position crop box centering on the focal point with rule of thirds
  let cropX = focusNormX - cropW / 2;
  let cropY = focusNormY - cropH / 2;

  // Clamp within image bounds [0, 1]
  cropX = Math.max(0, Math.min(1 - cropW, cropX));
  cropY = Math.max(0, Math.min(1 - cropH, cropY));

  return {
    x: Number(cropX.toFixed(3)),
    y: Number(cropY.toFixed(3)),
    width: Number(cropW.toFixed(3)),
    height: Number(cropH.toFixed(3)),
  };
}

/**
 * Auto-Straighten: detects dominant horizontal/horizon line angle (-15° to +15°)
 */
export function calculateAutoStraighten(source: HTMLCanvasElement | HTMLImageElement): number {
  const srcW = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const srcH = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  const sampleW = 200;
  const sampleH = Math.round((sampleW / srcW) * srcH);

  const canvas = document.createElement('canvas');
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0;

  ctx.drawImage(source, 0, 0, sampleW, sampleH);
  const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
  const d = imgData.data;

  // Test rotation angles from -15° to +15° in 0.5° increments
  const testAngles: number[] = [];
  for (let a = -15; a <= 15; a += 0.5) testAngles.push(a);

  let bestAngle = 0;
  let maxHorizontalEnergy = -1;

  for (const angle of testAngles) {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    let energySum = 0;
    // Sample along multiple horizontal scanlines
    for (let y = Math.floor(sampleH * 0.25); y < Math.floor(sampleH * 0.75); y += 3) {
      let rowVar = 0;
      let prevL = -1;

      for (let x = Math.floor(sampleW * 0.2); x < Math.floor(sampleW * 0.8); x += 2) {
        // Rotate point
        const cx = sampleW / 2;
        const cy = sampleH / 2;
        const rx = Math.round(cx + (x - cx) * cos - (y - cy) * sin);
        const ry = Math.round(cy + (x - cx) * sin + (y - cy) * cos);

        if (rx >= 0 && rx < sampleW && ry >= 0 && ry < sampleH) {
          const idx = (ry * sampleW + rx) * 4;
          const l = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
          if (prevL !== -1) {
            rowVar += Math.abs(l - prevL);
          }
          prevL = l;
        }
      }
      energySum += rowVar;
    }

    if (energySum > maxHorizontalEnergy) {
      maxHorizontalEnergy = energySum;
      bestAngle = angle;
    }
  }

  // Clamp small noise near 0
  if (Math.abs(bestAngle) < 0.3) return 0;
  return Number((-bestAngle * 0.75).toFixed(1));
}

/**
 * Auto-Perspective: estimates vertical keystoning angle from vertical edge convergence
 */
export function calculateAutoPerspective(source: HTMLCanvasElement | HTMLImageElement): {
  perspectiveX: number;
  perspectiveY: number;
} {
  const srcW = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const srcH = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  const sampleW = 160;
  const sampleH = Math.round((sampleW / srcW) * srcH);

  const canvas = document.createElement('canvas');
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { perspectiveX: 0, perspectiveY: 0 };

  ctx.drawImage(source, 0, 0, sampleW, sampleH);
  const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
  const d = imgData.data;

  // Measure top half vertical energy vs bottom half vertical energy
  let topEnergy = 0;
  let bottomEnergy = 0;
  const midY = Math.floor(sampleH / 2);

  for (let y = 5; y < midY; y += 2) {
    for (let x = 5; x < sampleW - 5; x += 2) {
      const idx = (y * sampleW + x) * 4;
      const idxD = ((y + 1) * sampleW + x) * 4;
      topEnergy += Math.abs(d[idx] - d[idxD]);
    }
  }

  for (let y = midY; y < sampleH - 5; y += 2) {
    for (let x = 5; x < sampleW - 5; x += 2) {
      const idx = (y * sampleW + x) * 4;
      const idxD = ((y + 1) * sampleW + x) * 4;
      bottomEnergy += Math.abs(d[idx] - d[idxD]);
    }
  }

  const ratio = bottomEnergy > 0 ? (topEnergy - bottomEnergy) / (topEnergy + bottomEnergy) : 0;
  const pY = Math.max(-50, Math.min(50, Math.round(ratio * 60)));

  return {
    perspectiveX: 0,
    perspectiveY: pY,
  };
}

/**
 * Apply 2.5D bilinear projective perspective warp to a canvas
 */
function applyPerspectiveWarp(
  sourceCanvas: HTMLCanvasElement,
  perspectiveX: number,
  perspectiveY: number
): HTMLCanvasElement {
  if (perspectiveX === 0 && perspectiveY === 0) return sourceCanvas;

  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const output = document.createElement('canvas');
  output.width = w;
  output.height = h;
  const ctx = output.getContext('2d');
  if (!ctx) return sourceCanvas;

  // Bilinear perspective quad mapping
  const py = perspectiveY / 100; // -1 to 1
  const px = perspectiveX / 100;

  // Draw slice-by-slice vertical / horizontal perspective trapezoid
  const slices = 64;
  for (let i = 0; i < slices; i++) {
    const srcY = (i / slices) * h;
    const sliceH = Math.ceil(h / slices);

    // Trapezoid scaling factor based on vertical perspective
    const normY = (i / slices) - 0.5; // -0.5 to 0.5
    const widthScale = 1.0 + normY * py * 0.8;
    const destW = w * Math.max(0.2, widthScale);
    const destX = (w - destW) / 2 + (px * (normY * w * 0.4));
    const destY = srcY;

    ctx.drawImage(
      sourceCanvas,
      0,
      srcY,
      w,
      sliceH,
      destX,
      destY,
      destW,
      sliceH
    );
  }

  return output;
}

/**
 * Master transformation engine:
 * 1. Normalized Sub-Rectangle Crop
 * 2. Perspective correction (vertical & horizontal trapezoid 3D tilt)
 * 3. Straighten & Rotation angle (-45° to +45°, 90°, 180°, 270°)
 * 4. Flip Horizontal / Flip Vertical
 * 5. Canvas Expansion & Outcrop (with Color, Gradient, Blur, or Transparent fill)
 * 6. High-Quality Resize
 */
export function applyCropAndTransform(
  sourceCanvas: HTMLCanvasElement | HTMLImageElement,
  crop: CropSettings
): HTMLCanvasElement {
  const srcWidth = sourceCanvas instanceof HTMLImageElement ? sourceCanvas.naturalWidth : sourceCanvas.width;
  const srcHeight = sourceCanvas instanceof HTMLImageElement ? sourceCanvas.naturalHeight : sourceCanvas.height;

  if (srcWidth <= 0 || srcHeight <= 0) {
    const fallback = document.createElement('canvas');
    fallback.width = 100;
    fallback.height = 100;
    return fallback;
  }

  // 1. Calculate Crop Rectangle in source pixel space
  const cropX = Math.max(0, Math.min(srcWidth, crop.x * srcWidth));
  const cropY = Math.max(0, Math.min(srcHeight, crop.y * srcHeight));
  const cropW = Math.max(10, Math.min(srcWidth - cropX, crop.width * srcWidth));
  const cropH = Math.max(10, Math.min(srcHeight - cropY, crop.height * srcHeight));

  // Extract the cropped source patch
  const cropPatchCanvas = document.createElement('canvas');
  cropPatchCanvas.width = Math.round(cropW);
  cropPatchCanvas.height = Math.round(cropH);
  const cpCtx = cropPatchCanvas.getContext('2d')!;
  cpCtx.imageSmoothingEnabled = true;
  cpCtx.imageSmoothingQuality = 'high';

  cpCtx.drawImage(
    sourceCanvas,
    cropX,
    cropY,
    cropW,
    cropH,
    0,
    0,
    cropPatchCanvas.width,
    cropPatchCanvas.height
  );

  // 2. Apply Perspective Warp if set
  let warpedCanvas = cropPatchCanvas;
  if (crop.perspectiveX !== 0 || crop.perspectiveY !== 0) {
    warpedCanvas = applyPerspectiveWarp(cropPatchCanvas, crop.perspectiveX || 0, crop.perspectiveY || 0);
  }

  // 3. Determine output canvas size considering rotation & flips
  const rad = (crop.rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));

  let rotatedW = warpedCanvas.width;
  let rotatedH = warpedCanvas.height;

  if (crop.rotation !== 0) {
    rotatedW = Math.round(warpedCanvas.width * cos + warpedCanvas.height * sin);
    rotatedH = Math.round(warpedCanvas.width * sin + warpedCanvas.height * cos);
  }

  const rotatedCanvas = document.createElement('canvas');
  rotatedCanvas.width = Math.max(10, rotatedW);
  rotatedCanvas.height = Math.max(10, rotatedH);
  const rCtx = rotatedCanvas.getContext('2d')!;
  rCtx.imageSmoothingEnabled = true;
  rCtx.imageSmoothingQuality = 'high';

  rCtx.save();
  rCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);

  if (crop.rotation !== 0) {
    rCtx.rotate(rad);
  }

  const scaleX = crop.flipX ? -1 : 1;
  const scaleY = crop.flipY ? -1 : 1;
  rCtx.scale(scaleX, scaleY);

  rCtx.drawImage(
    warpedCanvas,
    -warpedCanvas.width / 2,
    -warpedCanvas.height / 2,
    warpedCanvas.width,
    warpedCanvas.height
  );
  rCtx.restore();

  // 4. Check Canvas Expansion / Outcrop
  let finalCanvas = rotatedCanvas;

  if (crop.expandCanvas) {
    const padTop = Math.max(0, Math.round(crop.expandTop || 0));
    const padBottom = Math.max(0, Math.round(crop.expandBottom || 0));
    const padLeft = Math.max(0, Math.round(crop.expandLeft || 0));
    const padRight = Math.max(0, Math.round(crop.expandRight || 0));

    if (padTop > 0 || padBottom > 0 || padLeft > 0 || padRight > 0) {
      const expW = rotatedCanvas.width + padLeft + padRight;
      const expH = rotatedCanvas.height + padTop + padBottom;

      const expCanvas = document.createElement('canvas');
      expCanvas.width = expW;
      expCanvas.height = expH;
      const eCtx = expCanvas.getContext('2d')!;

      // Background Fill handling
      if (crop.bgFillType === 'color') {
        eCtx.fillStyle = crop.bgColor || '#000000';
        eCtx.fillRect(0, 0, expW, expH);
      } else if (crop.bgFillType === 'gradient') {
        const gradConf = crop.bgGradient || {
          type: 'linear',
          color1: '#0f172a',
          color2: '#020617',
          angle: 135,
        };

        if (gradConf.type === 'radial') {
          const radial = eCtx.createRadialGradient(
            expW / 2,
            expH / 2,
            Math.min(expW, expH) * 0.1,
            expW / 2,
            expH / 2,
            Math.max(expW, expH) * 0.8
          );
          radial.addColorStop(0, gradConf.color1);
          radial.addColorStop(1, gradConf.color2);
          eCtx.fillStyle = radial;
        } else {
          const angleRad = ((gradConf.angle || 135) * Math.PI) / 180;
          const x1 = expW / 2 - (Math.cos(angleRad) * expW) / 2;
          const y1 = expH / 2 - (Math.sin(angleRad) * expH) / 2;
          const x2 = expW / 2 + (Math.cos(angleRad) * expW) / 2;
          const y2 = expH / 2 + (Math.sin(angleRad) * expH) / 2;
          const linear = eCtx.createLinearGradient(x1, y1, x2, y2);
          linear.addColorStop(0, gradConf.color1);
          linear.addColorStop(1, gradConf.color2);
          eCtx.fillStyle = linear;
        }
        eCtx.fillRect(0, 0, expW, expH);
      } else if (crop.bgFillType === 'blur') {
        // Draw stretched & blurred backdrop
        eCtx.save();
        eCtx.filter = `blur(${crop.blurAmount || 24}px)`;
        eCtx.drawImage(rotatedCanvas, -20, -20, expW + 40, expH + 40);
        eCtx.restore();
        // Add subtle darkening overlay for contrast
        eCtx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        eCtx.fillRect(0, 0, expW, expH);
      }

      // Draw the main image centered in padding
      eCtx.drawImage(rotatedCanvas, padLeft, padTop);
      finalCanvas = expCanvas;
    }
  }

  // 5. Custom Dimensions Resize if enabled
  if (crop.customResizeEnabled && crop.targetWidth && crop.targetHeight) {
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = Math.round(crop.targetWidth);
    resizedCanvas.height = Math.round(crop.targetHeight);
    const rzCtx = resizedCanvas.getContext('2d')!;
    rzCtx.imageSmoothingEnabled = true;
    rzCtx.imageSmoothingQuality = 'high';
    rzCtx.drawImage(finalCanvas, 0, 0, resizedCanvas.width, resizedCanvas.height);
    finalCanvas = resizedCanvas;
  }

  return finalCanvas;
}
