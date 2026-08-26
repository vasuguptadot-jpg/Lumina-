/**
 * Lumina Studio Pro - Phase 13G: Intelligent Local vs Cloud Router
 * Multi-factor execution routing calculating optimal latency, hardware pressure, battery, and economic cost.
 */

import { DeviceScalabilityEngine, HardwarePerformanceTier } from '../storage/deviceScalabilityEngine';

export type ExecutionDestination = 'LOCAL' | 'CLOUD' | 'HYBRID';

export interface ExecutionJobRequest {
  jobType:
    | 'BASIC_ADJUSTMENT'
    | 'TONE_CURVE_EVALUATION'
    | 'BILATERAL_DENOISE'
    | 'AI_NEURAL_DENOISE'
    | 'AI_SUPER_RESOLUTION_4X'
    | 'ADVANCED_SEMANTIC_MASK'
    | 'PANORAMA_STITCH_HDR'
    | 'BATCH_EXPORT_FULL_RES';
  imageMegapixels: number;
  isBatteryLow?: boolean;
  networkLatencyMs?: number;
  memoryPressureTier?: 'NORMAL' | 'MODERATE' | 'CRITICAL' | 'EMERGENCY';
  hardwareTierOverride?: HardwarePerformanceTier;
}

export interface RoutingDecisionResult {
  destination: ExecutionDestination;
  estimatedLocalTimeMs: number;
  estimatedCloudTimeMs: number;
  estimatedUploadLatencyMs: number;
  estimatedGpuCostUSD: number;
  estimatedStorageCostUSD: number;
  estimatedBandwidthCostUSD: number;
  totalEstimatedCostUSD: number;
  decisionReason: string;
  isOffloadRecommended: boolean;
  confidenceScore: number;
}

export class IntelligentExecutionRouter {
  /**
   * Evaluate multi-factor cost and performance equation to choose optimal execution plan
   */
  public static routeJob(request: ExecutionJobRequest): RoutingDecisionResult {
    const devProfile = request.hardwareTierOverride
      ? DeviceScalabilityEngine.getProfileForTier(request.hardwareTierOverride)
      : DeviceScalabilityEngine.detectAndTune();

    const netLatency = request.networkLatencyMs ?? 45;
    const mp = request.imageMegapixels;
    const isBatteryLow = request.isBatteryLow ?? false;
    const memPressure = request.memoryPressureTier ?? 'NORMAL';

    // 1. Calculate Estimated Local Time
    let baseLocalTimeMs = 20;
    switch (request.jobType) {
      case 'BASIC_ADJUSTMENT':
      case 'TONE_CURVE_EVALUATION':
        baseLocalTimeMs = (mp / 24) * 12;
        break;
      case 'BILATERAL_DENOISE':
        baseLocalTimeMs = (mp / 24) * 80;
        break;
      case 'ADVANCED_SEMANTIC_MASK':
        baseLocalTimeMs = (mp / 24) * 450;
        break;
      case 'AI_NEURAL_DENOISE':
        baseLocalTimeMs = (mp / 24) * 2800; // Local WebGPU AI model
        break;
      case 'AI_SUPER_RESOLUTION_4X':
        baseLocalTimeMs = (mp / 24) * 7200; // Very heavy on local
        break;
      case 'PANORAMA_STITCH_HDR':
        baseLocalTimeMs = (mp / 24) * 4500;
        break;
      case 'BATCH_EXPORT_FULL_RES':
        baseLocalTimeMs = (mp / 24) * 350;
        break;
    }

    // Hardware Tier Multiplier
    let tierMultiplier = 1.0;
    if (devProfile.tier === 'TIER_1_HIGH_END') tierMultiplier = 0.55;
    else if (devProfile.tier === 'TIER_2_MID_RANGE') tierMultiplier = 1.0;
    else if (devProfile.tier === 'TIER_3_MOBILE') tierMultiplier = 2.4;
    else tierMultiplier = 5.0; // Tier 4 slow

    if (memPressure === 'CRITICAL' || memPressure === 'EMERGENCY') {
      tierMultiplier *= 2.5;
    }

    const estimatedLocalTimeMs = Math.round(baseLocalTimeMs * tierMultiplier);

    // 2. Calculate Cloud Execution & Latency
    const uploadTimeMs = Math.round(netLatency * 2 + (mp * 0.4 * 8)); // Approx 0.4MB per MP proxy compressed
    let cloudGpuComputeMs = 180;
    let cloudGpuCost = 0.0008;

    switch (request.jobType) {
      case 'BASIC_ADJUSTMENT':
      case 'TONE_CURVE_EVALUATION':
        cloudGpuComputeMs = 40;
        cloudGpuCost = 0.0002;
        break;
      case 'BILATERAL_DENOISE':
        cloudGpuComputeMs = 90;
        cloudGpuCost = 0.0005;
        break;
      case 'ADVANCED_SEMANTIC_MASK':
        cloudGpuComputeMs = 150;
        cloudGpuCost = 0.0010;
        break;
      case 'AI_NEURAL_DENOISE':
        cloudGpuComputeMs = 280;
        cloudGpuCost = 0.0025;
        break;
      case 'AI_SUPER_RESOLUTION_4X':
        cloudGpuComputeMs = 480;
        cloudGpuCost = 0.0040;
        break;
      case 'PANORAMA_STITCH_HDR':
        cloudGpuComputeMs = 620;
        cloudGpuCost = 0.0050;
        break;
      case 'BATCH_EXPORT_FULL_RES':
        cloudGpuComputeMs = 120;
        cloudGpuCost = 0.0012;
        break;
    }

    const estimatedCloudTimeMs = Math.round(uploadTimeMs + cloudGpuComputeMs + (netLatency * 1.5));
    const estimatedStorageCostUSD = 0.0001;
    const estimatedBandwidthCostUSD = Math.round((mp * 0.4 * 0.00008) * 10000) / 10000;
    const totalEstimatedCostUSD = Math.round((cloudGpuCost + estimatedStorageCostUSD + estimatedBandwidthCostUSD) * 10000) / 10000;

    // 3. Routing Decision Logic
    let destination: ExecutionDestination = 'LOCAL';
    let decisionReason = '';
    let isOffloadRecommended = false;

    // Heavy AI tasks or extreme resolutions or low memory devices route to Cloud
    if (
      request.jobType === 'AI_SUPER_RESOLUTION_4X' ||
      (request.jobType === 'AI_NEURAL_DENOISE' && mp > 24) ||
      (mp > devProfile.tunedParameters.autoCloudOffloadThresholdMP) ||
      memPressure === 'EMERGENCY'
    ) {
      destination = 'CLOUD';
      isOffloadRecommended = true;
      decisionReason = `Heavy computational workload (${mp}MP ${request.jobType.replace(/_/g, ' ')}) completes ${Math.round(estimatedLocalTimeMs / estimatedCloudTimeMs)}x faster in Cloud GPU cluster without local memory exhaustion.`;
    } else if (
      (request.jobType === 'PANORAMA_STITCH_HDR' || request.jobType === 'BATCH_EXPORT_FULL_RES') &&
      devProfile.tier === 'TIER_3_MOBILE'
    ) {
      destination = 'HYBRID';
      isOffloadRecommended = true;
      decisionReason = 'Hybrid mode: Instant local preview tile generated while full-resolution render batch runs asynchronously on Cloud GPU.';
    } else if (estimatedLocalTimeMs <= estimatedCloudTimeMs || estimatedLocalTimeMs < 300) {
      destination = 'LOCAL';
      isOffloadRecommended = false;
      decisionReason = `Local execution is instantaneous (${estimatedLocalTimeMs}ms vs ${estimatedCloudTimeMs}ms Cloud) with $0.00 cloud cost and zero network dependency.`;
    } else if (isBatteryLow && devProfile.hardwareCharacteristics.isMobileOrTablet) {
      destination = 'CLOUD';
      isOffloadRecommended = true;
      decisionReason = 'Battery saver protection: Offloading heavy shader execution to Cloud GPU extends device battery life.';
    } else {
      destination = estimatedLocalTimeMs > 2500 ? 'CLOUD' : 'LOCAL';
      isOffloadRecommended = destination === 'CLOUD';
      decisionReason = destination === 'CLOUD'
        ? `Cloud acceleration selected to avoid UI thread lag (${estimatedCloudTimeMs}ms Cloud vs ${estimatedLocalTimeMs}ms Local).`
        : `Local GPU WebGL2 processing selected (${estimatedLocalTimeMs}ms).`;
    }

    return {
      destination,
      estimatedLocalTimeMs,
      estimatedCloudTimeMs,
      estimatedUploadLatencyMs: uploadTimeMs,
      estimatedGpuCostUSD: cloudGpuCost,
      estimatedStorageCostUSD,
      estimatedBandwidthCostUSD,
      totalEstimatedCostUSD,
      decisionReason,
      isOffloadRecommended,
      confidenceScore: 0.98,
    };
  }
}
