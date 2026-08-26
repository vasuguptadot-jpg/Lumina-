import React, { useState, useEffect } from 'react';
import {
  Code2,
  Terminal,
  Key,
  Webhook,
  Brain,
  Layers,
  Cpu,
  Zap,
  Play,
  Copy,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  Shield,
  FileCode,
  Sparkles,
  Server,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Eye,
  EyeOff,
  Package,
  Boxes,
  X,
  Share2,
  ChevronRight,
  Database,
  Lock,
} from 'lucide-react';
import {
  ApiKey,
  WebhookEndpoint,
  CustomAIModelConfig,
  ApiEndpointDoc,
  WebhookEventType,
} from '../../types/developer';
import {
  DEFAULT_API_KEYS,
  DEFAULT_CUSTOM_AI_MODELS,
  DEFAULT_WEBHOOKS,
  API_DOCUMENTATION,
  executeLiveApiCall,
} from '../../engine/developerSdk';

interface DeveloperPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

type DevTab =
  | 'api_explorer'
  | 'sdk'
  | 'plugin_api'
  | 'custom_ai'
  | 'webhooks'
  | 'cloud_render'
  | 'keys';

export const DeveloperPlatformModal: React.FC<DeveloperPlatformModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<DevTab>('api_explorer');

  // API Explorer State
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpointDoc>(API_DOCUMENTATION[0]);
  const [apiRequestBody, setApiRequestBody] = useState<string>(
    JSON.stringify(API_DOCUMENTATION[0].requestBodyExample || {}, null, 2)
  );
  const [isExecutingApi, setIsExecutingApi] = useState(false);
  const [apiExecutionResponse, setApiExecutionResponse] = useState<any>(null);
  const [selectedCodeLang, setSelectedCodeLang] = useState<'curl' | 'javascript' | 'python'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);

  // API Keys State
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(DEFAULT_API_KEYS);
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string>(DEFAULT_API_KEYS[0].id);
  const [isNewKeyModalOpen, setIsNewKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState<'production' | 'sandbox'>('production');

  // Custom AI Models State
  const [customModels, setCustomModels] = useState<CustomAIModelConfig[]>(DEFAULT_CUSTOM_AI_MODELS);
  const [isNewModelModalOpen, setIsNewModelModalOpen] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelProvider, setNewModelProvider] = useState<CustomAIModelConfig['provider']>('huggingface_inference');
  const [newModelEndpoint, setNewModelEndpoint] = useState('https://api-inference.huggingface.co/models/');
  const [newModelId, setNewModelId] = useState('black-forest-labs/FLUX.1-schnell');
  const [newModelType, setNewModelType] = useState<CustomAIModelConfig['modelType']>('image_generation');
  const [testingModelId, setTestingModelId] = useState<string | null>(null);

  // Webhooks State
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(DEFAULT_WEBHOOKS);
  const [isNewWebhookOpen, setIsNewWebhookOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookDesc, setNewWebhookDesc] = useState('');
  const [selectedWebhookEvents, setSelectedWebhookEvents] = useState<WebhookEventType[]>([
    'render.completed',
    'batch.completed',
    'automation.executed',
  ]);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [recentWebhookLog, setRecentWebhookLog] = useState<any>(null);

  // Reset request body whenever selected endpoint changes
  useEffect(() => {
    setApiRequestBody(
      JSON.stringify(selectedEndpoint.requestBodyExample || {}, null, 2)
    );
    setApiExecutionResponse(null);
  }, [selectedEndpoint]);

  const activeApiKey = apiKeys.find((k) => k.id === selectedApiKeyId) || apiKeys[0];

  // Copy code helper
  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast('info', 'Copied to Clipboard', 'Code snippet ready to paste.');
  };

  // Run live API test call against the backend
  const handleRunLiveApi = async () => {
    setIsExecutingApi(true);
    let parsedBody = undefined;
    if (selectedEndpoint.method === 'POST') {
      try {
        parsedBody = JSON.parse(apiRequestBody);
      } catch (e: any) {
        showToast('error', 'Invalid JSON Body', 'Please correct the JSON syntax.');
        setIsExecutingApi(false);
        return;
      }
    }

    const result = await executeLiveApiCall(selectedEndpoint, activeApiKey?.key || '', parsedBody);
    setApiExecutionResponse(result);
    setIsExecutingApi(false);

    if (result.ok) {
      showToast('success', 'API Call Succeeded', `HTTP ${result.status} • ${result.latencyMs}ms`);
    } else {
      showToast('error', 'API Call Error', `HTTP ${result.status}`);
    }
  };

  // Create New API Key
  const handleCreateApiKey = () => {
    if (!newKeyName.trim()) {
      showToast('error', 'Name Required', 'Please enter a name for the API key.');
      return;
    }

    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const prefix = newKeyEnv === 'production' ? 'lumina_live_' : 'lumina_test_';
    const keyToken = `${prefix}${randomHex}`;

    const created: ApiKey = {
      id: `key_${Date.now()}`,
      name: newKeyName.trim(),
      key: keyToken,
      prefix: `${keyToken.substring(0, 16)}...`,
      scopes: [
        'projects:read',
        'projects:write',
        'render:execute',
        'render:async',
        'batch:execute',
        'automation:execute',
        'models:custom',
        'webhooks:manage',
      ],
      createdAt: Date.now(),
      rateLimitPerMin: newKeyEnv === 'production' ? 1200 : 300,
      totalRequests: 0,
      environment: newKeyEnv,
    };

    setApiKeys((prev) => [created, ...prev]);
    setSelectedApiKeyId(created.id);
    setIsNewKeyModalOpen(false);
    setNewKeyName('');
    showToast('success', 'API Key Generated', `Created key token: ${created.name}`);
  };

  // Create Custom AI Model
  const handleCreateCustomModel = () => {
    if (!newModelName.trim() || !newModelEndpoint.trim()) {
      showToast('error', 'Fields Required', 'Please provide a name and endpoint URL.');
      return;
    }

    const model: CustomAIModelConfig = {
      id: `custom_model_${Date.now()}`,
      name: newModelName.trim(),
      provider: newModelProvider,
      endpointUrl: newModelEndpoint.trim(),
      modelIdentifier: newModelId.trim() || 'custom-model-v1',
      modelType: newModelType,
      enabled: true,
      createdAt: Date.now(),
      status: 'active',
      promptTemplate: 'masterpiece commercial photography, 8k resolution: {prompt}',
    };

    setCustomModels((prev) => [model, ...prev]);
    setIsNewModelModalOpen(false);
    setNewModelName('');
    showToast('success', 'Custom AI Model Registered', `Registered ${model.name}`);
  };

  // Test Custom AI Model Handshake
  const handleTestCustomModel = async (model: CustomAIModelConfig) => {
    setTestingModelId(model.id);
    try {
      const response = await fetch('/api/v1/models/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeApiKey?.key}`,
        },
        body: JSON.stringify({
          provider: model.provider,
          endpointUrl: model.endpointUrl,
          modelIdentifier: model.modelIdentifier,
          prompt: 'Editorial portrait lighting, crisp optical bokeh, 8k resolution',
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', 'Model Handshake Verified', `Response received in ${data.latencyMs}ms`);
      } else {
        showToast('error', 'Model Error', data.error || 'Failed to connect');
      }
    } catch (e: any) {
      showToast('error', 'Connection Failed', e.message);
    } finally {
      setTestingModelId(null);
    }
  };

  // Create Webhook
  const handleCreateWebhook = () => {
    if (!newWebhookUrl.trim() || !newWebhookUrl.startsWith('http')) {
      showToast('error', 'Valid URL Required', 'Please enter a valid HTTP/HTTPS webhook target URL.');
      return;
    }

    const secret = `whsec_${Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;

    const created: WebhookEndpoint = {
      id: `wh_${Date.now()}`,
      url: newWebhookUrl.trim(),
      description: newWebhookDesc.trim() || 'Custom Automated Webhook Target',
      secret,
      events: selectedWebhookEvents,
      enabled: true,
      createdAt: Date.now(),
      deliveryCount: 0,
    };

    setWebhooks((prev) => [created, ...prev]);
    setIsNewWebhookOpen(false);
    setNewWebhookUrl('');
    setNewWebhookDesc('');
    showToast('success', 'Webhook Registered', `Target: ${created.url}`);
  };

  // Send Signed Test Webhook Ping
  const handleSendTestWebhook = async (wh: WebhookEndpoint) => {
    setTestingWebhookId(wh.id);
    try {
      const response = await fetch('/api/v1/webhooks/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeApiKey?.key}`,
        },
        body: JSON.stringify({
          url: wh.url,
          secret: wh.secret,
          event: wh.events[0] || 'render.completed',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setRecentWebhookLog(data.log);
        showToast('success', 'Signed Webhook Dispatched', `HMAC-SHA256 signed ping sent to ${wh.url}`);
      }
    } catch (e: any) {
      showToast('error', 'Webhook Dispatch Error', e.message);
    } finally {
      setTestingWebhookId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col select-none animate-fadeIn overflow-hidden text-slate-100">
      {/* 1. TOP NAVBAR */}
      <div className="h-16 px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-[1.5px] shadow-lg shadow-indigo-600/30">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Code2 className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-tight">Developer & Enterprise Platform</h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30">
                  v1.4.0 API & SDK
                </span>
              </div>
              <p className="text-xs text-slate-400">Headless API • Python & TS SDK • Plugin Engine • Custom AI Models • Webhooks • Cloud Rendering</p>
            </div>
          </div>
        </div>

        {/* Global Key Selector & Close */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 font-medium">Auth Key:</span>
            <select
              value={selectedApiKeyId}
              onChange={(e) => setSelectedApiKeyId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 outline-none cursor-pointer"
            >
              {apiKeys.map((k) => (
                <option key={k.id} value={k.id} className="bg-slate-900 text-slate-200">
                  {k.name} ({k.environment})
                </option>
              ))}
            </select>
          </div>

          <div className="h-6 w-[1px] bg-slate-800" />

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. TAB NAVIGATION BAR */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 shrink-0 flex gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'api_explorer', label: 'API Playground & Explorer', icon: Terminal, badge: 'LIVE' },
          { id: 'sdk', label: 'SDKs & Code Generators', icon: FileCode, badge: 'TS/PY' },
          { id: 'plugin_api', label: 'Plugin API & Architecture', icon: Package, badge: 'EXTEND' },
          { id: 'custom_ai', label: 'Custom AI Model Endpoints', icon: Brain, badge: 'FLUX/SDXL' },
          { id: 'webhooks', label: 'Webhooks & Event Dispatcher', icon: Webhook, badge: 'HMAC' },
          { id: 'cloud_render', label: 'Cloud GPU & Batch Engine', icon: Cloud, badge: 'A100' },
          { id: 'keys', label: 'API Keys & Access Control', icon: Key, badge: `${apiKeys.length} KEYS` },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as DevTab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'border-cyan-400 text-white bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{t.label}</span>
              {t.badge && (
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. MAIN TAB CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
        {/* TAB 1: API PLAYGROUND & EXPLORER */}
        {activeTab === 'api_explorer' && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Endpoint Directory */}
            <div className="lg:col-span-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                API Endpoints Directory
              </div>
              <div className="space-y-1.5">
                {API_DOCUMENTATION.map((ep) => {
                  const isSelected = selectedEndpoint.id === ep.id;
                  return (
                    <div
                      key={ep.id}
                      onClick={() => setSelectedEndpoint(ep)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                          : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded font-mono ${
                              ep.method === 'POST'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {ep.method}
                          </span>
                          <span className="text-xs font-bold text-white truncate">{ep.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{ep.category}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate">{ep.path}</div>
                    </div>
                  );
                })}
              </div>

              {/* Server Cluster Capacity Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-cyan-400" />
                    GPU Render Cluster
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Operational
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                  <div>Instances: <strong className="text-slate-200">12x NVIDIA A100</strong></div>
                  <div>Avg Latency: <strong className="text-emerald-300">142ms</strong></div>
                  <div>Region: <strong className="text-slate-200">us-central1-gcp</strong></div>
                  <div>Throughput: <strong className="text-slate-200">8K Full HDR</strong></div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Test Runner & Code Generator */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded font-mono ${
                          selectedEndpoint.method === 'POST'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {selectedEndpoint.method}
                      </span>
                      <span className="text-sm font-bold text-white font-mono">{selectedEndpoint.path}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{selectedEndpoint.description}</p>
                  </div>

                  <button
                    onClick={handleRunLiveApi}
                    disabled={isExecutingApi}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
                  >
                    {isExecutingApi ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Test Request</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Request Body Editor (if POST) */}
                {selectedEndpoint.method === 'POST' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">Request Body (JSON Payload)</label>
                      <button
                        onClick={() =>
                          setApiRequestBody(
                            JSON.stringify(selectedEndpoint.requestBodyExample || {}, null, 2)
                          )
                        }
                        className="text-[11px] text-cyan-400 hover:underline"
                      >
                        Reset to Example
                      </button>
                    </div>
                    <textarea
                      value={apiRequestBody}
                      onChange={(e) => setApiRequestBody(e.target.value)}
                      rows={8}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-200 outline-none focus:border-cyan-500 leading-relaxed"
                    />
                  </div>
                )}

                {/* Live Response Viewer */}
                {apiExecutionResponse && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300">Live API Server Response:</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            apiExecutionResponse.ok
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          HTTP {apiExecutionResponse.status} • {apiExecutionResponse.latencyMs}ms
                        </span>
                      </div>
                    </div>
                    <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 overflow-x-auto max-h-60">
                      {JSON.stringify(apiExecutionResponse.data || apiExecutionResponse.error, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Code Snippet Generator */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      {(['curl', 'javascript', 'python'] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setSelectedCodeLang(lang)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors ${
                            selectedCodeLang === lang
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        const code =
                          selectedCodeLang === 'curl'
                            ? selectedEndpoint.curlExample
                            : selectedCodeLang === 'javascript'
                            ? selectedEndpoint.jsExample
                            : selectedEndpoint.pythonExample;
                        handleCopyCode(code);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>

                  <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-indigo-200 overflow-x-auto">
                    {selectedCodeLang === 'curl'
                      ? selectedEndpoint.curlExample
                      : selectedCodeLang === 'javascript'
                      ? selectedEndpoint.jsExample
                      : selectedEndpoint.pythonExample}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SDKS & CLIENT LIBRARIES */}
        {activeTab === 'sdk' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/30 rounded-3xl p-6 space-y-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
                  <Package className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Official Lumina SDKs</h2>
                  <p className="text-xs text-slate-300">
                    High-performance client libraries for Node.js, TypeScript, Python, and Go with built-in retry logic, streaming render status, and raw buffer uploads.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Install Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TypeScript / Node.js SDK */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-400" />
                    TypeScript / Node.js SDK
                  </span>
                  <span className="text-[10px] font-bold text-blue-300 bg-blue-950/80 border border-blue-500/30 px-2 py-0.5 rounded">
                    npm install @lumina/sdk
                  </span>
                </div>
                <pre className="bg-slate-950 p-3 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto">
{`import { LuminaClient } from '@lumina/sdk';

const lumina = new LuminaClient({
  apiKey: process.env.LUMINA_API_KEY,
  clusterRegion: 'us-central1'
});

// 1. Cloud Render with 4x AI Super-Resolution
const render = await lumina.render.create({
  sourceImageUrl: 'https://example.com/raw.jpg',
  options: {
    format: 'png',
    upscaleFactor: 4,
    colorSpace: 'Display-P3'
  }
});

// 2. Headless 8-Stage Automation
const workflow = await lumina.automation.execute({
  sourceImageUrl: 'https://example.com/photo.jpg',
  workflowId: 'commercial_portrait_master'
});`}
                </pre>
              </div>

              {/* Python SDK */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    Python SDK (Async & Sync)
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded">
                    pip install lumina-sdk
                  </span>
                </div>
                <pre className="bg-slate-950 p-3 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto">
{`from lumina_sdk import LuminaClient

client = LuminaClient(api_key="lumina_live_...")

# 1. Parallel Batch Ingestion
batch = client.batch.process(
    name="Summer Lookbook 2026",
    items=["https://example.com/01.jpg", "https://example.com/02.jpg"],
    workflow_id="commercial_portrait_master",
    webhook_url="https://api.brand.com/webhooks"
)

print(f"Batch dispatched: {batch.id}")
print(f"ZIP package: {batch.zip_download_url}")`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PLUGIN API & EXTENSIBILITY */}
        {activeTab === 'plugin_api' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Lumina Plugin API & Manifest SDK</h2>
                  <p className="text-xs text-slate-400">
                    Build custom WebGL shaders, UI panels, canvas interceptors, and export formats using the `@lumina/plugin-sdk`.
                  </p>
                </div>
              </div>

              {/* Plugin Spec Code Sample */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-200">Standard Plugin Manifest (`lumina-plugin.json`):</div>
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-purple-200 overflow-x-auto">
{`{
  "id": "com.studio.anamorphic-flare",
  "name": "Anamorphic Optical Streak & Flare",
  "version": "2.1.0",
  "author": "Optics FX Lab",
  "permissions": [
    "canvas:read",
    "canvas:write",
    "webgl:shaders",
    "ui:panel"
  ],
  "entrypoint": "dist/plugin.js",
  "hooks": {
    "onRender": "applyAnamorphicStreakShader",
    "onLayerChange": "recalculateDiffraction"
  },
  "ui": {
    "panelTitle": "Anamorphic Streak Pro",
    "controls": [
      { "id": "streakIntensity", "type": "slider", "min": 0, "max": 100, "default": 45 },
      { "id": "flareTint", "type": "color", "default": "#38bdf8" }
    ]
  }
}`}
                </pre>
              </div>

              {/* Plugin JavaScript Implementation Code */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-200">Plugin Execution Handler (`src/plugin.ts`):</div>
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-cyan-200 overflow-x-auto">
{`import { defineLuminaPlugin, WebGLPipeline } from '@lumina/plugin-sdk';

export default defineLuminaPlugin({
  async onRender(context) {
    const { gl, inputTexture, outputFramebuffer, params } = context;
    
    // Inject Custom Fragment Shader
    WebGLPipeline.applyShader(gl, {
      fragmentSource: ANAMORPHIC_STREAK_GLSL,
      uniforms: {
        u_intensity: params.streakIntensity / 100.0,
        u_tint: params.flareTint
      }
    });
  }
});`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOM AI MODELS */}
        {activeTab === 'custom_ai' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-white">Custom AI Model Inference Endpoints</h2>
                <p className="text-xs text-slate-400">
                  Connect your own Hugging Face Inference endpoints, Replicate models, Local Ollama servers, or OpenAI-compatible vision/diffusion APIs.
                </p>
              </div>

              <button
                onClick={() => setIsNewModelModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom AI Model</span>
              </button>
            </div>

            {/* Custom AI Models List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customModels.map((model) => (
                <div
                  key={model.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-purple-400" />
                        {model.name}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
                        {model.provider}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 break-all bg-slate-950 p-2 rounded-xl">
                      {model.endpointUrl}
                    </div>

                    <div className="text-xs text-slate-300 flex items-center justify-between pt-1">
                      <span>Model ID: <strong className="text-white">{model.modelIdentifier}</strong></span>
                      <span className="text-[10px] text-slate-400 capitalize">{model.modelType.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleTestCustomModel(model)}
                      disabled={testingModelId === model.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {testingModelId === model.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
                      ) : (
                        <Play className="w-3 h-3 text-emerald-400" />
                      )}
                      <span>Test Handshake</span>
                    </button>

                    <button
                      onClick={() => {
                        setCustomModels((prev) => prev.filter((m) => m.id !== model.id));
                        showToast('info', 'Model Removed', model.name);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove model endpoint"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: WEBHOOKS */}
        {activeTab === 'webhooks' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-white">Signed Webhooks & Event Streams</h2>
                <p className="text-xs text-slate-400">
                  Receive real-time notifications for completed cloud rendering jobs, batch processing finishes, and 8-stage automation results with HMAC-SHA256 signatures.
                </p>
              </div>

              <button
                onClick={() => setIsNewWebhookOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Add Webhook Endpoint</span>
              </button>
            </div>

            {/* Webhook Endpoints List */}
            <div className="space-y-4">
              {webhooks.map((wh) => (
                <div
                  key={wh.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Webhook className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold text-white font-mono">{wh.url}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSendTestWebhook(wh)}
                        disabled={testingWebhookId === wh.id}
                        className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-all"
                      >
                        {testingWebhookId === wh.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                        ) : (
                          <Send className="w-3 h-3 text-emerald-400" />
                        )}
                        <span>Send Test Ping</span>
                      </button>

                      <button
                        onClick={() => {
                          setWebhooks((prev) => prev.filter((w) => w.id !== wh.id));
                          showToast('info', 'Webhook Removed', wh.url);
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400">{wh.description}</div>

                  {/* Subscribed Events */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {wh.events.map((ev) => (
                      <span
                        key={ev}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-emerald-300 border border-slate-800"
                      >
                        {ev}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
                    <div>Secret: <span className="text-slate-300">{wh.secret.substring(0, 16)}...</span></div>
                    <div>Deliveries: <strong className="text-white">{wh.deliveryCount}</strong></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Webhook Delivery Log Viewer if test run */}
            {recentWebhookLog && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Latest Webhook Delivery Payload & Signature:
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Header: <span className="text-emerald-300 font-bold">{recentWebhookLog.signature}</span>
                </div>
                <pre className="bg-slate-950 p-3 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto">
                  {JSON.stringify(recentWebhookLog.payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: CLOUD RENDERING & BATCH API SPECS */}
        {activeTab === 'cloud_render' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-500/30 rounded-3xl p-6 space-y-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Distributed Cloud Rendering & Batch Processing Engine</h2>
                  <p className="text-xs text-slate-300">
                    High-throughput, GPU-accelerated image pipeline. Super-resolve up to 8K, embed pro ICC color profiles, debayer RAW camera sensors, and export ZIP archives in parallel.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  GPU Infrastructure
                </div>
                <p className="text-[11px] text-slate-400">
                  NVIDIA A100 SXM4 80GB nodes with multi-instance GPU virtualization and sub-150ms execution latency.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  AI 8x Super-Resolution
                </div>
                <p className="text-[11px] text-slate-400">
                  Real-ESRGAN and deep optical diffusion upscaling for crystal-clear billboard and fine art prints.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-400" />
                  S3 & Cloud Storage Ingest
                </div>
                <p className="text-[11px] text-slate-400">
                  Direct ingestion from Amazon S3, Google Cloud Storage, or Cloudflare R2 presigned URLs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: API KEYS & ACCESS TOKENS */}
        {activeTab === 'keys' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-white">API Keys & Authentication Tokens</h2>
                <p className="text-xs text-slate-400">
                  Manage API keys for server-side authorization. Production keys run at 1,200 req/min with full A100 GPU cluster access.
                </p>
              </div>

              <button
                onClick={() => setIsNewKeyModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Create New API Key</span>
              </button>
            </div>

            {/* API Keys List */}
            <div className="space-y-4">
              {apiKeys.map((k) => (
                <div
                  key={k.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-bold text-white">{k.name}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          k.environment === 'production'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {k.environment}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyCode(k.key)}
                        className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-all"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Key</span>
                      </button>

                      <button
                        onClick={() => {
                          setApiKeys((prev) => prev.filter((item) => item.id !== k.id));
                          showToast('info', 'Key Revoked', k.name);
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Revoke key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl text-xs font-mono text-amber-300 flex items-center justify-between">
                    <span>{k.key}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {k.scopes.map((scope) => (
                      <span
                        key={scope}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    <div>Rate Limit: <strong className="text-white">{k.rateLimitPerMin} req/min</strong></div>
                    <div>Total Requests: <strong className="text-emerald-400">{k.totalRequests.toLocaleString()}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* NEW API KEY MODAL DIALOG */}
      {isNewKeyModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-black text-white">Create New API Access Key</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production Backend Service"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Environment</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setNewKeyEnv('production')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                    newKeyEnv === 'production'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>Production</div>
                  <div className="text-[10px] text-slate-500 font-normal">1,200 req/min • Live GPUs</div>
                </button>
                <button
                  onClick={() => setNewKeyEnv('sandbox')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                    newKeyEnv === 'sandbox'
                      ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>Sandbox</div>
                  <div className="text-[10px] text-slate-500 font-normal">300 req/min • Testing</div>
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsNewKeyModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateApiKey}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-xs font-bold text-white shadow-lg shadow-amber-600/30"
              >
                Generate Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW CUSTOM AI MODEL MODAL DIALOG */}
      {isNewModelModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-black text-white">Register Custom AI Model Endpoint</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Model Name / Alias</label>
              <input
                type="text"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="e.g. FLUX.1-Dev Commercial Edition"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Provider</label>
                <select
                  value={newModelProvider}
                  onChange={(e) => setNewModelProvider(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="huggingface_inference">Hugging Face Inference</option>
                  <option value="replicate">Replicate</option>
                  <option value="openai_compatible">OpenAI Compatible (v1)</option>
                  <option value="ollama_local">Ollama Local Server</option>
                  <option value="openrouter">OpenRouter</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Model Type</label>
                <select
                  value={newModelType}
                  onChange={(e) => setNewModelType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="image_generation">Text-to-Image Generation</option>
                  <option value="image_to_image">Image-to-Image / Style</option>
                  <option value="vision_analysis">Vision Scene Analysis</option>
                  <option value="upscaling_superres">8x Super-Resolution</option>
                  <option value="inpainting">Inpainting & Generative Fill</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Endpoint URL</label>
              <input
                type="text"
                value={newModelEndpoint}
                onChange={(e) => setNewModelEndpoint(e.target.value)}
                placeholder="https://api-inference.huggingface.co/models/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Model Identifier / Checkpoint</label>
              <input
                type="text"
                value={newModelId}
                onChange={(e) => setNewModelId(e.target.value)}
                placeholder="e.g. black-forest-labs/FLUX.1-dev"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsNewModelModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomModel}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30"
              >
                Register Model
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW WEBHOOK MODAL DIALOG */}
      {isNewWebhookOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-black text-white">Register Webhook Endpoint</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Target Endpoint URL</label>
              <input
                type="text"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                placeholder="https://api.yourdomain.com/webhooks/lumina"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Description</label>
              <input
                type="text"
                value={newWebhookDesc}
                onChange={(e) => setNewWebhookDesc(e.target.value)}
                placeholder="e.g. Media Production Webhook Dispatcher"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Subscribe to Events</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'render.completed',
                  'render.failed',
                  'batch.completed',
                  'batch.item_processed',
                  'automation.executed',
                  'model.inference_finished',
                ].map((ev) => {
                  const isChecked = selectedWebhookEvents.includes(ev as WebhookEventType);
                  return (
                    <label
                      key={ev}
                      className={`p-2 rounded-xl border text-xs font-mono font-medium flex items-center gap-2 cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWebhookEvents((prev) => [...prev, ev as WebhookEventType]);
                          } else {
                            setSelectedWebhookEvents((prev) => prev.filter((item) => item !== ev));
                          }
                        }}
                        className="w-3.5 h-3.5 accent-emerald-500"
                      />
                      <span>{ev}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsNewWebhookOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWebhook}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/30"
              >
                Create Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
