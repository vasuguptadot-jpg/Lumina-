import React, { useState } from 'react';
import {
  ShieldCheck,
  Shield,
  MapPinOff,
  ScanFace,
  Lock,
  Trash2,
  Share2,
  Sparkles,
  ExternalLink,
  Cpu,
  CheckCircle2,
  Key,
} from 'lucide-react';
import { Project } from '../../../types/editor';
import { PrivacyPreferences } from '../../../types/security';
import {
  loadPrivacyPreferences,
  savePrivacyPreferences,
} from '../../../engine/securityEngine';

interface SecurityPrivacyPanelProps {
  project: Project;
  onOpenSecurityModal: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const SecurityPrivacyPanel: React.FC<SecurityPrivacyPanelProps> = ({
  project,
  onOpenSecurityModal,
  showToast,
}) => {
  const [prefs, setPrefs] = useState<PrivacyPreferences>(loadPrivacyPreferences);

  const handleToggle = (key: keyof PrivacyPreferences) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      savePrivacyPreferences(updated);
      showToast('info', 'Privacy Setting Updated', `${String(key)} is now ${updated[key] ? 'ENABLED' : 'DISABLED'}`);
      return updated;
    });
  };

  return (
    <div className="p-4 space-y-5 text-slate-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold text-white">Security & Privacy Guard</span>
          </div>
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            LOCAL ENGINE
          </span>
        </div>
        <p className="text-[11px] text-slate-300">
          All image edits execute in your local WebGL canvas sandbox with zero model training telemetry.
        </p>

        <button
          onClick={onOpenSecurityModal}
          className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5"
        >
          <span>Open Full Security Governance Hub</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Quick Action Toggles */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Active Privacy Protections
        </h4>

        {/* Local Only */}
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Local-Only Processing</span>
            </div>
            <div className="text-[10px] text-slate-400">Never upload pixels to remote servers</div>
          </div>
          <input
            type="checkbox"
            checked={prefs.localOnlyMode}
            onChange={() => handleToggle('localOnlyMode')}
            className="w-4 h-4 accent-emerald-500 cursor-pointer"
          />
        </div>

        {/* GPS Stripper */}
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <MapPinOff className="w-3.5 h-3.5 text-cyan-400" />
              <span>Strip GPS & Camera Serial</span>
            </div>
            <div className="text-[10px] text-slate-400">Redact location coordinates on export</div>
          </div>
          <input
            type="checkbox"
            checked={prefs.stripGpsOnExport}
            onChange={() => handleToggle('stripGpsOnExport')}
            className="w-4 h-4 accent-cyan-500 cursor-pointer"
          />
        </div>

        {/* No AI Training */}
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>No AI Model Training</span>
            </div>
            <div className="text-[10px] text-slate-400">C2PA strict Do-Not-Train covenant</div>
          </div>
          <input
            type="checkbox"
            checked={prefs.noAiTrainingConsent}
            onChange={() => handleToggle('noAiTrainingConsent')}
            className="w-4 h-4 accent-purple-500 cursor-pointer"
          />
        </div>

        {/* Face Anonymize */}
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <ScanFace className="w-3.5 h-3.5 text-pink-400" />
              <span>Auto Face Anonymize</span>
            </div>
            <div className="text-[10px] text-slate-400">Blur subject faces on public export</div>
          </div>
          <input
            type="checkbox"
            checked={prefs.autoBlurFacesOnPublicExport}
            onChange={() => handleToggle('autoBlurFacesOnPublicExport')}
            className="w-4 h-4 accent-pink-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Security Quick Links */}
      <div className="space-y-2 pt-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Governance Quick Tools
        </h4>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenSecurityModal}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left space-y-1 transition-all"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <div className="text-xs font-bold text-white">E2EE Vault</div>
            <div className="text-[10px] text-slate-400">AES-256 Keys</div>
          </button>

          <button
            onClick={onOpenSecurityModal}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left space-y-1 transition-all"
          >
            <Share2 className="w-4 h-4 text-cyan-400" />
            <div className="text-xs font-bold text-white">Secure Share</div>
            <div className="text-[10px] text-slate-400">Password Links</div>
          </button>
        </div>
      </div>
    </div>
  );
};
