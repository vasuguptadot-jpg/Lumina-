import React, { useState, useEffect } from 'react';
import { autosaveEngine } from '../../storage/autosaveEngine';
import { DirtyState } from '../../types/projectSchema';

interface DirtyStateIndicatorProps {
  onManualSave?: () => void;
  className?: string;
}

export const DirtyStateIndicator: React.FC<DirtyStateIndicatorProps> = ({
  onManualSave,
  className = '',
}) => {
  const [dirtyState, setDirtyState] = useState<DirtyState>(autosaveEngine.getDirtyState());
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(autosaveEngine.getLastSavedAt());
  const [timeAgoText, setTimeAgoText] = useState<string>('Just now');

  useEffect(() => {
    const unsub = autosaveEngine.subscribeDirtyState((state, savedAt) => {
      setDirtyState(state);
      setLastSavedAt(savedAt);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastSavedAt) {
        setTimeAgoText('Not saved yet');
        return;
      }
      const diffSec = Math.floor((Date.now() - lastSavedAt) / 1000);
      if (diffSec < 5) {
        setTimeAgoText('Just now');
      } else if (diffSec < 60) {
        setTimeAgoText(`${diffSec}s ago`);
      } else {
        const diffMin = Math.floor(diffSec / 60);
        setTimeAgoText(`${diffMin}m ago`);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [lastSavedAt]);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onManualSave) {
      onManualSave();
    } else {
      autosaveEngine.saveNow();
    }
  };

  if (dirtyState === 'saving') {
    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#141414] text-zinc-300 border border-[#2A2A2A] ${className}`}
        title="Writing changes safely to IndexedDB..."
      >
        <span>◐</span>
        <span className="hidden sm:inline">SYNCING</span>
      </div>
    );
  }

  if (dirtyState === 'save_failed') {
    return (
      <button
        onClick={handleSaveClick}
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#141414] text-white border border-zinc-600 hover:bg-[#1A1A1A] transition-colors ${className}`}
        title="Autosave failed. Click to retry."
      >
        <span>×</span>
        <span>FAILED (RETRY)</span>
      </button>
    );
  }

  if (dirtyState === 'conflict') {
    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#141414] text-white border border-zinc-500 ${className}`}
        title="Modified in another tab"
      >
        <span>!</span>
        <span>ATTENTION: CONFLICT</span>
      </div>
    );
  }

  if (dirtyState === 'dirty') {
    return (
      <button
        onClick={handleSaveClick}
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#141414] text-zinc-300 border border-[#2A2A2A] hover:border-zinc-500 hover:text-white transition-colors ${className}`}
        title="Unsaved changes pending. Click to save immediately."
      >
        <span>○</span>
        <span>UNSAVED</span>
      </button>
    );
  }

  // Saved / Clean
  return (
    <div
      onClick={handleSaveClick}
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#0D0D0D] hover:bg-[#141414] text-zinc-400 hover:text-zinc-200 border border-[#2A2A2A] transition-colors cursor-pointer ${className}`}
      title={`All changes saved locally to IndexedDB (${timeAgoText}). Click to force save.`}
    >
      <span className="text-zinc-200">✓</span>
      <span className="text-zinc-300 font-semibold hidden sm:inline">SAVED</span>
      <span className="text-zinc-500 text-[9px] hidden md:inline">
        ({timeAgoText})
      </span>
    </div>
  );
};
