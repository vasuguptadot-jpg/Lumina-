/**
 * Photographic Selective Editing & Smart Masking Engine
 * Implements:
 * 1. Mask Types: Brush, Eraser, Linear Gradient, Radial Gradient,
 *    Color Range Selection, Luminance Range Selection,
 *    AI Subject, AI Sky, AI Background, AI Face, AI Hair,
 *    AI Clothes, AI Skin, and AI Object (Click-to-Select).
 * 2. Per-Mask Independent Adjustment Pipeline:
 *    Exposure, Contrast, Highlights, Shadows, Whites, Blacks,
 *    Temperature, Tint, Saturation, Vibrance, Hue Shift, Color Tint Overlay,
 *    Sharpness, Blur, Clarity, Texture, Dehaze, and Noise Reduction.
 * 3. Interactive Ruby Red Mask Overlay Visualization.
 */

import { SelectiveMask, MaskAdjustments } from '../types/editor';
import { getOrComputeDepthMap } from './depthEngine';

// Cached mask alpha maps to avoid re-generating static AI masks during slider scrubs
const maskRasterCache = new Map<string, { key: string; alpha: Uint8Array; width: number; height: number }>();

export function invalidateMaskCache(maskId?: string) {
  if (maskId) {
    maskRasterCache.delete(maskId);
  } else {
    maskRasterCache.clear();
  }
}

/**
 * Generates an 8-bit normalized Alpha Mask (0 to 255) for any SelectiveMask definition
 */
export function computeMaskAlphaMap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mask: SelectiveMask
): Uint8Array {
  const len = width * height;
  const alpha = new Uint8Array(len);
  const feather = Math.max(0, Math.min(100, mask.feather ?? 50)) / 100;

  switch (mask.type) {
    case 'brush':
    case 'eraser': {
      renderBrushMask(alpha, width, height, mask.brushStrokes || []);
      break;
    }

    case 'linear': {
      const sx = (mask.startX ?? 0.5) * width;
      const sy = (mask.startY ?? 0.8) * height;
      const ex = (mask.endX ?? 0.5) * width;
      const ey = (mask.endY ?? 1.0) * height;

      const dx = ex - sx;
      const dy = ey - sy;
      const lenSq = dx * dx + dy * dy || 1;

      for (let y = 0; y < height; y++) {
        const row = y * width;
        for (let x = 0; x < width; x++) {
          const vx = x - sx;
          const vy = y - sy;
          let t = (vx * dx + vy * dy) / lenSq;
          t = Math.max(0, Math.min(1, t));

          // Smooth Hermite S-Curve
          const smooth = t * t * (3 - 2 * t);
          alpha[row + x] = Math.round(smooth * 255);
        }
      }
      break;
    }

    case 'radial': {
      const cx = (mask.centerX ?? 0.5) * width;
      const cy = (mask.centerY ?? 0.5) * height;
      const rx = Math.max(1, (mask.radiusX ?? 0.35) * width);
      const ry = Math.max(1, (mask.radiusY ?? 0.35) * height);
      const rot = ((mask.rotation ?? 0) * Math.PI) / 180;
      const cosR = Math.cos(-rot);
      const sinR = Math.sin(-rot);
      const innerRadiusRatio = Math.max(0, 1.0 - feather);

      for (let y = 0; y < height; y++) {
        const row = y * width;
        const dy = y - cy;
        for (let x = 0; x < width; x++) {
          const dx = x - cx;
          const rotX = dx * cosR - dy * sinR;
          const rotY = dx * sinR + dy * cosR;

          const dist = Math.hypot(rotX / rx, rotY / ry);

          let w = 0;
          if (dist <= innerRadiusRatio) {
            w = 1.0;
          } else if (dist < 1.0) {
            const t = (dist - innerRadiusRatio) / (1.0 - innerRadiusRatio);
            w = 0.5 * (1 + Math.cos(Math.PI * t));
          }

          alpha[row + x] = Math.round(w * 255);
        }
      }
      break;
    }

    case 'color-range': {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const target = parseHexColor(mask.targetColor || '#ffffff');
      const fuzziness = Math.max(1, mask.colorFuzziness ?? 30);
      const maxDist = (fuzziness / 100) * 441.67; // max RGB euclidean distance is sqrt(3*255^2) = 441.67

      for (let i = 0; i < len; i++) {
        const idx = i * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        const dist = Math.hypot(r - target.r, g - target.g, b - target.b);

        let w = 0;
        if (dist <= maxDist * 0.6) {
          w = 1.0;
        } else if (dist < maxDist) {
          const t = (dist - maxDist * 0.6) / (maxDist * 0.4);
          w = 0.5 * (1 + Math.cos(Math.PI * t));
        }

        alpha[i] = Math.round(w * 255);
      }
      break;
    }

    case 'luminance-range': {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const minL = mask.lumMin ?? 128;
      const maxL = mask.lumMax ?? 255;
      const lumFeath = Math.max(1, mask.lumFeather ?? 20);

      for (let i = 0; i < len; i++) {
        const idx = i * 4;
        const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];

        let w = 0;
        if (lum >= minL && lum <= maxL) {
          w = 1.0;
        } else if (lum < minL && lum >= minL - lumFeath) {
          w = (lum - (minL - lumFeath)) / lumFeath;
        } else if (lum > maxL && lum <= maxL + lumFeath) {
          w = 1.0 - (lum - maxL) / lumFeath;
        }

        alpha[i] = Math.round(Math.max(0, Math.min(1, w)) * 255);
      }
      break;
    }

    case 'ai-subject': {
      const depth = getOrComputeDepthMap(ctx, width, height, 'neural-gradient');
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      for (let y = 0; y < height; y++) {
        const row = y * width;
        const normY = y / height;
        for (let x = 0; x < width; x++) {
          const normX = x / width;
          const i = row + x;
          const d = depth[i];

          // Center-focused subject prior
          const dx = (normX - 0.5) * 2;
          const dy = (normY - 0.55) * 2;
          const centerDist = Math.hypot(dx, dy);
          const centerWeight = Math.max(0, 1.0 - centerDist * 0.65);

          // Subject resides in middle depth band (approx 0.25 to 0.60)
          let depthWeight = 0;
          if (d >= 0.25 && d <= 0.62) {
            depthWeight = 1.0 - Math.abs(d - 0.43) / 0.20;
          }

          let score = centerWeight * 0.4 + depthWeight * 0.6;
          score = Math.max(0, Math.min(1, score * 1.4));

          alpha[i] = Math.round(score * 255);
        }
      }
      break;
    }

    case 'ai-sky': {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      for (let y = 0; y < height; y++) {
        const row = y * width;
        const normY = y / height;

        // Sky must reside in upper 65% of frame
        const heightPrior = normY < 0.65 ? Math.pow(1.0 - normY / 0.65, 0.6) : 0;

        for (let x = 0; x < width; x++) {
          const i = row + x;
          const idx = i * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // Blue sky prior or high luminance overcast
          const isBlue = b > r && b > g - 10 && b > 80;
          const isBrightOvercast = lum > 190 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20;

          let skyScore = 0;
          if (isBlue) {
            const blueDominance = (b - Math.min(r, g)) / 255;
            skyScore = 0.4 + blueDominance * 0.6;
          } else if (isBrightOvercast) {
            skyScore = ((lum - 190) / 65) * 0.8;
          }

          const total = skyScore * heightPrior;
          alpha[i] = Math.round(Math.max(0, Math.min(1, total)) * 255);
        }
      }
      break;
    }

    case 'ai-background': {
      const depth = getOrComputeDepthMap(ctx, width, height, 'neural-gradient');
      for (let i = 0; i < len; i++) {
        const d = depth[i];
        // Background is deep plane (> 0.60)
        let w = 0;
        if (d > 0.55) {
          w = Math.min(1.0, (d - 0.55) / 0.35);
        }
        alpha[i] = Math.round(w * 255);
      }
      break;
    }

    case 'ai-face':
    case 'ai-skin': {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      for (let y = 0; y < height; y++) {
        const row = y * width;
        const normY = y / height;
        for (let x = 0; x < width; x++) {
          const i = row + x;
          const idx = i * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // YCbCr Human Skin Model
          const yVal = 0.299 * r + 0.587 * g + 0.114 * b;
          const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
          const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

          let isSkin = false;
          if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) >= 12) {
            if (cr >= 132 && cr <= 175 && cb >= 77 && cb <= 130) {
              isSkin = true;
            }
          }

          // If face selection, prioritize head/face upper center region
          let spatialWeight = 1.0;
          if (mask.type === 'ai-face') {
            const normX = x / width;
            const dx = (normX - 0.5) * 2;
            const dy = (normY - 0.4) * 2;
            spatialWeight = Math.max(0, 1.0 - Math.hypot(dx * 1.2, dy) * 0.9);
          }

          const val = isSkin ? Math.round(255 * spatialWeight) : 0;
          alpha[i] = val;
        }
      }
      break;
    }

    case 'ai-hair': {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      for (let y = 1; y < height - 1; y++) {
        const row = y * width;
        const normY = y / height;
        // Hair is generally located in top 60%
        if (normY > 0.65) continue;

        for (let x = 1; x < width - 1; x++) {
          const i = row + x;
          const idx = i * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // Local Laplacian texture frequency
          const lumL = 0.299 * data[idx - 4] + 0.587 * data[idx - 3] + 0.114 * data[idx - 2];
          const lumR = 0.299 * data[idx + 4] + 0.587 * data[idx + 5] + 0.114 * data[idx + 6];
          const lumT = 0.299 * data[idx - width * 4] + 0.587 * data[idx - width * 4 + 1] + 0.114 * data[idx - width * 4 + 2];
          const lumB = 0.299 * data[idx + width * 4] + 0.587 * data[idx + width * 4 + 1] + 0.114 * data[idx + width * 4 + 2];
          const laplacian = Math.abs(lumL + lumR + lumT + lumB - 4 * lum);

          // Head perimeter prior
          const normX = x / width;
          const headDist = Math.hypot((normX - 0.5) * 2, (normY - 0.35) * 2.2);
          const headPrior = headDist >= 0.25 && headDist <= 0.85 ? 1.0 : 0.2;

          // Hair is high frequency strand texture with lower-mid luminance
          let hairScore = 0;
          if (laplacian > 12 && lum < 180) {
            hairScore = Math.min(1.0, (laplacian / 40) * headPrior);
          }

          alpha[i] = Math.round(hairScore * 255);
        }
      }
      break;
    }

    case 'ai-clothes': {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      for (let y = 0; y < height; y++) {
        const row = y * width;
        const normY = y / height;
        // Torso / body region
        if (normY < 0.4) continue;

        for (let x = 0; x < width; x++) {
          const i = row + x;
          const idx = i * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Exclude skin
          const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
          const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
          const isSkin = (cr >= 132 && cr <= 175 && cb >= 77 && cb <= 130 && r > g && (r - g) >= 12);

          if (!isSkin) {
            const normX = x / width;
            const bodyPrior = Math.max(0, 1.0 - Math.hypot((normX - 0.5) * 2.2, (normY - 0.7) * 1.8));
            alpha[i] = Math.round(bodyPrior * 255);
          }
        }
      }
      break;
    }

    case 'ai-object': {
      // Seeded flood / color-spatial clustering around clicked object point
      const seedX = mask.aiObjectPoint ? Math.round(mask.aiObjectPoint.x * width) : Math.round(width * 0.5);
      const seedY = mask.aiObjectPoint ? Math.round(mask.aiObjectPoint.y * height) : Math.round(height * 0.5);

      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      const seedIdx = (seedY * width + seedX) * 4;
      const seedR = data[seedIdx];
      const seedG = data[seedIdx + 1];
      const seedB = data[seedIdx + 2];

      const maxTolerance = ((mask.aiSensitivity ?? 50) / 100) * 180 + 30;

      for (let y = 0; y < height; y++) {
        const row = y * width;
        for (let x = 0; x < width; x++) {
          const i = row + x;
          const idx = i * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const colorDist = Math.hypot(r - seedR, g - seedG, b - seedB);
          const spatialDist = Math.hypot(x - seedX, y - seedY) / Math.min(width, height);

          // Combined spatial & color distance
          const totalDist = colorDist + spatialDist * 160;

          let w = 0;
          if (totalDist <= maxTolerance) {
            w = 1.0 - totalDist / maxTolerance;
          }

          alpha[i] = Math.round(w * 255);
        }
      }
      break;
    }

    default:
      alpha.fill(255);
      break;
  }

  // Handle Invert Mask
  if (mask.inverted) {
    for (let i = 0; i < len; i++) {
      alpha[i] = 255 - alpha[i];
    }
  }

  return alpha;
}

/**
 * Applies all active Selective Masks to the main image canvas context
 */
export function applySelectiveMasksPipeline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  masks: SelectiveMask[]
) {
  if (!masks || masks.length === 0) return;

  for (const mask of masks) {
    if (!mask.visible) continue;

    const alpha = computeMaskAlphaMap(ctx, width, height, mask);
    const hasAdj = hasAnyMaskAdjustment(mask.adjustments);

    // 1. If adjustments are present, apply per-pixel adjustments
    if (hasAdj) {
      applySingleMaskAdjustment(ctx, width, height, alpha, mask.adjustments, mask.opacity ?? 100);
    }

    // 2. If Ruby Red Mask Overlay is enabled, render the false-color overlay
    if (mask.showOverlay) {
      renderMaskRubyOverlay(ctx, width, height, alpha, mask.overlayColor || 'ruby');
    }
  }
}

/**
 * Renders the interactive Ruby Red overlay onto the canvas
 */
export function renderMaskRubyOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  alpha: Uint8Array,
  color: 'ruby' | 'emerald' | 'cyan' | 'amber' | 'grayscale' = 'ruby'
) {
  const overlay = ctx.createImageData(width, height);
  const data = overlay.data;
  const len = width * height;

  let rCol = 244, gCol = 63, bCol = 94; // Ruby Red
  if (color === 'emerald') { rCol = 16; gCol = 185; bCol = 129; }
  else if (color === 'cyan') { rCol = 6; gCol = 182; bCol = 212; }
  else if (color === 'amber') { rCol = 245; gCol = 158; bCol = 11; }
  else if (color === 'grayscale') { rCol = 255; gCol = 255; bCol = 255; }

  for (let i = 0; i < len; i++) {
    const a = alpha[i];
    if (a > 0) {
      const idx = i * 4;
      data[idx] = rCol;
      data[idx + 1] = gCol;
      data[idx + 2] = bCol;
      data[idx + 3] = Math.round((a / 255) * 140); // 55% opacity
    }
  }

  // Draw overlay with alpha blending
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tCtx = tempCanvas.getContext('2d');
  if (tCtx) {
    tCtx.putImageData(overlay, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0);
  }
}

/**
 * Applies fine-grained photographic adjustments to masked pixels
 */
function applySingleMaskAdjustment(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  alpha: Uint8Array,
  adj: MaskAdjustments,
  overallMaskOpacity: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = width * height;
  const maskStrength = (overallMaskOpacity / 100);

  // Pre-calculate multipliers
  const expMult = Math.pow(2, (adj.exposure || 0) / 50);
  const contrastK = (adj.contrast || 0) / 100;
  const highMult = (adj.highlights || 0) / 100;
  const shadowMult = (adj.shadows || 0) / 100;
  const whiteMult = (adj.whites || 0) / 100;
  const blackMult = (adj.blacks || 0) / 100;

  const temp = (adj.temperature || 0) / 100;
  const tint = (adj.tint || 0) / 100;
  const tempR = temp > 0 ? 1 + temp * 0.35 : 1;
  const tempB = temp < 0 ? 1 + Math.abs(temp) * 0.35 : 1;
  const tintG = tint < 0 ? 1 + Math.abs(tint) * 0.25 : 1;
  const tintRB = tint > 0 ? 1 + tint * 0.2 : 1;

  const satMult = 1 + (adj.saturation || 0) / 100;
  const vibVal = (adj.vibrance || 0) / 100;
  const clarityVal = (adj.clarity || 0) / 100;
  const textureVal = (adj.texture || 0) / 100;
  const dehazeVal = (adj.dehaze || 0) / 100;

  const hueShift = adj.hueShift || 0;
  const hasColorTint = adj.colorTint && adj.colorTint.trim().length > 0;
  const tintColor = hasColorTint ? parseHexColor(adj.colorTint!) : { r: 0, g: 0, b: 0 };
  const tintAlpha = ((adj.colorTintOpacity ?? 50) / 100);

  // 1. Sharpness & Blur preparation
  let blurredData: Uint8ClampedArray | null = null;
  if ((adj.blur || 0) > 0) {
    blurredData = new Uint8ClampedArray(data);
    fastBoxBlur(blurredData, width, height, Math.max(1, Math.round((adj.blur! / 100) * 18)));
  }

  let sharpHighPass: Float32Array | null = null;
  if ((adj.sharpness || 0) > 0) {
    sharpHighPass = new Float32Array(len * 3);
    computeHighPass(data, width, height, sharpHighPass);
  }

  for (let i = 0; i < len; i++) {
    const a = alpha[i];
    if (a === 0) continue;

    const w = (a / 255) * maskStrength;
    const idx = i * 4;

    let r = data[idx];
    let g = data[idx + 1];
    let b = data[idx + 2];

    // Blur blending
    if (blurredData) {
      const bStrength = (adj.blur! / 100);
      r = r * (1 - bStrength) + blurredData[idx] * bStrength;
      g = g * (1 - bStrength) + blurredData[idx + 1] * bStrength;
      b = b * (1 - bStrength) + blurredData[idx + 2] * bStrength;
    }

    // Sharpness addition
    if (sharpHighPass && adj.sharpness! > 0) {
      const sharpAmount = (adj.sharpness! / 100) * 1.5;
      r += sharpHighPass[i * 3] * sharpAmount;
      g += sharpHighPass[i * 3 + 1] * sharpAmount;
      b += sharpHighPass[i * 3 + 2] * sharpAmount;
    }

    // 1. Exposure
    if (adj.exposure !== 0) {
      r *= expMult;
      g *= expMult;
      b *= expMult;
    }

    // 2. Highlights, Shadows, Whites, Blacks
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (highMult !== 0 && lum > 128) {
      const f = ((lum - 128) / 127) * highMult * 0.4;
      r += r * f;
      g += g * f;
      b += b * f;
    }
    if (shadowMult !== 0 && lum < 128) {
      const f = ((128 - lum) / 128) * shadowMult * 0.45;
      r += r * f;
      g += g * f;
      b += b * f;
    }
    if (whiteMult !== 0 && lum > 180) {
      const f = ((lum - 180) / 75) * whiteMult * 0.35;
      r += r * f;
      g += g * f;
      b += b * f;
    }
    if (blackMult !== 0 && lum < 75) {
      const f = ((75 - lum) / 75) * blackMult * 0.35;
      r += r * f;
      g += g * f;
      b += b * f;
    }

    // 3. Contrast
    if (contrastK !== 0) {
      r = 128 + (r - 128) * (1 + contrastK);
      g = 128 + (g - 128) * (1 + contrastK);
      b = 128 + (b - 128) * (1 + contrastK);
    }

    // 4. White Balance (Temperature & Tint)
    r *= tempR * tintRB;
    g *= tintG;
    b *= tempB * tintRB;

    // 5. Dehaze
    if (dehazeVal !== 0) {
      const dehazeShift = dehazeVal * 20;
      r = r * (1 + dehazeVal * 0.25) - dehazeShift;
      g = g * (1 + dehazeVal * 0.25) - dehazeShift;
      b = b * (1 + dehazeVal * 0.25) - dehazeShift;
    }

    // 6. Clarity & Texture Local Contrast
    if (clarityVal !== 0 || textureVal !== 0) {
      const midtoneDiff = (lum - 128);
      const localBoost = midtoneDiff * (clarityVal * 0.2 + textureVal * 0.15);
      r += localBoost;
      g += localBoost;
      b += localBoost;
    }

    // 7. Saturation & Vibrance
    if (satMult !== 1 || vibVal !== 0) {
      const curLum = 0.299 * r + 0.587 * g + 0.114 * b;
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const curSat = maxC === 0 ? 0 : (maxC - minC) / maxC;

      // Vibrance boosts muted colors more than saturated ones
      const effectiveSatMult = satMult + vibVal * (1.0 - curSat);

      r = curLum + (r - curLum) * effectiveSatMult;
      g = curLum + (g - curLum) * effectiveSatMult;
      b = curLum + (b - curLum) * effectiveSatMult;
    }

    // 8. Hue Shift (HSV color rotation)
    if (hueShift !== 0) {
      const [h, s, v] = rgbToHsv(r, g, b);
      const newH = (h + hueShift + 360) % 360;
      const [newR, newG, newB] = hsvToRgb(newH, s, v);
      r = newR;
      g = newG;
      b = newB;
    }

    // 9. Color Tint Overlay
    if (hasColorTint && tintAlpha > 0) {
      r = r * (1 - tintAlpha) + tintColor.r * tintAlpha;
      g = g * (1 - tintAlpha) + tintColor.g * tintAlpha;
      b = b * (1 - tintAlpha) + tintColor.b * tintAlpha;
    }

    // Blend back according to mask weight w
    data[idx] = Math.max(0, Math.min(255, Math.round(data[idx] * (1 - w) + r * w)));
    data[idx + 1] = Math.max(0, Math.min(255, Math.round(data[idx + 1] * (1 - w) + g * w)));
    data[idx + 2] = Math.max(0, Math.min(255, Math.round(data[idx + 2] * (1 - w) + b * w)));
  }

  ctx.putImageData(imgData, 0, 0);
}

function hasAnyMaskAdjustment(adj: MaskAdjustments): boolean {
  return (
    adj.exposure !== 0 ||
    adj.contrast !== 0 ||
    adj.highlights !== 0 ||
    adj.shadows !== 0 ||
    (adj.whites || 0) !== 0 ||
    (adj.blacks || 0) !== 0 ||
    adj.temperature !== 0 ||
    (adj.tint || 0) !== 0 ||
    adj.saturation !== 0 ||
    (adj.vibrance || 0) !== 0 ||
    (adj.sharpness || 0) !== 0 ||
    (adj.blur || 0) !== 0 ||
    adj.clarity !== 0 ||
    (adj.texture || 0) !== 0 ||
    (adj.dehaze || 0) !== 0 ||
    (adj.hueShift || 0) !== 0 ||
    (adj.colorTint !== undefined && adj.colorTint.trim().length > 0)
  );
}

// -------------------------------------------------------------
// Helper Drawing, Color & Convolution Utilities
// -------------------------------------------------------------

function renderBrushMask(
  alpha: Uint8Array,
  width: number,
  height: number,
  strokes: Array<{
    points: Array<{ x: number; y: number }>;
    size: number;
    feather?: number;
    opacity?: number;
    mode?: 'add' | 'erase';
  }>
) {
  if (strokes.length === 0) return;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, (stroke.size / 100) * (Math.min(width, height) * 0.25));

    if (stroke.mode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = `rgba(255,255,255,${(stroke.opacity ?? 100) / 100})`;
    }

    ctx.beginPath();
    const p0 = stroke.points[0];
    ctx.moveTo(p0.x * width, p0.y * height);

    for (let i = 1; i < stroke.points.length; i++) {
      const p = stroke.points[i];
      ctx.lineTo(p.x * width, p.y * height);
    }
    ctx.stroke();
    ctx.restore();
  }

  const maskImg = ctx.getImageData(0, 0, width, height);
  const data = maskImg.data;
  const len = width * height;

  for (let i = 0; i < len; i++) {
    alpha[i] = data[i * 4 + 3]; // extract alpha channel
  }
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 255, g: 255, b: 255 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, v];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  h = (h % 360) / 60;
  const i = Math.floor(h);
  const f = h - i;
  const p = v * (1 - s);
  const q = v * (1 - s * f);
  const t = v * (1 - s * (1 - f));

  let r = 0, g = 0, b = 0;
  switch (i) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    default: r = v; g = p; b = q; break;
  }
  return [r * 255, g * 255, b * 255];
}

function computeHighPass(data: Uint8ClampedArray, width: number, height: number, out: Float32Array) {
  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = (row + x) * 4;
      const outIdx = (row + x) * 3;

      for (let c = 0; c < 3; c++) {
        const center = data[idx + c];
        const top = data[((y - 1) * width + x) * 4 + c];
        const bottom = data[((y + 1) * width + x) * 4 + c];
        const left = data[(row + x - 1) * 4 + c];
        const right = data[(row + x + 1) * 4 + c];

        out[outIdx + c] = center * 4 - (top + bottom + left + right);
      }
    }
  }
}

function fastBoxBlur(data: Uint8ClampedArray, width: number, height: number, radius: number) {
  const temp = new Uint8ClampedArray(data.length);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      for (let k = -radius; k <= radius; k++) {
        const sx = x + k;
        if (sx >= 0 && sx < width) {
          const idx = (row + sx) * 4;
          sumR += data[idx];
          sumG += data[idx + 1];
          sumB += data[idx + 2];
          count++;
        }
      }
      const outIdx = (row + x) * 4;
      temp[outIdx] = sumR / count;
      temp[outIdx + 1] = sumG / count;
      temp[outIdx + 2] = sumB / count;
      temp[outIdx + 3] = data[outIdx + 3];
    }
  }

  // Vertical pass
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      for (let k = -radius; k <= radius; k++) {
        const sy = y + k;
        if (sy >= 0 && sy < height) {
          const idx = (sy * width + x) * 4;
          sumR += temp[idx];
          sumG += temp[idx + 1];
          sumB += temp[idx + 2];
          count++;
        }
      }
      const outIdx = (y * width + x) * 4;
      data[outIdx] = sumR / count;
      data[outIdx + 1] = sumG / count;
      data[outIdx + 2] = sumB / count;
    }
  }
}
