export type BYOKPipelineStageId =
  | 'USER'
  | 'PHOTO_EDITOR'
  | 'AI_COMMAND_BOX'
  | 'AI_ORCHESTRATOR'
  | 'GROQ_API_CLIENT'
  | 'GROQ_API'
  | 'STRUCTURED_AI_RESPONSE'
  | 'TOOL_VALIDATOR'
  | 'EDITING_ENGINE'
  | 'RENDERER'
  | 'AI_VERIFICATION'
  | 'RESULT';

export interface BYOKPipelineStage {
  id: BYOKPipelineStageId;
  order: number;
  name: string;
  category: 'ui' | 'orchestration' | 'isolated_network' | 'validation' | 'rendering' | 'verification';
  hasAccessToAPIKey: boolean; // MUST BE FALSE for all stages except GROQ_API_CLIENT!
  inputDataSummary: string;
  outputDataSummary: string;
  securityGuarantee: string;
  description: string;
  componentReference: string;
  dataPayloadExample: string;
}

export interface BYOKSecurityAudit {
  keyIsolationCertified: boolean;
  zeroKeyLeakageInCanvasState: boolean;
  zeroKeyLeakageInProjectFiles: boolean;
  zeroKeyLeakageInTelemetryLogs: boolean;
  zeroKeyLeakageInShaders: boolean;
  isolatedEnclosure: 'In-Memory Secure Client Module (Session Only)';
  transitProtocol: 'Direct TLS 1.3 / HTTPS to api.groq.com';
}

export const GROQ_BYOK_STAGES: BYOKPipelineStage[] = [
  {
    id: 'USER',
    order: 1,
    name: '1. User',
    category: 'ui',
    hasAccessToAPIKey: false,
    inputDataSummary: 'Natural language intent or visual gesture',
    outputDataSummary: 'User prompt: "Make me look like I’m in a luxury hotel at night, keep face untouched"',
    securityGuarantee: 'User holds private key in browser memory only; never transmitted to applet servers',
    description: 'The creative user interacts with the interface and initiates an edit command.',
    componentReference: 'Human User Interface Interaction',
    dataPayloadExample: 'Intent: "Enhance lighting & isolate background"',
  },
  {
    id: 'PHOTO_EDITOR',
    order: 2,
    name: '2. Photo Editor',
    category: 'ui',
    hasAccessToAPIKey: false,
    inputDataSummary: 'Canvas state, current active layer, selected tool',
    outputDataSummary: 'Editor context: Active canvas resolution (3840x2160), color profile (ProPhoto RGB)',
    securityGuarantee: 'Editor state is 100% key-agnostic; no key stored in Redux/React state tree',
    description: 'The core editing studio hosting the multi-track layers, tools, and canvas viewport.',
    componentReference: 'PhotoEditorCore.tsx / Workspace.tsx',
    dataPayloadExample: '{ canvasWidth: 3840, canvasHeight: 2160, activeLayer: "Layer_0" }',
  },
  {
    id: 'AI_COMMAND_BOX',
    order: 3,
    name: '3. AI Command Box',
    category: 'ui',
    hasAccessToAPIKey: false,
    inputDataSummary: 'Natural language text input, preset pills, voice transcriptions',
    outputDataSummary: 'Sanitized text payload without system credentials',
    securityGuarantee: 'Zero credential binding in input buffers or autocomplete history',
    description: 'The floating natural language interface where users type prompts and select benchmarks.',
    componentReference: 'NaturalLanguageEditingPanel.tsx',
    dataPayloadExample: '{ prompt: "Apply 2800K warm ambient key lighting and lock face" }',
  },
  {
    id: 'AI_ORCHESTRATOR',
    order: 4,
    name: '4. AI Orchestrator',
    category: 'orchestration',
    hasAccessToAPIKey: false,
    inputDataSummary: 'Sanitized prompt + active parameter context (current exposure, curves, masks)',
    outputDataSummary: 'Model prompt payload + tool schema definitions for Groq LPU',
    securityGuarantee: 'Orchestrator handles prompt engineering & tool schemas only; zero key access',
    description: 'Decomposes intent into structured tool-calling schemas and parameter constraints.',
    componentReference: 'naturalLanguageEditingEngine.ts / multiModelPipelineService.ts',
    dataPayloadExample: '{ system: "You are a professional color grading engine...", tools: [...] }',
  },
  {
    id: 'GROQ_API_CLIENT',
    order: 5,
    name: '5. Groq API Client (Isolated Key Enclosure)',
    category: 'isolated_network',
    hasAccessToAPIKey: true, // THE ONLY LAYER WITH KEY ACCESS
    inputDataSummary: 'Orchestration payload (System prompt + User prompt + Tools schema)',
    outputDataSummary: 'Encrypted HTTPS Request with Authorization: Bearer gsk_***',
    securityGuarantee: 'SECURE ENCLOSURE: Key injected strictly at outbound request header creation and purged immediately from stack frames. Key NEVER leaves client device.',
    description: 'The isolated cryptographic network client responsible for direct HTTPS communication with Groq.',
    componentReference: 'groqService.ts (Isolated Module Scope)',
    dataPayloadExample: 'Headers: { Authorization: "Bearer [ISOLATED_IN_MEMORY_ONLY]" }',
  },
  {
    id: 'GROQ_API',
    order: 6,
    name: '6. Groq API (LPU Inference Engine)',
    category: 'isolated_network',
    hasAccessToAPIKey: false,
    inputDataSummary: 'Inbound TLS 1.3 encrypted inference request',
    outputDataSummary: 'Raw JSON Stream / Tool Calls at ~800 tokens/sec',
    securityGuarantee: 'End-to-end encrypted direct connection to Groq API infrastructure',
    description: 'Groq LPUs process the prompt with ultra-low latency and generate tool calls.',
    componentReference: 'https://api.groq.com/openai/v1/chat/completions',
    dataPayloadExample: '{ tool_calls: [{ function: { name: "apply_face_lock", arguments: {...} } }] }',
  },
  {
    id: 'STRUCTURED_AI_RESPONSE',
    order: 7,
    name: '7. Structured AI Response',
    category: 'validation',
    hasAccessToAPIKey: false,
    inputDataSummary: 'Raw Groq JSON response buffer',
    outputDataSummary: 'Parsed function call payloads (e.g. apply_adjustment, create_mask, relight_subject)',
    securityGuarantee: 'Contains strictly numeric color parameters, curve points, and mask boundaries; zero key data',
    description: 'Decodes the JSON tool calling outputs into typed editing commands.',
    componentReference: 'aiToolCallingService.ts',
    dataPayloadExample: '{ name: "apply_adjustments", args: { temperature: 16, contrast: 8 } }',
  },
  {
    id: 'TOOL_VALIDATOR',
    order: 8,
    name: '8. Tool Validator',
    category: 'validation',
    hasAccessToAPIKey: false,
    inputDataSummary: 'Parsed tool arguments',
    outputDataSummary: 'Validated, range-clamped, sanitized parameter diffs',
    securityGuarantee: 'Enforces safety limits (e.g. clamping temperature to -100..+100, checking mask polygons)',
    description: 'Guards against hallucinated parameters, out-of-range floats, or malformed data.',
    componentReference: 'aiToolCallingEngine.ts / executeValidatedToolCall()',
    dataPayloadExample: '{ valid: true, clampedExposure: -10, verifiedFacePolygon: true }',
  },
  {
    id: 'EDITING_ENGINE',
    order: 9,
    name: '9. Editing Engine',
    category: 'rendering',
    hasAccessToAPIKey: false,
    inputDataSummary: 'Validated parameter adjustments + selective mask definitions',
    outputDataSummary: 'Updated non-destructive project state graph & WebGL uniform buffers',
    securityGuarantee: 'State graph is pure mathematical color science; zero credential leakage',
    description: 'Updates tone curves, HSL channels, selective alpha masks, and history stack.',
    componentReference: 'webglEngine.ts / projectStore.ts',
    dataPayloadExample: '{ stateVersion: 142, masksUpdated: 3, uniformsBound: true }',
  },
  {
    id: 'RENDERER',
    order: 10,
    name: '10. WebGL Renderer',
    category: 'rendering',
    hasAccessToAPIKey: false,
    inputDataSummary: 'GLSL Shaders, 32-bit Float Framebuffers, Texture Units',
    outputDataSummary: 'Real-time GPU rendered viewport pixels (60fps float pipeline)',
    securityGuarantee: 'Direct GPU shader execution with zero network or credential access',
    description: 'Compiles and renders WebGL 2.0 fragment shaders with color grading and mask fusion.',
    componentReference: 'webglPipeline.ts / shaders/masterGrade.glsl',
    dataPayloadExample: 'GL Uniforms: u_temperature = 0.16, u_contrast = 1.08, u_maskCount = 3',
  },
  {
    id: 'AI_VERIFICATION',
    order: 11,
    name: '11. AI Verification Suite',
    category: 'verification',
    hasAccessToAPIKey: false,
    inputDataSummary: 'Pre-edit buffer vs Post-edit rendered framebuffer',
    outputDataSummary: '9-Vector Safety & Quality Audit Scorecard (Identity, Halos, Lighting)',
    securityGuarantee: 'Audit engine inspects pixel matrices; zero credential or private token inspection',
    description: 'Runs the 9 mandatory safety audits and triggers closed-loop repair if needed.',
    componentReference: 'aiVerificationService.ts',
    dataPayloadExample: '{ passRate: 100%, biometricSSIM: 1.000, lightingConvergence: 99.4% }',
  },
  {
    id: 'RESULT',
    order: 12,
    name: '12. Final Result Canvas',
    category: 'verification',
    hasAccessToAPIKey: false,
    inputDataSummary: 'Verified 32-bit float composited canvas',
    outputDataSummary: 'Pristine, export-ready high dynamic range image',
    securityGuarantee: 'Exported PNG/TIFF/WebP contains zero metadata trace of API keys or credentials',
    description: 'The final, non-destructive, verified masterpiece displayed to the user.',
    componentReference: 'CanvasViewport.tsx / ExportModal.tsx',
    dataPayloadExample: 'Canvas 3840x2160 ProPhoto RGB (Verified 100% Identity Intact)',
  },
];
