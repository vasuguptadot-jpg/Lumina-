import { PhotoItem, PhotoAiAnalysis, SearchFilterState, AiSearchParsedQuery, TimeOfDay } from '../types/library';

/**
 * Natural language intent parser for photo searches
 */
export function parseNaturalLanguageQuery(rawQuery: string): AiSearchParsedQuery {
  const query = rawQuery.trim().toLowerCase();

  // Keyword extraction without common query stop words
  const stopWords = new Set([
    'find', 'photos', 'photo', 'pictures', 'picture', 'images', 'image', 'pics', 'pic',
    'of', 'me', 'at', 'the', 'with', 'taken', 'my', 'show', 'all', 'give', 'get',
    'search', 'for', 'in', 'and', 'a', 'an', 'some', 'any', 'please'
  ]);

  const rawTokens = query.split(/[\s,.'"-]+/).filter(Boolean);
  const keywords = rawTokens.filter((token) => !stopWords.has(token));

  // Intent Flags
  const isBeachQuery =
    query.includes('beach') ||
    query.includes('ocean') ||
    query.includes('coast') ||
    query.includes('sand') ||
    query.includes('shore') ||
    query.includes('sea') ||
    query.includes('tropical') ||
    query.includes('waves');

  const isCarQuery =
    query.includes('car') ||
    query.includes('cars') ||
    query.includes('automobile') ||
    query.includes('automobiles') ||
    query.includes('vehicle') ||
    query.includes('vehicles') ||
    query.includes('sports car') ||
    query.includes('supercar') ||
    query.includes('roadster') ||
    query.includes('drive') ||
    query.includes('driving');

  const isPortraitQuery =
    query.includes('portrait') ||
    query.includes('portraits') ||
    query.includes('person') ||
    query.includes('people') ||
    query.includes('face') ||
    query.includes('selfie') ||
    query.includes('model') ||
    query.includes('woman') ||
    query.includes('man') ||
    query.includes('girl') ||
    query.includes('boy');

  const isNightQuery =
    query.includes('night') ||
    query.includes('nighttime') ||
    query.includes('dark') ||
    query.includes('midnight') ||
    query.includes('astro') ||
    query.includes('astrophotography') ||
    query.includes('stars') ||
    query.includes('neon') ||
    query.includes('city lights') ||
    query.includes('stargazing');

  const isBestQuery =
    query.includes('best') ||
    query.includes('top') ||
    query.includes('favorite') ||
    query.includes('favorites') ||
    query.includes('highest rated') ||
    query.includes('masterpiece') ||
    query.includes('greatest') ||
    query.includes('5 star') ||
    query.includes('5-star');

  // Time of Day parsing
  let timeOfDayFilter: TimeOfDay | undefined = undefined;
  if (isNightQuery) timeOfDayFilter = 'night';
  else if (query.includes('sunset') || query.includes('dusk')) timeOfDayFilter = 'sunset';
  else if (query.includes('golden hour') || query.includes('sunrise') || query.includes('dawn')) timeOfDayFilter = 'golden-hour';
  else if (query.includes('daytime') || query.includes('day light') || query.includes('day')) timeOfDayFilter = 'day';

  // Category filtering
  let categoryFilter: string | undefined = undefined;
  if (isBeachQuery) categoryFilter = 'Beach & Coastal';
  else if (isCarQuery) categoryFilter = 'Automotive & Cars';
  else if (isPortraitQuery) categoryFilter = 'Portrait';
  else if (isNightQuery) categoryFilter = 'Night Photography';
  else if (query.includes('landscape') || query.includes('mountains')) categoryFilter = 'Landscape';
  else if (query.includes('architecture') || query.includes('building')) categoryFilter = 'Architecture';

  // Compose human-readable summary of understood intent
  let intentSummary = '';
  if (isBeachQuery && (query.includes('me') || isPortraitQuery)) {
    intentSummary = 'Beach & coastal photos featuring people / portraits';
  } else if (isBeachQuery) {
    intentSummary = 'Beach, coastal, and ocean photography';
  } else if (isCarQuery) {
    intentSummary = 'Automotive & vehicles (cars, sports cars, roadsters)';
  } else if (isPortraitQuery && isBestQuery) {
    intentSummary = 'Highest-rated portraits (★4-5 & high aesthetic score)';
  } else if (isPortraitQuery) {
    intentSummary = 'People and portrait photography';
  } else if (isNightQuery) {
    intentSummary = 'Night photography, astrophotography, and neon scenes';
  } else if (isBestQuery) {
    intentSummary = 'Highest rated & 5-star masterpiece photos';
  } else if (keywords.length > 0) {
    intentSummary = `Photos matching "${keywords.join(', ')}"`;
  } else {
    intentSummary = 'All photos';
  }

  return {
    rawQuery,
    intentSummary,
    matchedKeywords: keywords,
    isBeachQuery,
    isCarQuery,
    isPortraitQuery,
    isNightQuery,
    isBestQuery,
    minRatingRequired: isBestQuery ? 4 : undefined,
    timeOfDayFilter,
    categoryFilter,
    tagFilters: keywords,
  };
}

/**
 * Executes multi-dimensional semantic search across the photo catalog
 */
export function executeAiPhotoSearch(
  photos: PhotoItem[],
  filters: SearchFilterState
): {
  results: PhotoItem[];
  parsedQuery: AiSearchParsedQuery | null;
  totalMatchCount: number;
} {
  const {
    mainSection,
    searchQuery,
    selectedAlbumId,
    selectedPersonId,
    selectedPlaceId,
    selectedEventId,
    selectedCategory,
    selectedTimeOfDay,
    minRating,
    isPortraitOnly,
    isFavoriteOnly,
    selectedTags,
    sortBy,
  } = filters;

  const hasSearchText = searchQuery.trim().length > 0;
  const parsedQuery = hasSearchText ? parseNaturalLanguageQuery(searchQuery) : null;

  // Step 1: Base album and collection filtering
  let filtered = photos.filter((photo) => {
    // Main Section Filtering
    if (mainSection === 'favorites') {
      if (!photo.isFavorite && photo.rating < 5) return false;
    } else if (mainSection === 'recently-edited') {
      if (!photo.lastEditedAt) return false;
    } else if (mainSection === 'raw') {
      if (!photo.exifMetadata?.isRaw && !['arw', 'cr3', 'dng', 'raf', 'raw', 'nef'].includes(photo.format.toLowerCase())) {
        return false;
      }
    } else if (mainSection === 'untagged') {
      if (photo.aiAnalysis?.isAnalyzed) return false;
    } else if (mainSection === 'people' && selectedPersonId) {
      if (!photo.peopleIds || !photo.peopleIds.includes(selectedPersonId)) return false;
    } else if (mainSection === 'places' && selectedPlaceId) {
      if (photo.placeId !== selectedPlaceId) return false;
    } else if (mainSection === 'events' && selectedEventId) {
      if (photo.eventId !== selectedEventId) return false;
    } else if ((mainSection === 'albums' || mainSection === 'smart-albums') && selectedAlbumId) {
      if (selectedAlbumId === 'smart-beach') {
        const isB = photo.aiAnalysis?.categories?.includes('Beach & Coastal') || photo.aiAnalysis?.tags?.some((t) => ['beach', 'ocean', 'sand', 'coast'].includes(t));
        if (!isB) return false;
      } else if (selectedAlbumId === 'smart-cars') {
        const isC = photo.aiAnalysis?.categories?.includes('Automotive & Cars') || photo.aiAnalysis?.tags?.some((t) => ['car', 'automobile', 'vehicle', 'sports car'].includes(t));
        if (!isC) return false;
      } else if (selectedAlbumId === 'smart-portraits') {
        const isP = (photo.aiAnalysis?.isPortrait || photo.aiAnalysis?.categories?.includes('Portrait')) && (photo.rating >= 4 || photo.aiAnalysis?.portraitQualityScore >= 90);
        if (!isP) return false;
      } else if (selectedAlbumId === 'smart-night') {
        const isN = photo.aiAnalysis?.timeOfDay === 'night' || photo.aiAnalysis?.categories?.includes('Night Photography');
        if (!isN) return false;
      } else if (selectedAlbumId === 'smart-landscape') {
        const isL = photo.aiAnalysis?.categories?.includes('Landscape') || photo.aiAnalysis?.categories?.includes('Nature & Wildlife');
        if (!isL) return false;
      } else if (selectedAlbumId === 'smart-masterpieces') {
        if ((photo.aiAnalysis?.aestheticScore || 0) < 95) return false;
      } else if (selectedAlbumId === 'smart-raw') {
        if (!photo.exifMetadata?.isRaw && !['arw', 'cr3', 'dng', 'raf', 'raw'].includes(photo.format.toLowerCase())) return false;
      } else {
        if (!photo.albumIds || !photo.albumIds.includes(selectedAlbumId)) return false;
      }
    }

    // Direct UI Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      if (!photo.aiAnalysis?.categories?.includes(selectedCategory)) return false;
    }

    // Time of Day filter
    if (selectedTimeOfDay && selectedTimeOfDay !== 'all') {
      if (photo.aiAnalysis?.timeOfDay !== selectedTimeOfDay) return false;
    }

    // Rating filter
    if (minRating > 0) {
      if ((photo.rating || 0) < minRating) return false;
    }

    // Portrait toggle filter
    if (isPortraitOnly) {
      if (!photo.aiAnalysis?.isPortrait) return false;
    }

    // Favorite only filter
    if (isFavoriteOnly) {
      if (!photo.isFavorite) return false;
    }

    // Selected Tags filter
    if (selectedTags && selectedTags.length > 0) {
      const pTags = new Set(photo.aiAnalysis?.tags?.map((t) => t.toLowerCase()) || []);
      const matchesAnyTag = selectedTags.some((st) => pTags.has(st.toLowerCase()));
      if (!matchesAnyTag) return false;
    }

    return true;
  });

  // Step 2: Natural Language Semantic Query Scoring
  if (parsedQuery && hasSearchText) {
    const scoredPhotos: Array<{ photo: PhotoItem; score: number }> = [];

    for (const photo of filtered) {
      let score = 0;
      const ai: PhotoAiAnalysis = photo.aiAnalysis || {
        isAnalyzed: false,
        tags: [],
        categories: [],
        detectedObjects: [],
        sceneDescription: '',
        primarySubject: '',
        mood: '',
        locationName: '',
        timeOfDay: 'day',
        isPortrait: false,
        portraitQualityScore: 0,
        aestheticScore: 0,
        facesDetected: 0,
        dominantColors: [],
      };

      const titleLower = photo.title.toLowerCase();
      const descLower = (ai.sceneDescription || '').toLowerCase();
      const subjectLower = (ai.primarySubject || '').toLowerCase();
      const locationLower = (ai.locationName || photo.placeName || '').toLowerCase();
      const eventLower = (photo.eventName || '').toLowerCase();
      const tags = (ai.tags || []).map((t) => t.toLowerCase());
      const categories = (ai.categories || []).map((c) => c.toLowerCase());
      const objects = (ai.detectedObjects || []).map((o) => o.label.toLowerCase());

      // 1. Core Intent Specific High-Precision Rules
      // Query 1: "Photos of me at the beach."
      if (parsedQuery.isBeachQuery) {
        const hasBeachTag = tags.some((t) => ['beach', 'ocean', 'sand', 'coastal', 'shore', 'waves', 'sea', 'coast'].includes(t));
        const hasBeachCat = categories.some((c) => c.includes('beach') || c.includes('coast'));
        const hasBeachDesc = descLower.includes('beach') || descLower.includes('ocean') || descLower.includes('coast') || descLower.includes('sand');
        const hasBeachTitle = titleLower.includes('beach') || titleLower.includes('ocean') || titleLower.includes('coast');

        if (hasBeachTag || hasBeachCat || hasBeachDesc || hasBeachTitle) {
          score += 150;
          // If query also mentions "me" or person
          if (parsedQuery.isPortraitQuery || ai.isPortrait || tags.includes('person') || photo.peopleIds?.includes('person_maya')) {
            score += 80;
          }
        }
      }

      // Query 2: "Find photos with cars."
      if (parsedQuery.isCarQuery) {
        const hasCarTag = tags.some((t) => ['car', 'cars', 'automobile', 'vehicle', 'sports car', 'roadster', 'corvette', 'porsche'].includes(t));
        const hasCarObj = objects.some((o) => o.includes('car') || o.includes('vehicle') || o.includes('automobile'));
        const hasCarCat = categories.some((c) => c.includes('automotive') || c.includes('car'));
        const hasCarDesc = descLower.includes('car') || descLower.includes('vehicle') || descLower.includes('roadster') || descLower.includes('automobile');
        const hasCarTitle = titleLower.includes('car') || titleLower.includes('roadster') || titleLower.includes('corvette') || titleLower.includes('gt3');

        if (hasCarTag || hasCarObj || hasCarCat || hasCarDesc || hasCarTitle) {
          score += 160;
        }
      }

      // Query 3: "Find my best portraits."
      if (parsedQuery.isPortraitQuery) {
        const isPort = ai.isPortrait || categories.some((c) => c.includes('portrait')) || tags.some((t) => ['portrait', 'person', 'face', 'model'].includes(t));
        if (isPort) {
          score += 120;
          // Extra points for "best" (portrait quality score + star rating)
          if (parsedQuery.isBestQuery) {
            score += (photo.rating || 0) * 25; // 5 stars = +125 pts
            score += ((ai.portraitQualityScore || 0) / 100) * 60;
            score += ((ai.aestheticScore || 0) / 100) * 40;
          }
        }
      }

      // Query 4: "Find photos taken at night."
      if (parsedQuery.isNightQuery) {
        const isNightTime = ai.timeOfDay === 'night';
        const hasNightTag = tags.some((t) => ['night', 'dark', 'neon', 'astro', 'astrophotography', 'stars', 'night sky', 'city lights'].includes(t));
        const hasNightCat = categories.some((c) => c.includes('night'));
        const hasNightDesc = descLower.includes('night') || descLower.includes('neon') || descLower.includes('dark');
        const hasNightTitle = titleLower.includes('night') || titleLower.includes('tokyo');

        if (isNightTime || hasNightTag || hasNightCat || hasNightDesc || hasNightTitle) {
          score += 150;
        }
      }

      // 2. Keyword & Token Matching
      for (const kw of parsedQuery.matchedKeywords) {
        if (tags.includes(kw)) score += 35;
        else if (tags.some((t) => t.includes(kw))) score += 20;

        if (objects.includes(kw)) score += 40;
        else if (objects.some((o) => o.includes(kw))) score += 25;

        if (titleLower.includes(kw)) score += 35;
        if (descLower.includes(kw)) score += 25;
        if (subjectLower.includes(kw) || locationLower.includes(kw) || eventLower.includes(kw)) score += 25;
        if (categories.some((c) => c.includes(kw))) score += 20;
      }

      // 3. General "Best" / High-Aesthetic booster
      if (parsedQuery.isBestQuery && !parsedQuery.isPortraitQuery) {
        score += (photo.rating || 0) * 20;
        score += ((ai.aestheticScore || 0) / 100) * 30;
      }

      if (score > 0) {
        scoredPhotos.push({ photo, score });
      }
    }

    scoredPhotos.sort((a, b) => b.score - a.score);
    filtered = scoredPhotos.map((sp) => sp.photo);
  } else {
    // Standard sorting when no search text is active
    filtered = [...filtered].sort((a, b) => {
      if (mainSection === 'recently-edited' || sortBy === 'last-edited') {
        return (b.lastEditedAt || 0) - (a.lastEditedAt || 0);
      }
      if (mainSection === 'recently-imported' || sortBy === 'recently-imported') {
        return (b.importedAt || b.createdAt || 0) - (a.importedAt || a.createdAt || 0);
      }
      if (sortBy === 'date-newest') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortBy === 'date-oldest') return (a.createdAt || 0) - (b.createdAt || 0);
      if (sortBy === 'rating-high') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'aesthetic-score') return (b.aiAnalysis?.aestheticScore || 0) - (a.aiAnalysis?.aestheticScore || 0);
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      if (sortBy === 'size') return (b.fileSize || 0) - (a.fileSize || 0);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }

  return {
    results: filtered,
    parsedQuery,
    totalMatchCount: filtered.length,
  };
}
