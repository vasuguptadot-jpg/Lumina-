import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  Link,
  Lock,
  Globe,
  Copy,
  Eye,
  Trash2,
  Send,
  X,
  Split,
  FileCheck,
  KeyRound,
  Download,
  Calendar,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Project, EditHistorySnapshot } from '../../types/editor';
import {
  Collaborator,
  CollaboratorRole,
  ApprovalStatus,
  ApprovalRecord,
  ShareLinkSettings,
  LinkAccessType,
} from '../../types/collaboration';
import {
  inviteCollaborator,
  updateCollaboratorRole,
  removeCollaborator,
  subscribeToCollaborators,
  updateProjectApprovalStatus,
  subscribeToApprovalAuditLog,
  configureShareLink,
} from '../../services/collaborationService';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  currentUser: User | null;
  onOpenVersionComparison: () => void;
  onOpenClientReview: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const CollaborationModal: React.FC<CollaborationModalProps> = ({
  isOpen,
  onClose,
  project,
  currentUser,
  onOpenVersionComparison,
  onOpenClientReview,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'collaborators' | 'approvals' | 'links' | 'comparison'>(
    'collaborators'
  );

  // Collaborators Tab State
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>('editor');
  const [isInviting, setIsInviting] = useState(false);

  // Approvals Tab State
  const [approvalLog, setApprovalLog] = useState<ApprovalRecord[]>([]);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isUpdatingApproval, setIsUpdatingApproval] = useState(false);

  // Public/Private Links Tab State
  const [accessType, setAccessType] = useState<LinkAccessType>('public');
  const [linkPassword, setLinkPassword] = useState('');
  const [allowEdit, setAllowEdit] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [allowDownload, setAllowDownload] = useState(true);
  const [requireWatermark, setRequireWatermark] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Subscribe to real-time collaborators & approvals
  useEffect(() => {
    if (!isOpen || !project.id) return;

    const unsubCollab = subscribeToCollaborators(project.id, (list) => {
      setCollaborators(list);
    });

    const unsubAppr = subscribeToApprovalAuditLog(project.id, (logs) => {
      setApprovalLog(logs);
    });

    return () => {
      unsubCollab();
      unsubAppr();
    };
  }, [isOpen, project.id]);

  // Default link generation
  useEffect(() => {
    if (project.id) {
      const shareCode = project.id.slice(0, 8);
      const url = `${window.location.origin}?share=${shareCode}`;
      setGeneratedLink(url);
    }
  }, [project.id]);

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentUser) {
      showToast('error', 'Email Required', 'Please enter a valid collaborator email.');
      return;
    }
    setIsInviting(true);
    try {
      await inviteCollaborator(project.id, inviteEmail.trim().toLowerCase(), inviteRole);
      setInviteEmail('');
      showToast('success', 'Invitation Dispatched', `Invited ${inviteEmail} as ${inviteRole.toUpperCase()}`);
    } catch (err: any) {
      showToast('error', 'Invite Failed', err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (collab: Collaborator, newRole: CollaboratorRole) => {
    try {
      await updateCollaboratorRole(project.id, collab.id, newRole);
      showToast('info', 'Role Updated', `Changed ${collab.email} to ${newRole.toUpperCase()}`);
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    }
  };

  const handleRemoveCollab = async (collab: Collaborator) => {
    try {
      await removeCollaborator(project.id, collab.id, collab.email);
      showToast('info', 'Access Revoked', `Removed ${collab.email} from project.`);
    } catch (err: any) {
      showToast('error', 'Removal Failed', err.message);
    }
  };

  const handleChangeApprovalStatus = async (newStatus: ApprovalStatus) => {
    if (!currentUser) {
      showToast('error', 'Sign In Required', 'Sign in to record approval workflow actions.');
      return;
    }
    setIsUpdatingApproval(true);
    try {
      await updateProjectApprovalStatus(
        project.id,
        currentUser,
        newStatus,
        approvalNotes.trim() || `Workflow status shifted to ${newStatus.replace('_', ' ').toUpperCase()}`,
        currentUser.displayName || 'Creator',
        project.history.length
      );
      setApprovalNotes('');
      showToast('success', 'Status Updated', `Project is now in "${newStatus.replace('_', ' ').toUpperCase()}"`);
    } catch (err: any) {
      showToast('error', 'Status Update Error', err.message);
    } finally {
      setIsUpdatingApproval(false);
    }
  };

  const handleSaveShareSettings = async () => {
    const shareCode = project.id.slice(0, 8);
    const settings: ShareLinkSettings = {
      shareCode,
      accessType,
      password: accessType === 'password' ? linkPassword : undefined,
      hasPassword: accessType === 'password' && linkPassword.length > 0,
      allowEdit,
      allowComments,
      allowDownload,
      requireWatermark,
    };

    try {
      const url = await configureShareLink(project.id, settings);
      setGeneratedLink(url);
      showToast('success', 'Share Permissions Configured', 'Access controls and protection applied.');
    } catch (err: any) {
      showToast('error', 'Config Error', err.message);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopySuccess(true);
    showToast('info', 'Link Copied', 'Collaborative project URL copied to clipboard.');
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const currentApprovalStatus: ApprovalStatus = (project as any).approvalStatus || 'draft';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none text-slate-200 animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Collaboration & Client Review
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-bold font-mono uppercase">
                  {currentApprovalStatus.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Collaborators, approval audit trail, client presentation room, & password protected links
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

        {/* Tab Ribbon */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 bg-slate-950/30 overflow-x-auto scrollbar-none">
          {[
            { id: 'collaborators', label: 'Collaborators & Team', icon: Users, count: collaborators.length },
            { id: 'approvals', label: 'Approval Workflow', icon: FileCheck, count: approvalLog.length },
            { id: 'links', label: 'Public / Private Links', icon: KeyRound },
            { id: 'comparison', label: 'Version Comparison', icon: Split },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl font-medium text-xs border-t border-x transition-all ${
                  isActive
                    ? 'bg-slate-900 border-slate-700/80 text-white font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. COLLABORATORS TAB */}
          {activeTab === 'collaborators' && (
            <div className="space-y-6">
              {/* Invite Form Card */}
              <form onSubmit={handleInvite} className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="email"
                  placeholder="collaborator@studio.com or client@brand.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 w-full sm:w-auto"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as CollaboratorRole)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none w-full sm:w-auto font-medium"
                >
                  <option value="editor">Editor (Can edit & adjust)</option>
                  <option value="reviewer">Reviewer (Comment & sign-off)</option>
                  <option value="client">Client (Review room & approve)</option>
                </select>
                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50 w-full sm:w-auto justify-center"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isInviting ? 'Inviting...' : 'Invite Member'}</span>
                </button>
              </form>

              {/* Collaborators List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Team & Reviewers ({collaborators.length + 1})
                </h3>

                {/* Owner entry */}
                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow">
                      {currentUser?.displayName?.[0] || 'O'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {currentUser?.displayName || 'Project Owner'}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                          OWNER
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block">{currentUser?.email || 'Active Workstation'}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Full Access
                  </span>
                </div>

                {/* Invited Collaborators */}
                {collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 p-3.5 rounded-2xl flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                        {collab.displayName?.[0] || collab.email[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{collab.displayName}</span>
                        <span className="text-[11px] text-slate-400 block">{collab.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={collab.role}
                        onChange={(e) => handleUpdateRole(collab, e.target.value as CollaboratorRole)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none"
                      >
                        <option value="editor">Editor</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="client">Client</option>
                      </select>

                      <button
                        onClick={() => handleRemoveCollab(collab)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                        title="Revoke access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. APPROVAL WORKFLOW TAB */}
          {activeTab === 'approvals' && (
            <div className="space-y-6">
              {/* Approval Status Card */}
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-bold block">Current Project Lifecycle</span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      Status: <span className="text-indigo-400 uppercase">{currentApprovalStatus.replace('_', ' ')}</span>
                    </h3>
                  </div>

                  {/* Client Presentation Trigger */}
                  <button
                    onClick={() => {
                      onOpenClientReview();
                      onClose();
                    }}
                    className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Launch Client Review Room</span>
                  </button>
                </div>

                {/* State shift buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {[
                    { id: 'draft', label: 'Draft', color: 'bg-slate-800 hover:bg-slate-700 text-slate-300' },
                    { id: 'in_review', label: 'Submit for Review', color: 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30' },
                    { id: 'changes_requested', label: 'Request Changes', color: 'bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30' },
                    { id: 'approved', label: 'Sign Off / Approved', color: 'bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => handleChangeApprovalStatus(btn.id as ApprovalStatus)}
                      disabled={isUpdatingApproval}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-center ${btn.color}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Optional Status change notes */}
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Add audit note or revision summary (optional)..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Approval Audit Trail History */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Approval Audit Trail & Digital Signatures ({approvalLog.length})
                </h3>

                {approvalLog.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800">
                    No approval workflow events recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {approvalLog.map((log) => (
                      <div
                        key={log.id}
                        className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full ${
                                log.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : log.status === 'changes_requested'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-indigo-500/20 text-indigo-300'
                              }`}
                            >
                              {log.status.replace('_', ' ')}
                            </span>
                            <span className="text-white font-semibold">
                              by {log.signatureName || log.actorName}
                            </span>
                          </div>
                          <p className="text-slate-400 mt-1">{log.feedback}</p>
                        </div>

                        <span className="text-slate-500 text-[11px] font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. PUBLIC / PRIVATE LINKS TAB */}
          {activeTab === 'links' && (
            <div className="space-y-6">
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-3xl space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-indigo-400" />
                    Project Share & Access Permissions
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Control who can view, comment, edit, or download high-resolution master deliverables.
                  </p>
                </div>

                {/* Access Level Selector */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'public', label: 'Public Link', desc: 'Anyone with the link can view & fork', icon: Globe },
                    { id: 'password', label: 'Password Protected', desc: 'Requires passcode to inspect', icon: Lock },
                    { id: 'restricted', label: 'Restricted (Invite Only)', desc: 'Only invited collaborators', icon: Shield },
                  ].map((lvl) => {
                    const Icon = lvl.icon;
                    const isSelected = accessType === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setAccessType(lvl.id as LinkAccessType)}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                          <span className="text-xs font-bold">{lvl.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{lvl.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Password field if password-protected */}
                {accessType === 'password' && (
                  <div className="space-y-1">
                    <label className="text-slate-400 text-xs">Set Passcode</label>
                    <input
                      type="password"
                      placeholder="Enter client password..."
                      value={linkPassword}
                      onChange={(e) => setLinkPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Permissions Toggles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <label className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-slate-300">Allow Comments</span>
                    <input
                      type="checkbox"
                      checked={allowComments}
                      onChange={(e) => setAllowComments(e.target.checked)}
                      className="accent-indigo-500"
                    />
                  </label>

                  <label className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-slate-300">Allow Live Edit</span>
                    <input
                      type="checkbox"
                      checked={allowEdit}
                      onChange={(e) => setAllowEdit(e.target.checked)}
                      className="accent-indigo-500"
                    />
                  </label>

                  <label className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-slate-300">Allow Master Export</span>
                    <input
                      type="checkbox"
                      checked={allowDownload}
                      onChange={(e) => setAllowDownload(e.target.checked)}
                      className="accent-indigo-500"
                    />
                  </label>

                  <label className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-slate-300">Client Watermark</span>
                    <input
                      type="checkbox"
                      checked={requireWatermark}
                      onChange={(e) => setRequireWatermark(e.target.checked)}
                      className="accent-indigo-500"
                    />
                  </label>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveShareSettings}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md"
                  >
                    Save & Update Link
                  </button>
                </div>
              </div>

              {/* Link Display Box */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 bg-slate-900 text-xs text-indigo-300 font-mono outline-none px-3 py-2 rounded-xl border border-slate-800"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copySuccess ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. VERSION COMPARISON SHORTCUT TAB */}
          {activeTab === 'comparison' && (
            <div className="bg-slate-950/80 border border-slate-800 p-8 rounded-3xl text-center space-y-4">
              <Split className="w-12 h-12 mx-auto text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Interactive Version Comparison Engine</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Inspect differences across edit milestones using Split Slider, Side-by-Side loupe, and tonal diff parameters.
                </p>
              </div>
              <button
                onClick={() => {
                  onOpenVersionComparison();
                  onClose();
                }}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <Split className="w-4 h-4" />
                <span>Launch Version Comparison Inspector</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
