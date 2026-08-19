import {
  DesignElementItem,
  DesignElementType,
  DesignShapeType,
  DesignLineStyle,
  DesignLineEnd,
  DesignStickerType,
  DesignIconType,
  DesignIllustrationType,
  DesignFrameType,
  DesignGridType,
  DesignPatternType,
  DesignTemplate,
  TypographyGradient,
} from '../types/editor';
import { createFillGradient } from './typographyEngine';

// Default Factory for creating a Design Element
export function createDefaultDesignElement(
  type: DesignElementType = 'shape',
  extra?: Partial<DesignElementItem>
): DesignElementItem {
  const id = `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const base: DesignElementItem = {
    id,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Layer`,
    type,
    visible: true,
    locked: false,
    opacity: 100,
    blendMode: 'normal',

    position: { x: 0.5, y: 0.5 },
    width: 0.25,
    height: 0.25,
    rotation: 0,
    flipH: false,
    flipV: false,

    fillType: 'solid',
    fillColor: '#6366f1',
    fillGradient: {
      type: 'linear',
      angle: 90,
      stops: [
        { offset: 0, color: '#ec4899' },
        { offset: 1, color: '#8b5cf6' },
      ],
    },

    strokeEnabled: false,
    strokeColor: '#ffffff',
    strokeWidth: 3,
    strokeDash: 'solid',

    shadowEnabled: true,
    shadowColor: 'rgba(0,0,0,0.35)',
    shadowBlur: 14,
    shadowOffsetX: 0,
    shadowOffsetY: 4,

    glowEnabled: false,
    glowColor: '#00f2fe',
    glowRadius: 20,

    shapeType: 'rounded-rect',
    cornerRadius: 16,
    starPoints: 5,
    polygonSides: 6,

    lineStyle: 'solid',
    lineStart: 'none',
    lineEnd: 'arrow',
    curvature: 0,

    stickerType: 'sale-50',
    iconType: 'sparkles',
    illustrationType: 'botanical-monstera',
    frameType: 'polaroid-classic',
    gridType: 'grid-4-quad',
    patternType: 'polka-dots',
    patternScale: 1,
    patternColor: 'rgba(255,255,255,0.2)',
    patternBgColor: 'transparent',
    ...extra,
  };

  return base;
}

// -------------------------------------------------------------
// Procedural Canvas Path Renderers for Shapes
// -------------------------------------------------------------
export function drawShapePath(
  ctx: CanvasRenderingContext2D,
  shapeType: DesignShapeType,
  w: number,
  h: number,
  cornerRadius = 16,
  starPoints = 5,
  polygonSides = 6
) {
  const halfW = w / 2;
  const halfH = h / 2;

  ctx.beginPath();

  switch (shapeType) {
    case 'rectangle':
      ctx.rect(-halfW, -halfH, w, h);
      break;

    case 'rounded-rect':
      ctx.roundRect(-halfW, -halfH, w, h, Math.min(cornerRadius, Math.min(halfW, halfH)));
      break;

    case 'circle':
    case 'ellipse':
      ctx.ellipse(0, 0, halfW, halfH, 0, 0, Math.PI * 2);
      break;

    case 'triangle':
      ctx.moveTo(0, -halfH);
      ctx.lineTo(halfW, halfH);
      ctx.lineTo(-halfW, halfH);
      ctx.closePath();
      break;

    case 'heart': {
      const topY = -halfH * 0.4;
      ctx.moveTo(0, halfH * 0.85);
      ctx.bezierCurveTo(-halfW * 1.1, topY * 0.5, -halfW * 0.9, -halfH, 0, -halfH * 0.4);
      ctx.bezierCurveTo(halfW * 0.9, -halfH, halfW * 1.1, topY * 0.5, 0, halfH * 0.85);
      ctx.closePath();
      break;
    }

    case 'diamond':
      ctx.moveTo(0, -halfH);
      ctx.lineTo(halfW, 0);
      ctx.lineTo(0, halfH);
      ctx.lineTo(-halfW, 0);
      ctx.closePath();
      break;

    case 'shield': {
      ctx.moveTo(-halfW, -halfH);
      ctx.lineTo(halfW, -halfH);
      ctx.lineTo(halfW, 0);
      ctx.bezierCurveTo(halfW, halfH * 0.7, 0, halfH, 0, halfH);
      ctx.bezierCurveTo(0, halfH, -halfW, halfH * 0.7, -halfW, 0);
      ctx.closePath();
      break;
    }

    case 'cloud': {
      const r = halfW * 0.35;
      ctx.arc(-halfW * 0.4, 0, r * 0.8, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(-halfW * 0.1, -halfH * 0.35, r * 0.9, Math.PI * 1.0, Math.PI * 1.9);
      ctx.arc(halfW * 0.35, -halfH * 0.1, r * 0.85, Math.PI * 1.4, Math.PI * 0.3);
      ctx.arc(halfW * 0.25, halfH * 0.35, r * 0.7, Math.PI * 1.9, Math.PI * 0.7);
      ctx.closePath();
      break;
    }

    case 'speech-bubble': {
      const r = 12;
      const bH = h * 0.8;
      const bHalfH = bH / 2;
      ctx.roundRect(-halfW, -halfH, w, bH, r);
      // Tail
      ctx.moveTo(-halfW * 0.4, -halfH + bH);
      ctx.lineTo(-halfW * 0.6, halfH);
      ctx.lineTo(-halfW * 0.15, -halfH + bH);
      break;
    }

    case 'thought-bubble': {
      ctx.ellipse(0, -halfH * 0.2, halfW * 0.9, halfH * 0.6, 0, 0, Math.PI * 2);
      break;
    }

    case 'star-4':
    case 'star-5':
    case 'star-6':
    case 'star-8': {
      const points =
        shapeType === 'star-4' ? 4 : shapeType === 'star-6' ? 6 : shapeType === 'star-8' ? 8 : (starPoints || 5);
      const outerR = Math.min(halfW, halfH);
      const innerR = outerR * (points === 4 ? 0.35 : 0.45);
      const step = Math.PI / points;

      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = i * step - Math.PI / 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }

    case 'polygon-6':
    case 'polygon-8': {
      const sides = shapeType === 'polygon-8' ? 8 : (polygonSides || 6);
      const rad = Math.min(halfW, halfH);
      const step = (Math.PI * 2) / sides;
      for (let i = 0; i < sides; i++) {
        const a = i * step - Math.PI / 2;
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }

    case 'sparkle': {
      // 4-point curved flare
      ctx.moveTo(0, -halfH);
      ctx.quadraticCurveTo(0, 0, halfW, 0);
      ctx.quadraticCurveTo(0, 0, 0, halfH);
      ctx.quadraticCurveTo(0, 0, -halfW, 0);
      ctx.quadraticCurveTo(0, 0, 0, -halfH);
      ctx.closePath();
      break;
    }

    case 'sunburst': {
      const rays = 16;
      const outerR = Math.min(halfW, halfH);
      const innerR = outerR * 0.55;
      const step = (Math.PI * 2) / (rays * 2);
      for (let i = 0; i < rays * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = i * step;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }

    case 'flower': {
      const petals = 6;
      const r = Math.min(halfW, halfH) * 0.5;
      for (let i = 0; i < petals; i++) {
        const a = (i * Math.PI * 2) / petals;
        const cx = Math.cos(a) * (r * 0.85);
        const cy = Math.sin(a) * (r * 0.85);
        ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
      }
      ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
      break;
    }

    case 'ribbon': {
      ctx.moveTo(-halfW, -halfH * 0.6);
      ctx.lineTo(halfW, -halfH * 0.6);
      ctx.lineTo(halfW * 0.8, 0);
      ctx.lineTo(halfW, halfH * 0.6);
      ctx.lineTo(-halfW, halfH * 0.6);
      ctx.lineTo(-halfW * 0.8, 0);
      ctx.closePath();
      break;
    }

    case 'badge-seal': {
      const points = 24;
      const outerR = Math.min(halfW, halfH);
      const innerR = outerR * 0.88;
      const step = Math.PI / points;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = i * step;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }

    default:
      ctx.rect(-halfW, -halfH, w, h);
      break;
  }
}

// -------------------------------------------------------------
// Procedural Line & Arrow Renderer
// -------------------------------------------------------------
function drawLineAndArrow(
  ctx: CanvasRenderingContext2D,
  element: DesignElementItem,
  w: number,
  h: number
) {
  const halfW = w / 2;
  const curvature = element.curvature || 0;
  const startX = -halfW;
  const endX = halfW;
  const startY = 0;
  const endY = 0;
  const ctrlY = (curvature / 100) * h;

  ctx.save();
  ctx.strokeStyle = element.strokeColor || '#ffffff';
  ctx.lineWidth = element.strokeWidth || 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (element.lineStyle === 'dashed') {
    ctx.setLineDash([12, 8]);
  } else if (element.lineStyle === 'dotted') {
    ctx.setLineDash([3, 6]);
  } else {
    ctx.setLineDash([]);
  }

  // Draw Line Body
  ctx.beginPath();
  if (element.lineStyle === 'wavy') {
    const waves = 5;
    const waveLen = w / waves;
    ctx.moveTo(startX, 0);
    for (let i = 0; i < waves; i++) {
      const segX = startX + (i + 1) * waveLen;
      const midX = startX + (i + 0.5) * waveLen;
      const amp = i % 2 === 0 ? -12 : 12;
      ctx.quadraticCurveTo(midX, amp, segX, 0);
    }
  } else if (element.lineStyle === 'zigzag') {
    const zigs = 8;
    const step = w / zigs;
    ctx.moveTo(startX, 0);
    for (let i = 0; i < zigs; i++) {
      const curX = startX + (i + 0.5) * step;
      const amp = i % 2 === 0 ? -14 : 14;
      ctx.lineTo(curX, amp);
    }
    ctx.lineTo(endX, 0);
  } else if (curvature !== 0) {
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(0, ctrlY, endX, endY);
  } else {
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
  }
  ctx.stroke();

  // Draw Endheads (Arrow, Circle, Diamond)
  const drawCap = (x: number, y: number, angle: number, endType: DesignLineEnd) => {
    if (!endType || endType === 'none') return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.setLineDash([]);
    ctx.fillStyle = element.strokeColor || '#ffffff';

    const sz = Math.max(10, element.strokeWidth * 3.5);

    if (endType === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-sz, -sz * 0.5);
      ctx.lineTo(-sz * 0.7, 0);
      ctx.lineTo(-sz, sz * 0.5);
      ctx.closePath();
      ctx.fill();
    } else if (endType === 'barbed-arrow') {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-sz * 1.2, -sz * 0.6);
      ctx.lineTo(-sz * 0.9, 0);
      ctx.lineTo(-sz * 1.2, sz * 0.6);
      ctx.closePath();
      ctx.fill();
    } else if (endType === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else if (endType === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(0, -sz * 0.5);
      ctx.lineTo(sz * 0.5, 0);
      ctx.lineTo(0, sz * 0.5);
      ctx.lineTo(-sz * 0.5, 0);
      ctx.closePath();
      ctx.fill();
    } else if (endType === 'square') {
      ctx.fillRect(-sz * 0.4, -sz * 0.4, sz * 0.8, sz * 0.8);
    }
    ctx.restore();
  };

  const endAngle = curvature !== 0 ? Math.atan2(endY - ctrlY, endX - 0) : 0;
  const startAngle = curvature !== 0 ? Math.atan2(startY - ctrlY, startX - 0) : Math.PI;

  drawCap(endX, endY, endAngle, element.lineEnd || 'arrow');
  drawCap(startX, startY, startAngle, element.lineStart || 'none');

  ctx.restore();
}

// -------------------------------------------------------------
// Vector Stickers & Badges
// -------------------------------------------------------------
function drawSticker(
  ctx: CanvasRenderingContext2D,
  stickerType: DesignStickerType,
  w: number,
  h: number
) {
  const halfW = w / 2;
  const halfH = h / 2;
  const minDim = Math.min(w, h);

  ctx.save();

  switch (stickerType) {
    case 'sale-50': {
      // High-vibrancy starburst seal
      ctx.fillStyle = '#ff0055';
      drawShapePath(ctx, 'star-8', minDim * 0.95, minDim * 0.95);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Text inside
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${Math.round(minDim * 0.28)}px "Impact", "Inter", sans-serif`;
      ctx.fillText('50%', 0, -minDim * 0.1);
      ctx.font = `800 ${Math.round(minDim * 0.15)}px "Inter", sans-serif`;
      ctx.fillText('OFF', 0, minDim * 0.18);
      break;
    }

    case 'hot-deal': {
      // Flame badge
      const grad = ctx.createLinearGradient(0, -halfH, 0, halfH);
      grad.addColorStop(0, '#ff9900');
      grad.addColorStop(1, '#ff0033');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(-halfW, -halfH, w, h, 14);
      ctx.fill();
      ctx.strokeStyle = '#ffeaa7';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${Math.round(minDim * 0.24)}px "Inter", sans-serif`;
      ctx.fillText('🔥 HOT DEAL', 0, 0);
      break;
    }

    case 'best-seller': {
      // Golden Ribbon Medallion
      const grad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
      grad.addColorStop(0, '#f9ca24');
      grad.addColorStop(0.5, '#f0932b');
      grad.addColorStop(1, '#f9ca24');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, -minDim * 0.08, minDim * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ribbon tails
      ctx.fillStyle = '#eb4d4b';
      ctx.beginPath();
      ctx.moveTo(-minDim * 0.25, minDim * 0.15);
      ctx.lineTo(-minDim * 0.35, minDim * 0.45);
      ctx.lineTo(-minDim * 0.15, minDim * 0.35);
      ctx.lineTo(0, minDim * 0.45);
      ctx.lineTo(minDim * 0.15, minDim * 0.35);
      ctx.lineTo(minDim * 0.35, minDim * 0.45);
      ctx.lineTo(minDim * 0.25, minDim * 0.15);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${Math.round(minDim * 0.18)}px "Inter", sans-serif`;
      ctx.fillText('TOP #1', 0, -minDim * 0.08);
      break;
    }

    case 'verified-badge': {
      // Twitter/IG Blue Badge
      ctx.fillStyle = '#3867d6';
      drawShapePath(ctx, 'badge-seal', minDim * 0.85, minDim * 0.85);
      ctx.fill();

      // White Checkmark
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = minDim * 0.09;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-minDim * 0.18, 0);
      ctx.lineTo(-minDim * 0.04, minDim * 0.14);
      ctx.lineTo(minDim * 0.2, -minDim * 0.12);
      ctx.stroke();
      break;
    }

    case 'retro-smiley': {
      // 90s Acid Smiley
      ctx.fillStyle = '#fed330';
      ctx.beginPath();
      ctx.arc(0, 0, minDim * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = minDim * 0.04;
      ctx.stroke();

      // Oval Eyes
      ctx.fillStyle = '#2d3436';
      ctx.beginPath();
      ctx.ellipse(-minDim * 0.14, -minDim * 0.1, minDim * 0.06, minDim * 0.1, 0, 0, Math.PI * 2);
      ctx.ellipse(minDim * 0.14, -minDim * 0.1, minDim * 0.06, minDim * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Grin
      ctx.beginPath();
      ctx.arc(0, minDim * 0.05, minDim * 0.24, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      break;
    }

    case 'washi-tape-yellow':
    case 'washi-tape-pink':
    case 'washi-tape-grid': {
      // Semi-translucent decorative washi tape strip
      ctx.globalAlpha = 0.85;
      ctx.fillStyle =
        stickerType === 'washi-tape-yellow'
          ? '#f9ca24'
          : stickerType === 'washi-tape-pink'
          ? '#f368e0'
          : '#f5f6fa';

      const tapeH = h * 0.5;
      ctx.fillRect(-halfW, -tapeH / 2, w, tapeH);

      // Jagged / Torn Ends
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(-halfW, -tapeH / 2, 4, tapeH);
      ctx.fillRect(halfW - 4, -tapeH / 2, 4, tapeH);
      break;
    }

    case 'stamp-approved': {
      // Distressed rubber stamp
      ctx.strokeStyle = '#eb3b5a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(-halfW * 0.9, -halfH * 0.6, w * 0.9, h * 0.6, 6);
      ctx.stroke();

      ctx.fillStyle = '#eb3b5a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${Math.round(minDim * 0.22)}px "Courier New", monospace`;
      ctx.fillText('APPROVED', 0, 0);
      break;
    }

    case 'fire-flame': {
      const grad = ctx.createLinearGradient(0, -halfH, 0, halfH);
      grad.addColorStop(0, '#ff3838');
      grad.addColorStop(1, '#ffb8b8');
      ctx.fillStyle = grad;
      ctx.font = `${Math.round(minDim * 0.8)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔥', 0, 0);
      break;
    }

    case 'crown-gold': {
      ctx.font = `${Math.round(minDim * 0.8)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👑', 0, 0);
      break;
    }

    case 'heart-eyes': {
      ctx.font = `${Math.round(minDim * 0.8)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('😍', 0, 0);
      break;
    }

    case '100-percent': {
      ctx.fillStyle = '#ff3838';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${Math.round(minDim * 0.35)}px "Inter", sans-serif`;
      ctx.fillText('100', 0, -minDim * 0.05);
      ctx.fillRect(-halfW * 0.5, minDim * 0.18, w * 0.5, 4);
      break;
    }

    default: {
      // Generic Holographic Sparkle badge
      ctx.fillStyle = '#8854d0';
      drawShapePath(ctx, 'sparkle', minDim * 0.8, minDim * 0.8);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

// -------------------------------------------------------------
// Vector Icons
// -------------------------------------------------------------
function drawVectorIcon(
  ctx: CanvasRenderingContext2D,
  iconType: DesignIconType,
  w: number,
  h: number,
  color: string,
  strokeWidth = 3
) {
  const halfW = w / 2;
  const halfH = h / 2;
  const sz = Math.min(w, h);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (iconType) {
    case 'camera':
      ctx.beginPath();
      ctx.roundRect(-halfW * 0.7, -halfH * 0.4, w * 0.7, h * 0.6, 6);
      ctx.moveTo(-halfW * 0.3, -halfH * 0.4);
      ctx.lineTo(-halfW * 0.15, -halfH * 0.6);
      ctx.lineTo(halfW * 0.15, -halfH * 0.6);
      ctx.lineTo(halfW * 0.3, -halfH * 0.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -halfH * 0.1, sz * 0.15, 0, Math.PI * 2);
      ctx.stroke();
      break;

    case 'heart':
      drawShapePath(ctx, 'heart', sz * 0.8, sz * 0.8);
      ctx.fill();
      break;

    case 'star':
      drawShapePath(ctx, 'star-5', sz * 0.8, sz * 0.8);
      ctx.fill();
      break;

    case 'sparkles':
      drawShapePath(ctx, 'sparkle', sz * 0.6, sz * 0.6);
      ctx.fill();
      ctx.save();
      ctx.translate(halfW * 0.4, -halfH * 0.4);
      drawShapePath(ctx, 'sparkle', sz * 0.3, sz * 0.3);
      ctx.fill();
      ctx.restore();
      break;

    case 'flame':
      ctx.beginPath();
      ctx.moveTo(0, -halfH * 0.8);
      ctx.bezierCurveTo(halfW * 0.6, -halfH * 0.2, halfW * 0.8, halfH * 0.5, 0, halfH * 0.8);
      ctx.bezierCurveTo(-halfW * 0.8, halfH * 0.5, -halfW * 0.6, -halfH * 0.2, 0, -halfH * 0.8);
      ctx.fill();
      break;

    case 'crown':
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.7, halfH * 0.4);
      ctx.lineTo(-halfW * 0.7, -halfH * 0.2);
      ctx.lineTo(-halfW * 0.3, 0);
      ctx.lineTo(0, -halfH * 0.4);
      ctx.lineTo(halfW * 0.3, 0);
      ctx.lineTo(halfW * 0.7, -halfH * 0.2);
      ctx.lineTo(halfW * 0.7, halfH * 0.4);
      ctx.closePath();
      ctx.fill();
      break;

    case 'music':
      ctx.beginPath();
      ctx.arc(-halfW * 0.3, halfH * 0.3, sz * 0.15, 0, Math.PI * 2);
      ctx.arc(halfW * 0.3, halfH * 0.1, sz * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.15, halfH * 0.3);
      ctx.lineTo(-halfW * 0.15, -halfH * 0.4);
      ctx.lineTo(halfW * 0.45, -halfH * 0.6);
      ctx.lineTo(halfW * 0.45, halfH * 0.1);
      ctx.stroke();
      break;

    case 'coffee':
      ctx.beginPath();
      ctx.roundRect(-halfW * 0.5, -halfH * 0.2, w * 0.5, h * 0.5, [0, 0, 10, 10]);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(halfW * 0.25, 0, sz * 0.12, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      break;

    case 'map-pin':
      ctx.beginPath();
      ctx.arc(0, -halfH * 0.2, sz * 0.3, Math.PI, 0);
      ctx.lineTo(0, halfH * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -halfH * 0.2, sz * 0.1, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'shopping-bag':
      ctx.beginPath();
      ctx.roundRect(-halfW * 0.6, -halfH * 0.2, w * 0.6, h * 0.6, 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -halfH * 0.2, sz * 0.18, Math.PI, 0);
      ctx.stroke();
      break;

    case 'zap':
      ctx.beginPath();
      ctx.moveTo(halfW * 0.1, -halfH * 0.7);
      ctx.lineTo(-halfW * 0.5, 0);
      ctx.lineTo(0, 0);
      ctx.lineTo(-halfW * 0.1, halfH * 0.7);
      ctx.lineTo(halfW * 0.5, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      break;

    case 'sun':
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.2, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI * 2) / 8;
        ctx.moveTo(Math.cos(a) * sz * 0.28, Math.sin(a) * sz * 0.28);
        ctx.lineTo(Math.cos(a) * sz * 0.42, Math.sin(a) * sz * 0.42);
      }
      ctx.stroke();
      break;

    default:
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.35, 0, Math.PI * 2);
      ctx.fill();
      break;
  }

  ctx.restore();
}

// -------------------------------------------------------------
// Vector Illustrations & Artistic Motifs
// -------------------------------------------------------------
function drawIllustration(
  ctx: CanvasRenderingContext2D,
  illustrationType: DesignIllustrationType,
  w: number,
  h: number,
  color: string
) {
  const halfW = w / 2;
  const halfH = h / 2;
  const sz = Math.min(w, h);

  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  switch (illustrationType) {
    case 'botanical-monstera': {
      // Monstera leaf with natural cutouts
      ctx.beginPath();
      ctx.moveTo(0, halfH * 0.85);
      ctx.bezierCurveTo(-halfW * 0.9, halfH * 0.4, -halfW * 0.9, -halfH * 0.6, 0, -halfH * 0.85);
      ctx.bezierCurveTo(halfW * 0.9, -halfH * 0.6, halfW * 0.9, halfH * 0.4, 0, halfH * 0.85);
      ctx.fill();

      // Leaf cuts
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, halfH * 0.8);
      ctx.lineTo(0, -halfH * 0.7);
      ctx.stroke();
      break;
    }

    case 'botanical-palm': {
      // Palm frond spray
      for (let i = -4; i <= 4; i++) {
        const a = (i * Math.PI) / 12 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(0, halfH * 0.6);
        ctx.quadraticCurveTo(
          Math.cos(a) * halfW * 0.5,
          Math.sin(a) * halfH * 0.5,
          Math.cos(a) * halfW * 0.9,
          Math.sin(a) * halfH * 0.9
        );
        ctx.stroke();
      }
      break;
    }

    case 'abstract-organic-blob-1':
    case 'abstract-organic-blob-2':
    case 'abstract-organic-blob-3': {
      // Modern smooth organic liquid blob
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.7, -halfH * 0.4);
      ctx.bezierCurveTo(-halfW * 0.9, halfH * 0.1, -halfW * 0.4, halfH * 0.85, 0, halfH * 0.7);
      ctx.bezierCurveTo(halfW * 0.6, halfH * 0.65, halfW * 0.95, 0, halfW * 0.6, -halfH * 0.6);
      ctx.bezierCurveTo(halfW * 0.3, -halfH * 0.95, -halfW * 0.5, -halfH * 0.8, -halfW * 0.7, -halfH * 0.4);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'sunburst-retro': {
      // Retro radial rays
      ctx.lineWidth = 2;
      for (let i = 0; i < 24; i++) {
        const a = (i * Math.PI * 2) / 24;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * halfW, Math.sin(a) * halfH);
        ctx.stroke();
      }
      break;
    }

    case 'vintage-flourish-corner': {
      // Elegant baroque corner scroll
      ctx.beginPath();
      ctx.arc(-halfW * 0.3, -halfH * 0.3, sz * 0.3, 0, Math.PI * 1.5);
      ctx.bezierCurveTo(0, -halfH * 0.8, halfW * 0.6, -halfH * 0.8, halfW * 0.8, -halfH * 0.6);
      ctx.stroke();
      break;
    }

    case 'circuit-cyberpunk': {
      // Sci-fi tech PCB lines
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.8, -halfH * 0.6);
      ctx.lineTo(-halfW * 0.2, -halfH * 0.6);
      ctx.lineTo(0, -halfH * 0.2);
      ctx.lineTo(halfW * 0.6, -halfH * 0.2);
      ctx.lineTo(halfW * 0.8, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(halfW * 0.8, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    default:
      drawShapePath(ctx, 'circle', sz * 0.7, sz * 0.7);
      ctx.fill();
      break;
  }

  ctx.restore();
}

// -------------------------------------------------------------
// Photo Frames & Cutouts
// -------------------------------------------------------------
function drawFrame(
  ctx: CanvasRenderingContext2D,
  element: DesignElementItem,
  w: number,
  h: number,
  basePhotoCanvas?: HTMLCanvasElement | null,
  canvasWidth = 1000,
  canvasHeight = 1000,
  posX = 500,
  posY = 500
) {
  const frameType = element.frameType || 'polaroid-classic';
  const halfW = w / 2;
  const halfH = h / 2;
  const pad = element.framePadding || 18;

  ctx.save();

  switch (frameType) {
    case 'polaroid-classic': {
      // White Polaroid card with photo in top portion
      ctx.fillStyle = '#fcfcfc';
      ctx.beginPath();
      ctx.roundRect(-halfW, -halfH, w, h, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Photo Cutout bounds
      const photoW = w - pad * 2;
      const photoH = h - pad * 2 - h * 0.2; // Extra space at bottom for text
      const photoX = -halfW + pad;
      const photoY = -halfH + pad;

      ctx.save();
      ctx.beginPath();
      ctx.rect(photoX, photoY, photoW, photoH);
      ctx.clip();

      if (basePhotoCanvas) {
        ctx.drawImage(
          basePhotoCanvas,
          0,
          0,
          basePhotoCanvas.width,
          basePhotoCanvas.height,
          photoX,
          photoY,
          photoW,
          photoH
        );
      } else {
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(photoX, photoY, photoW, photoH);
      }
      ctx.restore();
      break;
    }

    case 'film-strip-slide': {
      // 35mm Slide frame with top/bottom sprocket perforations
      ctx.fillStyle = '#1e272e';
      ctx.beginPath();
      ctx.roundRect(-halfW, -halfH, w, h, 8);
      ctx.fill();

      // Sprockets
      const sprockets = 6;
      const spW = w * 0.08;
      const spH = h * 0.08;
      ctx.fillStyle = '#000000';
      for (let i = 0; i < sprockets; i++) {
        const sx = -halfW + (i + 0.5) * (w / sprockets) - spW / 2;
        ctx.roundRect(sx, -halfH + 6, spW, spH, 2);
        ctx.roundRect(sx, halfH - 6 - spH, spW, spH, 2);
      }
      ctx.fill();

      // Center Photo
      const pW = w * 0.82;
      const pH = h * 0.62;
      ctx.save();
      ctx.beginPath();
      ctx.rect(-pW / 2, -pH / 2, pW, pH);
      ctx.clip();
      if (basePhotoCanvas) {
        ctx.drawImage(basePhotoCanvas, 0, 0, basePhotoCanvas.width, basePhotoCanvas.height, -pW / 2, -pH / 2, pW, pH);
      }
      ctx.restore();
      break;
    }

    case 'postage-stamp': {
      // Scalloped postage stamp edges
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-halfW, -halfH, w, h);

      // Scallops
      const scallops = 10;
      const r = 6;
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for (let i = 0; i <= scallops; i++) {
        const px = -halfW + (i * w) / scallops;
        ctx.beginPath();
        ctx.arc(px, -halfH, r, 0, Math.PI * 2);
        ctx.arc(px, halfH, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Inner Photo
      const ipW = w - pad * 2;
      const ipH = h - pad * 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(-ipW / 2, -ipH / 2, ipW, ipH);
      ctx.clip();
      if (basePhotoCanvas) {
        ctx.drawImage(basePhotoCanvas, 0, 0, basePhotoCanvas.width, basePhotoCanvas.height, -ipW / 2, -ipH / 2, ipW, ipH);
      }
      ctx.restore();
      break;
    }

    case 'arch-window': {
      // Aesthetic Arch cutout
      ctx.beginPath();
      ctx.arc(0, -halfH + halfW, halfW, Math.PI, 0);
      ctx.lineTo(halfW, halfH);
      ctx.lineTo(-halfW, halfH);
      ctx.closePath();

      ctx.save();
      ctx.clip();
      if (basePhotoCanvas) {
        ctx.drawImage(basePhotoCanvas, 0, 0, basePhotoCanvas.width, basePhotoCanvas.height, -halfW, -halfH, w, h);
      }
      ctx.restore();

      ctx.strokeStyle = element.strokeColor || '#ffffff';
      ctx.lineWidth = element.strokeWidth || 4;
      ctx.stroke();
      break;
    }

    case 'circle-badge-frame': {
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(halfW, halfH), 0, Math.PI * 2);
      ctx.save();
      ctx.clip();
      if (basePhotoCanvas) {
        ctx.drawImage(basePhotoCanvas, 0, 0, basePhotoCanvas.width, basePhotoCanvas.height, -halfW, -halfH, w, h);
      }
      ctx.restore();

      ctx.strokeStyle = element.strokeColor || '#d4af37';
      ctx.lineWidth = element.strokeWidth || 6;
      ctx.stroke();
      break;
    }

    case 'washi-tape-photo': {
      // Bordered photo with tape on top corners
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-halfW, -halfH, w, h);

      const pW = w - 16;
      const pH = h - 16;
      ctx.save();
      ctx.beginPath();
      ctx.rect(-pW / 2, -pH / 2, pW, pH);
      ctx.clip();
      if (basePhotoCanvas) {
        ctx.drawImage(basePhotoCanvas, 0, 0, basePhotoCanvas.width, basePhotoCanvas.height, -pW / 2, -pH / 2, pW, pH);
      }
      ctx.restore();

      // Top corner tape strips
      ctx.fillStyle = 'rgba(255, 234, 167, 0.9)';
      ctx.save();
      ctx.translate(-halfW + 12, -halfH);
      ctx.rotate(-Math.PI / 6);
      ctx.fillRect(-20, -8, 40, 16);
      ctx.restore();

      ctx.save();
      ctx.translate(halfW - 12, -halfH);
      ctx.rotate(Math.PI / 6);
      ctx.fillRect(-20, -8, 40, 16);
      ctx.restore();
      break;
    }

    default: {
      ctx.strokeStyle = element.strokeColor || '#ffffff';
      ctx.lineWidth = element.strokeWidth || 8;
      ctx.strokeRect(-halfW, -halfH, w, h);
      break;
    }
  }

  ctx.restore();
}

// -------------------------------------------------------------
// Seamless Patterns Renderer
// -------------------------------------------------------------
export function drawPatternToCanvas(
  ctx: CanvasRenderingContext2D,
  patternType: DesignPatternType,
  w: number,
  h: number,
  scale: number = 1,
  color: string = 'rgba(255,255,255,0.25)',
  bgColor: string = 'transparent'
) {
  ctx.save();

  if (bgColor && bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);
  }

  const pCanvas = document.createElement('canvas');
  const pCtx = pCanvas.getContext('2d');
  if (!pCtx) {
    ctx.restore();
    return;
  }

  const tileSize = Math.max(12, Math.round(32 * scale));
  pCanvas.width = tileSize;
  pCanvas.height = tileSize;

  pCtx.fillStyle = color;
  pCtx.strokeStyle = color;
  pCtx.lineWidth = Math.max(1, 2 * scale);

  switch (patternType) {
    case 'polka-dots':
      pCtx.beginPath();
      pCtx.arc(tileSize / 2, tileSize / 2, tileSize * 0.18, 0, Math.PI * 2);
      pCtx.fill();
      break;

    case 'grid-graph':
      pCtx.strokeRect(0, 0, tileSize, tileSize);
      break;

    case 'diagonal-stripes':
      pCtx.beginPath();
      pCtx.moveTo(0, tileSize);
      pCtx.lineTo(tileSize, 0);
      pCtx.stroke();
      break;

    case 'memphis-geo':
      pCtx.fillRect(2, 2, tileSize * 0.25, tileSize * 0.25);
      pCtx.beginPath();
      pCtx.arc(tileSize * 0.75, tileSize * 0.75, tileSize * 0.15, 0, Math.PI * 2);
      pCtx.fill();
      break;

    case 'topographic-contours':
      pCtx.beginPath();
      pCtx.arc(tileSize / 2, tileSize / 2, tileSize * 0.4, 0, Math.PI * 2);
      pCtx.stroke();
      pCtx.beginPath();
      pCtx.arc(tileSize / 2, tileSize / 2, tileSize * 0.2, 0, Math.PI * 2);
      pCtx.stroke();
      break;

    case 'checkerboard':
      pCtx.fillRect(0, 0, tileSize / 2, tileSize / 2);
      pCtx.fillRect(tileSize / 2, tileSize / 2, tileSize / 2, tileSize / 2);
      break;

    case 'wavy-ripples':
      pCtx.beginPath();
      pCtx.moveTo(0, tileSize / 2);
      pCtx.quadraticCurveTo(tileSize * 0.25, 0, tileSize * 0.5, tileSize / 2);
      pCtx.quadraticCurveTo(tileSize * 0.75, tileSize, tileSize, tileSize / 2);
      pCtx.stroke();
      break;

    default:
      pCtx.strokeRect(0, 0, tileSize, tileSize);
      break;
  }

  const pat = ctx.createPattern(pCanvas, 'repeat');
  if (pat) {
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();
}

function drawPatternOverlay(
  ctx: CanvasRenderingContext2D,
  element: DesignElementItem,
  w: number,
  h: number
) {
  const patternType = element.patternType || 'polka-dots';
  const scale = element.patternScale || 1;
  const color = element.patternColor || 'rgba(255,255,255,0.25)';
  const bgColor = element.patternBgColor || 'transparent';
  const halfW = w / 2;
  const halfH = h / 2;

  ctx.save();
  ctx.translate(-halfW, -halfH);
  drawPatternToCanvas(ctx, patternType, w, h, scale, color, bgColor);
  ctx.restore();
}

// -------------------------------------------------------------
// Core Design Element Canvas Dispatcher
// -------------------------------------------------------------
export function renderDesignElementToCanvas(
  ctx: CanvasRenderingContext2D,
  element: DesignElementItem,
  canvasWidth: number,
  canvasHeight: number,
  basePhotoCanvas?: HTMLCanvasElement | null
) {
  if (!element.visible) return;

  const posX = element.position.x * canvasWidth;
  const posY = element.position.y * canvasHeight;
  const width = Math.max(10, element.width * canvasWidth);
  const height = Math.max(10, element.height * canvasHeight);

  ctx.save();

  // Spatial Translation & Transforms
  ctx.translate(posX, posY);
  if (element.rotation) {
    ctx.rotate((element.rotation * Math.PI) / 180);
  }
  if (element.flipH || element.flipV) {
    ctx.scale(element.flipH ? -1 : 1, element.flipV ? -1 : 1);
  }

  ctx.globalAlpha = (element.opacity ?? 100) / 100;
  if (element.blendMode && element.blendMode !== 'normal') {
    ctx.globalCompositeOperation = element.blendMode as any;
  }

  // Shadow & Glow
  if (element.glowEnabled && element.glowRadius > 0) {
    ctx.shadowColor = element.glowColor || '#00f2fe';
    ctx.shadowBlur = element.glowRadius;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  } else if (element.shadowEnabled) {
    ctx.shadowColor = element.shadowColor || 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = element.shadowBlur ?? 14;
    ctx.shadowOffsetX = element.shadowOffsetX ?? 0;
    ctx.shadowOffsetY = element.shadowOffsetY ?? 4;
  }

  // Prepare Fill Style
  let fillStyle: string | CanvasGradient = element.fillColor || '#6366f1';
  if (element.fillType === 'gradient' && element.fillGradient?.stops?.length) {
    fillStyle = createFillGradient(ctx, element.fillGradient, {
      x: -width / 2,
      y: -height / 2,
      width,
      height,
    });
  }

  // Dispatch by Element Type
  switch (element.type) {
    case 'shape': {
      drawShapePath(
        ctx,
        element.shapeType || 'rectangle',
        width,
        height,
        element.cornerRadius,
        element.starPoints,
        element.polygonSides
      );

      if (element.fillType !== 'none') {
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }

      if (element.strokeEnabled && element.strokeWidth > 0) {
        ctx.strokeStyle = element.strokeColor || '#ffffff';
        ctx.lineWidth = element.strokeWidth;
        if (element.strokeDash === 'dashed') ctx.setLineDash([10, 6]);
        else if (element.strokeDash === 'dotted') ctx.setLineDash([3, 5]);
        ctx.stroke();
      }
      break;
    }

    case 'line':
    case 'arrow': {
      drawLineAndArrow(ctx, element, width, height);
      break;
    }

    case 'sticker': {
      drawSticker(ctx, element.stickerType || 'sale-50', width, height);
      break;
    }

    case 'icon': {
      drawVectorIcon(ctx, element.iconType || 'sparkles', width, height, element.fillColor || '#ffffff', element.strokeWidth || 3);
      break;
    }

    case 'illustration': {
      drawIllustration(ctx, element.illustrationType || 'botanical-monstera', width, height, element.fillColor || '#ffffff');
      break;
    }

    case 'frame': {
      drawFrame(ctx, element, width, height, basePhotoCanvas, canvasWidth, canvasHeight, posX, posY);
      break;
    }

    case 'pattern': {
      drawPatternOverlay(ctx, element, width, height);
      break;
    }

    case 'gradient-overlay': {
      ctx.fillStyle = fillStyle;
      ctx.fillRect(-width / 2, -height / 2, width, height);
      break;
    }

    default:
      break;
  }

  ctx.restore();
}

// -------------------------------------------------------------
// Composite Stack of All Design Elements
// -------------------------------------------------------------
export function compositeDesignStack(
  ctx: CanvasRenderingContext2D,
  elements: DesignElementItem[],
  width: number,
  height: number,
  basePhotoCanvas?: HTMLCanvasElement | null
) {
  if (!elements || elements.length === 0) return;

  elements.forEach((element) => {
    if (element.visible) {
      renderDesignElementToCanvas(ctx, element, width, height, basePhotoCanvas);
    }
  });
}

// -------------------------------------------------------------
// 1-Click Canva Design Templates Directory
// -------------------------------------------------------------
export const CANVA_TEMPLATES: DesignTemplate[] = [
  {
    id: 'tmpl-promo-sale',
    name: 'Flash Sale Promo Card',
    category: 'Marketing',
    aspectRatio: '1:1',
    description: 'Vibrant marketing banner with discount sticker, geometric frame, and gold ribbons.',
    palette: ['#ff0055', '#ffaa00', '#1a1a2e', '#ffffff'],
    elements: [
      createDefaultDesignElement('pattern', {
        name: 'Background Polka Dots',
        position: { x: 0.5, y: 0.5 },
        width: 1.0,
        height: 1.0,
        patternType: 'polka-dots',
        patternColor: 'rgba(255,255,255,0.08)',
        patternScale: 1.2,
      }),
      createDefaultDesignElement('shape', {
        name: 'Top Header Banner',
        position: { x: 0.5, y: 0.15 },
        width: 0.85,
        height: 0.12,
        shapeType: 'rounded-rect',
        cornerRadius: 14,
        fillType: 'gradient',
        fillGradient: {
          type: 'linear',
          angle: 90,
          stops: [
            { offset: 0, color: '#ff0055' },
            { offset: 1, color: '#7928ca' },
          ],
        },
      }),
      createDefaultDesignElement('sticker', {
        name: '50% Off Seal',
        position: { x: 0.82, y: 0.22 },
        width: 0.22,
        height: 0.22,
        rotation: 15,
        stickerType: 'sale-50',
      }),
      createDefaultDesignElement('sticker', {
        name: 'Hot Deal Badge',
        position: { x: 0.2, y: 0.85 },
        width: 0.32,
        height: 0.12,
        stickerType: 'hot-deal',
      }),
    ],
  },
  {
    id: 'tmpl-vintage-polaroid',
    name: 'Aesthetic Polaroid & Tape',
    category: 'Vintage',
    aspectRatio: '1:1',
    description: 'Nostalgic white Polaroid frame held with yellow washi tape and botanical monstera foliage.',
    palette: ['#f8f9fa', '#f9ca24', '#2d3436', '#6ab04c'],
    elements: [
      createDefaultDesignElement('frame', {
        name: 'Classic Polaroid Card',
        position: { x: 0.5, y: 0.5 },
        width: 0.72,
        height: 0.82,
        rotation: -2,
        frameType: 'polaroid-classic',
      }),
      createDefaultDesignElement('sticker', {
        name: 'Yellow Washi Tape Top',
        position: { x: 0.5, y: 0.11 },
        width: 0.35,
        height: 0.08,
        rotation: 4,
        stickerType: 'washi-tape-yellow',
      }),
      createDefaultDesignElement('illustration', {
        name: 'Botanical Monstera Corner',
        position: { x: 0.85, y: 0.82 },
        width: 0.28,
        height: 0.28,
        fillColor: '#6ab04c',
        illustrationType: 'botanical-monstera',
      }),
      createDefaultDesignElement('sticker', {
        name: 'Approved Stamp',
        position: { x: 0.28, y: 0.8 },
        width: 0.25,
        height: 0.12,
        rotation: -12,
        stickerType: 'stamp-approved',
      }),
    ],
  },
  {
    id: 'tmpl-cyberpunk-neon',
    name: 'Cyberpunk Neon Matrix',
    category: 'Aesthetic & Art',
    aspectRatio: '1:1',
    description: 'High-tech neon cyan and magenta cyber frame with circuit board pathways and glow starbursts.',
    palette: ['#00f2fe', '#f72585', '#0f0c29', '#ffffff'],
    elements: [
      createDefaultDesignElement('pattern', {
        name: 'Cyber Grid Pattern',
        position: { x: 0.5, y: 0.5 },
        width: 1.0,
        height: 1.0,
        patternType: 'grid-graph',
        patternColor: 'rgba(0, 242, 254, 0.15)',
      }),
      createDefaultDesignElement('shape', {
        name: 'Neon Border Frame',
        position: { x: 0.5, y: 0.5 },
        width: 0.92,
        height: 0.92,
        shapeType: 'rectangle',
        fillType: 'none',
        strokeEnabled: true,
        strokeColor: '#00f2fe',
        strokeWidth: 4,
        glowEnabled: true,
        glowColor: '#00f2fe',
        glowRadius: 24,
      }),
      createDefaultDesignElement('illustration', {
        name: 'PCB Tech Circuits',
        position: { x: 0.2, y: 0.2 },
        width: 0.35,
        height: 0.25,
        fillColor: '#f72585',
        illustrationType: 'circuit-cyberpunk',
      }),
      createDefaultDesignElement('icon', {
        name: 'Cyber Sparkles',
        position: { x: 0.8, y: 0.8 },
        width: 0.18,
        height: 0.18,
        fillColor: '#00f2fe',
        iconType: 'zap',
        glowEnabled: true,
        glowColor: '#00f2fe',
        glowRadius: 20,
      }),
    ],
  },
  {
    id: 'tmpl-aesthetic-quote',
    name: 'Minimalist Editorial Layout',
    category: 'Minimalist',
    aspectRatio: '4:5',
    description: 'Clean arch window frame with gold accents and delicate organic botanical palm fronds.',
    palette: ['#d4af37', '#ffffff', '#2c3e50', '#f7f1e3'],
    elements: [
      createDefaultDesignElement('frame', {
        name: 'Arch Window Frame',
        position: { x: 0.5, y: 0.45 },
        width: 0.75,
        height: 0.75,
        frameType: 'arch-window',
        strokeEnabled: true,
        strokeColor: '#d4af37',
        strokeWidth: 3,
      }),
      createDefaultDesignElement('illustration', {
        name: 'Palm Botanical Frond',
        position: { x: 0.18, y: 0.8 },
        width: 0.32,
        height: 0.32,
        fillColor: '#2c3e50',
        illustrationType: 'botanical-palm',
      }),
      createDefaultDesignElement('line', {
        name: 'Gold Accent Divider',
        position: { x: 0.5, y: 0.9 },
        width: 0.5,
        height: 0.04,
        strokeColor: '#d4af37',
        strokeWidth: 2,
        lineStyle: 'solid',
        lineStart: 'diamond',
        lineEnd: 'diamond',
      }),
    ],
  },
  {
    id: 'tmpl-youtube-thumbnail',
    name: 'Viral Video Callout',
    category: 'Social Media',
    aspectRatio: '16:9',
    description: 'High-contrast bold arrows, 100% badge, burst seals, and shock attention markers.',
    palette: ['#ff0000', '#ffd32a', '#ffffff', '#000000'],
    elements: [
      createDefaultDesignElement('arrow', {
        name: 'Red Focus Arrow',
        position: { x: 0.35, y: 0.35 },
        width: 0.28,
        height: 0.15,
        rotation: 35,
        strokeColor: '#ff3838',
        strokeWidth: 8,
        lineEnd: 'barbed-arrow',
        glowEnabled: true,
        glowColor: '#ff3838',
        glowRadius: 18,
      }),
      createDefaultDesignElement('sticker', {
        name: '100% Real Sticker',
        position: { x: 0.85, y: 0.25 },
        width: 0.22,
        height: 0.22,
        rotation: -10,
        stickerType: '100-percent',
      }),
      createDefaultDesignElement('sticker', {
        name: 'Best Seller Crown',
        position: { x: 0.15, y: 0.75 },
        width: 0.24,
        height: 0.24,
        stickerType: 'best-seller',
      }),
    ],
  },
];
