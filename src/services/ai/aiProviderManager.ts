/**
 * Lumina Studio Pro — Universal AI Provider Manager
 *
 * Central coordinator for:
 * - Provider instance registration & removal
 * - Multi-key management per provider (Personal, Work, Testing)
 * - Connection testing & verification
 * - Task-to-Model mappings
 * - Persistence in local IndexedDB / LocalStorage
 */

import {
  StoredProviderConfig,
  AIProviderPreset,
  AIProviderId,
  AIModelDefinition,
  TaskModelAssignment,
} from '../../types/aiProviderGateway';
import { TopLevelAIProviderMode } from '../../types/localAIModels';
import { AI_PROVIDER_PRESETS } from './aiCapabilityRegistry';
import { aiCredentialVault } from './aiCredentialVault';
import { OpenAICompatibleAdapter } from './adapters/openaiAdapter';
import { GeminiAdapter } from './adapters/geminiAdapter';
import { AnthropicAdapter } from './adapters/anthropicAdapter';
import { LocalAdapter } from './adapters/localAdapter';
import { AIProviderAdapter } from './adapters/baseAdapter';

const PROVIDERS_STORAGE_KEY = 'lumina_ai_connected_providers_v1';
const TASK_MODELS_STORAGE_KEY = 'lumina_ai_task_model_mappings_v1';
const TOP_LEVEL_MODE_STORAGE_KEY = 'lumina_ai_top_level_mode_v1';

export class AIProviderManager {
  private static instance: AIProviderManager;
  private providers: Map<string, StoredProviderConfig> = new Map();
  private adapters: Map<string, AIProviderAdapter> = new Map();
  private taskMappings: TaskModelAssignment = {};
  private topLevelMode: TopLevelAIProviderMode = 'local';

  private constructor() {
    this.initAdapters();
    this.loadTopLevelMode();
    this.loadProviders();
    this.loadTaskMappings();
  }

  public static getInstance(): AIProviderManager {
    if (!AIProviderManager.instance) {
      AIProviderManager.instance = new AIProviderManager();
    }
    return AIProviderManager.instance;
  }

  private loadTopLevelMode(): void {
    try {
      const saved = localStorage.getItem(TOP_LEVEL_MODE_STORAGE_KEY) as TopLevelAIProviderMode;
      if (saved && ['local', 'user_api', 'lumina_cloud', 'none'].includes(saved)) {
        this.topLevelMode = saved;
      } else {
        this.topLevelMode = 'local';
      }
    } catch {
      this.topLevelMode = 'local';
    }
  }

  public getTopLevelMode(): TopLevelAIProviderMode {
    return this.topLevelMode;
  }

  public setTopLevelMode(mode: TopLevelAIProviderMode): void {
    this.topLevelMode = mode;
    try {
      localStorage.setItem(TOP_LEVEL_MODE_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Failed to persist AI top level mode:', e);
    }
  }

  private initAdapters(): void {
    const openai = new OpenAICompatibleAdapter('openai');
    this.adapters.set('openai', openai);
    this.adapters.set('openrouter', new OpenAICompatibleAdapter('openrouter'));
    this.adapters.set('groq', new OpenAICompatibleAdapter('groq'));
    this.adapters.set('mistral', new OpenAICompatibleAdapter('mistral'));
    this.adapters.set('together', new OpenAICompatibleAdapter('together'));
    this.adapters.set('deepseek', new OpenAICompatibleAdapter('deepseek'));
    this.adapters.set('compatible_openai', openai);
    this.adapters.set('custom', openai);

    this.adapters.set('gemini', new GeminiAdapter());
    this.adapters.set('anthropic', new AnthropicAdapter());
    this.adapters.set('local_ollama', new LocalAdapter('local_ollama'));
    this.adapters.set('local_custom', new LocalAdapter('local_custom'));
  }

  private loadProviders(): void {
    try {
      const raw = localStorage.getItem(PROVIDERS_STORAGE_KEY);
      if (raw) {
        const list: StoredProviderConfig[] = JSON.parse(raw);
        list.forEach((p) => this.providers.set(p.id, p));
      } else {
        // Bootstrap default presets in unconfigured state
        this.bootstrapPresets();
      }
    } catch {
      this.bootstrapPresets();
    }
  }

  private bootstrapPresets(): void {
    const defaultIds: AIProviderId[] = ['openai', 'gemini', 'openrouter', 'groq', 'local_ollama'];
    defaultIds.forEach((pid) => {
      const preset = AI_PROVIDER_PRESETS[pid];
      if (preset) {
        const id = `${pid}_default`;
        const item: StoredProviderConfig = {
          id,
          providerId: preset.id,
          name: preset.name,
          endpoint: preset.defaultEndpoint,
          authType: preset.authType,
          customHeaderName: preset.headerName,
          requestFormat: preset.requestFormat,
          responseFormat: preset.responseFormat,
          hasStoredKey: aiCredentialVault.hasCredential(id),
          enabled: false,
          selectedModel: preset.defaultModels[0]?.id || '',
          customModels: [...preset.defaultModels],
          capabilities: { ...preset.capabilities },
          createdAt: Date.now(),
          lastTestStatus: 'untested',
          dataRetentionPolicy: preset.dataRetentionPolicy,
        };
        this.providers.set(id, item);
      }
    });
    this.persistProviders();
  }

  private loadTaskMappings(): void {
    try {
      const raw = localStorage.getItem(TASK_MODELS_STORAGE_KEY);
      if (raw) {
        this.taskMappings = JSON.parse(raw);
      }
    } catch {
      this.taskMappings = {};
    }
  }

  private persistProviders(): void {
    try {
      const list = Array.from(this.providers.values());
      localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.error('Failed to save AI provider configs:', err);
    }
  }

  public persistTaskMappings(): void {
    try {
      localStorage.setItem(TASK_MODELS_STORAGE_KEY, JSON.stringify(this.taskMappings));
    } catch (err) {
      console.error('Failed to save task model mappings:', err);
    }
  }

  public getAllProviders(): StoredProviderConfig[] {
    return Array.from(this.providers.values()).map((p) => ({
      ...p,
      hasStoredKey: aiCredentialVault.hasCredential(p.id),
    }));
  }

  public getProvider(id: string): StoredProviderConfig | undefined {
    const p = this.providers.get(id);
    if (!p) return undefined;
    return {
      ...p,
      hasStoredKey: aiCredentialVault.hasCredential(p.id),
    };
  }

  public getAdapter(providerId: string): AIProviderAdapter {
    return this.adapters.get(providerId) || this.adapters.get('openai')!;
  }

  public async saveProvider(
    config: StoredProviderConfig,
    plainApiKey?: string
  ): Promise<StoredProviderConfig> {
    if (plainApiKey && plainApiKey.trim()) {
      await aiCredentialVault.storeCredential(config.id, plainApiKey.trim());
      config.hasStoredKey = true;
    }

    this.providers.set(config.id, config);
    this.persistProviders();
    return config;
  }

  public removeProvider(id: string): void {
    aiCredentialVault.deleteCredential(id);
    this.providers.delete(id);
    this.persistProviders();
  }

  public async testProviderConnection(id: string): Promise<{
    success: boolean;
    modelsFound?: number;
    error?: string;
    latencyMs: number;
  }> {
    const config = this.providers.get(id);
    if (!config) return { success: false, error: 'Provider not found', latencyMs: 0 };

    const key = (await aiCredentialVault.getCredential(id)) || '';
    if (config.authType !== 'none' && !key) {
      return { success: false, error: 'No API Key configured in Local Vault', latencyMs: 0 };
    }

    const adapter = this.getAdapter(config.providerId);
    const result = await adapter.validateCredentials(config, key);

    config.lastTestedAt = Date.now();
    config.lastTestStatus = result.success ? 'success' : 'failed';
    config.lastTestError = result.error;

    if (result.success && result.modelsFound && result.modelsFound > 0) {
      const liveModels = await adapter.listModels(config, key);
      if (liveModels.length > 0) {
        config.customModels = liveModels;
      }
    }

    this.persistProviders();
    return result;
  }

  public getTaskMappings(): TaskModelAssignment {
    return { ...this.taskMappings };
  }

  public setTaskMapping(task: keyof TaskModelAssignment, providerId: string, modelId: string): void {
    this.taskMappings[task] = { providerId, modelId };
    this.persistTaskMappings();
  }

  public getActiveProviderForTask(task: keyof TaskModelAssignment): {
    config?: StoredProviderConfig;
    model?: string;
  } {
    // 1. Check explicit task mapping
    const mapping = this.taskMappings[task];
    if (mapping) {
      const p = this.getProvider(mapping.providerId);
      if (p && p.enabled) {
        return { config: p, model: mapping.modelId };
      }
    }

    // 2. Find any connected & enabled provider supporting this capability
    const all = this.getAllProviders().filter((p) => p.enabled && (p.hasStoredKey || p.authType === 'none'));
    for (const p of all) {
      if (task === 'image_generation' && p.capabilities.imageOutput) {
        return { config: p, model: p.selectedModel };
      }
      if (task === 'scene_analysis' && p.capabilities.imageInput) {
        return { config: p, model: p.selectedModel };
      }
      if (task === 'natural_language_editing' && p.capabilities.textInput) {
        return { config: p, model: p.selectedModel };
      }
      if (task === 'object_removal' && (p.capabilities.imageEditing || p.capabilities.imageOutput)) {
        return { config: p, model: p.selectedModel };
      }
    }

    // 3. Fallback to first enabled provider
    if (all.length > 0) {
      return { config: all[0], model: all[0].selectedModel };
    }

    return {};
  }

  public disableAllProviders(): void {
    this.providers.forEach((p) => {
      p.enabled = false;
    });
    this.persistProviders();
  }

  public deleteAllCredentials(): void {
    aiCredentialVault.wipeAllCredentials();
    this.providers.forEach((p) => {
      p.hasStoredKey = false;
      p.enabled = false;
      p.lastTestStatus = 'untested';
    });
    this.persistProviders();
  }
}

export const aiProviderManager = AIProviderManager.getInstance();
