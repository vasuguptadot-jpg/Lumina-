/**
 * Lumina Studio Pro - High-Dynamic-Range RAW Development Pipeline
 * Linear Float32 sensor processing:
 * 1. Sensor Normalization & Black/White Point Calibration
 * 2. As-Shot / Kelvin & Tint White Balance Multiplication
 * 3. CFA Demosaicing (AHD / VNG / Bilinear / Superpixel / X-Trans)
 * 4. Camera Matrix -> CIE XYZ (D65) -> Working Color Space
 * 5. Linear Float32 Highlight Recovery & Shadow Dynamic Range Expansion
 * 6. Chromatic Aberration & Anti-Moire Color Filtering
 * 7. Linear-to-Gamma Transfer & Render Buffer Generation
 */

import { RawSensorBuffer } from './rawTypes';
import { RawDevelopSettings, WorkingColorSpace } from '../../types/editor';
import { demosaicSensorData } from './demosaicEngine';

// Standard CIE XYZ D65 to Color Space Matrices
export const XYZ_TO_SRGB_MATRIX = [
  [3.2404542, -1.5371385, -0.4985314],
  [-0.9692660, 1.8760108, 0.0415560],
  [0.0556434, -0.2040259, 1.0572252],
];

export const XYZ_TO_ADOBE_RGB_MATRIX = [
  [2.0413690, -0.5649464, -0.3446944],
  [-0.9692660, 1.8760108, 0.0415560],
  [0.0134474, -0.1183897, 1.0154096],
];

export const XYZ_TO_PROPHOTO_MATRIX = [
  [1.3459433, -0.2556075, -0.0511118],
  [-0.5445989, 1.5081673, 0.0205351],
  [0.0000000, 0.0000000, 1.2118128],
];

export const XYZ_TO_DISPLAY_P3_MATRIX = [
  [2.4934969, -0.9313836, -0.4027108],
  [-0.8294890, 1.7626641, 0.0236247],
  [0.0358458, -0.0761724, 0.9568845],
];

export function developRawSensorBuffer(
  sensorBuffer: RawSensorBuffer,
  settings: RawDevelopSettings,
  targetColorSpace: WorkingColorSpace = 'srgb'
): { imageData: ImageData; width: number; height: number } {
  const { width, height, cfaPattern, colorCalibration } = sensorBuffer;
  const cfa = new Float32Array(sensorBuffer.sensorData);

  // 1. White Balance Gains
  const [rGain, gGain, bGain] = calculateWhiteBalanceGains(
    settings.wbPreset,
    settings.kelvin,
    settings.wbTint,
    colorCalibration.asShotNeutral
  );

  // Apply EV Exposure Compensation ($2^{\text{EV}}$) and White Balance to CFA Photosites
  const exposureEV = (settings as any).exposure || 0;
  const exposureGain = Math.pow(2, exposureEV + (colorCalibration.baselineExposure || 0));

  // Apply Black Level offset adjustment (-50 to +50)
  const blackOffset = (settings.blackLevel || 0) * 0.002;

  // 2. Pre-Demosaicing Channel Gain scaling on CFA
  applyGainsToCfa(cfa, width, height, cfaPattern, rGain * exposureGain, gGain * exposureGain, bGain * exposureGain, blackOffset);

  // 3. CFA Demosaicing (AHD / VNG / Bilinear / Superpixel / X-Trans)
  const demosaicResult = demosaicSensorData(
    cfa,
    width,
    height,
    cfaPattern,
    settings.demosaicMethod || 'ahd'
  );

  const developedW = demosaicResult.width;
  const developedH = demosaicResult.height;
  const rgb = demosaicResult.rgbData; // Linear Float32 RGB array

  // 4. Color Matrix Transform: Camera RGB -> CIE XYZ (D65) -> Working Color Space
  const camToXyz = colorCalibration.colorMatrix1;
  const xyzToWorking = getXyzToColorSpaceMatrix(targetColorSpace);
  const colorTransform = multiply3x3(xyzToWorking, camToXyz);

  // 5. Linear Float32 Processing: Color Transform, Highlight Recovery & Shadow Recovery
  const hlRecovery = (settings.highlightRecovery || 0) / 100;
  const shRecovery = (settings.shadowRecovery || 0) / 100;
  const moireK = (settings.moireReduction || 0) / 100;

  const totalPixels = developedW * developedH;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 3;
    const rIn = rgb[idx];
    const gIn = rgb[idx + 1];
    const bIn = rgb[idx + 2];

    // Color Matrix Transform
    let r = colorTransform[0][0] * rIn + colorTransform[0][1] * gIn + colorTransform[0][2] * bIn;
    let g = colorTransform[1][0] * rIn + colorTransform[1][1] * gIn + colorTransform[1][2] * bIn;
    let b = colorTransform[2][0] * rIn + colorTransform[2][1] * gIn + colorTransform[2][2] * bIn;

    r = Math.max(0, r);
    g = Math.max(0, g);
    b = Math.max(0, b);

    // Linear Highlight Recovery (Reconstruct clipped sensor highlights)
    if (hlRecovery > 0) {
      const maxC = Math.max(r, g, b);
      if (maxC > 0.85) {
        const excess = (maxC - 0.85) / 0.65;
        const compress = Math.pow(Math.min(1.0, excess), 1.6) * hlRecovery * 0.35;
        r = Math.max(0, r - compress * (r / (maxC + 0.001)));
        g = Math.max(0, g - compress * (g / (maxC + 0.001)));
        b = Math.max(0, b - compress * (b / (maxC + 0.001)));
      }
    }

    // Linear Shadow Recovery
    if (shRecovery > 0) {
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (lum < 0.4) {
        const shadowWeight = Math.pow(1 - (lum / 0.4), 1.5) * shRecovery * 0.4;
        r += shadowWeight;
        g += shadowWeight;
        b += shadowWeight;
      }
    }

    rgb[idx] = r;
    rgb[idx + 1] = g;
    rgb[idx + 2] = b;
  }

  // 6. Anti-Moire Chrominance Smoothing
  if (moireK > 0) {
    applyLinearAntiMoire(rgb, developedW, developedH, moireK);
  }

  // 7. Output Conversion to ImageData (with sRGB Gamma transfer curve)
  const outputData = new Uint8ClampedArray(developedW * developedH * 4);
  for (let i = 0; i < totalPixels; i++) {
    const srcIdx = i * 3;
    const dstIdx = i * 4;

    const rLin = rgb[srcIdx];
    const gLin = rgb[srcIdx + 1];
    const bLin = rgb[srcIdx + 2];

    outputData[dstIdx] = Math.round(linearToSrgbGamma(rLin) * 255);
    outputData[dstIdx + 1] = Math.round(linearToSrgbGamma(gLin) * 255);
    outputData[dstIdx + 2] = Math.round(linearToSrgbGamma(bLin) * 255);
    outputData[dstIdx + 3] = 255;
  }

  const imageData = new ImageData(outputData, developedW, developedH);
  return { imageData, width: developedW, height: developedH };
}

// ----------------------------------------------------------------------------
// Gamma & Color Math
// ----------------------------------------------------------------------------
export function linearToSrgbGamma(c: number): number {
  if (c <= 0) return 0;
  if (c >= 1) return 1;
  if (c <= 0.0031308) {
    return 12.92 * c;
  }
  return 1.055 * Math.pow(c, 1.0 / 2.4) - 0.055;
}

export function srgbGammaToLinear(c: number): number {
  if (c <= 0) return 0;
  if (c >= 1) return 1;
  if (c <= 0.04045) {
    return c / 12.92;
  }
  return Math.pow((c + 0.055) / 1.055, 2.4);
}

export function calculateWhiteBalanceGains(
  preset: string,
  kelvin: number,
  tint: number,
  asShotNeutral: [number, number, number]
): [number, number, number] {
  if (preset === 'as-shot') {
    // Invert AsShotNeutral values to get multiplier gains
    const rGain = asShotNeutral[0] > 0 ? 1.0 / asShotNeutral[0] : 1.0;
    const gGain = asShotNeutral[1] > 0 ? 1.0 / asShotNeutral[1] : 1.0;
    const bGain = asShotNeutral[2] > 0 ? 1.0 / asShotNeutral[2] : 1.0;
    // Normalize with green = 1.0
    return [rGain / gGain, 1.0, bGain / gGain];
  }

  // Calculate Planckian Blackbody color temperature multipliers
  const temp = Math.max(2000, Math.min(12000, kelvin)) / 100;
  let r = 0, g = 0, b = 0;

  if (temp <= 66) {
    r = 255;
    g = Math.max(0, Math.min(255, 99.4708025861 * Math.log(temp) - 161.1195681661));
    b = temp <= 19 ? 0 : Math.max(0, Math.min(255, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
  } else {
    r = Math.max(0, Math.min(255, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
    g = Math.max(0, Math.min(255, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
    b = 255;
  }

  // Daylight 5500K baseline
  const baseR = 255;
  const baseG = 236;
  const baseB = 217;

  let rGain = baseR / Math.max(1, r);
  let gGain = baseG / Math.max(1, g);
  let bGain = baseB / Math.max(1, b);

  // Tint adjustment (-100 to +100)
  const tintFactor = (tint / 100) * 0.25;
  gGain *= (1 - tintFactor);
  rGain *= (1 + tintFactor * 0.5);
  bGain *= (1 + tintFactor * 0.5);

  // Normalize green = 1.0
  return [rGain / gGain, 1.0, bGain / gGain];
}

function applyGainsToCfa(
  cfa: Float32Array,
  width: number,
  height: number,
  pattern: any,
  rGain: number,
  gGain: number,
  bGain: number,
  blackOffset: number
) {
  for (let y = 0; y < height; y++) {
    const row = y * width;
    const isEvenY = (y & 1) === 0;

    for (let x = 0; x < width; x++) {
      const idx = row + x;
      const isEvenX = (x & 1) === 0;
      let val = Math.max(0, cfa[idx] - blackOffset);

      if (pattern === 'RGGB') {
        if (isEvenY && isEvenX) val *= rGain;
        else if (!isEvenY && !isEvenX) val *= bGain;
        else val *= gGain;
      } else if (pattern === 'BGGR') {
        if (isEvenY && isEvenX) val *= bGain;
        else if (!isEvenY && !isEvenX) val *= rGain;
        else val *= gGain;
      } else if (pattern === 'GRBG') {
        if (isEvenY && isEvenX) val *= gGain;
        else if (isEvenY && !isEvenX) val *= rGain;
        else if (!isEvenY && isEvenX) val *= bGain;
        else val *= gGain;
      } else {
        val *= gGain;
      }

      cfa[idx] = val;
    }
  }
}

function getXyzToColorSpaceMatrix(space: WorkingColorSpace): number[][] {
  switch (space) {
    case 'display-p3':
      return XYZ_TO_DISPLAY_P3_MATRIX;
    case 'adobe-rgb':
      return XYZ_TO_ADOBE_RGB_MATRIX;
    case 'prophoto-rgb':
      return XYZ_TO_PROPHOTO_MATRIX;
    case 'srgb':
    default:
      return XYZ_TO_SRGB_MATRIX;
  }
}

export function multiply3x3(a: number[][], b: number[][]): number[][] {
  const c = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      c[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j];
    }
  }
  return c;
}

function applyLinearAntiMoire(rgb: Float32Array, width: number, height: number, amount: number) {
  const k = amount * 0.5;
  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = (row + x) * 3;
      const r = rgb[idx];
      const g = rgb[idx + 1];
      const b = rgb[idx + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      // 3x3 chrominance blur
      let sumR = 0, sumB = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nIdx = ((y + dy) * width + x + dx) * 3;
          sumR += rgb[nIdx];
          sumB += rgb[nIdx + 2];
        }
      }

      const avgR = sumR / 9;
      const avgB = sumB / 9;

      rgb[idx] = r * (1 - k) + avgR * k;
      rgb[idx + 2] = b * (1 - k) + avgB * k;
      // Preserve original green/luminance
      rgb[idx + 1] = g;
    }
  }
}
