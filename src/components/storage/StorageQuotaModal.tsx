import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Database,
  Trash2,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileImage,
  Layers,
  GitCommit,
  ShieldCheck,
  X,
} from 'lucide-react';
import { StorageQuotaInfo } from '../../types/projectSchema';
import {
  getStorageQuotaInfo,
  purgeStaleStorage,
  deleteLuminaProject,
  getAllLuminaProjects,
} from '../../storage/indexedDbManager';
import { exportPortableLuminaFile } from '../../storage/portableProject';

interface StorageQuotaModalProps {
  onClose: () => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export const StorageQuotaModal: React.FC<StorageQuotaModalProps> = ({
  onClose,
  showToast,
}) => {
  const [quota, setQuota] = useState<StorageQuotaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);

  const loadQuota = async () => {
    setIsLoading(true);
    try {
      const data = await getStorageQuotaInfo();
      setQuota(data);
    } catch (e) {
      console.error('Failed to load quota info:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuota();
  }, []);

  const handlePurgeStale = async () => {
    setIsCleaning(true);
    try {
      const res = await purgeStaleStorage(0); // purge all unreferenced/recovery caches
      await loadQuota();
      showToast?.(
        'success',
        'Storage Maintenance Complete',
        `Purged ${res.purgedSnapshots} recovery snapshots and ${res.purgedAssets} unreferenced assets.`
      );
    } catch (e) {
      showToast?.('error', 'Cleanup Failed', 'Could not purge storage.');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}" from local storage?`)) {
      return;
    }
    await deleteLuminaProject(id);
    await loadQuota();
    showToast?.('info', 'Project Deleted', `Removed "${name}" from storage.`);
  };

  const handleExportAll = async () => {
    try {
      const allProjects = await getAllLuminaProjects();
      for (const p of allProjects) {
        await exportPortableLuminaFile(p);
      }
      showToast?.('success', 'Export Complete', `Exported ${allProjects.length} .lumina files.`);
    } catch (e) {
      showToast?.('error', 'Export Failed', 'Unable to export all projects.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/60 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Local Storage Vault
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  IndexedDB 100% Offline
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Storage Quota & Diagnostics
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {isLoading || !quota ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              Analyzing IndexedDB storage footprint...
            </div>
          ) : (
            <>
              {/* Storage Gauge */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Browser Storage Quota Usage</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {formatBytes(quota.usedBytes)} / {formatBytes(quota.quotaBytes || 10737418240)} ({quota.percentUsed}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all rounded-full ${
                      quota.percentUsed > 85
                        ? 'bg-red-500'
                        : quota.percentUsed > 60
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(2, quota.percentUsed)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Zero cloud dependence • Encrypted in browser storage</span>
                  <span>Estimated remaining: {formatBytes((quota.quotaBytes || 10737418240) - quota.usedBytes)}</span>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-white">{quota.projectsCount}</div>
                  <div className="text-[10px] text-slate-400">Projects</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
                    <GitCommit className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-white">{quota.snapshotsCount}</div>
                  <div className="text-[10px] text-slate-400">Versions</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-white">{quota.recoverySnapshotsCount}</div>
                  <div className="text-[10px] text-slate-400">Recovery Caches</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center">
                    <FileImage className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-white">{quota.sourceAssetsCount}</div>
                  <div className="text-[10px] text-slate-400">Source Blobs</div>
                </div>
              </div>

              {/* Largest Projects Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300">Largest Saved Projects</h4>
                  <span className="text-[10px] text-slate-500 font-mono">Top {quota.largestProjects.length}</span>
                </div>

                <div className="rounded-2xl bg-slate-950 border border-slate-800 divide-y divide-slate-900 overflow-hidden">
                  {quota.largestProjects.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="text-xs font-bold text-white truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(p.updatedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono font-semibold text-slate-400">
                          {formatBytes(p.sizeBytes)}
                        </span>
                        <button
                          onClick={() => handleDeleteProject(p.id, p.name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            onClick={handlePurgeStale}
            disabled={isCleaning}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-amber-300 border border-slate-800 hover:border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCleaning ? 'animate-spin' : ''}`} />
            <span>Purge Recovery Caches</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAll}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup All (.lumina)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
