import { LuminaPlugin } from '../types/plugin';
import { BUILTIN_PLUGINS } from '../engine/builtinPlugins';
import {
  savePluginToDB,
  getAllCustomPluginsFromDB,
  deletePluginFromDB,
} from '../storage/db';
import { db, auth } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { injectPluginFont } from '../engine/pluginEngine';

// Key for storing disabled plugin IDs in localStorage
const DISABLED_PLUGINS_KEY = 'lumina_disabled_plugins_v1';
const USER_PARAMS_KEY = 'lumina_plugin_params_v1';

/**
 * Retrieves all available plugins combining Built-in and Custom/Community extensions
 */
export async function loadAllPlugins(): Promise<LuminaPlugin[]> {
  try {
    const customList = (await getAllCustomPluginsFromDB()) as LuminaPlugin[];
    const disabledIds = getDisabledPluginIds();
    const storedParams = getStoredPluginParams();

    // Merge built-in plugins with custom ones
    const mergedMap = new Map<string, LuminaPlugin>();

    // 1. Add builtin plugins
    BUILTIN_PLUGINS.forEach((bp) => {
      const isEnabled = !disabledIds.has(bp.id);
      const customParams = storedParams[bp.id] || bp.currentParams;
      const plugin = {
        ...bp,
        isEnabled,
        currentParams: { ...bp.currentParams, ...customParams },
      };
      mergedMap.set(bp.id, plugin);

      // If it's a font, inject it
      if (plugin.category === 'font' && plugin.isEnabled) {
        injectPluginFont(plugin);
      }
    });

    // 2. Add custom plugins
    customList.forEach((cp) => {
      const isEnabled = !disabledIds.has(cp.id);
      const customParams = storedParams[cp.id] || cp.currentParams;
      const plugin = {
        ...cp,
        isEnabled,
        currentParams: { ...cp.currentParams, ...customParams },
      };
      mergedMap.set(cp.id, plugin);

      if (plugin.category === 'font' && plugin.isEnabled) {
        injectPluginFont(plugin);
      }
    });

    return Array.from(mergedMap.values());
  } catch (err) {
    console.error('Error loading plugins:', err);
    return BUILTIN_PLUGINS;
  }
}

/**
 * Saves or updates a plugin locally and to Firestore if authenticated
 */
export async function savePlugin(plugin: LuminaPlugin): Promise<void> {
  // Save to IndexedDB
  await savePluginToDB(plugin);

  // If user signed in, sync to Firestore
  if (auth.currentUser) {
    try {
      const pluginRef = doc(db, 'plugins', plugin.id);
      await setDoc(
        pluginRef,
        {
          id: plugin.id,
          name: plugin.name,
          category: plugin.category,
          version: plugin.version,
          author: plugin.author,
          authorId: auth.currentUser.uid,
          authorEmail: auth.currentUser.email || '',
          description: plugin.description,
          iconName: plugin.iconName || 'Code',
          tags: plugin.tags || [],
          isPublic: plugin.isPublic ?? false,
          downloadsCount: plugin.downloadsCount || 0,
          rating: plugin.rating || 5.0,
          code: plugin.code || '',
          parameters: plugin.parameters || [],
          currentParams: plugin.currentParams || {},
          lutData: plugin.lutData || null,
          aiConfig: plugin.aiConfig || null,
          brushConfig: plugin.brushConfig || null,
          presetData: plugin.presetData || null,
          fontConfig: plugin.fontConfig || null,
          templateData: plugin.templateData || null,
          integrationConfig: plugin.integrationConfig || null,
          createdAt: plugin.createdAt || Date.now(),
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Could not sync plugin to Firestore:', err);
    }
  }

  // If it's a font, inject it
  if (plugin.category === 'font' && plugin.isEnabled) {
    injectPluginFont(plugin);
  }
}

/**
 * Deletes a custom plugin
 */
export async function removePlugin(pluginId: string): Promise<void> {
  await deletePluginFromDB(pluginId);
  if (auth.currentUser) {
    try {
      await deleteDoc(doc(db, 'plugins', pluginId));
    } catch (err) {
      console.warn('Could not delete plugin from Firestore:', err);
    }
  }
}

/**
 * Toggles a plugin enabled or disabled
 */
export function togglePluginStatus(pluginId: string, isEnabled: boolean): void {
  const disabledIds = getDisabledPluginIds();
  if (isEnabled) {
    disabledIds.delete(pluginId);
  } else {
    disabledIds.add(pluginId);
  }
  localStorage.setItem(DISABLED_PLUGINS_KEY, JSON.stringify(Array.from(disabledIds)));
}

/**
 * Updates dynamic parameters for a plugin
 */
export function updatePluginParams(
  pluginId: string,
  params: Record<string, any>
): void {
  const stored = getStoredPluginParams();
  stored[pluginId] = { ...(stored[pluginId] || {}), ...params };
  localStorage.setItem(USER_PARAMS_KEY, JSON.stringify(stored));
}

/**
 * Exports a plugin package as a JSON file (.lumina-plugin)
 */
export function exportPluginPackage(plugin: LuminaPlugin): void {
  const packageData = {
    schemaVersion: '1.0',
    app: 'Lumina Studio Pro',
    exportedAt: new Date().toISOString(),
    plugin: {
      ...plugin,
      isBuiltin: false,
    },
  };

  const json = JSON.stringify(packageData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${plugin.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.lumina-plugin.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Imports a plugin package from a JSON string or File
 */
export async function importPluginPackage(jsonContent: string): Promise<LuminaPlugin> {
  try {
    const parsed = JSON.parse(jsonContent);
    const raw = parsed.plugin || parsed;

    if (!raw.name || !raw.category) {
      throw new Error('Invalid plugin package: missing name or category.');
    }

    const newPlugin: LuminaPlugin = {
      id: raw.id || `plugin-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: raw.name,
      category: raw.category,
      version: raw.version || '1.0.0',
      author: raw.author || (auth.currentUser?.displayName || 'Community Creator'),
      authorEmail: auth.currentUser?.email || '',
      authorId: auth.currentUser?.uid || '',
      description: raw.description || 'Custom user extension.',
      iconName: raw.iconName || 'Code',
      tags: Array.isArray(raw.tags) ? raw.tags : ['custom', raw.category],
      isBuiltin: false,
      isInstalled: true,
      isEnabled: true,
      rating: 5.0,
      downloadsCount: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      parameters: raw.parameters || [],
      currentParams: raw.currentParams || {},
      code: raw.code || '',
      lutData: raw.lutData,
      aiConfig: raw.aiConfig,
      brushConfig: raw.brushConfig,
      presetData: raw.presetData,
      fontConfig: raw.fontConfig,
      templateData: raw.templateData,
      integrationConfig: raw.integrationConfig,
      documentation: raw.documentation,
    };

    await savePlugin(newPlugin);
    return newPlugin;
  } catch (err: any) {
    throw new Error(`Failed to import plugin: ${err.message}`);
  }
}

/**
 * Subscribes to live Community Cloud Plugins from Firestore
 */
export function subscribeToCommunityPlugins(
  onUpdate: (plugins: LuminaPlugin[]) => void
): () => void {
  try {
    const q = query(collection(db, 'plugins'), where('isPublic', '==', true));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: LuminaPlugin[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as LuminaPlugin);
        });
        onUpdate(list);
      },
      (err) => {
        console.warn('Community plugins subscription notice:', err.message);
        onUpdate([]);
      }
    );
  } catch (err) {
    return () => {};
  }
}

// Helpers
function getDisabledPluginIds(): Set<string> {
  try {
    const saved = localStorage.getItem(DISABLED_PLUGINS_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}

function getStoredPluginParams(): Record<string, Record<string, any>> {
  try {
    const saved = localStorage.getItem(USER_PARAMS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}
