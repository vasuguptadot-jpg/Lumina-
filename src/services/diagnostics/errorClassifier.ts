/**
 * Lumina Studio Pro - Error Classification & Failure Stage Mapping
 * Phase 11 Crash Diagnostics
 */

export type FailureClassification =
  | 'RAW_DECODE_FAILURE'
  | 'WORKER_FAILURE'
  | 'MEMORY_PRESSURE'
  | 'EXPORT_FAILURE'
  | 'INDEXEDDB_FAILURE'
  | 'FIREBASE_FAILURE'
  | 'STORAGE_FAILURE'
  | 'AUTH_FAILURE'
  | 'SYNC_CONFLICT'
  | 'CORRUPTED_PROJECT';

export interface ClassifiedDiagnosticError {
  classification: FailureClassification;
  code: string;
  stage: string;
  engine: string;
  resolution?: string;
  workerCount?: number;
  recoverable: boolean;
  userSummary: string;
  recommendedAction: string;
  rawErrorMessage?: string;
}

export class ErrorClassifier {
  public static classify(err: unknown, context?: {
    stage?: string;
    engine?: string;
    resolution?: string;
    workerCount?: number;
  }): ClassifiedDiagnosticError {
    const message = err instanceof Error ? err.message : String(err || 'Unknown exception');
    const lower = message.toLowerCase();

    // 1. RAW DECODE
    if (lower.includes('demosaic') || lower.includes('raw') || lower.includes('cfa') || lower.includes('bayer')) {
      return {
        classification: 'RAW_DECODE_FAILURE',
        code: 'RAW-204',
        stage: context?.stage || 'DEMOSAICING',
        engine: context?.engine || 'AHD Sensor Pipeline',
        resolution: context?.resolution || '48MP',
        workerCount: context?.workerCount || 4,
        recoverable: true,
        userSummary: 'RAW photosite unpacking or demosaicing calculation failed.',
        recommendedAction: 'Fall back to Bilinear interpolation or restart demosaic worker.',
        rawErrorMessage: message,
      };
    }

    // 2. MEMORY PRESSURE
    if (lower.includes('out of memory') || lower.includes('allocation') || lower.includes('oom') || lower.includes('quotaexceeded')) {
      return {
        classification: 'MEMORY_PRESSURE',
        code: 'MEM-301',
        stage: context?.stage || 'FLOAT32_BUFFER_ALLOCATION',
        engine: context?.engine || 'Tiled Radiance Engine',
        resolution: context?.resolution || '48MP',
        workerCount: context?.workerCount || 2,
        recoverable: true,
        userSummary: 'System RAM or GPU buffer limits reached on large canvas.',
        recommendedAction: 'Activate Low-Memory Emergency Mode (Tier C / Tier D) to free working tiles.',
        rawErrorMessage: message,
      };
    }

    // 3. WORKER FAILURE
    if (lower.includes('worker') || lower.includes('postmessage') || lower.includes('detached')) {
      return {
        classification: 'WORKER_FAILURE',
        code: 'WRK-102',
        stage: context?.stage || 'PARALLEL_TILE_PROCESSING',
        engine: context?.engine || 'WebWorker Concurrency Pool',
        resolution: context?.resolution,
        workerCount: context?.workerCount,
        recoverable: true,
        userSummary: 'Background image processing thread crashed or became unresponsive.',
        recommendedAction: 'Pool will automatically terminate and respawn worker thread with 0 state loss.',
        rawErrorMessage: message,
      };
    }

    // 4. EXPORT FAILURE
    if (lower.includes('export') || lower.includes('encode') || lower.includes('tiff') || lower.includes('psd') || lower.includes('dng')) {
      return {
        classification: 'EXPORT_FAILURE',
        code: 'EXP-402',
        stage: context?.stage || 'BINARY_CONTAINER_SERIALIZATION',
        engine: context?.engine || 'Native Bitstream Exporter',
        resolution: context?.resolution,
        workerCount: context?.workerCount,
        recoverable: true,
        userSummary: 'Binary file generation encountered invalid dimensions or color profile.',
        recommendedAction: 'Check color space settings or reduce export quality/format.',
        rawErrorMessage: message,
      };
    }

    // 5. INDEXEDDB FAILURE
    if (lower.includes('indexeddb') || lower.includes('idb') || lower.includes('transaction') || lower.includes('database')) {
      return {
        classification: 'INDEXEDDB_FAILURE',
        code: 'IDB-501',
        stage: context?.stage || 'LOCAL_WRITE_AHEAD_JOURNAL',
        engine: context?.engine || 'Durable Storage Manager',
        recoverable: true,
        userSummary: 'Local browser database write transaction was aborted.',
        recommendedAction: 'Replay write-ahead log and check browser disk quota.',
        rawErrorMessage: message,
      };
    }

    // 6. FIREBASE / NETWORK FAILURE
    if (lower.includes('firebase') || lower.includes('firestore') || lower.includes('network') || lower.includes('offline') || lower.includes('timeout')) {
      return {
        classification: 'FIREBASE_FAILURE',
        code: 'NET-601',
        stage: context?.stage || 'CLOUD_SYNCHRONIZATION',
        engine: context?.engine || 'Cloud Sync Engine',
        recoverable: true,
        userSummary: 'Cloud connection dropped or service responded with timeout.',
        recommendedAction: 'Local edits remain 100% intact offline. Auto-sync will resume on reconnect.',
        rawErrorMessage: message,
      };
    }

    // 7. CORRUPTED PROJECT
    if (lower.includes('corrupt') || lower.includes('manifest') || lower.includes('invalid json') || lower.includes('parse')) {
      return {
        classification: 'CORRUPTED_PROJECT',
        code: 'PRJ-701',
        stage: context?.stage || 'PROJECT_STATE_REHYDRATION',
        engine: context?.engine || 'Project Schema Deserializer',
        recoverable: true,
        userSummary: 'Project manifest schema could not be parsed.',
        recommendedAction: 'Quarantined corrupted state and restored last known valid snapshot.',
        rawErrorMessage: message,
      };
    }

    // Default fallback
    return {
      classification: 'WORKER_FAILURE',
      code: 'GEN-001',
      stage: context?.stage || 'APPLICATION_RUNTIME',
      engine: context?.engine || 'Lumina Core',
      resolution: context?.resolution,
      workerCount: context?.workerCount,
      recoverable: true,
      userSummary: 'An unexpected application error occurred.',
      recommendedAction: 'Verify system logs and refresh editor canvas.',
      rawErrorMessage: message,
    };
  }
}
