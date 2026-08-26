import React from 'react';
import { Sparkles, ShieldCheck, X, CheckCircle2, Lock } from 'lucide-react';
import { AiFeatureConsent } from '../../types/security';

interface AIConsentDialogProps {
  isOpen: boolean;
  featureName: string;
  featureDescription: string;
  onConsent: () => void;
  onDecline: () => void;
}

export const AIConsentDialog: React.FC<AIConsentDialogProps> = ({
  isOpen,
  featureName,
  featureDescription,
  onConsent,
  onDecline,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-scaleUp text-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-950 border border-purple-500/40 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Explicit AI Processing Consent</h3>
            <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              ZERO-RETENTION GUARANTEE
            </span>
          </div>
        </div>

        <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div className="text-xs font-bold text-white">{featureName}</div>
          <p className="text-xs text-slate-300 leading-relaxed">{featureDescription}</p>
        </div>

        <div className="space-y-1.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ephemeral inference only. No raw images stored.</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Strict zero-training policy enforced with C2PA headers.</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onDecline}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            Decline & Use Local
          </button>
          <button
            onClick={onConsent}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Consent & Proceed</span>
          </button>
        </div>
      </div>
    </div>
  );
};
