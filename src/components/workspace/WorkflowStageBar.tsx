/**
 * Lumina Studio Pro — Workflow Stage Navigation Bar
 * Strict 3-Color Hierarchy: #050505 (Black), #7A0F18 (Dark Red), #E6E3DE (Greyish White).
 */

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
  Settings2,
} from 'lucide-react';
import { WorkflowStageId, WorkspaceConfig } from '../../types/workflow';
import { WORKFLOW_STAGES } from '../../engine/workspaceEngine';

interface WorkflowStageBarProps {
  config: WorkspaceConfig;
  onSelectStage: (stage: WorkflowStageId) => void;
  onOpenCustomizer?: () => void;
}

const STAGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Compass,
  Sliders,
  Focus,
  Layers,
  Bandage,
  Sparkles,
  Type,
  Download,
};

export const WorkflowStageBar: React.FC<WorkflowStageBarProps> = ({
  config,
  onSelectStage,
  onOpenCustomizer,
}) => {
  const visibleStages = (config?.visibleStages || [
    'library',
    'develop',
    'select',
    'mask',
    'retouch',
    'layers',
    'ai',
    'design',
    'export',
  ]).filter((id) => Boolean(WORKFLOW_STAGES[id]));

  return (
    <nav
      id="lumina-workflow-stage-bar"
      aria-label="Workflow Stages"
      className="h-8 bg-[#050505] border-b border-[rgba(230,227,222,0.08)] px-2 sm:px-4 flex items-center justify-between select-none z-20 text-[11px] font-mono"
    >
      <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
        {visibleStages.map((stageId, idx) => {
          const stage = WORKFLOW_STAGES[stageId];
          if (!stage) return null;
          const isActive = config.activeStage === stageId;
          const Icon = STAGE_ICONS[stage.iconName] || Sliders;

          return (
            <React.Fragment key={stage.id}>
              <button
                onClick={() => onSelectStage(stage.id)}
                className={`flex items-center space-x-1.5 px-2 py-0.5 rounded transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#7A0F18] text-[#E6E3DE] font-semibold'
                    : 'text-[rgba(230,227,222,0.60)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.04)]'
                }`}
                title={`${stage.name} (${stage.shortcut}) — ${stage.description}`}
              >
                <span className="text-[9px] opacity-70">
                  {stage.shortcut}
                </span>
                <Icon className="w-3 h-3" />
                <span className="hidden md:inline">{stage.name}</span>
              </button>

              {idx < visibleStages.length - 1 && (
                <span className="text-[rgba(230,227,222,0.12)] text-[10px] select-none">
                  /
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {onOpenCustomizer && (
        <button
          onClick={onOpenCustomizer}
          className="p-1 rounded text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.06)] transition-colors ml-2 shrink-0"
          title="Customize Workspace Layout & Stages"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      )}
    </nav>
  );
};
