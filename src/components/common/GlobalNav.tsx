/**
 * Lumina Studio Pro — Global Navigation Bar
 * Strict 3-Color Hierarchy: #050505 (Black), #7A0F18 (Dark Red), #E6E3DE (Greyish White).
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Undo2,
  Redo2,
  Download,
  Menu,
  X,
  ChevronDown,
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
  onOpenSearch,
  onOpenFeatureExplorer,
  onOpenAICreativeDirector,
  onOpenExport,
  onOpenGroqSettings,
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
    <header className="bg-[#050505] border-b border-[rgba(230,227,222,0.08)] z-40 select-none text-[#E6E3DE] font-sans">
      {/* Desktop Master Top Application Bar */}
      <div className="h-11 px-3 sm:px-4 flex items-center justify-between gap-3" ref={dropdownRef}>
        {/* Left: Brand Identity & Telemetry */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-6 h-6 rounded bg-[#7A0F18] flex items-center justify-center">
              <span className="font-mono font-bold text-[11px] text-[#E6E3DE]">L</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs tracking-wider uppercase text-[#E6E3DE]">
                Lumina
              </span>
              <span className="text-[9px] uppercase font-mono font-bold px-1 py-0.5 rounded bg-[rgba(230,227,222,0.06)] text-[rgba(230,227,222,0.70)] border border-[rgba(230,227,222,0.12)]">
                PRO
              </span>
            </div>
          </div>

          {/* Engine Architecture Indicator */}
          <button
            onClick={onOpenGroqSettings}
            className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border bg-[#050505] text-[rgba(230,227,222,0.70)] border-[rgba(230,227,222,0.10)] hover:border-[#7A0F18] hover:text-[#E6E3DE] transition-colors"
            title="Local GPU/Wasm Architecture"
          >
            <span className="text-[#7A0F18] text-[10px]">●</span>
            <span>LOCAL ENGINE</span>
          </button>
        </div>

        {/* Center: Categorized Top Navigation Modules (Progressive Disclosure) */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'home'
                ? 'bg-[#7A0F18] text-[#E6E3DE]'
                : 'text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.06)]'
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
                      ? 'bg-[#7A0F18] text-[#E6E3DE]'
                      : 'text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.06)]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <ChevronDown className="w-3 h-3 text-[rgba(230,227,222,0.45)]" />
                </button>

                {/* Dropdown Popover */}
                {isOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-48 rounded-lg bg-[#050505] border border-[rgba(230,227,222,0.12)] shadow-2xl py-1 z-50 animate-fade-in">
                    {cat.items.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          item.action();
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors"
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
            className="px-2.5 py-1 rounded text-xs font-medium text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.06)] transition-colors"
          >
            Tools
          </button>
        </nav>

        {/* Right: Search, Status, Undo/Redo, Export */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Global Search / Command Bar Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#050505] hover:bg-[rgba(230,227,222,0.06)] text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] border border-[rgba(230,227,222,0.12)] hover:border-[#7A0F18] transition-colors text-xs"
            title="Command Palette (Cmd+K / Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Command</span>
            <kbd className="hidden lg:inline text-[9px] font-mono px-1 bg-[#050505] text-[rgba(230,227,222,0.45)] border border-[rgba(230,227,222,0.12)] rounded">
              ⌘K
            </kbd>
          </button>

          {/* Undo / Redo controls */}
          {onUndo && onRedo && (
            <div className="hidden sm:flex items-center border border-[rgba(230,227,222,0.12)] rounded bg-[#050505] overflow-hidden">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="p-1.5 text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.08)] disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3 h-3" />
              </button>
              <div className="w-[1px] h-3 bg-[rgba(230,227,222,0.12)]" />
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="p-1.5 text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.08)] disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
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
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-[#7A0F18] hover:bg-[#8F141E] text-[#E6E3DE] transition-colors shadow-sm"
            title="Export Master Asset (Ctrl+E)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Export</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 rounded text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] bg-[#050505] border border-[rgba(230,227,222,0.12)]"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation (Categorized) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[rgba(230,227,222,0.08)] bg-[#050505] px-4 py-3 space-y-4 max-h-[75vh] overflow-y-auto">
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-[rgba(230,227,222,0.45)] uppercase tracking-wider px-1">
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
                    className="text-left px-2.5 py-2 rounded bg-[rgba(230,227,222,0.04)] hover:bg-[#7A0F18] border border-[rgba(230,227,222,0.10)] text-xs text-[#E6E3DE] transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-2 border-t border-[rgba(230,227,222,0.08)] flex items-center justify-between">
            <button
              onClick={() => {
                onOpenFeatureExplorer();
                setIsMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-xs font-medium bg-[#050505] text-[#E6E3DE] border border-[rgba(230,227,222,0.15)] rounded-lg hover:border-[#7A0F18]"
            >
              Explore 130+ Tools
            </button>
            <button
              onClick={() => {
                onOpenExport();
                setIsMobileMenuOpen(false);
              }}
              className="px-4 py-2 text-xs font-semibold bg-[#7A0F18] text-[#E6E3DE] hover:bg-[#8F141E] rounded-lg"
            >
              Export
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
