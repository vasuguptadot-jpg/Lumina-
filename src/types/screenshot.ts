export type DeviceFrameType =
  | 'none'
  | 'iphone-16-pro'
  | 'iphone-16-gold'
  | 'ipad-pro'
  | 'macbook-pro'
  | 'google-pixel'
  | 'browser-safari-dark'
  | 'browser-safari-light'
  | 'browser-chrome'
  | 'minimal-card';

export type StatusBarStyle = 'ios-dark' | 'ios-light' | 'android-dark' | 'android-light';

export interface StatusBarSettings {
  enabled: boolean;
  style: StatusBarStyle;
  time: string;
  batteryPercent: number;
  showWifi: boolean;
  showCellular: boolean;
  showDynamicIsland: boolean;
  cropTopOriginal: number; // px from top of original to mask/replace (e.g. 50)
  carrierText: string;
}

export type RedactionType = 'blur' | 'pixelate' | 'blackout' | 'whiteout' | 'seamless-fill';

export interface RedactionBox {
  id: string;
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  width: number; // normalized 0..1
  height: number; // normalized 0..1
  type: RedactionType;
  label?: string;
}

export type PerspectivePreset =
  | 'flat'
  | 'floating-hero'
  | 'isometric-right'
  | 'isometric-left'
  | 'dramatic-pitch'
  | 'subtle-yaw'
  | 'custom';

export interface PerspectiveSettings {
  enabled: boolean;
  preset: PerspectivePreset;
  rotateX: number; // -45 to 45 deg
  rotateY: number; // -45 to 45 deg
  rotateZ: number; // -30 to 30 deg
  perspective: number; // 600 to 2000
  scale: number; // 0.6 to 1.4
}

export type BackdropType = 'mesh-gradient' | 'studio-gradient' | 'solid' | 'transparent' | 'blurred-wallpaper' | 'ai-pattern';

export interface BackdropSettings {
  type: BackdropType;
  gradientPreset: string;
  solidColor: string;
  blurWallpaperAmount: number;
  paddingX: number; // 0 to 200 px
  paddingY: number; // 0 to 200 px
  aspectRatio: 'auto' | '16:9' | '4:3' | '1:1' | '9:16' | 'twitter-post' | 'dribbble-shot';
}

export type ShadowPreset = 'apple-floating' | 'subtle-studio' | 'deep-3d' | 'cyber-glow' | 'hard-drop' | 'none';

export interface ShadowSettings {
  enabled: boolean;
  preset: ShadowPreset;
  blur: number; // 0 to 120 px
  offsetY: number; // 0 to 80 px
  offsetX: number; // -40 to 40 px
  opacity: number; // 0 to 100%
  spread: number; // 0 to 40 px
  color: string;
}

export interface CornerBorderSettings {
  cornerRadius: number; // 0 to 64 px
  borderWidth: number; // 0 to 10 px
  borderColor: string;
  borderOpacity: number; // 0 to 100%
  innerGlassHighlight: boolean;
}

export interface ScreenshotStudioState {
  deviceFrame: DeviceFrameType;
  statusBar: StatusBarSettings;
  redactions: RedactionBox[];
  perspective: PerspectiveSettings;
  backdrop: BackdropSettings;
  shadow: ShadowSettings;
  corners: CornerBorderSettings;
}

export const DEFAULT_SCREENSHOT_STUDIO_STATE: ScreenshotStudioState = {
  deviceFrame: 'iphone-16-pro',
  statusBar: {
    enabled: true,
    style: 'ios-dark',
    time: '9:41',
    batteryPercent: 100,
    showWifi: true,
    showCellular: true,
    showDynamicIsland: true,
    cropTopOriginal: 48,
    carrierText: '5G',
  },
  redactions: [],
  perspective: {
    enabled: true,
    preset: 'floating-hero',
    rotateX: 8,
    rotateY: -12,
    rotateZ: 4,
    perspective: 1200,
    scale: 0.95,
  },
  backdrop: {
    type: 'mesh-gradient',
    gradientPreset: 'neon-twilight',
    solidColor: '#090d16',
    blurWallpaperAmount: 30,
    paddingX: 80,
    paddingY: 70,
    aspectRatio: '16:9',
  },
  shadow: {
    enabled: true,
    preset: 'apple-floating',
    blur: 50,
    offsetY: 30,
    offsetX: 0,
    opacity: 65,
    spread: 10,
    color: '#000000',
  },
  corners: {
    cornerRadius: 32,
    borderWidth: 1,
    borderColor: '#ffffff',
    borderOpacity: 25,
    innerGlassHighlight: true,
  },
};
