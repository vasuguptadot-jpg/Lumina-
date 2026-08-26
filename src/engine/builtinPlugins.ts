import { LuminaPlugin } from '../types/plugin';

export const BUILTIN_PLUGINS: LuminaPlugin[] = [
  // ==========================================
  // 1. CUSTOM JS / CANVAS FILTER PLUGINS
  // ==========================================
  {
    id: 'filter-cyber-glitch',
    name: 'Cyber-Glitch & RGB Split',
    category: 'filter',
    version: '1.4.0',
    author: 'Lumina Core Labs',
    description: 'Procedural chromatic aberration RGB shift, horizontal scanline displacement, and digital noise glitching.',
    iconName: 'Zap',
    tags: ['glitch', 'chromatic', 'cyberpunk', 'vhs', 'pixel-shader'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: true,
    rating: 4.9,
    downloadsCount: 14200,
    updatedAt: Date.now(),
    createdAt: Date.now() - 10000000,
    parameters: [
      { id: 'shiftAmount', label: 'RGB Split Distance', type: 'slider', defaultValue: 12, min: 0, max: 40, step: 1, unit: 'px' },
      { id: 'scanlineDensity', label: 'Scanline Density', type: 'slider', defaultValue: 4, min: 2, max: 16, step: 1 },
      { id: 'noiseIntensity', label: 'Noise Glitch', type: 'slider', defaultValue: 25, min: 0, max: 100, step: 1, unit: '%' },
      { id: 'colorTint', label: 'Cyan/Magenta Accent', type: 'toggle', defaultValue: true },
    ],
    currentParams: { shiftAmount: 12, scanlineDensity: 4, noiseIntensity: 25, colorTint: true },
    code: `
// Custom Cyber-Glitch Shader
(function(ctx, width, height, params, originalImageData) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const origData = originalImageData.data;
  const shift = Math.floor(params.shiftAmount || 10);
  const noise = (params.noiseIntensity || 20) / 100;
  const scanlines = params.scanlineDensity || 4;

  for (let y = 0; y < height; y++) {
    const isScanline = (y % scanlines === 0);
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Shift Red channel left, Blue channel right
      const redX = Math.max(0, Math.min(width - 1, x - shift));
      const blueX = Math.max(0, Math.min(width - 1, x + shift));
      const redIdx = (y * width + redX) * 4;
      const blueIdx = (y * width + blueX) * 4;

      let r = origData[redIdx];
      let g = origData[idx + 1];
      let b = origData[blueIdx + 2];

      if (noise > 0 && Math.random() < 0.08 * noise) {
        r = Math.min(255, r + 60);
        b = Math.min(255, b + 80);
      }

      if (isScanline) {
        r *= 0.85;
        g *= 0.85;
        b *= 0.85;
      }

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
    }
  }
  ctx.putImageData(imgData, 0, 0);
})
    `,
  },
  {
    id: 'filter-halftone-pop',
    name: 'Pop-Art Halftone Dot Matrix',
    category: 'filter',
    version: '1.2.0',
    author: 'Studio Raster',
    description: 'Transforms image into a stylized CMYK / monochrome comic halftone screen with customizable dot radii and contrast.',
    iconName: 'Grid',
    tags: ['halftone', 'pop-art', 'print', 'retro', 'comics'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: false,
    rating: 4.8,
    downloadsCount: 8900,
    updatedAt: Date.now(),
    createdAt: Date.now() - 8000000,
    parameters: [
      { id: 'dotSize', label: 'Grid Cell Size', type: 'slider', defaultValue: 10, min: 4, max: 30, step: 2, unit: 'px' },
      { id: 'dotAngle', label: 'Screen Angle', type: 'slider', defaultValue: 45, min: 0, max: 90, step: 5, unit: '°' },
      { id: 'dotColor', label: 'Ink Color', type: 'color', defaultValue: '#0f172a' },
      { id: 'paperColor', label: 'Paper Base', type: 'color', defaultValue: '#fef08a' },
      { id: 'invert', label: 'Invert Screen', type: 'toggle', defaultValue: false },
    ],
    currentParams: { dotSize: 10, dotAngle: 45, dotColor: '#0f172a', paperColor: '#fef08a', invert: false },
    code: `
(function(ctx, width, height, params, originalImageData) {
  const origData = originalImageData.data;
  const cellSize = params.dotSize || 10;
  ctx.fillStyle = params.paperColor || '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = params.dotColor || '#000000';
  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      const idx = (Math.min(height - 1, y) * width + Math.min(width - 1, x)) * 4;
      const lum = (origData[idx] * 0.299 + origData[idx + 1] * 0.587 + origData[idx + 2] * 0.114) / 255;
      const radius = params.invert ? lum * (cellSize / 2) : (1 - lum) * (cellSize / 2);

      if (radius > 0.5) {
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
})
    `,
  },
  {
    id: 'filter-duotone-mapper',
    name: 'Dual-Tone Chromatic Mapper',
    category: 'filter',
    version: '2.0.0',
    author: 'Chromaflex Labs',
    description: 'High-end editorial duotone mapping algorithm mapping luminance highlights and shadows to rich dual pigments.',
    iconName: 'Layers',
    tags: ['duotone', 'editorial', 'spotify-style', 'color-map'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: false,
    rating: 4.95,
    downloadsCount: 19800,
    updatedAt: Date.now(),
    createdAt: Date.now() - 15000000,
    parameters: [
      { id: 'shadowColor', label: 'Shadow Pigment', type: 'color', defaultValue: '#0284c7' },
      { id: 'highlightColor', label: 'Highlight Pigment', type: 'color', defaultValue: '#f43f5e' },
      { id: 'contrastBoost', label: 'Midtone Spread', type: 'slider', defaultValue: 1.2, min: 0.5, max: 2.5, step: 0.1 },
      { id: 'blendStrength', label: 'Blend Opacity', type: 'slider', defaultValue: 90, min: 10, max: 100, step: 5, unit: '%' },
    ],
    currentParams: { shadowColor: '#0284c7', highlightColor: '#f43f5e', contrastBoost: 1.2, blendStrength: 90 },
    code: `
(function(ctx, width, height, params, originalImageData) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const orig = originalImageData.data;

  // Hex to RGB
  function parseHex(h) {
    const r = parseInt(h.slice(1, 3), 16) || 0;
    const g = parseInt(h.slice(3, 5), 16) || 0;
    const b = parseInt(h.slice(5, 7), 16) || 0;
    return [r, g, b];
  }

  const [sR, sG, sB] = parseHex(params.shadowColor || '#0284c7');
  const [hR, hG, hB] = parseHex(params.highlightColor || '#f43f5e');
  const contrast = params.contrastBoost || 1.2;
  const strength = (params.blendStrength || 90) / 100;

  for (let i = 0; i < data.length; i += 4) {
    let lum = (orig[i] * 0.299 + orig[i + 1] * 0.587 + orig[i + 2] * 0.114) / 255;
    // Contrast S-curve
    lum = Math.pow(lum, contrast);

    const targetR = sR + (hR - sR) * lum;
    const targetG = sG + (hG - sG) * lum;
    const targetB = sB + (hB - sB) * lum;

    data[i] = orig[i] * (1 - strength) + targetR * strength;
    data[i + 1] = orig[i + 1] * (1 - strength) + targetG * strength;
    data[i + 2] = orig[i + 2] * (1 - strength) + targetB * strength;
  }
  ctx.putImageData(imgData, 0, 0);
})
    `,
  },

  // ==========================================
  // 2. 3D LUT CINEMATIC PROFILES
  // ==========================================
  {
    id: 'lut-portra-400',
    name: 'Kodak Portra 400 3D LUT',
    category: 'lut',
    version: '3.1.0',
    author: 'Film Emulation Co.',
    description: 'Gold standard analog portrait film with creamy skin tones, subdued pastel greens, and warm golden highlights.',
    iconName: 'Film',
    tags: ['film', 'kodak', 'portra', 'analog', 'lut', 'skin-tones'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: false,
    rating: 5.0,
    downloadsCount: 32400,
    updatedAt: Date.now(),
    createdAt: Date.now() - 20000000,
    parameters: [
      { id: 'intensity', label: 'LUT Strength', type: 'slider', defaultValue: 85, min: 0, max: 100, step: 1, unit: '%' },
      { id: 'warmthOffset', label: 'Golden Warmth', type: 'slider', defaultValue: 10, min: -30, max: 30, step: 1 },
      { id: 'grainSimulation', label: 'Silver Halide Grain', type: 'slider', defaultValue: 20, min: 0, max: 60, step: 2, unit: '%' },
    ],
    currentParams: { intensity: 85, warmthOffset: 10, grainSimulation: 20 },
    lutData: {
      format: 'cube',
      size: 33,
      cubeContent: '# Lumina 3D LUT Portra 400 Simulation',
      curveR: [0, 22, 48, 76, 108, 142, 178, 214, 245, 255],
      curveG: [0, 18, 42, 70, 102, 136, 172, 208, 240, 255],
      curveB: [5, 22, 45, 72, 100, 130, 162, 195, 228, 250],
    },
  },
  {
    id: 'lut-teal-orange-hollywood',
    name: 'Hollywood Blockbuster Teal & Orange',
    category: 'lut',
    version: '2.5.0',
    author: 'Cinema Grade Works',
    description: 'High-impact cinematic color contrast pushing deep shadows into rich teal/cyan while preserving glowing skin tones.',
    iconName: 'Sparkles',
    tags: ['hollywood', 'teal-orange', 'cinema', 'blockbuster', 'color-grading'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: false,
    rating: 4.9,
    downloadsCount: 28100,
    updatedAt: Date.now(),
    createdAt: Date.now() - 18000000,
    parameters: [
      { id: 'intensity', label: 'Grade Intensity', type: 'slider', defaultValue: 90, min: 0, max: 100, step: 1, unit: '%' },
      { id: 'shadowTealDepth', label: 'Shadow Teal Push', type: 'slider', defaultValue: 35, min: 0, max: 60, step: 1 },
      { id: 'highlightWarmth', label: 'Orange Skin Pop', type: 'slider', defaultValue: 25, min: 0, max: 50, step: 1 },
    ],
    currentParams: { intensity: 90, shadowTealDepth: 35, highlightWarmth: 25 },
    lutData: {
      format: 'cube',
      size: 33,
      curveR: [0, 15, 38, 72, 115, 158, 200, 235, 255],
      curveG: [5, 25, 52, 85, 120, 152, 188, 220, 250],
      curveB: [15, 45, 80, 110, 135, 155, 178, 205, 230],
    },
  },

  // ==========================================
  // 3. AI MODELS & VISION PIPELINE PLUGINS
  // ==========================================
  {
    id: 'ai-studio-relighting',
    name: 'AI Studio 3-Point Relighting',
    category: 'ai-model',
    version: '2.1.0',
    author: 'Lumina AI Research',
    description: 'Intelligent portrait depth estimation that injects virtual key lights, fill lights, and rim lighting onto subjects.',
    iconName: 'SunMedium',
    tags: ['ai', 'portrait', 'lighting', 'studio', 'face-relight', 'gemini'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: true,
    rating: 4.92,
    downloadsCount: 41000,
    updatedAt: Date.now(),
    createdAt: Date.now() - 25000000,
    parameters: [
      { id: 'keyLightAngle', label: 'Key Light Angle', type: 'slider', defaultValue: 45, min: -90, max: 90, step: 5, unit: '°' },
      { id: 'keyLightIntensity', label: 'Key Light Power', type: 'slider', defaultValue: 60, min: 0, max: 100, step: 5, unit: '%' },
      { id: 'rimLightColor', label: 'Rim Accent Color', type: 'color', defaultValue: '#38bdf8' },
      { id: 'backgroundFalloff', label: 'Backdrop Darken', type: 'slider', defaultValue: 30, min: 0, max: 80, step: 5, unit: '%' },
    ],
    currentParams: { keyLightAngle: 45, keyLightIntensity: 60, rimLightColor: '#38bdf8', backgroundFalloff: 30 },
    aiConfig: {
      systemPrompt: 'Perform precise depth-based portrait relighting: add soft directional key light at specified angle, subtle rim highlight around hair/shoulders, and gentle studio backdrop falloff.',
      taskType: 'relight',
      temperature: 0.2,
      recommendedStyle: 'Editorial Studio Photography',
    },
  },
  {
    id: 'ai-sky-atmos-enhancer',
    name: 'AI Dynamic Sky & Atmospheric Bloom',
    category: 'ai-model',
    version: '1.8.0',
    author: 'Landscape Vision Lab',
    description: 'Recovers blown sky details, injects cinematic sunset clouds, and casts volumetric sunburst god rays across the landscape.',
    iconName: 'CloudSun',
    tags: ['ai', 'sky', 'clouds', 'sunburst', 'landscape', 'hdr'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: true,
    rating: 4.88,
    downloadsCount: 22400,
    updatedAt: Date.now(),
    createdAt: Date.now() - 12000000,
    parameters: [
      { id: 'cloudStyle', label: 'Cloud Pattern', type: 'select', defaultValue: 'golden_sunset', options: [
        { label: 'Golden Hour Cumulus', value: 'golden_sunset' },
        { label: 'Dramatic Storm Drama', value: 'storm_drama' },
        { label: 'Clear Deep Twilight', value: 'twilight' },
        { label: 'Aurora Borealis', value: 'aurora' },
      ]},
      { id: 'sunRayIntensity', label: 'God Rays & Atmosphere', type: 'slider', defaultValue: 40, min: 0, max: 100, step: 5, unit: '%' },
      { id: 'horizonHarmonization', label: 'Horizon Color Bleed', type: 'slider', defaultValue: 50, min: 0, max: 100, step: 5, unit: '%' },
    ],
    currentParams: { cloudStyle: 'golden_sunset', sunRayIntensity: 40, horizonHarmonization: 50 },
    aiConfig: {
      systemPrompt: 'Detect the sky boundary seamlessly. Inpaint selected sky pattern with realistic volumetric lighting and wrap warm ambient illumination onto foreground elements.',
      taskType: 'sky_replace',
      temperature: 0.3,
    },
  },

  // ==========================================
  // 4. CUSTOM BRUSHES & STAMP PACKS
  // ==========================================
  {
    id: 'brush-watercolor-wet',
    name: 'Organic Watercolor Bleed & Wash',
    category: 'brush',
    version: '1.5.0',
    author: 'Pigment Atelier',
    description: 'Simulates pigment diffusion, wet-in-wet color blending, paper grain pooling, and frayed watercolor brush strokes.',
    iconName: 'Paintbrush',
    tags: ['brush', 'watercolor', 'paint', 'artistic', 'wet-edge'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: true,
    rating: 4.95,
    downloadsCount: 16500,
    updatedAt: Date.now(),
    createdAt: Date.now() - 9000000,
    parameters: [
      { id: 'brushSize', label: 'Brush Radius', type: 'slider', defaultValue: 45, min: 5, max: 150, step: 5, unit: 'px' },
      { id: 'wetness', label: 'Pigment Wetness', type: 'slider', defaultValue: 70, min: 10, max: 100, step: 5, unit: '%' },
      { id: 'edgeDarkening', label: 'Wet Edge Darkening', type: 'slider', defaultValue: 50, min: 0, max: 100, step: 5, unit: '%' },
      { id: 'brushColor', label: 'Watercolor Tint', type: 'color', defaultValue: '#3b82f6' },
    ],
    currentParams: { brushSize: 45, wetness: 70, edgeDarkening: 50, brushColor: '#3b82f6' },
    brushConfig: {
      tipType: 'watercolor',
      size: 45,
      spacing: 0.15,
      jitter: 0.25,
      hardness: 0.3,
      opacity: 0.65,
      flow: 0.8,
      scatterRadius: 15,
      colorBlend: true,
    },
  },
  {
    id: 'brush-bokeh-scatter',
    name: 'Cinematic Bokeh & Aperture Orbs',
    category: 'brush',
    version: '2.0.0',
    author: 'Optics VFX',
    description: 'Scatters customizable hexagonal or spherical aperture bokeh highlights with realistic chromatic fringed borders.',
    iconName: 'CircleDot',
    tags: ['brush', 'bokeh', 'light-leaks', 'aperture', 'glamour'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: true,
    rating: 4.87,
    downloadsCount: 13900,
    updatedAt: Date.now(),
    createdAt: Date.now() - 7000000,
    parameters: [
      { id: 'orbSize', label: 'Orb Diameter', type: 'slider', defaultValue: 60, min: 10, max: 200, step: 10, unit: 'px' },
      { id: 'scatterSpread', label: 'Scatter Density', type: 'slider', defaultValue: 80, min: 20, max: 250, step: 10, unit: 'px' },
      { id: 'orbColor', label: 'Orb Hue', type: 'color', defaultValue: '#fbbf24' },
      { id: 'apertureShape', label: 'Blade Shape', type: 'select', defaultValue: 'circle', options: [
        { label: 'Circular Soft Bokeh', value: 'circle' },
        { label: 'Hexagonal 6-Blade', value: 'hexagon' },
        { label: 'Octagonal 8-Blade', value: 'octagon' },
      ]},
    ],
    currentParams: { orbSize: 60, scatterSpread: 80, orbColor: '#fbbf24', apertureShape: 'circle' },
    brushConfig: {
      tipType: 'bokeh',
      size: 60,
      spacing: 0.35,
      jitter: 0.4,
      hardness: 0.1,
      opacity: 0.45,
      flow: 0.9,
      scatterRadius: 60,
      colorBlend: true,
    },
  },

  // ==========================================
  // 5. PRESET BUNDLES
  // ==========================================
  {
    id: 'preset-tokyo-cyberpunk',
    name: 'Neo-Tokyo Cyberpunk Pack',
    category: 'preset',
    version: '2.2.0',
    author: 'Kurogane Studios',
    description: 'Electric night photography bundle with high cyan luminance, saturated magenta neon, and compressed deep blacks.',
    iconName: 'Compass',
    tags: ['preset', 'cyberpunk', 'tokyo', 'neon', 'night'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: true,
    rating: 4.98,
    downloadsCount: 48000,
    updatedAt: Date.now(),
    createdAt: Date.now() - 30000000,
    parameters: [
      { id: 'strength', label: 'Preset Intensity', type: 'slider', defaultValue: 100, min: 0, max: 150, step: 5, unit: '%' },
    ],
    currentParams: { strength: 100 },
    presetData: {
      adjustments: {
        exposure: 0.1,
        contrast: 28,
        highlights: -35,
        shadows: 20,
        whites: 15,
        blacks: -12,
        clarity: 32,
        dehaze: 24,
        vibrance: 45,
        saturation: 15,
        temperature: -18,
        tint: 28,
      },
    },
  },
  {
    id: 'preset-scandi-minimal',
    name: 'Nordic Clean Interior & Light',
    category: 'preset',
    version: '1.4.0',
    author: 'Stockholm Design Collective',
    description: 'Airy, bright, high key aesthetic with neutral white balance, desaturated warm yellows, and soft shadow gradation.',
    iconName: 'Sun',
    tags: ['preset', 'minimal', 'nordic', 'architecture', 'clean', 'interior'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: true,
    rating: 4.89,
    downloadsCount: 27500,
    updatedAt: Date.now(),
    createdAt: Date.now() - 14000000,
    parameters: [
      { id: 'strength', label: 'Preset Intensity', type: 'slider', defaultValue: 90, min: 0, max: 150, step: 5, unit: '%' },
    ],
    currentParams: { strength: 90 },
    presetData: {
      adjustments: {
        exposure: 0.35,
        contrast: -12,
        highlights: 10,
        shadows: 35,
        whites: 20,
        blacks: 15,
        clarity: -8,
        dehaze: -5,
        vibrance: -15,
        saturation: -10,
        temperature: 4,
        tint: -2,
      },
    },
  },

  // ==========================================
  // 6. CUSTOM FONTS & TYPOGRAPHY
  // ==========================================
  {
    id: 'font-cinzel-editorial',
    name: 'Cinzel & Playfair Luxury Serif Collection',
    category: 'font',
    version: '1.1.0',
    author: 'Google Fonts Registry',
    description: 'High-contrast classical Roman proportions with refined serifs. Ideal for fashion mastheads and luxury brands.',
    iconName: 'Type',
    tags: ['font', 'serif', 'luxury', 'editorial', 'google-fonts'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: true,
    rating: 4.96,
    downloadsCount: 38000,
    updatedAt: Date.now(),
    createdAt: Date.now() - 19000000,
    parameters: [
      { id: 'sampleSize', label: 'Preview Size', type: 'slider', defaultValue: 36, min: 18, max: 72, step: 2, unit: 'pt' },
    ],
    currentParams: { sampleSize: 36 },
    fontConfig: {
      fontFamily: 'Cinzel',
      category: 'serif',
      googleFontName: 'Cinzel:wght@400;600;700;900',
      weights: [400, 600, 700, 900],
      sampleText: 'THE EDITORIAL ATELIER',
    },
  },
  {
    id: 'font-syne-grotesk',
    name: 'Syne & Space Grotesk Brutalist Type',
    category: 'font',
    version: '1.3.0',
    author: 'Google Fonts Registry',
    description: 'Hyper-stylized wide geometric grotesque font engineered for cutting-edge contemporary poster design and digital branding.',
    iconName: 'Type',
    tags: ['font', 'brutalist', 'display', 'modern', 'google-fonts'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: true,
    rating: 4.91,
    downloadsCount: 29000,
    updatedAt: Date.now(),
    createdAt: Date.now() - 17000000,
    parameters: [
      { id: 'sampleSize', label: 'Preview Size', type: 'slider', defaultValue: 40, min: 18, max: 72, step: 2, unit: 'pt' },
    ],
    currentParams: { sampleSize: 40 },
    fontConfig: {
      fontFamily: 'Syne',
      category: 'display',
      googleFontName: 'Syne:wght@500;700;800',
      weights: [500, 700, 800],
      sampleText: 'FUTURE VISION 2026',
    },
  },

  // ==========================================
  // 7. SOCIAL & LAYOUT TEMPLATES
  // ==========================================
  {
    id: 'template-story-reel',
    name: 'Minimalist Instagram Story / Reel Frame',
    category: 'template',
    version: '2.0.0',
    author: 'Canva Grade Studio',
    description: 'Sleek 9:16 vertical storytelling frame with minimal aesthetic borders, date badge, and floating typography caption.',
    iconName: 'Layout',
    tags: ['template', 'instagram', 'story', 'reel', 'tiktok', '9:16'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: true,
    rating: 4.94,
    downloadsCount: 52000,
    updatedAt: Date.now(),
    createdAt: Date.now() - 22000000,
    parameters: [
      { id: 'headlineText', label: 'Main Headline', type: 'text', defaultValue: 'SUMMER ARCHIVES' },
      { id: 'subtitleText', label: 'Subtitle / Location', type: 'text', defaultValue: 'Tokyo, Japan // 35.6762° N' },
      { id: 'frameBorder', label: 'Border Width', type: 'slider', defaultValue: 24, min: 0, max: 60, step: 4, unit: 'px' },
      { id: 'frameColor', label: 'Border Tone', type: 'color', defaultValue: '#09090b' },
    ],
    currentParams: {
      headlineText: 'SUMMER ARCHIVES',
      subtitleText: 'Tokyo, Japan // 35.6762° N',
      frameBorder: 24,
      frameColor: '#09090b',
    },
    templateData: {
      aspectRatio: '9:16',
      name: 'Minimal Story',
      category: 'story',
      elements: [
        {
          id: 'el-1',
          type: 'text',
          text: 'SUMMER ARCHIVES',
          x: 50,
          y: 12,
          fontSize: 28,
          fontWeight: '900',
          fontFamily: 'Syne',
          color: '#ffffff',
        },
        {
          id: 'el-2',
          type: 'badge',
          text: 'EDITION 04',
          x: 50,
          y: 18,
          fontSize: 10,
          fontWeight: '700',
          color: '#a1a1aa',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 12,
        },
      ],
      backgroundOverlay: {
        gradient: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%)',
        opacity: 0.8,
      },
    },
  },
  {
    id: 'template-youtube-thumbnail',
    name: 'High-CTR YouTube Video Thumbnail',
    category: 'template',
    version: '1.9.0',
    author: 'Creator Flow Media',
    description: '16:9 Thumbnail engine featuring high-contrast neon badge callout, bold headline dropshadow, and focus accent border.',
    iconName: 'Maximize2',
    tags: ['template', 'youtube', 'thumbnail', '16:9', 'high-ctr'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: true,
    rating: 4.97,
    downloadsCount: 61000,
    updatedAt: Date.now(),
    createdAt: Date.now() - 24000000,
    parameters: [
      { id: 'boldHook', label: 'Bold Hook Line', type: 'text', defaultValue: 'HOW I SHOT THIS!' },
      { id: 'badgeText', label: 'Callout Tag', type: 'text', defaultValue: '4K CINEMATIC' },
      { id: 'badgeColor', label: 'Accent Color', type: 'color', defaultValue: '#f59e0b' },
    ],
    currentParams: {
      boldHook: 'HOW I SHOT THIS!',
      badgeText: '4K CINEMATIC',
      badgeColor: '#f59e0b',
    },
    templateData: {
      aspectRatio: '16:9',
      name: 'Viral Thumbnail',
      category: 'youtube',
      elements: [
        {
          id: 'el-yt-1',
          type: 'badge',
          text: '4K CINEMATIC',
          x: 20,
          y: 20,
          fontSize: 14,
          fontWeight: '900',
          color: '#000000',
          backgroundColor: '#f59e0b',
          borderRadius: 8,
        },
        {
          id: 'el-yt-2',
          type: 'text',
          text: 'HOW I SHOT THIS!',
          x: 20,
          y: 40,
          fontSize: 48,
          fontWeight: '900',
          fontFamily: 'Syne',
          color: '#ffffff',
        },
      ],
    },
  },

  // ==========================================
  // 8. SCRIPTS & AUTOMATION MACROS
  // ==========================================
  {
    id: 'script-ecommerce-pipeline',
    name: 'E-Commerce 1-Click Polish & Export Macro',
    category: 'script',
    version: '2.0.0',
    author: 'Automation Pro',
    description: 'Executes automated batch pipeline: Smart unsharp mask clarity, balanced white balance neutralizer, subtle vignette, and crisp output.',
    iconName: 'Code',
    tags: ['script', 'macro', 'ecommerce', 'batch', 'automation', 'workflow'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: true,
    rating: 4.93,
    downloadsCount: 18200,
    updatedAt: Date.now(),
    createdAt: Date.now() - 11000000,
    parameters: [
      { id: 'clarityAmount', label: 'Edge Sharpening', type: 'slider', defaultValue: 25, min: 0, max: 60, step: 5 },
      { id: 'autoLevels', label: 'Auto White Balance Neutralizer', type: 'toggle', defaultValue: true },
      { id: 'addDropShadow', label: 'Subtle Vignette Focus', type: 'toggle', defaultValue: true },
    ],
    currentParams: { clarityAmount: 25, autoLevels: true, addDropShadow: true },
    code: `
// E-Commerce Polish Macro
(function(project, params) {
  const current = { ...project.currentSettings };
  current.exposure = (current.exposure || 0) + 0.15;
  current.contrast = (current.contrast || 0) + 14;
  current.clarity = (current.clarity || 0) + (params.clarityAmount || 25);
  current.whites = (current.whites || 0) + 12;
  current.highlights = (current.highlights || 0) - 10;
  if (params.addDropShadow) {
    current.vignette = (current.vignette || 0) + 15;
  }
  return {
    success: true,
    message: 'Applied E-Commerce Studio Optimization',
    modifiedSettings: current,
    logs: ['Adjusted exposure +0.15 EV', 'Applied edge sharpness +25', 'Balanced white highlights']
  };
})
    `,
  },
  {
    id: 'script-analog-film-macro',
    name: 'Vintage 35mm Analog Film Grain & Matte Black Macro',
    category: 'script',
    version: '1.7.0',
    author: 'Retro Foundry',
    description: 'Elevates black point to create nostalgic matte shadows, injects subtle green split toning, and adds organic film grain.',
    iconName: 'Film',
    tags: ['script', 'analog', 'matte', '35mm', 'grain'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: true,
    rating: 4.88,
    downloadsCount: 14700,
    updatedAt: Date.now(),
    createdAt: Date.now() - 6000000,
    parameters: [
      { id: 'matteShadowLevel', label: 'Shadow Lift (Matte)', type: 'slider', defaultValue: 25, min: 5, max: 60, step: 5 },
      { id: 'grainPower', label: 'Film Grain Density', type: 'slider', defaultValue: 35, min: 0, max: 80, step: 5, unit: '%' },
      { id: 'warmthTint', label: 'Warm Nostalgia Tint', type: 'slider', defaultValue: 12, min: -20, max: 40, step: 2 },
    ],
    currentParams: { matteShadowLevel: 25, grainPower: 35, warmthTint: 12 },
    code: `
(function(project, params) {
  const current = { ...project.currentSettings };
  current.blacks = (current.blacks || 0) + (params.matteShadowLevel || 25);
  current.contrast = (current.contrast || 0) - 8;
  current.temperature = (current.temperature || 0) + (params.warmthTint || 12);
  current.grain = (current.grain || 0) + (params.grainPower || 35);
  current.vibrance = (current.vibrance || 0) - 10;
  return {
    success: true,
    message: 'Applied 35mm Analog Film Transformation',
    modifiedSettings: current,
    logs: ['Lifted black curve for matte fade', 'Injected 35mm grain', 'Warmed color temperature']
  };
})
    `,
  },

  // ==========================================
  // 9. THIRD-PARTY INTEGRATIONS & WEBHOOKS
  // ==========================================
  {
    id: 'integration-unsplash',
    name: 'Unsplash Pro Royalty-Free Library',
    category: 'integration',
    version: '3.0.0',
    author: 'Unsplash Community',
    description: 'Instant search and 1-click import from over 5 million high-resolution stock photographs directly into your canvas workspace.',
    iconName: 'Compass',
    tags: ['integration', 'unsplash', 'stock-photos', 'assets', 'api'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: true,
    rating: 4.99,
    downloadsCount: 75000,
    updatedAt: Date.now(),
    createdAt: Date.now() - 35000000,
    parameters: [
      { id: 'curatedTopic', label: 'Default Category', type: 'select', defaultValue: 'editorial', options: [
        { label: 'Editorial & Fashion', value: 'editorial' },
        { label: 'Street & Architecture', value: 'street' },
        { label: 'Nature & Landscape', value: 'nature' },
        { label: 'Film & Nostalgia', value: 'film' },
      ]},
    ],
    currentParams: { curatedTopic: 'editorial' },
    integrationConfig: {
      serviceName: 'Unsplash',
      serviceType: 'stock_photo',
      status: 'connected',
    },
  },
  {
    id: 'integration-figma-relay',
    name: 'Figma Asset & Cloud Webhook Relay',
    category: 'integration',
    version: '1.2.0',
    author: 'Dev Platform Team',
    description: 'Seamlessly dispatch rendered creative assets to Figma webhook endpoints, Slack channels, or Zapier automation triggers.',
    iconName: 'ExternalLink',
    tags: ['integration', 'figma', 'webhook', 'zapier', 'slack', 'automation'],
    isBuiltin: true,
    isInstalled: true,
    isEnabled: false,
    rating: 4.86,
    downloadsCount: 9400,
    updatedAt: Date.now(),
    createdAt: Date.now() - 4000000,
    parameters: [
      { id: 'webhookUrl', label: 'Target Webhook URL', type: 'text', defaultValue: 'https://hooks.zapier.com/hooks/catch/lumina' },
      { id: 'exportFormat', label: 'Payload Format', type: 'select', defaultValue: 'png', options: [
        { label: 'High-Res PNG (Lossless)', value: 'png' },
        { label: 'WebP Compressed (Fast)', value: 'webp' },
        { label: 'JPEG (Standard)', value: 'jpeg' },
      ]},
      { id: 'notifyOnApproval', label: 'Trigger on Client Sign-off', type: 'toggle', defaultValue: true },
    ],
    currentParams: {
      webhookUrl: 'https://hooks.zapier.com/hooks/catch/lumina',
      exportFormat: 'png',
      notifyOnApproval: true,
    },
    integrationConfig: {
      serviceName: 'Figma & Webhooks',
      serviceType: 'webhook',
      status: 'configuring',
      webhookUrl: 'https://hooks.zapier.com/hooks/catch/lumina',
      exportFormat: 'png',
    },
  },
];
