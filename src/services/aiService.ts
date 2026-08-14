export interface AiEnhanceResponse {
  success: boolean;
  data?: {
    exposure: number;
    brightness: number;
    contrast: number;
    highlights: number;
    shadows: number;
    whites: number;
    blacks: number;
    temperature: number;
    tint: number;
    saturation: number;
    vibrance: number;
    clarity: number;
    sharpness: number;
    vignette?: number;
    recommendedPreset?: string;
    analysis?: string;
  };
  error?: string;
}

export async function requestAiAutoEnhance(imageBase64: string): Promise<AiEnhanceResponse> {
  try {
    const response = await fetch('/api/ai/auto-enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network or server error during AI enhancement.',
    };
  }
}

export async function requestAiObjectRemoval(
  imageBase64: string,
  maskBase64: string,
  prompt?: string
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/remove-object', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, maskBase64, prompt }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to connect to AI object removal service.',
    };
  }
}

export async function requestAiBackgroundReplacement(
  imageBase64: string,
  backgroundPrompt: string,
  style?: string
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/replace-background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, backgroundPrompt, style }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to connect to AI background replacement service.',
    };
  }
}

export async function requestAiStyleTransfer(
  imageBase64: string,
  stylePrompt: string
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/style-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, stylePrompt }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to connect to AI style transfer service.',
    };
  }
}
