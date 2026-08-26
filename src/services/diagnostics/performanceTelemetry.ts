/**
 * Lumina Studio Pro - Performance Telemetry & Privacy-First Observability
 * Phase 11 Production Observability
 */

import { CURRENT_BUILD_METADATA } from '../release/buildInfo';
import { DiagnosticBuffer } from './diagnosticBuffer';

export interface TelemetryMetric {
  id: string;
  timestamp: number;
  event:
    | 'RAW_DECODE'
    | 'DEMOSAIC'
    | 'COLOR_PIPELINE_RENDER'
    | 'TILED_EXPORT'
    | 'CLOUD_SYNC'
    | 'IDB_AUTOSAVE'
    | 'WORKER_RESPAWN'
    | 'LOW_MEM_ACTIVATION';
  appVersion: string;
  engineVersion: string;
  browser: string;
  os: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  operation: string;
  durationMs: number;
  success: boolean;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}

export class PerformanceTelemetry {
  private static metrics: TelemetryMetric[] = [];
  private static isEnabled: boolean = true;

  public static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public static isTelemetryEnabled(): boolean {
    return this.isEnabled;
  }

  private static getClientEnvironment(): { browser: string; os: string; mem?: number; cores?: number } {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return { browser: 'Node/Server', os: 'Linux', mem: 8, cores: 8 };
    }

    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    if (ua.includes('Chrome')) browser = 'Chrome/Blink';
    else if (ua.includes('Firefox')) browser = 'Firefox/Gecko';
    else if (ua.includes('Safari')) browser = 'Safari/WebKit';

    let os = 'Unknown OS';
    if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    const mem = (navigator as any).deviceMemory || 8;
    const cores = navigator.hardwareConcurrency || 4;

    return { browser, os, mem, cores };
  }

  public static record(
    event: TelemetryMetric['event'],
    operation: string,
    durationMs: number,
    success: boolean,
    errorCode?: string,
    metadata?: Record<string, unknown>
  ): TelemetryMetric {
    const env = this.getClientEnvironment();

    const metric: TelemetryMetric = {
      id: `tel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      event,
      appVersion: CURRENT_BUILD_METADATA.version,
      engineVersion: CURRENT_BUILD_METADATA.rawEngineVersion,
      browser: env.browser,
      os: env.os,
      deviceMemory: env.mem,
      hardwareConcurrency: env.cores,
      operation,
      durationMs: Math.round(durationMs * 100) / 100,
      success,
      errorCode,
      metadata,
    };

    if (this.isEnabled) {
      this.metrics.push(metric);
      if (this.metrics.length > 200) {
        this.metrics.shift();
      }

      DiagnosticBuffer.info(
        'PERFORMANCE' as any,
        `[TELEMETRY] ${event} (${operation}) finished in ${durationMs.toFixed(1)}ms. Success: ${success}`,
        { durationMs, success, errorCode, ...metadata }
      );
    }

    return metric;
  }

  public static getMetrics(): TelemetryMetric[] {
    return [...this.metrics];
  }

  public static clear(): void {
    this.metrics = [];
  }
}
