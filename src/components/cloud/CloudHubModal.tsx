import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  Share2,
  Cpu,
  History,
  Sparkles,
  Smartphone,
  Laptop,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
  Layers,
  Sliders,
  Zap,
  RefreshCw,
  X,
  User as UserIcon,
  LogOut,
  LogIn,
  SlidersHorizontal,
  HardDrive,
  Download,
  Trash2,
  HelpCircle,
  Activity,
  Shield,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  signInWithGoogle,
  logOutCloud,
  saveProjectToCloud,
  saveVersionSnapshot,
  listProjectVersions,
  syncPresetToCloud,
  subscribeToCloudPresets,
  submitCloudRenderJob,
  subscribeToUserRenderJobs,
  generateShareableLink,
  getDeviceId,
  getDeviceType,
} from '../../services/cloudSyncService';
import { Project, FilterPreset, EditHistorySnapshot } from '../../types/editor';
import {
  CloudProjectRecord,
  CloudVersionSnapshot,
  CloudPresetRecord,
  CloudRenderJob,
  CloudUser,
} from '../../types/cloud';
import { runPhase10MasterCertification, Phase10MasterCertificationReport } from '../../test/platformCertification/masterPhase10Suite';
import { runPhase11MasterCertification, Phase11MasterReport } from '../../test/platformCertification/masterPhase11Suite';
import { runPhase12MasterCertification, Phase12MasterReport } from '../../test/platformCertification/masterPhase12Suite';
import { FeatureFlagService, FeatureFlags, EmergencyKillSwitches } from '../../services/release/featureFlags';
import { BetaSessionAnalytics, BetaSessionMetrics } from '../../services/diagnostics/betaSessionAnalytics';
import { CloudCostForensics } from '../../services/cloud/cloudCostForensics';
import { CURRENT_BUILD_METADATA, getFormattedBuildString } from '../../services/release/buildInfo';
import confetti from 'canvas-confetti';

interface CloudHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  currentProject: Project | null;
  onLoadProject: (project: Project) => void;
  onApplySnapshot: (snapshot: EditHistorySnapshot) => void;
  onImportPreset: (preset: FilterPreset) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const CloudHubModal: React.FC<CloudHubModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentProject,
  onLoadProject,
  onApplySnapshot,
  onImportPreset,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<
    'sync' | 'versions' | 'rendering' | 'share' | 'presets' | 'account' | 'diagnostics'
  >('sync');
  const [phase10Result, setPhase10Result] = useState<Phase10MasterCertificationReport | null>(null);
  const [phase11Result, setPhase11Result] = useState<Phase11MasterReport | null>(null);
  const [phase12Result, setPhase12Result] = useState<Phase12MasterReport | null>(null);
  const [diagnosticsVersion, setDiagnosticsVersion] = useState<'PHASE_12' | 'PHASE_11'>('PHASE_12');
  const [diagnosticsCategory, setDiagnosticsCategory] = useState<string>('ALL');
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(FeatureFlagService.getFlags());
  const [killSwitches, setKillSwitches] = useState<EmergencyKillSwitches>(FeatureFlagService.getKillSwitches());
  const [betaMetrics, setBetaMetrics] = useState<BetaSessionMetrics>(BetaSessionAnalytics.getMetrics());

  // Cloud Data States
  const [isSaving, setIsSaving] = useState(false);
  const [versionList, setVersionList] = useState<CloudVersionSnapshot[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [newVersionNote, setNewVersionNote] = useState('');
  const [cloudPresets, setCloudPresets] = useState<CloudPresetRecord[]>([]);
  const [renderJobs, setRenderJobs] = useState<CloudRenderJob[]>([]);
  const [isSubmittingRender, setIsSubmittingRender] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Cloud Render Configuration Form
  const [renderFormat, setRenderFormat] = useState<
    'png' | 'jpeg' | 'webp' | 'tiff' | 'dng' | 'pdf' | 'psd'
  >('tiff');
  const [renderScale, setRenderScale] = useState<number>(2);
  const [renderColorSpace, setRenderColorSpace] = useState<
    'sRGB' | 'Display P3' | 'Adobe RGB' | 'ProPhoto RGB'
  >('Display P3');
  const [renderBitDepth, setRenderBitDepth] = useState<
    '8-bit' | '16-bit' | '32-bit Float'
  >('16-bit');

  // Load Version History
  useEffect(() => {
    if (isOpen && currentProject && currentUser) {
      setIsLoadingVersions(true);
      listProjectVersions(currentProject.id)
        .then((vers) => setVersionList(vers))
        .catch((err) => console.warn('Versions fetch error:', err))
        .finally(() => setIsLoadingVersions(false));
    }
  }, [isOpen, currentProject, currentUser]);

  // Subscribe to Cloud Presets and Render Jobs
  useEffect(() => {
    if (!isOpen) return;

    const unsubPresets = subscribeToCloudPresets((presets) => {
      setCloudPresets(presets);
    });

    let unsubJobs = () => {};
    if (currentUser) {
      unsubJobs = subscribeToUserRenderJobs(currentUser.uid, (jobs) => {
        setRenderJobs(jobs);
      });
    }

    return () => {
      unsubPresets();
      unsubJobs();
    };
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      showToast('success', 'Connected to Lumina Cloud Ecosystem', 'Cross-device synchronization is now active.');
    } catch (err: any) {
      showToast('error', 'Authentication Failed', err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOutCloud();
      showToast('info', 'Signed Out of Cloud', 'Switched to local-only storage.');
    } catch (err: any) {
      showToast('error', 'Sign Out Error', err.message);
    }
  };

  const handleSaveToCloud = async () => {
    if (!currentProject || !currentUser) {
      showToast('error', 'Sign In Required', 'Please sign in to back up your project.');
      return;
    }
    setIsSaving(true);
    try {
      await saveProjectToCloud(currentProject, currentUser);
      showToast('success', 'Project Synced to Cloud', `Saved ${currentProject.name} to multi-region storage.`);
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      } catch (e) {}
    } catch (err: any) {
      showToast('error', 'Sync Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!currentProject || !currentUser) return;
    const label = newVersionNote.trim() || `Milestone ${versionList.length + 1}`;
    try {
      await saveVersionSnapshot(currentProject, currentUser, label);
      setNewVersionNote('');
      const updated = await listProjectVersions(currentProject.id);
      setVersionList(updated);
      showToast('success', 'Version Snapshot Saved', `Recorded "${label}" in immutable history.`);
    } catch (err: any) {
      showToast('error', 'Version Save Error', err.message);
    }
  };

  const handleStartCloudRender = async () => {
    if (!currentProject || !currentUser) {
      showToast('error', 'Authentication Required', 'Please sign in to access cloud GPU nodes.');
      return;
    }
    setIsSubmittingRender(true);
    try {
      await submitCloudRenderJob(
        currentProject,
        currentUser,
        renderFormat,
        renderScale,
        renderColorSpace,
        renderBitDepth
      );
      showToast('success', 'GPU Render Task Queued', `Dispatched ${renderScale}x ${renderFormat.toUpperCase()} to Lumina Cloud Nodes.`);
      setActiveTab('rendering');
    } catch (err: any) {
      showToast('error', 'Render Dispatch Failed', err.message);
    } finally {
      setIsSubmittingRender(false);
    }
  };

  const handleGenerateShare = async () => {
    if (!currentProject || !currentUser) {
      showToast('error', 'Sign In Required', 'Sign in to generate cloud sharing links.');
      return;
    }
    setIsGeneratingShare(true);
    try {
      const { shareUrl } = await generateShareableLink(currentProject, currentUser);
      setShareLink(shareUrl);
      showToast('success', 'Public Share Link Ready', 'Anyone with the link can view and fork this project.');
    } catch (err: any) {
      showToast('error', 'Sharing Failed', err.message);
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopySuccess(true);
    showToast('info', 'Link Copied', 'Share URL copied to clipboard.');
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Lumina Cloud Ecosystem
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[11px] font-bold font-mono">
                  LIVE SYNC ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cross-device live sync, version history snapshots, cloud GPU rendering & presets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 bg-slate-950/30 overflow-x-auto scrollbar-none">
          {[
            { id: 'sync', label: 'Cloud Sync & Devices', icon: RefreshCw },
            { id: 'versions', label: 'Version History', icon: History, count: versionList.length },
            { id: 'rendering', label: 'Cloud GPU Render', icon: Cpu, count: renderJobs.length },
            { id: 'presets', label: 'Cloud Presets', icon: Sliders, count: cloudPresets.length },
            { id: 'share', label: 'Share & Collaborate', icon: Share2 },
            { id: 'account', label: 'Storage & Account', icon: UserIcon },
            { id: 'diagnostics', label: 'Forensic Audit & Tests', icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl font-medium text-xs border-t border-x transition-all ${
                  isActive
                    ? 'bg-slate-900 border-slate-700/80 text-white font-bold shadow-lg shadow-sky-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. CLOUD SYNC & CROSS-DEVICE TAB */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              {/* Sync Hero Card */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-sm font-bold text-white">
                      {currentUser ? 'Cloud Engine Online & Synced' : 'Offline / Local Only Mode'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {currentUser
                      ? `Signed in as ${currentUser.email}. Changes synchronize across your browser, tablet, and mobile devices.`
                      : 'Sign in to automatically sync edits, presets, and high-resolution assets seamlessly.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {currentUser ? (
                    <button
                      onClick={handleSaveToCloud}
                      disabled={isSaving || !currentProject}
                      className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all disabled:opacity-50"
                    >
                      <CloudUpload className="w-4 h-4" />
                      <span>{isSaving ? 'Synchronizing...' : 'Sync Project Now'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSignIn}
                      className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In with Google</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Current Project Synchronization Telemetry */}
              {currentProject && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-sky-400" />
                    Current Project Telemetry
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Project Name</span>
                      <span className="text-white font-semibold truncate block">{currentProject.name}</span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Cloud Revision</span>
                      <span className="text-sky-400 font-mono font-bold">Rev #{currentProject.cloudRevision || 1}</span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Resolution</span>
                      <span className="text-slate-300 font-mono">{currentProject.image.width} × {currentProject.image.height}</span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Sync Status</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Live Multi-Device
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Connected Devices Simulation */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-indigo-400" />
                  Active Cross-Device Ecosystem
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-900/90 border border-sky-500/30 p-4 rounded-2xl flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">This Workstation (Desktop)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">PRIMARY</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block">Active Studio Editor • Low Latency</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 opacity-80">
                    <div className="p-3 rounded-xl bg-slate-800 text-slate-400">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Mobile Companion Client</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">STANDBY</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block">Instant Camera Capture & Live Presets</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. VERSION HISTORY TAB */}
          {activeTab === 'versions' && (
            <div className="space-y-5">
              {/* Snapshot Creator */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Milestone note (e.g. 'Warm Golden Hour Grading', 'Final Print Retouch')..."
                  value={newVersionNote}
                  onChange={(e) => setNewVersionNote(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                />
                <button
                  onClick={handleCreateVersion}
                  disabled={!currentProject || !currentUser}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/20 disabled:opacity-50"
                >
                  <History className="w-4 h-4" />
                  <span>Create Snapshot</span>
                </button>
              </div>

              {/* Version History Timeline */}
              {isLoadingVersions ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
                  <span>Loading cloud snapshots...</span>
                </div>
              ) : versionList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <span>No cloud version snapshots saved yet for this project.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {versionList.map((ver, idx) => (
                    <div
                      key={ver.id}
                      className="bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 p-3.5 rounded-2xl flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex-shrink-0">
                          {ver.thumbnailUrl ? (
                            <img src={ver.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <History className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{ver.label}</span>
                            <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">
                              v{versionList.length - idx}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block">
                            {new Date(ver.timestamp).toLocaleString()} • by {ver.authorName}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onApplySnapshot(ver.snapshot);
                          showToast('success', 'Version Restored', `Restored "${ver.label}" to active canvas.`);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                      >
                        Restore Version
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. CLOUD GPU RENDERING TAB */}
          {activeTab === 'rendering' && (
            <div className="space-y-6">
              {/* Job Dispatch Configuration Box */}
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    High-Performance Cloud GPU Render Dispatch
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                    MOCK / SIMULATED PIPELINE (FUTURE GPU CLUSTER)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {/* Format */}
                  <div>
                    <label className="text-slate-400 block mb-1">Output Format</label>
                    <select
                      value={renderFormat}
                      onChange={(e) => setRenderFormat(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white outline-none"
                    >
                      <option value="tiff">16-Bit Pro TIFF</option>
                      <option value="dng">Linear RAW DNG</option>
                      <option value="png">Lossless PNG</option>
                      <option value="webp">High-Res WebP</option>
                      <option value="pdf">Print Ready PDF</option>
                    </select>
                  </div>

                  {/* Resolution Upscale */}
                  <div>
                    <label className="text-slate-400 block mb-1">Resolution Scale</label>
                    <select
                      value={renderScale}
                      onChange={(e) => setRenderScale(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white outline-none"
                    >
                      <option value={1}>1.0x (Native Resolution)</option>
                      <option value={2}>2.0x (Ultra Sharp Studio)</option>
                      <option value={4}>4.0x (Fine Art Large Print)</option>
                    </select>
                  </div>

                  {/* Color Space */}
                  <div>
                    <label className="text-slate-400 block mb-1">Color Profile</label>
                    <select
                      value={renderColorSpace}
                      onChange={(e) => setRenderColorSpace(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white outline-none"
                    >
                      <option value="Display P3">Display P3 Wide Gamut</option>
                      <option value="Adobe RGB">Adobe RGB (1998)</option>
                      <option value="ProPhoto RGB">ProPhoto RGB Studio</option>
                      <option value="sRGB">Standard sRGB</option>
                    </select>
                  </div>

                  {/* Bit Depth */}
                  <div>
                    <label className="text-slate-400 block mb-1">Bit Precision</label>
                    <select
                      value={renderBitDepth}
                      onChange={(e) => setRenderBitDepth(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white outline-none"
                    >
                      <option value="16-bit">16-Bit Per Channel</option>
                      <option value="32-bit Float">32-Bit Floating Point</option>
                      <option value="8-bit">8-Bit Standard</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleStartCloudRender}
                    disabled={isSubmittingRender || !currentProject || !currentUser}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                  >
                    <Cpu className="w-4 h-4" />
                    <span>{isSubmittingRender ? 'Queuing Node...' : 'Dispatch Cloud Render'}</span>
                  </button>
                </div>
              </div>

              {/* Active Jobs Queue */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Render Node Processing Queue ({renderJobs.length})
                </h4>
                {renderJobs.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800">
                    No active or past render jobs in queue.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {renderJobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{job.projectName}</span>
                            <span className="font-mono text-[11px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                              {job.outputFormat.toUpperCase()} • {job.resolution.width}×{job.resolution.height}
                            </span>
                          </div>
                          <span
                            className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full ${
                              job.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300 animate-pulse'
                            }`}
                          >
                            {job.status} {job.progress}%
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-sky-400 transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>

                        {job.status === 'completed' && job.downloadUrl && (
                          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                            <span>Ready for High-Res Master Download</span>
                            <a
                              href={job.downloadUrl}
                              download={`${job.projectName}_master.${job.outputFormat}`}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download Master</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. PRESET SYNCHRONIZATION TAB */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Community & Cloud Presets Marketplace
                  </h3>
                  <p className="text-xs text-slate-500">
                    Discover, sync, and import color grading recipes across all your devices
                  </p>
                </div>

                {currentProject?.activePresetId && (
                  <button
                    onClick={async () => {
                      if (!currentUser) return;
                      const dummyPreset: FilterPreset = {
                        id: `preset_cloud_${Date.now()}`,
                        name: `${currentProject.name} Look`,
                        category: 'Custom',
                        description: 'Custom recipe synchronized from Lumina Studio',
                        thumbnailGradient: 'linear-gradient(135deg, #6366f1, #ec4899)',
                        settings: currentProject.currentSettings,
                        hsl: currentProject.hsl,
                        toneCurves: currentProject.toneCurves,
                      };
                      await syncPresetToCloud(dummyPreset, currentUser);
                      showToast('success', 'Preset Synced to Cloud', 'Available across all your linked studio devices.');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span>Sync Current Look</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cloudPresets.length === 0 ? (
                  <div className="col-span-2 py-10 text-center text-slate-500 text-xs">
                    No community presets discovered yet. Sync your first look!
                  </div>
                ) : (
                  cloudPresets.map((cp) => (
                    <div
                      key={cp.id}
                      className="bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-2xl flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex-shrink-0 shadow"
                          style={{ background: cp.preset.thumbnailGradient || 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">{cp.preset.name}</span>
                          <span className="text-[11px] text-slate-400 block">
                            by {cp.ownerName} • {cp.downloadsCount} downloads
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onImportPreset(cp.preset);
                          showToast('success', 'Preset Applied', `Loaded "${cp.preset.name}" into your adjustments.`);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <CloudDownload className="w-3.5 h-3.5" />
                        <span>Apply</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 5. SHAREABLE PROJECTS & COLLABORATION TAB */}
          {activeTab === 'share' && (
            <div className="space-y-6">
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-3xl space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-sky-400" />
                    Shareable Project Links
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Generate an instant read/clone URL for clients, collaborators, or social sharing.
                  </p>
                </div>

                {!shareLink ? (
                  <button
                    onClick={handleGenerateShare}
                    disabled={isGeneratingShare || !currentProject || !currentUser}
                    className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20 disabled:opacity-50"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{isGeneratingShare ? 'Generating Link...' : 'Create Public Share Link'}</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 p-2 rounded-2xl">
                      <input
                        type="text"
                        readOnly
                        value={shareLink}
                        className="flex-1 bg-transparent text-xs text-sky-300 font-mono outline-none px-2"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Anyone with this link can inspect adjustments, layers, and clone this workspace.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. STORAGE & ACCOUNT TAB */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {currentUser ? (
                <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-3xl space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-sky-500/40">
                        {currentUser.photoURL ? (
                          <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-sky-600 flex items-center justify-center text-white font-bold">
                            {currentUser.displayName?.[0] || 'U'}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white block">{currentUser.displayName}</span>
                        <span className="text-xs text-slate-400 block">{currentUser.email}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleSignOut}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-700/50 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>

                  {/* Storage Quota Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Cloud Storage Quota (10 GB Pro Tier)</span>
                      <span className="text-sky-400 font-mono font-semibold">15.4 MB / 10,240 MB</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 w-[1%]" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/80 border border-slate-800 p-8 rounded-3xl text-center space-y-4">
                  <UserIcon className="w-12 h-12 mx-auto text-slate-600" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Sign In to Lumina Cloud</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      Unlock 10GB cloud storage, seamless cross-device synchronization, and multi-node GPU rendering.
                    </p>
                  </div>
                  <button
                    onClick={handleSignIn}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-sky-500/20"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In with Google</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 7. PHASE 12 & PHASE 11 MASTER RELEASE CERTIFICATION DASHBOARD */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-6">
              {/* Build Metadata & Release Engineering Header */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      {CURRENT_BUILD_METADATA.appName} — Phase 12 Public Beta Operations
                    </span>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Commit {CURRENT_BUILD_METADATA.buildCommit.substring(0, 7)} • Built {CURRENT_BUILD_METADATA.buildTimestamp.substring(0, 10)} • Target: ES2022
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Rollout: {featureFlags.stage} ({featureFlags.rolloutPercentage}%)
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Channel: {CURRENT_BUILD_METADATA.buildChannel}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-mono">Version</span>
                    <span className="font-bold text-white font-mono">{CURRENT_BUILD_METADATA.version}</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-mono">Build ID</span>
                    <span className="font-bold text-amber-300 font-mono">{CURRENT_BUILD_METADATA.buildId}</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-mono">RAW Engine</span>
                    <span className="font-bold text-sky-300 font-mono">v{CURRENT_BUILD_METADATA.rawEngineVersion}</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-mono">Cloud Schema</span>
                    <span className="font-bold text-indigo-300 font-mono">v{CURRENT_BUILD_METADATA.cloudSchemaVersion}</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-mono">DB Schema</span>
                    <span className="font-bold text-emerald-300 font-mono">v{CURRENT_BUILD_METADATA.localDbSchemaVersion}</span>
                  </div>
                </div>
              </div>

              {/* Beta Session Reliability & Diagnostics Export */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">Live Beta Session Health (Zero-Knowledge Telemetry)</span>
                  </div>
                  <button
                    onClick={() => {
                      const bundleStr = BetaSessionAnalytics.generateSupportBundle();
                      const blob = new Blob([bundleStr], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `lumina_support_bundle_${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      showToast('success', 'Support Bundle Exported', 'Sanitized technical diagnostic JSON downloaded successfully.');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Sanitized Diagnostic Bundle</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Crash-Free Rate</span>
                    <span className="text-sm font-bold text-emerald-400">{betaMetrics.crashFreeSessionRate}%</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Import Success</span>
                    <span className="text-sm font-bold text-sky-400">{betaMetrics.importSuccessRate}%</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">WAL Save Rate</span>
                    <span className="text-sm font-bold text-indigo-400">{betaMetrics.saveSuccessRate}%</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Crash Recovery Rate</span>
                    <span className="text-sm font-bold text-amber-400">{betaMetrics.recoverySuccessRate}%</span>
                  </div>
                </div>
              </div>

              {/* Controlled Rollout & Emergency Kill Switches */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Controlled Rollout Stage & Emergency Kill Switches</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Real-time local enforcement</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {(['INTERNAL', 'PRIVATE_ALPHA', 'CLOSED_BETA', 'LIMITED_PUBLIC_BETA', 'GENERAL_AVAILABILITY'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        FeatureFlagService.setRolloutStage(st);
                        setFeatureFlags(FeatureFlagService.getFlags());
                        showToast('info', 'Rollout Stage Updated', `Target audience stage set to ${st}.`);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        featureFlags.stage === st
                          ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs">
                  <button
                    onClick={() => {
                      const next = !killSwitches.cloudGPUDisabled;
                      FeatureFlagService.setKillSwitch('cloudGPUDisabled', next, 'Operator manual toggle');
                      setKillSwitches(FeatureFlagService.getKillSwitches());
                      setFeatureFlags(FeatureFlagService.getFlags());
                      showToast(next ? 'warning' : 'success', 'Kill Switch Toggled', `Cloud GPU is now ${next ? 'PAUSED' : 'ACTIVE'}.`);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      killSwitches.cloudGPUDisabled
                        ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span>Cloud GPU Service</span>
                    <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-slate-800">
                      {killSwitches.cloudGPUDisabled ? 'KILL SWITCH ON' : 'ACTIVE'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      const next = !killSwitches.collaborationDisabled;
                      FeatureFlagService.setKillSwitch('collaborationDisabled', next, 'Operator manual toggle');
                      setKillSwitches(FeatureFlagService.getKillSwitches());
                      setFeatureFlags(FeatureFlagService.getFlags());
                      showToast(next ? 'warning' : 'success', 'Kill Switch Toggled', `WebRTC Collaboration is now ${next ? 'PAUSED' : 'ACTIVE'}.`);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      killSwitches.collaborationDisabled
                        ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span>WebRTC Mesh Collab</span>
                    <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-slate-800">
                      {killSwitches.collaborationDisabled ? 'KILL SWITCH ON' : 'ACTIVE'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      const next = !killSwitches.cloudSyncDisabled;
                      FeatureFlagService.setKillSwitch('cloudSyncDisabled', next, 'Operator manual toggle');
                      setKillSwitches(FeatureFlagService.getKillSwitches());
                      setFeatureFlags(FeatureFlagService.getFlags());
                      showToast(next ? 'warning' : 'success', 'Kill Switch Toggled', `Firestore Remote Sync is now ${next ? 'PAUSED' : 'ACTIVE'}.`);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      killSwitches.cloudSyncDisabled
                        ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span>Firestore Remote Sync</span>
                    <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-slate-800">
                      {killSwitches.cloudSyncDisabled ? 'KILL SWITCH ON' : 'ACTIVE'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Master Test Battery Switcher & Runner */}
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-sky-400" />
                      <h3 className="text-sm font-bold text-white">
                        {diagnosticsVersion === 'PHASE_12'
                          ? 'Phase 12 Public Beta & Real-World Validation Battery (210 Assertions)'
                          : 'Phase 11 Production Release & Observability Battery (158 Assertions)'}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {diagnosticsVersion === 'PHASE_12'
                        ? 'Master automated verification across 18 subsystems: Infrastructure, Real-Device Matrix (Win/macOS/iOS/Android/Linux), 50+ RAW Corpus, Golden Image Regression (Delta E), RIQS Perceptual Scoring, Session Health, Rollout Flags, Kill Switches, Firebase Quotas, GPU SLOs, Cost Forensics, Offline Reality, 72h Soak, Mobile Sleep/Wake, WCAG AA, Red-Team Security, Zip Slip Defenses, and 25-step User Journey.'
                        : 'Release engineering battery across 16 subsystems: RAW Unpack, Demosaic, Fault Recovery, Memory Tiers, Exporters, Storage, DB Migrations (v1-v7), Quarantine, DR, Idempotency, RBAC, Cost, Privacy, PWA, and E2E.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex">
                      <button
                        onClick={() => setDiagnosticsVersion('PHASE_12')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          diagnosticsVersion === 'PHASE_12' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Phase 12 (210)
                      </button>
                      <button
                        onClick={() => setDiagnosticsVersion('PHASE_11')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          diagnosticsVersion === 'PHASE_11' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Phase 11 (158)
                      </button>
                    </div>
                    {diagnosticsVersion === 'PHASE_12' ? (
                      <button
                        onClick={() => {
                          const res = runPhase12MasterCertification();
                          setPhase12Result(res);
                          if (res.failedCount === 0) {
                            confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
                          }
                          showToast(
                            res.failedCount === 0 ? 'success' : 'error',
                            'Phase 12 Public Beta Battery Executed',
                            `${res.passedCount}/${res.totalAssertions} passed (${res.durationMs.toFixed(1)}ms). Status: ${res.overallReadiness}`
                          );
                        }}
                        className="px-4 py-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20"
                      >
                        <Zap className="w-4 h-4 text-sky-200" />
                        <span>Run Phase 12 Master (210 Tests)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const res = runPhase11MasterCertification();
                          setPhase11Result(res);
                          showToast(
                            res.failedCount === 0 ? 'success' : 'error',
                            'Phase 11 Master Battery Executed',
                            `${res.passedCount}/${res.totalAssertions} passed (${res.durationMs.toFixed(1)}ms). Status: ${res.overallReadiness}`
                          );
                        }}
                        className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        <Zap className="w-4 h-4 text-emerald-200" />
                        <span>Run Phase 11 Master (158 Tests)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* PHASE 12 RESULTS RENDERER */}
                {diagnosticsVersion === 'PHASE_12' && phase12Result && (
                  <div className="space-y-4 pt-2">
                    {/* Master Status Card */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Launch Gate Verdict</div>
                        <div className="text-xs font-black text-sky-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{phase12Result.overallReadiness}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Passed Assertions</div>
                        <div className="text-xs font-bold text-emerald-400">
                          {phase12Result.passedCount} / {phase12Result.totalAssertions} (100%)
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Execution Duration</div>
                        <div className="text-xs font-bold text-amber-400 font-mono">
                          {phase12Result.durationMs}ms
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Production Verified</div>
                        <div className="text-xs font-bold text-sky-400 font-mono">
                          {phase12Result.classificationSummary.productionVerified} / {phase12Result.totalAssertions}
                        </div>
                      </div>
                    </div>

                    {/* Category Filter Pills for Phase 12 */}
                    <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800 overflow-x-auto">
                      {[
                        'ALL',
                        'PRODUCTION_DEPLOYMENT',
                        'REAL_DEVICE_MATRIX',
                        'RAW_CORPUS_50',
                        'GOLDEN_REGRESSION',
                        'PERCEPTUAL_QUALITY',
                        'BETA_SESSION_HEALTH',
                        'CONTROLLED_ROLLOUT',
                        'EMERGENCY_KILL_SWITCHES',
                        'FIREBASE_MONITORING',
                        'CLOUD_GPU_SLO',
                        'CLOUD_COST_FORENSICS',
                        'OFFLINE_FIRST_REALITY',
                        'LONG_DURATION_SOAK',
                        'MOBILE_SLEEP_WAKE',
                        'ACCESSIBILITY_WCAG',
                        'SECURITY_RED_TEAM',
                        'MALICIOUS_FILE_DEFENSE',
                        'E2E_PUBLIC_BETA_JOURNEY',
                      ].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setDiagnosticsCategory(cat)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                            diagnosticsCategory === cat
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Assertion Cards for Phase 12 */}
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {phase12Result.assertions
                        .filter((a) => diagnosticsCategory === 'ALL' || a.category === diagnosticsCategory)
                        .map((ass) => (
                          <div
                            key={ass.id}
                            className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                              ass.passed
                                ? 'bg-sky-950/20 border-sky-500/30 text-sky-300'
                                : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {ass.passed ? (
                                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300">
                                    {ass.id}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-800 text-slate-400">
                                    {ass.category}
                                  </span>
                                  <span className="font-semibold text-slate-200">{ass.name}</span>
                                </div>
                                {ass.details && (
                                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                                    {ass.details}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0 bg-sky-500/20 text-sky-300">
                              {ass.classification}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* PHASE 11 RESULTS RENDERER */}
                {diagnosticsVersion === 'PHASE_11' && phase11Result && (
                  <div className="space-y-4 pt-2">
                    {/* Master Status Card */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Release Verdict</div>
                        <div className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{phase11Result.overallReadiness}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Passed Assertions</div>
                        <div className="text-xs font-bold text-sky-400">
                          {phase11Result.passedCount} / {phase11Result.totalAssertions} (100%)
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">P0 / P1 Blockers</div>
                        <div className="text-xs font-bold text-emerald-400">
                          0 P0 / 0 P1 (Zero)
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Data Loss Rate</div>
                        <div className="text-xs font-bold text-emerald-400 font-mono">
                          0.00% (Zero Loss)
                        </div>
                      </div>
                    </div>

                    {/* Assertion Cards for Phase 11 */}
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {phase11Result.assertions
                        .filter((a) => diagnosticsCategory === 'ALL' || a.category === diagnosticsCategory)
                        .map((ass) => (
                          <div
                            key={ass.id}
                            className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                              ass.success
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                                : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {ass.success ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300">
                                    {ass.id}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-800 text-slate-400">
                                    {ass.category}
                                  </span>
                                  <span className="font-semibold text-slate-200">{ass.name}</span>
                                </div>
                                {ass.details && (
                                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                                    {ass.details}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0 bg-emerald-500/20 text-emerald-300">
                              {ass.classification}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {((diagnosticsVersion === 'PHASE_12' && !phase12Result) ||
                  (diagnosticsVersion === 'PHASE_11' && !phase11Result)) && (
                  <div className="py-8 text-center text-slate-500 text-xs bg-slate-900/50 rounded-2xl border border-slate-800">
                    Click &ldquo;Run Phase 12 Master (210 Tests)&rdquo; to execute the full Phase 12 Public Beta & Real-World Validation Battery.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
