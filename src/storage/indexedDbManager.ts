import { Project } from '../types/editor';
import {
  LuminaProjectV3,
  SourceAssetRecord,
  ThumbnailRecord,
  ProjectVersionRecord,
  RecoverySnapshotRecord,
  RecoveryJournalEntry,
  StorageQuotaInfo,
} from '../types/projectSchema';
import { migrateToV3, projectToV3Document } from './schemaMigration';

const DB_NAME = 'LuminaStudioPro_DB';
const DB_VERSION = 4;

// Object Store Names
export const STORE_PROJECTS = 'projects';
export const STORE_SOURCE_ASSETS = 'source_assets';
export const STORE_THUMBNAILS = 'thumbnails';
export const STORE_PROJECT_VERSIONS = 'project_versions';
export const STORE_RECOVERY_SNAPSHOTS = 'recovery_snapshots';
export const STORE_RECOVERY_JOURNAL = 'recovery_journal';
export const STORE_PRESETS = 'custom_presets';
export const STORE_PLUGINS = 'custom_plugins';
export const STORE_AUTOMATIONS = 'custom_automations';

let dbInstance: IDBDatabase | null = null;
let dbOpenPromise: Promise<IDBDatabase> | null = null;

/**
 * Open or retrieve cached IndexedDB instance with full schema migrations
 */
export function openIndexedDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  if (dbOpenPromise) {
    return dbOpenPromise;
  }

  dbOpenPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      // 1. Projects Store
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const projectStore = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        projectStore.createIndex('name', 'name', { unique: false });
      }

      // 2. Source Assets Store (deduplicated image blobs)
      if (!db.objectStoreNames.contains(STORE_SOURCE_ASSETS)) {
        const assetStore = db.createObjectStore(STORE_SOURCE_ASSETS, { keyPath: 'id' });
        assetStore.createIndex('hash', 'hash', { unique: false });
        assetStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 3. Thumbnails Store
      if (!db.objectStoreNames.contains(STORE_THUMBNAILS)) {
        const thumbStore = db.createObjectStore(STORE_THUMBNAILS, { keyPath: 'id' });
        thumbStore.createIndex('projectId', 'projectId', { unique: false });
      }

      // 4. Project Versions Store
      if (!db.objectStoreNames.contains(STORE_PROJECT_VERSIONS)) {
        const verStore = db.createObjectStore(STORE_PROJECT_VERSIONS, { keyPath: 'id' });
        verStore.createIndex('projectId', 'projectId', { unique: false });
        verStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // 5. Recovery Snapshots Store
      if (!db.objectStoreNames.contains(STORE_RECOVERY_SNAPSHOTS)) {
        const recStore = db.createObjectStore(STORE_RECOVERY_SNAPSHOTS, { keyPath: 'id' });
        recStore.createIndex('projectId', 'projectId', { unique: false });
        recStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // 6. Recovery Journal Store
      if (!db.objectStoreNames.contains(STORE_RECOVERY_JOURNAL)) {
        const journalStore = db.createObjectStore(STORE_RECOVERY_JOURNAL, { keyPath: 'id' });
        journalStore.createIndex('projectId', 'projectId', { unique: false });
      }

      // Legacy Stores
      if (!db.objectStoreNames.contains(STORE_PRESETS)) {
        db.createObjectStore(STORE_PRESETS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PLUGINS)) {
        db.createObjectStore(STORE_PLUGINS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_AUTOMATIONS)) {
        db.createObjectStore(STORE_AUTOMATIONS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        dbOpenPromise = null;
      };
      resolve(request.result);
    };

    request.onerror = () => {
      dbOpenPromise = null;
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });

  return dbOpenPromise;
}

// -------------------------------------------------------------
// Source Asset Deduplication & Storage
// -------------------------------------------------------------

/**
 * Generate a hash or content ID for an image data string/blob
 */
export async function computeAssetHash(dataUrlOrBlob: string | Blob): Promise<string> {
  try {
    if (typeof dataUrlOrBlob === 'string') {
      let hash = 0;
      const str = dataUrlOrBlob.substring(0, 4000);
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return `hash_${Math.abs(hash)}_${dataUrlOrBlob.length}`;
    } else {
      return `blob_${dataUrlOrBlob.size}_${dataUrlOrBlob.type.replace(/\W/g, '')}`;
    }
  } catch {
    return `hash_${Date.now()}`;
  }
}

/**
 * Save source asset blob or data URL to 'source_assets'
 */
export async function saveSourceAsset(asset: SourceAssetRecord): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SOURCE_ASSETS, 'readwrite');
    const store = tx.objectStore(STORE_SOURCE_ASSETS);
    const req = store.put(asset);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve source asset by ID
 */
export async function getSourceAsset(id: string): Promise<SourceAssetRecord | null> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SOURCE_ASSETS, 'readonly');
    const store = tx.objectStore(STORE_SOURCE_ASSETS);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete source asset by ID
 */
export async function deleteSourceAsset(id: string): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SOURCE_ASSETS, 'readwrite');
    const store = tx.objectStore(STORE_SOURCE_ASSETS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// -------------------------------------------------------------
// Thumbnail Generation & Storage
// -------------------------------------------------------------

/**
 * Generate a lightweight thumbnail (max 360px wide/high) data URL from an image URL
 */
export function generateThumbnailDataUrl(imageUrl: string, maxDimension = 360): Promise<string> {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve('');
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const aspect = img.width / (img.height || 1);
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDimension) {
          w = maxDimension;
          h = Math.round(maxDimension / aspect);
        } else if (h > maxDimension) {
          h = maxDimension;
          w = Math.round(maxDimension * aspect);
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageUrl.length < 50000 ? imageUrl : '');
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      } catch {
        resolve(imageUrl.length < 50000 ? imageUrl : '');
      }
    };
    img.onerror = () => resolve('');
    img.src = imageUrl;
  });
}

/**
 * Save thumbnail record
 */
export async function saveThumbnail(thumbnail: ThumbnailRecord): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_THUMBNAILS, 'readwrite');
    const store = tx.objectStore(STORE_THUMBNAILS);
    const req = store.put(thumbnail);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve thumbnail for a project
 */
export async function getThumbnailByProjectId(projectId: string): Promise<ThumbnailRecord | null> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_THUMBNAILS, 'readonly');
    const store = tx.objectStore(STORE_THUMBNAILS);
    const index = store.index('projectId');
    const req = index.get(projectId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// -------------------------------------------------------------
// Transactional Project CRUD Operations
// -------------------------------------------------------------

/**
 * Save project transactionally with schema migration & asset deduplication
 */
export async function saveLuminaProject(project: Project): Promise<LuminaProjectV3> {
  const db = await openIndexedDB();

  // 1. Check or create source asset record
  const assetId = `asset_${project.image?.id || project.id}`;
  if (project.image?.originalUrl && project.image.originalUrl.startsWith('data:')) {
    try {
      const assetRecord: SourceAssetRecord = {
        id: assetId,
        dataUrl: project.image.originalUrl,
        mimeType: project.image.format ? `image/${project.image.format}` : 'image/jpeg',
        filename: project.image.name || `${project.name}.png`,
        size: project.image.size || project.image.originalUrl.length,
        width: project.image.width || 1920,
        height: project.image.height || 1080,
        createdAt: project.createdAt || Date.now(),
        refCount: 1,
      };
      await saveSourceAsset(assetRecord);
    } catch (e) {
      console.warn('Failed to save decoupled source asset:', e);
    }
  }

  // 2. Generate thumbnail if needed
  let thumbnailDataUrl = project.thumbnailUrl;
  if (!thumbnailDataUrl && project.image?.originalUrl) {
    try {
      thumbnailDataUrl = await generateThumbnailDataUrl(project.image.originalUrl);
    } catch {
      thumbnailDataUrl = undefined;
    }
  }

  // 3. Build canonical v3 document
  const canonicalDoc = projectToV3Document(project, assetId, thumbnailDataUrl);

  // 4. Save to IndexedDB with transactional verification
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_PROJECTS, STORE_THUMBNAILS], 'readwrite');
    const projectStore = tx.objectStore(STORE_PROJECTS);
    const thumbStore = tx.objectStore(STORE_THUMBNAILS);

    // Save project document
    projectStore.put(canonicalDoc);

    // Save thumbnail record
    if (thumbnailDataUrl) {
      const thumbRecord: ThumbnailRecord = {
        id: `thumb_${project.id}`,
        projectId: project.id,
        dataUrl: thumbnailDataUrl,
        width: 360,
        height: 240,
        createdAt: Date.now(),
      };
      thumbStore.put(thumbRecord);
    }

    tx.oncomplete = () => resolve(canonicalDoc);
    tx.onerror = () => reject(tx.error || new Error('Transaction failed while saving project.'));
    tx.onabort = () => reject(new Error('Transaction aborted while saving project.'));
  });
}

/**
 * Retrieve project by ID and reconstruct full runtime object
 */
export async function getLuminaProjectById(id: string): Promise<Project | null> {
  const db = await openIndexedDB();
  const raw: any = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });

  if (!raw) return null;

  // Migrate to v3
  const { project, canonicalDoc } = migrateToV3(raw);

  // Hydrate image source if empty
  if (!project.image.originalUrl && canonicalDoc.sourceAssetId) {
    const asset = await getSourceAsset(canonicalDoc.sourceAssetId);
    if (asset?.dataUrl) {
      project.image.originalUrl = asset.dataUrl;
    }
  }

  // Hydrate thumbnail if empty
  if (!project.thumbnailUrl) {
    const thumb = await getThumbnailByProjectId(id);
    if (thumb?.dataUrl) {
      project.thumbnailUrl = thumb.dataUrl;
    }
  }

  return project;
}

/**
 * Retrieve all projects sorted by updatedAt descending
 */
export async function getAllLuminaProjects(): Promise<Project[]> {
  const db = await openIndexedDB();
  const rawList: any[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  const projects: Project[] = [];
  for (const raw of rawList) {
    try {
      const { project } = migrateToV3(raw);
      projects.push(project);
    } catch (e) {
      console.warn('Failed to parse project:', e);
    }
  }

  projects.sort((a, b) => b.updatedAt - a.updatedAt);
  return projects;
}

/**
 * Delete project and related metadata
 */
export async function deleteLuminaProject(id: string): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [
        STORE_PROJECTS,
        STORE_THUMBNAILS,
        STORE_PROJECT_VERSIONS,
        STORE_RECOVERY_SNAPSHOTS,
        STORE_RECOVERY_JOURNAL,
      ],
      'readwrite'
    );

    // Delete project
    tx.objectStore(STORE_PROJECTS).delete(id);

    // Delete thumbnail
    tx.objectStore(STORE_THUMBNAILS).delete(`thumb_${id}`);

    // Delete associated recovery snapshots
    const recStore = tx.objectStore(STORE_RECOVERY_SNAPSHOTS);
    const recIndex = recStore.index('projectId');
    const recReq = recIndex.getAllKeys(id);
    recReq.onsuccess = () => {
      const keys = recReq.result;
      keys.forEach((k) => recStore.delete(k));
    };

    // Delete associated versions
    const verStore = tx.objectStore(STORE_PROJECT_VERSIONS);
    const verIndex = verStore.index('projectId');
    const verReq = verIndex.getAllKeys(id);
    verReq.onsuccess = () => {
      const keys = verReq.result;
      keys.forEach((k) => verStore.delete(k));
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// -------------------------------------------------------------
// Project Version Snapshots
// -------------------------------------------------------------

/**
 * Save an explicit version snapshot to 'project_versions'
 */
export async function saveProjectVersionRecord(version: ProjectVersionRecord): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECT_VERSIONS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECT_VERSIONS);
    const req = store.put(version);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all versions for a project
 */
export async function getProjectVersionRecords(projectId: string): Promise<ProjectVersionRecord[]> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECT_VERSIONS, 'readonly');
    const store = tx.objectStore(STORE_PROJECT_VERSIONS);
    const index = store.index('projectId');
    const req = index.getAll(projectId);
    req.onsuccess = () => {
      const list = (req.result || []) as ProjectVersionRecord[];
      list.sort((a, b) => b.timestamp - a.timestamp);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a project version record
 */
export async function deleteProjectVersionRecord(versionId: string): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECT_VERSIONS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECT_VERSIONS);
    const req = store.delete(versionId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// -------------------------------------------------------------
// Crash Recovery Snapshots & Journal
// -------------------------------------------------------------

/**
 * Save lightweight crash recovery snapshot to 'recovery_snapshots'
 */
export async function saveRecoverySnapshotRecord(snapshot: RecoverySnapshotRecord): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECOVERY_SNAPSHOTS, 'readwrite');
    const store = tx.objectStore(STORE_RECOVERY_SNAPSHOTS);
    const req = store.put(snapshot);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all recovery snapshots
 */
export async function getAllRecoverySnapshots(): Promise<RecoverySnapshotRecord[]> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECOVERY_SNAPSHOTS, 'readonly');
    const store = tx.objectStore(STORE_RECOVERY_SNAPSHOTS);
    const req = store.getAll();
    req.onsuccess = () => {
      const list = (req.result || []) as RecoverySnapshotRecord[];
      list.sort((a, b) => b.timestamp - a.timestamp);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a recovery snapshot
 */
export async function deleteRecoverySnapshotRecord(id: string): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECOVERY_SNAPSHOTS, 'readwrite');
    const store = tx.objectStore(STORE_RECOVERY_SNAPSHOTS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clear recovery snapshots for a specific project
 */
export async function clearRecoverySnapshotsForProject(projectId: string): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECOVERY_SNAPSHOTS, 'readwrite');
    const store = tx.objectStore(STORE_RECOVERY_SNAPSHOTS);
    const index = store.index('projectId');
    const req = index.getAllKeys(projectId);
    req.onsuccess = () => {
      const keys = req.result;
      keys.forEach((k) => store.delete(k));
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Add journal entry for crash forensic tracing
 */
export async function addRecoveryJournalEntry(entry: RecoveryJournalEntry): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_RECOVERY_JOURNAL, 'readwrite');
    tx.objectStore(STORE_RECOVERY_JOURNAL).put(entry);
  } catch {
    // Non-fatal
  }
}

// -------------------------------------------------------------
// Storage Quota & Health Diagnostics
// -------------------------------------------------------------

/**
 * Calculate comprehensive storage quota and size breakdowns
 */
export async function getStorageQuotaInfo(): Promise<StorageQuotaInfo> {
  let supported = false;
  let usedBytes = 0;
  let quotaBytes = 0;

  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      supported = true;
      usedBytes = estimate.usage || 0;
      quotaBytes = estimate.quota || 0;
    } catch {
      supported = false;
    }
  }

  const db = await openIndexedDB();

  // Count items across stores
  const countStore = (storeName: string): Promise<number> =>
    new Promise((res) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const countReq = tx.objectStore(storeName).count();
        countReq.onsuccess = () => res(countReq.result);
        countReq.onerror = () => res(0);
      } catch {
        res(0);
      }
    });

  const [
    projectsCount,
    sourceAssetsCount,
    snapshotsCount,
    recoverySnapshotsCount,
    thumbnailsCount,
  ] = await Promise.all([
    countStore(STORE_PROJECTS),
    countStore(STORE_SOURCE_ASSETS),
    countStore(STORE_PROJECT_VERSIONS),
    countStore(STORE_RECOVERY_SNAPSHOTS),
    countStore(STORE_THUMBNAILS),
  ]);

  // Retrieve projects for size ranking
  const rawProjects: any[] = await new Promise((res) => {
    try {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const req = tx.objectStore(STORE_PROJECTS).getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => res([]);
    } catch {
      res([]);
    }
  });

  const largestProjects = rawProjects.map((p) => {
    const jsonStr = JSON.stringify(p);
    return {
      id: p.id,
      name: p.name || 'Untitled Project',
      sizeBytes: jsonStr.length * 2, // Approximate UTF-16 bytes
      updatedAt: p.updatedAt || Date.now(),
      hasSource: Boolean(p.sourceAssetId || p.image?.originalUrl),
    };
  });

  largestProjects.sort((a, b) => b.sizeBytes - a.sizeBytes);

  const percentUsed = quotaBytes > 0 ? Math.min(100, Math.round((usedBytes / quotaBytes) * 100)) : 0;

  return {
    supported,
    usedBytes,
    quotaBytes,
    percentUsed,
    projectsCount,
    sourceAssetsCount,
    snapshotsCount,
    recoverySnapshotsCount,
    thumbnailsCount,
    largestProjects: largestProjects.slice(0, 10),
  };
}

/**
 * Maintenance: Purge unreferenced source assets & stale recovery snapshots older than threshold
 */
export async function purgeStaleStorage(maxAgeMs = 7 * 24 * 60 * 60 * 1000): Promise<{
  purgedSnapshots: number;
  purgedAssets: number;
}> {
  const db = await openIndexedDB();
  const now = Date.now();
  let purgedSnapshots = 0;
  let purgedAssets = 0;

  // 1. Purge old recovery snapshots
  const snapshots = await getAllRecoverySnapshots();
  for (const s of snapshots) {
    if (now - s.timestamp > maxAgeMs) {
      await deleteRecoverySnapshotRecord(s.id);
      purgedSnapshots++;
    }
  }

  // 2. Identify referenced assets
  const allProjects = await getAllLuminaProjects();
  const referencedAssetIds = new Set<string>();
  allProjects.forEach((p) => {
    if (p.image?.id) referencedAssetIds.add(`asset_${p.image.id}`);
    referencedAssetIds.add(`asset_${p.id}`);
  });

  // 3. Purge orphaned assets
  const allAssets: SourceAssetRecord[] = await new Promise((res) => {
    try {
      const tx = db.transaction(STORE_SOURCE_ASSETS, 'readonly');
      const req = tx.objectStore(STORE_SOURCE_ASSETS).getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => res([]);
    } catch {
      res([]);
    }
  });

  for (const asset of allAssets) {
    if (!referencedAssetIds.has(asset.id) && now - asset.createdAt > maxAgeMs) {
      await deleteSourceAsset(asset.id);
      purgedAssets++;
    }
  }

  return { purgedSnapshots, purgedAssets };
}
