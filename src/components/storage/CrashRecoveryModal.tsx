import React, { useState } from 'react';
import {
  ShieldAlert,
  RotateCcw,
  GitBranch,
  Trash2,
  Clock,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  X,
  FileText,
} from 'lucide-react';
import { RecoverySnapshotRecord } from '../../types/projectSchema';
import { Project } from '../../types/editor';
import {
  restoreProjectFromRecovery,
  discardRecoverySnapshot,
} from '../../storage/crashRecoveryEngine';

interface CrashRecoveryModalProps {
  recoverableItems: Array<{
    snapshot: RecoverySnapshotRecord;
    existingProject: Project | null;
  }>;
  onRecover: (restoredProject: Project) => void;
  onDismiss: () => void;
}

export const CrashRecoveryModal: React.FC<CrashRecoveryModalProps> = ({
  recoverableItems,
  onRecover,
  onDismiss,
}) => {
  const [items, setItems] = useState(recoverableItems);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  if (items.length === 0) return null;

  const currentItem = items[selectedIndex] || items[0];
  const { snapshot, existingProject } = currentItem;

  const handleRestore = async (asNewBranch: boolean) => {
    setIsProcessing(true);
    try {
      const restored = await restoreProjectFromRecovery(snapshot, asNewBranch);
      onRecover(restored);
    } catch (err) {
      console.error('Failed to restore project:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDiscard = async (snapshotId: string) => {
    await discardRecoverySnapshot(snapshotId);
    const remaining = items.filter((it) => it.snapshot.id !== snapshotId);
    if (remaining.length === 0) {
      onDismiss();
    } else {
      setItems(remaining);
      setSelectedIndex(0);
    }
  };

  const formattedTime = new Date(snapshot.timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const maskCount = snapshot.document.masks?.length || 0;
  const layerCount = snapshot.document.layers?.length || 0;
  const retouchCount = snapshot.document.retouchStrokes?.length || 0;
  const drawingCount = snapshot.document.drawingStrokes?.length || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/60 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Crash Recovery
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {items.length} uncommitted session{items.length > 1 ? 's' : ''}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Unsaved Project Changes Detected
              </h2>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <p className="text-xs text-slate-300 leading-relaxed">
            Lumina Studio Pro detected an autosaved recovery snapshot from a previous session that was
            interrupted (e.g. browser crash, tab closure, or power interruption). You can restore the
            unsaved modifications or discard them.
          </p>

          {/* If multiple recoverable projects */}
          {items.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {items.map((it, idx) => (
                <button
                  key={it.snapshot.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                    selectedIndex === idx
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {it.snapshot.projectName}
                </button>
              ))}
            </div>
          )}

          {/* Project Snapshot Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row gap-4 items-start">
            {/* Thumbnail */}
            <div className="w-full sm:w-44 h-32 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center relative">
              {snapshot.thumbnailDataUrl ? (
                <img
                  src={snapshot.thumbnailDataUrl}
                  alt={snapshot.projectName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileText className="w-8 h-8 text-slate-600" />
              )}
              <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-mono bg-black/70 text-slate-300 backdrop-blur-xs">
                Rev #{snapshot.revision}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 space-y-2.5 w-full">
              <div>
                <h3 className="text-sm font-bold text-white">{snapshot.projectName}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Last autosaved: {formattedTime}</span>
                </div>
              </div>

              {/* State Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">Masks</div>
                  <div className="text-xs font-bold text-indigo-300">{maskCount}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">Layers</div>
                  <div className="text-xs font-bold text-indigo-300">{layerCount}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">Retouch</div>
                  <div className="text-xs font-bold text-indigo-300">{retouchCount}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">Drawings</div>
                  <div className="text-xs font-bold text-indigo-300">{drawingCount}</div>
                </div>
              </div>

              {snapshot.document.activePresetId && (
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Preset applied: <strong className="text-slate-200">{snapshot.document.activePresetId}</strong> ({snapshot.document.presetStrength}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            onClick={() => handleDiscard(snapshot.id)}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>Discard Unsaved Changes</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRestore(true)}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center justify-center gap-2 active:scale-95"
              title="Save as a separate project branch and keep original untouched"
            >
              <GitBranch className="w-4 h-4 text-purple-400" />
              <span>Save as New Branch</span>
            </button>

            <button
              onClick={() => handleRestore(false)}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restore & Resume Edit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
