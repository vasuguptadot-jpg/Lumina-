/**
 * Lumina Studio Pro - High-Precision CFA Demosaicing Engine
 * Implements genuine sensor demosaicing algorithms:
 * - AHD (Adaptive Homogeneity-Directed) for Bayer CFA
 * - VNG (Variable Number of Gradients) for Bayer CFA
 * - Bilinear Demosaicing (Fast Interactive)
 * - Superpixel 2x2 Demosaicing (Pure Sensor Pixel Binning)
 * - Fuji X-Trans 6x6 Aperiodic Demosaicing
 * 
 * Operates in linear Float32Array RGB buffers.
 */

import { BayerCfaPattern } from './rawTypes';
import { DemosaicMethod } from '../../types/editor';

export interface DemosaicResult {
  width: number;
  height: number;
  /**
   * Linear RGB Float32Array of size width * height * 3
   * Values in range [0.0, 1.0] (or > 1.0 for high dynamic range)
   */
  rgbData: Float32Array;
}

export function demosaicSensorData(
  sensorData: Float32Array,
  width: number,
  height: number,
  cfaPattern: BayerCfaPattern,
  method: DemosaicMethod = 'ahd'
): DemosaicResult {
  if (cfaPattern === 'X-Trans') {
    return demosaicXTrans(sensorData, width, height);
  }

  if (method === 'superpixel') {
    return demosaicSuperpixel(sensorData, width, height, cfaPattern);
  }

  if (method === 'vng') {
    return demosaicVNG(sensorData, width, height, cfaPattern);
  }

  if (method === 'bilinear') {
    return demosaicBilinear(sensorData, width, height, cfaPattern);
  }

  // Default: AHD (Adaptive Homogeneity-Directed)
  return demosaicAHD(sensorData, width, height, cfaPattern);
}

// ----------------------------------------------------------------------------
// 1. AHD (Adaptive Homogeneity-Directed Demosaicing)
// ----------------------------------------------------------------------------
export function demosaicAHD(
  cfa: Float32Array,
  width: number,
  height: number,
  pattern: BayerCfaPattern
): DemosaicResult {
  const numPixels = width * height;
  const rgbData = new Float32Array(numPixels * 3);

  // Temporary buffers for directional estimates
  const greenH = new Float32Array(numPixels);
  const greenV = new Float32Array(numPixels);

  // Step 1: Directional Green Interpolation
  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    const isEvenY = (y & 1) === 0;

    for (let x = 1; x < width - 1; x++) {
      const idx = row + x;
      const isEvenX = (x & 1) === 0;
      const isGreen = isGreenPhotosite(isEvenX, isEvenY, pattern);

      if (isGreen) {
        greenH[idx] = cfa[idx];
        greenV[idx] = cfa[idx];
      } else {
        // Horizontal green estimate: (cfa[x-1] + cfa[x+1])/2 + (2*cfa[x] - cfa[x-2] - cfa[x+2])/4
        const left2 = x >= 2 ? cfa[idx - 2] : cfa[idx];
        const right2 = x < width - 2 ? cfa[idx + 2] : cfa[idx];
        const gh = (cfa[idx - 1] + cfa[idx + 1]) * 0.5 + (2 * cfa[idx] - left2 - right2) * 0.25;
        greenH[idx] = Math.max(0, gh);

        // Vertical green estimate: (cfa[y-1] + cfa[y+1])/2 + (2*cfa[y] - cfa[y-2] - cfa[y+2])/4
        const top2 = y >= 2 ? cfa[idx - 2 * width] : cfa[idx];
        const bot2 = y < height - 2 ? cfa[idx + 2 * width] : cfa[idx];
        const gv = (cfa[idx - width] + cfa[idx + width]) * 0.5 + (2 * cfa[idx] - top2 - bot2) * 0.25;
        greenV[idx] = Math.max(0, gv);
      }
    }
  }

  // Step 2: Directional Homogeneity Selection & Red/Blue Reconstruction
  for (let y = 2; y < height - 2; y++) {
    const row = y * width;
    const isEvenY = (y & 1) === 0;

    for (let x = 2; x < width - 2; x++) {
      const idx = row + x;
      const rgbIdx = idx * 3;
      const isEvenX = (x & 1) === 0;

      // Compute directional homogeneity metric in 5x5 neighborhood
      let homH = 0;
      let homV = 0;

      for (let dy = -1; dy <= 1; dy++) {
        const nRow = (y + dy) * width;
        for (let dx = -1; dx <= 1; dx++) {
          const nIdx = nRow + x + dx;
          const diffH = Math.abs(greenH[nIdx] - greenH[nIdx + 1]);
          const diffV = Math.abs(greenV[nIdx] - greenV[nIdx + width]);
          homH += diffH;
          homV += diffV;
        }
      }

      // Choose Green with greater homogeneity (less directional variance)
      const selectedG = homH < homV ? greenH[idx] : greenV[idx];
      rgbData[rgbIdx + 1] = selectedG;

      // Reconstruct Red and Blue via chrominance difference (R - G) and (B - G)
      const pType = getPhotositeType(isEvenX, isEvenY, pattern);

      if (pType === 'R') {
        rgbData[rgbIdx] = cfa[idx];
        // Blue at Red location: average of 4 diagonal blue neighbors + green difference
        const avgB = (cfa[idx - width - 1] + cfa[idx - width + 1] + cfa[idx + width - 1] + cfa[idx + width + 1]) * 0.25;
        const avgG_diag = (greenH[idx - width - 1] + greenH[idx - width + 1] + greenH[idx + width - 1] + greenH[idx + width + 1]) * 0.25;
        rgbData[rgbIdx + 2] = Math.max(0, selectedG + (avgB - avgG_diag));
      } else if (pType === 'B') {
        rgbData[rgbIdx + 2] = cfa[idx];
        // Red at Blue location: average of 4 diagonal red neighbors + green difference
        const avgR = (cfa[idx - width - 1] + cfa[idx - width + 1] + cfa[idx + width - 1] + cfa[idx + width + 1]) * 0.25;
        const avgG_diag = (greenH[idx - width - 1] + greenH[idx - width + 1] + greenH[idx + width - 1] + greenH[idx + width + 1]) * 0.25;
        rgbData[rgbIdx] = Math.max(0, selectedG + (avgR - avgG_diag));
      } else if (pType === 'Gr') {
        // Red is horizontal neighbor, Blue is vertical neighbor
        const avgR = (cfa[idx - 1] + cfa[idx + 1]) * 0.5;
        const avgG_h = (greenH[idx - 1] + greenH[idx + 1]) * 0.5;
        rgbData[rgbIdx] = Math.max(0, selectedG + (avgR - avgG_h));

        const avgB = (cfa[idx - width] + cfa[idx + width]) * 0.5;
        const avgG_v = (greenV[idx - width] + greenV[idx + width]) * 0.5;
        rgbData[rgbIdx + 2] = Math.max(0, selectedG + (avgB - avgG_v));
      } else {
        // Gb: Blue is horizontal neighbor, Red is vertical neighbor
        const avgB = (cfa[idx - 1] + cfa[idx + 1]) * 0.5;
        const avgG_h = (greenH[idx - 1] + greenH[idx + 1]) * 0.5;
        rgbData[rgbIdx + 2] = Math.max(0, selectedG + (avgB - avgG_h));

        const avgR = (cfa[idx - width] + cfa[idx + width]) * 0.5;
        const avgG_v = (greenV[idx - width] + greenV[idx + width]) * 0.5;
        rgbData[rgbIdx] = Math.max(0, selectedG + (avgR - avgG_v));
      }
    }
  }

  fillBorderPixels(rgbData, cfa, width, height);
  return { width, height, rgbData };
}

// ----------------------------------------------------------------------------
// 2. VNG (Variable Number of Gradients Demosaicing)
// ----------------------------------------------------------------------------
export function demosaicVNG(
  cfa: Float32Array,
  width: number,
  height: number,
  pattern: BayerCfaPattern
): DemosaicResult {
  const numPixels = width * height;
  const rgbData = new Float32Array(numPixels * 3);

  for (let y = 2; y < height - 2; y++) {
    const row = y * width;
    const isEvenY = (y & 1) === 0;

    for (let x = 2; x < width - 2; x++) {
      const idx = row + x;
      const rgbIdx = idx * 3;
      const isEvenX = (x & 1) === 0;

      // Compute 8 directional gradients (N, S, E, W, NE, NW, SE, SW)
      const gN = Math.abs(cfa[idx] - cfa[idx - 2 * width]) + Math.abs(cfa[idx - width] - cfa[idx - width * 2]);
      const gS = Math.abs(cfa[idx] - cfa[idx + 2 * width]) + Math.abs(cfa[idx + width] - cfa[idx + width * 2]);
      const gE = Math.abs(cfa[idx] - cfa[idx + 2]) + Math.abs(cfa[idx + 1] - cfa[idx + 2]);
      const gW = Math.abs(cfa[idx] - cfa[idx - 2]) + Math.abs(cfa[idx - 1] - cfa[idx - 2]);
      const gNE = Math.abs(cfa[idx] - cfa[idx - width + 1]);
      const gNW = Math.abs(cfa[idx] - cfa[idx - width - 1]);
      const gSE = Math.abs(cfa[idx] - cfa[idx + width + 1]);
      const gSW = Math.abs(cfa[idx] - cfa[idx + width - 1]);

      const minGrad = Math.min(gN, gS, gE, gW, gNE, gNW, gSE, gSW);
      const threshold = minGrad * 1.5 + 0.001;

      const pType = getPhotositeType(isEvenX, isEvenY, pattern);

      if (pType === 'G' || pType === 'Gr' || pType === 'Gb') {
        rgbData[rgbIdx + 1] = cfa[idx];
        // Interpolate R & B from valid gradient directions
        let rSum = 0, rCount = 0;
        let bSum = 0, bCount = 0;

        if (pType === 'Gr') {
          if (gW <= threshold) { rSum += cfa[idx - 1]; rCount++; }
          if (gE <= threshold) { rSum += cfa[idx + 1]; rCount++; }
          if (gN <= threshold) { bSum += cfa[idx - width]; bCount++; }
          if (gS <= threshold) { bSum += cfa[idx + width]; bCount++; }
        } else {
          if (gN <= threshold) { rSum += cfa[idx - width]; rCount++; }
          if (gS <= threshold) { rSum += cfa[idx + width]; rCount++; }
          if (gW <= threshold) { bSum += cfa[idx - 1]; bCount++; }
          if (gE <= threshold) { bSum += cfa[idx + 1]; bCount++; }
        }

        rgbData[rgbIdx] = rCount > 0 ? rSum / rCount : (cfa[idx - 1] + cfa[idx + 1]) * 0.5;
        rgbData[rgbIdx + 2] = bCount > 0 ? bSum / bCount : (cfa[idx - width] + cfa[idx + width]) * 0.5;
      } else if (pType === 'R') {
        rgbData[rgbIdx] = cfa[idx];
        // Green from 4-connected cross
        let gSum = 0, gCount = 0;
        if (gN <= threshold) { gSum += cfa[idx - width]; gCount++; }
        if (gS <= threshold) { gSum += cfa[idx + width]; gCount++; }
        if (gW <= threshold) { gSum += cfa[idx - 1]; gCount++; }
        if (gE <= threshold) { gSum += cfa[idx + 1]; gCount++; }
        rgbData[rgbIdx + 1] = gCount > 0 ? gSum / gCount : (cfa[idx - width] + cfa[idx + width] + cfa[idx - 1] + cfa[idx + 1]) * 0.25;

        // Blue from 4-diagonal
        const bDiag = (cfa[idx - width - 1] + cfa[idx - width + 1] + cfa[idx + width - 1] + cfa[idx + width + 1]) * 0.25;
        rgbData[rgbIdx + 2] = bDiag;
      } else {
        // Blue
        rgbData[rgbIdx + 2] = cfa[idx];
        let gSum = 0, gCount = 0;
        if (gN <= threshold) { gSum += cfa[idx - width]; gCount++; }
        if (gS <= threshold) { gSum += cfa[idx + width]; gCount++; }
        if (gW <= threshold) { gSum += cfa[idx - 1]; gCount++; }
        if (gE <= threshold) { gSum += cfa[idx + 1]; gCount++; }
        rgbData[rgbIdx + 1] = gCount > 0 ? gSum / gCount : (cfa[idx - width] + cfa[idx + width] + cfa[idx - 1] + cfa[idx + 1]) * 0.25;

        const rDiag = (cfa[idx - width - 1] + cfa[idx - width + 1] + cfa[idx + width - 1] + cfa[idx + width + 1]) * 0.25;
        rgbData[rgbIdx] = rDiag;
      }
    }
  }

  fillBorderPixels(rgbData, cfa, width, height);
  return { width, height, rgbData };
}

// ----------------------------------------------------------------------------
// 3. Bilinear Demosaicing (Fast Interactive)
// ----------------------------------------------------------------------------
export function demosaicBilinear(
  cfa: Float32Array,
  width: number,
  height: number,
  pattern: BayerCfaPattern
): DemosaicResult {
  const numPixels = width * height;
  const rgbData = new Float32Array(numPixels * 3);

  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    const isEvenY = (y & 1) === 0;

    for (let x = 1; x < width - 1; x++) {
      const idx = row + x;
      const rgbIdx = idx * 3;
      const isEvenX = (x & 1) === 0;
      const pType = getPhotositeType(isEvenX, isEvenY, pattern);

      if (pType === 'R') {
        rgbData[rgbIdx] = cfa[idx];
        rgbData[rgbIdx + 1] = (cfa[idx - width] + cfa[idx + width] + cfa[idx - 1] + cfa[idx + 1]) * 0.25;
        rgbData[rgbIdx + 2] = (cfa[idx - width - 1] + cfa[idx - width + 1] + cfa[idx + width - 1] + cfa[idx + width + 1]) * 0.25;
      } else if (pType === 'B') {
        rgbData[rgbIdx] = (cfa[idx - width - 1] + cfa[idx - width + 1] + cfa[idx + width - 1] + cfa[idx + width + 1]) * 0.25;
        rgbData[rgbIdx + 1] = (cfa[idx - width] + cfa[idx + width] + cfa[idx - 1] + cfa[idx + 1]) * 0.25;
        rgbData[rgbIdx + 2] = cfa[idx];
      } else if (pType === 'Gr') {
        rgbData[rgbIdx] = (cfa[idx - 1] + cfa[idx + 1]) * 0.5;
        rgbData[rgbIdx + 1] = cfa[idx];
        rgbData[rgbIdx + 2] = (cfa[idx - width] + cfa[idx + width]) * 0.5;
      } else {
        rgbData[rgbIdx] = (cfa[idx - width] + cfa[idx + width]) * 0.5;
        rgbData[rgbIdx + 1] = cfa[idx];
        rgbData[rgbIdx + 2] = (cfa[idx - 1] + cfa[idx + 1]) * 0.5;
      }
    }
  }

  fillBorderPixels(rgbData, cfa, width, height);
  return { width, height, rgbData };
}

// ----------------------------------------------------------------------------
// 4. Superpixel Demosaicing (2x2 Binning)
// ----------------------------------------------------------------------------
export function demosaicSuperpixel(
  cfa: Float32Array,
  width: number,
  height: number,
  pattern: BayerCfaPattern
): DemosaicResult {
  const halfW = Math.floor(width / 2);
  const halfH = Math.floor(height / 2);
  const rgbData = new Float32Array(halfW * halfH * 3);

  for (let sy = 0; sy < halfH; sy++) {
    const y = sy * 2;
    const outRow = sy * halfW;
    const row0 = y * width;
    const row1 = (y + 1) * width;

    for (let sx = 0; sx < halfW; sx++) {
      const x = sx * 2;
      const outIdx = (outRow + sx) * 3;

      const p00 = cfa[row0 + x];
      const p01 = cfa[row0 + x + 1];
      const p10 = cfa[row1 + x];
      const p11 = cfa[row1 + x + 1];

      if (pattern === 'RGGB') {
        rgbData[outIdx] = p00;                     // R
        rgbData[outIdx + 1] = (p01 + p10) * 0.5;  // G
        rgbData[outIdx + 2] = p11;                 // B
      } else if (pattern === 'BGGR') {
        rgbData[outIdx] = p11;
        rgbData[outIdx + 1] = (p01 + p10) * 0.5;
        rgbData[outIdx + 2] = p00;
      } else if (pattern === 'GRBG') {
        rgbData[outIdx] = p01;
        rgbData[outIdx + 1] = (p00 + p11) * 0.5;
        rgbData[outIdx + 2] = p10;
      } else {
        rgbData[outIdx] = p10;
        rgbData[outIdx + 1] = (p00 + p11) * 0.5;
        rgbData[outIdx + 2] = p01;
      }
    }
  }

  return { width: halfW, height: halfH, rgbData };
}

// ----------------------------------------------------------------------------
// 5. Fuji X-Trans 6x6 Demosaicing
// ----------------------------------------------------------------------------
// Fuji 6x6 color matrix: 0=G, 1=R, 2=B
const FUJI_XTRANS_6X6 = [
  [0, 1, 0, 0, 2, 0],
  [2, 0, 2, 1, 0, 1],
  [0, 1, 0, 0, 2, 0],
  [0, 2, 0, 0, 1, 0],
  [1, 0, 1, 2, 0, 2],
  [0, 2, 0, 0, 1, 0],
];

export function demosaicXTrans(
  cfa: Float32Array,
  width: number,
  height: number
): DemosaicResult {
  const numPixels = width * height;
  const rgbData = new Float32Array(numPixels * 3);

  // High quality X-Trans green-guided local difference interpolation
  for (let y = 3; y < height - 3; y++) {
    const row = y * width;
    const yMod = y % 6;

    for (let x = 3; x < width - 3; x++) {
      const idx = row + x;
      const rgbIdx = idx * 3;
      const xMod = x % 6;
      const colorType = FUJI_XTRANS_6X6[yMod][xMod];

      if (colorType === 0) {
        // Green photosite
        rgbData[rgbIdx + 1] = cfa[idx];
      } else {
        // Estimate green from surrounding 4 cross/diagonal green neighbors
        let gSum = 0;
        let gCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (FUJI_XTRANS_6X6[(y + dy) % 6][(x + dx) % 6] === 0) {
              gSum += cfa[(y + dy) * width + (x + dx)];
              gCount++;
            }
          }
        }
        rgbData[rgbIdx + 1] = gCount > 0 ? gSum / gCount : cfa[idx];
      }

      // Estimate R and B
      let rSum = 0, rCount = 0;
      let bSum = 0, bCount = 0;

      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const c = FUJI_XTRANS_6X6[(y + dy + 6) % 6][(x + dx + 6) % 6];
          const val = cfa[(y + dy) * width + (x + dx)];
          if (c === 1) {
            rSum += val;
            rCount++;
          } else if (c === 2) {
            bSum += val;
            bCount++;
          }
        }
      }

      rgbData[rgbIdx] = colorType === 1 ? cfa[idx] : (rCount > 0 ? rSum / rCount : rgbData[rgbIdx + 1]);
      rgbData[rgbIdx + 2] = colorType === 2 ? cfa[idx] : (bCount > 0 ? bSum / bCount : rgbData[rgbIdx + 1]);
    }
  }

  fillBorderPixels(rgbData, cfa, width, height);
  return { width, height, rgbData };
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
function isGreenPhotosite(evenX: boolean, evenY: boolean, pattern: BayerCfaPattern): boolean {
  switch (pattern) {
    case 'RGGB':
    case 'BGGR':
      return evenX !== evenY;
    case 'GRBG':
    case 'GBRG':
      return evenX === evenY;
    default:
      return evenX !== evenY;
  }
}

function getPhotositeType(evenX: boolean, evenY: boolean, pattern: BayerCfaPattern): 'R' | 'Gr' | 'Gb' | 'B' | 'G' {
  switch (pattern) {
    case 'RGGB':
      if (evenY) return evenX ? 'R' : 'Gr';
      return evenX ? 'Gb' : 'B';
    case 'BGGR':
      if (evenY) return evenX ? 'B' : 'Gb';
      return evenX ? 'Gr' : 'R';
    case 'GRBG':
      if (evenY) return evenX ? 'Gr' : 'R';
      return evenX ? 'B' : 'Gb';
    case 'GBRG':
      if (evenY) return evenX ? 'Gb' : 'B';
      return evenX ? 'R' : 'Gr';
    default:
      return 'G';
  }
}

function fillBorderPixels(rgb: Float32Array, cfa: Float32Array, width: number, height: number) {
  // Simple border replication for 2 border rows/cols
  for (let x = 0; x < width; x++) {
    const topIn = (2 * width + x) * 3;
    rgb[x * 3] = rgb[topIn];
    rgb[x * 3 + 1] = rgb[topIn + 1];
    rgb[x * 3 + 2] = rgb[topIn + 2];

    rgb[(width + x) * 3] = rgb[topIn];
    rgb[(width + x) * 3 + 1] = rgb[topIn + 1];
    rgb[(width + x) * 3 + 2] = rgb[topIn + 2];

    const botIn = ((height - 3) * width + x) * 3;
    const b0 = ((height - 2) * width + x) * 3;
    const b1 = ((height - 1) * width + x) * 3;
    rgb[b0] = rgb[botIn]; rgb[b0 + 1] = rgb[botIn + 1]; rgb[b0 + 2] = rgb[botIn + 2];
    rgb[b1] = rgb[botIn]; rgb[b1 + 1] = rgb[botIn + 1]; rgb[b1 + 2] = rgb[botIn + 2];
  }
}
