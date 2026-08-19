import { Project, RawMetadata } from './editor';

export type TimeOfDay = 'day' | 'night' | 'golden-hour' | 'sunset' | 'sunrise' | 'blue-hour' | 'indoor';

export interface DetectedObject {
  label: string;
  confidence: number;
  box?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1
}

export interface PhotoAiAnalysis {
  isAnalyzed: boolean;
  analyzedAt?: number;
  sceneDescription: string;
  tags: string[];
  categories: string[];
  detectedObjects: DetectedObject[];
  timeOfDay: TimeOfDay;
  isPortrait: boolean;
  portraitQualityScore: number; // 0 to 100
  aestheticScore: number;       // 0 to 100
  facesDetected: number;
  primarySubject: string;
  dominantColors: string[];     // Hex codes e.g. ["#e29578", "#006d77"]
  mood?: string;
  lightingType?: string;
  locationName?: string;
}

export interface PersonProfile {
  id: string;
  name: string;
  relationship?: 'Self' | 'Friend' | 'Client' | 'Family' | 'Model' | 'Colleague';
  avatarUrl: string;
  photoIds: string[];
  photoCount: number;
  bio?: string;
  createdAt: number;
}

export interface PlaceLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  region?: string;
  latitude: number;
  longitude: number;
  photoIds: string[];
  photoCount: number;
  coverPhotoUrl?: string;
}

export interface PhotoEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  locationName?: string;
  placeId?: string;
  isCustom: boolean;
  coverPhotoUrl?: string;
  photoIds: string[];
  photoCount: number;
  tags?: string[];
  createdAt: number;
}

export interface SmartAlbumRule {
  id: string;
  field: 'rating' | 'isRaw' | 'timeOfDay' | 'category' | 'tag' | 'camera' | 'searchQuery' | 'isFavorite' | 'minAesthetic' | 'personId' | 'placeId';
  operator: 'equals' | 'gte' | 'lte' | 'contains' | 'in';
  value: any;
}

export interface PhotoItem {
  id: string;
  title: string;
  originalUrl: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  fileSize: number;             // in bytes
  format: string;               // 'jpeg' | 'png' | 'arw' | 'cr3' | 'dng' | 'webp' | 'tiff'
  createdAt: number;
  importedAt: number;
  lastEditedAt?: number;
  dateTaken?: string;
  rating: number;               // 0 to 5 stars
  isFavorite: boolean;
  albumIds: string[];
  peopleIds?: string[];
  placeId?: string;
  placeName?: string;
  eventId?: string;
  eventName?: string;
  aiAnalysis: PhotoAiAnalysis;
  exifMetadata?: Partial<RawMetadata>;
  projectState?: Partial<Project>;
  burstSequenceId?: string;
  burstIndex?: number;
}

export interface PhotoAlbum {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  coverPhotoUrl?: string;
  isSmart: boolean;
  smartRules?: SmartAlbumRule[];
  ruleMatchMode?: 'all' | 'any';
  smartFilter?: {
    searchQuery?: string;
    tags?: string[];
    categories?: string[];
    isPortrait?: boolean;
    isCar?: boolean;
    isBeach?: boolean;
    isNight?: boolean;
    minRating?: number;
    timeOfDay?: TimeOfDay;
    isRaw?: boolean;
    isFavorite?: boolean;
    personId?: string;
    placeId?: string;
  };
  photoCount?: number;
  createdAt: number;
}

export interface AiSearchParsedQuery {
  rawQuery: string;
  intentSummary: string;
  matchedKeywords: string[];
  isBeachQuery: boolean;
  isCarQuery: boolean;
  isPortraitQuery: boolean;
  isNightQuery: boolean;
  isBestQuery: boolean;
  minRatingRequired?: number;
  timeOfDayFilter?: TimeOfDay;
  categoryFilter?: string;
  tagFilters?: string[];
}

export type DuplicateType = 'exact' | 'near-duplicate' | 'burst' | 'similar';

export interface DuplicatePhotoItem {
  photo: PhotoItem;
  similarityScore: number;       // 0 to 100%
  isRecommendedKeep: boolean;    // AI recommendation to keep
  isMarkedForDeletion: boolean;  // whether user or AI marked for deletion
  rank: number;                  // 1 = best in cluster
  aiCurationReason: string;      // e.g. "Optimal sharpness, open eyes, best lighting"
  sharpnessScore: number;        // 0 to 100
  faceExpressionScore: number;   // 0 to 100
  timeDeltaMs?: number;          // relative to first shot in burst
}

export interface DuplicateCluster {
  id: string;
  title: string;
  type: DuplicateType;
  detectedAt: number;
  totalCount: number;
  recommendedKeepCount: number;  // e.g. 3
  currentKeepCount: number;
  currentDeleteCount: number;
  potentialSpaceSavings: number; // in bytes
  photos: DuplicatePhotoItem[];
  bestPhotoId: string;
  sceneSummary: string;
}

export type MainNavSection = 
  | 'all' 
  | 'favorites' 
  | 'duplicates'
  | 'recently-edited' 
  | 'recently-imported' 
  | 'albums' 
  | 'smart-albums' 
  | 'people' 
  | 'places' 
  | 'events' 
  | 'raw' 
  | 'untagged';

export interface SearchFilterState {
  mainSection: MainNavSection;
  searchQuery: string;
  selectedAlbumId: string | null;
  selectedPersonId: string | null;
  selectedPlaceId: string | null;
  selectedEventId: string | null;
  selectedCategory: string | null;
  selectedTimeOfDay: TimeOfDay | 'all';
  minRating: number;
  isPortraitOnly: boolean;
  isFavoriteOnly: boolean;
  selectedTags: string[];
  sortBy: 'relevance' | 'date-newest' | 'date-oldest' | 'rating-high' | 'aesthetic-score' | 'last-edited' | 'recently-imported' | 'name' | 'size';
}
