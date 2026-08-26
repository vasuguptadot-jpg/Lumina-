import React, { useState, useEffect } from 'react';
import {
  Key,
  Shield,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  Coins,
  Cpu,
  Layers,
  FileText,
  Download,
  Terminal,
  Settings,
  Lock,
  Sparkles,
  Sliders,
  Send,
  HelpCircle,
  ExternalLink,
  GitFork,
  Building2,
  HardDrive,
} from 'lucide-react';
import {
  GroqConfig,
  GroqLogEntry,
  GroqUsageStats,
  GROQ_SUPPORTED_MODELS,
} from '../../types/groq';
import { GroqModelRouterView } from './GroqModelRouterView';
import { AIToolCallingInspector } from './AIToolCallingInspector';
import { AIEditingPlanExplorer } from './AIEditingPlanExplorer';
import { MultiModelPipelineView } from './MultiModelPipelineView';
import { AIVerificationInspector } from './AIVerificationInspector';
import { GroqBYOKArchitectureView } from './GroqBYOKArchitectureView';
import { OfflineHybridView } from './OfflineHybridView';
import {
  getGroqConfig,
  saveGroqConfig,
  setGroqApiKey,
  removeGroqApiKey,
  testGroqConnection,
  getGroqUsageStats,
  getGroqLogs,
  clearGroqLogs,
  sendGroqChat,
} from '../../services/groqService';

interface GroqSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const GroqSettingsModal: React.FC<GroqSettingsModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'hybrid' | 'byok' | 'verification' | 'multi_model' | 'ai_plan' | 'tool_calling' | 'router' | 'keys' | 'models' | 'security' | 'usage' | 'logs' | 'test'>('hybrid');
  const [config, setConfig] = useState<GroqConfig>(getGroqConfig());
  const [stats, setStats] = useState<GroqUsageStats>(getGroqUsageStats());
  const [logs, setLogs] = useState<GroqLogEntry[]>([]);

  // Key Input state
  const [newKeyInput, setNewKeyInput] = useState('');
  const [showKeyText, setShowKeyText] = useState(false);
  const [persistLocally, setPersistLocally] = useState(true);

  // Testing & validation state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success?: boolean;
    latencyMs?: number;
    modelsCount?: number;
    error?: string;
  }>({ tested: false });

  // Playground state
  const [playgroundPrompt, setPlaygroundPrompt] = useState('Explain why adjusting the tone curve S-curve enhances photographic contrast.');
  const [playgroundResponse, setPlaygroundResponse] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getGroqConfig();
      setConfig(cfg);
      setStats(getGroqUsageStats());
      setLogs(getGroqLogs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveKey = async () => {
    if (!newKeyInput.trim()) {
      showToast('error', 'Key Required', 'Please enter a valid Groq API key.');
      return;
    }

    setIsTesting(true);
    const testRes = await testGroqConnection(newKeyInput.trim());
    setIsTesting(false);

    if (testRes.success) {
      const updated = setGroqApiKey(newKeyInput.trim(), persistLocally);
      setConfig(updated);
      setNewKeyInput('');
      setTestResult({
        tested: true,
        success: true,
        latencyMs: testRes.latencyMs,
        modelsCount: testRes.modelsCount,
      });
      showToast('success', 'Groq API Key Validated & Saved', `Connection latency: ${testRes.latencyMs}ms`);
    } else {
      setTestResult({
        tested: true,
        success: false,
        error: testRes.error || 'Failed to validate API key with Groq.',
      });
      showToast('error', 'Groq Key Validation Failed', testRes.error || 'Invalid API Key');
    }
  };

  const handleRemoveKey = () => {
    const updated = removeGroqApiKey();
    setConfig(updated);
    setTestResult({ tested: false });
    showToast('info', 'Groq Key Removed', 'API key wiped from browser storage.');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    const res = await testGroqConnection();
    setIsTesting(false);

    setTestResult({
      tested: true,
      success: res.success,
      latencyMs: res.latencyMs,
      modelsCount: res.modelsCount,
      error: res.error,
    });

    if (res.success) {
      showToast('success', 'Connection Verified', `Connected to Groq LPU in ${res.latencyMs}ms (${res.modelsCount} models ready).`);
    } else {
      showToast('error', 'Connection Test Failed', res.error);
    }
  };

  const handleToggleSetting = (field: keyof GroqConfig, value: any) => {
    const updated = saveGroqConfig({ [field]: value });
    setConfig(updated);
  };

  const handleRunPlayground = async () => {
    if (!playgroundPrompt.trim()) return;
    setIsPlaying(true);
    setPlaygroundResponse('');

    const res = await sendGroqChat([
      {
        role: 'system',
        content: 'You are an elite photographic colorist and image processing AI assistant. Provide concise, expert advice.',
      },
      {
        role: 'user',
        content: playgroundPrompt,
      },
    ]);

    setIsPlaying(false);
    if (res.success && res.content) {
      setPlaygroundResponse(res.content);
      setStats(getGroqUsageStats());
      setLogs(getGroqLogs());
    } else {
      setPlaygroundResponse(`Error: ${res.error || 'Failed to get response.'}`);
    }
  };

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lumina_groq_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleClearLogs = () => {
    clearGroqLogs();
    setLogs([]);
    setStats(getGroqUsageStats());
    showToast('info', 'Logs Cleared', 'All Groq telemetry records reset.');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-600 text-white shadow-lg shadow-orange-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">Groq AI Integration</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  BYOK & LPU Speed
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ultra-fast inference, Bring-Your-Own-Key management, security policies, and token monitoring.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800/80 bg-slate-900/30 px-6 gap-2 overflow-x-auto py-2">
          {[
            { id: 'hybrid', label: 'Offline + Groq Hybrid', icon: HardDrive },
            { id: 'byok', label: 'BYOK Architecture', icon: Key },
            { id: 'verification', label: 'AI Verification (9 Audits)', icon: ShieldCheck },
            { id: 'multi_model', label: 'Groq + Image Models', icon: Layers },
            { id: 'ai_plan', label: 'AI Editing Plan', icon: Building2 },
            { id: 'tool_calling', label: 'AI Tool Calling', icon: ShieldCheck },
            { id: 'router', label: 'Model Router', icon: GitFork },
            { id: 'keys', label: 'API Key & Connection', icon: Key },
            { id: 'models', label: 'Model Catalog', icon: Cpu },
            { id: 'security', label: 'Security & Policies', icon: Shield },
            { id: 'usage', label: 'Usage & Cost Monitor', icon: Coins },
            { id: 'logs', label: 'Request / Error Logs', icon: FileText, count: logs.length },
            { id: 'test', label: 'AI Playground', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-slate-300">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB: OFFLINE + GROQ HYBRID ARCHITECTURE */}
          {activeTab === 'hybrid' && (
            <OfflineHybridView showToast={showToast} />
          )}

          {/* TAB: GROQ BYOK ARCHITECTURE (ISOLATED KEY PIPELINE) */}
          {activeTab === 'byok' && (
            <GroqBYOKArchitectureView showToast={showToast} />
          )}

          {/* TAB: AI VERIFICATION & AUTO-REPAIR (9 AUDITS) */}
          {activeTab === 'verification' && (
            <AIVerificationInspector showToast={showToast} />
          )}

          {/* TAB: GROQ + IMAGE GENERATION MULTI-MODEL PIPELINE */}
          {activeTab === 'multi_model' && (
            <MultiModelPipelineView showToast={showToast} />
          )}

          {/* TAB: AI EDITING PLAN (GROQ DECOMPOSITION) */}
          {activeTab === 'ai_plan' && (
            <AIEditingPlanExplorer showToast={showToast} />
          )}

          {/* TAB: AI TOOL CALLING PIPELINE */}
          {activeTab === 'tool_calling' && (
            <AIToolCallingInspector showToast={showToast} />
          )}

          {/* TAB: MODEL ROUTER */}
          {activeTab === 'router' && (
            <GroqModelRouterView showToast={showToast} />
          )}

          {/* TAB 1: API KEY & CONNECTION */}
          {activeTab === 'keys' && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  config.hasKey
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {config.hasKey ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                  )}
                  <div>
                    <div className="font-bold text-sm text-white">
                      {config.hasKey ? 'Groq BYOK Key Active' : 'No Groq API Key Configured'}
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      {config.hasKey
                        ? `Configured Key: ${config.maskedKey}`
                        : 'Enter your Groq API key below to unlock blazing-fast LPU inference.'}
                    </div>
                  </div>
                </div>

                {config.hasKey && (
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    Test Connection
                  </button>
                )}
              </div>

              {/* Test Result Feedback */}
              {testResult.tested && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                    testResult.success
                      ? 'bg-emerald-900/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-900/20 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>
                      {testResult.success
                        ? `Connection Verified: ${testResult.latencyMs}ms latency (${testResult.modelsCount} models accessible)`
                        : `Verification Error: ${testResult.error}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Add / Replace Key Card */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    {config.hasKey ? 'Replace API Key' : 'Add Groq API Key'}
                  </span>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    Get a Groq API Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="relative">
                  <input
                    type={showKeyText ? 'text' : 'password'}
                    value={newKeyInput}
                    onChange={(e) => setNewKeyInput(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={persistLocally}
                      onChange={(e) => setPersistLocally(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span>Persist encrypted key in browser localStorage (vs. session-only)</span>
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSaveKey}
                    disabled={!newKeyInput.trim() || isTesting}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Validate & Save API Key
                  </button>

                  {config.hasKey && (
                    <button
                      onClick={handleRemoveKey}
                      className="px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-semibold flex items-center gap-2 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove Key
                    </button>
                  )}
                </div>
              </div>

              {/* Master Operational Modes */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">AI Engine</span>
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => handleToggleSetting('enabled', e.target.checked)}
                      className="toggle-checkbox accent-emerald-500 h-4 w-4"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Master toggle to enable or disable all AI features across the entire application.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">BYOK Mode</span>
                    <input
                      type="checkbox"
                      checked={config.byokMode}
                      onChange={(e) => handleToggleSetting('byokMode', e.target.checked)}
                      className="toggle-checkbox accent-amber-500 h-4 w-4"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Use your custom Groq API key instead of default managed backend infrastructure.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Local-Only Mode</span>
                    <input
                      type="checkbox"
                      checked={config.localOnlyMode}
                      onChange={(e) => handleToggleSetting('localOnlyMode', e.target.checked)}
                      className="toggle-checkbox accent-rose-500 h-4 w-4"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Air-gapped mode: strictly zero outbound network requests or external model calls.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MODEL SELECTION */}
          {activeTab === 'models' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Available Groq LPUs & Models
                </span>
                <span className="text-xs text-amber-400 font-semibold">
                  Active: {config.activeModel}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {GROQ_SUPPORTED_MODELS.map((model) => {
                  const isSelected = config.activeModel === model.id;
                  return (
                    <div
                      key={model.id}
                      onClick={() => handleToggleSetting('activeModel', model.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20 shadow-lg'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{model.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">({model.id})</span>
                            {model.isVision && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Vision Enabled
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                model.speedTier === 'ultra_fast'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : model.speedTier === 'deep_reasoning'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {model.speedTier.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">{model.description}</p>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-white">
                            {(model.contextWindow / 1000).toFixed(0)}k Context
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            ${model.pricingPerMillionTokens.prompt} / 1M prompt
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & RESILIENCE POLICIES */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Privacy & Image Authorization Policies */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  Image Privacy & Transmission Authorization
                </span>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <input
                      type="checkbox"
                      checked={config.userAuthorizedImageUploads}
                      onChange={(e) => handleToggleSetting('userAuthorizedImageUploads', e.target.checked)}
                      className="mt-0.5 rounded accent-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">
                        Authorize Image Frame Uploads to Groq Vision
                      </div>
                      <div className="text-[11px] text-slate-400">
                        When disabled, Groq only receives structured metadata and mathematical prompts. No raw pixel data is ever transmitted.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <input
                      type="checkbox"
                      checked={config.redactExifBeforeUpload}
                      onChange={(e) => handleToggleSetting('redactExifBeforeUpload', e.target.checked)}
                      className="mt-0.5 rounded accent-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">
                        Automatically Scrub EXIF & GPS Location Data
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Removes GPS coordinates, camera serial numbers, and device ownership tags before any AI call.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Network Resilience, Timeout & Retry Policy */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Timeout & Retry Resilience Policy
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Request Timeout:</span>
                      <span className="font-bold text-amber-400">{config.timeoutMs / 1000}s</span>
                    </div>
                    <input
                      type="range"
                      min="5000"
                      max="120000"
                      step="5000"
                      value={config.timeoutMs}
                      onChange={(e) => handleToggleSetting('timeoutMs', Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Max Auto-Retries (429/5xx):</span>
                      <span className="font-bold text-amber-400">{config.maxRetries} Retries</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={config.maxRetries}
                      onChange={(e) => handleToggleSetting('maxRetries', Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: USAGE & COST MONITOR */}
          {activeTab === 'usage' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold">Total Requests</div>
                  <div className="text-xl font-bold text-white mt-1">{stats.totalRequests}</div>
                  <div className="text-[10px] text-emerald-400 mt-1">
                    {stats.successfulRequests} Success / {stats.failedRequests} Error
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold">Total Tokens Consumed</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">{stats.totalTokens.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {stats.totalPromptTokens.toLocaleString()} in / {stats.totalCompletionTokens.toLocaleString()} out
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold">Estimated Cost (USD)</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">${stats.estimatedCostUSD.toFixed(5)}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Calculated via official Groq pricing</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Reset Usage Telemetry</div>
                  <div className="text-[11px] text-slate-400">Clear all locally tracked token and cost metrics.</div>
                </div>
                <button
                  onClick={handleClearLogs}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-semibold"
                >
                  Clear Metrics
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: REQUEST / ERROR LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Request & Error Log History ({logs.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportLogs}
                    disabled={logs.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export JSON
                  </button>
                  <button
                    onClick={handleClearLogs}
                    disabled={logs.length === 0}
                    className="px-3 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                    No requests recorded yet.
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        log.status === 'success'
                          ? 'bg-slate-900/80 border-slate-800'
                          : 'bg-rose-950/20 border-rose-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              log.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {log.status}
                          </span>
                          <span className="font-bold text-white">{log.model}</span>
                          <span className="text-slate-500 font-mono text-[10px]">{log.endpoint}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {log.latencyMs}ms • {log.totalTokens} toks (${log.estimatedCostUSD})
                        </span>
                      </div>

                      {log.promptSummary && (
                        <div className="text-slate-300 text-[11px] truncate">
                          Prompt: &quot;{log.promptSummary}&quot;
                        </div>
                      )}

                      {log.errorMessage && (
                        <div className="text-rose-400 text-[11px] font-mono">{log.errorMessage}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: AI PLAYGROUND */}
          {activeTab === 'test' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  Groq LPU Live Playground
                </span>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={playgroundPrompt}
                    onChange={(e) => setPlaygroundPrompt(e.target.value)}
                    placeholder="Enter an editing or color grading prompt..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleRunPlayground}
                    disabled={isPlaying || !playgroundPrompt.trim()}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isPlaying ? 'Running...' : 'Execute'}
                  </button>
                </div>
              </div>

              {playgroundResponse && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-amber-400">Response:</div>
                  <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {playgroundResponse}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
