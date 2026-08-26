export type EngineExecutionMode = 'LOCAL_OFFLINE' | 'CLOUD_GROQ_HYBRID';

export interface HybridCapability {
  id: string;
  name: string;
  category: 'core_editing' | 'color_curves' | 'masks_layers' | 'raw_retouch' | 'cloud_ai' | 'export';
  mode: 'OFFLINE_LOCAL' | 'ONLINE_GROQ' | 'HYBRID_INTELLIGENT';
  executionLocation: 'Client WebGL / WASM (0ms Latency)' | 'Groq LPU Cloud (~40ms Inference)';
  description: string;
  offlineReady: boolean;
  status: 'active' | 'available' | 'cached';
  badge: string;
}

export interface HybridSystemStatus {
  isOnline: boolean;
  isGroqConnected: boolean;
  activeMode: EngineExecutionMode;
  localEngineHealth: 'optimal' | 'degraded';
  localEngineFps: number;
  offlineFeaturesAvailableCount: number;
  cloudAiFeaturesAvailableCount: number;
  fallbackActive: boolean;
}

export const HYBRID_CAPABILITIES: HybridCapability[] = [
  // --- OFFLINE / LOCAL PROCESSING ---
  {
    id: 'cap_crop_rotate',
    name: 'Crop, Perspective & Transform',
    category: 'core_editing',
    mode: 'OFFLINE_LOCAL',
    executionLocation: 'Client WebGL / WASM (0ms Latency)',
    description: 'Lossless viewport cropping, horizon leveling, perspective trapezoid keystone, and 90°/180° rotation.',
    offlineReady: true,
    status: 'active',
    badge: '100% OFFLINE',
  },
  {
    id: 'cap_exposure_color',
    name: 'Exposure, Color & Lighting',
    category: 'color_curves',
    mode: 'OFFLINE_LOCAL',
    executionLocation: 'Client WebGL / WASM (0ms Latency)',
    description: '32-bit floating point exposure, contrast, highlights, shadows, whites, blacks, temperature, and vibrance.',
    offlineReady: true,
    status: 'active',
    badge: '100% OFFLINE',
  },
  {
    id: 'cap_curves_hsl',
    name: 'Tone Curves & 8-Channel HSL',
    category: 'color_curves',
    mode: 'OFFLINE_LOCAL',
    executionLocation: 'Client WebGL / WASM (0ms Latency)',
    description: 'Spline-interpolated RGB / luminance tone curves, 8-channel hue/saturation/luminance vectors, and split-toning.',
    offlineReady: true,
    status: 'active',
    badge: '100% OFFLINE',
  },
  {
    id: 'cap_filters_lut',
    name: 'Filters & 3D LUT Presets',
    category: 'core_editing',
    mode: 'OFFLINE_LOCAL',
    executionLocation: 'Client WebGL / WASM (0ms Latency)',
    description: 'Instant film simulation presets, cinema LUTs, chromatic aberration, film grain synthesis, and vignettes.',
    offlineReady: true,
    status: 'active',
    badge: '100% OFFLINE',
  },
  {
    id: 'cap_layers_masks',
    name: 'Multi-Track Layers & Masking',
    category: 'masks_layers',
    mode: 'OFFLINE_LOCAL',
    executionLocation: 'Client WebGL / WASM (0ms Latency)',
    description: 'Radial gradients, linear masks, brush masks, layer blending modes (Screen, Multiply, Overlay), and sub-pixel feathering.',
    offlineReady: true,
    status: 'active',
    badge: '100% OFFLINE',
  },
  {
    id: 'cap_drawing_annotate',
    name: 'Vector Drawing & Retouching',
    category: 'raw_retouch',
    mode: 'OFFLINE_LOCAL',
    executionLocation: 'Client WebGL / WASM (0ms Latency)',
    description: 'Pressure-sensitive brush strokes, clone stamp, frequency separation skin retouch, and vector annotations.',
    offlineReady: true,
    status: 'active',
    badge: '100% OFFLINE',
  },
  {
    id: 'cap_raw_processing',
    name: 'RAW Sensor Demosaicing (DNG / ARW / CR3)',
    category: 'raw_retouch',
    mode: 'OFFLINE_LOCAL',
    executionLocation: 'Client WebGL / WASM (0ms Latency)',
    description: 'High-bit-depth Bayer pattern demosaicing, black-level calibration, and chromatic aberration correction.',
    offlineReady: true,
    status: 'active',
    badge: '100% OFFLINE',
  },
  {
    id: 'cap_export_engine',
    name: 'High-Res Multi-Format Export',
    category: 'export',
    mode: 'OFFLINE_LOCAL',
    executionLocation: 'Client WebGL / WASM (0ms Latency)',
    description: 'Full-resolution rendering to WebP, 16-bit TIFF, JPEG, and PNG with metadata preservation and color profiles.',
    offlineReady: true,
    status: 'active',
    badge: '100% OFFLINE',
  },

  // --- ONLINE / GROQ CLOUD PROCESSING ---
  {
    id: 'cap_nlp_editing',
    name: 'Natural-Language Editing',
    category: 'cloud_ai',
    mode: 'ONLINE_GROQ',
    executionLocation: 'Groq LPU Cloud (~40ms Inference)',
    description: 'Interprets conversational user intent ("Give this a moody Scandinavian film look") and compiles into tool calls.',
    offlineReady: false,
    status: 'active',
    badge: 'GROQ CLOUD',
  },
  {
    id: 'cap_ai_planning',
    name: 'Multi-Stage AI Planning',
    category: 'cloud_ai',
    mode: 'ONLINE_GROQ',
    executionLocation: 'Groq LPU Cloud (~40ms Inference)',
    description: 'Decomposes complex photographic requests into ordered, multi-track parametric adjustment graphs.',
    offlineReady: false,
    status: 'active',
    badge: 'GROQ CLOUD',
  },
  {
    id: 'cap_image_understanding',
    name: 'Multimodal Vision Understanding',
    category: 'cloud_ai',
    mode: 'ONLINE_GROQ',
    executionLocation: 'Groq LPU Cloud (~40ms Inference)',
    description: 'Llama 3.2 Vision evaluates image exposure balance, scene classification, lighting azimuth, and facial landmarks.',
    offlineReady: false,
    status: 'active',
    badge: 'GROQ CLOUD',
  },
  {
    id: 'cap_workflow_gen',
    name: 'Complex Workflow Generation',
    category: 'cloud_ai',
    mode: 'ONLINE_GROQ',
    executionLocation: 'Groq LPU Cloud (~40ms Inference)',
    description: 'Synthesizes specialized multi-model recipes (e.g. background relocation with physical contact shadow meshes).',
    offlineReady: false,
    status: 'active',
    badge: 'GROQ CLOUD',
  },
  {
    id: 'cap_smart_recs',
    name: 'Intelligent Recommendations & Tool Selection',
    category: 'cloud_ai',
    mode: 'ONLINE_GROQ',
    executionLocation: 'Groq LPU Cloud (~40ms Inference)',
    description: 'Analyzes dynamic histogram telemetry to suggest auto-contrast corrections and complementary split-tones.',
    offlineReady: false,
    status: 'active',
    badge: 'GROQ CLOUD',
  },
];
