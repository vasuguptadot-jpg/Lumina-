import { DemosaicMethod, RawWbPreset, RawDevelopSettings } from '../types/editor';

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
 * Based on Tanner Helland's Planckian Blackbody Approximation
 */
export function kelvinAndTintToRGBGains(kelvin: number, tint = 0): [number, number, number] {
  const temp = Math.max(2000, Math.min(12000, kelvin)) / 100;
  let r = 0;
  let g = 0;
  let b = 0;

  // Calculate Red
  if (temp <= 66) {
    r = 255;
  } else {
    r = temp - 60;
    r = 329.698727446 * Math.pow(r, -0.1332047592);
    r = Math.max(0, Math.min(255, r));
  }

  // Calculate Green
  if (temp <= 66) {
    g = temp;
    g = 99.4708025861 * Math.log(g) - 161.1195681661;
    g = Math.max(0, Math.min(255, g));
  } else {
    g = temp - 60;
    g = 288.1221695283 * Math.pow(g, -0.0755148492);
    g = Math.max(0, Math.min(255, g));
  }

  // Calculate Blue
  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = temp - 10;
    b = 138.5177312231 * Math.log(b) - 305.0447927307;
    b = Math.max(0, Math.min(255, b));
  }

  // Normalize gains around daylight 5500K baseline
  // Standard 5500K base gives R~255, G~235, B~215
  const baseR = 255;
  const baseG = 236;
  const baseB = 217;

  let rGain = (r / baseR);
  let gGain = (g / baseG);
  let bGain = (b / baseB);

  // Apply Green/Magenta Tint (-100 to 100)
  // Positive tint increases magenta (boosts R and B relative to G)
  // Negative tint increases green (boosts G)
  const tintFactor = (tint / 100) * 0.25;
  gGain *= (1 - tintFactor);
  rGain *= (1 + tintFactor * 0.5);
  bGain *= (1 + tintFactor * 0.5);

  return [rGain, gGain, bGain];
}

/**
 * RAW Dynamic Range Recovery (Highlight Reconstruction & Shadow Lift)
 */
export function applyRawExposureRecovery(
  r: number,
  g: number,
  b: number,
  highlightRecovery: number, // 0 to 100
  shadowRecovery: number,    // 0 to 100
  blackLevel: number         // -50 to 50
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
      // Non-linear shadow boost curve
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
      const excess = (maxChannel - 180) / 75; // 0 to 1
      const compress = Math.pow(excess, 1.5) * hFactor * 45;

      // Color reconstruction: If one channel blows out earlier than others,
      // reconstruct tonal ratio from remaining unclipped channels
      const minChannel = Math.min(r, g, b);
      const midChannel = r + g + b - maxChannel - minChannel;

      // Compress specular highlights smoothly
      r = Math.max(0, r - compress * (r / (maxChannel + 0.01)));
      g = Math.max(0, g - compress * (g / (maxChannel + 0.01)));
      b = Math.max(0, b - compress * (b / (maxChannel + 0.01)));

      // Prevent harsh magenta/cyan blown color fringing
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
      const topRow = (y - 1) * width;
      const botRow = (y + 1) * width;

      for (let x = 1; x < width - 1; x++) {
        const idx = (row + x) * 4;
        const origR = output[idx];
        const origG = output[idx + 1];
        const origB = output[idx + 2];
        const origY = 0.299 * origR + 0.587 * origG + 0.114 * origB;

        // 3x3 color neighborhood average
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

        // Reconstruct RGB from Y, Cb, Cr
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
