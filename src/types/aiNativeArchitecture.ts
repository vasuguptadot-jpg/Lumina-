import {
  AdjustmentSettings,
  ToneCurves,
  HSLSettings,
  CropSettings,
  SelectiveMask,
  DesignElementItem,
  TypographyItem,
  LayerItem,
  RetouchStroke,
} from './editor';

export type SceneDimensionType =
  | 'subjects'
  | 'objects'
  | 'light'
  | 'depth'
  | 'colors'
  | 'composition';

export type EditTrackType = 'pixel' | 'vector' | 'ai';

export interface DetectedSubject {
  id: string;
  label: string;
  category: 'person' | 'face' | 'animal' | 'vehicle' | 'product' | 'architecture' | 'focal_element';
  confidence: number; // 0 to 1
  boundingBox: { x: number; y: number; width: number; height: number }; // normalized 0-1
  depthLayer: 'foreground' | 'midground' | 'background';
  isPrimarySubject: boolean;
  skinToneDescription?: string;
  facialExpression?: string;
  poseDescription?: string;
  recommendedActions: string[];
}

export interface DetectedObject {
  id: string;
  label: string;
  category: 'prop' | 'distraction' | 'photobomber' | 'wire' | 'text' | 'trash' | 'vehicle' | 'sign' | 'natural_element';
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  isDistraction: boolean;
  distractionSeverity: number; // 0 (benign) to 100 (severe photobomb)
  removalRationale?: string;
}

export interface LightFieldAnalysis {
  ambientTempKelvin: number; // e.g. 5600
  ambientTempLabel: string; // e.g. 'Warm Daylight', 'Overcast Cool', 'Tungsten Indoor'
  keyLight: {
    azimuthDeg: number; // 0 to 360 (0 = right, 90 = top, 180 = left, 270 = bottom)
    elevationDeg: number; // 0 to 90
    intensity: number; // 0 to 100
    colorHex: string;
    softness: number; // 0 (hard harsh) to 100 (ultra diffused softbox)
    sourceType: 'sun' | 'studio_strobe' | 'window' | 'neon' | 'ambient_sky' | 'indoor_lamp';
  };
  fillLight: {
    ratio: number; // 0 to 100%
    ambientColorHex: string;
    bounceIntensity: number;
  };
  shadowDensity: number; // 0 to 100
  zoneSystemDistribution: {
    zone0_2_shadows: number; // percentage in deep blacks
    zone3_7_midtones: number; // percentage in midtones
    zone8_10_highlights: number; // percentage in specular highlights
  };
  dynamicRangeHeadroom: 'clipped_highlights' | 'crushed_shadows' | 'balanced_high_dr' | 'flat_low_contrast';
  lightMood: string;
}

export interface DepthFieldAnalysis {
  foregroundZ: number; // 0 to 0.33
  midgroundZ: number; // 0.33 to 0.66
  backgroundZ: number; // 0.66 to 1.0
  estimatedFocalLength: string; // e.g. '50mm', '85mm f/1.4', '24mm wide'
  estimatedSensorFormat: string; // e.g. 'Full Frame 35mm', 'APS-C', 'Medium Format'
  estimatedFocalPlane: 'subject_tack_sharp' | 'deep_infinite' | 'front_focused' | 'back_focused';
  suggestedApertureSimulation: number; // e.g. 1.4, 2.0, 2.8, 5.6
  atmosphericHazeDensity: number; // 0 to 100
  depthPlanesCount: number;
}

export interface ColorHarmonyAnalysis {
  dominantPalette: Array<{
    hex: string;
    name: string;
    coveragePct: number;
    role: 'primary' | 'secondary' | 'accent' | 'shadow' | 'highlight';
  }>;
  harmonyType: 'Complementary' | 'Split-Complementary' | 'Analogous' | 'Triadic' | 'Monochromatic' | 'Tetradic';
  harmonyScore: number; // 0 to 100
  skinToneVector: {
    detected: boolean;
    hueDeg: number; // typical skin tone line is ~25-30 deg in I-axis
    isAlignedWithSkinLine: boolean;
    deviation: number;
  };
  colorContrastRatio: number; // 1.0 to 10.0
  suggestedColorMood: string;
}

export interface CompositionGeometryAnalysis {
  ruleOfThirdsScore: number; // 0 to 100
  primaryFocalIntersection: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'off-grid';
  goldenSpiralFocalMatch: number; // 0 to 100
  horizonTiltDeg: number; // e.g. +1.4 deg
  leadingLinesCount: number;
  visualBalance: {
    leftWeightPct: number; // 0 to 100
    rightWeightPct: number;
    topWeightPct: number;
    bottomWeightPct: number;
    balanceStatus: 'perfectly_balanced' | 'left_heavy' | 'right_heavy' | 'top_heavy' | 'bottom_heavy';
  };
  suggestedSmartCrops: Array<{
    aspectRatioLabel: string;
    cropBox: { x: number; y: number; width: number; height: number };
    rationale: string;
    compositionImprovementPct: number;
  }>;
}

export interface AINativeSceneDecomposition {
  id: string;
  timestamp: number;
  sceneSummary: string;
  genre: 'portrait' | 'landscape' | 'street' | 'architecture' | 'product' | 'wildlife' | 'night' | 'creative';
  
  // The 6 Fundamental Pillars of AI Understanding
  subjects: DetectedSubject[];
  objects: DetectedObject[];
  light: LightFieldAnalysis;
  depth: DepthFieldAnalysis;
  colors: ColorHarmonyAnalysis;
  composition: CompositionGeometryAnalysis;
}

export interface AINativeEditOperation {
  id: string;
  name: string;
  track: EditTrackType; // 'pixel' | 'vector' | 'ai'
  dimension: SceneDimensionType; // 'subjects' | 'objects' | 'light' | 'depth' | 'colors' | 'composition'
  description: string;
  enabled: boolean;
  intensity: number; // 0 to 100 (modulates strength)
  
  // Specific track payloads
  pixelPayload?: {
    adjustments?: Partial<AdjustmentSettings>;
    toneCurves?: Partial<ToneCurves>;
    hsl?: Partial<HSLSettings>;
    maskId?: string;
  };
  vectorPayload?: {
    guideType?: 'rule_of_thirds' | 'golden_spiral' | 'leading_lines' | 'bounding_boxes';
    elements?: Partial<DesignElementItem>[];
    typography?: Partial<TypographyItem>[];
    watermarkPlacement?: { x: number; y: number; rationale: string };
  };
  aiPayload?: {
    actionType: '3d_relight' | 'bokeh_depth' | 'remove_distraction' | 'subject_pop' | 'skin_harmonize' | 'sky_blend';
    relightParams?: { azimuthDeg: number; elevationDeg: number; intensity: number; colorHex: string };
    depthBlurParams?: { fStop: number; focalDepth: number; bokehShape: string };
    distractionRemovalIds?: string[];
  };
}

export interface AINativeDirectorRecipe {
  id: string;
  title: string;
  subtitle: string;
  category: 'lighting' | 'portrait' | 'cinematic' | 'landscape' | 'editorial' | 'clean_product' | 'creative';
  icon: string;
  description: string;
  badge: string;
  operations: AINativeEditOperation[];
}

export interface AINativeGraphState {
  isDecomposed: boolean;
  decomposition: AINativeSceneDecomposition | null;
  activeOperations: AINativeEditOperation[];
  appliedRecipeId: string | null;
  isProcessing: boolean;
  selectedDimension: SceneDimensionType | 'all';
  activeTrack: EditTrackType | 'all';
  
  // Live 3D Interactive Light Gizmo State
  liveLightGizmo: {
    enabled: boolean;
    azimuthDeg: number;
    elevationDeg: number;
    intensity: number;
    colorTemp: number; // -100 to 100
    colorHex: string;
    specularSheen: number;
  };
  
  // Live Depth Slicer State
  liveDepthSlicer: {
    enabled: boolean;
    focalZ: number; // 0 to 1
    depthOfFieldWidth: number; // 0.1 to 0.8
    bokehAmount: number; // 0 to 100
    atmosphericHaze: number; // 0 to 100
  };
}
