/**
 * Lumina Studio Pro — Hardware Capability Profiler
 *
 * Discovers CPU concurrency, RAM constraints, WebGPU capabilities, battery,
 * and thermal states to compute the system's Hardware Capability Tier (1 - 4).
 */

import { HardwareCapabilityTier, HardwareProfileResult } from '../../types/localAIModels';

export class HardwareProfiler {
  private static instance: HardwareProfiler;
  private cachedProfile: HardwareProfileResult | null = null;
  private isProbing = false;

  private constructor() {}

  public static getInstance(): HardwareProfiler {
    if (!HardwareProfiler.instance) {
      HardwareProfiler.instance = new HardwareProfiler();
    }
    return HardwareProfiler.instance;
  }

  public async getProfile(forceRefresh = false): Promise<HardwareProfileResult> {
    if (this.cachedProfile && !forceRefresh) {
      return this.cachedProfile;
    }

    if (this.isProbing) {
      return this.cachedProfile || this.getDefaultFallbackProfile();
    }

    this.isProbing = true;
    try {
      // 1. CPU Concurrency
      const cpuCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;

      // 2. RAM estimation
      let deviceMemoryGB = 4;
      if (typeof navigator !== 'undefined' && (navigator as any).deviceMemory) {
        deviceMemoryGB = (navigator as any).deviceMemory;
      } else if (typeof performance !== 'undefined' && (performance as any).memory) {
        const heapLimit = (performance as any).memory.jsHeapSizeLimit;
        deviceMemoryGB = Math.max(4, Math.round((heapLimit * 2) / (1024 * 1024 * 1024)));
      }

      // 3. WebGPU Support & Adapter Inspection
      let webGPUSupported = false;
      let webGPUAdapterName = 'Not Available';
      let hasDedicatedGPU = false;

      if (typeof navigator !== 'undefined' && (navigator as any).gpu) {
        try {
          const adapter = await (navigator as any).gpu.requestAdapter();
          if (adapter) {
            webGPUSupported = true;
            const info = await adapter.requestAdapterInfo?.().catch(() => ({}));
            webGPUAdapterName = info?.description || info?.vendor || adapter.name || 'WebGPU Hardware Accelerated Adapter';
            // Check for dedicated GPU indicators (NVIDIA, AMD, Apple, Intel Iris)
            const lowStr = webGPUAdapterName.toLowerCase();
            hasDedicatedGPU =
              lowStr.includes('nvidia') ||
              lowStr.includes('amd') ||
              lowStr.includes('radeon') ||
              lowStr.includes('apple') ||
              lowStr.includes('geforce') ||
              lowStr.includes('rtx');
          }
        } catch {
          webGPUSupported = false;
        }
      }

      // 4. Battery Status
      let batteryStatus: { charging: boolean; level: number } | undefined = undefined;
      let thermalThrottled = false;
      if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
        try {
          const battery = await (navigator as any).getBattery();
          batteryStatus = {
            charging: battery.charging,
            level: battery.level,
          };
          if (!battery.charging && battery.level < 0.15) {
            thermalThrottled = true;
          }
        } catch {}
      }

      // 5. Tier Calculation
      let tier: HardwareCapabilityTier = 1;
      let tierName = 'Tier 1 — Low-End / Mobile Basic (WASM CPU)';
      let maxInferenceDimension = 512;
      let recommendedVLM = 'smolvlm_256m_q4';
      let recommendedSegmentation = 'birefnet_lite';

      if (deviceMemoryGB >= 16 && webGPUSupported && hasDedicatedGPU) {
        tier = 4;
        tierName = 'Tier 4 — Workstation / High-End Studio';
        maxInferenceDimension = 4096;
        recommendedVLM = 'moondream2_q4';
        recommendedSegmentation = 'birefnet_lite';
      } else if (deviceMemoryGB >= 8 && webGPUSupported) {
        tier = 3;
        tierName = 'Tier 3 — High-End Desktop / Apple Silicon / Dedicated GPU';
        maxInferenceDimension = 2048;
        recommendedVLM = 'moondream2_q4';
        recommendedSegmentation = 'birefnet_lite';
      } else if (deviceMemoryGB >= 4 && webGPUSupported) {
        tier = 2;
        tierName = 'Tier 2 — Mid-Range / WebGPU Standard';
        maxInferenceDimension = 1024;
        recommendedVLM = 'smolvlm_256m_q4';
        recommendedSegmentation = 'mobilesam_int8';
      } else {
        tier = 1;
        tierName = 'Tier 1 — Entry / Mobile Basic (WASM CPU)';
        maxInferenceDimension = 512;
        recommendedVLM = 'smolvlm_256m_q4';
        recommendedSegmentation = 'birefnet_lite';
      }

      this.cachedProfile = {
        tier,
        tierName,
        cpuCores,
        deviceMemoryGB,
        webGPUSupported,
        webGPUAdapterName,
        batteryStatus,
        thermalThrottled,
        recommendedVLM,
        recommendedSegmentation,
        maxInferenceDimension,
      };

      return this.cachedProfile;
    } finally {
      this.isProbing = false;
    }
  }

  private getDefaultFallbackProfile(): HardwareProfileResult {
    return {
      tier: 1,
      tierName: 'Tier 1 — Entry Fallback',
      cpuCores: 4,
      deviceMemoryGB: 4,
      webGPUSupported: false,
      webGPUAdapterName: 'CPU SIMD WASM Fallback',
      thermalThrottled: false,
      recommendedVLM: 'smolvlm_256m_q4',
      recommendedSegmentation: 'birefnet_lite',
      maxInferenceDimension: 512,
    };
  }
}

export const hardwareProfiler = HardwareProfiler.getInstance();
