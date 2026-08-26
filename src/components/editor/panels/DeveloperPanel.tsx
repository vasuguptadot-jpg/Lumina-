import React, { useState } from 'react';
import {
  Code2,
  Terminal,
  Key,
  ExternalLink,
  Copy,
  Check,
  Send,
  RefreshCw,
  Cloud,
  Brain,
  Zap,
  Server,
} from 'lucide-react';
import { Project } from '../../../types/editor';
import { DEFAULT_API_KEYS, executeLiveApiCall, API_DOCUMENTATION } from '../../../engine/developerSdk';

interface DeveloperPanelProps {
  project: Project;
  onOpenDeveloperPlatform: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const DeveloperPanel: React.FC<DeveloperPanelProps> = ({
  project,
  onOpenDeveloperPlatform,
  showToast,
}) => {
  const [apiKey] = useState(DEFAULT_API_KEYS[0]);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [isTriggeringRender, setIsTriggeringRender] = useState(false);
  const [renderJobResult, setRenderJobResult] = useState<any>(null);

  const activeImageUrl = project.image.url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600';

  const quickCurlSnippet = `curl -X POST https://lumina-api.app/api/v1/render \\
  -H "Authorization: Bearer ${apiKey.key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sourceImageUrl": "${activeImageUrl.substring(0, 45)}...",
    "options": {
      "format": "png",
      "upscaleFactor": 4,
      "colorSpace": "Display-P3"
    }
  }'`;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    showToast('info', 'API Key Copied', apiKey.name);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(quickCurlSnippet);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
    showToast('info', 'cURL Snippet Copied', 'Paste into terminal to execute');
  };

  const handleTriggerCloudRender = async () => {
    setIsTriggeringRender(true);
    setRenderJobResult(null);

    const renderEp = API_DOCUMENTATION.find((e) => e.id === 'cloud_render_post')!;
    const payload = {
      sourceImageUrl: activeImageUrl,
      options: {
        format: 'png',
        quality: 0.98,
        upscaleFactor: 4,
        colorSpace: 'Display-P3',
        gpuAcceleration: 'ultra_a100',
      },
    };

    const res = await executeLiveApiCall(renderEp, apiKey.key, payload);
    setRenderJobResult(res.data);
    setIsTriggeringRender(false);

    if (res.ok) {
      showToast('success', 'GPU Render Dispatched', `Processed on A100 node in ${res.latencyMs}ms`);
    } else {
      showToast('error', 'Render API Error', 'Failed to dispatch cloud render');
    }
  };

  return (
    <div className="p-4 space-y-4 text-slate-100 select-none">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border border-cyan-500/30 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-black uppercase text-white tracking-wider">
              Developer & API
            </span>
          </div>
          <button
            onClick={onOpenDeveloperPlatform}
            className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 hover:text-white bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 px-2 py-0.5 rounded-lg transition-all"
          >
            <span>Open Dev Hub</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Headless API, TypeScript & Python SDKs, Custom AI Models, Webhooks, and Cloud GPU Rendering.
        </p>
      </div>

      {/* Active API Key Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            Active API Token
          </span>
          <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.2 rounded">
            Live Production
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 font-mono text-[11px] text-amber-300 flex items-center justify-between">
          <span className="truncate pr-2">{apiKey.key}</span>
          <button
            onClick={handleCopyKey}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors shrink-0"
            title="Copy API key"
          >
            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Quick Cloud Render Dispatch */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5 text-cyan-400" />
            Cloud A100 GPU Render
          </span>
          <span className="text-[10px] font-mono text-slate-400">4x AI Super-Res</span>
        </div>

        <button
          onClick={handleTriggerCloudRender}
          disabled={isTriggeringRender}
          className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/30 active:scale-98"
        >
          {isTriggeringRender ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Rendering on A100 GPU...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Headless Render</span>
            </>
          )}
        </button>

        {renderJobResult && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-[11px] font-mono text-emerald-300 space-y-1">
            <div className="flex justify-between">
              <span>Job Status:</span>
              <strong className="text-white">{renderJobResult.job?.status}</strong>
            </div>
            <div className="flex justify-between">
              <span>Resolution:</span>
              <strong className="text-white">{renderJobResult.job?.outputResolution}</strong>
            </div>
            <div className="flex justify-between">
              <span>Worker Node:</span>
              <strong className="text-slate-300">{renderJobResult.job?.workerNode}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Live cURL Generator */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            CLI / cURL Command
          </span>
          <button
            onClick={handleCopyCurl}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-all"
          >
            {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
          </button>
        </div>

        <pre className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-[10px] font-mono text-indigo-200 overflow-x-auto">
          {quickCurlSnippet}
        </pre>
      </div>

      {/* Full Hub Link Button */}
      <button
        onClick={onOpenDeveloperPlatform}
        className="w-full py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
      >
        <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
        <span>Open Full Developer Hub & SDKs</span>
      </button>
    </div>
  );
};
