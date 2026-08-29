/**
 * Lumina Studio Pro - Desktop Native-Style Studio Menu Bar
 * High-precision menu bar with standard File, Edit, View, Image, Layer, Select, Tools, Cloud, Help menus,
 * integrated with InputManager shortcuts, cloud sync indicator, and hardware tier badge.
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
import { User } from 'firebase/auth';

interface DesktopMenuBarProps {
  project: Project;
  onNewProject: () => void;
  onImportRaw: () => void;
  onImportImage: () => void;
  onSaveProject: () => void;
  onOpenExportModal: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleFullscreen: () => void;
  onResetAdjustments: () => void;
  onAutoEnhance: () => void;
  onToggleCompare: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenFeatureExplorer: () => void;
  onOpenCloudModal: () => void;
  onOpenCollaborationModal: () => void;
  onOpenPerformanceModal: () => void;
  onOpenSecurityModal: () => void;
  currentUser?: User | null;
  onOpenAuth?: () => void;
}

export const DesktopMenuBar: React.FC<DesktopMenuBarProps> = ({
  project,
  onNewProject,
  onImportRaw,
  onImportImage,
  onSaveProject,
  onOpenExportModal,
  onUndo,
  onRedo,
  onToggleFullscreen,
  onResetAdjustments,
  onAutoEnhance,
  onToggleCompare,
  onOpenSettings,
  onOpenShortcuts,
  onOpenFeatureExplorer,
  onOpenCloudModal,
  onOpenCollaborationModal,
  onOpenPerformanceModal,
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

  const executeAction = (action: () => void) => {
    setOpenMenu(null);
    action();
  };

  return (
    <header
      ref={menuBarRef}
      id="lumina-desktop-menubar"
      className="hidden md:flex items-center justify-between h-9 bg-[#000000] border-b border-[#222222] px-3 select-none z-40 text-xs font-sans text-[#CCCCCC]"
    >
      {/* Left: Brand + Menus */}
      <div className="flex items-center space-x-1">
        {/* Brand Mark */}
        <div className="flex items-center space-x-1.5 pr-2.5 mr-1 border-r border-[#222222]">
          <div className="w-3.5 h-3.5 rounded-full border border-white flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
          <span className="font-semibold tracking-wider text-white text-[11px] font-mono">
            LUMINA
          </span>
        </div>

        {/* File Menu */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('file')}
            onMouseEnter={() => handleMenuHover('file')}
            className={`px-2 py-1 rounded hover:bg-[#1A1A1A] hover:text-white transition-colors ${
              openMenu === 'file' ? 'bg-[#222222] text-white' : ''
            }`}
          >
            File
          </button>
          {openMenu === 'file' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-[#111111] border border-[#2B2B2B] rounded-md shadow-2xl py-1 z-50 animate-fade-in">
              <button
                onClick={() => executeAction(onNewProject)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#222222] hover:text-white"
              >
                <span>New Project</span>
                <span className="text-[10px] text-[#666666] font-mono">{mod}+N</span>
              </button>
              <button
                onClick={() => executeAction(onImportRaw)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#222222] hover:text-white"
              >
                <span>Open RAW File...</span>
                <span className="text-[10px] text-[#666666] font-mono">{mod}+O</span>
              </button>
              <button
                onClick={() => executeAction(onImportImage)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#222222] hover:text-white"
              >
                <span>Import Photo...</span>
                <span className="text-[10px] text-[#666666] font-mono">{mod}+{shift}+I</span>
              </button>
              <div className="my-1 border-t border-[#222222]" />
              <button
                onClick={() => executeAction(onSaveProject)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#222222] hover:text-white"
              >
                <span>Save Project</span>
                <span className="text-[10px] text-[#666666] font-mono">{mod}+S</span>
              </button>
              <button
                onClick={() => executeAction(onOpenExportModal)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#222222] hover:text-white"
              >
                <span>Export Image...</span>
                <span className="text-[10px] text-[#666666] font-mono">{mod}+E</span>
              </button>
              <div className="my-1 border-t border-[#222222]" />
              <button
                onClick={() => executeAction(onOpenSecurityModal)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#222222] hover:text-white"
              >
                <span>Vault Security & Lock</span>
                <span className="text-[10px] text-[#666666] font-mono">{mod}+{alt}+L</span>
              </button>
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('edit')}
            onMouseEnter={() => handleMenuHover('edit')}
            className={`px-2 py-1 rounded hover:bg-[#1A1A1A] hover:text-white transition-colors ${
              openMenu === 'edit' ? 'bg-[#222222] text-white' : ''
            }`}
          >
            Edit
          </button>
          {openMenu === 'edit' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-[#111111] border border-[#2B2B2B] rounded-md shadow-2xl py-1 z-50 animate-fade-in">
              <button
                onClick={() => executeAction(onUndo)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#222222] hover:text-white"
              >
                <span>Undo</span>
                <span className="text-[10px] text-[#666666] font-mono">{mod}+Z</span>
              </button>
              <button
                onClick={() => executeAction(onRedo)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#222222] hover:text-white"
              >
                <span>Redo</span>
                <span className="text-[10px] text-[#666666] font-mono">{mod}+{shift}+Z</span>
              </button>
              <div className="my-1 border-t border-[#222222]" />
              <button
                onClick={() => executeAction(onResetAdjustments)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#222222] hover:text-white"
              >
                <span>Reset All Adjustments</span>
                <span className="text-[10px] text-[#666666] font-mono">{mod}+{alt}+R</span>
              </button>
              <button
                onClick={() => executeAction(onAutoEnhance)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#222222] hover:text-white"
              >
                <span>Auto Enhance Studio</span>
                <span className="text-[10px] text-[#666666] font-mono">{mod}+{alt}+A</span>
              </button>
              <div className="my-1 border-t border-[#222222]" />
              <button
                onClick={() => executeAction(onOpenSettings)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#222222] hover:text-white"
              >
                <span>Preferences & Settings...</span>
                <span className="text-[10px] text-[#666666] font-mono">{mod}+,</span>
              </button>
            </div>
          )}
        </div>

        {/* View Menu */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('view')}
            onMouseEnter={() => handleMenuHover('view')}
            className={`px-2 py-1 rounded hover:bg-[#1A1A1A] hover:text-white transition-colors ${
              openMenu === 'view' ? 'bg-[#222222] text-white' : ''
            }`}
          >
            View
          </button>
          {openMenu === 'view' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-[#111111] border border-[#2B2B2B] rounded-md shadow-2xl py-1 z-50 animate-fade-in">
              <button
                onClick={() => executeAction(onToggleCompare)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#222222] hover:text-white"
              >
                <span>Compare Before / After</span>
                <span className="text-[10px] text-[#666666] font-mono">\</span>
              </button>
              <button
                onClick={() => executeAction(onToggleFullscreen)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#222222] hover:text-white"
              >
                <span>Toggle Fullscreen</span>
                <span className="text-[10px] text-[#666666] font-mono">F</span>
              </button>
              <div className="my-1 border-t border-[#222222]" />
              <button
                onClick={() => executeAction(onOpenPerformanceModal)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#222222] hover:text-white"
              >
                <span>Hardware & GPU Monitor</span>
                <span className="text-[10px] text-[#666666] font-mono">{mod}+P</span>
              </button>
            </div>
          )}
        </div>

        {/* Cloud & Collaboration */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('cloud')}
            onMouseEnter={() => handleMenuHover('cloud')}
            className={`px-2 py-1 rounded hover:bg-[#1A1A1A] hover:text-white transition-colors ${
              openMenu === 'cloud' ? 'bg-[#222222] text-white' : ''
            }`}
          >
            Cloud
          </button>
          {openMenu === 'cloud' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-[#111111] border border-[#2B2B2B] rounded-md shadow-2xl py-1 z-50 animate-fade-in">
              <button
                onClick={() => executeAction(onOpenCloudModal)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#222222] hover:text-white"
              >
                <span>Cloud Vault & Sync</span>
                <span className="text-[10px] text-[#666666] font-mono">Synced</span>
              </button>
              <button
                onClick={() => executeAction(onOpenCollaborationModal)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#222222] hover:text-white"
              >
                <span>Realtime Collaboration...</span>
                <span className="text-[10px] text-[#666666] font-mono">Live</span>
              </button>
            </div>
          )}
        </div>

        {/* Help Menu */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('help')}
            onMouseEnter={() => handleMenuHover('help')}
            className={`px-2 py-1 rounded hover:bg-[#1A1A1A] hover:text-white transition-colors ${
              openMenu === 'help' ? 'bg-[#222222] text-white' : ''
            }`}
          >
            Help
          </button>
          {openMenu === 'help' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-[#111111] border border-[#2B2B2B] rounded-md shadow-2xl py-1 z-50 animate-fade-in">
              <button
                onClick={() => executeAction(onOpenShortcuts)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#222222] hover:text-white"
              >
                <span>Keyboard Shortcuts Guide</span>
                <span className="text-[10px] text-[#666666] font-mono">?</span>
              </button>
              <button
                onClick={() => executeAction(onOpenFeatureExplorer)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#222222] hover:text-white"
              >
                <span>Feature & Tool Explorer</span>
                <span className="text-[10px] text-[#666666] font-mono">{mod}+K</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Center: Active Project Name */}
      <div className="hidden lg:flex items-center space-x-2">
        <span className="text-[#666666] text-[10px] font-mono">PROJECT:</span>
        <span className="text-white font-medium text-xs truncate max-w-xs">
          {project.name || 'Untitled Studio Project'}
        </span>
        {project.isRaw && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#1A1A1A] text-[#CCCCCC] border border-[#333333]">
            RAW 16-BIT
          </span>
        )}
      </div>

      {/* Right: Cloud status + Hardware tier + Settings + User */}
      <div className="flex items-center space-x-2.5">
        {/* Hardware Tier Badge */}
        <button
          onClick={onOpenPerformanceModal}
          title={`Hardware Acceleration: ${hwProfile.tierName}`}
          className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#111111] border border-[#222222] text-[#AAAAAA] hover:text-white hover:border-[#444444] transition-colors"
        >
          <Cpu className="w-3 h-3 text-[#CCCCCC]" />
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

        {/* Cloud Sync Status */}
        <button
          onClick={onOpenCloudModal}
          title="Cloud Project Synchronization"
          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#111111] border border-[#222222] text-[#888888] hover:text-white transition-colors"
        >
          <Cloud className="w-3 h-3 text-[#CCCCCC]" />
          <span className="text-[10px] font-mono">Vault</span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          title="Preferences & Settings"
          className="p-1 rounded text-[#888888] hover:text-white hover:bg-[#1A1A1A] transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Account / User Avatar */}
        <button
          onClick={onOpenAuth || onOpenSettings}
          title={currentUser ? `Signed in as ${currentUser.displayName || currentUser.email}` : 'Sign in'}
          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#1A1A1A] border border-[#333333] text-white hover:border-[#666666] transition-colors"
        >
          <UserIcon className="w-3 h-3" />
          <span className="text-[10px] font-mono truncate max-w-[80px]">
            {currentUser?.displayName?.split(' ')[0] || (currentUser?.email ? currentUser.email.split('@')[0] : 'Account')}
          </span>
        </button>
      </div>
    </header>
  );
};
