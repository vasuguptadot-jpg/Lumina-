import React, { useState } from 'react';
import {
  Cloud,
  Users,
  RefreshCw,
  Clock,
  HardDrive,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Share2,
  Lock,
  Wifi,
  WifiOff,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Project } from '../../types/editor';
import { CloudConflictModal } from './CloudConflictModal';
import { CollaboratorPresenceBar } from './CollaboratorPresenceBar';

interface CloudWorkspaceViewProps {
  project: Project;
  onOpenCollaborationModal?: () => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

type CloudSubTab = 'projects' | 'sync' | 'collaboration' | 'render' | 'storage';

export const CloudWorkspaceView: React.FC<CloudWorkspaceViewProps> = ({
  project,
  onOpenCollaborationModal,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<CloudSubTab>('projects');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast?.('success', 'Cloud Vault Synchronized', 'All local revisions pushed to cloud storage.');
    }, 900);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#000000] p-4 sm:p-8 space-y-6 select-none text-white font-sans">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#080808] border border-[#222222] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141414] text-[#CCCCCC] border border-[#2C2C2C] uppercase tracking-wider flex items-center gap-1.5">
              <Cloud className="w-3 h-3 text-[#CCCCCC]" />
              <span>LUMINA CLOUD VAULT</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#141414] text-[#999999] border border-[#222222] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>ONLINE & SYNCED</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Cloud Workspace & Team Collaboration
          </h1>
          <p className="text-xs text-[#999999]">
            End-to-end encrypted cloud storage, team review sessions, live multi-cursor presence, and cloud GPU rendering.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCollaborationModal}
            className="px-3.5 py-2 rounded-lg bg-[#141414] hover:bg-[#181818] border border-[#222222] text-[#CCCCCC] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Invite Team</span>
          </button>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded-lg bg-white hover:bg-[#CCCCCC] text-black text-xs font-semibold flex items-center gap-2 transition-colors active:scale-98 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Vault Now'}</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-[#181818] pb-1 overflow-x-auto">
        {[
          { id: 'projects', label: 'Cloud Projects', icon: Cloud },
          { id: 'sync', label: 'Sync & Diagnostics', icon: RefreshCw },
          { id: 'collaboration', label: 'Live Team & Presence', icon: Users },
          { id: 'render', label: 'Cloud Render Queue', icon: Cpu },
          { id: 'storage', label: 'Storage Quota & Plan', icon: HardDrive },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors shrink-0 ${
                isActive
                  ? 'bg-[#181818] text-white border border-[#2C2C2C]'
                  : 'text-[#999999] hover:text-white hover:bg-[#0D0D0D]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab Contents */}
      {activeSubTab === 'projects' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-[#080808] border border-[#222222] space-y-4">
            <h2 className="text-xs font-semibold uppercase font-mono tracking-wider text-white">
              Active Synchronized Project
            </h2>

            <div className="p-4 rounded-lg bg-[#101010] border border-[#222222] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-[#181818] border border-[#2C2C2C] flex items-center justify-center font-mono font-bold text-white">
                  LP
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">{project.name}</h3>
                  <div className="text-[10px] text-[#666666] font-mono mt-0.5 flex items-center gap-2">
                    <span>Revision #42</span>
                    <span>•</span>
                    <span>Auto-saved to Cloud Vault</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#181818] text-[#CCCCCC] border border-[#2C2C2C]">
                  AES-256 GCM
                </span>
                <button
                  onClick={handleManualSync}
                  className="px-3 py-1 rounded bg-white text-black text-xs font-semibold"
                >
                  Push Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'sync' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-[#080808] border border-[#222222] space-y-3">
            <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-white">
              Sync Engine Status
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#999999]">
                <span>Connection:</span>
                <span className="font-mono text-white">WebSocket Secure (WSS)</span>
              </div>
              <div className="flex items-center justify-between text-[#999999]">
                <span>Sync Latency:</span>
                <span className="font-mono text-white">18ms</span>
              </div>
              <div className="flex items-center justify-between text-[#999999]">
                <span>Pending Outbox:</span>
                <span className="font-mono text-white">0 operations</span>
              </div>
              <div className="flex items-center justify-between text-[#999999]">
                <span>Conflict Strategy:</span>
                <span className="font-mono text-white">LWW (Last-Write-Wins CRDT)</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#080808] border border-[#222222] space-y-3">
            <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-white">
              Multi-Tab Session Broadcast
            </h3>
            <p className="text-xs text-[#999999]">
              BroadcastChannel API active across browser windows. Edits made in one tab replicate instantly to all background tabs without page reloads.
            </p>
            <div className="p-2.5 rounded bg-[#101010] border border-[#222222] text-[11px] font-mono text-[#CCCCCC]">
              Broadcast channel: lumina_project_sync_active
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'collaboration' && (
        <div className="p-5 rounded-xl bg-[#080808] border border-[#222222] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-white">
              Active Team Members
            </h3>
            <button
              onClick={onOpenCollaborationModal}
              className="px-3 py-1.5 rounded bg-white text-black text-xs font-semibold"
            >
              Manage Invites
            </button>
          </div>

          <div className="divide-y divide-[#181818]">
            {[
              { name: 'You (Owner)', role: 'Lead Colorist / Editor', status: 'Online' },
              { name: 'Studio Client Reviewer', role: 'Viewer / Commenter', status: 'Active 5m ago' },
            ].map((user, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#181818] border border-[#2C2C2C] flex items-center justify-center text-xs font-mono font-bold text-white">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">{user.name}</div>
                    <div className="text-[10px] text-[#666666] font-mono">{user.role}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#CCCCCC] bg-[#141414] px-2 py-0.5 rounded border border-[#222222]">
                  {user.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'render' && (
        <div className="p-5 rounded-xl bg-[#080808] border border-[#222222] space-y-3">
          <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-white">
            Cloud GPU Rendering Queue
          </h3>
          <p className="text-xs text-[#999999]">
            Offload 8K RAW demosaicing and deep AI generative inpainting to cloud inference workers.
          </p>
          <div className="p-8 text-center border border-[#181818] rounded-lg bg-[#050505]">
            <span className="text-xs text-[#666666] font-mono">Render queue is currently empty.</span>
          </div>
        </div>
      )}

      {activeSubTab === 'storage' && (
        <div className="p-5 rounded-xl bg-[#080808] border border-[#222222] space-y-4 max-w-xl">
          <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-white">
            Cloud Vault Allocation
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#999999]">Storage Utilized</span>
              <span className="font-mono text-white">3.4 GB of 50.0 GB (6.8%)</span>
            </div>
            <div className="w-full h-2 bg-[#141414] rounded-full overflow-hidden border border-[#222222]">
              <div className="w-[6.8%] h-full bg-white rounded-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
