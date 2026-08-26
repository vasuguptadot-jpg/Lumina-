/**
 * Lumina Studio Pro - Cloud GPU Production Security & Cost Protection
 * Phase 11 Disaster-Recovery Hardening
 *
 * Enforces authoritative server-side limits:
 * - MAX_RENDER_PIXELS: 150,000,000 (150MP)
 * - MAX_FILE_SIZE: 250 MB
 * - MAX_JOB_DURATION: 120s
 * - MAX_CONCURRENT_JOBS: 3
 * - MAX_DAILY_JOBS: 50
 *
 * Implements strict operation idempotency and replay protection.
 */

import { DiagnosticBuffer } from '../diagnostics/diagnosticBuffer';

export interface CloudRenderSubmission {
  jobId: string;
  userId: string;
  projectId: string;
  declaredMegapixels: number;
  actualFileSizeBytes: number;
  imageWidth: number;
  imageHeight: number;
  sha256Checksum: string;
  clientIp?: string;
  timestamp: number;
}

export interface SecurityValidationResult {
  allowed: boolean;
  errorCode?: string;
  reason?: string;
  serverCalculatedPixels: number;
  jobDurationBudgetSeconds: number;
}

export interface OperationLogEntry {
  operationId: string;
  userId: string;
  projectId: string;
  revision: number;
  timestamp: number;
  payload: Record<string, unknown>;
}

export class CloudGpuSecurityService {
  public static readonly MAX_RENDER_PIXELS = 150_000_000; // 150 Megapixels
  public static readonly MAX_FILE_SIZE_BYTES = 250 * 1024 * 1024; // 250 MB
  public static readonly MAX_JOB_DURATION_SECONDS = 120;
  public static readonly MAX_CONCURRENT_JOBS_PER_USER = 3;
  public static readonly MAX_DAILY_JOBS_PER_USER = 50;

  private static activeJobsPerUser: Map<string, number> = new Map();
  private static dailyJobsPerUser: Map<string, { count: number; day: string }> = new Map();
  private static processedOperations: Map<string, OperationLogEntry> = new Map();

  /**
   * Server-side independent calculation and limit enforcement
   */
  public static validateRenderJobSubmission(
    job: CloudRenderSubmission,
    isAuthenticated: boolean
  ): SecurityValidationResult {
    // 1. Authentication check
    if (!isAuthenticated || !job.userId) {
      DiagnosticBuffer.warn('CLOUD_GPU', `[AUTH_REJECTED] Unauthenticated render attempt for job ${job.jobId}.`);
      return {
        allowed: false,
        errorCode: 'ERR_UNAUTHORIZED_GPU',
        reason: 'Authentication token is required to dispatch remote GPU compute.',
        serverCalculatedPixels: 0,
        jobDurationBudgetSeconds: 0,
      };
    }

    // 2. Independent Pixel Calculation
    const calculatedPixels = job.imageWidth * job.imageHeight;
    if (calculatedPixels > this.MAX_RENDER_PIXELS) {
      DiagnosticBuffer.warn(
        'CLOUD_GPU',
        `[LIMIT_EXCEEDED] Job ${job.jobId} requested ${calculatedPixels} pixels (Max: ${this.MAX_RENDER_PIXELS}).`
      );
      return {
        allowed: false,
        errorCode: 'ERR_EXCEEDS_MAX_PIXELS',
        reason: `Image resolution (${calculatedPixels} px) exceeds server limit of ${this.MAX_RENDER_PIXELS} px.`,
        serverCalculatedPixels: calculatedPixels,
        jobDurationBudgetSeconds: 0,
      };
    }

    // 3. File Size Validation
    if (job.actualFileSizeBytes > this.MAX_FILE_SIZE_BYTES) {
      return {
        allowed: false,
        errorCode: 'ERR_EXCEEDS_MAX_FILE_SIZE',
        reason: `File size (${(job.actualFileSizeBytes / (1024 * 1024)).toFixed(1)} MB) exceeds server limit of 250MB.`,
        serverCalculatedPixels: calculatedPixels,
        jobDurationBudgetSeconds: 0,
      };
    }

    // 4. Concurrency Limit Check
    const activeCount = this.activeJobsPerUser.get(job.userId) || 0;
    if (activeCount >= this.MAX_CONCURRENT_JOBS_PER_USER) {
      return {
        allowed: false,
        errorCode: 'ERR_CONCURRENCY_LIMIT',
        reason: `User exceeds limit of ${this.MAX_CONCURRENT_JOBS_PER_USER} simultaneous cloud render jobs.`,
        serverCalculatedPixels: calculatedPixels,
        jobDurationBudgetSeconds: 0,
      };
    }

    // 5. Daily Quota Check
    const today = new Date().toISOString().split('T')[0];
    const userDaily = this.dailyJobsPerUser.get(job.userId) || { count: 0, day: today };
    if (userDaily.day === today && userDaily.count >= this.MAX_DAILY_JOBS_PER_USER) {
      return {
        allowed: false,
        errorCode: 'ERR_DAILY_QUOTA_EXCEEDED',
        reason: `Daily render budget of ${this.MAX_DAILY_JOBS_PER_USER} jobs reached for user.`,
        serverCalculatedPixels: calculatedPixels,
        jobDurationBudgetSeconds: 0,
      };
    }

    // Register active job
    this.activeJobsPerUser.set(job.userId, activeCount + 1);
    this.dailyJobsPerUser.set(job.userId, {
      count: userDaily.day === today ? userDaily.count + 1 : 1,
      day: today,
    });

    return {
      allowed: true,
      serverCalculatedPixels: calculatedPixels,
      jobDurationBudgetSeconds: this.MAX_JOB_DURATION_SECONDS,
    };
  }

  public static completeJob(userId: string): void {
    const active = this.activeJobsPerUser.get(userId) || 1;
    this.activeJobsPerUser.set(userId, Math.max(0, active - 1));
  }

  /**
   * Idempotency & Replay Protection:
   * Rejects duplicate operation submissions and ensures Apply(Op) === Apply(Op, Op)
   */
  public static processIdempotentOperation(op: OperationLogEntry): {
    applied: boolean;
    isDuplicate: boolean;
    operationId: string;
  } {
    if (this.processedOperations.has(op.operationId)) {
      DiagnosticBuffer.info(
        'COLLABORATION',
        `[IDEMPOTENT_IGNORE] Duplicate operationId ${op.operationId} received. Safely ignored with 0 state mutation.`
      );
      return {
        applied: false,
        isDuplicate: true,
        operationId: op.operationId,
      };
    }

    this.processedOperations.set(op.operationId, { ...op });
    return {
      applied: true,
      isDuplicate: false,
      operationId: op.operationId,
    };
  }
}
