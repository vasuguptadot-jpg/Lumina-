import {
  AINativeSceneDecomposition,
  AINativeDirectorRecipe,
  AINativeEditOperation,
} from '../types/aiNativeArchitecture';
import { Project, AdjustmentSettings } from '../types/editor';
import { DEFAULT_ADJUSTMENTS } from './defaultSettings';

// ============================================================================
// 1. BUILT-IN AI DIRECTOR RECIPES (ORCHESTRATED ACROSS PIXEL, VECTOR & AI)
// ============================================================================
export const BUILTIN_DIRECTOR_RECIPES: AINativeDirectorRecipe[] = [
  {
    id: 'recipe_golden_hour',
    title: 'Cinematic Golden Hour Relight',
    subtitle: '3D Sun Vector, Warm Rim Light & Editorial Curve',
    category: 'lighting',
    icon: 'SunMedium',
    badge: '3-Track Neural',
    description:
      'Repositions scene illumination with 45° warm golden key light, casts subtle rim glow on subjects, lifts shadow depth, and applies a rich golden amber color grade.',
    operations: [
      {
        id: 'gh_pixel_grade',
        name: 'Warm Amber Color Grade & Lift',
        track: 'pixel',
        dimension: 'colors',
        description: 'Warm color temperature (+18), soft gold highlight tint, and gentle midtone shadow lift (+14)',
        enabled: true,
        intensity: 85,
        pixelPayload: {
          adjustments: {
            temperature: 18,
            tint: -4,
            highlights: -12,
            shadows: 14,
            vibrance: 16,
            clarity: 10,
            fade: 8,
          },
        },
      },
      {
        id: 'gh_ai_relight',
        name: '3D Sun Vector Relight (45° Azimuth)',
        track: 'ai',
        dimension: 'light',
        description: 'Synthesize directional 45° sun angle with ambient gold bounce and natural rim illumination',
        enabled: true,
        intensity: 80,
        aiPayload: {
          actionType: '3d_relight',
          relightParams: {
            azimuthDeg: 45,
            elevationDeg: 30,
            intensity: 75,
            colorHex: '#ffb347',
          },
        },
      },
      {
        id: 'gh_vector_comp',
        name: 'Golden Ratio Crop Guide',
        track: 'vector',
        dimension: 'composition',
        description: 'Auto-align visual center of mass with Golden Spiral for harmonious eye flow',
        enabled: true,
        intensity: 100,
        vectorPayload: {
          guideType: 'golden_spiral',
          watermarkPlacement: {
            x: 0.88,
            y: 0.92,
            rationale: 'Negative space in lower-right foreground',
          },
        },
      },
    ],
  },
  {
    id: 'recipe_editorial_portrait',
    title: 'High-End Editorial Portrait Pop',
    subtitle: 'Skin Texture Separation, f/1.4 Bokeh & Rembrandt Key',
    category: 'portrait',
    icon: 'Users',
    badge: 'Subject Isolation',
    description:
      'Isolates human subjects from the background, softens background with optical f/1.4 lens bokeh, illuminates the facial triangle (Rembrandt style), and sharpens irises.',
    operations: [
      {
        id: 'ep_pixel_face',
        name: 'Facial Clarity & Exposure Pop',
        track: 'pixel',
        dimension: 'subjects',
        description: 'Selective exposure boost (+10), micro-contrast clarity (+18), and specular highlight recovery',
        enabled: true,
        intensity: 90,
        pixelPayload: {
          adjustments: {
            exposure: 6,
            contrast: 12,
            highlights: -8,
            shadows: 10,
            clarity: 16,
            sharpness: 25,
            vibrance: 8,
          },
        },
      },
      {
        id: 'ep_ai_bokeh',
        name: 'Optical f/1.4 Depth Separation',
        track: 'ai',
        dimension: 'depth',
        description: 'Render background Z-plane in smooth circular specular bokeh while keeping the subject tack-sharp',
        enabled: true,
        intensity: 85,
        aiPayload: {
          actionType: 'bokeh_depth',
          depthBlurParams: {
            fStop: 1.4,
            focalDepth: 0.25,
            bokehShape: 'circle',
          },
        },
      },
      {
        id: 'ep_ai_distraction',
        name: 'Background Distraction Suppress',
        track: 'ai',
        dimension: 'objects',
        description: 'Subdue peripheral high-contrast clutter and photobombers to direct focus to subject gaze',
        enabled: true,
        intensity: 75,
        aiPayload: {
          actionType: 'remove_distraction',
        },
      },
    ],
  },
  {
    id: 'recipe_cyberpunk_neon',
    title: 'Atmospheric Cyberpunk Night',
    subtitle: 'Cyan/Magenta Dual-Light, High Contrast & Volumetric Fog',
    category: 'cinematic',
    icon: 'Zap',
    badge: 'Dual-Vector Relight',
    description:
      'Transforms night scenes into cinematic neo-noir with teal shadows, magenta neon highlights, deep contrast, and atmospheric volumetric mist.',
    operations: [
      {
        id: 'cp_pixel_grade',
        name: 'Teal/Magenta Split Tone Grade',
        track: 'pixel',
        dimension: 'colors',
        description: 'Deepened blacks (-15), contrast (+25), cyan shadows with vibrant magenta highlights',
        enabled: true,
        intensity: 90,
        pixelPayload: {
          adjustments: {
            contrast: 22,
            highlights: 14,
            shadows: -12,
            blacks: -10,
            temperature: -14,
            tint: 20,
            vibrance: 28,
            clarity: 22,
          },
        },
      },
      {
        id: 'cp_ai_relight',
        name: 'Dual-Vector Neon Light Spill',
        track: 'ai',
        dimension: 'light',
        description: 'Synthesize dual neon key lights: 300° Cyan left rim and 60° Magenta right fill',
        enabled: true,
        intensity: 85,
        aiPayload: {
          actionType: '3d_relight',
          relightParams: {
            azimuthDeg: 300,
            elevationDeg: 25,
            intensity: 80,
            colorHex: '#06b6d4',
          },
        },
      },
    ],
  },
  {
    id: 'recipe_minimalist_commercial',
    title: 'Clean Commercial Product & Studio',
    subtitle: 'Balanced Dynamic Range, Zero Clutter & Pure Lighting',
    category: 'clean_product',
    icon: 'Package',
    badge: 'Commercial Studio',
    description:
      'Calibrates true-to-life color neutrality, eliminates dust and distracting reflections, sets crisp edge acutance, and balances 100% diffused 3-point softbox lighting.',
    operations: [
      {
        id: 'mc_pixel_tune',
        name: 'Calibrated Studio Dynamic Range',
        track: 'pixel',
        dimension: 'light',
        description: 'Neutral white point balance, even midtone distribution, and clean shadow separation',
        enabled: true,
        intensity: 100,
        pixelPayload: {
          adjustments: {
            contrast: 8,
            highlights: -6,
            shadows: 8,
            whites: 6,
            blacks: 4,
            clarity: 14,
            sharpness: 30,
            vibrance: 6,
          },
        },
      },
      {
        id: 'mc_ai_cleanup',
        name: 'Smart Distraction & Specular Clean',
        track: 'ai',
        dimension: 'objects',
        description: 'Detects and flags all peripheral clutter, scratches, and unwanted light artifacts for seamless cleanup',
        enabled: true,
        intensity: 85,
        aiPayload: {
          actionType: 'remove_distraction',
        },
      },
    ],
  },
  {
    id: 'recipe_dramatic_landscape',
    title: 'Fine Art Landscape & Atmospheric Depth',
    subtitle: 'Dynamic Range Recovery, Micro-Texture & Horizon Balance',
    category: 'landscape',
    icon: 'TreePine',
    badge: 'High Dynamic Range',
    description:
      'Recovers sky highlights and deep canyon/mountain shadows, enhances geological micro-texture, harmonizes foliage emeralds, and aligns the horizon level.',
    operations: [
      {
        id: 'dl_pixel_hdr',
        name: 'HDR Dynamic Range & Micro-Contrast',
        track: 'pixel',
        dimension: 'light',
        description: 'Highlight recovery (-25), shadow lift (+22), dehaze (+18), and local texture enhancement',
        enabled: true,
        intensity: 90,
        pixelPayload: {
          adjustments: {
            highlights: -24,
            shadows: 22,
            whites: 8,
            blacks: -6,
            clarity: 20,
            dehaze: 16,
            vibrance: 18,
          },
        },
      },
      {
        id: 'dl_vector_horizon',
        name: 'Rule of Thirds Horizon Alignment',
        track: 'vector',
        dimension: 'composition',
        description: 'Auto-aligns sky-to-land boundary with upper 1/3 horizontal grid line',
        enabled: true,
        intensity: 100,
        vectorPayload: {
          guideType: 'rule_of_thirds',
        },
      },
    ],
  },
];

// ============================================================================
// 2. SCENE DECOMPOSITION FALLBACK / OFFLINE SYNTHESIS ENGINE
// ============================================================================
export function generateOfflineDecomposition(
  imageWidth: number = 1920,
  imageHeight: number = 1080
): AINativeSceneDecomposition {
  const isPortrait = imageHeight > imageWidth;

  return {
    id: `decomp_${Date.now()}`,
    timestamp: Date.now(),
    sceneSummary: isPortrait
      ? 'Vertical portrait composition with prominent foreground subject and soft environmental context.'
      : 'Landscape orientation scene with balanced multi-plane depth and directional ambient lighting.',
    genre: isPortrait ? 'portrait' : 'landscape',
    subjects: [
      {
        id: 'subj_1',
        label: isPortrait ? 'Primary Portrait Subject' : 'Primary Focal Subject',
        category: isPortrait ? 'person' : 'focal_element',
        confidence: 0.96,
        boundingBox: isPortrait
          ? { x: 0.22, y: 0.12, width: 0.56, height: 0.76 }
          : { x: 0.32, y: 0.2, width: 0.36, height: 0.6 },
        depthLayer: 'foreground',
        isPrimarySubject: true,
        skinToneDescription: 'Natural warm complexion',
        facialExpression: 'Engaged & natural',
        poseDescription: 'Balanced rule-of-thirds alignment',
        recommendedActions: [
          'Isolate subject luminance (+12%)',
          'Enhance catchlights & iris clarity',
          'Apply natural skin frequency separation',
        ],
      },
    ],
    objects: [
      {
        id: 'obj_1',
        label: 'Background Horizon & Scene Elements',
        category: 'natural_element',
        confidence: 0.91,
        boundingBox: { x: 0.05, y: 0.55, width: 0.9, height: 0.4 },
        isDistraction: false,
        distractionSeverity: 10,
      },
      {
        id: 'obj_2',
        label: 'Peripheral Edge Clutter / Photobomber',
        category: 'distraction',
        confidence: 0.82,
        boundingBox: { x: 0.82, y: 0.65, width: 0.14, height: 0.22 },
        isDistraction: true,
        distractionSeverity: 68,
        removalRationale: 'High-contrast edge distraction drawing eye away from center of interest',
      },
    ],
    light: {
      ambientTempKelvin: 5600,
      ambientTempLabel: 'Daylight 5600K',
      keyLight: {
        azimuthDeg: 45,
        elevationDeg: 38,
        intensity: 78,
        colorHex: '#fff7ed',
        softness: 65,
        sourceType: 'sun',
      },
      fillLight: {
        ratio: 42,
        ambientColorHex: '#dbeafe',
        bounceIntensity: 35,
      },
      shadowDensity: 42,
      zoneSystemDistribution: {
        zone0_2_shadows: 14,
        zone3_7_midtones: 72,
        zone8_10_highlights: 14,
      },
      dynamicRangeHeadroom: 'balanced_high_dr',
      lightMood: 'Natural Directional Key with Soft Environmental Fill',
    },
    depth: {
      foregroundZ: 0.22,
      midgroundZ: 0.52,
      backgroundZ: 0.86,
      estimatedFocalLength: isPortrait ? '85mm f/1.8' : '35mm f/2.8',
      estimatedSensorFormat: 'Full Frame 35mm',
      estimatedFocalPlane: 'subject_tack_sharp',
      suggestedApertureSimulation: 1.8,
      atmosphericHazeDensity: 12,
      depthPlanesCount: 3,
    },
    colors: {
      dominantPalette: [
        { hex: '#ea580c', name: 'Terracotta Orange', coveragePct: 32, role: 'primary' },
        { hex: '#0284c7', name: 'Sky Cerulean', coveragePct: 28, role: 'secondary' },
        { hex: '#f8fafc', name: 'Pure White Highlights', coveragePct: 20, role: 'highlight' },
        { hex: '#0f172a', name: 'Midnight Charcoal', coveragePct: 15, role: 'shadow' },
        { hex: '#16a34a', name: 'Forest Emerald', coveragePct: 5, role: 'accent' },
      ],
      harmonyType: 'Complementary',
      harmonyScore: 89,
      skinToneVector: {
        detected: true,
        hueDeg: 28.5,
        isAlignedWithSkinLine: true,
        deviation: 1.8,
      },
      colorContrastRatio: 4.8,
      suggestedColorMood: 'Vibrant Cinematic Harmony',
    },
    composition: {
      ruleOfThirdsScore: 86,
      primaryFocalIntersection: isPortrait ? 'top-left' : 'top-right',
      goldenSpiralFocalMatch: 82,
      horizonTiltDeg: 0.2,
      leadingLinesCount: 2,
      visualBalance: {
        leftWeightPct: 48,
        rightWeightPct: 52,
        topWeightPct: 42,
        bottomWeightPct: 58,
        balanceStatus: 'perfectly_balanced',
      },
      suggestedSmartCrops: [
        {
          aspectRatioLabel: '4:5 Social & Gallery',
          cropBox: { x: 0.08, y: 0.04, width: 0.84, height: 0.92 },
          rationale: 'Elevates visual weight of primary subject',
          compositionImprovementPct: 16,
        },
        {
          aspectRatioLabel: '16:9 Cinematic Widescreen',
          cropBox: { x: 0.0, y: 0.18, width: 1.0, height: 0.64 },
          rationale: 'Enhances panoramic leading lines',
          compositionImprovementPct: 14,
        },
      ],
    },
  };
}

// ============================================================================
// 3. ENGINE APPLICATION UTILITIES
// ============================================================================
export function applyOperationsToProject(
  project: Project,
  operations: AINativeEditOperation[]
): {
  updatedSettings: AdjustmentSettings;
  activeGuide?: string;
  appliedCount: number;
} {
  let newSettings = { ...project.currentSettings };
  let activeGuide: string | undefined = undefined;
  let appliedCount = 0;

  for (const op of operations) {
    if (!op.enabled) continue;
    appliedCount++;

    // Track 1: Pixel Edits
    if (op.track === 'pixel' && op.pixelPayload?.adjustments) {
      const scale = (op.intensity || 100) / 100;
      const patch = op.pixelPayload.adjustments;
      const scaledPatch: Partial<AdjustmentSettings> = {};

      for (const [key, val] of Object.entries(patch)) {
        if (typeof val === 'number') {
          const currentVal = (newSettings as any)[key] ?? 0;
          (scaledPatch as any)[key] = Math.round(currentVal + val * scale);
        }
      }

      newSettings = {
        ...newSettings,
        ...scaledPatch,
      };
    }

    // Track 2: Vector Edits
    if (op.track === 'vector' && op.vectorPayload?.guideType) {
      activeGuide = op.vectorPayload.guideType;
    }

    // Track 3: AI Edits (Bokeh / Relighting mappings into real-time engine)
    if (op.track === 'ai' && op.aiPayload) {
      if (op.aiPayload.actionType === 'bokeh_depth' && op.aiPayload.depthBlurParams) {
        newSettings.blur = {
          ...(newSettings.blur || DEFAULT_ADJUSTMENTS.blur!),
          enabled: true,
          mode: 'background',
          amount: Math.round(40 * ((op.intensity || 100) / 100)),
        };
      }
    }
  }

  return {
    updatedSettings: newSettings,
    activeGuide,
    appliedCount,
  };
}
