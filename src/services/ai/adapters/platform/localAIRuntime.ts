/**
 * Lumina Studio Pro — Local AI Runtime Abstract Class & Factory
 */

import {
  AIStructuredEditIntent,
  HardwareProfileResult,
  LocalAIModelCategory,
} from '../../../../types/localAIModels';

export interface LocalInferenceRequest {
  category: LocalAIModelCategory;
  modelId: string;
  image?: {
    dataUri?: string;
    imageData?: ImageData;
    width: number;
    height: number;
  };
  mask?: {
    dataUri?: string;
    imageData?: ImageData;
  };
  prompt?: string;
  points?: Array<{ x: number; y: number; label: number }>; // For MobileSAM interactive points
  scaleFactor?: 2 | 4;
  signal?: AbortSignal;
}

export interface LocalInferenceResponse {
  success: boolean;
  intent?: AIStructuredEditIntent;
  outputImageData?: ImageData;
  outputDataUri?: string;
  maskData?: ImageData;
  latencyMs: number;
  executionBackend: string;
  error?: string;
}

export abstract class BaseLocalAIAdapter {
  abstract readonly platformName: string;

  abstract initialize(profile: HardwareProfileResult): Promise<boolean>;

  abstract executeInference(request: LocalInferenceRequest): Promise<LocalInferenceResponse>;

  abstract releaseModel(modelId: string): Promise<void>;
}
