import {
  TypographyItem,
  TypographyGradient,
  TypographyOutline,
  TypographyShadow,
  TypographyGlow,
  Typography3D,
  TypographyCurved,
  TypographyWarp,
  TypographyMask,
  TypographyBadge,
} from '../types/editor';

// Curated Google Fonts directory
export interface FontOption {
  family: string;
  name: string;
  category: 'sans' | 'serif' | 'display' | 'script' | 'mono';
  googleFont: boolean;
  weights: string[];
  previewText?: string;
}

export const POPULAR_FONTS: FontOption[] = [
  // Sans-Serif
  { family: 'Inter', name: 'Inter Clean', category: 'sans', googleFont: true, weights: ['300', '400', '600', '700', '900'] },
  { family: 'Montserrat', name: 'Montserrat Geometric', category: 'sans', googleFont: true, weights: ['300', '400', '600', '700', '900'] },
  { family: 'Poppins', name: 'Poppins Modern', category: 'sans', googleFont: true, weights: ['300', '400', '600', '700', '900'] },
  { family: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans', category: 'sans', googleFont: true, weights: ['400', '600', '700', '800'] },
  { family: 'Outfit', name: 'Outfit Minimal', category: 'sans', googleFont: true, weights: ['300', '400', '600', '700', '900'] },
  { family: 'Space Grotesk', name: 'Space Grotesk', category: 'sans', googleFont: true, weights: ['400', '600', '700'] },
  { family: 'Syne', name: 'Syne Avant-Garde', category: 'sans', googleFont: true, weights: ['500', '700', '800'] },
  
  // Serif
  { family: 'Playfair Display', name: 'Playfair Display Luxury', category: 'serif', googleFont: true, weights: ['400', '600', '700', '900'] },
  { family: 'Cinzel', name: 'Cinzel Roman Classic', category: 'serif', googleFont: true, weights: ['400', '600', '700', '900'] },
  { family: 'DM Serif Display', name: 'DM Serif Editorial', category: 'serif', googleFont: true, weights: ['400'] },
  { family: 'Cormorant Garamond', name: 'Cormorant Garamond Elegant', category: 'serif', googleFont: true, weights: ['400', '600', '700'] },
  { family: 'Bodoni Moda', name: 'Bodoni Moda Fashion', category: 'serif', googleFont: true, weights: ['400', '700', '900'] },
  { family: 'Merriweather', name: 'Merriweather Book', category: 'serif', googleFont: true, weights: ['300', '400', '700', '900'] },

  // Display & Bold
  { family: 'Bebas Neue', name: 'Bebas Neue Ultra Condensed', category: 'display', googleFont: true, weights: ['400'] },
  { family: 'Anton', name: 'Anton Impact Heavy', category: 'display', googleFont: true, weights: ['400'] },
  { family: 'Oswald', name: 'Oswald Poster', category: 'display', googleFont: true, weights: ['400', '600', '700'] },
  { family: 'Righteous', name: 'Righteous Retro Deco', category: 'display', googleFont: true, weights: ['400'] },
  { family: 'Bangers', name: 'Bangers Comic Pop', category: 'display', googleFont: true, weights: ['400'] },
  { family: 'Alfa Slab One', name: 'Alfa Slab Heavy Slab', category: 'display', googleFont: true, weights: ['400'] },

  // Script & Handwriting
  { family: 'Caveat', name: 'Caveat Brush Handwriting', category: 'script', googleFont: true, weights: ['400', '700'] },
  { family: 'Pacifico', name: 'Pacifico Surf Script', category: 'script', googleFont: true, weights: ['400'] },
  { family: 'Dancing Script', name: 'Dancing Script Cursive', category: 'script', googleFont: true, weights: ['400', '700'] },
  { family: 'Great Vibes', name: 'Great Vibes Calligraphy', category: 'script', googleFont: true, weights: ['400'] },
  { family: 'Permanent Marker', name: 'Permanent Marker Street', category: 'script', googleFont: true, weights: ['400'] },
  { family: 'Satisfy', name: 'Satisfy Fluid Pen', category: 'script', googleFont: true, weights: ['400'] },

  // Monospace & Retro
  { family: 'Space Mono', name: 'Space Mono Tech', category: 'mono', googleFont: true, weights: ['400', '700'] },
  { family: 'VT323', name: 'VT323 80s Terminal', category: 'mono', googleFont: true, weights: ['400'] },
  { family: 'Silkscreen', name: 'Silkscreen Pixel Arcade', category: 'mono', googleFont: true, weights: ['400', '700'] },
  { family: 'Courier Prime', name: 'Courier Prime Screenplay', category: 'mono', googleFont: true, weights: ['400', '700'] },
];

export const GRADIENT_PRESETS: Array<{ name: string; stops: Array<{ offset: number; color: string }> }> = [
  {
    name: 'Sunset Horizon',
    stops: [
      { offset: 0, color: '#ff512f' },
      { offset: 1, color: '#dd2476' },
    ],
  },
  {
    name: 'Cyberpunk Neon',
    stops: [
      { offset: 0, color: '#00f2fe' },
      { offset: 1, color: '#4facfe' },
    ],
  },
  {
    name: 'Luxe Gold',
    stops: [
      { offset: 0, color: '#f6d365' },
      { offset: 0.5, color: '#fda085' },
      { offset: 1, color: '#f6d365' },
    ],
  },
  {
    name: 'Holographic Violet',
    stops: [
      { offset: 0, color: '#a18cd1' },
      { offset: 1, color: '#fbc2eb' },
    ],
  },
  {
    name: 'Emerald Aurora',
    stops: [
      { offset: 0, color: '#00b09b' },
      { offset: 1, color: '#96c93d' },
    ],
  },
  {
    name: 'Liquid Chrome',
    stops: [
      { offset: 0, color: '#e0e0e0' },
      { offset: 0.5, color: '#ffffff' },
      { offset: 0.7, color: '#888888' },
      { offset: 1, color: '#f5f5f5' },
    ],
  },
  {
    name: 'Flaming Magma',
    stops: [
      { offset: 0, color: '#f857a6' },
      { offset: 1, color: '#ff5858' },
    ],
  },
  {
    name: 'Electric Synthwave',
    stops: [
      { offset: 0, color: '#f72585' },
      { offset: 0.5, color: '#7209b7' },
      { offset: 1, color: '#4cc9f0' },
    ],
  },
];

// Track loaded font families to avoid duplicate DOM links
const loadedFontsSet = new Set<string>();

/**
 * Dynamically injects Google Font link tag into document head
 */
export function ensureFontLoaded(family: string, customUrl?: string): Promise<boolean> {
  if (loadedFontsSet.has(family)) return Promise.resolve(true);

  if (customUrl) {
    return new Promise((resolve) => {
      try {
        const fontFace = new FontFace(family, `url(${customUrl})`);
        fontFace.load().then((loadedFace) => {
          (document.fonts as any).add(loadedFace);
          loadedFontsSet.add(family);
          resolve(true);
        }).catch(() => resolve(false));
      } catch {
        resolve(false);
      }
    });
  }

  // Google Font URL
  return new Promise((resolve) => {
    try {
      const formattedFamily = family.replace(/\s+/g, '+');
      const href = `https://fonts.googleapis.com/css2?family=${formattedFamily}:ital,wght@0,100..900;1,100..900&display=swap`;
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => {
        loadedFontsSet.add(family);
        resolve(true);
      };
      link.onerror = () => resolve(false);
      document.head.appendChild(link);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Default Typography Item Factory
 */
export function createDefaultTypographyItem(text = 'LUMINA STUDIO', extra?: Partial<TypographyItem>): TypographyItem {
  const id = `type_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    id,
    name: 'Typography Layer',
    text,
    fontFamily: 'Inter',
    fontSize: 72,
    fontWeight: '700',
    fontStyle: 'normal',
    textTransform: 'none',
    letterSpacing: 2,
    lineHeight: 1.15,
    align: 'center',

    fillType: 'solid',
    color: '#ffffff',
    opacity: 100,
    gradient: {
      type: 'linear',
      angle: 90,
      stops: [
        { offset: 0, color: '#f6d365' },
        { offset: 1, color: '#fda085' },
      ],
      presetName: 'Luxe Gold',
    },

    outline: {
      enabled: false,
      color: '#000000',
      width: 4,
      blur: 0,
    },

    shadow: {
      enabled: true,
      color: 'rgba(0,0,0,0.7)',
      blur: 16,
      offsetX: 0,
      offsetY: 6,
      opacity: 80,
    },

    glow: {
      enabled: false,
      color: '#00f2fe',
      radius: 24,
      intensity: 70,
      innerGlow: false,
    },

    threeD: {
      enabled: false,
      depth: 18,
      angle: 45,
      color: '#1a1a1a',
      darkenFactor: 60,
      bevel: true,
    },

    curved: {
      enabled: false,
      curvature: 60, // 0 to 180 deg
      direction: 'clockwise',
    },

    warp: {
      enabled: false,
      style: 'none',
      bend: 30,
      horizontalDistortion: 0,
      verticalDistortion: 0,
    },

    mask: {
      enabled: false,
      mode: 'none',
      overlayColor: '#000000',
      opacity: 90,
    },

    badge: {
      enabled: false,
      color: 'rgba(0,0,0,0.6)',
      paddingX: 24,
      paddingY: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },

    position: { x: 0.5, y: 0.5 },
    rotation: 0,
    scale: 1,
    visible: true,
    locked: false,
    blendMode: 'normal',
    ...extra,
  };
}

/**
 * Transforms string text according to textTransform property
 */
export function formatDisplayText(text: string, transform: TypographyItem['textTransform']): string {
  if (!text) return '';
  switch (transform) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'capitalize':
      return text.replace(/\b\w/g, (c) => c.toUpperCase());
    default:
      return text;
  }
}

/**
 * Creates Canvas gradient from TypographyGradient configuration
 */
export function createFillGradient(
  ctx: CanvasRenderingContext2D,
  gradient: TypographyGradient,
  bounds: { x: number; y: number; width: number; height: number }
): CanvasGradient {
  const { type, angle, stops } = gradient;

  if (type === 'radial') {
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const r = Math.max(bounds.width, bounds.height) / 2;
    const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    stops.forEach((s) => radGrad.addColorStop(Math.min(1, Math.max(0, s.offset)), s.color));
    return radGrad;
  }

  // Linear Gradient with angle in degrees
  const rad = ((angle || 0) * Math.PI) / 180;
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  const len = Math.max(bounds.width, bounds.height) / 2;

  const x0 = cx - Math.cos(rad) * len;
  const y0 = cy - Math.sin(rad) * len;
  const x1 = cx + Math.cos(rad) * len;
  const y1 = cy + Math.sin(rad) * len;

  const linGrad = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach((s) => linGrad.addColorStop(Math.min(1, Math.max(0, s.offset)), s.color));
  return linGrad;
}

/**
 * Renders curved / circular text along an arc
 */
function renderCurvedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  item: TypographyItem,
  fillStyle: string | CanvasGradient
) {
  const curvature = item.curved.curvature || 60;
  const isClockwise = item.curved.direction !== 'counter-clockwise';
  const arcAngle = (curvature * Math.PI) / 180;

  // Measure full line width
  const totalWidth = ctx.measureText(text).width + (text.length - 1) * (item.letterSpacing || 0);
  const radius = totalWidth / Math.max(0.01, arcAngle);

  ctx.save();

  // Position arc center
  const originY = isClockwise ? radius : -radius;
  ctx.translate(0, originY);

  const startAngle = isClockwise ? -arcAngle / 2 : Math.PI - arcAngle / 2;

  let currentDist = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charWidth = ctx.measureText(char).width;
    const charCenterDist = currentDist + charWidth / 2;
    const charAngle = startAngle + (charCenterDist / totalWidth) * arcAngle;

    ctx.save();
    ctx.rotate(charAngle + Math.PI / 2);
    ctx.translate(0, isClockwise ? -radius : radius);

    // 3D Extrusion on individual char if enabled
    if (item.threeD?.enabled && item.threeD.depth > 0) {
      render3DExtrusion(ctx, char, item, 0, 0);
    }

    // Outline
    if (item.outline?.enabled && item.outline.width > 0) {
      ctx.strokeStyle = item.outline.color;
      ctx.lineWidth = item.outline.width;
      ctx.lineJoin = 'round';
      ctx.strokeText(char, -charWidth / 2, 0);
    }

    // Main Char Fill
    ctx.fillStyle = fillStyle;
    ctx.fillText(char, -charWidth / 2, 0);

    ctx.restore();

    currentDist += charWidth + (item.letterSpacing || 0);
  }

  ctx.restore();
}

/**
 * Renders 3D Extrusion depth behind characters/lines
 */
function render3DExtrusion(
  ctx: CanvasRenderingContext2D,
  text: string,
  item: TypographyItem,
  x: number,
  y: number
) {
  const depth = item.threeD.depth || 15;
  const angleRad = ((item.threeD.angle || 45) * Math.PI) / 180;
  const stepX = Math.cos(angleRad);
  const stepY = Math.sin(angleRad);

  const baseColor = item.threeD.color || '#1a1a1a';
  ctx.save();

  // Draw depth layers from furthest to closest
  for (let d = depth; d >= 1; d -= 1.5) {
    const ox = x + stepX * d;
    const oy = y + stepY * d;
    const shadeAlpha = Math.max(0.2, 1 - (d / depth) * ((item.threeD.darkenFactor || 50) / 100));

    ctx.save();
    ctx.globalAlpha = (ctx.globalAlpha || 1) * shadeAlpha;
    ctx.fillStyle = baseColor;
    ctx.fillText(text, ox, oy);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Renders Warp style transformations
 */
function renderWarpedText(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  lineHeight: number,
  item: TypographyItem,
  fillStyle: string | CanvasGradient
) {
  const style = item.warp.style;
  const bend = (item.warp.bend || 30) / 100;

  lines.forEach((line, lineIdx) => {
    const baseY = (lineIdx - (lines.length - 1) / 2) * lineHeight;
    const chars = line.split('');
    const totalLineW = ctx.measureText(line).width + (chars.length - 1) * (item.letterSpacing || 0);
    let currentX = -totalLineW / 2;

    chars.forEach((char, charIdx) => {
      const charW = ctx.measureText(char).width;
      const charCenterX = currentX + charW / 2;
      const normX = totalLineW > 0 ? charCenterX / (totalLineW / 2) : 0; // -1 to 1

      let offsetY = 0;
      let charScaleY = 1;
      let rotAngle = 0;

      switch (style) {
        case 'arch':
          offsetY = -(1 - normX * normX) * bend * 60;
          break;
        case 'wave':
          offsetY = Math.sin(normX * Math.PI * 2) * bend * 40;
          break;
        case 'bulge':
          charScaleY = 1 + (1 - Math.abs(normX)) * bend * 0.8;
          offsetY = -(1 - Math.abs(normX)) * bend * 20;
          break;
        case 'flag':
          offsetY = Math.sin(normX * Math.PI) * bend * 35;
          rotAngle = Math.cos(normX * Math.PI) * bend * 0.3;
          break;
        case 'rise':
          offsetY = -normX * bend * 50;
          break;
        case 'fish':
          charScaleY = 1 - normX * bend * 0.6;
          break;
        case 'twist':
          rotAngle = normX * bend * 0.5;
          break;
        case 'squeeze':
          charScaleY = 1 - (1 - Math.abs(normX)) * bend * 0.5;
          break;
        default:
          break;
      }

      ctx.save();
      ctx.translate(charCenterX, baseY + offsetY);
      if (rotAngle) ctx.rotate(rotAngle);
      ctx.scale(1, charScaleY);

      // 3D Extrusion
      if (item.threeD?.enabled && item.threeD.depth > 0) {
        render3DExtrusion(ctx, char, item, -charW / 2, 0);
      }

      // Outline
      if (item.outline?.enabled && item.outline.width > 0) {
        ctx.strokeStyle = item.outline.color;
        ctx.lineWidth = item.outline.width;
        ctx.lineJoin = 'round';
        ctx.strokeText(char, -charW / 2, 0);
      }

      // Fill
      ctx.fillStyle = fillStyle;
      ctx.fillText(char, -charW / 2, 0);

      ctx.restore();

      currentX += charW + (item.letterSpacing || 0);
    });
  });
}

/**
 * Core Canvas Typography Renderer for a single TypographyItem
 */
export function renderTypographyItemToCanvas(
  ctx: CanvasRenderingContext2D,
  item: TypographyItem,
  canvasWidth: number,
  canvasHeight: number,
  basePhotoCanvas?: HTMLCanvasElement | null
) {
  if (!item.visible || !item.text.trim()) return;

  const posX = item.position.x * canvasWidth;
  const posY = item.position.y * canvasHeight;

  ctx.save();

  // Spatial Translation & Transform
  ctx.translate(posX, posY);
  if (item.rotation) {
    ctx.rotate((item.rotation * Math.PI) / 180);
  }
  if (item.scale && item.scale !== 1) {
    ctx.scale(item.scale, item.scale);
  }

  ctx.globalAlpha = (item.opacity ?? 100) / 100;

  // Font setup
  const fontSize = item.fontSize || 64;
  const fontStyle = item.fontStyle || 'normal';
  const fontWeight = item.fontWeight || '700';
  const fontFamily = item.fontFamily || 'Inter, sans-serif';
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
  ctx.textAlign = item.align === 'justify' ? 'center' : item.align || 'center';
  ctx.textBaseline = 'middle';

  const rawLines = item.text.split('\n');
  const lines = rawLines.map((l) => formatDisplayText(l, item.textTransform));
  const lineHeight = fontSize * (item.lineHeight || 1.15);

  // Measure bounding box of all lines
  let maxLineWidth = 0;
  lines.forEach((line) => {
    const w = ctx.measureText(line).width + (line.length - 1) * (item.letterSpacing || 0);
    if (w > maxLineWidth) maxLineWidth = w;
  });
  const totalBlockHeight = lines.length * lineHeight;

  const bounds = {
    x: -maxLineWidth / 2,
    y: -totalBlockHeight / 2,
    width: maxLineWidth,
    height: totalBlockHeight,
  };

  // 1. Render Background Badge / Pill if enabled
  if (item.badge?.enabled) {
    const padX = item.badge.paddingX ?? 24;
    const padY = item.badge.paddingY ?? 16;
    const bgW = maxLineWidth + padX * 2;
    const bgH = totalBlockHeight + padY * 2;
    const radius = item.badge.borderRadius ?? 12;

    ctx.save();
    ctx.fillStyle = item.badge.color || 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(-bgW / 2, -bgH / 2, bgW, bgH, radius);
    ctx.fill();

    if (item.badge.borderWidth && item.badge.borderWidth > 0) {
      ctx.strokeStyle = item.badge.borderColor || 'rgba(255,255,255,0.3)';
      ctx.lineWidth = item.badge.borderWidth;
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2. Prepare Fill Style (Solid or Gradient)
  let fillStyle: string | CanvasGradient = item.color || '#ffffff';
  if (item.fillType === 'gradient' && item.gradient?.stops?.length) {
    fillStyle = createFillGradient(ctx, item.gradient, bounds);
  }

  // 3. Neon & Soft Glow pass (rendered behind text)
  if (item.glow?.enabled && item.glow.radius > 0) {
    ctx.save();
    ctx.shadowColor = item.glow.color || '#00f2fe';
    ctx.shadowBlur = item.glow.radius;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw glow multi-pass for high-intensity neon radiance
    const passes = Math.max(1, Math.min(4, Math.round((item.glow.intensity || 70) / 25)));
    for (let p = 0; p < passes; p++) {
      lines.forEach((line, idx) => {
        const lineY = (idx - (lines.length - 1) / 2) * lineHeight;
        ctx.fillStyle = item.glow.color || '#00f2fe';
        ctx.fillText(line, 0, lineY);
      });
    }
    ctx.restore();
  }

  // 4. Drop Shadow Setup
  if (item.shadow?.enabled && !item.glow?.enabled) {
    ctx.shadowColor = item.shadow.color || 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = item.shadow.blur ?? 12;
    ctx.shadowOffsetX = item.shadow.offsetX ?? 0;
    ctx.shadowOffsetY = item.shadow.offsetY ?? 6;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  // 5. Handle Curved Text Mode
  if (item.curved?.enabled) {
    renderCurvedText(ctx, lines.join(' '), item, fillStyle);
    ctx.restore();
    return;
  }

  // 6. Handle Warped Text Mode
  if (item.warp?.enabled && item.warp.style !== 'none') {
    renderWarpedText(ctx, lines, lineHeight, item, fillStyle);
    ctx.restore();
    return;
  }

  // 7. Standard Multi-Line Rendering (with 3D Extrusion, Outline, Letter Spacing & Fill)
  lines.forEach((line, idx) => {
    const lineY = (idx - (lines.length - 1) / 2) * lineHeight;

    // A. 3D Extrusion
    if (item.threeD?.enabled && item.threeD.depth > 0) {
      render3DExtrusion(ctx, line, item, 0, lineY);
    }

    // B. Text Outline / Stroke
    if (item.outline?.enabled && item.outline.width > 0) {
      ctx.save();
      ctx.strokeStyle = item.outline.color || '#000000';
      ctx.lineWidth = item.outline.width;
      ctx.lineJoin = 'round';
      ctx.strokeText(line, 0, lineY);
      ctx.restore();
    }

    // C. Main Fill
    ctx.fillStyle = fillStyle;
    ctx.fillText(line, 0, lineY);
  });

  // 8. Text Masks & Knockouts (Image clipping or Inverted Silhouette)
  if (item.mask?.enabled && item.mask.mode !== 'none') {
    const maskMode = item.mask.mode;

    if (maskMode === 'clip-photo' && basePhotoCanvas) {
      // Clips the photograph texture inside the rendered text letterforms
      ctx.save();
      ctx.globalCompositeOperation = 'source-in';
      ctx.drawImage(
        basePhotoCanvas,
        -posX,
        -posY,
        canvasWidth,
        canvasHeight
      );
      ctx.restore();
    } else if (maskMode === 'knockout') {
      // Punches transparent cutout holes in anything underneath
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      lines.forEach((line, idx) => {
        const lineY = (idx - (lines.length - 1) / 2) * lineHeight;
        ctx.fillStyle = '#000000';
        ctx.fillText(line, 0, lineY);
      });
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Composite full array of Typography items onto a canvas context
 */
export function compositeTypographyStack(
  ctx: CanvasRenderingContext2D,
  typographyItems: TypographyItem[],
  width: number,
  height: number,
  basePhotoCanvas?: HTMLCanvasElement | null
) {
  if (!typographyItems || typographyItems.length === 0) return;

  typographyItems.forEach((item) => {
    if (item.visible) {
      renderTypographyItemToCanvas(ctx, item, width, height, basePhotoCanvas);
    }
  });
}
