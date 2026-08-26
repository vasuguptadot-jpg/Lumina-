import React from 'react';
import {
  Compass,
  Sliders,
  Focus,
  Layers,
  Bandage,
  Sparkles,
  Type,
  Download,
  ChevronRight,
  Settings2,
  Layout,
} from 'lucide-react';
import {
  WorkflowStageId,
  WorkspaceConfig,
} from '../../types/workflow';
import {
  WORKFLOW_STAGES,
  WORKSPACE_PRESETS,
} from '../../engine/workspaceEngine';

interface WorkflowStageBarProps {
  config: WorkspaceConfig;
  onSelectStage: (stage: WorkflowStageId) => void;
  onOpenCustomizer: () => void;
  onQuickPresetSelect?: (presetId: any) => void;
}

export const WorkflowStageBar: React.FC<WorkflowStageBarProps> = ({
  config,
  onSelectStage,
  onOpenCustomizer,
}) => {
  // Ordered visible stages
  const activeStages = config.stageOrder.filter((id) =>
    config.visibleStages.includes(id)
  );

  const getStageIcon = (iconName: string) => {
    switch (iconName) {
      case 'Compass':
        return Compass;
      case 'Sliders':
        return Sliders;
      case 'Focus':
        return Focus;
      case 'Layers':
        return Layers;
      case 'Bandage':
        return Bandage;
      case 'Sparkles':
        return Sparkles;
      case 'Type':
        return Type;
      case 'Download':
        return Download;
      default:
        return Sliders;
    }
  };

  return (
    <div className="h-9 bg-[#050505] border-b border-[#2A2A2A] px-3 flex items-center justify-between select-none z-20 overflow-x-auto scrollbar-none font-sans">
      {/* Stages Pipeline Flow */}
      <div className="flex items-center gap-1 min-w-max">
        <div className="flex items-center gap-1 mr-2 text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-500 hidden xl:flex">
          <span>Stage:</span>
        </div>

        {activeStages.map((stageId, index) => {
          const stage = WORKFLOW_STAGES[stageId];
          if (!stage) return null;
          const Icon = getStageIcon(stage.iconName);
          const isActive = config.activeStage === stageId;

          return (
            <React.Fragment key={stageId}>
              <button
                onClick={() => onSelectStage(stageId)}
                title={`${stage.name} Stage (Hotkey: ${stage.shortcut})`}
                className={`relative flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#141414] text-white border border-[#2A2A2A]'
                    : 'text-zinc-400 hover:text-white hover:bg-[#0D0D0D]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-zinc-300" />
                <span>{stage.name}</span>

                {/* Shortcut Key Badge */}
                {config.keyboardShortcutsEnabled && (
                  <span className="text-[9px] font-mono px-1 rounded bg-[#0D0D0D] text-zinc-500 border border-[#2A2A2A]">
                    {stage.shortcut}
                  </span>
                )}
              </button>

              {/* Step Arrow Divider */}
              {index < activeStages.length - 1 && (
                <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0 mx-0.5" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Right Controls: Workspace Preset & Customizer Trigger */}
      <div className="flex items-center gap-2 pl-3 ml-auto shrink-0">
        {/* Active Preset Tag */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 bg-[#0D0D0D] border border-[#2A2A2A] rounded text-[10px] text-zinc-400">
          <Layout className="w-3 h-3 text-zinc-400" />
          <span className="font-medium text-zinc-300">
            {WORKSPACE_PRESETS[config.activePresetId]?.name || 'Custom Layout'}
          </span>
        </div>

        {/* Customize Workspace Button */}
        <button
          onClick={onOpenCustomizer}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[#0D0D0D] hover:bg-[#141414] text-zinc-300 hover:text-white border border-[#2A2A2A] transition-colors"
          title="Customize Workspace Layout"
        >
          <Settings2 className="w-3 h-3 text-zinc-400" />
          <span className="hidden sm:inline text-[11px]">Customize</span>
        </button>
      </div>
    </div>
  );
};
