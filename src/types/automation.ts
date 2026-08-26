import {
  AdjustmentSettings,
  FilterPreset,
  HSLSettings,
  ToneCurves,
  WatermarkSettings,
  BatchResizeMode,
  BatchSocialTarget,
} from './editor';

export type AutomationStepType =
  | 'import'
  | 'ai_analysis'
  | 'color_correction'
  | 'noise_reduction'
  | 'preset'
  | 'watermark'
  | 'resize'
  | 'export';

// 1. Import Step Configuration
export interface ImportStepConfig {
  sourceType: 'active_canvas' | 'file_upload' | 'batch_queue' | 'sample_library';
  autoOrient: boolean;
  colorSpace: 'sRGB' | 'Display-P3' | 'AdobeRGB';
}

// 2. AI Analysis Step Configuration
export interface AIAnalysisStepConfig {
  enabled: boolean;
  mode: 'balanced' | 'aggressive' | 'natural' | 'portrait_prioritized' | 'gemini_vision';
  detectScene: boolean;
  detectLighting: boolean;
  calculateNoiseProfile: boolean;
  autoToneAssistance: boolean;
}

// 3. Color Correction Step Configuration
export interface ColorCorrectionStepConfig {
  enabled: boolean;
  autoTone: boolean;
  autoWhiteBalance: boolean;
  exposure: number;       // -100 to 100
  contrast: number;       // -100 to 100
  highlights: number;     // -100 to 100
  shadows: number;        // -100 to 100
  whites: number;         // -100 to 100
  blacks: number;         // -100 to 100
  temperature: number;    // -100 to 100
  tint: number;           // -100 to 100
  vibrance: number;       // -100 to 100
  saturation: number;     // -100 to 100
  clarity: number;        // -100 to 100
  dehaze: number;         // -100 to 100
  autoSplitTone?: boolean;
}

// 4. Noise Reduction & Detail Step Configuration
export interface NoiseReductionStepConfig {
  enabled: boolean;
  luminanceNR: number;       // 0 to 100
  luminanceDetail: number;   // 0 to 100
  colorNR: number;           // 0 to 100
  colorDetail: number;       // 0 to 100
  colorSmoothness: number;   // 0 to 100
  sharpness: number;         // 0 to 150
  sharpnessRadius: number;   // 0.5 to 3.0
  sharpnessMasking: number;  // 0 to 100
  texture: number;           // -100 to 100
  microcontrast: number;     // -100 to 100
}

// 5. Preset Step Configuration
export interface PresetStepConfig {
  enabled: boolean;
  presetId: string | null;
  presetStrength: number;    // 0 to 150%
  lutId?: string | null;
  lutIntensity?: number;     // 0 to 100%
}

// 6. Watermark Step Configuration
export interface WatermarkStepConfig {
  enabled: boolean;
  type: 'text' | 'logo' | 'pattern-tile';
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  opacity: number;           // 0 to 100%
  position:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'center-left'
    | 'center'
    | 'center-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  padding: number;
  hasShadow: boolean;
  isTiled: boolean;
  logoDataUrl?: string;
}

// 7. Resize Step Configuration
export interface ResizeStepConfig {
  enabled: boolean;
  mode: BatchResizeMode;
  scalePercent?: number;     // e.g. 50%, 75%, 150%, 200%
  longEdgePx?: number;       // e.g. 1080, 1920, 2048, 3840 (4K), 4096
  shortEdgePx?: number;
  maxWidth?: number;
  maxHeight?: number;
  socialTarget?: BatchSocialTarget;
  resampleQuality?: 'high' | 'medium' | 'low';
}

// 8. Export Step Configuration
export interface ExportStepConfig {
  enabled: boolean;
  format: 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff' | 'heic' | 'dng' | 'psd';
  quality: number;           // 0.1 to 1.0 (e.g. 0.92)
  colorProfile: 'sRGB' | 'Display-P3' | 'AdobeRGB';
  namingPattern: string;     // e.g. '{name}_lumina_{preset}_{w}x{h}'
  namePrefix?: string;
  nameSuffix?: string;
  stripExif?: boolean;
  autoDownload: boolean;
  saveToProjectHistory?: boolean;
  sendToEditor?: boolean;
}

// Comprehensive Automation Workflow Data Model
export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  category: 'Commercial' | 'Portrait' | 'Social' | 'Landscape' | 'E-Commerce' | 'Fine Art' | 'General';
  icon?: string;
  tags?: string[];
  isBuiltIn?: boolean;
  createdAt: number;
  updatedAt: number;
  author?: string;
  steps: {
    importStep: ImportStepConfig;
    aiAnalysisStep: AIAnalysisStepConfig;
    colorCorrectionStep: ColorCorrectionStepConfig;
    noiseReductionStep: NoiseReductionStepConfig;
    presetStep: PresetStepConfig;
    watermarkStep: WatermarkStepConfig;
    resizeStep: ResizeStepConfig;
    exportStep: ExportStepConfig;
  };
}

// Runtime Step Report
export interface AutomationStepReport {
  stepType: AutomationStepType;
  stepName: string;
  stepIndex: number;
  status: 'pending' | 'running' | 'completed' | 'skipped' | 'error';
  latencyMs: number;
  previewUrl?: string;       // Visual snapshot at this exact step
  details?: string;
  stats?: Record<string, any>;
  error?: string;
}

// AI Diagnostic Insights from Step 2
export interface AIDiagnosticReport {
  sceneClassification: string;
  lightingType: string;
  dynamicRangeScore: number;     // 0 to 100
  estimatedNoiseLevel: 'Clean' | 'Low' | 'Moderate' | 'High' | 'Heavy';
  dominantColorMood: string;
  recommendedEVOffset: number;
  recommendedContrast: number;
  recommendedHighlights: number;
  recommendedShadows: number;
  recommendedTempOffset: number;
  skinToneDetected: boolean;
  skyDetected: boolean;
  sharpnessScore: number;        // 0 to 100
}

// Automation Execution Result
export interface AutomationExecutionResult {
  success: boolean;
  totalLatencyMs: number;
  stepReports: AutomationStepReport[];
  finalCanvas: HTMLCanvasElement;
  finalBlob: Blob;
  finalBlobUrl: string;
  finalFilename: string;
  width: number;
  height: number;
  aiDiagnostics?: AIDiagnosticReport;
  error?: string;
}
