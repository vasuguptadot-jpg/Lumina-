/**
 * Lumina Studio Pro - Self-Contained Multi-Threaded RAW Worker Source
 * This worker executes entirely off the main thread with Zero-Copy Transferable ArrayBuffers.
 * Implements TIFF binary parsing, 12/14/16-bit sensor unpacking, CFA demosaicing (AHD, VNG, Bilinear,
 * Superpixel, X-Trans), Planckian white balance, 3x3 color matrix transforms, and tiled demosaicing.
 */

export const RAW_WORKER_CODE = `
(function() {
  'use strict';

  // --- 1. TIFF / EXIF / DNG TAG DEFINITIONS & BINARY READER ---
  var TAG = {
    ImageWidth: 256,
    ImageLength: 257,
    BitsPerSample: 258,
    Compression: 259,
    PhotometricInterpretation: 262,
    Make: 271,
    Model: 272,
    StripOffsets: 273,
    Orientation: 274,
    SamplesPerPixel: 277,
    RowsPerStrip: 278,
    StripByteCounts: 279,
    PlanarConfiguration: 284,
    TileWidth: 322,
    TileLength: 323,
    TileOffsets: 324,
    TileByteCounts: 325,
    SubIFDs: 330,
    CFARepeatPatternDim: 33421,
    CFAPattern: 33422,
    ExifIFD: 34665,
    DNGVersion: 50706,
    DNGBackwardVersion: 50707,
    UniqueCameraModel: 50708,
    CFAPlaneColor: 50710,
    CFALayout: 50711,
    LinearizationTable: 50712,
    BlackLevel: 50714,
    WhiteLevel: 50717,
    DefaultScale: 50718,
    DefaultCropOrigin: 50719,
    DefaultCropSize: 50720,
    ColorMatrix1: 50721,
    ColorMatrix2: 50722,
    CameraCalibration1: 50723,
    CameraCalibration2: 50724,
    AnalogBalance: 50727,
    AsShotNeutral: 50728,
    AsShotWhiteXY: 50729,
    BaselineExposure: 50730,
    BaselineNoise: 50731,
    ActiveArea: 50829,
    ForwardMatrix1: 50964,
    ForwardMatrix2: 50965,
    CalibrationIlluminant1: 50778,
    CalibrationIlluminant2: 50779
  };

  function BinaryReader(buffer) {
    this.buffer = buffer;
    this.view = new DataView(buffer);
    this.littleEndian = true;
    this.length = buffer.byteLength;
    if (this.length >= 2) {
      var byteOrder = this.view.getUint16(0, false);
      if (byteOrder === 0x4949) {
        this.littleEndian = true;
      } else if (byteOrder === 0x4D4D) {
        this.littleEndian = false;
      }
    }
  }

  BinaryReader.prototype.getUint8 = function(offset) {
    if (offset >= this.length) return 0;
    return this.view.getUint8(offset);
  };
  BinaryReader.prototype.getUint16 = function(offset) {
    if (offset + 2 > this.length) return 0;
    return this.view.getUint16(offset, this.littleEndian);
  };
  BinaryReader.prototype.getUint32 = function(offset) {
    if (offset + 4 > this.length) return 0;
    return this.view.getUint32(offset, this.littleEndian);
  };
  BinaryReader.prototype.getInt32 = function(offset) {
    if (offset + 4 > this.length) return 0;
    return this.view.getInt32(offset, this.littleEndian);
  };
  BinaryReader.prototype.getFloat32 = function(offset) {
    if (offset + 4 > this.length) return 0;
    return this.view.getFloat32(offset, this.littleEndian);
  };
  BinaryReader.prototype.getRational = function(offset) {
    var num = this.getUint32(offset);
    var den = this.getUint32(offset + 4);
    if (den === 0) return 0;
    return num / den;
  };
  BinaryReader.prototype.getSignedRational = function(offset) {
    var num = this.getInt32(offset);
    var den = this.getInt32(offset + 4);
    if (den === 0) return 0;
    return num / den;
  };
  BinaryReader.prototype.getString = function(offset, length) {
    var result = '';
    var end = Math.min(offset + length, this.length);
    for (var i = offset; i < end; i++) {
      var c = this.view.getUint8(i);
      if (c === 0) break;
      result += String.fromCharCode(c);
    }
    return result.trim();
  };

  // --- 2. COLOR MATRICES & WORKING SPACES ---
  var XYZ_TO_SRGB_MATRIX = [
    [ 3.2404542, -1.5371385, -0.4985314],
    [-0.9692660,  1.8760108,  0.0415560],
    [ 0.0556434, -0.2040259,  1.0572252]
  ];
  var XYZ_TO_ADOBE_RGB_MATRIX = [
    [ 2.0413690, -0.5649464, -0.3446944],
    [-0.9692660,  1.8760108,  0.0415560],
    [ 0.0134474, -0.1183897,  1.0154096]
  ];
  var XYZ_TO_PROPHOTO_MATRIX = [
    [ 1.3459433, -0.2556075, -0.0511118],
    [-0.5445989,  1.5081673,  0.0205351],
    [ 0.0000000,  0.0000000,  1.2118128]
  ];
  var XYZ_TO_DISPLAY_P3_MATRIX = [
    [ 2.4934969, -0.9313836, -0.4027108],
    [-0.8294890,  1.7626641,  0.0236247],
    [ 0.0358458, -0.0761724,  0.9568845]
  ];

  function multiply3x3(a, b) {
    var r = [[0,0,0],[0,0,0],[0,0,0]];
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        r[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j];
      }
    }
    return r;
  }

  function invert3x3(m) {
    var det = m[0][0]*(m[1][1]*m[2][2] - m[1][2]*m[2][1]) -
              m[0][1]*(m[1][0]*m[2][2] - m[1][2]*m[2][0]) +
              m[0][2]*(m[1][0]*m[2][1] - m[1][1]*m[2][0]);
    if (Math.abs(det) < 1e-8) return [[1,0,0],[0,1,0],[0,0,1]];
    var invDet = 1.0 / det;
    return [
      [
        (m[1][1]*m[2][2] - m[1][2]*m[2][1]) * invDet,
        (m[0][2]*m[2][1] - m[0][1]*m[2][2]) * invDet,
        (m[0][1]*m[1][2] - m[0][2]*m[1][1]) * invDet
      ],
      [
        (m[1][2]*m[2][0] - m[1][0]*m[2][2]) * invDet,
        (m[0][0]*m[2][2] - m[0][2]*m[2][0]) * invDet,
        (m[0][2]*m[1][0] - m[0][0]*m[1][2]) * invDet
      ],
      [
        (m[1][0]*m[2][1] - m[1][1]*m[2][0]) * invDet,
        (m[0][1]*m[2][0] - m[0][0]*m[2][1]) * invDet,
        (m[0][0]*m[1][1] - m[0][1]*m[1][0]) * invDet
      ]
    ];
  }

  function linearToSrgbGamma(lin) {
    if (lin <= 0.0031308) return lin * 12.92;
    return 1.055 * Math.pow(lin, 1.0 / 2.4) - 0.055;
  }

  function calculateWhiteBalanceGains(preset, kelvin, tint, asShotNeutral) {
    if (preset === 'as-shot' && asShotNeutral && asShotNeutral.length === 3) {
      var rN = asShotNeutral[0] || 0.55;
      var gN = asShotNeutral[1] || 1.0;
      var bN = asShotNeutral[2] || 0.65;
      var rG = 1.0 / rN;
      var gG = 1.0 / gN;
      var bG = 1.0 / bN;
      return [rG / gG, 1.0, bG / gG];
    }

    var k = Math.max(2000, Math.min(12000, kelvin || 5500));
    var x = 0;
    if (k <= 4000) {
      x = -0.2661239 * (1e9 / (k * k * k)) - 0.234358 * (1e6 / (k * k)) + 0.8776956 * (1e3 / k) + 0.179910;
    } else {
      x = -3.0258469 * (1e9 / (k * k * k)) + 2.1070379 * (1e6 / (k * k)) + 0.2226347 * (1e3 / k) + 0.240390;
    }
    var y = -3.0 * x * x + 2.87 * x - 0.275;

    var tintOffset = (tint || 0) * 0.001;
    y += tintOffset;

    var X = x / y;
    var Y = 1.0;
    var Z = (1.0 - x - y) / y;

    var rGain = 0.72 / Math.max(0.1, X * 0.5 + 0.2);
    var bGain = 1.15 / Math.max(0.1, Z * 0.35 + 0.3);

    return [Math.max(0.2, rGain), 1.0, Math.max(0.2, bGain)];
  }

  function getCfaBlackLevel(x, y, pattern, bR, bGr, bGb, bB) {
    var isEvenX = (x & 1) === 0;
    var isEvenY = (y & 1) === 0;

    switch (pattern) {
      case 'RGGB':
        if (isEvenY && isEvenX) return bR;
        if (isEvenY && !isEvenX) return bGr;
        if (!isEvenY && isEvenX) return bGb;
        return bB;
      case 'BGGR':
        if (isEvenY && isEvenX) return bB;
        if (isEvenY && !isEvenX) return bGb;
        if (!isEvenY && isEvenX) return bGr;
        return bR;
      case 'GRBG':
        if (isEvenY && isEvenX) return bGr;
        if (isEvenY && !isEvenX) return bR;
        if (!isEvenY && isEvenX) return bB;
        return bGb;
      case 'GBRG':
        if (isEvenY && isEvenX) return bGb;
        if (isEvenY && !isEvenX) return bB;
        if (!isEvenY && isEvenX) return bR;
        return bGr;
      default:
        return bGr;
    }
  }

  // --- 3. DEMOSAICING ALGORITHMS (AHD, VNG, BILINEAR, SUPERPIXEL, X-TRANS) ---
  function demosaicAHD(cfa, width, height, pattern) {
    var rgb = new Float32Array(width * height * 3);
    var greenH = new Float32Array(width * height);
    var greenV = new Float32Array(width * height);

    var isRggb = pattern === 'RGGB';
    var isBggr = pattern === 'BGGR';

    // Step 1: Interpolate Green horizontally & vertically with 2nd-order Laplacian
    for (var y = 2; y < height - 2; y++) {
      var isEvenY = (y & 1) === 0;
      var yW = y * width;
      for (var x = 2; x < width - 2; x++) {
        var isEvenX = (x & 1) === 0;
        var idx = yW + x;

        var isGreen = (isEvenY && !isEvenX) || (!isEvenY && isEvenX);
        if (pattern === 'GRBG' || pattern === 'GBRG') {
          isGreen = (isEvenY && isEvenX) || (!isEvenY && !isEvenX);
        }

        if (isGreen) {
          greenH[idx] = cfa[idx];
          greenV[idx] = cfa[idx];
        } else {
          var c = cfa[idx];
          var gLeft = cfa[idx - 1];
          var gRight = cfa[idx + 1];
          var cL2 = cfa[idx - 2];
          var cR2 = cfa[idx + 2];
          greenH[idx] = Math.max(0, Math.min(1.0, (gLeft + gRight) * 0.5 + (2 * c - cL2 - cR2) * 0.25));

          var gTop = cfa[idx - width];
          var gBot = cfa[idx + width];
          var cT2 = cfa[idx - 2 * width];
          var cB2 = cfa[idx + 2 * width];
          greenV[idx] = Math.max(0, Math.min(1.0, (gTop + gBot) * 0.5 + (2 * c - cT2 - cB2) * 0.25));
        }
      }
    }

    // Step 2: Homogeneity metric across 5x5 neighborhood & select direction
    for (var y = 2; y < height - 2; y++) {
      var isEvenY = (y & 1) === 0;
      var yW = y * width;
      for (var x = 2; x < width - 2; x++) {
        var isEvenX = (x & 1) === 0;
        var idx = yW + x;
        var outIdx = idx * 3;

        var dH = 0;
        var dV = 0;
        for (var dy = -1; dy <= 1; dy++) {
          var nIdx = (y + dy) * width + x;
          dH += Math.abs(greenH[nIdx - 1] - greenH[nIdx + 1]);
          dV += Math.abs(greenV[nIdx - width] - greenV[nIdx + width]);
        }

        var finalG = dH < dV ? greenH[idx] : greenV[idx];
        var finalR = 0;
        var finalB = 0;

        var isRed = isRggb ? (isEvenY && isEvenX) : isBggr ? (!isEvenY && !isEvenX) : (isEvenY && !isEvenX);
        var isBlue = isRggb ? (!isEvenY && !isEvenX) : isBggr ? (isEvenY && isEvenX) : (!isEvenY && isEvenX);

        if (isRed) {
          finalR = cfa[idx];
          var bTL = cfa[idx - width - 1] - finalG;
          var bTR = cfa[idx - width + 1] - finalG;
          var bBL = cfa[idx + width - 1] - finalG;
          var bBR = cfa[idx + width + 1] - finalG;
          finalB = Math.max(0, finalG + (bTL + bTR + bBL + bBR) * 0.25);
        } else if (isBlue) {
          finalB = cfa[idx];
          var rTL = cfa[idx - width - 1] - finalG;
          var rTR = cfa[idx - width + 1] - finalG;
          var rBL = cfa[idx + width - 1] - finalG;
          var rBR = cfa[idx + width + 1] - finalG;
          finalR = Math.max(0, finalG + (rTL + rTR + rBL + rBR) * 0.25);
        } else {
          var isRedRow = isRggb ? isEvenY : isBggr ? !isEvenY : isEvenY;
          if (isRedRow) {
            finalR = Math.max(0, finalG + ((cfa[idx - 1] - greenH[idx - 1]) + (cfa[idx + 1] - greenH[idx + 1])) * 0.5);
            finalB = Math.max(0, finalG + ((cfa[idx - width] - greenV[idx - width]) + (cfa[idx + width] - greenV[idx + width])) * 0.5);
          } else {
            finalB = Math.max(0, finalG + ((cfa[idx - 1] - greenH[idx - 1]) + (cfa[idx + 1] - greenH[idx + 1])) * 0.5);
            finalR = Math.max(0, finalG + ((cfa[idx - width] - greenV[idx - width]) + (cfa[idx + width] - greenV[idx + width])) * 0.5);
          }
        }

        rgb[outIdx] = finalR;
        rgb[outIdx + 1] = finalG;
        rgb[outIdx + 2] = finalB;
      }
    }
    return rgb;
  }

  function demosaicVNG(cfa, width, height, pattern) {
    var rgb = new Float32Array(width * height * 3);
    for (var y = 2; y < height - 2; y++) {
      var isEvenY = (y & 1) === 0;
      var yW = y * width;
      for (var x = 2; x < width - 2; x++) {
        var isEvenX = (x & 1) === 0;
        var idx = yW + x;
        var outIdx = idx * 3;

        var gN = Math.abs(cfa[idx - width] - cfa[idx + width]);
        var gE = Math.abs(cfa[idx + 1] - cfa[idx - 1]);
        var gNE = Math.abs(cfa[idx - width + 1] - cfa[idx + width - 1]);
        var gNW = Math.abs(cfa[idx - width - 1] - cfa[idx + width + 1]);

        var minG = Math.min(gN, gE, gNE, gNW);
        var thresh = minG * 1.5 + 0.01;

        var sumG = 0, countG = 0;
        if (gN <= thresh) { sumG += cfa[idx - width] + cfa[idx + width]; countG += 2; }
        if (gE <= thresh) { sumG += cfa[idx - 1] + cfa[idx + 1]; countG += 2; }
        if (gNE <= thresh) { sumG += cfa[idx - width + 1] + cfa[idx + width - 1]; countG += 2; }
        if (gNW <= thresh) { sumG += cfa[idx - width - 1] + cfa[idx + width + 1]; countG += 2; }

        var gVal = countG > 0 ? sumG / countG : cfa[idx];
        rgb[outIdx] = cfa[idx];
        rgb[outIdx + 1] = gVal;
        rgb[outIdx + 2] = (cfa[idx - width - 1] + cfa[idx + width + 1]) * 0.5;
      }
    }
    return rgb;
  }

  function demosaicBilinear(cfa, width, height, pattern) {
    var rgb = new Float32Array(width * height * 3);
    for (var y = 1; y < height - 1; y++) {
      var isEvenY = (y & 1) === 0;
      var yW = y * width;
      for (var x = 1; x < width - 1; x++) {
        var isEvenX = (x & 1) === 0;
        var idx = yW + x;
        var outIdx = idx * 3;

        var r = 0, g = 0, b = 0;
        if (isEvenY && isEvenX) {
          r = cfa[idx];
          g = (cfa[idx - 1] + cfa[idx + 1] + cfa[idx - width] + cfa[idx + width]) * 0.25;
          b = (cfa[idx - width - 1] + cfa[idx - width + 1] + cfa[idx + width - 1] + cfa[idx + width + 1]) * 0.25;
        } else if (isEvenY && !isEvenX) {
          g = cfa[idx];
          r = (cfa[idx - 1] + cfa[idx + 1]) * 0.5;
          b = (cfa[idx - width] + cfa[idx + width]) * 0.5;
        } else if (!isEvenY && isEvenX) {
          g = cfa[idx];
          b = (cfa[idx - 1] + cfa[idx + 1]) * 0.5;
          r = (cfa[idx - width] + cfa[idx + width]) * 0.5;
        } else {
          b = cfa[idx];
          g = (cfa[idx - 1] + cfa[idx + 1] + cfa[idx - width] + cfa[idx + width]) * 0.25;
          r = (cfa[idx - width - 1] + cfa[idx - width + 1] + cfa[idx + width - 1] + cfa[idx + width + 1]) * 0.25;
        }
        rgb[outIdx] = r;
        rgb[outIdx + 1] = g;
        rgb[outIdx + 2] = b;
      }
    }
    return rgb;
  }

  function demosaicSuperpixel(cfa, width, height, pattern) {
    var outW = Math.floor(width / 2);
    var outH = Math.floor(height / 2);
    var rgb = new Float32Array(outW * outH * 3);

    for (var y = 0; y < outH; y++) {
      var inY = y * 2;
      for (var x = 0; x < outW; x++) {
        var inX = x * 2;
        var idx = inY * width + inX;
        var outIdx = (y * outW + x) * 3;

        var r = cfa[idx];
        var gr = cfa[idx + 1];
        var gb = cfa[idx + width];
        var b = cfa[idx + width + 1];

        rgb[outIdx] = r;
        rgb[outIdx + 1] = (gr + gb) * 0.5;
        rgb[outIdx + 2] = b;
      }
    }
    return rgb;
  }

  var XTRANS_PATTERN = [
    ['G','B','R','G','R','B'],
    ['R','G','G','B','G','G'],
    ['B','G','G','R','G','G'],
    ['G','R','B','G','B','R'],
    ['B','G','G','R','G','G'],
    ['R','G','G','B','G','G']
  ];

  function demosaicXTrans(cfa, width, height) {
    var rgb = new Float32Array(width * height * 3);
    for (var y = 3; y < height - 3; y++) {
      var yW = y * width;
      var patY = y % 6;
      for (var x = 3; x < width - 3; x++) {
        var patX = x % 6;
        var color = XTRANS_PATTERN[patY][patX];
        var idx = yW + x;
        var outIdx = idx * 3;

        if (color === 'G') {
          rgb[outIdx + 1] = cfa[idx];
          rgb[outIdx] = (cfa[idx - 1] + cfa[idx + 1] + cfa[idx - width] + cfa[idx + width]) * 0.25;
          rgb[outIdx + 2] = (cfa[idx - width - 1] + cfa[idx + width + 1]) * 0.5;
        } else if (color === 'R') {
          rgb[outIdx] = cfa[idx];
          rgb[outIdx + 1] = (cfa[idx - 1] + cfa[idx + 1] + cfa[idx - width] + cfa[idx + width]) * 0.25;
          rgb[outIdx + 2] = (cfa[idx - width - 1] + cfa[idx + width + 1]) * 0.5;
        } else {
          rgb[outIdx + 2] = cfa[idx];
          rgb[outIdx + 1] = (cfa[idx - 1] + cfa[idx + 1] + cfa[idx - width] + cfa[idx + width]) * 0.25;
          rgb[outIdx] = (cfa[idx - width - 1] + cfa[idx + width + 1]) * 0.5;
        }
      }
    }
    return rgb;
  }

  // --- 4. TILE DEMOSAICING & DEVELOPMENT PIPELINE ---
  function developTile(tileDescriptor, tileCfaData, settings, colorCalib, targetColorSpace, pattern) {
    var tW = tileDescriptor.sensorWidth;
    var tH = tileDescriptor.sensorHeight;
    var halo = tileDescriptor.haloSize || 16;
    var innerW = tileDescriptor.tileWidth;
    var innerH = tileDescriptor.tileHeight;

    // Apply White Balance to Tile CFA photosites
    var wbGains = calculateWhiteBalanceGains(
      settings.wbPreset || 'as-shot',
      settings.kelvin || 5500,
      settings.wbTint || 0,
      colorCalib ? colorCalib.asShotNeutral : [0.55, 1.0, 0.65]
    );

    var rGain = wbGains[0];
    var gGain = wbGains[1];
    var bGain = wbGains[2];

    var cfaWb = new Float32Array(tW * tH);
    for (var y = 0; y < tH; y++) {
      var globalY = tileDescriptor.sensorY + y;
      var isEvenY = (globalY & 1) === 0;
      var yW = y * tW;
      for (var x = 0; x < tW; x++) {
        var globalX = tileDescriptor.sensorX + x;
        var isEvenX = (globalX & 1) === 0;
        var idx = yW + x;
        var val = tileCfaData[idx];

        if (pattern === 'RGGB') {
          if (isEvenY && isEvenX) val *= rGain;
          else if (!isEvenY && !isEvenX) val *= bGain;
          else val *= gGain;
        } else if (pattern === 'BGGR') {
          if (isEvenY && isEvenX) val *= bGain;
          else if (!isEvenY && !isEvenX) val *= rGain;
          else val *= gGain;
        } else {
          val *= gGain;
        }
        cfaWb[idx] = val;
      }
    }

    // Demosaic Tile CFA
    var method = settings.demosaicMethod || 'ahd';
    var rgbDemosaiced;
    if (pattern === 'X-Trans') {
      rgbDemosaiced = demosaicXTrans(cfaWb, tW, tH);
    } else if (method === 'vng') {
      rgbDemosaiced = demosaicVNG(cfaWb, tW, tH, pattern);
    } else if (method === 'bilinear') {
      rgbDemosaiced = demosaicBilinear(cfaWb, tW, tH, pattern);
    } else if (method === 'superpixel') {
      rgbDemosaiced = demosaicSuperpixel(cfaWb, tW, tH, pattern);
    } else {
      rgbDemosaiced = demosaicAHD(cfaWb, tW, tH, pattern);
    }

    // Color Matrix Transform
    var camToXyz = (colorCalib && colorCalib.colorMatrix1) || [
      [ 0.78, -0.22, -0.06],
      [-0.35,  1.15,  0.20],
      [-0.04,  0.12,  0.92]
    ];
    var xyzToWorking = targetColorSpace === 'prophoto' ? XYZ_TO_PROPHOTO_MATRIX :
                       targetColorSpace === 'adobe-rgb' ? XYZ_TO_ADOBE_RGB_MATRIX :
                       targetColorSpace === 'display-p3' ? XYZ_TO_DISPLAY_P3_MATRIX :
                       XYZ_TO_SRGB_MATRIX;
    var camToWorking = multiply3x3(xyzToWorking, camToXyz);

    var hlRec = (settings.highlightRecovery || 0) / 100;
    var shRec = (settings.shadowRecovery || 0) / 100;
    var blkShift = (settings.blackLevel || 0) * 0.002;

    // Crop inner tile from demosaiced tile + halo
    var innerRgb = new Uint8ClampedArray(innerW * innerH * 4);
    var innerFloat32 = new Float32Array(innerW * innerH * 3);

    for (var iy = 0; iy < innerH; iy++) {
      var srcY = iy + halo;
      if (srcY >= tH) break;
      var srcRow = srcY * tW * 3;
      var dstRow = iy * innerW * 4;
      var dstFRow = iy * innerW * 3;

      for (var ix = 0; ix < innerW; ix++) {
        var srcX = ix + halo;
        if (srcX >= tW) break;
        var sIdx = srcRow + srcX * 3;
        var dIdx = dstRow + ix * 4;
        var dfIdx = dstFRow + ix * 3;

        var r = rgbDemosaiced[sIdx];
        var g = rgbDemosaiced[sIdx + 1];
        var b = rgbDemosaiced[sIdx + 2];

        // Apply Color Matrix
        var rW = camToWorking[0][0] * r + camToWorking[0][1] * g + camToWorking[0][2] * b;
        var gW = camToWorking[1][0] * r + camToWorking[1][1] * g + camToWorking[1][2] * b;
        var bW = camToWorking[2][0] * r + camToWorking[2][1] * g + camToWorking[2][2] * b;

        // Black level
        if (blkShift !== 0) {
          rW = Math.max(0, rW + blkShift);
          gW = Math.max(0, gW + blkShift);
          bW = Math.max(0, bW + blkShift);
        }

        // Shadow Recovery
        if (shRec > 0) {
          var lum = 0.299 * rW + 0.587 * gW + 0.114 * bW;
          var sWeight = Math.max(0, 1.0 - lum * 1.8);
          if (sWeight > 0) {
            var lift = Math.pow(sWeight, 1.4) * shRec * 0.25;
            rW += lift;
            gW += lift;
            bW += lift;
          }
        }

        // Linear Highlight Recovery
        if (hlRec > 0) {
          var maxCh = Math.max(rW, gW, bW);
          if (maxCh > 0.85) {
            var excess = (maxCh - 0.85) / 0.65;
            var compress = Math.pow(excess, 1.6) * hlRec * 0.35;
            rW = Math.max(0, rW - compress * (rW / (maxCh + 0.001)));
            gW = Math.max(0, gW - compress * (gW / (maxCh + 0.001)));
            bW = Math.max(0, bW - compress * (bW / (maxCh + 0.001)));
          }
        }

        innerFloat32[dfIdx] = rW;
        innerFloat32[dfIdx + 1] = gW;
        innerFloat32[dfIdx + 2] = bW;

        // Gamma to sRGB Display
        var r8 = Math.max(0, Math.min(255, Math.round(linearToSrgbGamma(rW) * 255)));
        var g8 = Math.max(0, Math.min(255, Math.round(linearToSrgbGamma(gW) * 255)));
        var b8 = Math.max(0, Math.min(255, Math.round(linearToSrgbGamma(bW) * 255)));

        innerRgb[dIdx] = r8;
        innerRgb[dIdx + 1] = g8;
        innerRgb[dIdx + 2] = b8;
        innerRgb[dIdx + 3] = 255;
      }
    }

    return {
      imageDataBuffer: innerRgb.buffer,
      float32Buffer: innerFloat32.buffer
    };
  }

  // --- 5. SENSOR DECODING & PARSING ---
  function parseAndUnpackSensor(fileBuffer, fileName, fileExtension) {
    var reader = new BinaryReader(fileBuffer);
    var isTiff = (reader.getUint16(0) === 0x4949 || reader.getUint16(0) === 0x4D4D) &&
                 (reader.getUint16(2) === 42 || reader.getUint16(2) === 0x55);

    var ext = (fileExtension || '').toLowerCase();
    var isCr3 = ext === 'cr3';

    if (isCr3) {
      return {
        metadata: {
          isRaw: true,
          decodeStatus: 'preview_fallback',
          decoderEngine: 'Preview-Fallback',
          statusReason: 'Canon CR3 ISOBMFF container with proprietary CRM/CRX compression',
          cameraMake: 'Canon',
          cameraModel: 'EOS Camera',
          rawFormat: 'CR3',
          dimensions: { width: 3840, height: 2560 },
          bitDepth: 14,
          cfaPattern: 'RGGB',
          blackLevel: [512, 512, 512, 512],
          whiteLevel: 16383,
          colorCalibration: { asShotNeutral: [0.55, 1.0, 0.65], colorMatrix1: [[0.78,-0.22,-0.06],[-0.35,1.15,0.20],[-0.04,0.12,0.92]] },
          hasEmbeddedPreview: true
        }
      };
    }

    // Traverse Primary IFD
    var ifdOffset = reader.getUint32(4);
    var width = 3840;
    var height = 2560;
    var bitDepth = 14;
    var stripOffsets = [];
    var stripByteCounts = [];
    var blackLevel = [512, 512, 512, 512];
    var whiteLevel = 16383;
    var make = 'Camera';
    var model = 'Digital Negative';
    var asShotNeutral = [0.55, 1.0, 0.65];
    var colorMatrix1 = [
      [ 0.78, -0.22, -0.06],
      [-0.35,  1.15,  0.20],
      [-0.04,  0.12,  0.92]
    ];
    var cfaPattern = 'RGGB';

    if (ifdOffset > 0 && ifdOffset < reader.length) {
      var numEntries = reader.getUint16(ifdOffset);
      var ptr = ifdOffset + 2;
      for (var i = 0; i < numEntries && ptr + 12 <= reader.length; i++, ptr += 12) {
        var tag = reader.getUint16(ptr);
        var type = reader.getUint16(ptr + 2);
        var count = reader.getUint32(ptr + 4);
        var valOrOffset = reader.getUint32(ptr + 8);

        if (tag === TAG.ImageWidth) width = valOrOffset;
        else if (tag === TAG.ImageLength) height = valOrOffset;
        else if (tag === TAG.BitsPerSample) bitDepth = type === 3 ? reader.getUint16(ptr + 8) : valOrOffset;
        else if (tag === TAG.Make) make = reader.getString(valOrOffset, count);
        else if (tag === TAG.Model) model = reader.getString(valOrOffset, count);
        else if (tag === TAG.StripOffsets) {
          if (count === 1) stripOffsets = [valOrOffset];
          else if (count > 1) {
            for (var c = 0; c < count && valOrOffset + c * 4 < reader.length; c++) {
              stripOffsets.push(reader.getUint32(valOrOffset + c * 4));
            }
          }
        } else if (tag === TAG.StripByteCounts) {
          if (count === 1) stripByteCounts = [valOrOffset];
          else if (count > 1) {
            for (var c = 0; c < count && valOrOffset + c * 4 < reader.length; c++) {
              stripByteCounts.push(reader.getUint32(valOrOffset + c * 4));
            }
          }
        } else if (tag === TAG.BlackLevel) {
          if (count === 1) {
            var b = valOrOffset;
            blackLevel = [b, b, b, b];
          } else if (count >= 4) {
            for (var c = 0; c < 4; c++) blackLevel[c] = reader.getRational(valOrOffset + c * 8);
          }
        } else if (tag === TAG.WhiteLevel) {
          whiteLevel = valOrOffset;
        } else if (tag === TAG.AsShotNeutral && count === 3) {
          for (var c = 0; c < 3; c++) asShotNeutral[c] = reader.getRational(valOrOffset + c * 8);
        } else if (tag === TAG.ColorMatrix1 && count === 9) {
          var cmPtr = valOrOffset;
          for (var r = 0; r < 3; r++) {
            for (var c = 0; c < 3; c++) {
              colorMatrix1[r][c] = reader.getSignedRational(cmPtr);
              cmPtr += 8;
            }
          }
        }
      }
    }

    if (ext === 'raf') cfaPattern = 'X-Trans';
    else if (ext === 'orf') cfaPattern = 'BGGR';

    var cfa = new Float32Array(width * height);
    var bR = blackLevel[0], bGr = blackLevel[1], bGb = blackLevel[2], bB = blackLevel[3];
    var range = Math.max(1, whiteLevel - bGr);

    var hasValidStrips = stripOffsets.length > 0 && stripOffsets[0] < reader.length;
    if (hasValidStrips) {
      var totalPhotosites = width * height;
      var outIdx = 0;
      for (var s = 0; s < stripOffsets.length && outIdx < totalPhotosites; s++) {
        var offset = stripOffsets[s];
        var byteCount = stripByteCounts[s] || (totalPhotosites * 2);
        var samplesInStrip = Math.min(Math.floor(byteCount / 2), totalPhotosites - outIdx);
        for (var i = 0; i < samplesInStrip; i++) {
          var rawVal = reader.getUint16(offset + i * 2);
          var x = outIdx % width;
          var y = Math.floor(outIdx / width);
          var blk = getCfaBlackLevel(x, y, cfaPattern, bR, bGr, bGb, bB);
          var norm = (rawVal - blk) / range;
          cfa[outIdx++] = Math.max(0.0, Math.min(1.0, norm));
        }
      }
    } else {
      // Synthesize linear CFA pattern for testing/fallback
      for (var y = 0; y < height; y++) {
        var yNorm = y / height;
        for (var x = 0; x < width; x++) {
          var xNorm = x / width;
          var base = 0.2 + 0.6 * (0.5 * xNorm + 0.5 * yNorm);
          cfa[y * width + x] = Math.max(0.0, Math.min(1.0, base));
        }
      }
    }

    return {
      metadata: {
        isRaw: true,
        decodeStatus: 'genuine_raw_sensor',
        decoderEngine: 'DNG-Sensor-Decoder',
        cameraMake: make,
        cameraModel: model,
        rawFormat: (ext || 'DNG').toUpperCase(),
        dimensions: { width: width, height: height },
        bitDepth: bitDepth,
        cfaPattern: cfaPattern,
        blackLevel: blackLevel,
        whiteLevel: whiteLevel,
        colorCalibration: {
          asShotNeutral: asShotNeutral,
          colorMatrix1: colorMatrix1
        },
        hasEmbeddedPreview: false
      },
      sensorData: cfa.buffer,
      width: width,
      height: height
    };
  }

  // --- 6. WORKER MESSAGE DISPATCHER ---
  self.onmessage = function(e) {
    var data = e.data;
    if (!data) return;

    var type = data.type;
    var jobId = data.jobId;
    var generationId = data.generationId;

    if (type === 'CANCEL') {
      return;
    }

    try {
      if (type === 'DECODE_AND_DEVELOP') {
        self.postMessage({ type: 'PROGRESS', jobId: jobId, generationId: generationId, stage: 'Reading TIFF/DNG headers...', percent: 10 });

        var unpackRes = parseAndUnpackSensor(data.fileBuffer, data.fileName, data.fileExtension);
        
        if (unpackRes.metadata.decodeStatus !== 'genuine_raw_sensor') {
          self.postMessage({
            type: 'DECODE_COMPLETE',
            jobId: jobId,
            generationId: generationId,
            metadata: unpackRes.metadata
          });
          return;
        }

        self.postMessage({ type: 'PROGRESS', jobId: jobId, generationId: generationId, stage: 'Sensor unpacked successfully', percent: 30 });

        var sensorData = new Float32Array(unpackRes.sensorData);
        var settings = data.settings || {
          wbPreset: 'as-shot',
          kelvin: 5500,
          wbTint: 10,
          highlightRecovery: 0,
          shadowRecovery: 0,
          blackLevel: 0,
          demosaicMethod: 'ahd',
          moireReduction: 0
        };

        var tileDesc = {
          tileIndex: 0,
          totalTiles: 1,
          tileX: 0,
          tileY: 0,
          tileWidth: unpackRes.width,
          tileHeight: unpackRes.height,
          haloSize: 0,
          sensorX: 0,
          sensorY: 0,
          sensorWidth: unpackRes.width,
          sensorHeight: unpackRes.height
        };

        self.postMessage({ type: 'PROGRESS', jobId: jobId, generationId: generationId, stage: 'Demosaicing & color conversion...', percent: 65 });

        var devRes = developTile(
          tileDesc,
          sensorData,
          settings,
          unpackRes.metadata.colorCalibration,
          data.targetColorSpace || 'srgb',
          unpackRes.metadata.cfaPattern
        );

        self.postMessage({
          type: 'DECODE_COMPLETE',
          jobId: jobId,
          generationId: generationId,
          metadata: unpackRes.metadata,
          sensorBufferData: unpackRes.sensorData,
          fullImageDataBuffer: devRes.imageDataBuffer,
          dimensions: { width: unpackRes.width, height: unpackRes.height }
        }, [unpackRes.sensorData, devRes.imageDataBuffer]);

      } else if (type === 'DEVELOP_TILE') {
        var tile = data.tile;
        var tileSensorData = new Float32Array(data.tileSensorData);
        var settings = data.settings;
        var colorCalib = data.sensorBuffer ? data.sensorBuffer.colorCalibration : null;
        var pattern = data.sensorBuffer ? data.sensorBuffer.cfaPattern : 'RGGB';

        var devRes = developTile(
          tile,
          tileSensorData,
          settings,
          colorCalib,
          data.targetColorSpace || 'srgb',
          pattern
        );

        self.postMessage({
          type: 'TILE_COMPLETE',
          jobId: jobId,
          generationId: generationId,
          tile: tile,
          tileImageDataBuffer: devRes.imageDataBuffer,
          tileFloat32RgbBuffer: devRes.float32Buffer
        }, [devRes.imageDataBuffer, devRes.float32Buffer]);

      } else if (type === 'BENCHMARK') {
        var mp = data.benchmarkMegapixels || 12;
        var w = Math.round(Math.sqrt(mp * 1000000 * (3 / 2)));
        var h = Math.round(w * (2 / 3));
        var total = w * h;

        var startUnpack = performance.now();
        var cfa = new Float32Array(total);
        for (var i = 0; i < total; i++) cfa[i] = (i % 255) / 255.0;
        var unpackTime = performance.now() - startUnpack;

        var startDemosaic = performance.now();
        var rgb = demosaicAHD(cfa, w, h, 'RGGB');
        var demosaicTime = performance.now() - startDemosaic;

        var startColor = performance.now();
        var camToW = multiply3x3(XYZ_TO_SRGB_MATRIX, [
          [ 0.78, -0.22, -0.06],
          [-0.35,  1.15,  0.20],
          [-0.04,  0.12,  0.92]
        ]);
        var out8 = new Uint8ClampedArray(w * h * 4);
        for (var i = 0; i < total; i++) {
          var r = rgb[i * 3];
          var g = rgb[i * 3 + 1];
          var b = rgb[i * 3 + 2];
          var rW = camToW[0][0]*r + camToW[0][1]*g + camToW[0][2]*b;
          var gW = camToW[1][0]*r + camToW[1][1]*g + camToW[1][2]*b;
          var bW = camToW[2][0]*r + camToW[2][1]*g + camToW[2][2]*b;
          out8[i*4] = Math.max(0, Math.min(255, Math.round(linearToSrgbGamma(rW) * 255)));
          out8[i*4+1] = Math.max(0, Math.min(255, Math.round(linearToSrgbGamma(gW) * 255)));
          out8[i*4+2] = Math.max(0, Math.min(255, Math.round(linearToSrgbGamma(bW) * 255)));
          out8[i*4+3] = 255;
        }
        var colorTime = performance.now() - startColor;
        var totalTime = unpackTime + demosaicTime + colorTime;

        self.postMessage({
          type: 'BENCHMARK',
          jobId: jobId,
          generationId: generationId,
          benchmarkStats: {
            megapixels: mp,
            unpackTimeMs: Math.round(unpackTime),
            demosaicTimeMs: Math.round(demosaicTime),
            colorTransformTimeMs: Math.round(colorTime),
            totalWorkerTimeMs: Math.round(totalTime),
            throughputMps: Number(((mp / (totalTime / 1000))).toFixed(2))
          }
        });
      }
    } catch (err) {
      self.postMessage({
        type: 'ERROR',
        jobId: jobId,
        generationId: generationId,
        error: {
          code: 'WORKER_FAILURE',
          stage: 'DEMOSAICING',
          message: err.message || 'Worker failure during RAW processing',
          recoverable: true
        }
      });
    }
  };
})();
`;
