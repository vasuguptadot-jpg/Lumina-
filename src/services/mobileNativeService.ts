/**
 * Lumina Studio Pro - Mobile Native Platform Service
 * Integrates Capacitor native plugins (StatusBar, Haptics, App, Share, ScreenOrientation)
 * with robust fallbacks for progressive web applications (PWA) and standard desktop browsers.
 */

import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { ScreenOrientation } from '@capacitor/screen-orientation';

export interface MobilePlatformCapabilities {
  isNative: boolean;
  platform: string;
  isAndroid: boolean;
  isIOS: boolean;
  hasTouch: boolean;
}

export class MobileNativeService {
  private static instance: MobileNativeService | null = null;
  private backButtonCallbacks: Array<() => boolean> = [];
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): MobileNativeService {
    if (!MobileNativeService.instance) {
      MobileNativeService.instance = new MobileNativeService();
    }
    return MobileNativeService.instance;
  }

  public getCapabilities(): MobilePlatformCapabilities {
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    return {
      isNative,
      platform,
      isAndroid: platform === 'android',
      isIOS: platform === 'ios',
      hasTouch: typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0),
    };
  }

  /**
   * Initializes native mobile styling (status bar, navigation bar, lifecycle listeners)
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    const capabilities = this.getCapabilities();

    if (capabilities.isNative) {
      try {
        // Configure strict monochrome status bar
        await StatusBar.setStyle({ style: Style.Dark });
        if (capabilities.isAndroid) {
          await StatusBar.setBackgroundColor({ color: '#000000' });
        }
      } catch (err) {
        console.warn('[MobileNativeService] StatusBar init warning:', err);
      }

      try {
        // Register native Android hardware back button handler
        CapApp.addListener('backButton', ({ canGoBack }) => {
          this.handleHardwareBackButton(canGoBack);
        });

        // App state change (pause / resume / memory)
        CapApp.addListener('appStateChange', (state) => {
          if (!state.isActive) {
            // Trigger emergency memory flush and dirty state sync
            window.dispatchEvent(new CustomEvent('lumina-app-pause'));
          } else {
            window.dispatchEvent(new CustomEvent('lumina-app-resume'));
          }
        });
      } catch (err) {
        console.warn('[MobileNativeService] CapApp listener warning:', err);
      }
    }
  }

  /**
   * Register a callback for hardware back button. Return true if handled, false to delegate.
   */
  public registerBackButtonHandler(callback: () => boolean): () => void {
    this.backButtonCallbacks.push(callback);
    return () => {
      this.backButtonCallbacks = this.backButtonCallbacks.filter((cb) => cb !== callback);
    };
  }

  private handleHardwareBackButton(canGoBack: boolean): void {
    // Process from most recently registered (e.g. top-most modal)
    for (let i = this.backButtonCallbacks.length - 1; i >= 0; i--) {
      const handled = this.backButtonCallbacks[i]();
      if (handled) return;
    }

    if (canGoBack) {
      window.history.back();
    } else {
      // Prompt or minimize app
      CapApp.minimizeApp().catch(() => {});
    }
  }

  /**
   * Trigger haptic feedback for tactile precision
   */
  public async hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const capStyle =
        style === 'heavy'
          ? ImpactStyle.Heavy
          : style === 'medium'
          ? ImpactStyle.Medium
          : ImpactStyle.Light;
      await Haptics.impact({ style: capStyle });
    } catch {
      // Ignore unsupported devices
    }
  }

  public async hapticNotification(type: 'success' | 'warning' | 'error' = 'success'): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const capType =
        type === 'error'
          ? NotificationType.Error
          : type === 'warning'
          ? NotificationType.Warning
          : NotificationType.Success;
      await Haptics.notification({ type: capType });
    } catch {
      // Ignore unsupported devices
    }
  }

  /**
   * Native Share or Web Share API
   */
  public async shareExport(title: string, text: string, urlOrBase64?: string, dialogTitle: string = 'Export from Lumina Studio Pro'): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title,
          text,
          url: urlOrBase64,
          dialogTitle,
        });
        return true;
      } else if (navigator.share) {
        await navigator.share({
          title,
          text,
          url: urlOrBase64,
        });
        return true;
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('[MobileNativeService] Share error:', err);
      }
    }
    return false;
  }

  /**
   * Lock or unlock screen orientation for photo editing
   */
  public async lockOrientation(type: 'portrait' | 'landscape' | 'any'): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      if (type === 'portrait') {
        await ScreenOrientation.lock({ orientation: 'portrait' });
      } else if (type === 'landscape') {
        await ScreenOrientation.lock({ orientation: 'landscape' });
      } else {
        await ScreenOrientation.unlock();
      }
    } catch {
      // Orientation lock might not be supported on all form factors
    }
  }
}

export const mobileNative = MobileNativeService.getInstance();
