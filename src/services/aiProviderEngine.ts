import {
  AIProviderConfig,
  AIProviderType,
  AIExecutionResult,
  DEFAULT_AI_PROVIDER_CONFIG,
} from '../types/aiProvider';
import { calculateAutoTone } from '../engine/autoToneEngine';
import { inpaintImageLocally } from '../engine/inpainting';
import { getGroqConfig, sendGroqChat } from './groqService';

const STORAGE_KEY_AI_PROVIDER = 'lumina_ai_provider_config_v2';

export function getAIProviderConfig(): AIProviderConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AI_PROVIDER);
    if (!raw) return { ...DEFAULT_AI_PROVIDER_CONFIG };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_AI_PROVIDER_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_AI_PROVIDER_CONFIG };
  }
}

export function saveAIProviderConfig(update: Partial<AIProviderConfig>): AIProviderConfig {
  const current = getAIProviderConfig();
  const next: AIProviderConfig = { ...current, ...update };
  try {
    localStorage.setItem(STORAGE_KEY_AI_PROVIDER, JSON.stringify(next));
  } catch (err) {
    console.error('Failed to save AI Provider config:', err);
  }
  return next;
}

export function setOfflineMode(enabled: boolean): AIProviderConfig {
  return saveAIProviderConfig({ offlineMode: enabled });
}

export function setAIProvider(provider: AIProviderType): AIProviderConfig {
  return saveAIProviderConfig({ provider });
}

/**
 * Checks if the system should strictly execute in local offline mode
 */
export function isStrictlyLocal(): boolean {
  const config = getAIProviderConfig();
  if (config.offlineMode || config.provider === 'none') {
    return true;
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }
  return false;
}

/**
 * Local Deterministic Auto-Tone Fallback
 * Calculates optimal exposure, highlights, shadows, white point, black point, contrast using histogram analysis
 */
export async function executeAutoEnhanceLocally(
  canvasOrImage: HTMLCanvasElement | HTMLImageElement
): Promise<AIExecutionResult> {
  const startTime = performance.now();
  try {
    let canvas: HTMLCanvasElement;
    if (canvasOrImage instanceof HTMLCanvasElement) {
      canvas = canvasOrImage;
    } else {
      canvas = document.createElement('canvas');
      canvas.width = canvasOrImage.naturalWidth || canvasOrImage.width || 800;
      canvas.height = canvasOrImage.naturalHeight || canvasOrImage.height || 600;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(canvasOrImage, 0, 0, canvas.width, canvas.height);
    }

    const adjustments = calculateAutoTone(canvas);
    return {
      success: true,
      data: adjustments,
      source: 'local_deterministic',
      latencyMs: Math.round(performance.now() - startTime),
      message: 'Locally computed histogram auto-tone balance (0ms cloud latency)',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Local auto-tone failed',
      source: 'local_deterministic',
      latencyMs: Math.round(performance.now() - startTime),
    };
  }
}

/**
 * Local Deterministic Object Inpainting / Magic Eraser Fallback
 * Uses Telea / Navier-Stokes algorithm for local pixel reconstruction without cloud dependency
 */
export async function executeInpaintingLocally(
  imageSource: string | HTMLCanvasElement,
  maskSource: string | HTMLCanvasElement,
  radius: number = 5
): Promise<AIExecutionResult<{ imageUrl: string }>> {
  const startTime = performance.now();
  try {
    const resultDataUrl = await inpaintImageLocally(imageSource, maskSource, radius);
    return {
      success: true,
      data: { imageUrl: resultDataUrl },
      source: 'local_deterministic',
      latencyMs: Math.round(performance.now() - startTime),
      message: 'Local Fast Telea Inpainting rendered without cloud upload',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Local inpainting failed',
      source: 'local_deterministic',
      latencyMs: Math.round(performance.now() - startTime),
    };
  }
}

/**
 * Dispatches an AI request with transparent, guaranteed local fallback
 */
export async function runWithLocalFallback<T>(
  aiAction: () => Promise<T>,
  localFallbackAction: () => Promise<T>,
  featureName: string = 'Requested Feature'
): Promise<{ result: T; isFallback: boolean; source: 'cloud' | 'local'; error?: string }> {
  // If user disabled AI or is offline, instantly run local
  if (isStrictlyLocal()) {
    const res = await localFallbackAction();
    return { result: res, isFallback: true, source: 'local' };
  }

  try {
    const res = await aiAction();
    return { result: res, isFallback: false, source: 'cloud' };
  } catch (err: any) {
    console.warn(`[AI Engine] ${featureName} cloud request failed or timed out. Falling back to local engine.`, err);
    const localRes = await localFallbackAction();
    return {
      result: localRes,
      isFallback: true,
      source: 'local',
      error: err.message || 'AI service temporarily unavailable',
    };
  }
}
