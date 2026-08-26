import {
  GroqConfig,
  GroqLogEntry,
  GroqUsageStats,
  GROQ_SUPPORTED_MODELS,
} from '../types/groq';

const STORAGE_KEY_CONFIG = 'lumina_groq_config_v1';
const STORAGE_KEY_SECRET = 'lumina_groq_secret_v1';
const STORAGE_KEY_STATS = 'lumina_groq_stats_v1';
const STORAGE_KEY_LOGS = 'lumina_groq_logs_v1';

// Default configuration
const DEFAULT_CONFIG: GroqConfig = {
  hasKey: false,
  maskedKey: '',
  enabled: true,
  byokMode: false,
  localOnlyMode: false,
  activeModel: 'llama-3.3-70b-versatile',
  fallbackModel: 'llama-3.1-8b-instant',
  timeoutMs: 30000,
  maxRetries: 2,
  retryDelayMs: 1000,
  userAuthorizedImageUploads: false,
  redactExifBeforeUpload: true,
  logRequestsLocally: true,
};

const DEFAULT_STATS: GroqUsageStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalPromptTokens: 0,
  totalCompletionTokens: 0,
  totalTokens: 0,
  estimatedCostUSD: 0,
  lastUsedTimestamp: null,
};

// Mask helper: "gsk_abcd1234efgh5678" -> "gsk_••••••••••••5678"
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '';
  const prefix = key.slice(0, 4);
  const suffix = key.slice(-4);
  const stars = '•'.repeat(Math.max(4, key.length - 8));
  return `${prefix}${stars}${suffix}`;
}

// Obfuscate / unobfuscate helper for browser storage
function obfuscate(str: string): string {
  try {
    return btoa(encodeURIComponent(str));
  } catch {
    return str;
  }
}

function deobfuscate(str: string): string {
  try {
    return decodeURIComponent(atob(str));
  } catch {
    return str;
  }
}

// ----------------------------------------------------------------------------
// CONFIGURATION MANAGEMENT
// ----------------------------------------------------------------------------
export function getGroqConfig(): GroqConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    const hasSecret = Boolean(sessionStorage.getItem(STORAGE_KEY_SECRET) || localStorage.getItem(STORAGE_KEY_SECRET));
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      hasKey: hasSecret || parsed.hasKey,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveGroqConfig(config: Partial<GroqConfig>): GroqConfig {
  const current = getGroqConfig();
  const updated: GroqConfig = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
  return updated;
}

export function setGroqApiKey(rawKey: string, persistToLocal: boolean = true): GroqConfig {
  const trimmed = rawKey.trim();
  if (!trimmed) {
    return removeGroqApiKey();
  }

  const masked = maskApiKey(trimmed);
  const encoded = obfuscate(trimmed);

  if (persistToLocal) {
    localStorage.setItem(STORAGE_KEY_SECRET, encoded);
  } else {
    sessionStorage.setItem(STORAGE_KEY_SECRET, encoded);
    localStorage.removeItem(STORAGE_KEY_SECRET);
  }

  const updated = saveGroqConfig({
    hasKey: true,
    maskedKey: masked,
    byokMode: true,
  });

  return updated;
}

export function removeGroqApiKey(): GroqConfig {
  localStorage.removeItem(STORAGE_KEY_SECRET);
  sessionStorage.removeItem(STORAGE_KEY_SECRET);

  const updated = saveGroqConfig({
    hasKey: false,
    maskedKey: '',
    byokMode: false,
  });

  return updated;
}

export function getRawGroqApiKey(): string | null {
  const localVal = localStorage.getItem(STORAGE_KEY_SECRET);
  if (localVal) return deobfuscate(localVal);

  const sessionVal = sessionStorage.getItem(STORAGE_KEY_SECRET);
  if (sessionVal) return deobfuscate(sessionVal);

  return null;
}

// ----------------------------------------------------------------------------
// USAGE STATS & TELEMETRY
// ----------------------------------------------------------------------------
export function getGroqUsageStats(): GroqUsageStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATS);
    return raw ? { ...DEFAULT_STATS, ...JSON.parse(raw) } : { ...DEFAULT_STATS };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function getGroqLogs(): GroqLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearGroqLogs(): void {
  localStorage.removeItem(STORAGE_KEY_LOGS);
  localStorage.removeItem(STORAGE_KEY_STATS);
}

export function recordGroqUsage(entry: Omit<GroqLogEntry, 'id' | 'timestamp' | 'estimatedCostUSD'>): GroqLogEntry {
  const modelInfo = GROQ_SUPPORTED_MODELS.find((m) => m.id === entry.model);
  const promptPricing = modelInfo?.pricingPerMillionTokens.prompt || 0.5;
  const compPricing = modelInfo?.pricingPerMillionTokens.completion || 0.8;

  const promptCost = (entry.promptTokens / 1_000_000) * promptPricing;
  const compCost = (entry.completionTokens / 1_000_000) * compPricing;
  const cost = promptCost + compCost;

  const fullEntry: GroqLogEntry = {
    ...entry,
    id: `glog_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    estimatedCostUSD: Number(cost.toFixed(6)),
  };

  // Update Logs
  const config = getGroqConfig();
  if (config.logRequestsLocally) {
    const currentLogs = getGroqLogs();
    const updatedLogs = [fullEntry, ...currentLogs].slice(0, 100); // Keep last 100
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updatedLogs));
  }

  // Update Stats
  const currentStats = getGroqUsageStats();
  const updatedStats: GroqUsageStats = {
    totalRequests: currentStats.totalRequests + 1,
    successfulRequests: currentStats.successfulRequests + (entry.status === 'success' ? 1 : 0),
    failedRequests: currentStats.failedRequests + (entry.status === 'error' ? 1 : 0),
    totalPromptTokens: currentStats.totalPromptTokens + entry.promptTokens,
    totalCompletionTokens: currentStats.totalCompletionTokens + entry.completionTokens,
    totalTokens: currentStats.totalTokens + entry.totalTokens,
    estimatedCostUSD: Number((currentStats.estimatedCostUSD + cost).toFixed(6)),
    lastUsedTimestamp: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(updatedStats));

  return fullEntry;
}

// ----------------------------------------------------------------------------
// API CLIENT METHODS (ROUTED SECURELY THROUGH BACKEND PROXY)
// ----------------------------------------------------------------------------

/**
 * Validate connection and verify API key
 */
export async function testGroqConnection(apiKeyOverride?: string): Promise<{
  success: boolean;
  latencyMs?: number;
  modelsCount?: number;
  availableModels?: string[];
  error?: string;
}> {
  const key = apiKeyOverride || getRawGroqApiKey();
  const config = getGroqConfig();

  if (config.localOnlyMode) {
    return { success: false, error: 'Local-only mode is active. External API calls are blocked.' };
  }

  try {
    const res = await fetch('/api/groq/validate-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(key ? { 'x-groq-api-key': key } : {}),
      },
      body: JSON.stringify({
        timeoutMs: config.timeoutMs,
      }),
    });

    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error connecting to Groq proxy.' };
  }
}

/**
 * Execute text or structured reasoning via Groq Chat Completions
 */
export async function sendGroqChat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    promptSummary?: string;
  }
): Promise<{
  success: boolean;
  content?: string;
  parsedJson?: any;
  latencyMs?: number;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  error?: string;
}> {
  const config = getGroqConfig();

  if (!config.enabled) {
    return { success: false, error: 'AI features are currently disabled in settings.' };
  }

  if (config.localOnlyMode) {
    return { success: false, error: 'Local-Only Mode is enabled. No external API calls permitted.' };
  }

  const key = getRawGroqApiKey();
  const model = options?.model || config.activeModel;
  const startTime = Date.now();

  try {
    const res = await fetch('/api/groq/chat-completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(key ? { 'x-groq-api-key': key } : {}),
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 2048,
        response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
        timeoutMs: config.timeoutMs,
        maxRetries: config.maxRetries,
      }),
    });

    const json = await res.json();
    const latencyMs = Date.now() - startTime;

    if (!json.success) {
      recordGroqUsage({
        model,
        endpoint: 'chat-completions',
        status: 'error',
        latencyMs,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        errorMessage: json.error,
        promptSummary: options?.promptSummary || messages[messages.length - 1]?.content.slice(0, 80),
      });

      return { success: false, error: json.error, latencyMs };
    }

    const choice = json.choices?.[0]?.message?.content || '';
    const usage = json.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    let parsedJson = null;
    if (options?.jsonMode) {
      try {
        parsedJson = JSON.parse(choice);
      } catch {
        parsedJson = null;
      }
    }

    recordGroqUsage({
      model,
      endpoint: 'chat-completions',
      status: 'success',
      latencyMs,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      promptSummary: options?.promptSummary || messages[messages.length - 1]?.content.slice(0, 80),
    });

    return {
      success: true,
      content: choice,
      parsedJson,
      latencyMs,
      usage,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    recordGroqUsage({
      model,
      endpoint: 'chat-completions',
      status: 'error',
      latencyMs,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      errorMessage: err.message,
    });
    return { success: false, error: err.message, latencyMs };
  }
}

/**
 * Execute Groq Vision Analysis (Requires user authorization and a vision-capable model)
 */
export async function sendGroqVision(
  imageBase64: string,
  userPrompt: string,
  modelOverride?: string
): Promise<{
  success: boolean;
  data?: any;
  latencyMs?: number;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  error?: string;
}> {
  const config = getGroqConfig();

  if (!config.enabled) {
    return { success: false, error: 'AI features are currently disabled in settings.' };
  }

  if (config.localOnlyMode) {
    return { success: false, error: 'Local-Only Mode is active. Image uploads to external AI are blocked.' };
  }

  if (!config.userAuthorizedImageUploads) {
    return {
      success: false,
      error: 'Image upload to Groq is not authorized. Please enable "Authorize Image Uploads" in Groq Settings.',
    };
  }

  const model = modelOverride || (config.activeModel.includes('vision') ? config.activeModel : 'llama-3.2-11b-vision-preview');
  const key = getRawGroqApiKey();
  const startTime = Date.now();

  try {
    const res = await fetch('/api/groq/vision-analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(key ? { 'x-groq-api-key': key } : {}),
      },
      body: JSON.stringify({
        imageBase64,
        userPrompt,
        model,
        timeoutMs: config.timeoutMs,
      }),
    });

    const json = await res.json();
    const latencyMs = Date.now() - startTime;

    if (!json.success) {
      recordGroqUsage({
        model,
        endpoint: 'vision-analyze',
        status: 'error',
        latencyMs,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        errorMessage: json.error,
        promptSummary: userPrompt.slice(0, 80),
      });

      return { success: false, error: json.error, latencyMs };
    }

    const usage = json.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    recordGroqUsage({
      model,
      endpoint: 'vision-analyze',
      status: 'success',
      latencyMs,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      promptSummary: userPrompt.slice(0, 80),
    });

    return {
      success: true,
      data: json.data,
      latencyMs,
      usage,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    recordGroqUsage({
      model,
      endpoint: 'vision-analyze',
      status: 'error',
      latencyMs,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      errorMessage: err.message,
    });
    return { success: false, error: err.message, latencyMs };
  }
}
