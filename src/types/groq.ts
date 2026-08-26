export interface GroqModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  isVision: boolean;
  speedTier: 'ultra_fast' | 'fast' | 'balanced' | 'deep_reasoning';
  description: string;
  pricingPerMillionTokens: {
    prompt: number; // in USD
    completion: number; // in USD
  };
}

export const GROQ_SUPPORTED_MODELS: GroqModelInfo[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    contextWindow: 128000,
    isVision: false,
    speedTier: 'fast',
    description: 'Flagship open weights model with state-of-the-art reasoning, color theory, and editing logic.',
    pricingPerMillionTokens: { prompt: 0.59, completion: 0.79 },
  },
  {
    id: 'llama-3.2-90b-vision-preview',
    name: 'Llama 3.2 90B Vision Preview',
    contextWindow: 128000,
    isVision: true,
    speedTier: 'balanced',
    description: 'High-accuracy multimodal vision model for direct image analysis, composition, and object detection.',
    pricingPerMillionTokens: { prompt: 0.90, completion: 0.90 },
  },
  {
    id: 'llama-3.2-11b-vision-preview',
    name: 'Llama 3.2 11B Vision Preview',
    contextWindow: 128000,
    isVision: true,
    speedTier: 'ultra_fast',
    description: 'Lightweight, ultra-fast vision model optimized for rapid scene decomposition and bokeh detection.',
    pricingPerMillionTokens: { prompt: 0.18, completion: 0.18 },
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    contextWindow: 128000,
    isVision: false,
    speedTier: 'ultra_fast',
    description: 'Blazing fast inference (~1000 tokens/sec) for real-time prompt generation and quick adjustments.',
    pricingPerMillionTokens: { prompt: 0.05, completion: 0.08 },
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 Distill Llama 70B',
    contextWindow: 128000,
    isVision: false,
    speedTier: 'deep_reasoning',
    description: 'Chain-of-thought mathematical reasoning for complex color curve balancing and HDR Tone Mapping.',
    pricingPerMillionTokens: { prompt: 0.75, completion: 0.99 },
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B MoE',
    contextWindow: 32768,
    isVision: false,
    speedTier: 'fast',
    description: 'High-throughput Mixture-of-Experts architecture with 32k context.',
    pricingPerMillionTokens: { prompt: 0.24, completion: 0.24 },
  },
];

export interface GroqLogEntry {
  id: string;
  timestamp: number;
  model: string;
  endpoint: string;
  status: 'success' | 'error';
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
  promptSummary?: string;
  errorMessage?: string;
}

export interface GroqUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
  lastUsedTimestamp: number | null;
}

export interface GroqConfig {
  // Key Management
  hasKey: boolean;
  maskedKey: string; // e.g. "gsk_••••••••••••••••3aB8"
  
  // Operational Modes
  enabled: boolean; // Master AI on/off toggle
  byokMode: boolean; // Bring Your Own Key mode active
  localOnlyMode: boolean; // Strict local-only mode: zero external requests
  
  // Active Model Selection
  activeModel: string;
  fallbackModel: string;
  
  // Network & Resilience
  timeoutMs: number; // 5000 to 120000 ms (default 30000)
  maxRetries: number; // 0 to 5 (default 2)
  retryDelayMs: number; // (default 1000)
  
  // Privacy & Security Controls
  userAuthorizedImageUploads: boolean; // User must authorize uploading image frames
  redactExifBeforeUpload: boolean; // Automatically scrub GPS and personal EXIF before API calls
  logRequestsLocally: boolean; // Keep telemetry in local browser storage only
}
