/**
 * Lumina Studio Pro — Local AI Model Manager View
 *
 * Provides a UI for browsing verified models, viewing hardware tier recommendations,
 * downloading models with real-time SHA-256 verification and progress tracking,
 * managing storage quotas, and inspecting license terms.
 */

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  RefreshCw,
  Info,
  Sliders,
  Scale,
  Clock,
} from 'lucide-react';
import { LocalAIModelCategory, LocalModelManifest, HardwareProfileResult } from '../../types/localAIModels';
import { localModelManager } from '../../services/ai/localModelManager';
import { hardwareProfiler } from '../../services/ai/hardwareProfiler';

export const LocalModelManagerView: React.FC = () => {
  const [manifests, setManifests] = useState<LocalModelManifest[]>([]);
  const [hardwareProfile, setHardwareProfile] = useState<HardwareProfileResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<LocalAIModelCategory | 'all'>('all');
  const [storageUsage, setStorageUsage] = useState<{ usedBytes: number; quotaBytes: number; percentage: number }>({
    usedBytes: 0,
    quotaBytes: 0,
    percentage: 0,
  });
  const [, setTick] = useState(0);

  useEffect(() => {
    setManifests(localModelManager.getAvailableManifests());
    hardwareProfiler.getProfile().then(setHardwareProfile);
    updateStorage();

    const unsubscribe = localModelManager.subscribe(() => {
      setTick((t) => t + 1);
      updateStorage();
    });

    return unsubscribe;
  }, []);

  const updateStorage = () => {
    localModelManager.getStorageUsage().then(setStorageUsage);
  };

  const handleDownload = async (modelId: string) => {
    try {
      await localModelManager.downloadModel(modelId);
      updateStorage();
    } catch (e: any) {
      console.error('Download error:', e);
    }
  };

  const handleDelete = async (modelId: string) => {
    await localModelManager.deleteModel(modelId);
    updateStorage();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredManifests = manifests.filter(
    (m) => selectedCategory === 'all' || m.category === selectedCategory
  );

  return (
    <div id="local-model-manager-root" className="space-y-6">
      {/* Hardware Profile Banner */}
      <div
        id="hardware-profile-card"
        className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-800 rounded-lg text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-neutral-100">
                  {hardwareProfile?.tierName || 'Probing Hardware Capabilities...'}
                </h3>
                <span className="px-2 py-0.5 text-xs font-mono rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  Tier {hardwareProfile?.tier || 1}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {hardwareProfile?.cpuCores} CPU Cores • {hardwareProfile?.deviceMemoryGB} GB RAM • {hardwareProfile?.webGPUAdapterName}
              </p>
            </div>
          </div>

          <button
            id="refresh-hardware-btn"
            onClick={() => hardwareProfiler.getProfile(true).then(setHardwareProfile)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-probe Hardware
          </button>
        </div>

        {/* Hardware Status Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-neutral-800/80 text-xs">
          <div className="bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/40">
            <span className="text-neutral-400">WebGPU Acceleration:</span>
            <div className="font-medium text-neutral-200 mt-0.5 flex items-center gap-1.5">
              {hardwareProfile?.webGPUSupported ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Enabled (Hardware Shaders)
                </>
              ) : (
                <>
                  <Info className="w-3.5 h-3.5 text-neutral-400" /> CPU SIMD Fallback
                </>
              )}
            </div>
          </div>

          <div className="bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/40">
            <span className="text-neutral-400">Max Tile Resolution:</span>
            <div className="font-medium text-neutral-200 mt-0.5">
              {hardwareProfile?.maxInferenceDimension} × {hardwareProfile?.maxInferenceDimension} px
            </div>
          </div>

          <div className="bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/40">
            <span className="text-neutral-400">Storage Used:</span>
            <div className="font-medium text-neutral-200 mt-0.5 flex items-center justify-between">
              <span>{formatBytes(storageUsage.usedBytes)}</span>
              <span className="text-neutral-500">{storageUsage.percentage}% of Quota</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div id="model-category-tabs" className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'All Models' },
          { id: 'vision_language', label: 'Vision-Language' },
          { id: 'segmentation', label: 'Segmentation & Matting' },
          { id: 'inpainting', label: 'Inpainting & Eraser' },
          { id: 'super_resolution', label: 'Super-Resolution' },
          { id: 'enhancement', label: 'Enhancement & Denoise' },
          { id: 'depth_estimation', label: '3D Depth & Relight' },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`category-tab-${tab.id}`}
            onClick={() => setSelectedCategory(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === tab.id
                ? 'bg-neutral-200 text-neutral-900 shadow-sm'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Models Grid */}
      <div id="verified-models-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredManifests.map((manifest) => {
          const record = localModelManager.getModelRecord(manifest.modelId);
          const isInstalled = record?.status === 'installed';
          const isDownloading = record?.status === 'downloading' || record?.status === 'verifying';
          const tierWarning = hardwareProfile && manifest.requiredHardwareTier > hardwareProfile.tier;

          return (
            <div
              key={manifest.modelId}
              id={`model-card-${manifest.modelId}`}
              className={`bg-neutral-900 border ${
                isInstalled ? 'border-emerald-800/40' : 'border-neutral-800'
              } rounded-xl p-4.5 flex flex-col justify-between space-y-4 transition-all`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-neutral-100">{manifest.name}</h4>
                      {isInstalled && (
                        <span className="flex items-center gap-1 text-[10px] bg-emerald-950/80 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800/60 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{manifest.description}</p>
                  </div>
                </div>

                {/* Specs Pill List */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400 pt-1">
                  <span className="bg-neutral-800 px-2 py-0.5 rounded font-mono text-neutral-300">
                    {manifest.quantizedSizeMB} MB ({manifest.quantizationFormat.toUpperCase()})
                  </span>
                  <span className="bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                    {manifest.developer}
                  </span>
                  <span className="bg-neutral-800 px-2 py-0.5 rounded font-mono text-emerald-400">
                    {manifest.license}
                  </span>
                  <span className="bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                    Min RAM: {manifest.minRAMMB} MB
                  </span>
                </div>

                {tierWarning && (
                  <div className="flex items-center gap-2 p-2 bg-amber-950/40 border border-amber-800/40 rounded-lg text-amber-300 text-xs">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Requires Tier {manifest.requiredHardwareTier}. May experience latency on this device.</span>
                  </div>
                )}
              </div>

              {/* Action Area & Progress Bar */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                {isDownloading && record?.progress && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-neutral-300">
                      <span>{record.status === 'verifying' ? 'Verifying SHA-256...' : 'Downloading model...'}</span>
                      <span className="font-mono">{record.progress.percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-150"
                        style={{ width: `${record.progress.percentage}%` }}
                      />
                    </div>
                    {record.status === 'downloading' && (
                      <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                        <span>{formatBytes(record.progress.bytesLoaded)} / {formatBytes(record.progress.totalBytes)}</span>
                        <span>{formatBytes(record.progress.speedBps)}/s • ~{record.progress.estimatedSecondsRemaining}s left</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Permissive Commercial OK</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isInstalled ? (
                      <button
                        id={`delete-model-${manifest.modelId}`}
                        onClick={() => handleDelete(manifest.modelId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-red-950 hover:text-red-300 hover:border-red-800/60 border border-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    ) : isDownloading ? (
                      <button
                        id={`cancel-download-${manifest.modelId}`}
                        onClick={() => localModelManager.cancelDownload(manifest.modelId)}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        id={`download-model-${manifest.modelId}`}
                        onClick={() => handleDownload(manifest.modelId)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-100 hover:bg-white text-neutral-950 rounded-lg text-xs font-semibold shadow-sm transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download ({manifest.quantizedSizeMB} MB)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
