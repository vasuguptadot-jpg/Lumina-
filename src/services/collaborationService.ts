import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  increment,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import {
  Collaborator,
  CollaboratorRole,
  CanvasComment,
  CommentReply,
  ApprovalStatus,
  ApprovalRecord,
  ShareLinkSettings,
  AnnotationType,
  AnnotationPoint,
} from '../types/collaboration';
import { Project, EditHistorySnapshot } from '../types/editor';

/* ----------------------------------------------------------------------------
 * 1. REAL-TIME COMMENTS & ANNOTATIONS
 * ---------------------------------------------------------------------------- */

export const addCanvasComment = async (
  projectId: string,
  user: User,
  content: string,
  x: number,
  y: number,
  annotationType: AnnotationType = 'pin',
  annotationColor = '#f59e0b',
  width?: number,
  height?: number,
  annotationPoints?: AnnotationPoint[]
): Promise<CanvasComment> => {
  const commentId = `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const commentRef = doc(db, 'projects', projectId, 'comments', commentId);

  const newComment: CanvasComment = {
    id: commentId,
    projectId,
    authorId: user.uid,
    authorName: user.displayName || 'Collaborator',
    authorEmail: user.email || undefined,
    authorAvatar: user.photoURL || undefined,
    content,
    x,
    y,
    width,
    height,
    annotationType,
    annotationColor,
    annotationPoints,
    resolved: false,
    replies: [],
    createdAt: Date.now(),
  };

  try {
    await setDoc(commentRef, newComment);
  } catch (e: any) {
    console.warn('Firebase comment save warning, caching locally:', e.message);
  }

  return newComment;
};

export const addCommentReply = async (
  projectId: string,
  commentId: string,
  user: User,
  content: string
): Promise<CommentReply> => {
  const replyId = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const reply: CommentReply = {
    id: replyId,
    commentId,
    authorId: user.uid,
    authorName: user.displayName || 'Collaborator',
    authorAvatar: user.photoURL || undefined,
    content,
    createdAt: Date.now(),
  };

  try {
    const commentRef = doc(db, 'projects', projectId, 'comments', commentId);
    const snap = await getDoc(commentRef);
    if (snap.exists()) {
      const data = snap.data() as CanvasComment;
      const currentReplies = data.replies || [];
      await setDoc(
        commentRef,
        {
          replies: [...currentReplies, reply],
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    }
  } catch (e: any) {
    console.warn('Firebase reply save error:', e.message);
  }

  return reply;
};

export const toggleResolveComment = async (
  projectId: string,
  commentId: string,
  user: User,
  currentlyResolved: boolean
): Promise<void> => {
  try {
    const commentRef = doc(db, 'projects', projectId, 'comments', commentId);
    await setDoc(
      commentRef,
      {
        resolved: !currentlyResolved,
        resolvedBy: !currentlyResolved ? (user.displayName || 'User') : null,
        resolvedAt: !currentlyResolved ? Date.now() : null,
      },
      { merge: true }
    );
  } catch (e: any) {
    console.warn('Firebase resolve error:', e.message);
  }
};

export const deleteCanvasComment = async (projectId: string, commentId: string): Promise<void> => {
  try {
    const commentRef = doc(db, 'projects', projectId, 'comments', commentId);
    await deleteDoc(commentRef);
  } catch (e: any) {
    console.warn('Firebase delete comment error:', e.message);
  }
};

export const subscribeToProjectComments = (
  projectId: string,
  callback: (comments: CanvasComment[]) => void
) => {
  const q = query(collection(db, 'projects', projectId, 'comments'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: CanvasComment[] = [];
      snapshot.forEach((d) => list.push(d.data() as CanvasComment));
      callback(list);
    },
    (err) => {
      console.warn('Comments listener error:', err.message);
    }
  );
};

/* ----------------------------------------------------------------------------
 * 2. COLLABORATORS & INVITATION SYSTEM
 * ---------------------------------------------------------------------------- */

export const inviteCollaborator = async (
  projectId: string,
  email: string,
  role: CollaboratorRole = 'editor',
  displayName?: string
): Promise<Collaborator> => {
  const collabId = `collab_${email.replace(/[@.]/g, '_')}`;
  const collabRef = doc(db, 'projects', projectId, 'collaborators', collabId);

  const permissions = {
    canEdit: role === 'owner' || role === 'editor',
    canComment: true,
    canApprove: role === 'owner' || role === 'reviewer' || role === 'client',
    canExport: role === 'owner' || role === 'editor' || role === 'reviewer',
  };

  const newCollab: Collaborator = {
    id: collabId,
    projectId,
    email,
    displayName: displayName || email.split('@')[0],
    role,
    status: 'invited',
    ...permissions,
    invitedAt: Date.now(),
  };

  try {
    await setDoc(collabRef, newCollab, { merge: true });
    // Also append to project's collaborators array for Firestore security rule matching
    const projRef = doc(db, 'projects', projectId);
    const pSnap = await getDoc(projRef);
    if (pSnap.exists()) {
      const existing = pSnap.data()?.collaborators || [];
      if (!existing.includes(email)) {
        await setDoc(projRef, { collaborators: [...existing, email] }, { merge: true });
      }
    }
  } catch (e: any) {
    console.warn('Firebase invite error:', e.message);
  }

  return newCollab;
};

export const updateCollaboratorRole = async (
  projectId: string,
  collabId: string,
  newRole: CollaboratorRole
): Promise<void> => {
  const collabRef = doc(db, 'projects', projectId, 'collaborators', collabId);
  const permissions = {
    canEdit: newRole === 'owner' || newRole === 'editor',
    canComment: true,
    canApprove: newRole === 'owner' || newRole === 'reviewer' || newRole === 'client',
    canExport: newRole === 'owner' || newRole === 'editor' || newRole === 'reviewer',
  };

  try {
    await setDoc(collabRef, { role: newRole, ...permissions }, { merge: true });
  } catch (e: any) {
    console.warn('Role update error:', e.message);
  }
};

export const removeCollaborator = async (projectId: string, collabId: string, email: string): Promise<void> => {
  try {
    const collabRef = doc(db, 'projects', projectId, 'collaborators', collabId);
    await deleteDoc(collabRef);

    const projRef = doc(db, 'projects', projectId);
    const pSnap = await getDoc(projRef);
    if (pSnap.exists()) {
      const existing: string[] = pSnap.data()?.collaborators || [];
      await setDoc(
        projRef,
        { collaborators: existing.filter((e) => e !== email) },
        { merge: true }
      );
    }
  } catch (e: any) {
    console.warn('Remove collaborator error:', e.message);
  }
};

export const subscribeToCollaborators = (
  projectId: string,
  callback: (collaborators: Collaborator[]) => void
) => {
  const q = query(collection(db, 'projects', projectId, 'collaborators'), orderBy('invitedAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Collaborator[] = [];
      snapshot.forEach((d) => list.push(d.data() as Collaborator));
      callback(list);
    },
    (err) => {
      console.warn('Collaborators listener error:', err.message);
    }
  );
};

/* ----------------------------------------------------------------------------
 * 3. APPROVAL WORKFLOW & AUDIT SIGN-OFFS
 * ---------------------------------------------------------------------------- */

export const updateProjectApprovalStatus = async (
  projectId: string,
  user: User,
  status: ApprovalStatus,
  feedback: string,
  signatureName?: string,
  versionNumber = 1
): Promise<ApprovalRecord> => {
  const recordId = `appr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const recordRef = doc(db, 'projects', projectId, 'approvals', recordId);

  const approvalRecord: ApprovalRecord = {
    id: recordId,
    projectId,
    status,
    actorId: user.uid,
    actorName: user.displayName || 'Reviewer',
    actorEmail: user.email || undefined,
    actorRole: 'reviewer',
    feedback,
    signatureName,
    timestamp: Date.now(),
    versionNumber,
  };

  try {
    await setDoc(recordRef, approvalRecord);

    const projRef = doc(db, 'projects', projectId);
    await setDoc(
      projRef,
      {
        approvalStatus: status,
        approvalNotes: feedback,
        approvedBy: status === 'approved' ? (signatureName || user.displayName || 'Reviewer') : null,
        approvedAt: status === 'approved' ? Date.now() : null,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (e: any) {
    console.warn('Approval status update error:', e.message);
  }

  return approvalRecord;
};

export const subscribeToApprovalAuditLog = (
  projectId: string,
  callback: (records: ApprovalRecord[]) => void
) => {
  const q = query(collection(db, 'projects', projectId, 'approvals'), orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: ApprovalRecord[] = [];
      snapshot.forEach((d) => list.push(d.data() as ApprovalRecord));
      callback(list);
    },
    (err) => {
      console.warn('Approvals listener error:', err.message);
    }
  );
};

/* ----------------------------------------------------------------------------
 * 4. SECURE SHARE LINK CONFIGURATION (Public / Password / Restricted)
 * ---------------------------------------------------------------------------- */

export const configureShareLink = async (
  projectId: string,
  settings: ShareLinkSettings
): Promise<string> => {
  const shareRef = doc(db, 'shared_projects', settings.shareCode);
  try {
    await setDoc(shareRef, {
      ...settings,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (e: any) {
    console.warn('Share config error:', e.message);
  }

  const baseUrl = window.location.origin;
  return `${baseUrl}?share=${settings.shareCode}`;
};

/* ----------------------------------------------------------------------------
 * 5. PARAMETER DIFF & COMPARISON HELPERS
 * ---------------------------------------------------------------------------- */

export interface SettingDiffItem {
  key: string;
  label: string;
  baseVal: number | string | boolean;
  compareVal: number | string | boolean;
  delta?: number;
}

export const computeSnapshotDifferences = (
  base: EditHistorySnapshot,
  compare: EditHistorySnapshot
): SettingDiffItem[] => {
  const diffs: SettingDiffItem[] = [];

  const keysToCheck = [
    { k: 'exposure', label: 'Exposure', unit: 'EV' },
    { k: 'contrast', label: 'Contrast', unit: '' },
    { k: 'highlights', label: 'Highlights', unit: '' },
    { k: 'shadows', label: 'Shadows', unit: '' },
    { k: 'whites', label: 'Whites', unit: '' },
    { k: 'blacks', label: 'Blacks', unit: '' },
    { k: 'temperature', label: 'Color Temp', unit: 'K' },
    { k: 'tint', label: 'Tint', unit: '' },
    { k: 'saturation', label: 'Saturation', unit: '' },
    { k: 'vibrance', label: 'Vibrance', unit: '' },
    { k: 'clarity', label: 'Clarity', unit: '' },
    { k: 'dehaze', label: 'Dehaze', unit: '' },
    { k: 'sharpness', label: 'Sharpness', unit: '' },
    { k: 'vignette', label: 'Vignette', unit: '' },
  ];

  keysToCheck.forEach(({ k, label }) => {
    const v1 = (base.settings as any)?.[k] ?? 0;
    const v2 = (compare.settings as any)?.[k] ?? 0;
    if (v1 !== v2) {
      diffs.push({
        key: k,
        label,
        baseVal: v1,
        compareVal: v2,
        delta: typeof v2 === 'number' && typeof v1 === 'number' ? Number((v2 - v1).toFixed(2)) : undefined,
      });
    }
  });

  if (base.activePresetId !== compare.activePresetId) {
    diffs.push({
      key: 'preset',
      label: 'Active Preset',
      baseVal: base.activePresetId || 'None',
      compareVal: compare.activePresetId || 'None',
    });
  }

  return diffs;
};
