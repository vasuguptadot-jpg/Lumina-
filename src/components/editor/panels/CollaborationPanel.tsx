import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  Split,
  Eye,
  KeyRound,
  Copy,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Project, EditHistorySnapshot } from '../../../types/editor';
import { User } from 'firebase/auth';
import {
  Collaborator,
  ApprovalStatus,
  ApprovalRecord,
  CanvasComment,
} from '../../../types/collaboration';
import {
  inviteCollaborator,
  updateProjectApprovalStatus,
  subscribeToCollaborators,
  subscribeToApprovalAuditLog,
  subscribeToProjectComments,
} from '../../../services/collaborationService';

interface CollaborationPanelProps {
  project: Project;
  currentUser: User | null;
  onOpenCollaborationModal: () => void;
  onOpenVersionComparison: () => void;
  onOpenClientReview: () => void;
  isCommentModeActive: boolean;
  onToggleCommentMode: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  project,
  currentUser,
  onOpenCollaborationModal,
  onOpenVersionComparison,
  onOpenClientReview,
  isCommentModeActive,
  onToggleCommentMode,
  showToast,
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [comments, setComments] = useState<CanvasComment[]>([]);
  const [approvalLog, setApprovalLog] = useState<ApprovalRecord[]>([]);
  const [quickEmail, setQuickEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (!project.id) return;
    const unsubCollab = subscribeToCollaborators(project.id, setCollaborators);
    const unsubComments = subscribeToProjectComments(project.id, setComments);
    const unsubApprovals = subscribeToApprovalAuditLog(project.id, setApprovalLog);

    return () => {
      unsubCollab();
      unsubComments();
      unsubApprovals();
    };
  }, [project.id]);

  const handleQuickInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEmail.trim() || !currentUser) {
      showToast('error', 'Authentication Required', 'Sign in to invite collaborators.');
      return;
    }
    setIsInviting(true);
    try {
      await inviteCollaborator(project.id, quickEmail.trim().toLowerCase(), 'editor');
      setQuickEmail('');
      showToast('success', 'Invitation Sent', `Invited ${quickEmail} to project`);
    } catch (err: any) {
      showToast('error', 'Invite Failed', err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyLink = () => {
    const shareCode = project.id.slice(0, 8);
    const url = `${window.location.origin}?share=${shareCode}`;
    navigator.clipboard.writeText(url);
    showToast('info', 'Link Copied', 'Collaborative project URL copied to clipboard');
  };

  const approvalStatus: ApprovalStatus = (project as any).approvalStatus || 'draft';
  const unresolvedComments = comments.filter((c) => !c.resolved).length;

  return (
    <div className="p-4 space-y-5 text-xs text-slate-200">
      {/* Overview Banner */}
      <div className="bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border border-indigo-500/30 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Collaboration Studio
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[10px] uppercase border border-indigo-500/30">
            {approvalStatus.replace('_', ' ')}
          </span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Real-time collaborative editing, pinned canvas annotations, client approval workflow, and split-screen comparison.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onOpenClientReview}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Client Review Room</span>
          </button>

          <button
            onClick={onOpenVersionComparison}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs transition-colors"
          >
            <Split className="w-3.5 h-3.5 text-indigo-400" />
            <span>Version Diff</span>
          </button>
        </div>
      </div>

      {/* Pinned Canvas Comments Toggle */}
      <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Canvas Annotations</span>
            {comments.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px]">
                {unresolvedComments} open
              </span>
            )}
          </span>
          <button
            onClick={onToggleCommentMode}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              isCommentModeActive
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isCommentModeActive ? 'Drop Pin Active' : 'Toggle Tool'}
          </button>
        </div>

        {comments.length === 0 ? (
          <p className="text-slate-500 text-[11px]">
            No pins or feedback dropped yet. Click 'Toggle Tool' and tap anywhere on the photo to drop comments.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {comments.slice(0, 4).map((c, i) => (
              <div
                key={c.id}
                className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-2"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-slate-950 shrink-0 mt-0.5"
                    style={{ backgroundColor: c.annotationColor || '#f59e0b' }}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-300 block text-[11px] truncate">
                      {c.authorName}
                    </span>
                    <p className="text-slate-400 text-[11px] truncate">{c.content}</p>
                  </div>
                </div>
                {c.resolved && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Invite Form */}
      <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl space-y-3">
        <span className="font-bold text-white flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-indigo-400" />
          <span>Invite Collaborator</span>
        </span>
        <form onSubmit={handleQuickInvite} className="flex items-center gap-2">
          <input
            type="email"
            placeholder="colleague@studio.com"
            value={quickEmail}
            onChange={(e) => setQuickEmail(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isInviting || !quickEmail.trim()}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-50"
          >
            {isInviting ? '...' : 'Invite'}
          </button>
        </form>

        {/* Collaborators list */}
        {collaborators.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {collaborators.map((c) => (
              <span
                key={c.id}
                className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {c.displayName || c.email}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Quick Share Link */}
      <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-400" />
          <div>
            <span className="font-bold text-white block text-xs">Share Link & Permissions</span>
            <span className="text-[10px] text-slate-400">Password protected / public links</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyLink}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            title="Copy share link"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenCollaborationModal}
            className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px]"
          >
            Manage
          </button>
        </div>
      </div>
    </div>
  );
};
