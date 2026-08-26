import React, { useState } from 'react';
import {
  Zap,
  Cpu,
  Flame,
  HardDrive,
  Grid,
  ExternalLink,
  Activity,
  SlidersHorizontal,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Project } from '../../../types/editor';
import {
  loadPerformanceSettings,
  savePerformanceSettings,
  textureCache,
  detectHardwareProfile,
} from '../../../engine/performanceEngine';
import { PerformanceSettings, ProxyPreviewMode } from '../../../types/performance';

interface PerformancePanelProps {
  project: Project;
  onOpenPerformanceModal: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const PerformancePanel: React.FC<PerformancePanelProps> = ({
  project,
  onOpenPerformanceModal,
  showToast,
}) => {
  const [settings, setSettings] = useState<PerformanceSettings>(loadPerformanceSettings);
  const hardware = detectHardwareProfile();
  const telemetry = textureCache.getTelemetry();

  const handleToggle = (key: keyof PerformanceSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      savePerformanceSettings(updated);
      showToast('info', 'Setting Updated', `${String(key)} is now ${updated[key] ? 'ENABLED' : 'DISABLED'}`);
      return updated;
    });
  };

  const handleSetProxy = (mode: ProxyPreviewMode) => {
    setSettings((prev) => {
      const updated = { ...prev, proxyPreviewMode: mode };
      savePerformanceSettings(updated);
      showToast('info', 'Proxy Mode', `Switched proxy preview to ${mode}`);
      return updated;
    });
  };

  const handlePurge = () => {
    textureCache.clear();
    showToast('success', 'Cache Purged', 'Freed VRAM texture cache.');
  };

  return (
    <div className="p-4 space-y-5 text-slate-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 to-slate-900 border border-amber-500/30 rounded-2xl p-4 space-y-2 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold text-white">Hardware Acceleration</span>
          </div>
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            60 FPS VSYNC
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
          <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500">GPU Pipeline</div>
            <div className="text-amber-300 font-bold uppercase truncate">{settings.gpuBackend}</div>
          </div>
          <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500">Worker Threads</div>
            <div className="text-cyan-300 font-bold">{settings.workerThreadsCount} Cores</div>
          </div>
        </div>

        <button
          onClick={onOpenPerformanceModal}
          className="w-full mt-2 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/30 flex items-center justify-center gap-1.5"
        >
          <span>Open Compute Dashboard</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Proxy Settings */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Interactive Slider Proxy Mode
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { id: 'auto', label: 'Dynamic Auto' },
            { id: '1080p', label: '1080p Fast' },
            { id: '720p', label: '720p Mobile' },
            { id: 'never_fullres', label: '100% Full Res' },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleSetProxy(opt.id as ProxyPreviewMode)}
              className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                settings.proxyPreviewMode === opt.id
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Toggles */}
      <div className="space-y-3 pt-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Compute Engines
        </h4>

        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>GPU Acceleration</span>
            </div>
            <div className="text-[10px] text-slate-400">Hardware rasterization</div>
          </div>
          <input
            type="checkbox"
            checked={settings.gpuAccelerationEnabled}
            onChange={() => handleToggle('gpuAccelerationEnabled')}
            className="w-4 h-4 accent-amber-500 cursor-pointer"
          />
        </div>

        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-purple-400" />
              <span>Tile Frustum Culling</span>
            </div>
            <div className="text-[10px] text-slate-400">Render visible tiles only</div>
          </div>
          <input
            type="checkbox"
            checked={settings.tileBasedRenderingEnabled}
            onChange={() => handleToggle('tileBasedRenderingEnabled')}
            className="w-4 h-4 accent-purple-500 cursor-pointer"
          />
        </div>

        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>Offscreen Background Render</span>
            </div>
            <div className="text-[10px] text-slate-400">Non-blocking UI threads</div>
          </div>
          <input
            type="checkbox"
            checked={settings.enableOffscreenCanvas}
            onChange={() => handleToggle('enableOffscreenCanvas')}
            className="w-4 h-4 accent-cyan-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Memory Purge Button */}
      <div className="pt-2">
        <button
          onClick={handlePurge}
          className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Purge Texture Cache ({telemetry.textureCacheUsedMB} MB)</span>
        </button>
      </div>
    </div>
  );
};
