/**
 * Lumina Studio Pro - Production Feature Flags & Emergency Kill Switches
 * Phase 12 Public Beta & Operations
 */

export interface FeatureFlagConfig {
  cloudGPU: boolean;
  collaboration: boolean;
  AIUpscale: boolean;
  XTrans: boolean;
  CR3Preview: boolean;
  experimentalAVIF: boolean;
  advancedMasks: boolean;
  telemetry: boolean;
  cloudSync: boolean;
  pwaBackgroundSync: boolean;
  highPrecisionCurves: boolean;
}

export type RolloutStage =
  | 'INTERNAL' // 5 internal engineers
  | 'PRIVATE_ALPHA' // 25 invited photographers
  | 'CLOSED_BETA' // 100 community testers
  | 'LIMITED_PUBLIC_BETA' // 500 waitlist users
  | 'ROLLOUT_25' // 25% production traffic
  | 'ROLLOUT_50' // 50% production traffic
  | 'ROLLOUT_75' // 75% production traffic
  | 'GENERAL_AVAILABILITY'; // 100% public traffic

export interface RolloutStageConfig {
  stage: RolloutStage;
  maxUsers: number;
  rolloutPercentage: number;
  description: string;
  allowedFeatures: (keyof FeatureFlagConfig)[];
}

export const ROLLOUT_STAGES: Record<RolloutStage, RolloutStageConfig> = {
  INTERNAL: {
    stage: 'INTERNAL',
    maxUsers: 5,
    rolloutPercentage: 1,
    description: 'Internal development core team (5 seats)',
    allowedFeatures: [
      'cloudGPU', 'collaboration', 'AIUpscale', 'XTrans', 'CR3Preview',
      'experimentalAVIF', 'advancedMasks', 'telemetry', 'cloudSync',
      'pwaBackgroundSync', 'highPrecisionCurves'
    ],
  },
  PRIVATE_ALPHA: {
    stage: 'PRIVATE_ALPHA',
    maxUsers: 25,
    rolloutPercentage: 5,
    description: 'Private Alpha invited studio photographers (25 seats)',
    allowedFeatures: [
      'cloudGPU', 'collaboration', 'AIUpscale', 'XTrans', 'CR3Preview',
      'advancedMasks', 'telemetry', 'cloudSync', 'highPrecisionCurves'
    ],
  },
  CLOSED_BETA: {
    stage: 'CLOSED_BETA',
    maxUsers: 100,
    rolloutPercentage: 10,
    description: 'Closed Beta enthusiast community (100 seats)',
    allowedFeatures: [
      'cloudGPU', 'AIUpscale', 'XTrans', 'CR3Preview',
      'advancedMasks', 'telemetry', 'cloudSync', 'highPrecisionCurves'
    ],
  },
  LIMITED_PUBLIC_BETA: {
    stage: 'LIMITED_PUBLIC_BETA',
    maxUsers: 500,
    rolloutPercentage: 15,
    description: 'Limited Public Beta rollout (500 seats)',
    allowedFeatures: [
      'cloudGPU', 'AIUpscale', 'XTrans',
      'advancedMasks', 'telemetry', 'cloudSync', 'highPrecisionCurves'
    ],
  },
  ROLLOUT_25: {
    stage: 'ROLLOUT_25',
    maxUsers: 25000,
    rolloutPercentage: 25,
    description: 'Canary Stage 1: 25% production traffic',
    allowedFeatures: [
      'cloudGPU', 'collaboration', 'AIUpscale', 'XTrans', 'CR3Preview',
      'advancedMasks', 'telemetry', 'cloudSync', 'pwaBackgroundSync', 'highPrecisionCurves'
    ],
  },
  ROLLOUT_50: {
    stage: 'ROLLOUT_50',
    maxUsers: 100000,
    rolloutPercentage: 50,
    description: 'Canary Stage 2: 50% production traffic',
    allowedFeatures: [
      'cloudGPU', 'collaboration', 'AIUpscale', 'XTrans', 'CR3Preview',
      'advancedMasks', 'telemetry', 'cloudSync', 'pwaBackgroundSync', 'highPrecisionCurves'
    ],
  },
  ROLLOUT_75: {
    stage: 'ROLLOUT_75',
    maxUsers: 500000,
    rolloutPercentage: 75,
    description: 'Canary Stage 3: 75% production traffic',
    allowedFeatures: [
      'cloudGPU', 'collaboration', 'AIUpscale', 'XTrans', 'CR3Preview',
      'advancedMasks', 'telemetry', 'cloudSync', 'pwaBackgroundSync', 'highPrecisionCurves'
    ],
  },
  GENERAL_AVAILABILITY: {
    stage: 'GENERAL_AVAILABILITY',
    maxUsers: 10000000,
    rolloutPercentage: 100,
    description: 'General Availability (100% worldwide traffic)',
    allowedFeatures: [
      'cloudGPU', 'collaboration', 'AIUpscale', 'XTrans', 'CR3Preview',
      'experimentalAVIF', 'advancedMasks', 'telemetry', 'cloudSync', 'pwaBackgroundSync', 'highPrecisionCurves'
    ],
  },
};

export interface KillSwitchStatus {
  cloudGPUDisabled: boolean;
  collaborationDisabled: boolean;
  cloudSyncDisabled: boolean;
  experimentalDecodersDisabled: boolean;
  rolloutHalted: boolean;
  reason?: string;
  updatedAt: string;
}

export type FeatureFlags = FeatureFlagConfig & { stage: RolloutStage; rolloutPercentage: number };
export type EmergencyKillSwitches = KillSwitchStatus;

export class FeatureFlagService {
  private static flags: FeatureFlagConfig = {
    cloudGPU: true,
    collaboration: true,
    AIUpscale: true,
    XTrans: true,
    CR3Preview: true,
    experimentalAVIF: false,
    advancedMasks: true,
    telemetry: true,
    cloudSync: true,
    pwaBackgroundSync: true,
    highPrecisionCurves: true,
  };

  private static killSwitches: KillSwitchStatus = {
    cloudGPUDisabled: false,
    collaborationDisabled: false,
    cloudSyncDisabled: false,
    experimentalDecodersDisabled: false,
    rolloutHalted: false,
    updatedAt: new Date().toISOString(),
  };

  private static currentStage: RolloutStage = 'LIMITED_PUBLIC_BETA';

  public static getFlags(): FeatureFlags {
    return {
      ...this.flags,
      stage: this.currentStage,
      rolloutPercentage: ROLLOUT_STAGES[this.currentStage].rolloutPercentage,
    };
  }

  public static isEnabled(flag: keyof FeatureFlagConfig): boolean {
    // 1. Check emergency kill switches first
    if (flag === 'cloudGPU' && this.killSwitches.cloudGPUDisabled) return false;
    if (flag === 'collaboration' && this.killSwitches.collaborationDisabled) return false;
    if (flag === 'cloudSync' && this.killSwitches.cloudSyncDisabled) return false;
    if ((flag === 'XTrans' || flag === 'CR3Preview' || flag === 'experimentalAVIF') && this.killSwitches.experimentalDecodersDisabled) return false;
    if (this.killSwitches.rolloutHalted) return false;

    // 2. Check stage allowance
    const stageConfig = ROLLOUT_STAGES[this.currentStage];
    if (!stageConfig.allowedFeatures.includes(flag)) return false;

    return this.flags[flag] ?? false;
  }

  public static setFlag(flag: keyof FeatureFlagConfig, value: boolean): void {
    this.flags[flag] = value;
  }

  public static getKillSwitches(): Readonly<KillSwitchStatus> {
    return { ...this.killSwitches };
  }

  public static setKillSwitch(
    key: keyof Omit<KillSwitchStatus, 'updatedAt' | 'reason'>,
    disabled: boolean,
    reason?: string
  ): void {
    this.killSwitches[key] = disabled;
    this.killSwitches.reason = reason;
    this.killSwitches.updatedAt = new Date().toISOString();
  }

  public static getRolloutStage(): RolloutStageConfig {
    return ROLLOUT_STAGES[this.currentStage];
  }

  public static setRolloutStage(stage: RolloutStage): void {
    this.currentStage = stage;
  }

  /**
   * Deterministic cohort assignment based on user ID hash
   */
  public static isUserInCohort(userId: string, targetPercentage: number): boolean {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash |= 0;
    }
    const cohort = Math.abs(hash) % 100;
    return cohort < targetPercentage;
  }
}
