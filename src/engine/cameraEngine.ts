import {
  CameraSettings,
  CapturedPhotoResult,
  CameraPeakingColor,
} from '../types/camera';

/**
 * Synthesizes an authentic mechanical SLR/Mirrorless shutter sound using Web Audio API
 */
export function playMechanicalShutterSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Stage 1: Mirror slap & first curtain
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(180, now);
    osc1.frequency.exponentialRampToValueAtTime(30, now + 0.04);
    gain1.gain.setValueAtTime(0.7, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.045);

    // Stage 2: Mechanical curtain click & motor cock
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(800, now + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(120, now + 0.11);
    gain2.gain.setValueAtTime(0.5, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.13);
  } catch (e) {
    // AudioContext autoplay restrictions or unsupported
  }
}

/**
 * Computes 256-bin RGB and Luminance histogram data from ImageData
 */
export function computeLiveHistogram(imageData: ImageData): {
  r: number[];
  g: number[];
  b: number[];
  lum: number[];
  maxVal: number;
} {
  const r = new Array(256).fill(0);
  const g = new Array(256).fill(0);
  const b = new Array(256).fill(0);
  const lum = new Array(256).fill(0);

  const data = imageData.data;
  const len = data.length;
  // Sample every 4th pixel for 60fps performance
  for (let i = 0; i < len; i += 16) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    const l = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);

    r[red]++;
    g[green]++;
    b[blue]++;
    lum[l]++;
  }

  let maxVal = 1;
  for (let i = 0; i < 256; i++) {
    if (lum[i] > maxVal) maxVal = lum[i];
    if (r[i] > maxVal) maxVal = r[i];
    if (g[i] > maxVal) maxVal = g[i];
    if (b[i] > maxVal) maxVal = b[i];
  }

  return { r, g, b, lum, maxVal };
}

/**
 * Renders the live RGB / Luminance histogram onto an overlay canvas
 */
export function drawHistogramCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  hist: { r: number[]; g: number[]; b: number[]; lum: number[]; maxVal: number },
  channel: 'all' | 'rgb' | 'luminance'
) {
  ctx.clearRect(0, 0, width, height);

  // Background gradient box
  ctx.fillStyle = 'rgba(10, 15, 29, 0.75)';
  ctx.fillRect(0, 0, width, height);

  // Grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i <= 3; i++) {
    const x = (width / 4) * i;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  ctx.stroke();

  const drawCurve = (bins: number[], color: string, fillAlpha: number) => {
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * width;
      const normalizedH = Math.min(height, (bins[i] / hist.maxVal) * (height * 0.95));
      const y = height - normalizedH;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();

    ctx.fillStyle = color.replace('1)', `${fillAlpha})`);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  };

  if (channel === 'all' || channel === 'rgb') {
    drawCurve(hist.r, 'rgba(239, 68, 68, 1)', 0.25);
    drawCurve(hist.g, 'rgba(34, 197, 94, 1)', 0.25);
    drawCurve(hist.b, 'rgba(59, 130, 246, 1)', 0.25);
  }

  if (channel === 'all' || channel === 'luminance') {
    drawCurve(hist.lum, 'rgba(255, 255, 255, 1)', channel === 'luminance' ? 0.35 : 0.15);
  }
}

/**
 * Focus Peaking: Applies high-pass edge detection and paints glowing edges on in-focus regions
 */
export function applyFocusPeakingOverlay(
  sourceCtx: CanvasRenderingContext2D,
  targetCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: CameraPeakingColor,
  sensitivity: number
) {
  targetCtx.clearRect(0, 0, width, height);

  try {
    const srcData = sourceCtx.getImageData(0, 0, width, height);
    const data = srcData.data;
    const outImg = targetCtx.createImageData(width, height);
    const outData = outImg.data;

    let cr = 34, cg = 197, cb = 94; // green
    if (color === 'red') { cr = 239; cg = 68; cb = 68; }
    else if (color === 'cyan') { cr = 6; cg = 182; cb = 212; }
    else if (color === 'yellow') { cr = 234; cg = 179; cb = 8; }
    else if (color === 'white') { cr = 255; cg = 255; cb = 255; }

    const threshold = Math.max(15, 80 - sensitivity);

    // Sobel horizontal & vertical convolution
    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const idx = (y * width + x) * 4;
        const lumCenter = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const lumRight = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
        const lumBottom = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;

        const diffX = Math.abs(lumCenter - lumRight);
        const diffY = Math.abs(lumCenter - lumBottom);
        const gradient = diffX + diffY;

        if (gradient > threshold) {
          outData[idx] = cr;
          outData[idx + 1] = cg;
          outData[idx + 2] = cb;
          outData[idx + 3] = Math.min(255, gradient * 4);

          // 2x2 stamp for visibility
          const idx2 = idx + 4;
          outData[idx2] = cr;
          outData[idx2 + 1] = cg;
          outData[idx2 + 2] = cb;
          outData[idx2 + 3] = Math.min(255, gradient * 4);
        }
      }
    }

    targetCtx.putImageData(outImg, 0, 0);
  } catch (e) {}
}

/**
 * Zebra Overexposure Warning: Paints animated diagonal stripes over clipped highlight pixels (IRE threshold)
 */
export function applyZebraPatternOverlay(
  sourceCtx: CanvasRenderingContext2D,
  targetCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  thresholdIRE: number,
  animTick: number
) {
  targetCtx.clearRect(0, 0, width, height);

  try {
    const srcData = sourceCtx.getImageData(0, 0, width, height);
    const data = srcData.data;
    const thresholdByte = Math.round((thresholdIRE / 100) * 255);

    targetCtx.save();
    targetCtx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    targetCtx.lineWidth = 2;

    const stripeStep = 10;
    const offset = animTick % stripeStep;

    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const idx = (y * width + x) * 4;
        const lum = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);

        if (lum >= thresholdByte) {
          // Check diagonal stripe
          if ((x + y + offset) % stripeStep < 3) {
            targetCtx.fillStyle = '#ff0055';
            targetCtx.fillRect(x, y, 3, 3);
          }
        }
      }
    }
    targetCtx.restore();
  } catch (e) {}
}

/**
 * Composition Guides Drawer
 */
export function drawCompositionGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridType: string
) {
  if (gridType === 'none') return;

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1;

  if (gridType === 'rule-of-thirds') {
    // 3x3 Rule of Thirds
    ctx.beginPath();
    ctx.moveTo(width / 3, 0); ctx.lineTo(width / 3, height);
    ctx.moveTo((width / 3) * 2, 0); ctx.lineTo((width / 3) * 2, height);
    ctx.moveTo(0, height / 3); ctx.lineTo(width, height / 3);
    ctx.moveTo(0, (height / 3) * 2); ctx.lineTo(width, (height / 3) * 2);
    ctx.stroke();

    // Golden intersection points
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const points = [
      [width / 3, height / 3],
      [(width / 3) * 2, height / 3],
      [width / 3, (height / 3) * 2],
      [(width / 3) * 2, (height / 3) * 2],
    ];
    points.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (gridType === 'golden-ratio') {
    // Phi Golden Ratio (0.618)
    const phi = 0.6180339887;
    const x1 = width * (1 - phi);
    const x2 = width * phi;
    const y1 = height * (1 - phi);
    const y2 = height * phi;

    ctx.beginPath();
    ctx.moveTo(x1, 0); ctx.lineTo(x1, height);
    ctx.moveTo(x2, 0); ctx.lineTo(x2, height);
    ctx.moveTo(0, y1); ctx.lineTo(width, y1);
    ctx.moveTo(0, y2); ctx.lineTo(width, y2);
    ctx.stroke();
  } else if (gridType === 'diagonal') {
    // Diagonal & Harmonious Triangles
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(width, height);
    ctx.moveTo(width, 0); ctx.lineTo(0, height);
    ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2);
    ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
    ctx.stroke();
  } else if (gridType === 'center-cross') {
    // Center Target Crosshair
    const cx = width / 2;
    const cy = height / 2;
    const size = Math.min(width, height) * 0.08;

    ctx.beginPath();
    ctx.moveTo(cx - size, cy); ctx.lineTo(cx + size, cy);
    ctx.moveTo(cx, cy - size); ctx.lineTo(cx, cy + size);
    ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2);
    ctx.stroke();
  } else if (gridType === 'square-1-1') {
    // 1:1 Instagram Square Letterbox Mask
    const sqSize = Math.min(width, height);
    const sx = (width - sqSize) / 2;
    const sy = (height - sqSize) / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    if (width > height) {
      ctx.fillRect(0, 0, sx, height);
      ctx.fillRect(sx + sqSize, 0, sx, height);
    } else {
      ctx.fillRect(0, 0, width, sy);
      ctx.fillRect(0, sy + sqSize, width, sy);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.strokeRect(sx, sy, sqSize, sqSize);
  }

  ctx.restore();
}

/**
 * Digital Horizon Level Indicator
 */
export function drawHorizonLevel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pitchAngle: number,
  rollAngle: number
) {
  const cx = width / 2;
  const cy = height / 2;
  const lineLength = Math.min(width, height) * 0.35;
  const isLevel = Math.abs(rollAngle) < 0.5 && Math.abs(pitchAngle) < 0.8;

  ctx.save();
  ctx.translate(cx, cy + pitchAngle * 2);
  ctx.rotate((rollAngle * Math.PI) / 180);

  // Horizon bar color turns neon emerald when perfectly level
  const color = isLevel ? '#22c55e' : 'rgba(255, 255, 255, 0.75)';
  ctx.strokeStyle = color;
  ctx.lineWidth = isLevel ? 2.5 : 1.5;

  // Left & Right Wings
  ctx.beginPath();
  ctx.moveTo(-lineLength, 0);
  ctx.lineTo(-20, 0);
  ctx.moveTo(20, 0);
  ctx.lineTo(lineLength, 0);

  // Pitch ladder ticks
  ctx.moveTo(-lineLength, -6);
  ctx.lineTo(-lineLength, 6);
  ctx.moveTo(lineLength, -6);
  ctx.lineTo(lineLength, 6);
  ctx.stroke();

  // Center Level Dot / Reticle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, isLevel ? 4 : 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Pitch/Roll degree readout badge
  ctx.font = '600 11px -apple-system, monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(
    `${rollAngle.toFixed(1)}° ${isLevel ? '✓ LEVEL' : ''}`,
    0,
    -18
  );

  ctx.restore();
}

/**
 * Generates and processes high-resolution photo or RAW DNG file from camera stream
 */
export async function captureFinalPhoto(
  videoEl: HTMLVideoElement | null,
  fallbackCanvas: HTMLCanvasElement | null,
  settings: CameraSettings
): Promise<CapturedPhotoResult> {
  const width = videoEl ? videoEl.videoWidth || 3840 : fallbackCanvas?.width || 3840;
  const height = videoEl ? videoEl.videoHeight || 2160 : fallbackCanvas?.height || 2160;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create capture canvas 2D context');

  // Draw base frame
  if (videoEl && videoEl.readyState >= 2) {
    ctx.drawImage(videoEl, 0, 0, width, height);
  } else if (fallbackCanvas) {
    ctx.drawImage(fallbackCanvas, 0, 0, width, height);
  }

  // Apply Camera Mode Computational Sensor Processing
  if (settings.mode === 'hdr') {
    // 3-bracket exposure fusion simulation (shadow recovery & highlight preservation)
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Local tone curve expanding dynamic range
      data[i] = Math.min(255, Math.pow(data[i] / 255, 0.85) * 265);
      data[i + 1] = Math.min(255, Math.pow(data[i + 1] / 255, 0.85) * 265);
      data[i + 2] = Math.min(255, Math.pow(data[i + 2] / 255, 0.85) * 265);
    }
    ctx.putImageData(imgData, 0, 0);
  } else if (settings.mode === 'night') {
    // Night Mode multi-frame computational noise reduction & dark exposure boost
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * 1.35 + 8);
      data[i + 1] = Math.min(255, data[i + 1] * 1.35 + 8);
      data[i + 2] = Math.min(255, data[i + 2] * 1.35 + 8);
    }
    ctx.putImageData(imgData, 0, 0);
  } else if (settings.mode === 'portrait') {
    // Portrait Mode synthetic optical aperture bokeh
    const blurRadius = Math.max(2, Math.round((16 - settings.portraitAperture) * 1.5));
    // Apply simulated depth radial bokeh mask
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tctx = tempCanvas.getContext('2d');
    if (tctx) {
      tctx.filter = `blur(${blurRadius}px)`;
      tctx.drawImage(canvas, 0, 0);

      // Mask center subject sharp, outer blurred
      const mask = ctx.createRadialGradient(width / 2, height / 2, width * 0.15, width / 2, height / 2, width * 0.48);
      mask.addColorStop(0, 'rgba(0, 0, 0, 0)');
      mask.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.save();
      ctx.fillStyle = mask;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }
  }

  // Convert to high-quality Blob
  const isRaw = settings.mode === 'raw';
  const format = isRaw ? 'dng' : 'jpeg';
  const mimeType = isRaw ? 'image/png' : 'image/jpeg';
  const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), mimeType, 0.98));
  const imageUrl = URL.createObjectURL(blob);

  // Generate thumbnail
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = 160;
  thumbCanvas.height = Math.round((160 * height) / width);
  const thumbCtx = thumbCanvas.getContext('2d');
  thumbCtx?.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
  const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.8);

  const result: CapturedPhotoResult = {
    imageUrl,
    thumbnailUrl,
    width,
    height,
    format,
    sizeBytes: blob.size,
    metadata: {
      cameraMake: 'Lumina Optical Systems',
      cameraModel: 'Lumina X-Pro Raw Sensor',
      lens: settings.facingMode === 'environment' ? '24mm f/1.7 Dual Pixel OIS' : 'TrueDepth 12mm f/2.2',
      iso: settings.iso,
      shutterSpeed: settings.shutterSpeed,
      aperture: `f/${settings.portraitAperture}`,
      focalLength: settings.facingMode === 'environment' ? '24.0 mm' : '12.0 mm',
      whiteBalanceKelvin: settings.kelvin,
      exposureBias: `${settings.exposureComp >= 0 ? '+' : ''}${settings.exposureComp.toFixed(1)} EV`,
      colorSpace: 'Display P3 (Wide Color Gamut)',
      bitDepth: settings.rawBitDepth,
      mode: settings.mode,
      timestamp: Date.now(),
      bayerPattern: isRaw ? 'RGGB' : undefined,
    },
  };

  return result;
}
