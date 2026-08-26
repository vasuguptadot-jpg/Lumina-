/**
 * Lumina Studio Pro - Crash Reporter & Diagnostic Screen Helper
 * Phase 11 Crash Diagnostics
 */

import { ClassifiedDiagnosticError, ErrorClassifier } from './errorClassifier';
import { DiagnosticBuffer } from './diagnosticBuffer';
import { PerformanceTelemetry } from './performanceTelemetry';
import { CURRENT_BUILD_METADATA } from '../release/buildInfo';

export interface CrashReport {
  reportId: string;
  timestamp: string;
  appVersion: string;
  buildId: string;
  error: ClassifiedDiagnosticError;
  system: {
    userAgent: string;
    cores: number;
    memoryTier: string;
    onlineStatus: boolean;
  };
  recentLogs: ReturnType<typeof DiagnosticBuffer.getEntries>;
}

export class CrashReporter {
  private static lastReport: CrashReport | null = null;
  private static listeners: Array<(report: CrashReport) => void> = [];

  public static reportException(err: unknown, context?: {
    stage?: string;
    engine?: string;
    resolution?: string;
    workerCount?: number;
  }): CrashReport {
    const classified = ErrorClassifier.classify(err, context);

    const report: CrashReport = {
      reportId: `CRASH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      appVersion: CURRENT_BUILD_METADATA.version,
      buildId: CURRENT_BUILD_METADATA.buildId,
      error: classified,
      system: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
        cores: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4,
        memoryTier: 'Standard (8GB+)',
        onlineStatus: typeof navigator !== 'undefined' ? navigator.onLine : true,
      },
      recentLogs: DiagnosticBuffer.getEntries().slice(-20),
    };

    this.lastReport = report;

    DiagnosticBuffer.error(
      'WORKER_POOL',
      `[CRASH_REPORT] ${classified.code} at ${classified.stage} (${classified.engine}): ${classified.userSummary}`,
      { reportId: report.reportId, classified }
    );

    PerformanceTelemetry.record(
      'WORKER_RESPAWN',
      `Crash: ${classified.code}`,
      0,
      false,
      classified.code,
      { stage: classified.stage }
    );

    this.listeners.forEach((cb) => {
      try {
        cb(report);
      } catch (e) {
        console.error('Error invoking crash listener', e);
      }
    });

    return report;
  }

  public static getLastReport(): CrashReport | null {
    return this.lastReport;
  }

  public static onCrash(callback: (report: CrashReport) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }
}
