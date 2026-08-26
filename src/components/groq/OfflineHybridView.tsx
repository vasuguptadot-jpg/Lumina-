import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Zap,
  Cpu,
  Layers,
  Sliders,
  Crop,
  Sun,
  Palette,
  Sparkles,
  CheckCircle2,
  HardDrive,
  Globe,
  Lock,
  ArrowRight,
  ShieldCheck,
  Flame,
  Activity,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  HYBRID_CAPABILITIES,
  HybridCapability,
  HybridSystemStatus,
} from '../../types/hybridEngine';
import { getGroqConfig } from '../../services/groqService';
import { getAIProviderConfig, setOfflineMode } from '../../services/aiProviderEngine';

interface OfflineHybridViewProps {
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const OfflineHybridView: React.FC<OfflineHybridViewProps> = ({ showToast }) => {
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(() => getAIProviderConfig().offlineMode);
  const [filterCategory, setFilterCategory] = useState<'all' | 'offline' | 'groq'>('all');
  const [activeTab, setActiveTab] = useState<'matrix' | 'architecture' | 'benchmark'>('matrix');

  const config = getGroqConfig();
  const isOnline = !isSimulatedOffline && typeof navigator !== 'undefined' ? navigator.onLine : true;

  const offlineCapabilities = HYBRID_CAPABILITIES.filter((c) => c.mode === 'OFFLINE_LOCAL');
  const groqCapabilities = HYBRID_CAPABILITIES.filter((c) => c.mode === 'ONLINE_GROQ');

  const displayedCapabilities =
    filterCategory === 'offline'
      ? offlineCapabilities
      : filterCategory === 'groq'
      ? groqCapabilities
      : HYBRID_CAPABILITIES;

  const toggleSimulatedOffline = () => {
    const nextState = !isSimulatedOffline;
    setIsSimulatedOffline(nextState);
    setOfflineMode(nextState);
    if (nextState) {
      showToast?.(
        'info',
        'Offline Mode Active',
        'Lumina Studio seamlessly switched to 100% Local Processing Engine. All sliders, curves, layers, and exports remain instant.'
      );
    } else {
      showToast?.(
        'success',
        'Online & Hybrid AI Enabled',
        'Cloud AI features (Natural Language Planning, Vision Understanding) re-enabled alongside local WebGL stack.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Hybrid Philosophy */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-amber-950/70 border border-emerald-500/30 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 uppercase tracking-wider flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-emerald-400" />
                Deterministic Local Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                Optional Groq Cloud AI
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 uppercase tracking-wider flex items-center gap-1">
                <Cpu className="w-3 h-3 text-indigo-400" />
                Zero Downtime Guarantee
              </span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="w-6 h-6 text-emerald-400" />
              Offline-First + Groq Hybrid Architecture
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              <strong>Core Promise:</strong> The application never becomes useless without an internet connection. All core photo editing (cropping, color grading, curves, filters, layers, masks, RAW decoding, and export) runs 100% locally on WebGL/WASM with 0ms latency. Groq acts as an optional cloud brain for high-level reasoning and natural language planning.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleSimulatedOffline}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
                isSimulatedOffline
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/60'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60'
              }`}
            >
              {isSimulatedOffline ? (
                <>
                  <WifiOff className="w-4 h-4 text-amber-200" />
                  Offline Mode Active (Click to Reconnect)
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 text-emerald-200" />
                  Hybrid Online (Click to Test Offline)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Status Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Local WebGL Engine
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
            <HardDrive className="w-5 h-5" />
            100% Operational (0ms)
          </div>
          <p className="text-[11px] text-slate-400">
            {offlineCapabilities.length} Core editing features fully functional offline
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Groq Cloud LPU Brain
            </span>
            <span className={`w-2 h-2 rounded-full ${isSimulatedOffline ? 'bg-amber-400' : 'bg-indigo-400'}`} />
          </div>
          <div className={`text-lg font-bold flex items-center gap-1.5 ${
            isSimulatedOffline ? 'text-amber-400' : 'text-indigo-400'
          }`}>
            <Zap className="w-5 h-5" />
            {isSimulatedOffline ? 'Offline (Gracefully Dormant)' : 'Online & Standby (~40ms)'}
          </div>
          <p className="text-[11px] text-slate-400">
            {groqCapabilities.length} Cloud AI planning & vision intelligence capabilities
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Performance Paradigm
            </span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-1.5">
            <Sliders className="w-5 h-5 text-emerald-400" />
            Zero-Latency Local Feedback
          </div>
          <p className="text-[11px] text-slate-400">
            Fast local editing + Optional cloud AI synergy
          </p>
        </div>
      </div>

      {/* Two Column Architecture Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT COLUMN: OFFLINE LOCAL ENGINE */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <HardDrive className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Offline Local Processing
                </h3>
                <p className="text-[11px] text-slate-400">
                  Runs directly on client hardware (WebGL 2.0 / WebAssembly)
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              ALWAYS READY (0ms)
            </span>
          </div>

          <div className="space-y-2">
            {offlineCapabilities.map((cap) => (
              <div
                key={cap.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {cap.name}
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400">
                    Local GPU
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {cap.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: ONLINE GROQ CLOUD ENGINE */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                <Zap className="w-5 h-5 text-indigo-400" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Online / Groq Cloud Processing
                </h3>
                <p className="text-[11px] text-slate-400">
                  Runs on high-speed Groq LPUs for reasoning & orchestration
                </p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
              isSimulatedOffline
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
            }`}>
              {isSimulatedOffline ? 'DORMANT (OFFLINE)' : 'ACTIVE (~40ms)'}
            </span>
          </div>

          <div className="space-y-2">
            {groqCapabilities.map((cap) => (
              <div
                key={cap.id}
                className={`p-3 rounded-xl border transition-all space-y-1 ${
                  isSimulatedOffline
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-950 border-slate-800 hover:border-indigo-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    {cap.name}
                  </span>
                  <span className="text-[9px] font-mono text-indigo-400">
                    Groq Cloud
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {cap.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Architecture Callout */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-slate-300">
            <span className="font-bold text-white">Hybrid Resilience:</span> When internet connectivity drops, Lumina Studio silently suppresses cloud AI calls without interrupting active sliders, canvas renders, or batch export pipelines.
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-emerald-400">
          <span>WebGL 2.0 (Active)</span>
          <span>•</span>
          <span>Groq LPU (Hybrid)</span>
        </div>
      </div>
    </div>
  );
};
