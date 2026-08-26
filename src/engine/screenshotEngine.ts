import {
  ScreenshotStudioState,
  BackdropSettings,
  StatusBarSettings,
  RedactionBox,
  DeviceFrameType,
  ShadowSettings,
  CornerBorderSettings,
} from '../types/screenshot';

export interface GradientPresetDef {
  id: string;
  name: string;
  colors: string[];
  angle: number;
}

export const BACKDROP_GRADIENTS: GradientPresetDef[] = [
  {
    id: 'neon-twilight',
    name: 'Neon Twilight',
    colors: ['#4f46e5', '#7c3aed', '#db2777', '#f43f5e'],
    angle: 135,
  },
  {
    id: 'apple-sunset',
    name: 'Apple Sunset',
    colors: ['#f97316', '#ec4899', '#8b5cf6'],
    angle: 120,
  },
  {
    id: 'cosmic-indigo',
    name: 'Cosmic Indigo',
    colors: ['#1e1b4b', '#312e81', '#4338ca', '#0f172a'],
    angle: 160,
  },
  {
    id: 'emerald-studio',
    name: 'Emerald Studio',
    colors: ['#064e3b', '#047857', '#10b981', '#022c22'],
    angle: 145,
  },
  {
    id: 'deep-obsidian',
    name: 'Deep Obsidian',
    colors: ['#090d16', '#1e293b', '#0f172a'],
    angle: 180,
  },
  {
    id: 'pastel-sunrise',
    name: 'Pastel Sunrise',
    colors: ['#fed7aa', '#fbcfe8', '#e9d5ff', '#c7d2fe'],
    angle: 110,
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    colors: ['#0f172a', '#1e1e38', '#2e1065', '#3b0764'],
    angle: 135,
  },
  {
    id: 'warm-amber',
    name: 'Warm Amber',
    colors: ['#78350f', '#b45309', '#f59e0b', '#fbbf24'],
    angle: 125,
  },
  {
    id: 'cyberpunk-matrix',
    name: 'Cyberpunk Neon',
    colors: ['#052e16', '#064e3b', '#0d9488', '#06b6d4'],
    angle: 140,
  },
];

/**
 * Draws rounded rectangle path on canvas
 */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Renders the clean status bar on top of the screenshot canvas
 */
export function drawCleanStatusBar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: StatusBarSettings
) {
  if (!settings.enabled) return;

  const isLight = settings.style.includes('light');
  const textColor = isLight ? '#000000' : '#ffffff';
  const barHeight = Math.max(38, Math.round(width * 0.05));
  const fontSize = Math.max(13, Math.round(barHeight * 0.38));

  ctx.save();

  // Draw Time (Left side)
  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const paddingX = Math.max(24, Math.round(width * 0.06));
  const centerY = barHeight / 2 + 3;
  ctx.fillText(settings.time || '9:41', paddingX, centerY);

  // Dynamic Island / Notch (Center)
  if (settings.showDynamicIsland) {
    const pillW = Math.max(90, Math.round(width * 0.26));
    const pillH = Math.max(24, Math.round(barHeight * 0.65));
    const pillX = (width - pillW) / 2;
    const pillY = Math.max(6, (barHeight - pillH) / 2 + 1);

    ctx.save();
    ctx.fillStyle = '#000000';
    roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();

    // Camera lens reflection dot inside Dynamic Island
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(pillX + pillW - 14, pillY + pillH / 2, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(pillX + pillW - 14.5, pillY + pillH / 2 - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Right Side Icons: Cellular, WiFi, Battery
  let rightX = width - paddingX;

  // 1. Battery Icon
  const battW = Math.max(22, Math.round(barHeight * 0.55));
  const battH = Math.max(11, Math.round(barHeight * 0.3));
  const battX = rightX - battW;
  const battY = centerY - battH / 2;

  // Battery Body
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 1.2;
  roundRect(ctx, battX, battY, battW, battH, 3.5);
  ctx.stroke();

  // Battery Cap
  ctx.fillStyle = textColor;
  ctx.fillRect(battX + battW + 1, battY + battH * 0.28, 1.8, battH * 0.44);

  // Battery Level Fill (Green if 100%, else text color)
  const fillPercent = Math.max(0, Math.min(100, settings.batteryPercent)) / 100;
  const fillW = (battW - 3) * fillPercent;
  ctx.fillStyle = settings.batteryPercent > 20 ? '#22c55e' : '#ef4444';
  if (fillW > 0) {
    roundRect(ctx, battX + 1.5, battY + 1.5, fillW, battH - 3, 2);
    ctx.fill();
  }

  rightX -= battW + 8;

  // 2. WiFi Icon
  if (settings.showWifi) {
    const wifiSize = Math.max(14, Math.round(barHeight * 0.38));
    const wifiX = rightX - wifiSize;
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    // WiFi Arcs
    ctx.beginPath();
    ctx.arc(wifiX + wifiSize / 2, centerY + wifiSize * 0.3, wifiSize * 0.45, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(wifiX + wifiSize / 2, centerY + wifiSize * 0.3, wifiSize * 0.28, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();

    // WiFi Center Dot
    ctx.fillStyle = textColor;
    ctx.beginPath();
    ctx.arc(wifiX + wifiSize / 2, centerY + wifiSize * 0.25, 1.5, 0, Math.PI * 2);
    ctx.fill();

    rightX -= wifiSize + 7;
  }

  // 3. Cellular Signal Bars (4 vertical bars)
  if (settings.showCellular) {
    const cellW = 3;
    const cellSpacing = 1.5;
    const cellHeights = [4, 7, 10, 13];
    const totalCellW = cellHeights.length * cellW + (cellHeights.length - 1) * cellSpacing;
    const cellX = rightX - totalCellW;

    ctx.fillStyle = textColor;
    for (let i = 0; i < cellHeights.length; i++) {
      const h = cellHeights[i];
      const x = cellX + i * (cellW + cellSpacing);
      const y = centerY + 6 - h;
      roundRect(ctx, x, y, cellW, h, 1);
      ctx.fill();
    }

    rightX -= totalCellW + 6;
  }

  // Optional 5G Text
  if (settings.carrierText) {
    ctx.font = `700 ${fontSize * 0.75}px -apple-system, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    ctx.fillText(settings.carrierText, rightX - 2, centerY + 0.5);
  }

  ctx.restore();
}

/**
 * Applies redaction boxes (blur, pixelate, blackout, seamless-fill) to canvas
 */
export function applyRedactionBoxes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  redactions: RedactionBox[]
) {
  if (!redactions || redactions.length === 0) return;

  for (const box of redactions) {
    const rx = Math.round(box.x * width);
    const ry = Math.round(box.y * height);
    const rw = Math.round(box.width * width);
    const rh = Math.round(box.height * height);

    if (rw <= 0 || rh <= 0) continue;

    ctx.save();

    if (box.type === 'blackout') {
      ctx.fillStyle = '#0a0a0a';
      roundRect(ctx, rx, ry, rw, rh, 4);
      ctx.fill();
    } else if (box.type === 'whiteout') {
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, rx, ry, rw, rh, 4);
      ctx.fill();
    } else if (box.type === 'blur') {
      // Blur filter region
      ctx.save();
      roundRect(ctx, rx, ry, rw, rh, 6);
      ctx.clip();
      ctx.filter = 'blur(16px)';
      ctx.drawImage(ctx.canvas, rx - 10, ry - 10, rw + 20, rh + 20, rx - 10, ry - 10, rw + 20, rh + 20);
      ctx.restore();
    } else if (box.type === 'pixelate') {
      // Mosaic pixelation
      const pixelSize = Math.max(8, Math.round(Math.min(rw, rh) / 6));
      const tempCanvas = document.createElement('canvas');
      const tempW = Math.max(1, Math.floor(rw / pixelSize));
      const tempH = Math.max(1, Math.floor(rh / pixelSize));
      tempCanvas.width = tempW;
      tempCanvas.height = tempH;
      const tctx = tempCanvas.getContext('2d');
      if (tctx) {
        tctx.drawImage(ctx.canvas, rx, ry, rw, rh, 0, 0, tempW, tempH);
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        roundRect(ctx, rx, ry, rw, rh, 4);
        ctx.clip();
        ctx.drawImage(tempCanvas, 0, 0, tempW, tempH, rx, ry, rw, rh);
        ctx.restore();
      }
    } else if (box.type === 'seamless-fill') {
      // Sample adjacent pixel color and fill smoothly
      try {
        const sample = ctx.getImageData(Math.max(0, rx - 2), Math.max(0, ry - 2), 1, 1).data;
        ctx.fillStyle = `rgb(${sample[0]}, ${sample[1]}, ${sample[2]})`;
        roundRect(ctx, rx, ry, rw, rh, 4);
        ctx.fill();
      } catch (e) {
        ctx.fillStyle = '#1e293b';
        roundRect(ctx, rx, ry, rw, rh, 4);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

/**
 * Main Master Screenshot Studio Canvas Renderer
 */
export async function renderMasterScreenshotStudio(
  sourceImg: HTMLImageElement,
  state: ScreenshotStudioState
): Promise<{ canvas: HTMLCanvasElement; blobUrl: string; sizeBytes: number }> {
  // 1. Calculate Inner Screenshot Dimensions
  const rawW = sourceImg.naturalWidth || sourceImg.width || 1200;
  const rawH = sourceImg.naturalHeight || sourceImg.height || 2400;

  // Working canvas for inner screenshot processing (status bar + redactions + corners)
  const innerCanvas = document.createElement('canvas');
  innerCanvas.width = rawW;
  innerCanvas.height = rawH;
  const ictx = innerCanvas.getContext('2d');
  if (!ictx) throw new Error('Inner 2D Context initialization failed');

  // Draw source image
  ictx.drawImage(sourceImg, 0, 0, rawW, rawH);

  // Apply notification redactions
  applyRedactionBoxes(ictx, rawW, rawH, state.redactions);

  // Draw clean status bar
  if (state.statusBar.enabled) {
    drawCleanStatusBar(ictx, rawW, rawH, state.statusBar);
  }

  // 2. Setup Device Frame Outer Bounds & Dimensions
  let framedW = rawW;
  let framedH = rawH;
  let offsetX = 0;
  let offsetY = 0;
  let frameRadius = state.corners.cornerRadius;

  if (state.deviceFrame === 'iphone-16-pro' || state.deviceFrame === 'iphone-16-gold') {
    const bezel = Math.max(14, Math.round(rawW * 0.035));
    framedW = rawW + bezel * 2;
    framedH = rawH + bezel * 2;
    offsetX = bezel;
    offsetY = bezel;
    frameRadius = Math.max(38, Math.round(rawW * 0.12));
  } else if (state.deviceFrame === 'ipad-pro') {
    const bezel = Math.max(20, Math.round(rawW * 0.045));
    framedW = rawW + bezel * 2;
    framedH = rawH + bezel * 2;
    offsetX = bezel;
    offsetY = bezel;
    frameRadius = 24;
  } else if (state.deviceFrame === 'macbook-pro') {
    const topBezel = Math.max(26, Math.round(rawW * 0.024));
    const sideBezel = Math.max(14, Math.round(rawW * 0.012));
    const bottomDeck = Math.max(32, Math.round(rawW * 0.03));
    framedW = rawW + sideBezel * 2;
    framedH = rawH + topBezel + bottomDeck;
    offsetX = sideBezel;
    offsetY = topBezel;
    frameRadius = 16;
  } else if (state.deviceFrame.startsWith('browser-')) {
    const headerH = Math.max(38, Math.round(rawW * 0.038));
    framedW = rawW;
    framedH = rawH + headerH;
    offsetX = 0;
    offsetY = headerH;
    frameRadius = 14;
  }

  // 3. Render Framed Device on Intermediate Canvas
  const framedCanvas = document.createElement('canvas');
  framedCanvas.width = framedW;
  framedCanvas.height = framedH;
  const fctx = framedCanvas.getContext('2d');
  if (!fctx) throw new Error('Framed Canvas Context failed');

  // Draw Device Frame Background / Outer Bezel
  if (state.deviceFrame === 'iphone-16-pro' || state.deviceFrame === 'iphone-16-gold') {
    const isGold = state.deviceFrame === 'iphone-16-gold';
    // Titanium edge chassis
    fctx.save();
    const grad = fctx.createLinearGradient(0, 0, framedW, framedH);
    if (isGold) {
      grad.addColorStop(0, '#c7a76c');
      grad.addColorStop(0.5, '#785b2e');
      grad.addColorStop(1, '#e3cb98');
    } else {
      grad.addColorStop(0, '#64748b');
      grad.addColorStop(0.3, '#334155');
      grad.addColorStop(0.7, '#1e293b');
      grad.addColorStop(1, '#475569');
    }
    fctx.fillStyle = grad;
    roundRect(fctx, 0, 0, framedW, framedH, frameRadius);
    fctx.fill();

    // Inner Black Bezel border
    fctx.fillStyle = '#050508';
    roundRect(fctx, offsetX - 3, offsetY - 3, rawW + 6, rawH + 6, frameRadius - 4);
    fctx.fill();
    fctx.restore();
  } else if (state.deviceFrame.startsWith('browser-')) {
    // Safari / Chrome Browser Window Header
    const isDark = state.deviceFrame === 'browser-safari-dark';
    fctx.save();
    fctx.fillStyle = isDark ? '#18181b' : '#f4f4f5';
    roundRect(fctx, 0, 0, framedW, framedH, frameRadius);
    fctx.fill();

    // Window traffic light dots: Red, Yellow, Green
    const dotY = offsetY / 2;
    const dotR = Math.max(5, Math.round(offsetY * 0.16));
    const dotSpacing = Math.max(16, Math.round(dotR * 3));

    // Close
    fctx.fillStyle = '#ef4444';
    fctx.beginPath();
    fctx.arc(20, dotY, dotR, 0, Math.PI * 2);
    fctx.fill();

    // Minimize
    fctx.fillStyle = '#f59e0b';
    fctx.beginPath();
    fctx.arc(20 + dotSpacing, dotY, dotR, 0, Math.PI * 2);
    fctx.fill();

    // Expand
    fctx.fillStyle = '#10b981';
    fctx.beginPath();
    fctx.arc(20 + dotSpacing * 2, dotY, dotR, 0, Math.PI * 2);
    fctx.fill();

    // Address Bar Pill in Center
    const urlPillW = Math.max(180, Math.round(framedW * 0.38));
    const urlPillH = Math.max(20, Math.round(offsetY * 0.58));
    const urlPillX = (framedW - urlPillW) / 2;
    const urlPillY = (offsetY - urlPillH) / 2;

    fctx.fillStyle = isDark ? '#27272a' : '#e4e4e7';
    roundRect(fctx, urlPillX, urlPillY, urlPillW, urlPillH, urlPillH / 2);
    fctx.fill();

    // URL text
    fctx.fillStyle = isDark ? '#a1a1aa' : '#71717a';
    fctx.font = `500 ${Math.max(10, Math.round(urlPillH * 0.52))}px -apple-system, monospace`;
    fctx.textAlign = 'center';
    fctx.textBaseline = 'middle';
    fctx.fillText('🔒 lumina.studio/app', framedW / 2, dotY);
    fctx.restore();
  }

  // Clip and Draw Inner Screen
  fctx.save();
  const screenRadius = Math.max(4, frameRadius - offsetX);
  roundRect(fctx, offsetX, offsetY, rawW, rawH, screenRadius);
  fctx.clip();
  fctx.drawImage(innerCanvas, offsetX, offsetY, rawW, rawH);
  fctx.restore();

  // Draw Inset Glass / Border Highlight if enabled
  if (state.corners.borderWidth > 0 && state.corners.borderOpacity > 0) {
    fctx.save();
    fctx.strokeStyle = state.corners.borderColor;
    fctx.globalAlpha = state.corners.borderOpacity / 100;
    fctx.lineWidth = state.corners.borderWidth;
    roundRect(fctx, offsetX, offsetY, rawW, rawH, screenRadius);
    fctx.stroke();
    fctx.restore();
  }

  // 4. Calculate Final Outer Stage Dimensions (Backdrop & Aspect Ratio)
  const padX = state.backdrop.paddingX * 2;
  const padY = state.backdrop.paddingY * 2;
  let finalW = framedW + padX;
  let finalH = framedH + padY;

  if (state.backdrop.aspectRatio === '16:9') {
    finalW = Math.max(finalW, Math.round(finalH * (16 / 9)));
    finalH = Math.round(finalW * (9 / 16));
  } else if (state.backdrop.aspectRatio === '4:3') {
    finalW = Math.max(finalW, Math.round(finalH * (4 / 3)));
    finalH = Math.round(finalW * (3 / 4));
  } else if (state.backdrop.aspectRatio === '1:1') {
    const maxSide = Math.max(finalW, finalH);
    finalW = maxSide;
    finalH = maxSide;
  } else if (state.backdrop.aspectRatio === 'twitter-post') {
    finalW = Math.max(finalW, 1200);
    finalH = Math.round(finalW * (675 / 1200));
  } else if (state.backdrop.aspectRatio === 'dribbble-shot') {
    finalW = Math.max(finalW, 1600);
    finalH = Math.round(finalW * (1200 / 1600));
  }

  // Final Master Canvas
  const masterCanvas = document.createElement('canvas');
  masterCanvas.width = finalW;
  masterCanvas.height = finalH;
  const mctx = masterCanvas.getContext('2d');
  if (!mctx) throw new Error('Master Canvas Context failed');

  // 5. Render Backdrop
  if (state.backdrop.type === 'solid') {
    mctx.fillStyle = state.backdrop.solidColor;
    mctx.fillRect(0, 0, finalW, finalH);
  } else if (state.backdrop.type === 'transparent') {
    mctx.clearRect(0, 0, finalW, finalH);
  } else if (state.backdrop.type === 'blurred-wallpaper') {
    mctx.save();
    mctx.filter = `blur(${state.backdrop.blurWallpaperAmount || 30}px) brightness(0.7)`;
    const bgScale = Math.max(finalW / rawW, finalH / rawH) * 1.2;
    const bw = rawW * bgScale;
    const bh = rawH * bgScale;
    mctx.drawImage(sourceImg, (finalW - bw) / 2, (finalH - bh) / 2, bw, bh);
    mctx.restore();
  } else {
    // Gradient / Mesh Backdrop
    const preset = BACKDROP_GRADIENTS.find((g) => g.id === state.backdrop.gradientPreset) || BACKDROP_GRADIENTS[0];
    const angleRad = (preset.angle * Math.PI) / 180;
    const x0 = finalW / 2 - (Math.cos(angleRad) * finalW) / 2;
    const y0 = finalH / 2 - (Math.sin(angleRad) * finalH) / 2;
    const x1 = finalW / 2 + (Math.cos(angleRad) * finalW) / 2;
    const y1 = finalH / 2 + (Math.sin(angleRad) * finalH) / 2;

    const bgGrad = mctx.createLinearGradient(x0, y0, x1, y1);
    preset.colors.forEach((color, i) => {
      bgGrad.addColorStop(i / (preset.colors.length - 1), color);
    });

    mctx.fillStyle = bgGrad;
    mctx.fillRect(0, 0, finalW, finalH);

    // Subtle ambient soft lighting overlay
    const radial = mctx.createRadialGradient(finalW / 2, finalH / 2, 50, finalW / 2, finalH / 2, finalW * 0.6);
    radial.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    mctx.fillStyle = radial;
    mctx.fillRect(0, 0, finalW, finalH);
  }

  // 6. Draw Multi-Layer 3D Shadow and Position Framed Device
  const posX = (finalW - framedW) / 2;
  const posY = (finalH - framedH) / 2;

  mctx.save();

  if (state.shadow.enabled) {
    mctx.shadowColor = `rgba(0, 0, 0, ${state.shadow.opacity / 100})`;
    mctx.shadowBlur = state.shadow.blur;
    mctx.shadowOffsetY = state.shadow.offsetY;
    mctx.shadowOffsetX = state.shadow.offsetX;
  }

  // Draw framed canvas onto master canvas
  mctx.drawImage(framedCanvas, posX, posY, framedW, framedH);

  mctx.restore();

  // Convert to Blob & URL
  const blob: Blob = await new Promise((res) => masterCanvas.toBlob((b) => res(b!), 'image/png', 0.95));
  const blobUrl = URL.createObjectURL(blob);

  return { canvas: masterCanvas, blobUrl, sizeBytes: blob.size };
}
