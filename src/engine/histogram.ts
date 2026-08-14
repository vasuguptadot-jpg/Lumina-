export interface HistogramData {
  r: Uint32Array;
  g: Uint32Array;
  b: Uint32Array;
  lum: Uint32Array;
  maxCount: number;
  shadowClippingPercent: number;
  highlightClippingPercent: number;
}

export function computeHistogram(canvas: HTMLCanvasElement): HistogramData {
  const r = new Uint32Array(256);
  const g = new Uint32Array(256);
  const b = new Uint32Array(256);
  const lum = new Uint32Array(256);

  const ctx = canvas.getContext('2d');
  if (!ctx || canvas.width === 0 || canvas.height === 0) {
    return {
      r,
      g,
      b,
      lum,
      maxCount: 1,
      shadowClippingPercent: 0,
      highlightClippingPercent: 0,
    };
  }

  // Downsample to max 500x500 for lightning-fast 60fps real-time histogram rendering
  const step = Math.max(1, Math.floor(Math.sqrt((canvas.width * canvas.height) / 100000)));
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  let totalSampled = 0;
  let shadowClipped = 0;
  let highlightClipped = 0;

  for (let i = 0; i < data.length; i += 4 * step) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    const l = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);

    r[red]++;
    g[green]++;
    b[blue]++;
    lum[l]++;
    totalSampled++;

    if (red === 0 && green === 0 && blue === 0) shadowClipped++;
    if (red === 255 && green === 255 && blue === 255) highlightClipped++;
  }

  let maxCount = 0;
  // Ignore extreme edge spikes for better visual scale
  for (let i = 1; i < 255; i++) {
    if (r[i] > maxCount) maxCount = r[i];
    if (g[i] > maxCount) maxCount = g[i];
    if (b[i] > maxCount) maxCount = b[i];
    if (lum[i] > maxCount) maxCount = lum[i];
  }
  if (maxCount === 0) maxCount = 1;

  return {
    r,
    g,
    b,
    lum,
    maxCount,
    shadowClippingPercent: totalSampled > 0 ? (shadowClipped / totalSampled) * 100 : 0,
    highlightClippingPercent: totalSampled > 0 ? (highlightClipped / totalSampled) * 100 : 0,
  };
}
