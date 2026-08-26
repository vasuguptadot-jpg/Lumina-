import {
  GroqRouterConfig,
  GroqTaskCategory,
  RouterDecision,
  DEFAULT_ROUTER_CONFIG,
  DEFAULT_TASK_MODEL_MAPPING,
  TaskModelMapping,
} from '../types/groqRouter';
import { GroqModelInfo, GROQ_SUPPORTED_MODELS } from '../types/groq';
import { getGroqConfig, sendGroqChat, sendGroqVision } from './groqService';

const STORAGE_KEY_ROUTER_CONFIG = 'lumina_groq_router_config_v1';
const STORAGE_KEY_DYNAMIC_MODELS = 'lumina_groq_dynamic_models_v1';

// ----------------------------------------------------------------------------
// 1. CONFIGURATION STORAGE & RETRIEVAL
// ----------------------------------------------------------------------------

export function getGroqRouterConfig(): GroqRouterConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ROUTER_CONFIG);
    if (!raw) return { ...DEFAULT_ROUTER_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_ROUTER_CONFIG,
      ...parsed,
      taskMapping: {
        ...DEFAULT_TASK_MODEL_MAPPING,
        ...(parsed.taskMapping || {}),
      },
    };
  } catch {
    return { ...DEFAULT_ROUTER_CONFIG };
  }
}

export function saveGroqRouterConfig(config: Partial<GroqRouterConfig>): GroqRouterConfig {
  const current = getGroqRouterConfig();
  const updated: GroqRouterConfig = {
    ...current,
    ...config,
    taskMapping: {
      ...current.taskMapping,
      ...(config.taskMapping || {}),
    },
  };
  localStorage.setItem(STORAGE_KEY_ROUTER_CONFIG, JSON.stringify(updated));
  return updated;
}

export function updateTaskModelMapping(task: GroqTaskCategory, modelId: string): GroqRouterConfig {
  const current = getGroqRouterConfig();
  const updatedMapping: TaskModelMapping = {
    ...current.taskMapping,
    [task]: modelId,
  };
  return saveGroqRouterConfig({ taskMapping: updatedMapping });
}

// ----------------------------------------------------------------------------
// 2. DYNAMIC MODEL CATALOG (UPDATES AS GROQ EXPANDS ITS PORTFOLIO)
// ----------------------------------------------------------------------------

export function getAllKnownGroqModels(): GroqModelInfo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DYNAMIC_MODELS);
    const dynamicModels: GroqModelInfo[] = raw ? JSON.parse(raw) : [];
    
    // Merge static built-in models with any dynamically discovered models
    const map = new Map<string, GroqModelInfo>();
    for (const m of GROQ_SUPPORTED_MODELS) {
      map.set(m.id, m);
    }
    for (const d of dynamicModels) {
      map.set(d.id, d);
    }
    return Array.from(map.values());
  } catch {
    return GROQ_SUPPORTED_MODELS;
  }
}

export async function syncGroqCatalogOnline(): Promise<{
  success: boolean;
  discoveredCount: number;
  models: GroqModelInfo[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/groq/list-models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) {
      return {
        success: false,
        discoveredCount: 0,
        models: getAllKnownGroqModels(),
        error: json.error || 'Failed to list models from Groq API',
      };
    }

    const fetchedIds: string[] = json.data.map((item: any) => item.id);
    const currentList = getAllKnownGroqModels();
    const existingIds = new Set(currentList.map((m) => m.id));

    const newlyDiscovered: GroqModelInfo[] = [];
    for (const id of fetchedIds) {
      if (!existingIds.has(id)) {
        const isVision = id.includes('vision');
        const isReasoning = id.includes('r1') || id.includes('deepseek') || id.includes('70b');
        const isFast = id.includes('8b') || id.includes('instant') || id.includes('11b');

        const newModel: GroqModelInfo = {
          id,
          name: id
            .split('-')
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' '),
          contextWindow: id.includes('128k') || id.includes('llama-3') ? 128000 : 32768,
          isVision,
          speedTier: isFast ? 'ultra_fast' : isReasoning ? 'deep_reasoning' : isVision ? 'balanced' : 'fast',
          description: `Dynamically synced model from Groq API catalog (${id}).`,
          pricingPerMillionTokens: {
            prompt: isFast ? 0.08 : isReasoning ? 0.75 : 0.5,
            completion: isFast ? 0.1 : isReasoning ? 0.99 : 0.8,
          },
        };
        newlyDiscovered.push(newModel);
      }
    }

    if (newlyDiscovered.length > 0) {
      const merged = [...currentList, ...newlyDiscovered];
      localStorage.setItem(STORAGE_KEY_DYNAMIC_MODELS, JSON.stringify(merged));
      saveGroqRouterConfig({ lastSyncedTimestamp: Date.now() });
    }

    return {
      success: true,
      discoveredCount: newlyDiscovered.length,
      models: getAllKnownGroqModels(),
    };
  } catch (err: any) {
    return {
      success: false,
      discoveredCount: 0,
      models: getAllKnownGroqModels(),
      error: err.message,
    };
  }
}

// ----------------------------------------------------------------------------
// 3. INTELLIGENT MODEL ROUTER CLASSIFICATION ENGINE
// ----------------------------------------------------------------------------

export interface RouteRequestOptions {
  prompt?: string;
  hasImage?: boolean;
  explicitTask?: GroqTaskCategory;
  tokenEstimate?: number;
  temperature?: number;
}

export function routeGroqRequest(options: RouteRequestOptions): RouterDecision {
  const routerCfg = getGroqRouterConfig();
  const groqCfg = getGroqConfig();
  const allModels = getAllKnownGroqModels();
  const promptText = (options.prompt || '').trim();
  const pLower = promptText.toLowerCase();

  // If Router is in Manual mode, strictly use the user's explicitly selected active model
  if (routerCfg.mode === 'manual') {
    const manualModelId = groqCfg.activeModel || 'llama-3.3-70b-versatile';
    const info = allModels.find((m) => m.id === manualModelId);
    return {
      taskCategory: options.explicitTask || 'creative_interpretation',
      selectedModel: manualModelId,
      modelInfo: info,
      reason: 'Manual override active: user specified fixed model.',
      confidenceScore: 100,
      speedTier: info?.speedTier || 'fast',
      isVisionCapable: Boolean(info?.isVision),
      hasImagePayload: Boolean(options.hasImage),
      estimatedLatencyMs: info?.speedTier === 'ultra_fast' ? 180 : 450,
      fallbackModel: routerCfg.fallbackChain[0] || 'llama-3.1-8b-instant',
    };
  }

  // 1. VISION-FIRST ROUTING: If image frame is attached
  if (options.hasImage) {
    let chosenTask: GroqTaskCategory = 'image_understanding';
    if (
      pLower.includes('classify') ||
      pLower.includes('segment') ||
      pLower.includes('detect') ||
      pLower.includes('subject') ||
      pLower.includes('sky') ||
      pLower.includes('mask') ||
      options.explicitTask === 'object_classification'
    ) {
      chosenTask = 'object_classification';
    }

    const targetModel = routerCfg.taskMapping[chosenTask] || 'llama-3.2-11b-vision-preview';
    const info = allModels.find((m) => m.id === targetModel);

    return {
      taskCategory: chosenTask,
      selectedModel: targetModel,
      modelInfo: info,
      reason: `Multimodal image frame provided; dispatched to Vision LPU model (${targetModel}) for spatial scene analysis.`,
      confidenceScore: 98,
      speedTier: info?.speedTier || 'balanced',
      isVisionCapable: true,
      hasImagePayload: true,
      estimatedLatencyMs: 380,
      fallbackModel: 'llama-3.2-11b-vision-preview',
    };
  }

  // 2. EXPLICIT TASK OVERRIDE (e.g. from Batch macro runner or Natural Language deconstructor)
  if (options.explicitTask) {
    const targetModel = routerCfg.taskMapping[options.explicitTask] || 'llama-3.3-70b-versatile';
    const info = allModels.find((m) => m.id === targetModel);
    return {
      taskCategory: options.explicitTask,
      selectedModel: targetModel,
      modelInfo: info,
      reason: `Explicit task declared (${options.explicitTask}); routed to configured preferred model (${targetModel}).`,
      confidenceScore: 99,
      speedTier: info?.speedTier || 'fast',
      isVisionCapable: Boolean(info?.isVision),
      hasImagePayload: false,
      estimatedLatencyMs: info?.speedTier === 'ultra_fast' ? 120 : 350,
      fallbackModel: routerCfg.fallbackChain[0] || 'llama-3.1-8b-instant',
    };
  }

  // 3. INTENT HEURISTICS & INTEL CLASSIFIER

  // Check custom user rules first
  for (const rule of routerCfg.customRules.filter((r) => r.enabled).sort((a, b) => b.priority - a.priority)) {
    if (rule.condition === 'regex' && typeof rule.value === 'string') {
      try {
        const regex = new RegExp(rule.value, 'i');
        if (regex.test(promptText)) {
          const info = allModels.find((m) => m.id === rule.targetModel);
          return {
            taskCategory: 'complex_plan',
            selectedModel: rule.targetModel,
            modelInfo: info,
            reason: `Matched custom routing rule "${rule.name}" (pattern: ${rule.value})`,
            confidenceScore: 96,
            speedTier: info?.speedTier || 'deep_reasoning',
            isVisionCapable: Boolean(info?.isVision),
            hasImagePayload: false,
            estimatedLatencyMs: 400,
            fallbackModel: routerCfg.fallbackChain[0] || 'llama-3.3-70b-versatile',
          };
        }
      } catch {
        // Continue if invalid regex
      }
    }
  }

  // A. Complex Editing Plans & Multi-Track Reasoning
  // e.g. "Make the person brighter but don't change the sky", "Decompose into tone curves", "Exclusion masks"
  if (
    pLower.includes("don't") ||
    pLower.includes('preserve') ||
    pLower.includes('exclusion') ||
    pLower.includes('step') ||
    pLower.includes('curve') ||
    pLower.includes('s-curve') ||
    pLower.includes('histogram') ||
    pLower.includes('dynamic range') ||
    pLower.includes('tone curve') ||
    pLower.includes('deconstruct') ||
    pLower.includes('composite') ||
    promptText.length > 120
  ) {
    const targetModel = routerCfg.taskMapping.complex_plan || 'deepseek-r1-distill-llama-70b';
    const info = allModels.find((m) => m.id === targetModel);
    return {
      taskCategory: 'complex_plan',
      selectedModel: targetModel,
      modelInfo: info,
      reason: 'Multi-track logic & constraint solving detected; routed to Deep Reasoning model for chain-of-thought mathematical planning.',
      confidenceScore: 97,
      speedTier: info?.speedTier || 'deep_reasoning',
      isVisionCapable: false,
      hasImagePayload: false,
      estimatedLatencyMs: 420,
      fallbackModel: 'llama-3.3-70b-versatile',
    };
  }

  // B. Creative Prompt Interpretation & Cinematic Aesthetics
  // e.g. "Make this look like a 35mm movie still", "Nordic moody lighting", "Golden hour glow"
  if (
    pLower.includes('cinematic') ||
    pLower.includes('movie') ||
    pLower.includes('film') ||
    pLower.includes('moody') ||
    pLower.includes('golden hour') ||
    pLower.includes('sunset') ||
    pLower.includes('aesthetic') ||
    pLower.includes('vintage') ||
    pLower.includes('analog') ||
    pLower.includes('style of') ||
    pLower.includes('editorial') ||
    pLower.includes('commercial')
  ) {
    const targetModel = routerCfg.taskMapping.creative_interpretation || 'llama-3.3-70b-versatile';
    const info = allModels.find((m) => m.id === targetModel);
    return {
      taskCategory: 'creative_interpretation',
      selectedModel: targetModel,
      modelInfo: info,
      reason: 'Aesthetic color science and stylistic intent detected; routed to Flagship Language model for nuanced creative grading.',
      confidenceScore: 95,
      speedTier: info?.speedTier || 'fast',
      isVisionCapable: false,
      hasImagePayload: false,
      estimatedLatencyMs: 310,
      fallbackModel: 'llama-3.1-8b-instant',
    };
  }

  // C. Batch commands or repetitive automation
  if (
    pLower.includes('batch') ||
    pLower.includes('macro') ||
    pLower.includes('bulk') ||
    pLower.includes('all images') ||
    pLower.includes('sequence')
  ) {
    const targetModel = routerCfg.taskMapping.batch_commands || 'llama-3.1-8b-instant';
    const info = allModels.find((m) => m.id === targetModel);
    return {
      taskCategory: 'batch_commands',
      selectedModel: targetModel,
      modelInfo: info,
      reason: 'Batch/throughput automation intent detected; routed to Ultra-Fast LPU model for maximum token throughput.',
      confidenceScore: 94,
      speedTier: 'ultra_fast',
      isVisionCapable: false,
      hasImagePayload: false,
      estimatedLatencyMs: 95,
      fallbackModel: 'llama-3.3-70b-versatile',
    };
  }

  // D. Simple Editing Command (Short, single-verb slider tweaks)
  // e.g. "make it brighter", "exposure +15", "cool it down"
  const targetModel = routerCfg.taskMapping.simple_command || 'llama-3.1-8b-instant';
  const info = allModels.find((m) => m.id === targetModel);
  return {
    taskCategory: 'simple_command',
    selectedModel: targetModel,
    modelInfo: info,
    reason: 'Single-parameter adjustment or quick command detected; routed to Instant Fast model for sub-100ms response.',
    confidenceScore: 93,
    speedTier: 'ultra_fast',
    isVisionCapable: false,
    hasImagePayload: false,
    estimatedLatencyMs: 85,
    fallbackModel: 'llama-3.3-70b-versatile',
  };
}

// ----------------------------------------------------------------------------
// 4. ROUTER-DISPATCHED EXECUTION WITH AUTOMATIC FAILOVER
// ----------------------------------------------------------------------------

export async function executeRoutedGroqCall(
  prompt: string,
  options?: {
    hasImage?: boolean;
    imageBase64?: string;
    explicitTask?: GroqTaskCategory;
    jsonMode?: boolean;
    systemPrompt?: string;
    temperature?: number;
  }
): Promise<{
  decision: RouterDecision;
  success: boolean;
  content?: string;
  parsedJson?: any;
  latencyMs: number;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  modelExecuted: string;
  wasFailoverUsed?: boolean;
  error?: string;
}> {
  const decision = routeGroqRequest({
    prompt,
    hasImage: options?.hasImage || Boolean(options?.imageBase64),
    explicitTask: options?.explicitTask,
  });

  const startTime = Date.now();

  // If Vision Model Required
  if (decision.isVisionCapable && options?.imageBase64) {
    const visionRes = await sendGroqVision(
      options.imageBase64,
      prompt,
      decision.selectedModel
    );

    if (visionRes.success) {
      return {
        decision,
        success: true,
        content: JSON.stringify(visionRes.data, null, 2),
        parsedJson: visionRes.data,
        latencyMs: visionRes.latencyMs || Date.now() - startTime,
        usage: visionRes.usage,
        modelExecuted: decision.selectedModel,
      };
    }

    // Vision failover to lightweight vision model if primary failed
    if (decision.fallbackModel && decision.fallbackModel !== decision.selectedModel) {
      const fallbackRes = await sendGroqVision(
        options.imageBase64,
        prompt,
        decision.fallbackModel
      );
      if (fallbackRes.success) {
        return {
          decision,
          success: true,
          content: JSON.stringify(fallbackRes.data, null, 2),
          parsedJson: fallbackRes.data,
          latencyMs: fallbackRes.latencyMs || Date.now() - startTime,
          usage: fallbackRes.usage,
          modelExecuted: decision.fallbackModel,
          wasFailoverUsed: true,
        };
      }
    }

    return {
      decision,
      success: false,
      error: visionRes.error || 'Groq Vision router execution failed',
      latencyMs: Date.now() - startTime,
      modelExecuted: decision.selectedModel,
    };
  }

  // Text / Structured Reasoning Execution
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    {
      role: 'system',
      content:
        options?.systemPrompt ||
        'You are Lumina AI Photographic Director and Color Science Engine. Return expert results in JSON.',
    },
    { role: 'user', content: prompt },
  ];

  const chatRes = await sendGroqChat(messages, {
    model: decision.selectedModel,
    jsonMode: options?.jsonMode ?? true,
    temperature: options?.temperature ?? 0.2,
    promptSummary: `[Router:${decision.taskCategory}] ${prompt.slice(0, 50)}`,
  });

  if (chatRes.success) {
    return {
      decision,
      success: true,
      content: chatRes.content,
      parsedJson: chatRes.parsedJson,
      latencyMs: chatRes.latencyMs || Date.now() - startTime,
      usage: chatRes.usage,
      modelExecuted: decision.selectedModel,
    };
  }

  // Automatic Failover Chain execution if primary model errored (e.g. rate limit / model down)
  const routerCfg = getGroqRouterConfig();
  for (const fallbackModel of routerCfg.fallbackChain) {
    if (fallbackModel === decision.selectedModel) continue;

    const fallbackChat = await sendGroqChat(messages, {
      model: fallbackModel,
      jsonMode: options?.jsonMode ?? true,
      temperature: options?.temperature ?? 0.2,
      promptSummary: `[Router:Failover->${fallbackModel}] ${prompt.slice(0, 50)}`,
    });

    if (fallbackChat.success) {
      return {
        decision,
        success: true,
        content: fallbackChat.content,
        parsedJson: fallbackChat.parsedJson,
        latencyMs: fallbackChat.latencyMs || Date.now() - startTime,
        usage: fallbackChat.usage,
        modelExecuted: fallbackModel,
        wasFailoverUsed: true,
      };
    }
  }

  return {
    decision,
    success: false,
    error: chatRes.error || 'Router execution failed across primary and fallback models.',
    latencyMs: Date.now() - startTime,
    modelExecuted: decision.selectedModel,
  };
}
