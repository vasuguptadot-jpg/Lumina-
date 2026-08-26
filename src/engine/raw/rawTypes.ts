/**
 * Lumina Studio Pro - Professional RAW Processing Engine Types
 * Sensor data structures, color matrix definitions, and decoding status.
 */

export type RawDecodeStatus = 'genuine_raw_sensor' | 'preview_fallback' | 'unsupported';

export type RawDecoderEngineType =
  | 'Lumina-Raw-Wasm'
  | 'DNG-Sensor-Decoder'
  | 'TIFF-EP-Raw-Decoder'
  | 'LibRaw-Compatible-Worker'
  | 'Preview-Fallback';

export type BayerCfaPattern = 'RGGB' | 'BGGR' | 'GRBG' | 'GBRG' | 'X-Trans' | 'None';

export interface RawDimensions {
  width: number;
  height: number;
  activeArea?: [number, number, number, number]; // [top, left, bottom, right]
  defaultCropOrigin?: [number, number];
  defaultCropSize?: [number, number];
}

export interface RawColorCalibration {
  asShotNeutral: [number, number, number]; // [R, G, B] gains
  colorMatrix1: number[][]; // 3x3 Camera to XYZ D65 / Illuminant-1
  colorMatrix2?: number[][]; // 3x3 Camera to XYZ Std-A / Illuminant-2
  forwardMatrix1?: number[][]; // 3x3 XYZ to Camera
  forwardMatrix2?: number[][];
  cameraCalibration1?: number[][];
  cameraCalibration2?: number[][];
  calibrationIlluminant1?: number; // 17 = Standard Light A, 21 = D65
  calibrationIlluminant2?: number;
  baselineExposure?: number; // EV offset
}

export interface RawSensorMetadata {
  isRaw: boolean;
  decodeStatus: RawDecodeStatus;
  decoderEngine: RawDecoderEngineType;
  statusReason?: string;
  cameraMake: string;
  cameraModel: string;
  cameraSerialNumber?: string;
  lensModel?: string;
  lensSerialNumber?: string;
  iso?: number;
  shutterSpeed?: string;
  aperture?: string;
  focalLength?: string;
  focalLength35mm?: string;
  exposureBias?: string;
  meteringMode?: string;
  dateTime?: string;
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  } | null;
  rawFormat: string; // 'DNG' | 'CR2' | 'CR3' | 'NEF' | 'ARW' | 'RAF' | 'ORF' | 'RW2'
  dimensions: RawDimensions;
  bitDepth: number; // 12, 14, 16
  cfaPattern: BayerCfaPattern;
  blackLevel: [number, number, number, number]; // [R, Gr, Gb, B] or uniform
  whiteLevel: number;
  colorCalibration: RawColorCalibration;
  hasEmbeddedPreview: boolean;
  previewWidth?: number;
  previewHeight?: number;
}

export interface RawSensorBuffer {
  width: number;
  height: number;
  bitDepth: number;
  cfaPattern: BayerCfaPattern;
  blackLevel: [number, number, number, number];
  whiteLevel: number;
  colorCalibration: RawColorCalibration;
  /**
   * Linear normalized Float32 sensor array of size width * height (one float per sensor photosite)
   * Values are in range [0.0, 1.0] after black-level subtraction and white-level scaling.
   */
  sensorData: Float32Array;
  metadata: RawSensorMetadata;
}

export interface RawDevelopResult {
  imageData: ImageData;
  width: number;
  height: number;
  metadata: RawSensorMetadata;
  sensorBuffer?: RawSensorBuffer;
  previewUrl: string;
  executionTimeMs: number;
}
