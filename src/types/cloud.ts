import {
  Project,
  FilterPreset,
  EditHistorySnapshot,
  AdjustmentSettings,
  ToneCurves,
  HSLSettings,
} from './editor';

export interface CloudUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  tier: 'Free' | 'Pro Studio' | 'Enterprise Cloud';
  storageUsedBytes: number;
  storageQuotaBytes: number;
  createdAt: number;
  lastActive: number;
}

export interface CloudProjectRecord {
  id: string;
  ownerId: string;
  ownerEmail?: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  revision: number;
  isPublic: boolean;
  shareCode?: string;
  collaborators: string[];
  thumbnailUrl?: string;
  projectData: Project;
  deviceOrigin?: string;
}

export interface CloudVersionSnapshot {
  id: string;
  projectId: string;
  versionNumber: number;
  label: string;
  authorId: string;
  authorName: string;
  timestamp: number;
  thumbnailUrl?: string;
  snapshot: EditHistorySnapshot;
}

export interface CloudPresetRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  preset: FilterPreset;
  isPublic: boolean;
  downloadsCount: number;
  likesCount: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export type CloudRenderJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface CloudRenderJob {
  id: string;
  projectId: string;
  userId: string;
  projectName: string;
  outputFormat: 'png' | 'jpeg' | 'webp' | 'tiff' | 'dng' | 'pdf' | 'psd';
  resolution: { width: number; height: number; scale: number };
  quality: number;
  colorSpace: 'sRGB' | 'Display P3' | 'Adobe RGB' | 'ProPhoto RGB';
  bitDepth: '8-bit' | '16-bit' | '32-bit Float';
  status: CloudRenderJobStatus;
  progress: number;
  createdAt: number;
  completedAt?: number;
  downloadUrl?: string;
  fileSizeBytes?: number;
  renderEngine: 'Lumina-Wasm-Node-v2' | 'Cloud-Neural-HDR-GPU' | 'Cluster-Lossless-Tiff';
  error?: string;
}

export interface CloudSyncTelemetry {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  pendingChangesCount: number;
  activeDeviceId: string;
  connectedDevices: Array<{
    deviceId: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    lastSeen: number;
    currentProjectName?: string;
  }>;
}
