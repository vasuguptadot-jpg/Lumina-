import { Project, FilterPreset } from '../types/editor';
import { AutomationWorkflow } from '../types/automation';
import {
  openIndexedDB,
  saveLuminaProject,
  getAllLuminaProjects,
  getLuminaProjectById,
  deleteLuminaProject,
  saveSourceAsset,
  getSourceAsset,
  deleteSourceAsset,
  saveThumbnail,
  getThumbnailByProjectId,
  generateThumbnailDataUrl,
  saveProjectVersionRecord,
  getProjectVersionRecords,
  deleteProjectVersionRecord,
  saveRecoverySnapshotRecord,
  getAllRecoverySnapshots,
  deleteRecoverySnapshotRecord,
  clearRecoverySnapshotsForProject,
  addRecoveryJournalEntry,
  getStorageQuotaInfo,
  purgeStaleStorage,
  STORE_PRESETS,
  STORE_PLUGINS,
  STORE_AUTOMATIONS,
} from './indexedDbManager';

// Export all storage managers & types
export * from './indexedDbManager';
export * from './schemaMigration';
export * from './portableProject';
export * from './crashRecoveryEngine';
export * from './autosaveEngine';
export * from './tabConflictManager';

// =============================================================
// Legacy Backward Compatibility Wrappers
// =============================================================

export async function saveProjectToDB(project: Project): Promise<void> {
  try {
    await saveLuminaProject(project);
  } catch (err) {
    console.error('Failed to save project to IndexedDB:', err);
    throw err;
  }
}

export async function getAllProjectsFromDB(): Promise<Project[]> {
  try {
    return await getAllLuminaProjects();
  } catch (err) {
    console.error('Failed to load projects from IndexedDB:', err);
    return [];
  }
}

export async function getProjectByIdFromDB(id: string): Promise<Project | null> {
  try {
    return await getLuminaProjectById(id);
  } catch (err) {
    console.error(`Failed to get project ${id}:`, err);
    return null;
  }
}

export async function deleteProjectFromDB(id: string): Promise<void> {
  try {
    await deleteLuminaProject(id);
  } catch (err) {
    console.error(`Failed to delete project ${id}:`, err);
  }
}

// -------------------------------------------------------------
// Presets, Plugins & Automation Stores
// -------------------------------------------------------------

export async function saveCustomPresetToDB(preset: FilterPreset): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PRESETS, 'readwrite');
      const store = tx.objectStore(STORE_PRESETS);
      const req = store.put(preset);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save custom preset:', err);
  }
}

export async function getAllCustomPresetsFromDB(): Promise<FilterPreset[]> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PRESETS, 'readonly');
      const store = tx.objectStore(STORE_PRESETS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to load custom presets:', err);
    return [];
  }
}

export async function deleteCustomPresetFromDB(id: string): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PRESETS, 'readwrite');
      const store = tx.objectStore(STORE_PRESETS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error(`Failed to delete preset ${id}:`, err);
  }
}

export async function saveBatchCustomPresetsToDB(presets: FilterPreset[]): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PRESETS, 'readwrite');
      const store = tx.objectStore(STORE_PRESETS);
      presets.forEach((p) => store.put(p));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save batch presets:', err);
  }
}

export async function savePluginToDB(plugin: any): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PLUGINS, 'readwrite');
      const store = tx.objectStore(STORE_PLUGINS);
      const req = store.put(plugin);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save plugin to IndexedDB:', err);
  }
}

export async function getAllCustomPluginsFromDB(): Promise<any[]> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PLUGINS, 'readonly');
      const store = tx.objectStore(STORE_PLUGINS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to load custom plugins:', err);
    return [];
  }
}

export async function deletePluginFromDB(id: string): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PLUGINS, 'readwrite');
      const store = tx.objectStore(STORE_PLUGINS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error(`Failed to delete plugin ${id}:`, err);
  }
}

export async function saveAutomationToDB(automation: AutomationWorkflow): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_AUTOMATIONS, 'readwrite');
      const store = tx.objectStore(STORE_AUTOMATIONS);
      const req = store.put(automation);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save automation to IndexedDB:', err);
  }
}

export async function getAllAutomationsFromDB(): Promise<AutomationWorkflow[]> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_AUTOMATIONS, 'readonly');
      const store = tx.objectStore(STORE_AUTOMATIONS);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result as AutomationWorkflow[];
        list.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(list || []);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to load custom automations:', err);
    return [];
  }
}

export async function deleteAutomationFromDB(id: string): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_AUTOMATIONS, 'readwrite');
      const store = tx.objectStore(STORE_AUTOMATIONS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error(`Failed to delete automation ${id}:`, err);
  }
}
