import { CameraProfileId } from '../types/editor';

export interface CameraProfileDefinition {
  id: CameraProfileId;
  name: string;
  category: 'Adobe-Like' | 'Camera Matching';
  description: string;
  colors: string[]; // preview swatches
  // Characteristic matrix & tonal bias
  contrastCurve: (v: number) => number;
  saturationFactor: number;
  skinTonePreserve: number; // 0 to 1
  colorMatrix: [
    number, number, number, // R weights
    number, number, number, // G weights
    number, number, number  // B weights
  ];
  shadowTint: [number, number, number];
  highlightWarmth: number; // -1 to 1
}

// S-curve helper
function sCurve(x: number, steepness = 1.8): number {
  const norm = x / 255;
  let curved: number;
  if (norm < 0.5) {
    curved = 0.5 * Math.pow(2 * norm, steepness);
  } else {
    curved = 1 - 0.5 * Math.pow(2 * (1 - norm), steepness);
  }
  return curved * 255;
}

// Flat log curve helper (simulates sensor Log/Flat profiles)
function logCurve(x: number): number {
  const norm = x / 255;
  // Lift shadows from 0 to ~30, compress highlights smoothly
  const lifted = Math.log(1 + 9 * norm) / Math.log(10);
  return (lifted * 0.85 + 0.08) * 255;
}

export const CAMERA_PROFILES: CameraProfileDefinition[] = [
  // 1. ADOBE-LIKE PROFILES
  {
    id: 'adobe-standard',
    name: 'Adobe Standard',
    category: 'Adobe-Like',
    description: 'Faithful, neutral baseline color rendition with balanced tonal contrast.',
    colors: ['#3b82f6', '#f59e0b', '#10b981'],
    contrastCurve: (v) => sCurve(v, 1.25),
    saturationFactor: 1.0,
    skinTonePreserve: 0.8,
    colorMatrix: [
      1.02, -0.01, -0.01,
      -0.01, 1.02, -0.01,
      -0.01, -0.01, 1.02,
    ],
    shadowTint: [0, 0, 0],
    highlightWarmth: 0.0,
  },
  {
    id: 'adobe-color',
    name: 'Adobe Color',
    category: 'Adobe-Like',
    description: 'Default modern Adobe profile with lively contrast, punchy warm tones, and rich sky blues.',
    colors: ['#2563eb', '#f97316', '#059669'],
    contrastCurve: (v) => sCurve(v, 1.45),
    saturationFactor: 1.15,
    skinTonePreserve: 0.85,
    colorMatrix: [
      1.08, -0.05, -0.03,
      -0.03, 1.06, -0.03,
      -0.02, -0.04, 1.1,
    ],
    shadowTint: [-2, 0, 4],
    highlightWarmth: 0.04,
  },
  {
    id: 'adobe-portrait',
    name: 'Adobe Portrait',
    category: 'Adobe-Like',
    description: 'Gentle midtone contrast and optimized peach/melanin tones for soft, natural skin textures.',
    colors: ['#fca5a5', '#fdba74', '#fde047'],
    contrastCurve: (v) => sCurve(v, 1.15),
    saturationFactor: 0.95,
    skinTonePreserve: 0.95,
    colorMatrix: [
      1.04, -0.02, -0.02,
      -0.01, 1.01, 0.0,
      -0.03, -0.02, 1.01,
    ],
    shadowTint: [1, 0, -1],
    highlightWarmth: 0.06,
  },
  {
    id: 'adobe-landscape',
    name: 'Adobe Landscape',
    category: 'Adobe-Like',
    description: 'Deep polarized skies, vibrant foliage greens, and strong tonal separation.',
    colors: ['#0284c7', '#16a34a', '#d97706'],
    contrastCurve: (v) => sCurve(v, 1.6),
    saturationFactor: 1.25,
    skinTonePreserve: 0.4,
    colorMatrix: [
      1.05, -0.02, -0.03,
      -0.04, 1.12, -0.08,
      -0.03, -0.05, 1.15,
    ],
    shadowTint: [-3, -1, 4],
    highlightWarmth: -0.02,
  },
  {
    id: 'adobe-vivid',
    name: 'Adobe Vivid',
    category: 'Adobe-Like',
    description: 'High dynamic saturation and sharp punchy contrast across all spectrums.',
    colors: ['#ec4899', '#8b5cf6', '#3b82f6'],
    contrastCurve: (v) => sCurve(v, 1.7),
    saturationFactor: 1.35,
    skinTonePreserve: 0.5,
    colorMatrix: [
      1.14, -0.08, -0.06,
      -0.06, 1.12, -0.06,
      -0.05, -0.07, 1.18,
    ],
    shadowTint: [0, 0, 0],
    highlightWarmth: 0.02,
  },
  {
    id: 'adobe-neutral',
    name: 'Adobe Neutral',
    category: 'Adobe-Like',
    description: 'Reduced contrast and linear dynamic latitude, optimal for meticulous master grading.',
    colors: ['#94a3b8', '#64748b', '#475569'],
    contrastCurve: (v) => sCurve(v, 0.95),
    saturationFactor: 0.88,
    skinTonePreserve: 0.9,
    colorMatrix: [
      0.98, 0.01, 0.01,
      0.01, 0.98, 0.01,
      0.01, 0.01, 0.98,
    ],
    shadowTint: [0, 0, 0],
    highlightWarmth: 0.0,
  },

  // 2. CAMERA MATCHING PROFILES
  {
    id: 'camera-standard',
    name: 'Camera Standard',
    category: 'Camera Matching',
    description: 'Emulates in-camera JPEG rendering engine with balanced pleasing saturation.',
    colors: ['#ef4444', '#10b981', '#3b82f6'],
    contrastCurve: (v) => sCurve(v, 1.38),
    saturationFactor: 1.1,
    skinTonePreserve: 0.85,
    colorMatrix: [
      1.06, -0.04, -0.02,
      -0.02, 1.05, -0.03,
      -0.02, -0.03, 1.08,
    ],
    shadowTint: [-1, 0, 2],
    highlightWarmth: 0.02,
  },
  {
    id: 'camera-flat',
    name: 'Camera Flat / Log',
    category: 'Camera Matching',
    description: 'Ultra-wide dynamic range Log curve with lifted shadows and protected highlight headroom.',
    colors: ['#cbd5e1', '#94a3b8', '#64748b'],
    contrastCurve: (v) => logCurve(v),
    saturationFactor: 0.75,
    skinTonePreserve: 0.95,
    colorMatrix: [
      0.92, 0.04, 0.04,
      0.04, 0.92, 0.04,
      0.04, 0.04, 0.92,
    ],
    shadowTint: [2, 2, 3],
    highlightWarmth: 0.0,
  },
  {
    id: 'camera-portrait',
    name: 'Camera Portrait',
    category: 'Camera Matching',
    description: 'Manufacturer portrait style with luminous skin tone smoothing and warm highlight glow.',
    colors: ['#f472b6', '#fb923c', '#facc15'],
    contrastCurve: (v) => sCurve(v, 1.2),
    saturationFactor: 0.98,
    skinTonePreserve: 0.95,
    colorMatrix: [
      1.06, -0.03, -0.03,
      -0.01, 1.02, -0.01,
      -0.03, -0.03, 1.03,
    ],
    shadowTint: [2, 0, -2],
    highlightWarmth: 0.05,
  },
  {
    id: 'camera-landscape',
    name: 'Camera Landscape',
    category: 'Camera Matching',
    description: 'In-camera landscape mode boosting yellow-greens and azure horizons.',
    colors: ['#059669', '#0284c7', '#d97706'],
    contrastCurve: (v) => sCurve(v, 1.55),
    saturationFactor: 1.28,
    skinTonePreserve: 0.45,
    colorMatrix: [
      1.04, -0.02, -0.02,
      -0.05, 1.15, -0.1,
      -0.02, -0.06, 1.16,
    ],
    shadowTint: [-2, 0, 3],
    highlightWarmth: -0.01,
  },
  {
    id: 'camera-faithful',
    name: 'Camera Faithful',
    category: 'Camera Matching',
    description: 'Precision calorimetric studio reproduction matching true subject illumination.',
    colors: ['#64748b', '#475569', '#334155'],
    contrastCurve: (v) => sCurve(v, 1.1),
    saturationFactor: 0.95,
    skinTonePreserve: 0.9,
    colorMatrix: [
      1.0, 0.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 0.0, 1.0,
    ],
    shadowTint: [0, 0, 0],
    highlightWarmth: 0.0,
  },
  {
    id: 'camera-monochrome',
    name: 'Camera Monochrome',
    category: 'Camera Matching',
    description: 'Rich Panchromatic B&W response with high tonal micro-contrast and deep blacks.',
    colors: ['#f8fafc', '#94a3b8', '#0f172a'],
    contrastCurve: (v) => sCurve(v, 1.5),
    saturationFactor: 0.0,
    skinTonePreserve: 0.0,
    colorMatrix: [
      0.299, 0.587, 0.114,
      0.299, 0.587, 0.114,
      0.299, 0.587, 0.114,
    ],
    shadowTint: [0, 0, 0],
    highlightWarmth: 0.0,
  },
];

export function getCameraProfile(id: CameraProfileId): CameraProfileDefinition {
  return CAMERA_PROFILES.find((p) => p.id === id) || CAMERA_PROFILES[0];
}

/**
 * Fast pixel application of Camera Profile with intensity blending
 */
export function applyCameraProfilePixel(
  r: number,
  g: number,
  b: number,
  profile: CameraProfileDefinition,
  intensity: number // 0 to 200 (100 is standard)
): [number, number, number] {
  if (intensity <= 0) return [r, g, b];
  const blend = intensity / 100;

  // 1. Color matrix transformation
  const m = profile.colorMatrix;
  let mr = r * m[0] + g * m[1] + b * m[2];
  let mg = r * m[3] + g * m[4] + b * m[5];
  let mb = r * m[6] + g * m[7] + b * m[8];

  // 2. Contrast curve
  mr = profile.contrastCurve(Math.max(0, Math.min(255, mr)));
  mg = profile.contrastCurve(Math.max(0, Math.min(255, mg)));
  mb = profile.contrastCurve(Math.max(0, Math.min(255, mb)));

  // 3. Saturation factor adjustment
  if (profile.saturationFactor !== 1.0) {
    const lum = 0.299 * mr + 0.587 * mg + 0.114 * mb;
    mr = lum + (mr - lum) * profile.saturationFactor;
    mg = lum + (mg - lum) * profile.saturationFactor;
    mb = lum + (mb - lum) * profile.saturationFactor;
  }

  // 4. Shadow tint & Highlight warmth
  const normLum = (mr + mg + mb) / (3 * 255);
  const shadowWeight = Math.max(0, 1 - normLum * 2);
  const highlightWeight = Math.max(0, (normLum - 0.5) * 2);

  mr += profile.shadowTint[0] * shadowWeight + profile.highlightWarmth * 15 * highlightWeight;
  mg += profile.shadowTint[1] * shadowWeight;
  mb += profile.shadowTint[2] * shadowWeight - profile.highlightWarmth * 15 * highlightWeight;

  // Final blend with original
  const finalR = r * (1 - blend) + mr * blend;
  const finalG = g * (1 - blend) + mg * blend;
  const finalB = b * (1 - blend) + mb * blend;

  return [
    Math.max(0, Math.min(255, finalR)),
    Math.max(0, Math.min(255, finalG)),
    Math.max(0, Math.min(255, finalB)),
  ];
}
