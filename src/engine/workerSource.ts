/**
 * Lumina Studio Pro - High-Performance Web Worker Source
 * Executed inside dedicated Web Workers (Off-main-thread).
 * 
 * Supports:
 * - Color Pipeline transformations (Exposure, Curves, HSL, 3D LUTs, Color Wheels, etc.)
 * - Tiled convolution processing with halo padding (Unsharp Mask Sharpening, Bilateral NR, Chroma NR)
 * - Parallel 256-bin Histogram & Waveform computations
 * - Cubic Spline Tone Curve LUT precomputations
 */

export const WORKER_INLINE_SCRIPT = `
(function() {
  'use strict';

  // --- Helper math & conversions ---
  function clamp(val, min, max) {
    return val < min ? min : (val > max ? max : val);
  }

  function rgbToHsl(r, g, b) {
    var rf = r / 255;
    var gf = g / 255;
    var bf = b / 255;
    var max = Math.max(rf, gf, bf);
    var min = Math.min(rf, gf, bf);
    var h = 0;
    var s = 0;
    var l = (max + min) / 2;

    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rf: h = (gf - bf) / d + (gf < bf ? 6 : 0); break;
        case gf: h = (bf - rf) / d + 2; break;
        case bf: h = (rf - gf) / d + 4; break;
      }
      h = h * 60;
    }
    return [h, s, l];
  }

  function hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  function hslToRgb(h, s, l) {
    var hn = ((h % 360) + 360) % 360;
    if (s === 0) {
      var v = Math.round(l * 255);
      return [v, v, v];
    }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    var hk = hn / 360;
    var r = hueToRgb(p, q, hk + 1 / 3);
    var g = hueToRgb(p, q, hk);
    var b = hueToRgb(p, q, hk - 1 / 3);
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function getHslWeights(hue) {
    var weights = { red: 0, orange: 0, yellow: 0, green: 0, aqua: 0, blue: 0, purple: 0, magenta: 0 };
    var ranges = [
      { name: 'red', center: 0, spread: 25 },
      { name: 'orange', center: 30, spread: 20 },
      { name: 'yellow', center: 60, spread: 25 },
      { name: 'green', center: 120, spread: 40 },
      { name: 'aqua', center: 180, spread: 30 },
      { name: 'blue', center: 240, spread: 40 },
      { name: 'purple', center: 290, spread: 30 },
      { name: 'magenta', center: 330, spread: 25 }
    ];

    for (var i = 0; i < ranges.length; i++) {
      var r = ranges[i];
      var diff = Math.abs(hue - r.center);
      if (diff > 180) diff = 360 - diff;
      if (diff < r.spread) {
        weights[r.name] = Math.max(0, 1 - diff / r.spread);
      }
    }
    return weights;
  }

  function sample3DLUT(rNorm, gNorm, bNorm, lut) {
    if (!lut || !lut.data || !lut.size) return [rNorm * 255, gNorm * 255, bNorm * 255];
    var size = lut.size;
    var d = lut.data;
    var maxIdx = size - 1;

    var rf = clamp(rNorm, 0, 1) * maxIdx;
    var gf = clamp(gNorm, 0, 1) * maxIdx;
    var bf = clamp(bNorm, 0, 1) * maxIdx;

    var r0 = Math.floor(rf);
    var r1 = Math.min(r0 + 1, maxIdx);
    var g0 = Math.floor(gf);
    var g1 = Math.min(g0 + 1, maxIdx);
    var b0 = Math.floor(bf);
    var b1 = Math.min(b0 + 1, maxIdx);

    var dr = rf - r0;
    var dg = gf - g0;
    var db = bf - b0;

    function getRGB(r, g, b) {
      var idx = (b * size * size + g * size + r) * 3;
      return [d[idx] * 255, d[idx + 1] * 255, d[idx + 2] * 255];
    }

    var c000 = getRGB(r0, g0, b0);
    var c100 = getRGB(r1, g0, b0);
    var c010 = getRGB(r0, g1, b0);
    var c110 = getRGB(r1, g1, b0);
    var c001 = getRGB(r0, g0, b1);
    var c101 = getRGB(r1, g0, b1);
    var c011 = getRGB(r0, g1, b1);
    var c111 = getRGB(r1, g1, b1);

    var out = [0, 0, 0];
    for (var c = 0; c < 3; c++) {
      var c00 = c000[c] * (1 - dr) + c100[c] * dr;
      var c01 = c001[c] * (1 - dr) + c101[c] * dr;
      var c10 = c010[c] * (1 - dr) + c110[c] * dr;
      var c11 = c011[c] * (1 - dr) + c111[c] * dr;
      var c0 = c00 * (1 - dg) + c10 * dg;
      var c1 = c01 * (1 - dg) + c11 * dg;
      out[c] = c0 * (1 - db) + c1 * db;
    }
    return out;
  }

  // --- Processing Functions ---

  function processTilePixelPipeline(payload) {
    var buffer = payload.buffer;
    var tileWidth = payload.tileWidth;
    var tileHeight = payload.tileHeight;
    var halo = payload.halo || { top: 0, bottom: 0, left: 0, right: 0 };
    var totalW = tileWidth + halo.left + halo.right;
    var totalH = tileHeight + halo.top + halo.bottom;

    var data = new Uint8ClampedArray(buffer);
    var adj = payload.adjustments || {};
    var hsl = payload.hsl;
    var masterLUT = payload.masterLUT;
    var redLUT = payload.redLUT;
    var greenLUT = payload.greenLUT;
    var blueLUT = payload.blueLUT;
    var lutData = payload.lutData;
    var lutIntensity = payload.lutIntensity || 0;

    // Multipliers & precomputations
    var exposureMult = Math.pow(2, (adj.exposure || 0) / 50);
    var brightnessOffset = ((adj.brightness || 0) / 100) * 128;
    var contrastFactor = Math.tan((((adj.contrast || 0) + 100) * Math.PI) / 400);
    var highlightsAdj = (adj.highlights || 0) / 100;
    var shadowsAdj = (adj.shadows || 0) / 100;
    var whitesAdj = (adj.whites || 0) / 100;
    var blacksAdj = (adj.blacks || 0) / 100;

    var temp = (adj.temperature || 0) / 100;
    var tintVal = (adj.tint || 0) / 100;
    var rTempMult = temp > 0 ? 1 + temp * 0.4 : 1;
    var bTempMult = temp < 0 ? 1 + Math.abs(temp) * 0.4 : 1;
    var gTintMult = tintVal < 0 ? 1 + Math.abs(tintVal) * 0.3 : 1;
    var rbTintMult = tintVal > 0 ? 1 + tintVal * 0.25 : 1;

    var satMult = 1 + (adj.saturation || 0) / 100;
    var vibranceVal = (adj.vibrance || 0) / 100;
    var dehazeVal = (adj.dehaze || 0) / 100;
    var fadeAmount = (adj.fade || 0) / 100;

    var len = data.length;

    // 1. Pixel-level Color Transformation
    for (var i = 0; i < len; i += 4) {
      var r = data[i];
      var g = data[i + 1];
      var b = data[i + 2];

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
      var lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (highlightsAdj !== 0 && lum > 128) {
        var wH = (lum - 128) / 127;
        r += highlightsAdj * 40 * wH;
        g += highlightsAdj * 40 * wH;
        b += highlightsAdj * 40 * wH;
      }
      if (shadowsAdj !== 0 && lum < 128) {
        var wS = (128 - lum) / 128;
        r += shadowsAdj * 40 * wS;
        g += shadowsAdj * 40 * wS;
        b += shadowsAdj * 40 * wS;
      }
      if (whitesAdj !== 0 && lum > 200) {
        var wW = (lum - 200) / 55;
        r += whitesAdj * 35 * wW;
        g += whitesAdj * 35 * wW;
        b += whitesAdj * 35 * wW;
      }
      if (blacksAdj !== 0 && lum < 55) {
        var wB = (55 - lum) / 55;
        r += blacksAdj * 35 * wB;
        g += blacksAdj * 35 * wB;
        b += blacksAdj * 35 * wB;
      }

      // Dehaze
      if (dehazeVal !== 0) {
        var minCh = Math.min(r, g, b);
        var hazeEst = (minCh / 255) * dehazeVal * 30;
        r = r + (r - 128) * (dehazeVal * 0.25) - hazeEst;
        g = g + (g - 128) * (dehazeVal * 0.25) - hazeEst;
        b = b + (b - 128) * (dehazeVal * 0.25) - hazeEst;
      }

      // Fade
      if (fadeAmount > 0) {
        var fadeLift = fadeAmount * 45;
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
      var curLum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (satMult !== 1 || vibranceVal !== 0) {
        var maxC = Math.max(r, g, b);
        var minC2 = Math.min(r, g, b);
        var curSat = maxC === 0 ? 0 : (maxC - minC2) / maxC;
        var vibFactor = 1 + vibranceVal * (1 - curSat);
        var totalSat = satMult * vibFactor;
        r = curLum + (r - curLum) * totalSat;
        g = curLum + (g - curLum) * totalSat;
        b = curLum + (b - curLum) * totalSat;
      }

      // 8-Channel HSL Mixer
      if (hsl) {
        var hslRes = rgbToHsl(r, g, b);
        var h = hslRes[0];
        var s = hslRes[1];
        var l = hslRes[2];

        if (s > 0.05) {
          var weights = getHslWeights(h);
          var dH = 0, dS = 0, dL = 0;
          for (var k in weights) {
            var wK = weights[k];
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
            var rgbN = hslToRgb(h, s, l);
            r = rgbN[0];
            g = rgbN[1];
            b = rgbN[2];
          }
        }
      }

      // 3D LUT
      if (lutData && lutIntensity > 0) {
        var sampled = sample3DLUT(r / 255, g / 255, b / 255, lutData);
        r = r * (1 - lutIntensity) + sampled[0] * lutIntensity;
        g = g * (1 - lutIntensity) + sampled[1] * lutIntensity;
        b = b * (1 - lutIntensity) + sampled[2] * lutIntensity;
      }

      data[i] = clamp(Math.round(r), 0, 255);
      data[i + 1] = clamp(Math.round(g), 0, 255);
      data[i + 2] = clamp(Math.round(b), 0, 255);
    }

    // 2. Convolution Passes (Sharpening & Noise Reduction across tile + halo)
    var sharpness = adj.sharpness || 0;
    var luminanceNR = adj.luminanceNR !== undefined ? adj.luminanceNR : (adj.noiseReduction || 0);
    var colorNR = adj.colorNoiseReduction || 0;

    if (luminanceNR > 0 || colorNR > 0 || sharpness > 0) {
      applyTileConvolutions(data, totalW, totalH, {
        sharpness: sharpness,
        sharpnessRadius: adj.sharpnessRadius || 1.0,
        sharpnessDetail: adj.sharpnessDetail !== undefined ? adj.sharpnessDetail : 25,
        sharpnessMasking: adj.sharpnessMasking || 0,
        luminanceNR: luminanceNR,
        luminanceDetail: adj.luminanceDetail !== undefined ? adj.luminanceDetail : 50,
        colorNR: colorNR
      });
    }

    // 3. Extract Clean Inner Tile (Strip Halo Padding)
    var outBuffer = new ArrayBuffer(tileWidth * tileHeight * 4);
    var outData = new Uint8ClampedArray(outBuffer);

    var startX = halo.left;
    var startY = halo.top;

    for (var y = 0; y < tileHeight; y++) {
      var srcRow = (startY + y) * totalW * 4 + startX * 4;
      var dstRow = y * tileWidth * 4;
      var rowByteLen = tileWidth * 4;
      outData.set(data.subarray(srcRow, srcRow + rowByteLen), dstRow);
    }

    return {
      buffer: outBuffer,
      tileId: payload.tileId,
      generation: payload.generation,
      x: payload.x,
      y: payload.y,
      width: tileWidth,
      height: tileHeight
    };
  }

  function applyTileConvolutions(data, width, height, params) {
    var len = width * height;

    // Chroma Noise Reduction
    if (params.colorNR > 0) {
      var nrK = params.colorNR / 100;
      var cb = new Float32Array(len);
      var cr = new Float32Array(len);
      var lum = new Float32Array(len);

      for (var i = 0; i < len; i++) {
        var idx = i * 4;
        var r = data[idx], g = data[idx + 1], b = data[idx + 2];
        lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
        cb[i] = -0.168736 * r - 0.331264 * g + 0.5 * b;
        cr[i] = 0.5 * r - 0.418688 * g - 0.081312 * b;
      }

      for (var y = 1; y < height - 1; y++) {
        var rOff = y * width;
        for (var x = 1; x < width - 1; x++) {
          var pIdx = rOff + x;
          var avgCb = (cb[pIdx - 1] + cb[pIdx + 1] + cb[pIdx - width] + cb[pIdx + width]) * 0.25;
          var avgCr = (cr[pIdx - 1] + cr[pIdx + 1] + cr[pIdx - width] + cr[pIdx + width]) * 0.25;
          var fCb = cb[pIdx] * (1 - nrK) + avgCb * nrK;
          var fCr = cr[pIdx] * (1 - nrK) + avgCr * nrK;
          var yV = lum[pIdx];

          var nR = yV + 1.402 * fCr;
          var nG = yV - 0.344136 * fCb - 0.714136 * fCr;
          var nB = yV + 1.772 * fCb;

          var bIdx = pIdx * 4;
          data[bIdx] = clamp(Math.round(nR), 0, 255);
          data[bIdx + 1] = clamp(Math.round(nG), 0, 255);
          data[bIdx + 2] = clamp(Math.round(nB), 0, 255);
        }
      }
    }

    // Luminance Noise Reduction (Bilateral Edge Filter)
    if (params.luminanceNR > 0) {
      var nrKLum = params.luminanceNR / 100;
      var lumArr = new Float32Array(len);
      for (var j = 0; j < len; j++) {
        var p4 = j * 4;
        lumArr[j] = 0.299 * data[p4] + 0.587 * data[p4 + 1] + 0.114 * data[p4 + 2];
      }

      for (var y2 = 1; y2 < height - 1; y2++) {
        var rOff2 = y2 * width;
        for (var x2 = 1; x2 < width - 1; x2++) {
          var idx2 = rOff2 + x2;
          var cL = lumArr[idx2];
          var neighbors = [lumArr[idx2 - 1], lumArr[idx2 + 1], lumArr[idx2 - width], lumArr[idx2 + width]];
          var sum = 0;
          var totalW = 0;
          for (var n = 0; n < 4; n++) {
            var diff = Math.abs(cL - neighbors[n]);
            var w = diff < 20 ? 1 : Math.max(0.1, 1 - (diff - 20) / 40);
            sum += neighbors[n] * w;
            totalW += w;
          }
          var avgL = sum / totalW;
          var targetL = cL * (1 - nrKLum) + avgL * nrKLum;
          var shift = targetL - cL;

          var bIdx2 = idx2 * 4;
          data[bIdx2] = clamp(Math.round(data[bIdx2] + shift), 0, 255);
          data[bIdx2 + 1] = clamp(Math.round(data[bIdx2 + 1] + shift), 0, 255);
          data[bIdx2 + 2] = clamp(Math.round(data[bIdx2 + 2] + shift), 0, 255);
        }
      }
    }

    // Unsharp Mask Sharpening
    if (params.sharpness > 0) {
      var sharpK = (params.sharpness / 100) * 0.6;
      var maskThresh = (params.sharpnessMasking || 0) * 0.4;
      var copy = new Uint8ClampedArray(data);

      for (var y3 = 1; y3 < height - 1; y3++) {
        var rOff3 = y3 * width * 4;
        var rTop = (y3 - 1) * width * 4;
        var rBot = (y3 + 1) * width * 4;

        for (var x3 = 1; x3 < width - 1; x3++) {
          var cIdx = rOff3 + x3 * 4;
          var lIdx = rOff3 + (x3 - 1) * 4;
          var rIdx = rOff3 + (x3 + 1) * 4;
          var tIdx = rTop + x3 * 4;
          var bIdx3 = rBot + x3 * 4;

          var cLum = 0.299 * copy[cIdx] + 0.587 * copy[cIdx + 1] + 0.114 * copy[cIdx + 2];
          var avgN = (
            (0.299 * copy[lIdx] + 0.587 * copy[lIdx + 1] + 0.114 * copy[lIdx + 2]) +
            (0.299 * copy[rIdx] + 0.587 * copy[rIdx + 1] + 0.114 * copy[rIdx + 2]) +
            (0.299 * copy[tIdx] + 0.587 * copy[tIdx + 1] + 0.114 * copy[tIdx + 2]) +
            (0.299 * copy[bIdx3] + 0.587 * copy[bIdx3 + 1] + 0.114 * copy[bIdx3 + 2])
          ) * 0.25;

          var edgeMagnitude = Math.abs(cLum - avgN);
          if (edgeMagnitude >= maskThresh) {
            for (var c = 0; c < 3; c++) {
              var centerVal = copy[cIdx + c];
              var neighborAvg = (copy[lIdx + c] + copy[rIdx + c] + copy[tIdx + c] + copy[bIdx3 + c]) * 0.25;
              var highFreq = centerVal - neighborAvg;
              data[cIdx + c] = clamp(Math.round(centerVal + highFreq * sharpK), 0, 255);
            }
          }
        }
      }
    }
  }

  function computeHistogramWorker(payload) {
    var buffer = payload.buffer;
    var data = new Uint8ClampedArray(buffer);
    var r = new Uint32Array(256);
    var g = new Uint32Array(256);
    var b = new Uint32Array(256);
    var lum = new Uint32Array(256);

    var step = Math.max(4, Math.floor(data.length / (120000 * 4)) * 4);
    for (var i = 0; i < data.length; i += step) {
      var red = data[i];
      var green = data[i + 1];
      var blue = data[i + 2];
      r[red]++;
      g[green]++;
      b[blue]++;
      var l = Math.round(0.2126 * red + 0.7152 * green + 0.0722 * blue);
      lum[l]++;
    }

    return {
      r: r,
      g: g,
      b: b,
      lum: lum,
      generation: payload.generation
    };
  }

  // --- Message Dispatcher ---
  self.onmessage = function(e) {
    var data = e.data;
    if (!data) return;

    var type = data.type;
    var jobId = data.jobId;
    var generation = data.generation;
    var payload = data.payload || {};
    payload.jobId = jobId;
    payload.generation = generation;

    try {
      var result;
      var transferList = [];

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
          result = { status: 'unknown_type', type: type };
          break;
        }
      }

      self.postMessage({
        jobId: jobId,
        generation: generation,
        success: true,
        result: result
      }, transferList);
    } catch (err) {
      self.postMessage({
        jobId: jobId,
        generation: generation,
        success: false,
        error: (err && err.message) || String(err)
      });
    }
  };
})();
`;
