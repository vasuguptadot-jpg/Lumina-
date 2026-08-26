export type GpuBackendType =
  | 'webgpu'
  | 'webgl2'
  | 'webgl1'
  | 'metal_virtual'
  | 'vulkan_virtual'
  | 'software_cpu';

export type ProxyPreviewMode = 'auto' | 'always_proxy' | 'never_fullres' | '1080p' | '720p';

export type IncrementalPassType = 'draft_instant' | 'high_fidelity' | 'master_floating_point';

export interface PerformanceSettings {
  gpuBackend: GpuBackendType;
  gpuAccelerationEnabled: boolean;
  workerThreadsCount: number; // e.g. 4, 8, 16
  backgroundRenderingEnabled: boolean;
  proxyPreviewMode: ProxyPreviewMode;
  tileBasedRenderingEnabled: boolean;
  tileSize: 256 | 512 | 1024;
  incrementalRenderingEnabled: boolean;
  maxMemoryCacheMB: number; // e.g. 512, 1024, 2048 MB
  enableOffscreenCanvas: boolean;
  showFpsCounter: boolean;
  showTileGridOverlay: boolean;
  offlineModeEnabled: boolean;
  precacheAllAssets: boolean;
}

export interface HardwareInfo {
  renderer: string;
  vendor: string;
  gpuBackend: GpuBackendType;
  webGpuSupported: boolean;
  webGl2Supported: boolean;
  logicalCores: number;
  maxTextureSize: number;
  totalVramEstimateMB: number;
  deviceMemoryGB: number;
  isMobile: boolean;
}

export interface MemoryTelemetry {
  jsHeapUsedMB: number;
  jsHeapTotalMB: number;
  textureCacheUsedMB: number;
  textureCacheMaxMB: number;
  cachedTilesCount: number;
  evictedTilesCount: number;
  cacheHitRatePercent: number;
}

export interface RenderingStats {
  fps: number;
  lastFrameLatencyMs: number;
  activePass: IncrementalPassType;
  isProxyActive: boolean;
  tilesRendered: number;
  tilesCulled: number;
  workersBusyCount: number;
  offlineCachedAssetsCount: number;
  isOffline: boolean;
}

export interface RenderTile {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  lodLevel: number; // 0 = 100%, 1 = 50%, 2 = 25%
  isDirty: boolean;
  lastRenderTimestamp: number;
  canvasBlob?: string;
}
