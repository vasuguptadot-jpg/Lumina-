import {
  Project,
  ImageFile,
  AdjustmentSettings,
  CropSettings,
  ToneCurves,
  HSLSettings,
  WatermarkSettings,
  BorderSettings,
  SelectiveMask,
  LayerItem,
  TypographyItem,
  DesignElementItem,
  RetouchStroke,
  CollageSettings,
  DrawingStroke,
  ColorManagementSettings,
  EditHistorySnapshot,
  RawMetadata,
} from './editor';

export const CURRENT_SCHEMA_VERSION = 3;

/**
 * Normalized source asset entry stored in IndexedDB 'source_assets'
 */
export interface SourceAssetRecord {
  id: string;
  blob?: Blob;
  dataUrl?: string;
  mimeType: string;
  filename: string;
  size: number;
  width: number;
  height: number;
  hash?: string;
  createdAt: number;
  refCount: number;
}

/**
 * Thumbnail record stored in IndexedDB 'thumbnails'
 */
export interface ThumbnailRecord {
  id: string;
  projectId: string;
  dataUrl: string;
  width: number;
  height: number;
  createdAt: number;
}

/**
 * Explicit project version snapshot record stored in IndexedDB 'project_versions'
 */
export interface ProjectVersionRecord {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  timestamp: number;
  thumbnailDataUrl?: string;
  schemaVersion: number;
  revision: number;
  document: ProjectDocumentState;
  author?: string;
}

/**
 * Lightweight crash recovery snapshot stored in IndexedDB 'recovery_snapshots'
 */
export interface RecoverySnapshotRecord {
  id: string;
  projectId: string;
  projectName: string;
  timestamp: number;
  revision: number;
  sourceAssetId: string;
  thumbnailDataUrl?: string;
  schemaVersion: number;
  document: ProjectDocumentState;
  changeSummary?: string;
}

/**
 * Lightweight journal entry for crash-proof operation logs
 */
export interface RecoveryJournalEntry {
  id: string;
  projectId: string;
  timestamp: number;
  action: string;
  revision: number;
  deltaSummary?: string;
}

/**
 * Non-destructive document state isolated from binary image payload
 */
export interface ProjectDocumentState {
  currentSettings: AdjustmentSettings;
  crop: CropSettings;
  toneCurves: ToneCurves;
  hsl: HSLSettings;
  activePresetId: string | null;
  presetStrength: number;
  watermark: WatermarkSettings;
  border: BorderSettings;
  masks: SelectiveMask[];
  layers?: LayerItem[];
  typography?: TypographyItem[];
  designElements?: DesignElementItem[];
  retouchStrokes?: RetouchStroke[];
  collage?: CollageSettings;
  drawingStrokes?: DrawingStroke[];
  colorManagement?: ColorManagementSettings;
  historyIndex: number;
}

/**
 * Canonical Version 3 Lumina Project Document
 */
export interface LuminaProjectV3 {
  schemaVersion: 3;
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  revision: number;
  sourceAssetId: string;
  sourceMetadata: {
    filename: string;
    mimeType: string;
    width: number;
    height: number;
    format: string;
    size: number;
    rawMetadata?: RawMetadata;
  };
  thumbnailId?: string;
  thumbnailDataUrl?: string;
  document: ProjectDocumentState;
  history: EditHistorySnapshot[];
  snapshots: Array<{
    id: string;
    name: string;
    timestamp: number;
    data: EditHistorySnapshot;
    description?: string;
    thumbnailDataUrl?: string;
  }>;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline' | 'local-only';
  cloudRevision: number;
}

/**
 * Dirty State of current active project
 */
export type DirtyState =
  | 'clean'
  | 'dirty'
  | 'saving'
  | 'saved'
  | 'save_failed'
  | 'conflict'
  | 'recoverable';

/**
 * Detailed Storage Quota and Breakdown info
 */
export interface StorageQuotaInfo {
  supported: boolean;
  usedBytes: number;
  quotaBytes: number;
  percentUsed: number;
  projectsCount: number;
  sourceAssetsCount: number;
  snapshotsCount: number;
  recoverySnapshotsCount: number;
  thumbnailsCount: number;
  largestProjects: Array<{
    id: string;
    name: string;
    sizeBytes: number;
    updatedAt: number;
    hasSource: boolean;
  }>;
}

/**
 * Portable .lumina export package
 */
export interface PortableLuminaPackage {
  format: 'LUMINA_STUDIO_PROJECT';
  schemaVersion: number;
  exportedAt: number;
  appVersion: string;
  project: LuminaProjectV3;
  sourceAsset?: {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    base64Data: string;
  };
  versions?: ProjectVersionRecord[];
  thumbnailDataUrl?: string;
  integrityChecksum: string;
}

/**
 * Multi-tab communication message
 */
export interface TabSyncMessage {
  type: 'PROJECT_UPDATED' | 'PROJECT_SAVING' | 'PROJECT_DELETED' | 'HEARTBEAT';
  tabId: string;
  projectId: string;
  projectName?: string;
  revision: number;
  timestamp: number;
}
