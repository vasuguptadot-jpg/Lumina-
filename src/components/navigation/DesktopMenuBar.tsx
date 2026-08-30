/**
 * Lumina Studio Pro - Desktop Native-Style Studio Menu Bar
 * High-precision menu bar with standard File, Edit, View, Image, Layer, Select, Tools, Cloud, Help menus,
 * integrated with InputManager shortcuts, cloud sync indicator, and hardware tier badge.
 * 
 * Strict 3-Color Hierarchy: #050505 (Black), #7A0F18 (Dark Red), #E6E3DE (Greyish White).
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  FolderOpen,
  Save,
  Download,
  RotateCcw,
  RotateCw,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize,
  HelpCircle,
  Cloud,
  Settings,
  Cpu,
  Layers,
  Sparkles,
  Camera,
  Share2,
  FileImage,
  ChevronDown,
  User as UserIcon,
  Check,
  Zap,
} from 'lucide-react';
import { inputManager } from '../../services/inputManager';
import { hardwareDetector } from '../../services/hardwareDetector';
import { Project } from '../../types/editor';
import { MainNavTab } from '../../types/navigation';
import { User } from 'firebase/auth';
import { AIPrivacyBadge } from '../common/AIPrivacyBadge';

export interface DesktopMenuBarProps {
  project: Project;
  activeTab?: MainNavTab;
  onSelectTab?: (tab: MainNavTab) => void;
  onNewProject: () => void;
  onImportRaw?: () => void;
  onOpenRaw?: () => void;
  onImportImage?: () => void;
  onSaveProject: () => void;
  onOpenExportModal?: () => void;
  onExportProject?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onToggleFullscreen: () => void;
  onResetAdjustments: () => void;
  onAutoEnhance: () => void;
  onToggleCompare?: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenFeatureExplorer: () => void;
  onOpenSearch?: () => void;
  onOpenAICreativeDirector?: () => void;
  onOpenCloudModal?: () => void;
  onOpenCloudHub?: () => void;
  onOpenCollaborationModal?: () => void;
  onOpenCollaboration?: () => void;
  onOpenPerformanceModal?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenSecurityModal?: () => void;
  currentUser?: User | null;
  onOpenAuth?: () => void;
}

export const DesktopMenuBar: React.FC<DesktopMenuBarProps> = ({
  project,
  activeTab,
  onSelectTab,
  onNewProject,
  onImportRaw,
  onOpenRaw,
  onImportImage,
  onSaveProject,
  onOpenExportModal,
  onExportProject,
  onUndo,
  onRedo,
  canUndo = true,
  canRedo = true,
  onToggleFullscreen,
  onResetAdjustments,
  onAutoEnhance,
  onToggleCompare,
  onOpenSettings,
  onOpenShortcuts,
  onOpenFeatureExplorer,
  onOpenSearch,
  onOpenAICreativeDirector,
  onOpenCloudModal,
  onOpenCloudHub,
  onOpenCollaborationModal,
  onOpenCollaboration,
  onOpenPerformanceModal,
  onOpenDiagnostics,
  onOpenSecurityModal,
  currentUser,
  onOpenAuth,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);
  const mod = inputManager.getModifierKeyName();
  const shift = inputManager.getShiftKeyName();
  const alt = inputManager.getAltKeyName();

  const hwProfile = hardwareDetector.getProfile();

  const handleRaw = onOpenRaw || onImportRaw;
  const handleExport = onOpenExportModal || onExportProject;
  const handleCloud = onOpenCloudHub || onOpenCloudModal;
  const handleCollab = onOpenCollaboration || onOpenCollaborationModal;
  const handlePerf = onOpenDiagnostics || onOpenPerformanceModal;

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const handleMenuHover = (menuName: string) => {
    if (openMenu !== null) {
      setOpenMenu(menuName);
    }
  };

  const executeAction = (action?: () => void) => {
    setOpenMenu(null);
    if (action) action();
  };

  return (
    <header
      ref={menuBarRef}
      id="lumina-desktop-menubar"
      className="hidden md:flex items-center justify-between h-9 bg-[#050505] border-b border-[rgba(230,227,222,0.08)] px-3 select-none z-40 text-xs font-sans text-[rgba(230,227,222,0.70)]"
    >
      {/* Left: Brand + Menus */}
      <div className="flex items-center space-x-1">
        {/* Brand Mark */}
        <div className="flex items-center space-x-1.5 pr-2.5 mr-1 border-r border-[rgba(230,227,222,0.08)]">
          <div className="w-3.5 h-3.5 rounded-full border border-[rgba(230,227,222,0.6)] flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-[#7A0F18] rounded-full" />
          </div>
          <span className="font-semibold tracking-wider text-[#E6E3DE] text-[11px] font-mono">
            LUMINA
          </span>
        </div>

        {/* File Menu */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('file')}
            onMouseEnter={() => handleMenuHover('file')}
            className={`px-2 py-1 rounded transition-colors ${
              openMenu === 'file'
                ? 'bg-[#7A0F18] text-[#E6E3DE]'
                : 'text-[rgba(230,227,222,0.70)] hover:bg-[rgba(230,227,222,0.06)] hover:text-[#E6E3DE]'
            }`}
          >
            File
          </button>
          {openMenu === 'file' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-[#050505] border border-[rgba(230,227,222,0.12)] rounded-md shadow-2xl py-1 z-50 animate-fade-in">
              <button
                onClick={() => executeAction(onNewProject)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors"
              >
                <span>New Project</span>
                <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">{mod}+N</span>
              </button>
              {handleRaw && (
                <button
                  onClick={() => executeAction(handleRaw)}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors"
                >
                  <span>Open RAW File...</span>
                  <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">{mod}+O</span>
                </button>
              )}
              {onImportImage && (
                <button
                  onClick={() => executeAction(onImportImage)}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors"
                >
                  <span>Import Photo...</span>
                  <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">{mod}+{shift}+I</span>
                </button>
              )}
              <div className="my-1 border-t border-[rgba(230,227,222,0.08)]" />
              <button
                onClick={() => executeAction(onSaveProject)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors"
              >
                <span>Save Project</span>
                <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">{mod}+S</span>
              </button>
              {handleExport && (
                <button
                  onClick={() => executeAction(handleExport)}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors"
                >
                  <span>Export Image...</span>
                  <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">{mod}+E</span>
                </button>
              )}
              {onOpenSecurityModal && (
                <>
                  <div className="my-1 border-t border-[rgba(230,227,222,0.08)]" />
                  <button
                    onClick={() => executeAction(onOpenSecurityModal)}
                    className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors"
                  >
                    <span>Vault Security & Lock</span>
                    <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">{mod}+{alt}+L</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('edit')}
            onMouseEnter={() => handleMenuHover('edit')}
            className={`px-2 py-1 rounded transition-colors ${
              openMenu === 'edit'
                ? 'bg-[#7A0F18] text-[#E6E3DE]'
                : 'text-[rgba(230,227,222,0.70)] hover:bg-[rgba(230,227,222,0.06)] hover:text-[#E6E3DE]'
            }`}
          >
            Edit
          </button>
          {openMenu === 'edit' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-[#050505] border border-[rgba(230,227,222,0.12)] rounded-md shadow-2xl py-1 z-50 animate-fade-in">
              <button
                onClick={() => executeAction(onUndo)}
                disabled={!canUndo}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors disabled:opacity-40"
              >
                <span>Undo</span>
                <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">{mod}+Z</span>
              </button>
              <button
                onClick={() => executeAction(onRedo)}
                disabled={!canRedo}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors disabled:opacity-40"
              >
                <span>Redo</span>
                <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">{mod}+{shift}+Z</span>
              </button>
              <div className="my-1 border-t border-[rgba(230,227,222,0.08)]" />
              <button
                onClick={() => executeAction(onResetAdjustments)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors"
              >
                <span>Reset All Adjustments</span>
                <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">{mod}+{alt}+R</span>
              </button>
              <button
                onClick={() => executeAction(onAutoEnhance)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors"
              >
                <span>Auto Enhance Studio</span>
                <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">{mod}+{alt}+A</span>
              </button>
              <div className="my-1 border-t border-[rgba(230,227,222,0.08)]" />
              <button
                onClick={() => executeAction(onOpenSettings)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors"
              >
                <span>Preferences & Settings...</span>
                <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">{mod}+,</span>
              </button>
            </div>
          )}
        </div>

        {/* View Menu */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('view')}
            onMouseEnter={() => handleMenuHover('view')}
            className={`px-2 py-1 rounded transition-colors ${
              openMenu === 'view'
                ? 'bg-[#7A0F18] text-[#E6E3DE]'
                : 'text-[rgba(230,227,222,0.70)] hover:bg-[rgba(230,227,222,0.06)] hover:text-[#E6E3DE]'
            }`}
          >
            View
          </button>
          {openMenu === 'view' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-[#050505] border border-[rgba(230,227,222,0.12)] rounded-md shadow-2xl py-1 z-50 animate-fade-in">
              {onToggleCompare && (
                <button
                  onClick={() => executeAction(onToggleCompare)}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors"
                >
                  <span>Compare Before / After</span>
                  <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">\</span>
                </button>
              )}
              <button
                onClick={() => executeAction(onToggleFullscreen)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors"
              >
                <span>Toggle Fullscreen</span>
                <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">F</span>
              </button>
              {handlePerf && (
                <>
                  <div className="my-1 border-t border-[rgba(230,227,222,0.08)]" />
                  <button
                    onClick={() => executeAction(handlePerf)}
                    className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors"
                  >
                    <span>Hardware & GPU Monitor</span>
                    <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">{mod}+P</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Cloud & Collaboration */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('cloud')}
            onMouseEnter={() => handleMenuHover('cloud')}
            className={`px-2 py-1 rounded transition-colors ${
              openMenu === 'cloud'
                ? 'bg-[#7A0F18] text-[#E6E3DE]'
                : 'text-[rgba(230,227,222,0.70)] hover:bg-[rgba(230,227,222,0.06)] hover:text-[#E6E3DE]'
            }`}
          >
            Cloud
          </button>
          {openMenu === 'cloud' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-[#050505] border border-[rgba(230,227,222,0.12)] rounded-md shadow-2xl py-1 z-50 animate-fade-in">
              {handleCloud && (
                <button
                  onClick={() => executeAction(handleCloud)}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors"
                >
                  <span>Cloud Vault & Sync</span>
                  <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">Synced</span>
                </button>
              )}
              {handleCollab && (
                <button
                  onClick={() => executeAction(handleCollab)}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors"
                >
                  <span>Realtime Collaboration...</span>
                  <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">Live</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Help Menu */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('help')}
            onMouseEnter={() => handleMenuHover('help')}
            className={`px-2 py-1 rounded transition-colors ${
              openMenu === 'help'
                ? 'bg-[#7A0F18] text-[#E6E3DE]'
                : 'text-[rgba(230,227,222,0.70)] hover:bg-[rgba(230,227,222,0.06)] hover:text-[#E6E3DE]'
            }`}
          >
            Help
          </button>
          {openMenu === 'help' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-[#050505] border border-[rgba(230,227,222,0.12)] rounded-md shadow-2xl py-1 z-50 animate-fade-in">
              <button
                onClick={() => executeAction(onOpenShortcuts)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors"
              >
                <span>Keyboard Shortcuts Guide</span>
                <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">?</span>
              </button>
              <button
                onClick={() => executeAction(onOpenFeatureExplorer)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors"
              >
                <span>Feature & Tool Explorer</span>
                <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">{mod}+K</span>
              </button>
              {onOpenAICreativeDirector && (
                <button
                  onClick={() => executeAction(onOpenAICreativeDirector)}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[#E6E3DE] hover:bg-[#7A0F18] transition-colors"
                >
                  <span>AI Creative Director...</span>
                  <span className="text-[10px] text-[rgba(230,227,222,0.45)] font-mono">AI</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center: Active Project Name */}
      <div className="hidden lg:flex items-center space-x-2">
        <span className="text-[rgba(230,227,222,0.45)] text-[10px] font-mono">PROJECT:</span>
        <span className="text-[#E6E3DE] font-medium text-xs truncate max-w-xs">
          {project.name || 'Untitled Studio Project'}
        </span>
        {project.isRaw && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[rgba(230,227,222,0.06)] text-[#E6E3DE] border border-[rgba(230,227,222,0.15)]">
            RAW 16-BIT
          </span>
        )}
      </div>

      {/* Right: Cloud status + Hardware tier + Settings + User */}
      <div className="flex items-center space-x-2.5">
        {/* AI Privacy & Sovereignty Badge */}
        <AIPrivacyBadge onOpenSettings={onOpenSettings} />

        {/* Hardware Tier Badge */}
        {handlePerf && (
          <button
            onClick={handlePerf}
            title={`Hardware Acceleration: ${hwProfile.tierName}`}
            className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[rgba(230,227,222,0.04)] border border-[rgba(230,227,222,0.10)] text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] hover:border-[#7A0F18] transition-colors"
          >
            <Cpu className="w-3 h-3 text-[#E6E3DE]" />
            <span className="text-[10px] font-mono uppercase">
              {hwProfile.tier === 'TIER_1_HIGH_END'
                ? 'Tier 1'
                : hwProfile.tier === 'TIER_2_PERFORMANCE'
                ? 'Tier 2'
                : hwProfile.tier === 'TIER_3_STANDARD'
                ? 'Tier 3'
                : 'Tier 4'}
            </span>
          </button>
        )}

        {/* Cloud Sync Status */}
        {handleCloud && (
          <button
            onClick={handleCloud}
            title="Cloud Project Synchronization"
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[rgba(230,227,222,0.04)] border border-[rgba(230,227,222,0.10)] text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] hover:border-[#7A0F18] transition-colors"
          >
            <Cloud className="w-3 h-3 text-[#E6E3DE]" />
            <span className="text-[10px] font-mono">Vault</span>
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          title="Preferences & Settings"
          className="p-1 rounded text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.06)] transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Account / User Avatar */}
        <button
          onClick={onOpenAuth || onOpenSettings}
          title={currentUser ? `Signed in as ${currentUser.displayName || currentUser.email}` : 'Sign in'}
          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#050505] border border-[rgba(230,227,222,0.20)] text-[#E6E3DE] hover:border-[#7A0F18] transition-colors"
        >
          <UserIcon className="w-3 h-3 text-[#E6E3DE]" />
          <span className="text-[10px] font-mono truncate max-w-[80px]">
            {currentUser?.displayName?.split(' ')[0] || (currentUser?.email ? currentUser.email.split('@')[0] : 'Account')}
          </span>
        </button>
      </div>
    </header>
  );
};
