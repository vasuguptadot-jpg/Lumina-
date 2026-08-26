import {
  AdjustmentSettings,
  ToneCurves,
  HSLSettings,
  SelectiveMask,
  CropSettings,
} from './editor';

export type NLEditCategory =
  | 'DETECT_SUBJECT'
  | 'DETECT_FACE'
  | 'FACE_LOCK'
  | 'FOREGROUND_SEPARATION'
  | 'SCENE_RELOCATE'
  | 'PERSPECTIVE_MATCH'
  | 'LIGHTING_MATCH'
  | 'SHADOW_INTEGRATION'
  | 'SEMANTIC_MASK'
  | 'TONAL_CURVE'
  | 'COLOR_GRADE'
  | 'IDENTITY_PRESERVE'
  | 'LOCAL_EXPOSURE'
  | 'DETAIL_TEXTURE'
  | 'FILM_EFFECTS'
  | 'OPTICAL_DEPTH'
  | 'COMPOSITION_GEOMETRY'
  | 'RENDER'
  | 'VERIFICATION';

export interface NLEditStep {
  id: string;
  stepNumber: number;
  category: NLEditCategory;
  title: string;
  description: string;
  reasoning: string;
  enabled: boolean;
  status: 'pending' | 'analyzing' | 'applying' | 'completed' | 'skipped' | 'locked';
  
  // Specific track modification payloads
  adjustmentsPayload?: Partial<AdjustmentSettings>;
  curvesPayload?: Partial<ToneCurves>;
  hslPayload?: Partial<HSLSettings>;
  masksPayload?: SelectiveMask[];
  cropPayload?: Partial<CropSettings>;
  
  // Visual diff & safety tags
  parametersModified?: string[];
  confidenceScore?: number; // 0 to 100
  isIdentityLocked?: boolean;
  verificationCheck?: string;
  stageBadge?: string;
}

export interface NLEditPlan {
  id: string;
  userPrompt: string;
  summary: string;
  confidenceScore: number;
  aiProvider: 'gemini' | 'groq' | 'local_neural';
  modelUsed?: string;
  latencyMs?: number;
  steps: NLEditStep[];
  overallExplanation: string;
  tags: string[];
  createdAt: number;
  executedAt?: number;
  
  // Multi-stage complex plan metadata
  isComplexMultiStagePlan?: boolean;
  identityPreservationActive?: boolean;
  targetScene?: string;
  whyBetterThanOneShotGen?: string[];
  verificationScore?: number; // 0-100
}

export interface NLPresetPrompt {
  id: string;
  title: string;
  prompt: string;
  category: 'Cinematic' | 'Portrait & Skin' | 'Selective Lighting' | 'Complex Scene Relocation' | 'Street & Moody' | 'Product & Commercial' | 'Vintage & Film';
  icon: string;
  badge: string;
  isComplexPlan?: boolean;
  previewDescription: string;
  stepCount?: number;
}

export const NL_CURATED_PROMPTS: NLPresetPrompt[] = [
  {
    id: 'luxury-hotel-night-facelock',
    title: 'Luxury Hotel at Night (Identity Lock)',
    prompt: 'Make me look like I’m standing in a luxury hotel at night, but keep my face exactly the same.',
    category: 'Complex Scene Relocation',
    icon: 'Building2',
    badge: '12-STAGE PLAN',
    isComplexPlan: true,
    stepCount: 12,
    previewDescription: '12-step deterministic plan: Detects person & face, locks facial identity, separates foreground, synthesizes luxury hotel background, matches perspective & lighting, adds environmental contact shadows, color-grades, and verifies facial preservation.',
  },
  {
    id: 'brighten-person-preserve-sky',
    title: 'Brighten Subject & Preserve Sky',
    prompt: 'Make the person brighter but don’t change the sky.',
    category: 'Selective Lighting',
    icon: 'Sun',
    badge: 'MASKING',
    isComplexPlan: false,
    stepCount: 7,
    previewDescription: 'Detects person, isolates sky with exclusion mask, boosts subject exposure +35 and clarity.',
  },
  {
    id: 'pro-movie-still',
    title: 'Professional Movie Still',
    prompt: 'Make this look like a professional cinematic movie still with rich contrast, teal-orange grading, and 35mm grain.',
    category: 'Cinematic',
    icon: 'Film',
    badge: 'CINEMATIC',
    isComplexPlan: false,
    stepCount: 6,
    previewDescription: 'Applies S-curve highlight roll-off, teal shadow grading, warm skin protection, vignette, and film grain.',
  },
  {
    id: 'golden-hour-glow',
    title: 'Golden Hour Sunset Glow',
    prompt: 'Infuse warm golden hour sunlight from the upper side, add soft glow highlights, and enhance skin radiance.',
    category: 'Portrait & Skin',
    icon: 'Sunset',
    badge: 'WARMTH',
    isComplexPlan: false,
    stepCount: 5,
    previewDescription: 'Calibrates warm 5800K WB, +18 highlights warmth, adds directional side flare and soft skin tone clarity.',
  },
  {
    id: 'cyberpunk-neon-night-lock',
    title: 'Cyberpunk Neon Street (Face Lock)',
    prompt: 'Relocate subject to a rain-slicked Tokyo neon street at midnight with magenta/cyan rim lighting, keeping facial likeness 100% untouched.',
    category: 'Complex Scene Relocation',
    icon: 'Zap',
    badge: '11-STAGE PLAN',
    isComplexPlan: true,
    stepCount: 11,
    previewDescription: 'Decomposes foreground, locks face landmarks, projects directional neon rim lighting, simulates wet ground reflections, and validates identity.',
  },
  {
    id: 'moody-nordic-street',
    title: 'Moody Nordic Street',
    prompt: 'Make this moody and dramatic with deep crushed blacks, desaturated cool tones, sharp acutance, and punchy contrast.',
    category: 'Street & Moody',
    icon: 'CloudRain',
    badge: 'MOODY',
    isComplexPlan: false,
    stepCount: 5,
    previewDescription: 'High contrast curve, cyan shadow split, desaturated yellows/greens, high structure and local microcontrast.',
  },
  {
    id: 'clean-product-studio',
    title: 'Commercial Product Studio',
    prompt: 'Clean high-key commercial product look with pure white highlights, crisp microcontrast, lifted shadows, and zero chromatic haze.',
    category: 'Product & Commercial',
    icon: 'Package',
    badge: 'CLEAN',
    isComplexPlan: false,
    stepCount: 4,
    previewDescription: 'Perfect white-point calibration, shadow lift +25, dehaze +20, high-frequency texture sharpening.',
  },
  {
    id: 'editorial-fashion-bw',
    title: 'Editorial Fine Art B&W',
    prompt: 'Convert to high-contrast fine art silver monochrome with dark dramatic sky, luminous skin tones, and rich deep shadows.',
    category: 'Cinematic',
    icon: 'Camera',
    badge: 'B&W',
    isComplexPlan: false,
    stepCount: 5,
    previewDescription: 'Monochrome conversion with custom RGB mix (Red +40, Blue -30), heavy tone curve punch, and silver halide grain.',
  },
  {
    id: 'vintage-90s-film',
    title: '1990s Analog Film Look',
    prompt: 'Vintage 90s film aesthetic with faded matte blacks, soft warm greens, pastel highlight roll-off, and analog grain.',
    category: 'Vintage & Film',
    icon: 'RotateCcw',
    badge: 'RETRO',
    isComplexPlan: false,
    stepCount: 4,
    previewDescription: 'Lifted black point +15, matte shadow fade, warm yellow-green split tone, medium grain texture.',
  },
];
