/**
 * Lumina Studio Pro - Release Engineering & Build Info
 * Phase 11 Production Baseline
 */

export interface BuildMetadata {
  appName: string;
  version: string;
  buildId: string;
  buildCommit: string;
  gitCommit: string;
  buildTimestamp: string;
  buildChannel: 'Production' | 'Staging' | 'Development' | 'Local';
  engineVersion: string;
  rawEngineVersion: string;
  cloudSchemaVersion: number;
  localDbSchemaVersion: number;
  migrationVersion: number;
  isReproducible: boolean;
  compiler: {
    typescript: string;
    vite: string;
    target: string;
  };
}

export const CURRENT_BUILD_METADATA: BuildMetadata = {
  appName: 'Lumina Studio Pro',
  version: '1.0.0',
  buildId: '8f42c1a',
  buildCommit: '8f42c1a93e820db0c812ef4b901a080d8591f1a4',
  gitCommit: '8f42c1a93e820db0c812ef4b901a080d8591f1a4',
  buildTimestamp: '2026-08-26T01:10:00.000Z',
  buildChannel: 'Production',
  engineVersion: '6.0.0-rc2',
  rawEngineVersion: '5.4',
  cloudSchemaVersion: 3,
  localDbSchemaVersion: 7,
  migrationVersion: 7,
  isReproducible: true,
  compiler: {
    typescript: '5.8.2',
    vite: '6.2.3',
    target: 'ES2022',
  },
};

/**
 * Returns formatted version string for UI display and diagnostics
 */
export function getFormattedBuildString(): string {
  const m = CURRENT_BUILD_METADATA;
  return `${m.appName} v${m.version} (Build ${m.buildId}, Engine ${m.engineVersion}, RAW ${m.rawEngineVersion}, DB v${m.localDbSchemaVersion})`;
}
