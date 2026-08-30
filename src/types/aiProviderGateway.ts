/**
 * Lumina Studio Pro — Universal AI Provider System Types
 * Enterprise-grade provider abstraction, credential encryption, capability discovery,
 * model management, request routing, usage tracking, and security governance.
 */

export type AIProviderId =
  | 'openai'
  | 'gemini'
  | 'anthropic'
  | 'openrouter'
  | 'groq'
  | 'mistral'
  | 'xai'
  | 'together'
  | 'deepseek'
  | 'local_ollama'
  | 'local_custom'
  | (string & {});

export type AIProviderType = 'cloud' | 'local' | 'compatible_openai' | 'custom';

export type AIAuthType =
  | 'bearer'
  | 'x_api_key'
  | 'api_key_header'
  | 'custom_header'
  | 'query_param'
  | 'none';

export type AIRequestFormat =
  | 'openai_chat_completions'
  | 'gemini_generate_content'
  | 'anthropic_messages'
  | 'ollama_chat'
  | 'custom_json';

export type AIResponseFormat =
  | 'openai_standard'
  | 'gemini_standard'
  | 'anthropic_standard'
  | 'ollama_standard'
  | 'custom_json';

export interface AICapabilities {
  textInput: boolean;
  textOutput: boolean;
  imageInput: boolean; // Vision capabilities
  imageOutput: boolean; // Generative image creation (e.g. DALL-E, Imagen)
  imageEditing: boolean; // Inpainting, object removal, generative fill
  streamingSupport: boolean;
  embeddings: boolean;
  toolCalling: boolean;
}

export interface AIModelDefinition {
  id: string;
  name: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  capabilities: AICapabilities;
  pricing?: {
    promptPer1k?: number; // USD
    completionPer1k?: number; // USD
    imageGenerationUSD?: number; // USD per image
    imageAnalysisUSD?: number; // USD per image analysis
  };
  isDefault?: boolean;
  recommendedFor?: Array<'scene_analysis' | 'natural_language_editing' | 'object_removal' | 'image_generation' | 'metadata_generation'>;
}

export type DataRetentionPolicy =
  | 'zero_retention_api' // Provider states zero data retention for API
  | 'standard_retention' // 30-day abuse retention
  | 'may_train' // Data may be retained or used for training
  | 'local_zero_network' // Local execution, zero network transmission
  | 'unknown';

export interface AIProviderPreset {
  id: AIProviderId;
  name: string;
  type: AIProviderType;
  defaultEndpoint: string;
  authType: AIAuthType;
  headerName?: string; // For custom_header or api_key_header
  requestFormat: AIRequestFormat;
  responseFormat: AIResponseFormat;
  defaultModels: AIModelDefinition[];
  capabilities: AICapabilities;
  browserDirectSupported: boolean; // True if provider API has permissive CORS for browser direct calls
  corsLimitationNote?: string;
  dataRetentionPolicy: DataRetentionPolicy;
  documentationUrl: string;
  keyPlaceholder: string;
}

export interface EncryptedCredential {
  iv: string; // Base64
  ciphertext: string; // Base64
  salt: string; // Base64
  version: number;
  updatedAt: number;
}

export interface StoredProviderConfig {
  id: string; // Unique instance ID (e.g. 'openai_personal', 'gemini_work')
  providerId: AIProviderId;
  name: string;
  customName?: string;
  endpoint: string;
  authType: AIAuthType;
  customHeaderName?: string;
  requestFormat: AIRequestFormat;
  responseFormat: AIResponseFormat;
  hasStoredKey: boolean; // True if key is encrypted in vault
  enabled: boolean;
  selectedModel: string;
  customModels: AIModelDefinition[];
  capabilities: AICapabilities;
  createdAt: number;
  lastTestedAt?: number;
  lastTestStatus?: 'success' | 'failed' | 'untested';
  lastTestError?: string;
  dataRetentionPolicy: DataRetentionPolicy;
}

export interface AIUniversalRequest {
  task:
    | 'scene_analysis'
    | 'natural_language_editing'
    | 'object_removal'
    | 'image_generation'
    | 'metadata_generation'
    | 'general_chat';
  prompt: string;
  systemInstruction?: string;
  image?: {
    base64: string; // Cleaned base64 data without prefix or with prefix
    mimeType: string;
    width?: number;
    height?: number;
  };
  maskImage?: {
    base64: string;
    mimeType: string;
  };
  modelOverride?: string;
  providerOverride?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface AIUniversalResponse<T = any> {
  success: boolean;
  text?: string;
  generatedImageUrl?: string;
  generatedImageDataUri?: string;
  structuredData?: T;
  rawResponse?: any;
  providerId: string;
  model: string;
  latencyMs: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUSD: number;
  };
  error?: {
    code: AIErrorCode;
    message: string;
    rawError?: any;
  };
}

export type AIErrorCode =
  | 'INVALID_API_KEY'
  | 'AUTHENTICATION_FAILED'
  | 'MODEL_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'CORS_BLOCKED'
  | 'NETWORK_ERROR'
  | 'REQUEST_TOO_LARGE'
  | 'UNSUPPORTED_CAPABILITY'
  | 'CONTENT_REJECTED'
  | 'TIMEOUT'
  | 'USER_CANCELLED'
  | 'STORAGE_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'UNKNOWN_ERROR';

export interface AIUsageRecord {
  id: string;
  timestamp: number;
  providerId: string;
  providerName: string;
  model: string;
  task: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
  isImageGeneration: boolean;
  isImageAnalysis: boolean;
  success: boolean;
}

export interface AIUsageSummary {
  totalRequests: number;
  totalTokens: number;
  totalEstimatedCostUSD: number;
  imageGenerations: number;
  imageAnalyses: number;
  sessionRequests: number;
  sessionEstimatedCostUSD: number;
  dailySpentUSD: number;
  monthlySpentUSD: number;
}

export interface AISpendingLimits {
  dailyLimitUSD: number; // 0 = unlimited
  monthlyLimitUSD: number; // 0 = unlimited
  maxImageDimension: number; // e.g. 2048px
  maxRequestPayloadKB: number; // e.g. 5120KB
}

export interface TaskModelAssignment {
  scene_analysis?: { providerId: string; modelId: string };
  natural_language_editing?: { providerId: string; modelId: string };
  object_removal?: { providerId: string; modelId: string };
  image_generation?: { providerId: string; modelId: string };
  metadata_generation?: { providerId: string; modelId: string };
  general_chat?: { providerId: string; modelId: string };
}
