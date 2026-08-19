/**
 * Adobe Photoshop Document (.PSD) Binary Encoder
 * Encodes canvas pixel data into standard Adobe Photoshop (.psd) files
 * compatible with Adobe Photoshop, Lightroom, Affinity Photo, GIMP, and Figma.
 */

export interface PsdExportOptions {
  dpi?: number;
  author?: string;
  copyright?: string;
}

export function encodeCanvasToPsd(canvas: HTMLCanvasElement, options: PsdExportOptions = {}): Blob {
  const width = canvas.width;
  const height = canvas.height;
  const dpi = options.dpi || 300;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. File Header: 26 bytes
  const headerSize = 26;

  // 2. Color Mode Data: 4 bytes (length = 0)
  const colorModeDataSize = 4;

  // 3. Image Resources (Resolution Info for DPI: 1005 tag)
  // Resource block: '8BIM' (4) + ID (2) + Pascal string name (2) + size (4) + data (16) = 28 bytes
  // Resource section length (4) + resource block (28) = 32 bytes
  const resBlockSize = 28;
  const imageResourcesSize = 4 + resBlockSize;

  // 4. Layer and Mask Info: 4 bytes (length = 0 for standard composite master)
  const layerMaskInfoSize = 4;

  // 5. Image Data: 2 bytes compression (0 = raw planar) + (3 channels * width * height)
  const numChannels = 3; // R, G, B
  const channelSize = width * height;
  const pixelDataSize = numChannels * channelSize;
  const imageDataSize = 2 + pixelDataSize;

  const totalSize =
    headerSize + colorModeDataSize + imageResourcesSize + layerMaskInfoSize + imageDataSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  let offset = 0;

  // ----------------------------------------------------
  // 1. FILE HEADER (26 bytes) - Big Endian
  // ----------------------------------------------------
  // Signature: '8BPS' (0x38425053)
  view.setUint32(offset, 0x38425053, false); offset += 4;
  // Version: 1
  view.setUint16(offset, 1, false); offset += 2;
  // Reserved: 6 bytes of 0
  offset += 6;
  // Number of channels: 3 (RGB)
  view.setUint16(offset, numChannels, false); offset += 2;
  // Height: 4 bytes
  view.setUint32(offset, height, false); offset += 4;
  // Width: 4 bytes
  view.setUint32(offset, width, false); offset += 4;
  // Depth: 8 bits per channel
  view.setUint16(offset, 8, false); offset += 2;
  // Color Mode: 3 (RGB Color)
  view.setUint16(offset, 3, false); offset += 2;

  // ----------------------------------------------------
  // 2. COLOR MODE DATA SECTION (4 bytes)
  // ----------------------------------------------------
  view.setUint32(offset, 0, false); offset += 4; // Length = 0

  // ----------------------------------------------------
  // 3. IMAGE RESOURCES SECTION (Resolution Info)
  // ----------------------------------------------------
  view.setUint32(offset, resBlockSize, false); offset += 4; // Resource section length

  // Resource 1: ResolutionInfo (0x03ED = 1005)
  // Signature: '8BIM'
  view.setUint32(offset, 0x3842494d, false); offset += 4;
  // Resource ID: 0x03ED (ResolutionInfo)
  view.setUint16(offset, 0x03ed, false); offset += 2;
  // Resource Name (Pascal string, padded to even length): 0x0000
  view.setUint16(offset, 0, false); offset += 2;
  // Size of resource data: 16 bytes
  view.setUint32(offset, 16, false); offset += 4;

  // Resolution Info Data:
  // Horizontal resolution in pixels/inch (fixed 16.16)
  view.setUint16(offset, dpi, false); offset += 2;
  view.setUint16(offset, 0, false); offset += 2;
  // Display unit: 1 = pixels per inch
  view.setUint16(offset, 1, false); offset += 2;
  // Width unit: 1 = inches
  view.setUint16(offset, 1, false); offset += 2;
  // Vertical resolution in pixels/inch (fixed 16.16)
  view.setUint16(offset, dpi, false); offset += 2;
  view.setUint16(offset, 0, false); offset += 2;
  // Display unit: 1 = pixels per inch
  view.setUint16(offset, 1, false); offset += 2;
  // Height unit: 1 = inches
  view.setUint16(offset, 1, false); offset += 2;

  // ----------------------------------------------------
  // 4. LAYER AND MASK INFORMATION SECTION (4 bytes)
  // ----------------------------------------------------
  view.setUint32(offset, 0, false); offset += 4; // Length = 0

  // ----------------------------------------------------
  // 5. IMAGE DATA SECTION (Planar R, G, B channels)
  // ----------------------------------------------------
  // Compression: 0 = Raw uncompressed
  view.setUint16(offset, 0, false); offset += 2;

  // Write planar channel bytes: Red plane, Green plane, Blue plane
  let rOffset = offset;
  let gOffset = offset + channelSize;
  let bOffset = offset + channelSize * 2;

  let pixelIdx = 0;
  for (let i = 0; i < channelSize; i++) {
    bytes[rOffset + i] = data[pixelIdx];     // Red
    bytes[gOffset + i] = data[pixelIdx + 1]; // Green
    bytes[bOffset + i] = data[pixelIdx + 2]; // Blue
    pixelIdx += 4;
  }

  return new Blob([buffer], { type: 'image/vnd.adobe.photoshop' });
}
