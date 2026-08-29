/**
 * Lumina Studio Pro - Adaptive Layout & Workspace Manager
 * Classifies screen dimensions, input capabilities, orientation, and OS into
 * three distinct layout modes: DESKTOP, TABLET, and MOBILE.
 */

import { useState, useEffect } from 'react';
import { inputManager, PlatformOS, PointerKind } from './inputManager';
import { hardwareDetector, HardwareTier } from './hardwareDetector';
import { mobileNative } from './mobileNativeService';

export type LayoutMode = 'DESKTOP' | 'TABLET' | 'MOBILE';

export interface ResponsiveLayoutState {
  mode: LayoutMode;
  width: number;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
  pointerType: PointerKind;
  isTouchPrimary: boolean;
  isNative: boolean;
  os: PlatformOS;
  hardwareTier: HardwareTier;
  hasFinePointer: boolean;
  minTouchTargetPx: number;
}

export function detectLayoutState(): ResponsiveLayoutState {
  if (typeof window === 'undefined') {
    return {
      mode: 'DESKTOP',
      width: 1920,
      height: 1080,
      isPortrait: false,
      isLandscape: true,
      pointerType: 'mouse',
      isTouchPrimary: false,
      isNative: false,
      os: 'windows',
      hardwareTier: 'TIER_1_HIGH_END',
      hasFinePointer: true,
      minTouchTargetPx: 44,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isPortrait = height > width;
  const isLandscape = !isPortrait;

  const hasFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const isTouchDevice = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

  const nativeCaps = mobileNative.getCapabilities();
  const os = inputManager.getOS();
  const hwProfile = hardwareDetector.getProfile();

  let mode: LayoutMode = 'DESKTOP';

  // Mobile mode: width < 768px or (phone OS with coarse touch and width < 900 in landscape)
  if (width < 768 || ((os === 'android' || os === 'ios') && !hasFinePointer && width < 900 && isPortrait)) {
    mode = 'MOBILE';
  }
  // Tablet mode: width >= 768 and < 1180, or iPad / Android tablet
  else if (width < 1180 || ((os === 'ios' || os === 'android') && width < 1400)) {
    mode = 'TABLET';
  }
  // Desktop mode: >= 1180px with fine pointer or desktop OS
  else {
    mode = 'DESKTOP';
  }

  const isTouchPrimary = isTouchDevice && !hasFinePointer;
  const minTouchTargetPx = mode === 'MOBILE' ? 48 : mode === 'TABLET' ? 44 : 32;

  return {
    mode,
    width,
    height,
    isPortrait,
    isLandscape,
    pointerType: isTouchPrimary ? 'touch' : 'mouse',
    isTouchPrimary,
    isNative: nativeCaps.isNative,
    os,
    hardwareTier: hwProfile.tier,
    hasFinePointer,
    minTouchTargetPx,
  };
}

export function useAdaptiveLayout(): ResponsiveLayoutState {
  const [layout, setLayout] = useState<ResponsiveLayoutState>(detectLayoutState);

  useEffect(() => {
    let resizeTimer: number | null = null;

    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        setLayout(detectLayoutState());
      }, 50);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return layout;
}
