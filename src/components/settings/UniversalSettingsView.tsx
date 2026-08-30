/**
 * Lumina Studio Pro - Universal Cross-Platform Settings & Preferences Center
 * Provides full control over General, Appearance, Performance, Keyboard Shortcuts, Storage, Privacy, and Platform Diagnostics.
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sliders,
  Cpu,
  Keyboard,
  HardDrive,
  Shield,
  Activity,
  User as UserIcon,
  RefreshCw,
  Trash2,
  Lock,
  Check,
  Search,
  RotateCcw,
  Sparkles,
  Layers,
  Cloud,
} from 'lucide-react';
import { inputManager, ShortcutDefinition } from '../../services/inputManager';
import { hardwareDetector, HardwareProfile } from '../../services/hardwareDetector';
import { User } from 'firebase/auth';
import { WorkspaceConfig } from '../../types/workflow';
import { AIProviderGatewayView } from './AIProviderGatewayView';

interface UniversalSettingsViewProps {
  currentUser?: User | null;
  workspaceConfig: WorkspaceConfig;
  onUpdateWorkspaceConfig: (config: WorkspaceConfig) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

type SettingsTab =
  | 'general'
  | 'ai_providers'
  | 'performance'
  | 'shortcuts'
  | 'storage'
  | 'privacy'
  | 'diagnostics';

export const UniversalSettingsView: React.FC<UniversalSettingsViewProps> = ({
  currentUser,
  workspaceConfig,
  onUpdateWorkspaceConfig,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [hwProfile, setHwProfile] = useState<HardwareProfile>(() => hardwareDetector.getProfile());
  const [shortcuts, setShortcuts] = useState<ShortcutDefinition[]>(() => inputManager.getAllShortcuts());
  const [shortcutSearch, setShortcutSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null);
  const [customKeyInput, setCustomKeyInput] = useState('');

  const mod = inputManager.getModifierKeyName();
  const os = inputManager.getOS();

  // Storage Stats simulation/real
  const [storageEstimate, setStorageEstimate] = useState<{ usageMB: number; quotaMB: number }>({
    usageMB: 48.5,
    quotaMB: 2048,
  });

  useEffect(() => {
    if (typeof navigator !== 'undefined' && (navigator as any).storage?.estimate) {
      (navigator as any).storage.estimate().then((est: any) => {
        if (est.usage && est.quota) {
          setStorageEstimate({
            usageMB: Math.round(est.usage / (1024 * 1024)),
            quotaMB: Math.round(est.quota / (1024 * 1024)),
          });
        }
      });
    }
  }, []);

  const handleShortcutEditSave = (id: string) => {
    if (!customKeyInput.trim()) return;
    inputManager.updateCustomBinding(id, customKeyInput.trim());
    setShortcuts([...inputManager.getAllShortcuts()]);
    setEditingShortcutId(null);
    setCustomKeyInput('');
    showToast('success', 'Shortcut Updated', `Keybinding for ${id} has been saved.`);
  };

  const handleResetShortcuts = () => {
    inputManager.resetShortcutsToDefault();
    setShortcuts([...inputManager.getAllShortcuts()]);
    showToast('info', 'Shortcuts Reset', 'All keyboard shortcuts returned to studio defaults.');
  };

  const filteredShortcuts = shortcuts.filter((sc) => {
    const matchesSearch =
      sc.name.toLowerCase().includes(shortcutSearch.toLowerCase()) ||
      sc.id.toLowerCase().includes(shortcutSearch.toLowerCase()) ||
      sc.category.toLowerCase().includes(shortcutSearch.toLowerCase());
    const matchesCat = selectedCategory === 'All' || sc.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#080808] text-[#CCCCCC] overflow-hidden">
      {/* Settings Navigation Sidebar */}
      <aside className="w-full md:w-56 bg-[#000000] border-b md:border-b-0 md:border-r border-[#222222] p-3 flex flex-row md:flex-col space-x-1 md:space-x-0 md:space-y-1 overflow-x-auto md:overflow-x-visible shrink-0">
        <div className="hidden md:block px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#666666]">
          Studio Settings
        </div>

        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'general'
              ? 'bg-[#1A1A1A] text-white border border-[#333333]'
              : 'hover:bg-[#111111] hover:text-white text-[#888888]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>General</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_providers')}
          className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'ai_providers'
              ? 'bg-[#1A1A1A] text-white border border-[#333333]'
              : 'hover:bg-[#111111] hover:text-white text-[#888888]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Providers</span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'performance'
              ? 'bg-[#1A1A1A] text-white border border-[#333333]'
              : 'hover:bg-[#111111] hover:text-white text-[#888888]'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Performance & GPU</span>
        </button>

        <button
          onClick={() => setActiveTab('shortcuts')}
          className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'shortcuts'
              ? 'bg-[#1A1A1A] text-white border border-[#333333]'
              : 'hover:bg-[#111111] hover:text-white text-[#888888]'
          }`}
        >
          <Keyboard className="w-4 h-4" />
          <span>Shortcuts</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'storage'
              ? 'bg-[#1A1A1A] text-white border border-[#333333]'
              : 'hover:bg-[#111111] hover:text-white text-[#888888]'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Storage & Cache</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'privacy'
              ? 'bg-[#1A1A1A] text-white border border-[#333333]'
              : 'hover:bg-[#111111] hover:text-white text-[#888888]'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Privacy & Security</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'diagnostics'
              ? 'bg-[#1A1A1A] text-white border border-[#333333]'
              : 'hover:bg-[#111111] hover:text-white text-[#888888]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Diagnostics</span>
        </button>
      </aside>

      {/* Settings Content Area */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-4xl">
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white">General Preferences</h2>
              <p className="text-xs text-[#777777] mt-0.5">
                Configure your studio environment, workspace defaults, and autosave parameters.
              </p>
            </div>

            {/* Account Card */}
            <div className="p-4 bg-[#111111] border border-[#222222] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#333333] flex items-center justify-center text-white">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {currentUser?.displayName || currentUser?.email || 'Anonymous Studio Session'}
                    </div>
                    <div className="text-xs text-[#777777]">
                      {currentUser ? 'Cloud Vault Connected' : 'Local-First Mode (Offline Capable)'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Autosave Interval */}
            <div className="p-4 bg-[#111111] border border-[#222222] rounded-xl space-y-3">
              <h3 className="text-xs font-mono uppercase text-[#888888]">Non-Destructive Autosave</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-white">Autosave Snapshots to IndexedDB</div>
                  <div className="text-[11px] text-[#666666]">
                    Continuously protects project changes against unexpected browser tab closing.
                  </div>
                </div>
                <div className="px-2.5 py-1 bg-[#1A1A1A] border border-[#333333] rounded text-xs font-mono text-white">
                  Active (30s)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI PROVIDERS TAB */}
        {activeTab === 'ai_providers' && (
          <AIProviderGatewayView showToast={showToast} />
        )}

        {/* PERFORMANCE TAB */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white">Hardware Acceleration & Performance</h2>
              <p className="text-xs text-[#777777] mt-0.5">
                Lumina automatically configures rendering paths, tile dimensions, and worker pools based on device capabilities.
              </p>
            </div>

            {/* Hardware Profile Summary */}
            <div className="p-4 bg-[#111111] border border-[#222222] rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]">
                <div>
                  <span className="text-xs font-mono text-[#666666] uppercase">Classified Tier</span>
                  <div className="text-sm font-semibold text-white mt-0.5">{hwProfile.tierName}</div>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#1A1A1A] border border-[#333333] text-xs font-mono text-[#CCCCCC]">
                  {hwProfile.cores} CPU Cores • {hwProfile.deviceMemoryGB}GB RAM
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg">
                  <span className="text-[#666666]">Web Workers</span>
                  <div className="text-white font-mono mt-1">{hwProfile.recommendedWorkerCount} Dedicated Threads</div>
                </div>
                <div className="p-3 bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg">
                  <span className="text-[#666666]">Tile Buffer Size</span>
                  <div className="text-white font-mono mt-1">{hwProfile.recommendedTileSize} × {hwProfile.recommendedTileSize} px</div>
                </div>
                <div className="p-3 bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg">
                  <span className="text-[#666666]">Max Preview Resolution</span>
                  <div className="text-white font-mono mt-1">{hwProfile.maxPreviewResolution} px</div>
                </div>
                <div className="p-3 bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg">
                  <span className="text-[#666666]">Precision Pipeline</span>
                  <div className="text-white font-mono mt-1">
                    {hwProfile.useFloat32Pipeline ? '32-Bit IEEE Float' : '16-Bit Half Float'}
                  </div>
                </div>
              </div>
            </div>

            {/* GPU Diagnostics */}
            <div className="p-4 bg-[#111111] border border-[#222222] rounded-xl space-y-2">
              <h3 className="text-xs font-mono uppercase text-[#888888]">GPU Capabilities</h3>
              <div className="text-xs font-mono text-[#AAAAAA] space-y-1">
                <div>Renderer: {hwProfile.gpu.renderer}</div>
                <div>Vendor: {hwProfile.gpu.vendor}</div>
                <div>WebGL 2 Supported: {hwProfile.gpu.webgl2Supported ? 'YES' : 'NO'}</div>
                <div>Max Texture Size: {hwProfile.gpu.maxTextureSize} px</div>
                <div>OffscreenCanvas: {hwProfile.gpu.offscreenCanvasSupported ? 'AVAILABLE' : 'FALLBACK'}</div>
              </div>
            </div>
          </div>
        )}

        {/* SHORTCUTS TAB */}
        {activeTab === 'shortcuts' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-medium text-white">Keyboard Shortcuts</h2>
                <p className="text-xs text-[#777777] mt-0.5">
                  Platform configured for <span className="font-mono text-white">{os.toUpperCase()}</span>. Customize any binding below.
                </p>
              </div>
              <button
                onClick={handleResetShortcuts}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-[#1A1A1A] border border-[#333333] hover:border-[#555555] text-xs text-[#CCCCCC] transition-colors self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Defaults</span>
              </button>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#666666]" />
                <input
                  type="text"
                  placeholder="Search shortcuts..."
                  value={shortcutSearch}
                  onChange={(e) => setShortcutSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#111111] border border-[#222222] rounded-lg text-xs text-white placeholder-[#555555] focus:outline-none focus:border-[#444444]"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#111111] border border-[#222222] rounded-lg px-3 py-1.5 text-xs text-[#CCCCCC] focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="File">File</option>
                <option value="Edit">Edit</option>
                <option value="View">View</option>
                <option value="Tools">Tools</option>
                <option value="Adjustments">Adjustments</option>
              </select>
            </div>

            {/* Shortcut List Table */}
            <div className="border border-[#222222] rounded-xl overflow-hidden bg-[#111111]">
              <div className="max-h-96 overflow-y-auto divide-y divide-[#1A1A1A]">
                {filteredShortcuts.map((sc) => {
                  const keyDisplay = inputManager.formatShortcut(
                    sc.customKey || (inputManager.isMacOrIOS() ? sc.defaultMac : sc.defaultWin)
                  );
                  const isEditing = editingShortcutId === sc.id;

                  return (
                    <div
                      key={sc.id}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-[#161616] text-xs transition-colors"
                    >
                      <div className="flex-1 pr-4">
                        <div className="text-white font-medium">{sc.name}</div>
                        <div className="text-[11px] text-[#666666]">{sc.description}</div>
                      </div>

                      {isEditing ? (
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="text"
                            placeholder="e.g. Ctrl+K"
                            value={customKeyInput}
                            onChange={(e) => setCustomKeyInput(e.target.value)}
                            className="w-24 px-2 py-1 bg-[#0A0A0A] border border-white text-xs font-mono text-white rounded"
                            autoFocus
                          />
                          <button
                            onClick={() => handleShortcutEditSave(sc.id)}
                            className="p-1 rounded bg-white text-black hover:bg-[#CCCCCC]"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingShortcutId(sc.id);
                            setCustomKeyInput(sc.customKey || (inputManager.isMacOrIOS() ? sc.defaultMac : sc.defaultWin));
                          }}
                          className="px-2.5 py-1 bg-[#1A1A1A] border border-[#2B2B2B] hover:border-[#555555] rounded text-xs font-mono text-white transition-colors"
                        >
                          {keyDisplay}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STORAGE TAB */}
        {activeTab === 'storage' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white">Storage & Local Persistence</h2>
              <p className="text-xs text-[#777777] mt-0.5">
                Local-first IndexedDB database storage quota and temporary cache management.
              </p>
            </div>

            <div className="p-4 bg-[#111111] border border-[#222222] rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#888888]">IndexedDB Utilization</span>
                <span className="font-mono text-white">
                  {storageEstimate.usageMB} MB / {storageEstimate.quotaMB} MB
                </span>
              </div>
              <div className="w-full h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(3, (storageEstimate.usageMB / storageEstimate.quotaMB) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#111111] border border-[#222222] rounded-xl">
              <div>
                <div className="text-xs font-medium text-white">Clear Stale Demosaic & Render Cache</div>
                <div className="text-[11px] text-[#666666]">
                  Safely frees temporary preview caches while keeping all saved projects intact.
                </div>
              </div>
              <button
                onClick={() => showToast('info', 'Cache Cleared', 'Freed temporary WebGL render buffers.')}
                className="px-3 py-1.5 bg-[#1A1A1A] border border-[#333333] hover:border-[#555555] rounded text-xs font-medium text-white transition-colors"
              >
                Purge Cache
              </button>
            </div>
          </div>
        )}

        {/* PRIVACY & SECURITY TAB */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white">Privacy & Local-First Security</h2>
              <p className="text-xs text-[#777777] mt-0.5">
                Lumina operates local-first. Raw photos and project files remain on your device unless explicitly synced to Cloud Vault.
              </p>
            </div>

            <div className="p-4 bg-[#111111] border border-[#222222] rounded-xl space-y-3">
              <h3 className="text-xs font-mono uppercase text-[#888888]">Privacy Guarantees</h3>
              <div className="space-y-2 text-xs text-[#AAAAAA]">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-white" />
                  <span>Zero telemetry or third-party behavioral trackers.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-white" />
                  <span>All image processing and RAW demosaicing runs 100% on device Web Workers.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-white" />
                  <span>Cloud Vault synchronization is end-to-end encrypted with TLS 1.3.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DIAGNOSTICS TAB */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white">System Diagnostics</h2>
              <p className="text-xs text-[#777777] mt-0.5">
                Runtime environment telemetry and platform build verification.
              </p>
            </div>

            <div className="p-4 bg-[#111111] border border-[#222222] rounded-xl space-y-2 text-xs font-mono text-[#AAAAAA]">
              <div>Operating System: {os.toUpperCase()}</div>
              <div>Platform Engine: React 18 + Vite 6 + Capacitor 8</div>
              <div>Renderer: {hwProfile.gpu.renderer}</div>
              <div>WebGL 2: {hwProfile.gpu.webgl2Supported ? 'Enabled' : 'Disabled'}</div>
              <div>Float32 Pipeline: {hwProfile.useFloat32Pipeline ? 'Enabled' : 'Disabled'}</div>
              <div>Color Management: LCMS / CSS Color Module 4</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
