/**
 * Lumina Studio Pro — Main Application Navbar
 * Strict 3-Color Hierarchy: #050505 (Black), #7A0F18 (Dark Red), #E6E3DE (Greyish White).
 */

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
  Compass,
  Share2,
  Camera,
  Users,
  ShieldCheck,
  Lock,
  Package,
  Zap,
  Code2,
} from 'lucide-react';
import { Project } from '../../types/editor';

interface NavbarProps {
  project: Project | null;
  activeTab: 'library' | 'editor' | 'batch' | 'projects' | 'samples';
  onSelectTab: (tab: 'library' | 'editor' | 'batch' | 'projects' | 'samples') => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onOpenExport: () => void;
  onOpenSocialExport?: () => void;
  onOpenCloudModal: () => void;
  onOpenShortcuts: () => void;
  onAutoEnhance: () => void;
  isAutoEnhancing: boolean;
  onProjectNameChange?: (name: string) => void;
  onOpenCameraStudio?: () => void;
  onOpenCollaboration?: () => void;
  onOpenClientReview?: () => void;
  onOpenPlugins?: () => void;
  onOpenAutomation?: () => void;
  onOpenDeveloperPlatform?: () => void;
  onOpenSecurityGovernance?: () => void;
  onLockVault?: () => void;
  onOpenPerformanceMonitor?: () => void;
  onOpenGroqSettings?: () => void;
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
  onOpenSocialExport,
  onOpenCloudModal,
  onOpenShortcuts,
  onAutoEnhance,
  isAutoEnhancing,
  onProjectNameChange,
  onOpenCameraStudio,
  onOpenCollaboration,
  onOpenPlugins,
  onOpenAutomation,
  onOpenDeveloperPlatform,
  onOpenSecurityGovernance,
  onLockVault,
  onOpenPerformanceMonitor,
  onOpenGroqSettings,
}) => {
  return (
    <header className="h-12 bg-[#050505] border-b border-[rgba(230,227,222,0.08)] px-4 flex items-center justify-between z-30 select-none text-[#E6E3DE]">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#7A0F18] flex items-center justify-center font-mono font-bold text-xs text-[#E6E3DE]">
            L
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-[#E6E3DE]">Lumina</span>
              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-[rgba(230,227,222,0.06)] text-[rgba(230,227,222,0.70)] border border-[rgba(230,227,222,0.12)]">
                PRO
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-[rgba(230,227,222,0.08)] hidden md:block" />

        {/* Project Name & Cloud Sync status */}
        {project && activeTab === 'editor' && (
          <div className="flex items-center gap-2 min-w-0">
            <input
              type="text"
              value={project.name}
              onChange={(e) => onProjectNameChange?.(e.target.value)}
              className="bg-transparent hover:bg-[rgba(230,227,222,0.04)] focus:bg-[#050505] text-xs text-[#E6E3DE] font-medium px-2 py-1 rounded border border-transparent focus:border-[#7A0F18] outline-none max-w-[140px] sm:max-w-[200px] truncate transition-colors font-mono"
              title="Click to rename project"
            />

            {/* Cloud Sync Status Badge */}
            <button
              onClick={onOpenCloudModal}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                project.cloudSyncStatus === 'synced'
                  ? 'bg-[rgba(230,227,222,0.04)] border-[rgba(230,227,222,0.15)] text-[#E6E3DE]'
                  : project.cloudSyncStatus === 'syncing'
                  ? 'bg-[rgba(122,15,24,0.30)] border-[#7A0F18] text-[#E6E3DE] animate-pulse'
                  : 'bg-[#050505] border-[rgba(230,227,222,0.10)] text-[rgba(230,227,222,0.45)]'
              }`}
              title="Cloud Sync Status - Click to manage"
            >
              {project.cloudSyncStatus === 'synced' && <CloudCheck className="w-3.5 h-3.5 text-[#E6E3DE]" />}
              {project.cloudSyncStatus === 'syncing' && <RefreshCw className="w-3 h-3 text-[#7A0F18] animate-spin" />}
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
      <nav className="flex items-center gap-1 bg-[#050505] p-1 rounded-lg border border-[rgba(230,227,222,0.10)]">
        <button
          onClick={() => onSelectTab('library')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'library'
              ? 'bg-[#7A0F18] text-[#E6E3DE] font-semibold'
              : 'text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.06)]'
          }`}
          title="AI Photo Search & Library Management"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Library</span>
        </button>

        <button
          onClick={() => onSelectTab('editor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'editor'
              ? 'bg-[#7A0F18] text-[#E6E3DE] font-semibold'
              : 'text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.06)]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Editor</span>
        </button>

        <button
          onClick={() => onSelectTab('batch')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'batch'
              ? 'bg-[#7A0F18] text-[#E6E3DE] font-semibold'
              : 'text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.06)]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Batch</span>
        </button>

        <button
          onClick={() => onSelectTab('projects')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'projects'
              ? 'bg-[#7A0F18] text-[#E6E3DE] font-semibold'
              : 'text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.06)]'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Projects</span>
        </button>

        <button
          onClick={() => onSelectTab('samples')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'samples'
              ? 'bg-[#7A0F18] text-[#E6E3DE] font-semibold'
              : 'text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.06)]'
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#7A0F18] hover:bg-[#8F141E] text-[#E6E3DE] transition-all disabled:opacity-50"
              title="1-Click AI Smart Auto-Enhance"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isAutoEnhancing ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline">{isAutoEnhancing ? 'Enhancing...' : 'Auto-Tune'}</span>
            </button>

            {/* Undo / Redo */}
            <div className="flex items-center bg-[#050505] rounded-lg border border-[rgba(230,227,222,0.12)] p-0.5">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="p-1.5 rounded text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.08)] disabled:opacity-30 disabled:hover:text-[rgba(230,227,222,0.45)] transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="p-1.5 rounded text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.08)] disabled:opacity-30 disabled:hover:text-[rgba(230,227,222,0.45)] transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onReset}
                className="p-1.5 rounded text-[rgba(230,227,222,0.70)] hover:text-[#7A0F18] transition-colors"
                title="Reset All Adjustments"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Shortcuts Help */}
            <button
              onClick={onOpenShortcuts}
              className="p-2 rounded-lg text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.06)] transition-colors hidden md:block"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Hardware / Engine Telemetry */}
            {onOpenPerformanceMonitor && (
              <button
                onClick={onOpenPerformanceMonitor}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-[#050505] border border-[rgba(230,227,222,0.12)] hover:border-[#7A0F18] text-[#E6E3DE] transition-all"
                title="Hardware & GPU Monitor"
              >
                <Zap className="w-3.5 h-3.5 text-[#7A0F18]" />
                <span className="hidden sm:inline">GPU</span>
              </button>
            )}

            {/* Security Button */}
            {onOpenSecurityGovernance && (
              <button
                onClick={onOpenSecurityGovernance}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-[#050505] border border-[rgba(230,227,222,0.12)] hover:border-[#7A0F18] text-[#E6E3DE] transition-all"
                title="Security & Privacy Governance"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#7A0F18]" />
                <span className="hidden sm:inline">Security</span>
              </button>
            )}

            {/* Lock Vault */}
            {onLockVault && (
              <button
                onClick={onLockVault}
                className="p-2 rounded-lg text-[rgba(230,227,222,0.70)] hover:text-[#7A0F18] hover:bg-[rgba(230,227,222,0.06)] transition-colors"
                title="Lock Studio Vault"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            {/* Collaborate */}
            {onOpenCollaboration && (
              <button
                onClick={onOpenCollaboration}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#050505] border border-[rgba(230,227,222,0.12)] hover:border-[#7A0F18] text-[#E6E3DE] transition-all"
                title="Manage Collaborators"
              >
                <Users className="w-3.5 h-3.5 text-[#E6E3DE]" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}

            {/* Export Primary */}
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#7A0F18] hover:bg-[#8F141E] text-[#E6E3DE] transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
