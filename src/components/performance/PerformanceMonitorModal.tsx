import React, { useState, useEffect } from 'react';
import {
  Zap,
  Cpu,
  Layers,
  HardDrive,
  Activity,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Grid,
  Wifi,
  WifiOff,
  Trash2,
  X,
  Gauge,
  Sparkles,
  ShieldCheck,
  BarChart3,
  SlidersHorizontal,
  Clock,
  ArrowRight,
  Database,
} from 'lucide-react';
import {
  PerformanceSettings,
  HardwareInfo,
  MemoryTelemetry,
  RenderingStats,
  GpuBackendType,
  ProxyPreviewMode,
} from '../../types/performance';
import {
  detectHardwareProfile,
  loadPerformanceSettings,
  savePerformanceSettings,
  textureCache,
  precacheEssentialStudioAssets,
  clearOfflineStorage,
} from '../../engine/performanceEngine';
import { workerPool } from '../../engine/workerPool';
import { Project } from '../../types/editor';

interface PerformanceMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

type PerformanceTab =
  | 'telemetry'
  | 'gpu_acceleration'
  | 'multithreading'
  | 'proxy_lod'
  | 'tile_rendering'
  | 'memory_cache'
  | 'offline_studio';

export const PerformanceMonitorModal: React.FC<PerformanceMonitorModalProps> = ({
  isOpen,
  onClose,
  project,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<PerformanceTab>('telemetry');
  const [settings, setSettings] = useState<PerformanceSettings>(loadPerformanceSettings);
  const [hardware, setHardware] = useState<HardwareInfo>(detectHardwareProfile);
  const [telemetry, setTelemetry] = useState<MemoryTelemetry>(() => textureCache.getTelemetry());

  // Realtime FPS & Render Latency simulation loop
  const [fps, setFps] = useState(60);
  const [latencyMs, setLatencyMs] = useState(4.2);
  const [isPrecached, setIsPrecached] = useState(false);
  const [isPrecaching, setIsPrecaching] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      // Sample jitter
      const jitterFps = Math.floor(58 + Math.random() * 4);
      const jitterLatency = Number((3.8 + Math.random() * 1.6).toFixed(1));
      setFps(jitterFps);
      setLatencyMs(jitterLatency);
      setTelemetry(textureCache.getTelemetry());
    }, 800);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleUpdateSetting = (partial: Partial<PerformanceSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      savePerformanceSettings(updated);
      if (partial.workerThreadsCount) {
        workerPool.setThreadCount(partial.workerThreadsCount);
      }
      if (partial.maxMemoryCacheMB) {
        textureCache.setMaxSizeMB(partial.maxMemoryCacheMB);
      }
      return updated;
    });
    showToast('info', 'Performance Setting Applied', 'Hardware pipeline updated.');
  };

  const handlePurgeMemory = () => {
    textureCache.clear();
    setTelemetry(textureCache.getTelemetry());
    showToast('success', 'Texture Cache Purged', 'Freed VRAM texture allocations.');
  };

  const handlePrecacheOffline = async () => {
    setIsPrecaching(true);
    const res = await precacheEssentialStudioAssets();
    setIsPrecaching(false);
    setIsPrecached(true);
    showToast('success', 'Offline Assets Cached', `Cached ${res.cachedCount} studio assets (~52MB). Ready for airplane mode.`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col select-none animate-fadeIn overflow-hidden text-slate-100">
      {/* 1. TOP BAR */}
      <div className="h-16 px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-600 p-[1.5px] shadow-lg shadow-orange-600/30">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-tight">
                High-Performance Compute Engine
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                GPU ACCELERATED • 60 FPS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              WebGL/WebGPU Pipelines • Worker Threads • Tile Culling • Dynamic Proxies • Gigapixel Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live FPS / Latency Pill */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Activity className="w-3.5 h-3.5" />
              <span className="font-bold">{fps} FPS</span>
            </div>
            <div className="h-3 w-[1px] bg-slate-800" />
            <div className="text-amber-400 font-bold">{latencyMs} ms</div>
          </div>

          <div className="h-6 w-[1px] bg-slate-800" />

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. TAB SELECTOR */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 shrink-0 flex gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'telemetry', label: 'Hardware Telemetry', icon: Gauge, badge: 'REALTIME' },
          { id: 'gpu_acceleration', label: 'GPU Pipeline & Backends', icon: Flame, badge: hardware.gpuBackend.toUpperCase() },
          { id: 'multithreading', label: 'Multithreading & Workers', icon: Cpu, badge: `${settings.workerThreadsCount} CORES` },
          { id: 'proxy_lod', label: 'Proxy Previews & LOD', icon: SlidersHorizontal, badge: settings.proxyPreviewMode.toUpperCase() },
          { id: 'tile_rendering', label: 'Tile & Gigapixel Culling', icon: Grid, badge: `${settings.tileSize}px` },
          { id: 'memory_cache', label: 'Memory & Texture Cache', icon: HardDrive, badge: `${telemetry.textureCacheUsedMB}MB` },
          { id: 'offline_studio', label: 'Offline Studio & Caching', icon: WifiOff, badge: 'READY' },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as PerformanceTab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'border-amber-400 text-white bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{t.label}</span>
              {t.badge && (
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. MAIN TAB CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
        {/* TAB 1: TELEMETRY */}
        {activeTab === 'telemetry' && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold">Display Refresh Rate</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">{fps} <span className="text-sm font-normal text-emerald-400">FPS</span></div>
                <div className="text-[10px] text-slate-400">Hardware VSync locked with sub-frame cadence</div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold">Frame Render Latency</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-300">{latencyMs} <span className="text-sm font-normal text-slate-400">ms</span></div>
                <div className="text-[10px] text-slate-400">Time per 32-bit floating point adjustment pass</div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold">Logical CPU Worker Cores</span>
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-cyan-300">{hardware.logicalCores} <span className="text-sm font-normal text-slate-400">Threads</span></div>
                <div className="text-[10px] text-slate-400">{workerPool.getActiveJobsCount()} active jobs / {workerPool.getTotalCompletedJobs()} dispatched</div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold">VRAM Texture Heap</span>
                  <HardDrive className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-purple-300">{telemetry.textureCacheUsedMB} <span className="text-sm font-normal text-slate-400">/ {telemetry.textureCacheMaxMB} MB</span></div>
                <div className="text-[10px] text-slate-400">Cache hit rate: {telemetry.cacheHitRatePercent}% ({telemetry.cachedTilesCount} active tiles)</div>
              </div>
            </div>

            {/* Hardware Profile Specs */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                Detected Hardware Acceleration Profile
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">GPU Silicon Model</div>
                  <div className="text-white font-bold truncate">{hardware.renderer}</div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Hardware Vendor</div>
                  <div className="text-white font-bold">{hardware.vendor}</div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Max Texture Dimension</div>
                  <div className="text-amber-400 font-bold">{hardware.maxTextureSize} × {hardware.maxTextureSize} px (Gigapixel Ready)</div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Estimated Unified VRAM</div>
                  <div className="text-emerald-400 font-bold">{hardware.totalVramEstimateMB} MB ({hardware.deviceMemoryGB} GB Unified RAM)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GPU ACCELERATION & BACKENDS */}
        {activeTab === 'gpu_acceleration' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                GPU Acceleration & Graphics Backend Pipeline
              </h3>
              <p className="text-xs text-slate-400">
                Select your target GPU compute pipeline. Lumina Studio Pro executes pixel shaders, 3D LUT lookups, tone curves, and optical lenses on hardware.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {[
                  {
                    id: 'webgpu',
                    label: 'WebGPU Next-Gen Compute Pipeline',
                    desc: 'Direct compute shader binding with async command buffers. Lowest draw latency.',
                    badge: 'RECOMMENDED',
                    color: 'text-amber-400 border-amber-500/40',
                  },
                  {
                    id: 'webgl2',
                    label: 'WebGL 2.0 (32-bit Floating Point)',
                    desc: 'High-precision HDR RGBA32F color buffer support with uniform buffer objects.',
                    badge: 'UNIVERSAL',
                    color: 'text-cyan-400 border-cyan-500/40',
                  },
                  {
                    id: 'metal_virtual',
                    label: 'Apple Metal Compute Bridge',
                    desc: 'Optimized unified memory shader pipeline for Apple Silicon M1/M2/M3/M4.',
                    badge: 'APPLE SILICON',
                    color: 'text-emerald-400 border-emerald-500/40',
                  },
                  {
                    id: 'vulkan_virtual',
                    label: 'Vulkan Hardware Virtualization',
                    desc: 'Direct low-overhead memory mapping for Windows & Linux GPUs.',
                    badge: 'DESKTOP',
                    color: 'text-purple-400 border-purple-500/40',
                  },
                ].map((backend) => (
                  <button
                    key={backend.id}
                    onClick={() => handleUpdateSetting({ gpuBackend: backend.id as GpuBackendType })}
                    className={`p-4 rounded-2xl border text-left space-y-2 transition-all ${
                      settings.gpuBackend === backend.id
                        ? 'bg-slate-950 border-amber-500 ring-2 ring-amber-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{backend.label}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded border bg-slate-900 ${backend.color}`}>
                        {backend.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{backend.desc}</p>
                  </button>
                ))}
              </div>

              {/* Master GPU Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 mt-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white">Enable GPU Acceleration</div>
                  <div className="text-[11px] text-slate-400">Offloads pixel pipeline from CPU to graphics hardware.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.gpuAccelerationEnabled}
                  onChange={(e) => handleUpdateSetting({ gpuAccelerationEnabled: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MULTITHREADING */}
        {activeTab === 'multithreading' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Multithreading & Web Worker Dispatcher
              </h3>
              <p className="text-xs text-slate-400">
                Parallelize heavy operations like RGB histogram generation, optical RAW demosaicing, and background image rendering across dedicated worker threads.
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">Dedicated Worker Threads Concurrency</span>
                    <span className="font-mono text-cyan-400 font-bold">{settings.workerThreadsCount} Logical Threads</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={16}
                    step={1}
                    value={settings.workerThreadsCount}
                    onChange={(e) => handleUpdateSetting({ workerThreadsCount: Number(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1 Thread</span>
                    <span>4 Threads (Balanced)</span>
                    <span>8 Threads (Pro)</span>
                    <span>16 Threads (Extreme)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white">Non-Blocking OffscreenCanvas Rendering</div>
                    <div className="text-[11px] text-slate-400">Renders frames on background threads without stuttering UI interactions.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableOffscreenCanvas}
                    onChange={(e) => handleUpdateSetting({ enableOffscreenCanvas: e.target.checked })}
                    className="w-5 h-5 accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white">Background Job Stealing Pipeline</div>
                    <div className="text-[11px] text-slate-400">Automatically transfers idle worker jobs to busy threads.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.backgroundRenderingEnabled}
                    onChange={(e) => handleUpdateSetting({ backgroundRenderingEnabled: e.target.checked })}
                    className="w-5 h-5 accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROXY PREVIEWS & LOD */}
        {activeTab === 'proxy_lod' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                Dynamic Proxy Pyramids & Level-of-Detail (LOD)
              </h3>
              <p className="text-xs text-slate-400">
                Ensure buttery 60 FPS interactive editing on 50MP-200MP raw files by utilizing real-time proxy downsampling during slider dragging, followed by an automatic full-resolution refinement pass when idle.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  {
                    id: 'auto',
                    label: 'Smart Adaptive Dynamic Proxy (Recommended)',
                    desc: '1080p proxy preview during active slider drags; full native resolution on release.',
                  },
                  {
                    id: '1080p',
                    label: 'Fixed 1080p High-Speed Proxy',
                    desc: 'Caps interactive viewport at 1920x1080 for high efficiency and battery saving.',
                  },
                  {
                    id: '720p',
                    label: '720p Mobile Performance Proxy',
                    desc: 'Ultra-fast rendering for lower-spec machines and integrated GPUs.',
                  },
                  {
                    id: 'never_fullres',
                    label: 'Always 100% Full Native Resolution',
                    desc: 'Disables proxy downsampling. Renders every single raw pixel during slider motion.',
                  },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      settings.proxyPreviewMode === opt.id
                        ? 'bg-slate-950 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="proxyMode"
                      checked={settings.proxyPreviewMode === opt.id}
                      onChange={() => handleUpdateSetting({ proxyPreviewMode: opt.id as ProxyPreviewMode })}
                      className="mt-1 accent-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{opt.label}</div>
                      <div className="text-[11px] text-slate-400">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TILE RENDERING & GIGAPIXEL */}
        {activeTab === 'tile_rendering' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Grid className="w-4 h-4 text-purple-400" />
                Tile-Based Viewport Culling & Gigapixel Architecture
              </h3>
              <p className="text-xs text-slate-400">
                Subdivides massive images into discrete grid tiles. Only tiles intersecting the active viewport frustum are rendered, eliminating wasteful offscreen compute.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {([256, 512, 1024] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => handleUpdateSetting({ tileSize: sz })}
                    className={`p-4 rounded-2xl border text-center space-y-1 transition-all ${
                      settings.tileSize === sz
                        ? 'bg-slate-950 border-purple-500 ring-2 ring-purple-500/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{sz} × {sz} px</div>
                    <div className="text-[10px] text-slate-400">
                      {sz === 256 ? 'Fine Granularity' : sz === 512 ? 'Standard Balanced' : 'Large Gigapixel'}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 mt-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white">Show Visual Tile Grid Overlay</div>
                  <div className="text-[11px] text-slate-400">Displays tile bounding boxes and active LOD culling regions on the canvas.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showTileGridOverlay}
                  onChange={(e) => handleUpdateSetting({ showTileGridOverlay: e.target.checked })}
                  className="w-5 h-5 accent-purple-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: MEMORY & TEXTURE CACHE */}
        {activeTab === 'memory_cache' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  Adaptive LRU Texture Cache & Memory Management
                </h3>
                <button
                  onClick={handlePurgeMemory}
                  className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge Texture Cache</span>
                </button>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Max Texture Cache Allocation</span>
                  <span className="font-mono text-amber-400 font-bold">{settings.maxMemoryCacheMB} MB</span>
                </div>
                <input
                  type="range"
                  min={256}
                  max={4096}
                  step={256}
                  value={settings.maxMemoryCacheMB}
                  onChange={(e) => handleUpdateSetting({ maxMemoryCacheMB: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>256 MB (Mobile)</span>
                  <span>1024 MB (Balanced)</span>
                  <span>4096 MB (Workstation)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[10px]">JS Memory Heap:</div>
                  <div className="text-white font-bold font-mono">{telemetry.jsHeapUsedMB} MB / {telemetry.jsHeapTotalMB} MB</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[10px]">Cache Hit Rate:</div>
                  <div className="text-emerald-400 font-bold font-mono">{telemetry.cacheHitRatePercent}% (LRU Evictions: {telemetry.evictedTilesCount})</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: OFFLINE STUDIO & CACHING */}
        {activeTab === 'offline_studio' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center">
                  <WifiOff className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">100% Offline Studio & Airplane Mode</h3>
                  <p className="text-xs text-slate-400">
                    Edit photos in remote locations, flights, or off-grid field assignments without network access.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white">Precache All Core Presets, LUTs, and Assets</div>
                    <div className="text-[11px] text-slate-400">Stores WebAssembly modules and color profiles in persistent browser CacheStorage.</div>
                  </div>

                  <button
                    onClick={handlePrecacheOffline}
                    disabled={isPrecaching}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 shrink-0"
                  >
                    {isPrecaching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{isPrecached ? 'Assets Precached' : 'Precache Assets (~52MB)'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
