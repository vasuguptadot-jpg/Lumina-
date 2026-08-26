/**
 * Lumina Studio Pro - Multi-Threaded RAW Web Worker Types
 * Defines message protocols, job payloads, tile representations, and structured errors.
 */

import {
  RawSensorBuffer,
  RawSensorMetadata,
  RawDecodeStatus,
  RawDecoderEngineType,
  BayerCfaPattern,
} from './rawTypes';
import { DemosaicMethod, RawDevelopSettings, WorkingColorSpace } from '../../types/editor';

export interface RawTileDescriptor {
  tileIndex: number;
  totalTiles: number;
  tileX: number;
  tileY: number;
  tileWidth: number;
  tileHeight: number;
  haloSize: number;
  // Bounding box in sensor coordinates including halo
  sensorX: number;
  sensorY: number;
  sensorWidth: number;
  sensorHeight: number;
}

export interface RawWorkerError {
  code: 'CORRUPTED_RAW' | 'UNSUPPORTED_FORMAT' | 'INVALID_IFD' | 'OUT_OF_MEMORY' | 'WORKER_FAILURE' | 'CANCELLED';
  stage: 'PARSING' | 'UNPACKING' | 'DEMOSAICING' | 'COLOR_TRANSFORM' | 'TILE_ASSEMBLY';
  message: string;
  recoverable: boolean;
}

export type RawWorkerMessageType =
  | 'INIT'
  | 'DECODE_AND_DEVELOP'
  | 'DEVELOP_TILE'
  | 'DEVELOP_FULL_SENSOR'
  | 'CANCEL'
  | 'PROGRESS'
  | 'TILE_COMPLETE'
  | 'DECODE_COMPLETE'
  | 'ERROR'
  | 'BENCHMARK';

export interface RawWorkerMessageIn {
  type: RawWorkerMessageType;
  jobId: string;
  generationId: number;
  workerId?: number;
  fileBuffer?: ArrayBuffer;
  fileName?: string;
  fileExtension?: string;
  sensorBuffer?: {
    width: number;
    height: number;
    bitDepth: number;
    cfaPattern: BayerCfaPattern;
    blackLevel: [number, number, number, number];
    whiteLevel: number;
    colorCalibration: any;
    sensorData?: ArrayBuffer; // Float32Array underlying buffer
  };
  tile?: RawTileDescriptor;
  tileSensorData?: ArrayBuffer; // Float32Array buffer for tile + halo
  settings?: RawDevelopSettings;
  targetColorSpace?: WorkingColorSpace;
  fastPreview?: boolean;
  benchmarkMegapixels?: number;
}

export interface RawWorkerMessageOut {
  type: RawWorkerMessageType;
  jobId: string;
  generationId: number;
  workerId?: number;
  stage?: string;
  percent?: number;
  tilesCompleted?: number;
  totalTiles?: number;
  tile?: RawTileDescriptor;
  tileImageDataBuffer?: ArrayBuffer; // Uint8ClampedArray buffer for this tile
  tileFloat32RgbBuffer?: ArrayBuffer; // Float32Array buffer for HDR working tile
  fullImageDataBuffer?: ArrayBuffer;
  metadata?: RawSensorMetadata;
  sensorBufferData?: ArrayBuffer; // Unpacked Float32Array sensor data
  dimensions?: { width: number; height: number };
  error?: RawWorkerError;
  benchmarkStats?: {
    megapixels: number;
    unpackTimeMs: number;
    demosaicTimeMs: number;
    colorTransformTimeMs: number;
    totalWorkerTimeMs: number;
    throughputMps: number;
  };
}

export interface RawWorkerStats {
  workerPoolSize: number;
  activeWorkerCount: number;
  totalJobsProcessed: number;
  cancelledGenerationsCount: number;
  averageTileTimeMs: number;
  lastJobExecutionTimeMs: number;
  mainThreadBlockingTimeMs: number;
  isWorkerSupported: boolean;
  fallbackReason?: string;
}
