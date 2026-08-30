/**
 * Lumina Studio Pro — Universal AI Provider Gateway Settings View
 *
 * Professional, high-contrast, strictly monochrome (black, white, gray) UI for:
 * 1. Managing connected AI Providers (OpenAI, Gemini, Anthropic, OpenRouter, Groq, Mistral, Together, DeepSeek, Local Ollama, Custom).
 * 2. Storing, revealing, and deleting local encrypted API keys.
 * 3. Connection testing with live telemetry (Authentication, Reachability, Models, Latency).
 * 4. Model task assignment (Scene Analysis, Natural Language, Object Removal, Image Gen).
 * 5. Spending controls & cost limits.
 * 6. Privacy & consent settings (EXIF stripping, zero retention notices).
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Key,
  Shield,
  Activity,
  Check,
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Sliders,
  DollarSign,
  Lock,
  Cpu,
  Layers,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Database,
  Terminal,
  Zap,
} from 'lucide-react';
import {
  StoredProviderConfig,
  AIProviderPreset,
  AIProviderId,
  AIModelDefinition,
  TaskModelAssignment,
} from '../../types/aiProviderGateway';
import { aiProviderManager } from '../../services/ai/aiProviderManager';
import { aiCredentialVault } from '../../services/ai/aiCredentialVault';
import { AI_PROVIDER_PRESETS } from '../../services/ai/aiCapabilityRegistry';
import { aiUsageTracker } from '../../services/ai/aiUsageTracker';
import { aiSecurityGuard, AIPrivacySettings } from '../../services/ai/aiSecurityGuard';
import { UnifiedAIProviderSelector } from './UnifiedAIProviderSelector';
import { LocalModelManagerView } from './LocalModelManagerView';

interface AIProviderGatewayViewProps {
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

type SubTab = 'mode' | 'local_models' | 'providers' | 'models' | 'cost' | 'privacy';

export const AIProviderGatewayView: React.FC<AIProviderGatewayViewProps> = ({ showToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('mode');
  const [providers, setProviders] = useState<StoredProviderConfig[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [taskMappings, setTaskMappings] = useState<TaskModelAssignment>({});

  // Add / Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<StoredProviderConfig | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isKeyRevealed, setIsKeyRevealed] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    modelsFound?: number;
    error?: string;
    latencyMs?: number;
  } | null>(null);

  // Usage telemetry
  const [usageSummary, setUsageSummary] = useState(() => aiUsageTracker.getSummary());
  const [privacySettings, setPrivacySettings] = useState<AIPrivacySettings>(() => aiSecurityGuard.getPrivacySettings());
  const [spendingLimits, setSpendingLimits] = useState(() => aiSecurityGuard.getSpendingLimits());

  const refreshData = () => {
    setProviders(aiProviderManager.getAllProviders());
    setTaskMappings(aiProviderManager.getTaskMappings());
    setUsageSummary(aiUsageTracker.getSummary());
    setPrivacySettings(aiSecurityGuard.getPrivacySettings());
    setSpendingLimits(aiSecurityGuard.getSpendingLimits());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleOpenAdd = (presetId?: AIProviderId) => {
    const preset = presetId ? AI_PROVIDER_PRESETS[presetId] : AI_PROVIDER_PRESETS.openai;
    const newId = `${preset.id}_${Date.now().toString(36)}`;
    const newConfig: StoredProviderConfig = {
      id: newId,
      providerId: preset.id,
      name: preset.name,
      customName: '',
      endpoint: preset.defaultEndpoint,
      authType: preset.authType,
      customHeaderName: preset.headerName,
      requestFormat: preset.requestFormat,
      responseFormat: preset.responseFormat,
      hasStoredKey: false,
      enabled: true,
      selectedModel: preset.defaultModels[0]?.id || '',
      customModels: [...preset.defaultModels],
      capabilities: { ...preset.capabilities },
      createdAt: Date.now(),
      dataRetentionPolicy: preset.dataRetentionPolicy,
    };

    setEditingConfig(newConfig);
    setApiKeyInput('');
    setIsKeyRevealed(false);
    setTestResult(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = async (config: StoredProviderConfig) => {
    setEditingConfig({ ...config });
    const existingKey = await aiCredentialVault.getCredential(config.id);
    setApiKeyInput(existingKey || '');
    setIsKeyRevealed(false);
    setTestResult(null);
    setIsEditModalOpen(true);
  };

  const handleSaveProvider = async () => {
    if (!editingConfig) return;

    if (editingConfig.authType !== 'none' && !apiKeyInput.trim() && !editingConfig.hasStoredKey) {
      showToast('error', 'API Key Required', 'Please provide a valid API key for this provider.');
      return;
    }

    await aiProviderManager.saveProvider(editingConfig, apiKeyInput.trim() || undefined);
    setIsEditModalOpen(false);
    refreshData();
    showToast('success', 'Provider Saved', `Configuration for "${editingConfig.name}" updated safely in local vault.`);
  };

  const handleDeleteProvider = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name}? This will delete its encrypted key from your device.`)) {
      aiProviderManager.removeProvider(id);
      refreshData();
      showToast('info', 'Provider Removed', `${name} and its credentials have been erased from local storage.`);
    }
  };

  const handleTestConnection = async (config: StoredProviderConfig) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // If in edit modal, temporarily store key in memory for testing
      if (apiKeyInput.trim()) {
        await aiCredentialVault.storeCredential(config.id, apiKeyInput.trim());
      }
      const res = await aiProviderManager.testProviderConnection(config.id);
      setTestResult(res);
      refreshData();
      if (res.success) {
        showToast('success', 'Connection Verified', `Successfully reached ${config.name} (${res.latencyMs}ms).`);
      } else {
        showToast('error', 'Connection Failed', res.error || 'Check endpoint and credentials.');
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggleEnabled = async (config: StoredProviderConfig) => {
    const updated = { ...config, enabled: !config.enabled };
    await aiProviderManager.saveProvider(updated);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 rounded-lg bg-[#1A1A1A] border border-[#333333] text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-base font-semibold text-white tracking-tight">Universal AI Provider Gateway</h2>
          </div>
          <p className="text-xs text-[#777777] mt-1">
            Connect your own AI API keys locally. Zero cloud relay, zero tracking, encrypted client-side.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#111111] border border-[#222222] rounded-lg">
          <button
            id="ai-tab-mode"
            onClick={() => setActiveSubTab('mode')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeSubTab === 'mode' ? 'bg-[#222222] text-white' : 'text-[#888888] hover:text-white'
            }`}
          >
            AI Mode
          </button>
          <button
            id="ai-tab-local-models"
            onClick={() => setActiveSubTab('local_models')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeSubTab === 'local_models' ? 'bg-[#222222] text-white' : 'text-[#888888] hover:text-white'
            }`}
          >
            Local Models
          </button>
          <button
            id="ai-tab-providers"
            onClick={() => setActiveSubTab('providers')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeSubTab === 'providers' ? 'bg-[#222222] text-white' : 'text-[#888888] hover:text-white'
            }`}
          >
            API Providers
          </button>
          <button
            id="ai-tab-models"
            onClick={() => setActiveSubTab('models')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeSubTab === 'models' ? 'bg-[#222222] text-white' : 'text-[#888888] hover:text-white'
            }`}
          >
            Task Routing
          </button>
          <button
            id="ai-tab-cost"
            onClick={() => setActiveSubTab('cost')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeSubTab === 'cost' ? 'bg-[#222222] text-white' : 'text-[#888888] hover:text-white'
            }`}
          >
            Usage & Cost
          </button>
          <button
            id="ai-tab-privacy"
            onClick={() => setActiveSubTab('privacy')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeSubTab === 'privacy' ? 'bg-[#222222] text-white' : 'text-[#888888] hover:text-white'
            }`}
          >
            Privacy & Guard
          </button>
        </div>
      </div>

      {/* 0. MODE SUB-TAB */}
      {activeSubTab === 'mode' && (
        <div className="space-y-6">
          <UnifiedAIProviderSelector
            onOpenLocalModels={() => setActiveSubTab('local_models')}
            onOpenUserKeys={() => setActiveSubTab('providers')}
          />
        </div>
      )}

      {/* 0.5. LOCAL MODELS SUB-TAB */}
      {activeSubTab === 'local_models' && (
        <div className="space-y-6">
          <LocalModelManagerView />
        </div>
      )}

      {/* 1. PROVIDERS SUB-TAB */}
      {activeSubTab === 'providers' && (
        <div className="space-y-6">
          {/* Quick Preset Launcher Bar */}
          <div className="p-4 bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#888888]">
                Add Supported AI Provider
              </span>
              <button
                onClick={() => handleOpenAdd()}
                className="flex items-center space-x-1.5 px-2.5 py-1 bg-white hover:bg-[#E5E5E5] text-black text-xs font-semibold rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom Provider</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {Object.values(AI_PROVIDER_PRESETS).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleOpenAdd(preset.id)}
                  className="p-2.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] hover:border-[#404040] rounded-lg text-left transition-all group"
                >
                  <div className="text-xs font-medium text-white group-hover:text-[#FFFFFF] flex items-center justify-between">
                    <span>{preset.name}</span>
                    <Plus className="w-3 h-3 text-[#666666] group-hover:text-white" />
                  </div>
                  <div className="text-[10px] text-[#777777] font-mono mt-1">
                    {preset.type === 'local' ? 'Local AI' : preset.capabilities.imageOutput ? 'Vision + Image' : 'Vision / Text'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Connected Providers List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#888888]">
                Configured Connections ({providers.length})
              </span>
              <button
                onClick={refreshData}
                className="flex items-center space-x-1 text-xs text-[#888888] hover:text-white font-mono"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            {providers.length === 0 ? (
              <div className="p-8 text-center bg-[#111111] border border-[#222222] rounded-xl">
                <Shield className="w-8 h-8 text-[#555555] mx-auto mb-2" />
                <p className="text-xs text-[#888888]">No AI providers connected yet.</p>
                <button
                  onClick={() => handleOpenAdd('openai')}
                  className="mt-3 px-3 py-1.5 bg-[#222222] hover:bg-[#333333] text-white text-xs rounded-lg transition-colors inline-flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Connect First Provider</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {providers.map((p) => {
                  const preset = AI_PROVIDER_PRESETS[p.providerId];
                  return (
                    <div
                      key={p.id}
                      className={`p-4 bg-[#111111] border rounded-xl space-y-3 transition-all ${
                        p.enabled ? 'border-[#333333]' : 'border-[#1C1C1C] opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-white">
                              {p.customName || p.name}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                p.lastTestStatus === 'success'
                                  ? 'bg-[#00FF66]'
                                  : p.lastTestStatus === 'failed'
                                  ? 'bg-[#FF3333]'
                                  : 'bg-[#666666]'
                              }`}
                              title={`Status: ${p.lastTestStatus || 'untested'}`}
                            />
                            <span className="px-1.5 py-0.5 bg-[#1C1C1C] border border-[#2A2A2A] rounded text-[10px] font-mono text-[#888888] uppercase">
                              {p.providerId}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#666666] font-mono mt-0.5 truncate max-w-[260px]">
                            {p.endpoint}
                          </div>
                        </div>

                        {/* Enable/Disable switch */}
                        <button
                          onClick={() => handleToggleEnabled(p)}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                            p.enabled
                              ? 'bg-[#1A1A1A] text-white border-[#333333]'
                              : 'bg-[#0A0A0A] text-[#666666] border-[#1C1C1C]'
                          }`}
                        >
                          {p.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>

                      {/* Capabilities Badges */}
                      <div className="flex flex-wrap gap-1">
                        {p.capabilities.textInput && (
                          <span className="px-1.5 py-0.5 bg-[#161616] text-[#999999] rounded text-[10px] font-mono">
                            Text
                          </span>
                        )}
                        {p.capabilities.imageInput && (
                          <span className="px-1.5 py-0.5 bg-[#161616] text-[#999999] rounded text-[10px] font-mono">
                            Vision
                          </span>
                        )}
                        {p.capabilities.imageOutput && (
                          <span className="px-1.5 py-0.5 bg-[#161616] text-[#999999] rounded text-[10px] font-mono">
                            Image Gen
                          </span>
                        )}
                        {p.capabilities.imageEditing && (
                          <span className="px-1.5 py-0.5 bg-[#161616] text-[#999999] rounded text-[10px] font-mono">
                            Inpainting
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 bg-[#161616] text-[#666666] rounded text-[10px] font-mono">
                          {p.customModels.length} Models
                        </span>
                      </div>

                      {/* Status / Error if failed */}
                      {p.lastTestStatus === 'failed' && p.lastTestError && (
                        <div className="p-2 bg-[#1A0D0D] border border-[#331414] rounded text-[11px] text-[#FF8888] font-mono truncate">
                          {p.lastTestError}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTestConnection(p)}
                            disabled={isTesting}
                            className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#262626] border border-[#333333] rounded text-xs font-mono text-white transition-colors"
                          >
                            {isTesting ? 'Testing...' : 'Test'}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#262626] border border-[#333333] rounded text-xs font-mono text-white transition-colors"
                          >
                            Configure
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeleteProvider(p.id, p.name)}
                          className="p-1.5 text-[#666666] hover:text-[#FF4444] rounded transition-colors"
                          title="Delete Provider Connection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. MODELS SUB-TAB */}
      {activeSubTab === 'models' && (
        <div className="space-y-6">
          <div className="p-4 bg-[#111111] border border-[#222222] rounded-xl space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#888888]">
              Autonomous Task-To-Model Assignments
            </h3>
            <p className="text-xs text-[#777777]">
              Specify which AI model powers each photographic creative operation in Lumina Studio Pro.
            </p>

            <div className="space-y-3">
              {/* Scene Analysis */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#161616] border border-[#262626] rounded-lg gap-2">
                <div>
                  <div className="text-xs font-medium text-white">Visual Scene & Subject Analysis</div>
                  <div className="text-[11px] text-[#666666]">
                    6-Pillar composition, subject depth, lighting estimation
                  </div>
                </div>
                <select
                  value={taskMappings.scene_analysis?.modelId || 'auto'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'auto') {
                      const updated = { ...taskMappings };
                      delete updated.scene_analysis;
                      aiProviderManager.setTaskMapping('scene_analysis', '', '');
                    } else {
                      const [provId, modId] = val.split('::');
                      aiProviderManager.setTaskMapping('scene_analysis', provId, modId);
                    }
                    refreshData();
                  }}
                  className="bg-[#0A0A0A] border border-[#333333] rounded px-2.5 py-1 text-xs text-white font-mono"
                >
                  <option value="auto">Auto-Select Best Available Vision Model</option>
                  {providers
                    .filter((p) => p.capabilities.imageInput)
                    .flatMap((p) =>
                      p.customModels
                        .filter((m) => m.capabilities.imageInput)
                        .map((m) => (
                          <option key={`${p.id}::${m.id}`} value={`${p.id}::${m.id}`}>
                            {p.name}: {m.name}
                          </option>
                        ))
                    )}
                </select>
              </div>

              {/* Natural Language Editing */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#161616] border border-[#262626] rounded-lg gap-2">
                <div>
                  <div className="text-xs font-medium text-white">Natural Language Adjustments & Copilot</div>
                  <div className="text-[11px] text-[#666666]">
                    Translates conversational edits into non-destructive tone & color stacks
                  </div>
                </div>
                <select
                  value={taskMappings.natural_language_editing?.modelId || 'auto'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'auto') {
                      const updated = { ...taskMappings };
                      delete updated.natural_language_editing;
                      aiProviderManager.setTaskMapping('natural_language_editing', '', '');
                    } else {
                      const [provId, modId] = val.split('::');
                      aiProviderManager.setTaskMapping('natural_language_editing', provId, modId);
                    }
                    refreshData();
                  }}
                  className="bg-[#0A0A0A] border border-[#333333] rounded px-2.5 py-1 text-xs text-white font-mono"
                >
                  <option value="auto">Auto-Select Best Available Reasoning Model</option>
                  {providers
                    .filter((p) => p.capabilities.textInput)
                    .flatMap((p) =>
                      p.customModels.map((m) => (
                        <option key={`${p.id}::${m.id}`} value={`${p.id}::${m.id}`}>
                          {p.name}: {m.name}
                        </option>
                      ))
                    )}
                </select>
              </div>

              {/* Generative Inpainting & Object Removal */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#161616] border border-[#262626] rounded-lg gap-2">
                <div>
                  <div className="text-xs font-medium text-white">Generative Inpainting & Object Removal</div>
                  <div className="text-[11px] text-[#666666]">
                    Reconstructs background textures and patches masked elements
                  </div>
                </div>
                <select
                  value={taskMappings.object_removal?.modelId || 'auto'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'auto') {
                      aiProviderManager.setTaskMapping('object_removal', '', '');
                    } else {
                      const [provId, modId] = val.split('::');
                      aiProviderManager.setTaskMapping('object_removal', provId, modId);
                    }
                    refreshData();
                  }}
                  className="bg-[#0A0A0A] border border-[#333333] rounded px-2.5 py-1 text-xs text-white font-mono"
                >
                  <option value="auto">Auto (DALL-E 2 / Local Telea Fallback)</option>
                  {providers
                    .filter((p) => p.capabilities.imageEditing || p.capabilities.imageOutput)
                    .flatMap((p) =>
                      p.customModels.map((m) => (
                        <option key={`${p.id}::${m.id}`} value={`${p.id}::${m.id}`}>
                          {p.name}: {m.name}
                        </option>
                      ))
                    )}
                </select>
              </div>

              {/* Image Generation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#161616] border border-[#262626] rounded-lg gap-2">
                <div>
                  <div className="text-xs font-medium text-white">Generative Image Synthesis (DALL-E / FLUX)</div>
                  <div className="text-[11px] text-[#666666]">
                    Text-to-image creation and variation generation
                  </div>
                </div>
                <select
                  value={taskMappings.image_generation?.modelId || 'auto'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'auto') {
                      aiProviderManager.setTaskMapping('image_generation', '', '');
                    } else {
                      const [provId, modId] = val.split('::');
                      aiProviderManager.setTaskMapping('image_generation', provId, modId);
                    }
                    refreshData();
                  }}
                  className="bg-[#0A0A0A] border border-[#333333] rounded px-2.5 py-1 text-xs text-white font-mono"
                >
                  <option value="auto">Auto (DALL-E 3 / Together FLUX)</option>
                  {providers
                    .filter((p) => p.capabilities.imageOutput)
                    .flatMap((p) =>
                      p.customModels
                        .filter((m) => m.capabilities.imageOutput)
                        .map((m) => (
                          <option key={`${p.id}::${m.id}`} value={`${p.id}::${m.id}`}>
                            {p.name}: {m.name}
                          </option>
                        ))
                    )}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. COST & SPENDING SUB-TAB */}
      {activeSubTab === 'cost' && (
        <div className="space-y-6">
          {/* Usage Telemetry Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-[#111111] border border-[#222222] rounded-xl">
              <span className="text-[10px] font-mono text-[#666666] uppercase">Total AI Calls</span>
              <div className="text-xl font-bold text-white mt-1 font-mono">{usageSummary.totalRequests}</div>
              <span className="text-[10px] text-[#888888] font-mono">{usageSummary.sessionRequests} this session</span>
            </div>

            <div className="p-4 bg-[#111111] border border-[#222222] rounded-xl">
              <span className="text-[10px] font-mono text-[#666666] uppercase">Estimated Tokens</span>
              <div className="text-xl font-bold text-white mt-1 font-mono">
                {usageSummary.totalTokens.toLocaleString()}
              </div>
              <span className="text-[10px] text-[#888888] font-mono">Prompt + Completion</span>
            </div>

            <div className="p-4 bg-[#111111] border border-[#222222] rounded-xl">
              <span className="text-[10px] font-mono text-[#666666] uppercase">Estimated Cost (USD)</span>
              <div className="text-xl font-bold text-white mt-1 font-mono">
                ${usageSummary.totalEstimatedCostUSD.toFixed(4)}
              </div>
              <span className="text-[10px] text-[#888888] font-mono">Calculated locally</span>
            </div>

            <div className="p-4 bg-[#111111] border border-[#222222] rounded-xl">
              <span className="text-[10px] font-mono text-[#666666] uppercase">Image Generations</span>
              <div className="text-xl font-bold text-white mt-1 font-mono">{usageSummary.imageGenerations}</div>
              <span className="text-[10px] text-[#888888] font-mono">{usageSummary.imageAnalyses} scene analyses</span>
            </div>
          </div>

          {/* Spending Caps */}
          <div className="p-4 bg-[#111111] border border-[#222222] rounded-xl space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#888888]">
              Local Spending Caps & Limits
            </h3>
            <p className="text-xs text-[#777777]">
              Lumina automatically pauses outbound API calls if spending exceeds your local daily or monthly threshold.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white">Daily Cost Ceiling ($ USD)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={spendingLimits.dailyLimitUSD}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    aiSecurityGuard.updateSpendingLimits({ dailyLimitUSD: val });
                    refreshData();
                  }}
                  className="w-full bg-[#0A0A0A] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white font-mono"
                  placeholder="0 for unlimited"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white">Monthly Cost Ceiling ($ USD)</label>
                <input
                  type="number"
                  step="5"
                  min="0"
                  value={spendingLimits.monthlyLimitUSD}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    aiSecurityGuard.updateSpendingLimits({ monthlyLimitUSD: val });
                    refreshData();
                  }}
                  className="w-full bg-[#0A0A0A] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white font-mono"
                  placeholder="0 for unlimited"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#1C1C1C] flex justify-end">
              <button
                onClick={() => {
                  if (window.confirm('Clear all local AI usage and telemetry history?')) {
                    aiUsageTracker.clearHistory();
                    refreshData();
                    showToast('info', 'Usage Cleared', 'Local AI request metrics have been reset.');
                  }
                }}
                className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#262626] border border-[#333333] rounded text-xs font-mono text-white transition-colors"
              >
                Clear AI Usage History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PRIVACY & SECURITY GUARD SUB-TAB */}
      {activeSubTab === 'privacy' && (
        <div className="space-y-6">
          {/* Strict Security Disclosure */}
          <div className="p-4 bg-[#0A0A0A] border border-[#2E2E2E] rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-white">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                Security & Data Transit Disclosure
              </span>
            </div>
            <p className="text-xs text-[#999999] leading-relaxed">
              Your API keys are managed exclusively on your device using AES-GCM 256-bit Web Crypto encryption. When an AI request is initiated, Lumina establishes direct client-to-provider HTTPS communication. Your keys and raw project files are never sent to Lumina backend servers or stored in Firebase Firestore.
            </p>
          </div>

          <div className="p-4 bg-[#111111] border border-[#222222] rounded-xl space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#888888]">
              Image Privacy Controls
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#161616] border border-[#262626] rounded-lg">
                <div>
                  <div className="text-xs font-medium text-white">Scrub EXIF & GPS Metadata</div>
                  <div className="text-[11px] text-[#666666]">
                    Strips camera serial numbers, geolocation coordinates, and timestamps before dispatching image payloads.
                  </div>
                </div>
                <button
                  onClick={() => {
                    const updated = aiSecurityGuard.updatePrivacySettings({
                      scrubExifMetadata: !privacySettings.scrubExifMetadata,
                    });
                    setPrivacySettings(updated);
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono border transition-colors ${
                    privacySettings.scrubExifMetadata
                      ? 'bg-white text-black border-white'
                      : 'bg-[#0A0A0A] text-[#666666] border-[#222222]'
                  }`}
                >
                  {privacySettings.scrubExifMetadata ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#161616] border border-[#262626] rounded-lg">
                <div>
                  <div className="text-xs font-medium text-white">Global AI Kill Switch</div>
                  <div className="text-[11px] text-[#666666]">
                    Immediately suspends all outbound AI provider requests across all studio workspaces.
                  </div>
                </div>
                <button
                  onClick={() => {
                    const updated = aiSecurityGuard.updatePrivacySettings({
                      disableAllAI: !privacySettings.disableAllAI,
                    });
                    setPrivacySettings(updated);
                    showToast(
                      updated.disableAllAI ? 'info' : 'success',
                      updated.disableAllAI ? 'AI Disabled' : 'AI Enabled',
                      updated.disableAllAI ? 'All outbound AI calls paused.' : 'AI connections active.'
                    );
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono border transition-colors ${
                    privacySettings.disableAllAI
                      ? 'bg-[#FF3333] text-white border-[#FF3333]'
                      : 'bg-[#1A1A1A] text-[#888888] border-[#333333]'
                  }`}
                >
                  {privacySettings.disableAllAI ? 'AI Disabled' : 'AI Active'}
                </button>
              </div>
            </div>

            {/* Emergency Vault Wipe */}
            <div className="pt-4 border-t border-[#1C1C1C] flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-white">Wipe All Local AI Credentials</div>
                <div className="text-[11px] text-[#666666]">
                  Irreversibly clears all encrypted API keys and reset provider configurations to factory state.
                </div>
              </div>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Are you sure you want to delete ALL stored AI API keys? You will need to re-enter them.'
                    )
                  ) {
                    aiProviderManager.deleteAllCredentials();
                    refreshData();
                    showToast('info', 'Credentials Cleared', 'All local API keys have been wiped from memory.');
                  }
                }}
                className="px-3 py-1.5 bg-[#2A0000] hover:bg-[#400000] border border-[#550000] text-[#FFAAAA] text-xs font-mono rounded transition-colors"
              >
                Delete All AI Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / CONFIGURE PROVIDER MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && editingConfig && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0C0C0C] border border-[#2E2E2E] rounded-2xl p-6 shadow-2xl space-y-5 select-none">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1F1F]">
              <div className="flex items-center space-x-2.5">
                <Key className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold text-white">
                  Configure {editingConfig.name}
                </span>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-xs font-mono text-[#666666] hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              {/* Custom Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white">Connection Label</label>
                <input
                  type="text"
                  value={editingConfig.customName || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, customName: e.target.value })}
                  placeholder={`e.g. ${editingConfig.name} (Personal / Work)`}
                  className="w-full bg-[#141414] border border-[#2E2E2E] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-white outline-none"
                />
              </div>

              {/* Endpoint */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-white">API Base Endpoint</label>
                  {editingConfig.providerId === 'anthropic' && (
                    <span className="text-[10px] text-[#FFAA00] font-mono">Requires CORS Relay</span>
                  )}
                </div>
                <input
                  type="text"
                  value={editingConfig.endpoint}
                  onChange={(e) => setEditingConfig({ ...editingConfig, endpoint: e.target.value })}
                  className="w-full bg-[#141414] border border-[#2E2E2E] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-white outline-none"
                />
              </div>

              {/* API Key */}
              {editingConfig.authType !== 'none' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-white">API Key (Encrypted Locally)</label>
                    <button
                      type="button"
                      onClick={() => setIsKeyRevealed(!isKeyRevealed)}
                      className="flex items-center space-x-1 text-[11px] text-[#888888] hover:text-white font-mono"
                    >
                      {isKeyRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{isKeyRevealed ? 'Hide' : 'Reveal'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={isKeyRevealed ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder={
                        editingConfig.hasStoredKey && !apiKeyInput
                          ? '•••••••••••••••••••• (Encrypted in Vault)'
                          : AI_PROVIDER_PRESETS[editingConfig.providerId]?.keyPlaceholder || 'Enter API Key'
                      }
                      className="w-full bg-[#141414] border border-[#2E2E2E] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-white outline-none pr-8"
                    />
                  </div>
                </div>
              )}

              {/* Default Model */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white">Default Model</label>
                <input
                  type="text"
                  value={editingConfig.selectedModel}
                  onChange={(e) => setEditingConfig({ ...editingConfig, selectedModel: e.target.value })}
                  placeholder="e.g. gpt-4o, gemini-1.5-pro, claude-3-5-sonnet"
                  className="w-full bg-[#141414] border border-[#2E2E2E] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-white outline-none"
                />
              </div>

              {/* Test Result Indicator */}
              {testResult && (
                <div
                  className={`p-3 rounded-lg border text-xs font-mono space-y-1 ${
                    testResult.success
                      ? 'bg-[#002200] border-[#005500] text-[#88FF88]'
                      : 'bg-[#220000] border-[#550000] text-[#FF8888]'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-semibold">
                    {testResult.success ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    <span>{testResult.success ? 'Connection Ready' : 'Connection Test Failed'}</span>
                  </div>
                  {testResult.success && testResult.modelsFound !== undefined && (
                    <div>✓ Reachable ({testResult.latencyMs}ms) • {testResult.modelsFound} models discovered</div>
                  )}
                  {!testResult.success && testResult.error && (
                    <div className="text-[11px] leading-relaxed">{testResult.error}</div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#1F1F1F] flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleTestConnection(editingConfig)}
                disabled={isTesting}
                className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#262626] border border-[#333333] text-xs font-mono text-white rounded-lg transition-colors"
              >
                {isTesting ? 'Verifying...' : 'Test Connection'}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#888888] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProvider}
                  className="px-4 py-1.5 bg-white hover:bg-[#E5E5E5] text-black text-xs font-semibold rounded-lg transition-colors"
                >
                  Save Provider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
