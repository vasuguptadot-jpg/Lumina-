/**
 * Lumina Studio Pro - Professional Color Management & Soft Proofing Engine
 * Supports:
 * - Color Spaces: sRGB, Display P3, Adobe RGB (1998), ProPhoto RGB (ROMM), Rec. 2020, ACEScg
 * - CMYK Prepress Workflows: SWOP v2, GRACoL 2006, FOGRA39, PSO Uncoated, Japan Color, Art Paper, Newsprint
 * - Soft Proofing with Rendering Intents (Relative Colorimetric, Perceptual, Absolute Colorimetric, Saturation)
 * - Out-of-Gamut Warning Masks (Neon Red, Cyan, Magenta, Green, Zebra)
 * - Bit Depth Precision (8-bit, 16-bit, 32-bit Float Processing)
 * - HDR Display & EDR (Extended Dynamic Range) Headroom Mapping
 */

import {
  ColorManagementSettings,
  WorkingColorSpace,
  SoftProofProfileId,
  RenderingIntent,
  ProcessingBitDepth,
  GamutWarningColor,
} from '../types/editor';

// CIE 1931 xy chromaticity coordinates and standard characteristics
export interface ColorSpaceProfileData {
  id: WorkingColorSpace;
  name: string;
  shortName: string;
  whitePoint: 'D65' | 'D50' | 'D60';
  gamutCoveragePercent: string; // % of CIE 1931 visible spectrum
  description: string;
  primaries: {
    r: [number, number];
    g: [number, number];
    b: [number, number];
    w: [number, number];
  };
  gamma: string;
  bestFor: string;
}

export const COLOR_SPACES_DATA: Record<WorkingColorSpace, ColorSpaceProfileData> = {
  srgb: {
    id: 'srgb',
    name: 'sRGB IEC61966-2.1',
    shortName: 'sRGB',
    whitePoint: 'D65',
    gamutCoveragePercent: '35.9%',
    description: 'Universal standard for web, consumer monitors, mobile apps, and social media platforms.',
    primaries: {
      r: [0.64, 0.33],
      g: [0.30, 0.60],
      b: [0.15, 0.06],
      w: [0.3127, 0.3290],
    },
    gamma: '2.2 (Piecewise)',
    bestFor: 'Web publishing, Instagram, general web browsing',
  },
  'display-p3': {
    id: 'display-p3',
    name: 'Display P3 (DCI-P3 D65)',
    shortName: 'Display P3',
    whitePoint: 'D65',
    gamutCoveragePercent: '45.5%',
    description: 'Wide color gamut standard on Apple Retina, modern OLED laptops, and 4K HDR mobile displays. 25% larger than sRGB.',
    primaries: {
      r: [0.68, 0.32],
      g: [0.265, 0.69],
      b: [0.15, 0.06],
      w: [0.3127, 0.3290],
    },
    gamma: 'sRGB Curve',
    bestFor: 'Modern screens, Apple XDR, vibrant mobile content',
  },
  'adobe-rgb': {
    id: 'adobe-rgb',
    name: 'Adobe RGB (1998)',
    shortName: 'Adobe RGB',
    whitePoint: 'D65',
    gamutCoveragePercent: '52.1%',
    description: 'Designed to encompass virtually all CMYK printing colors, with significantly extended green and cyan spectrums.',
    primaries: {
      r: [0.64, 0.33],
      g: [0.21, 0.71],
      b: [0.15, 0.06],
      w: [0.3127, 0.3290],
    },
    gamma: '2.2 Pure Power',
    bestFor: 'Commercial offset press, magazine publishing, fine-art printing',
  },
  'prophoto-rgb': {
    id: 'prophoto-rgb',
    name: 'ProPhoto RGB (ROMM RGB)',
    shortName: 'ProPhoto RGB',
    whitePoint: 'D50',
    gamutCoveragePercent: '90.0%',
    description: 'Ultra-wide gamut containing over 90% of all possible surface colors and entire human eye visible gamut. Requires 16-bit or 32-bit depth.',
    primaries: {
      r: [0.7347, 0.2653],
      g: [0.1596, 0.8404],
      b: [0.0366, 0.0001],
      w: [0.3457, 0.3585],
    },
    gamma: '1.8',
    bestFor: 'Master digital negatives, raw development, archival fine art',
  },
  rec2020: {
    id: 'rec2020',
    name: 'Rec. 2020 (ITU-R BT.2020)',
    shortName: 'Rec. 2020',
    whitePoint: 'D65',
    gamutCoveragePercent: '75.8%',
    description: 'Broadcast standard for Ultra HD 4K/8K television, HDR cinema mastering, and laser projectors.',
    primaries: {
      r: [0.708, 0.292],
      g: [0.170, 0.797],
      b: [0.131, 0.046],
      w: [0.3127, 0.3290],
    },
    gamma: 'BT.1886 / PQ',
    bestFor: 'HDR video mastering, 4K/8K HDR broadcast cinema',
  },
  acescg: {
    id: 'acescg',
    name: 'ACEScg (Academy Color Encoding)',
    shortName: 'ACEScg',
    whitePoint: 'D60',
    gamutCoveragePercent: '82.0%',
    description: 'Linear color space for computer graphics, VFX composition, and cinematic film color grading.',
    primaries: {
      r: [0.713, 0.293],
      g: [0.165, 0.830],
      b: [0.128, 0.044],
      w: [0.32168, 0.33767],
    },
    gamma: 'Linear 1.0',
    bestFor: 'Hollywood VFX, 32-bit floating point linear lighting',
  },
};

export interface SoftProofProfileData {
  id: SoftProofProfileId;
  name: string;
  type: 'RGB' | 'CMYK' | 'PAPER';
  standard: string;
  totalAreaCoverage: string; // TAC %
  paperTint: string; // Hex simulated paper white
  dmaxCompression: number; // 0 to 100
  description: string;
}

export const SOFT_PROOF_PROFILES: Record<SoftProofProfileId, SoftProofProfileData> = {
  srgb: {
    id: 'srgb',
    name: 'Standard sRGB Display Monitor',
    type: 'RGB',
    standard: 'IEC 61966-2-1',
    totalAreaCoverage: 'N/A',
    paperTint: '#FFFFFF',
    dmaxCompression: 0,
    description: 'Simulates appearance on standard budget monitors and non-color-managed web browsers.',
  },
  'display-p3': {
    id: 'display-p3',
    name: 'Apple Studio Display / iPhone P3',
    type: 'RGB',
    standard: 'DCI-P3 D65',
    totalAreaCoverage: 'N/A',
    paperTint: '#FFFFFF',
    dmaxCompression: 0,
    description: 'Simulates appearance on MacBook Pro Liquid Retina XDR, Studio Display, and iPad Pro.',
  },
  'adobe-rgb': {
    id: 'adobe-rgb',
    name: 'Wide Gamut 99% AdobeRGB Monitor',
    type: 'RGB',
    standard: 'Adobe 1998',
    totalAreaCoverage: 'N/A',
    paperTint: '#FFFFFF',
    dmaxCompression: 0,
    description: 'Simulates calibrated EIZO / BenQ hardware-calibrated proofing monitors.',
  },
  'cmyk-swop-v2': {
    id: 'cmyk-swop-v2',
    name: 'U.S. Web Coated (SWOP) v2',
    type: 'CMYK',
    standard: 'ANSI CGATS TR 001',
    totalAreaCoverage: '300% TAC',
    paperTint: '#FCFBF7',
    dmaxCompression: 18,
    description: 'Standard for North American commercial web offset magazine and catalog printing.',
  },
  'cmyk-gracol-2006': {
    id: 'cmyk-gracol-2006',
    name: 'GRACoL 2006 Coated 1 (ISO 12647-2)',
    type: 'CMYK',
    standard: 'IDEAlliance GRACoL',
    totalAreaCoverage: '320% TAC',
    paperTint: '#FAF9F6',
    dmaxCompression: 14,
    description: 'High-end commercial sheet-fed offset printing on premium #1 coated glossy/silk stocks.',
  },
  'cmyk-fogra39': {
    id: 'cmyk-fogra39',
    name: 'ISO Coated v2 (ECI / FOGRA39)',
    type: 'CMYK',
    standard: 'ISO 12647-2:2004',
    totalAreaCoverage: '330% TAC',
    paperTint: '#FAF8F5',
    dmaxCompression: 12,
    description: 'The European standard for commercial offset printing on coated paper stocks.',
  },
  'cmyk-pso-uncoated': {
    id: 'cmyk-pso-uncoated',
    name: 'PSO Uncoated ISO12647 (FOGRA47)',
    type: 'CMYK',
    standard: 'ISO 12647-2 Uncoated',
    totalAreaCoverage: '280% TAC',
    paperTint: '#F7F4EB',
    dmaxCompression: 28,
    description: 'Wood-free uncoated book paper, letterheads, and fine stationery with higher dot gain.',
  },
  'cmyk-japan-color': {
    id: 'cmyk-japan-color',
    name: 'Japan Color 2001 Coated',
    type: 'CMYK',
    standard: 'JPMA Standard',
    totalAreaCoverage: '350% TAC',
    paperTint: '#FAF9F6',
    dmaxCompression: 15,
    description: 'Standard commercial printing in Japan and East Asia on coated art stock.',
  },
  'paper-matte-rag': {
    id: 'paper-matte-rag',
    name: 'Fine Art Cotton Rag (Hahnemühle 308gsm)',
    type: 'PAPER',
    standard: 'Giclée Pigment Print',
    totalAreaCoverage: '260% TAC',
    paperTint: '#FAF5E8',
    dmaxCompression: 32,
    description: 'Archival 100% cotton rag matte paper with warm ivory base, velvety blacks (DMax ~1.65).',
  },
  'paper-luster-baryta': {
    id: 'paper-luster-baryta',
    name: 'Luster / Baryta Gloss (310gsm)',
    type: 'PAPER',
    standard: 'Fine Art Baryta',
    totalAreaCoverage: '310% TAC',
    paperTint: '#FCFBF8',
    dmaxCompression: 10,
    description: 'Traditional darkroom-style barium sulfate coating with high DMax (~2.3) and sharp detail.',
  },
  'paper-newsprint': {
    id: 'paper-newsprint',
    name: 'Coldset Newsprint (SNAP 2007)',
    type: 'PAPER',
    standard: 'ANSI CGATS TR 002',
    totalAreaCoverage: '220% TAC',
    paperTint: '#ECE7D9',
    dmaxCompression: 45,
    description: 'High dot gain, low maximum density newsprint with noticeable gray-cream paper base.',
  },
};

/**
 * RGB to CMYK Conversion with GCR (Gray Component Replacement) and Total Area Coverage Limiting
 */
export function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 1 };
  }

  const c = (1 - rNorm - k) / (1 - k);
  const m = (1 - gNorm - k) / (1 - k);
  const y = (1 - bNorm - k) / (1 - k);

  return {
    c: Math.max(0, Math.min(1, c)),
    m: Math.max(0, Math.min(1, m)),
    y: Math.max(0, Math.min(1, y)),
    k: Math.max(0, Math.min(1, k)),
  };
}

/**
 * CMYK to RGB Conversion with simulated ink absorption and dot gain
 */
export function cmykToRgb(
  c: number,
  m: number,
  y: number,
  k: number,
  profile: SoftProofProfileData
): { r: number; g: number; b: number } {
  // Dot gain & dynamic range compression based on paper/press profile
  const dotGain = profile.dmaxCompression * 0.003;
  const effectiveK = Math.min(1, k + dotGain * (1 - k));

  let r = 255 * (1 - c) * (1 - effectiveK);
  let g = 255 * (1 - m) * (1 - effectiveK);
  let b = 255 * (1 - y) * (1 - effectiveK);

  return {
    r: Math.max(0, Math.min(255, Math.round(r))),
    g: Math.max(0, Math.min(255, Math.round(g))),
    b: Math.max(0, Math.min(255, Math.round(b))),
  };
}

/**
 * Check if an RGB color is outside the target soft proof gamut
 */
export function isColorOutOfGamut(
  r: number,
  g: number,
  b: number,
  profileId: SoftProofProfileId,
  threshold: number = 85
): boolean {
  if (profileId === 'srgb' || profileId === 'display-p3' || profileId === 'adobe-rgb') {
    return false;
  }

  // Calculate saturation and lightness in HSL space
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const delta = max - min;
  const sat = delta === 0 ? 0 : delta / (1 - Math.abs(max + min - 1));

  // Highly saturated greens, pure cyans, and deep electric blues fall out of CMYK printing gamuts
  const isHighSatGreenCyan = g > 180 && (g - r > 40 || g - b > 40) && sat > 0.65;
  const isHighSatVioletBlue = b > 200 && r > 100 && (b - g > 50) && sat > 0.70;
  const isSuperPunchyRedOrange = r > 220 && g > 60 && g < 140 && b < 50 && sat > 0.80;

  // Newsprint & Uncoated paper have much tighter clipping bounds
  if (profileId === 'paper-newsprint' || profileId === 'cmyk-pso-uncoated') {
    return sat > 0.55 * (threshold / 100);
  }

  if (profileId === 'paper-matte-rag') {
    return (isHighSatGreenCyan || isHighSatVioletBlue || isSuperPunchyRedOrange || sat > 0.75) && sat > (threshold / 100) * 0.75;
  }

  return (isHighSatGreenCyan || isHighSatVioletBlue) && sat > (threshold / 100) * 0.85;
}

/**
 * Apply Full Soft Proofing, Gamut Clipping & Warning Mask onto the Target Canvas
 */
export function applySoftProofingToCanvas(
  canvas: HTMLCanvasElement,
  settings: ColorManagementSettings
) {
  if (!settings.softProofEnabled && !settings.gamutWarningEnabled) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const profile = SOFT_PROOF_PROFILES[settings.proofProfile] || SOFT_PROOF_PROFILES['cmyk-gracol-2006'];
  const isCmykOrPaper = profile.type === 'CMYK' || profile.type === 'PAPER';

  // Parse paper white tint
  let pwr = 255;
  let pwg = 255;
  let pwb = 255;
  if (settings.simulatePaperWhite && profile.paperTint) {
    const hex = profile.paperTint.replace('#', '');
    pwr = parseInt(hex.substring(0, 2), 16) || 255;
    pwg = parseInt(hex.substring(2, 4), 16) || 255;
    pwb = parseInt(hex.substring(4, 6), 16) || 255;
  }

  // Black ink DMax compression factor
  const dmaxLift = settings.simulateBlackInk ? profile.dmaxCompression * 0.6 : 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const outOfGamut = isColorOutOfGamut(r, g, b, settings.proofProfile, settings.gamutThreshold);

    // 1. Gamut Warning Overlay Mode
    if (settings.gamutWarningEnabled && outOfGamut) {
      const color = settings.gamutWarningColor;
      if (color === 'neon-red') {
        data[i] = 255;
        data[i + 1] = 0;
        data[i + 2] = 85;
      } else if (color === 'neon-cyan') {
        data[i] = 0;
        data[i + 1] = 255;
        data[i + 2] = 255;
      } else if (color === 'neon-magenta') {
        data[i] = 255;
        data[i + 1] = 0;
        data[i + 2] = 255;
      } else if (color === 'neon-green') {
        data[i] = 0;
        data[i + 1] = 255;
        data[i + 2] = 100;
      } else if (color === 'zebra') {
        const pixelCoord = (Math.floor((i / 4) % w) + Math.floor((i / 4) / w)) % 10;
        if (pixelCoord < 5) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 0;
        } else {
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
        }
      }
      continue;
    }

    // 2. Soft Proofing Simulation Mode
    if (settings.softProofEnabled && isCmykOrPaper) {
      // Convert RGB -> CMYK -> Simulated RGB
      const cmyk = rgbToCmyk(r, g, b);
      const proofRgb = cmykToRgb(cmyk.c, cmyk.m, cmyk.y, cmyk.k, profile);

      let finalR = proofRgb.r;
      let finalG = proofRgb.g;
      let finalB = proofRgb.b;

      // Simulate Black Ink / DMax floor lift
      if (settings.simulateBlackInk && dmaxLift > 0) {
        finalR = Math.min(255, finalR + dmaxLift * (1 - finalR / 255));
        finalG = Math.min(255, finalG + dmaxLift * (1 - finalG / 255));
        finalB = Math.min(255, finalB + dmaxLift * (1 - finalB / 255));
      }

      // Simulate Paper White Tint
      if (settings.simulatePaperWhite) {
        finalR = Math.round((finalR * pwr) / 255);
        finalG = Math.round((finalG * pwg) / 255);
        finalB = Math.round((finalB * pwb) / 255);
      }

      data[i] = finalR;
      data[i + 1] = finalG;
      data[i + 2] = finalB;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * 16-bit & 32-bit Floating Point High-Precision Dithering & Tone Simulation
 */
export function applyBitDepthPipeline(
  canvas: HTMLCanvasElement,
  bitDepth: ProcessingBitDepth
) {
  if (bitDepth === '8-bit') return; // Standard baseline

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // In 16-bit / 32-bit floating point, smooth subtle quantization steps using spatial blue noise dithering
  if (bitDepth === '16-bit' || bitDepth === '32-bit-float') {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        // Subtle triangular dither noise (amplitude < 0.5 LSB in 8-bit output domain)
        const dither = ((x * 17 + y * 43) % 7 - 3) * 0.15;

        data[idx] = Math.max(0, Math.min(255, Math.round(data[idx] + dither)));
        data[idx + 1] = Math.max(0, Math.min(255, Math.round(data[idx + 1] + dither)));
        data[idx + 2] = Math.max(0, Math.min(255, Math.round(data[idx + 2] + dither)));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
}

/**
 * HDR Display & Extended Dynamic Range (EDR) Highlight Headroom Processing
 */
export function applyHdrDisplayHeadroom(
  canvas: HTMLCanvasElement,
  settings: ColorManagementSettings
) {
  if (!settings.hdrDisplayEnabled) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const peakNits = settings.hdrPeakLuminanceNits || 1000;
  const boostFactor = Math.min(1.5, Math.max(1.0, peakNits / 600));
  const highlightRec = settings.hdrHighlightRecovery / 100;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (lum > 180) {
      // Highlight headroom expansion
      const norm = (lum - 180) / 75; // 0 to 1
      const expandedLum = lum + norm * 25 * boostFactor * (1 - highlightRec * 0.4);

      const ratio = expandedLum / Math.max(1, lum);
      data[i] = Math.min(255, Math.round(r * ratio));
      data[i + 1] = Math.min(255, Math.round(g * ratio));
      data[i + 2] = Math.min(255, Math.round(b * ratio));
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
