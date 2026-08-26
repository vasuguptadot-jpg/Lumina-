import React from 'react';
import { X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none select-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-xl border border-[#2A2A2A] bg-[#0D0D0D] text-zinc-100 backdrop-blur-md transition-all"
        >
          <div className="w-5 h-5 rounded flex items-center justify-center font-mono text-xs font-bold bg-[#141414] text-white border border-[#2A2A2A] shrink-0 mt-0.5">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '×'}
            {toast.type === 'info' && 'ℹ'}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-white tracking-tight">{toast.title}</h4>
            {toast.message && <p className="text-[11px] text-[#A0A0A0] mt-0.5 leading-relaxed">{toast.message}</p>}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#141414] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
