/**
 * High-Performance Detail, Sharpness, Microcontrast & Noise Reduction Engine
 * Implements professional-grade Unsharp Masking with Radius & Masking Edge Thresholds,
 * High-frequency Texture & Structure extraction, Bilateral Luminance Noise Reduction,
 * and Chroma Color Noise Suppression.
 */

export interface DetailEngineParams {
  // Sharpening
  sharpness: number;        // 0 to 150
  radius?: number;          // 0.5 to 3.0 (default 1.0)
  detail?: number;          // 0 to 100 (default 25)
  masking?: number;         // 0 to 100 (default 0)
  edgeSharpening?: number;  // 0 to 100 (default 0)
  previewMask?: boolean;    // show B&W edge mask overlay

  // Structure & Microcontrast
  clarity?: number;         // -100 to 100
  texture?: number;         // -100 to 100
  structure?: number;       // -100 to 100
  microcontrast?: number;   // -100 to 100

  // Noise Reduction
  luminanceNR?: number;       // 0 to 100
  luminanceDetail?: number;   // 0 to 100 (default 50)
  colorNR?: number;           // 0 to 100
  colorDetail?: number;       // 0 to 100 (default 50)
  colorSmoothness?: number;   // 0 to 100 (default 50)
}

/**
 * Main entry point for the Detail & Noise Reduction pipeline
 */
export function applyDetailAndNoisePipeline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: DetailEngineParams
) {
  const {
    sharpness = 0,
    radius = 1.0,
    detail = 25,
    masking = 0,
    edgeSharpening = 0,
    previewMask = false,
    clarity = 0,
    texture = 0,
    structure = 0,
    microcontrast = 0,
    luminanceNR = 0,
    luminanceDetail = 50,
    colorNR = 0,
    colorDetail = 50,
    colorSmoothness = 50,
  } = params;

  const hasNoiseReduction = luminanceNR > 0 || colorNR > 0;
  const hasSharpening = sharpness > 0 || edgeSharpening > 0;
  const hasStructure = clarity !== 0 || texture !== 0 || structure !== 0 || microcontrast !== 0;

  if (!hasNoiseReduction && !hasSharpening && !hasStructure && !previewMask) {
    return;
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Color Noise Reduction (Chroma Denoise in YCbCr space)
  if (colorNR > 0) {
    applyColorNoiseReduction(data, width, height, colorNR, colorDetail, colorSmoothness);
  }

  // 2. Luminance Noise Reduction (Bilateral edge-preserving filter)
  if (luminanceNR > 0) {
    applyLuminanceNoiseReduction(data, width, height, luminanceNR, luminanceDetail);
  }

  // 3. Structure, Clarity, Texture & Microcontrast
  if (hasStructure) {
    applyStructureAndMicrocontrast(data, width, height, {
      clarity,
      texture,
      structure,
      microcontrast,
    });
  }

  // 4. Sharpening with Radius, Detail, Masking & Edge Sharpening
  if (hasSharpening || previewMask) {
    applyAdvancedSharpening(data, width, height, {
      amount: sharpness,
      radius,
      detail,
      masking,
      edgeSharpening,
      previewMask,
    });
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Color / Chroma Noise Reduction: Blurs Cb & Cr channels while retaining sharp luminance
 */
function applyColorNoiseReduction(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number, // 0 to 100
  detail: number, // 0 to 100 (50 default)
  smoothness: number // 0 to 100 (50 default)
) {
  const nrK = (amount / 100);
  const threshold = (100 - detail) * 0.45; // edge preservation threshold
  const radius = Math.max(1, Math.min(3, Math.round(1 + (smoothness / 100) * 2)));

  const len = width * height;
  const cb = new Float32Array(len);
  const cr = new Float32Array(len);
  const lum = new Float32Array(len);

  // Convert to YCbCr
  for (let i = 0; i < len; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    lum[i] = y;
    cb[i] = -0.168736 * r - 0.331264 * g + 0.5 * b;
    cr[i] = 0.5 * r - 0.418688 * g - 0.081312 * b;
  }

  const outCb = new Float32Array(cb);
  const outCr = new Float32Array(cr);

  // Spatial bilateral blur on Cb & Cr channels
  for (let y = radius; y < height - radius; y++) {
    const rowOffset = y * width;
    for (let x = radius; x < width - radius; x++) {
      const idx = rowOffset + x;
      const centerCb = cb[idx];
      const centerCr = cr[idx];
      const centerLum = lum[idx];

      let sumCb = 0;
      let sumCr = 0;
      let weightSum = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        const curRow = (y + dy) * width;
        for (let dx = -radius; dx <= radius; dx++) {
          const nIdx = curRow + (x + dx);
          const nLum = lum[nIdx];
          const lumDiff = Math.abs(centerLum - nLum);

          // Bilateral weighting: if luminance difference is high, preserve boundary
          const lumWeight = Math.max(0.01, 1 - lumDiff / (threshold + 1));
          const spatialWeight = 1 / (1 + (dx * dx + dy * dy) * 0.5);
          const w = lumWeight * spatialWeight;

          sumCb += cb[nIdx] * w;
          sumCr += cr[nIdx] * w;
          weightSum += w;
        }
      }

      const avgCb = sumCb / weightSum;
      const avgCr = sumCr / weightSum;

      outCb[idx] = centerCb * (1 - nrK) + avgCb * nrK;
      outCr[idx] = centerCr * (1 - nrK) + avgCr * nrK;
    }
  }

  // Reconstruct RGB
  for (let i = 0; i < len; i++) {
    const idx = i * 4;
    const y = lum[i];
    const filteredCb = outCb[i];
    const filteredCr = outCr[i];

    const r = y + 1.402 * filteredCr;
    const g = y - 0.344136 * filteredCb - 0.714136 * filteredCr;
    const b = y + 1.772 * filteredCb;

    data[idx] = Math.max(0, Math.min(255, Math.round(r)));
    data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
    data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }
}

/**
 * Luminance Noise Reduction: Bilateral Filter with detail recovery threshold
 */
function applyLuminanceNoiseReduction(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number, // 0 to 100
  detail: number  // 0 to 100
) {
  const nrK = (amount / 100);
  const sigmaRange = (100 - detail) * 0.4 + 6; // Intensity threshold
  const radius = amount > 50 ? 2 : 1;

  const len = width * height;
  const lum = new Float32Array(len);

  for (let i = 0; i < len; i++) {
    const idx = i * 4;
    lum[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  const filteredLum = new Float32Array(lum);

  for (let y = radius; y < height - radius; y++) {
    const rowOffset = y * width;
    for (let x = radius; x < width - radius; x++) {
      const idx = rowOffset + x;
      const centerVal = lum[idx];

      let sum = 0;
      let wSum = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        const curRow = (y + dy) * width;
        for (let dx = -radius; dx <= radius; dx++) {
          const nIdx = curRow + (x + dx);
          const nVal = lum[nIdx];

          const diff = centerVal - nVal;
          const rangeWeight = Math.exp(-(diff * diff) / (2 * sigmaRange * sigmaRange));
          const spatialWeight = 1 / (1 + (dx * dx + dy * dy));
          const w = rangeWeight * spatialWeight;

          sum += nVal * w;
          wSum += w;
        }
      }

      const smoothed = sum / wSum;
      filteredLum[idx] = centerVal * (1 - nrK) + smoothed * nrK;
    }
  }

  // Apply smoothed luminance ratio to RGB
  for (let i = 0; i < len; i++) {
    const idx = i * 4;
    const oldY = lum[i];
    const newY = filteredLum[i];
    const delta = newY - oldY;

    data[idx] = Math.max(0, Math.min(255, Math.round(data[idx] + delta)));
    data[idx + 1] = Math.max(0, Math.min(255, Math.round(data[idx + 1] + delta)));
    data[idx + 2] = Math.max(0, Math.min(255, Math.round(data[idx + 2] + delta)));
  }
}

/**
 * Structure, Texture, Clarity & Microcontrast
 */
function applyStructureAndMicrocontrast(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  params: { clarity: number; texture: number; structure: number; microcontrast: number }
) {
  const { clarity, texture, structure, microcontrast } = params;
  const clarityK = (clarity / 100) * 0.35;
  const textureK = (texture / 100) * 0.40;
  const structK = (structure / 100) * 0.38;
  const microK = (microcontrast / 100) * 0.32;

  const len = width * height;
  const orig = new Uint8ClampedArray(data);

  // Compute multi-frequency neighborhood pass
  for (let y = 2; y < height - 2; y++) {
    const row = y * width;
    const tRow1 = (y - 1) * width;
    const bRow1 = (y + 1) * width;
    const tRow2 = (y - 2) * width;
    const bRow2 = (y + 2) * width;

    for (let x = 2; x < width - 2; x++) {
      const idx = (row + x) * 4;

      for (let c = 0; c < 3; c++) {
        const center = orig[idx + c];

        // 1. High frequency (Radius 1) for Texture
        const sum1 =
          orig[(tRow1 + x) * 4 + c] +
          orig[(bRow1 + x) * 4 + c] +
          orig[(row + x - 1) * 4 + c] +
          orig[(row + x + 1) * 4 + c];
        const avg1 = sum1 / 4;
        const highFreqDelta = center - avg1;

        // 2. Mid frequency (Radius 2) for Structure & Clarity
        const sum2 =
          orig[(tRow2 + x) * 4 + c] +
          orig[(bRow2 + x) * 4 + c] +
          orig[(row + x - 2) * 4 + c] +
          orig[(row + x + 2) * 4 + c];
        const avg2 = (sum1 + sum2) / 8;
        const midFreqDelta = center - avg2;

        // Clarity midtone dampening (prevent highlight/shadow blowing)
        const lumNorm = center / 255;
        const midtoneWeight = 1 - 4 * Math.pow(lumNorm - 0.5, 2);

        // Microcontrast: fine gradient non-linear response
        const microDelta = Math.sign(highFreqDelta) * Math.pow(Math.abs(highFreqDelta) / 255, 0.75) * 255;

        let val = center;
        if (textureK !== 0) val += highFreqDelta * textureK;
        if (structK !== 0) val += midFreqDelta * structK;
        if (clarityK !== 0) val += midFreqDelta * clarityK * midtoneWeight;
        if (microK !== 0) val += (microDelta - highFreqDelta) * microK;

        data[idx + c] = Math.max(0, Math.min(255, Math.round(val)));
      }
    }
  }
}

/**
 * Advanced Sharpening with Radius, Detail, Masking & Edge Sharpening
 */
function applyAdvancedSharpening(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  opts: {
    amount: number;
    radius: number;
    detail: number;
    masking: number;
    edgeSharpening: number;
    previewMask: boolean;
  }
) {
  const { amount, radius, detail, masking, edgeSharpening, previewMask } = opts;
  const sharpK = (amount / 100) * 0.8;
  const edgeBoost = (edgeSharpening / 100) * 0.5;
  const detailFactor = (detail / 100);
  const rStep = Math.max(1, Math.min(3, Math.round(radius)));

  const len = width * height;
  const orig = new Uint8ClampedArray(data);

  // Compute Sobel Edge Magnitude for Masking
  const edgeMap = new Float32Array(len);
  const maskThreshold = (masking / 100) * 60; // 0 to 60 gradient threshold

  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    const tRow = (y - 1) * width;
    const bRow = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      const idx = row + x;
      // Luminance gradients
      const p00 = 0.299 * orig[(tRow + x - 1) * 4] + 0.587 * orig[(tRow + x - 1) * 4 + 1] + 0.114 * orig[(tRow + x - 1) * 4 + 2];
      const p02 = 0.299 * orig[(tRow + x + 1) * 4] + 0.587 * orig[(tRow + x + 1) * 4 + 1] + 0.114 * orig[(tRow + x + 1) * 4 + 2];
      const p20 = 0.299 * orig[(bRow + x - 1) * 4] + 0.587 * orig[(bRow + x - 1) * 4 + 1] + 0.114 * orig[(bRow + x - 1) * 4 + 2];
      const p22 = 0.299 * orig[(bRow + x + 1) * 4] + 0.587 * orig[(bRow + x + 1) * 4 + 1] + 0.114 * orig[(bRow + x + 1) * 4 + 2];
      const p10 = 0.299 * orig[(row + x - 1) * 4] + 0.587 * orig[(row + x - 1) * 4 + 1] + 0.114 * orig[(row + x - 1) * 4 + 2];
      const p12 = 0.299 * orig[(row + x + 1) * 4] + 0.587 * orig[(row + x + 1) * 4 + 1] + 0.114 * orig[(row + x + 1) * 4 + 2];
      const p01 = 0.299 * orig[(tRow + x) * 4] + 0.587 * orig[(tRow + x) * 4 + 1] + 0.114 * orig[(tRow + x) * 4 + 2];
      const p21 = 0.299 * orig[(bRow + x) * 4] + 0.587 * orig[(bRow + x) * 4 + 1] + 0.114 * orig[(bRow + x) * 4 + 2];

      const gx = (p02 + 2 * p12 + p22) - (p00 + 2 * p10 + p20);
      const gy = (p20 + 2 * p21 + p22) - (p00 + 2 * p01 + p02);
      const mag = Math.sqrt(gx * gx + gy * gy);

      // Mask calculation
      if (masking === 0) {
        edgeMap[idx] = 1.0;
      } else {
        if (mag < maskThreshold) {
          edgeMap[idx] = 0;
        } else {
          // Feathered ramp above threshold
          edgeMap[idx] = Math.min(1.0, (mag - maskThreshold) / 20);
        }
      }
    }
  }

  // If user activated "Preview Mask", output black & white mask image
  if (previewMask) {
    for (let i = 0; i < len; i++) {
      const idx = i * 4;
      const maskVal = Math.round(edgeMap[i] * 255);
      data[idx] = maskVal;
      data[idx + 1] = maskVal;
      data[idx + 2] = maskVal;
      data[idx + 3] = 255;
    }
    return;
  }

  // Unsharp Mask computation
  for (let y = rStep; y < height - rStep; y++) {
    const row = y * width;
    const tRow = (y - rStep) * width;
    const bRow = (y + rStep) * width;

    for (let x = rStep; x < width - rStep; x++) {
      const idx = row + x;
      const pIdx = idx * 4;
      const maskWeight = edgeMap[idx];

      if (maskWeight <= 0.01 && masking > 0) {
        continue; // Protected region (flat sky/smooth skin)
      }

      for (let c = 0; c < 3; c++) {
        const center = orig[pIdx + c];
        const sumN =
          orig[(tRow + x) * 4 + c] +
          orig[(bRow + x) * 4 + c] +
          orig[(row + x - rStep) * 4 + c] +
          orig[(row + x + rStep) * 4 + c];
        const blur = sumN / 4;
        const highPass = center - blur;

        // Detail thresholding: low detail suppresses low-contrast micro-noise
        let effectiveHighPass = highPass;
        if (detailFactor < 0.5) {
          const noiseThresh = (0.5 - detailFactor) * 12;
          if (Math.abs(highPass) < noiseThresh) {
            effectiveHighPass = highPass * (detailFactor * 2);
          }
        } else {
          // High detail boosts micro-textures
          effectiveHighPass = highPass * (1 + (detailFactor - 0.5) * 1.5);
        }

        const totalK = (sharpK + edgeBoost) * maskWeight;
        const sharpened = center + effectiveHighPass * totalK;

        data[pIdx + c] = Math.max(0, Math.min(255, Math.round(sharpened)));
      }
    }
  }
}
