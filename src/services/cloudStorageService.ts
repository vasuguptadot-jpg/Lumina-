/**
 * Lumina Studio Pro - Production Firebase Storage Asset Service
 * Handles non-destructive large asset uploads (RAW files, high-res masters, thumbnails, exported bundles).
 * Keeps heavy binary payloads out of Firestore documents (strictly storing storage references).
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  UploadTask,
} from 'firebase/storage';
import { storage } from './firebase';

export interface AssetUploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progressPercent: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
}

export interface StoredAssetMetadata {
  storagePath: string;
  downloadUrl: string;
  sizeBytes: number;
  mimeType: string;
  checksumSha256?: string;
  uploadedAt: number;
}

export class CloudStorageService {
  private activeUploads = new Map<string, UploadTask>();

  /**
   * Calculates SHA-256 checksum of an ArrayBuffer / Blob for integrity & deduplication
   */
  public async computeChecksum(blobOrBuffer: Blob | ArrayBuffer): Promise<string> {
    try {
      const buffer = blobOrBuffer instanceof Blob ? await blobOrBuffer.arrayBuffer() : blobOrBuffer;
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return 'sha256_uncomputed';
    }
  }

  /**
   * Resumable upload of image or RAW file to Firebase Storage
   * Path format: `users/{userId}/projects/{projectId}/assets/{assetId}`
   */
  public async uploadProjectAsset(
    userId: string,
    projectId: string,
    assetId: string,
    fileOrBlob: File | Blob,
    onProgress?: (progress: AssetUploadProgress) => void
  ): Promise<StoredAssetMetadata> {
    const storagePath = `users/${userId}/projects/${projectId}/assets/${assetId}`;
    const storageRef = ref(storage, storagePath);

    const checksum = await this.computeChecksum(fileOrBlob);
    const mimeType = fileOrBlob.type || 'application/octet-stream';
    const sizeBytes = fileOrBlob.size;

    const metadata = {
      contentType: mimeType,
      customMetadata: {
        userId,
        projectId,
        assetId,
        sha256: checksum,
        uploadedAt: Date.now().toString(),
      },
    };

    const uploadTask = uploadBytesResumable(storageRef, fileOrBlob, metadata);
    const uploadKey = `${projectId}_${assetId}`;
    this.activeUploads.set(uploadKey, uploadTask);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progressPercent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          onProgress?.({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progressPercent,
            state: snapshot.state as any,
          });
        },
        (error) => {
          this.activeUploads.delete(uploadKey);
          reject(new Error(`Storage upload failed: ${error.message}`));
        },
        async () => {
          this.activeUploads.delete(uploadKey);
          try {
            const downloadUrl = await getDownloadURL(storageRef);
            resolve({
              storagePath,
              downloadUrl,
              sizeBytes,
              mimeType,
              checksumSha256: checksum,
              uploadedAt: Date.now(),
            });
          } catch (err: any) {
            reject(new Error(`Failed to retrieve download URL: ${err.message}`));
          }
        }
      );
    });
  }

  /**
   * Upload thumbnail JPEG to `users/{userId}/projects/{projectId}/thumbnail.jpg`
   */
  public async uploadProjectThumbnail(
    userId: string,
    projectId: string,
    thumbnailBlob: Blob
  ): Promise<string> {
    const storagePath = `users/${userId}/projects/${projectId}/thumbnail.jpg`;
    const storageRef = ref(storage, storagePath);

    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: { userId, projectId, type: 'thumbnail' },
    };

    const uploadTask = uploadBytesResumable(storageRef, thumbnailBlob, metadata);
    await uploadTask;
    return getDownloadURL(storageRef);
  }

  /**
   * Pauses an ongoing asset upload
   */
  public pauseUpload(projectId: string, assetId: string): boolean {
    const key = `${projectId}_${assetId}`;
    const task = this.activeUploads.get(key);
    if (task) {
      return task.pause();
    }
    return false;
  }

  /**
   * Resumes a paused asset upload
   */
  public resumeUpload(projectId: string, assetId: string): boolean {
    const key = `${projectId}_${assetId}`;
    const task = this.activeUploads.get(key);
    if (task) {
      return task.resume();
    }
    return false;
  }

  /**
   * Cancels an ongoing asset upload
   */
  public cancelUpload(projectId: string, assetId: string): boolean {
    const key = `${projectId}_${assetId}`;
    const task = this.activeUploads.get(key);
    if (task) {
      const canceled = task.cancel();
      this.activeUploads.delete(key);
      return canceled;
    }
    return false;
  }

  /**
   * Deletes all storage assets associated with a project when permanently purged
   */
  public async deleteProjectAssets(userId: string, projectId: string): Promise<void> {
    const folderPath = `users/${userId}/projects/${projectId}/assets`;
    const folderRef = ref(storage, folderPath);

    try {
      const fileList = await listAll(folderRef);
      const deletePromises = fileList.items.map((itemRef) => deleteObject(itemRef));
      await Promise.all(deletePromises);

      // Delete thumbnail if present
      const thumbRef = ref(storage, `users/${userId}/projects/${projectId}/thumbnail.jpg`);
      await deleteObject(thumbRef).catch(() => {});
    } catch (err: any) {
      console.warn('[Lumina Storage] Clean assets notice:', err.message);
    }
  }
}

export const cloudStorageService = new CloudStorageService();
