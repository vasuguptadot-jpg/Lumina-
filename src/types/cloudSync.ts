/**
 * Lumina Studio Pro - Production Cloud Synchronization & Multi-Device Types
 * Strict schema for Firestore documents, subcollections, operations, presence, and merge reports.
 */

import {
  AdjustmentSettings,
  ToneCurves,
  HSLSettings,
  CropSettings,
  WatermarkSettings,
  BorderSettings,
  SelectiveMask,
  LayerItem,
  TypographyItem,
  DesignElementItem,
  RetouchStroke,
  ColorManagementSettings,
} from './editor';

export type SyncState = 'SYNCED' | 'SYNCING' | 'OFFLINE' | 'CONFLICT' | 'ERROR';

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface CloudUserIdentity {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
  emailVerified?: boolean;
  tier?: string;
  createdAt?: number;
  lastActive?: number;
  storageUsedBytes?: number;
  storageQuotaBytes?: number;
}

export interface CloudProjectDocument {
  id: string;
  ownerId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  schemaVersion: number;
  revisionId: string;
  lastModifiedBy: {
    uid: string;
    displayName: string | null;
  };
  collaboratorIds: string[];
  collaboratorRoles: Record<string, CollaboratorRole>;
  isPublic: boolean;
  deletedAt: number | null;
  assetStorageRef?: string;
  projectState: {
    settings: AdjustmentSettings;
    toneCurves: ToneCurves;
    hsl: HSLSettings;
    crop: CropSettings;
    watermark: WatermarkSettings;
    border: BorderSettings;
    activePresetId: string | null;
    presetStrength: number;
    layers: LayerItem[];
    masks: SelectiveMask[];
    typography: TypographyItem[];
    designElements: DesignElementItem[];
    retouchStrokes: RetouchStroke[];
    colorManagement?: ColorManagementSettings;
  };
}

export type CloudOpType =
  | 'SET_SETTINGS'
  | 'SET_CURVES'
  | 'SET_HSL'
  | 'SET_CROP'
  | 'ADD_LAYER'
  | 'UPDATE_MASK'
  | 'BATCH_MUTATION';

export interface SyncOperationRecord {
  id: string;
  projectId: string;
  opType: CloudOpType;
  timestamp: number;
  clientVersion: number;
  deviceId: string;
  path: string;
  payload: any;
  userId: string;
  retryCount: number;
  createdAt: number;
}

export interface CloudEditOperation {
  id?: string;
  projectId?: string;
  opType: CloudOpType;
  path: string;
  value?: any;
  payload?: any;
  userId: string;
  userName?: string;
  userAvatar?: string;
  timestamp: number;
  clientVersion?: number;
  baseVersion?: number;
  deviceId?: string;
}

export interface CollaboratorPresence {
  userId: string;
  displayName: string | null;
  photoURL?: string | null;
  email?: string | null;
  role: CollaboratorRole;
  currentTool?: string;
  cursorPosition?: { x: number; y: number };
  lastActive: number;
  isOnline: boolean;
  deviceType: 'desktop' | 'tablet' | 'mobile';
}

export interface OfflineQueueItem {
  id: string;
  projectId: string;
  userId: string;
  createdAt: number;
  action: 'CREATE_PROJECT' | 'UPDATE_SETTINGS' | 'CREATE_SNAPSHOT' | 'SYNC_BATCH' | 'DELETE_PROJECT';
  payload: any;
  baseVersion: number;
  retryCount: number;
  status: 'pending' | 'in_progress' | 'failed' | 'completed';
  lastError?: string;
  lastAttemptAt?: number;
}

export interface ConflictedPropertyDiff {
  propertyPath: string;
  propertyLabel: string;
  baseValue: any;
  localValue: any;
  remoteValue: any;
}

export interface AutoMergedPropertyDiff {
  propertyPath: string;
  propertyLabel: string;
  mergedValue: any;
  source: 'LOCAL' | 'REMOTE';
}

export interface ProjectConflictReport {
  projectId: string;
  projectName: string;
  localVersion: number;
  cloudVersion: number;
  conflictedProperties: ConflictedPropertyDiff[];
  autoMergedProperties: AutoMergedPropertyDiff[];
  baseProject: any;
  localProject: any;
  cloudDocument: CloudProjectDocument;
}

export type ConflictResolutionChoice = 'KEEP_LOCAL' | 'KEEP_CLOUD' | 'SEMANTIC_MERGE' | 'CREATE_COPY';
