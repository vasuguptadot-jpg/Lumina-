import { TabSyncMessage } from '../types/projectSchema';

const CHANNEL_NAME = 'lumina_tab_sync_channel';

// Unique ID for this browser tab instance
export const CURRENT_TAB_ID = `tab_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

type ConflictListener = (message: TabSyncMessage) => void;

class TabConflictManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<ConflictListener> = new Set();
  private lastSavedRevision: Map<string, number> = new Map();

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel not available for multi-tab sync:', err);
      }
    }
  }

  private handleIncomingMessage(msg: TabSyncMessage) {
    if (!msg || msg.tabId === CURRENT_TAB_ID) {
      // Ignore own tab's broadcasts
      return;
    }

    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Error in TabConflict listener:', err);
      }
    });
  }

  /**
   * Broadcast that a project was saved or updated
   */
  public broadcastProjectUpdate(projectId: string, revision: number, projectName?: string) {
    this.lastSavedRevision.set(projectId, revision);

    if (this.channel) {
      const msg: TabSyncMessage = {
        type: 'PROJECT_UPDATED',
        tabId: CURRENT_TAB_ID,
        projectId,
        projectName,
        revision,
        timestamp: Date.now(),
      };
      try {
        this.channel.postMessage(msg);
      } catch (err) {
        console.warn('Failed to broadcast project update:', err);
      }
    }
  }

  /**
   * Subscribe to foreign tab messages
   */
  public subscribe(listener: ConflictListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Track current tab's revision
   */
  public setLocalRevision(projectId: string, revision: number) {
    this.lastSavedRevision.set(projectId, revision);
  }

  public getLocalRevision(projectId: string): number {
    return this.lastSavedRevision.get(projectId) || 1;
  }
}

export const tabConflictManager = new TabConflictManager();
