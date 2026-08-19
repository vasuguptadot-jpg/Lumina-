import { PhotoItem, PhotoAlbum, PersonProfile, PlaceLocation, PhotoEvent } from '../types/library';

export const INITIAL_PEOPLE: PersonProfile[] = [
  {
    id: 'person_elena',
    name: 'Elena Rostova',
    relationship: 'Model',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    photoIds: ['photo_portrait_studio_01'],
    photoCount: 1,
    bio: 'Editorial fashion and studio portrait model based in New York.',
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'person_maya',
    name: 'Maya Lin (Self / Me)',
    relationship: 'Self',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    photoIds: ['photo_beach_malibu_01', 'photo_portrait_golden_02'],
    photoCount: 2,
    bio: 'Photographer, traveler, beach and golden hour enthusiast.',
    createdAt: Date.now() - 86400000 * 40,
  },
  {
    id: 'person_marcus',
    name: 'Marcus Vance',
    relationship: 'Friend',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    photoIds: ['photo_portrait_cinematic_03'],
    photoCount: 1,
    bio: 'Architectural designer and street photographer.',
    createdAt: Date.now() - 86400000 * 25,
  },
  {
    id: 'person_kai',
    name: 'Kai Takahashi',
    relationship: 'Friend',
    avatarUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=400&q=80',
    photoIds: ['photo_beach_surfer_03'],
    photoCount: 1,
    bio: 'Surfer and ocean conservationist based in California.',
    createdAt: Date.now() - 86400000 * 20,
  },
];

export const INITIAL_PLACES: PlaceLocation[] = [
  {
    id: 'place_malibu',
    name: 'Malibu Coast',
    city: 'Malibu',
    country: 'United States',
    region: 'California',
    latitude: 34.0259,
    longitude: -118.7798,
    photoIds: ['photo_beach_malibu_01'],
    photoCount: 1,
    coverPhotoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'place_maui',
    name: 'Maui Tropical Shores',
    city: 'Maui',
    country: 'United States',
    region: 'Hawaii',
    latitude: 20.7984,
    longitude: -156.3319,
    photoIds: ['photo_beach_maui_02'],
    photoCount: 1,
    coverPhotoUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'place_tokyo',
    name: 'Shinjuku Neon District',
    city: 'Tokyo',
    country: 'Japan',
    region: 'Kanto',
    latitude: 35.6938,
    longitude: 139.7034,
    photoIds: ['photo_night_tokyo_01', 'photo_night_alley_03'],
    photoCount: 2,
    coverPhotoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'place_alps',
    name: 'Furka Alpine Pass',
    city: 'Uri',
    country: 'Switzerland',
    region: 'Swiss Alps',
    latitude: 46.5728,
    longitude: 8.415,
    photoIds: ['photo_car_supercar_02'],
    photoCount: 1,
    coverPhotoUrl: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'place_atacama',
    name: 'Atacama Dark Sky Reserve',
    city: 'San Pedro de Atacama',
    country: 'Chile',
    region: 'Antofagasta',
    latitude: -22.9087,
    longitude: -68.1997,
    photoIds: ['photo_night_astro_02'],
    photoCount: 1,
    coverPhotoUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'place_patagonia',
    name: 'Patagonia Glacier Fjord',
    city: 'El Chaltén',
    country: 'Argentina',
    region: 'Santa Cruz',
    latitude: -49.3315,
    longitude: -72.8864,
    photoIds: ['photo_raw_glacier_01'],
    photoCount: 1,
    coverPhotoUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'place_sahara',
    name: 'Merzouga Sand Dunes',
    city: 'Merzouga',
    country: 'Morocco',
    region: 'Drâa-Tafilalet',
    latitude: 31.0993,
    longitude: -4.0125,
    photoIds: ['photo_raw_dunes_02'],
    photoCount: 1,
    coverPhotoUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
  },
];

export const INITIAL_EVENTS: PhotoEvent[] = [
  {
    id: 'event_malibu_2026',
    title: 'Malibu Pacific Sunset Shoot',
    description: 'Golden hour coastal session capturing sunset surf and shoreline light.',
    startDate: '2026-08-14',
    endDate: '2026-08-14',
    locationName: 'Malibu Coast, California',
    placeId: 'place_malibu',
    isCustom: false,
    coverPhotoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    photoIds: ['photo_beach_malibu_01', 'photo_beach_surfer_03'],
    photoCount: 2,
    tags: ['Beach', 'Sunset', 'California'],
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'event_tokyo_cyberpunk',
    title: 'Tokyo Midnight Cyberpunk Tour',
    description: 'Street and night neon exploration through Shinjuku in rain.',
    startDate: '2026-07-10',
    endDate: '2026-07-12',
    locationName: 'Shinjuku, Tokyo, Japan',
    placeId: 'place_tokyo',
    isCustom: false,
    coverPhotoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    photoIds: ['photo_night_tokyo_01', 'photo_night_alley_03'],
    photoCount: 2,
    tags: ['Night', 'Neon', 'Japan', 'Street'],
    createdAt: Date.now() - 86400000 * 15,
  },
  {
    id: 'event_alps_supercar',
    title: 'Alpine Supercar Pass Expedition',
    description: 'Dynamic automotive mountain pass driving session across the Swiss Alps.',
    startDate: '2026-08-01',
    endDate: '2026-08-03',
    locationName: 'Furka Pass, Switzerland',
    placeId: 'place_alps',
    isCustom: true,
    coverPhotoUrl: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
    photoIds: ['photo_car_supercar_02', 'photo_car_roadster_01'],
    photoCount: 2,
    tags: ['Supercar', 'Alps', 'Automotive'],
    createdAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'event_fashion_editorial',
    title: 'Studio Haute Couture Campaign',
    description: 'High-end medium-format fashion editorial with professional lighting setup.',
    startDate: '2026-07-25',
    endDate: '2026-07-25',
    locationName: 'Lumina Studio Brooklyn, NY',
    isCustom: true,
    coverPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    photoIds: ['photo_portrait_studio_01', 'photo_portrait_golden_02', 'photo_portrait_cinematic_03'],
    photoCount: 3,
    tags: ['Studio', 'Editorial', 'Portraits'],
    createdAt: Date.now() - 86400000 * 25,
  },
  {
    id: 'event_atacama_astro',
    title: 'Atacama Deep Space Stargazing',
    description: 'Milky Way galactic core long-exposure astrophotography workshop in pristine dark skies.',
    startDate: '2026-07-05',
    endDate: '2026-07-07',
    locationName: 'Atacama Dark Sky Reserve, Chile',
    placeId: 'place_atacama',
    isCustom: false,
    coverPhotoUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    photoIds: ['photo_night_astro_02'],
    photoCount: 1,
    tags: ['Astrophotography', 'Stars', 'Space'],
    createdAt: Date.now() - 86400000 * 35,
  },
];

export const DEFAULT_SMART_ALBUMS: PhotoAlbum[] = [
  {
    id: 'smart-beach',
    title: 'Beach & Coastal',
    description: 'Ocean waves, sandy shores, coastal horizons, and tropical getaways',
    icon: 'Palmtree',
    isSmart: true,
    smartRules: [
      { id: 'rule_1', field: 'category', operator: 'equals', value: 'Beach & Coastal' },
    ],
    photoCount: 3,
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'smart-cars',
    title: 'Cars & Automotive',
    description: 'Classic roadsters, sports cars, supercars, and highway drives',
    icon: 'Car',
    isSmart: true,
    smartRules: [
      { id: 'rule_2', field: 'category', operator: 'equals', value: 'Automotive & Cars' },
    ],
    photoCount: 3,
    createdAt: Date.now() - 86400000 * 9,
  },
  {
    id: 'smart-portraits',
    title: 'Best Portraits (★4+)',
    description: 'Curated studio editorial portraits and natural light expressions',
    icon: 'UserCheck',
    isSmart: true,
    smartRules: [
      { id: 'rule_3', field: 'category', operator: 'equals', value: 'Portrait' },
      { id: 'rule_4', field: 'rating', operator: 'gte', value: 4 },
    ],
    photoCount: 3,
    createdAt: Date.now() - 86400000 * 8,
  },
  {
    id: 'smart-night',
    title: 'Night & Astrophotography',
    description: 'City neon reflections, midnight skylines, and starlit skies',
    icon: 'Moon',
    isSmart: true,
    smartRules: [
      { id: 'rule_5', field: 'timeOfDay', operator: 'equals', value: 'night' },
    ],
    photoCount: 3,
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: 'smart-landscape',
    title: 'Nature & Landscapes',
    description: 'Alpine peaks, glaciers, sand dunes, and scenic wilderness',
    icon: 'Mountain',
    isSmart: true,
    smartRules: [
      { id: 'rule_6', field: 'category', operator: 'equals', value: 'Landscape' },
    ],
    photoCount: 3,
    createdAt: Date.now() - 86400000 * 6,
  },
  {
    id: 'smart-masterpieces',
    title: 'Masterpieces (Score 95%+)',
    description: 'Photographs with aesthetic scores of 95% and above',
    icon: 'Sparkles',
    isSmart: true,
    smartRules: [
      { id: 'rule_7', field: 'minAesthetic', operator: 'gte', value: 95 },
    ],
    photoCount: 6,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'smart-raw',
    title: '14-Bit RAW Masters',
    description: 'Native RAW sensor files with wide dynamic range',
    icon: 'Camera',
    isSmart: true,
    smartRules: [
      { id: 'rule_8', field: 'isRaw', operator: 'equals', value: true },
    ],
    photoCount: 2,
    createdAt: Date.now() - 86400000 * 4,
  },
];

export const INITIAL_USER_ALBUMS: PhotoAlbum[] = [
  {
    id: 'album_portfolio_2026',
    title: 'Portfolio 2026 Highlights',
    description: 'Curated selection for editorial submissions and client presentation.',
    icon: 'Folder',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    isSmart: false,
    photoCount: 4,
    createdAt: Date.now() - 86400000 * 12,
  },
  {
    id: 'album_automotive_series',
    title: 'High Octane Supercar Series',
    description: 'Automotive magazine feature set.',
    icon: 'Folder',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
    isSmart: false,
    photoCount: 3,
    createdAt: Date.now() - 86400000 * 10,
  },
];

export const INITIAL_PHOTO_LIBRARY: PhotoItem[] = [
  // 1. Beach: Malibu Golden Hour
  {
    id: 'photo_beach_malibu_01',
    title: 'Malibu_Beach_Sunset_Walk.jpg',
    originalUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=90',
    width: 2400,
    height: 1600,
    fileSize: 3240000,
    format: 'jpeg',
    createdAt: Date.now() - 86400000 * 2,
    importedAt: Date.now() - 86400000 * 2,
    lastEditedAt: Date.now() - 3600000 * 4,
    dateTaken: '2026-08-14 18:45:00',
    rating: 5,
    isFavorite: true,
    albumIds: ['smart-beach', 'album_portfolio_2026'],
    peopleIds: ['person_maya'],
    placeId: 'place_malibu',
    placeName: 'Malibu Coast, California',
    eventId: 'event_malibu_2026',
    eventName: 'Malibu Pacific Sunset Shoot',
    aiAnalysis: {
      isAnalyzed: true,
      analyzedAt: Date.now() - 86400000 * 2,
      sceneDescription: 'A person walking along the golden sandy shoreline of Malibu beach as sunset waves roll in with warm sunlight reflections.',
      tags: ['beach', 'ocean', 'sand', 'coastal', 'person', 'sunset', 'golden hour', 'summer', 'waves', 'shoreline', 'vacation', 'sunlight', 'water', 'california'],
      categories: ['Beach & Coastal', 'Travel', 'Landscape'],
      detectedObjects: [
        { label: 'beach', confidence: 0.99 },
        { label: 'person', confidence: 0.96 },
        { label: 'water', confidence: 0.98 },
        { label: 'waves', confidence: 0.94 },
      ],
      timeOfDay: 'golden-hour',
      isPortrait: true,
      portraitQualityScore: 88,
      aestheticScore: 95,
      facesDetected: 1,
      primarySubject: 'Person Walking on Malibu Beach',
      dominantColors: ['#f59e0b', '#0284c7', '#fef3c7', '#38bdf8'],
      mood: 'Peaceful & Warm',
      lightingType: 'Golden Hour Sun Backlight',
      locationName: 'Malibu Beach, California',
    },
    exifMetadata: {
      cameraMake: 'Sony',
      cameraModel: 'Alpha 7R V',
      lens: 'FE 24-70mm F2.8 GM II',
      iso: 100,
      focalLength: '35mm',
      aperture: 'f/2.8',
      shutterSpeed: '1/640s',
      colorSpace: 'Display P3',
    },
  },

  // 2. Beach: Maui Tropical Coast
  {
    id: 'photo_beach_maui_02',
    title: 'Maui_Tropical_Coastline.jpg',
    originalUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=2400&q=90',
    width: 2400,
    height: 1600,
    fileSize: 2950000,
    format: 'jpeg',
    createdAt: Date.now() - 86400000 * 3,
    importedAt: Date.now() - 86400000 * 3,
    dateTaken: '2026-08-11 11:20:00',
    rating: 4,
    isFavorite: false,
    albumIds: ['smart-beach'],
    placeId: 'place_maui',
    placeName: 'Maui Tropical Shores, Hawaii',
    aiAnalysis: {
      isAnalyzed: true,
      analyzedAt: Date.now() - 86400000 * 3,
      sceneDescription: 'Turquoise ocean waters crashing against white sand with palm trees swaying in tropical breeze.',
      tags: ['beach', 'ocean', 'tropical', 'sand', 'coastal', 'palm tree', 'sea', 'waves', 'summer', 'turquoise water', 'vacation', 'maui', 'island'],
      categories: ['Beach & Coastal', 'Travel', 'Landscape'],
      detectedObjects: [
        { label: 'beach', confidence: 0.99 },
        { label: 'palm tree', confidence: 0.95 },
        { label: 'ocean', confidence: 0.98 },
      ],
      timeOfDay: 'day',
      isPortrait: false,
      portraitQualityScore: 0,
      aestheticScore: 92,
      facesDetected: 0,
      primarySubject: 'Tropical White Sand Beach',
      dominantColors: ['#06b6d4', '#fef08a', '#10b981', '#ffffff'],
      mood: 'Vibrant & Exotic',
      lightingType: 'Bright Midday Tropical Sunlight',
      locationName: 'Maui, Hawaii',
    },
    exifMetadata: {
      cameraMake: 'Canon',
      cameraModel: 'EOS R5 Mark II',
      lens: 'RF 15-35mm F2.8 L IS USM',
      iso: 100,
      focalLength: '18mm',
      aperture: 'f/8.0',
      shutterSpeed: '1/800s',
      colorSpace: 'Adobe RGB',
    },
  },

  // 3. Beach: Coastal Surfer at Sunset
  {
    id: 'photo_beach_surfer_03',
    title: 'Sunset_Surfer_Ocean_Shore.jpg',
    originalUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=2400&q=90',
    width: 2400,
    height: 1600,
    fileSize: 3120000,
    format: 'jpeg',
    createdAt: Date.now() - 86400000 * 4,
    importedAt: Date.now() - 86400000 * 4,
    lastEditedAt: Date.now() - 3600000 * 18,
    dateTaken: '2026-08-08 19:10:00',
    rating: 5,
    isFavorite: true,
    albumIds: ['smart-beach'],
    peopleIds: ['person_kai'],
    placeId: 'place_malibu',
    placeName: 'Malibu Coast, California',
    eventId: 'event_malibu_2026',
    eventName: 'Malibu Pacific Sunset Shoot',
    aiAnalysis: {
      isAnalyzed: true,
      analyzedAt: Date.now() - 86400000 * 4,
      sceneDescription: 'Silhouette of a person with a surfboard standing at the water edge on a sandy beach during sunset.',
      tags: ['beach', 'ocean', 'surfer', 'person', 'sand', 'sunset', 'surfboard', 'waves', 'silhouette', 'coast', 'water', 'california', 'lifestyle'],
      categories: ['Beach & Coastal', 'Fashion & Lifestyle', 'Landscape'],
      detectedObjects: [
        { label: 'person', confidence: 0.97 },
        { label: 'beach', confidence: 0.99 },
        { label: 'surfboard', confidence: 0.92 },
      ],
      timeOfDay: 'sunset',
      isPortrait: true,
      portraitQualityScore: 90,
      aestheticScore: 96,
      facesDetected: 1,
      primarySubject: 'Surfer at Ocean Sunset',
      dominantColors: ['#ea580c', '#fbbf24', '#0f172a', '#3b82f6'],
      mood: 'Cinematic & Inspiring',
      lightingType: 'Sunset Rim Lighting & Silhouette',
      locationName: 'Huntington Beach, CA',
    },
  },

  // 4. Cars: Classic Roadster Corvette
  {
    id: 'photo_car_roadster_01',
    title: 'Classic_1968_Red_Roadster.jpg',
    originalUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=2400&q=90',
    width: 2400,
    height: 1600,
    fileSize: 3450000,
    format: 'jpeg',
    createdAt: Date.now() - 86400000 * 5,
    importedAt: Date.now() - 86400000 * 5,
    dateTaken: '2026-08-05 15:30:00',
    rating: 5,
    isFavorite: true,
    albumIds: ['smart-cars', 'album_automotive_series'],
    eventId: 'event_alps_supercar',
    eventName: 'Alpine Supercar Pass Expedition',
    aiAnalysis: {
      isAnalyzed: true,
      analyzedAt: Date.now() - 86400000 * 5,
      sceneDescription: 'A classic vintage red roadster sports car with chrome details parked on open asphalt road under clear sky.',
      tags: ['car', 'cars', 'sports car', 'classic car', 'vintage', 'automobile', 'vehicle', 'convertible', 'red car', 'wheels', 'transportation', 'roadster', 'asphalt', 'drive'],
      categories: ['Automotive & Cars', 'Vintage'],
      detectedObjects: [
        { label: 'car', confidence: 0.99 },
        { label: 'sports car', confidence: 0.98 },
        { label: 'wheel', confidence: 0.96 },
      ],
      timeOfDay: 'day',
      isPortrait: false,
      portraitQualityScore: 0,
      aestheticScore: 94,
      facesDetected: 0,
      primarySubject: '1968 Vintage Red Roadster',
      dominantColors: ['#dc2626', '#18181b', '#94a3b8', '#38bdf8'],
      mood: 'Iconic & Bold',
      lightingType: 'Natural Daylight with Chrome Highlights',
      locationName: 'Scenic Highway Route',
    },
    exifMetadata: {
      cameraMake: 'Fujifilm',
      cameraModel: 'X-T5',
      lens: 'XF 33mm F1.4 R LM WR',
      iso: 125,
      focalLength: '33mm',
      aperture: 'f/2.0',
      shutterSpeed: '1/1200s',
      colorSpace: 'sRGB',
    },
  },

  // 5. Cars: Alpine Supercar Pass
  {
    id: 'photo_car_supercar_02',
    title: 'Porsche_GT3_Alpine_Pass.jpg',
    originalUrl: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=2400&q=90',
    width: 2400,
    height: 1600,
    fileSize: 3820000,
    format: 'jpeg',
    createdAt: Date.now() - 86400000 * 6,
    importedAt: Date.now() - 86400000 * 6,
    lastEditedAt: Date.now() - 3600000 * 12,
    dateTaken: '2026-08-01 10:15:00',
    rating: 5,
    isFavorite: true,
    albumIds: ['smart-cars', 'album_automotive_series', 'album_portfolio_2026'],
    placeId: 'place_alps',
    placeName: 'Furka Alpine Pass, Switzerland',
    eventId: 'event_alps_supercar',
    eventName: 'Alpine Supercar Pass Expedition',
    aiAnalysis: {
      isAnalyzed: true,
      analyzedAt: Date.now() - 86400000 * 6,
      sceneDescription: 'A high-performance modern sports car navigating a hairpin curve along a scenic Swiss alpine mountain pass.',
      tags: ['car', 'cars', 'supercar', 'sports car', 'vehicle', 'automobile', 'alpine pass', 'mountains', 'highway', 'racing', 'german engineering', 'speed', 'asphalt'],
      categories: ['Automotive & Cars', 'Landscape', 'Travel'],
      detectedObjects: [
        { label: 'car', confidence: 0.99 },
        { label: 'sports car', confidence: 0.99 },
        { label: 'road', confidence: 0.97 },
      ],
      timeOfDay: 'day',
      isPortrait: false,
      portraitQualityScore: 0,
      aestheticScore: 97,
      facesDetected: 0,
      primarySubject: 'GT3 Sports Car on Mountain Pass',
      dominantColors: ['#2563eb', '#334155', '#16a34a', '#e2e8f0'],
      mood: 'Exhilarating & Precision',
      lightingType: 'Crisp Mountain Sunlight',
      locationName: 'Furka Pass, Switzerland',
    },
  },

  // 6. Cars: Urban Night Sports Coupe
  {
    id: 'photo_car_night_coupe_03',
    title: 'Urban_Night_Sports_Coupe.jpg',
    originalUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2400&q=90',
    width: 2400,
    height: 1600,
    fileSize: 3100000,
    format: 'jpeg',
    createdAt: Date.now() - 86400000 * 7,
    importedAt: Date.now() - 86400000 * 7,
    dateTaken: '2026-07-28 22:30:00',
    rating: 4,
    isFavorite: false,
    albumIds: ['smart-cars', 'smart-night', 'album_automotive_series'],
    placeId: 'place_tokyo',
    placeName: 'Shinjuku Neon District, Tokyo',
    aiAnalysis: {
      isAnalyzed: true,
      analyzedAt: Date.now() - 86400000 * 7,
      sceneDescription: 'Sleek dark sports car reflecting neon city lights on damp city asphalt at midnight.',
      tags: ['car', 'cars', 'sports car', 'night', 'neon', 'city lights', 'dark', 'urban', 'reflections', 'vehicle', 'automobile', 'midnight', 'street'],
      categories: ['Automotive & Cars', 'Night Photography', 'Street & Urban'],
      detectedObjects: [
        { label: 'car', confidence: 0.99 },
        { label: 'vehicle', confidence: 0.97 },
      ],
      timeOfDay: 'night',
      isPortrait: false,
      portraitQualityScore: 0,
      aestheticScore: 93,
      facesDetected: 0,
      primarySubject: 'Night Sports Car under Neon',
      dominantColors: ['#0f172a', '#ec4899', '#06b6d4', '#475569'],
      mood: 'Moody & Cyberpunk',
      lightingType: 'Neon City Streetlights',
      locationName: 'Metropolitan Downtown',
    },
  },

  // 7. Portraits: Studio Editorial Fashion (5★ Best Portrait)
  {
    id: 'photo_portrait_studio_01',
    title: 'Editorial_Studio_Fashion_Portrait.jpg',
    originalUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=2400&q=90',
    width: 2400,
    height: 1600,
    fileSize: 3600000,
    format: 'jpeg',
    createdAt: Date.now() - 86400000 * 8,
    importedAt: Date.now() - 86400000 * 8,
    lastEditedAt: Date.now() - 3600000 * 2,
    dateTaken: '2026-07-25 14:00:00',
    rating: 5,
    isFavorite: true,
    albumIds: ['smart-portraits', 'album_portfolio_2026'],
    peopleIds: ['person_elena'],
    eventId: 'event_fashion_editorial',
    eventName: 'Studio Haute Couture Campaign',
    aiAnalysis: {
      isAnalyzed: true,
      analyzedAt: Date.now() - 86400000 * 8,
      sceneDescription: 'Studio editorial portrait of a woman with captivating eye contact, flawless softbox lighting, and fine skin detail.',
      tags: ['portrait', 'portraits', 'person', 'woman', 'face', 'eyes', 'studio', 'editorial', 'model', 'beauty', 'fashion', 'high key', 'gaze', 'catchlight'],
      categories: ['Portrait', 'Fashion & Lifestyle'],
      detectedObjects: [
        { label: 'person', confidence: 0.99 },
        { label: 'face', confidence: 0.99 },
        { label: 'eyes', confidence: 0.97 },
      ],
      timeOfDay: 'indoor',
      isPortrait: true,
      portraitQualityScore: 98,
      aestheticScore: 98,
      facesDetected: 1,
      primarySubject: 'Studio Fashion Editorial Model',
      dominantColors: ['#fbcfe8', '#334155', '#f8fafc', '#f43f5e'],
      mood: 'Elegant & Confident',
      lightingType: 'Large Octabox Key Light with Reflector',
      locationName: 'Lumina Studio Brooklyn',
    },
    exifMetadata: {
      cameraMake: 'Hasselblad',
      cameraModel: 'X2D 100C (100 MP)',
      lens: 'XCD 90mm F2.5 V',
      iso: 64,
      focalLength: '90mm',
      aperture: 'f/4.0',
      shutterSpeed: '1/250s',
      colorSpace: 'Display P3',
    },
  },

  // 8. Portraits: Golden Hour Backlit Portrait (5★ Best Portrait)
  {
    id: 'photo_portrait_golden_02',
    title: 'Golden_Hour_Natural_Light_Portrait.jpg',
    originalUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=2400&q=90',
    width: 2400,
    height: 1600,
    fileSize: 3150000,
    format: 'jpeg',
    createdAt: Date.now() - 86400000 * 9,
    importedAt: Date.now() - 86400000 * 9,
    lastEditedAt: Date.now() - 3600000 * 24,
    dateTaken: '2026-07-20 19:25:00',
    rating: 5,
    isFavorite: true,
    albumIds: ['smart-portraits', 'album_portfolio_2026'],
    peopleIds: ['person_maya'],
    eventId: 'event_fashion_editorial',
    eventName: 'Studio Haute Couture Campaign',
    aiAnalysis: {
      isAnalyzed: true,
      analyzedAt: Date.now() - 86400000 * 9,
      sceneDescription: 'Warm golden hour sunlight filtering through hair creating a soft luminous glow and candid joyful smile.',
      tags: ['portrait', 'portraits', 'person', 'woman', 'face', 'golden hour', 'sunset', 'natural light', 'bokeh', 'smile', 'warm', 'backlight', 'candid', 'beauty'],
      categories: ['Portrait', 'Fashion & Lifestyle'],
      detectedObjects: [
        { label: 'person', confidence: 0.99 },
        { label: 'face', confidence: 0.98 },
      ],
      timeOfDay: 'golden-hour',
      isPortrait: true,
      portraitQualityScore: 96,
      aestheticScore: 96,
      facesDetected: 1,
      primarySubject: 'Woman in Golden Hour Sunlight',
      dominantColors: ['#f59e0b', '#fb923c', '#475569', '#fef08a'],
      mood: 'Warm & Joyful',
      lightingType: 'Golden Sun Backlight & Ambient Fill',
      locationName: 'Sunlit Meadow',
    },
  },

  // 9. Portraits: Cinematic Moody Window Portrait (4★ Portrait)
  {
    id: 'photo_portrait_cinematic_03',
    title: 'Cinematic_Rainy_Window_Portrait.jpg',
    originalUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=2400&q=90',
    width: 2400,
    height: 1600,
    fileSize: 2800000,
    format: 'jpeg',
    createdAt: Date.now() - 86400000 * 10,
    importedAt: Date.now() - 86400000 * 10,
    dateTaken: '2026-07-15 16:40:00',
    rating: 4,
    isFavorite: false,
    albumIds: ['smart-portraits'],
    peopleIds: ['person_marcus'],
    eventId: 'event_fashion_editorial',
    eventName: 'Studio Haute Couture Campaign',
    aiAnalysis: {
      isAnalyzed: true,
      analyzedAt: Date.now() - 86400000 * 10,
      sceneDescription: 'Cinematic portrait of a man looking through a rain-streaked window with soft natural directional illumination.',
      tags: ['portrait', 'portraits', 'person', 'man', 'face', 'eyes', 'cinematic', 'moody', 'rain', 'window', 'shallow depth of field', 'reflection'],
      categories: ['Portrait', 'Street & Urban'],
      detectedObjects: [
        { label: 'person', confidence: 0.98 },
        { label: 'face', confidence: 0.97 },
      ],
      timeOfDay: 'day',
      isPortrait: true,
      portraitQualityScore: 92,
      aestheticScore: 91,
      facesDetected: 1,
      primarySubject: 'Man by Rainy Window',
      dominantColors: ['#1e293b', '#64748b', '#cbd5e1', '#0284c7'],
      mood: 'Introspective & Moody',
      lightingType: 'Diffused Overcast Window Light',
      locationName: 'Urban Coffeehouse',
    },
  },

  // 10. Night: Cyberpunk Tokyo Rain
  {
    id: 'photo_night_tokyo_01',
    title: 'Cyberpunk_Tokyo_Rain_Night.jpg',
    originalUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=2400&q=90',
    width: 2400,
    height: 1500,
    fileSize: 3300000,
    format: 'jpeg',
    createdAt: Date.now() - 86400000 * 11,
    importedAt: Date.now() - 86400000 * 11,
    dateTaken: '2026-07-10 23:15:00',
    rating: 5,
    isFavorite: true,
    albumIds: ['smart-night', 'album_portfolio_2026'],
    placeId: 'place_tokyo',
    placeName: 'Shinjuku Neon District, Tokyo',
    eventId: 'event_tokyo_cyberpunk',
    eventName: 'Tokyo Midnight Cyberpunk Tour',
    aiAnalysis: {
      isAnalyzed: true,
      analyzedAt: Date.now() - 86400000 * 11,
      sceneDescription: 'Vibrant neon street signs reflecting on wet asphalt in Shinjuku Tokyo during a late night rainstorm.',
      tags: ['night', 'dark', 'neon', 'city lights', 'tokyo', 'japan', 'rain', 'reflections', 'cyberpunk', 'urban', 'shinjuku', 'street photography', 'midnight'],
      categories: ['Night Photography', 'Street & Urban', 'Travel'],
      detectedObjects: [
        { label: 'city lights', confidence: 0.98 },
        { label: 'building', confidence: 0.96 },
        { label: 'street', confidence: 0.95 },
      ],
      timeOfDay: 'night',
      isPortrait: false,
      portraitQualityScore: 0,
      aestheticScore: 96,
      facesDetected: 0,
      primarySubject: 'Neon Shinjuku Street in Rain',
      dominantColors: ['#0f172a', '#ec4899', '#38bdf8', '#eab308'],
      mood: 'Atmospheric & Electric',
      lightingType: 'Vibrant Neon City Glow',
      locationName: 'Shinjuku, Tokyo, Japan',
    },
  },

  // 11. Night: Desert Stargazing Milky Way
  {
    id: 'photo_night_astro_02',
    title: 'Milky_Way_Stargazing_Desert_Night.jpg',
    originalUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2400&q=90',
    width: 2400,
    height: 1600,
    fileSize: 4100000,
    format: 'jpeg',
    createdAt: Date.now() - 86400000 * 12,
    importedAt: Date.now() - 86400000 * 12,
    dateTaken: '2026-07-05 02:30:00',
    rating: 5,
    isFavorite: true,
    albumIds: ['smart-night', 'album_portfolio_2026'],
    placeId: 'place_atacama',
    placeName: 'Atacama Dark Sky Reserve, Chile',
    eventId: 'event_atacama_astro',
    eventName: 'Atacama Deep Space Stargazing',
    aiAnalysis: {
      isAnalyzed: true,
      analyzedAt: Date.now() - 86400000 * 12,
      sceneDescription: 'Long exposure astrophotography capturing the dense galactic core of the Milky Way spanning across a desert night sky.',
      tags: ['night', 'astrophotography', 'stars', 'milky way', 'galaxy', 'dark sky', 'space', 'desert', 'astronomy', 'constellations', 'deep space', 'long exposure'],
      categories: ['Night Photography', 'Landscape'],
      detectedObjects: [
        { label: 'night sky', confidence: 0.99 },
        { label: 'stars', confidence: 0.99 },
      ],
      timeOfDay: 'night',
      isPortrait: false,
      portraitQualityScore: 0,
      aestheticScore: 98,
      facesDetected: 0,
      primarySubject: 'Milky Way Core over Desert',
      dominantColors: ['#020617', '#312e81', '#6366f1', '#f8fafc'],
      mood: 'Cosmic & Grand',
      lightingType: 'Starlight & Galactic Emission',
      locationName: 'Atacama Desert',
    },
    exifMetadata: {
      cameraMake: 'Sony',
      cameraModel: 'Alpha 7S III',
      lens: 'FE 14mm F1.8 GM',
      iso: 3200,
      focalLength: '14mm',
      aperture: 'f/1.8',
      shutterSpeed: '15s',
      colorSpace: 'Adobe RGB',
    },
  },

  // 12. Night: Neon Alley Cyber Glow
  {
    id: 'photo_night_alley_03',
    title: 'Midnight_Neon_Alley_Signage.jpg',
    originalUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=2400&q=90',
    width: 2400,
    height: 1600,
    fileSize: 3200000,
    format: 'jpeg',
    createdAt: Date.now() - 86400000 * 13,
    importedAt: Date.now() - 86400000 * 13,
    dateTaken: '2026-06-30 01:10:00',
    rating: 4,
    isFavorite: false,
    albumIds: ['smart-night'],
    placeId: 'place_tokyo',
    placeName: 'Shinjuku Neon District, Tokyo',
    eventId: 'event_tokyo_cyberpunk',
    eventName: 'Tokyo Midnight Cyberpunk Tour',
    aiAnalysis: {
      isAnalyzed: true,
      analyzedAt: Date.now() - 86400000 * 13,
      sceneDescription: 'Intimate narrow alley illuminated by glowing magenta and cyan neon signposts under dark midnight sky.',
      tags: ['night', 'dark', 'neon', 'city lights', 'alley', 'urban', 'magenta', 'cyan', 'midnight', 'street', 'architecture'],
      categories: ['Night Photography', 'Street & Urban'],
      detectedObjects: [
        { label: 'neon sign', confidence: 0.97 },
        { label: 'street', confidence: 0.95 },
      ],
      timeOfDay: 'night',
      isPortrait: false,
      portraitQualityScore: 0,
      aestheticScore: 92,
      facesDetected: 0,
      primarySubject: 'Neon Sign Alleys at Midnight',
      dominantColors: ['#09090b', '#d946ef', '#06b6d4', '#3b82f6'],
      mood: 'Mysterious & Saturated',
      lightingType: 'Direct Neon Tubes',
      locationName: 'Neon District',
    },
  },

  // 13. RAW Sensor Landscape: Glacier Fjord (Sony ARW)
  {
    id: 'photo_raw_glacier_01',
    title: 'Glacier_Fjord_DSC04921.ARW',
    originalUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=95',
    width: 3840,
    height: 2560,
    fileSize: 42500000,
    format: 'arw',
    createdAt: Date.now() - 86400000 * 14,
    importedAt: Date.now() - 86400000 * 14,
    dateTaken: '2026-06-20 06:15:00',
    rating: 5,
    isFavorite: true,
    albumIds: ['smart-landscape', 'smart-raw'],
    placeId: 'place_patagonia',
    placeName: 'Patagonia Glacier Fjord, Argentina',
    aiAnalysis: {
      isAnalyzed: true,
      analyzedAt: Date.now() - 86400000 * 14,
      sceneDescription: '14-Bit Sony ARW RAW capture of alpine glacier fjord with dramatic sunrise reflections on crystal mountain lake.',
      tags: ['landscape', 'mountains', 'glacier', 'lake', 'water', 'nature', 'raw', 'sony raw', 'sunrise', 'reflections', 'scenic', 'wilderness'],
      categories: ['Landscape', 'Nature & Wildlife'],
      detectedObjects: [
        { label: 'mountain', confidence: 0.99 },
        { label: 'lake', confidence: 0.98 },
        { label: 'water', confidence: 0.97 },
      ],
      timeOfDay: 'sunrise',
      isPortrait: false,
      portraitQualityScore: 0,
      aestheticScore: 97,
      facesDetected: 0,
      primarySubject: 'Alpine Glacier Lake Sunrise',
      dominantColors: ['#0284c7', '#ea580c', '#1e293b', '#f8fafc'],
      mood: 'Majestic & Serene',
      lightingType: 'Alpine Sunrise Direct Light',
      locationName: 'Patagonia Glacier National Park',
    },
    exifMetadata: {
      isRaw: true,
      cameraMake: 'Sony',
      cameraModel: 'Alpha 7R V (61.0 MP)',
      lens: 'FE 24-70mm F2.8 GM II',
      iso: 100,
      focalLength: '24mm',
      aperture: 'f/8.0',
      shutterSpeed: '1/320s',
      colorSpace: 'ProPhoto RGB / Wide Gamut',
      bitDepth: 14,
    },
  },

  // 14. RAW Sensor Landscape: Desert Dunes (Canon CR3)
  {
    id: 'photo_raw_dunes_02',
    title: 'Desert_Dunes_Sunset_IMG_8201.CR3',
    originalUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=2400&q=95',
    width: 3840,
    height: 2560,
    fileSize: 45000000,
    format: 'cr3',
    createdAt: Date.now() - 86400000 * 15,
    importedAt: Date.now() - 86400000 * 15,
    dateTaken: '2026-06-15 18:50:00',
    rating: 5,
    isFavorite: false,
    albumIds: ['smart-landscape', 'smart-raw'],
    placeId: 'place_sahara',
    placeName: 'Merzouga Sand Dunes, Morocco',
    aiAnalysis: {
      isAnalyzed: true,
      analyzedAt: Date.now() - 86400000 * 15,
      sceneDescription: 'Sweeping sand dune ridges casting long sunset shadows across golden desert expanse.',
      tags: ['landscape', 'desert', 'sand', 'dunes', 'sunset', 'golden hour', 'nature', 'raw', 'canon raw', 'shadows', 'curves', 'warm'],
      categories: ['Landscape', 'Nature & Wildlife'],
      detectedObjects: [
        { label: 'sand dunes', confidence: 0.99 },
      ],
      timeOfDay: 'sunset',
      isPortrait: false,
      portraitQualityScore: 0,
      aestheticScore: 95,
      facesDetected: 0,
      primarySubject: 'Golden Sand Dune Ridges',
      dominantColors: ['#d97706', '#f59e0b', '#78350f', '#fde68a'],
      mood: 'Timeless & Warm',
      lightingType: 'Low Angle Sunset Raking Light',
      locationName: 'Sahara Desert Dunes',
    },
    exifMetadata: {
      isRaw: true,
      cameraMake: 'Canon',
      cameraModel: 'EOS R5 Mark II',
      lens: 'RF 24-70mm F2.8 L IS USM',
      iso: 100,
      focalLength: '35mm',
      aperture: 'f/4.0',
      shutterSpeed: '1/500s',
      colorSpace: 'ProPhoto RGB',
      bitDepth: 14,
    },
  },

  // 15. Architecture: Minimalist Concrete Pavilion
  {
    id: 'photo_arch_pavilion_01',
    title: 'Minimal_Concrete_Pavilion.jpg',
    originalUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2400&q=90',
    width: 2400,
    height: 1600,
    fileSize: 2700000,
    format: 'jpeg',
    createdAt: Date.now() - 86400000 * 16,
    importedAt: Date.now() - 86400000 * 16,
    dateTaken: '2026-06-10 13:00:00',
    rating: 4,
    isFavorite: false,
    albumIds: [],
    aiAnalysis: {
      isAnalyzed: true,
      analyzedAt: Date.now() - 86400000 * 16,
      sceneDescription: 'Modern brutalist geometric architecture with clean concrete planes and natural daylight shadows.',
      tags: ['architecture', 'building', 'concrete', 'minimalist', 'geometric', 'lines', 'modern', 'structure', 'design', 'daylight'],
      categories: ['Architecture'],
      detectedObjects: [
        { label: 'building', confidence: 0.99 },
        { label: 'wall', confidence: 0.98 },
      ],
      timeOfDay: 'day',
      isPortrait: false,
      portraitQualityScore: 0,
      aestheticScore: 91,
      facesDetected: 0,
      primarySubject: 'Geometric Modern Pavilion',
      dominantColors: ['#94a3b8', '#cbd5e1', '#475569', '#f8fafc'],
      mood: 'Clean & Sculptural',
      lightingType: 'Direct Sun Angle Shadows',
      locationName: 'Contemporary Art Pavilion',
    },
  },
];

// Persistent Store Helpers
export async function getLibraryPhotosFromDB(): Promise<PhotoItem[]> {
  try {
    const raw = localStorage.getItem('lumina_photo_library_items');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse localStorage photos, initializing catalog:', e);
  }

  saveLibraryPhotosToStorage(INITIAL_PHOTO_LIBRARY);
  return INITIAL_PHOTO_LIBRARY;
}

export function saveLibraryPhotosToStorage(photos: PhotoItem[]): void {
  try {
    localStorage.setItem('lumina_photo_library_items', JSON.stringify(photos));
  } catch (e) {
    console.error('Failed to save photo library items to storage:', e);
  }
}

export async function getAlbumsFromStorage(): Promise<PhotoAlbum[]> {
  try {
    const raw = localStorage.getItem('lumina_photo_albums');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse albums, using defaults:', e);
  }

  const allInitial = [...DEFAULT_SMART_ALBUMS, ...INITIAL_USER_ALBUMS];
  saveAlbumsToStorage(allInitial);
  return allInitial;
}

export function saveAlbumsToStorage(albums: PhotoAlbum[]): void {
  try {
    localStorage.setItem('lumina_photo_albums', JSON.stringify(albums));
  } catch (e) {
    console.error('Failed to save albums to storage:', e);
  }
}

export async function getPeopleFromStorage(): Promise<PersonProfile[]> {
  try {
    const raw = localStorage.getItem('lumina_photo_people');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse people, using defaults:', e);
  }

  savePeopleToStorage(INITIAL_PEOPLE);
  return INITIAL_PEOPLE;
}

export function savePeopleToStorage(people: PersonProfile[]): void {
  try {
    localStorage.setItem('lumina_photo_people', JSON.stringify(people));
  } catch (e) {
    console.error('Failed to save people to storage:', e);
  }
}

export async function getPlacesFromStorage(): Promise<PlaceLocation[]> {
  try {
    const raw = localStorage.getItem('lumina_photo_places');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse places, using defaults:', e);
  }

  savePlacesToStorage(INITIAL_PLACES);
  return INITIAL_PLACES;
}

export function savePlacesToStorage(places: PlaceLocation[]): void {
  try {
    localStorage.setItem('lumina_photo_places', JSON.stringify(places));
  } catch (e) {
    console.error('Failed to save places to storage:', e);
  }
}

export async function getEventsFromStorage(): Promise<PhotoEvent[]> {
  try {
    const raw = localStorage.getItem('lumina_photo_events');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse events, using defaults:', e);
  }

  saveEventsToStorage(INITIAL_EVENTS);
  return INITIAL_EVENTS;
}

export function saveEventsToStorage(events: PhotoEvent[]): void {
  try {
    localStorage.setItem('lumina_photo_events', JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save events to storage:', e);
  }
}
