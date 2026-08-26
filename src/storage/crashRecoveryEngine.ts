import { Project } from '../types/editor';
import {
  RecoverySnapshotRecord,
  CURRENT_SCHEMA_VERSION,
  LuminaProjectV3,
} from '../types/projectSchema';
import {
  saveRecoverySnapshotRecord,
  getAllRecoverySnapshots,
  deleteRecoverySnapshotRecord,
  clearRecoverySnapshotsForProject,
  getSourceAsset,
  saveLuminaProject,
  getLuminaProjectById,
} from './indexedDbManager';

export { clearRecoverySnapshotsForProject };
import { sanitizeDocumentState, migrateToV3 } from './schemaMigration';

/**
 * Capture a lightweight crash recovery snapshot of the currently active project
 */
export async function createRecoverySnapshot(
  project: Project,
  changeSummary?: string
): Promise<void> {
  if (!project.id) return;

  const docState = sanitizeDocumentState({
    currentSettings: project.currentSettings,
    crop: project.crop,
    toneCurves: project.toneCurves,
    hsl: project.hsl,
    activePresetId: project.activePresetId,
    presetStrength: project.presetStrength,
    watermark: project.watermark,
    border: project.border,
    masks: project.masks,
    layers: project.layers,
    typography: project.typography,
    designElements: project.designElements,
    retouchStrokes: project.retouchStrokes,
    collage: project.collage,
    drawingStrokes: project.drawingStrokes,
    colorManagement: project.colorManagement,
    historyIndex: project.historyIndex ?? 0,
  });

  const snapshot: RecoverySnapshotRecord = {
    id: `rec_${project.id}_${Date.now()}`,
    projectId: project.id,
    projectName: project.name,
    timestamp: Date.now(),
    revision: (project.cloudRevision || 1) + 1,
    sourceAssetId: `asset_${project.image?.id || project.id}`,
    thumbnailDataUrl: project.thumbnailUrl,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    document: docState,
    changeSummary: changeSummary || 'Autosaved in-flight editing state',
  };

  await saveRecoverySnapshotRecord(snapshot);
}

/**
 * Scan for any recovery snapshots that represent uncommitted crash states
 */
export async function checkForRecoverableProjects(): Promise<
  Array<{ snapshot: RecoverySnapshotRecord; existingProject: Project | null }>
> {
  const allSnapshots = await getAllRecoverySnapshots();
  if (!allSnapshots || allSnapshots.length === 0) return [];

  // Group by projectId and find the latest snapshot for each project
  const latestByProject = new Map<string, RecoverySnapshotRecord>();
  for (const s of allSnapshots) {
    const existing = latestByProject.get(s.projectId);
    if (!existing || s.timestamp > existing.timestamp) {
      latestByProject.set(s.projectId, s);
    }
  }

  const results: Array<{
    snapshot: RecoverySnapshotRecord;
    existingProject: Project | null;
  }> = [];

  for (const [projectId, snapshot] of latestByProject.entries()) {
    const existingProject = await getLuminaProjectById(projectId);
    // If no existing project or recovery snapshot is newer by more than 2 seconds
    const isNewer =
      !existingProject || snapshot.timestamp > (existingProject.updatedAt || 0) + 2000;

    if (isNewer) {
      results.push({ snapshot, existingProject });
    }
  }

  return results;
}

/**
 * Reconstruct a runtime Project from a recovery snapshot
 */
export async function restoreProjectFromRecovery(
  snapshot: RecoverySnapshotRecord,
  asNewBranch = false
): Promise<Project> {
  const rawProjectDoc: Partial<LuminaProjectV3> = {
    schemaVersion: 3,
    id: asNewBranch ? `proj_recovered_${Date.now()}` : snapshot.projectId,
    name: asNewBranch ? `${snapshot.projectName} (Recovered)` : snapshot.projectName,
    createdAt: Date.now(),
    updatedAt: snapshot.timestamp,
    revision: snapshot.revision,
    sourceAssetId: snapshot.sourceAssetId,
    sourceMetadata: {
      filename: `${snapshot.projectName}.png`,
      mimeType: 'image/jpeg',
      width: 1920,
      height: 1080,
      format: 'jpeg',
      size: 0,
    },
    document: snapshot.document,
    history: [
      {
        id: 'step_recovered',
        timestamp: snapshot.timestamp,
        label: `Crash Recovery Restore (${new Date(snapshot.timestamp).toLocaleTimeString()})`,
        settings: { ...snapshot.document.currentSettings },
        toneCurves: { ...snapshot.document.toneCurves },
        hsl: { ...snapshot.document.hsl },
        crop: { ...snapshot.document.crop },
        activePresetId: snapshot.document.activePresetId,
        presetStrength: snapshot.document.presetStrength,
        watermark: { ...snapshot.document.watermark },
        border: { ...snapshot.document.border },
        masks: [...(snapshot.document.masks || [])],
        typography: [...(snapshot.document.typography || [])],
        designElements: [...(snapshot.document.designElements || [])],
        retouchStrokes: [...(snapshot.document.retouchStrokes || [])],
        drawingStrokes: [...(snapshot.document.drawingStrokes || [])],
      },
    ],
    snapshots: [],
    cloudSyncStatus: 'local-only',
    cloudRevision: snapshot.revision,
    thumbnailDataUrl: snapshot.thumbnailDataUrl,
  };

  const { project } = migrateToV3(rawProjectDoc);

  // Fetch source asset binary
  if (snapshot.sourceAssetId) {
    const asset = await getSourceAsset(snapshot.sourceAssetId);
    if (asset?.dataUrl) {
      project.image.originalUrl = asset.dataUrl;
      project.image.width = asset.width;
      project.image.height = asset.height;
    }
  }

  // Save the restored project as current canonical state
  await saveLuminaProject(project);

  // Clean up recovery snapshots for this project
  await clearRecoverySnapshotsForProject(snapshot.projectId);

  return project;
}

/**
 * Discard recovery snapshot
 */
export async function discardRecoverySnapshot(id: string): Promise<void> {
  await deleteRecoverySnapshotRecord(id);
}

/**
 * Discard all recovery snapshots for a project
 */
export async function discardAllRecoveryForProject(projectId: string): Promise<void> {
  await clearRecoverySnapshotsForProject(projectId);
}
