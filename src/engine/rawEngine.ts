/**
 * Lumina Studio Pro - Professional RAW Engine Facade
 * Provides high-level access to the genuine RAW demosaicing, white balance calibration,
 * and high-dynamic-range pipeline.
 */

import { DemosaicMethod, RawWbPreset, RawDevelopSettings, WorkingColorSpace } from '../types/editor';
import {
  calculateWhiteBalanceGains,
  developRawSensorBuffer,
  linearToSrgbGamma,
  srgbGammaToLinear,
} from './raw/rawDevelopEngine';
import { demosaicSensorData, DemosaicResult } from './raw/demosaicEngine';
import { rawManager } from './raw/rawManager';
import { rawWorkerOrchestrator } from './raw/rawWorkerManager';

export interface RawWbPresetInfo {
  id: RawWbPreset;
  name: string;
  kelvin: number;
  tint: number;
  icon?: string;
  description: string;
}

export const RAW_WB_PRESETS: RawWbPresetInfo[] = [
  { id: 'as-shot', name: 'As Shot', kelvin: 5500, tint: 10, description: 'Camera sensor recorded white balance' },
  { id: 'auto', name: 'Auto WB', kelvin: 5200, tint: 8, description: 'Intelligent gray-world scene calculation' },
  { id: 'daylight', name: 'Daylight', kelvin: 5500, tint: 10, description: 'Direct midday sunlight (5500K)' },
  { id: 'cloudy', name: 'Cloudy', kelvin: 6500, tint: 10, description: 'Overcast diffused sky (6500K)' },
  { id: 'shade', name: 'Shade', kelvin: 7500, tint: 10, description: 'Open shade blue sky reflection (7500K)' },
  { id: 'tungsten', name: 'Tungsten', kelvin: 2850, tint: 0, description: 'Incandescent warm bulb lighting (2850K)' },
  { id: 'fluorescent', name: 'Fluorescent', kelvin: 3800, tint: -15, description: 'Cool white fluorescent tubes (3800K)' },
  { id: 'flash', name: 'Flash', kelvin: 5500, tint: 0, description: 'Speedlight & studio strobe (5500K)' },
  { id: 'custom', name: 'Custom', kelvin: 5000, tint: 0, description: 'User calibrated Kelvin & tint' },
];

/**
 * Converts Kelvin Temperature (2000K to 12000K) + Tint (-100 to 100) to RGB Multipliers
 */
export function kelvinAndTintToRGBGains(kelvin: number, tint = 0): [number, number, number] {
  return calculateWhiteBalanceGains('custom', kelvin, tint, [0.55, 1.0, 0.65]);
}

/**
 * RAW Dynamic Range Recovery (Highlight Reconstruction & Shadow Lift)
 */
export function applyRawExposureRecovery(
  r: number,
  g: number,
  b: number,
  highlightRecovery: number,
  shadowRecovery: number,
  blackLevel: number
): [number, number, number] {
  // 1. Black level calibration
  if (blackLevel !== 0) {
    const blkShift = blackLevel * 0.4;
    r = Math.max(0, r + blkShift);
    g = Math.max(0, g + blkShift);
    b = Math.max(0, b + blkShift);
  }

  // 2. RAW Shadow Recovery (Lifts deep sensor darks without blowing midtones)
  if (shadowRecovery > 0) {
    const sFactor = shadowRecovery / 100;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const shadowWeight = Math.max(0, 1 - (lum / 255) * 1.8);
    if (shadowWeight > 0) {
      const lift = Math.pow(shadowWeight, 1.4) * sFactor * 65;
      r += lift;
      g += lift;
      b += lift;
    }
  }

  // 3. RAW Highlight Recovery (Inpainting blown channels & smooth roll-off)
  if (highlightRecovery > 0) {
    const hFactor = highlightRecovery / 100;
    const maxChannel = Math.max(r, g, b);

    if (maxChannel > 180) {
      const excess = (maxChannel - 180) / 75;
      const compress = Math.pow(excess, 1.5) * hFactor * 45;

      r = Math.max(0, r - compress * (r / (maxChannel + 0.01)));
      g = Math.max(0, g - compress * (g / (maxChannel + 0.01)));
      b = Math.max(0, b - compress * (b / (maxChannel + 0.01)));

      if (excess > 0.6 && hFactor > 0.2) {
        const avg = (r + g + b) / 3;
        const desatFactor = (excess - 0.6) * 2.5 * hFactor;
        r = r * (1 - desatFactor) + avg * desatFactor;
        g = g * (1 - desatFactor) + avg * desatFactor;
        b = b * (1 - desatFactor) + avg * desatFactor;
      }
    }
  }

  return [r, g, b];
}

/**
 * Apply RAW Demosaicing Simulation & Anti-Moire Pass
 */
export function applyDemosaicAndMoire(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  method: DemosaicMethod,
  moireReduction: number
) {
  if (method === 'bilinear' && moireReduction === 0) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const output = new Uint8ClampedArray(data);

  // 1. Demosaicing Acutance / Homogeneity adjustment
  if (method === 'ahd' || method === 'vng' || method === 'superpixel') {
    const sharpenK = method === 'superpixel' ? 0.25 : method === 'ahd' ? 0.15 : 0.08;

    for (let y = 1; y < height - 1; y++) {
      const row = y * width;
      const topRow = (y - 1) * width;
      const botRow = (y + 1) * width;

      for (let x = 1; x < width - 1; x++) {
        const idx = (row + x) * 4;
        const tIdx = (topRow + x) * 4;
        const bIdx = (botRow + x) * 4;
        const lIdx = (row + x - 1) * 4;
        const rIdx = (row + x + 1) * 4;

        for (let c = 0; c < 3; c++) {
          const center = data[idx + c];
          const neighborAvg = (data[tIdx + c] + data[bIdx + c] + data[lIdx + c] + data[rIdx + c]) / 4;
          const enhanced = center + (center - neighborAvg) * sharpenK;
          output[idx + c] = Math.max(0, Math.min(255, Math.round(enhanced)));
        }
      }
    }
  }

  // 2. Anti-Moire / False Color Suppression (Color blur preserving luminance)
  if (moireReduction > 0) {
    const moireK = (moireReduction / 100) * 0.6;

    for (let y = 1; y < height - 1; y++) {
      const row = y * width;
      for (let x = 1; x < width - 1; x++) {
        const idx = (row + x) * 4;
        const origR = output[idx];
        const origG = output[idx + 1];
        const origB = output[idx + 2];
        const origY = 0.299 * origR + 0.587 * origG + 0.114 * origB;

        let sumCb = 0;
        let sumCr = 0;

        for (let dy = -1; dy <= 1; dy++) {
          const curRow = (y + dy) * width;
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = (curRow + x + dx) * 4;
            const nr = output[nIdx];
            const ng = output[nIdx + 1];
            const nb = output[nIdx + 2];
            const ny = 0.299 * nr + 0.587 * ng + 0.114 * nb;
            sumCb += (nb - ny);
            sumCr += (nr - ny);
          }
        }

        const avgCb = sumCb / 9;
        const avgCr = sumCr / 9;

        const curCb = origB - origY;
        const curCr = origR - origY;

        const filteredCb = curCb * (1 - moireK) + avgCb * moireK;
        const filteredCr = curCr * (1 - moireK) + avgCr * moireK;

        const newR = origY + filteredCr;
        const newB = origY + filteredCb;
        const newG = (origY - 0.299 * newR - 0.114 * newB) / 0.587;

        output[idx] = Math.max(0, Math.min(255, Math.round(newR)));
        output[idx + 1] = Math.max(0, Math.min(255, Math.round(newG)));
        output[idx + 2] = Math.max(0, Math.min(255, Math.round(newB)));
      }
    }
  }

  ctx.putImageData(new ImageData(output, width, height), 0, 0);
}

export {
  rawManager,
  rawWorkerOrchestrator,
  demosaicSensorData,
  developRawSensorBuffer,
  linearToSrgbGamma,
  srgbGammaToLinear,
};
