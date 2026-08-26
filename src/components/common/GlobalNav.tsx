import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  FolderOpen,
  Sliders,
  Sparkles,
  Type,
  Palette,
  Layers,
  Cloud,
  Settings,
  Search,
  Undo2,
  Redo2,
  Download,
  Menu,
  X,
  Zap,
  Terminal,
  Camera,
  ChevronDown,
  BrainCircuit,
  Grid,
  Shield,
  Clock,
  Share2,
} from 'lucide-react';
import { MainNavTab, UserSkillMode } from '../../types/navigation';
import { Project } from '../../types/editor';
import { DirtyStateIndicator } from '../storage/DirtyStateIndicator';
import { CloudSyncStatusIndicator } from '../cloud/CloudSyncStatusIndicator';
import { CollaboratorPresenceBar } from '../cloud/CollaboratorPresenceBar';
import { ProjectConflictReport } from '../../types/cloudSync';

interface GlobalNavProps {
  activeTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  skillMode: UserSkillMode;
  onToggleSkillMode: () => void;
  onOpenSearch: () => void;
  onOpenFeatureExplorer: () => void;
  onOpenAICreativeDirector: () => void;
  onOpenExport: () => void;
  onOpenGroqSettings: () => void;
  project: Project | null;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenVersions?: () => void;
  onOpenStorageVault?: () => void;
  onOpenCloudHub?: () => void;
  onOpenConflictModal?: (report: ProjectConflictReport) => void;
  onOpenCollaborationModal?: () => void;
  onOpenDiagnostics?: () => void;
  onNewEdit?: () => void;
  onImportRaw?: () => void;
  onOpenDesignStudio?: () => void;
  onOpenCollage?: () => void;
}

export const GlobalNav: React.FC<GlobalNavProps> = ({
  activeTab,
  onSelectTab,
  skillMode,
  onToggleSkillMode,
  onOpenSearch,
  onOpenFeatureExplorer,
  onOpenAICreativeDirector,
  onOpenExport,
  onOpenGroqSettings,
  project,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onOpenVersions,
  onOpenStorageVault,
  onOpenCloudHub,
  onOpenCollaborationModal,
  onOpenDiagnostics,
  onNewEdit,
  onImportRaw,
  onOpenDesignStudio,
  onOpenCollage,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const CATEGORIES = [
    {
      id: 'create',
      label: 'CREATE',
      items: [
        { label: '+ New Edit', action: () => { onNewEdit?.(); onSelectTab('editor'); } },
        { label: 'Open Photo', action: () => onSelectTab('library') },
        { label: 'Import RAW', action: () => onImportRaw?.() },
        { label: 'AI Director', action: () => onOpenAICreativeDirector?.() },
        { label: 'Design Studio', action: () => onOpenDesignStudio?.() },
        { label: 'Collage Studio', action: () => onOpenCollage?.() },
      ],
    },
    {
      id: 'edit',
      label: 'EDIT',
      items: [
        { label: 'Develop & Light', action: () => onSelectTab('editor') },
        { label: 'Color & Curves', action: () => onSelectTab('editor') },
        { label: 'HSL & Grading', action: () => onSelectTab('editor') },
        { label: 'Layers & Masks', action: () => onSelectTab('editor') },
        { label: 'Retouch & Repair', action: () => onSelectTab('editor') },
        { label: 'Presets & Looks', action: () => onSelectTab('presets') },
      ],
    },
    {
      id: 'ai',
      label: 'AI',
      items: [
        { label: 'AI Creative Director', action: () => onOpenAICreativeDirector?.() },
        { label: 'AI Studio Lab', action: () => onSelectTab('aistudio') },
        { label: 'AI Object Removal', action: () => onSelectTab('editor') },
        { label: 'AI Background Cutout', action: () => onSelectTab('editor') },
        { label: 'Neural Super-Resolution', action: () => onSelectTab('editor') },
      ],
    },
    {
      id: 'organize',
      label: 'ORGANIZE',
      items: [
        { label: 'Project Vault', action: () => onSelectTab('projects') },
        { label: 'Photo Library', action: () => onSelectTab('library') },
        { label: 'Version History', action: () => onOpenVersions?.() },
        { label: 'Storage Quota', action: () => onOpenStorageVault?.() },
      ],
    },
    {
      id: 'export',
      label: 'EXPORT',
      items: [
        { label: 'Export Master Asset', action: () => onOpenExport?.() },
        { label: 'Lossless JPEG / PNG / WebP', action: () => onOpenExport?.() },
        { label: '16-Bit TIFF & DNG', action: () => onOpenExport?.() },
      ],
    },
    {
      id: 'cloud',
      label: 'CLOUD',
      items: [
        { label: 'Cloud Vault Sync', action: () => onOpenCloudHub?.() },
        { label: 'Live Collaboration', action: () => onOpenCollaborationModal?.() },
        { label: 'Multi-Tab Sync Status', action: () => onOpenCloudHub?.() },
      ],
    },
    {
      id: 'system',
      label: 'SYSTEM',
      items: [
        { label: 'Engine & GPU Telemetry', action: () => onOpenGroqSettings?.() },
        { label: 'All 130+ Tools Browser', action: () => onOpenFeatureExplorer?.() },
        { label: 'Diagnostics Hub', action: () => onOpenDiagnostics?.() },
      ],
    },
  ];

  return (
    <header className="bg-[#050505] border-b border-[#2A2A2A] z-40 select-none text-zinc-100 font-sans">
      {/* Desktop Master Top Application Bar */}
      <div className="h-11 px-3 sm:px-4 flex items-center justify-between gap-3" ref={dropdownRef}>
        {/* Left: Brand Identity & Telemetry */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-6 h-6 rounded bg-[#141414] border border-[#2A2A2A] flex items-center justify-center group-hover:border-zinc-500 transition-colors">
              <span className="font-mono font-bold text-[11px] text-white">L</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs tracking-wider uppercase text-white">
                Lumina
              </span>
              <span className="text-[9px] uppercase font-mono font-bold px-1 py-0.5 rounded bg-[#141414] text-zinc-400 border border-[#2A2A2A]">
                PRO
              </span>
            </div>
          </div>

          {/* Engine Architecture Indicator */}
          <button
            onClick={onOpenGroqSettings}
            className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border bg-[#0D0D0D] text-zinc-400 border-[#2A2A2A] hover:border-zinc-700 hover:text-zinc-200 transition-colors"
            title="Local GPU/Wasm Architecture"
          >
            <span className="text-zinc-400 text-[10px]">●</span>
            <span>LOCAL ENGINE</span>
          </button>
        </div>

        {/* Center: Categorized Top Navigation Modules (Progressive Disclosure) */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'home'
                ? 'bg-[#141414] text-white border border-[#2A2A2A]'
                : 'text-zinc-400 hover:text-white hover:bg-[#0D0D0D]'
            }`}
          >
            Studio
          </button>

          {CATEGORIES.map((cat) => {
            const isOpen = activeDropdown === cat.id;
            return (
              <div key={cat.id} className="relative">
                <button
                  onClick={() => setActiveDropdown(isOpen ? null : cat.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                    isOpen
                      ? 'bg-[#141414] text-white border border-[#2A2A2A]'
                      : 'text-zinc-400 hover:text-white hover:bg-[#0D0D0D]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                </button>

                {/* Dropdown Popover */}
                {isOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-48 rounded-lg bg-[#0D0D0D] border border-[#2A2A2A] shadow-2xl py-1 z-50 animate-fade-in">
                    {cat.items.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          item.action();
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-[#141414] transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={onOpenFeatureExplorer}
            className="px-2.5 py-1 rounded text-xs font-medium text-zinc-400 hover:text-white hover:bg-[#0D0D0D] transition-colors"
          >
            Tools
          </button>
        </nav>

        {/* Right: Search, Status, Undo/Redo, Export */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Global Search / Command Bar Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0D0D0D] hover:bg-[#141414] text-zinc-400 hover:text-zinc-200 border border-[#2A2A2A] transition-colors text-xs"
            title="Command Palette (Cmd+K / Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Command</span>
            <kbd className="hidden lg:inline text-[9px] font-mono px-1 bg-[#050505] text-zinc-500 border border-[#2A2A2A] rounded">
              ⌘K
            </kbd>
          </button>

          {/* Undo / Redo controls */}
          {onUndo && onRedo && (
            <div className="hidden sm:flex items-center border border-[#2A2A2A] rounded bg-[#0D0D0D] overflow-hidden">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#141414] disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3 h-3" />
              </button>
              <div className="w-[1px] h-3 bg-[#2A2A2A]" />
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#141414] disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
                title="Redo (Ctrl+Y / Shift+Ctrl+Z)"
              >
                <Redo2 className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Sync & Dirty Status */}
          <div className="hidden lg:flex items-center gap-1.5">
            <DirtyStateIndicator />
            {onOpenCloudHub && <CloudSyncStatusIndicator onClick={onOpenCloudHub} />}
          </div>

          {/* Collaboration Presence */}
          {onOpenCollaborationModal && (
            <div className="hidden xl:flex items-center">
              <CollaboratorPresenceBar onOpenModal={onOpenCollaborationModal} />
            </div>
          )}

          {/* Primary Export Button */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-colors shadow-sm"
            title="Export Master Asset (Ctrl+E)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Export</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 rounded text-zinc-400 hover:text-white bg-[#0D0D0D] border border-[#2A2A2A]"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation (Categorized) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#2A2A2A] bg-[#0D0D0D] px-4 py-3 space-y-4 max-h-[75vh] overflow-y-auto">
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider px-1">
                {cat.label}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {cat.items.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      item.action();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-left px-2.5 py-2 rounded bg-[#141414] hover:bg-[#1A1A1A] border border-[#2A2A2A] text-xs text-zinc-200 hover:text-white transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-2 border-t border-[#2A2A2A] flex items-center justify-between">
            <button
              onClick={() => {
                onOpenFeatureExplorer();
                setIsMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-xs font-medium bg-[#141414] text-zinc-200 border border-[#2A2A2A] rounded-lg"
            >
              Explore 130+ Tools
            </button>
            <button
              onClick={() => {
                onOpenExport();
                setIsMobileMenuOpen(false);
              }}
              className="px-4 py-2 text-xs font-semibold bg-white text-black rounded-lg"
            >
              Export
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
