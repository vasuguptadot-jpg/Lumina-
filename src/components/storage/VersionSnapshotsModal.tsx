import React, { useState, useEffect } from 'react';
import {
  GitCommit,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  Clock,
  Check,
  Download,
  Eye,
  Edit3,
  X,
  FileText,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Project, EditHistorySnapshot } from '../../types/editor';
import { ProjectVersionRecord } from '../../types/projectSchema';
import {
  saveProjectVersionRecord,
  getProjectVersionRecords,
  deleteProjectVersionRecord,
  generateThumbnailDataUrl,
} from '../../storage/indexedDbManager';
import { sanitizeDocumentState } from '../../storage/schemaMigration';
import { exportPortableLuminaFile } from '../../storage/portableProject';

interface VersionSnapshotsModalProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onClose: () => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const VersionSnapshotsModal: React.FC<VersionSnapshotsModalProps> = ({
  project,
  onUpdateProject,
  onClose,
  showToast,
}) => {
  const [versions, setVersions] = useState<ProjectVersionRecord[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDesc, setNewVersionDesc] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const records = await getProjectVersionRecords(project.id);
      setVersions(records);
    } catch (e) {
      console.error('Failed to load version records:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, [project.id]);

  const handleCreateVersion = async () => {
    if (!newVersionName.trim()) return;

    let thumbUrl = project.thumbnailUrl;
    if (!thumbUrl && project.image?.originalUrl) {
      try {
        thumbUrl = await generateThumbnailDataUrl(project.image.originalUrl);
      } catch {
        thumbUrl = undefined;
      }
    }

    const docState = sanitizeDocumentState({
      currentSettings: project.currentSettings,
      crop: project.crop,
      toneCurves: project.toneCurves,
      hsl: project.hsl,
      activePresetId: project.activePresetId,
      presetStrength: project.presetStrength,
      watermark: project.watermark,
      border: project.border,
      masks: project.masks,
      layers: project.layers,
      typography: project.typography,
      designElements: project.designElements,
      retouchStrokes: project.retouchStrokes,
      collage: project.collage,
      drawingStrokes: project.drawingStrokes,
      colorManagement: project.colorManagement,
      historyIndex: project.historyIndex ?? 0,
    });

    const newRecord: ProjectVersionRecord = {
      id: `ver_${project.id}_${Date.now()}`,
      projectId: project.id,
      name: newVersionName.trim(),
      description: newVersionDesc.trim() || undefined,
      timestamp: Date.now(),
      thumbnailDataUrl: thumbUrl,
      schemaVersion: 3,
      revision: project.cloudRevision || 1,
      document: docState,
    };

    await saveProjectVersionRecord(newRecord);
    setNewVersionName('');
    setNewVersionDesc('');
    setIsCreating(false);
    await loadVersions();
    showToast?.('success', 'Version Snapshot Created', `Saved "${newRecord.name}"`);
  };

  const handleRestoreVersion = (ver: ProjectVersionRecord) => {
    const doc = sanitizeDocumentState(ver.document);

    const historyStep: EditHistorySnapshot = {
      id: `step_ver_${Date.now()}`,
      timestamp: Date.now(),
      label: `Restored Version: ${ver.name}`,
      settings: { ...doc.currentSettings },
      toneCurves: { ...doc.toneCurves },
      hsl: { ...doc.hsl },
      crop: { ...doc.crop },
      activePresetId: doc.activePresetId,
      presetStrength: doc.presetStrength,
      watermark: { ...doc.watermark },
      border: { ...doc.border },
      masks: [...doc.masks],
      typography: [...(doc.typography || [])],
      designElements: [...(doc.designElements || [])],
      retouchStrokes: [...(doc.retouchStrokes || [])],
      drawingStrokes: [...(doc.drawingStrokes || [])],
      collage: doc.collage ? { ...doc.collage } : undefined,
    };

    const newHistory = [...(project.history || []), historyStep];

    const updated: Project = {
      ...project,
      currentSettings: doc.currentSettings,
      crop: doc.crop,
      toneCurves: doc.toneCurves,
      hsl: doc.hsl,
      activePresetId: doc.activePresetId,
      presetStrength: doc.presetStrength,
      watermark: doc.watermark,
      border: doc.border,
      masks: doc.masks,
      layers: doc.layers,
      typography: doc.typography,
      designElements: doc.designElements,
      retouchStrokes: doc.retouchStrokes,
      collage: doc.collage,
      drawingStrokes: doc.drawingStrokes,
      colorManagement: doc.colorManagement,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      updatedAt: Date.now(),
    };

    onUpdateProject(updated);
    showToast?.('success', 'Version Restored', `Loaded state from "${ver.name}"`);
    onClose();
  };

  const handleDeleteVersion = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteProjectVersionRecord(id);
    await loadVersions();
    showToast?.('info', 'Version Deleted', 'Removed snapshot.');
  };

  const handleDuplicateVersion = async (ver: ProjectVersionRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const copy: ProjectVersionRecord = {
      ...ver,
      id: `ver_${project.id}_${Date.now()}_copy`,
      name: `${ver.name} (Copy)`,
      timestamp: Date.now(),
    };
    await saveProjectVersionRecord(copy);
    await loadVersions();
    showToast?.('success', 'Version Duplicated', `Created "${copy.name}"`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl shadow-black/60 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Version Control
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {versions.length} snapshot{versions.length !== 1 ? 's' : ''}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Project Version Snapshots
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
          {/* Create Version Bar */}
          {!isCreating ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Save Current State as Snapshot</h4>
                <p className="text-[11px] text-slate-400">
                  Capture all non-destructive adjustments, masks, retouching, and typography without duplicating source images.
                </p>
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>New Snapshot</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/50 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <GitCommit className="w-4 h-4 text-indigo-400" />
                <span>Create New Version Snapshot</span>
              </h4>
              <input
                type="text"
                placeholder="Version name (e.g. Cinema Warm Tone, B&W High Contrast, Final Client Pick)..."
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
              />
              <textarea
                placeholder="Optional notes or recipe description..."
                value={newVersionDesc}
                onChange={(e) => setNewVersionDesc(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none resize-none"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVersion}
                  disabled={!newVersionName.trim()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Snapshot</span>
                </button>
              </div>
            </div>
          )}

          {/* Versions Grid */}
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              Loading snapshots from IndexedDB...
            </div>
          ) : versions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <GitCommit className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-xs font-bold text-slate-300">No Version Snapshots Saved Yet</div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Create snapshots to experiment with different looks, grades, and crops without losing your current edit.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {versions.map((ver) => {
                const formatted = new Date(ver.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={ver.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="flex gap-3 items-start">
                      <div className="w-20 h-16 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                        {ver.thumbnailDataUrl ? (
                          <img
                            src={ver.thumbnailDataUrl}
                            alt={ver.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{ver.name}</h4>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{formatted}</span>
                        </div>
                        {ver.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                            {ver.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Meta stats */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-900">
                      <span>Masks: {ver.document.masks?.length || 0}</span>
                      <span>•</span>
                      <span>Layers: {ver.document.layers?.length || 0}</span>
                      {ver.document.activePresetId && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-400 truncate">
                            {ver.document.activePresetId}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleDuplicateVersion(ver, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                          title="Duplicate snapshot"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteVersion(ver.id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors"
                          title="Delete snapshot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRestoreVersion(ver)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Non-destructive version tree stored safely in local IndexedDB.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
