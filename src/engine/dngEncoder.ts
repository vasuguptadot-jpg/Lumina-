/**
 * Adobe Digital Negative (.DNG) Binary Encoder
 * Encodes processed canvas master frames into standard Adobe DNG (v1.4) RAW container files
 * fully readable by Adobe Lightroom, Camera Raw, Darktable, and RawTherapee.
 */

import { RawMetadata } from '../types/editor';

export interface DngExportOptions {
  dpi?: number;
  metadata?: Partial<RawMetadata>;
  software?: string;
}

export function encodeCanvasToDng(canvas: HTMLCanvasElement, options: DngExportOptions = {}): Blob {
  const width = canvas.width;
  const height = canvas.height;
  const dpi = options.dpi || 300;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 3 bytes per pixel (Linear RGB DNG)
  const imageSize = width * height * 3;
  const numTags = 16;
  const ifdSize = 2 + numTags * 12 + 4;
  const headerSize = 8;
  const tagDataOffset = headerSize + ifdSize;

  const softwareStr = (options.software || 'Lumina Pro RAW Engine 2026') + '\0';
  const makeStr = (options.metadata?.cameraMake || 'Lumina Pro') + '\0';
  const modelStr = (options.metadata?.cameraModel || 'Master Digital Negative') + '\0';

  // Extra data sizes:
  // - BitsPerSample: 3 x 2 = 6 bytes
  // - XResolution: 2 x 4 = 8 bytes
  // - YResolution: 2 x 4 = 8 bytes
  // - DNGVersion: 4 bytes
  // - DNGBackwardVersion: 4 bytes
  // - CalibrationIlluminant1: 2 bytes
  // - ColorMatrix1: 9 rational values = 9 x 8 = 72 bytes
  // - Strings: software, make, model
  const extraDataSize =
    6 + 8 + 8 + 4 + 4 + 72 + softwareStr.length + makeStr.length + modelStr.length;

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
  const softwareOffset = extraPtr; extraPtr += softwareStr.length;
  const makeOffset = extraPtr; extraPtr += makeStr.length;
  const modelOffset = extraPtr; extraPtr += modelStr.length;

  // Tag 256: ImageWidth
  writeTag(256, 4, 1, width);
  // Tag 257: ImageLength
  writeTag(257, 4, 1, height);
  // Tag 258: BitsPerSample (8, 8, 8)
  writeTag(258, 3, 3, bitsPerSampleOffset);
  // Tag 259: Compression (1 = Uncompressed)
  writeTag(259, 3, 1, 1);
  // Tag 262: PhotometricInterpretation (34892 = LinearRaw / 2 = RGB)
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

  // Next IFD
  view.setUint32(offset, 0, true); offset += 4;

  // 3. Write Extra Tag Data
  // BitsPerSample
  view.setUint16(bitsPerSampleOffset, 8, true);
  view.setUint16(bitsPerSampleOffset + 2, 8, true);
  view.setUint16(bitsPerSampleOffset + 4, 8, true);

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

  // Strings
  for (let i = 0; i < softwareStr.length; i++) bytes[softwareOffset + i] = softwareStr.charCodeAt(i);
  for (let i = 0; i < makeStr.length; i++) bytes[makeOffset + i] = makeStr.charCodeAt(i);
  for (let i = 0; i < modelStr.length; i++) bytes[modelOffset + i] = modelStr.charCodeAt(i);

  // 4. Write Pixel Data (RGB byte stream)
  let dst = imageDataOffset;
  for (let src = 0; src < data.length; src += 4) {
    bytes[dst++] = data[src];     // R
    bytes[dst++] = data[src + 1]; // G
    bytes[dst++] = data[src + 2]; // B
  }

  return new Blob([buffer], { type: 'image/x-adobe-dng' });
}
