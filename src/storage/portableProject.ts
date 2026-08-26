import { Project } from '../types/editor';
import {
  LuminaProjectV3,
  PortableLuminaPackage,
  CURRENT_SCHEMA_VERSION,
  SourceAssetRecord,
} from '../types/projectSchema';
import { migrateToV3 } from './schemaMigration';
import {
  saveLuminaProject,
  saveSourceAsset,
  saveProjectVersionRecord,
  getSourceAsset,
  getProjectVersionRecords,
} from './indexedDbManager';

/**
 * Compute a fast integrity checksum for the payload
 */
function computeChecksum(content: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `crc_${(hash >>> 0).toString(16)}`;
}

/**
 * Cleanse and sanitize rawMetadata based on privacy preferences
 */
function sanitizeMetadataForExport(project: Project) {
  const meta = project.image?.rawMetadata;
  if (!meta) return undefined;

  const privacy = meta.privacy;
  if (privacy?.stripAllMetadataOnExport) {
    return {
      isRaw: meta.isRaw,
    };
  }

  const cleaned = { ...meta };

  if (privacy?.stripGpsOnExport) {
    delete cleaned.gps;
  }

  if (privacy?.copyrightOnlyOnExport) {
    return {
      isRaw: meta.isRaw,
      author: cleaned.author,
      copyright: cleaned.copyright,
      copyrightNotice: cleaned.copyrightNotice,
      rightsUsageTerms: cleaned.rightsUsageTerms,
    };
  }

  return cleaned;
}

/**
 * Export a self-contained portable .lumina file
 */
export async function exportPortableLuminaFile(project: Project): Promise<void> {
  const { canonicalDoc } = migrateToV3(project);

  // 1. Fetch decoupled source asset if needed
  let sourceAssetPayload: PortableLuminaPackage['sourceAsset'] = undefined;
  if (project.image?.originalUrl) {
    sourceAssetPayload = {
      id: canonicalDoc.sourceAssetId,
      filename: project.image.name || `${project.name}.png`,
      mimeType: project.image.format ? `image/${project.image.format}` : 'image/jpeg',
      size: project.image.size || 0,
      base64Data: project.image.originalUrl,
    };
  } else if (canonicalDoc.sourceAssetId) {
    const asset = await getSourceAsset(canonicalDoc.sourceAssetId);
    if (asset?.dataUrl) {
      sourceAssetPayload = {
        id: asset.id,
        filename: asset.filename,
        mimeType: asset.mimeType,
        size: asset.size,
        base64Data: asset.dataUrl,
      };
    }
  }

  // 2. Fetch project versions
  const versions = await getProjectVersionRecords(project.id);

  // 3. Cleanse metadata for privacy compliance
  const sanitizedDoc: LuminaProjectV3 = {
    ...canonicalDoc,
    sourceMetadata: {
      ...canonicalDoc.sourceMetadata,
      rawMetadata: sanitizeMetadataForExport(project),
    },
  };

  // 4. Build package
  const pkgDataWithoutChecksum: Omit<PortableLuminaPackage, 'integrityChecksum'> = {
    format: 'LUMINA_STUDIO_PROJECT',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: Date.now(),
    appVersion: '3.5.0',
    project: sanitizedDoc,
    sourceAsset: sourceAssetPayload,
    versions: versions.length > 0 ? versions : undefined,
    thumbnailDataUrl: project.thumbnailUrl,
  };

  const jsonString = JSON.stringify(pkgDataWithoutChecksum);
  const checksum = computeChecksum(jsonString);

  const fullPackage: PortableLuminaPackage = {
    ...pkgDataWithoutChecksum,
    integrityChecksum: checksum,
  };

  // 5. Trigger download
  const blob = new Blob([JSON.stringify(fullPackage, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeFilename = project.name.replace(/[^\w\d-_.]/g, '_');
  a.download = `${safeFilename}.lumina`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import and validate a .lumina file, restoring project, assets, and version tree
 */
export async function importPortableLuminaFile(file: File): Promise<Project> {
  const text = await file.text();
  let rawJson: any;
  try {
    rawJson = JSON.parse(text);
  } catch {
    throw new Error('Invalid file format: unable to parse JSON.');
  }

  let projectToMigrate: any;
  let sourceAssetData: PortableLuminaPackage['sourceAsset'] | undefined;
  let versions: any[] = [];
  let thumbnailDataUrl: string | undefined;

  // Check if it's a modern PortableLuminaPackage
  if (rawJson.format === 'LUMINA_STUDIO_PROJECT' && rawJson.project) {
    projectToMigrate = rawJson.project;
    sourceAssetData = rawJson.sourceAsset;
    versions = rawJson.versions || [];
    thumbnailDataUrl = rawJson.thumbnailDataUrl;
  } else if (rawJson.id && (rawJson.currentSettings || rawJson.document)) {
    // Legacy direct Project export
    projectToMigrate = rawJson;
  } else {
    throw new Error('Unrecognized Lumina project file structure.');
  }

  // Generate new unique ID to avoid collision with any existing local project
  const newProjectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  projectToMigrate.id = newProjectId;
  projectToMigrate.updatedAt = Date.now();

  const { project, canonicalDoc } = migrateToV3(projectToMigrate);

  // Unpack source asset if packaged
  if (sourceAssetData?.base64Data) {
    const assetId = `asset_${newProjectId}`;
    canonicalDoc.sourceAssetId = assetId;
    project.image.id = assetId;
    project.image.originalUrl = sourceAssetData.base64Data;

    const assetRecord: SourceAssetRecord = {
      id: assetId,
      dataUrl: sourceAssetData.base64Data,
      mimeType: sourceAssetData.mimeType || 'image/jpeg',
      filename: sourceAssetData.filename || `${project.name}.png`,
      size: sourceAssetData.size || sourceAssetData.base64Data.length,
      width: project.image.width || 1920,
      height: project.image.height || 1080,
      createdAt: Date.now(),
      refCount: 1,
    };
    await saveSourceAsset(assetRecord);
  }

  if (thumbnailDataUrl) {
    project.thumbnailUrl = thumbnailDataUrl;
  }

  // Save to IndexedDB
  await saveLuminaProject(project);

  // Restore versions if available
  if (Array.isArray(versions)) {
    for (const v of versions) {
      try {
        await saveProjectVersionRecord({
          ...v,
          id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          projectId: newProjectId,
        });
      } catch (e) {
        console.warn('Failed to restore version snapshot:', e);
      }
    }
  }

  return project;
}
