/**
 * Lumina Studio Pro — Local AI Models & Multi-Tier Runtime Types
 */

export type LocalAIModelCategory =
  | 'vision_language'
  | 'segmentation'
  | 'inpainting'
  | 'super_resolution'
  | 'enhancement'
  | 'depth_estimation'
  | 'detection';

export type LocalModelLicenseCategory =
  | 'permissive_commercial'
  | 'gemma_commercial'
  | 'community_commercial'
  | 'non_commercial_restricted';

export type LocalRuntimeBackend =
  | 'transformers_js'
  | 'onnx_runtime_web'
  | 'webgpu'
  | 'wasm'
  | 'native_tflite'
  | 'native_coreml'
  | 'local_builtin';

export type HardwareCapabilityTier = 1 | 2 | 3 | 4;

export interface LocalModelManifest {
  modelId: string;
  name: string;
  version: string;
  category: LocalAIModelCategory;
  description: string;
  developer: string;
  license: string;
  licenseCategory: LocalModelLicenseCategory;
  commercialUseAllowed: boolean;
  redistributionAllowed: boolean;
  modelSizeMB: number;
  quantizedSizeMB: number;
  quantizationFormat: 'int8' | 'int4' | 'fp16' | 'fp32' | 'wasm-q4';
  sha256: string;
  minRAMMB: number;
  minVRAMMB: number;
  requiredHardwareTier: HardwareCapabilityTier;
  supportedPlatforms: Array<'web_webgpu' | 'web_wasm' | 'android' | 'ios' | 'desktop'>;
  runtimeBackend: LocalRuntimeBackend;
  downloadUrl: string;
  expectedPerformance: {
    tier1_cpu: string;
    tier2_gpu: string;
    tier3_npu: string;
    tier4_desktop: string;
  };
  suitabilityStatus: 'PASS' | 'PARTIAL' | 'REJECT';
  suitabilityReason: string;
  tasks: Array<
    | 'scene_analysis'
    | 'natural_language_editing'
    | 'object_removal'
    | 'smart_segmentation'
    | 'super_resolution'
    | 'denoising'
    | 'exposure_enhancement'
    | 'depth_relighting'
  >;
}

export type ModelDownloadStatus =
  | 'idle'
  | 'downloading'
  | 'verifying'
  | 'installed'
  | 'corrupted'
  | 'error'
  | 'paused';

export interface ModelDownloadProgress {
  bytesLoaded: number;
  totalBytes: number;
  percentage: number;
  speedBps: number;
  estimatedSecondsRemaining: number;
}

export interface InstalledLocalModelRecord {
  modelId: string;
  version: string;
  installedAt: number;
  sizeBytes: number;
  sha256Verified: boolean;
  computedSha256?: string;
  storageKey: string;
  status: ModelDownloadStatus;
  progress?: ModelDownloadProgress;
  errorMessage?: string;
  isCustomLocal?: boolean;
}

export type TopLevelAIProviderMode =
  | 'local' // Built-in Local AI
  | 'user_api' // User API Key
  | 'lumina_cloud' // Lumina Managed Cloud AI
  | 'none'; // Disabled AI

export interface HardwareProfileResult {
  tier: HardwareCapabilityTier;
  tierName: string;
  cpuCores: number;
  deviceMemoryGB: number;
  webGPUSupported: boolean;
  webGPUAdapterName?: string;
  batteryStatus?: {
    charging: boolean;
    level: number; // 0.0 - 1.0
  };
  thermalThrottled: boolean;
  recommendedVLM: string;
  recommendedSegmentation: string;
  maxInferenceDimension: number;
}

export interface AIEditOperation {
  type:
    | 'CREATE_MASK'
    | 'INPAINT'
    | 'ADJUST_EXPOSURE'
    | 'ADJUST_CONTRAST'
    | 'ADJUST_TEMPERATURE'
    | 'ADJUST_TINT'
    | 'ADJUST_SATURATION'
    | 'ADJUST_HIGHLIGHTS'
    | 'ADJUST_SHADOWS'
    | 'APPLY_CURVES'
    | 'DENOISE'
    | 'SUPER_RESOLVE'
    | 'RELIGHT'
    | 'AUTO_BALANCE';
  target?: 'entire_image' | 'subject' | 'background' | 'sky' | 'face' | 'masked_region';
  maskId?: string;
  value?: number; // Normalized numeric parameter
  channel?: 'rgb' | 'red' | 'green' | 'blue';
  curvePoints?: Array<[number, number]>;
  scaleFactor?: 2 | 4;
  strength?: number; // 0 - 100
  lightDirection?: [number, number, number]; // Normalized vector
  confidenceThreshold?: number;
  description?: string;
}

export interface AIStructuredEditIntent {
  intent: string;
  explanation: string;
  operations: AIEditOperation[];
  confidence: number;
  estimatedProcessingTimeMs?: number;
}
