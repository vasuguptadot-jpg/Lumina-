import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudCheck,
  RefreshCw,
  X,
  Upload,
  Download,
  Trash2,
  FolderOpen,
  Share2,
  Laptop,
  CheckCircle2,
  HardDrive,
  Copy,
} from 'lucide-react';
import { Project } from '../../types/editor';
import {
  getAllProjectsFromDB,
  deleteProjectFromDB,
  saveProjectToDB,
} from '../../storage/db';
import {
  syncProjectToCloud,
  exportProjectAsLuminaFile,
  importProjectFromLuminaFile,
  getOrCreateDeviceId,
} from '../../storage/cloudSync';

interface CloudProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: Project | null;
  onLoadProject: (project: Project) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const CloudProjectsModal: React.FC<CloudProjectsModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onLoadProject,
  showToast,
}) => {
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const deviceInfo = getOrCreateDeviceId();

  const loadProjects = async () => {
    const list = await getAllProjectsFromDB();
    setProjectsList(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSyncCurrent = async () => {
    if (!currentProject) return;
    setIsSyncing(true);
    showToast('info', 'Synchronizing Project', 'Packaging adjustments, curves, and history to Cloud Vault...');

    try {
      const res = await syncProjectToCloud(currentProject);
      if (res.success) {
        showToast('success', 'Cloud Synced', res.message);
        loadProjects();
      }
    } catch (err: any) {
      showToast('error', 'Sync Failed', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    try {
      const imported = await importProjectFromLuminaFile(e.target.files[0]);
      showToast('success', 'Project Imported', `Loaded project "${imported.name}"`);
      loadProjects();
      onLoadProject(imported);
      onClose();
    } catch (err: any) {
      showToast('error', 'Import Failed', err.message);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteProjectFromDB(id);
    loadProjects();
    showToast('info', 'Project Deleted');
  };

  const handleCopyShareLink = () => {
    if (!currentProject) return;
    const dummyShareUrl = `${window.location.origin}/#share=${currentProject.id}`;
    navigator.clipboard.writeText(dummyShareUrl);
    setCopiedLink(true);
    showToast('success', 'Share Link Copied', 'Cloud workspace link copied to clipboard.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cloud Workspace & Sync</h3>
              <p className="text-[11px] text-slate-400">
                Offline-First Local Storage + Cloud Vault Synchronization
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Controls Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Laptop className="w-4 h-4 text-slate-500" />
            <span>Device: <b className="text-white">{deviceInfo.deviceName}</b></span>
          </div>

          <div className="flex items-center gap-2">
            {currentProject && (
              <>
                <button
                  onClick={handleSyncCurrent}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CloudCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Sync Current to Cloud</span>
                </button>

                <button
                  onClick={() => exportProjectAsLuminaFile(currentProject)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  title="Export complete editable bundle file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .lumina</span>
                </button>
              </>
            )}

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Import .lumina</span>
              <input
                type="file"
                accept=".lumina,.json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="text-xs font-bold text-slate-400">
            Saved Projects ({projectsList.length})
          </div>

          {projectsList.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl p-6 text-slate-500 text-xs">
              No saved projects yet. Your edits are saved automatically in IndexedDB!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projectsList.map((p) => {
                const isCurrent = currentProject?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onLoadProject(p);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-32 group ${
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Updated {new Date(p.updatedAt).toLocaleDateString()} at{' '}
                          {new Date(p.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDelete(p.id, e)}
                        className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        {p.cloudRevision ? `Rev #${p.cloudRevision}` : 'Saved Local'}
                      </span>
                      <span className="font-mono text-slate-500">
                        {p.image.width} × {p.image.height}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Share Section Footer */}
        {currentProject && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Share project workspace link:</span>
            </div>

            <button
              onClick={handleCopyShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Copied!' : 'Copy Share Link'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
