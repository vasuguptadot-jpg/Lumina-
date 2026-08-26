/**
 * Adobe Digital Negative (.DNG) Binary Encoder
 * Encodes processed canvas master frames and sensor negatives into standard Adobe DNG (v1.4) RAW container files
 * fully readable by Adobe Lightroom, Camera Raw, Darktable, and RawTherapee.
 * Supports 16-Bit Linear RAW and 8-Bit RGB Negative outputs.
 */

import { RawMetadata } from '../types/editor';
import { srgbGammaToLinear } from './raw/rawDevelopEngine';

export interface DngExportOptions {
  dpi?: number;
  metadata?: Partial<RawMetadata>;
  software?: string;
  bitDepth?: 8 | 16;
}

export function encodeCanvasToDng(canvas: HTMLCanvasElement, options: DngExportOptions = {}): Blob {
  const width = canvas.width;
  const height = canvas.height;
  const dpi = options.dpi || 300;
  const bitDepth = options.bitDepth || 16; // Standard 16-bit master negative
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const bytesPerSample = bitDepth === 16 ? 2 : 1;
  const imageSize = width * height * 3 * bytesPerSample;
  const numTags = 20;
  const ifdSize = 2 + numTags * 12 + 4;
  const headerSize = 8;
  const tagDataOffset = headerSize + ifdSize;

  const softwareStr = (options.software || 'Lumina Pro RAW Engine 2026') + '\0';
  const makeStr = (options.metadata?.cameraMake || 'Lumina Pro Master') + '\0';
  const modelStr = (options.metadata?.cameraModel || 'Digital Negative Master') + '\0';

  // Extra data sizes:
  // - BitsPerSample: 3 x 2 = 6 bytes
  // - XResolution: 2 x 4 = 8 bytes
  // - YResolution: 2 x 4 = 8 bytes
  // - DNGVersion: 4 bytes
  // - DNGBackwardVersion: 4 bytes
  // - ColorMatrix1: 9 rational values = 9 x 8 = 72 bytes
  // - AsShotNeutral: 3 rational values = 3 x 8 = 24 bytes
  // - BlackLevel: 4 rational values = 4 x 8 = 32 bytes
  // - Strings: software, make, model
  const extraDataSize =
    6 + 8 + 8 + 4 + 4 + 72 + 24 + 32 + softwareStr.length + makeStr.length + modelStr.length;

  const imageDataOffset = tagDataOffset + extraDataSize;
  const totalFileSize = imageDataOffset + imageSize;

  const buffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  let offset = 0;

  // 1. TIFF Header (Little Endian "II")
  view.setUint16(offset, 0x4949, true); offset += 2; // "II"
  view.setUint16(offset, 42, true); offset += 2;     // Magic 42
  view.setUint32(offset, 8, true); offset += 4;      // IFD offset

  // 2. IFD: Tag count
  view.setUint16(offset, numTags, true); offset += 2;

  function writeTag(tagId: number, type: number, count: number, valueOrOffset: number) {
    view.setUint16(offset, tagId, true); offset += 2;
    view.setUint16(offset, type, true); offset += 2;
    view.setUint32(offset, count, true); offset += 4;
    view.setUint32(offset, valueOrOffset, true); offset += 4;
  }

  let extraPtr = tagDataOffset;
  const bitsPerSampleOffset = extraPtr; extraPtr += 6;
  const xResOffset = extraPtr; extraPtr += 8;
  const yResOffset = extraPtr; extraPtr += 8;
  const dngVersionOffset = extraPtr; extraPtr += 4;
  const dngBackwardOffset = extraPtr; extraPtr += 4;
  const colorMatrixOffset = extraPtr; extraPtr += 72;
  const asShotNeutralOffset = extraPtr; extraPtr += 24;
  const blackLevelOffset = extraPtr; extraPtr += 32;
  const softwareOffset = extraPtr; extraPtr += softwareStr.length;
  const makeOffset = extraPtr; extraPtr += makeStr.length;
  const modelOffset = extraPtr; extraPtr += modelStr.length;

  // Tag 256: ImageWidth
  writeTag(256, 4, 1, width);
  // Tag 257: ImageLength
  writeTag(257, 4, 1, height);
  // Tag 258: BitsPerSample (16, 16, 16)
  writeTag(258, 3, 3, bitsPerSampleOffset);
  // Tag 259: Compression (1 = Uncompressed)
  writeTag(259, 3, 1, 1);
  // Tag 262: PhotometricInterpretation (34892 = LinearRaw)
  writeTag(262, 3, 1, 34892);
  // Tag 271: Make
  writeTag(271, 2, makeStr.length, makeOffset);
  // Tag 272: Model
  writeTag(272, 2, modelStr.length, modelOffset);
  // Tag 273: StripOffsets
  writeTag(273, 4, 1, imageDataOffset);
  // Tag 277: SamplesPerPixel (3)
  writeTag(277, 3, 1, 3);
  // Tag 278: RowsPerStrip (height)
  writeTag(278, 4, 1, height);
  // Tag 279: StripByteCounts
  writeTag(279, 4, 1, imageSize);
  // Tag 282: XResolution
  writeTag(282, 5, 1, xResOffset);
  // Tag 283: YResolution
  writeTag(283, 5, 1, yResOffset);
  // Tag 305: Software
  writeTag(305, 2, softwareStr.length, softwareOffset);
  // Tag 50706: DNGVersion ([1, 4, 0, 0])
  writeTag(50706, 1, 4, dngVersionOffset);
  // Tag 50707: DNGBackwardVersion ([1, 1, 0, 0])
  writeTag(50707, 1, 4, dngBackwardOffset);
  // Tag 50714: BlackLevel
  writeTag(50714, 5, 4, blackLevelOffset);
  // Tag 50717: WhiteLevel
  writeTag(50717, 4, 1, bitDepth === 16 ? 65535 : 255);
  // Tag 50721: ColorMatrix1
  writeTag(50721, 10, 9, colorMatrixOffset);
  // Tag 50728: AsShotNeutral
  writeTag(50728, 5, 3, asShotNeutralOffset);

  // Next IFD
  view.setUint32(offset, 0, true); offset += 4;

  // 3. Write Extra Tag Data
  // BitsPerSample
  view.setUint16(bitsPerSampleOffset, bitDepth, true);
  view.setUint16(bitsPerSampleOffset + 2, bitDepth, true);
  view.setUint16(bitsPerSampleOffset + 4, bitDepth, true);

  // Resolution
  view.setUint32(xResOffset, dpi, true);
  view.setUint32(xResOffset + 4, 1, true);
  view.setUint32(yResOffset, dpi, true);
  view.setUint32(yResOffset + 4, 1, true);

  // DNG Version [1, 4, 0, 0]
  bytes[dngVersionOffset] = 1;
  bytes[dngVersionOffset + 1] = 4;
  bytes[dngVersionOffset + 2] = 0;
  bytes[dngVersionOffset + 3] = 0;

  // DNG Backward Version [1, 1, 0, 0]
  bytes[dngBackwardOffset] = 1;
  bytes[dngBackwardOffset + 1] = 1;
  bytes[dngBackwardOffset + 2] = 0;
  bytes[dngBackwardOffset + 3] = 0;

  // ColorMatrix1 (Standard D65 Camera to XYZ matrix)
  const defaultCm = [
    [0.78, -0.22, -0.06],
    [-0.35, 1.15, 0.20],
    [-0.04, 0.12, 0.92],
  ];
  let cmPtr = colorMatrixOffset;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const val = Math.round(defaultCm[r][c] * 10000);
      view.setInt32(cmPtr, val, true);
      view.setInt32(cmPtr + 4, 10000, true);
      cmPtr += 8;
    }
  }

  // AsShotNeutral (R: 0.55, G: 1.0, B: 0.65)
  view.setUint32(asShotNeutralOffset, 5500, true); view.setUint32(asShotNeutralOffset + 4, 10000, true);
  view.setUint32(asShotNeutralOffset + 8, 10000, true); view.setUint32(asShotNeutralOffset + 12, 10000, true);
  view.setUint32(asShotNeutralOffset + 16, 6500, true); view.setUint32(asShotNeutralOffset + 20, 10000, true);

  // BlackLevel (0 for linear normalized)
  for (let i = 0; i < 4; i++) {
    view.setUint32(blackLevelOffset + i * 8, 0, true);
    view.setUint32(blackLevelOffset + i * 8 + 4, 1, true);
  }

  // Strings
  for (let i = 0; i < softwareStr.length; i++) bytes[softwareOffset + i] = softwareStr.charCodeAt(i);
  for (let i = 0; i < makeStr.length; i++) bytes[makeOffset + i] = makeStr.charCodeAt(i);
  for (let i = 0; i < modelStr.length; i++) bytes[modelOffset + i] = modelStr.charCodeAt(i);

  // 4. Write Pixel Data (Linear 16-bit or 8-bit stream)
  if (bitDepth === 16) {
    let dst = imageDataOffset;
    for (let src = 0; src < data.length; src += 4) {
      const rLin = srgbGammaToLinear(data[src] / 255);
      const gLin = srgbGammaToLinear(data[src + 1] / 255);
      const bLin = srgbGammaToLinear(data[src + 2] / 255);

      view.setUint16(dst, Math.round(rLin * 65535), true); dst += 2;
      view.setUint16(dst, Math.round(gLin * 65535), true); dst += 2;
      view.setUint16(dst, Math.round(bLin * 65535), true); dst += 2;
    }
  } else {
    let dst = imageDataOffset;
    for (let src = 0; src < data.length; src += 4) {
      bytes[dst++] = data[src];
      bytes[dst++] = data[src + 1];
      bytes[dst++] = data[src + 2];
    }
  }

  return new Blob([buffer], { type: 'image/x-adobe-dng' });
}
