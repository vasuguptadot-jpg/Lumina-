export type SocialPlatform = 
  | 'instagram' 
  | 'youtube' 
  | 'tiktok' 
  | 'x' 
  | 'facebook' 
  | 'linkedin' 
  | 'pinterest';

export type BackgroundFitMode = 'smart-cover' | 'blurred-fill' | 'matte-black' | 'matte-white';

export interface SocialPreset {
  id: string;
  platform: SocialPlatform;
  platformName: string;
  category: 'Post' | 'Story' | 'Reel Cover' | 'Thumbnail' | 'Vertical' | 'Banner' | 'Pin';
  title: string;
  aspectRatioLabel: string;
  aspectRatioValue: number; // width / height
  width: number;
  height: number;
  format: 'jpeg' | 'png' | 'webp';
  recommendedQuality: number; // 0 to 100
  maxSizeBytes?: number;      // e.g. 2 * 1024 * 1024 for YouTube Thumbnails
  compressionStrategy: string;
  safeZoneGuide?: string;
  overlayType?: 
    | 'instagram_post' 
    | 'instagram_story' 
    | 'instagram_reel' 
    | 'youtube_thumb' 
    | 'tiktok_vertical' 
    | 'x_feed' 
    | 'facebook_feed'
    | 'linkedin_feed';
  description: string;
}

export interface SocialCropSettings {
  focalX: number; // 0 to 1 (0.5 is center)
  focalY: number; // 0 to 1 (0.5 is center)
  zoom: number;   // 1 to 2
  fitMode: BackgroundFitMode;
  addWatermark: boolean;
  watermarkText: string;
  sharpenForScreen: boolean;
}

export interface SocialExportProgress {
  currentPreset: string;
  currentIndex: number;
  total: number;
  isGeneratingZip: boolean;
}
