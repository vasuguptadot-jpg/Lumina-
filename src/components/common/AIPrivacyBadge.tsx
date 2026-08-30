/**
 * Lumina Studio Pro — AI Privacy Status & Consent Badge
 *
 * Displays an active privacy badge on the workspace header indicating whether AI is
 * running 100% locally on-device, dispatching to a user API key, or disabled.
 * 
 * Strict 3-Color Hierarchy: #050505 (Black), #7A0F18 (Dark Red), #E6E3DE (Greyish White).
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Key, Cloud, EyeOff } from 'lucide-react';
import { TopLevelAIProviderMode } from '../../types/localAIModels';
import { aiProviderManager } from '../../services/ai/aiProviderManager';

interface AIPrivacyBadgeProps {
  onOpenSettings?: () => void;
}

export const AIPrivacyBadge: React.FC<AIPrivacyBadgeProps> = ({ onOpenSettings }) => {
  const [mode, setMode] = useState<TopLevelAIProviderMode>('local');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    setMode(aiProviderManager.getTopLevelMode());
    const interval = setInterval(() => {
      setMode(aiProviderManager.getTopLevelMode());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getBadgeContent = () => {
    switch (mode) {
      case 'local':
        return {
          icon: Cpu,
          label: 'Local AI',
          sub: 'On-Device WebGPU',
          style: 'bg-[#7A0F18] text-[#E6E3DE] border-[#7A0F18] hover:bg-[#8F141E]',
          dot: 'bg-[#E6E3DE]',
          tooltip: '100% Private: All neural models execute locally on-device. 0 bytes leave your device.',
        };
      case 'user_api':
        return {
          icon: Key,
          label: 'User API',
          sub: 'Direct HTTPS',
          style: 'bg-[#050505] text-[#E6E3DE] border-[rgba(230,227,222,0.25)] hover:border-[#7A0F18]',
          dot: 'bg-[rgba(230,227,222,0.70)]',
          tooltip: 'Point-to-Point: Images sent directly to your configured AI provider using AES-256 local vault.',
        };
      case 'lumina_cloud':
        return {
          icon: Cloud,
          label: 'Cloud AI',
          sub: 'Managed Proxy',
          style: 'bg-[rgba(122,15,24,0.30)] text-[#E6E3DE] border-[rgba(122,15,24,0.60)] hover:bg-[#7A0F18]',
          dot: 'bg-[#7A0F18]',
          tooltip: 'Lumina Cloud: Requires explicit authorization before any image processing occurs.',
        };
      case 'none':
      default:
        return {
          icon: EyeOff,
          label: 'AI Disabled',
          sub: 'Deterministic Only',
          style: 'bg-[#050505] text-[rgba(230,227,222,0.45)] border-[rgba(230,227,222,0.10)] hover:border-[rgba(230,227,222,0.25)]',
          dot: 'bg-[rgba(230,227,222,0.25)]',
          tooltip: 'AI Disabled: Lumina is operating as a 100% manual parametric photo editor.',
        };
    }
  };

  const badge = getBadgeContent();
  const Icon = badge.icon;

  return (
    <div className="relative inline-block">
      <button
        id="ai-privacy-status-badge"
        onClick={onOpenSettings}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${badge.style}`}
        title={badge.tooltip}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} animate-pulse`} />
        <Icon className="w-3.5 h-3.5" />
        <span>{badge.label}</span>
      </button>

      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 z-50 w-64 p-3 bg-[#050505] border border-[rgba(230,227,222,0.15)] rounded-lg shadow-2xl text-left space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E6E3DE]">
            <ShieldCheck className="w-4 h-4 text-[#7A0F18]" />
            <span>Data Sovereignty Status</span>
          </div>
          <p className="text-[11px] text-[rgba(230,227,222,0.70)] leading-relaxed">{badge.tooltip}</p>
          <div className="pt-1.5 border-t border-[rgba(230,227,222,0.08)] text-[10px] text-[rgba(230,227,222,0.45)] flex items-center justify-between">
            <span>Click to change AI settings</span>
            <span className="font-mono">{badge.sub}</span>
          </div>
        </div>
      )}
    </div>
  );
};
