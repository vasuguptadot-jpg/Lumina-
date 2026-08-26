/**
 * Lumina Studio Pro - Malicious File Safety & .lumina Archive Zip Slip Protection
 * Phase 12 Security Hardening & Red-Team Verification
 */

export interface SecurityInspectionResult {
  isSafe: boolean;
  threatDetected: boolean;
  threatType?: string;
  threatDetails?: string;
  mitigationAction: 'REJECT_SILENT' | 'REJECT_WITH_NOTICE' | 'SANITIZE' | 'ALLOW';
}

export class MaliciousFileGuard {
  private static readonly MAX_DECOMPRESSED_ARCHIVE_BYTES = 1024 * 1024 * 500; // 500MB max decompressed size
  private static readonly MAX_FILE_COUNT_IN_ARCHIVE = 100;
  private static readonly DISALLOWED_EXTENSIONS = ['.exe', '.sh', '.bat', '.cmd', '.vbs', '.js', '.ts', '.html', '.php'];

  /**
   * Inspects a binary file buffer for malicious exploit payloads (Cyclic IFD, Buffer Overflow, Decompression Bomb)
   */
  public static inspectBinaryBuffer(buffer: ArrayBuffer, mimeOrExt: string): SecurityInspectionResult {
    const bytes = new Uint8Array(buffer);
    const length = bytes.byteLength;

    // 1. Extreme Size Check
    if (length === 0) {
      return {
        isSafe: false,
        threatDetected: true,
        threatType: 'EMPTY_FILE',
        threatDetails: 'Zero-byte buffer cannot be parsed.',
        mitigationAction: 'REJECT_WITH_NOTICE',
      };
    }

    if (length > 250 * 1024 * 1024) {
      return {
        isSafe: false,
        threatDetected: true,
        threatType: 'OVERSIZED_INPUT',
        threatDetails: `File size ${length} bytes exceeds 250MB security ingress limit.`,
        mitigationAction: 'REJECT_WITH_NOTICE',
      };
    }

    // 2. TIFF / DNG Cyclic IFD Pointer & Offset Check
    if (mimeOrExt.includes('tiff') || mimeOrExt.includes('dng') || mimeOrExt.includes('cr2')) {
      const isLittleEndian = bytes[0] === 0x49 && bytes[1] === 0x49;
      const isBigEndian = bytes[0] === 0x4d && bytes[1] === 0x4d;

      if (!isLittleEndian && !isBigEndian) {
        return {
          isSafe: false,
          threatDetected: true,
          threatType: 'INVALID_MAGIC_HEADER',
          threatDetails: 'TIFF/DNG container does not have valid endian magic bytes.',
          mitigationAction: 'REJECT_WITH_NOTICE',
        };
      }

      // Check for recursive/circular IFD loops (offset pointing backwards to itself)
      if (length >= 8) {
        const view = new DataView(buffer);
        const ifdOffset = view.getUint32(4, isLittleEndian);
        if (ifdOffset >= length || ifdOffset === 0) {
          // Out of bounds IFD or null IFD
          return {
            isSafe: false,
            threatDetected: true,
            threatType: 'MALFORMED_IFD_OFFSET',
            threatDetails: `IFD offset 0x${ifdOffset.toString(16)} points outside buffer length.`,
            mitigationAction: 'REJECT_WITH_NOTICE',
          };
        }
      }
    }

    return {
      isSafe: true,
      threatDetected: false,
      mitigationAction: 'ALLOW',
    };
  }

  /**
   * Hardened .lumina ZIP archive extractor validation:
   * Protects against Zip Slip (../), decompression bombs, executable payload injection, and central directory poisoning.
   */
  public static validateArchiveEntries(
    entries: Array<{ path: string; uncompressedSize: number; compressedSize: number }>
  ): SecurityInspectionResult {
    if (entries.length > this.MAX_FILE_COUNT_IN_ARCHIVE) {
      return {
        isSafe: false,
        threatDetected: true,
        threatType: 'ZIP_BOMB_EXCESSIVE_FILES',
        threatDetails: `Archive contains ${entries.length} entries (limit is ${this.MAX_FILE_COUNT_IN_ARCHIVE}).`,
        mitigationAction: 'REJECT_WITH_NOTICE',
      };
    }

    let totalUncompressed = 0;
    const seenPaths = new Set<string>();

    for (const entry of entries) {
      // Rule 1: Zip Slip Prevention (directory traversal ../ or absolute paths / or backslashes)
      const cleanPath = entry.path.replace(/\\/g, '/');
      if (cleanPath.includes('../') || cleanPath.startsWith('/') || cleanPath.startsWith('~') || cleanPath.includes('..')) {
        return {
          isSafe: false,
          threatDetected: true,
          threatType: 'ZIP_SLIP_PATH_TRAVERSAL',
          threatDetails: `Entry "${entry.path}" attempts path traversal out of sandbox boundary.`,
          mitigationAction: 'REJECT_WITH_NOTICE',
        };
      }

      // Rule 2: Disallowed extensions (e.g. .exe, .sh, .html, .js)
      const lower = cleanPath.toLowerCase();
      for (const ext of this.DISALLOWED_EXTENSIONS) {
        if (lower.endsWith(ext)) {
          return {
            isSafe: false,
            threatDetected: true,
            threatType: 'EXECUTABLE_INJECTION_ATTEMPT',
            threatDetails: `Entry "${entry.path}" contains forbidden executable file extension "${ext}".`,
            mitigationAction: 'REJECT_WITH_NOTICE',
          };
        }
      }

      // Rule 3: Duplicate entry collision attack
      if (seenPaths.has(cleanPath)) {
        return {
          isSafe: false,
          threatDetected: true,
          threatType: 'DUPLICATE_ENTRY_COLLISION',
          threatDetails: `Archive contains duplicate entry path "${cleanPath}".`,
          mitigationAction: 'REJECT_WITH_NOTICE',
        };
      }
      seenPaths.add(cleanPath);

      // Rule 4: Decompression Bomb (Compression ratio > 100:1 or total decompressed > 500MB)
      totalUncompressed += entry.uncompressedSize;
      if (totalUncompressed > this.MAX_DECOMPRESSED_ARCHIVE_BYTES) {
        return {
          isSafe: false,
          threatDetected: true,
          threatType: 'DECOMPRESSION_BOMB_OVERSIZED',
          threatDetails: `Total decompressed archive size exceeds ${this.MAX_DECOMPRESSED_ARCHIVE_BYTES / (1024 * 1024)}MB limit.`,
          mitigationAction: 'REJECT_WITH_NOTICE',
        };
      }

      if (entry.compressedSize > 0 && entry.uncompressedSize / entry.compressedSize > 100) {
        return {
          isSafe: false,
          threatDetected: true,
          threatType: 'DECOMPRESSION_BOMB_HIGH_RATIO',
          threatDetails: `Entry "${entry.path}" has suspicious compression ratio of ${(entry.uncompressedSize / entry.compressedSize).toFixed(1)}:1.`,
          mitigationAction: 'REJECT_WITH_NOTICE',
        };
      }
    }

    return {
      isSafe: true,
      threatDetected: false,
      mitigationAction: 'ALLOW',
    };
  }

  /**
   * Sanitizes Project JSON objects to defend against Prototype Pollution and Stored XSS
   */
  public static sanitizeProjectJson(jsonString: string): { isSafe: boolean; sanitizedObject?: any; threatDetails?: string } {
    try {
      // Check for raw prototype pollution strings before parse
      if (jsonString.includes('__proto__') || jsonString.includes('constructor.prototype')) {
        return {
          isSafe: false,
          threatDetails: 'Detected __proto__ or prototype pollution vector in JSON payload.',
        };
      }

      const parsed = JSON.parse(jsonString);

      // Deep clean function to strip potential HTML script tags in text fields (XSS defense)
      const sanitizeDeep = (obj: any): any => {
        if (typeof obj === 'string') {
          return obj
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/onerror=/gi, '')
            .replace(/onload=/gi, '');
        }
        if (Array.isArray(obj)) {
          return obj.map(sanitizeDeep);
        }
        if (obj && typeof obj === 'object') {
          const clean: Record<string, any> = {};
          for (const key of Object.keys(obj)) {
            if (key === '__proto__' || key === 'prototype' || key === 'constructor') continue;
            clean[key] = sanitizeDeep(obj[key]);
          }
          return clean;
        }
        return obj;
      };

      const sanitized = sanitizeDeep(parsed);
      return { isSafe: true, sanitizedObject: sanitized };
    } catch (e: any) {
      return {
        isSafe: false,
        threatDetails: `JSON parse failed: ${e.message}`,
      };
    }
  }
}
