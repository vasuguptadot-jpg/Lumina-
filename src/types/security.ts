export type LocalProcessingMode = 'local_only' | 'hybrid_accelerated' | 'cloud_gpu';

export interface PrivacyPreferences {
  localOnlyMode: boolean;
  zeroCloudRetention: boolean;
  noAiTrainingConsent: boolean;
  stripGpsOnExport: boolean;
  stripCameraSerialOnExport: boolean;
  stripAuthorMetadataOnExport: boolean;
  obfuscateTimestampOnExport: boolean;
  autoBlurFacesOnPublicExport: boolean;
  embedC2paAuthenticity: boolean;
  embedInvisibleForensicWatermark: boolean;
  e2eeEnabled: boolean;
  e2eePassphraseHash?: string;
  vaultPinHash?: string;
  vaultAutoLockMinutes: number; // 0 = disabled, 5, 15, 30, 60
}

export type AiFeatureConsent =
  | 'ai_vision_analysis'
  | 'ai_sky_replacement'
  | 'ai_inpainting_retouch'
  | 'ai_super_resolution'
  | 'ai_lighting_relight'
  | 'ai_auto_enhance'
  | 'ai_depth_generation';

export interface AiConsentPolicy {
  feature: AiFeatureConsent;
  label: string;
  description: string;
  granted: boolean;
  lastUpdated: number;
}

export interface SecurityAuditLog {
  id: string;
  action:
    | 'vault_unlocked'
    | 'vault_locked'
    | 'e2ee_key_generated'
    | 'e2ee_cloud_sync'
    | 'cloud_purge_executed'
    | 'ai_consent_granted'
    | 'ai_consent_revoked'
    | 'secure_share_created'
    | 'secure_share_revoked'
    | 'exif_sanitized'
    | 'face_anonymized'
    | 'forensic_watermark_embedded'
    | 'export_sanitized';
  details: string;
  timestamp: number;
  ipHash?: string;
  severity: 'info' | 'warning' | 'security';
}

export interface SecureShareLink {
  id: string;
  projectId: string;
  projectName: string;
  token: string;
  passwordProtected: boolean;
  passwordHash?: string;
  expiresAt: number; // Unix timestamp
  allowDownload: boolean;
  allowComments: boolean;
  enforceWatermark: boolean;
  viewCount: number;
  createdAt: number;
  revoked: boolean;
}

export interface EncryptionKeyBundle {
  algorithm: 'AES-GCM-256';
  keySalt: string;
  iv: string;
  createdAt: number;
  fingerprint: string;
}

export interface C2paManifest {
  claimGenerator: string;
  title: string;
  format: string;
  instanceId: string;
  claimTimestamp: string;
  assertions: {
    actions: Array<{ action: string; softwareAgent: string; when: string }>;
    dataHash: string;
    aiTrainingOptOut: boolean;
    digitalSourceType: string;
  };
  signature: string;
}
