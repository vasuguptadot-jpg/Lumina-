/**
 * Lumina Studio Pro — Universal AI Request Router (Local AI + User API + Lumina Cloud)
 *
 * Intelligently routes editing and analysis tasks based on the user's configured top-level mode:
 * 1. 'local' -> WebGPU / WASM Local AI execution (0 network activity)
 * 2. 'user_api' -> Point-to-point encrypted HTTPS to user's provider
 * 3. 'lumina_cloud' -> Lumina Managed Cloud AI
 * 4. 'none' -> Disabled (deterministic parametric editing only)
 */

import { AIUniversalRequest, AIUniversalResponse } from '../../types/aiProviderGateway';
import { aiProviderManager } from './aiProviderManager';
import { aiCredentialVault } from './aiCredentialVault';
import { aiSecurityGuard } from './aiSecurityGuard';
import { aiUsageTracker } from './aiUsageTracker';
import { webAIAdapter } from './adapters/platform/webAIAdapter';
import { hardwareProfiler } from './hardwareProfiler';
import { localModelManager } from './localModelManager';

export class UniversalAIRouter {
  private static instance: UniversalAIRouter;

  private constructor() {}

  public static getInstance(): UniversalAIRouter {
    if (!UniversalAIRouter.instance) {
      UniversalAIRouter.instance = new UniversalAIRouter();
    }
    return UniversalAIRouter.instance;
  }

  public async dispatch(req: AIUniversalRequest): Promise<AIUniversalResponse> {
    const startTime = performance.now();
    const mode = aiProviderManager.getTopLevelMode();

    // Mode: NONE (Disabled)
    if (mode === 'none') {
      return {
        success: false,
        providerId: 'disabled',
        model: 'none',
        latencyMs: 0,
        error: {
          code: 'UNSUPPORTED_CAPABILITY',
          message: 'AI processing is currently disabled in Settings → AI Providers.',
        },
      };
    }

    // Mode: LOCAL AI
    if (mode === 'local') {
      const profile = await hardwareProfiler.getProfile();
      await webAIAdapter.initialize(profile);

      // Determine local category & model
      let category: any = 'vision_language';
      let modelId = profile.recommendedVLM;

      if (req.task === 'object_removal') {
        category = 'inpainting';
        modelId = 'lama_inpainting_q8';
      } else if (req.task === 'scene_analysis') {
        category = 'vision_language';
        modelId = profile.recommendedVLM;
      } else if (req.task === 'natural_language_editing') {
        category = 'vision_language';
        modelId = profile.recommendedVLM;
      }

      const localResult = await webAIAdapter.executeInference({
        category,
        modelId,
        prompt: req.prompt,
        scaleFactor: 2,
      });

      if (localResult.success) {
        return {
          success: true,
          providerId: 'local_device',
          model: modelId,
          text: localResult.intent ? JSON.stringify(localResult.intent, null, 2) : 'Adjustments computed on-device.',
          structuredData: localResult.intent,
          latencyMs: localResult.latencyMs,
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            estimatedCostUSD: 0,
          },
        };
      } else {
        return {
          success: false,
          providerId: 'local_device',
          model: modelId,
          latencyMs: localResult.latencyMs,
          error: {
            code: 'PROVIDER_UNAVAILABLE',
            message: localResult.error || 'Local model execution could not be completed.',
          },
        };
      }
    }

    // Mode: USER API or LUMINA CLOUD
    let providerConfig = req.providerOverride ? aiProviderManager.getProvider(req.providerOverride) : undefined;
    let selectedModel = req.modelOverride;

    if (!providerConfig) {
      const resolved = aiProviderManager.getActiveProviderForTask(req.task);
      providerConfig = resolved.config;
      selectedModel = selectedModel || resolved.model;
    }

    if (!providerConfig || (!providerConfig.hasStoredKey && providerConfig.authType !== 'none')) {
      return {
        success: false,
        providerId: 'none',
        model: 'none',
        latencyMs: 0,
        error: {
          code: 'PROVIDER_UNAVAILABLE',
          message: 'No connected API Key configured. Go to Settings → AI Providers to connect your provider, or switch to Built-in Local AI.',
        },
      };
    }

    // Security Guard Validation
    const securityCheck = await aiSecurityGuard.validateRequest(req, 0.005);
    if (!securityCheck.allowed) {
      return {
        success: false,
        providerId: providerConfig.providerId,
        model: selectedModel || providerConfig.selectedModel,
        latencyMs: 0,
        error: {
          code: 'UNSUPPORTED_CAPABILITY',
          message: securityCheck.reason || 'AI request rejected by security guard.',
        },
      };
    }

    // Decrypt credential in volatile memory
    const apiKey = (await aiCredentialVault.getCredential(providerConfig.id)) || '';
    const adapter = aiProviderManager.getAdapter(providerConfig.providerId);
    const response = await adapter.executeRequest(providerConfig, apiKey, {
      ...req,
      modelOverride: selectedModel,
    });

    if (response.success && response.usage) {
      aiUsageTracker.recordUsage({
        providerId: providerConfig.id,
        providerName: providerConfig.name,
        model: response.model,
        task: req.task,
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
        estimatedCostUSD: response.usage.estimatedCostUSD,
        isImageGeneration: req.task === 'image_generation',
        isImageAnalysis: req.task === 'scene_analysis',
        success: true,
      });
    }

    return response;
  }
}

export const universalAIRouter = UniversalAIRouter.getInstance();
