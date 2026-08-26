import React, { useMemo } from 'react';
import {
  Plus,
  FolderOpen,
  Camera,
  Sliders,
  Type,
  Grid,
  BrainCircuit,
  Clock,
  Search,
  Cloud,
  Bell,
  User,
  ArrowRight,
  Sparkles,
  FileImage,
} from 'lucide-react';
import { Project } from '../../types/editor';
import { MainNavTab } from '../../types/navigation';
import { SAMPLE_IMAGES } from '../../engine/sampleImages';
import { DEFAULT_PROJECT_STATE } from '../../engine/defaultSettings';

interface HomeDashboardProps {
  onNavigateTab: (tab: MainNavTab) => void;
  onOpenProject: (project: Project) => void;
  onNewEdit: () => void;
  onImportRaw: () => void;
  onOpenAIStudio: () => void;
  onOpenDesignStudio: () => void;
  onOpenCollage: () => void;
  onOpenPresets: () => void;
  onOpenBatch?: () => void;
  onOpenCameraStudio?: () => void;
  onOpenFeatureExplorer?: () => void;
  onOpenAICreativeDirector?: () => void;
  onApplyPreset?: (presetId: string) => void;
  onLaunchToolById?: (toolId: string) => void;
  recentProjects?: Project[];
  currentProject: Project;
  onOpenSearch?: () => void;
  onOpenCloud?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigateTab,
  onOpenProject,
  onNewEdit,
  onImportRaw,
  onOpenAIStudio,
  onOpenDesignStudio,
  onOpenCollage,
  recentProjects = [],
  currentProject,
  onOpenSearch,
  onOpenCloud,
}) => {
  // Determine greeting based on current local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning.';
    if (hour < 18) return 'Good afternoon.';
    return 'Good evening.';
  }, []);

  // Display projects: recent saved projects or fallback sample projects
  const displayProjects: Project[] = useMemo(() => {
    if (recentProjects && recentProjects.length > 0) {
      return recentProjects.slice(0, 4);
    }
    // Fallback to active project + sample templates
    const fallbackList: Project[] = [currentProject];
    SAMPLE_IMAGES.slice(0, 3).forEach((sample, idx) => {
      fallbackList.push({
        ...DEFAULT_PROJECT_STATE,
        id: `sample_proj_${idx}`,
        name: sample.name,
        image: {
          id: `sample_img_${idx}`,
          name: `${sample.name}.jpg`,
          originalUrl: sample.url,
          width: 1920,
          height: 1080,
          format: 'jpeg',
          size: 2400000,
          createdAt: Date.now() - (idx + 1) * 3600000,
        },
        createdAt: Date.now() - (idx + 1) * 3600000,
        updatedAt: Date.now() - (idx + 1) * 3600000,
      });
    });
    return fallbackList.slice(0, 4);
  }, [recentProjects, currentProject]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#000000] text-white flex flex-col font-sans select-none">
      {/* Home Header: Simple, clean bar */}
      <header className="h-14 border-b border-[#181818] px-6 flex items-center justify-between bg-[#080808] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-[#181818] border border-[#2C2C2C] flex items-center justify-center font-mono font-bold text-xs text-white">
            L
          </div>
          <span className="font-bold text-sm tracking-wider uppercase">
            Lumina Pro
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#101010] hover:bg-[#181818] border border-[#222222] text-[#999999] hover:text-white text-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search workspaces, tools, assets...</span>
            <kbd className="hidden md:inline text-[10px] font-mono px-1 rounded bg-[#080808] border border-[#222222] text-[#666666]">
              ⌘K
            </kbd>
          </button>

          {/* Cloud Status */}
          <button
            onClick={() => onNavigateTab('cloud')}
            className="p-2 rounded-lg text-[#999999] hover:text-white hover:bg-[#101010] border border-transparent hover:border-[#222222] transition-colors"
            title="Cloud Vault & Sync"
          >
            <Cloud className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <button
            onClick={() => onNavigateTab('system')}
            className="p-2 rounded-lg text-[#999999] hover:text-white hover:bg-[#101010] border border-transparent hover:border-[#222222] transition-colors"
            title="System & Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Profile */}
          <button
            onClick={() => onNavigateTab('settings')}
            className="w-7 h-7 rounded-lg bg-[#181818] border border-[#2C2C2C] flex items-center justify-center text-[#CCCCCC] hover:text-white transition-colors"
            title="User Profile & Settings"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Launcher Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-10 space-y-10">
        {/* Greeting & Main Action Prompts */}
        <div className="space-y-6 pt-2">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {greeting}
            </h1>
            <p className="text-base text-[#999999] font-normal">
              What do you want to create?
            </p>
          </div>

          {/* Primary 4-Button Action Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={onNewEdit}
              className="p-4 rounded-xl bg-white hover:bg-[#CCCCCC] text-black font-semibold text-xs sm:text-sm flex flex-col items-center justify-center gap-2.5 transition-colors shadow-sm active:scale-98"
            >
              <div className="w-8 h-8 rounded-lg bg-black/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-black" />
              </div>
              <span>New Project</span>
            </button>

            <button
              onClick={() => onNavigateTab('projects')}
              className="p-4 rounded-xl bg-[#101010] hover:bg-[#181818] border border-[#222222] hover:border-[#2C2C2C] text-white font-medium text-xs sm:text-sm flex flex-col items-center justify-center gap-2.5 transition-colors active:scale-98"
            >
              <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#2C2C2C] flex items-center justify-center text-[#CCCCCC]">
                <FolderOpen className="w-4 h-4" />
              </div>
              <span>Open Project</span>
            </button>

            <button
              onClick={() => onNavigateTab('library')}
              className="p-4 rounded-xl bg-[#101010] hover:bg-[#181818] border border-[#222222] hover:border-[#2C2C2C] text-white font-medium text-xs sm:text-sm flex flex-col items-center justify-center gap-2.5 transition-colors active:scale-98"
            >
              <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#2C2C2C] flex items-center justify-center text-[#CCCCCC]">
                <FileImage className="w-4 h-4" />
              </div>
              <span>Import Photo</span>
            </button>

            <button
              onClick={onImportRaw}
              className="p-4 rounded-xl bg-[#101010] hover:bg-[#181818] border border-[#222222] hover:border-[#2C2C2C] text-white font-medium text-xs sm:text-sm flex flex-col items-center justify-center gap-2.5 transition-colors active:scale-98"
            >
              <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#2C2C2C] flex items-center justify-center text-[#CCCCCC]">
                <Camera className="w-4 h-4" />
              </div>
              <span>Import RAW</span>
            </button>
          </div>
        </div>

        <div className="h-[1px] bg-[#181818]" />

        {/* Recent Projects Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#666666]" />
              <span>Recent Projects</span>
            </h2>

            <button
              onClick={() => onNavigateTab('projects')}
              className="text-xs font-medium text-[#999999] hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {displayProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => onOpenProject(proj)}
                className="group p-3 rounded-xl bg-[#0D0D0D] border border-[#222222] hover:border-[#2C2C2C] cursor-pointer transition-colors space-y-2.5 flex flex-col justify-between"
              >
                {/* Project Image Tile */}
                <div className="w-full aspect-4/3 rounded-lg bg-[#141414] border border-[#181818] overflow-hidden relative">
                  {proj.image?.originalUrl ? (
                    <img
                      src={proj.image.originalUrl}
                      alt={proj.name}
                      className="w-full h-full object-cover grayscale contrast-105 group-hover:scale-102 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#666666]">
                      <FileImage className="w-6 h-6" />
                    </div>
                  )}
                  {proj.image?.rawMetadata?.isRaw && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-black/80 text-white border border-white/20">
                      RAW
                    </span>
                  )}
                </div>

                {/* Project Meta Info */}
                <div className="space-y-0.5">
                  <h3 className="text-xs font-medium text-white truncate group-hover:text-[#CCCCCC] transition-colors">
                    {proj.name}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-[#666666] font-mono">
                    <span>
                      {proj.image?.width && proj.image?.height
                        ? `${proj.image.width}×${proj.image.height}`
                        : 'Edited'}
                    </span>
                    <span>
                      {new Date(proj.updatedAt || Date.now()).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-[1px] bg-[#181818]" />

        {/* Quick Access Workspaces: Photo, Design, Collage, AI */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold tracking-tight text-white">
            Quick Access
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => onNavigateTab('editor')}
              className="p-4 rounded-xl bg-[#0D0D0D] hover:bg-[#141414] border border-[#222222] hover:border-[#2C2C2C] text-left transition-colors group flex flex-col justify-between h-28"
            >
              <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#2C2C2C] flex items-center justify-center text-[#CCCCCC] group-hover:text-white">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Photo</div>
                <div className="text-[11px] text-[#666666] leading-tight">
                  RAW, Curves, Color, HSL, Retouch
                </div>
              </div>
            </button>

            <button
              onClick={onOpenDesignStudio}
              className="p-4 rounded-xl bg-[#0D0D0D] hover:bg-[#141414] border border-[#222222] hover:border-[#2C2C2C] text-left transition-colors group flex flex-col justify-between h-28"
            >
              <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#2C2C2C] flex items-center justify-center text-[#CCCCCC] group-hover:text-white">
                <Type className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Design</div>
                <div className="text-[11px] text-[#666666] leading-tight">
                  Typography, Layouts & Shapes
                </div>
              </div>
            </button>

            <button
              onClick={onOpenCollage}
              className="p-4 rounded-xl bg-[#0D0D0D] hover:bg-[#141414] border border-[#222222] hover:border-[#2C2C2C] text-left transition-colors group flex flex-col justify-between h-28"
            >
              <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#2C2C2C] flex items-center justify-center text-[#CCCCCC] group-hover:text-white">
                <Grid className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Collage</div>
                <div className="text-[11px] text-[#666666] leading-tight">
                  Multi-photo Grids & Moodboards
                </div>
              </div>
            </button>

            <button
              onClick={onOpenAIStudio}
              className="p-4 rounded-xl bg-[#0D0D0D] hover:bg-[#141414] border border-[#222222] hover:border-[#2C2C2C] text-left transition-colors group flex flex-col justify-between h-28"
            >
              <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#2C2C2C] flex items-center justify-center text-[#CCCCCC] group-hover:text-white">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">AI Studio</div>
                <div className="text-[11px] text-[#666666] leading-tight">
                  AI Director, Inpaint & Vision
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
