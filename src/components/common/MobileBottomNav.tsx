import React, { useState } from 'react';
import {
  Home,
  Sliders,
  FolderOpen,
  ImageIcon,
  Plus,
  Type,
  Grid,
  BrainCircuit,
  Cloud,
  MoreHorizontal,
  Download,
  Activity,
  Settings,
  X,
} from 'lucide-react';
import { MainNavTab } from '../../types/navigation';

interface MobileBottomNavProps {
  activeTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  onOpenFeatureExplorer?: () => void;
  onNewEdit: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onNewEdit,
}) => {
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const isTabActive = (tab: MainNavTab) => {
    if (activeTab === tab) return true;
    if ((tab === 'editor' || tab === 'photo') && (activeTab === 'editor' || activeTab === 'photo')) return true;
    if ((tab === 'library' || tab === 'assets') && (activeTab === 'library' || activeTab === 'assets')) return true;
    return false;
  };

  return (
    <>
      {/* Create Modal Popover on Mobile */}
      {isCreateMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/80 flex flex-col justify-end p-4 animate-fade-in"
          onClick={() => setIsCreateMenuOpen(false)}
        >
          <div
            className="bg-[#050505] border border-[rgba(230,227,222,0.15)] rounded-2xl p-4 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(230,227,222,0.08)]">
              <span className="text-xs font-semibold font-mono uppercase text-[#E6E3DE]">
                Create Workspace
              </span>
              <button
                onClick={() => setIsCreateMenuOpen(false)}
                className="p-1 text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onSelectTab('editor');
                  setIsCreateMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-[rgba(230,227,222,0.04)] border border-[rgba(230,227,222,0.10)] hover:border-[#7A0F18] hover:bg-[rgba(122,15,24,0.15)] flex items-center gap-2.5 text-left text-xs font-medium text-[#E6E3DE] transition-colors"
              >
                <Sliders className="w-4 h-4 text-[#E6E3DE]" />
                <div>
                  <div className="text-[#E6E3DE]">Photo</div>
                  <div className="text-[10px] text-[rgba(230,227,222,0.45)]">Develop & RAW</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onSelectTab('design');
                  setIsCreateMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-[rgba(230,227,222,0.04)] border border-[rgba(230,227,222,0.10)] hover:border-[#7A0F18] hover:bg-[rgba(122,15,24,0.15)] flex items-center gap-2.5 text-left text-xs font-medium text-[#E6E3DE] transition-colors"
              >
                <Type className="w-4 h-4 text-[#E6E3DE]" />
                <div>
                  <div className="text-[#E6E3DE]">Design</div>
                  <div className="text-[10px] text-[rgba(230,227,222,0.45)]">Typography</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onSelectTab('collage');
                  setIsCreateMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-[rgba(230,227,222,0.04)] border border-[rgba(230,227,222,0.10)] hover:border-[#7A0F18] hover:bg-[rgba(122,15,24,0.15)] flex items-center gap-2.5 text-left text-xs font-medium text-[#E6E3DE] transition-colors"
              >
                <Grid className="w-4 h-4 text-[#E6E3DE]" />
                <div>
                  <div className="text-[#E6E3DE]">Collage</div>
                  <div className="text-[10px] text-[rgba(230,227,222,0.45)]">Multi-Photo</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onSelectTab('aistudio');
                  setIsCreateMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-[rgba(230,227,222,0.04)] border border-[rgba(230,227,222,0.10)] hover:border-[#7A0F18] hover:bg-[rgba(122,15,24,0.15)] flex items-center gap-2.5 text-left text-xs font-medium text-[#E6E3DE] transition-colors"
              >
                <BrainCircuit className="w-4 h-4 text-[#E6E3DE]" />
                <div>
                  <div className="text-[#E6E3DE]">AI Studio</div>
                  <div className="text-[10px] text-[rgba(230,227,222,0.45)]">Generative AI</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* More Menu Popover on Mobile */}
      {isMoreMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/80 flex flex-col justify-end p-4 animate-fade-in"
          onClick={() => setIsMoreMenuOpen(false)}
        >
          <div
            className="bg-[#050505] border border-[rgba(230,227,222,0.15)] rounded-2xl p-4 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(230,227,222,0.08)]">
              <span className="text-xs font-semibold font-mono uppercase text-[#E6E3DE]">
                More Workspaces
              </span>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1 text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onSelectTab('export');
                  setIsMoreMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-[rgba(230,227,222,0.04)] border border-[rgba(230,227,222,0.10)] hover:border-[#7A0F18] hover:bg-[rgba(122,15,24,0.15)] flex items-center gap-2.5 text-left text-xs font-medium text-[#E6E3DE] transition-colors"
              >
                <Download className="w-4 h-4 text-[#E6E3DE]" />
                <span>Export Hub</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('cloud');
                  setIsMoreMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-[rgba(230,227,222,0.04)] border border-[rgba(230,227,222,0.10)] hover:border-[#7A0F18] hover:bg-[rgba(122,15,24,0.15)] flex items-center gap-2.5 text-left text-xs font-medium text-[#E6E3DE] transition-colors"
              >
                <Cloud className="w-4 h-4 text-[#E6E3DE]" />
                <span>Cloud Vault</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('system');
                  setIsMoreMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-[rgba(230,227,222,0.04)] border border-[rgba(230,227,222,0.10)] hover:border-[#7A0F18] hover:bg-[rgba(122,15,24,0.15)] flex items-center gap-2.5 text-left text-xs font-medium text-[#E6E3DE] transition-colors"
              >
                <Activity className="w-4 h-4 text-[#E6E3DE]" />
                <span>Diagnostics</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('settings');
                  setIsMoreMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-[rgba(230,227,222,0.04)] border border-[rgba(230,227,222,0.10)] hover:border-[#7A0F18] hover:bg-[rgba(122,15,24,0.15)] flex items-center gap-2.5 text-left text-xs font-medium text-[#E6E3DE] transition-colors"
              >
                <Settings className="w-4 h-4 text-[#E6E3DE]" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Mobile Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#050505] border-t border-[rgba(230,227,222,0.08)] px-2 py-1 flex items-center justify-around select-none">
        {/* Home */}
        <button
          id="mobile-nav-home"
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1 rounded-lg transition-colors ${
            activeTab === 'home' ? 'text-[#E6E3DE]' : 'text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE]'
          }`}
        >
          <Home className={`w-4 h-4 ${activeTab === 'home' ? 'text-[#7A0F18]' : ''}`} />
          <span className={`text-[10px] font-medium mt-0.5 ${activeTab === 'home' ? 'text-[#E6E3DE] font-semibold' : ''}`}>Home</span>
        </button>

        {/* Projects */}
        <button
          id="mobile-nav-projects"
          onClick={() => onSelectTab('projects')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1 rounded-lg transition-colors ${
            activeTab === 'projects' ? 'text-[#E6E3DE]' : 'text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE]'
          }`}
        >
          <FolderOpen className={`w-4 h-4 ${activeTab === 'projects' ? 'text-[#7A0F18]' : ''}`} />
          <span className={`text-[10px] font-medium mt-0.5 ${activeTab === 'projects' ? 'text-[#E6E3DE] font-semibold' : ''}`}>Projects</span>
        </button>

        {/* Center Create Button */}
        <button
          id="mobile-nav-create"
          onClick={() => setIsCreateMenuOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[#7A0F18] text-[#E6E3DE] hover:bg-[#8F141E] font-bold shadow-md active:scale-95 transition-transform"
          title="Create"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Assets */}
        <button
          id="mobile-nav-assets"
          onClick={() => onSelectTab('library')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1 rounded-lg transition-colors ${
            isTabActive('library') ? 'text-[#E6E3DE]' : 'text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE]'
          }`}
        >
          <ImageIcon className={`w-4 h-4 ${isTabActive('library') ? 'text-[#7A0F18]' : ''}`} />
          <span className={`text-[10px] font-medium mt-0.5 ${isTabActive('library') ? 'text-[#E6E3DE] font-semibold' : ''}`}>Assets</span>
        </button>

        {/* More */}
        <button
          id="mobile-nav-more"
          onClick={() => setIsMoreMenuOpen(true)}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1 rounded-lg transition-colors ${
            activeTab === 'cloud' || activeTab === 'system' || activeTab === 'export'
              ? 'text-[#E6E3DE]'
              : 'text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE]'
          }`}
        >
          <MoreHorizontal className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">More</span>
        </button>
      </nav>
    </>
  );
};
