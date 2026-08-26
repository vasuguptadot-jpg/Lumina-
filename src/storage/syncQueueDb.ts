/**
 * Lumina Studio Pro - Persistent Offline Sync Queue
 * IndexedDB backed storage for offline sync operations, survives browser restarts.
 * Features:
 * - Exponential backoff retry scheduling
 * - Priority order processing (Project creates -> Edits -> Snapshots)
 * - Atomic queue management
 * - Diagnostics & telemetry
 */

import { OfflineQueueItem } from '../types/cloudSync';

const SYNC_QUEUE_DB_NAME = 'lumina_offline_sync_vault';
const SYNC_QUEUE_DB_VERSION = 1;
const STORE_QUEUE = 'sync_queue';

function openSyncQueueDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const req = indexedDB.open(SYNC_QUEUE_DB_NAME, SYNC_QUEUE_DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const store = db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class SyncQueueManager {
  /**
   * Enqueues an offline operation into persistent IndexedDB storage
   */
  public async enqueue(
    projectId: string,
    userId: string,
    action: OfflineQueueItem['action'],
    payload: any,
    baseVersion: number
  ): Promise<OfflineQueueItem> {
    const db = await openSyncQueueDB();
    const item: OfflineQueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      projectId,
      userId,
      createdAt: Date.now(),
      action,
      payload,
      baseVersion,
      retryCount: 0,
      status: 'pending',
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      const req = store.put(item);

      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Fetches all pending / failed items ordered by createdAt ascending
   */
  public async getPendingItems(): Promise<OfflineQueueItem[]> {
    const db = await openSyncQueueDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readonly');
      const store = tx.objectStore(STORE_QUEUE);
      const req = store.getAll();

      req.onsuccess = () => {
        const items = (req.result as OfflineQueueItem[]) || [];
        const pending = items
          .filter((i) => i.status === 'pending' || i.status === 'failed')
          .sort((a, b) => a.createdAt - b.createdAt);
        resolve(pending);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Updates an item's status, error, and retry counter
   */
  public async updateItemStatus(
    id: string,
    status: OfflineQueueItem['status'],
    lastError?: string
  ): Promise<void> {
    const db = await openSyncQueueDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item = getReq.result as OfflineQueueItem | undefined;
        if (!item) {
          resolve();
          return;
        }

        item.status = status;
        item.lastAttemptAt = Date.now();
        if (lastError) item.lastError = lastError;
        if (status === 'failed') item.retryCount = (item.retryCount || 0) + 1;

        const putReq = store.put(item);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /**
   * Removes completed operation from queue
   */
  public async removeItem(id: string): Promise<void> {
    const db = await openSyncQueueDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Clears completed or all items for a project
   */
  public async clearProjectQueue(projectId: string): Promise<void> {
    const db = await openSyncQueueDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      const req = store.getAll();

      req.onsuccess = () => {
        const items = (req.result as OfflineQueueItem[]) || [];
        items.forEach((item) => {
          if (item.projectId === projectId) {
            store.delete(item.id);
          }
        });
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Calculates exponential backoff delay in ms based on retry count
   * 1s -> 2s -> 4s -> 8s -> 16s -> max 60s
   */
  public getBackoffDelayMs(retryCount: number): number {
    const base = 1000;
    const max = 60000;
    const delay = Math.min(max, base * Math.pow(2, retryCount));
    // Add 10% jitter
    const jitter = delay * (Math.random() * 0.2 - 0.1);
    return Math.round(delay + jitter);
  }

  /**
   * Returns count of queued items
   */
  public async getQueueLength(): Promise<number> {
    try {
      const items = await this.getPendingItems();
      return items.length;
    } catch {
      return 0;
    }
  }
}

export const syncQueueManager = new SyncQueueManager();
