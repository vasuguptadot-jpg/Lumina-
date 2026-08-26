export type ApiScope =
  | 'projects:read'
  | 'projects:write'
  | 'render:execute'
  | 'render:async'
  | 'batch:execute'
  | 'automation:execute'
  | 'models:custom'
  | 'webhooks:manage'
  | 'plugins:publish';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  scopes: ApiScope[];
  createdAt: number;
  lastUsedAt?: number;
  rateLimitPerMin: number;
  totalRequests: number;
  environment: 'production' | 'sandbox';
}

export type WebhookEventType =
  | 'render.started'
  | 'render.progress'
  | 'render.completed'
  | 'render.failed'
  | 'batch.started'
  | 'batch.item_processed'
  | 'batch.completed'
  | 'automation.executed'
  | 'project.exported'
  | 'model.inference_finished';

export interface WebhookEndpoint {
  id: string;
  url: string;
  description: string;
  secret: string;
  events: WebhookEventType[];
  enabled: boolean;
  createdAt: number;
  lastDeliveryStatus?: 'success' | 'failed';
  lastDeliveryAt?: number;
  deliveryCount: number;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  event: WebhookEventType;
  payload: Record<string, any>;
  responseCode?: number;
  responseBody?: string;
  latencyMs: number;
  status: 'delivered' | 'failed' | 'pending';
  signature: string;
  timestamp: number;
}

export type CustomAIProviderType =
  | 'openai_compatible'
  | 'huggingface_inference'
  | 'replicate'
  | 'openrouter'
  | 'ollama_local'
  | 'custom_rest';

export interface CustomAIModelConfig {
  id: string;
  name: string;
  provider: CustomAIProviderType;
  endpointUrl: string;
  apiKey?: string;
  modelIdentifier: string; // e.g. "stabilityai/stable-diffusion-xl-base-1.0" or "llama-vision-3"
  modelType: 'image_generation' | 'image_to_image' | 'vision_analysis' | 'upscaling_superres' | 'inpainting';
  headers?: Record<string, string>;
  parametersSchema?: Record<string, any>;
  promptTemplate?: string;
  enabled: boolean;
  createdAt: number;
  lastTestedAt?: number;
  status?: 'active' | 'error' | 'untested';
}

export interface CloudRenderJob {
  id: string;
  status: 'queued' | 'rendering' | 'completed' | 'failed' | 'cancelled';
  projectId?: string;
  sourceImageUrl?: string;
  options: {
    format: 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff' | 'dng' | 'psd';
    quality: number;
    upscaleFactor?: 1 | 2 | 4 | 8;
    colorSpace: 'sRGB' | 'Display-P3' | 'AdobeRGB';
    gpuAcceleration: 'standard' | 'ultra_a100' | 'tpu_v5' | 'browser_webgpu';
    stripExif?: boolean;
    presetId?: string;
    watermarkText?: string;
  };
  progress: number;
  outputUrl?: string;
  outputSizeBytes?: number;
  latencyMs?: number;
  workerNode?: string;
  createdAt: number;
  completedAt?: number;
  error?: string;
}

export interface BatchApiJob {
  id: string;
  name: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  totalItems: number;
  completedItems: number;
  failedItems: number;
  items: Array<{
    id: string;
    sourceUrl: string;
    outputUrl?: string;
    status: 'pending' | 'processing' | 'done' | 'failed';
    error?: string;
  }>;
  workflowId?: string;
  zipDownloadUrl?: string;
  webhookUrl?: string;
  createdAt: number;
  completedAt?: number;
}

export interface ApiEndpointDoc {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  category: 'Rendering' | 'Automation' | 'Batch' | 'Custom AI' | 'Projects' | 'Webhooks';
  title: string;
  description: string;
  authRequired: boolean;
  scopes: ApiScope[];
  headers?: Record<string, string>;
  queryParams?: Array<{ name: string; type: string; required: boolean; description: string }>;
  requestBodyExample?: Record<string, any>;
  responseExample: Record<string, any>;
  curlExample: string;
  jsExample: string;
  pythonExample: string;
}
