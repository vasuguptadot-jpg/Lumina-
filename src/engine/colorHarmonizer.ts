import { AdjustmentSettings, HSLSettings } from '../types/editor';

export type HarmonizationScheme = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'monochromatic';

export interface HarmonyPalette {
  scheme: HarmonizationScheme;
  name: string;
  description: string;
  colors: string[]; // Hex colors
  adjustments: Partial<AdjustmentSettings>;
  hsl: Partial<HSLSettings>;
}

/**
 * Extract dominant hue from image canvas
 */
export function extractDominantHue(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || canvas.width === 0 || canvas.height === 0) return 30; // Default warm amber

  const step = Math.max(1, Math.floor(Math.sqrt((canvas.width * canvas.height) / 50000)));
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  const hueBins = new Float32Array(36); // 10-degree bins
  let maxWeight = 0;
  let dominantBin = 3; // 30 deg default

  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    // Only count pixels with sufficient color saturation
    if (delta > 0.15 && max > 0.15 && min < 0.9) {
      let h = 0;
      if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / delta + 2) * 60;
      else h = ((r - g) / delta + 4) * 60;

      const bin = Math.floor(((h % 360) + 360) % 360 / 10);
      hueBins[bin] += delta; // Weight by saturation intensity
      if (hueBins[bin] > maxWeight) {
        maxWeight = hueBins[bin];
        dominantBin = bin;
      }
    }
  }

  return dominantBin * 10 + 5;
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s / 100));
  l = Math.max(0, Math.min(1, l / 100));

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  const to255 = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to255(r)}${to255(g)}${to255(b)}`;
}

/**
 * Generate 5 intelligent color harmonies based on detected or selected base hue
 */
export function generateHarmonies(baseHue: number): HarmonyPalette[] {
  const normBase = ((baseHue % 360) + 360) % 360;
  const compHue = (normBase + 180) % 360;
  const split1 = (normBase + 150) % 360;
  const split2 = (normBase + 210) % 360;
  const ana1 = (normBase - 35 + 360) % 360;
  const ana2 = (normBase + 35) % 360;
  const tri1 = (normBase + 120) % 360;
  const tri2 = (normBase + 240) % 360;

  return [
    {
      scheme: 'complementary',
      name: 'Complementary Harmony',
      description: 'Dynamic two-tone visual tension between shadows and highlights.',
      colors: [hslToHex(compHue, 75, 45), hslToHex(normBase, 80, 55)],
      adjustments: {
        splitToning: {
          shadowHue: Math.round(compHue),
          shadowSat: 35,
          highlightHue: Math.round(normBase),
          highlightSat: 30,
          balance: 10,
        },
        colorWheels: {
          shadows: { hue: Math.round(compHue), sat: 30, lum: -5 },
          midtones: { hue: Math.round(normBase), sat: 15, lum: 0 },
          highlights: { hue: Math.round(normBase), sat: 35, lum: 5 },
          global: { hue: 0, sat: 0, lum: 0 },
        },
      },
      hsl: {},
    },
    {
      scheme: 'analogous',
      name: 'Analogous Serenity',
      description: 'Adjacent color family creating organic harmony and natural tranquility.',
      colors: [hslToHex(ana1, 70, 45), hslToHex(normBase, 75, 50), hslToHex(ana2, 70, 55)],
      adjustments: {
        splitToning: {
          shadowHue: Math.round(ana1),
          shadowSat: 25,
          highlightHue: Math.round(ana2),
          highlightSat: 25,
          balance: 0,
        },
        colorWheels: {
          shadows: { hue: Math.round(ana1), sat: 20, lum: 0 },
          midtones: { hue: Math.round(normBase), sat: 20, lum: 0 },
          highlights: { hue: Math.round(ana2), sat: 20, lum: 0 },
          global: { hue: 0, sat: 0, lum: 0 },
        },
      },
      hsl: {},
    },
    {
      scheme: 'split-complementary',
      name: 'Split-Complementary Richness',
      description: 'High contrast with nuanced, film-like color subtlety.',
      colors: [hslToHex(split1, 75, 45), hslToHex(normBase, 80, 55), hslToHex(split2, 75, 45)],
      adjustments: {
        splitToning: {
          shadowHue: Math.round(split1),
          shadowSat: 30,
          highlightHue: Math.round(normBase),
          highlightSat: 25,
          balance: 5,
        },
        colorWheels: {
          shadows: { hue: Math.round(split1), sat: 25, lum: -5 },
          midtones: { hue: Math.round(split2), sat: 20, lum: 0 },
          highlights: { hue: Math.round(normBase), sat: 30, lum: 5 },
          global: { hue: 0, sat: 0, lum: 0 },
        },
      },
      hsl: {},
    },
    {
      scheme: 'triadic',
      name: 'Triadic Vibrance',
      description: 'Balanced 3-way color geometry delivering vivid editorial energy.',
      colors: [hslToHex(tri1, 75, 45), hslToHex(normBase, 80, 50), hslToHex(tri2, 75, 55)],
      adjustments: {
        splitToning: {
          shadowHue: Math.round(tri1),
          shadowSat: 30,
          highlightHue: Math.round(tri2),
          highlightSat: 25,
          balance: 0,
        },
        colorWheels: {
          shadows: { hue: Math.round(tri1), sat: 25, lum: 0 },
          midtones: { hue: Math.round(normBase), sat: 20, lum: 0 },
          highlights: { hue: Math.round(tri2), sat: 25, lum: 0 },
          global: { hue: 0, sat: 0, lum: 0 },
        },
      },
      hsl: {},
    },
    {
      scheme: 'monochromatic',
      name: 'Monochromatic Elegance',
      description: 'Refined single-hue tonal richness across darks, mids, and specular lights.',
      colors: [hslToHex(normBase, 40, 30), hslToHex(normBase, 65, 50), hslToHex(normBase, 85, 75)],
      adjustments: {
        splitToning: {
          shadowHue: Math.round(normBase),
          shadowSat: 20,
          highlightHue: Math.round(normBase),
          highlightSat: 20,
          balance: 0,
        },
        colorWheels: {
          shadows: { hue: Math.round(normBase), sat: 15, lum: -5 },
          midtones: { hue: Math.round(normBase), sat: 20, lum: 0 },
          highlights: { hue: Math.round(normBase), sat: 25, lum: 5 },
          global: { hue: 0, sat: 0, lum: 0 },
        },
      },
      hsl: {},
    },
  ];
}
