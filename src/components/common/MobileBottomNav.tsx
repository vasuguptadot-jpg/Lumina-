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
            className="bg-[#0D0D0D] border border-[#222222] rounded-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#181818]">
              <span className="text-xs font-semibold font-mono uppercase text-white">
                Create Workspace
              </span>
              <button
                onClick={() => setIsCreateMenuOpen(false)}
                className="p-1 text-[#666666] hover:text-white"
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
                className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-center gap-2.5 text-left text-xs font-medium text-white"
              >
                <Sliders className="w-4 h-4 text-[#CCCCCC]" />
                <div>
                  <div>Photo</div>
                  <div className="text-[10px] text-[#666666]">Develop & RAW</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onSelectTab('design');
                  setIsCreateMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-center gap-2.5 text-left text-xs font-medium text-white"
              >
                <Type className="w-4 h-4 text-[#CCCCCC]" />
                <div>
                  <div>Design</div>
                  <div className="text-[10px] text-[#666666]">Typography</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onSelectTab('collage');
                  setIsCreateMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-center gap-2.5 text-left text-xs font-medium text-white"
              >
                <Grid className="w-4 h-4 text-[#CCCCCC]" />
                <div>
                  <div>Collage</div>
                  <div className="text-[10px] text-[#666666]">Multi-Photo</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onSelectTab('aistudio');
                  setIsCreateMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-center gap-2.5 text-left text-xs font-medium text-white"
              >
                <BrainCircuit className="w-4 h-4 text-[#CCCCCC]" />
                <div>
                  <div>AI Studio</div>
                  <div className="text-[10px] text-[#666666]">Generative AI</div>
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
            className="bg-[#0D0D0D] border border-[#222222] rounded-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#181818]">
              <span className="text-xs font-semibold font-mono uppercase text-white">
                More Workspaces
              </span>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1 text-[#666666] hover:text-white"
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
                className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-center gap-2.5 text-left text-xs font-medium text-white"
              >
                <Download className="w-4 h-4 text-[#CCCCCC]" />
                <span>Export Hub</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('cloud');
                  setIsMoreMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-center gap-2.5 text-left text-xs font-medium text-white"
              >
                <Cloud className="w-4 h-4 text-[#CCCCCC]" />
                <span>Cloud Vault</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('system');
                  setIsMoreMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-center gap-2.5 text-left text-xs font-medium text-white"
              >
                <Activity className="w-4 h-4 text-[#CCCCCC]" />
                <span>Diagnostics</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('settings');
                  setIsMoreMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-center gap-2.5 text-left text-xs font-medium text-white"
              >
                <Settings className="w-4 h-4 text-[#CCCCCC]" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Mobile Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080808] border-t border-[#222222] px-2 py-1 flex items-center justify-around select-none">
        {/* Home */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1 rounded-lg transition-colors ${
            activeTab === 'home' ? 'text-white' : 'text-[#666666] hover:text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Home</span>
        </button>

        {/* Projects */}
        <button
          onClick={() => onSelectTab('projects')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1 rounded-lg transition-colors ${
            activeTab === 'projects' ? 'text-white' : 'text-[#666666] hover:text-white'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Projects</span>
        </button>

        {/* Center Create Button */}
        <button
          onClick={() => setIsCreateMenuOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-black font-bold shadow-md active:scale-95 transition-transform"
          title="Create"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Assets */}
        <button
          onClick={() => onSelectTab('library')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1 rounded-lg transition-colors ${
            isTabActive('library') ? 'text-white' : 'text-[#666666] hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Assets</span>
        </button>

        {/* More */}
        <button
          onClick={() => setIsMoreMenuOpen(true)}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] py-1 px-1 rounded-lg transition-colors ${
            activeTab === 'cloud' || activeTab === 'system' || activeTab === 'export'
              ? 'text-white'
              : 'text-[#666666] hover:text-white'
          }`}
        >
          <MoreHorizontal className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">More</span>
        </button>
      </nav>
    </>
  );
};
