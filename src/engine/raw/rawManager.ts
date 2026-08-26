/**
 * Lumina Studio Pro - Central RAW Engine Manager
 * High-level unified API for RAW ingestion, sensor buffer caching, and multi-threaded development.
 */

import {
  RawSensorMetadata,
  RawSensorBuffer,
  RawDevelopResult,
} from './rawTypes';
import { RawDevelopSettings, WorkingColorSpace } from '../../types/editor';
import { rawWorkerOrchestrator } from './rawWorkerManager';

export class RawManager {
  private activeSensorBuffers = new Map<string, RawSensorBuffer>();
  private activeMetadataMap = new Map<string, RawSensorMetadata>();

  /**
   * Decodes a RAW file from ArrayBuffer / File via dedicated background Web Workers
   */
  public async decodeRaw(
    file: File | { name: string; buffer: ArrayBuffer },
    settings?: RawDevelopSettings,
    targetColorSpace: WorkingColorSpace = 'srgb',
    onProgress?: (stage: string, percent: number) => void
  ): Promise<RawDevelopResult> {
    const fileName = file.name;
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    const buffer = 'buffer' in file ? file.buffer : await file.arrayBuffer();

    const result = await rawWorkerOrchestrator.decodeRawFile(
      buffer,
      fileName,
      extension,
      settings,
      targetColorSpace,
      onProgress
    );

    if (result.sensorBuffer) {
      this.activeSensorBuffers.set(fileName, result.sensorBuffer);
    }
    this.activeMetadataMap.set(fileName, result.metadata);

    return result;
  }

  /**
   * Re-develops cached sensor buffer using parallel tiled workers
   */
  public async developRawAsync(
    fileNameOrBuffer: string | RawSensorBuffer,
    settings: RawDevelopSettings,
    targetColorSpace: WorkingColorSpace = 'srgb',
    onProgress?: (stage: string, percent: number) => void
  ): Promise<{ imageData: ImageData; width: number; height: number; timeMs: number } | null> {
    let sensorBuffer: RawSensorBuffer | undefined;

    if (typeof fileNameOrBuffer === 'string') {
      sensorBuffer = this.activeSensorBuffers.get(fileNameOrBuffer);
    } else {
      sensorBuffer = fileNameOrBuffer;
    }

    if (!sensorBuffer) return null;

    return rawWorkerOrchestrator.developTiledSensorBuffer(
      sensorBuffer,
      settings,
      targetColorSpace,
      onProgress
    );
  }

  public getRawMetadata(fileName: string): RawSensorMetadata | undefined {
    return this.activeMetadataMap.get(fileName);
  }

  public getSensorData(fileName: string): RawSensorBuffer | undefined {
    return this.activeSensorBuffers.get(fileName);
  }

  public cancelPendingJobs(): void {
    rawWorkerOrchestrator.cancelPendingRAWJobs();
  }

  public getWorkerStats() {
    return rawWorkerOrchestrator.getStats();
  }

  public release(fileName?: string): void {
    if (fileName) {
      this.activeSensorBuffers.delete(fileName);
      this.activeMetadataMap.delete(fileName);
    } else {
      this.activeSensorBuffers.clear();
      this.activeMetadataMap.clear();
    }
  }
}

export const rawManager = new RawManager();
