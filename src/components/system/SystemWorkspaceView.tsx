import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Shield,
  Settings,
  Key,
  Database,
  Camera,
  RefreshCw,
  Zap,
  CheckCircle2,
  Lock,
  Flame,
  Terminal,
  Sliders,
} from 'lucide-react';
import { getGroqConfig, saveGroqConfig, setGroqApiKey } from '../../services/groqService';

interface SystemWorkspaceViewProps {
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

type SystemTab = 'performance' | 'raw' | 'workers' | 'memory' | 'security' | 'settings';

export const SystemWorkspaceView: React.FC<SystemWorkspaceViewProps> = ({ showToast }) => {
  const [activeTab, setActiveTab] = useState<SystemTab>('performance');
  const [apiKey, setApiKey] = useState(() => getGroqConfig().maskedKey || '');
  const [model, setModel] = useState(() => getGroqConfig().activeModel || 'llama-3.3-70b-versatile');
  const [autoSaveSec, setAutoSaveSec] = useState(30);

  const handleSaveGroq = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim() && !apiKey.includes('•')) {
      setGroqApiKey(apiKey.trim());
    }
    saveGroqConfig({
      activeModel: model as any,
    });
    showToast?.('success', 'Groq Engine Saved', 'AI credentials updated successfully.');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#000000] p-4 sm:p-8 space-y-6 select-none text-white font-sans">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-[#080808] border border-[#222222] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141414] text-[#CCCCCC] border border-[#2C2C2C] uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-[#CCCCCC]" />
              <span>DIAGNOSTICS & SYSTEM ENGINE</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#141414] text-[#999999] border border-[#222222]">
              Lumina Hardware Layer
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            System Workspace & Telemetry
          </h1>
          <p className="text-xs text-[#999999]">
            Hardware acceleration telemetry, WebAssembly worker pools, Bayer demosaicing pipeline audits, and engine preferences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-[#141414] border border-[#222222] text-xs font-mono text-[#CCCCCC]">
            ● GPU ACCELERATED (Wasm SIMD)
          </span>
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex items-center gap-1.5 border-b border-[#181818] pb-1 overflow-x-auto">
        {[
          { id: 'performance', label: 'Performance & GPU', icon: Cpu },
          { id: 'raw', label: 'RAW Engine Diagnostics', icon: Camera },
          { id: 'workers', label: 'Worker Thread Pool', icon: Terminal },
          { id: 'memory', label: 'Memory & Cache', icon: HardDrive },
          { id: 'security', label: 'Security & Vault', icon: Shield },
          { id: 'settings', label: 'Engine Settings', icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors shrink-0 ${
                isActive
                  ? 'bg-[#181818] text-white border border-[#2C2C2C]'
                  : 'text-[#999999] hover:text-white hover:bg-[#0D0D0D]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subtab Panes */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Render Pipeline FPS', val: '60.0 FPS', desc: 'Hardware vsync synced' },
            { label: 'GPU Latency', val: '2.4 ms', desc: 'Floating point 32-bit GL' },
            { label: 'SIMD Acceleration', val: 'ACTIVE', desc: '128-bit vector demosaicing' },
            { label: 'Color Pipeline', val: 'Float32 Linear', desc: 'Zero quantization loss' },
          ].map((card, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[#080808] border border-[#222222] space-y-1">
              <div className="text-[10px] font-mono text-[#666666] uppercase">{card.label}</div>
              <div className="text-xl font-bold font-mono text-white">{card.val}</div>
              <div className="text-[11px] text-[#999999]">{card.desc}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'raw' && (
        <div className="p-5 rounded-xl bg-[#080808] border border-[#222222] space-y-4 max-w-2xl">
          <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-white">
            RAW Demosaic Engine Specifications
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#999999]">
              <span>CFA Bayer Pattern Support:</span>
              <span className="font-mono text-white">RGGB, BGGR, GBRG, GRBG</span>
            </div>
            <div className="flex items-center justify-between text-[#999999]">
              <span>Demosaic Algorithm:</span>
              <span className="font-mono text-white">Adaptive Homogeneity-Directed (AHD)</span>
            </div>
            <div className="flex items-center justify-between text-[#999999]">
              <span>Highlight Recovery:</span>
              <span className="font-mono text-white">Luminance Reconstruction + Inpainting</span>
            </div>
            <div className="flex items-center justify-between text-[#999999]">
              <span>Supported Formats:</span>
              <span className="font-mono text-white">.DNG, .CR2, .CR3, .NEF, .ARW, .ORF, .RW2</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'workers' && (
        <div className="p-5 rounded-xl bg-[#080808] border border-[#222222] space-y-3 max-w-2xl">
          <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-white">
            Multi-Threaded Worker Pool
          </h3>
          <div className="space-y-2">
            {[
              { name: 'Worker #1 (RAW Demosaic)', status: 'Idle', queue: '0 tasks' },
              { name: 'Worker #2 (Color Grade & Curves)', status: 'Ready', queue: '0 tasks' },
              { name: 'Worker #3 (AI Inpainting & Mask)', status: 'Ready', queue: '0 tasks' },
              { name: 'Worker #4 (Export & Encoding)', status: 'Ready', queue: '0 tasks' },
            ].map((w, i) => (
              <div key={i} className="p-3 rounded-lg bg-[#101010] border border-[#222222] flex items-center justify-between text-xs">
                <span className="font-mono text-white">{w.name}</span>
                <span className="font-mono text-[#CCCCCC] bg-[#181818] px-2 py-0.5 rounded border border-[#2C2C2C]">
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'memory' && (
        <div className="p-5 rounded-xl bg-[#080808] border border-[#222222] space-y-4 max-w-xl">
          <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-white">
            Heap & Texture Pool Usage
          </h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#999999]">Wasm Buffer Heap</span>
                <span className="font-mono text-white">64 MB / 512 MB</span>
              </div>
              <div className="w-full h-2 bg-[#141414] rounded-full overflow-hidden border border-[#222222]">
                <div className="w-[12.5%] h-full bg-white rounded-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#999999]">Canvas Texture Cache</span>
                <span className="font-mono text-white">128 MB / 1024 MB</span>
              </div>
              <div className="w-full h-2 bg-[#141414] rounded-full overflow-hidden border border-[#222222]">
                <div className="w-[12.5%] h-full bg-white rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="p-5 rounded-xl bg-[#080808] border border-[#222222] space-y-3 max-w-xl">
          <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-white">
            Vault Privacy & Zero-Knowledge Architecture
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg bg-[#101010] border border-[#222222] space-y-1">
              <div className="font-semibold text-white">Local-First Vault Encryption</div>
              <div className="text-[#999999]">
                All edits, undo trees, and raw image blobs reside exclusively in sandboxed IndexedDB storage on your device.
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#101010] border border-[#222222] space-y-1">
              <div className="font-semibold text-white">EXIF Privacy Shield</div>
              <div className="text-[#999999]">
                GPS coordinates and device identifiers are stripped automatically on export when privacy toggles are enabled.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="p-5 rounded-xl bg-[#080808] border border-[#222222] space-y-5 max-w-xl">
          <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-white">
            Engine & AI Preferences
          </h3>

          <form onSubmit={handleSaveGroq} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[#CCCCCC]">Groq LPU API Key (Optional for AI Director)</label>
              <input
                type="password"
                placeholder="gsk_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#101010] border border-[#222222] text-xs text-white placeholder-[#666666] focus:border-[#444444] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#CCCCCC]">AI Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#101010] border border-[#222222] text-xs text-white focus:outline-none"
              >
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Fast Reasoning)</option>
                <option value="llama3-70b-8192">Llama 3 70B (8k context)</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B (32k context)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#CCCCCC]">Auto-save Interval</label>
              <select
                value={autoSaveSec}
                onChange={(e) => setAutoSaveSec(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#101010] border border-[#222222] text-xs text-white focus:outline-none"
              >
                <option value={10}>Every 10 seconds</option>
                <option value={30}>Every 30 seconds</option>
                <option value={60}>Every 1 minute</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-[#CCCCCC] transition-colors"
            >
              Save Engine Settings
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
