/**
 * Lumina Studio Pro — Google Gemini Direct Universal Adapter
 * Supports Google Generative Language REST API with direct multimodal image payloads.
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

export class GeminiAdapter implements AIProviderAdapter {
  public providerId: string = 'gemini';

  public async validateCredentials(
    config: StoredProviderConfig,
    apiKey: string
  ): Promise<{ success: boolean; modelsFound?: number; error?: string; latencyMs: number }> {
    const start = performance.now();
    try {
      const endpoint = `${config.endpoint.replace(/\/$/, '')}/models?key=${apiKey.trim()}`;
      const res = await fetch(endpoint, { method: 'GET' });
      const latencyMs = Math.round(performance.now() - start);

      if (!res.ok) {
        let errText = '';
        try {
          const errData = await res.json();
          errText = errData.error?.message || res.statusText;
        } catch {
          errText = res.statusText;
        }
        return {
          success: false,
          error: aiSecurityGuard.sanitizeErrorMessage(`Gemini auth error (${res.status}): ${errText}`, [apiKey]),
          latencyMs,
        };
      }

      const data = await res.json();
      const count = Array.isArray(data.models) ? data.models.length : 1;
      return { success: true, modelsFound: count, latencyMs };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        success: false,
        error: aiSecurityGuard.sanitizeErrorMessage(err.message || 'Network / CORS error connecting to Gemini', [apiKey]),
        latencyMs,
      };
    }
  }

  public async listModels(config: StoredProviderConfig, apiKey: string): Promise<AIModelDefinition[]> {
    try {
      const endpoint = `${config.endpoint.replace(/\/$/, '')}/models?key=${apiKey.trim()}`;
      const res = await fetch(endpoint, { method: 'GET' });
      if (!res.ok) return config.customModels || [];
      const data = await res.json();
      if (Array.isArray(data.models)) {
        return data.models
          .filter((m: any) => m.name.includes('gemini'))
          .map((m: any) => {
            const cleanId = m.name.replace('models/', '');
            return {
              id: cleanId,
              name: m.displayName || cleanId,
              capabilities: {
                textInput: true,
                textOutput: true,
                imageInput: true,
                imageOutput: false,
                imageEditing: false,
                streamingSupport: true,
                embeddings: cleanId.includes('embed'),
                toolCalling: true,
              },
            };
          });
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
    const model = (req.modelOverride || config.selectedModel || 'gemini-1.5-flash').replace('models/', '');

    try {
      const endpoint = `${config.endpoint.replace(/\/$/, '')}/models/${model}:generateContent?key=${apiKey.trim()}`;

      const contents: any[] = [];
      const parts: any[] = [];

      // Add image part if supplied
      if (req.image && req.image.base64) {
        let cleanBase64 = req.image.base64;
        if (cleanBase64.includes(';base64,')) {
          cleanBase64 = cleanBase64.split(';base64,')[1];
        }
        parts.push({
          inlineData: {
            mimeType: req.image.mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }

      // Add text prompt
      parts.push({ text: req.prompt });

      contents.push({ role: 'user', parts });

      const requestBody: any = {
        contents,
        generationConfig: {
          temperature: req.temperature ?? 0.2,
          maxOutputTokens: req.maxTokens || 4096,
        },
      };

      if (req.systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: req.systemInstruction }],
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: req.signal,
      });

      const latencyMs = Math.round(performance.now() - start);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error?.message || res.statusText || 'Gemini Request Failed';
        let code: AIErrorCode = 'UNKNOWN_ERROR';
        if (res.status === 400 && errMsg.includes('API_KEY')) code = 'INVALID_API_KEY';
        else if (res.status === 429) code = 'RATE_LIMITED';
        else if (res.status === 404) code = 'MODEL_NOT_FOUND';

        return {
          success: false,
          providerId: 'gemini',
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
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const promptTokens = data.usageMetadata?.promptTokenCount || 0;
      const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = data.usageMetadata?.totalTokenCount || promptTokens + completionTokens;

      const estimatedCostUSD = (promptTokens * 0.00000035) + (completionTokens * 0.00000105);

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
        providerId: 'gemini',
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
          providerId: 'gemini',
          model,
          latencyMs,
          error: { code: 'USER_CANCELLED', message: 'Request was cancelled by the user.' },
        };
      }
      return {
        success: false,
        providerId: 'gemini',
        model,
        latencyMs,
        error: {
          code: 'NETWORK_ERROR',
          message: aiSecurityGuard.sanitizeErrorMessage(err.message || 'Gemini request error', [apiKey]),
        },
      };
    }
  }
}
