/**
 * Lumina Studio Pro - 3-Way Semantic Conflict Resolution Dialog
 * Displays side-by-side granular property diffs and empowers the user to choose resolution strategy without data loss.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  GitMerge,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  Upload,
  X,
  Layers,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { ProjectConflictReport, ConflictResolutionChoice } from '../../types/cloudSync';
import { cloudSyncEngine } from '../../services/cloudSyncEngine';
import { Project } from '../../types/editor';

interface CloudConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflictReport: ProjectConflictReport | null;
  onResolved: (resolvedProject: Project) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const CloudConflictModal: React.FC<CloudConflictModalProps> = ({
  isOpen,
  onClose,
  conflictReport,
  onResolved,
  showToast,
}) => {
  const [selectedPicks, setSelectedPicks] = useState<Record<string, 'LOCAL' | 'REMOTE'>>({});
  const [isResolving, setIsResolving] = useState(false);

  if (!isOpen || !conflictReport) return null;

  const handlePickToggle = (path: string, choice: 'LOCAL' | 'REMOTE') => {
    setSelectedPicks((prev) => ({
      ...prev,
      [path]: choice,
    }));
  };

  const executeResolution = async (choice: ConflictResolutionChoice) => {
    setIsResolving(true);
    try {
      const resolved = await cloudSyncEngine.resolveActiveConflict(choice, selectedPicks);
      onResolved(resolved);
      showToast?.(
        'success',
        'Conflict Resolved',
        `Successfully applied ${choice === 'SEMANTIC_MERGE' ? 'Smart Semantic Merge' : choice} strategy.`
      );
      onClose();
    } catch (err: any) {
      showToast?.('error', 'Resolution Failed', err.message || 'Failed to resolve conflict');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Multi-Device Conflict Detected</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Rev {conflictReport.localVersion} vs Cloud Rev {conflictReport.cloudVersion}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Project &ldquo;{conflictReport.projectName}&rdquo; was modified on another device simultaneously.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diff Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Summary Banner */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">
                {conflictReport.conflictedProperties.length} Direct Conflict(s),{' '}
                {conflictReport.autoMergedProperties.length} Auto-Mergeable Property(ies)
              </div>
              <div className="text-[11px] text-slate-400">
                Lumina has isolated conflicting parameters to protect your work from being overwritten.
              </div>
            </div>
          </div>

          {/* Conflicted Properties List */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Conflicted Settings (Choose which value to keep)
            </div>

            {conflictReport.conflictedProperties.map((prop) => {
              const currentPick = selectedPicks[prop.propertyPath] || 'LOCAL';

              return (
                <div
                  key={prop.propertyPath}
                  className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{prop.propertyLabel}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Base: {String(prop.baseValue)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Local Choice */}
                    <button
                      type="button"
                      onClick={() => handlePickToggle(prop.propertyPath, 'LOCAL')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        currentPick === 'LOCAL'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-indigo-300 flex items-center justify-between">
                        <span>This Device (Local)</span>
                        {currentPick === 'LOCAL' && <CheckCircle2 className="w-3 h-3 text-indigo-400" />}
                      </div>
                      <div className="font-mono text-xs font-bold text-slate-200 mt-1">
                        {String(prop.localValue)}
                      </div>
                    </button>

                    {/* Remote Choice */}
                    <button
                      type="button"
                      onClick={() => handlePickToggle(prop.propertyPath, 'REMOTE')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        currentPick === 'REMOTE'
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-purple-300 flex items-center justify-between">
                        <span>Cloud (Remote)</span>
                        {currentPick === 'REMOTE' && <CheckCircle2 className="w-3 h-3 text-purple-400" />}
                      </div>
                      <div className="font-mono text-xs font-bold text-slate-200 mt-1">
                        {String(prop.remoteValue)}
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Auto Merged List */}
          {conflictReport.autoMergedProperties.length > 0 && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1.5">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Auto-Mergeable Independent Adjustments ({conflictReport.autoMergedProperties.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {conflictReport.autoMergedProperties.map((p) => (
                  <span
                    key={p.propertyPath}
                    className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/30 rounded text-[10px] font-medium text-emerald-300"
                  >
                    {p.propertyLabel}: {String(p.mergedValue)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Strategy Buttons Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            disabled={isResolving}
            onClick={() => executeResolution('CREATE_COPY')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Saves this device's version as a separate branch copy to keep both versions intact"
          >
            <Copy className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fork as New Copy</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isResolving}
              onClick={() => executeResolution('KEEP_CLOUD')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-purple-900/60 border border-slate-700 hover:border-purple-500/50 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Accept Cloud State</span>
            </button>

            <button
              type="button"
              disabled={isResolving}
              onClick={() => executeResolution('KEEP_LOCAL')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-indigo-900/60 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Keep Local State</span>
            </button>

            <button
              type="button"
              disabled={isResolving}
              onClick={() => executeResolution('SEMANTIC_MERGE')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Apply Smart Merge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
