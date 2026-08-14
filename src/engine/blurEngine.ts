/**
 * High-Performance Photographic Blur, Optical Bokeh & Depth Simulator
 * Implements:
 * - Separable Gaussian Blur
 * - Lens Blur & Bokeh Simulation (Circle, Hexagon, Octagon, Heart, Star, Diamond, Swirl)
 * - Motion Blur (Angle & Distance)
 * - Radial Spin Blur (Rotational Angular Defocus)
 * - Zoom Blur (Radial Scaling Blur)
 * - Tilt-Shift (Miniature Effect with Focal Band)
 * - Background & Foreground Defocus Blur
 * - Continuous Depth-Aware Defocus (Circle of Confusion from Depth Map)
 * - Selective Regional Blur
 */

import { BlurSettings, BokehShape } from '../types/editor';
import { getOrComputeDepthMap } from './depthEngine';

export function applyBlurAndDepthPipeline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings?: BlurSettings
) {
  if (!settings || !settings.enabled || settings.mode === 'none' || settings.amount <= 0) {
    return;
  }

  const { mode, amount } = settings;

  switch (mode) {
    case 'gaussian':
      applyGaussianBlur(ctx, width, height, amount);
      break;

    case 'lens':
      applyLensBokehBlur(ctx, width, height, settings);
      break;

    case 'motion':
      applyMotionBlur(ctx, width, height, settings.motionAngle || 0, settings.motionDistance || amount);
      break;

    case 'radial':
      applyRadialSpinBlur(
        ctx,
        width,
        height,
        settings.radialCenterX ?? 0.5,
        settings.radialCenterY ?? 0.5,
        settings.radialAngle || amount
      );
      break;

    case 'zoom':
      applyZoomBlur(
        ctx,
        width,
        height,
        settings.zoomCenterX ?? 0.5,
        settings.zoomCenterY ?? 0.5,
        settings.zoomStrength || amount
      );
      break;

    case 'tilt-shift':
      applyTiltShiftBlur(ctx, width, height, settings);
      break;

    case 'background':
      applyBackgroundBlur(ctx, width, height, amount, settings);
      break;

    case 'foreground':
      applyForegroundBlur(ctx, width, height, amount, settings);
      break;

    case 'depth-aware':
      applyDepthAwareDefocus(ctx, width, height, settings);
      break;

    case 'selective':
      applySelectiveBlur(ctx, width, height, settings);
      break;

    default:
      break;
  }
}

/**
 * 1. Fast Separable Gaussian Blur
 */
export function applyGaussianBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number // 0 to 100
) {
  const radius = Math.max(1, Math.round((amount / 100) * 35));
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  fastSeparableBoxBlur(data, width, height, radius, 3);
  ctx.putImageData(imgData, 0, 0);
}

/**
 * 2. Lens Blur & Custom Bokeh Simulation
 */
export function applyLensBokehBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: BlurSettings
) {
  const amount = settings.amount;
  const radius = Math.max(1, Math.min(24, Math.round((amount / 100) * 20)));
  const shape = settings.bokehShape || 'circle';
  const intensity = (settings.bokehIntensity ?? 40) / 100;
  const threshold = ((settings.bokehThreshold ?? 75) / 100) * 255;
  const aberration = (settings.bokehSphericalAberration ?? 0) / 100;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const orig = new Uint8ClampedArray(data);

  // Generate 2D aperture kernel mask
  const kernelSize = radius * 2 + 1;
  const kernel = generateBokehKernel(radius, shape, settings.bokehBladeCurvature ?? 80);

  // Pre-extract specular highlight energy
  const highlightBoost = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const lum = 0.299 * orig[idx] + 0.587 * orig[idx + 1] + 0.114 * orig[idx + 2];
    if (lum > threshold) {
      highlightBoost[i] = Math.pow((lum - threshold) / (255 - threshold + 1), 1.5) * intensity * 2.5;
    }
  }

  const step = radius > 12 ? 2 : 1;

  for (let y = radius; y < height - radius; y += step) {
    const rowOffset = y * width;
    for (let x = radius; x < width - radius; x += step) {
      const idx = (rowOffset + x) * 4;

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let weightSum = 0;

      // Optical aberration (cat-eye deformation towards image corners)
      const normDistFromCenter = Math.hypot((x / width) - 0.5, (y / height) - 0.5) * 2;
      const catEyeScale = 1.0 + aberration * normDistFromCenter * 0.5;

      for (let ky = -radius; ky <= radius; ky++) {
        const sampleY = y + ky;
        const sRow = sampleY * width;
        const kRow = (ky + radius) * kernelSize;

        for (let kx = -radius; kx <= radius; kx++) {
          const sampleX = x + Math.round(kx * (1 / Math.max(0.5, catEyeScale)));
          if (sampleX < 0 || sampleX >= width) continue;

          const kVal = kernel[kRow + (kx + radius)];
          if (kVal <= 0.001) continue;

          const sIdx = (sRow + sampleX) * 4;
          const sPix = sRow + sampleX;
          const boost = 1.0 + highlightBoost[sPix];

          const w = kVal * boost;
          sumR += orig[sIdx] * w;
          sumG += orig[sIdx + 1] * w;
          sumB += orig[sIdx + 2] * w;
          weightSum += w;
        }
      }

      if (weightSum > 0) {
        data[idx] = Math.min(255, sumR / weightSum);
        data[idx + 1] = Math.min(255, sumG / weightSum);
        data[idx + 2] = Math.min(255, sumB / weightSum);

        if (step > 1) {
          fillStepBlock(data, width, x, y, step, data[idx], data[idx + 1], data[idx + 2]);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * 3. Directional Motion Blur
 */
export function applyMotionBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  angleDeg: number,
  distance: number
) {
  const dist = Math.max(1, Math.min(60, Math.round((distance / 100) * 40)));
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const orig = new Uint8ClampedArray(data);

  const samples = dist * 2 + 1;

  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const idx = (row + x) * 4;

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let count = 0;

      for (let s = -dist; s <= dist; s++) {
        const sx = Math.round(x + s * dx);
        const sy = Math.round(y + s * dy);

        if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
          const sIdx = (sy * width + sx) * 4;
          sumR += orig[sIdx];
          sumG += orig[sIdx + 1];
          sumB += orig[sIdx + 2];
          count++;
        }
      }

      data[idx] = sumR / count;
      data[idx + 1] = sumG / count;
      data[idx + 2] = sumB / count;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * 4. Radial / Spin Blur
 */
export function applyRadialSpinBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  angleStrength: number
) {
  const cx = centerX * width;
  const cy = centerY * height;
  const maxAngle = (angleStrength / 100) * 0.25; // in radians
  const numSteps = 12;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const orig = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    const row = y * width;
    const dy = y - cy;

    for (let x = 0; x < width; x++) {
      const idx = (row + x) * 4;
      const dx = x - cx;
      const radius = Math.hypot(dx, dy);

      if (radius < 2) continue;

      const baseTheta = Math.atan2(dy, dx);
      const angleDelta = maxAngle * Math.min(1.0, radius / (Math.min(width, height) * 0.5));

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;

      for (let i = 0; i < numSteps; i++) {
        const t = (i / (numSteps - 1) - 0.5) * 2;
        const curAngle = baseTheta + t * angleDelta;
        const sx = Math.max(0, Math.min(width - 1, Math.round(cx + radius * Math.cos(curAngle))));
        const sy = Math.max(0, Math.min(height - 1, Math.round(cy + radius * Math.sin(curAngle))));
        const sIdx = (sy * width + sx) * 4;

        sumR += orig[sIdx];
        sumG += orig[sIdx + 1];
        sumB += orig[sIdx + 2];
      }

      data[idx] = sumR / numSteps;
      data[idx + 1] = sumG / numSteps;
      data[idx + 2] = sumB / numSteps;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * 5. Zoom Blur (Radial Scaling from Focus Center)
 */
export function applyZoomBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  strength: number
) {
  const cx = centerX * width;
  const cy = centerY * height;
  const zoomFactor = (strength / 100) * 0.35;
  const numSteps = 14;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const orig = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    const row = y * width;
    const dy = y - cy;

    for (let x = 0; x < width; x++) {
      const idx = (row + x) * 4;
      const dx = x - cx;

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;

      for (let i = 0; i < numSteps; i++) {
        const scale = 1.0 - (i / numSteps) * zoomFactor;
        const sx = Math.max(0, Math.min(width - 1, Math.round(cx + dx * scale)));
        const sy = Math.max(0, Math.min(height - 1, Math.round(cy + dy * scale)));
        const sIdx = (sy * width + sx) * 4;

        sumR += orig[sIdx];
        sumG += orig[sIdx + 1];
        sumB += orig[sIdx + 2];
      }

      data[idx] = sumR / numSteps;
      data[idx + 1] = sumG / numSteps;
      data[idx + 2] = sumB / numSteps;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * 6. Tilt-Shift (Miniature Effect with In-Focus Band)
 */
export function applyTiltShiftBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: BlurSettings
) {
  const cx = (settings.tiltShiftCenterX ?? 0.5) * width;
  const cy = (settings.tiltShiftCenterY ?? 0.5) * height;
  const angleRad = ((settings.tiltShiftAngle ?? 0) * Math.PI) / 180;
  const focusWidthPx = ((settings.tiltShiftFocusWidth ?? 25) / 100) * Math.min(width, height);
  const featherPx = ((settings.tiltShiftFeather ?? 35) / 100) * Math.min(width, height);
  const maxBlurRadius = Math.max(2, Math.round((settings.amount / 100) * 22));

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Create blurred copy
  const blurredData = new Uint8ClampedArray(data);
  fastSeparableBoxBlur(blurredData, width, height, maxBlurRadius, 3);

  // Normal vector perpendicular to the tilt-shift band
  const nx = -Math.sin(angleRad);
  const ny = Math.cos(angleRad);

  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const idx = (row + x) * 4;

      // Distance from center line
      const dist = Math.abs((x - cx) * nx + (y - cy) * ny);

      // In focus region is dist <= focusWidthPx / 2
      let blurWeight = 0;
      if (dist > focusWidthPx / 2) {
        blurWeight = Math.min(1.0, (dist - focusWidthPx / 2) / featherPx);
      }

      if (blurWeight > 0) {
        data[idx] = data[idx] * (1 - blurWeight) + blurredData[idx] * blurWeight;
        data[idx + 1] = data[idx + 1] * (1 - blurWeight) + blurredData[idx + 1] * blurWeight;
        data[idx + 2] = data[idx + 2] * (1 - blurWeight) + blurredData[idx + 2] * blurWeight;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * 7. Background Defocus Blur (AI Depth-Guided)
 */
export function applyBackgroundBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number,
  settings: BlurSettings
) {
  const depth = getOrComputeDepthMap(ctx, width, height);
  const maxRadius = Math.max(2, Math.round((amount / 100) * 24));
  const bgThreshold = 0.55;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const blurredData = new Uint8ClampedArray(data);
  fastSeparableBoxBlur(blurredData, width, height, maxRadius, 3);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const z = depth[i];

    // Background blur weight increases with depth
    let w = 0;
    if (z > bgThreshold) {
      w = Math.min(1.0, (z - bgThreshold) / 0.35);
    }

    if (w > 0) {
      data[idx] = data[idx] * (1 - w) + blurredData[idx] * w;
      data[idx + 1] = data[idx + 1] * (1 - w) + blurredData[idx + 1] * w;
      data[idx + 2] = data[idx + 2] * (1 - w) + blurredData[idx + 2] * w;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * 8. Foreground Defocus Blur (AI Depth-Guided)
 */
export function applyForegroundBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number,
  settings: BlurSettings
) {
  const depth = getOrComputeDepthMap(ctx, width, height);
  const maxRadius = Math.max(2, Math.round((amount / 100) * 24));
  const fgThreshold = 0.35;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const blurredData = new Uint8ClampedArray(data);
  fastSeparableBoxBlur(blurredData, width, height, maxRadius, 3);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const z = depth[i];

    // Foreground blur weight increases as z approaches 0
    let w = 0;
    if (z < fgThreshold) {
      w = Math.min(1.0, (fgThreshold - z) / fgThreshold);
    }

    if (w > 0) {
      data[idx] = data[idx] * (1 - w) + blurredData[idx] * w;
      data[idx + 1] = data[idx + 1] * (1 - w) + blurredData[idx + 1] * w;
      data[idx + 2] = data[idx + 2] * (1 - w) + blurredData[idx + 2] * w;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * 9. Continuous Depth-Aware Defocus (Circle of Confusion from Focal Plane)
 */
export function applyDepthAwareDefocus(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: BlurSettings
) {
  const depth = getOrComputeDepthMap(ctx, width, height);
  const focalDepth = settings.focusDepth ?? 0.5;
  const dofWidth = Math.max(0.02, settings.depthOfField ?? 0.25);
  const maxRadius = Math.max(2, Math.round((settings.amount / 100) * 25));

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Generate multi-stage blur tiers for smooth continuous DoF interpolation
  const blurSmall = new Uint8ClampedArray(data);
  fastSeparableBoxBlur(blurSmall, width, height, Math.max(1, Math.round(maxRadius * 0.4)), 2);

  const blurLarge = new Uint8ClampedArray(data);
  fastSeparableBoxBlur(blurLarge, width, height, maxRadius, 3);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const z = depth[i];

    // Distance from focal plane
    const deltaZ = Math.abs(z - focalDepth);

    // In focus if deltaZ <= dofWidth / 2
    let coc = 0;
    if (deltaZ > dofWidth / 2) {
      coc = Math.min(1.0, (deltaZ - dofWidth / 2) / (1.0 - dofWidth / 2));
    }

    if (coc > 0) {
      let r = data[idx];
      let g = data[idx + 1];
      let b = data[idx + 2];

      if (coc < 0.5) {
        const t = coc * 2;
        r = r * (1 - t) + blurSmall[idx] * t;
        g = g * (1 - t) + blurSmall[idx + 1] * t;
        b = b * (1 - t) + blurSmall[idx + 2] * t;
      } else {
        const t = (coc - 0.5) * 2;
        r = blurSmall[idx] * (1 - t) + blurLarge[idx] * t;
        g = blurSmall[idx + 1] * (1 - t) + blurLarge[idx + 1] * t;
        b = blurSmall[idx + 2] * (1 - t) + blurLarge[idx + 2] * t;
      }

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * 10. Selective Region Blur (Radial or Linear)
 */
export function applySelectiveBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: BlurSettings
) {
  const cx = (settings.selectiveCenterX ?? 0.5) * width;
  const cy = (settings.selectiveCenterY ?? 0.5) * height;
  const radiusPx = (settings.selectiveRadius ?? 0.35) * Math.min(width, height);
  const featherPx = (settings.selectiveFeather ?? 0.3) * radiusPx;
  const invert = !!settings.selectiveInvert;
  const maxRadius = Math.max(2, Math.round((settings.amount / 100) * 22));

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const blurredData = new Uint8ClampedArray(data);
  fastSeparableBoxBlur(blurredData, width, height, maxRadius, 3);

  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const idx = (row + x) * 4;
      const dist = Math.hypot(x - cx, y - cy);

      let w = 0;
      if (dist < radiusPx) {
        w = 1.0;
      } else if (dist < radiusPx + featherPx) {
        w = 1.0 - (dist - radiusPx) / featherPx;
      }

      if (invert) {
        w = 1.0 - w;
      }

      if (w > 0) {
        data[idx] = data[idx] * (1 - w) + blurredData[idx] * w;
        data[idx + 1] = data[idx + 1] * (1 - w) + blurredData[idx + 1] * w;
        data[idx + 2] = data[idx + 2] * (1 - w) + blurredData[idx + 2] * w;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

// -------------------------------------------------------------
// Helper Bokeh Shape Kernel Generators & Fast Separable Box-Blur
// -------------------------------------------------------------

function generateBokehKernel(radius: number, shape: BokehShape, curvature: number): Float32Array {
  const size = radius * 2 + 1;
  const kernel = new Float32Array(size * size);
  const roundness = curvature / 100;

  for (let y = -radius; y <= radius; y++) {
    const row = (y + radius) * size;
    const ny = y / radius;

    for (let x = -radius; x <= radius; x++) {
      const nx = x / radius;
      const dist = Math.hypot(nx, ny);

      let inShape = false;

      switch (shape) {
        case 'circle':
          inShape = dist <= 1.0;
          break;

        case 'hexagon': {
          const angle = Math.atan2(ny, nx);
          const rPoly = Math.cos(Math.PI / 6) / Math.cos(((angle + Math.PI) % (Math.PI / 3)) - Math.PI / 6);
          inShape = dist <= (1.0 - roundness) * rPoly + roundness;
          break;
        }

        case 'octagon': {
          const angle = Math.atan2(ny, nx);
          const rPoly = Math.cos(Math.PI / 8) / Math.cos(((angle + Math.PI) % (Math.PI / 4)) - Math.PI / 8);
          inShape = dist <= (1.0 - roundness) * rPoly + roundness;
          break;
        }

        case 'heart': {
          // Heart implicit equation (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0
          const hx = nx * 1.3;
          const hy = -ny * 1.3 + 0.3;
          const heartTest = Math.pow(hx * hx + hy * hy - 1, 3) - hx * hx * Math.pow(hy, 3);
          inShape = heartTest <= 0;
          break;
        }

        case 'star': {
          const angle = Math.atan2(ny, nx);
          const starR = 0.5 + 0.5 * Math.cos(5 * angle);
          inShape = dist <= starR;
          break;
        }

        case 'diamond': {
          inShape = Math.abs(nx) + Math.abs(ny) <= 1.0;
          break;
        }

        case 'swirl': {
          const angle = Math.atan2(ny, nx);
          const spiralR = 0.7 + 0.3 * Math.sin(angle * 3 + dist * 4);
          inShape = dist <= spiralR;
          break;
        }

        default:
          inShape = dist <= 1.0;
          break;
      }

      kernel[row + (x + radius)] = inShape ? 1.0 : 0.0;
    }
  }

  return kernel;
}

function fillStepBlock(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  step: number,
  r: number,
  g: number,
  b: number
) {
  for (let dy = 0; dy < step; dy++) {
    const curRow = (y + dy) * width;
    for (let dx = 0; dx < step; dx++) {
      const i = (curRow + x + dx) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }
}

/**
 * Fast multi-pass separable box-gaussian convolution
 */
function fastSeparableBoxBlur(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
  passes = 3
) {
  if (radius <= 0) return;

  const len = width * height;
  const temp = new Uint8ClampedArray(data.length);

  for (let p = 0; p < passes; p++) {
    // Horizontal pass
    for (let y = 0; y < height; y++) {
      const row = y * width;
      for (let x = 0; x < width; x++) {
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let count = 0;

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
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let count = 0;

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
}
