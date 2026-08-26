# Lumina Studio Pro — Phase 8 Production Cloud GPU Render Engine Architecture

---

## 1. End-to-End System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LUMINA CLIENT APP                        │
│  • Generates Idempotency Key                                │
│  • Attaches Firebase ID Token (Bearer Header)               │
└──────────────────────────────┬──────────────────────────────┘
                               │ POST /api/v1/render/submit
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              AUTHENTICATED CLOUD RENDER API                 │
│  • Validates Firebase JWT Token (Derives userId)             │
│  • Enforces Quotas, Max Resolution & Allowed Formats        │
│  • Dispatches Job to Firestore `render_jobs` collection     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Event Driven
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             CLOUD RUN / HEADLESS GPU WORKER                 │
│  • Multi-threaded Node / WebGL / LibRaw headless node       │
│  • Stages: Validation -> Download -> Decode -> Process      │
│  • Encodes 16-bit Master TIFF / DNG / High-Q WebP           │
│  • Computes Authoritative SHA-256 Checksum                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
  [Firebase Cloud Storage]           [Firestore Job Document]
  • Master image asset blob          • Status: COMPLETED
  • Short-lived download URL         • SHA-256 Checksum
               │                               │
               └───────────────┬───────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    LUMINA CLIENT ENGINE                     │
│  • Downloads Rendered Master Blob                           │
│  • Computes Web Crypto SHA-256 Hash on downloaded bytes     │
│  • If SHA-256 matches: ACCEPTS MASTER ARTIFACT              │
│  • If SHA-256 mismatches: REJECTS (RENDER_CORRUPTED)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Authoritative Render Job Data Model

Implemented in `src/types/cloudRender.ts`:
```typescript
export interface ProductionCloudRenderJob {
  jobId: string;
  userId: string;
  projectId: string;
  projectName: string;
  projectRevision: number;
  inputAssetRefs: string[];
  renderParameters: CloudRenderParameters;
  outputFormat: 'png' | 'jpeg' | 'webp' | 'tiff' | 'dng' | 'psd';
  priority: 'normal' | 'high' | 'pro_priority';
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  stage: 'QUEUED' | 'INPUT_VALIDATION' | 'ASSET_DOWNLOAD' | 'RAW_DECODE' | 'PROCESSING' | 'ENCODING' | 'UPLOAD' | 'VERIFIED';
  progress: number;
  workerId: string | null;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  resultAssetRef: string | null;
  downloadUrl: string | null;
  checksumSha256: string | null;
  outputSizeBytes: number | null;
  idempotencyKey: string;
  telemetry?: {
    queueDurationMs?: number;
    workerDurationMs?: number;
    totalDurationMs?: number;
    peakVramMb?: number;
    gpuNodeName?: string;
  };
}
```

---

## 3. Genuine Stage-Based Progress Reporting

Rather than arbitrary linear timers, the pipeline reports genuine processing phases:
1. **0% — `QUEUED`**: Job registered in Firestore queue with deterministic idempotency key.
2. **10% — `INPUT_VALIDATION`**: Parameter schema, dimensions, and project permissions verified.
3. **20% — `ASSET_DOWNLOAD`**: High-resolution source buffers pulled from cloud storage.
4. **30% — `RAW_DECODE`**: Full sensor unpacking, CFA demosaicing, and black/white level correction.
5. **50% — `PROCESSING`**: Tone curve, 3D LUT, HSL, color grading, and selective mask application.
6. **80% — `ENCODING`**: Format-specific binary encoding (Uncompressed 24-bit TIFF, PSD, or DNG).
7. **95% — `UPLOAD`**: Binary artifact written to Cloud Storage and SHA-256 hash computed.
8. **100% — `VERIFIED`**: Client validates downloaded SHA-256 digest before presenting master artifact.

---

## 4. Production Observability & Failure Recovery

- **Structured Error Reporting**: Errors return specific error codes (`UNSUPPORTED_RAW_VARIANT`, `RESOLUTION_EXCEEDED`, `CHECKSUM_MISMATCH`, `STORAGE_QUOTA_EXCEEDED`).
- **Telemetry Collection**: Queue wait time, worker duration, total latency, and peak memory are recorded in job telemetry.
