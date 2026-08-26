/**
 * Lumina Studio Pro - Real-Time Multi-User Collaboration & Presence Engine
 * Handles real-time operational editing stream, live presence heartbeats, and role-based permissions.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  db,
  auth,
  handleFirestoreError,
  FirestoreOperationType,
  OperationType,
} from './firebase';
import {
  CollaboratorPresence,
  CloudEditOperation,
  CollaboratorRole,
  CloudOpType,
} from '../types/cloudSync';
import { Project } from '../types/editor';

export class CollaborationEngine {
  private activePresenceUnsub: (() => void) | null = null;
  private activeOpsUnsub: (() => void) | null = null;
  private heartbeatInterval: any = null;
  private currentProjectId: string | null = null;
  private userRole: CollaboratorRole = 'owner';

  /**
   * Initializes presence heartbeat & joins project collaboration room
   */
  public joinProjectRoom(
    projectId: string,
    onPresenceUpdate: (collaborators: CollaboratorPresence[]) => void,
    onRemoteOperation: (op: CloudEditOperation) => void
  ) {
    this.leaveCurrentRoom();
    this.currentProjectId = projectId;

    const user = auth.currentUser;
    if (!user) return;

    const path = `projects/${projectId}/presence/${user.uid}`;
    const presenceRef = doc(db, 'projects', projectId, 'presence', user.uid);

    // Write initial presence record
    const record: CollaboratorPresence = {
      userId: user.uid,
      displayName: user.displayName || 'Collaborator',
      photoURL: user.photoURL || undefined,
      email: user.email || undefined,
      role: this.userRole,
      lastActive: Date.now(),
      isOnline: true,
      deviceType: this.detectDeviceType(),
    };

    setDoc(presenceRef, record, { merge: true }).catch((err) => {
      console.warn('[Lumina Collab] Presence init notice:', err);
    });

    // 15-second heartbeat
    this.heartbeatInterval = setInterval(() => {
      if (this.currentProjectId === projectId && auth.currentUser) {
        setDoc(
          doc(db, 'projects', projectId, 'presence', auth.currentUser.uid),
          { lastActive: Date.now(), isOnline: true },
          { merge: true }
        ).catch(() => {});
      }
    }, 15000);

    // Listen to all collaborators' presence
    const presenceCol = collection(db, 'projects', projectId, 'presence');
    this.activePresenceUnsub = onSnapshot(
      presenceCol,
      (snap) => {
        const now = Date.now();
        const list: CollaboratorPresence[] = [];
        snap.forEach((d) => {
          const data = d.data() as CollaboratorPresence;
          // Filter out users inactive for > 45 seconds
          const isStale = now - (data.lastActive || 0) > 45000;
          if (!isStale) {
            list.push({ ...data, isOnline: true });
          }
        });
        onPresenceUpdate(list);
      },
      (err) => {
        console.warn('[Lumina Collab] Presence listener notice:', err);
      }
    );

    // Listen to real-time operations stream
    const opsCol = collection(db, 'projects', projectId, 'operations');
    const opsQuery = query(opsCol, orderBy('timestamp', 'desc'));
    this.activeOpsUnsub = onSnapshot(
      opsQuery,
      (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const op = change.doc.data() as CloudEditOperation;
            // Ignore own operations
            if (op.userId !== auth.currentUser?.uid) {
              onRemoteOperation(op);
            }
          }
        });
      },
      (err) => {
        console.warn('[Lumina Collab] Ops listener notice:', err);
      }
    );
  }

  /**
   * Broadcasts a granular edit operation to all connected collaborators
   */
  public async broadcastOperation(
    projectId: string,
    opType: CloudOpType,
    path: string,
    payload: any,
    baseVersion: number
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    const opId = `op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const opRef = doc(db, 'projects', projectId, 'operations', opId);

    const operation: CloudEditOperation = {
      id: opId,
      projectId,
      userId: user.uid,
      userName: user.displayName || 'Editor',
      userAvatar: user.photoURL || undefined,
      timestamp: Date.now(),
      opType,
      path,
      payload,
      baseVersion,
    };

    try {
      await setDoc(opRef, operation);
    } catch (err) {
      console.warn('[Lumina Collab] Operation broadcast cached:', err);
    }
  }

  /**
   * Updates user's active tool or layer in presence
   */
  public updateActiveTool(currentTool: string, activeLayerId?: string) {
    if (!this.currentProjectId || !auth.currentUser) return;
    const presenceRef = doc(
      db,
      'projects',
      this.currentProjectId,
      'presence',
      auth.currentUser.uid
    );
    setDoc(
      presenceRef,
      { currentTool, activeLayerId, lastActive: Date.now() },
      { merge: true }
    ).catch(() => {});
  }

  /**
   * Gracefully leaves the active project room
   */
  public leaveCurrentRoom() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.activePresenceUnsub) {
      this.activePresenceUnsub();
      this.activePresenceUnsub = null;
    }

    if (this.activeOpsUnsub) {
      this.activeOpsUnsub();
      this.activeOpsUnsub = null;
    }

    if (this.currentProjectId && auth.currentUser) {
      const presenceRef = doc(
        db,
        'projects',
        this.currentProjectId,
        'presence',
        auth.currentUser.uid
      );
      deleteDoc(presenceRef).catch(() => {});
    }

    this.currentProjectId = null;
  }

  public setUserRole(role: CollaboratorRole) {
    this.userRole = role;
  }

  public getUserRole(): CollaboratorRole {
    return this.userRole;
  }

  public canEdit(): boolean {
    return this.userRole === 'owner' || this.userRole === 'editor';
  }

  private detectDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    if (/mobile|android|iphone|ipod/i.test(ua)) return 'mobile';
    if (/ipad|tablet/i.test(ua)) return 'tablet';
    return 'desktop';
  }
}

export const collaborationEngine = new CollaborationEngine();
