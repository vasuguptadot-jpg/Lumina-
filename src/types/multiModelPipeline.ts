import {
  AdjustmentSettings,
  ToneCurves,
  HSLSettings,
  SelectiveMask,
  CropSettings,
} from './editor';

export type OrchestrationStage =
  | 'GROQ_UNDERSTAND'
  | 'GROQ_CREATE_PLAN'
  | 'PARALLEL_EXECUTION'
  | 'COMPOSITOR'
  | 'VERIFICATION'
  | 'EXPORT';

export type SpecializedWorkerType =
  | 'IMAGE_GEN_MODEL'   // Specialized generative image model (e.g. background synthesis, inpainting)
  | 'VISION_AI_MODEL'   // Specialized multimodal vision AI (e.g. landmark detection, depth plane, gaze tracking)
  | 'PARAMETRIC_EDITOR' // Deterministic WebGL / Lightroom-grade parametric image engine
  | 'COMPOSITOR_ENGINE' // Sub-pixel alpha matte, lighting transfer, shadow fusion
  | 'QA_VERIFIER';      // Biometric SSIM, edge halo check, perspective convergence verifier

export interface MultiModelWorkerTask {
  id: string;
  name: string;
  workerType: SpecializedWorkerType;
  workerName: string;
  modelIdentifier: string;
  provider: 'groq' | 'gemini' | 'flux_gen' | 'local_webgl' | 'sam_vision';
  status: 'idle' | 'in_progress' | 'completed' | 'error';
  latencyMs: number;
  inputDataSummary: string;
  outputSummary: string;
  outputPayload?: {
    masks?: SelectiveMask[];
    adjustments?: Partial<AdjustmentSettings>;
    curves?: Partial<ToneCurves>;
    hsl?: Partial<HSLSettings>;
    crop?: Partial<CropSettings>;
    generatedAssetUrl?: string;
    biometricVerificationScore?: number;
    convergenceScore?: number;
  };
  details: string;
}

export interface MultiModelPipelineRun {
  id: string;
  userPrompt: string;
  startedAt: number;
  completedAt?: number;
  currentStage: OrchestrationStage;
  stageProgress: number; // 0 - 100
  orchestrator: {
    model: string;
    role: 'Groq LPU Reasoning Brain & Orchestrator';
    tokensUsed: number;
    latencyMs: number;
    planSummary: string;
  };
  workers: {
    imageModelTask: MultiModelWorkerTask;
    visionAITask: MultiModelWorkerTask;
    editorTask: MultiModelWorkerTask;
  };
  compositor: {
    task: MultiModelWorkerTask;
    alphaMatteLayers: number;
    colorTransferMode: string;
    shadowOcclusionPenumbra: string;
  };
  verification: {
    task: MultiModelWorkerTask;
    identityPreservationScore: number; // e.g. 100.0%
    lightingConvergenceScore: number;   // e.g. 99.4%
    perspectiveAlignmentScore: number;  // e.g. 98.7%
    edgeHaloArtifactDelta: number;      // e.g. 0.01%
    status: 'passed' | 'warning' | 'failed';
  };
  exportArtifacts: {
    targetFormat: '32-bit Float Non-Destructive' | '16-bit ProPhoto' | '8-bit WebP/PNG';
    readyForStudioApply: boolean;
    appliedToProject: boolean;
  };
}

export interface MultiModelArchitecturePreset {
  id: string;
  title: string;
  prompt: string;
  description: string;
  badge: string;
  icon: string;
  targetEnvironment: string;
}

export const MULTI_MODEL_PRESETS: MultiModelArchitecturePreset[] = [
  {
    id: 'luxury-hotel-suite-night',
    title: 'Luxury Hotel Suite at Night (Identity Lock)',
    prompt: 'Make me look like I’m standing in a luxury hotel at night, but keep my face exactly the same.',
    description: 'Groq decomposes request into parallel tasks: Image model renders 2800K luxury lounge background, Vision AI locks 68 3D facial landmarks & depth plane, Editor applies parametric lighting & split-toning, Compositor fuses contact shadows, QA Verifier certifies 100% identity preservation.',
    badge: '12-STAGE ORCHESTRATION',
    icon: 'Building2',
    targetEnvironment: 'Luxury Hotel Suite & Ambient Night Lounge',
  },
  {
    id: 'cyberpunk-neon-relocate',
    title: 'Cyberpunk Tokyo Rain (Face Preserved)',
    prompt: 'Relocate me to a rainy neon Tokyo alley with magenta rim light and wet asphalt reflections, keeping facial features 100% untouched.',
    description: 'Groq dispatches Image Model for neon cityscape synthesis, Vision AI for silhouette alpha matting & reflection vectors, Editor for cyan-magenta split tones, and Compositor for surface specular grounding.',
    badge: 'MULTI-MODEL RELOCATE',
    icon: 'Zap',
    targetEnvironment: 'Tokyo Midnight Rain & Neon Alley',
  },
  {
    id: 'sunset-golden-editorial',
    title: 'Golden Hour Tuscan Villa (Face Preserved)',
    prompt: 'Place me in a warm golden hour Tuscan vineyard at sunset with soft sun flare, maintaining exact facial identity.',
    description: 'Groq orchestrates high-dynamic-range golden hour sky synthesis, facial landmark protection, warm 5600K key light calibration, and sub-pixel edge flare convolution.',
    badge: 'GOLDEN HOUR COMPOSITING',
    icon: 'Sunset',
    targetEnvironment: 'Tuscan Vineyard Sunset & Warm Sun Flare',
  },
];
