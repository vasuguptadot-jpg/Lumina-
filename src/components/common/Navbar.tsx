import React from 'react';
import {
  Sparkles,
  Sliders,
  Layers,
  Cloud,
  CloudCheck,
  RefreshCw,
  Undo2,
  Redo2,
  RotateCcw,
  Download,
  FolderOpen,
  Image as ImageIcon,
  Keyboard,
  Wand2,
  Laptop,
} from 'lucide-react';
import { Project } from '../../types/editor';

interface NavbarProps {
  project: Project | null;
  activeTab: 'editor' | 'batch' | 'projects' | 'samples';
  onSelectTab: (tab: 'editor' | 'batch' | 'projects' | 'samples') => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onOpenExport: () => void;
  onOpenCloudModal: () => void;
  onOpenShortcuts: () => void;
  onAutoEnhance: () => void;
  isAutoEnhancing: boolean;
  onProjectNameChange?: (name: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  activeTab,
  onSelectTab,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onOpenExport,
  onOpenCloudModal,
  onOpenShortcuts,
  onAutoEnhance,
  isAutoEnhancing,
  onProjectNameChange,
}) => {
  return (
    <header className="h-14 bg-slate-950/90 border-b border-slate-800/80 px-4 flex items-center justify-between backdrop-blur-md z-30 select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 p-[1.5px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">Lumina</span>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30">
                PRO
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-slate-800 hidden md:block" />

        {/* Project Name & Cloud Sync status */}
        {project && activeTab === 'editor' && (
          <div className="flex items-center gap-2 min-w-0">
            <input
              type="text"
              value={project.name}
              onChange={(e) => onProjectNameChange?.(e.target.value)}
              className="bg-transparent hover:bg-slate-900/60 focus:bg-slate-900 text-xs text-slate-200 font-medium px-2 py-1 rounded border border-transparent focus:border-slate-700 outline-none max-w-[140px] sm:max-w-[200px] truncate transition-colors"
              title="Click to rename project"
            />

            {/* Cloud Sync Status Badge */}
            <button
              onClick={onOpenCloudModal}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                project.cloudSyncStatus === 'synced'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40'
                  : project.cloudSyncStatus === 'syncing'
                  ? 'bg-amber-950/40 border-amber-500/30 text-amber-400 hover:bg-amber-900/40 animate-pulse'
                  : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:bg-slate-800'
              }`}
              title="Cloud Sync Status - Click to manage"
            >
              {project.cloudSyncStatus === 'synced' && <CloudCheck className="w-3.5 h-3.5" />}
              {project.cloudSyncStatus === 'syncing' && <RefreshCw className="w-3 h-3 animate-spin" />}
              {project.cloudSyncStatus === 'offline' && <Cloud className="w-3.5 h-3.5 opacity-60" />}
              {project.cloudSyncStatus === 'local-only' && <Laptop className="w-3 h-3" />}
              <span className="hidden sm:inline">
                {project.cloudSyncStatus === 'synced'
                  ? 'Cloud Synced'
                  : project.cloudSyncStatus === 'syncing'
                  ? 'Syncing...'
                  : project.cloudSyncStatus === 'offline'
                  ? 'Offline Mode'
                  : 'Local Storage'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
        <button
          onClick={() => onSelectTab('editor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'editor'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Editor</span>
        </button>

        <button
          onClick={() => onSelectTab('batch')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'batch'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Batch Studio</span>
        </button>

        <button
          onClick={() => onSelectTab('projects')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'projects'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Projects</span>
        </button>

        <button
          onClick={() => onSelectTab('samples')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'samples'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Samples</span>
        </button>
      </nav>

      {/* Editor Action Controls */}
      <div className="flex items-center gap-1.5">
        {activeTab === 'editor' && project && (
          <>
            {/* AI Auto-Enhance Button */}
            <button
              onClick={onAutoEnhance}
              disabled={isAutoEnhancing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20 text-amber-300 border border-amber-500/40 hover:border-amber-400 hover:bg-amber-500/30 transition-all shadow-sm disabled:opacity-50"
              title="1-Click AI Smart Auto-Enhance (Gemini)"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isAutoEnhancing ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline">{isAutoEnhancing ? 'Enhancing...' : 'AI Auto-Tune'}</span>
            </button>

            {/* Undo / Redo */}
            <div className="flex items-center bg-slate-900/80 rounded-lg border border-slate-800 p-0.5">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onReset}
                className="p-1.5 rounded text-slate-400 hover:text-rose-400 transition-colors"
                title="Reset All Adjustments"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Shortcuts Help */}
            <button
              onClick={onOpenShortcuts}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors hidden md:block"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Export High-Res Button */}
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>Export</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
