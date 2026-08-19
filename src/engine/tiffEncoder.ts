/**
 * Lossless TIFF (Tagged Image File Format) Binary Encoder
 * Encodes canvas pixel data into standard 24-bit RGB TIFF files.
 */

export interface TiffExportOptions {
  dpi?: number;
  software?: string;
}

export function encodeCanvasToTiff(canvas: HTMLCanvasElement, options: TiffExportOptions = {}): Blob {
  const width = canvas.width;
  const height = canvas.height;
  const dpi = options.dpi || 300;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 3 bytes per pixel (RGB)
  const imageSize = width * height * 3;
  const numTags = 12;
  const ifdSize = 2 + numTags * 12 + 4; // 2 count + tags + 4 next IFD offset
  const headerSize = 8;
  const tagDataOffset = headerSize + ifdSize;

  const softwareStr = (options.software || "Lumina Studio Pro 2026") + "\0";
  const extraDataSize = 6 + 8 + 8 + softwareStr.length;
  const imageDataOffset = tagDataOffset + extraDataSize;
  const totalFileSize = imageDataOffset + imageSize;

  const buffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  let offset = 0;

  // 1. TIFF Header (Little Endian "II")
  view.setUint16(offset, 0x4949, true); offset += 2; // "II"
  view.setUint16(offset, 42, true); offset += 2;     // Magic 42
  view.setUint32(offset, 8, true); offset += 4;      // Offset to first IFD (8)

  // 2. IFD: Number of Directory Entries
  view.setUint16(offset, numTags, true); offset += 2;

  // Helper to write an IFD tag (12 bytes)
  // Type: 1=BYTE, 2=ASCII, 3=SHORT, 4=LONG, 5=RATIONAL
  function writeTag(tagId: number, type: number, count: number, valueOrOffset: number) {
    view.setUint16(offset, tagId, true); offset += 2;
    view.setUint16(offset, type, true); offset += 2;
    view.setUint32(offset, count, true); offset += 4;
    view.setUint32(offset, valueOrOffset, true); offset += 4;
  }

  const bitsPerSampleOffset = tagDataOffset;
  const xResOffset = tagDataOffset + 6;
  const yResOffset = tagDataOffset + 14;
  const softwareOffset = tagDataOffset + 22;

  // Tag 256: ImageWidth
  writeTag(256, 4, 1, width);
  // Tag 257: ImageLength
  writeTag(257, 4, 1, height);
  // Tag 258: BitsPerSample (8, 8, 8)
  writeTag(258, 3, 3, bitsPerSampleOffset);
  // Tag 259: Compression (1 = Uncompressed)
  writeTag(259, 3, 1, 1);
  // Tag 262: PhotometricInterpretation (2 = RGB)
  writeTag(262, 3, 1, 2);
  // Tag 273: StripOffsets
  writeTag(273, 4, 1, imageDataOffset);
  // Tag 277: SamplesPerPixel (3)
  writeTag(277, 3, 1, 3);
  // Tag 278: RowsPerStrip (height)
  writeTag(278, 4, 1, height);
  // Tag 279: StripByteCounts
  writeTag(279, 4, 1, imageSize);
  // Tag 282: XResolution (DPI/1)
  writeTag(282, 5, 1, xResOffset);
  // Tag 283: YResolution (DPI/1)
  writeTag(283, 5, 1, yResOffset);
  // Tag 305: Software
  writeTag(305, 2, softwareStr.length, softwareOffset);

  // Next IFD Offset (0 = End of IFDs)
  view.setUint32(offset, 0, true); offset += 4;

  // 3. Write Extra Tag Values
  // BitsPerSample values: 8, 8, 8 (3 x uint16 = 6 bytes)
  view.setUint16(bitsPerSampleOffset, 8, true);
  view.setUint16(bitsPerSampleOffset + 2, 8, true);
  view.setUint16(bitsPerSampleOffset + 4, 8, true);

  // XResolution: dpi / 1
  view.setUint32(xResOffset, dpi, true);
  view.setUint32(xResOffset + 4, 1, true);

  // YResolution: dpi / 1
  view.setUint32(yResOffset, dpi, true);
  view.setUint32(yResOffset + 4, 1, true);

  // Software ASCII String
  for (let i = 0; i < softwareStr.length; i++) {
    bytes[softwareOffset + i] = softwareStr.charCodeAt(i);
  }

  // 4. Write RGB Raster Bitmap Pixels
  let pixelIndex = imageDataOffset;
  for (let i = 0; i < data.length; i += 4) {
    bytes[pixelIndex++] = data[i];     // Red
    bytes[pixelIndex++] = data[i + 1]; // Green
    bytes[pixelIndex++] = data[i + 2]; // Blue
  }

  return new Blob([buffer], { type: 'image/tiff' });
}
