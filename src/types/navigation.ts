import { LucideIcon } from 'lucide-react';
import { FilterPreset, Project, ImageFile } from './editor';

export type MainNavTab =
  | 'home'
  | 'projects'
  | 'photo'
  | 'editor'
  | 'design'
  | 'collage'
  | 'ai'
  | 'aistudio'
  | 'assets'
  | 'library'
  | 'presets'
  | 'export'
  | 'cloud'
  | 'collaboration'
  | 'system'
  | 'settings';

export type UserSkillMode = 'beginner' | 'pro';

export type ToolCategoryId =
  | 'raw'
  | 'color'
  | 'light'
  | 'curves'
  | 'hsl'
  | 'masks'
  | 'retouch'
  | 'layers'
  | 'design'
  | 'typography'
  | 'collage'
  | 'ai'
  | 'export'
  | 'utility'
  | 'basic'
  | 'detail'
  | 'portrait'
  | 'effects';

export interface ToolDefinition {
  id: string;
  name: string;
  categoryId: ToolCategoryId;
  description: string;
  iconName: string;
  shortcut?: string;
  isProOnly?: boolean;
  isAiPowered?: boolean;
  engineType?: 'LOCAL' | 'HYBRID' | 'AI';
  isOfflineCapable?: boolean;
  requiresCloudAi?: boolean;
  privacyNotice?: string;
  targetTab?: string; // tool tab inside Editor or specific view
  targetAction?: string;
  keywords: string[];
  education: {
    whatItDoes: string;
    whenToUse: string;
    proTip: string;
    sampleEffect: string;
  };
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'tool' | 'preset' | 'project' | 'photo' | 'tutorial' | 'setting' | 'ai_intent';
  category?: string;
  shortcut?: string;
  iconName?: string;
  action: () => void;
  badge?: string;
  engineType?: 'LOCAL' | 'HYBRID' | 'AI';
}

export interface ToolEducationData {
  id: string;
  title: string;
  category: string;
  whatItDoes: string;
  whenToUse: string;
  proTip: string;
  sampleEffect: string;
  sampleBeforeAfterText: { before: string; after: string };
}
