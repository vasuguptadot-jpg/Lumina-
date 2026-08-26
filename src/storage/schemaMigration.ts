import { Project, EditHistorySnapshot, ImageFile } from '../types/editor';
import {
  LuminaProjectV3,
  ProjectDocumentState,
  CURRENT_SCHEMA_VERSION,
} from '../types/projectSchema';
import {
  DEFAULT_ADJUSTMENTS,
  DEFAULT_CROP,
  DEFAULT_HSL,
  DEFAULT_PROJECT_STATE,
  DEFAULT_TONE_CURVES,
  DEFAULT_WATERMARK,
  DEFAULT_BORDER,
} from '../engine/defaultSettings';

/**
 * Migration Result
 */
export interface MigrationResult {
  project: Project;
  canonicalDoc: LuminaProjectV3;
  migrated: boolean;
  fromVersion: number;
  toVersion: number;
}

/**
 * Detect the schema version of an incoming raw project JSON object
 */
export function detectSchemaVersion(raw: any): number {
  if (!raw || typeof raw !== 'object') return 0;
  if (raw.schemaVersion === 3) return 3;
  if (raw.schemaVersion === 2) return 2;
  if (raw.schemaVersion === 1) return 1;
  // If it's a legacy Lumina Project object with image.originalUrl and currentSettings
  if (raw.id && (raw.image || raw.currentSettings)) {
    return 1;
  }
  return 0;
}

/**
 * Validate and sanitize document state, ensuring no undefined fields cause runtime breaks
 */
export function sanitizeDocumentState(doc?: Partial<ProjectDocumentState>): ProjectDocumentState {
  return {
    currentSettings: {
      ...DEFAULT_ADJUSTMENTS,
      ...(doc?.currentSettings || {}),
    },
    crop: {
      ...DEFAULT_CROP,
      ...(doc?.crop || {}),
    },
    toneCurves: {
      ...DEFAULT_TONE_CURVES,
      ...(doc?.toneCurves || {}),
      master: doc?.toneCurves?.master || DEFAULT_TONE_CURVES.master,
      red: doc?.toneCurves?.red || DEFAULT_TONE_CURVES.red,
      green: doc?.toneCurves?.green || DEFAULT_TONE_CURVES.green,
      blue: doc?.toneCurves?.blue || DEFAULT_TONE_CURVES.blue,
    },
    hsl: {
      ...DEFAULT_HSL,
      ...(doc?.hsl || {}),
    },
    activePresetId: doc?.activePresetId ?? null,
    presetStrength: doc?.presetStrength ?? 100,
    watermark: {
      ...DEFAULT_WATERMARK,
      ...(doc?.watermark || {}),
    },
    border: {
      ...DEFAULT_BORDER,
      ...(doc?.border || {}),
    },
    masks: Array.isArray(doc?.masks) ? doc.masks : [],
    layers: Array.isArray(doc?.layers) ? doc.layers : [],
    typography: Array.isArray(doc?.typography) ? doc.typography : [],
    designElements: Array.isArray(doc?.designElements) ? doc.designElements : [],
    retouchStrokes: Array.isArray(doc?.retouchStrokes) ? doc.retouchStrokes : [],
    collage: doc?.collage ? { ...doc.collage } : undefined,
    drawingStrokes: Array.isArray(doc?.drawingStrokes) ? doc.drawingStrokes : [],
    colorManagement: doc?.colorManagement ? { ...doc.colorManagement } : undefined,
    historyIndex: typeof doc?.historyIndex === 'number' ? doc.historyIndex : 0,
  };
}

/**
 * Convert any legacy or modern Project object into a canonical LuminaProjectV3
 */
export function migrateToV3(raw: any, fallbackSourceAssetId?: string): MigrationResult {
  const fromVersion = detectSchemaVersion(raw);
  let migrated = fromVersion < CURRENT_SCHEMA_VERSION;

  const id: string = raw.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const name: string = raw.name || 'Untitled Project';
  const createdAt: number = Number(raw.createdAt) || Date.now();
  const updatedAt: number = Number(raw.updatedAt) || Date.now();
  const revision: number = Number(raw.revision || raw.cloudRevision || 1);

  // Extract source asset metadata & ID
  const sourceAssetId =
    raw.sourceAssetId ||
    fallbackSourceAssetId ||
    (raw.image?.id ? `asset_${raw.image.id}` : `asset_${id}`);

  const sourceMetadata = {
    filename: raw.sourceMetadata?.filename || raw.image?.name || `${name}.png`,
    mimeType:
      raw.sourceMetadata?.mimeType ||
      (raw.image?.format ? `image/${raw.image.format}` : 'image/jpeg'),
    width: Number(raw.sourceMetadata?.width || raw.image?.width) || 1920,
    height: Number(raw.sourceMetadata?.height || raw.image?.height) || 1080,
    format: raw.sourceMetadata?.format || raw.image?.format || 'jpeg',
    size: Number(raw.sourceMetadata?.size || raw.image?.size) || 0,
    rawMetadata: raw.sourceMetadata?.rawMetadata || raw.image?.rawMetadata,
  };

  // Build document state
  let rawDoc: Partial<ProjectDocumentState> = {};
  if (raw.document) {
    rawDoc = raw.document;
  } else {
    // Extract from v1/v2 flat project properties
    rawDoc = {
      currentSettings: raw.currentSettings,
      crop: raw.crop,
      toneCurves: raw.toneCurves,
      hsl: raw.hsl,
      activePresetId: raw.activePresetId,
      presetStrength: raw.presetStrength,
      watermark: raw.watermark,
      border: raw.border,
      masks: raw.masks,
      layers: raw.layers,
      typography: raw.typography,
      designElements: raw.designElements,
      retouchStrokes: raw.retouchStrokes,
      collage: raw.collage,
      drawingStrokes: raw.drawingStrokes,
      colorManagement: raw.colorManagement,
      historyIndex: raw.historyIndex ?? 0,
    };
  }

  const documentState = sanitizeDocumentState(rawDoc);

  // History stack sanitation
  let history: EditHistorySnapshot[] = [];
  if (Array.isArray(raw.history) && raw.history.length > 0) {
    history = raw.history.map((h: any, idx: number) => ({
      id: h.id || `step_${idx}_${Date.now()}`,
      timestamp: Number(h.timestamp) || createdAt,
      label: h.label || `Edit Step ${idx + 1}`,
      settings: { ...DEFAULT_ADJUSTMENTS, ...(h.settings || {}) },
      toneCurves: { ...DEFAULT_TONE_CURVES, ...(h.toneCurves || {}) },
      hsl: { ...DEFAULT_HSL, ...(h.hsl || {}) },
      crop: { ...DEFAULT_CROP, ...(h.crop || {}) },
      activePresetId: h.activePresetId ?? null,
      presetStrength: h.presetStrength ?? 100,
      watermark: { ...DEFAULT_WATERMARK, ...(h.watermark || {}) },
      border: { ...DEFAULT_BORDER, ...(h.border || {}) },
      masks: Array.isArray(h.masks) ? h.masks : [],
      typography: Array.isArray(h.typography) ? h.typography : [],
      designElements: Array.isArray(h.designElements) ? h.designElements : [],
      retouchStrokes: Array.isArray(h.retouchStrokes) ? h.retouchStrokes : [],
      drawingStrokes: Array.isArray(h.drawingStrokes) ? h.drawingStrokes : [],
      collage: h.collage ? { ...h.collage } : undefined,
    }));
  } else {
    // Create initial history step
    history = [
      {
        id: 'step_init',
        timestamp: createdAt,
        label: 'Initial State',
        settings: { ...documentState.currentSettings },
        toneCurves: { ...documentState.toneCurves },
        hsl: { ...documentState.hsl },
        crop: { ...documentState.crop },
        activePresetId: documentState.activePresetId,
        presetStrength: documentState.presetStrength,
        watermark: { ...documentState.watermark },
        border: { ...documentState.border },
        masks: [...documentState.masks],
      },
    ];
  }

  // Snapshots
  const snapshots = Array.isArray(raw.snapshots)
    ? raw.snapshots.map((s: any) => ({
        id: s.id || `snap_${Date.now()}`,
        name: s.name || 'Saved Snapshot',
        timestamp: Number(s.timestamp) || Date.now(),
        description: s.description || '',
        thumbnailDataUrl: s.thumbnailDataUrl || s.thumbnailUrl,
        data: s.data || {
          id: s.id,
          timestamp: s.timestamp,
          label: s.name,
          settings: { ...documentState.currentSettings },
          toneCurves: { ...documentState.toneCurves },
          hsl: { ...documentState.hsl },
          crop: { ...documentState.crop },
          watermark: { ...documentState.watermark },
          border: { ...documentState.border },
          masks: [...documentState.masks],
        },
      }))
    : [];

  const canonicalDoc: LuminaProjectV3 = {
    schemaVersion: 3,
    id,
    name,
    createdAt,
    updatedAt,
    revision,
    sourceAssetId,
    sourceMetadata,
    thumbnailId: raw.thumbnailId,
    thumbnailDataUrl: raw.thumbnailDataUrl || raw.thumbnailUrl,
    document: documentState,
    history,
    snapshots,
    cloudSyncStatus: raw.cloudSyncStatus || 'local-only',
    cloudRevision: raw.cloudRevision || revision,
  };

  // Construct in-memory Project for existing UI consumers
  const image: ImageFile = {
    id: raw.image?.id || sourceAssetId,
    name: sourceMetadata.filename,
    originalUrl: raw.image?.originalUrl || raw.originalUrl || '',
    width: sourceMetadata.width,
    height: sourceMetadata.height,
    format: sourceMetadata.format,
    size: sourceMetadata.size,
    rawMetadata: sourceMetadata.rawMetadata,
    createdAt,
  };

  const runtimeProject: Project = {
    ...DEFAULT_PROJECT_STATE,
    id,
    name,
    createdAt,
    updatedAt,
    image,
    currentSettings: documentState.currentSettings,
    crop: documentState.crop,
    toneCurves: documentState.toneCurves,
    hsl: documentState.hsl,
    activePresetId: documentState.activePresetId,
    presetStrength: documentState.presetStrength,
    watermark: documentState.watermark,
    border: documentState.border,
    masks: documentState.masks,
    layers: documentState.layers,
    typography: documentState.typography,
    designElements: documentState.designElements,
    retouchStrokes: documentState.retouchStrokes,
    collage: documentState.collage,
    drawingStrokes: documentState.drawingStrokes,
    colorManagement: documentState.colorManagement,
    history,
    historyIndex: Math.min(documentState.historyIndex, Math.max(0, history.length - 1)),
    snapshots,
    cloudSyncStatus: canonicalDoc.cloudSyncStatus,
    cloudRevision: canonicalDoc.cloudRevision,
    thumbnailUrl: canonicalDoc.thumbnailDataUrl,
  };

  return {
    project: runtimeProject,
    canonicalDoc,
    migrated,
    fromVersion,
    toVersion: CURRENT_SCHEMA_VERSION,
  };
}

/**
 * Converts a runtime Project back to a canonical LuminaProjectV3 for storage
 */
export function projectToV3Document(
  project: Project,
  sourceAssetId?: string,
  thumbnailDataUrl?: string
): LuminaProjectV3 {
  const assetId = sourceAssetId || `asset_${project.image?.id || project.id}`;

  const docState: ProjectDocumentState = sanitizeDocumentState({
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

  return {
    schemaVersion: 3,
    id: project.id,
    name: project.name,
    createdAt: project.createdAt || Date.now(),
    updatedAt: project.updatedAt || Date.now(),
    revision: project.cloudRevision || 1,
    sourceAssetId: assetId,
    sourceMetadata: {
      filename: project.image?.name || `${project.name}.png`,
      mimeType: project.image?.format ? `image/${project.image.format}` : 'image/jpeg',
      width: project.image?.width || 1920,
      height: project.image?.height || 1080,
      format: project.image?.format || 'jpeg',
      size: project.image?.size || 0,
      rawMetadata: project.image?.rawMetadata,
    },
    thumbnailDataUrl: thumbnailDataUrl || project.thumbnailUrl,
    document: docState,
    history: project.history || [],
    snapshots: project.snapshots || [],
    cloudSyncStatus: project.cloudSyncStatus || 'local-only',
    cloudRevision: project.cloudRevision || 1,
  };
}
