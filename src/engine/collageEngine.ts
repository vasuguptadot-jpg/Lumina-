import {
  CollageSettings,
  CollageItem,
  CollageLayoutType,
  CollagePinType,
  CollageBackground,
} from '../types/editor';
import { drawPatternToCanvas } from './designEngine';

export interface LayoutSlotRect {
  x: number; // normalized 0 to 1
  y: number; // normalized 0 to 1
  width: number; // normalized 0 to 1
  height: number; // normalized 0 to 1
  rotation?: number; // degrees
}

export interface CollagePresetLayoutMeta {
  id: CollageLayoutType;
  name: string;
  category: 'Grid' | 'Split' | 'Magazine' | 'Creative' | 'Story';
  idealCount: number;
  description: string;
}

export const COLLAGE_LAYOUTS: CollagePresetLayoutMeta[] = [
  { id: 'grid-2x2', name: '2x2 Grid', category: 'Grid', idealCount: 4, description: 'Classic 4-photo balanced square' },
  { id: 'grid-1x2', name: '1x2 Duo', category: 'Grid', idealCount: 2, description: '2 side-by-side vertical columns' },
  { id: 'grid-2x1', name: '2x1 Stack', category: 'Grid', idealCount: 2, description: '2 stacked horizontal rows' },
  { id: 'grid-3x3', name: '3x3 Grid', category: 'Grid', idealCount: 9, description: '9-photo Instagram mosaic matrix' },
  { id: 'grid-2x3', name: '2x3 Matrix', category: 'Grid', idealCount: 6, description: '6 photos in 2 rows of 3' },
  { id: 'grid-3x2', name: '3x2 Matrix', category: 'Grid', idealCount: 6, description: '6 photos in 3 rows of 2' },
  { id: 'split-1-left-2-right', name: 'Hero Left (1+2)', category: 'Split', idealCount: 3, description: 'Large feature left, 2 stacked right' },
  { id: 'split-2-left-1-right', name: 'Hero Right (2+1)', category: 'Split', idealCount: 3, description: '2 stacked left, large feature right' },
  { id: 'split-1-top-2-bottom', name: 'Hero Top (1+2)', category: 'Split', idealCount: 3, description: 'Panoramic header, 2 columns below' },
  { id: 'split-2-top-1-bottom', name: 'Hero Bottom (2+1)', category: 'Split', idealCount: 3, description: '2 photos top, wide base photo' },
  { id: 'split-1-top-3-bottom', name: 'Hero + 3 (1+3)', category: 'Split', idealCount: 4, description: 'Feature top, 3 thumbnails bottom' },
  { id: 'split-3-top-1-bottom', name: '3 + Hero (3+1)', category: 'Split', idealCount: 4, description: '3 thumbnails top, feature bottom' },
  { id: 'mosaic-5', name: '5-Photo Mosaic', category: 'Magazine', idealCount: 5, description: 'Hero center with 4 corner frames' },
  { id: 'masonry-3', name: 'Masonry Trio', category: 'Magazine', idealCount: 3, description: 'Asymmetric editorial magazine spread' },
  { id: 'magazine-cover', name: 'Editorial Cover', category: 'Magazine', idealCount: 3, description: 'Full-bleed hero with floating insets' },
  { id: 'filmstrip-horizontal', name: 'Filmstrip H', category: 'Creative', idealCount: 4, description: 'Continuous horizontal cinema strip' },
  { id: 'filmstrip-vertical', name: 'Filmstrip V', category: 'Creative', idealCount: 4, description: 'Vertical photobooth strip' },
  { id: 'story-9-16', name: 'Story 9:16', category: 'Story', idealCount: 3, description: 'Mobile vertical 3-card story layout' },
  { id: 'polaroid-scatter', name: 'Polaroid Scrapbook', category: 'Creative', idealCount: 4, description: 'Tilted organic snapshot scatter' },
  { id: 'heart-cluster', name: 'Heart Cluster', category: 'Creative', idealCount: 5, description: 'Romantic clustered multi-photo layout' },
];

/**
 * Computes slot bounding boxes for a given layout type and count
 */
export function computeCollageLayoutSlots(
  layout: CollageLayoutType,
  totalSlots: number
): LayoutSlotRect[] {
  const slots: LayoutSlotRect[] = [];

  switch (layout) {
    case 'grid-1x2':
      slots.push({ x: 0, y: 0, width: 0.5, height: 1 });
      slots.push({ x: 0.5, y: 0, width: 0.5, height: 1 });
      break;

    case 'grid-2x1':
      slots.push({ x: 0, y: 0, width: 1, height: 0.5 });
      slots.push({ x: 0, y: 0.5, width: 1, height: 0.5 });
      break;

    case 'grid-2x2':
      slots.push({ x: 0, y: 0, width: 0.5, height: 0.5 });
      slots.push({ x: 0.5, y: 0, width: 0.5, height: 0.5 });
      slots.push({ x: 0, y: 0.5, width: 0.5, height: 0.5 });
      slots.push({ x: 0.5, y: 0.5, width: 0.5, height: 0.5 });
      break;

    case 'grid-3x3':
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          slots.push({ x: c / 3, y: r / 3, width: 1 / 3, height: 1 / 3 });
        }
      }
      break;

    case 'grid-2x3':
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          slots.push({ x: c / 3, y: r / 2, width: 1 / 3, height: 1 / 2 });
        }
      }
      break;

    case 'grid-3x2':
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 2; c++) {
          slots.push({ x: c / 2, y: r / 3, width: 1 / 2, height: 1 / 3 });
        }
      }
      break;

    case 'split-1-left-2-right':
      slots.push({ x: 0, y: 0, width: 0.55, height: 1 });
      slots.push({ x: 0.55, y: 0, width: 0.45, height: 0.5 });
      slots.push({ x: 0.55, y: 0.5, width: 0.45, height: 0.5 });
      break;

    case 'split-2-left-1-right':
      slots.push({ x: 0, y: 0, width: 0.45, height: 0.5 });
      slots.push({ x: 0, y: 0.5, width: 0.45, height: 0.5 });
      slots.push({ x: 0.45, y: 0, width: 0.55, height: 1 });
      break;

    case 'split-1-top-2-bottom':
      slots.push({ x: 0, y: 0, width: 1, height: 0.55 });
      slots.push({ x: 0, y: 0.55, width: 0.5, height: 0.45 });
      slots.push({ x: 0.5, y: 0.55, width: 0.5, height: 0.45 });
      break;

    case 'split-2-top-1-bottom':
      slots.push({ x: 0, y: 0, width: 0.5, height: 0.45 });
      slots.push({ x: 0.5, y: 0, width: 0.5, height: 0.45 });
      slots.push({ x: 0, y: 0.45, width: 1, height: 0.55 });
      break;

    case 'split-1-top-3-bottom':
      slots.push({ x: 0, y: 0, width: 1, height: 0.6 });
      slots.push({ x: 0, y: 0.6, width: 1 / 3, height: 0.4 });
      slots.push({ x: 1 / 3, y: 0.6, width: 1 / 3, height: 0.4 });
      slots.push({ x: 2 / 3, y: 0.6, width: 1 / 3, height: 0.4 });
      break;

    case 'split-3-top-1-bottom':
      slots.push({ x: 0, y: 0, width: 1 / 3, height: 0.4 });
      slots.push({ x: 1 / 3, y: 0, width: 1 / 3, height: 0.4 });
      slots.push({ x: 2 / 3, y: 0, width: 1 / 3, height: 0.4 });
      slots.push({ x: 0, y: 0.4, width: 1, height: 0.6 });
      break;

    case 'mosaic-5':
      slots.push({ x: 0.22, y: 0.22, width: 0.56, height: 0.56 }); // Main center hero
      slots.push({ x: 0, y: 0, width: 0.22, height: 0.5 }); // Top Left
      slots.push({ x: 0.78, y: 0, width: 0.22, height: 0.5 }); // Top Right
      slots.push({ x: 0, y: 0.5, width: 0.22, height: 0.5 }); // Bottom Left
      slots.push({ x: 0.78, y: 0.5, width: 0.22, height: 0.5 }); // Bottom Right
      break;

    case 'masonry-3':
      slots.push({ x: 0, y: 0, width: 0.48, height: 0.65 });
      slots.push({ x: 0.52, y: 0, width: 0.48, height: 0.45 });
      slots.push({ x: 0.52, y: 0.48, width: 0.48, height: 0.52 });
      break;

    case 'magazine-cover':
      slots.push({ x: 0, y: 0, width: 1, height: 1 }); // Background full-bleed
      slots.push({ x: 0.6, y: 0.1, width: 0.35, height: 0.35, rotation: 4 }); // Inset card 1
      slots.push({ x: 0.6, y: 0.52, width: 0.35, height: 0.38, rotation: -3 }); // Inset card 2
      break;

    case 'filmstrip-horizontal': {
      const count = Math.max(2, Math.min(6, totalSlots || 4));
      const itemW = 1 / count;
      for (let i = 0; i < count; i++) {
        slots.push({ x: i * itemW, y: 0.1, width: itemW, height: 0.8 });
      }
      break;
    }

    case 'filmstrip-vertical': {
      const count = Math.max(2, Math.min(5, totalSlots || 3));
      const itemH = 1 / count;
      for (let i = 0; i < count; i++) {
        slots.push({ x: 0.1, y: i * itemH, width: 0.8, height: itemH });
      }
      break;
    }

    case 'story-9-16':
      slots.push({ x: 0.05, y: 0.04, width: 0.9, height: 0.28 });
      slots.push({ x: 0.05, y: 0.35, width: 0.9, height: 0.3 });
      slots.push({ x: 0.05, y: 0.68, width: 0.9, height: 0.28 });
      break;

    case 'polaroid-scatter':
      slots.push({ x: 0.05, y: 0.05, width: 0.48, height: 0.48, rotation: -7 });
      slots.push({ x: 0.47, y: 0.04, width: 0.48, height: 0.48, rotation: 6 });
      slots.push({ x: 0.08, y: 0.46, width: 0.46, height: 0.48, rotation: 5 });
      slots.push({ x: 0.48, y: 0.47, width: 0.48, height: 0.48, rotation: -4 });
      break;

    case 'heart-cluster':
      slots.push({ x: 0.28, y: 0.25, width: 0.44, height: 0.44, rotation: 0 }); // Center
      slots.push({ x: 0.1, y: 0.08, width: 0.38, height: 0.38, rotation: -12 }); // Top Left
      slots.push({ x: 0.52, y: 0.08, width: 0.38, height: 0.38, rotation: 12 }); // Top Right
      slots.push({ x: 0.08, y: 0.54, width: 0.38, height: 0.38, rotation: 8 }); // Bottom Left
      slots.push({ x: 0.54, y: 0.54, width: 0.38, height: 0.38, rotation: -8 }); // Bottom Right
      break;

    default:
      // Fallback 2x2 grid
      slots.push({ x: 0, y: 0, width: 0.5, height: 0.5 });
      slots.push({ x: 0.5, y: 0, width: 0.5, height: 0.5 });
      slots.push({ x: 0, y: 0.5, width: 0.5, height: 0.5 });
      slots.push({ x: 0.5, y: 0.5, width: 0.5, height: 0.5 });
      break;
  }

  return slots;
}

/**
 * Creates an initial collage state with populated items
 */
export function createCollageFromImages(
  imageUrls: string[],
  layoutType: CollageLayoutType = 'grid-2x2',
  aspectRatio: CollageSettings['aspectRatio'] = '1:1'
): CollageSettings {
  const slots = computeCollageLayoutSlots(layoutType, imageUrls.length);

  const items: CollageItem[] = imageUrls.map((url, idx) => {
    const slot = slots[idx % slots.length] || { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
    return {
      id: `col_item_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      imageUrl: url,
      name: `Photo ${idx + 1}`,
      x: slot.x,
      y: slot.y,
      width: slot.width,
      height: slot.height,
      rotation: slot.rotation || 0,
      scale: 1,
      cropX: 0.5,
      cropY: 0.5,
      cropScale: 1,
      zIndex: idx + 1,
      borderRadius: 12,
      borderWidth: 0,
      borderColor: '#ffffff',
      shadowEnabled: true,
      shadowBlur: 14,
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      pinType: 'none',
      opacity: 100,
    };
  });

  return {
    enabled: true,
    mode: 'grid',
    aspectRatio,
    layout: layoutType,
    spacing: 16,
    padding: 24,
    cornerRadius: 12,
    outerBorder: {
      enabled: false,
      size: 16,
      color: '#ffffff',
      style: 'solid',
    },
    background: {
      type: 'solid',
      solidColor: '#0f172a',
      gradient: {
        type: 'linear',
        angle: 135,
        stops: [
          { color: '#0f172a', offset: 0 },
          { color: '#1e1b4b', offset: 1 },
        ],
      },
      pattern: 'polka-dots',
      patternScale: 1.0,
      patternColor: 'rgba(255, 255, 255, 0.08)',
      blurAmount: 25,
    },
    items,
    activeItemId: items[0]?.id || null,
    autoArrangeBy: 'aspect-fit',
  };
}

/**
 * Intelligent Auto-Collage Layout Generator based on image count and mood
 */
export function generateAutoCollage(
  imageUrls: string[],
  theme: 'modern' | 'vintage' | 'minimal' | 'bold' | 'story' = 'modern'
): CollageSettings {
  const count = imageUrls.length;
  let layout: CollageLayoutType = 'grid-2x2';
  let aspectRatio: CollageSettings['aspectRatio'] = '1:1';
  let solidColor = '#0f172a';
  let cornerRadius = 12;
  let spacing = 16;
  let padding = 24;
  let pinType: CollagePinType = 'none';

  if (count <= 2) {
    layout = 'grid-1x2';
  } else if (count === 3) {
    layout = 'split-1-left-2-right';
  } else if (count === 4) {
    layout = theme === 'vintage' ? 'polaroid-scatter' : 'grid-2x2';
  } else if (count === 5) {
    layout = theme === 'vintage' ? 'heart-cluster' : 'mosaic-5';
  } else if (count === 6) {
    layout = 'grid-2x3';
  } else {
    layout = 'grid-3x3';
  }

  if (theme === 'vintage') {
    solidColor = '#f5ede0';
    cornerRadius = 4;
    pinType = 'tape-top';
  } else if (theme === 'minimal') {
    solidColor = '#ffffff';
    cornerRadius = 0;
    spacing = 24;
    padding = 36;
  } else if (theme === 'bold') {
    solidColor = '#09090b';
    cornerRadius = 20;
    spacing = 18;
  } else if (theme === 'story') {
    layout = 'story-9-16';
    aspectRatio = '9:16';
    solidColor = '#18181b';
    cornerRadius = 16;
  }

  const collage = createCollageFromImages(imageUrls, layout, aspectRatio);
  collage.cornerRadius = cornerRadius;
  collage.spacing = spacing;
  collage.padding = padding;
  collage.background.solidColor = solidColor;

  if (theme === 'vintage') {
    collage.background.gradient = {
      type: 'linear',
      angle: 45,
      stops: [
        { color: '#f5ede0', offset: 0 },
        { color: '#e8dcce', offset: 1 },
      ],
    };
    collage.items.forEach((it) => {
      it.pinType = pinType;
      it.borderColor = '#ffffff';
      it.borderWidth = 8;
    });
  }

  return collage;
}

/**
 * Core Canvas Renderer for Collages
 */
export function renderCollageToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: CollageSettings,
  imageElementsMap: Map<string, HTMLImageElement | HTMLCanvasElement>
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // 1. Render Background
  renderCollageBackground(ctx, width, height, settings.background, imageElementsMap);

  // 2. Render Outer Border if enabled
  if (settings.outerBorder && settings.outerBorder.enabled && settings.outerBorder.size > 0) {
    renderCollageOuterBorder(ctx, width, height, settings.outerBorder);
  }

  // 3. Compute pixel geometry for items
  const paddingPx = (settings.padding / 1000) * Math.min(width, height);
  const spacingPx = (settings.spacing / 1000) * Math.min(width, height);
  const radiusPx = (settings.cornerRadius / 1000) * Math.min(width, height);

  const usableW = width - paddingPx * 2;
  const usableH = height - paddingPx * 2;

  // 4. In grid mode, recompute normalized slot bounds taking spacing into account
  const slots = computeCollageLayoutSlots(settings.layout, settings.items.length);

  // Sort items by zIndex
  const sortedItems = [...settings.items].sort((a, b) => a.zIndex - b.zIndex);

  // 5. Draw each collage photo item
  sortedItems.forEach((item, index) => {
    if (item.opacity !== undefined && item.opacity <= 0) return;

    // Determine normalized position
    let normX = item.x;
    let normY = item.y;
    let normW = item.width;
    let normH = item.height;
    let rotation = item.rotation || 0;

    if (settings.mode === 'grid') {
      const slot = slots[index % slots.length];
      if (slot) {
        normX = slot.x;
        normY = slot.y;
        normW = slot.width;
        normH = slot.height;
        if (slot.rotation !== undefined && item.rotation === 0) {
          rotation = slot.rotation;
        }
      }
    }

    // Convert to pixel box
    const halfGap = spacingPx / 2;
    const pxX = paddingPx + normX * usableW + halfGap;
    const pxY = paddingPx + normY * usableH + halfGap;
    const pxW = Math.max(10, normW * usableW - spacingPx);
    const pxH = Math.max(10, normH * usableH - spacingPx);

    const imgEl = imageElementsMap.get(item.imageUrl);
    renderSingleCollageItem(ctx, item, imgEl, pxX, pxY, pxW, pxH, radiusPx, rotation);
  });

  ctx.restore();
}

/**
 * Background renderer for collage canvas
 */
function renderCollageBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bg: CollageBackground,
  imageElementsMap: Map<string, HTMLImageElement | HTMLCanvasElement>
) {
  ctx.save();

  if (bg.type === 'solid') {
    ctx.fillStyle = bg.solidColor || '#0f172a';
    ctx.fillRect(0, 0, width, height);
  } else if (bg.type === 'gradient' && bg.gradient) {
    const angleRad = ((bg.gradient.angle || 0) * Math.PI) / 180;
    const cx = width / 2;
    const cy = height / 2;
    const length = Math.sqrt(width * width + height * height) / 2;

    const x0 = cx - Math.cos(angleRad) * length;
    const y0 = cy - Math.sin(angleRad) * length;
    const x1 = cx + Math.cos(angleRad) * length;
    const y1 = cy + Math.sin(angleRad) * length;

    const grad =
      bg.gradient.type === 'radial'
        ? ctx.createRadialGradient(cx, cy, 0, cx, cy, length)
        : ctx.createLinearGradient(x0, y0, x1, y1);

    bg.gradient.stops.forEach((st) => grad.addColorStop(st.offset, st.color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (bg.type === 'pattern') {
    // Fill base dark background first
    ctx.fillStyle = bg.solidColor || '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw procedural pattern
    drawPatternToCanvas(
      ctx,
      bg.pattern || 'polka-dots',
      width,
      height,
      bg.patternScale || 1,
      bg.patternColor || 'rgba(255,255,255,0.1)'
    );
  } else if (bg.type === 'blur-backdrop') {
    // Fill base color
    ctx.fillStyle = bg.solidColor || '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Grab first image from map to create dreamy blurred background
    const firstImg = Array.from(imageElementsMap.values())[0];
    if (firstImg) {
      ctx.save();
      ctx.filter = `blur(${bg.blurAmount || 30}px)`;
      ctx.globalAlpha = 0.6;
      ctx.drawImage(firstImg, -50, -50, width + 100, height + 100);
      ctx.restore();

      // Darkening vignette overlay
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(0, 0, width, height);
    }
  }

  ctx.restore();
}

/**
 * Outer Border renderer
 */
function renderCollageOuterBorder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  border: CollageSettings['outerBorder']
) {
  ctx.save();
  const borderPx = Math.max(2, Math.round((border.size / 1000) * Math.min(width, height)));

  if (border.style === 'solid') {
    ctx.lineWidth = borderPx * 2;
    ctx.strokeStyle = border.color || '#ffffff';
    ctx.strokeRect(0, 0, width, height);
  } else if (border.style === 'dashed') {
    ctx.lineWidth = borderPx;
    ctx.strokeStyle = border.color || '#ffffff';
    ctx.setLineDash([borderPx * 2, borderPx * 1.5]);
    const inset = borderPx;
    ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
  } else if (border.style === 'double') {
    ctx.lineWidth = Math.max(2, borderPx * 0.5);
    ctx.strokeStyle = border.color || '#ffffff';
    ctx.strokeRect(borderPx * 0.5, borderPx * 0.5, width - borderPx, height - borderPx);

    const innerInset = borderPx * 1.6;
    ctx.strokeRect(innerInset, innerInset, width - innerInset * 2, height - innerInset * 2);
  } else if (border.style === 'vintage') {
    ctx.lineWidth = borderPx;
    ctx.strokeStyle = border.color || '#d4af37';
    ctx.strokeRect(borderPx, borderPx, width - borderPx * 2, height - borderPx * 2);

    ctx.lineWidth = Math.max(1, borderPx * 0.3);
    const inner = borderPx * 1.4;
    ctx.strokeRect(inner, inner, width - inner * 2, height - inner * 2);
  }

  ctx.restore();
}

/**
 * Helper to render an individual photo cell with clip, border, shadows, and decorations
 */
function renderSingleCollageItem(
  ctx: CanvasRenderingContext2D,
  item: CollageItem,
  img: HTMLImageElement | HTMLCanvasElement | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  rotation: number
) {
  ctx.save();

  const cx = x + w / 2;
  const cy = y + h / 2;

  ctx.translate(cx, cy);
  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }
  ctx.translate(-cx, -cy);

  if (item.opacity !== undefined) {
    ctx.globalAlpha = item.opacity / 100;
  }

  // 1. Draw Drop Shadow
  if (item.shadowEnabled) {
    ctx.save();
    ctx.shadowColor = item.shadowColor || 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = item.shadowBlur || 14;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#ffffff';

    drawRoundedRectPath(ctx, x, y, w, h, radius);
    ctx.fill();
    ctx.restore();
  }

  // 2. Clip for inner image content & rounded corners
  ctx.save();
  drawRoundedRectPath(ctx, x, y, w, h, radius);
  ctx.clip();

  // Draw photo content
  if (img) {
    const naturalW = img instanceof HTMLImageElement ? img.naturalWidth : img.width;
    const naturalH = img instanceof HTMLImageElement ? img.naturalHeight : img.height;

    // Aspect fit/fill calculation
    const imgAspect = naturalW / naturalH;
    const boxAspect = w / h;

    let srcX = 0;
    let srcY = 0;
    let srcW = naturalW;
    let srcH = naturalH;

    if (imgAspect > boxAspect) {
      srcW = naturalH * boxAspect;
      srcX = (naturalW - srcW) * (item.cropX ?? 0.5);
    } else {
      srcH = naturalW / boxAspect;
      srcY = (naturalH - srcH) * (item.cropY ?? 0.5);
    }

    ctx.drawImage(img, srcX, srcY, srcW, srcH, x, y, w, h);
  } else {
    // Placeholder grey card if image is loading
    ctx.fillStyle = '#334155';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `600 ${Math.max(12, Math.round(w * 0.08))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Photo', cx, cy);
  }

  ctx.restore();

  // 3. Inner Photo Border Stroke
  if (item.borderWidth && item.borderWidth > 0) {
    ctx.save();
    ctx.lineWidth = item.borderWidth;
    ctx.strokeStyle = item.borderColor || '#ffffff';
    drawRoundedRectPath(ctx, x, y, w, h, radius);
    ctx.stroke();
    ctx.restore();
  }

  // 4. Decorative Pins & Tape
  if (item.pinType && item.pinType !== 'none') {
    renderCollagePinDecoration(ctx, item.pinType, x, y, w, h, item.caption);
  }

  ctx.restore();
}

/**
 * Draws rounded rectangle path compatible with all browsers
 */
function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

/**
 * Renders pins, washi tape, stamps, and polaroid effects
 */
function renderCollagePinDecoration(
  ctx: CanvasRenderingContext2D,
  pinType: CollagePinType,
  x: number,
  y: number,
  w: number,
  h: number,
  caption?: string
) {
  ctx.save();

  if (pinType === 'tape-top') {
    // Semi-transparent yellow textured washi tape over the top center
    const tapeW = Math.min(80, w * 0.45);
    const tapeH = Math.max(16, Math.min(26, h * 0.12));
    const tapeX = x + (w - tapeW) / 2;
    const tapeY = y - tapeH * 0.45;

    ctx.save();
    ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.fillRect(tapeX, tapeY, tapeW, tapeH);

    // Subtle serrated edge marks
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(tapeX, tapeY, tapeW, tapeH);
    ctx.restore();
  } else if (pinType === 'tape-corners') {
    // 2 diagonal tape strips across top-left and top-right
    const tapeSize = Math.max(18, Math.min(36, w * 0.2));

    ctx.fillStyle = 'rgba(244, 114, 182, 0.85)'; // Pink washi tape
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 3;

    // Top-Left
    ctx.save();
    ctx.translate(x + 5, y + 5);
    ctx.rotate((-45 * Math.PI) / 180);
    ctx.fillRect(-tapeSize / 2, -6, tapeSize, 12);
    ctx.restore();

    // Top-Right
    ctx.save();
    ctx.translate(x + w - 5, y + 5);
    ctx.rotate((45 * Math.PI) / 180);
    ctx.fillRect(-tapeSize / 2, -6, tapeSize, 12);
    ctx.restore();
  } else if (pinType === 'pushpin') {
    // 3D Red Pushpin with cast shadow
    const pinX = x + w / 2;
    const pinY = y + 8;

    // Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(pinX + 4, pinY + 6, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pin head
    const pinGrad = ctx.createRadialGradient(pinX - 2, pinY - 2, 1, pinX, pinY, 9);
    pinGrad.addColorStop(0, '#ff4b4b');
    pinGrad.addColorStop(0.7, '#dc2626');
    pinGrad.addColorStop(1, '#991b1b');
    ctx.fillStyle = pinGrad;
    ctx.beginPath();
    ctx.arc(pinX, pinY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (pinType === 'polaroid') {
    // Polaroid chin at bottom with handwritten text
    if (caption) {
      ctx.save();
      ctx.fillStyle = '#1e293b';
      const fontSize = Math.max(11, Math.round(w * 0.065));
      ctx.font = `italic 600 ${fontSize}px "Caveat", "Dancing Script", cursive, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(caption, x + w / 2, y + h - 8);
      ctx.restore();
    }
  }

  ctx.restore();
}
