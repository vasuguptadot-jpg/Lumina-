import { Project } from '../types/editor';
import { DirtyState } from '../types/projectSchema';
import { saveLuminaProject } from './indexedDbManager';
import { createRecoverySnapshot, clearRecoverySnapshotsForProject } from './crashRecoveryEngine';
import { tabConflictManager } from './tabConflictManager';

export interface AutosaveOptions {
  debounceMs?: number;
  periodicIntervalMs?: number;
}

type DirtyStateListener = (state: DirtyState, lastSavedAt: number | null) => void;
type SaveSuccessListener = (project: Project) => void;
type SaveErrorListener = (error: any) => void;

class AutosaveEngine {
  private currentProject: Project | null = null;
  private dirtyState: DirtyState = 'clean';
  private lastSavedAt: number | null = null;
  private debounceTimer: any = null;
  private periodicTimer: any = null;
  private isSaving = false;
  private pendingProject: Project | null = null;
  private options: Required<AutosaveOptions> = {
    debounceMs: 1500,
    periodicIntervalMs: 30000,
  };

  private dirtyStateListeners: Set<DirtyStateListener> = new Set();
  private successListeners: Set<SaveSuccessListener> = new Set();
  private errorListeners: Set<SaveErrorListener> = new Set();

  constructor() {
    this.initLifecycleListeners();
    this.startPeriodicTimer();
  }

  private initLifecycleListeners() {
    if (typeof window === 'undefined') return;

    // Flush immediately when user switches tabs or backgrounds app
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushImmediate();
      }
    });

    // Pagehide / Beforeunload safety
    window.addEventListener('pagehide', () => {
      this.flushImmediate();
    });

    window.addEventListener('beforeunload', (e) => {
      if (this.dirtyState === 'dirty' || this.dirtyState === 'saving') {
        // Fast snapshot
        this.flushImmediate();
      }
    });
  }

  private startPeriodicTimer() {
    if (this.periodicTimer) clearInterval(this.periodicTimer);
    this.periodicTimer = setInterval(() => {
      if (this.dirtyState === 'dirty' && this.pendingProject) {
        this.flushImmediate();
      }
    }, this.options.periodicIntervalMs);
  }

  private setDirtyState(state: DirtyState) {
    if (this.dirtyState === state) return;
    this.dirtyState = state;
    this.dirtyStateListeners.forEach((l) => {
      try {
        l(state, this.lastSavedAt);
      } catch (e) {
        console.error('Error in dirtyStateListener:', e);
      }
    });
  }

  /**
   * Notify the engine that project data has been edited
   */
  public markDirty(updatedProject: Project, immediate = false) {
    this.currentProject = updatedProject;
    this.pendingProject = updatedProject;

    if (this.dirtyState !== 'saving') {
      this.setDirtyState('dirty');
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (immediate) {
      this.flushImmediate();
    } else {
      this.debounceTimer = setTimeout(() => {
        this.flushImmediate();
      }, this.options.debounceMs);
    }
  }

  /**
   * Flush pending changes to IndexedDB immediately
   */
  public async flushImmediate(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (!this.pendingProject) {
      return;
    }

    const projectToSave = { ...this.pendingProject };
    this.pendingProject = null;
    this.isSaving = true;
    this.setDirtyState('saving');

    try {
      // 1. Transactional write to IndexedDB
      await saveLuminaProject(projectToSave);

      // 2. Also take a lightweight crash checkpoint
      try {
        await createRecoverySnapshot(projectToSave, 'Autosave checkpoint');
      } catch {
        // Non-fatal
      }

      // 3. Broadcast to other tabs
      tabConflictManager.broadcastProjectUpdate(
        projectToSave.id,
        projectToSave.cloudRevision || 1,
        projectToSave.name
      );

      this.lastSavedAt = Date.now();
      this.isSaving = false;

      // Check if another edit occurred while saving
      if (this.pendingProject) {
        this.setDirtyState('dirty');
        this.markDirty(this.pendingProject);
      } else {
        this.setDirtyState('saved');
        // Transition to 'clean' after 2.5s display of 'saved'
        setTimeout(() => {
          if (this.dirtyState === 'saved') {
            this.setDirtyState('clean');
          }
        }, 2500);
      }

      this.successListeners.forEach((l) => {
        try {
          l(projectToSave);
        } catch (e) {
          console.error('Error in saveSuccessListener:', e);
        }
      });
    } catch (err: any) {
      console.error('Autosave failed:', err);
      this.isSaving = false;
      this.setDirtyState('save_failed');
      this.errorListeners.forEach((l) => {
        try {
          l(err);
        } catch (e) {
          console.error('Error in saveErrorListener:', e);
        }
      });
    }
  }

  /**
   * Set active project on project load/switch
   */
  public setActiveProject(project: Project) {
    this.currentProject = project;
    this.pendingProject = null;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.lastSavedAt = project.updatedAt || Date.now();
    this.setDirtyState('clean');
  }

  /**
   * Manual explicit save action
   */
  public async saveNow(): Promise<void> {
    if (this.currentProject) {
      this.pendingProject = this.currentProject;
      await this.flushImmediate();
    }
  }

  public getDirtyState(): DirtyState {
    return this.dirtyState;
  }

  public getLastSavedAt(): number | null {
    return this.lastSavedAt;
  }

  public subscribeDirtyState(listener: DirtyStateListener): () => void {
    this.dirtyStateListeners.add(listener);
    listener(this.dirtyState, this.lastSavedAt);
    return () => {
      this.dirtyStateListeners.delete(listener);
    };
  }

  public subscribeSuccess(listener: SaveSuccessListener): () => void {
    this.successListeners.add(listener);
    return () => {
      this.successListeners.delete(listener);
    };
  }

  public subscribeError(listener: SaveErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  public destroy() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.periodicTimer) clearInterval(this.periodicTimer);
    this.dirtyStateListeners.clear();
    this.successListeners.clear();
    this.errorListeners.clear();
  }
}

export const autosaveEngine = new AutosaveEngine();
