/**
 * Lumina Studio Pro - Desktop Native-Style Pro Sidebar Navigation
 * Strict 3-Color Hierarchy: #050505 (Black), #7A0F18 (Dark Red), #E6E3DE (Greyish White).
 */

import React from 'react';
import {
  Home,
  FolderOpen,
  Sliders,
  Sparkles,
  Type,
  Grid,
  BrainCircuit,
  Image as ImageIcon,
  Palette,
  Download,
  Cloud,
  Users,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Camera,
  Search,
  Zap,
} from 'lucide-react';
import { MainNavTab } from '../../types/navigation';

interface ProSidebarNavProps {
  activeTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSearch: () => void;
  onNewProject: () => void;
  onImportRaw: () => void;
}

interface NavItem {
  id: MainNavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const ProSidebarNav: React.FC<ProSidebarNavProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  onOpenSearch,
  onNewProject,
  onImportRaw,
}) => {
  const NAV_GROUPS: NavGroup[] = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'projects', label: 'Projects', icon: FolderOpen },
      ],
    },
    {
      title: 'CREATE',
      items: [
        { id: 'editor', label: 'Photo', icon: Sliders },
        { id: 'design', label: 'Design', icon: Type },
        { id: 'collage', label: 'Collage', icon: Grid },
        { id: 'aistudio', label: 'AI Studio', icon: BrainCircuit },
      ],
    },
    {
      title: 'LIBRARY',
      items: [
        { id: 'library', label: 'Assets', icon: ImageIcon },
        { id: 'presets', label: 'Presets', icon: Palette },
      ],
    },
    {
      title: 'EXPORT',
      items: [
        { id: 'export', label: 'Export', icon: Download },
      ],
    },
    {
      title: 'CLOUD',
      items: [
        { id: 'cloud', label: 'Cloud Vault', icon: Cloud },
        { id: 'collaboration', label: 'Collaboration', icon: Users },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'system', label: 'Diagnostics', icon: Activity },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  // Helper to normalize matching active tab
  const isItemActive = (id: MainNavTab) => {
    if (activeTab === id) return true;
    if ((id === 'editor' || id === 'photo') && (activeTab === 'editor' || activeTab === 'photo')) return true;
    if ((id === 'library' || id === 'assets') && (activeTab === 'library' || activeTab === 'assets')) return true;
    if ((id === 'aistudio' || id === 'ai') && (activeTab === 'aistudio' || activeTab === 'ai')) return true;
    return false;
  };

  return (
    <aside
      id="lumina-pro-sidebar"
      className={`hidden lg:flex flex-col shrink-0 bg-[#050505] border-r border-[rgba(230,227,222,0.08)] transition-all duration-200 select-none z-30 ${
        isCollapsed ? 'w-16' : 'w-56 xl:w-60'
      }`}
    >
      {/* Top Application Brand Bar */}
      <div className="h-12 border-b border-[rgba(230,227,222,0.08)] px-3 flex items-center justify-between bg-[#050505]">
        {!isCollapsed ? (
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-6 h-6 rounded bg-[#7A0F18] flex items-center justify-center font-mono font-bold text-xs text-[#E6E3DE]">
              L
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs tracking-wider uppercase text-[#E6E3DE]">
                LUMINA
              </span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[rgba(230,227,222,0.06)] text-[rgba(230,227,222,0.70)] border border-[rgba(230,227,222,0.12)]">
                PRO
              </span>
            </div>
          </button>
        ) : (
          <button
            onClick={() => onSelectTab('home')}
            className="w-full flex justify-center"
            title="Lumina Pro Studio"
          >
            <div className="w-7 h-7 rounded bg-[#7A0F18] flex items-center justify-center font-mono font-bold text-xs text-[#E6E3DE]">
              L
            </div>
          </button>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1 rounded text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.06)] transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Quick Global Action Buttons (When expanded) */}
      {!isCollapsed && (
        <div className="p-3 border-b border-[rgba(230,227,222,0.08)] space-y-1.5">
          <button
            id="sidebar-new-project-btn"
            onClick={onNewProject}
            className="w-full py-1.5 px-2.5 rounded-lg bg-[#7A0F18] hover:bg-[#8F141E] text-[#E6E3DE] font-semibold text-xs flex items-center justify-center gap-2 transition-colors active:scale-98 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>

          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              onClick={onImportRaw}
              className="py-1 px-2 rounded bg-[#050505] hover:bg-[rgba(230,227,222,0.06)] border border-[rgba(230,227,222,0.12)] hover:border-[#7A0F18] text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Camera className="w-3 h-3 text-[rgba(230,227,222,0.70)]" />
              <span>Import RAW</span>
            </button>
            <button
              onClick={onOpenSearch}
              className="py-1 px-2 rounded bg-[#050505] hover:bg-[rgba(230,227,222,0.06)] border border-[rgba(230,227,222,0.12)] hover:border-[#7A0F18] text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Search className="w-3 h-3 text-[rgba(230,227,222,0.70)]" />
              <span>⌘K Search</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto py-2.5 px-2 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-0.5">
            {!isCollapsed && (
              <div className="px-2 pb-1 text-[9px] font-mono font-bold tracking-wider text-[rgba(230,227,222,0.45)] uppercase">
                {group.title}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.id);

                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => onSelectTab(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? 'bg-[#7A0F18] text-[#E6E3DE] font-semibold'
                        : 'text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.06)]'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active ? 'text-[#E6E3DE]' : 'text-[rgba(230,227,222,0.45)]'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[rgba(230,227,222,0.08)] text-[rgba(230,227,222,0.70)] border border-[rgba(230,227,222,0.12)]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Telemetry & Status */}
      <div className="p-3 border-t border-[rgba(230,227,222,0.08)] bg-[#050505] text-[10px] font-mono text-[rgba(230,227,222,0.45)]">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[rgba(230,227,222,0.70)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7A0F18]" />
              <span>32-BIT LOCAL</span>
            </div>
            <span>v15.0 PRO</span>
          </div>
        ) : (
          <div className="flex justify-center" title="32-Bit Local Engine">
            <span className="w-2 h-2 rounded-full bg-[#7A0F18]" />
          </div>
        )}
      </div>
    </aside>
  );
};
