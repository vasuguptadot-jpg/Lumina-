export type AIProviderType = 'none' | 'groq' | 'gemini' | 'local_wasm';

export interface AIProviderConfig {
  provider: AIProviderType;
  offlineMode: boolean; // When true, all AI requests are bypassed and local algorithms execute
  requireCloudConsent: boolean; // Ask before uploading image pixels to cloud
  userAuthorizedCloudUploads: boolean;
  redactExifBeforeUpload: boolean;
  groqApiKey: string;
  geminiApiKey: string;
  activeGroqModel: string;
  activeGeminiModel: string;
  maxRetries: number;
  timeoutMs: number;
  localFallbackActive: boolean;
}

export interface AIExecutionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  source: 'local_deterministic' | 'groq_cloud' | 'gemini_cloud' | 'local_wasm';
  latencyMs: number;
  message?: string;
  fallbackUsed?: boolean;
}

export const DEFAULT_AI_PROVIDER_CONFIG: AIProviderConfig = {
  provider: 'groq',
  offlineMode: false,
  requireCloudConsent: true,
  userAuthorizedCloudUploads: false,
  redactExifBeforeUpload: true,
  groqApiKey: '',
  geminiApiKey: '',
  activeGroqModel: 'llama-3.3-70b-versatile',
  activeGeminiModel: 'gemini-1.5-flash',
  maxRetries: 2,
  timeoutMs: 25000,
  localFallbackActive: true,
};
