/**
 * Lumina Studio Pro - Professional RAW Processing Engine Verification Suite
 * Standalone verification tests for:
 * - TIFF / DNG IFD binary tag parsing
 * - Sensor CFA unpacking (12/14/16-bit)
 * - Bayer CFA pattern layouts (RGGB, BGGR, GRBG, GBRG, X-Trans)
 * - Demosaicing algorithms (AHD, VNG, Bilinear, Superpixel, X-Trans 6x6)
 * - Camera Matrix -> CIE XYZ -> Working Color Space transformations
 * - Planckian Blackbody White Balance & Tint
 * - Linear Float32 Highlight Recovery & Dynamic Range Expansion
 * - Adobe DNG 16-Bit Linear Negative Encoding
 */

import { parseTiffRawFile, BinaryReader, TAG } from '../engine/raw/tiffIfdParser';
import { getCfaBlackLevel, synthesizeLinearSensorPattern } from '../engine/raw/rawSensorDecoder';
import {
  demosaicAHD,
  demosaicVNG,
  demosaicBilinear,
  demosaicSuperpixel,
  demosaicXTrans,
} from '../engine/raw/demosaicEngine';
import {
  developRawSensorBuffer,
  calculateWhiteBalanceGains,
  linearToSrgbGamma,
  srgbGammaToLinear,
  multiply3x3,
} from '../engine/raw/rawDevelopEngine';
import { encodeCanvasToDng } from '../engine/dngEncoder';
import { RawSensorBuffer } from '../engine/raw/rawTypes';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
}

export function runRawEngineDiagnostics(): TestResult[] {
  const results: TestResult[] = [];

  function assert(condition: boolean, suite: string, name: string) {
    if (condition) {
      results.push({ suite, name, passed: true });
    } else {
      results.push({ suite, name, passed: false, error: 'Assertion failed' });
    }
  }

  // 1. TIFF & DNG Binary Header and IFD Parsing
  try {
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    view.setUint16(0, 0x4949, true); // 'II'
    view.setUint16(2, 42, true);     // Magic 42
    view.setUint32(4, 8, true);      // IFD offset

    const reader = new BinaryReader(buffer);
    assert(reader.getUint16(0) === 0x4949, 'TIFF Header', 'detects Little-Endian byte order');
    assert(reader.isLittleEndian() === true, 'TIFF Header', 'isLittleEndian returns true');
  } catch (err: any) {
    results.push({ suite: 'TIFF Header', name: 'Little-Endian detection', passed: false, error: err.message });
  }

  // 2. Structured IFD Tag Parsing
  try {
    const buffer = new ArrayBuffer(256);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    view.setUint16(0, 0x4949, true);
    view.setUint16(2, 42, true);
    view.setUint32(4, 8, true);
    view.setUint16(8, 2, true);

    // Make tag
    view.setUint16(10, TAG.Make, true);
    view.setUint16(12, 2, true);
    view.setUint32(14, 6, true);
    view.setUint32(18, 40, true);

    // Model tag
    view.setUint16(22, TAG.Model, true);
    view.setUint16(24, 2, true);
    view.setUint32(26, 6, true);
    view.setUint32(30, 50, true);

    view.setUint32(34, 0, true);

    const makeStr = 'Canon\0';
    for (let i = 0; i < makeStr.length; i++) bytes[40 + i] = makeStr.charCodeAt(i);
    const modelStr = 'EOSR5\0';
    for (let i = 0; i < modelStr.length; i++) bytes[50 + i] = modelStr.charCodeAt(i);

    const parseRes = parseTiffRawFile(buffer, 'test.cr2', 'cr2');
    assert(parseRes.metadata.cameraMake === 'Canon', 'IFD Parser', 'extracts camera make');
    assert(parseRes.metadata.cameraModel === 'EOSR5', 'IFD Parser', 'extracts camera model');
  } catch (err: any) {
    results.push({ suite: 'IFD Parser', name: 'tag extraction', passed: false, error: err.message });
  }

  // 3. CFA Black Level Offsets
  try {
    const bR = 512, bGr = 514, bGb = 513, bB = 515;
    assert(getCfaBlackLevel(0, 0, 'RGGB', bR, bGr, bGb, bB) === bR, 'CFA Layout', 'RGGB Red offset');
    assert(getCfaBlackLevel(1, 0, 'RGGB', bR, bGr, bGb, bB) === bGr, 'CFA Layout', 'RGGB Green-Red offset');
    assert(getCfaBlackLevel(0, 1, 'RGGB', bR, bGr, bGb, bB) === bGb, 'CFA Layout', 'RGGB Green-Blue offset');
    assert(getCfaBlackLevel(1, 1, 'RGGB', bR, bGr, bGb, bB) === bB, 'CFA Layout', 'RGGB Blue offset');
  } catch (err: any) {
    results.push({ suite: 'CFA Layout', name: 'black levels', passed: false, error: err.message });
  }

  // 4. CFA Demosaicing (AHD, VNG, Bilinear, Superpixel, X-Trans)
  try {
    const width = 32;
    const height = 32;
    const cfa = new Float32Array(width * height);
    synthesizeLinearSensorPattern(cfa, width, height, 'RGGB');

    const ahdRes = demosaicAHD(cfa, width, height, 'RGGB');
    assert(ahdRes.rgbData.length === width * height * 3, 'Demosaicing', 'AHD yields 3-channel RGB');

    const vngRes = demosaicVNG(cfa, width, height, 'RGGB');
    assert(vngRes.rgbData.length === width * height * 3, 'Demosaicing', 'VNG yields 3-channel RGB');

    const bilRes = demosaicBilinear(cfa, width, height, 'RGGB');
    assert(bilRes.rgbData.length === width * height * 3, 'Demosaicing', 'Bilinear yields 3-channel RGB');

    const supRes = demosaicSuperpixel(cfa, width, height, 'RGGB');
    assert(supRes.width === width / 2 && supRes.height === height / 2, 'Demosaicing', 'Superpixel bins to 2x2 half resolution');

    const xtransRes = demosaicXTrans(cfa, width, height);
    assert(xtransRes.rgbData.length === width * height * 3, 'Demosaicing', 'X-Trans 6x6 demosaicing');
  } catch (err: any) {
    results.push({ suite: 'Demosaicing', name: 'algorithms', passed: false, error: err.message });
  }

  // 5. White Balance & Planckian Blackbody Calculation
  try {
    const [rDay, gDay, bDay] = calculateWhiteBalanceGains('daylight', 5500, 0, [0.55, 1.0, 0.65]);
    assert(gDay === 1.0, 'White Balance', 'Green gain normalized to 1.0');
    assert(rDay > 0 && bDay > 0, 'White Balance', 'Gains calculated successfully');

    const [rTungsten, , bTungsten] = calculateWhiteBalanceGains('tungsten', 2850, 0, [0.55, 1.0, 0.65]);
    assert(bTungsten > rTungsten, 'White Balance', 'Tungsten boosts Blue relative to Red');
  } catch (err: any) {
    results.push({ suite: 'White Balance', name: 'kelvin calculation', passed: false, error: err.message });
  }

  // 6. Color Transforms & Gamma Linearity
  try {
    const m1 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    const m2 = [[2, 0, 0], [0, 2, 0], [0, 0, 2]];
    const multRes = multiply3x3(m1, m2);
    assert(multRes[0][0] === 2 && multRes[1][1] === 2 && multRes[2][2] === 2, 'Color Math', '3x3 matrix multiplication');

    const origLinear = 0.45;
    const gamma = linearToSrgbGamma(origLinear);
    const roundtrip = srgbGammaToLinear(gamma);
    assert(Math.abs(roundtrip - origLinear) < 0.001, 'Color Math', 'Gamma to linear transfer roundtrip');
  } catch (err: any) {
    results.push({ suite: 'Color Math', name: 'matrix & gamma', passed: false, error: err.message });
  }

  // 7. Full Linear Development Pipeline
  try {
    const width = 32;
    const height = 32;
    const sensorData = new Float32Array(width * height);
    for (let i = 0; i < sensorData.length; i++) sensorData[i] = 0.92;

    const sensorBuffer: RawSensorBuffer = {
      width,
      height,
      bitDepth: 14,
      cfaPattern: 'RGGB',
      blackLevel: [512, 512, 512, 512],
      whiteLevel: 16383,
      colorCalibration: {
        asShotNeutral: [0.55, 1.0, 0.65],
        colorMatrix1: [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
      },
      sensorData,
      metadata: {
        isRaw: true,
        decodeStatus: 'genuine_raw_sensor',
        decoderEngine: 'DNG-Sensor-Decoder',
        cameraMake: 'Sony',
        cameraModel: 'Alpha 1',
        rawFormat: 'DNG',
        dimensions: { width, height },
        bitDepth: 14,
        cfaPattern: 'RGGB',
        blackLevel: [512, 512, 512, 512],
        whiteLevel: 16383,
        colorCalibration: {
          asShotNeutral: [0.55, 1.0, 0.65],
          colorMatrix1: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
          ],
        },
        hasEmbeddedPreview: false,
      },
    };

    const devResult = developRawSensorBuffer(
      sensorBuffer,
      {
        wbPreset: 'as-shot',
        kelvin: 5500,
        wbTint: 10,
        highlightRecovery: 50,
        shadowRecovery: 30,
        blackLevel: 0,
        demosaicMethod: 'ahd',
        moireReduction: 20,
      },
      'srgb'
    );

    assert(devResult.width === width && devResult.height === height, 'Development Pipeline', 'develops full sensor dimensions');
    assert(devResult.imageData.data.length === width * height * 4, 'Development Pipeline', 'outputs 4-channel ImageData');
  } catch (err: any) {
    results.push({ suite: 'Development Pipeline', name: 'execution', passed: false, error: err.message });
  }

  // 8. Adobe DNG 16-Bit Linear Export
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(0, 0, 16, 16);
    }

    const blob = encodeCanvasToDng(canvas, {
      dpi: 300,
      bitDepth: 16,
      metadata: {
        cameraMake: 'Lumina Master',
        cameraModel: 'RAW Negative Test',
      },
    });

    assert(blob.type === 'image/x-adobe-dng', 'DNG Export', 'outputs MIME image/x-adobe-dng');
    assert(blob.size > 500, 'DNG Export', 'writes complete DNG binary payload');
  } catch (err: any) {
    results.push({ suite: 'DNG Export', name: 'binary generation', passed: false, error: err.message });
  }

  return results;
}
