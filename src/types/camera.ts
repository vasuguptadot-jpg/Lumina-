export type CameraCaptureMode =
  | 'photo'
  | 'raw'
  | 'hdr'
  | 'long-exposure'
  | 'night'
  | 'portrait';

export type CameraWbPreset =
  | 'auto'
  | 'daylight'
  | 'shade'
  | 'cloudy'
  | 'tungsten'
  | 'fluorescent'
  | 'flash'
  | 'custom';

export type CameraGridType =
  | 'none'
  | 'rule-of-thirds'
  | 'golden-ratio'
  | 'diagonal'
  | 'center-cross'
  | 'square-1-1';

export type CameraPeakingColor = 'green' | 'red' | 'cyan' | 'yellow' | 'white';

export type AiSceneType =
  | 'portrait'
  | 'landscape'
  | 'sunset'
  | 'night'
  | 'macro'
  | 'food'
  | 'architecture'
  | 'action'
  | 'document'
  | 'general';

export interface AiFaceDetection {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number;
  height: number;
  confidence: number;
  smileScore: number; // 0 to 100
  isSmiling: boolean;
  eyesOpen: boolean;
}

export interface AiCompositionGuidance {
  tip: string;
  score: number; // 0 to 100
  targetOffset?: { x: number; y: number };
  levelRecommendation?: number;
  type: 'framing' | 'horizon' | 'headroom' | 'lighting' | 'good';
}

export interface AiCameraAnalysis {
  scene: AiSceneType;
  sceneConfidence: number;
  suggestedIso: number;
  suggestedShutter: string;
  suggestedKelvin: number;
  faces: AiFaceDetection[];
  blurScore: number; // 0 - 100 (higher = pin sharp)
  isBlurry: boolean;
  isLowLight: boolean;
  lowLightBoostActive: boolean;
  composition: AiCompositionGuidance;
  smileDetected: boolean;
}

export interface AiBurstFrame {
  id: string;
  url: string;
  score: number;
  sharpness: number;
  smileScore: number;
  isBest: boolean;
}

export interface CameraSettings {
  mode: CameraCaptureMode;
  // Exposure & Sensor
  iso: number; // 50 to 12800
  autoIso: boolean;
  shutterSpeed: string; // '1/8000' ... '30s'
  autoShutter: boolean;
  exposureComp: number; // -3.0 to +3.0 EV in 1/3 steps
  // White Balance
  wbPreset: CameraWbPreset;
  kelvin: number; // 2000K to 10000K
  tint: number; // -50 to +50
  // Focus
  focusMode: 'af' | 'mf';
  focusDistance: number; // 0 (macro 5cm) to 100 (infinity)
  // Assist Tools
  showHistogram: boolean;
  histogramChannel: 'all' | 'rgb' | 'luminance';
  focusPeaking: boolean;
  peakingColor: CameraPeakingColor;
  peakingSensitivity: number; // 1 to 100
  zebraEnabled: boolean;
  zebraThreshold: number; // 70, 80, 90, 100 (IRE)
  grid: CameraGridType;
  horizonLevel: boolean;
  // Mode-Specific Parameters
  portraitAperture: number; // 1.4, 2.0, 2.8, 4.0, 5.6, 8.0, 16.0
  hdrBrackets: number; // 3 or 5 brackets (-2, 0, +2 EV)
  longExposureSec: number; // 0.5 to 30 seconds
  nightMultiFrames: number; // 4 to 12 frames
  // Hardware & Viewfinder
  facingMode: 'environment' | 'user';
  zoom: number; // 0.5x, 1x, 2x, 3x, 5x
  shutterSound: boolean;
  timerSec: 0 | 3 | 5 | 10;
  rawBitDepth: 12 | 14 | 16;
  // AI Camera Assistant Features
  aiDirectorEnabled: boolean;
  aiAutoExposure: boolean;
  aiAutoWb: boolean;
  aiSmileShutter: boolean;
  aiBestFrameBurst: boolean;
  aiLowLightEnhance: boolean;
  aiSceneRecognition: boolean;
}

export const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
  mode: 'raw',
  iso: 100,
  autoIso: true,
  shutterSpeed: '1/250',
  autoShutter: true,
  exposureComp: 0.0,
  wbPreset: 'auto',
  kelvin: 5600,
  tint: 0,
  focusMode: 'af',
  focusDistance: 80,
  showHistogram: true,
  histogramChannel: 'all',
  focusPeaking: false,
  peakingColor: 'green',
  peakingSensitivity: 40,
  zebraEnabled: false,
  zebraThreshold: 90,
  grid: 'rule-of-thirds',
  horizonLevel: true,
  portraitAperture: 1.8,
  hdrBrackets: 3,
  longExposureSec: 4.0,
  nightMultiFrames: 8,
  facingMode: 'environment',
  zoom: 1.0,
  shutterSound: true,
  timerSec: 0,
  rawBitDepth: 14,
  aiDirectorEnabled: true,
  aiAutoExposure: true,
  aiAutoWb: true,
  aiSmileShutter: false,
  aiBestFrameBurst: false,
  aiLowLightEnhance: true,
  aiSceneRecognition: true,
};

export interface CapturedPhotoResult {
  imageUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  format: 'dng' | 'raw' | 'jpeg' | 'png';
  sizeBytes: number;
  metadata: {
    cameraMake: string;
    cameraModel: string;
    lens: string;
    iso: number;
    shutterSpeed: string;
    aperture: string;
    focalLength: string;
    whiteBalanceKelvin: number;
    exposureBias: string;
    colorSpace: string;
    bitDepth: number;
    mode: CameraCaptureMode;
    timestamp: number;
    bayerPattern?: string;
  };
}
