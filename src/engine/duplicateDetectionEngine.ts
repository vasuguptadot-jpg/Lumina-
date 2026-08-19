import { PhotoItem, DuplicateCluster, DuplicatePhotoItem, DuplicateType } from '../types/library';

/**
 * Generates initial rich duplicate & burst clusters with AI curation metrics
 */
export function generateDuplicateClusters(photos: PhotoItem[]): DuplicateCluster[] {
  const clusters: DuplicateCluster[] = [];

  // 1. Burst Sequence 1: Malibu Beach Sunset Walk (20-shot Burst Sequence: Keep Best 3, Delete 17)
  const beachPhoto = photos.find((p) => p.id === 'photo_beach_malibu_01') || photos[0];
  if (beachPhoto) {
    const burstPhotos: DuplicatePhotoItem[] = [];
    const totalCount = 20;
    const recommendedKeepCount = 3;

    for (let i = 1; i <= totalCount; i++) {
      // Simulate slight variations in sharpness, eye blinks, and framing across continuous shutter burst
      let sharpness = 70 + ((i * 17) % 29);
      let faceExpression = 65 + ((i * 23) % 34);
      let reason = '';
      let isKeep = false;

      // Make shots 7, 12, and 15 the clear winners
      if (i === 7) {
        sharpness = 99;
        faceExpression = 98;
        reason = '👑 AI Pick #1: Peak facial expression, sharpest iris focus (99%), optimal wave rim-light';
      } else if (i === 12) {
        sharpness = 96;
        faceExpression = 94;
        reason = '👑 AI Pick #2: Flawless posture, dynamic ocean water splash, high micro-contrast (96%)';
      } else if (i === 15) {
        sharpness = 93;
        faceExpression = 92;
        reason = '👑 AI Pick #3: Warmest golden light catchlight in eyes, balanced horizon framing';
      } else if (i === 2 || i === 8 || i === 14) {
        sharpness = 64;
        faceExpression = 50;
        reason = 'Closed eyes / mid-blink detected with slight camera panning blur';
      } else if (i === 4 || i === 18) {
        sharpness = 68;
        faceExpression = 70;
        reason = 'Slight motion blur on subject hand & feet (68% sharpness)';
      } else if (i === 1 || i === 20) {
        sharpness = 72;
        faceExpression = 65;
        reason = 'Sub-optimal framing at edges of shutter cycle';
      } else {
        sharpness = 75 + (i % 8);
        faceExpression = 72 + (i % 6);
        reason = `Redundant burst frame #${i} — 120ms delta from best frame`;
      }

      const simScore = 94 + (i % 5);
      const photoCopy: PhotoItem = {
        ...beachPhoto,
        id: `burst_beach_malibu_${i}`,
        title: `Malibu_Beach_Sunset_Burst_${String(i).padStart(2, '0')}.jpg`,
        createdAt: beachPhoto.createdAt + i * 150, // 150ms intervals (approx 7 fps burst)
        fileSize: beachPhoto.fileSize + (i % 3) * 45000,
        burstSequenceId: 'cluster_burst_malibu_20',
        burstIndex: i,
      };

      burstPhotos.push({
        photo: photoCopy,
        similarityScore: simScore,
        isRecommendedKeep: false,
        isMarkedForDeletion: true,
        rank: 0,
        aiCurationReason: reason,
        sharpnessScore: sharpness,
        faceExpressionScore: faceExpression,
        timeDeltaMs: i * 150,
      });
    }

    // Sort by weighted quality and set ranks
    burstPhotos.sort((a, b) => {
      const scoreA = a.sharpnessScore * 0.5 + a.faceExpressionScore * 0.5;
      const scoreB = b.sharpnessScore * 0.5 + b.faceExpressionScore * 0.5;
      return scoreB - scoreA;
    });

    burstPhotos.forEach((item, index) => {
      item.rank = index + 1;
      if (index < recommendedKeepCount) {
        item.isRecommendedKeep = true;
        item.isMarkedForDeletion = false;
      } else {
        item.isRecommendedKeep = false;
        item.isMarkedForDeletion = true;
      }
    });

    const potentialSavings = burstPhotos
      .filter((p) => p.isMarkedForDeletion)
      .reduce((acc, curr) => acc + curr.photo.fileSize, 0);

    clusters.push({
      id: 'cluster_burst_malibu_20',
      title: 'Malibu Shoreline Action Burst Sequence',
      type: 'burst',
      detectedAt: Date.now() - 86400000 * 1,
      totalCount: 20,
      recommendedKeepCount: 3,
      currentKeepCount: 3,
      currentDeleteCount: 17,
      potentialSpaceSavings: potentialSavings,
      photos: burstPhotos,
      bestPhotoId: burstPhotos[0].photo.id,
      sceneSummary: '20 high-speed continuous shutter frames taken over 3.0 seconds at 7 fps. AI analyzed facial expressions and iris focus to recommend the top 3 keepers and clean 17 redundant frames.',
    });
  }

  // 2. Burst Sequence 2: GT3 Alpine Pass Mountain Hairpin (8-shot Burst Sequence: Keep Best 2, Delete 6)
  const carPhoto = photos.find((p) => p.id === 'photo_car_supercar_02') || photos[1];
  if (carPhoto) {
    const burstPhotos: DuplicatePhotoItem[] = [];
    const totalCount = 8;
    const recommendedKeepCount = 2;

    for (let i = 1; i <= totalCount; i++) {
      let sharpness = 75 + (i * 13) % 20;
      let reason = `Burst frame #${i} tracking apex curve`;

      if (i === 4) {
        sharpness = 99;
        reason = '👑 AI Pick #1: Perfect apex positioning, razor-sharp front wheel & badge detail (99%)';
      } else if (i === 5) {
        sharpness = 95;
        reason = '👑 AI Pick #2: Dynamic asphalt tire smoke reflection, crisp mountain background';
      } else if (i === 1 || i === 8) {
        sharpness = 69;
        reason = 'Vehicle entering/exiting optimal composition framing';
      } else {
        sharpness = 78;
        reason = `Redundant continuous burst capture #${i}`;
      }

      const photoCopy: PhotoItem = {
        ...carPhoto,
        id: `burst_gt3_alps_${i}`,
        title: `Porsche_GT3_Alpine_Apex_Burst_${String(i).padStart(2, '0')}.jpg`,
        createdAt: carPhoto.createdAt + i * 200,
        fileSize: carPhoto.fileSize + (i % 2) * 60000,
        burstSequenceId: 'cluster_burst_gt3_8',
        burstIndex: i,
      };

      burstPhotos.push({
        photo: photoCopy,
        similarityScore: 96,
        isRecommendedKeep: false,
        isMarkedForDeletion: true,
        rank: 0,
        aiCurationReason: reason,
        sharpnessScore: sharpness,
        faceExpressionScore: 90,
        timeDeltaMs: i * 200,
      });
    }

    burstPhotos.sort((a, b) => b.sharpnessScore - a.sharpnessScore);
    burstPhotos.forEach((item, index) => {
      item.rank = index + 1;
      if (index < recommendedKeepCount) {
        item.isRecommendedKeep = true;
        item.isMarkedForDeletion = false;
      } else {
        item.isRecommendedKeep = false;
        item.isMarkedForDeletion = true;
      }
    });

    const potentialSavings = burstPhotos
      .filter((p) => p.isMarkedForDeletion)
      .reduce((acc, curr) => acc + curr.photo.fileSize, 0);

    clusters.push({
      id: 'cluster_burst_gt3_8',
      title: 'Alpine Supercar Mountain Hairpin Burst',
      type: 'burst',
      detectedAt: Date.now() - 86400000 * 2,
      totalCount: 8,
      recommendedKeepCount: 2,
      currentKeepCount: 2,
      currentDeleteCount: 6,
      potentialSpaceSavings: potentialSavings,
      photos: burstPhotos,
      bestPhotoId: burstPhotos[0].photo.id,
      sceneSummary: '8 continuous tracking shots through Swiss mountain curve. AI recommends keeping the 2 sharpest apex frames and deleting the remaining 6.',
    });
  }

  // 3. Near Duplicates: Studio Fashion Editorial Lighting Bracket (5 shots: Keep Best 1, Delete 4)
  const portraitPhoto = photos.find((p) => p.id === 'photo_portrait_studio_01') || photos[2];
  if (portraitPhoto) {
    const nearPhotos: DuplicatePhotoItem[] = [
      {
        photo: {
          ...portraitPhoto,
          id: 'near_portrait_studio_best',
          title: 'Editorial_Studio_Fashion_Final_Master.jpg',
        },
        similarityScore: 98,
        isRecommendedKeep: true,
        isMarkedForDeletion: false,
        rank: 1,
        aiCurationReason: '👑 AI Pick #1: Master exposure with perfect key light specular catchlights and 100% skin detail',
        sharpnessScore: 98,
        faceExpressionScore: 98,
      },
      {
        photo: {
          ...portraitPhoto,
          id: 'near_portrait_studio_var1',
          title: 'Editorial_Studio_Fashion_UnderExp_01.jpg',
          fileSize: 3400000,
        },
        similarityScore: 95,
        isRecommendedKeep: false,
        isMarkedForDeletion: true,
        rank: 2,
        aiCurationReason: 'Slight -0.7 EV underexposure in shadow regions',
        sharpnessScore: 88,
        faceExpressionScore: 91,
      },
      {
        photo: {
          ...portraitPhoto,
          id: 'near_portrait_studio_var2',
          title: 'Editorial_Studio_Fashion_OverExp_02.jpg',
          fileSize: 3750000,
        },
        similarityScore: 93,
        isRecommendedKeep: false,
        isMarkedForDeletion: true,
        rank: 3,
        aiCurationReason: 'Highlight clipping (+0.5 EV) on forehead specular glow',
        sharpnessScore: 86,
        faceExpressionScore: 89,
      },
      {
        photo: {
          ...portraitPhoto,
          id: 'near_portrait_studio_var3',
          title: 'Editorial_Studio_Fashion_Test_Crop.jpg',
          fileSize: 2890000,
        },
        similarityScore: 91,
        isRecommendedKeep: false,
        isMarkedForDeletion: true,
        rank: 4,
        aiCurationReason: 'Compressed JPEG test crop with reduced color gamut',
        sharpnessScore: 82,
        faceExpressionScore: 88,
      },
    ];

    const potentialSavings = nearPhotos
      .filter((p) => p.isMarkedForDeletion)
      .reduce((acc, curr) => acc + curr.photo.fileSize, 0);

    clusters.push({
      id: 'cluster_near_studio_portrait',
      title: 'Studio Fashion Lighting Bracket & Crops',
      type: 'near-duplicate',
      detectedAt: Date.now() - 86400000 * 3,
      totalCount: 4,
      recommendedKeepCount: 1,
      currentKeepCount: 1,
      currentDeleteCount: 3,
      potentialSpaceSavings: potentialSavings,
      photos: nearPhotos,
      bestPhotoId: nearPhotos[0].photo.id,
      sceneSummary: '4 lighting bracket exposures of the same studio pose. AI identified the primary master exposure and flagged 3 redundant variations.',
    });
  }

  // 4. Exact Duplicates: Accidental Multi-Import (2 Exact Duplicates: Keep 1, Delete 1)
  const tokyoPhoto = photos.find((p) => p.id === 'photo_night_tokyo_01') || photos[3];
  if (tokyoPhoto) {
    const exactPhotos: DuplicatePhotoItem[] = [
      {
        photo: {
          ...tokyoPhoto,
          id: 'exact_tokyo_original',
          title: 'Cyberpunk_Tokyo_Rain_Night.jpg',
        },
        similarityScore: 100,
        isRecommendedKeep: true,
        isMarkedForDeletion: false,
        rank: 1,
        aiCurationReason: '👑 AI Pick: Original primary file in Library',
        sharpnessScore: 96,
        faceExpressionScore: 90,
      },
      {
        photo: {
          ...tokyoPhoto,
          id: 'exact_tokyo_copy_1',
          title: 'Cyberpunk_Tokyo_Rain_Night (1).jpg',
        },
        similarityScore: 100,
        isRecommendedKeep: false,
        isMarkedForDeletion: true,
        rank: 2,
        aiCurationReason: '100% Bit-for-bit identical duplicate copy',
        sharpnessScore: 96,
        faceExpressionScore: 90,
      },
    ];

    const potentialSavings = exactPhotos
      .filter((p) => p.isMarkedForDeletion)
      .reduce((acc, curr) => acc + curr.photo.fileSize, 0);

    clusters.push({
      id: 'cluster_exact_tokyo',
      title: 'Tokyo Neon Alley Duplicate Copy',
      type: 'exact',
      detectedAt: Date.now() - 86400000 * 4,
      totalCount: 2,
      recommendedKeepCount: 1,
      currentKeepCount: 1,
      currentDeleteCount: 1,
      potentialSpaceSavings: potentialSavings,
      photos: exactPhotos,
      bestPhotoId: exactPhotos[0].photo.id,
      sceneSummary: 'Exact duplicate files with identical SHA-256 hashes and dimensions.',
    });
  }

  return clusters;
}

/**
 * Storage helpers for duplicate clusters
 */
export async function getDuplicateClustersFromStorage(photos: PhotoItem[]): Promise<DuplicateCluster[]> {
  try {
    const raw = localStorage.getItem('lumina_duplicate_clusters');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored duplicate clusters, initializing default generator:', e);
  }

  const generated = generateDuplicateClusters(photos);
  saveDuplicateClustersToStorage(generated);
  return generated;
}

export function saveDuplicateClustersToStorage(clusters: DuplicateCluster[]): void {
  try {
    localStorage.setItem('lumina_duplicate_clusters', JSON.stringify(clusters));
  } catch (e) {
    console.error('Failed to save duplicate clusters:', e);
  }
}
