import { GroqModelInfo } from './groq';

export type GroqTaskCategory =
  | 'simple_command'       // e.g. "make it slightly brighter", "increase contrast +10" -> Fast AI Model
  | 'complex_plan'          // e.g. "Make the person brighter but don't change the sky", multi-track operations -> Reasoning Model
  | 'image_understanding'   // e.g. "Analyze this photo's lighting, composition and dynamic range" -> Vision Model
  | 'object_classification' // e.g. "Identify subject, sky, foliage, skin tone regions" -> Vision Model
  | 'batch_commands'        // e.g. "Apply moody preset to 50 photos", macro automation -> Fast AI Model
  | 'creative_interpretation'; // e.g. "Cinematic Blade Runner 2049 mood", aesthetic grading -> Strong Language Model

export type GroqRouterMode =
  | 'auto'    // Automatic intelligent intent classification & dispatch
  | 'manual'  // Fixed single model override
  | 'policy'; // Policy driven (speed_optimized, cost_optimized, quality_optimized)

export type GroqOptimizationStrategy =
  | 'balanced'
  | 'speed_optimized'
  | 'quality_optimized'
  | 'cost_optimized';

export interface TaskModelMapping {
  simple_command: string;          // Default: 'llama-3.1-8b-instant'
  complex_plan: string;            // Default: 'deepseek-r1-distill-llama-70b'
  image_understanding: string;     // Default: 'llama-3.2-90b-vision-preview'
  object_classification: string;   // Default: 'llama-3.2-11b-vision-preview'
  batch_commands: string;          // Default: 'llama-3.1-8b-instant'
  creative_interpretation: string; // Default: 'llama-3.3-70b-versatile'
}

export interface RouterDecision {
  taskCategory: GroqTaskCategory;
  selectedModel: string;
  modelInfo?: GroqModelInfo;
  reason: string;
  confidenceScore: number; // 0 to 100
  speedTier: 'ultra_fast' | 'fast' | 'balanced' | 'deep_reasoning';
  isVisionCapable: boolean;
  hasImagePayload: boolean;
  estimatedLatencyMs: number;
  fallbackModel: string;
}

export interface RouterRule {
  id: string;
  name: string;
  condition: 'regex' | 'token_count_gt' | 'has_image' | 'task_match';
  value: string | number;
  targetModel: string;
  enabled: boolean;
  priority: number;
}

export interface GroqRouterConfig {
  mode: GroqRouterMode;
  strategy: GroqOptimizationStrategy;
  taskMapping: TaskModelMapping;
  customRules: RouterRule[];
  fallbackChain: string[];
  autoSyncCatalog: boolean;
  lastSyncedTimestamp?: number;
}

export const DEFAULT_TASK_MODEL_MAPPING: TaskModelMapping = {
  simple_command: 'llama-3.1-8b-instant',
  complex_plan: 'deepseek-r1-distill-llama-70b',
  image_understanding: 'llama-3.2-90b-vision-preview',
  object_classification: 'llama-3.2-11b-vision-preview',
  batch_commands: 'llama-3.1-8b-instant',
  creative_interpretation: 'llama-3.3-70b-versatile',
};

export const DEFAULT_ROUTER_CONFIG: GroqRouterConfig = {
  mode: 'auto',
  strategy: 'balanced',
  taskMapping: { ...DEFAULT_TASK_MODEL_MAPPING },
  customRules: [
    {
      id: 'rule_image_present',
      name: 'Direct Image Frame Attached',
      condition: 'has_image',
      value: 'true',
      targetModel: 'llama-3.2-11b-vision-preview',
      enabled: true,
      priority: 100,
    },
    {
      id: 'rule_complex_reasoning',
      name: 'Tone Curve & Color Science Math',
      condition: 'regex',
      value: '(curve|s-curve|histogram|dynamic range|deconstruct|multi-step|math|lut|decompose)',
      targetModel: 'deepseek-r1-distill-llama-70b',
      enabled: true,
      priority: 80,
    },
    {
      id: 'rule_fast_micro_adjust',
      name: 'Quick Adjustment Slider Tweak',
      condition: 'regex',
      value: '^(more|less|brighter|darker|warmer|cooler|contrast|sharpen|exposure\\s*[+\\-]?\\d+)',
      targetModel: 'llama-3.1-8b-instant',
      enabled: true,
      priority: 70,
    },
  ],
  fallbackChain: [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
  ],
  autoSyncCatalog: true,
};

export const TASK_DEFINITIONS: Record<
  GroqTaskCategory,
  {
    title: string;
    description: string;
    targetTier: 'Vision' | 'Reasoning' | 'Fast AI' | 'Language';
    examplePrompt: string;
    icon: string;
  }
> = {
  simple_command: {
    title: 'Simple Editing Command',
    description: 'Instant micro-adjustments, slider tweaks, and single parameter changes.',
    targetTier: 'Fast AI',
    examplePrompt: '"Make it slightly brighter and add +10 contrast"',
    icon: 'Zap',
  },
  complex_plan: {
    title: 'Complex Editing Plan',
    description: 'Multi-step action plans, deconstructions, tone curves, and exclusion logic.',
    targetTier: 'Reasoning',
    examplePrompt: '"Make the person brighter but don\'t change the sky"',
    icon: 'Brain',
  },
  image_understanding: {
    title: 'Image Understanding',
    description: 'Visual scene breakdown, composition analysis, and dynamic range diagnosis.',
    targetTier: 'Vision',
    examplePrompt: '"Inspect lighting angle, shadows, and composition quality"',
    icon: 'Eye',
  },
  object_classification: {
    title: 'Object Classification',
    description: 'Semantic region detection (subject, sky, skin, foliage, background).',
    targetTier: 'Vision',
    examplePrompt: '"Locate subject, foreground elements, and sky boundaries"',
    icon: 'Layers',
  },
  batch_commands: {
    title: 'Batch Commands',
    description: 'High-throughput macro execution and repetitive batch preset application.',
    targetTier: 'Fast AI',
    examplePrompt: '"Batch normalize white balance across 50 raw portraits"',
    icon: 'Cpu',
  },
  creative_interpretation: {
    title: 'Creative Prompt Interpretation',
    description: 'Nuanced aesthetic directions, film moods, and poetic color science.',
    targetTier: 'Language',
    examplePrompt: '"Make this look like a 35mm Hollywood movie still with anamorphic glow"',
    icon: 'Sparkles',
  },
};
