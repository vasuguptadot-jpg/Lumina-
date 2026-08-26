/**
 * Lumina Studio Pro - Global Cloud Sync Status Indicator
 * Strict monochrome indicator displaying network, queue, and conflict state.
 */

import React, { useState, useEffect } from 'react';
import { cloudSyncEngine } from '../../services/cloudSyncEngine';
import { authService } from '../../services/authService';
import { SyncState, ProjectConflictReport } from '../../types/cloudSync';
import { syncQueueManager } from '../../storage/syncQueueDb';

interface CloudSyncStatusIndicatorProps {
  onOpenCloudHub?: () => void;
  onOpenConflictModal?: (report: ProjectConflictReport) => void;
}

export const CloudSyncStatusIndicator: React.FC<CloudSyncStatusIndicatorProps> = ({
  onOpenCloudHub,
  onOpenConflictModal,
}) => {
  const [syncState, setSyncState] = useState<SyncState>(cloudSyncEngine.getSyncState());
  const [conflictReport, setConflictReport] = useState<ProjectConflictReport | null>(null);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authService.isAuthenticated());

  useEffect(() => {
    const unsubAuth = authService.subscribe((user) => {
      setIsAuthenticated(!!user);
    });

    const unsubSync = cloudSyncEngine.subscribeStatus((state, details) => {
      setSyncState(state);
      if (details?.conflictReport) {
        setConflictReport(details.conflictReport);
      } else {
        setConflictReport(null);
      }
    });

    const checkQueue = () => {
      syncQueueManager.getQueueLength().then((count) => setPendingQueueCount(count));
    };

    checkQueue();
    const interval = setInterval(checkQueue, 4000);

    return () => {
      unsubAuth();
      unsubSync();
      clearInterval(interval);
    };
  }, []);

  const handleClick = () => {
    if (syncState === 'CONFLICT' && conflictReport && onOpenConflictModal) {
      onOpenConflictModal(conflictReport);
    } else if (onOpenCloudHub) {
      onOpenCloudHub();
    }
  };

  if (!isAuthenticated) {
    return (
      <button
        onClick={onOpenCloudHub}
        className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#0D0D0D] border border-[#2A2A2A] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
        title="Local-First Mode (Offline Saved). Sign in to activate Cloud Vault Sync."
      >
        <span>●</span>
        <span>LOCAL VAULT</span>
      </button>
    );
  }

  if (syncState === 'CONFLICT' && conflictReport) {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141414] text-white border border-zinc-500 hover:bg-[#1A1A1A] transition-colors"
        title="Edit Conflict Detected! Click to resolve."
      >
        <span>!</span>
        <span>CONFLICT ({conflictReport.conflictedProperties.length})</span>
      </button>
    );
  }

  if (syncState === 'SYNCING') {
    return (
      <button
        onClick={onOpenCloudHub}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#141414] text-zinc-300 border border-[#2A2A2A] transition-colors"
        title="Synchronizing changes with Cloud Vault..."
      >
        <span>◐</span>
        <span>SYNCING{pendingQueueCount > 0 ? ` (${pendingQueueCount})` : ''}</span>
      </button>
    );
  }

  if (syncState === 'OFFLINE') {
    return (
      <button
        onClick={onOpenCloudHub}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#141414] text-zinc-400 border border-[#2A2A2A] hover:text-white transition-colors"
        title="Offline Mode — Changes saved locally in IndexedDB queue and will synchronize automatically when connection returns."
      >
        <span>○</span>
        <span>OFFLINE{pendingQueueCount > 0 ? ` (${pendingQueueCount} Q)` : ''}</span>
      </button>
    );
  }

  if (syncState === 'ERROR') {
    return (
      <button
        onClick={onOpenCloudHub}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#141414] text-white border border-zinc-600 hover:bg-[#1A1A1A] transition-colors"
        title="Sync paused. Click to inspect retry status."
      >
        <span>×</span>
        <span>FAILED ({pendingQueueCount})</span>
      </button>
    );
  }

  // Default: SYNCED
  return (
    <button
      onClick={onOpenCloudHub}
      className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#0D0D0D] text-zinc-300 border border-[#2A2A2A] hover:border-zinc-700 transition-colors"
      title="All changes synchronized securely to Cloud Vault."
    >
      <span className="text-zinc-200">✓</span>
      <span>CLOUD SYNCED</span>
    </button>
  );
};
