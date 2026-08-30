/**
 * Lumina Studio Pro — System Notification Toasts
 * Strict 3-Color Hierarchy: #050505 (Black), #7A0F18 (Dark Red), #E6E3DE (Greyish White).
 */

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
          className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-2xl border border-[rgba(230,227,222,0.15)] bg-[#050505] text-[#E6E3DE] transition-all"
        >
          <div className={`w-5 h-5 rounded flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${
            toast.type === 'error'
              ? 'bg-[#7A0F18] text-[#E6E3DE] border border-[#7A0F18]'
              : 'bg-[#050505] text-[#E6E3DE] border border-[rgba(230,227,222,0.20)]'
          }`}>
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '×'}
            {toast.type === 'info' && 'ℹ'}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-[#E6E3DE] tracking-tight">{toast.title}</h4>
            {toast.message && <p className="text-[11px] text-[rgba(230,227,222,0.70)] mt-0.5 leading-relaxed">{toast.message}</p>}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 rounded text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.06)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
