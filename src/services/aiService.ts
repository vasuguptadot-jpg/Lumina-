import { calculateAutoTone } from '../engine/autoToneEngine';
import { inpaintImageLocally } from '../engine/inpainting';
import { isStrictlyLocal } from './aiProviderEngine';

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
  isLocalFallback?: boolean;
}

export async function requestAiAutoEnhance(imageBase64: string): Promise<AiEnhanceResponse> {
  // If local mode is active, directly compute deterministic histogram tone adjustments
  if (isStrictlyLocal()) {
    try {
      const img = new Image();
      img.src = imageBase64;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 600;
      canvas.height = img.naturalHeight || 400;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const localAdjustments = calculateAutoTone(canvas);

      return {
        success: true,
        data: {
          brightness: 0,
          temperature: 0,
          tint: 0,
          saturation: 0,
          sharpness: 0,
          ...localAdjustments,
          vignette: 0,
          analysis: 'Computed instantly via Local Deterministic Histogram Engine (0ms Cloud Latency)',
        } as any,
        isLocalFallback: true,
      };
    } catch (err: any) {
      console.warn('Local tone calculation error:', err);
    }
  }

  try {
    const response = await fetch('/api/ai/auto-enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });

    const json = await response.json();
    if (json && json.success) {
      return json;
    }
    throw new Error(json?.error || 'AI server failed');
  } catch (err: any) {
    console.warn('[AI Service] Cloud auto-enhance unavailable. Executing Local Deterministic Auto-Tone.', err);
    try {
      const img = new Image();
      img.src = imageBase64;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 600;
      canvas.height = img.naturalHeight || 400;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const localAdjustments = calculateAutoTone(canvas);

      return {
        success: true,
        data: {
          brightness: 0,
          temperature: 0,
          tint: 0,
          saturation: 0,
          sharpness: 0,
          ...localAdjustments,
          vignette: 0,
          analysis: 'Cloud AI was unavailable. Applied Local Deterministic Histogram Auto-Tone.',
        } as any,
        isLocalFallback: true,
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        error: fallbackErr.message || 'Auto-enhance failed.',
      };
    }
  }
}

export interface ObjectRemovalOptions {
  prompt?: string;
  removeShadows?: boolean;
  targetType?: string;
}

export async function requestAiObjectRemoval(
  imageBase64: string,
  maskBase64: string,
  optionsOrPrompt?: string | ObjectRemovalOptions
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string; isLocalFallback?: boolean }> {
  // If local offline mode, run local Telea/Navier-Stokes inpainting
  if (isStrictlyLocal()) {
    try {
      const resultDataUrl = await inpaintImageLocally(imageBase64, maskBase64, 6);
      return {
        success: true,
        imageUrl: resultDataUrl,
        message: 'Reconstructed seamlessly via Local Deterministic Telea Inpainting (0 Cloud Uploads)',
        isLocalFallback: true,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Local inpainting failed',
      };
    }
  }

  try {
    let payload: any = { imageBase64, maskBase64 };
    if (typeof optionsOrPrompt === 'string') {
      payload.prompt = optionsOrPrompt;
    } else if (optionsOrPrompt) {
      payload = { ...payload, ...optionsOrPrompt };
    }

    const response = await fetch('/api/ai/remove-object', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    if (json && json.success) {
      return json;
    }
    throw new Error(json?.error || 'AI server failed');
  } catch (err: any) {
    console.warn('[AI Service] Cloud removal unavailable. Executing Local Fast Telea Inpainting.', err);
    try {
      const resultDataUrl = await inpaintImageLocally(imageBase64, maskBase64, 6);
      return {
        success: true,
        imageUrl: resultDataUrl,
        message: 'Cloud AI unavailable. Reconstructed using Local Deterministic Telea Inpainting.',
        isLocalFallback: true,
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        error: fallbackErr.message || 'Failed to remove object.',
      };
    }
  }
}

export async function requestAiSmartRemoval(
  imageBase64: string,
  targetType: 'people' | 'wires' | 'text' | 'vehicles' | 'reflections' | 'clutter' | 'custom',
  customPrompt?: string,
  removeShadows: boolean = true
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const descriptions: Record<string, string> = {
      people: 'Detect and remove all bystander people, photobombers, tourists, and passersby. Reconstruct the background architecture, landscape, or scenery seamlessly, and remove their ground contact shadows.',
      wires: 'Detect and remove all overhead electrical wires, telephone cables, power lines, utility poles, and antenna cords across the sky and background facades. Reconstruct clean sky and uninterrupted architecture.',
      text: 'Detect and remove all text, watermarks, timestamps, logos, copyright markings, and subtitles. Inpaint natural underlying textures.',
      vehicles: 'Detect and remove parked or moving cars, trucks, motorcycles, bicycles, and traffic cones. Seamlessly inpaint road asphalt, lane markings, curbs, and sidewalk textures.',
      reflections: 'Detect and remove unwanted glass reflections, window glare, lens flare artifacts, and harsh specular spots while preserving the background transparency and clarity.',
      clutter: 'Detect and clean up background clutter, trash cans, street signs, debris, stray objects, and visual distractions to create a clean, minimalist studio composition.',
      custom: customPrompt || 'Detect and cleanly remove unwanted objects from the scene.',
    };

    const prompt = descriptions[targetType] || customPrompt;

    const response = await fetch('/api/ai/remove-object', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        prompt,
        targetType,
        removeShadows,
      }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to connect to AI smart removal service.',
    };
  }
}

export interface GenerativeFillOptions {
  prompt: string;
  maskBase64?: string;
  blendLighting?: boolean;
  castShadows?: boolean;
}

export async function requestAiGenerativeFill(
  imageBase64: string,
  promptOrOptions: string | GenerativeFillOptions,
  maskBase64?: string
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    let payload: any = { imageBase64 };
    if (typeof promptOrOptions === 'string') {
      payload.prompt = promptOrOptions;
      if (maskBase64) payload.maskBase64 = maskBase64;
    } else {
      payload = { ...payload, ...promptOrOptions };
    }

    const response = await fetch('/api/ai/generative-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to execute Generative Fill.',
    };
  }
}

export interface GenerativeReplaceOptions {
  replacementPrompt: string;
  originalObject?: string;
  maskBase64?: string;
  preserveFit?: boolean;
}

export async function requestAiGenerativeReplace(
  imageBase64: string,
  replacementPrompt: string,
  maskBase64?: string,
  originalObject?: string
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/generative-replace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        maskBase64,
        originalObject,
        replacementPrompt,
      }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to execute Generative Replace.',
    };
  }
}

export interface GenerativeAddOptions {
  category: 'Objects' | 'People' | 'Animals' | 'Buildings' | 'Vehicles' | 'Accessories' | 'Lighting' | string;
  prompt: string;
  maskBase64?: string;
  blendLighting?: boolean;
  castShadows?: boolean;
}

export async function requestAiGenerativeAdd(
  imageBase64: string,
  options: GenerativeAddOptions
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/generative-add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        ...options,
      }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to execute Generative Add.',
    };
  }
}

export async function requestAiGenerativeExpandDirection(
  imageBase64: string,
  direction: 'left' | 'right' | 'top' | 'bottom' | 'all',
  amount: string = '50%',
  prompt?: string
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/generative-expand-direction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        direction,
        amount,
        prompt,
      }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to execute directional Generative Expand.',
    };
  }
}

export interface ReplaceBackgroundOptions {
  backgroundPrompt: string;
  style?: string;
  harmonizeLighting?: boolean;
  castShadows?: boolean;
}

export async function requestAiBackgroundReplacement(
  imageBase64: string,
  promptOrOptions: string | ReplaceBackgroundOptions,
  style?: string
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    let payload: any = { imageBase64 };
    if (typeof promptOrOptions === 'string') {
      payload.backgroundPrompt = promptOrOptions;
      payload.style = style;
    } else {
      payload = { ...payload, ...promptOrOptions };
    }

    const response = await fetch('/api/ai/replace-background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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

export async function requestAiBackgroundRemoval(
  imageBase64: string,
  mode: 'transparent' | 'solid' = 'transparent',
  color?: string
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/remove-background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mode, color }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to remove background.',
    };
  }
}

export async function requestAiBackgroundExpansion(
  imageBase64: string,
  expandRatio: string = 'widescreen 16:9',
  prompt?: string
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/expand-background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, expandRatio, prompt }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to expand background.',
    };
  }
}

export async function requestAiBackgroundRelighting(
  imageBase64: string,
  lightingStyle: string,
  lightColor?: string,
  lightDirection?: string
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/relight-background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, lightingStyle, lightColor, lightDirection }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to relight background.',
    };
  }
}

export async function requestAiBackgroundBlur(
  imageBase64: string,
  blurIntensity: 'subtle' | 'medium' | 'strong' | 'dreamy' = 'medium',
  bokehShape: 'circular' | 'anamorphic' | 'creamy' = 'circular'
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/blur-background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, blurIntensity, bokehShape }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to blur background.',
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

export interface EnhanceImageOptions {
  type:
    | 'super-resolution'
    | 'face-restoration'
    | 'detail-reconstruction'
    | 'sharpening'
    | 'deblurring'
    | 'motion-deblur'
    | 'low-light'
    | 'jpeg-artifact-removal'
    | 'old-photo-restoration'
    | 'scratch-restoration'
    | 'colorization'
    | 'denoising';
  scale?: '2x' | '4x' | '8x';
  faceRestoration?: boolean;
  detailReconstruction?: boolean;
  removeScratches?: boolean;
  colorize?: boolean;
  denoiseStrength?: 'light' | 'medium' | 'strong' | 'ultra';
  deblurType?: 'optical' | 'motion';
  customNotes?: string;
}

export async function requestAiEnhanceImage(
  imageBase64: string,
  options: EnhanceImageOptions
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/enhance-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        ...options,
      }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to execute AI Image Enhancement.',
    };
  }
}

export interface DetectedFaceLandmarks {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  nose: { x: number; y: number };
  mouth: { x: number; y: number };
  chin: { x: number; y: number };
  leftCheek: { x: number; y: number };
  rightCheek: { x: number; y: number };
  forehead: { x: number; y: number };
}

export interface DetectedFace {
  id: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  landmarks: DetectedFaceLandmarks;
  estimatedAttributes?: {
    skinTone?: string;
    hairColor?: string;
    eyeColor?: string;
    expression?: string;
    lightingQuality?: string;
  };
}

export interface FaceDetectionData {
  faceCount: number;
  confidence: number;
  faces: DetectedFace[];
}

export async function requestAiDetectFaces(
  imageBase64: string
): Promise<{ success: boolean; data?: FaceDetectionData; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/detect-faces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to perform automatic face detection.',
    };
  }
}

export interface FaceReshapeSettings {
  jaw: number;          // -50 to +50
  chin: number;         // -50 to +50
  nose: number;         // -50 to +50
  eyeSize: number;      // -50 to +50
  eyeTilt: number;      // -50 to +50
  eyeDistance: number;  // -50 to +50
  lipFullness: number;  // -50 to +50
  smile: number;        // -50 to +50
  lipWidth: number;     // -50 to +50
  forehead: number;     // -50 to +50
  cheekbones: number;   // -50 to +50
  faceWidth: number;    // -50 to +50
  faceHeight: number;   // -50 to +50
}

export interface SkinRetouchSettings {
  smoothing: number;            // 0 to 100
  texturePreservation: number;  // 0 to 100
  acneRemoval: boolean;
  blemishRemoval: boolean;
  darkCircles: number;          // 0 to 100
  skinTone: string;             // 'original' | 'warm-golden' | 'porcelain-fair' | 'rich-bronze' | 'rosy-radiant' | 'olive-harmonized'
  rednessReduction: number;     // 0 to 100
  brightness: number;           // -50 to +50
}

export interface EyeRetouchSettings {
  brightness: number;     // 0 to 100
  color: string;          // 'original' | 'hazel' | 'sapphire-blue' | 'emerald-green' | 'amber-honey' | 'deep-brown' | 'violet-amethyst'
  sharpening: number;     // 0 to 100
  redEyeRemoval: boolean;
  enhancement: boolean;   // catchlight booster & iris limbal ring
}

export interface HairRetouchSettings {
  color: string;            // 'original' | 'jet-black' | 'honey-blonde' | 'auburn-copper' | 'chocolate-brown' | 'platinum-silver' | 'rose-gold' | 'espresso'
  enhancement: boolean;     // lustrous gloss sheen & specular light
  flyawaysRemoval: boolean; // clean stray hairs on hairline/silhouette
  sharpening: number;       // 0 to 100
  volume: number;           // -50 to +50
}

export interface PortraitRetouchOptions {
  faceReshape: Partial<FaceReshapeSettings>;
  skin: Partial<SkinRetouchSettings>;
  eyes: Partial<EyeRetouchSettings>;
  hair: Partial<HairRetouchSettings>;
  isSubtleMode?: boolean;
  customNotes?: string;
}

export async function requestAiPortraitRetouch(
  imageBase64: string,
  options: PortraitRetouchOptions
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/portrait-retouch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        ...options,
      }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to execute portrait retouch.',
    };
  }
}

export interface ClothingAdjustmentSettings {
  wrinkleSmoothing: boolean;
  tailoredFit: boolean;
  drapeRefinement: boolean;
  colorAdjustment?: string; // 'original' | 'navy-blue' | 'charcoal-black' | 'ivory-white' | 'emerald' | 'burgundy' | 'camel-tan'
}

export interface BodyRetouchOptions {
  height?: number;        // -50 to +50
  proportions?: number;   // -50 to +50
  waist?: number;         // -50 to +50
  shoulders?: number;     // -50 to +50
  arms?: number;          // -50 to +50
  legs?: number;          // -50 to +50
  posture?: number;       // 0 to 100
  clothing?: Partial<ClothingAdjustmentSettings>;
  backgroundProtection?: boolean;
  isSubtleMode?: boolean;
  customNotes?: string;
}

export async function requestAiBodyRetouch(
  imageBase64: string,
  options: BodyRetouchOptions
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/body-retouch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        ...options,
      }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to execute body editing & shaping.',
    };
  }
}

export interface SkyDetectionData {
  hasSky: boolean;
  skyCoverage: number;
  horizonPosition: 'high' | 'middle' | 'low' | 'slanted' | 'obscured';
  currentSkyType: string;
  lightingDirection: string;
  hasWaterOrReflections: boolean;
  ambientColorTemp: string;
  recommendedSkies: string[];
  analysis: string;
}

export async function requestAiDetectSky(
  imageBase64: string
): Promise<{ success: boolean; data?: SkyDetectionData; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/detect-sky', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to detect sky.',
    };
  }
}

export interface SkyReplacementOptions {
  skyPreset: string;
  customSkyPrompt?: string;
  skyExposure?: number;       // -100 to +100
  skyTemperature?: number;    // -100 to +100
  skySaturation?: number;     // -100 to +100
  skyClarity?: number;        // 0 to 100
  horizonFeather?: number;    // 0 to 100
  harmonizeSubjectLighting?: boolean;
  harmonizeReflections?: boolean;
  ambientColorBleed?: number; // 0 to 100
  cloudDensity?: number;      // 0 to 100
  sunPosition?: 'auto' | 'top-center' | 'top-left' | 'top-right' | 'horizon-center' | 'hidden';
}

export async function requestAiSkyReplacement(
  imageBase64: string,
  options: SkyReplacementOptions
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/sky-replacement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        ...options,
      }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to replace sky.',
    };
  }
}

export interface RelightingOptions {
  lightDirection?: string;      // 'top-left' | 'top-right' | 'left-side' | 'right-side' | 'front-direct' | 'overhead' | 'backlight-rim' | 'bottom-up'
  lightAngle?: number;          // 0 to 360 degrees
  lightIntensity?: number;      // 0 to 100
  lightSoftness?: number;       // 0 to 100 (0 = hard spotlight, 100 = soft diffused box)
  lightColorTemp?: number;      // -100 to +100
  lightColorName?: string;      // e.g. 'Natural Daylight', 'Golden Hour Sunset', 'Cyan Cyberpunk', 'Candlelight'
  shadowStrength?: number;      // 0 to 100
  ambientFill?: number;         // 0 to 100
  faceLighting?: number;        // 0 to 100
  studioSetup?: 'none' | 'rembrandt' | 'butterfly-beauty' | 'split-dramatic' | '3-point-studio';
  rimLighting?: {
    enabled: boolean;
    intensity: number;
    color: string;
  };
  preset?: 'none' | 'golden-hour' | 'night-ambient' | 'rembrandt-portrait' | 'cyber-neon' | 'dramatic-rim' | 'film-noir';
  customNotes?: string;
}

export async function requestAiRelight(
  imageBase64: string,
  options: RelightingOptions
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/computational-relight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        ...options,
      }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to execute computational relighting.',
    };
  }
}

export interface GeometryOptions {
  operation:
    | 'auto-upright'
    | 'vertical-keystone'
    | 'horizontal-perspective'
    | 'fisheye-defish'
    | 'wide-angle-correction'
    | 'optical-lens-correction'
    | 'mesh-warp'
    | 'liquify'
    | 'puppet-warp'
    | 'skew-transform'
    | 'custom-warp';
  verticalCorrection?: number;    // -100 to +100
  horizontalCorrection?: number;  // -100 to +100
  skewX?: number;                 // -100 to +100
  skewY?: number;                 // -100 to +100
  rotateAngle?: number;           // -180 to +180
  scaleX?: number;                // 50 to 150
  scaleY?: number;                // 50 to 150
  barrelDistortion?: number;      // -100 to +100
  fisheyeStrength?: number;       // 0 to 100
  wideAngleStrechCorrection?: number; // 0 to 100
  liquifyMode?: 'forward-warp' | 'bloat' | 'pucker' | 'twirl-cw' | 'twirl-ccw' | 'reconstruct';
  liquifyTargetArea?: string;
  liquifyIntensity?: number;      // 0 to 100
  puppetPins?: Array<{ id: string; x: number; y: number; targetX?: number; targetY?: number; pinned?: boolean }>;
  meshWarpNotes?: string;
  autoFillEdges?: boolean;
  customPrompt?: string;
}

export async function requestAiGeometryCorrection(
  imageBase64: string,
  options: GeometryOptions
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/perspective-geometry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        ...options,
      }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to execute geometry & perspective correction.',
    };
  }
}

export interface EffectStudioOptions {
  category: 'film-vintage' | 'cinematic-cyber' | 'analog-digital' | 'art-media' | 'optical-light' | 'retro-textures';
  effectId: string;
  intensity?: number;
  secondaryIntensity?: number;
  blendMode?: string;
  tintColor?: string;
  customDirectives?: string;
}

export async function requestAiEffectsStudio(
  imageBase64: string,
  options: EffectStudioOptions
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/effects-studio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        ...options,
      }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to execute effect application.',
    };
  }
}

export interface FilmSimulationOptions {
  filmStock:
    | 'kodak-portra-400'
    | 'kodak-gold-200'
    | 'kodak-tri-x-400'
    | 'kodak-ektar-100'
    | 'fuji-velvia-50'
    | 'fuji-superia-400'
    | 'fuji-classic-chrome'
    | 'cinestill-800t'
    | 'disposable-camera-35mm'
    | 'polaroid-600'
    | 'polaroid-sx70'
    | 'instax-mini'
    | 'ilford-hp5';
  grainAmount?: number;         // 0 to 100
  grainSize?: 'fine' | 'medium' | 'coarse';
  halationAmount?: number;      // 0 to 100 (red-orange glow around speculars)
  bloomAmount?: number;         // 0 to 100 (optical highlight diffusion)
  filmCurve?: 'classic-s-curve' | 'matte-lifted-blacks' | 'punchy-contrast' | 'soft-faded-highlights' | 'linear-flat';
  colorScience?: {
    warmShift?: number;         // -50 (cool) to +50 (warm)
    greenMagentaShift?: number; // -50 (green) to +50 (magenta)
    highlightRollOff?: number;  // 0 to 100
  };
  instantBorder?: 'none' | 'polaroid-classic-white' | 'polaroid-vintage-aged' | 'instax-mini-white' | 'film-sprocket-35mm' | 'contact-sheet-black';
  dateStamp?: {
    enabled: boolean;
    text: string;
  };
  dustScratches?: number;       // 0 to 100
  lightLeak?: {
    enabled: boolean;
    warmth?: number;
  };
  customNotes?: string;
}

export async function requestAiFilmSimulation(
  imageBase64: string,
  options: FilmSimulationOptions
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/film-simulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        ...options,
      }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to execute film simulation.',
    };
  }
}

export async function requestAiCollageSuggest(
  prompt: string,
  photoCount: number
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch('/api/ai/collage-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, photoCount }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to generate collage suggestions.',
    };
  }
}

export async function requestAiCollageGenerate(
  imageBase64: string,
  prompt?: string
): Promise<{ success: boolean; imageUrl?: string; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/ai/collage-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, prompt }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to generate AI collage.',
    };
  }
}

export async function requestAiGeneratePreset(
  prompt: string,
  referenceMood?: string,
  category?: string,
  imageBase64?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch('/api/ai/generate-ai-preset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, referenceMood, category, imageBase64 }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to generate AI preset.',
    };
  }
}

export async function requestAiRecommendPresets(
  imageBase64: string,
  availablePresets: any[]
): Promise<{ success: boolean; data?: { recommendations: any[]; sceneAnalysis?: string }; error?: string }> {
  try {
    const response = await fetch('/api/ai/recommend-presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, availablePresets }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to get AI preset recommendations.',
    };
  }
}

export async function requestAiUnderstandImage(
  imageBase64: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch('/api/ai/understand-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to perform AI image understanding analysis.',
    };
  }
}

export async function requestAiCompositionAssistant(
  imageBase64: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch('/api/ai/composition-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to run AI Composition Assistant.',
    };
  }
}

// ----------------------------------------------------------------------------
// AI-NATIVE EDITING ARCHITECTURE CALLS
// ----------------------------------------------------------------------------
export async function requestAiNativeDecompose(
  imageBase64: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch('/api/ai/ai-native-decompose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to execute AI Native Scene Decomposition.',
    };
  }
}

export async function requestAiNativeDirectorExecute(
  imageBase64: string,
  userPrompt: string,
  currentDecomposition?: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch('/api/ai/ai-native-director-execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        userPrompt,
        currentDecomposition,
      }),
    });

    const json = await response.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to execute AI Director instructions.',
    };
  }
}




