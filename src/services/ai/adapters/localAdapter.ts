/**
 * Lumina Studio Pro — Local AI & Ollama Universal Adapter
 * Communicates directly with local endpoints (e.g. Ollama, LM Studio, vLLM, LocalAI)
 * Zero network transit outside the user's computer.
 */

import { AIProviderAdapter } from './baseAdapter';
import {
  StoredProviderConfig,
  AIUniversalRequest,
  AIUniversalResponse,
  AIModelDefinition,
} from '../../../types/aiProviderGateway';
import { aiSecurityGuard } from '../aiSecurityGuard';

export class LocalAdapter implements AIProviderAdapter {
  public providerId: string;

  constructor(providerId: string = 'local_ollama') {
    this.providerId = providerId;
  }

  public async validateCredentials(
    config: StoredProviderConfig,
    _apiKey: string
  ): Promise<{ success: boolean; modelsFound?: number; error?: string; latencyMs: number }> {
    const start = performance.now();
    try {
      const endpoint = `${config.endpoint.replace(/\/$/, '')}/api/tags`;
      const res = await fetch(endpoint, { method: 'GET' });
      const latencyMs = Math.round(performance.now() - start);

      if (!res.ok) {
        return {
          success: false,
          error: `Local endpoint reachable but returned status ${res.status}`,
          latencyMs,
        };
      }

      const data = await res.json();
      const models = Array.isArray(data.models) ? data.models.length : 1;
      return { success: true, modelsFound: models, latencyMs };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        success: false,
        error: `Could not reach local Ollama endpoint at ${config.endpoint}. Verify that Ollama is running and OLLAMA_ORIGINS="*" is set.`,
        latencyMs,
      };
    }
  }

  public async listModels(config: StoredProviderConfig, _apiKey: string): Promise<AIModelDefinition[]> {
    try {
      const endpoint = `${config.endpoint.replace(/\/$/, '')}/api/tags`;
      const res = await fetch(endpoint, { method: 'GET' });
      if (!res.ok) return config.customModels || [];
      const data = await res.json();
      if (Array.isArray(data.models)) {
        return data.models.map((m: any) => ({
          id: m.name,
          name: `${m.name} (${Math.round((m.size || 0) / (1024 * 1024 * 1024) * 10) / 10}GB)`,
          capabilities: {
            textInput: true,
            textOutput: true,
            imageInput: m.name.includes('vision') || m.name.includes('llava') || m.name.includes('bakllava'),
            imageOutput: false,
            imageEditing: false,
            streamingSupport: true,
            embeddings: false,
            toolCalling: true,
          },
        }));
      }
      return config.customModels || [];
    } catch {
      return config.customModels || [];
    }
  }

  public async executeRequest(
    config: StoredProviderConfig,
    _apiKey: string,
    req: AIUniversalRequest
  ): Promise<AIUniversalResponse> {
    const start = performance.now();
    const model = req.modelOverride || config.selectedModel || 'llava:latest';

    try {
      const endpoint = `${config.endpoint.replace(/\/$/, '')}/api/chat`;

      const messages: any[] = [];
      if (req.systemInstruction) {
        messages.push({ role: 'system', content: req.systemInstruction });
      }

      const userMsg: any = { role: 'user', content: req.prompt };

      if (req.image && req.image.base64) {
        let cleanBase64 = req.image.base64;
        if (cleanBase64.includes(';base64,')) {
          cleanBase64 = cleanBase64.split(';base64,')[1];
        }
        userMsg.images = [cleanBase64];
      }

      messages.push(userMsg);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
        }),
        signal: req.signal,
      });

      const latencyMs = Math.round(performance.now() - start);

      if (!res.ok) {
        return {
          success: false,
          providerId: config.providerId,
          model,
          latencyMs,
          error: {
            code: 'PROVIDER_UNAVAILABLE',
            message: `Local endpoint responded with error: ${res.statusText}`,
          },
        };
      }

      const data = await res.json();
      const responseText = data.message?.content || '';

      let structuredData: any = undefined;
      try {
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          structuredData = JSON.parse(jsonMatch[1]);
        } else if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
          structuredData = JSON.parse(responseText.trim());
        }
      } catch {}

      return {
        success: true,
        text: responseText,
        structuredData,
        rawResponse: data,
        providerId: config.providerId,
        model,
        latencyMs,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
          estimatedCostUSD: 0.0, // 100% Free Local Execution
        },
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      if (err.name === 'AbortError') {
        return {
          success: false,
          providerId: config.providerId,
          model,
          latencyMs,
          error: { code: 'USER_CANCELLED', message: 'Request was cancelled by the user.' },
        };
      }
      return {
        success: false,
        providerId: config.providerId,
        model,
        latencyMs,
        error: {
          code: 'NETWORK_ERROR',
          message: aiSecurityGuard.sanitizeErrorMessage(err.message || 'Local AI connection failed', []),
        },
      };
    }
  }
}
