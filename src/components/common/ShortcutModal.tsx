/**
 * Lumina Studio Pro — Keyboard Shortcut Reference Modal
 * Strict 3-Color Hierarchy: #050505 (Black), #7A0F18 (Dark Red), #E6E3DE (Greyish White).
 */

import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutModal: React.FC<ShortcutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '1 - 7', desc: 'Jump to Workflow Stage (Cull → Crop → Develop → AI → Retouch → Grade → Export)' },
    { key: '[ / ]', desc: 'Cycle Previous / Next Workflow Stage' },
    { key: 'Ctrl + Z', desc: 'Undo last edit or stroke' },
    { key: 'Ctrl + Y', desc: 'Redo last edit' },
    { key: '\\ (Backslash)', desc: 'Hold to peek original photo' },
    { key: 'Space + Drag', desc: 'Pan viewport image' },
    { key: 'Scroll Wheel', desc: 'Pan viewport vertically' },
    { key: 'Ctrl + Wheel', desc: 'Zoom in / out of canvas' },
    { key: 'F', desc: 'Fit image to screen' },
    { key: 'B', desc: 'Draw & Paint Studio' },
    { key: 'I', desc: 'Eyedropper Color Picker' },
    { key: 'T', desc: 'Text & Typography Tool' },
    { key: 'G', desc: 'Graphics & Design Elements' },
    { key: 'K', desc: 'Collage Studio' },
    { key: 'C', desc: 'Switch to Crop & Transform' },
    { key: 'P', desc: 'Switch to Film Presets' },
    { key: 'A', desc: 'Switch to Color Adjustments' },
    { key: 'Ctrl + E', desc: 'Open High-Resolution Export modal' },
    { key: 'Ctrl + S', desc: 'Sync Project to Cloud Vault' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#050505]/90 flex items-center justify-center p-4 select-none">
      <div className="bg-[#050505] border border-[rgba(230,227,222,0.15)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[rgba(230,227,222,0.08)] flex items-center justify-between bg-[#050505]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#7A0F18] flex items-center justify-center text-[#E6E3DE]">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#E6E3DE]">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.06)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-[#050505] border border-[rgba(230,227,222,0.08)] text-xs"
            >
              <span className="text-[rgba(230,227,222,0.70)] text-[11px]">{s.desc}</span>
              <kbd className="px-2 py-0.5 bg-[#050505] border border-[rgba(230,227,222,0.15)] text-[#E6E3DE] font-mono rounded text-[10px] font-bold shrink-0 ml-2">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
