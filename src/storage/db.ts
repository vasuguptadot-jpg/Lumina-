import { Project, FilterPreset } from '../types/editor';

const DB_NAME = 'LuminaStudioPro_DB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_PRESETS = 'custom_presets';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const projectStore = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_PRESETS)) {
        db.createObjectStore(STORE_PRESETS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProjectToDB(project: Project): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.put(project);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save project to IndexedDB:', err);
  }
}

export async function getAllProjectsFromDB(): Promise<Project[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result as Project[];
        list.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to load projects from IndexedDB:', err);
    return [];
  }
}

export async function getProjectByIdFromDB(id: string): Promise<Project | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error(`Failed to get project ${id}:`, err);
    return null;
  }
}

export async function deleteProjectFromDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error(`Failed to delete project ${id}:`, err);
  }
}

export async function saveCustomPresetToDB(preset: FilterPreset): Promise<void> {
  try {
    const db = await openDB();
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
    const db = await openDB();
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
    const db = await openDB();
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
    const db = await openDB();
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
