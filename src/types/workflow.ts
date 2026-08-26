export type WorkflowStageId =
  | 'library'
  | 'develop'
  | 'select'
  | 'mask'
  | 'retouch'
  | 'layers'
  | 'ai'
  | 'design'
  | 'export';

export type WorkspacePresetId =
  | 'master_suite'
  | 'photographer'
  | 'retoucher'
  | 'social_creator'
  | 'minimalist'
  | 'custom';

export interface WorkflowStageDefinition {
  id: WorkflowStageId;
  name: string;
  shortLabel: string;
  description: string;
  iconName: string;
  shortcut: string;
  color: string;
  accentGradient: string;
  defaultSubTabs: string[];
}

export interface CustomWorkspacePreset {
  id: string;
  name: string;
  description: string;
  visibleStages: WorkflowStageId[];
  stageOrder: WorkflowStageId[];
  createdAt: number;
}

export interface WorkspaceConfig {
  activeStage: WorkflowStageId;
  visibleStages: WorkflowStageId[];
  stageOrder: WorkflowStageId[];
  activePresetId: WorkspacePresetId;
  customPresets: CustomWorkspacePreset[];
  sidebarPosition: 'left' | 'right';
  leftDockVisible: boolean;
  rightDockVisible: boolean;
  filmstripVisible: boolean;
  histogramVisible: boolean;
  compactStageBar: boolean;
  keyboardShortcutsEnabled: boolean;
}
