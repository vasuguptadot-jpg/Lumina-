import React, { useState } from 'react';
import { History, Bookmark, Plus, Check, Clock } from 'lucide-react';
import { EditHistorySnapshot, Project } from '../../../types/editor';

interface HistoryPanelProps {
  project: Project;
  onRestoreSnapshot: (snapshot: EditHistorySnapshot) => void;
  onCreateSnapshot: (name: string) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  project,
  onRestoreSnapshot,
  onCreateSnapshot,
}) => {
  const [snapshotName, setSnapshotName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotName.trim()) return;
    onCreateSnapshot(snapshotName.trim());
    setSnapshotName('');
    setIsCreating(false);
  };

  return (
    <div className="p-4 space-y-5 select-none overflow-y-auto max-h-full pb-16">
      {/* Snapshots Bookmark Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            Project Snapshots
          </span>
        </div>

        {isCreating ? (
          <form onSubmit={handleCreate} className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-2">
            <input
              type="text"
              placeholder="Snapshot name (e.g. Version 2 - Warm Tone)"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-1.5 rounded-lg outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Create Snapshot Bookmark</span>
          </button>
        )}

        {project.snapshots && project.snapshots.length > 0 && (
          <div className="space-y-1.5">
            {project.snapshots.map((snap) => (
              <button
                key={snap.id}
                onClick={() => onRestoreSnapshot(snap.data)}
                className="w-full p-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl text-left flex items-center justify-between transition-colors group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300">
                    {snap.name}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{new Date(snap.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Restore
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Edit Steps Stack */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
          <History className="w-3.5 h-3.5 text-indigo-400" />
          Edit History Stack ({project.history?.length || 0} steps)
        </div>

        <div className="space-y-1">
          {project.history?.map((step, idx) => {
            const isCurrent = idx === project.historyIndex;
            return (
              <button
                key={step.id}
                onClick={() => onRestoreSnapshot(step)}
                className={`w-full p-2 rounded-lg text-left text-xs transition-colors flex items-center justify-between ${
                  isCurrent
                    ? 'bg-indigo-950/60 border border-indigo-500/50 text-indigo-300 font-bold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-indigo-400 ring-2 ring-indigo-400/30' : 'bg-slate-600'}`} />
                  <span>{step.label || 'Adjustment'}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
