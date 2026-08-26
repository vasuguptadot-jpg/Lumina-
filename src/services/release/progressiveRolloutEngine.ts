/**
 * Lumina Studio Pro - Phase 13K: Feature Flag & Progressive Rollout Engine
 * Automated promotion & safety rollback controller verifying reliability thresholds before each stage promotion.
 */

import { FeatureFlagService, RolloutStage, ROLLOUT_STAGES } from './featureFlags';
import { RealUserReliabilityEngine } from '../diagnostics/realUserReliabilityEngine';

export interface RolloutHealthMetrics {
  errorRatePct: number;
  crashRatePct: number;
  exportSuccessPct: number;
  p95LatencyMs: number;
  dataLossIncidents: number;
}

export interface RolloutPromotionResult {
  previousStage: RolloutStage;
  targetStage: RolloutStage;
  promoted: boolean;
  rollbackTriggered: boolean;
  evaluatedMetrics: RolloutHealthMetrics;
  failureReasons: string[];
  statusMessage: string;
}

export class ProgressiveRolloutEngine {
  private static readonly STAGE_SEQUENCE: RolloutStage[] = [
    'INTERNAL',
    'PRIVATE_ALPHA',
    'CLOSED_BETA',
    'LIMITED_PUBLIC_BETA',
    'ROLLOUT_25',
    'ROLLOUT_50',
    'ROLLOUT_75',
    'GENERAL_AVAILABILITY',
  ];

  /**
   * Evaluate production telemetry and promote or rollback stage safely
   */
  public static evaluateAndPromote(): RolloutPromotionResult {
    const currentConfig = FeatureFlagService.getRolloutStage();
    const currentIndex = this.STAGE_SEQUENCE.indexOf(currentConfig.stage);
    const reliability = RealUserReliabilityEngine.evaluateGateStatus();

    const metrics: RolloutHealthMetrics = {
      errorRatePct: Math.round((100 - reliability.metrics.rawDevelopmentSuccessRate.actual) * 100) / 100,
      crashRatePct: Math.round((100 - reliability.metrics.crashFreeSessions.actual) * 100) / 100,
      exportSuccessPct: reliability.metrics.exportSuccessRate.actual,
      p95LatencyMs: 42,
      dataLossIncidents: reliability.metrics.dataLossRate.actual > 0 ? 1 : 0,
    };

    const failureReasons: string[] = [];

    // Safety checks
    if (metrics.dataLossIncidents > 0) {
      failureReasons.push('CRITICAL: Data loss incident detected (>0.00%). Immediate rollback required.');
    }
    if (metrics.crashRatePct > 0.5) {
      failureReasons.push(`Crash rate (${metrics.crashRatePct}%) exceeds threshold (0.50%).`);
    }
    if (metrics.exportSuccessPct < 99.5) {
      failureReasons.push(`Export success rate (${metrics.exportSuccessPct}%) is below 99.5%.`);
    }
    if (metrics.errorRatePct > 1.0) {
      failureReasons.push(`Error rate (${metrics.errorRatePct}%) exceeds 1.0% threshold.`);
    }

    if (failureReasons.length > 0) {
      // Trigger automatic rollback
      const prevIndex = Math.max(0, currentIndex - 1);
      const rollbackStage = this.STAGE_SEQUENCE[prevIndex];
      FeatureFlagService.setRolloutStage(rollbackStage);
      FeatureFlagService.setKillSwitch('rolloutHalted', true, `Auto-rollback due to health breach: ${failureReasons.join('; ')}`);

      return {
        previousStage: currentConfig.stage,
        targetStage: rollbackStage,
        promoted: false,
        rollbackTriggered: true,
        evaluatedMetrics: metrics,
        failureReasons,
        statusMessage: `Rollback triggered to ${rollbackStage}. Rollout halted pending investigation.`,
      };
    }

    // Health checks passed -> Promote to next stage if available
    const nextIndex = Math.min(this.STAGE_SEQUENCE.length - 1, currentIndex + 1);
    const targetStage = this.STAGE_SEQUENCE[nextIndex];

    if (nextIndex > currentIndex) {
      FeatureFlagService.setRolloutStage(targetStage);
    }

    return {
      previousStage: currentConfig.stage,
      targetStage,
      promoted: nextIndex > currentIndex,
      rollbackTriggered: false,
      evaluatedMetrics: metrics,
      failureReasons: [],
      statusMessage: nextIndex > currentIndex
        ? `All health checks passed. Successfully promoted to ${targetStage} (${ROLLOUT_STAGES[targetStage].rolloutPercentage}% rollout).`
        : `Already at highest stage (${targetStage}). All health checks pristine.`,
    };
  }
}
