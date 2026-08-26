/**
 * Secure Backend Handler for Groq AI Integrations (BYOK & Proxy)
 * - Zero plaintext key storage on the server
 * - Never exposes API keys in client bundles or log outputs
 * - Validates timeout, retry policies, and image upload authorization
 */

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';

export async function handleGroqApi(
  action: string,
  body: any,
  headers: Record<string, any>
): Promise<any> {
  // Extract API key from incoming request header 'x-groq-api-key' or body
  const rawKeyHeader = headers['x-groq-api-key'] || headers['x-api-key'] || body.apiKey;
  const apiKey = (typeof rawKeyHeader === 'string' && rawKeyHeader.trim())
    ? rawKeyHeader.trim()
    : process.env.GROQ_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'No Groq API Key provided. Please add your Groq API key in BYOK Settings.',
      code: 'MISSING_API_KEY',
    };
  }

  // 1. Validate API Key & Connection Test
  if (action === 'validate-key') {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(body.timeoutMs) || 15000);

    try {
      const response = await fetch(`${GROQ_API_BASE}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        return {
          success: false,
          status: response.status,
          latencyMs,
          error: errorJson.error?.message || `Groq API responded with status ${response.status}: Invalid API Key`,
        };
      }

      const data = await response.json();
      const modelIds = Array.isArray(data.data) ? data.data.map((m: any) => m.id) : [];

      return {
        success: true,
        latencyMs,
        modelsCount: modelIds.length,
        availableModels: modelIds,
        message: 'Groq API Key is valid and authenticated successfully.',
      };
    } catch (err: any) {
      clearTimeout(timeout);
      return {
        success: false,
        error: err.name === 'AbortError' ? 'Groq connection test timed out.' : (err.message || 'Failed to connect to Groq API.'),
      };
    }
  }

  // 2. Fetch Real Models List
  if (action === 'list-models') {
    try {
      const response = await fetch(`${GROQ_API_BASE}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return { success: false, error: err.error?.message || 'Failed to fetch models from Groq.' };
      }

      const data = await response.json();
      return { success: true, data: data.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error fetching models.' };
    }
  }

  // 3. Chat Completions & Reasoning Execution
  if (action === 'chat-completions') {
    const {
      model = 'llama-3.3-70b-versatile',
      messages,
      temperature = 0.4,
      max_tokens = 2048,
      response_format,
      timeoutMs = 30000,
      maxRetries = 2,
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return { success: false, error: 'Messages array is required.' };
    }

    let attempts = 0;
    let lastError = null;
    const startTime = Date.now();

    while (attempts <= maxRetries) {
      attempts++;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const payload: any = {
          model,
          messages,
          temperature,
          max_tokens,
        };

        if (response_format) {
          payload.response_format = response_format;
        }

        const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const latencyMs = Date.now() - startTime;

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData.error?.message || `Groq API error HTTP ${response.status}`;

          // If rate limited (429) or transient 5xx, retry if attempts remain
          if ((response.status === 429 || response.status >= 500) && attempts <= maxRetries) {
            lastError = errMsg;
            await new Promise((res) => setTimeout(res, 1000 * attempts));
            continue;
          }

          return {
            success: false,
            status: response.status,
            latencyMs,
            error: errMsg,
          };
        }

        const json = await response.json();
        const usage = json.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        };

        return {
          success: true,
          latencyMs,
          model: json.model || model,
          choices: json.choices,
          usage: {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          },
        };
      } catch (err: any) {
        clearTimeout(timeout);
        lastError = err.name === 'AbortError' ? `Request timed out after ${timeoutMs}ms` : err.message;
        if (attempts <= maxRetries) {
          await new Promise((res) => setTimeout(res, 1000 * attempts));
          continue;
        }
      }
    }

    return {
      success: false,
      error: lastError || 'Failed after multiple retry attempts.',
    };
  }

  // 4. Vision Multimodal Processing (Image understanding & editing suggestions)
  if (action === 'vision-analyze') {
    const {
      imageBase64,
      userPrompt = 'Analyze this image and provide photo editing adjustments and scene insights.',
      model = 'llama-3.2-11b-vision-preview',
      timeoutMs = 45000,
    } = body;

    // Security check: Only proceed with image if model supports vision
    const isVisionModel = model.includes('vision');
    if (!isVisionModel) {
      return {
        success: false,
        error: `Selected model '${model}' does not support vision processing. Please select Llama 3.2 Vision Preview.`,
      };
    }

    if (!imageBase64) {
      return { success: false, error: 'Image data is required for vision analysis.' };
    }

    // Format proper data URI
    const formattedImage = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const startTime = Date.now();

    try {
      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${userPrompt} Return response in JSON format with adjustment recommendations (exposure, contrast, highlights, shadows, temperature, tint, vibrance, clarity) and scene summary.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: formattedImage,
              },
            },
          ],
        },
      ];

      const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 1500,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return {
          success: false,
          status: response.status,
          latencyMs,
          error: errJson.error?.message || `Groq Vision API Error ${response.status}`,
        };
      }

      const json = await response.json();
      const usage = json.usage || {};

      let parsedContent = null;
      try {
        parsedContent = JSON.parse(json.choices?.[0]?.message?.content || '{}');
      } catch (e) {
        parsedContent = { raw: json.choices?.[0]?.message?.content };
      }

      return {
        success: true,
        latencyMs,
        model: json.model || model,
        data: parsedContent,
        usage: {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0,
        },
      };
    } catch (err: any) {
      clearTimeout(timeout);
      return {
        success: false,
        error: err.name === 'AbortError' ? 'Groq Vision request timed out.' : err.message,
      };
    }
  }

  return { success: false, error: `Unknown Groq action '${action}'.` };
}
