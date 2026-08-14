import { GoogleGenAI } from "@google/genai";

export async function handleGeminiApi(endpoint: string, body: any) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  if (endpoint === 'remove-object') {
    const { imageBase64, maskBase64, prompt } = body;
    if (!imageBase64) throw new Error("Image data is required");

    // We pass the original image and the mask with instructions to remove the marked object
    const promptText = prompt || 
      "You are an expert photographic retouching AI. The user has marked an unwanted object or region with a mask in this photo. " +
      "Seamlessly remove the marked object and fill in the missing background with natural texture, lighting, grain, shadows, and perspective consistent with the surrounding scene. " +
      "Return ONLY the cleanly inpainted, photorealistic edited image.";

    const contents: any[] = [];
    
    // Clean base64 strings if they contain data url headers
    const cleanImg = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    contents.push({
      inlineData: {
        mimeType: "image/png",
        data: cleanImg
      }
    });

    if (maskBase64) {
      const cleanMask = maskBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: "image/png",
          data: cleanMask
        }
      });
    }

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: { parts: contents },
    });

    let generatedImageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        generatedImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!generatedImageUrl) {
      // Check if text returned explains failure
      const text = response.text || "AI processing completed.";
      return { success: false, message: text };
    }

    return { success: true, imageUrl: generatedImageUrl };
  }

  if (endpoint === 'replace-background') {
    const { imageBase64, backgroundPrompt, style } = body;
    if (!imageBase64) throw new Error("Image data is required");

    const bgDescription = backgroundPrompt || "clean minimalist modern photography studio with soft diffused lighting";
    const promptText = `Expert studio photo background replacement. Isolate the main subject from the provided photo with sharp, natural edge preservation (hair, clothing contours, reflections). Place the subject seamlessly into this new environment: "${bgDescription}". Style: ${style || 'photorealistic, high-end professional commercial photography'}. Match the ambient lighting, color temperature, and contact shadows to blend the subject naturally. Return ONLY the final composited image.`;

    const cleanImg = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: cleanImg,
            },
          },
          { text: promptText },
        ],
      },
    });

    let generatedImageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        generatedImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!generatedImageUrl) {
      return { success: false, message: response.text || "Could not generate background replacement image." };
    }

    return { success: true, imageUrl: generatedImageUrl };
  }

  if (endpoint === 'auto-enhance') {
    const { imageBase64 } = body;
    if (!imageBase64) throw new Error("Image data is required");

    const cleanImg = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanImg,
            },
          },
          {
            text: `Analyze this photograph as a master colorist and digital photography director.
Evaluate its exposure balance, dynamic range, color temperature, tint, shadows, highlights, contrast, clarity, and saturation.
Provide calibrated slider adjustments (each integer between -100 and +100, where 0 is neutral) to achieve professional studio enhancement.

Return a JSON object in this exact schema:
{
  "exposure": number (-50 to 50),
  "brightness": number (-50 to 50),
  "contrast": number (-50 to 50),
  "highlights": number (-70 to 70),
  "shadows": number (-70 to 70),
  "whites": number (-50 to 50),
  "blacks": number (-50 to 50),
  "temperature": number (-50 to 50),
  "tint": number (-30 to 30),
  "saturation": number (-40 to 40),
  "vibrance": number (-40 to 50),
  "clarity": number (-30 to 40),
  "sharpness": number (0 to 60),
  "vignette": number (-30 to 30),
  "recommendedPreset": string,
  "analysis": string
}`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || '{}';
    try {
      const parsed = JSON.parse(text);
      return { success: true, data: parsed };
    } catch (e) {
      return { success: false, error: "Failed to parse AI enhancement metrics" };
    }
  }

  if (endpoint === 'style-transfer') {
    const { imageBase64, stylePrompt } = body;
    if (!imageBase64) throw new Error("Image data is required");

    const promptText = `Apply this artistic photo style while preserving the composition and core subjects: "${stylePrompt || 'Cinematic Kodak Portra 400 film look with rich warm tones, soft highlight roll-off, and subtle organic grain'}". High fidelity, professional photo finish.`;

    const cleanImg = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: cleanImg,
            },
          },
          { text: promptText },
        ],
      },
    });

    let generatedImageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        generatedImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!generatedImageUrl) {
      return { success: false, message: response.text || "Could not process style transformation." };
    }

    return { success: true, imageUrl: generatedImageUrl };
  }

  throw new Error(`Unknown endpoint: ${endpoint}`);
}
