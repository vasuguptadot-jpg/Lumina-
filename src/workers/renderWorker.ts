/**
 * Lumina Studio Pro - Dedicated Web Worker (Module Worker)
 */

// Math helpers
function clamp(val: number, min: number, max: number): number {
  return val < min ? min : val > max ? max : val;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rf:
        h = (gf - bf) / d + (gf < bf ? 6 : 0);
        break;
      case gf:
        h = (bf - rf) / d + 2;
        break;
      case bf:
        h = (rf - gf) / d + 4;
        break;
    }
    h = h * 60;
  }
  return [h, s, l];
}

function hueToRgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hn = ((h % 360) + 360) % 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = hn / 360;
  const r = hueToRgb(p, q, hk + 1 / 3);
  const g = hueToRgb(p, q, hk);
  const b = hueToRgb(p, q, hk - 1 / 3);
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function getHslWeights(hue: number): Record<string, number> {
  const weights: Record<string, number> = {
    red: 0,
    orange: 0,
    yellow: 0,
    green: 0,
    aqua: 0,
    blue: 0,
    purple: 0,
    magenta: 0,
  };
  const ranges = [
    { name: 'red', center: 0, spread: 25 },
    { name: 'orange', center: 30, spread: 20 },
    { name: 'yellow', center: 60, spread: 25 },
    { name: 'green', center: 120, spread: 40 },
    { name: 'aqua', center: 180, spread: 30 },
    { name: 'blue', center: 240, spread: 40 },
    { name: 'purple', center: 290, spread: 30 },
    { name: 'magenta', center: 330, spread: 25 },
  ];

  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i];
    let diff = Math.abs(hue - r.center);
    if (diff > 180) diff = 360 - diff;
    if (diff < r.spread) {
      weights[r.name] = Math.max(0, 1 - diff / r.spread);
    }
  }
  return weights;
}

function sample3DLUT(rNorm: number, gNorm: number, bNorm: number, lut: any): [number, number, number] {
  if (!lut || !lut.data || !lut.size) return [rNorm * 255, gNorm * 255, bNorm * 255];
  const size = lut.size;
  const d = lut.data;
  const maxIdx = size - 1;

  const rf = clamp(rNorm, 0, 1) * maxIdx;
  const gf = clamp(gNorm, 0, 1) * maxIdx;
  const bf = clamp(bNorm, 0, 1) * maxIdx;

  const r0 = Math.floor(rf);
  const r1 = Math.min(r0 + 1, maxIdx);
  const g0 = Math.floor(gf);
  const g1 = Math.min(g0 + 1, maxIdx);
  const b0 = Math.floor(bf);
  const b1 = Math.min(b0 + 1, maxIdx);

  const dr = rf - r0;
  const dg = gf - g0;
  const db = bf - b0;

  function getRGB(r: number, g: number, b: number) {
    const idx = (b * size * size + g * size + r) * 3;
    return [d[idx] * 255, d[idx + 1] * 255, d[idx + 2] * 255];
  }

  const c000 = getRGB(r0, g0, b0);
  const c100 = getRGB(r1, g0, b0);
  const c010 = getRGB(r0, g1, b0);
  const c110 = getRGB(r1, g1, b0);
  const c001 = getRGB(r0, g0, b1);
  const c101 = getRGB(r1, g0, b1);
  const c011 = getRGB(r0, g1, b1);
  const c111 = getRGB(r1, g1, b1);

  const out: [number, number, number] = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    const c00 = c000[c] * (1 - dr) + c100[c] * dr;
    const c01 = c001[c] * (1 - dr) + c101[c] * dr;
    const c10 = c010[c] * (1 - dr) + c110[c] * dr;
    const c11 = c011[c] * (1 - dr) + c111[c] * dr;
    const c0 = c00 * (1 - dg) + c10 * dg;
    const c1 = c01 * (1 - dg) + c11 * dg;
    out[c] = c0 * (1 - db) + c1 * db;
  }
  return out;
}

function processTilePixelPipeline(payload: any) {
  const buffer = payload.buffer as ArrayBuffer;
  const tileWidth = payload.tileWidth as number;
  const tileHeight = payload.tileHeight as number;
  const halo = payload.halo || { top: 0, bottom: 0, left: 0, right: 0 };
  const totalW = tileWidth + halo.left + halo.right;
  const totalH = tileHeight + halo.top + halo.bottom;

  const data = new Uint8ClampedArray(buffer);
  const adj = payload.adjustments || {};
  const hsl = payload.hsl;
  const masterLUT = payload.masterLUT;
  const redLUT = payload.redLUT;
  const greenLUT = payload.greenLUT;
  const blueLUT = payload.blueLUT;
  const lutData = payload.lutData;
  const lutIntensity = payload.lutIntensity || 0;

  const exposureMult = Math.pow(2, (adj.exposure || 0) / 50);
  const brightnessOffset = ((adj.brightness || 0) / 100) * 128;
  const contrastFactor = Math.tan((((adj.contrast || 0) + 100) * Math.PI) / 400);
  const highlightsAdj = (adj.highlights || 0) / 100;
  const shadowsAdj = (adj.shadows || 0) / 100;
  const whitesAdj = (adj.whites || 0) / 100;
  const blacksAdj = (adj.blacks || 0) / 100;

  const temp = (adj.temperature || 0) / 100;
  const tintVal = (adj.tint || 0) / 100;
  const rTempMult = temp > 0 ? 1 + temp * 0.4 : 1;
  const bTempMult = temp < 0 ? 1 + Math.abs(temp) * 0.4 : 1;
  const gTintMult = tintVal < 0 ? 1 + Math.abs(tintVal) * 0.3 : 1;
  const rbTintMult = tintVal > 0 ? 1 + tintVal * 0.25 : 1;

  const satMult = 1 + (adj.saturation || 0) / 100;
  const vibranceVal = (adj.vibrance || 0) / 100;
  const dehazeVal = (adj.dehaze || 0) / 100;
  const fadeAmount = (adj.fade || 0) / 100;

  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // White Balance
    r = r * rTempMult * rbTintMult;
    g = g * gTintMult;
    b = b * bTempMult * rbTintMult;

    // Exposure & Brightness
    r = r * exposureMult + brightnessOffset;
    g = g * exposureMult + brightnessOffset;
    b = b * exposureMult + brightnessOffset;

    // Contrast
    r = (r - 128) * contrastFactor + 128;
    g = (g - 128) * contrastFactor + 128;
    b = (b - 128) * contrastFactor + 128;

    // Tone Zones
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (highlightsAdj !== 0 && lum > 128) {
      const wH = (lum - 128) / 127;
      r += highlightsAdj * 40 * wH;
      g += highlightsAdj * 40 * wH;
      b += highlightsAdj * 40 * wH;
    }
    if (shadowsAdj !== 0 && lum < 128) {
      const wS = (128 - lum) / 128;
      r += shadowsAdj * 40 * wS;
      g += shadowsAdj * 40 * wS;
      b += shadowsAdj * 40 * wS;
    }
    if (whitesAdj !== 0 && lum > 200) {
      const wW = (lum - 200) / 55;
      r += whitesAdj * 35 * wW;
      g += whitesAdj * 35 * wW;
      b += whitesAdj * 35 * wW;
    }
    if (blacksAdj !== 0 && lum < 55) {
      const wB = (55 - lum) / 55;
      r += blacksAdj * 35 * wB;
      g += blacksAdj * 35 * wB;
      b += blacksAdj * 35 * wB;
    }

    // Dehaze
    if (dehazeVal !== 0) {
      const minCh = Math.min(r, g, b);
      const hazeEst = (minCh / 255) * dehazeVal * 30;
      r = r + (r - 128) * (dehazeVal * 0.25) - hazeEst;
      g = g + (g - 128) * (dehazeVal * 0.25) - hazeEst;
      b = b + (b - 128) * (dehazeVal * 0.25) - hazeEst;
    }

    // Fade
    if (fadeAmount > 0) {
      const fadeLift = fadeAmount * 45;
      r = fadeLift + r * (1 - fadeAmount * 0.18);
      g = fadeLift + g * (1 - fadeAmount * 0.18);
      b = fadeLift + b * (1 - fadeAmount * 0.18);
    }

    // Tone Curves
    if (masterLUT) {
      r = redLUT ? redLUT[masterLUT[clamp(Math.round(r), 0, 255)]] : masterLUT[clamp(Math.round(r), 0, 255)];
      g = greenLUT ? greenLUT[masterLUT[clamp(Math.round(g), 0, 255)]] : masterLUT[clamp(Math.round(g), 0, 255)];
      b = blueLUT ? blueLUT[masterLUT[clamp(Math.round(b), 0, 255)]] : masterLUT[clamp(Math.round(b), 0, 255)];
    }

    // Saturation & Vibrance
    const curLum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (satMult !== 1 || vibranceVal !== 0) {
      const maxC = Math.max(r, g, b);
      const minC2 = Math.min(r, g, b);
      const curSat = maxC === 0 ? 0 : (maxC - minC2) / maxC;
      const vibFactor = 1 + vibranceVal * (1 - curSat);
      const totalSat = satMult * vibFactor;
      r = curLum + (r - curLum) * totalSat;
      g = curLum + (g - curLum) * totalSat;
      b = curLum + (b - curLum) * totalSat;
    }

    // 8-Channel HSL Mixer
    if (hsl) {
      const hslRes = rgbToHsl(r, g, b);
      let h = hslRes[0];
      let s = hslRes[1];
      let l = hslRes[2];

      if (s > 0.05) {
        const weights = getHslWeights(h);
        let dH = 0;
        let dS = 0;
        let dL = 0;
        for (const k in weights) {
          const wK = weights[k];
          if (wK > 0 && hsl[k]) {
            dH += (hsl[k].hue || 0) * wK;
            dS += (hsl[k].saturation || 0) * wK;
            dL += (hsl[k].luminance || 0) * wK;
          }
        }
        if (dH !== 0 || dS !== 0 || dL !== 0) {
          h = (h + dH * 0.5 + 360) % 360;
          s = clamp(s * (1 + dS / 100), 0, 1);
          l = clamp(l * (1 + dL / 100), 0, 1);
          const rgbN = hslToRgb(h, s, l);
          r = rgbN[0];
          g = rgbN[1];
          b = rgbN[2];
        }
      }
    }

    // 3D LUT
    if (lutData && lutIntensity > 0) {
      const sampled = sample3DLUT(r / 255, g / 255, b / 255, lutData);
      r = r * (1 - lutIntensity) + sampled[0] * lutIntensity;
      g = g * (1 - lutIntensity) + sampled[1] * lutIntensity;
      b = b * (1 - lutIntensity) + sampled[2] * lutIntensity;
    }

    data[i] = clamp(Math.round(r), 0, 255);
    data[i + 1] = clamp(Math.round(g), 0, 255);
    data[i + 2] = clamp(Math.round(b), 0, 255);
  }

  const sharpness = adj.sharpness || 0;
  const luminanceNR = adj.luminanceNR !== undefined ? adj.luminanceNR : (adj.noiseReduction || 0);
  const colorNR = adj.colorNoiseReduction || 0;

  if (luminanceNR > 0 || colorNR > 0 || sharpness > 0) {
    applyTileConvolutions(data, totalW, totalH, {
      sharpness: sharpness,
      sharpnessRadius: adj.sharpnessRadius || 1.0,
      sharpnessDetail: adj.sharpnessDetail !== undefined ? adj.sharpnessDetail : 25,
      sharpnessMasking: adj.sharpnessMasking || 0,
      luminanceNR: luminanceNR,
      luminanceDetail: adj.luminanceDetail !== undefined ? adj.luminanceDetail : 50,
      colorNR: colorNR,
    });
  }

  // Extract Clean Inner Tile (Strip Halo Padding)
  const outBuffer = new ArrayBuffer(tileWidth * tileHeight * 4);
  const outData = new Uint8ClampedArray(outBuffer);

  const startX = halo.left;
  const startY = halo.top;

  for (let y = 0; y < tileHeight; y++) {
    const srcRow = (startY + y) * totalW * 4 + startX * 4;
    const dstRow = y * tileWidth * 4;
    const rowByteLen = tileWidth * 4;
    outData.set(data.subarray(srcRow, srcRow + rowByteLen), dstRow);
  }

  return {
    buffer: outBuffer,
    tileId: payload.tileId,
    generation: payload.generation,
    x: payload.x,
    y: payload.y,
    width: tileWidth,
    height: tileHeight,
  };
}

function applyTileConvolutions(data: Uint8ClampedArray, width: number, height: number, params: any) {
  const len = width * height;

  // Chroma Noise Reduction
  if (params.colorNR > 0) {
    const nrK = params.colorNR / 100;
    const cb = new Float32Array(len);
    const cr = new Float32Array(len);
    const lum = new Float32Array(len);

    for (let i = 0; i < len; i++) {
      const idx = i * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
      cb[i] = -0.168736 * r - 0.331264 * g + 0.5 * b;
      cr[i] = 0.5 * r - 0.418688 * g - 0.081312 * b;
    }

    for (let y = 1; y < height - 1; y++) {
      const rOff = y * width;
      for (let x = 1; x < width - 1; x++) {
        const pIdx = rOff + x;
        const avgCb = (cb[pIdx - 1] + cb[pIdx + 1] + cb[pIdx - width] + cb[pIdx + width]) * 0.25;
        const avgCr = (cr[pIdx - 1] + cr[pIdx + 1] + cr[pIdx - width] + cr[pIdx + width]) * 0.25;
        const fCb = cb[pIdx] * (1 - nrK) + avgCb * nrK;
        const fCr = cr[pIdx] * (1 - nrK) + avgCr * nrK;
        const yV = lum[pIdx];

        const nR = yV + 1.402 * fCr;
        const nG = yV - 0.344136 * fCb - 0.714136 * fCr;
        const nB = yV + 1.772 * fCb;

        const bIdx = pIdx * 4;
        data[bIdx] = clamp(Math.round(nR), 0, 255);
        data[bIdx + 1] = clamp(Math.round(nG), 0, 255);
        data[bIdx + 2] = clamp(Math.round(nB), 0, 255);
      }
    }
  }

  // Luminance Noise Reduction
  if (params.luminanceNR > 0) {
    const nrKLum = params.luminanceNR / 100;
    const lumArr = new Float32Array(len);
    for (let j = 0; j < len; j++) {
      const p4 = j * 4;
      lumArr[j] = 0.299 * data[p4] + 0.587 * data[p4 + 1] + 0.114 * data[p4 + 2];
    }

    for (let y2 = 1; y2 < height - 1; y2++) {
      const rOff2 = y2 * width;
      for (let x2 = 1; x2 < width - 1; x2++) {
        const idx2 = rOff2 + x2;
        const cL = lumArr[idx2];
        const neighbors = [lumArr[idx2 - 1], lumArr[idx2 + 1], lumArr[idx2 - width], lumArr[idx2 + width]];
        let sum = 0;
        let totalW = 0;
        for (let n = 0; n < 4; n++) {
          const diff = Math.abs(cL - neighbors[n]);
          const w = diff < 20 ? 1 : Math.max(0.1, 1 - (diff - 20) / 40);
          sum += neighbors[n] * w;
          totalW += w;
        }
        const avgL = sum / totalW;
        const targetL = cL * (1 - nrKLum) + avgL * nrKLum;
        const shift = targetL - cL;

        const bIdx2 = idx2 * 4;
        data[bIdx2] = clamp(Math.round(data[bIdx2] + shift), 0, 255);
        data[bIdx2 + 1] = clamp(Math.round(data[bIdx2 + 1] + shift), 0, 255);
        data[bIdx2 + 2] = clamp(Math.round(data[bIdx2 + 2] + shift), 0, 255);
      }
    }
  }

  // Unsharp Mask Sharpening
  if (params.sharpness > 0) {
    const sharpK = (params.sharpness / 100) * 0.6;
    const maskThresh = (params.sharpnessMasking || 0) * 0.4;
    const copy = new Uint8ClampedArray(data);

    for (let y3 = 1; y3 < height - 1; y3++) {
      const rOff3 = y3 * width * 4;
      const rTop = (y3 - 1) * width * 4;
      const rBot = (y3 + 1) * width * 4;

      for (let x3 = 1; x3 < width - 1; x3++) {
        const cIdx = rOff3 + x3 * 4;
        const lIdx = rOff3 + (x3 - 1) * 4;
        const rIdx = rOff3 + (x3 + 1) * 4;
        const tIdx = rTop + x3 * 4;
        const bIdx3 = rBot + x3 * 4;

        const cLum = 0.299 * copy[cIdx] + 0.587 * copy[cIdx + 1] + 0.114 * copy[cIdx + 2];
        const avgN = (
          (0.299 * copy[lIdx] + 0.587 * copy[lIdx + 1] + 0.114 * copy[lIdx + 2]) +
          (0.299 * copy[rIdx] + 0.587 * copy[rIdx + 1] + 0.114 * copy[rIdx + 2]) +
          (0.299 * copy[tIdx] + 0.587 * copy[tIdx + 1] + 0.114 * copy[tIdx + 2]) +
          (0.299 * copy[bIdx3] + 0.587 * copy[bIdx3 + 1] + 0.114 * copy[bIdx3 + 2])
        ) * 0.25;

        const edgeMagnitude = Math.abs(cLum - avgN);
        if (edgeMagnitude >= maskThresh) {
          for (let c = 0; c < 3; c++) {
            const centerVal = copy[cIdx + c];
            const neighborAvg = (copy[lIdx + c] + copy[rIdx + c] + copy[tIdx + c] + copy[bIdx3 + c]) * 0.25;
            const highFreq = centerVal - neighborAvg;
            data[cIdx + c] = clamp(Math.round(centerVal + highFreq * sharpK), 0, 255);
          }
        }
      }
    }
  }
}

function computeHistogramWorker(payload: any) {
  const buffer = payload.buffer as ArrayBuffer;
  const data = new Uint8ClampedArray(buffer);
  const r = new Uint32Array(256);
  const g = new Uint32Array(256);
  const b = new Uint32Array(256);
  const lum = new Uint32Array(256);

  const step = Math.max(4, Math.floor(data.length / (120000 * 4)) * 4);
  for (let i = 0; i < data.length; i += step) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    r[red]++;
    g[green]++;
    b[blue]++;
    const l = Math.round(0.2126 * red + 0.7152 * green + 0.0722 * blue);
    lum[l]++;
  }

  return {
    r,
    g,
    b,
    lum,
    generation: payload.generation,
  };
}

self.onmessage = (e: MessageEvent) => {
  const data = e.data;
  if (!data) return;

  const type = data.type;
  const jobId = data.jobId;
  const generation = data.generation;
  const payload = data.payload || {};
  payload.jobId = jobId;
  payload.generation = generation;

  try {
    let result: any;
    const transferList: Transferable[] = [];

    switch (type) {
      case 'render_tile': {
        result = processTilePixelPipeline(payload);
        if (result.buffer) {
          transferList.push(result.buffer);
        }
        break;
      }

      case 'compute_histogram': {
        result = computeHistogramWorker(payload);
        break;
      }

      default: {
        result = { status: 'unknown_type', type };
        break;
      }
    }

    (self as any).postMessage(
      {
        jobId,
        generation,
        success: true,
        result,
      },
      transferList
    );
  } catch (err: any) {
    (self as any).postMessage({
      jobId,
      generation,
      success: false,
      error: (err && err.message) || String(err),
    });
  }
};

export {};
