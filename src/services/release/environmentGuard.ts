/**
 * Lumina Studio Pro - Environment Separation & Hard Startup Safety Guard
 * Phase 11 Release Engineering
 */

export type AppEnvironment = 'LOCAL' | 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';

export interface EnvironmentConfig {
  environment: AppEnvironment;
  firebaseProjectId: string;
  allowMockData: boolean;
  enableDebugLogging: boolean;
  enableStrictSafetyChecks: boolean;
  allowDestructiveMigrations: boolean;
  apiProxyUrl: string;
}

export const ENVIRONMENTS: Record<AppEnvironment, EnvironmentConfig> = {
  LOCAL: {
    environment: 'LOCAL',
    firebaseProjectId: 'lumina-local-dev',
    allowMockData: true,
    enableDebugLogging: true,
    enableStrictSafetyChecks: true,
    allowDestructiveMigrations: false,
    apiProxyUrl: 'http://localhost:3000/api',
  },
  DEVELOPMENT: {
    environment: 'DEVELOPMENT',
    firebaseProjectId: 'lumina-dev-stage-01',
    allowMockData: true,
    enableDebugLogging: true,
    enableStrictSafetyChecks: true,
    allowDestructiveMigrations: false,
    apiProxyUrl: '/api',
  },
  STAGING: {
    environment: 'STAGING',
    firebaseProjectId: 'lumina-staging-cluster-02',
    allowMockData: false,
    enableDebugLogging: false,
    enableStrictSafetyChecks: true,
    allowDestructiveMigrations: false,
    apiProxyUrl: '/api',
  },
  PRODUCTION: {
    environment: 'PRODUCTION',
    firebaseProjectId: 'ai-studio-luminastudioproa-676fb9db-cb85-4ed4-a1dd-51217ce95c22',
    allowMockData: false,
    enableDebugLogging: false,
    enableStrictSafetyChecks: true,
    allowDestructiveMigrations: false,
    apiProxyUrl: '/api',
  },
};

export class EnvironmentGuard {
  private static currentEnv: AppEnvironment = 'PRODUCTION';

  public static setEnvironment(env: AppEnvironment): void {
    this.currentEnv = env;
  }

  public static getEnvironment(): AppEnvironment {
    return this.currentEnv;
  }

  public static getConfig(): EnvironmentConfig {
    return ENVIRONMENTS[this.currentEnv];
  }

  /**
   * Hard startup safety check:
   * Prevents development builds from accidentally communicating with production databases,
   * or production builds running with unsafe development bypasses.
   */
  public static validateStartup(
    configuredBuildChannel: string,
    targetFirebaseProjectId: string
  ): { isAllowed: boolean; reason?: string } {
    const isDevBuild = configuredBuildChannel === 'Development' || configuredBuildChannel === 'Local';
    const isProdFirebase =
      targetFirebaseProjectId === ENVIRONMENTS.PRODUCTION.firebaseProjectId ||
      targetFirebaseProjectId.includes('prod') ||
      targetFirebaseProjectId.includes('luminastudioproa');

    // Rule 1: Dev build cannot point to Prod Firebase project
    if (isDevBuild && isProdFirebase) {
      const errorMsg = `[SECURITY_BLOCK] Development build channel "${configuredBuildChannel}" is strictly forbidden from connecting to Production Firebase Project "${targetFirebaseProjectId}". Startup aborted.`;
      console.error(errorMsg);
      return { isAllowed: false, reason: errorMsg };
    }

    // Rule 2: Production build cannot point to Dev Firebase project
    if (configuredBuildChannel === 'Production' && !isProdFirebase) {
      const errorMsg = `[SECURITY_BLOCK] Production build channel must only connect to certified Production Firebase Project. Target "${targetFirebaseProjectId}" is disallowed.`;
      console.error(errorMsg);
      return { isAllowed: false, reason: errorMsg };
    }

    return { isAllowed: true };
  }
}
