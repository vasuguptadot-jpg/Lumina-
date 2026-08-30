/**
 * Lumina Studio Pro — Anthropic Claude Adapter
 * Supports Claude Messages API with image content blocks.
 */

import { AIProviderAdapter } from './baseAdapter';
import {
  StoredProviderConfig,
  AIUniversalRequest,
  AIUniversalResponse,
  AIModelDefinition,
  AIErrorCode,
} from '../../../types/aiProviderGateway';
import { aiSecurityGuard } from '../aiSecurityGuard';

export class AnthropicAdapter implements AIProviderAdapter {
  public providerId: string = 'anthropic';

  public async validateCredentials(
    config: StoredProviderConfig,
    apiKey: string
  ): Promise<{ success: boolean; modelsFound?: number; error?: string; latencyMs: number }> {
    const start = performance.now();
    try {
      // Anthropic does not have a public GET /models endpoint with API keys, so test with a minimal 1-token message
      const endpoint = `${config.endpoint.replace(/\/$/, '')}/messages`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: config.selectedModel || 'claude-3-5-haiku-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });

      const latencyMs = Math.round(performance.now() - start);

      if (!res.ok) {
        let errText = '';
        try {
          const errData = await res.json();
          errText = errData.error?.message || res.statusText;
        } catch {
          errText = res.statusText;
        }

        if (res.status === 401) {
          return { success: false, error: 'Invalid Anthropic API Key (401)', latencyMs };
        }

        return {
          success: false,
          error: aiSecurityGuard.sanitizeErrorMessage(`Anthropic auth test (${res.status}): ${errText}`, [apiKey]),
          latencyMs,
        };
      }

      return { success: true, modelsFound: 2, latencyMs };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        success: false,
        error: aiSecurityGuard.sanitizeErrorMessage(
          'Browser-direct CORS blocked by Anthropic. Consider connecting via OpenRouter preset or enabling direct browser access.',
          [apiKey]
        ),
        latencyMs,
      };
    }
  }

  public async listModels(config: StoredProviderConfig, apiKey: string): Promise<AIModelDefinition[]> {
    return config.customModels || [];
  }

  public async executeRequest(
    config: StoredProviderConfig,
    apiKey: string,
    req: AIUniversalRequest
  ): Promise<AIUniversalResponse> {
    const start = performance.now();
    const model = req.modelOverride || config.selectedModel || 'claude-3-5-sonnet-20241022';

    try {
      const endpoint = `${config.endpoint.replace(/\/$/, '')}/messages`;

      const content: any[] = [];
      if (req.image && req.image.base64) {
        let cleanBase64 = req.image.base64;
        if (cleanBase64.includes(';base64,')) {
          cleanBase64 = cleanBase64.split(';base64,')[1];
        }
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: req.image.mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }
      content.push({ type: 'text', text: req.prompt });

      const body: any = {
        model,
        max_tokens: req.maxTokens || 4096,
        messages: [{ role: 'user', content }],
      };

      if (req.systemInstruction) {
        body.system = req.systemInstruction;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
        signal: req.signal,
      });

      const latencyMs = Math.round(performance.now() - start);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error?.message || res.statusText || 'Anthropic API Error';
        let code: AIErrorCode = 'UNKNOWN_ERROR';
        if (res.status === 401) code = 'INVALID_API_KEY';
        else if (res.status === 429) code = 'RATE_LIMITED';

        return {
          success: false,
          providerId: 'anthropic',
          model,
          latencyMs,
          error: {
            code,
            message: aiSecurityGuard.sanitizeErrorMessage(errMsg, [apiKey]),
            rawError: errData,
          },
        };
      }

      const data = await res.json();
      const responseText = data.content?.[0]?.text || '';
      const promptTokens = data.usage?.input_tokens || 0;
      const completionTokens = data.usage?.output_tokens || 0;
      const totalTokens = promptTokens + completionTokens;

      const estimatedCostUSD = (promptTokens * 0.000003) + (completionTokens * 0.000015);

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
        providerId: 'anthropic',
        model,
        latencyMs,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
          estimatedCostUSD,
        },
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      if (err.name === 'AbortError') {
        return {
          success: false,
          providerId: 'anthropic',
          model,
          latencyMs,
          error: { code: 'USER_CANCELLED', message: 'Request was cancelled by the user.' },
        };
      }
      return {
        success: false,
        providerId: 'anthropic',
        model,
        latencyMs,
        error: {
          code: 'NETWORK_ERROR',
          message: aiSecurityGuard.sanitizeErrorMessage(err.message || 'Anthropic connection failed', [apiKey]),
        },
      };
    }
  }
}
