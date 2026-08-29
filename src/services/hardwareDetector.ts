/**
 * Lumina Studio Pro - Hardware & GPU Capability Detector
 * Evaluates host system specs (WebGL 2, GPU extensions, CPU cores, Memory, Screen DPI)
 * and dynamically assigns a performance tier (Tier 1 High-End to Tier 4 Low-Memory/Emergency).
 */

export type HardwareTier = 'TIER_1_HIGH_END' | 'TIER_2_PERFORMANCE' | 'TIER_3_STANDARD' | 'TIER_4_LOW_MEMORY';

export interface GPUCapabilities {
  webgl2Supported: boolean;
  webglSupported: boolean;
  renderer: string;
  vendor: string;
  maxTextureSize: number;
  maxRenderBufferSize: number;
  floatTexturesSupported: boolean;
  halfFloatTexturesSupported: boolean;
  colorBufferFloatSupported: boolean;
  anisotropicFilteringSupported: boolean;
  offscreenCanvasSupported: boolean;
}

export interface HardwareProfile {
  tier: HardwareTier;
  tierName: string;
  cores: number;
  deviceMemoryGB: number;
  pixelRatio: number;
  gpu: GPUCapabilities;
  recommendedWorkerCount: number;
  recommendedTileSize: number;
  maxPreviewResolution: number;
  useFloat32Pipeline: boolean;
  maxCacheSizeMB: number;
  emergencyModeActive: boolean;
}

class HardwareDetectorService {
  private static instance: HardwareDetectorService | null = null;
  private cachedProfile: HardwareProfile | null = null;
  private memoryPressureListeners: Array<(emergency: boolean) => void> = [];

  private constructor() {
    this.setupMemoryPressureWatcher();
  }

  public static getInstance(): HardwareDetectorService {
    if (!HardwareDetectorService.instance) {
      HardwareDetectorService.instance = new HardwareDetectorService();
    }
    return HardwareDetectorService.instance;
  }

  public getProfile(): HardwareProfile {
    if (this.cachedProfile) return this.cachedProfile;

    const gpu = this.detectGPUCapabilities();
    const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
    // deviceMemory is in GB in Chromium browsers, fallback to 4GB
    const deviceMemoryGB = typeof navigator !== 'undefined' && (navigator as any).deviceMemory ? (navigator as any).deviceMemory : 4;
    const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    let tier: HardwareTier = 'TIER_3_STANDARD';
    let tierName = 'Tier 3 — Standard';

    // Tier 1: High End Desktop / Workstation (>= 8 cores, >= 8GB RAM, WebGL2 with >= 8192px texture size)
    if (cores >= 8 && deviceMemoryGB >= 8 && gpu.webgl2Supported && gpu.maxTextureSize >= 8192) {
      tier = 'TIER_1_HIGH_END';
      tierName = 'Tier 1 — High End';
    }
    // Tier 2: Performance (>= 4 cores, >= 4GB RAM, WebGL2 with >= 4096px texture size)
    else if (cores >= 4 && deviceMemoryGB >= 4 && (gpu.webgl2Supported || gpu.webglSupported) && gpu.maxTextureSize >= 4096) {
      tier = 'TIER_2_PERFORMANCE';
      tierName = 'Tier 2 — Performance';
    }
    // Tier 4: Low Memory / Mobile Emergency (< 4GB RAM or <= 2 cores or maxTextureSize < 4096)
    else if (deviceMemoryGB < 4 || cores <= 2 || gpu.maxTextureSize < 4096) {
      tier = 'TIER_4_LOW_MEMORY';
      tierName = 'Tier 4 — Low Memory';
    }

    const recommendedWorkerCount = tier === 'TIER_1_HIGH_END' ? Math.min(cores, 8) : tier === 'TIER_2_PERFORMANCE' ? Math.min(cores, 4) : 2;
    const recommendedTileSize = tier === 'TIER_1_HIGH_END' ? 1024 : tier === 'TIER_2_PERFORMANCE' ? 512 : 256;
    const maxPreviewResolution = tier === 'TIER_1_HIGH_END' ? 4096 : tier === 'TIER_2_PERFORMANCE' ? 2560 : 1600;
    const useFloat32Pipeline = tier === 'TIER_1_HIGH_END' && gpu.colorBufferFloatSupported;
    const maxCacheSizeMB = tier === 'TIER_1_HIGH_END' ? 1024 : tier === 'TIER_2_PERFORMANCE' ? 512 : 128;

    this.cachedProfile = {
      tier,
      tierName,
      cores,
      deviceMemoryGB,
      pixelRatio,
      gpu,
      recommendedWorkerCount,
      recommendedTileSize,
      maxPreviewResolution,
      useFloat32Pipeline,
      maxCacheSizeMB,
      emergencyModeActive: false,
    };

    return this.cachedProfile;
  }

  private detectGPUCapabilities(): GPUCapabilities {
    const defaultGPU: GPUCapabilities = {
      webgl2Supported: false,
      webglSupported: false,
      renderer: 'Generic GPU / Software Rasterizer',
      vendor: 'Generic Vendor',
      maxTextureSize: 4096,
      maxRenderBufferSize: 4096,
      floatTexturesSupported: false,
      halfFloatTexturesSupported: false,
      colorBufferFloatSupported: false,
      anisotropicFilteringSupported: false,
      offscreenCanvasSupported: typeof OffscreenCanvas !== 'undefined',
    };

    if (typeof document === 'undefined') return defaultGPU;

    try {
      const canvas = document.createElement('canvas');
      let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;

      // Try WebGL 2 first
      gl = canvas.getContext('webgl2');
      if (gl) {
        defaultGPU.webgl2Supported = true;
        defaultGPU.webglSupported = true;
      } else {
        gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
        if (gl) {
          defaultGPU.webglSupported = true;
        }
      }

      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          defaultGPU.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown Vendor';
          defaultGPU.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown Renderer';
        }

        defaultGPU.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
        defaultGPU.maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 4096;

        if (defaultGPU.webgl2Supported) {
          defaultGPU.floatTexturesSupported = true;
          defaultGPU.halfFloatTexturesSupported = true;
          defaultGPU.colorBufferFloatSupported = !!gl.getExtension('EXT_color_buffer_float');
        } else {
          defaultGPU.floatTexturesSupported = !!gl.getExtension('OES_texture_float');
          defaultGPU.halfFloatTexturesSupported = !!gl.getExtension('OES_texture_half_float');
          defaultGPU.colorBufferFloatSupported = !!gl.getExtension('WEBGL_color_buffer_float');
        }

        defaultGPU.anisotropicFilteringSupported = !!(
          gl.getExtension('EXT_texture_filter_anisotropic') ||
          gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
          gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
        );
      }
    } catch (e) {
      console.warn('[HardwareDetector] GPU detection exception, using safe defaults:', e);
    }

    return defaultGPU;
  }

  private setupMemoryPressureWatcher(): void {
    if (typeof window === 'undefined') return;

    // Listen for memory pressure event from platform service
    window.addEventListener('lumina-emergency-memory', () => {
      if (this.cachedProfile) {
        this.cachedProfile.emergencyModeActive = true;
        this.cachedProfile.recommendedTileSize = 128;
        this.cachedProfile.recommendedWorkerCount = 1;
        this.cachedProfile.maxPreviewResolution = 1024;
      }
      this.notifyMemoryPressure(true);
    });

    window.addEventListener('lumina-app-resume', () => {
      if (this.cachedProfile) {
        this.cachedProfile.emergencyModeActive = false;
      }
      this.notifyMemoryPressure(false);
    });
  }

  public onMemoryPressure(cb: (emergency: boolean) => void): () => void {
    this.memoryPressureListeners.push(cb);
    return () => {
      this.memoryPressureListeners = this.memoryPressureListeners.filter((l) => l !== cb);
    };
  }

  private notifyMemoryPressure(emergency: boolean): void {
    for (const listener of this.memoryPressureListeners) {
      try {
        listener(emergency);
      } catch (err) {
        console.error('[HardwareDetector] Memory listener error:', err);
      }
    }
  }
}

export const hardwareDetector = HardwareDetectorService.getInstance();
