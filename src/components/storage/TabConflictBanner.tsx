import React from 'react';
import { AlertTriangle, RefreshCw, GitBranch, X } from 'lucide-react';
import { TabSyncMessage } from '../../types/projectSchema';

interface TabConflictBannerProps {
  conflict: TabSyncMessage;
  onReload: () => void;
  onFork: () => void;
  onDismiss: () => void;
}

export const TabConflictBanner: React.FC<TabConflictBannerProps> = ({
  conflict,
  onReload,
  onFork,
  onDismiss,
}) => {
  return (
    <div className="fixed top-16 right-4 z-50 max-w-md w-full bg-slate-900/95 border border-amber-500/50 rounded-2xl p-4 shadow-2xl shadow-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-300">Project Modified in Another Tab</h4>
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            {conflict.projectName ? `"${conflict.projectName}"` : 'This project'} was saved in
            another browser tab (Revision #{conflict.revision}).
          </p>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onReload}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reload Latest</span>
            </button>

            <button
              onClick={onFork}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1"
            >
              <GitBranch className="w-3 h-3 text-purple-400" />
              <span>Save as New Copy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
