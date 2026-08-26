/**
 * Lumina Studio Pro - Phase 13F: Memory & Device Scalability
 * Automatic hardware classification into Tiers 1-4 and dynamic worker/tile/preview/cloud tuning.
 */

export type HardwarePerformanceTier = 'TIER_1_HIGH_END' | 'TIER_2_MID_RANGE' | 'TIER_3_MOBILE' | 'TIER_4_LOW_MEMORY';

export interface DeviceScalabilityProfile {
  tier: HardwarePerformanceTier;
  tierLabel: string;
  hardwareCharacteristics: {
    estimatedRamGB: number;
    logicalCores: number;
    hasDedicatedGpu: boolean;
    isMobileOrTablet: boolean;
    maxSupportedWorkflowMP: number;
  };
  tunedParameters: {
    workerPoolSize: number;
    tileProcessingSizePx: number;
    previewMaxDimensionPx: number;
    inMemoryCacheCapacityMB: number;
    texturePrecision: 'FLOAT32' | 'FLOAT16' | 'UNORM8';
    allowLocal100MPDecode: boolean;
    autoCloudOffloadThresholdMP: number;
    enableAggressiveTileStreaming: boolean;
  };
}

export class DeviceScalabilityEngine {
  private static cachedProfile: DeviceScalabilityProfile | null = null;

  /**
   * Automatically detect system capabilities and derive optimal hardware tier & tuning parameters
   */
  public static detectAndTune(): DeviceScalabilityProfile {
    if (this.cachedProfile) {
      return this.cachedProfile;
    }

    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 8;
    const memoryNav = typeof navigator !== 'undefined' ? ((navigator as any).deviceMemory || 8) : 16;
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

    let tier: HardwarePerformanceTier = 'TIER_2_MID_RANGE';

    if (memoryNav >= 16 && cores >= 8 && !isMobile) {
      tier = 'TIER_1_HIGH_END';
    } else if (memoryNav >= 8 && cores >= 4 && !isMobile) {
      tier = 'TIER_2_MID_RANGE';
    } else if (isMobile || memoryNav >= 4) {
      tier = 'TIER_3_MOBILE';
    } else {
      tier = 'TIER_4_LOW_MEMORY';
    }

    this.cachedProfile = this.getProfileForTier(tier, memoryNav, cores, isMobile);
    return this.cachedProfile;
  }

  public static getProfileForTier(
    tier: HardwarePerformanceTier,
    estimatedRamGB = 16,
    cores = 8,
    isMobile = false
  ): DeviceScalabilityProfile {
    switch (tier) {
      case 'TIER_1_HIGH_END':
        return {
          tier: 'TIER_1_HIGH_END',
          tierLabel: 'Tier 1 — High-End Desktop / Workstation (48–150MP)',
          hardwareCharacteristics: {
            estimatedRamGB: Math.max(16, estimatedRamGB),
            logicalCores: Math.max(8, cores),
            hasDedicatedGpu: true,
            isMobileOrTablet: false,
            maxSupportedWorkflowMP: 150,
          },
          tunedParameters: {
            workerPoolSize: Math.min(8, cores),
            tileProcessingSizePx: 1024,
            previewMaxDimensionPx: 3840, // 4K preview
            inMemoryCacheCapacityMB: 2048,
            texturePrecision: 'FLOAT32',
            allowLocal100MPDecode: true,
            autoCloudOffloadThresholdMP: 100,
            enableAggressiveTileStreaming: false,
          },
        };

      case 'TIER_2_MID_RANGE':
        return {
          tier: 'TIER_2_MID_RANGE',
          tierLabel: 'Tier 2 — Mid-Range Laptop / Desktop (24–48MP)',
          hardwareCharacteristics: {
            estimatedRamGB: Math.min(16, Math.max(8, estimatedRamGB)),
            logicalCores: Math.max(4, cores),
            hasDedicatedGpu: false,
            isMobileOrTablet: false,
            maxSupportedWorkflowMP: 48,
          },
          tunedParameters: {
            workerPoolSize: 4,
            tileProcessingSizePx: 512,
            previewMaxDimensionPx: 2560, // QHD preview
            inMemoryCacheCapacityMB: 1024,
            texturePrecision: 'FLOAT16',
            allowLocal100MPDecode: false,
            autoCloudOffloadThresholdMP: 45,
            enableAggressiveTileStreaming: false,
          },
        };

      case 'TIER_3_MOBILE':
        return {
          tier: 'TIER_3_MOBILE',
          tierLabel: 'Tier 3 — Mobile / Tablet (12–24MP)',
          hardwareCharacteristics: {
            estimatedRamGB: Math.min(8, Math.max(4, estimatedRamGB)),
            logicalCores: cores,
            hasDedicatedGpu: false,
            isMobileOrTablet: true,
            maxSupportedWorkflowMP: 24,
          },
          tunedParameters: {
            workerPoolSize: 2,
            tileProcessingSizePx: 256,
            previewMaxDimensionPx: 1920, // FHD preview
            inMemoryCacheCapacityMB: 512,
            texturePrecision: 'FLOAT16',
            allowLocal100MPDecode: false,
            autoCloudOffloadThresholdMP: 24,
            enableAggressiveTileStreaming: true,
          },
        };

      case 'TIER_4_LOW_MEMORY':
      default:
        return {
          tier: 'TIER_4_LOW_MEMORY',
          tierLabel: 'Tier 4 — Low-Memory / Emergency Streaming (<4GB)',
          hardwareCharacteristics: {
            estimatedRamGB: Math.min(4, estimatedRamGB),
            logicalCores: Math.min(2, cores),
            hasDedicatedGpu: false,
            isMobileOrTablet: isMobile,
            maxSupportedWorkflowMP: 12,
          },
          tunedParameters: {
            workerPoolSize: 1,
            tileProcessingSizePx: 128,
            previewMaxDimensionPx: 1280, // 720p preview
            inMemoryCacheCapacityMB: 256,
            texturePrecision: 'UNORM8',
            allowLocal100MPDecode: false,
            autoCloudOffloadThresholdMP: 12,
            enableAggressiveTileStreaming: true,
          },
        };
    }
  }

  /**
   * Force manual override for stress-testing or demonstration
   */
  public static overrideTier(tier: HardwarePerformanceTier): DeviceScalabilityProfile {
    this.cachedProfile = this.getProfileForTier(tier);
    return this.cachedProfile;
  }
}
