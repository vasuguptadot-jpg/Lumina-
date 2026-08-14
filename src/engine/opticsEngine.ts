import { OpticsSettings } from '../types/editor';

/**
 * High-performance Lens Distortion & Chromatic Aberration Optics Correction Engine
 */

/**
 * Correct Lens Distortion (Barrel & Pincushion) using Backward Bilinear Interpolation
 * Distortion parameter: -100 (Barrel correction) to +100 (Pincushion correction)
 */
export function applyLensDistortion(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  distortion: number // -100 to 100
) {
  if (distortion === 0 || width <= 2 || height <= 2) return;

  const srcImgData = ctx.getImageData(0, 0, width, height);
  const src = srcImgData.data;
  const dstImgData = ctx.createImageData(width, height);
  const dst = dstImgData.data;

  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);

  // Distortion coefficient: k1
  // Positive distortion value expands edges (fixes barrel distortion)
  // Negative distortion value compresses edges (fixes pincushion)
  const k1 = (distortion / 100) * 0.35;
  const k2 = (distortion / 100) * 0.12;

  for (let y = 0; y < height; y++) {
    const dy = y - cy;
    const dy2 = dy * dy;

    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const r2 = (dx * dx + dy2) / (maxR * maxR);
      const factor = 1 + k1 * r2 + k2 * r2 * r2;

      // Source coordinates
      const srcX = cx + dx * factor;
      const srcY = cy + dy * factor;

      const dstIdx = (y * width + x) * 4;

      if (srcX >= 0 && srcX < width - 1 && srcY >= 0 && srcY < height - 1) {
        // Bilinear interpolation
        const x0 = Math.floor(srcX);
        const x1 = x0 + 1;
        const y0 = Math.floor(srcY);
        const y1 = y0 + 1;

        const wx1 = srcX - x0;
        const wx0 = 1 - wx1;
        const wy1 = srcY - y0;
        const wy0 = 1 - wy1;

        const idx00 = (y0 * width + x0) * 4;
        const idx01 = (y0 * width + x1) * 4;
        const idx10 = (y1 * width + x0) * 4;
        const idx11 = (y1 * width + x1) * 4;

        for (let c = 0; c < 3; c++) {
          const val =
            (src[idx00 + c] * wx0 + src[idx01 + c] * wx1) * wy0 +
            (src[idx10 + c] * wx0 + src[idx11 + c] * wx1) * wy1;
          dst[dstIdx + c] = Math.round(val);
        }
        dst[dstIdx + 3] = 255;
      } else {
        // Clamp to edge
        const clampedX = Math.max(0, Math.min(width - 1, Math.round(srcX)));
        const clampedY = Math.max(0, Math.min(height - 1, Math.round(srcY)));
        const edgeIdx = (clampedY * width + clampedX) * 4;
        dst[dstIdx] = src[edgeIdx];
        dst[dstIdx + 1] = src[edgeIdx + 1];
        dst[dstIdx + 2] = src[edgeIdx + 2];
        dst[dstIdx + 3] = 255;
      }
    }
  }

  ctx.putImageData(dstImgData, 0, 0);
}

/**
 * Correct Lateral Chromatic Aberration & Edge Defringe
 * caRedCyan: -100 to 100
 * caBlueYellow: -100 to 100
 * defringeAmount: 0 to 100
 */
export function applyChromaticAberrationCorrection(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  caRedCyan: number,
  caBlueYellow: number,
  defringeAmount = 0,
  defringeThreshold = 50
) {
  if (caRedCyan === 0 && caBlueYellow === 0 && defringeAmount === 0) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const output = new Uint8ClampedArray(data);

  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  const scaleR = 1 + (caRedCyan / 100) * 0.008;
  const scaleB = 1 + (caBlueYellow / 100) * 0.008;

  // 1. Channel displacement for Lateral CA
  if (caRedCyan !== 0 || caBlueYellow !== 0) {
    for (let y = 0; y < height; y++) {
      const dy = y - cy;
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dstIdx = (y * width + x) * 4;

        // Sample Red channel at scaled position
        if (caRedCyan !== 0) {
          const rx = cx + dx * scaleR;
          const ry = cy + dy * scaleR;
          if (rx >= 0 && rx < width - 1 && ry >= 0 && ry < height - 1) {
            const rx0 = Math.floor(rx);
            const ry0 = Math.floor(ry);
            const rwx = rx - rx0;
            const rwy = ry - ry0;
            const r00 = (ry0 * width + rx0) * 4;
            const r01 = (ry0 * width + (rx0 + 1)) * 4;
            const r10 = ((ry0 + 1) * width + rx0) * 4;
            const r11 = ((ry0 + 1) * width + (rx0 + 1)) * 4;
            const rInterp = (data[r00] * (1 - rwx) + data[r01] * rwx) * (1 - rwy) +
                            (data[r10] * (1 - rwx) + data[r11] * rwx) * rwy;
            output[dstIdx] = Math.round(rInterp);
          }
        }

        // Sample Blue channel at scaled position
        if (caBlueYellow !== 0) {
          const bx = cx + dx * scaleB;
          const by = cy + dy * scaleB;
          if (bx >= 0 && bx < width - 1 && by >= 0 && by < height - 1) {
            const bx0 = Math.floor(bx);
            const by0 = Math.floor(by);
            const bwx = bx - bx0;
            const bwy = by - by0;
            const b00 = (by0 * width + bx0) * 4 + 2;
            const b01 = (by0 * width + (bx0 + 1)) * 4 + 2;
            const b10 = ((by0 + 1) * width + bx0) * 4 + 2;
            const b11 = ((by0 + 1) * width + (bx0 + 1)) * 4 + 2;
            const bInterp = (data[b00] * (1 - bwx) + data[b01] * bwx) * (1 - bwy) +
                            (data[b10] * (1 - bwx) + data[b11] * bwx) * bwy;
            output[dstIdx + 2] = Math.round(bInterp);
          }
        }
      }
    }
  }

  // 2. High-contrast Purple/Green Defringe filter
  if (defringeAmount > 0) {
    const defringeFactor = defringeAmount / 100;
    const thresh = (defringeThreshold / 100) * 80 + 20;

    for (let i = 0; i < output.length; i += 4) {
      const r = output[i];
      const g = output[i + 1];
      const b = output[i + 2];

      // Purple fringe indicator: high (R+B) compared to G
      const purpleFringe = (r + b) / 2 - g;
      if (purpleFringe > thresh) {
        const excess = (purpleFringe - thresh) * defringeFactor;
        output[i] = Math.max(0, Math.min(255, Math.round(r - excess * 0.8)));
        output[i + 2] = Math.max(0, Math.min(255, Math.round(b - excess * 0.9)));
      }

      // Green fringe indicator: high G compared to (R+B)
      const greenFringe = g - (r + b) / 2;
      if (greenFringe > thresh) {
        const excess = (greenFringe - thresh) * defringeFactor;
        output[i + 1] = Math.max(0, Math.min(255, Math.round(g - excess * 0.85)));
      }
    }
  }

  ctx.putImageData(new ImageData(output, width, height), 0, 0);
}

/**
 * Optical Lens Vignetting Falloff Correction (Brightens darkened optical corners)
 */
export function applyLensVignetteCorrection(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number, // -100 to 100 (+100 compensates dark corners)
  midpoint = 50,
  feather = 50
) {
  if (amount === 0) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const midNorm = Math.max(0.1, midpoint / 100);
  const featherNorm = Math.max(0.1, feather / 100);

  // Positive amount brightens corners (fixes optical falloff)
  // Negative amount darkens corners
  const intensity = (amount / 100) * 1.5;

  for (let y = 0; y < height; y++) {
    const dy = y - cy;
    const rowIdx = y * width * 4;

    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
      const idx = rowIdx + x * 4;

      if (dist > midNorm * 0.5) {
        const t = Math.min(1, (dist - midNorm * 0.5) / (1 - midNorm * 0.5 + 0.001));
        const falloff = Math.pow(t, 2 / featherNorm);
        const multiplier = 1 + intensity * falloff;

        data[idx] = Math.max(0, Math.min(255, Math.round(data[idx] * multiplier)));
        data[idx + 1] = Math.max(0, Math.min(255, Math.round(data[idx + 1] * multiplier)));
        data[idx + 2] = Math.max(0, Math.min(255, Math.round(data[idx + 2] * multiplier)));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
