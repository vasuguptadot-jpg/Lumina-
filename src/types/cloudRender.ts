/**
 * Lumina Studio Pro — Phase 8 Production Cloud GPU Render Engine Schema
 * Defines the authoritative job data models, stage transitions, and telemetry.
 */

export type CloudRenderStage =
  | 'QUEUED'
  | 'INPUT_VALIDATION'
  | 'ASSET_DOWNLOAD'
  | 'RAW_DECODE'
  | 'PROCESSING'
  | 'ENCODING'
  | 'UPLOAD'
  | 'VERIFIED';

export type CloudJobStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface CloudRenderParameters {
  scale: number;
  width: number;
  height: number;
  colorSpace: 'sRGB' | 'Display P3' | 'Adobe RGB' | 'ProPhoto RGB';
  bitDepth: '8-bit' | '16-bit' | '32-bit Float';
  quality: number;
  denoiseStrength?: number;
  sharpenRadius?: number;
  aiEnhanceMode?: 'none' | 'neural_upscale' | 'hdr_expand' | 'face_detail';
  exportFormat: 'png' | 'jpeg' | 'webp' | 'tiff' | 'dng' | 'psd';
}

export interface ProductionCloudRenderJob {
  jobId: string;
  userId: string;
  projectId: string;
  projectName: string;
  projectRevision: number;
  inputAssetRefs: string[];
  renderParameters: CloudRenderParameters;
  outputFormat: 'png' | 'jpeg' | 'webp' | 'tiff' | 'dng' | 'psd';
  priority: 'normal' | 'high' | 'pro_priority';
  status: CloudJobStatus;
  stage: CloudRenderStage;
  progress: number; // 0 - 100
  workerId: string | null;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  resultAssetRef: string | null;
  downloadUrl: string | null;
  checksumSha256: string | null;
  outputSizeBytes: number | null;
  idempotencyKey: string;
  telemetry?: {
    queueDurationMs?: number;
    workerDurationMs?: number;
    totalDurationMs?: number;
    peakVramMb?: number;
    gpuNodeName?: string;
  };
}
