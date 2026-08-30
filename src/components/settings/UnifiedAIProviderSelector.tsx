/**
 * Lumina Studio Pro — Unified AI Provider Mode Selector
 *
 * Provides a clear, high-contrast monochrome selection interface for the 4 core AI modes:
 * 1. Built-in Local AI
 * 2. My API Key
 * 3. Lumina Cloud AI
 * 4. None (AI Disabled)
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Key,
  Cloud,
  EyeOff,
  Cpu,
  Lock,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Sparkles,
} from 'lucide-react';
import { TopLevelAIProviderMode } from '../../types/localAIModels';
import { aiProviderManager } from '../../services/ai/aiProviderManager';
import { localModelManager } from '../../services/ai/localModelManager';

interface UnifiedAIProviderSelectorProps {
  onModeChange?: (mode: TopLevelAIProviderMode) => void;
  onOpenLocalModels?: () => void;
  onOpenUserKeys?: () => void;
}

export const UnifiedAIProviderSelector: React.FC<UnifiedAIProviderSelectorProps> = ({
  onModeChange,
  onOpenLocalModels,
  onOpenUserKeys,
}) => {
  const [currentMode, setCurrentMode] = useState<TopLevelAIProviderMode>('local');
  const [installedCount, setInstalledCount] = useState(0);

  useEffect(() => {
    setCurrentMode(aiProviderManager.getTopLevelMode());
    updateInstalledCount();

    const unsub = localModelManager.subscribe(() => {
      updateInstalledCount();
    });
    return unsub;
  }, []);

  const updateInstalledCount = () => {
    const installed = localModelManager.getInstalledModels().filter((m) => m.status === 'installed');
    setInstalledCount(installed.length);
  };

  const handleSelectMode = (mode: TopLevelAIProviderMode) => {
    setCurrentMode(mode);
    aiProviderManager.setTopLevelMode(mode);
    if (onModeChange) onModeChange(mode);
  };

  const modes: Array<{
    id: TopLevelAIProviderMode;
    title: string;
    subtitle: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
    privacySummary: string;
    details: string;
  }> = [
    {
      id: 'local',
      title: 'Built-in Local AI',
      subtitle: 'Runs directly on this device using WebGPU & on-device neural weights.',
      badge: 'Zero Network Activity • 100% Offline',
      icon: Cpu,
      privacySummary: 'Your photograph never leaves this machine. 0 bytes transmitted.',
      details: `${installedCount} verified models installed. Quantized for instant real-time editing.`,
    },
    {
      id: 'user_api',
      title: 'My API Key',
      subtitle: 'Connect your own OpenAI, Gemini, Anthropic, OpenRouter, or Ollama endpoint.',
      badge: 'AES-256 Encrypted Vault',
      icon: Key,
      privacySummary: 'Direct browser-to-provider HTTPS. No intermediary developer servers.',
      details: 'Full access to state-of-the-art cloud vision and multimodal models.',
    },
    {
      id: 'lumina_cloud',
      title: 'Lumina Cloud AI',
      subtitle: 'Managed cloud inference proxy for zero-configuration editing.',
      badge: 'Explicit Authorization Required',
      icon: Cloud,
      privacySummary: 'Photographs uploaded only upon explicit per-operation confirmation.',
      details: 'Automatic server-side scaling with zero local hardware memory load.',
    },
    {
      id: 'none',
      title: 'None (Disable AI)',
      subtitle: 'Completely disable all AI background threads and model assistance.',
      badge: 'Deterministic Only',
      icon: EyeOff,
      privacySummary: 'All AI features turned off. Lumina operates purely as manual editor.',
      details: 'Zero AI dependencies, zero background memory, zero network telemetry.',
    },
  ];

  return (
    <div id="unified-ai-provider-selector-root" className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-neutral-100">AI Execution Mode</h3>
        <p className="text-xs text-neutral-400">
          Choose where AI photo editing and vision analysis computations take place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {modes.map((m) => {
          const isSelected = currentMode === m.id;
          const Icon = m.icon;

          return (
            <div
              key={m.id}
              id={`ai-mode-option-${m.id}`}
              onClick={() => handleSelectMode(m.id)}
              className={`cursor-pointer rounded-xl border p-4.5 transition-all ${
                isSelected
                  ? 'bg-neutral-900 border-neutral-200 text-neutral-100 shadow-md ring-1 ring-neutral-200/20'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-lg transition-colors ${
                      isSelected ? 'bg-neutral-100 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-100">{m.title}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                          isSelected
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">{m.subtitle}</p>
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{m.privacySummary}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    name="ai-top-level-mode"
                    checked={isSelected}
                    onChange={() => handleSelectMode(m.id)}
                    className="w-4 h-4 text-neutral-100 bg-neutral-900 border-neutral-700 focus:ring-neutral-400"
                  />
                </div>
              </div>

              {/* Sub-actions when active */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                  <span className="text-neutral-400">{m.details}</span>
                  {m.id === 'local' && onOpenLocalModels && (
                    <button
                      id="manage-local-models-sub-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenLocalModels();
                      }}
                      className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg font-medium transition-colors"
                    >
                      Manage Local Models →
                    </button>
                  )}
                  {m.id === 'user_api' && onOpenUserKeys && (
                    <button
                      id="manage-user-keys-sub-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenUserKeys();
                      }}
                      className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg font-medium transition-colors"
                    >
                      Configure API Keys →
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
