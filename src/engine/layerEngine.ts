import {
  LayerItem,
  LayerBlendMode,
  LayerType,
  LayerTransform,
  AdjustmentSettings,
} from '../types/editor';
import { applyCoreAdjustments } from './colorPipeline';
import { DEFAULT_ADJUSTMENTS } from './defaultSettings';

/**
 * Maps Photoshop blend modes to HTML5 Canvas globalCompositeOperation where standard,
 * or handles via pixel-level mathematical blending.
 */
export const BLEND_MODE_MAP: Record<LayerBlendMode, GlobalCompositeOperation | 'pixel-shader'> = {
  normal: 'source-over',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  'soft-light': 'soft-light',
  'hard-light': 'hard-light',
  darken: 'darken',
  lighten: 'lighten',
  'color-dodge': 'color-dodge',
  'color-burn': 'color-burn',
  difference: 'difference',
  exclusion: 'exclusion',
  hue: 'hue',
  saturation: 'saturation',
  color: 'color',
  luminosity: 'luminosity',
};

export const BLEND_MODE_LABELS: Array<{ id: LayerBlendMode; label: string; category: string }> = [
  { id: 'normal', label: 'Normal', category: 'Normal' },
  { id: 'darken', label: 'Darken', category: 'Darken' },
  { id: 'multiply', label: 'Multiply', category: 'Darken' },
  { id: 'color-burn', label: 'Color Burn', category: 'Darken' },
  { id: 'lighten', label: 'Lighten', category: 'Lighten' },
  { id: 'screen', label: 'Screen', category: 'Lighten' },
  { id: 'color-dodge', label: 'Color Dodge', category: 'Lighten' },
  { id: 'overlay', label: 'Overlay', category: 'Contrast' },
  { id: 'soft-light', label: 'Soft Light', category: 'Contrast' },
  { id: 'hard-light', label: 'Hard Light', category: 'Contrast' },
  { id: 'difference', label: 'Difference', category: 'Inversion' },
  { id: 'exclusion', label: 'Exclusion', category: 'Inversion' },
  { id: 'hue', label: 'Hue', category: 'Component' },
  { id: 'saturation', label: 'Saturation', category: 'Component' },
  { id: 'color', label: 'Color', category: 'Component' },
  { id: 'luminosity', label: 'Luminosity', category: 'Component' },
];

/**
 * Creates a default layer based on type
 */
export function createDefaultLayer(
  type: LayerType,
  name?: string,
  extra?: Partial<LayerItem>
): LayerItem {
  const id = `layer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const defaultTransform: LayerTransform = {
    x: 0.5,
    y: 0.5,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    flipH: false,
    flipV: false,
  };

  switch (type) {
    case 'text':
      return {
        id,
        name: name || 'Text Layer',
        type: 'text',
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'normal',
        transform: defaultTransform,
        textData: {
          text: 'Double click to edit text',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 48,
          fontWeight: '700',
          fontStyle: 'normal',
          color: '#ffffff',
          align: 'center',
          letterSpacing: 0,
          lineHeight: 1.2,
          shadowColor: 'rgba(0,0,0,0.6)',
          shadowBlur: 8,
          shadowOffsetX: 2,
          shadowOffsetY: 4,
          strokeColor: '#000000',
          strokeWidth: 0,
          backgroundColor: '',
          padding: 12,
          borderRadius: 8,
        },
        ...extra,
      };

    case 'shape':
      return {
        id,
        name: name || 'Shape Layer',
        type: 'shape',
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'normal',
        transform: defaultTransform,
        shapeData: {
          shapeType: 'rectangle',
          fillColor: '#6366f1',
          fillOpacity: 90,
          strokeColor: '#ffffff',
          strokeWidth: 3,
          strokeDash: 'solid',
          cornerRadius: 16,
          sides: 5,
          starPoints: 5,
          width: 0.35,
          height: 0.25,
        },
        ...extra,
      };

    case 'adjustment':
      return {
        id,
        name: name || 'Adjustment Layer',
        type: 'adjustment',
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'normal',
        adjustmentSettings: {
          exposure: 15,
          contrast: 10,
          highlights: -10,
          shadows: 15,
          saturation: 10,
          temperature: 5,
          vibrance: 10,
          clarity: 10,
        },
        ...extra,
      };

    case 'image':
      return {
        id,
        name: name || 'Image Overlay',
        type: 'image',
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'normal',
        transform: defaultTransform,
        imageUrl: '',
        ...extra,
      };

    case 'smart-object':
      return {
        id,
        name: name || 'Smart Object',
        type: 'smart-object',
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'normal',
        transform: defaultTransform,
        smartObjectData: {
          originalSourceUrl: '',
          sourceType: 'image',
          smartFilters: {
            gaussianBlur: 0,
            sharpen: 0,
            emboss: false,
            pixelate: 0,
            invert: false,
            noise: 0,
          },
        },
        ...extra,
      };

    case 'group':
      return {
        id,
        name: name || 'Group Folder',
        type: 'group',
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'normal',
        collapsed: false,
        ...extra,
      };

    case 'raster':
    default:
      return {
        id,
        name: name || 'Raster Layer',
        type: 'raster',
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'normal',
        brushStrokes: [],
        ...extra,
      };
  }
}

/**
 * High-precision pixel blend functions for 100% Photoshop match
 */
export function blendPixelsPhotoshop(
  base: Uint8ClampedArray,
  blend: Uint8ClampedArray,
  out: Uint8ClampedArray,
  blendMode: LayerBlendMode,
  opacity: number // 0 to 1
) {
  const len = base.length;
  const alphaFactor = opacity;

  for (let i = 0; i < len; i += 4) {
    const br = base[i] / 255;
    const bg = base[i + 1] / 255;
    const bb = base[i + 2] / 255;
    const ba = base[i + 3] / 255;

    const lr = blend[i] / 255;
    const lg = blend[i + 1] / 255;
    const lb = blend[i + 2] / 255;
    const la = (blend[i + 3] / 255) * alphaFactor;

    if (la <= 0) {
      out[i] = base[i];
      out[i + 1] = base[i + 1];
      out[i + 2] = base[i + 2];
      out[i + 3] = base[i + 3];
      continue;
    }

    let rr = 0;
    let rg = 0;
    let rb = 0;

    switch (blendMode) {
      case 'multiply':
        rr = br * lr;
        rg = bg * lg;
        rb = bb * lb;
        break;

      case 'screen':
        rr = 1 - (1 - br) * (1 - lr);
        rg = 1 - (1 - bg) * (1 - lg);
        rb = 1 - (1 - bb) * (1 - lb);
        break;

      case 'overlay':
        rr = br < 0.5 ? 2 * br * lr : 1 - 2 * (1 - br) * (1 - lr);
        rg = bg < 0.5 ? 2 * bg * lg : 1 - 2 * (1 - bg) * (1 - lg);
        rb = bb < 0.5 ? 2 * bb * lb : 1 - 2 * (1 - bb) * (1 - lb);
        break;

      case 'darken':
        rr = Math.min(br, lr);
        rg = Math.min(bg, lg);
        rb = Math.min(bb, lb);
        break;

      case 'lighten':
        rr = Math.max(br, lr);
        rg = Math.max(bg, lg);
        rb = Math.max(bb, lb);
        break;

      case 'color-dodge':
        rr = lr === 1 ? 1 : Math.min(1, br / (1 - lr));
        rg = lg === 1 ? 1 : Math.min(1, bg / (1 - lg));
        rb = lb === 1 ? 1 : Math.min(1, bb / (1 - lb));
        break;

      case 'color-burn':
        rr = lr === 0 ? 0 : 1 - Math.min(1, (1 - br) / lr);
        rg = lg === 0 ? 0 : 1 - Math.min(1, (1 - bg) / lg);
        rb = lb === 0 ? 0 : 1 - Math.min(1, (1 - bb) / lb);
        break;

      case 'soft-light':
        rr = lr < 0.5 ? br - (1 - 2 * lr) * br * (1 - br) : br + (2 * lr - 1) * ((br <= 0.25 ? ((16 * br - 12) * br + 4) * br : Math.sqrt(br)) - br);
        rg = lg < 0.5 ? bg - (1 - 2 * lg) * bg * (1 - bg) : bg + (2 * lg - 1) * ((bg <= 0.25 ? ((16 * bg - 12) * bg + 4) * bg : Math.sqrt(bg)) - bg);
        rb = lb < 0.5 ? bb - (1 - 2 * lb) * bb * (1 - bb) : bb + (2 * lb - 1) * ((bb <= 0.25 ? ((16 * bb - 12) * bb + 4) * bb : Math.sqrt(bb)) - bb);
        break;

      case 'hard-light':
        rr = lr < 0.5 ? 2 * br * lr : 1 - 2 * (1 - br) * (1 - lr);
        rg = lg < 0.5 ? 2 * bg * lg : 1 - 2 * (1 - bg) * (1 - lg);
        rb = lb < 0.5 ? 2 * bb * lb : 1 - 2 * (1 - bb) * (1 - lb);
        break;

      case 'difference':
        rr = Math.abs(br - lr);
        rg = Math.abs(bg - lg);
        rb = Math.abs(bb - lb);
        break;

      case 'exclusion':
        rr = br + lr - 2 * br * lr;
        rg = bg + lg - 2 * bg * lg;
        rb = bb + lb - 2 * bb * lb;
        break;

      case 'normal':
      default:
        rr = lr;
        rg = lg;
        rb = lb;
        break;
    }

    // Alpha composite
    const outA = la + ba * (1 - la);
    if (outA > 0) {
      out[i] = Math.round(Math.min(255, Math.max(0, ((rr * la + br * ba * (1 - la)) / outA) * 255)));
      out[i + 1] = Math.round(Math.min(255, Math.max(0, ((rg * la + bg * ba * (1 - la)) / outA) * 255)));
      out[i + 2] = Math.round(Math.min(255, Math.max(0, ((rb * la + bb * ba * (1 - la)) / outA) * 255)));
      out[i + 3] = Math.round(Math.min(255, Math.max(0, outA * 255)));
    } else {
      out[i] = 0;
      out[i + 1] = 0;
      out[i + 2] = 0;
      out[i + 3] = 0;
    }
  }
}

/**
 * Render a single layer onto an isolated scratch canvas
 */
export function renderLayerToCanvas(
  layer: LayerItem,
  width: number,
  height: number,
  targetCanvas: HTMLCanvasElement,
  loadedImagesMap?: Map<string, HTMLImageElement>
) {
  targetCanvas.width = width;
  targetCanvas.height = height;
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);
  if (!layer.visible) return;

  const t = layer.transform || {
    x: 0.5,
    y: 0.5,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    flipH: false,
    flipV: false,
  };

  const cx = t.x * width;
  const cy = t.y * height;

  ctx.save();

  // Apply layer transform
  ctx.translate(cx, cy);
  if (t.rotation) {
    ctx.rotate((t.rotation * Math.PI) / 180);
  }
  ctx.scale(
    (t.scaleX || 1) * (t.flipH ? -1 : 1),
    (t.scaleY || 1) * (t.flipV ? -1 : 1)
  );

  // 1. Text Layer
  if (layer.type === 'text' && layer.textData) {
    const td = layer.textData;
    const fontSize = td.fontSize || 48;
    ctx.font = `${td.fontStyle || 'normal'} ${td.fontWeight || '700'} ${fontSize}px ${td.fontFamily || 'Inter, sans-serif'}`;
    ctx.textAlign = td.align || 'center';
    ctx.textBaseline = 'middle';

    const lines = (td.text || '').split('\n');
    const lineHeight = fontSize * (td.lineHeight || 1.2);

    // Calculate background bounding box if background color is set
    if (td.backgroundColor) {
      let maxLineWidth = 0;
      lines.forEach((line) => {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxLineWidth) maxLineWidth = metrics.width;
      });
      const pad = td.padding || 12;
      const totalH = lines.length * lineHeight;
      const boxW = maxLineWidth + pad * 2;
      const boxH = totalH + pad * 2;

      ctx.fillStyle = td.backgroundColor;
      if (td.borderRadius) {
        ctx.beginPath();
        ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, td.borderRadius);
        ctx.fill();
      } else {
        ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
      }
    }

    if (td.shadowColor && td.shadowBlur) {
      ctx.shadowColor = td.shadowColor;
      ctx.shadowBlur = td.shadowBlur;
      ctx.shadowOffsetX = td.shadowOffsetX || 0;
      ctx.shadowOffsetY = td.shadowOffsetY || 0;
    }

    const startY = -((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, idx) => {
      const lineY = startY + idx * lineHeight;
      if (td.strokeWidth && td.strokeWidth > 0 && td.strokeColor) {
        ctx.strokeStyle = td.strokeColor;
        ctx.lineWidth = td.strokeWidth;
        ctx.strokeText(line, 0, lineY);
      }
      ctx.fillStyle = td.color || '#ffffff';
      ctx.fillText(line, 0, lineY);
    });
  }

  // 2. Shape Layer
  else if (layer.type === 'shape' && layer.shapeData) {
    const sd = layer.shapeData;
    const shapeW = (sd.width || 0.3) * width;
    const shapeH = (sd.height || 0.2) * height;
    const halfW = shapeW / 2;
    const halfH = shapeH / 2;

    ctx.beginPath();

    if (sd.strokeDash === 'dashed') {
      ctx.setLineDash([12, 6]);
    } else if (sd.strokeDash === 'dotted') {
      ctx.setLineDash([4, 4]);
    } else {
      ctx.setLineDash([]);
    }

    switch (sd.shapeType) {
      case 'rectangle':
        ctx.rect(-halfW, -halfH, shapeW, shapeH);
        break;

      case 'rounded-rect':
        ctx.roundRect(-halfW, -halfH, shapeW, shapeH, sd.cornerRadius ?? 16);
        break;

      case 'circle':
      case 'ellipse': {
        const rx = halfW;
        const ry = sd.shapeType === 'circle' ? halfW : halfH;
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        break;
      }

      case 'triangle':
        ctx.moveTo(0, -halfH);
        ctx.lineTo(halfW, halfH);
        ctx.lineTo(-halfW, halfH);
        ctx.closePath();
        break;

      case 'star': {
        const points = sd.starPoints || 5;
        const outerR = Math.min(halfW, halfH);
        const innerR = outerR * 0.45;
        for (let i = 0; i < points * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (i * Math.PI) / points - Math.PI / 2;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      }

      case 'polygon': {
        const sides = Math.max(3, sd.sides || 6);
        const polyR = Math.min(halfW, halfH);
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
          const px = Math.cos(angle) * polyR;
          const py = Math.sin(angle) * polyR;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      }

      case 'arrow':
        ctx.moveTo(-halfW, -halfH * 0.3);
        ctx.lineTo(0, -halfH * 0.3);
        ctx.lineTo(0, -halfH * 0.7);
        ctx.lineTo(halfW, 0);
        ctx.lineTo(0, halfH * 0.7);
        ctx.lineTo(0, halfH * 0.3);
        ctx.lineTo(-halfW, halfH * 0.3);
        ctx.closePath();
        break;

      case 'line':
        ctx.moveTo(-halfW, 0);
        ctx.lineTo(halfW, 0);
        break;

      case 'heart': {
        const topCurveHeight = shapeH * 0.3;
        ctx.moveTo(0, shapeH * 0.2);
        ctx.bezierCurveTo(-halfW, -halfH * 0.8, -halfW * 1.3, topCurveHeight, 0, halfH);
        ctx.bezierCurveTo(halfW * 1.3, topCurveHeight, halfW, -halfH * 0.8, 0, shapeH * 0.2);
        ctx.closePath();
        break;
      }
    }

    if (sd.fillColor && (sd.fillOpacity ?? 100) > 0) {
      ctx.fillStyle = sd.fillColor;
      ctx.globalAlpha = (sd.fillOpacity ?? 100) / 100;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (sd.strokeWidth && sd.strokeWidth > 0 && sd.strokeColor) {
      ctx.strokeStyle = sd.strokeColor;
      ctx.lineWidth = sd.strokeWidth;
      ctx.stroke();
    }
  }

  // 3. Raster Layer (Brush strokes)
  else if (layer.type === 'raster') {
    ctx.restore(); // reset transform for absolute normalized strokes
    ctx.save();

    (layer.brushStrokes || []).forEach((stroke) => {
      if (!stroke.points || stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color || '#ffffff';
      ctx.lineWidth = stroke.size || 20;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = (stroke.opacity ?? 100) / 100;

      if (stroke.mode === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      stroke.points.forEach((pt, idx) => {
        const px = pt.x * width;
        const py = pt.y * height;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    });
  }

  // 4. Image Layer or Smart Object Layer
  else if (layer.type === 'image' || layer.type === 'smart-object') {
    const srcUrl =
      layer.type === 'smart-object'
        ? layer.smartObjectData?.originalSourceUrl
        : layer.imageUrl;

    if (srcUrl && loadedImagesMap?.has(srcUrl)) {
      const img = loadedImagesMap.get(srcUrl)!;
      const imgW = img.width || 100;
      const imgH = img.height || 100;
      ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH);

      // Smart filters if smart object
      if (layer.type === 'smart-object' && layer.smartObjectData?.smartFilters) {
        const sf = layer.smartObjectData.smartFilters;
        if (sf.invert) {
          // Pixel inversion
          const imgData = ctx.getImageData(-imgW / 2, -imgH / 2, imgW, imgH);
          for (let p = 0; p < imgData.data.length; p += 4) {
            imgData.data[p] = 255 - imgData.data[p];
            imgData.data[p + 1] = 255 - imgData.data[p + 1];
            imgData.data[p + 2] = 255 - imgData.data[p + 2];
          }
          ctx.putImageData(imgData, -imgW / 2, -imgH / 2);
        }
      }
    }
  }

  ctx.restore();

  // Apply Layer Mask if enabled
  if (layer.mask && layer.mask.enabled) {
    applyLayerMaskToCanvas(targetCanvas, layer.mask, width, height);
  }
}

/**
 * Apply Layer Mask (alpha clipping / brush mask / density)
 */
function applyLayerMaskToCanvas(
  canvas: HTMLCanvasElement,
  mask: NonNullable<LayerItem['mask']>,
  width: number,
  height: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const mCtx = maskCanvas.getContext('2d');
  if (!mCtx) return;

  // Base mask fill
  mCtx.fillStyle = mask.inverted ? '#000000' : '#ffffff';
  mCtx.fillRect(0, 0, width, height);

  // Mask brush strokes
  if (mask.brushStrokes && mask.brushStrokes.length > 0) {
    mask.brushStrokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length === 0) return;
      mCtx.beginPath();
      mCtx.strokeStyle = stroke.mode === 'erase' ? '#000000' : '#ffffff';
      mCtx.lineWidth = stroke.size || 30;
      mCtx.lineCap = 'round';
      mCtx.lineJoin = 'round';
      stroke.points.forEach((pt, idx) => {
        const px = pt.x * width;
        const py = pt.y * height;
        if (idx === 0) mCtx.moveTo(px, py);
        else mCtx.lineTo(px, py);
      });
      mCtx.stroke();
    });
  }

  // Composite mask as alpha channel
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  ctx.globalAlpha = (mask.density ?? 100) / 100;
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.restore();
}

/**
 * Composite entire Photoshop layer stack onto base canvas
 */
export function compositeLayersStack(
  baseCanvas: HTMLCanvasElement,
  layers: LayerItem[],
  outputCanvas: HTMLCanvasElement,
  loadedImagesMap?: Map<string, HTMLImageElement>
) {
  const w = baseCanvas.width;
  const h = baseCanvas.height;

  outputCanvas.width = w;
  outputCanvas.height = h;
  const outCtx = outputCanvas.getContext('2d');
  if (!outCtx) return;

  // 1. Draw base photo
  outCtx.clearRect(0, 0, w, h);
  outCtx.drawImage(baseCanvas, 0, 0);

  if (!layers || layers.length === 0) return;

  const scratchLayerCanvas = document.createElement('canvas');
  scratchLayerCanvas.width = w;
  scratchLayerCanvas.height = h;

  // Process layer stack from bottom to top
  // In UI, layers are listed top-to-bottom, so bottom-most in stack is last index
  const renderOrder = [...layers].reverse();

  for (let i = 0; i < renderOrder.length; i++) {
    const layer = renderOrder[i];
    if (!layer.visible) continue;

    // A. Adjustment Layer - applies photographic adjustments to all merged layers beneath
    if (layer.type === 'adjustment' && layer.adjustmentSettings) {
      const currentCompositeData = outCtx.getImageData(0, 0, w, h);
      const fullAdj: AdjustmentSettings = {
        ...DEFAULT_ADJUSTMENTS,
        ...layer.adjustmentSettings,
      };

      const adjData = applyCoreAdjustments(currentCompositeData, fullAdj);

      // Blend adjustment back with layer opacity
      const opacity = (layer.opacity ?? 100) / 100;
      if (opacity >= 0.99) {
        outCtx.putImageData(adjData, 0, 0);
      } else {
        const outData = outCtx.getImageData(0, 0, w, h);
        for (let p = 0; p < outData.data.length; p += 4) {
          outData.data[p] = Math.round(outData.data[p] * (1 - opacity) + adjData.data[p] * opacity);
          outData.data[p + 1] = Math.round(outData.data[p + 1] * (1 - opacity) + adjData.data[p + 1] * opacity);
          outData.data[p + 2] = Math.round(outData.data[p + 2] * (1 - opacity) + adjData.data[p + 2] * opacity);
        }
        outCtx.putImageData(outData, 0, 0);
      }
      continue;
    }

    // B. Group Folder pass-through
    if (layer.type === 'group') {
      continue;
    }

    // C. Standard layer rendering (Raster, Text, Shape, Image, Smart Object)
    renderLayerToCanvas(layer, w, h, scratchLayerCanvas, loadedImagesMap);

    outCtx.save();
    outCtx.globalAlpha = (layer.opacity ?? 100) / 100;

    const blendMode = layer.blendMode || 'normal';
    const compOp = BLEND_MODE_MAP[blendMode];

    if (compOp && compOp !== 'pixel-shader') {
      outCtx.globalCompositeOperation = compOp;
      outCtx.drawImage(scratchLayerCanvas, 0, 0);
    } else {
      // High-precision pixel blend fallback
      const baseData = outCtx.getImageData(0, 0, w, h);
      const scratchCtx = scratchLayerCanvas.getContext('2d');
      if (scratchCtx) {
        const blendData = scratchCtx.getImageData(0, 0, w, h);
        const resData = outCtx.createImageData(w, h);
        blendPixelsPhotoshop(
          baseData.data,
          blendData.data,
          resData.data,
          blendMode,
          (layer.opacity ?? 100) / 100
        );
        outCtx.putImageData(resData, 0, 0);
      }
    }
    outCtx.restore();
  }
}
