/**
 * Lumina Studio Pro - Production Master Cloud Synchronization Engine
 * Manages local-first state, real-time snapshot replication, offline mutation queuing, and 3-way conflict arbitration.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { authService } from './authService';
import { syncQueueManager } from '../storage/syncQueueDb';
import { conflictResolver } from './conflictResolver';
import {
  Project,
  AdjustmentSettings,
  ToneCurves,
  HSLSettings,
  CropSettings,
} from '../types/editor';
import {
  CloudProjectDocument,
  SyncState,
  ProjectConflictReport,
  ConflictResolutionChoice,
  SyncOperationRecord,
} from '../types/cloudSync';
import { getProjectByIdFromDB, saveProjectToDB } from '../storage/db';

export class CloudSyncEngine {
  private syncState: SyncState = 'SYNCED';
  private activeProjectId: string | null = null;
  private activeProjectBase: Project | null = null;
  private activeConflictReport: ProjectConflictReport | null = null;
  private firestoreUnsub: (() => void) | null = null;
  private isProcessingQueue = false;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Array<(state: SyncState, details?: any) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public getSyncState(): SyncState {
    return this.syncState;
  }

  public subscribeStatus(callback: (state: SyncState, details?: any) => void): () => void {
    this.listeners.push(callback);
    callback(this.syncState, { conflictReport: this.activeConflictReport });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyStatus(details?: any) {
    for (const l of this.listeners) {
      l(this.syncState, { ...details, conflictReport: this.activeConflictReport });
    }
  }

  private setSyncState(newState: SyncState, details?: any) {
    this.syncState = newState;
    this.notifyStatus(details);
  }

  private async handleNetworkChange(isOnline: boolean) {
    this.isOnline = isOnline;
    if (isOnline) {
      if (this.syncState === 'OFFLINE') {
        this.setSyncState('SYNCING');
        await this.drainOfflineQueue();
      }
    } else {
      this.setSyncState('OFFLINE');
    }
  }

  /**
   * Binds the active project to the synchronization engine and listens for remote updates
   */
  public async bindProject(project: Project) {
    if (this.activeProjectId === project.id && this.firestoreUnsub) {
      return;
    }

    if (this.firestoreUnsub) {
      this.firestoreUnsub();
      this.firestoreUnsub = null;
    }

    this.activeProjectId = project.id;
    this.activeProjectBase = JSON.parse(JSON.stringify(project));
    this.activeConflictReport = null;

    if (!authService.isAuthenticated()) {
      this.setSyncState('SYNCED');
      return;
    }

    if (!this.isOnline) {
      this.setSyncState('OFFLINE');
      return;
    }

    // Subscribe to Firestore project document
    try {
      const projectRef = doc(db, 'projects', project.id);
      this.firestoreUnsub = onSnapshot(
        projectRef,
        (snapshot) => {
          if (!snapshot.exists()) return;
          const remoteData = snapshot.data() as CloudProjectDocument;
          this.handleRemoteDocumentSnapshot(project, remoteData);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, `projects/${project.id}`);
          this.setSyncState('ERROR', { error });
        }
      );
    } catch (err) {
      console.warn('[Lumina Cloud] Binding listener error:', err);
    }
  }

  private async handleRemoteDocumentSnapshot(
    localProject: Project,
    remoteDoc: CloudProjectDocument
  ) {
    // If remote version is strictly greater than local version, evaluate merge/conflict
    const localVersion = localProject.cloudRevision || 1;
    const remoteVersion = remoteDoc.version || 1;

    if (remoteVersion > localVersion) {
      // Compare base vs local vs remote
      const base = this.activeProjectBase || localProject;
      const report = conflictResolver.generateConflictReport(base, localProject, remoteDoc);

      if (report.conflictedProperties.length > 0) {
        // Real conflict exists
        this.activeConflictReport = report;
        this.setSyncState('CONFLICT', { report });
      } else {
        // Clean auto-merge
        const mergeResult = conflictResolver.resolveConflict(
          localProject,
          remoteDoc,
          report,
          'SEMANTIC_MERGE'
        );
        this.activeProjectBase = JSON.parse(JSON.stringify(mergeResult.resolvedProject));
        await saveProjectToDB(mergeResult.resolvedProject);
        this.setSyncState('SYNCED');
      }
    }
  }

  /**
   * Pushes latest project state into the cloud synchronization pipeline
   */
  public async pushProjectState(project: Project): Promise<void> {
    const user = authService.getUser();
    if (!user) {
      // Local-only save when unauthenticated
      await saveProjectToDB(project);
      return;
    }

    const nextRevision = (project.cloudRevision || 1) + 1;
    const updatedProject: Project = {
      ...project,
      cloudRevision: nextRevision,
      cloudSyncStatus: 'syncing',
      updatedAt: Date.now(),
    };

    // Save locally first (IndexedDB)
    await saveProjectToDB(updatedProject);

    if (!this.isOnline) {
      // Enqueue to offline mutation storage
      await syncQueueManager.enqueue(
        project.id,
        user.uid,
        'SYNC_BATCH',
        updatedProject,
        nextRevision
      );
      this.setSyncState('OFFLINE');
      return;
    }

    this.setSyncState('SYNCING');
    try {
      const docRef = doc(db, 'projects', project.id);
      const cloudPayload: Partial<CloudProjectDocument> = {
        id: project.id,
        ownerId: user.uid,
        name: project.name,
        updatedAt: Date.now(),
        version: nextRevision,
        schemaVersion: 1,
        revisionId: `rev_${nextRevision}_${Date.now()}`,
        lastModifiedBy: {
          uid: user.uid,
          displayName: user.displayName || user.email || 'Studio Artist',
        },
        collaboratorIds: [user.uid],
        collaboratorRoles: { [user.uid]: 'owner' },
        isPublic: false,
        deletedAt: null,
        projectState: {
          settings: project.currentSettings,
          toneCurves: project.toneCurves,
          hsl: project.hsl,
          crop: project.crop,
          watermark: project.watermark,
          border: project.border,
          activePresetId: project.activePresetId,
          presetStrength: project.presetStrength,
          layers: project.layers || [],
          masks: project.masks || [],
          typography: project.typography || [],
          designElements: project.designElements || [],
          retouchStrokes: project.retouchStrokes || [],
          colorManagement: project.colorManagement,
        },
      };

      await setDoc(docRef, cloudPayload, { merge: true });
      this.activeProjectBase = JSON.parse(JSON.stringify(updatedProject));
      this.setSyncState('SYNCED');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `projects/${project.id}`);
      // Fallback enqueue on transient error
      await syncQueueManager.enqueue(
        project.id,
        user.uid,
        'SYNC_BATCH',
        updatedProject,
        nextRevision
      );
      this.setSyncState('ERROR', { error: err });
    }
  }

  /**
   * Drains the offline IndexedDB operation queue when network connectivity restores
   */
  public async drainOfflineQueue(): Promise<void> {
    if (this.isProcessingQueue || !this.isOnline || !authService.isAuthenticated()) {
      return;
    }

    this.isProcessingQueue = true;
    try {
      let pendingOps = await syncQueueManager.getPendingItems();
      while (pendingOps.length > 0) {
        const op = pendingOps[0];
        try {
          const user = authService.getUser();
          if (!user) break;

          const docRef = doc(db, 'projects', op.projectId);
          if (op.action === 'SYNC_BATCH' || op.action === 'UPDATE_SETTINGS') {
            const proj = op.payload as Project;
            await setDoc(
              docRef,
              {
                id: proj.id,
                ownerId: user.uid,
                name: proj.name,
                updatedAt: Date.now(),
                version: op.baseVersion,
                projectState: {
                  settings: proj.currentSettings,
                  toneCurves: proj.toneCurves,
                  hsl: proj.hsl,
                  crop: proj.crop,
                  watermark: proj.watermark,
                  border: proj.border,
                  activePresetId: proj.activePresetId,
                  presetStrength: proj.presetStrength,
                  layers: proj.layers || [],
                  masks: proj.masks || [],
                  typography: proj.typography || [],
                  designElements: proj.designElements || [],
                  retouchStrokes: proj.retouchStrokes || [],
                },
              },
              { merge: true }
            );
          }

          await syncQueueManager.removeItem(op.id);
          pendingOps = await syncQueueManager.getPendingItems();
        } catch (opErr: any) {
          const delay = syncQueueManager.getBackoffDelayMs(op.retryCount);
          await syncQueueManager.updateItemStatus(op.id, 'failed', opErr?.message);
          console.warn(`[Lumina Queue] Retrying in ${delay}ms:`, opErr);
          break;
        }
      }
      this.setSyncState('SYNCED');
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Resolves an active multi-device conflict with selected strategy
   */
  public async resolveActiveConflict(
    choice: ConflictResolutionChoice,
    manualPicks?: Record<string, 'LOCAL' | 'REMOTE'>
  ): Promise<Project> {
    if (!this.activeConflictReport) {
      throw new Error('No active conflict report to resolve.');
    }

    const { localProject, cloudDocument } = this.activeConflictReport;
    const result = conflictResolver.resolveConflict(
      localProject,
      cloudDocument,
      this.activeConflictReport,
      choice,
      manualPicks
    );

    await saveProjectToDB(result.resolvedProject);
    await this.pushProjectState(result.resolvedProject);

    this.activeConflictReport = null;
    this.setSyncState('SYNCED');
    return result.resolvedProject;
  }
}

export const cloudSyncEngine = new CloudSyncEngine();
