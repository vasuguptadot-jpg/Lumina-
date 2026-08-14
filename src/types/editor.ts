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

export interface RawMetadata {
  isRaw: boolean;
  cameraMake?: string;
  cameraModel?: string;
  lens?: string;
  iso?: number;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  colorSpace?: string;
  bitDepth?: number;
  whiteBalance?: string;
  wbKelvin?: number;
  wbTint?: number;
  bayerPattern?: BayerPattern | string;
  sensorDimensions?: string;
  dateShot?: string;
  exposureBias?: string;
  flashFired?: boolean;
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

export interface FilterPreset {
  id: string;
  name: string;
  category: 'Film Emulation' | 'Cinematic' | 'Portrait' | 'Vintage' | 'Landscape' | 'B&W' | 'Creative' | 'Custom';
  description: string;
  thumbnailGradient: string;
  settings: Partial<AdjustmentSettings>;
  hsl?: Partial<HSLSettings>;
  toneCurves?: Partial<ToneCurves>;
  strength?: number; // 0 to 100
}

export interface WatermarkSettings {
  enabled: boolean;
  text: string;
  font: string;
  fontSize: number; // pt
  color: string;
  opacity: number; // 0 to 100
  position: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  hasShadow: boolean;
  padding: number;
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
  | 'ai-object';

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
  feather: number;         // 0 to 100
  opacity?: number;        // 0 to 100 (overall mask strength)
  showOverlay?: boolean;   // Ruby red mask overlay on canvas
  overlayColor?: 'ruby' | 'emerald' | 'cyan' | 'amber' | 'grayscale';

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

export interface TextLayerData {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: '300' | '400' | '600' | '700' | '900';
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
  history: EditHistorySnapshot[];
  historyIndex: number;
  snapshots: Array<{ id: string; name: string; timestamp: number; data: EditHistorySnapshot }>;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline' | 'local-only';
  cloudRevision: number;
  thumbnailUrl?: string;
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
  errorMessage?: string;
  customSettings?: AdjustmentSettings;
  customPresetId?: string;
  resultBlobUrl?: string;
  resultSize?: number;
}

export interface BatchProcessingOptions {
  applyPresetId?: string;
  presetStrength: number;
  applyAdjustments?: AdjustmentSettings;
  autoEnhance: boolean;
  resizeOption: 'original' | '50%' | '200%' | 'max-width' | 'max-height' | 'custom';
  maxWidth?: number;
  maxHeight?: number;
  outputFormat: 'png' | 'jpeg' | 'webp' | 'tiff';
  quality: number; // 0.1 to 1.0
  applyWatermark: boolean;
  watermarkSettings?: WatermarkSettings;
  namingPattern: string; // e.g. "{name}_edited", "IMG_{index}_{date}"
}
