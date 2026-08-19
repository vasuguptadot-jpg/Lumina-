import {
  DrawingStroke,
  DrawingToolType,
  DrawingShapeType,
  CustomBrushType,
  DrawingPoint,
  LayerBlendMode,
} from '../types/editor';

export interface CustomBrushMeta {
  id: CustomBrushType;
  name: string;
  category: 'Glow & Light' | 'Artistic & Paint' | 'Textures & Particles' | 'Organic';
  description: string;
  iconName: string;
}

export const CUSTOM_BRUSH_PRESETS: CustomBrushMeta[] = [
  { id: 'neon-glow', name: 'Neon Glow Tube', category: 'Glow & Light', description: 'Vibrant luminous laser stroke with intense outer glow', iconName: 'Zap' },
  { id: 'sparkles-glitter', name: 'Magic Sparkles', category: 'Glow & Light', description: '4-point shimmering starbursts and glitter dust', iconName: 'Sparkles' },
  { id: 'star-constellation', name: 'Galaxy Stars', category: 'Glow & Light', description: 'Cosmic night sky star scatter with constellation trails', iconName: 'Star' },
  { id: 'bokeh-orbs', name: 'Bokeh Orbs', category: 'Glow & Light', description: 'Translucent chromatic lens blur circles', iconName: 'Circle' },
  { id: 'watercolor-splatter', name: 'Watercolor Splash', category: 'Artistic & Paint', description: 'Organic pigment droplets and bleeding wash splatters', iconName: 'Droplets' },
  { id: 'halftone-stipple', name: 'Halftone Dots', category: 'Textures & Particles', description: 'Vintage comic stippling and dot matrix pattern', iconName: 'Grid' },
  { id: 'charcoal-grain', name: 'Rough Charcoal', category: 'Textures & Particles', description: 'Textured chalk pastel with paper tooth grain', iconName: 'Feather' },
  { id: 'foliage-leaves', name: 'Foliage Leaves', category: 'Organic', description: 'Dynamic rotating leaf particles and vines', iconName: 'Leaf' },
  { id: 'smoke-mist', name: 'Smoke & Clouds', category: 'Organic', description: 'Wispy soft atmospheric vapor puffs', iconName: 'Cloud' },
  { id: 'chains-ribbon', name: 'Flowing Ribbon', category: 'Organic', description: 'Double-strand smooth silk ribbon', iconName: 'Flame' },
];

export interface ColorPalettePreset {
  name: string;
  category: 'Classic' | 'Neon' | 'Pastel' | 'Vintage' | 'Nature' | 'Portrait';
  colors: string[];
}

export const DRAWING_PALETTES: ColorPalettePreset[] = [
  {
    name: 'Master Essentials',
    category: 'Classic',
    colors: ['#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'],
  },
  {
    name: 'Cyberpunk Neon',
    category: 'Neon',
    colors: ['#ff0055', '#00f0ff', '#ffeb00', '#00ff66', '#bd00ff', '#ff3366', '#00ffff', '#7928ca', '#ff0080', '#ffffff'],
  },
  {
    name: 'Pastel Dream',
    category: 'Pastel',
    colors: ['#fbcfe8', '#fce7f3', '#fed7aa', '#fef08a', '#bbf7d0', '#a5f3fc', '#bae6fd', '#ddd6fe', '#e9d5ff', '#f3e8ff'],
  },
  {
    name: 'Vintage Manga & Retro',
    category: 'Vintage',
    colors: ['#2c3e50', '#e74c3c', '#ecf0f1', '#34495e', '#e67e22', '#16a085', '#95a5a6', '#d35400', '#c0392b', '#7f8c8d'],
  },
  {
    name: 'Earth & Botanical',
    category: 'Nature',
    colors: ['#283618', '#606c38', '#dda15e', '#bc6c25', '#fefae0', '#386641', '#6a994e', '#a7c957', '#f2e8cf', '#3d405b'],
  },
  {
    name: 'Skin & Portrait Tones',
    category: 'Portrait',
    colors: ['#ffdfc4', '#f0c8a0', '#e8b584', '#d99b66', '#c68642', '#8d5524', '#6a3810', '#4a2505', '#fcd5b5', '#ebaf88'],
  },
];

export const GRADIENT_STROKE_PRESETS = [
  {
    name: 'Rainbow Neon',
    stops: [
      { offset: 0, color: '#ff0055' },
      { offset: 0.25, color: '#ff9900' },
      { offset: 0.5, color: '#00f0ff' },
      { offset: 0.75, color: '#7928ca' },
      { offset: 1, color: '#ff0080' },
    ],
  },
  {
    name: 'Sunset Glow',
    stops: [
      { offset: 0, color: '#f59e0b' },
      { offset: 0.5, color: '#ef4444' },
      { offset: 1, color: '#8b5cf6' },
    ],
  },
  {
    name: 'Cyber Ice',
    stops: [
      { offset: 0, color: '#06b6d4' },
      { offset: 0.5, color: '#3b82f6' },
      { offset: 1, color: '#a855f7' },
    ],
  },
  {
    name: 'Gold Metallic',
    stops: [
      { offset: 0, color: '#fef08a' },
      { offset: 0.5, color: '#d97706' },
      { offset: 1, color: '#fbbf24' },
    ],
  },
];

/**
 * Samples pixel color at normalized coordinates (0 to 1) from a canvas element
 */
export function sampleColorFromCanvas(
  canvas: HTMLCanvasElement | HTMLImageElement,
  normX: number,
  normY: number
): { hex: string; rgb: string; r: number; g: number; b: number; a: number; hsl: string } {
  let ctx: CanvasRenderingContext2D | null = null;
  let w = 0;
  let h = 0;

  if (canvas instanceof HTMLCanvasElement) {
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    w = canvas.width;
    h = canvas.height;
  } else {
    const offscreen = document.createElement('canvas');
    w = offscreen.width = canvas.naturalWidth || canvas.width;
    h = offscreen.height = canvas.naturalHeight || canvas.height;
    ctx = offscreen.getContext('2d', { willReadFrequently: true });
    ctx?.drawImage(canvas, 0, 0);
  }

  const px = Math.max(0, Math.min(w - 1, Math.floor(normX * w)));
  const py = Math.max(0, Math.min(h - 1, Math.floor(normY * h)));

  if (!ctx) {
    return { hex: '#ffffff', rgb: 'rgb(255, 255, 255)', r: 255, g: 255, b: 255, a: 1, hsl: 'hsl(0, 0%, 100%)' };
  }

  const pixel = ctx.getImageData(px, py, 1, 1).data;
  const r = pixel[0];
  const g = pixel[1];
  const b = pixel[2];
  const a = pixel[3] / 255;

  const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  const rgb = `rgb(${r}, ${g}, ${b})`;

  // Calculate HSL
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let hVal = 0;
  let sVal = 0;
  const lVal = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    sVal = lVal > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        hVal = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        hVal = (bn - rn) / d + 2;
        break;
      case bn:
        hVal = (rn - gn) / d + 4;
        break;
    }
    hVal /= 6;
  }

  const hsl = `hsl(${Math.round(hVal * 360)}, ${Math.round(sVal * 100)}%, ${Math.round(lVal * 100)}%)`;

  return { hex, rgb, r, g, b, a, hsl };
}

/**
 * Main Compositor: Renders all drawing strokes on top of canvas context
 */
export function compositeDrawingStack(
  ctx: CanvasRenderingContext2D,
  strokes: DrawingStroke[],
  width: number,
  height: number,
  basePhotoCanvas?: HTMLCanvasElement
) {
  if (!strokes || strokes.length === 0) return;

  ctx.save();

  const sortedStrokes = [...strokes]
    .filter((s) => s.visible !== false)
    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  for (const stroke of sortedStrokes) {
    drawSingleStroke(ctx, stroke, width, height, basePhotoCanvas);
  }

  ctx.restore();
}

/**
 * Renders an individual stroke with proper tool physics, brushes, shaders, and geometry
 */
export function drawSingleStroke(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  width: number,
  height: number,
  basePhotoCanvas?: HTMLCanvasElement
) {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return;

  ctx.save();

  // Blend mode
  if (stroke.blendMode && stroke.blendMode !== 'normal') {
    ctx.globalCompositeOperation = getCanvasCompositeOperation(stroke.blendMode);
  }

  // Base opacity
  const baseAlpha = (stroke.opacity ?? 100) / 100;
  ctx.globalAlpha = baseAlpha;

  // Glow Setup
  if (stroke.glowEnabled && stroke.glowColor) {
    ctx.shadowColor = stroke.glowColor;
    ctx.shadowBlur = (stroke.glowRadius || 15) * (width / 1000);
  }

  // Convert points to pixel space
  const pxPoints = pts.map((p) => ({
    x: p.x * width,
    y: p.y * height,
    pressure: p.pressure ?? 0.5,
  }));

  // Route by tool
  switch (stroke.tool) {
    case 'brush':
      renderPainterBrush(ctx, stroke, pxPoints, width, height);
      break;

    case 'pencil':
      renderGraphitePencil(ctx, stroke, pxPoints, width, height);
      break;

    case 'marker':
      renderChiselMarker(ctx, stroke, pxPoints, width, height);
      break;

    case 'pen':
      renderCalligraphyPen(ctx, stroke, pxPoints, width, height);
      break;

    case 'eraser':
      renderEraserStroke(ctx, stroke, pxPoints, width, height);
      break;

    case 'airbrush':
      renderAirbrushSpray(ctx, stroke, pxPoints, width, height);
      break;

    case 'smudge':
      renderSmudgeStroke(ctx, stroke, pxPoints, width, height, basePhotoCanvas);
      break;

    case 'shape':
      renderGeometricShape(ctx, stroke, pxPoints, width, height);
      break;

    case 'custom-brush':
      renderCustomStampBrush(ctx, stroke, pxPoints, width, height);
      break;

    default:
      renderPainterBrush(ctx, stroke, pxPoints, width, height);
      break;
  }

  ctx.restore();
}

/**
 * 1. Smooth Acrylic & Oil Painter Brush
 */
function renderPainterBrush(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  pts: Array<{ x: number; y: number; pressure: number }>,
  w: number,
  h: number
) {
  const baseSize = stroke.size || 20;
  const flow = (stroke.flow ?? 100) / 100;
  const hardness = (stroke.hardness ?? 80) / 100;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Apply gradient stroke if configured
  if (stroke.gradientStroke && stroke.gradientStroke.stops.length > 0 && pts.length >= 2) {
    const grad = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
    stroke.gradientStroke.stops.forEach((s) => grad.addColorStop(s.offset, s.color));
    ctx.strokeStyle = grad;
    ctx.fillStyle = grad;
  } else {
    ctx.strokeStyle = stroke.color || '#ffffff';
    ctx.fillStyle = stroke.color || '#ffffff';
  }

  if (pts.length === 1) {
    // Single dab
    const radius = (baseSize * (stroke.pressureSensitivity ? pts[0].pressure * 1.5 : 1)) / 2;
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, Math.max(1, radius), 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // Smooth Catmull-Rom or Quadratic Bezier interpolation with pressure tapering
  if (stroke.pressureSensitivity) {
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const currentSize = Math.max(1, baseSize * (0.3 + p0.pressure * 1.2));

      ctx.lineWidth = currentSize;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
  } else {
    ctx.lineWidth = baseSize;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }

    if (pts.length > 1) {
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    }
    ctx.stroke();
  }
}

/**
 * 2. Graphite & Charcoal Pencil (Paper tooth texture and grain)
 */
function renderGraphitePencil(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  pts: Array<{ x: number; y: number; pressure: number }>,
  w: number,
  h: number
) {
  const baseSize = stroke.size || 8;
  ctx.fillStyle = stroke.color || '#333333';

  // Draw granular stippled noise along stroke segments
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];

    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.floor(dist / 1.5));

    const pressureFactor = stroke.pressureSensitivity ? 0.4 + p0.pressure * 0.9 : 1;
    const currentRadius = (baseSize * pressureFactor) / 2;

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const curX = p0.x + dx * t;
      const curY = p0.y + dy * t;

      // Random particle spray across cross-section for paper grain
      const particleCount = Math.max(2, Math.floor(currentRadius * 2));
      for (let k = 0; k < particleCount; k++) {
        const angle = Math.random() * Math.PI * 2;
        const rDist = Math.pow(Math.random(), 0.6) * currentRadius;
        const jX = curX + Math.cos(angle) * rDist;
        const jY = curY + Math.sin(angle) * rDist;

        ctx.globalAlpha = (stroke.opacity / 100) * (0.2 + Math.random() * 0.45);
        ctx.fillRect(jX, jY, 1.2, 1.2);
      }
    }
  }
}

/**
 * 3. Chisel Tip & Copic Highlighter Marker (Glaze multiply layering)
 */
function renderChiselMarker(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  pts: Array<{ x: number; y: number; pressure: number }>,
  w: number,
  h: number
) {
  const size = stroke.size || 32;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = stroke.color || 'rgba(254, 240, 138, 0.6)';
  ctx.globalAlpha = ((stroke.opacity || 70) / 100) * 0.6;

  const nibAngle = (45 * Math.PI) / 180;
  const halfW = (size / 2) * Math.cos(nibAngle);
  const halfH = (size / 2) * Math.sin(nibAngle);

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];

    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.floor(dist / 2));

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const curX = p0.x + dx * t;
      const curY = p0.y + dy * t;

      ctx.beginPath();
      ctx.moveTo(curX - halfW, curY - halfH);
      ctx.lineTo(curX + halfW, curY + halfH);
      ctx.lineTo(curX + halfW + 2, curY + halfH + 2);
      ctx.lineTo(curX - halfW + 2, curY - halfH + 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 4. Calligraphy & Fountain Pen (Dynamic angle stroke thickness)
 */
function renderCalligraphyPen(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  pts: Array<{ x: number; y: number; pressure: number }>,
  w: number,
  h: number
) {
  const baseSize = stroke.size || 16;
  ctx.fillStyle = stroke.color || '#000000';
  ctx.strokeStyle = stroke.color || '#000000';

  const nibAngle = (40 * Math.PI) / 180;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];

    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const strokeAngle = Math.atan2(dy, dx);
    const angleDiff = Math.abs(Math.sin(strokeAngle - nibAngle));

    const pressureFactor = stroke.pressureSensitivity ? 0.3 + p0.pressure * 1.1 : 1;
    const strokeWidth = Math.max(2, baseSize * (0.2 + angleDiff * 0.8) * pressureFactor);

    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }
}

/**
 * 5. Eraser (Hard & Soft feathered eraser)
 */
function renderEraserStroke(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  pts: Array<{ x: number; y: number; pressure: number }>,
  w: number,
  h: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  const size = stroke.size || 30;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size;
  ctx.strokeStyle = 'rgba(0, 0, 0, 1)';

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * 6. Airbrush & Soft Mist Spray
 */
function renderAirbrushSpray(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  pts: Array<{ x: number; y: number; pressure: number }>,
  w: number,
  h: number
) {
  const baseRadius = (stroke.size || 40) / 2;
  const flow = ((stroke.flow ?? 50) / 100) * ((stroke.opacity || 100) / 100);

  ctx.fillStyle = stroke.color || '#ffffff';

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const r = stroke.pressureSensitivity ? baseRadius * (0.4 + p.pressure * 1.0) : baseRadius;

    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    grad.addColorStop(0, hexToRgba(stroke.color || '#ffffff', flow * 0.6));
    grad.addColorStop(0.5, hexToRgba(stroke.color || '#ffffff', flow * 0.25));
    grad.addColorStop(1, hexToRgba(stroke.color || '#ffffff', 0));

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 7. Smudge Tool (Finger blending and directional pixel smear)
 */
function renderSmudgeStroke(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  pts: Array<{ x: number; y: number; pressure: number }>,
  w: number,
  h: number,
  basePhotoCanvas?: HTMLCanvasElement
) {
  if (pts.length < 2) return;
  const radius = (stroke.size || 35) / 2;
  const strength = (stroke.smudgeStrength ?? 60) / 100;

  ctx.save();
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];

    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) continue;

    ctx.save();
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.globalAlpha = strength;
    ctx.drawImage(ctx.canvas, -dx * 0.5, -dy * 0.5);
    ctx.restore();
  }
  ctx.restore();
}

/**
 * 8. Geometric Freehand Shapes (Line, Arrow, Box, Ellipse, Star, Heart, etc.)
 */
function renderGeometricShape(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  pts: Array<{ x: number; y: number }>,
  w: number,
  h: number
) {
  if (pts.length < 2) return;
  const pStart = pts[0];
  const pEnd = pts[pts.length - 1];

  const minX = Math.min(pStart.x, pEnd.x);
  const minY = Math.min(pStart.y, pEnd.y);
  const boxW = Math.max(2, Math.abs(pEnd.x - pStart.x));
  const boxH = Math.max(2, Math.abs(pEnd.y - pStart.y));
  const cx = minX + boxW / 2;
  const cy = minY + boxH / 2;

  const shapeType = stroke.shapeType || 'rectangle';
  const strokeWidth = stroke.shapeStrokeWidth || stroke.size || 4;

  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = stroke.color || '#ffffff';
  ctx.fillStyle = stroke.shapeFill || stroke.color || '#ffffff';

  ctx.beginPath();

  switch (shapeType) {
    case 'line':
      ctx.moveTo(pStart.x, pStart.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();
      break;

    case 'arrow':
      drawArrowPath(ctx, pStart.x, pStart.y, pEnd.x, pEnd.y, strokeWidth * 3.5, false);
      break;

    case 'double-arrow':
      drawArrowPath(ctx, pStart.x, pStart.y, pEnd.x, pEnd.y, strokeWidth * 3.5, true);
      break;

    case 'rectangle':
      if (stroke.shapeFilled) ctx.fillRect(minX, minY, boxW, boxH);
      ctx.strokeRect(minX, minY, boxW, boxH);
      break;

    case 'rounded-rect':
      drawRoundedRect(ctx, minX, minY, boxW, boxH, stroke.shapeCornerRadius || 16);
      if (stroke.shapeFilled) ctx.fill();
      ctx.stroke();
      break;

    case 'circle':
    case 'ellipse': {
      const rx = boxW / 2;
      const ry = shapeType === 'circle' ? rx : boxH / 2;
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      if (stroke.shapeFilled) ctx.fill();
      ctx.stroke();
      break;
    }

    case 'triangle':
      ctx.moveTo(cx, minY);
      ctx.lineTo(minX + boxW, minY + boxH);
      ctx.lineTo(minX, minY + boxH);
      ctx.closePath();
      if (stroke.shapeFilled) ctx.fill();
      ctx.stroke();
      break;

    case 'star':
      drawStarShape(ctx, cx, cy, 5, boxW / 2, boxW / 4);
      if (stroke.shapeFilled) ctx.fill();
      ctx.stroke();
      break;

    case 'heart':
      drawHeartShape(ctx, minX, minY, boxW, boxH);
      if (stroke.shapeFilled) ctx.fill();
      ctx.stroke();
      break;

    case 'speech-bubble':
      drawSpeechBubble(ctx, minX, minY, boxW, boxH);
      if (stroke.shapeFilled) ctx.fill();
      ctx.stroke();
      break;

    case 'polygon':
      drawPolygon(ctx, cx, cy, 6, boxW / 2);
      if (stroke.shapeFilled) ctx.fill();
      ctx.stroke();
      break;
  }
}

/**
 * 9. Custom Stamp & Texture Brushes (Neon, Sparkles, Galaxy, Bokeh, Foliage, etc.)
 */
function renderCustomStampBrush(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  pts: Array<{ x: number; y: number; pressure: number }>,
  w: number,
  h: number
) {
  const brushType = stroke.customBrushType || 'neon-glow';
  const baseSize = stroke.size || 30;

  switch (brushType) {
    case 'neon-glow': {
      // 3-layer luminous neon tube
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Outer wide glow
      ctx.shadowColor = stroke.color || '#00f0ff';
      ctx.shadowBlur = baseSize * 1.5;
      ctx.strokeStyle = stroke.color || '#00f0ff';
      ctx.lineWidth = baseSize;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();

      // Inner intense core
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2, baseSize * 0.35);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'sparkles-glitter':
    case 'star-constellation': {
      ctx.fillStyle = stroke.color || '#ffeb3b';
      for (let i = 0; i < pts.length; i++) {
        if (i % 2 !== 0 && i !== pts.length - 1) continue;
        const p = pts[i];
        const sSize = baseSize * (0.5 + Math.random() * 0.8);
        drawStarShape(ctx, p.x, p.y, 4, sSize / 2, sSize / 8);
        ctx.fill();
      }
      break;
    }

    case 'bokeh-orbs': {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < pts.length; i++) {
        if (i % 3 !== 0) continue;
        const p = pts[i];
        const r = (baseSize / 2) * (0.6 + Math.random() * 0.8);

        ctx.fillStyle = hexToRgba(stroke.color || '#38bdf8', 0.4);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = hexToRgba('#ffffff', 0.6);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case 'watercolor-splatter': {
      ctx.fillStyle = stroke.color || '#ec4899';
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, baseSize * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Droplets
        for (let k = 0; k < 4; k++) {
          const ang = Math.random() * Math.PI * 2;
          const dist = Math.random() * baseSize * 0.8;
          ctx.beginPath();
          ctx.arc(p.x + Math.cos(ang) * dist, p.y + Math.sin(ang) * dist, Math.random() * 3 + 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'foliage-leaves': {
      ctx.fillStyle = stroke.color || '#22c55e';
      for (let i = 0; i < pts.length - 1; i++) {
        if (i % 3 !== 0) continue;
        const p = pts[i];
        const next = pts[i + 1];
        const angle = Math.atan2(next.y - p.y, next.x - p.x);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle + Math.PI / 4);
        ctx.beginPath();
        ctx.ellipse(0, 0, baseSize / 2, baseSize / 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
    }

    default:
      renderPainterBrush(ctx, stroke, pts, w, h);
      break;
  }
}

// Helpers for shapes
function drawArrowPath(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  headLen: number,
  doubleEnded: boolean
) {
  const angle = Math.atan2(y1 - y0, x1 - x0);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();

  // Head at end
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - headLen * Math.cos(angle - Math.PI / 6), y1 - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x1 - headLen * Math.cos(angle + Math.PI / 6), y1 - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (doubleEnded) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + headLen * Math.cos(angle - Math.PI / 6), y0 + headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x0 + headLen * Math.cos(angle + Math.PI / 6), y0 + headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawStarShape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);

  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

function drawHeartShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const topCurveHeight = h * 0.3;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + h);
  ctx.bezierCurveTo(x, y + h * 0.6, x, y + topCurveHeight, x + w / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x + w, y + topCurveHeight, x + w, y + h * 0.6, x + w / 2, y + h);
  ctx.closePath();
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const r = 16;
  const bh = h * 0.8;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + bh - r);
  ctx.quadraticCurveTo(x + w, y + bh, x + w - r, y + bh);
  ctx.lineTo(x + w * 0.4, y + bh);
  ctx.lineTo(x + w * 0.2, y + h); // Tail point
  ctx.lineTo(x + w * 0.28, y + bh);
  ctx.lineTo(x + r, y + bh);
  ctx.quadraticCurveTo(x, y + bh, x, y + bh - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sides: number,
  radius: number
) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((char) => char + char).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCanvasCompositeOperation(mode: LayerBlendMode): GlobalCompositeOperation {
  switch (mode) {
    case 'multiply':
      return 'multiply';
    case 'screen':
      return 'screen';
    case 'overlay':
      return 'overlay';
    case 'darken':
      return 'darken';
    case 'lighten':
      return 'lighten';
    case 'color-dodge':
      return 'color-dodge';
    case 'color-burn':
      return 'color-burn';
    case 'difference':
      return 'difference';
    case 'exclusion':
      return 'exclusion';
    case 'hue':
      return 'hue';
    case 'saturation':
      return 'saturation';
    case 'color':
      return 'color';
    case 'luminosity':
      return 'luminosity';
    default:
      return 'source-over';
  }
}
