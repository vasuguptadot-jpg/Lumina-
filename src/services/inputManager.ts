/**
 * Lumina Studio Pro - Centralized Universal Input Manager & Shortcut Service
 * Normalizes input across Desktop (Mouse, Keyboard, Trackpad), Mobile (Touch, Pinch, Gestures),
 * and Stylus (Apple Pencil, S-Pen, Wacom pressure & tilt).
 */

export type PlatformOS = 'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'other';
export type PointerKind = 'mouse' | 'touch' | 'pen' | 'unknown';

export interface ShortcutDefinition {
  id: string;
  name: string;
  category: 'File' | 'Edit' | 'View' | 'Tools' | 'Layers' | 'Adjustments' | 'Navigation';
  defaultMac: string;
  defaultWin: string;
  customKey?: string;
  description: string;
  action: () => void;
}

export interface StylusState {
  pressure: number;
  tiltX: number;
  tiltY: number;
  isEraser: boolean;
  pointerType: PointerKind;
}

class InputManagerService {
  private static instance: InputManagerService | null = null;
  private platformOS: PlatformOS = 'other';
  private shortcuts: Map<string, ShortcutDefinition> = new Map();
  private isListening = false;
  private customBindings: Record<string, string> = {};

  private currentStylusState: StylusState = {
    pressure: 0.5,
    tiltX: 0,
    tiltY: 0,
    isEraser: false,
    pointerType: 'mouse',
  };

  private constructor() {
    this.detectOS();
    this.loadCustomBindings();
  }

  public static getInstance(): InputManagerService {
    if (!InputManagerService.instance) {
      InputManagerService.instance = new InputManagerService();
    }
    return InputManagerService.instance;
  }

  private detectOS(): void {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent.toLowerCase();
    const platform = (navigator as any).userAgentData?.platform?.toLowerCase() || navigator.platform?.toLowerCase() || '';

    if (/iphone|ipad|ipod/.test(ua) || (platform === 'macintel' && navigator.maxTouchPoints > 1)) {
      this.platformOS = 'ios';
    } else if (/android/.test(ua)) {
      this.platformOS = 'android';
    } else if (/mac/.test(platform) || /macintosh|mac os x/.test(ua)) {
      this.platformOS = 'macos';
    } else if (/win/.test(platform) || /windows/.test(ua)) {
      this.platformOS = 'windows';
    } else if (/linux/.test(platform) || /linux/.test(ua)) {
      this.platformOS = 'linux';
    } else {
      this.platformOS = 'other';
    }
  }

  public getOS(): PlatformOS {
    return this.platformOS;
  }

  public isMacOrIOS(): boolean {
    return this.platformOS === 'macos' || this.platformOS === 'ios';
  }

  public getModifierKeyName(): string {
    return this.isMacOrIOS() ? '⌘' : 'Ctrl';
  }

  public getAltKeyName(): string {
    return this.isMacOrIOS() ? '⌥' : 'Alt';
  }

  public getShiftKeyName(): string {
    return this.isMacOrIOS() ? '⇧' : 'Shift';
  }

  public formatShortcut(shortcutKey: string): string {
    if (this.isMacOrIOS()) {
      return shortcutKey
        .replace(/Ctrl\+/gi, '⌘')
        .replace(/Cmd\+/gi, '⌘')
        .replace(/Alt\+/gi, '⌥')
        .replace(/Shift\+/gi, '⇧');
    } else {
      return shortcutKey
        .replace(/Cmd\+/gi, 'Ctrl+')
        .replace(/⌘/g, 'Ctrl+')
        .replace(/⌥/g, 'Alt+')
        .replace(/⇧/g, 'Shift+');
    }
  }

  /**
   * Register or update a shortcut definition
   */
  public registerShortcut(shortcut: ShortcutDefinition): () => void {
    this.shortcuts.set(shortcut.id, shortcut);
    if (!this.isListening && typeof window !== 'undefined') {
      this.startGlobalListener();
    }
    return () => {
      this.shortcuts.delete(shortcut.id);
    };
  }

  /**
   * Register a batch of shortcuts
   */
  public registerBatch(shortcuts: ShortcutDefinition[]): () => void {
    for (const sc of shortcuts) {
      this.shortcuts.set(sc.id, sc);
    }
    if (!this.isListening && typeof window !== 'undefined') {
      this.startGlobalListener();
    }
    return () => {
      for (const sc of shortcuts) {
        this.shortcuts.delete(sc.id);
      }
    };
  }

  public getAllShortcuts(): ShortcutDefinition[] {
    return Array.from(this.shortcuts.values());
  }

  public updateCustomBinding(id: string, keyCombo: string): void {
    this.customBindings[id] = keyCombo;
    try {
      localStorage.setItem('lumina_custom_shortcuts', JSON.stringify(this.customBindings));
    } catch {
      // LocalStorage fallback
    }
    const def = this.shortcuts.get(id);
    if (def) {
      def.customKey = keyCombo;
    }
  }

  public resetShortcutsToDefault(): void {
    this.customBindings = {};
    try {
      localStorage.removeItem('lumina_custom_shortcuts');
    } catch {}
    for (const def of this.shortcuts.values()) {
      def.customKey = undefined;
    }
  }

  private loadCustomBindings(): void {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('lumina_custom_shortcuts');
      if (saved) {
        this.customBindings = JSON.parse(saved);
      }
    } catch {
      this.customBindings = {};
    }
  }

  private startGlobalListener(): void {
    if (this.isListening || typeof window === 'undefined') return;
    this.isListening = true;

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Do not trigger global shortcuts if focused on input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
          // Allow Escape to blur
          if (e.key === 'Escape') {
            target.blur();
          }
          return;
        }
      }

      // Check key combination
      const isCmdOrCtrl = this.isMacOrIOS() ? e.metaKey : e.ctrlKey;
      const isAlt = e.altKey;
      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();

      for (const def of this.shortcuts.values()) {
        const expectedRaw = def.customKey || (this.isMacOrIOS() ? def.defaultMac : def.defaultWin);
        if (this.matchesKeyEvent(expectedRaw, e, isCmdOrCtrl, isAlt, isShift, key)) {
          e.preventDefault();
          e.stopPropagation();
          try {
            def.action();
          } catch (err) {
            console.error(`[InputManager] Error running shortcut ${def.id}:`, err);
          }
          break;
        }
      }
    });

    // Watch PointerEvents for Stylus / Apple Pencil pressure and tilt
    window.addEventListener('pointermove', (e: PointerEvent) => {
      this.currentStylusState = {
        pressure: e.pressure || 0.5,
        tiltX: e.tiltX || 0,
        tiltY: e.tiltY || 0,
        isEraser: e.button === 5 || (e as any).pointerType === 'pen' && e.buttons === 32,
        pointerType: (e.pointerType as PointerKind) || 'mouse',
      };
    });
  }

  private matchesKeyEvent(
    rawShortcut: string,
    e: KeyboardEvent,
    isCmdOrCtrl: boolean,
    isAlt: boolean,
    isShift: boolean,
    key: string
  ): boolean {
    const parts = rawShortcut.split('+').map((p) => p.trim().toLowerCase());
    const needsMod = parts.includes('ctrl') || parts.includes('cmd') || parts.includes('meta') || parts.includes('⌘');
    const needsAlt = parts.includes('alt') || parts.includes('opt') || parts.includes('option') || parts.includes('⌥');
    const needsShift = parts.includes('shift') || parts.includes('⇧');

    if (needsMod !== isCmdOrCtrl) return false;
    if (needsAlt !== isAlt) return false;
    if (needsShift !== isShift) return false;

    // Get the base key part
    const baseKey = parts[parts.length - 1];
    if (baseKey === 'space' || baseKey === 'spacebar') {
      return e.code === 'Space' || key === ' ';
    }
    if (baseKey === 'esc' || baseKey === 'escape') {
      return key === 'escape';
    }
    if (baseKey === 'tab') {
      return key === 'tab';
    }
    if (baseKey === 'enter' || baseKey === 'return') {
      return key === 'enter';
    }
    if (baseKey === 'backspace' || baseKey === 'delete') {
      return key === 'backspace' || key === 'delete';
    }
    if (baseKey === '+' || baseKey === '=') {
      return key === '+' || key === '=' || key === 'add';
    }
    if (baseKey === '-' || baseKey === '_') {
      return key === '-' || key === '_' || key === 'subtract';
    }
    if (baseKey === '\\') {
      return key === '\\' || key === '|';
    }
    if (baseKey === '?') {
      return key === '?' || (key === '/' && isShift);
    }
    if (baseKey === 'f') {
      return key === 'f';
    }
    if (baseKey === '0') {
      return key === '0';
    }
    if (baseKey === '1') {
      return key === '1';
    }

    return key === baseKey;
  }

  public getStylusState(): StylusState {
    return this.currentStylusState;
  }
}

export const inputManager = InputManagerService.getInstance();
