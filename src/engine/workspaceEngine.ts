import {
  WorkflowStageId,
  WorkflowStageDefinition,
  WorkspaceConfig,
  WorkspacePresetId,
  CustomWorkspacePreset,
} from '../types/workflow';

export const WORKFLOW_STAGES: Record<WorkflowStageId, WorkflowStageDefinition> = {
  library: {
    id: 'library',
    name: 'Library',
    shortLabel: 'LIB',
    description: 'Catalog ingestion, AI semantic tagging, duplicate detection, metadata and rating',
    iconName: 'Compass',
    shortcut: '1',
    color: 'text-amber-400',
    accentGradient: 'from-amber-500 to-orange-500',
    defaultSubTabs: ['metadata', 'ai-understanding'],
  },
  develop: {
    id: 'develop',
    name: 'Develop',
    shortLabel: 'DEV',
    description: 'Master color grading, RAW engine, 32-bit tone curves, HSL, optics & camera profiles',
    iconName: 'Sliders',
    shortcut: '2',
    color: 'text-indigo-400',
    accentGradient: 'from-indigo-500 to-blue-500',
    defaultSubTabs: ['adjust', 'curves', 'hsl', 'raw-optics', 'color-management', 'presets', 'film-simulation'],
  },
  select: {
    id: 'select',
    name: 'Select',
    shortLabel: 'SEL',
    description: 'Precision AI subject/sky/face selection, depth maps, color range and composition guides',
    iconName: 'Focus',
    shortcut: '3',
    color: 'text-cyan-400',
    accentGradient: 'from-cyan-500 to-teal-500',
    defaultSubTabs: ['composition', 'ai-understanding', 'crop', 'geometry'],
  },
  mask: {
    id: 'mask',
    name: 'Mask',
    shortLabel: 'MSK',
    description: 'Brush, linear/radial gradients, luminance & chrominance range masking with feathering',
    iconName: 'Layers',
    shortcut: '4',
    color: 'text-emerald-400',
    accentGradient: 'from-emerald-500 to-teal-500',
    defaultSubTabs: ['masks'],
  },
  retouch: {
    id: 'retouch',
    name: 'Retouch',
    shortLabel: 'RET',
    description: 'Frequency separation, blemish spot healing, portrait AI skin smoothing & facial sculpting',
    iconName: 'Bandage',
    shortcut: '5',
    color: 'text-pink-400',
    accentGradient: 'from-pink-500 to-rose-500',
    defaultSubTabs: ['retouch', 'portrait', 'body', 'detail', 'blur-depth'],
  },
  layers: {
    id: 'layers',
    name: 'Layers',
    shortLabel: 'LAY',
    description: 'Photoshop-grade layer stack, blend modes, adjustment layers, raster painting & drawing',
    iconName: 'Layers',
    shortcut: '6',
    color: 'text-purple-400',
    accentGradient: 'from-purple-500 to-indigo-500',
    defaultSubTabs: ['layers', 'drawing'],
  },
  ai: {
    id: 'ai',
    name: 'AI',
    shortLabel: 'AI',
    description: 'Generative fill & expand, 3D neural studio relight, AI sky replacement, 8x super-res',
    iconName: 'Sparkles',
    shortcut: '7',
    color: 'text-amber-300',
    accentGradient: 'from-amber-400 to-yellow-500',
    defaultSubTabs: ['ai-tools', 'sky', 'lighting', 'effects'],
  },
  design: {
    id: 'design',
    name: 'Design',
    shortLabel: 'DSG',
    description: 'Typography engine, sticker graphics, social templates, collage grid & watermarks',
    iconName: 'Type',
    shortcut: '8',
    color: 'text-rose-400',
    accentGradient: 'from-rose-500 to-orange-500',
    defaultSubTabs: ['typography', 'graphics-design', 'collage', 'watermark', 'screenshot'],
  },
  export: {
    id: 'export',
    name: 'Export',
    shortLabel: 'EXP',
    description: 'Master export pipeline (TIFF, Pro DNG, PSD, JPEG), C2PA manifests, EXIF redaction',
    iconName: 'Download',
    shortcut: '9',
    color: 'text-emerald-300',
    accentGradient: 'from-emerald-400 to-green-500',
    defaultSubTabs: [],
  },
};

export const ALL_STAGES_ORDER: WorkflowStageId[] = [
  'library',
  'develop',
  'select',
  'mask',
  'retouch',
  'layers',
  'ai',
  'design',
  'export',
];

export const WORKSPACE_PRESETS: Record<WorkspacePresetId, {
  name: string;
  description: string;
  stages: WorkflowStageId[];
}> = {
  master_suite: {
    name: 'Master Suite (All Stages)',
    description: 'Full professional 9-stage sequence from catalog ingestion to final master export.',
    stages: ['library', 'develop', 'select', 'mask', 'retouch', 'layers', 'ai', 'design', 'export'],
  },
  photographer: {
    name: 'Photographer Pro',
    description: 'Optimized for high-volume shoots: RAW develop, AI selection, masking, and export.',
    stages: ['library', 'develop', 'select', 'mask', 'export'],
  },
  retoucher: {
    name: 'Retoucher & Beauty Suite',
    description: 'Focused on skin tone grading, blemish healing, portrait AI, and multi-layer masks.',
    stages: ['develop', 'retouch', 'layers', 'mask', 'export'],
  },
  social_creator: {
    name: 'Social Media Creator',
    description: 'Fast workflow with AI enhancements, graphic design, typography, and social export.',
    stages: ['library', 'develop', 'ai', 'design', 'export'],
  },
  minimalist: {
    name: 'Minimalist Focus',
    description: 'Clean distraction-free workflow with core color grading, AI auto-fix, and export.',
    stages: ['develop', 'ai', 'export'],
  },
  custom: {
    name: 'Custom User Workspace',
    description: 'Tailored workspace layout configured to your exact editing habits.',
    stages: ['library', 'develop', 'select', 'mask', 'retouch', 'layers', 'ai', 'design', 'export'],
  },
};

const WORKSPACE_STORAGE_KEY = 'lumina_workspace_configuration_v2';

export const DEFAULT_WORKSPACE_CONFIG: WorkspaceConfig = {
  activeStage: 'develop',
  visibleStages: [...ALL_STAGES_ORDER],
  stageOrder: [...ALL_STAGES_ORDER],
  activePresetId: 'master_suite',
  customPresets: [],
  sidebarPosition: 'right',
  leftDockVisible: true,
  rightDockVisible: true,
  filmstripVisible: true,
  histogramVisible: true,
  compactStageBar: false,
  keyboardShortcutsEnabled: true,
};

export function loadWorkspaceConfig(): WorkspaceConfig {
  if (typeof window === 'undefined') return DEFAULT_WORKSPACE_CONFIG;
  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_WORKSPACE_CONFIG,
        ...parsed,
        visibleStages: parsed.visibleStages || [...ALL_STAGES_ORDER],
        stageOrder: parsed.stageOrder || [...ALL_STAGES_ORDER],
      };
    }
  } catch (e) {
    console.error('Failed to load workspace config:', e);
  }
  return DEFAULT_WORKSPACE_CONFIG;
}

export function saveWorkspaceConfig(config: WorkspaceConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save workspace config:', e);
  }
}
