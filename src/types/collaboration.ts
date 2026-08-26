import { EditHistorySnapshot, AdjustmentSettings, ToneCurves, HSLSettings } from './editor';

export type CollaboratorRole = 'owner' | 'editor' | 'reviewer' | 'client';
export type CollaboratorStatus = 'active' | 'invited' | 'declined';

export interface Collaborator {
  id: string;
  projectId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: CollaboratorRole;
  status: CollaboratorStatus;
  canEdit: boolean;
  canComment: boolean;
  canApprove: boolean;
  canExport: boolean;
  invitedAt: number;
  lastActive?: number;
}

export type AnnotationType = 'pin' | 'box' | 'arrow' | 'draw';

export interface AnnotationPoint {
  x: number;
  y: number;
}

export interface CommentReply {
  id: string;
  commentId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: number;
}

export interface CanvasComment {
  id: string;
  projectId: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  authorAvatar?: string;
  content: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width?: number; // percentage 0 - 100 for box callout
  height?: number; // percentage 0 - 100 for box callout
  annotationType: AnnotationType;
  annotationColor: string;
  annotationPoints?: AnnotationPoint[];
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
  replies: CommentReply[];
  createdAt: number;
  updatedAt?: number;
}

export type ApprovalStatus = 'draft' | 'in_review' | 'changes_requested' | 'approved';

export interface ApprovalRecord {
  id: string;
  projectId: string;
  status: ApprovalStatus;
  actorId: string;
  actorName: string;
  actorEmail?: string;
  actorRole: CollaboratorRole | string;
  feedback: string;
  signatureName?: string;
  timestamp: number;
  versionNumber: number;
}

export type ComparisonMode = 'split-slider' | 'side-by-side' | 'difference' | 'onion-skin';

export interface VersionComparisonState {
  baseSnapshot: EditHistorySnapshot;
  compareSnapshot: EditHistorySnapshot;
  mode: ComparisonMode;
  splitPosition: number; // 0 - 100 percentage
  opacity: number; // for onion skin 0 - 1
  zoom: number;
}

export type LinkAccessType = 'public' | 'password' | 'restricted';

export interface ShareLinkSettings {
  shareCode: string;
  accessType: LinkAccessType;
  password?: string;
  hasPassword?: boolean;
  expiresAt?: number | null;
  allowEdit: boolean;
  allowComments: boolean;
  allowDownload: boolean;
  requireWatermark: boolean;
}
