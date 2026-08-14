// 3D LUT Engine (.cube format parser, trilinear 3D interpolation, built-in pro LUTs, and .cube export)

export interface Parsed3DLUT {
  title: string;
  size: number;
  data: Float32Array; // Flattened size*size*size*3 values (0.0 - 1.0)
  domainMin: [number, number, number];
  domainMax: [number, number, number];
}

export interface PresetLUTInfo {
  id: string;
  name: string;
  category: 'Cinematic' | 'Film Emulation' | 'Vintage' | 'Creative' | 'Monochrome';
  description: string;
  colorPreview: [string, string]; // 2-color gradient
  generator: (r: number, g: number, b: number) => [number, number, number];
}

/**
 * Parse standard Adobe / DaVinci Resolve .cube 3D or 1D LUT files
 */
export function parseCubeLUT(cubeText: string): Parsed3DLUT | null {
  try {
    const lines = cubeText.split(/\r?\n/);
    let title = 'Custom LUT';
    let size = 0;
    const domainMin: [number, number, number] = [0, 0, 0];
    const domainMax: [number, number, number] = [1, 1, 1];
    const rawNumbers: number[] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;

      if (line.startsWith('TITLE')) {
        title = line.replace(/^TITLE\s+["']?/, '').replace(/["']?$/, '').trim();
      } else if (line.startsWith('LUT_3D_SIZE')) {
        const parts = line.split(/\s+/);
        size = parseInt(parts[1], 10);
      } else if (line.startsWith('DOMAIN_MIN')) {
        const parts = line.split(/\s+/).slice(1).map(Number);
        if (parts.length >= 3) domainMin.splice(0, 3, parts[0], parts[1], parts[2]);
      } else if (line.startsWith('DOMAIN_MAX')) {
        const parts = line.split(/\s+/).slice(1).map(Number);
        if (parts.length >= 3) domainMax.splice(0, 3, parts[0], parts[1], parts[2]);
      } else {
        // RGB float triples
        const parts = line.split(/\s+/).map(Number);
        if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          rawNumbers.push(parts[0], parts[1], parts[2]);
        }
      }
    }

    if (size === 0) {
      // Estimate size based on cube root of number of triples
      const count = rawNumbers.length / 3;
      const cubeRoot = Math.round(Math.cbrt(count));
      if (cubeRoot * cubeRoot * cubeRoot === count && cubeRoot >= 2) {
        size = cubeRoot;
      } else {
        // Fallback default
        size = 33;
      }
    }

    const totalNeeded = size * size * size * 3;
    const data = new Float32Array(totalNeeded);

    for (let i = 0; i < totalNeeded; i++) {
      data[i] = i < rawNumbers.length ? Math.max(0, Math.min(1, rawNumbers[i])) : 0;
    }

    return {
      title,
      size,
      data,
      domainMin,
      domainMax,
    };
  } catch (err) {
    console.error('Failed to parse .cube LUT:', err);
    return null;
  }
}

/**
 * Trilinear 3D Interpolation inside a 3D Color Cube (RGB normalized 0..1 to 0..255)
 */
export function sample3DLUT(
  rNorm: number,
  gNorm: number,
  bNorm: number,
  lut: Parsed3DLUT
): [number, number, number] {
  const { size, data } = lut;
  const maxIdx = size - 1;

  const rIdx = Math.max(0, Math.min(maxIdx, rNorm * maxIdx));
  const gIdx = Math.max(0, Math.min(maxIdx, gNorm * maxIdx));
  const bIdx = Math.max(0, Math.min(maxIdx, bNorm * maxIdx));

  const r0 = Math.floor(rIdx);
  const r1 = Math.min(maxIdx, r0 + 1);
  const g0 = Math.floor(gIdx);
  const g1 = Math.min(maxIdx, g0 + 1);
  const b0 = Math.floor(bIdx);
  const b1 = Math.min(maxIdx, b0 + 1);

  const dr = rIdx - r0;
  const dg = gIdx - g0;
  const db = bIdx - b0;

  // Helper index lookup: standard .cube ordering is r fastest, then g, then b
  const getIdx = (r: number, g: number, b: number) => (r + g * size + b * size * size) * 3;

  const c000 = getIdx(r0, g0, b0);
  const c100 = getIdx(r1, g0, b0);
  const c010 = getIdx(r0, g1, b0);
  const c110 = getIdx(r1, g1, b0);
  const c001 = getIdx(r0, g0, b1);
  const c101 = getIdx(r1, g0, b1);
  const c011 = getIdx(r0, g1, b1);
  const c111 = getIdx(r1, g1, b1);

  let outR = 0, outG = 0, outB = 0;

  for (let c = 0; c < 3; c++) {
    const v000 = data[c000 + c];
    const v100 = data[c100 + c];
    const v010 = data[c010 + c];
    const v110 = data[c110 + c];
    const v001 = data[c001 + c];
    const v101 = data[c101 + c];
    const v011 = data[c011 + c];
    const v111 = data[c111 + c];

    // Trilinear interpolation weights
    const c00 = v000 * (1 - dr) + v100 * dr;
    const c10 = v010 * (1 - dr) + v110 * dr;
    const c01 = v001 * (1 - dr) + v101 * dr;
    const c11 = v011 * (1 - dr) + v111 * dr;

    const c0 = c00 * (1 - dg) + c10 * dg;
    const c1 = c01 * (1 - dg) + c11 * dg;

    const val = c0 * (1 - db) + c1 * db;

    if (c === 0) outR = val * 255;
    else if (c === 1) outG = val * 255;
    else outB = val * 255;
  }

  return [outR, outG, outB];
}

/**
 * Built-in Curated Professional Cinematic LUTs
 */
export const PRESET_LUTS: PresetLUTInfo[] = [
  {
    id: 'teal-orange',
    name: 'Teal & Orange Blockbuster',
    category: 'Cinematic',
    description: 'Hollywood cinema standard: rich cyan shadows with glowing warm amber skin tones.',
    colorPreview: ['#0d9488', '#f59e0b'],
    generator: (r, g, b) => {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const normLum = lum / 255;
      // Cool teal in shadows, warm golden in highlights
      const shadowTealR = r * 0.75;
      const shadowTealG = g * 1.05 + 10;
      const shadowTealB = b * 1.25 + 20;

      const highOrangeR = r * 1.2 + 15;
      const highOrangeG = g * 0.95 + 5;
      const highOrangeB = b * 0.7;

      const mix = normLum;
      return [
        shadowTealR * (1 - mix) + highOrangeR * mix,
        shadowTealG * (1 - mix) + highOrangeG * mix,
        shadowTealB * (1 - mix) + highOrangeB * mix,
      ];
    },
  },
  {
    id: 'kodak-portra',
    name: 'Kodak Portra 400',
    category: 'Film Emulation',
    description: 'Warm editorial film: flattering skin tones, soft pastel highlights, and gentle shadow roll-off.',
    colorPreview: ['#d97706', '#fbbf24'],
    generator: (r, g, b) => {
      // Gentle contrast curve, slight yellow/warm red boost, lifted shadow floor
      const nr = Math.pow(r / 255, 0.92) * 255 * 1.04;
      const ng = Math.pow(g / 255, 0.96) * 255 * 0.98;
      const nb = Math.pow(b / 255, 1.05) * 255 * 0.88;
      return [nr + 6, ng + 4, nb + 2];
    },
  },
  {
    id: 'fuji-pro-400h',
    name: 'Fujifilm Pro 400H',
    category: 'Film Emulation',
    description: 'Airy wedding film: fresh mint greens, soft lavender shadow tones, and glowing highlights.',
    colorPreview: ['#10b981', '#a855f7'],
    generator: (r, g, b) => {
      const nr = Math.pow(r / 255, 1.02) * 255 * 0.98;
      const ng = Math.pow(g / 255, 0.92) * 255 * 1.05 + 5;
      const nb = Math.pow(b / 255, 0.95) * 255 * 1.02 + 8;
      return [nr, ng, nb];
    },
  },
  {
    id: 'cyberpunk-neo',
    name: 'Cyberpunk Neo-Tokyo',
    category: 'Creative',
    description: 'High-contrast nocturnal look with neon cyan reflections and electric magenta highlights.',
    colorPreview: ['#06b6d4', '#ec4899'],
    generator: (r, g, b) => {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      let nr = r > 128 ? r * 1.35 + 20 : r * 0.5;
      let ng = lum < 120 ? g * 1.1 + 15 : g * 0.7;
      let nb = b * 1.3 + 25;
      return [nr, ng, nb];
    },
  },
  {
    id: 'bleach-bypass',
    name: 'Bleach Bypass Silver',
    category: 'Cinematic',
    description: 'Desaturated, high-contrast silver retention aesthetic reminiscent of David Fincher films.',
    colorPreview: ['#475569', '#cbd5e1'],
    generator: (r, g, b) => {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      // High contrast S-curve on luminance
      const normLum = lum / 255;
      const contrastLum = (normLum < 0.5 ? 2 * normLum * normLum : 1 - 2 * (1 - normLum) * (1 - normLum)) * 255;
      // Desaturate 60%
      const nr = lum * 0.65 + r * 0.35 + (contrastLum - lum) * 0.8;
      const ng = lum * 0.65 + g * 0.35 + (contrastLum - lum) * 0.8;
      const nb = lum * 0.65 + b * 0.35 + (contrastLum - lum) * 0.8;
      return [nr, ng, nb];
    },
  },
  {
    id: 'vintage-warm',
    name: '70s Golden Nostalgia',
    category: 'Vintage',
    description: 'Dreamy retro sunlight with rich golden midtones and faded charcoal blacks.',
    colorPreview: ['#ea580c', '#eab308'],
    generator: (r, g, b) => {
      const nr = r * 1.15 + 14;
      const ng = g * 1.02 + 8;
      const nb = b * 0.82 + 18; // Lifted warm black
      return [nr, ng, nb];
    },
  },
  {
    id: 'forest-emerald',
    name: 'Moody Pine Forest',
    category: 'Creative',
    description: 'Deep forest atmosphere: desaturated warm tones and rich lush emerald foliage.',
    colorPreview: ['#065f46', '#047857'],
    generator: (r, g, b) => {
      const nr = r * 0.85;
      const ng = g * 1.12 + 6;
      const nb = b * 0.9;
      return [nr, ng, nb];
    },
  },
  {
    id: 'leica-monolith',
    name: 'Leica Monolith B&W',
    category: 'Monochrome',
    description: 'Ultra high-contrast fine art black and white with deep shadow punch and crisp whites.',
    colorPreview: ['#0f172a', '#f8fafc'],
    generator: (r, g, b) => {
      // Orthochromatic luminance formula
      let lum = 0.32 * r + 0.55 * g + 0.13 * b;
      // Harsh contrast curve
      const norm = lum / 255;
      const curved = Math.pow(norm, 1.3) * 255;
      return [curved, curved, curved];
    },
  },
  {
    id: 'sunset-crimson',
    name: 'Sunset Crimson Fire',
    category: 'Creative',
    description: 'Vibrant golden hour glow with saturated tangerine mids and crimson red highlights.',
    colorPreview: ['#dc2626', '#f97316'],
    generator: (r, g, b) => {
      const nr = r * 1.28 + 10;
      const ng = g * 0.92;
      const nb = b * 0.72;
      return [nr, ng, nb];
    },
  },
  {
    id: 'pastel-film',
    name: 'Pastel Dreamscape',
    category: 'Vintage',
    description: 'Soft dreamy tones with lifted matte blacks, muted saturation, and luminous highlights.',
    colorPreview: ['#ec4899', '#38bdf8'],
    generator: (r, g, b) => {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      // Lift shadow floor
      const nr = 22 + r * 0.88;
      const ng = 20 + g * 0.86;
      const nb = 28 + b * 0.88;
      return [nr, ng, nb];
    },
  },
];

// In-memory cache for parsed preset 3D LUTs
const cachedPresetLUTs: Map<string, Parsed3DLUT> = new Map();

/**
 * Generate or get precomputed 3D LUT for a built-in preset
 */
export function getPresetLUT(lutId: string, size = 33): Parsed3DLUT | null {
  if (cachedPresetLUTs.has(lutId)) {
    return cachedPresetLUTs.get(lutId)!;
  }

  const preset = PRESET_LUTS.find((p) => p.id === lutId);
  if (!preset) return null;

  const total = size * size * size * 3;
  const data = new Float32Array(total);
  const maxIdx = size - 1;

  for (let b = 0; b < size; b++) {
    const bNorm = b / maxIdx;
    for (let g = 0; g < size; g++) {
      const gNorm = g / maxIdx;
      for (let r = 0; r < size; r++) {
        const rNorm = r / maxIdx;
        const [outR, outG, outB] = preset.generator(rNorm * 255, gNorm * 255, bNorm * 255);
        const idx = (r + g * size + b * size * size) * 3;
        data[idx] = Math.max(0, Math.min(1, outR / 255));
        data[idx + 1] = Math.max(0, Math.min(1, outG / 255));
        data[idx + 2] = Math.max(0, Math.min(1, outB / 255));
      }
    }
  }

  const parsed: Parsed3DLUT = {
    title: preset.name,
    size,
    data,
    domainMin: [0, 0, 0],
    domainMax: [1, 1, 1],
  };

  cachedPresetLUTs.set(lutId, parsed);
  return parsed;
}

/**
 * Export current pipeline look to a standard Adobe / DaVinci Resolve .cube 3D LUT string
 */
export function exportToCubeLUT(
  lutName: string,
  sampleFunction: (r: number, g: number, b: number) => [number, number, number],
  size = 33
): string {
  let cube = `# Created with Professional Color Grading Studio\n`;
  cube += `# Dimensions: ${size}x${size}x${size}\n`;
  cube += `TITLE "${lutName}"\n`;
  cube += `LUT_3D_SIZE ${size}\n`;
  cube += `DOMAIN_MIN 0.0 0.0 0.0\n`;
  cube += `DOMAIN_MAX 1.0 1.0 1.0\n\n`;

  const maxIdx = size - 1;

  for (let b = 0; b < size; b++) {
    const bVal = (b / maxIdx) * 255;
    for (let g = 0; g < size; g++) {
      const gVal = (g / maxIdx) * 255;
      for (let r = 0; r < size; r++) {
        const rVal = (r / maxIdx) * 255;
        const [outR, outG, outB] = sampleFunction(rVal, gVal, bVal);
        const rF = (Math.max(0, Math.min(255, outR)) / 255).toFixed(6);
        const gF = (Math.max(0, Math.min(255, outG)) / 255).toFixed(6);
        const bF = (Math.max(0, Math.min(255, outB)) / 255).toFixed(6);
        cube += `${rF} ${gF} ${bF}\n`;
      }
    }
  }

  return cube;
}
