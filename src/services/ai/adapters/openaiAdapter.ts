/**
 * Lumina Studio Pro — OpenAI & OpenAI-Compatible Standard Adapter
 * Supports OpenAI, OpenRouter, Groq, Mistral, Together AI, DeepSeek, and custom OpenAI-compatible proxies.
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

export class OpenAICompatibleAdapter implements AIProviderAdapter {
  public providerId: string;

  constructor(providerId: string = 'openai') {
    this.providerId = providerId;
  }

  private getAuthHeaders(config: StoredProviderConfig, apiKey: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.authType === 'bearer' || !config.authType) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    } else if (config.authType === 'x_api_key') {
      headers['x-api-key'] = apiKey.trim();
    } else if (config.authType === 'custom_header' && config.customHeaderName) {
      headers[config.customHeaderName] = apiKey.trim();
    } else if (config.authType === 'api_key_header') {
      headers['api-key'] = apiKey.trim();
    }

    if (config.providerId === 'openrouter') {
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'Lumina Studio Pro';
    }

    return headers;
  }

  public async validateCredentials(
    config: StoredProviderConfig,
    apiKey: string
  ): Promise<{ success: boolean; modelsFound?: number; error?: string; latencyMs: number }> {
    const start = performance.now();
    try {
      const endpoint = `${config.endpoint.replace(/\/$/, '')}/models`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: this.getAuthHeaders(config, apiKey),
      });

      const latencyMs = Math.round(performance.now() - start);

      if (!res.ok) {
        let errText = '';
        try {
          const errData = await res.json();
          errText = errData.error?.message || errData.message || res.statusText;
        } catch {
          errText = res.statusText;
        }
        return {
          success: false,
          error: aiSecurityGuard.sanitizeErrorMessage(`Authentication failed (${res.status}): ${errText}`, [apiKey]),
          latencyMs,
        };
      }

      const data = await res.json();
      const count = Array.isArray(data.data) ? data.data.length : 1;
      return { success: true, modelsFound: count, latencyMs };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        success: false,
        error: aiSecurityGuard.sanitizeErrorMessage(err.message || 'Network / CORS connection error', [apiKey]),
        latencyMs,
      };
    }
  }

  public async listModels(config: StoredProviderConfig, apiKey: string): Promise<AIModelDefinition[]> {
    try {
      const endpoint = `${config.endpoint.replace(/\/$/, '')}/models`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: this.getAuthHeaders(config, apiKey),
      });

      if (!res.ok) return config.customModels || [];
      const data = await res.json();
      if (Array.isArray(data.data)) {
        return data.data.map((m: any) => ({
          id: m.id,
          name: m.id,
          capabilities: {
            textInput: true,
            textOutput: true,
            imageInput: m.id.includes('vision') || m.id.includes('4o') || m.id.includes('pixtral') || m.id.includes('llava'),
            imageOutput: m.id.includes('dall-e') || m.id.includes('flux'),
            imageEditing: m.id.includes('dall-e-2'),
            streamingSupport: true,
            embeddings: m.id.includes('embed'),
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
    apiKey: string,
    req: AIUniversalRequest
  ): Promise<AIUniversalResponse> {
    const start = performance.now();
    const model = req.modelOverride || config.selectedModel || 'gpt-4o';

    try {
      // 1. DALL-E Image Generation Route
      if (req.task === 'image_generation' && (model.includes('dall-e') || config.providerId === 'openai')) {
        return await this.executeImageGeneration(config, apiKey, req, model, start);
      }

      // 2. Chat Completions & Vision Route
      const endpoint = `${config.endpoint.replace(/\/$/, '')}/chat/completions`;

      const messages: any[] = [];
      if (req.systemInstruction) {
        messages.push({ role: 'system', content: req.systemInstruction });
      }

      if (req.image && req.image.base64) {
        const imageUri = req.image.base64.startsWith('data:')
          ? req.image.base64
          : `data:${req.image.mimeType || 'image/jpeg'};base64,${req.image.base64}`;

        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: req.prompt },
            {
              type: 'image_url',
              image_url: {
                url: imageUri,
                detail: 'high',
              },
            },
          ],
        });
      } else {
        messages.push({ role: 'user', content: req.prompt });
      }

      const body: any = {
        model,
        messages,
        temperature: req.temperature ?? 0.3,
      };

      if (req.maxTokens) body.max_tokens = req.maxTokens;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: this.getAuthHeaders(config, apiKey),
        body: JSON.stringify(body),
        signal: req.signal,
      });

      const latencyMs = Math.round(performance.now() - start);

      if (!res.ok) {
        let errBody: any = {};
        try {
          errBody = await res.json();
        } catch {}
        const errorMsg = errBody.error?.message || res.statusText || 'AI Provider Error';
        let code: AIErrorCode = 'UNKNOWN_ERROR';
        if (res.status === 401) code = 'INVALID_API_KEY';
        else if (res.status === 429) code = 'RATE_LIMITED';
        else if (res.status === 404) code = 'MODEL_NOT_FOUND';
        else if (res.status >= 500) code = 'PROVIDER_UNAVAILABLE';

        return {
          success: false,
          providerId: config.providerId,
          model,
          latencyMs,
          error: {
            code,
            message: aiSecurityGuard.sanitizeErrorMessage(errorMsg, [apiKey]),
            rawError: errBody,
          },
        };
      }

      const data = await res.json();
      const responseText = data.choices?.[0]?.message?.content || '';
      const promptTokens = data.usage?.prompt_tokens || 0;
      const completionTokens = data.usage?.completion_tokens || 0;
      const totalTokens = data.usage?.total_tokens || promptTokens + completionTokens;

      // Calculate approximate cost
      const estimatedCostUSD = (promptTokens * 0.000005) + (completionTokens * 0.000015);

      // Attempt to parse JSON if requested
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
          message: aiSecurityGuard.sanitizeErrorMessage(err.message || 'Request failed', [apiKey]),
        },
      };
    }
  }

  private async executeImageGeneration(
    config: StoredProviderConfig,
    apiKey: string,
    req: AIUniversalRequest,
    model: string,
    startTime: number
  ): Promise<AIUniversalResponse> {
    const endpoint = `${config.endpoint.replace(/\/$/, '')}/images/generations`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: this.getAuthHeaders(config, apiKey),
      body: JSON.stringify({
        model: model.includes('dall-e') ? model : 'dall-e-3',
        prompt: req.prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json',
      }),
      signal: req.signal,
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        providerId: config.providerId,
        model,
        latencyMs,
        error: {
          code: 'CONTENT_REJECTED',
          message: aiSecurityGuard.sanitizeErrorMessage(errData.error?.message || 'Image generation failed', [apiKey]),
        },
      };
    }

    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    const url = data.data?.[0]?.url;

    return {
      success: true,
      generatedImageDataUri: b64 ? `data:image/png;base64,${b64}` : undefined,
      generatedImageUrl: url,
      providerId: config.providerId,
      model,
      latencyMs,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCostUSD: model.includes('dall-e-3') ? 0.04 : 0.02,
      },
    };
  }
}
