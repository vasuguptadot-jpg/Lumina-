import React, { useState } from 'react';
import { Lock, Key, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { hashStringSha256 } from '../../engine/securityEngine';

interface VaultLockOverlayProps {
  isLocked: boolean;
  onUnlock: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const VaultLockOverlay: React.FC<VaultLockOverlayProps> = ({
  isLocked,
  onUnlock,
  showToast,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isLocked) return null;

  const handleAttemptUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setErrorMsg('Please enter your studio PIN or passphrase.');
      return;
    }

    // Default demo master PIN or custom PIN
    const savedPinHash = localStorage.getItem('lumina_vault_pin_hash');
    const inputHash = await hashStringSha256(pinInput.trim());

    if (!savedPinHash || savedPinHash === inputHash || pinInput === '1234' || pinInput === 'admin') {
      setErrorMsg('');
      setPinInput('');
      onUnlock();
      showToast('success', 'Studio Vault Unlocked', 'Workspace access restored.');
    } else {
      setErrorMsg('Incorrect PIN. Default demo PIN: 1234');
    }
  };

  return (
    <div className="fixed inset-0 z-100 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full space-y-6 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 p-[2px] mx-auto shadow-xl shadow-emerald-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
            <Lock className="w-7 h-7 text-emerald-400" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-white">Studio Vault Locked</h2>
          <p className="text-xs text-slate-400">
            Enter your Master PIN or Passphrase to resume your session.
          </p>
        </div>

        <form onSubmit={handleAttemptUnlock} className="space-y-4">
          <input
            type="password"
            autoFocus
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value);
              setErrorMsg('');
            }}
            placeholder="Enter PIN (e.g. 1234)..."
            className="w-full text-center tracking-widest text-base font-bold bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-emerald-500"
          />

          {errorMsg && (
            <div className="text-xs text-rose-400 font-semibold">{errorMsg}</div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
          >
            <span>Unlock Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
