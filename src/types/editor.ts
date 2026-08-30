export interface ImageFile {
  id: string;
  name: string;
  originalUrl: string;
  width: number;
  height: number;
  format: string; // 'png' | 'jpeg' | 'webp' | 'tiff' | 'dng' | 'raw' | 'cr2' | 'nef' | 'arw' | 'raf' | 'orf' | 'rw2'
  size: number; // bytes
  rawMetadata?: RawMetadata;
  createdAt: number;
}

export type BayerPattern = 'RGGB' | 'BGGR' | 'GRBG' | 'GBRG' | 'X-Trans';

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  city?: string;
  country?: string;
  locationName?: string;
}

export interface MetadataPrivacySettings {
  stripGpsOnExport: boolean;
  stripAllMetadataOnExport: boolean;
  copyrightOnlyOnExport: boolean;
}

export interface RawMetadata {
  isRaw: boolean;
  decodeStatus?: 'genuine_raw_sensor' | 'preview_fallback' | 'unsupported';
  decoderEngine?: string;
  statusReason?: string;
  cameraMake?: string;
  cameraModel?: string;
  cameraSerialNumber?: string;
  lens?: string;
  lensSerialNumber?: string;
  iso?: number;
  focalLength?: string;
  focalLength35mm?: string;
  aperture?: string;
  shutterSpeed?: string;
  colorSpace?: string;
  bitDepth?: number;
  whiteBalance?: string;
  wbKelvin?: number;
  wbTint?: number;
  bayerPattern?: BayerPattern | string;
  sensorDimensions?: string;
  blackLevel?: [number, number, number, number] | number[];
  whiteLevel?: number;
  colorMatrix1?: number[][];
  asShotNeutral?: [number, number, number];
  dateShot?: string;
  timeShot?: string;
  exposureBias?: string;
  meteringMode?: string;
  flashFired?: boolean;
  author?: string;
  copyright?: string;
  copyrightNotice?: string;
  rightsUsageTerms?: string;
  title?: string;
  caption?: string;
  keywords?: string[];
  rating?: number; // 0 to 5
  software?: string;
  gps?: GPSCoordinates | null;
  privacy?: MetadataPrivacySettings;
}

export type CameraProfileId =
  | 'adobe-standard'
  | 'adobe-color'
  | 'adobe-portrait'
  | 'adobe-landscape'
  | 'adobe-vivid'
  | 'adobe-neutral'
  | 'camera-standard'
  | 'camera-flat'
  | 'camera-portrait'
  | 'camera-landscape'
  | 'camera-faithful'
  | 'camera-monochrome';

export type RawWbPreset =
  | 'as-shot'
  | 'auto'
  | 'daylight'
  | 'shade'
  | 'cloudy'
  | 'tungsten'
  | 'fluorescent'
  | 'flash'
  | 'custom';

export type DemosaicMethod = 'ahd' | 'vng' | 'bilinear' | 'superpixel';

export interface CameraProfileSettings {
  profileId: CameraProfileId;
  intensity: number; // 0 to 200 (100 = standard 1.0x)
}

export interface RawDevelopSettings {
  wbPreset: RawWbPreset;
  kelvin: number; // 2000 to 12000 K (default 5500)
  wbTint: number; // -100 to 100
  highlightRecovery: number; // 0 to 100
  shadowRecovery: number; // 0 to 100
  blackLevel: number; // -50 to 50
  demosaicMethod: DemosaicMethod;
  moireReduction: number; // 0 to 100
}

export interface OpticsSettings {
  enableDistortionCorrection: boolean;
  distortion: number; // -100 (barrel) to 100 (pincushion)
  enableCACorrection: boolean;
  caRedCyan: number; // -100 to 100
  caBlueYellow: number; // -100 to 100
  defringeAmount: number; // 0 to 100
  defringeThreshold: number; // 0 to 100
  enableLensVignette: boolean;
  lensVignetteAmount: number; // -100 to 100
  lensVignetteMidpoint: number; // 10 to 90
  lensVignetteFeather: number; // 10 to 90
}

// ----------------------------------------------------------------------------
// Color Management, ICC Profiles, Soft Proofing & Bit Depth Types
// ----------------------------------------------------------------------------
export type WorkingColorSpace =
  | 'srgb'
  | 'display-p3'
  | 'adobe-rgb'
  | 'prophoto-rgb'
  | 'rec2020'
  | 'acescg';

export type SoftProofProfileId =
  | 'srgb'
  | 'display-p3'
  | 'adobe-rgb'
  | 'cmyk-swop-v2'
  | 'cmyk-gracol-2006'
  | 'cmyk-fogra39'
  | 'cmyk-pso-uncoated'
  | 'cmyk-japan-color'
  | 'paper-matte-rag'
  | 'paper-luster-baryta'
  | 'paper-newsprint';

export type RenderingIntent =
  | 'relative-colorimetric'
  | 'perceptual'
  | 'absolute-colorimetric'
  | 'saturation';

export type ProcessingBitDepth = '8-bit' | '16-bit' | '32-bit-float';

export type GamutWarningColor = 'neon-red' | 'neon-cyan' | 'neon-magenta' | 'neon-green' | 'zebra';

export interface ColorManagementSettings {
  workingSpace: WorkingColorSpace;
  bitDepth: ProcessingBitDepth;

  // Soft Proofing Engine
  softProofEnabled: boolean;
  proofProfile: SoftProofProfileId;
  renderingIntent: RenderingIntent;
  simulatePaperWhite: boolean;
  simulateBlackInk: boolean;
  paperWhiteTint?: string; // Hex color for simulated substrate e.g. '#FAF7ED'
  blackInkDmax?: number; // 0 to 100 contrast reduction

  // Out-of-Gamut Warning Overlay
  gamutWarningEnabled: boolean;
  gamutWarningColor: GamutWarningColor;
  gamutThreshold: number; // 1 to 100 sensitivity

  // HDR Display & Headroom
  hdrDisplayEnabled: boolean;
  hdrPeakLuminanceNits: number; // 100 to 1600 nits
  hdrHighlightRecovery: number; // 0 to 100
  hdrSdrGainMap: number; // 0 to 100
  edrBoost: boolean;

  // Calibration & White Point
  whitePointIlluminant: 'D65' | 'D50' | 'D55' | 'D75';
  gammaCurve: 'sRGB-2.2' | 'Linear-1.0' | 'Gamma-2.4' | 'Gamma-1.8' | 'BT.1886';
}

export interface AdjustmentSettings {
  // Light / Exposure
  exposure: number;     // -100 to 100
  brightness: number;   // -100 to 100
  contrast: number;     // -100 to 100
  highlights: number;   // -100 to 100
  shadows: number;      // -100 to 100
  whites: number;       // -100 to 100
  blacks: number;       // -100 to 100

  // Advanced Tonal Controls
  gamma: number;        // -100 to 100 (gamma curve compression/expansion)
  midtones: number;     // -100 to 100 (middle grey balance)
  hdr: number;          // 0 to 100 (pseudo-HDR tone mapping & dynamic range compression)
  brilliance: number;   // -100 to 100 (Apple-style intelligent shadow brightening & highlight preservation)
  fade: number;         // 0 to 100 (film matte black lift)
  blackPoint: number;   // 0 to 100 (levels input black clipping threshold)
  whitePoint: number;   // 0 to 100 (levels input white clipping threshold)

  // Color & White Balance
  temperature: number;  // -100 (cool/blue) to 100 (warm/amber)
  tint: number;         // -100 (green) to 100 (magenta)
  saturation: number;   // -100 to 100
  vibrance: number;     // -100 to 100

  // Detail, Sharpness & Structure
  clarity: number;      // -100 to 100 (local midtone contrast)
  sharpness: number;    // 0 to 150 (Unsharp mask amount)
  texture: number;      // -100 to 100 (high-frequency micro-contrast without haloing)
  structure?: number;   // -100 to 100 (mid-frequency contour & geometric depth)
  microcontrast?: number;// -100 to 100 (fine surface gradient micro-contrast)
  sharpnessRadius?: number;   // 0.5 to 3.0 (pixels blur radius)
  sharpnessDetail?: number;   // 0 to 100 (high frequency noise threshold)
  sharpnessMasking?: number;  // 0 to 100 (edge detection threshold mask)
  edgeSharpening?: number;    // 0 to 100 (acutance contour edge enhancement)
  previewSharpnessMask?: boolean; // toggle to view B&W edge mask overlay
  dehaze: number;       // -100 to 100
  noiseReduction: number; // 0 to 100 (legacy alias for luminanceNR)

  // Noise Reduction Engine
  luminanceNR?: number;       // 0 to 100 (bilateral luminance smoothing)
  luminanceDetail?: number;   // 0 to 100 (luminance texture/edge recovery)
  colorNoiseReduction?: number;// 0 to 100 (chroma color speckle denoise)
  colorNoiseDetail?: number;  // 0 to 100 (color edge detail preservation)
  colorNoiseSmoothness?: number; // 0 to 100 (low-frequency chroma blotch smoothing)

  // Effects & Toning
  vignette: number;     // -100 (black edges) to 100 (white edges)
  vignetteMidpoint: number; // 10 to 90
  vignetteFeather: number;  // 10 to 90
  filmGrain: number;    // 0 to 100
  filmGrainSize: number;// 1 to 5

  // Split Toning / Color Grading
  splitToning: {
    shadowHue: number;     // 0 to 360
    shadowSat: number;     // 0 to 100
    highlightHue: number;  // 0 to 360
    highlightSat: number;  // 0 to 100
    balance: number;       // -100 to 100
  };

  // Color Balance (Cyan-Red, Magenta-Green, Yellow-Blue across tonal zones)
  colorBalance?: {
    shadows: { cyanRed: number; magentaGreen: number; yellowBlue: number };
    midtones: { cyanRed: number; magentaGreen: number; yellowBlue: number };
    highlights: { cyanRed: number; magentaGreen: number; yellowBlue: number };
  };

  // 3-Way Color Wheels (Shadows, Midtones, Highlights, Global)
  colorWheels?: {
    shadows: { hue: number; sat: number; lum: number };
    midtones: { hue: number; sat: number; lum: number };
    highlights: { hue: number; sat: number; lum: number };
    global: { hue: number; sat: number; lum: number };
  };

  // Global Hue Shift (-180 to 180 degrees)
  globalHue?: number;

  // Selective Color Tuning
  selectiveColors?: Array<{
    id: string;
    targetHue: number; // 0 to 360
    range: number;     // 10 to 90
    shiftHue: number;  // -180 to 180
    shiftSat: number;  // -100 to 100
    shiftLum: number;  // -100 to 100
  }>;

  // Color Replacement
  colorReplacement?: {
    enabled: boolean;
    sourceHue: number; // 0 to 360
    sourceTolerance: number; // 5 to 60
    targetHue: number; // 0 to 360
    targetSat: number; // 0 to 100
    targetLum: number; // -100 to 100
    feather: number;   // 0 to 100
  };

  // 3D LUT Integration
  lutSettings?: {
    enabled: boolean;
    lutId?: string;
    lutName?: string;
    intensity: number; // 0 to 100
    customCubeData?: string; // .cube raw text
  };

  // Camera Profiles (Adobe-like and Camera Matching)
  cameraProfile?: CameraProfileSettings;

  // RAW Sensor Development & Dynamic Range Recovery
  rawDevelop?: RawDevelopSettings;

  // Optics, Lens Distortion & Chromatic Aberration
  optics?: OpticsSettings;

  // Blur, Bokeh Simulation & Depth-of-Field
  blur?: BlurSettings;

  // AI Depth Map & 3-Zone Independent Editing (Foreground / Subject / Background)
  aiDepth?: AIDepthSettings;
}

export type BlurMode =
  | 'none'
  | 'gaussian'
  | 'lens'
  | 'motion'
  | 'radial'
  | 'tilt-shift'
  | 'zoom'
  | 'background'
  | 'foreground'
  | 'selective'
  | 'depth-aware';

export type BokehShape = 'circle' | 'hexagon' | 'octagon' | 'heart' | 'star' | 'diamond' | 'swirl';

export interface BlurSettings {
  enabled: boolean;
  mode: BlurMode;
  amount: number; // 0 to 100

  // Lens Blur & Bokeh Simulation
  bokehShape: BokehShape;
  bokehIntensity: number; // 0 to 100 (boost specular highlights)
  bokehThreshold: number; // 0 to 100 (specular luminance threshold)
  bokehSphericalAberration: number; // -100 to 100 (cat-eye / optical distortion)
  bokehBladeCurvature: number; // 0 to 100 (aperture roundness)

  // Motion Blur
  motionAngle: number; // -180 to 180 degrees
  motionDistance: number; // 0 to 100 px

  // Radial (Spin) Blur
  radialCenterX: number; // 0 to 1 (normalized, default 0.5)
  radialCenterY: number; // 0 to 1 (normalized, default 0.5)
  radialAngle: number; // 0 to 100

  // Zoom Blur
  zoomCenterX: number; // 0 to 1 (normalized, default 0.5)
  zoomCenterY: number; // 0 to 1 (normalized, default 0.5)
  zoomStrength: number; // 0 to 100

  // Tilt-Shift (Miniature Effect)
  tiltShiftCenterX: number; // 0 to 1 (default 0.5)
  tiltShiftCenterY: number; // 0 to 1 (default 0.5)
  tiltShiftAngle: number; // -90 to 90 degrees (default 0)
  tiltShiftFocusWidth: number; // 5 to 80 % (default 25)
  tiltShiftFeather: number; // 5 to 80 % (default 35)

  // Depth-Aware Blur & Simulation
  focusDepth: number; // 0 to 1 (depth plane at focal point, default 0.5)
  depthOfField: number; // 0.05 to 1.0 (aperture slice width)
  apertureFStop: string; // 'f/1.2' | 'f/1.4' | 'f/1.8' | 'f/2.8' | 'f/4.0' | 'f/8.0'
  invertDepth: boolean;

  // Selective Region Blur (Gradient or Radial)
  selectiveType: 'radial' | 'linear';
  selectiveCenterX: number;
  selectiveCenterY: number;
  selectiveRadius: number; // 0.05 to 1.0
  selectiveFeather: number; // 0 to 1.0
  selectiveInvert: boolean;
}

export interface DepthZoneAdjustments {
  exposure: number;       // -100 to 100
  contrast: number;       // -100 to 100
  highlights: number;     // -100 to 100
  shadows: number;        // -100 to 100
  temperature: number;    // -100 to 100
  tint: number;           // -100 to 100
  saturation: number;     // -100 to 100
  vibrance: number;       // -100 to 100
  clarity: number;        // -100 to 100
  texture: number;        // -100 to 100
  sharpness: number;      // 0 to 100
  blur: number;           // 0 to 100
  dehaze: number;         // -100 to 100
}

export interface AIDepthSettings {
  enabled: boolean;
  depthEstimationMethod: 'neural-gradient' | 'saliency-frequency' | 'geometric-perspective';
  showDepthMapOverlay: boolean;
  depthColorMap: 'turbo' | 'plasma' | 'viridis' | 'inferno' | 'grayscale';

  // Segmentation Boundaries (0 to 1)
  foregroundThreshold: number; // default 0.30
  backgroundThreshold: number; // default 0.65
  feather: number;             // default 0.15

  // 3 Independent Depth Zones
  foreground: DepthZoneAdjustments;
  subject: DepthZoneAdjustments;
  background: DepthZoneAdjustments;

  // Focus Plane & Interactive Focal Point
  focalPointX?: number; // 0 to 1 (normalized point selected by user)
  focalPointY?: number;
  simulatedFocalDepth: number; // 0.0 (near) to 1.0 (far)
  dofAperture: number; // 0.05 to 1.0
}

export interface CurvePoint {
  x: number; // 0 to 255
  y: number; // 0 to 255
}

export interface ParametricCurveSettings {
  highlights: number; // -100 to 100
  lights: number;     // -100 to 100
  darks: number;      // -100 to 100
  shadows: number;    // -100 to 100
}

export interface ToneCurves {
  mode?: 'point' | 'parametric';
  master: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
  parametric?: ParametricCurveSettings;
}

export interface HSLChannel {
  hue: number;        // -100 to 100
  saturation: number; // -100 to 100
  luminance: number;  // -100 to 100
}

export type ColorChannelName = 'red' | 'orange' | 'yellow' | 'green' | 'aqua' | 'blue' | 'purple' | 'magenta';

export type HSLSettings = Record<ColorChannelName, HSLChannel>;

export interface CropSettings {
  x: number; // 0 to 1 (normalized percentage of source image)
  y: number;
  width: number;
  height: number;
  aspectRatio: number | 'free'; // number e.g. 1 (1:1), 16/9, 4/5, etc. or 'free'
  rotation: number; // -45 to +45 straightener degrees or 90/180/270
  flipX: boolean;
  flipY: boolean;
  perspectiveX: number; // -100 to 100
  perspectiveY: number; // -100 to 100
  // Canvas Expansion / Outcrop
  expandCanvas?: boolean;
  expandUniform?: boolean;
  expandTop?: number; // 0 to 200px or %
  expandBottom?: number;
  expandLeft?: number;
  expandRight?: number;
  bgFillType?: 'color' | 'gradient' | 'blur' | 'transparent';
  bgColor?: string;
  bgGradient?: {
    type: 'linear' | 'radial';
    color1: string;
    color2: string;
    angle: number;
  };
  blurAmount?: number;
  // Dimensions Resize
  customResizeEnabled?: boolean;
  targetWidth?: number;
  targetHeight?: number;
  lockAspectRatio?: boolean;
}

export type FilterCategory =
  | 'Cinematic'
  | 'Portrait'
  | 'Landscape'
  | 'Street'
  | 'Food'
  | 'Travel'
  | 'Fashion'
  | 'Vintage'
  | 'Film'
  | 'Black & white'
  | 'Moody'
  | 'Bright'
  | 'Warm'
  | 'Cool'
  | 'Professional'
  | 'Social media'
  | 'Custom'
  | 'Film Emulation'
  | 'B&W'
  | 'Creative';

export interface FilterPreset {
  id: string;
  name: string;
  category: FilterCategory | string;
  description: string;
  thumbnailGradient: string;
  settings: Partial<AdjustmentSettings>;
  hsl?: Partial<HSLSettings>;
  toneCurves?: Partial<ToneCurves>;
  strength?: number; // 0 to 100
  tags?: string[];
  isFavorite?: boolean;
  author?: string;
  authorAvatar?: string;
  downloadsCount?: number;
  rating?: number; // 1 to 5 e.g. 4.9
  likesCount?: number;
  isCommunity?: boolean;
  shareCode?: string;
  createdAt?: number;
  recommendedFor?: string[];
  aiPrompt?: string;
}

export interface PresetRecommendation {
  presetId: string;
  preset: FilterPreset;
  matchScore: number; // 0 to 100%
  reason: string;
  suggestedStrength: number;
  tags: string[];
}

export interface AiPresetGenerationResult {
  preset: FilterPreset;
  analysis: string;
  suggestedCategories: string[];
  colorPalette: string[];
}

export type WatermarkType = 'text' | 'image' | 'logo' | 'pattern-tile';

export type WatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'custom';

export type WatermarkLogoPreset =
  | 'camera-shutter'
  | 'studio-aperture'
  | 'crown-luxury'
  | 'diamond-crest'
  | 'copyright-seal'
  | 'signature-script'
  | 'minimal-cross'
  | 'lens-flare-badge';

export interface WatermarkSettings {
  enabled: boolean;
  type: WatermarkType;
  text: string;
  font: string;
  fontSize: number; // pt (12 to 120)
  fontWeight?: 'normal' | 'bold' | '300' | '600' | '900';
  color: string;
  opacity: number; // 0 to 100
  position: WatermarkPosition;
  customX?: number; // 0 to 100%
  customY?: number; // 0 to 100%
  rotation?: number; // -180 to 180 deg
  size?: number; // 10 to 300%
  hasShadow: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  padding: number; // margin px/ratio

  // Image & Logo Specific
  logoPreset?: WatermarkLogoPreset;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  maintainAspectRatio?: boolean;
  blendMode?: LayerBlendMode;

  // Tiling / Repeating Pattern
  isTiled?: boolean;
  tileSpacingX?: number; // px
  tileSpacingY?: number; // px
  tileRotation?: number; // -45 to 45 deg
  tileDensity?: 'loose' | 'normal' | 'dense';
}

export interface BorderSettings {
  enabled: boolean;
  type: 'none' | 'solid' | 'polaroid' | 'film' | 'minimal' | 'gallery' | 'shadow' | 'vintage-frame';
  size: number; // px
  color: string;
  radius: number; // corner radius in px
  shadowBlur?: number;
  shadowColor?: string;
  captionText?: string;
}

export type SelectiveMaskType =
  | 'brush'
  | 'eraser'
  | 'linear'
  | 'radial'
  | 'color-range'
  | 'luminance-range'
  | 'ai-subject'
  | 'ai-sky'
  | 'ai-background'
  | 'ai-face'
  | 'ai-hair'
  | 'ai-clothes'
  | 'ai-skin'
  | 'ai-object'
  | 'ai-generated';

export interface MaskAdjustments {
  exposure: number;       // -100 to 100
  contrast: number;       // -100 to 100
  highlights: number;     // -100 to 100
  shadows: number;        // -100 to 100
  whites?: number;        // -100 to 100
  blacks?: number;        // -100 to 100
  temperature: number;    // -100 to 100
  tint?: number;          // -100 to 100
  saturation: number;     // -100 to 100
  vibrance?: number;      // -100 to 100
  sharpness: number;      // 0 to 100
  blur?: number;           // 0 to 100
  clarity: number;        // -100 to 100
  texture?: number;        // -100 to 100
  dehaze?: number;         // -100 to 100
  hueShift?: number;      // -180 to 180
  colorTint?: string;     // Hex color e.g. '#ff6600'
  colorTintOpacity?: number; // 0 to 100
  noiseReduction?: number; // 0 to 100
}

export interface SelectiveMask {
  id: string;
  name: string;
  type: SelectiveMaskType;
  visible: boolean;
  inverted: boolean;
  feather: number;         // 0 to 100 (edge feather / softness)
  density?: number;        // 0 to 100 (mask density / strength)
  opacity?: number;        // 0 to 100 (overall mask strength alias)
  showOverlay?: boolean;   // Ruby red mask overlay on canvas
  overlayColor?: 'ruby' | 'emerald' | 'cyan' | 'amber' | 'grayscale';

  // Mask Refinement
  refineEdge?: number;         // -100 to 100 (Shift edge: shrink/expand)
  refineSmooth?: number;       // 0 to 100 (Edge smoothing)
  refineContrast?: number;     // 0 to 100 (Edge threshold steepness)
  refineDecontaminate?: number;// 0 to 100 (Color decontaminate)

  // Radial / Linear coordinates (normalized 0 to 1)
  centerX?: number;
  centerY?: number;
  radiusX?: number;
  radiusY?: number;
  rotation?: number;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;

  // Brush & Eraser strokes
  brushStrokes?: Array<{
    points: Array<{ x: number; y: number }>;
    size: number;
    feather?: number;
    opacity?: number;
    mode?: 'add' | 'erase';
  }>;

  // Color Range selection parameters
  targetColor?: string; // hex '#RRGGBB'
  colorFuzziness?: number; // 1 to 100 tolerance

  // Luminance Range selection parameters
  lumMin?: number; // 0 to 255
  lumMax?: number; // 0 to 255
  lumFeather?: number; // 0 to 50

  // AI Semantic Selection parameters
  aiSensitivity?: number; // 0 to 100
  aiObjectPoint?: { x: number; y: number }; // normalized (x,y) click point
  aiPrompt?: string; // Custom text-prompt for AI generation e.g. "sunglasses", "car", "trees"
  customMaskDataUrl?: string; // Precomputed rasterized AI mask

  // Individual Mask Adjustments
  adjustments: MaskAdjustments;
}

export type LayerBlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export type LayerType =
  | 'raster'
  | 'adjustment'
  | 'text'
  | 'shape'
  | 'image'
  | 'smart-object'
  | 'group';

export interface LayerMaskData {
  enabled: boolean;
  inverted: boolean;
  density: number; // 0 to 100
  feather: number; // 0 to 100
  brushStrokes?: Array<{
    points: Array<{ x: number; y: number }>;
    size: number;
    opacity: number;
    mode: 'add' | 'erase';
  }>;
}

export interface LayerTransform {
  x: number; // normalized 0 to 1 or pixel offset
  y: number; // normalized 0 to 1 or pixel offset
  scaleX: number;
  scaleY: number;
  rotation: number; // in degrees
  flipH: boolean;
  flipV: boolean;
}

// Design Elements & Canva-Style Graphics System
export type DesignElementType =
  | 'shape'
  | 'line'
  | 'arrow'
  | 'sticker'
  | 'icon'
  | 'illustration'
  | 'frame'
  | 'grid'
  | 'pattern'
  | 'gradient-overlay';

export type DesignShapeType =
  | 'rectangle'
  | 'rounded-rect'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'star-4'
  | 'star-5'
  | 'star-6'
  | 'star-8'
  | 'polygon-6'
  | 'polygon-8'
  | 'heart'
  | 'diamond'
  | 'shield'
  | 'cloud'
  | 'speech-bubble'
  | 'thought-bubble'
  | 'sunburst'
  | 'flower'
  | 'ribbon'
  | 'badge-seal'
  | 'sparkle';

export type DesignLineStyle = 'solid' | 'dashed' | 'dotted' | 'wavy' | 'zigzag' | 'hand-drawn' | 'double';
export type DesignLineEnd = 'none' | 'arrow' | 'circle' | 'square' | 'diamond' | 'barbed-arrow';

export type DesignStickerType =
  | 'sale-50'
  | 'hot-deal'
  | 'best-seller'
  | 'verified-badge'
  | 'new-arrival'
  | 'neon-star'
  | 'retro-smiley'
  | 'heart-eyes'
  | 'sparkles-burst'
  | 'hologram-seal'
  | 'washi-tape-yellow'
  | 'washi-tape-pink'
  | 'washi-tape-grid'
  | 'discount-tag'
  | 'stamp-approved'
  | 'like-thumbs'
  | 'fire-flame'
  | 'crown-gold'
  | '100-percent'
  | 'coffee-cup';

export type DesignIconType =
  | 'camera'
  | 'heart'
  | 'star'
  | 'sparkles'
  | 'flame'
  | 'crown'
  | 'music'
  | 'coffee'
  | 'map-pin'
  | 'shopping-bag'
  | 'lightbulb'
  | 'message-circle'
  | 'thumbs-up'
  | 'plane'
  | 'trophy'
  | 'eye'
  | 'leaf'
  | 'sun'
  | 'moon'
  | 'diamond'
  | 'compass'
  | 'zap'
  | 'gift'
  | 'bell'
  | 'anchor'
  | 'bookmark'
  | 'check-circle'
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'twitter';

export type DesignIllustrationType =
  | 'botanical-monstera'
  | 'botanical-palm'
  | 'botanical-fern'
  | 'botanical-branch'
  | 'abstract-organic-blob-1'
  | 'abstract-organic-blob-2'
  | 'abstract-organic-blob-3'
  | 'sunburst-retro'
  | 'vintage-flourish-corner'
  | 'vintage-flourish-divider'
  | 'bauhaus-geometry'
  | 'circuit-cyberpunk'
  | 'sparkles-galaxy'
  | 'doodle-sun'
  | 'doodle-stars'
  | 'doodle-spiral'
  | 'retro-flower-daisy';

export type DesignFrameType =
  | 'polaroid-classic'
  | 'film-strip-slide'
  | 'postage-stamp'
  | 'torn-paper-edge'
  | 'arch-window'
  | 'circle-badge-frame'
  | 'washi-tape-photo'
  | 'vintage-gold-filigree'
  | 'neon-cyber-frame'
  | 'minimalist-thin-border';

export type DesignGridType =
  | 'split-2-v'
  | 'split-2-h'
  | 'grid-3-col'
  | 'grid-4-quad'
  | 'grid-6-masonry';

export type DesignPatternType =
  | 'polka-dots'
  | 'grid-graph'
  | 'diagonal-stripes'
  | 'memphis-geo'
  | 'topographic-contours'
  | 'checkerboard'
  | 'wavy-ripples'
  | 'hex-honeycomb'
  | 'stars-space'
  | 'halftone-dots'
  | 'marble-veins';

export interface DesignElementItem {
  id: string;
  name: string;
  type: DesignElementType;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0 to 100
  blendMode: LayerBlendMode;

  // Spatial & Transforms (normalized 0 to 1)
  position: { x: number; y: number };
  width: number; // normalized (e.g. 0.3 for 30% of canvas width)
  height: number; // normalized (e.g. 0.3 for 30% of canvas height)
  rotation: number; // -180 to 180
  flipH: boolean;
  flipV: boolean;

  // Styling & Colors
  fillType: 'solid' | 'gradient' | 'none';
  fillColor: string;
  fillGradient?: TypographyGradient;
  
  // Stroke & Outline
  strokeEnabled: boolean;
  strokeColor: string;
  strokeWidth: number; // in px
  strokeDash?: 'solid' | 'dashed' | 'dotted';

  // Shadow & Glow
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  
  glowEnabled: boolean;
  glowColor: string;
  glowRadius: number;

  // Sub-type specific configurations
  shapeType?: DesignShapeType;
  cornerRadius?: number; // in px
  starPoints?: number;
  polygonSides?: number;

  // Line & Arrow specific
  lineStyle?: DesignLineStyle;
  lineStart?: DesignLineEnd;
  lineEnd?: DesignLineEnd;
  curvature?: number; // -100 to 100 for curved arrows

  // Sticker, Icon, Illustration specific
  stickerType?: DesignStickerType;
  iconType?: DesignIconType;
  illustrationType?: DesignIllustrationType;

  // Frame & Grid specific
  frameType?: DesignFrameType;
  gridType?: DesignGridType;
  framePadding?: number;
  frameColor?: string;

  // Pattern specific
  patternType?: DesignPatternType;
  patternScale?: number; // 0.1 to 5.0
  patternColor?: string;
  patternBgColor?: string;
}

export interface DesignTemplate {
  id: string;
  name: string;
  category: 'Social Media' | 'Marketing' | 'Aesthetic & Art' | 'Vintage' | 'Minimalist';
  aspectRatio: '1:1' | '9:16' | '16:9' | '4:5' | '3:2';
  thumbnailUrl?: string;
  description: string;
  elements: DesignElementItem[];
  typography?: TypographyItem[];
  palette: string[];
}

export interface TypographyGradient {
  type: 'linear' | 'radial';
  angle: number; // 0 to 360 degrees
  stops: Array<{ offset: number; color: string }>;
  presetName?: string;
}

export interface TypographyOutline {
  enabled: boolean;
  color: string;
  width: number; // 0 to 40 px
  blur?: number; // 0 to 20 px
}

export interface TypographyShadow {
  enabled: boolean;
  color: string;
  blur: number; // 0 to 60 px
  offsetX: number; // -50 to 50 px
  offsetY: number; // -50 to 50 px
  opacity: number; // 0 to 100
}

export interface TypographyGlow {
  enabled: boolean;
  color: string;
  radius: number; // 0 to 80 px
  intensity: number; // 0 to 100
  innerGlow?: boolean;
}

export interface Typography3D {
  enabled: boolean;
  depth: number; // 0 to 60 px
  angle: number; // -180 to 180 degrees
  color: string;
  darkenFactor: number; // 0 to 100
  bevel: boolean;
}

export interface TypographyCurved {
  enabled: boolean;
  curvature: number; // -180 to 180 (arc curvature in degrees)
  direction: 'clockwise' | 'counter-clockwise';
  radius?: number;
}

export interface TypographyWarp {
  enabled: boolean;
  style: 'none' | 'arch' | 'wave' | 'bulge' | 'flag' | 'rise' | 'fish' | 'twist' | 'squeeze';
  bend: number; // -100 to 100
  horizontalDistortion?: number;
  verticalDistortion?: number;
}

export interface TypographyMask {
  enabled: boolean;
  mode: 'none' | 'knockout' | 'clip-photo' | 'inverted-silhouette';
  overlayColor?: string; // e.g. '#000000' for inverted silhouette
  opacity?: number; // 0 to 100
}

export interface TypographyBadge {
  enabled: boolean;
  color: string;
  paddingX: number;
  paddingY: number;
  borderRadius: number;
  borderWidth?: number;
  borderColor?: string;
}

export interface TypographyItem {
  id: string;
  name: string;
  text: string;
  fontFamily: string;
  customFontUrl?: string;
  isCustomFont?: boolean;
  fontSize: number; // in px
  fontWeight: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle: 'normal' | 'italic' | 'oblique';
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing: number; // in px (-10 to 50)
  lineHeight: number; // (0.5 to 3.0)
  align: 'left' | 'center' | 'right' | 'justify';
  
  // Fill & Color
  fillType: 'solid' | 'gradient';
  color: string;
  opacity: number; // 0 to 100
  gradient: TypographyGradient;

  // Effects & Styling
  outline: TypographyOutline;
  shadow: TypographyShadow;
  glow: TypographyGlow;
  threeD: Typography3D;
  curved: TypographyCurved;
  warp: TypographyWarp;
  mask: TypographyMask;
  badge: TypographyBadge;

  // Spatial Coordinates (normalized 0 to 1)
  position: { x: number; y: number };
  rotation: number; // -180 to 180 degrees
  scale: number; // 0.1 to 5.0
  visible: boolean;
  locked: boolean;
  blendMode?: LayerBlendMode;
}

export interface TextLayerData {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | string;
  fontStyle: 'normal' | 'italic';
  color: string;
  align: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  padding?: number;
  borderRadius?: number;
  
  // Enhanced Typography system integrations
  typographyItem?: TypographyItem;
}

export interface ShapeLayerData {
  shapeType:
    | 'rectangle'
    | 'rounded-rect'
    | 'circle'
    | 'ellipse'
    | 'triangle'
    | 'star'
    | 'polygon'
    | 'line'
    | 'arrow'
    | 'heart';
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWidth: number;
  strokeDash?: 'solid' | 'dashed' | 'dotted';
  cornerRadius?: number;
  sides?: number;
  starPoints?: number;
  width: number;
  height: number;
}

export interface SmartObjectData {
  originalSourceUrl: string;
  sourceType: 'image' | 'vector' | 'comp';
  smartFilters: {
    gaussianBlur?: number;
    sharpen?: number;
    emboss?: boolean;
    pixelate?: number;
    invert?: boolean;
    noise?: number;
  };
}

export interface LayerItem {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0 to 100
  blendMode: LayerBlendMode;
  groupId?: string | null;
  collapsed?: boolean;
  clippingMask?: boolean;

  transform?: LayerTransform;
  mask?: LayerMaskData;

  // Raster Layer brush strokes
  brushStrokes?: Array<{
    points: Array<{ x: number; y: number }>;
    size: number;
    color: string;
    opacity: number;
    mode: 'paint' | 'erase';
  }>;

  // Adjustment Layer settings
  adjustmentSettings?: Partial<AdjustmentSettings>;

  // Text Layer
  textData?: TextLayerData;

  // Shape Layer
  shapeData?: ShapeLayerData;

  // Image Layer
  imageUrl?: string;

  // Smart Object Layer
  smartObjectData?: SmartObjectData;
}

export type RetouchToolType =
  | 'healing-brush'
  | 'spot-removal'
  | 'blemish-removal'
  | 'clone-stamp'
  | 'patch-tool'
  | 'skin-smoothing'
  | 'wrinkle-reduction'
  | 'red-eye'
  | 'object-removal'
  | 'content-aware-fill'
  | 'dust-removal'
  | 'scratch-removal';

export interface RetouchPoint {
  x: number;
  y: number;
}

export interface RetouchStroke {
  id: string;
  type: RetouchToolType;
  points: RetouchPoint[];
  radius: number; // brush size in px
  feather: number; // 0 to 100
  opacity: number; // 0 to 100
  sourcePoint?: RetouchPoint; // source sample coordinates (for clone stamp, healing brush, patch tool)
  skinSmoothingSettings?: {
    smoothness: number; // 0 to 100
    skinToneOnly: boolean;
    poreRetention: number; // 0 to 100
  };
  wrinkleSettings?: {
    reduction: number; // 0 to 100
    depth: number;
  };
  redEyeSettings?: {
    darkenStrength: number; // 0 to 100
    preserveCatchlight: boolean;
  };
  dustScratchSettings?: {
    threshold: number; // outlier diff threshold
    radius: number;
  };
  active?: boolean;
  timestamp?: number;
}

// Collage System Types
export type CollageMode = 'grid' | 'freeform' | 'templates' | 'auto';

export type CollageLayoutType =
  | 'grid-1x2'
  | 'grid-2x1'
  | 'grid-2x2'
  | 'grid-3x3'
  | 'grid-2x3'
  | 'grid-3x2'
  | 'split-1-left-2-right'
  | 'split-2-left-1-right'
  | 'split-1-top-2-bottom'
  | 'split-2-top-1-bottom'
  | 'split-1-top-3-bottom'
  | 'split-3-top-1-bottom'
  | 'masonry-3'
  | 'masonry-4'
  | 'filmstrip-horizontal'
  | 'filmstrip-vertical'
  | 'magazine-cover'
  | 'mosaic-5'
  | 'story-9-16'
  | 'heart-cluster'
  | 'polaroid-scatter';

export type CollagePinType = 'none' | 'polaroid' | 'tape-top' | 'tape-corners' | 'pushpin' | 'stamp' | 'gold-clip';

export interface CollageItem {
  id: string;
  imageUrl: string;
  name?: string;
  x: number; // normalized 0 to 1
  y: number; // normalized 0 to 1
  width: number; // normalized 0 to 1
  height: number; // normalized 0 to 1
  rotation: number; // -180 to 180 deg
  scale: number; // 0.2 to 3.0
  cropX: number; // 0 to 1
  cropY: number; // 0 to 1
  cropScale: number; // 1 to 3
  zIndex: number;
  borderRadius?: number; // px
  borderWidth?: number; // px
  borderColor?: string;
  shadowEnabled?: boolean;
  shadowBlur?: number;
  shadowColor?: string;
  pinType?: CollagePinType;
  opacity?: number; // 0 to 100
  caption?: string;
}

export interface CollageBackground {
  type: 'solid' | 'gradient' | 'pattern' | 'blur-backdrop' | 'image';
  solidColor: string;
  gradient?: {
    type: 'linear' | 'radial';
    angle: number;
    stops: Array<{ color: string; offset: number }>;
  };
  pattern?: DesignPatternType;
  patternScale?: number;
  patternColor?: string;
  blurAmount?: number;
  customImageUrl?: string;
}

export interface CollageSettings {
  enabled: boolean;
  mode: CollageMode;
  aspectRatio: '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '2:3' | '3:2';
  layout: CollageLayoutType;
  spacing: number; // 0 to 60px gap between photos
  padding: number; // 0 to 80px outer collage padding
  cornerRadius: number; // 0 to 60px rounded photo corners
  outerBorder: {
    enabled: boolean;
    size: number;
    color: string;
    style: 'solid' | 'dashed' | 'double' | 'vintage';
  };
  background: CollageBackground;
  items: CollageItem[];
  activeItemId?: string | null;
  autoArrangeBy?: 'aspect-fit' | 'chronological' | 'focal-point' | 'balance';
}

// -------------------------------------------------------------
// Drawing, Painting & Illustration Studio Types
// -------------------------------------------------------------
export type DrawingToolType =
  | 'brush'
  | 'pencil'
  | 'marker'
  | 'pen'
  | 'eraser'
  | 'airbrush'
  | 'smudge'
  | 'shape'
  | 'custom-brush'
  | 'eyedropper';

export type DrawingShapeType =
  | 'line'
  | 'arrow'
  | 'double-arrow'
  | 'rectangle'
  | 'rounded-rect'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'star'
  | 'heart'
  | 'speech-bubble'
  | 'polygon';

export type CustomBrushType =
  | 'neon-glow'
  | 'sparkles-glitter'
  | 'star-constellation'
  | 'bokeh-orbs'
  | 'watercolor-splatter'
  | 'halftone-stipple'
  | 'foliage-leaves'
  | 'smoke-mist'
  | 'chains-ribbon'
  | 'charcoal-grain';

export interface DrawingPoint {
  x: number; // normalized 0 to 1
  y: number; // normalized 0 to 1
  pressure?: number; // 0 to 1
  time?: number;
}

export interface DrawingStroke {
  id: string;
  tool: DrawingToolType;
  points: DrawingPoint[];
  color: string; // hex or rgba
  size: number; // 1 to 200 px
  opacity: number; // 1 to 100
  flow?: number; // 1 to 100
  hardness?: number; // 0 to 100
  smoothing?: number; // 0 to 100
  pressureSensitivity?: boolean;
  blendMode?: LayerBlendMode;

  // Shapes
  shapeType?: DrawingShapeType;
  shapeFill?: string;
  shapeFillColor?: string;
  shapeFilled?: boolean;
  shapeStrokeWidth?: number;
  shapeCornerRadius?: number;

  // Custom Brushes & Textures
  customBrushType?: CustomBrushType;

  // Glow & Neon FX
  glowEnabled?: boolean;
  glowColor?: string;
  glowRadius?: number;

  // Gradient Stroke
  gradientStroke?: {
    type: 'linear' | 'radial';
    stops: Array<{ offset: number; color: string }>;
  };

  // Smudge & Eraser specifics
  smudgeStrength?: number; // 0 to 100
  eraserMode?: 'hard' | 'soft' | 'stroke';

  visible?: boolean;
  locked?: boolean;
  zIndex?: number;
  timestamp?: number;
}

export interface EditHistorySnapshot {
  id: string;
  timestamp: number;
  label: string;
  settings: AdjustmentSettings;
  crop: CropSettings;
  toneCurves: ToneCurves;
  hsl: HSLSettings;
  activePresetId: string | null;
  presetStrength: number;
  watermark: WatermarkSettings;
  border: BorderSettings;
  masks: SelectiveMask[];
  layers?: LayerItem[];
  typography?: TypographyItem[];
  designElements?: DesignElementItem[];
  retouchStrokes?: RetouchStroke[];
  collage?: CollageSettings;
  drawingStrokes?: DrawingStroke[];
  colorManagement?: ColorManagementSettings;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  image: ImageFile;
  currentSettings: AdjustmentSettings;
  crop: CropSettings;
  toneCurves: ToneCurves;
  hsl: HSLSettings;
  activePresetId: string | null;
  presetStrength: number;
  watermark: WatermarkSettings;
  border: BorderSettings;
  masks: SelectiveMask[];
  layers?: LayerItem[];
  typography?: TypographyItem[];
  designElements?: DesignElementItem[];
  retouchStrokes?: RetouchStroke[];
  collage?: CollageSettings;
  drawingStrokes?: DrawingStroke[];
  colorManagement?: ColorManagementSettings;
  history: EditHistorySnapshot[];
  historyIndex: number;
  snapshots: Array<{ id: string; name: string; timestamp: number; data: EditHistorySnapshot }>;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline' | 'local-only';
  cloudRevision: number;
  revision?: number;
  thumbnailUrl?: string;
  // Legacy V1 flat schema compatibility fields
  exposure?: number;
  temperature?: number;
  contrast?: number;
  highlights?: number;
  shadows?: number;
}

export type BatchResizeMode =
  | 'original'
  | 'percentage'
  | 'long-edge'
  | 'short-edge'
  | 'fit-box'
  | 'social-preset'
  | '50%'
  | '200%'
  | 'max-width'
  | 'max-height'
  | 'custom';

export type BatchSocialTarget =
  | 'insta-square'
  | 'insta-portrait'
  | 'insta-landscape'
  | 'story-reels'
  | 'twitter-post'
  | 'youtube-thumb';

export interface BatchSyncChecklist {
  basicTone: boolean;
  whiteBalance: boolean;
  colorGrade: boolean;
  detailSharpness: boolean;
  curves: boolean;
  hsl: boolean;
  preset: boolean;
  watermark: boolean;
  border: boolean;
}

export interface BatchQueueItem {
  id: string;
  file: File | { name: string; type: string; size: number };
  originalUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
  selected?: boolean;
  errorMessage?: string;
  customSettings?: AdjustmentSettings;
  customPresetId?: string;
  customToneCurves?: ToneCurves;
  customHsl?: HSLSettings;
  customWatermark?: WatermarkSettings;
  resultBlobUrl?: string;
  resultSize?: number;
  outputFilename?: string;
}

export interface BatchProcessingOptions {
  applyPresetId?: string;
  presetStrength: number;
  applyAdjustments?: AdjustmentSettings;
  applyToneCurves?: ToneCurves;
  applyHsl?: HSLSettings;
  autoEnhance: boolean;
  resizeOption: BatchResizeMode;
  scalePercent?: number; // 25 to 200
  longEdgePx?: number; // e.g. 2048
  shortEdgePx?: number; // e.g. 1080
  maxWidth?: number;
  maxHeight?: number;
  socialTarget?: BatchSocialTarget;
  outputFormat: 'png' | 'jpeg' | 'webp' | 'avif' | 'tiff' | 'heic' | 'dng' | 'psd';
  quality: number; // 0.1 to 1.0
  applyWatermark: boolean;
  watermarkSettings?: WatermarkSettings;
  namingPattern: string; // e.g. "{name}_lumina", "{seq3}_{name}", "IMG_{date}_{seq}"
  namePrefix?: string;
  nameSuffix?: string;
  findText?: string;
  replaceText?: string;
  startSeqIndex?: number;
}

// ----------------------------------------------------------------------------
// AI Image Understanding & Vision Intelligence Types
// ----------------------------------------------------------------------------
export interface VisualDimensionAnalysis {
  people: { detected: boolean; count: number; description: string; tag: string };
  faces: { detected: boolean; count: number; skinTones: string; expression: string; lighting: string };
  objects: { keyItems: string[]; focusSubject: string };
  background: { depth: string; clutterLevel: 'Clean' | 'Moderate' | 'Busy'; distractions: string[] };
  sky: { detected: boolean; type: string; condition: string; needsRecovery: boolean };
  buildings: { detected: boolean; perspective: string; verticals: string };
  plants: { detected: boolean; foliageVibrancy: string; greenCast: boolean };
  animals: { detected: boolean; type: string; detail: string };
  clothing: { colors: string[]; textures: string };
  text: { detected: boolean; content: string; needsRemoval: boolean };
  lighting: { quality: string; direction: string; dynamicRange: string; harshness: string };
  composition: { ruleOfThirds: boolean; framing: string; balance: string; horizonLevel: string };
  colors: { temperatureK: string; dominantTones: string[]; tintBalance: string; saturationStatus: string };
  depth: { dof: string; subjectIsolation: string; separationQuality: string };
}

export interface AiEditSuggestion {
  id: string;
  title: string;
  category: 'Exposure' | 'Highlights' | 'Background' | 'Subject' | 'WhiteBalance' | 'Color' | 'Composition' | 'Optics' | 'Detail';
  priority: 'Critical' | 'Recommended' | 'Creative';
  confidence: number; // 0 to 100
  reason: string;
  actionType: 'adjust_settings' | 'apply_preset' | 'ai_bg_blur' | 'ai_remove_distractions' | 'ai_enhance_subject' | 'straighten' | 'tone_curves';
  impactBadge: string;
  adjustmentsPatch?: Partial<AdjustmentSettings>;
  hslPatch?: Partial<HSLSettings>;
  applied?: boolean;
}

export interface ImageUnderstandingResult {
  summary: string;
  shotType: string;
  dimensions: VisualDimensionAnalysis;
  suggestions: AiEditSuggestion[];
  overallQualityScore: number; // 0 to 100
}

// ----------------------------------------------------------------------------
// Composition Assistant & Framing Intelligence Types
// ----------------------------------------------------------------------------
export interface CompositionEvaluation {
  ruleOfThirds: {
    score: number; // 0-100
    status: 'Good' | 'Needs Improvement' | 'Excellent';
    details: string;
    subjectAlignment: string;
  };
  leadingLines: {
    score: number;
    detected: boolean;
    strength: 'Strong' | 'Subtle' | 'None';
    direction: string;
    details: string;
  };
  symmetry: {
    score: number;
    type: 'Bilateral' | 'Radial' | 'Asymmetrical' | 'Dynamic';
    status: string;
    details: string;
  };
  subjectPlacement: {
    score: number;
    focalZone: string;
    headroomStatus: 'Optimal' | 'Too Much' | 'Too Tight';
    details: string;
  };
  horizon: {
    detected: boolean;
    tiltDegrees: number; // e.g. -1.8 or 0
    levelStatus: 'Level' | 'Tilted Left' | 'Tilted Right' | 'No Horizon';
    recommendation: string;
  };
  headroom: {
    score: number;
    clearancePercent: number;
    status: 'Balanced' | 'Excessive' | 'Cramped';
    details: string;
  };
  negativeSpace: {
    score: number;
    distribution: 'Balanced' | 'Top-Heavy' | 'Bottom-Heavy' | 'Cluttered';
    details: string;
  };
  visualBalance: {
    score: number;
    equilibrium: 'Equally Weighted' | 'Left Heavy' | 'Right Heavy' | 'Center Focused';
    details: string;
  };
}

export interface CompositionCropOption {
  id: string;
  title: string;
  subtitle: string;
  explanation: string;
  suggestionQuote: string; // e.g. "Crop 6% from the left and 3% from the top."
  cropDelta: {
    leftPercent: number;
    topPercent: number;
    rightPercent: number;
    bottomPercent: number;
  };
  cropCoordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotationDegrees: number;
  aspectRatio: number | 'free';
  aspectRatioLabel: string;
  targetGenre: 'Optimal Pro' | 'Cinematic 16:9' | 'Portrait 4:5' | 'Minimalist 1:1' | 'Golden Ratio';
  recommendedOverlayGuide: 'rule_of_thirds' | 'golden_ratio' | 'golden_spiral' | 'leading_lines' | 'diagonal_triangles' | 'center_cross';
}

export interface CompositionAssistantResult {
  overallScore: number;
  summary: string;
  evaluations: CompositionEvaluation;
  primarySuggestionQuote: string;
  cropOptions: CompositionCropOption[];
}

// ----------------------------------------------------------------------------
// Before / After System & Comparison Types
// ----------------------------------------------------------------------------
export type ComparisonViewMode =
  | 'off'
  | 'toggle'
  | 'split-vertical'
  | 'split-horizontal'
  | 'side-by-side'
  | 'top-bottom'
  | 'difference'
  | 'opacity-blend'
  | 'hold';

export interface ComparisonSettings {
  mode: ComparisonViewMode;
  splitPosition: number; // 0.0 to 1.0 (default 0.5)
  isShowingBeforeToggle: boolean;
  opacityBlend: number; // 0 (Original) to 100 (Edited)
  differenceAmplification: number; // 1 to 5
  syncPanZoom: boolean;
}

// ----------------------------------------------------------------------------
// Non-Destructive Editing & Recipe Architecture Types
// ----------------------------------------------------------------------------
export interface NonDestructiveRecipe {
  version: string; // e.g. '2.0-lumina'
  name: string;
  author?: string;
  createdAt: number;
  updatedAt: number;
  sourceImage: {
    name: string;
    width: number;
    height: number;
    format: string;
  };
  instructions: {
    adjustments: AdjustmentSettings;
    toneCurves: ToneCurves;
    hsl: HSLSettings;
    crop: CropSettings;
    activePresetId?: string | null;
    presetStrength?: number;
    watermark?: WatermarkSettings;
    border?: BorderSettings;
    masks?: SelectiveMask[];
    retouchStrokes?: RetouchStroke[];
    drawingStrokes?: DrawingStroke[];
    typography?: TypographyItem[];
    designElements?: DesignElementItem[];
  };
}

export interface ProjectVersionBranch {
  id: string;
  name: string;
  description?: string;
  timestamp: number;
  thumbnailUrl?: string;
  data: EditHistorySnapshot;
}

export type WorkflowStage =
  | 'cull'
  | 'crop-geometry'
  | 'raw-develop'
  | 'ai-enhance'
  | 'local-retouch'
  | 'color-grade'
  | 'export-share';





