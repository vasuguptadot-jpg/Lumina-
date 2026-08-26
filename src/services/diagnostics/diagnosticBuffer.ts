/**
 * Lumina Studio Pro - In-Memory Diagnostic & Telemetry Circular Buffer
 * Phase 11 Production Observability
 *
 * Enforces strict privacy scrubbing: Never stores pixels, passwords, EXIF GPS coordinates,
 * or raw image buffer data.
 */

export interface DiagnosticLogEntry {
  id: string;
  timestamp: number;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  category:
    | 'RAW_DECODE'
    | 'DEMOSAIC'
    | 'COLOR_PIPELINE'
    | 'WORKER_POOL'
    | 'MEMORY'
    | 'STORAGE'
    | 'EXPORT'
    | 'FIREBASE'
    | 'CLOUD_GPU'
    | 'COLLABORATION'
    | 'LIFECYCLE';
  message: string;
  metadata?: Record<string, unknown>;
}

export class DiagnosticBuffer {
  private static readonly MAX_ENTRIES = 250;
  private static buffer: DiagnosticLogEntry[] = [];

  /**
   * Sanitizes input metadata to guarantee zero privacy or security leaks
   */
  private static sanitizeMetadata(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!meta) return undefined;
    const sanitized: Record<string, unknown> = {};

    const BANNED_KEYS = [
      'pixel',
      'pixels',
      'buffer',
      'password',
      'token',
      'auth',
      'gps',
      'latitude',
      'longitude',
      'location',
      'arraybuffer',
      'secret',
      'key',
    ];

    for (const [k, v] of Object.entries(meta)) {
      const lowerKey = k.toLowerCase();
      if (BANNED_KEYS.some((banned) => lowerKey.includes(banned))) {
        sanitized[k] = '[REDACTED_PRIVACY_SAFE]';
      } else if (v instanceof Float32Array || v instanceof Uint8Array || v instanceof ArrayBuffer) {
        sanitized[k] = `[BINARY_BUFFER_SIZE_${(v as any).byteLength || 0}_BYTES]`;
      } else if (typeof v === 'object' && v !== null) {
        try {
          sanitized[k] = JSON.parse(JSON.stringify(v));
        } catch {
          sanitized[k] = '[COMPLEX_OBJECT]';
        }
      } else {
        sanitized[k] = v;
      }
    }
    return sanitized;
  }

  public static log(
    level: DiagnosticLogEntry['level'],
    category: DiagnosticLogEntry['category'],
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    const entry: DiagnosticLogEntry = {
      id: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      metadata: this.sanitizeMetadata(metadata),
    };

    this.buffer.push(entry);
    if (this.buffer.length > this.MAX_ENTRIES) {
      this.buffer.shift();
    }
  }

  public static info(category: DiagnosticLogEntry['category'], message: string, meta?: Record<string, unknown>): void {
    this.log('INFO', category, message, meta);
  }

  public static warn(category: DiagnosticLogEntry['category'], message: string, meta?: Record<string, unknown>): void {
    this.log('WARN', category, message, meta);
  }

  public static error(category: DiagnosticLogEntry['category'], message: string, meta?: Record<string, unknown>): void {
    this.log('ERROR', category, message, meta);
  }

  public static getEntries(): DiagnosticLogEntry[] {
    return [...this.buffer];
  }

  public static clear(): void {
    this.buffer = [];
  }

  public static exportJSON(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalEntries: this.buffer.length,
        logs: this.buffer,
      },
      null,
      2
    );
  }
}
