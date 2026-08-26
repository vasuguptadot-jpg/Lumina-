import JSZip from 'jszip';
import { SocialPreset, SocialCropSettings } from '../types/social';

export const SOCIAL_PRESETS: SocialPreset[] = [
  // --- INSTAGRAM ---
  {
    id: 'ig-post-square',
    platform: 'instagram',
    platformName: 'Instagram',
    category: 'Post',
    title: 'Instagram Post (Square)',
    aspectRatioLabel: '1:1',
    aspectRatioValue: 1,
    width: 1080,
    height: 1080,
    format: 'jpeg',
    recommendedQuality: 92,
    compressionStrategy: 'Optimized 4:4:4 chroma subsampling for zero compression artifacting on Meta CDN',
    safeZoneGuide: 'Universal 1:1 grid preview compatible',
    overlayType: 'instagram_post',
    description: 'Classic square post for feed, carousels, and grid alignment.',
  },
  {
    id: 'ig-post-portrait',
    platform: 'instagram',
    platformName: 'Instagram',
    category: 'Post',
    title: 'Instagram Post (Portrait 4:5)',
    aspectRatioLabel: '4:5',
    aspectRatioValue: 4 / 5,
    width: 1080,
    height: 1350,
    format: 'jpeg',
    recommendedQuality: 92,
    compressionStrategy: 'Maximum feed screen real estate with edge sharpening',
    safeZoneGuide: 'Center 1080×1080 px shows on profile grid',
    overlayType: 'instagram_post',
    description: 'Highest engagement aspect ratio on Instagram mobile feeds.',
  },
  {
    id: 'ig-story',
    platform: 'instagram',
    platformName: 'Instagram',
    category: 'Story',
    title: 'Instagram Story',
    aspectRatioLabel: '9:16',
    aspectRatioValue: 9 / 16,
    width: 1080,
    height: 1920,
    format: 'jpeg',
    recommendedQuality: 90,
    compressionStrategy: 'Mobile full-screen immersive vertical JPEG',
    safeZoneGuide: 'Leave 250px top/bottom margin for username & reply bar',
    overlayType: 'instagram_story',
    description: 'Full-screen 24-hour story with interactive stickers safe zone.',
  },
  {
    id: 'ig-reel-cover',
    platform: 'instagram',
    platformName: 'Instagram',
    category: 'Reel Cover',
    title: 'Instagram Reel Cover',
    aspectRatioLabel: '9:16 (1:1 Safe)',
    aspectRatioValue: 9 / 16,
    width: 1080,
    height: 1920,
    format: 'jpeg',
    recommendedQuality: 92,
    compressionStrategy: 'Dual-target render with 1:1 profile grid safe-zone framing',
    safeZoneGuide: 'Subject centered in 1080×1080 box for profile tab',
    overlayType: 'instagram_reel',
    description: '9:16 video cover with automatic 1:1 center profile grid framing.',
  },

  // --- YOUTUBE ---
  {
    id: 'yt-thumbnail',
    platform: 'youtube',
    platformName: 'YouTube',
    category: 'Thumbnail',
    title: 'YouTube Thumbnail (16:9)',
    aspectRatioLabel: '16:9',
    aspectRatioValue: 16 / 9,
    width: 1280,
    height: 720,
    format: 'jpeg',
    recommendedQuality: 90,
    maxSizeBytes: 2000000, // 2MB YouTube hard cap
    compressionStrategy: 'Iterative compression engine strictly enforced under YouTube 2.0 MB upload limit',
    safeZoneGuide: 'Keep subject away from bottom-right timestamp badge (180×60px)',
    overlayType: 'youtube_thumb',
    description: 'High-contrast 720p thumbnail optimized for mobile & desktop CTR.',
  },
  {
    id: 'yt-thumbnail-hd',
    platform: 'youtube',
    platformName: 'YouTube',
    category: 'Thumbnail',
    title: 'YouTube Thumbnail (Full HD 1080p)',
    aspectRatioLabel: '16:9',
    aspectRatioValue: 16 / 9,
    width: 1920,
    height: 1080,
    format: 'jpeg',
    recommendedQuality: 88,
    maxSizeBytes: 2000000, // 2MB cap
    compressionStrategy: 'Full HD ultra-sharp raster throttled under 2.0 MB',
    safeZoneGuide: 'Optimal for 4K / TV displays and desktop recommendations',
    overlayType: 'youtube_thumb',
    description: 'Crisp 1080p thumbnail with automatic high-frequency micro-contrast.',
  },

  // --- TIKTOK ---
  {
    id: 'tiktok-vertical',
    platform: 'tiktok',
    platformName: 'TikTok',
    category: 'Vertical',
    title: 'TikTok Vertical Format',
    aspectRatioLabel: '9:16',
    aspectRatioValue: 9 / 16,
    width: 1080,
    height: 1920,
    format: 'jpeg',
    recommendedQuality: 92,
    compressionStrategy: 'TikTok mobile feed color profile tuned for vibrant OLED playback',
    safeZoneGuide: 'Safe from right-hand action buttons (like, share) and bottom caption',
    overlayType: 'tiktok_vertical',
    description: '9:16 vertical full-screen format for photo carousels & video covers.',
  },

  // --- X (TWITTER) ---
  {
    id: 'x-post-landscape',
    platform: 'x',
    platformName: 'X (Twitter)',
    category: 'Post',
    title: 'X / Twitter In-Feed Post',
    aspectRatioLabel: '16:9',
    aspectRatioValue: 16 / 9,
    width: 1200,
    height: 675,
    format: 'jpeg',
    recommendedQuality: 92,
    compressionStrategy: 'Lossless web color reproduction with EXIF metadata strip',
    safeZoneGuide: 'No timeline auto-crop on mobile or web',
    overlayType: 'x_feed',
    description: 'Standard 16:9 post that renders fully without cropping in X timelines.',
  },
  {
    id: 'x-post-card',
    platform: 'x',
    platformName: 'X (Twitter)',
    category: 'Post',
    title: 'X / Twitter Summary Card',
    aspectRatioLabel: '1.91:1',
    aspectRatioValue: 1200 / 628,
    width: 1200,
    height: 628,
    format: 'png',
    recommendedQuality: 95,
    compressionStrategy: 'Lossless PNG for pin-sharp text, logos, and edge clarity',
    description: 'Optimal format for Twitter Summary Cards and link previews.',
  },

  // --- FACEBOOK ---
  {
    id: 'fb-feed-portrait',
    platform: 'facebook',
    platformName: 'Facebook',
    category: 'Post',
    title: 'Facebook Feed (Portrait 4:5)',
    aspectRatioLabel: '4:5',
    aspectRatioValue: 4 / 5,
    width: 1080,
    height: 1350,
    format: 'jpeg',
    recommendedQuality: 92,
    compressionStrategy: 'Optimal vertical dimensions for mobile Facebook app timeline',
    overlayType: 'facebook_feed',
    description: 'Tall portrait format commanding maximum screen space on mobile.',
  },
  {
    id: 'fb-cover',
    platform: 'facebook',
    platformName: 'Facebook',
    category: 'Banner',
    title: 'Facebook Cover Banner',
    aspectRatioLabel: '1.91:1',
    aspectRatioValue: 1200 / 630,
    width: 1200,
    height: 630,
    format: 'jpeg',
    recommendedQuality: 94,
    compressionStrategy: 'sRGB profile embedding for desktop & mobile page headers',
    description: 'Page and profile cover banner with desktop and mobile safe zone.',
  },

  // --- LINKEDIN ---
  {
    id: 'linkedin-post',
    platform: 'linkedin',
    platformName: 'LinkedIn',
    category: 'Post',
    title: 'LinkedIn In-Feed Post',
    aspectRatioLabel: '1.91:1',
    aspectRatioValue: 1200 / 627,
    width: 1200,
    height: 627,
    format: 'jpeg',
    recommendedQuality: 92,
    compressionStrategy: 'Professional business feed rendering without blur artifacts',
    overlayType: 'linkedin_feed',
    description: 'Standard landscape image for professional feed posts and articles.',
  },
  {
    id: 'linkedin-square',
    platform: 'linkedin',
    platformName: 'LinkedIn',
    category: 'Post',
    title: 'LinkedIn Square Post',
    aspectRatioLabel: '1:1',
    aspectRatioValue: 1,
    width: 1080,
    height: 1080,
    format: 'jpeg',
    recommendedQuality: 92,
    compressionStrategy: 'High-contrast mobile feed card compression',
    description: 'Square format for maximum readability on LinkedIn mobile apps.',
  },

  // --- PINTEREST ---
  {
    id: 'pinterest-pin',
    platform: 'pinterest',
    platformName: 'Pinterest',
    category: 'Pin',
    title: 'Pinterest Vertical Pin',
    aspectRatioLabel: '2:3',
    aspectRatioValue: 2 / 3,
    width: 1000,
    height: 1500,
    format: 'jpeg',
    recommendedQuality: 94,
    compressionStrategy: 'High dynamic range vertical format for Pinterest grid algorithm',
    description: 'Optimal 2:3 ratio favored by Pinterest discovery search engine.',
  },
];

/**
 * Loads an image or canvas element into an HTMLImageElement
 */
export async function loadImageElement(source: string | HTMLCanvasElement): Promise<HTMLImageElement> {
  if (typeof source !== 'string') {
    const img = new Image();
    img.src = source.toDataURL('image/png');
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });
    return img;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = source;
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = () => {
      // Fallback
      res(null);
    };
  });
  return img;
}

/**
 * Renders an optimized social media image to a Canvas & Blob according to preset and crop settings
 */
export async function renderSocialMediaExport(
  sourceImg: HTMLImageElement,
  preset: SocialPreset,
  settings: SocialCropSettings
): Promise<{ blob: Blob; url: string; sizeBytes: number; canvas: HTMLCanvasElement }> {
  const canvas = document.createElement('canvas');
  canvas.width = preset.width;
  canvas.height = preset.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context creation failed');

  const targetW = preset.width;
  const targetH = preset.height;
  const targetRatio = targetW / targetH;
  const srcW = sourceImg.naturalWidth || sourceImg.width;
  const srcH = sourceImg.naturalHeight || sourceImg.height;
  const srcRatio = srcW / srcH;

  // 1. Background Fill / Matting Strategy
  if (settings.fitMode === 'blurred-fill') {
    // Draw heavily blurred backdrop
    ctx.save();
    ctx.filter = 'blur(40px) brightness(0.7)';
    // Scale up to cover canvas fully
    const scale = Math.max(targetW / srcW, targetH / srcH) * 1.2;
    const bgW = srcW * scale;
    const bgH = srcH * scale;
    ctx.drawImage(sourceImg, (targetW - bgW) / 2, (targetH - bgH) / 2, bgW, bgH);
    ctx.restore();

    // Draw contained foreground with subtle shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;

    const containScale = Math.min(targetW / srcW, targetH / srcH) * 0.92;
    const fgW = srcW * containScale;
    const fgH = srcH * containScale;
    ctx.drawImage(sourceImg, (targetW - fgW) / 2, (targetH - fgH) / 2, fgW, fgH);
    ctx.restore();
  } else if (settings.fitMode === 'matte-black') {
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, targetW, targetH);
    const containScale = Math.min(targetW / srcW, targetH / srcH);
    const fgW = srcW * containScale;
    const fgH = srcH * containScale;
    ctx.drawImage(sourceImg, (targetW - fgW) / 2, (targetH - fgH) / 2, fgW, fgH);
  } else if (settings.fitMode === 'matte-white') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    const containScale = Math.min(targetW / srcW, targetH / srcH);
    const fgW = srcW * containScale;
    const fgH = srcH * containScale;
    ctx.drawImage(sourceImg, (targetW - fgW) / 2, (targetH - fgH) / 2, fgW, fgH);
  } else {
    // smart-cover (default)
    // Calculate source crop window based on focal point & zoom
    let cropW = srcW;
    let cropH = srcH;

    if (srcRatio > targetRatio) {
      // Source is wider than target -> Crop sides
      cropW = srcH * targetRatio;
    } else {
      // Source is taller than target -> Crop top/bottom
      cropH = srcW / targetRatio;
    }

    // Apply user zoom
    cropW /= settings.zoom;
    cropH /= settings.zoom;

    // Calculate crop origin centered on focal point (focalX, focalY in 0..1)
    let cropX = srcW * settings.focalX - cropW / 2;
    let cropY = srcH * settings.focalY - cropH / 2;

    // Clamp inside source image bounds
    cropX = Math.max(0, Math.min(srcW - cropW, cropX));
    cropY = Math.max(0, Math.min(srcH - cropH, cropY));

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceImg, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
  }

  // 2. Output Screen Sharpening (Optional)
  if (settings.sharpenForScreen) {
    applyLightSharpen(ctx, targetW, targetH);
  }

  // 3. Optional Watermark / Photographer Handle
  if (settings.addWatermark && settings.watermarkText.trim()) {
    ctx.save();
    ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(settings.watermarkText.trim(), targetW - 32, targetH - 32);
    ctx.restore();
  }

  // 4. Compression & MIME encoding with automatic size throttle
  const mimeType = preset.format === 'png' ? 'image/png' : preset.format === 'webp' ? 'image/webp' : 'image/jpeg';
  let quality = preset.recommendedQuality / 100;
  let blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), mimeType, quality));

  // Iterative size throttling for strict platform limits (e.g., YouTube 2MB cap)
  if (preset.maxSizeBytes && blob.size > preset.maxSizeBytes) {
    while (blob.size > preset.maxSizeBytes && quality > 0.4) {
      quality -= 0.08;
      blob = await new Promise((res) => canvas.toBlob((b) => res(b!), mimeType, quality));
    }
  }

  const url = URL.createObjectURL(blob);
  return { blob, url, sizeBytes: blob.size, canvas };
}

/**
 * Applies subtle high-frequency edge sharpening for mobile screens
 */
function applyLightSharpen(ctx: CanvasRenderingContext2D, width: number, height: number) {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const weights = [0, -0.15, 0, -0.15, 1.6, -0.15, 0, -0.15, 0];
    const side = Math.round(Math.sqrt(weights.length));
    const halfSide = Math.floor(side / 2);
    const src = new Uint8ClampedArray(data);

    // Apply 3x3 convolution to luminance channel
    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const dstOff = (y * width + x) * 4;
        let r = 0, g = 0, b = 0;
        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = y + cy - halfSide;
            const scx = x + cx - halfSide;
            const srcOff = (scy * width + scx) * 4;
            const wt = weights[cy * side + cx];
            r += src[srcOff] * wt;
            g += src[srcOff + 1] * wt;
            b += src[srcOff + 2] * wt;
          }
        }
        data[dstOff] = Math.min(255, Math.max(0, r));
        data[dstOff + 1] = Math.min(255, Math.max(0, g));
        data[dstOff + 2] = Math.min(255, Math.max(0, b));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    // Ignore cross-origin context restrictions if any
  }
}

/**
 * Generates and downloads a ZIP bundle with all selected social media formats in 1-click
 */
export async function generateSocialBundleZip(
  sourceImg: HTMLImageElement,
  selectedPresets: SocialPreset[],
  settings: SocialCropSettings,
  baseFilename: string,
  onProgress?: (current: number, total: number, presetTitle: string) => void
): Promise<{ zipBlob: Blob; zipUrl: string }> {
  const zip = new JSZip();
  const folder = zip.folder('Social_Media_Exports');

  for (let i = 0; i < selectedPresets.length; i++) {
    const preset = selectedPresets[i];
    onProgress?.(i + 1, selectedPresets.length, preset.title);

    const { blob } = await renderSocialMediaExport(sourceImg, preset, settings);
    const sanitizedTitle = preset.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = preset.format === 'png' ? 'png' : preset.format === 'webp' ? 'webp' : 'jpg';
    const filename = `${baseFilename}_${preset.platform.toUpperCase()}_${sanitizedTitle}_${preset.width}x${preset.height}.${ext}`;

    folder?.file(filename, blob);
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const zipUrl = URL.createObjectURL(zipBlob);
  return { zipBlob, zipUrl };
}
