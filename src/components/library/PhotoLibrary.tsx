import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  Grid3X3,
  Grid2X2,
  LayoutGrid,
  Heart,
  Star,
  FolderPlus,
  Tag,
  Sun,
  Moon,
  Sunset,
  Sunrise,
  Camera,
  Car,
  Palmtree,
  UserCheck,
  Mountain,
  Eye,
  Edit3,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Upload,
  RefreshCw,
  Info,
  Clock,
  Layers,
  ChevronRight,
  X,
  Compass,
  Zap,
  FolderOpen,
  Users,
  MapPin,
  Calendar,
  History,
  DownloadCloud,
  ArrowLeft,
  Copy,
  Share2,
} from 'lucide-react';
import {
  PhotoItem,
  PhotoAlbum,
  PersonProfile,
  PlaceLocation,
  PhotoEvent,
  DuplicateCluster,
  SearchFilterState,
  MainNavSection,
  TimeOfDay,
} from '../../types/library';
import { Project } from '../../types/editor';
import {
  getLibraryPhotosFromDB,
  saveLibraryPhotosToStorage,
  getAlbumsFromStorage,
  saveAlbumsToStorage,
  getPeopleFromStorage,
  savePeopleToStorage,
  getPlacesFromStorage,
  savePlacesToStorage,
  getEventsFromStorage,
  saveEventsToStorage,
} from '../../storage/libraryCatalog';
import {
  getDuplicateClustersFromStorage,
  saveDuplicateClustersToStorage,
} from '../../engine/duplicateDetectionEngine';
import { executeAiPhotoSearch, parseNaturalLanguageQuery } from '../../engine/semanticSearchEngine';
import { requestAiPhotoAutoTag, batchAutoTagPhotos } from '../../engine/aiTaggingEngine';
import { DEFAULT_PROJECT_STATE } from '../../engine/defaultSettings';
import { PeopleView } from './PeopleView';
import { PlacesView } from './PlacesView';
import { EventsView } from './EventsView';
import { DuplicateDetectionView } from './DuplicateDetectionView';
import { SmartAlbumModal } from './SmartAlbumModal';
import { SocialMediaExportModal } from '../social/SocialMediaExportModal';

interface PhotoLibraryProps {
  onOpenInEditor: (project: Project) => void;
  onOpenInBatchStudio?: (photos: PhotoItem[]) => void;
  onOpenCameraStudio?: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

const SAMPLE_SEARCH_SUGGESTIONS = [
  { label: '🏖️ Photos of me at the beach', query: 'Photos of me at the beach.' },
  { label: '🏎️ Find photos with cars', query: 'Find photos with cars.' },
  { label: '⭐ Find my best portraits', query: 'Find my best portraits.' },
  { label: '🌙 Find photos taken at night', query: 'Find photos taken at night.' },
  { label: '🌅 Golden hour sunsets', query: 'Golden hour sunset landscape photos' },
  { label: '📸 High-Res RAW captures', query: 'RAW sensor files with wide dynamic range' },
];

export const PhotoLibrary: React.FC<PhotoLibraryProps> = ({
  onOpenInEditor,
  onOpenInBatchStudio,
  onOpenCameraStudio,
  showToast,
}) => {
  // State
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [people, setPeople] = useState<PersonProfile[]>([]);
  const [places, setPlaces] = useState<PlaceLocation[]>([]);
  const [events, setEvents] = useState<PhotoEvent[]>([]);
  const [duplicateClusters, setDuplicateClusters] = useState<DuplicateCluster[]>([]);
  const [socialExportPhoto, setSocialExportPhoto] = useState<PhotoItem | null>(null);

  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [gridSize, setGridSize] = useState<'compact' | 'normal' | 'large'>('normal');

  // Search & Filter State
  const [filters, setFilters] = useState<SearchFilterState>({
    mainSection: 'all',
    searchQuery: '',
    selectedAlbumId: null,
    selectedPersonId: null,
    selectedPlaceId: null,
    selectedEventId: null,
    selectedCategory: null,
    selectedTimeOfDay: 'all',
    minRating: 0,
    isPortraitOnly: false,
    isFavoriteOnly: false,
    selectedTags: [],
    sortBy: 'relevance',
  });

  // Batch Auto-Tagging Progress State
  const [isTaggingActive, setIsTaggingActive] = useState(false);
  const [taggingProgress, setTaggingProgress] = useState<{ current: number; total: number } | null>(null);

  // New Album Modal
  const [isNewAlbumModalOpen, setIsNewAlbumModalOpen] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');

  // Smart Album Modal
  const [isSmartAlbumModalOpen, setIsSmartAlbumModalOpen] = useState(false);

  // Load photos, albums, people, places, events & duplicate clusters on mount
  useEffect(() => {
    getLibraryPhotosFromDB().then((loaded) => {
      setPhotos(loaded);
      if (loaded.length > 0) {
        setSelectedPhoto(loaded[0]);
      }
      // Load duplicate clusters with photo catalog
      getDuplicateClustersFromStorage(loaded).then(setDuplicateClusters);
    });

    getAlbumsFromStorage().then(setAlbums);
    getPeopleFromStorage().then(setPeople);
    getPlacesFromStorage().then(setPlaces);
    getEventsFromStorage().then(setEvents);
  }, []);

  // Update storage when entities change
  const updatePhotos = (newPhotos: PhotoItem[]) => {
    setPhotos(newPhotos);
    saveLibraryPhotosToStorage(newPhotos);
  };

  const updateAlbums = (newAlbums: PhotoAlbum[]) => {
    setAlbums(newAlbums);
    saveAlbumsToStorage(newAlbums);
  };

  const updatePeople = (newPeople: PersonProfile[]) => {
    setPeople(newPeople);
    savePeopleToStorage(newPeople);
  };

  const updatePlaces = (newPlaces: PlaceLocation[]) => {
    setPlaces(newPlaces);
    savePlacesToStorage(newPlaces);
  };

  const updateEvents = (newEvents: PhotoEvent[]) => {
    setEvents(newEvents);
    saveEventsToStorage(newEvents);
  };

  const updateDuplicateClusters = (newClusters: DuplicateCluster[]) => {
    setDuplicateClusters(newClusters);
    saveDuplicateClustersToStorage(newClusters);
  };

  // Delete duplicate photos handler
  const handleDeleteDuplicatePhotos = (photoIdsToDelete: string[]) => {
    const idSet = new Set(photoIdsToDelete);
    const remainingPhotos = photos.filter((p) => !idSet.has(p.id));
    updatePhotos(remainingPhotos);

    // Update clusters
    const updatedClusters = duplicateClusters
      .map((c) => ({
        ...c,
        photos: c.photos.filter((p) => !idSet.has(p.photo.id)),
      }))
      .filter((c) => c.photos.length > 1);

    updateDuplicateClusters(updatedClusters);
  };

  // Execute Search
  const { results: searchResults, parsedQuery, totalMatchCount } = useMemo(() => {
    return executeAiPhotoSearch(photos, filters);
  }, [photos, filters]);

  // Statistics
  const totalAnalyzedCount = useMemo(() => {
    return photos.filter((p) => p.aiAnalysis?.isAnalyzed).length;
  }, [photos]);

  const editedPhotosCount = useMemo(() => {
    return photos.filter((p) => Boolean(p.lastEditedAt)).length;
  }, [photos]);

  // Handle Photo Click
  const handlePhotoClick = (photo: PhotoItem, e: React.MouseEvent) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      togglePhotoSelection(photo.id);
    } else {
      setSelectedPhoto(photo);
    }
  };

  // Toggle Selection
  const togglePhotoSelection = (id: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedPhotoIds.size === searchResults.length) {
      setSelectedPhotoIds(new Set());
    } else {
      setSelectedPhotoIds(new Set(searchResults.map((p) => p.id)));
    }
  };

  // Favorite Toggle
  const toggleFavorite = (photoId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = photos.map((p) => {
      if (p.id === photoId) {
        const nextFav = !p.isFavorite;
        showToast('info', nextFav ? 'Favorited' : 'Removed from Favorites', p.title);
        return { ...p, isFavorite: nextFav };
      }
      return p;
    });
    updatePhotos(updated);
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  // Star Rating Change
  const handleSetRating = (photoId: string, rating: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = photos.map((p) => {
      if (p.id === photoId) {
        return { ...p, rating };
      }
      return p;
    });
    updatePhotos(updated);
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto((prev) => (prev ? { ...prev, rating } : null));
    }
    showToast('success', 'Rating Updated', `${rating} ★ set for photo`);
  };

  // Open Photo in Lumina Studio Editor
  const handleOpenPhotoInEditor = (photo: PhotoItem) => {
    const isRaw = photo.exifMetadata?.isRaw || ['arw', 'cr3', 'dng', 'raf', 'nef', 'raw'].includes(photo.format.toLowerCase());

    // Update lastEditedAt timestamp
    const updatedPhoto = { ...photo, lastEditedAt: Date.now() };
    const nextList = photos.map((p) => (p.id === photo.id ? updatedPhoto : p));
    updatePhotos(nextList);

    const project: Project = {
      ...DEFAULT_PROJECT_STATE,
      id: `proj_${photo.id}_${Date.now()}`,
      name: photo.title,
      image: {
        id: photo.id,
        name: photo.title,
        originalUrl: photo.originalUrl,
        width: photo.width,
        height: photo.height,
        format: photo.format,
        size: photo.fileSize,
        createdAt: photo.createdAt,
        rawMetadata: {
          isRaw,
          cameraMake: photo.exifMetadata?.cameraMake || 'Sony',
          cameraModel: photo.exifMetadata?.cameraModel || 'Alpha 7R V',
          lens: photo.exifMetadata?.lens || 'FE 24-70mm F2.8 GM II',
          iso: photo.exifMetadata?.iso || 100,
          focalLength: photo.exifMetadata?.focalLength || '35mm',
          aperture: photo.exifMetadata?.aperture || 'f/2.8',
          shutterSpeed: photo.exifMetadata?.shutterSpeed || '1/250s',
          colorSpace: photo.exifMetadata?.colorSpace || 'Display P3',
          bitDepth: photo.exifMetadata?.bitDepth || (isRaw ? 14 : 8),
        },
      },
      currentSettings: {
        ...DEFAULT_PROJECT_STATE.currentSettings,
        ...(photo.projectState?.currentSettings || {}),
      },
      history: [
        {
          id: 'step_init',
          timestamp: Date.now(),
          label: 'Imported from Photo Library',
          settings: { ...DEFAULT_PROJECT_STATE.currentSettings },
          toneCurves: { ...DEFAULT_PROJECT_STATE.toneCurves },
          hsl: { ...DEFAULT_PROJECT_STATE.hsl },
          crop: { ...DEFAULT_PROJECT_STATE.crop },
          activePresetId: null,
          presetStrength: 100,
          watermark: { ...DEFAULT_PROJECT_STATE.watermark },
          border: { ...DEFAULT_PROJECT_STATE.border },
          masks: [],
        },
      ],
      historyIndex: 0,
    };

    onOpenInEditor(project);
    showToast('success', 'Loaded into Editor', `Opened "${photo.title}"`);
  };

  // Re-Analyze Single Photo with Gemini AI
  const handleSinglePhotoAutoTag = async (photo: PhotoItem) => {
    showToast('info', 'AI Vision Analysis', `Analyzing "${photo.title}" with Gemini AI...`);
    try {
      const analysis = await requestAiPhotoAutoTag({
        originalUrl: photo.originalUrl,
        name: photo.title,
      });

      const updatedPhoto: PhotoItem = {
        ...photo,
        aiAnalysis: analysis,
      };

      const nextList = photos.map((p) => (p.id === photo.id ? updatedPhoto : p));
      updatePhotos(nextList);
      setSelectedPhoto(updatedPhoto);
      showToast('success', 'AI Auto-Tag Complete', `Generated ${analysis.tags.length} smart tags and scene description.`);
    } catch (err: any) {
      showToast('error', 'AI Tagging Failed', err.message);
    }
  };

  // Batch Auto-Tag All / Selected Photos
  const handleBatchAutoTag = async (targetPhotos?: PhotoItem[]) => {
    const listToTag = targetPhotos || (selectedPhotoIds.size > 0
      ? photos.filter((p) => selectedPhotoIds.has(p.id))
      : photos);

    if (listToTag.length === 0) {
      showToast('info', 'No Photos', 'No photos available to tag');
      return;
    }

    setIsTaggingActive(true);
    setTaggingProgress({ current: 0, total: listToTag.length });
    showToast('info', 'Batch AI Tagging Started', `Processing ${listToTag.length} photos with Gemini Vision...`);

    try {
      const updatedTagged = await batchAutoTagPhotos(listToTag, (curr, tot) => {
        setTaggingProgress({ current: curr, total: tot });
      });

      const taggedMap = new Map(updatedTagged.map((p) => [p.id, p]));
      const nextPhotos = photos.map((p) => taggedMap.get(p.id) || p);

      updatePhotos(nextPhotos);
      if (selectedPhoto && taggedMap.has(selectedPhoto.id)) {
        setSelectedPhoto(taggedMap.get(selectedPhoto.id)!);
      }

      showToast('success', 'Batch Tagging Finished', `Successfully analyzed and tagged ${listToTag.length} photos.`);
    } catch (err: any) {
      showToast('error', 'Batch Tagging Failed', err.message);
    } finally {
      setIsTaggingActive(false);
      setTaggingProgress(null);
    }
  };

  // Local Photo File Import (Recently Imported)
  const handleImportLocalFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    showToast('info', 'Importing Photos', `Reading ${files.length} image files...`);

    const newItems: PhotoItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const isRaw = file.name.match(/\.(arw|cr3|cr2|nef|raf|dng|raw|orf)$/i) !== null;

      // Extract image dimensions
      const img = new Image();
      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        img.onload = () => resolve({ w: img.width, h: img.height });
        img.onerror = () => resolve({ w: 2400, h: 1600 });
        img.src = url;
      });

      const photo: PhotoItem = {
        id: `user_photo_${Date.now()}_${i}`,
        title: file.name,
        originalUrl: url,
        width: dims.w,
        height: dims.h,
        fileSize: file.size,
        format: file.name.split('.').pop()?.toLowerCase() || 'jpeg',
        createdAt: Date.now(),
        importedAt: Date.now(),
        dateTaken: new Date().toISOString().replace('T', ' ').substring(0, 19),
        rating: 0,
        isFavorite: false,
        albumIds: [],
        aiAnalysis: {
          isAnalyzed: false,
          sceneDescription: 'Newly imported photo. Click "Auto-Tag with AI" to analyze.',
          tags: ['imported', 'photo'],
          categories: ['Uncategorized'],
          detectedObjects: [],
          timeOfDay: 'day',
          isPortrait: false,
          portraitQualityScore: 0,
          aestheticScore: 80,
          facesDetected: 0,
          primarySubject: file.name.replace(/\.[^/.]+$/, ''),
          dominantColors: ['#3b82f6', '#1e293b'],
        },
        exifMetadata: {
          isRaw,
          cameraMake: 'Digital Camera',
          cameraModel: 'RAW / High-Res Capture',
          lens: 'Lens',
          iso: 100,
          focalLength: '35mm',
          aperture: 'f/2.8',
          shutterSpeed: '1/250s',
          colorSpace: 'sRGB',
        },
      };

      newItems.push(photo);
    }

    const updated = [...newItems, ...photos];
    updatePhotos(updated);
    setSelectedPhoto(newItems[0]);
    showToast('success', 'Photos Imported', `Added ${newItems.length} photos to Recently Imported.`);

    // Switch view to recently-imported
    setFilters((prev) => ({ ...prev, mainSection: 'recently-imported', sortBy: 'recently-imported' }));

    // Auto-tag newly imported photos in the background
    handleBatchAutoTag(newItems);
  };

  // Create New Custom Album
  const handleCreateAlbum = () => {
    if (!newAlbumTitle.trim()) return;

    const newAlbum: PhotoAlbum = {
      id: `album_${Date.now()}`,
      title: newAlbumTitle.trim(),
      description: 'Custom Photo Collection',
      icon: 'Folder',
      isSmart: false,
      photoCount: 0,
      createdAt: Date.now(),
    };

    const nextAlbums = [...albums, newAlbum];
    updateAlbums(nextAlbums);
    setNewAlbumTitle('');
    setIsNewAlbumModalOpen(false);
    showToast('success', 'Album Created', `Created album "${newAlbum.title}"`);
  };

  // Create Smart Album
  const handleCreateSmartAlbum = (newSmartAlbum: PhotoAlbum) => {
    const nextAlbums = [newSmartAlbum, ...albums];
    updateAlbums(nextAlbums);
    showToast('success', 'Smart Album Created', `Created dynamic album "${newSmartAlbum.title}"`);
  };

  // Delete Selected Photos
  const handleDeleteSelected = () => {
    if (selectedPhotoIds.size === 0) return;
    const nextPhotos = photos.filter((p) => !selectedPhotoIds.has(p.id));
    updatePhotos(nextPhotos);
    setSelectedPhotoIds(new Set());
    if (selectedPhoto && selectedPhotoIds.has(selectedPhoto.id)) {
      setSelectedPhoto(nextPhotos[0] || null);
    }
    showToast('info', 'Photos Deleted', `Removed ${selectedPhotoIds.size} photos from library`);
  };

  // Active Person, Place, Event or Album for Breadcrumbs
  const currentPerson = people.find((p) => p.id === filters.selectedPersonId);
  const currentPlace = places.find((p) => p.id === filters.selectedPlaceId);
  const currentEvent = events.find((e) => e.id === filters.selectedEventId);
  const currentAlbum = albums.find((a) => a.id === filters.selectedAlbumId);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* TOP HEADER: AI SEARCH BAR & PRESET PROMPT PILLS */}
      <header className="px-6 pt-5 pb-4 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            {/* Title & Tagging Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[1.5px] shadow-lg shadow-purple-500/20 shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Compass className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg text-white tracking-tight">AI Photo Library & Vision Studio</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Gemini 3.7 Vision
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {photos.length} Photos • {people.length} People • {places.length} Places • {events.length} Events • {duplicateClusters.length} Duplicate Clusters • {totalAnalyzedCount} AI Analyzed
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {onOpenCameraStudio && (
                <button
                  onClick={onOpenCameraStudio}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95"
                  title="Open Pro Camera Studio (RAW Capture, Manual ISO, Shutter, Focus Peaking)"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-950" />
                  <span>Pro Camera</span>
                </button>
              )}

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700/80 cursor-pointer transition-colors shadow-sm">
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>Import Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.arw,.cr3,.cr2,.nef,.raf,.dng,.raw"
                  onChange={handleImportLocalFiles}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => handleBatchAutoTag()}
                disabled={isTaggingActive}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                title="Automatically analyze and tag all photos with Gemini 3.7 Vision"
              >
                {isTaggingActive ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Tagging ({taggingProgress?.current}/{taggingProgress?.total})...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Auto-Tag with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Natural Language AI Search Bar */}
          <div className="relative flex items-center">
            <div className="absolute left-4 pointer-events-none flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-400" />
            </div>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              placeholder='Search by natural language: "Photos of me at the beach", "Find photos with cars", "Find my best portraits", "Night city lights"...'
              className="w-full bg-slate-950/80 border border-indigo-500/30 focus:border-indigo-500 rounded-xl pl-11 pr-24 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all shadow-inner focus:ring-2 focus:ring-indigo-500/20"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick AI Search Prompt Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Try Search:
            </span>
            {SAMPLE_SEARCH_SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: item.query }))}
                className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-all border ${
                  filters.searchQuery === item.query
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Active AI Search Intent Notification Banner */}
          {parsedQuery && filters.searchQuery.trim() && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-slate-300">
                  <strong className="text-indigo-300">AI Vision Filter:</strong> {parsedQuery.intentSummary}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-900/60 text-indigo-200 font-semibold text-[11px]">
                  {totalMatchCount} matching photo{totalMatchCount !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                className="text-xs text-indigo-300 hover:text-indigo-100 font-semibold underline ml-2"
              >
                Reset Search
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN WORKSPACE BODY: SIDEBAR + GRID / VIEWS + INSPECTOR */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR: COMPLETE PHOTO MANAGEMENT HUBS */}
        <aside className="w-64 bg-slate-900/70 border-r border-slate-800/80 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 flex flex-col gap-5">
            {/* Library Core Views */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                Library
              </h3>
              <div className="flex flex-col gap-0.5">
                {/* All Photos */}
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, mainSection: 'all', selectedAlbumId: null, selectedPersonId: null, selectedPlaceId: null, selectedEventId: null }))}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.mainSection === 'all' && !filters.selectedAlbumId && !filters.selectedPersonId && !filters.selectedPlaceId && !filters.selectedEventId
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="w-3.5 h-3.5" />
                    <span>All Photos</span>
                  </div>
                  <span className="text-[11px] opacity-75">{photos.length}</span>
                </button>

                {/* Favorites */}
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, mainSection: 'favorites', selectedAlbumId: null, selectedPersonId: null, selectedPlaceId: null, selectedEventId: null }))}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.mainSection === 'favorites'
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
                    <span>Favorites (★5)</span>
                  </div>
                  <span className="text-[11px] opacity-75">
                    {photos.filter((p) => p.isFavorite || p.rating === 5).length}
                  </span>
                </button>

                {/* Duplicates & Bursts (Smart Decluttering) */}
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, mainSection: 'duplicates', selectedAlbumId: null, selectedPersonId: null, selectedPlaceId: null, selectedEventId: null }))}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.mainSection === 'duplicates'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Duplicates & Bursts</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-300 border border-amber-500/40">
                    {duplicateClusters.length}
                  </span>
                </button>

                {/* Recently Edited */}
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, mainSection: 'recently-edited', sortBy: 'last-edited', selectedAlbumId: null, selectedPersonId: null, selectedPlaceId: null, selectedEventId: null }))}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.mainSection === 'recently-edited'
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Recently Edited</span>
                  </div>
                  <span className="text-[11px] opacity-75">{editedPhotosCount}</span>
                </button>

                {/* Recently Imported */}
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, mainSection: 'recently-imported', sortBy: 'recently-imported', selectedAlbumId: null, selectedPersonId: null, selectedPlaceId: null, selectedEventId: null }))}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.mainSection === 'recently-imported'
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DownloadCloud className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Recently Imported</span>
                  </div>
                  <span className="text-[11px] opacity-75">{photos.length}</span>
                </button>

                {/* RAW Sensor Captures */}
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, mainSection: 'raw', selectedAlbumId: null, selectedPersonId: null, selectedPlaceId: null, selectedEventId: null }))}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.mainSection === 'raw'
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>RAW Sensor Captures</span>
                  </div>
                  <span className="text-[11px] opacity-75">
                    {photos.filter((p) => p.exifMetadata?.isRaw || ['arw', 'cr3', 'dng', 'raf'].includes(p.format.toLowerCase())).length}
                  </span>
                </button>

                {/* Untagged Queue */}
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, mainSection: 'untagged', selectedAlbumId: null, selectedPersonId: null, selectedPlaceId: null, selectedEventId: null }))}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.mainSection === 'untagged'
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Untagged Queue</span>
                  </div>
                  <span className="text-[11px] opacity-75">
                    {photos.filter((p) => !p.aiAnalysis?.isAnalyzed).length}
                  </span>
                </button>
              </div>
            </div>

            {/* Hubs: People, Places, Events */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                Organize & Discover
              </h3>
              <div className="flex flex-col gap-0.5">
                {/* People Hub */}
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, mainSection: 'people', selectedPersonId: null }))}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.mainSection === 'people'
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span>People & Faces</span>
                  </div>
                  <span className="text-[11px] opacity-75">{people.length}</span>
                </button>

                {/* Places Hub */}
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, mainSection: 'places', selectedPlaceId: null }))}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.mainSection === 'places'
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Places & Locations</span>
                  </div>
                  <span className="text-[11px] opacity-75">{places.length}</span>
                </button>

                {/* Events Hub */}
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, mainSection: 'events', selectedEventId: null }))}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.mainSection === 'events'
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-orange-400" />
                    <span>Events & Shoots</span>
                  </div>
                  <span className="text-[11px] opacity-75">{events.length}</span>
                </button>
              </div>
            </div>

            {/* Smart Albums */}
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Smart Albums
                </h3>
                <button
                  onClick={() => setIsSmartAlbumModalOpen(true)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Create Custom Smart Album"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-0.5">
                {albums
                  .filter((a) => a.isSmart)
                  .map((album) => (
                    <button
                      key={album.id}
                      onClick={() => setFilters((prev) => ({ ...prev, mainSection: 'smart-albums', selectedAlbumId: album.id }))}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filters.mainSection === 'smart-albums' && filters.selectedAlbumId === album.id
                          ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {album.id === 'smart-beach' && <Palmtree className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        {album.id === 'smart-cars' && <Car className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                        {album.id === 'smart-portraits' && <UserCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                        {album.id === 'smart-night' && <Moon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                        {album.id === 'smart-landscape' && <Mountain className="w-3.5 h-3.5 text-lime-400 shrink-0" />}
                        {album.id === 'smart-masterpieces' && <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        {album.id === 'smart-raw' && <Camera className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                        {!['smart-beach', 'smart-cars', 'smart-portraits', 'smart-night', 'smart-landscape', 'smart-masterpieces', 'smart-raw'].includes(album.id) && (
                          <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        )}
                        <span className="truncate">{album.title}</span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Custom User Albums */}
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Custom Albums
                </h3>
                <button
                  onClick={() => setIsNewAlbumModalOpen(true)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Create New Album"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-0.5">
                {albums
                  .filter((a) => !a.isSmart)
                  .map((album) => (
                    <button
                      key={album.id}
                      onClick={() => setFilters((prev) => ({ ...prev, mainSection: 'albums', selectedAlbumId: album.id }))}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filters.mainSection === 'albums' && filters.selectedAlbumId === album.id
                          ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FolderOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{album.title}</span>
                      </div>
                      <span className="text-[11px] opacity-75">
                        {photos.filter((p) => p.albumIds?.includes(album.id)).length}
                      </span>
                    </button>
                  ))}
                {albums.filter((a) => !a.isSmart).length === 0 && (
                  <p className="text-[11px] text-slate-400 px-2.5 py-1 italic">
                    No custom albums yet. Click + to add.
                  </p>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER CONTENT: HUBS, DUPLICATES, OR MAIN PHOTO GRID */}
        {filters.mainSection === 'duplicates' ? (
          <DuplicateDetectionView
            clusters={duplicateClusters}
            onUpdateClusters={updateDuplicateClusters}
            onDeletePhotos={handleDeleteDuplicatePhotos}
            showToast={showToast}
          />
        ) : filters.mainSection === 'people' && !filters.selectedPersonId ? (
          <PeopleView
            people={people}
            photos={photos}
            onSelectPerson={(personId) => setFilters((prev) => ({ ...prev, selectedPersonId: personId }))}
            onUpdatePeople={updatePeople}
            showToast={showToast}
          />
        ) : filters.mainSection === 'places' && !filters.selectedPlaceId ? (
          <PlacesView
            places={places}
            photos={photos}
            onSelectPlace={(placeId) => setFilters((prev) => ({ ...prev, selectedPlaceId: placeId }))}
            onUpdatePlaces={updatePlaces}
            showToast={showToast}
          />
        ) : filters.mainSection === 'events' && !filters.selectedEventId ? (
          <EventsView
            events={events}
            photos={photos}
            onSelectEvent={(eventId) => setFilters((prev) => ({ ...prev, selectedEventId: eventId }))}
            onUpdateEvents={updateEvents}
            showToast={showToast}
          />
        ) : (
          <section className="flex-1 flex flex-col overflow-hidden bg-slate-950">
            {/* Filter & Sort Toolbar + Breadcrumb */}
            <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between gap-4 shrink-0 flex-wrap">
              {/* Left Breadcrumb & Back buttons */}
              <div className="flex items-center gap-2">
                {(filters.selectedPersonId || filters.selectedPlaceId || filters.selectedEventId || (filters.mainSection !== 'all' && filters.mainSection !== 'favorites')) && (
                  <button
                    onClick={() => setFilters((prev) => ({
                      ...prev,
                      selectedPersonId: null,
                      selectedPlaceId: null,
                      selectedEventId: null,
                      selectedAlbumId: null,
                      mainSection: filters.selectedPersonId ? 'people' : filters.selectedPlaceId ? 'places' : filters.selectedEventId ? 'events' : 'all',
                    }))}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  {currentPerson && (
                    <span className="flex items-center gap-1 text-purple-300">
                      <Users className="w-3.5 h-3.5" />
                      <span>{currentPerson.name} ({currentPerson.relationship || 'Person'})</span>
                    </span>
                  )}
                  {currentPlace && (
                    <span className="flex items-center gap-1 text-emerald-300">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{currentPlace.name} • {currentPlace.city}, {currentPlace.country}</span>
                    </span>
                  )}
                  {currentEvent && (
                    <span className="flex items-center gap-1 text-orange-300">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{currentEvent.title}</span>
                    </span>
                  )}
                  {currentAlbum && (
                    <span className="flex items-center gap-1 text-indigo-300">
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>{currentAlbum.title}</span>
                    </span>
                  )}
                  {filters.mainSection === 'recently-edited' && (
                    <span className="flex items-center gap-1 text-cyan-300">
                      <History className="w-3.5 h-3.5" />
                      <span>Recently Edited Photos</span>
                    </span>
                  )}
                  {filters.mainSection === 'recently-imported' && (
                    <span className="flex items-center gap-1 text-indigo-300">
                      <DownloadCloud className="w-3.5 h-3.5" />
                      <span>Recently Imported Photos</span>
                    </span>
                  )}
                  {filters.mainSection === 'favorites' && (
                    <span className="flex items-center gap-1 text-pink-400">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      <span>5-Star & Favorited Photos</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Time of Day Filter */}
                <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, selectedTimeOfDay: 'all' }))}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      filters.selectedTimeOfDay === 'all'
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Times
                  </button>
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, selectedTimeOfDay: 'day' }))}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      filters.selectedTimeOfDay === 'day'
                        ? 'bg-slate-800 text-amber-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sun className="w-3 h-3" />
                    <span>Day</span>
                  </button>
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, selectedTimeOfDay: 'golden-hour' }))}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      filters.selectedTimeOfDay === 'golden-hour'
                        ? 'bg-slate-800 text-amber-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sunrise className="w-3 h-3" />
                    <span>Golden</span>
                  </button>
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, selectedTimeOfDay: 'night' }))}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      filters.selectedTimeOfDay === 'night'
                        ? 'bg-slate-800 text-cyan-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Moon className="w-3 h-3" />
                    <span>Night</span>
                  </button>
                </div>

                {/* Star Rating Filter */}
                <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Rating:</span>
                  {[0, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      onClick={() => setFilters((prev) => ({ ...prev, minRating: stars }))}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        filters.minRating === stars
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {stars === 0 ? 'All' : `${stars}★+`}
                    </button>
                  ))}
                </div>

                {/* Portrait Only Toggle */}
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, isPortraitOnly: !prev.isPortraitOnly }))}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    filters.isPortraitOnly
                      ? 'bg-purple-950/60 text-purple-300 border-purple-500/40 font-semibold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Portraits Only</span>
                </button>
              </div>

              {/* View Size & Sort Controls */}
              <div className="flex items-center gap-2">
                {/* Sort By Dropdown */}
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-2.5 py-1 rounded-lg outline-none cursor-pointer hover:border-slate-700 transition-colors"
                >
                  <option value="relevance">AI Relevance</option>
                  <option value="last-edited">Recently Edited</option>
                  <option value="recently-imported">Recently Imported</option>
                  <option value="rating-high">Star Rating (High → Low)</option>
                  <option value="aesthetic-score">Aesthetic Score (High → Low)</option>
                  <option value="date-newest">Date Taken (Newest)</option>
                  <option value="date-oldest">Date Taken (Oldest)</option>
                  <option value="name">Name (A → Z)</option>
                  <option value="size">File Size (Largest)</option>
                </select>

                {/* Grid Density Toggles */}
                <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setGridSize('compact')}
                    className={`p-1 rounded transition-colors ${
                      gridSize === 'compact' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Compact Grid"
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setGridSize('normal')}
                    className={`p-1 rounded transition-colors ${
                      gridSize === 'normal' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Normal Grid"
                  >
                    <Grid2X2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setGridSize('large')}
                    className={`p-1 rounded transition-colors ${
                      gridSize === 'large' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Large Visual Grid"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Batch Selection Action Bar */}
            {selectedPhotoIds.size > 0 && (
              <div className="px-6 py-2 bg-indigo-950/80 border-b border-indigo-500/30 flex items-center justify-between gap-3 text-xs shrink-0 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                    {selectedPhotoIds.size} Photo{selectedPhotoIds.size !== 1 ? 's' : ''} Selected
                  </span>
                  <button
                    onClick={selectAll}
                    className="text-xs text-indigo-300 hover:text-white underline font-medium"
                  >
                    {selectedPhotoIds.size === searchResults.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBatchAutoTag()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Auto-Tag Selected ({selectedPhotoIds.size})</span>
                  </button>

                  {onOpenInBatchStudio && (
                    <button
                      onClick={() => {
                        const selected = photos.filter((p) => selectedPhotoIds.has(p.id));
                        onOpenInBatchStudio(selected);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-colors"
                    >
                      <Layers className="w-3 h-3 text-indigo-400" />
                      <span>Open in Batch Studio</span>
                    </button>
                  )}

                  <button
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/30 transition-colors"
                    title="Delete Selected Photos"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Photo Grid Viewport */}
            <div className="flex-1 overflow-y-auto p-6">
              {searchResults.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mb-4 border border-slate-800 text-slate-500">
                    <Search className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-200 mb-1">No Photos Found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-4">
                    No images match this view or query. Try searching for:
                    <br />
                    <strong className="text-indigo-300">"Photos of me at the beach"</strong>,{' '}
                    <strong className="text-indigo-300">"Find photos with cars"</strong>, or{' '}
                    <strong className="text-indigo-300">"Find my best portraits"</strong>.
                  </p>
                  <button
                    onClick={() => setFilters({
                      mainSection: 'all',
                      searchQuery: '',
                      selectedAlbumId: null,
                      selectedPersonId: null,
                      selectedPlaceId: null,
                      selectedEventId: null,
                      selectedCategory: null,
                      selectedTimeOfDay: 'all',
                      minRating: 0,
                      isPortraitOnly: false,
                      isFavoriteOnly: false,
                      selectedTags: [],
                      sortBy: 'relevance',
                    })}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md transition-all"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div
                  className={`grid gap-4 ${
                    gridSize === 'compact'
                      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                      : gridSize === 'normal'
                      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                  }`}
                >
                  {searchResults.map((photo) => {
                    const isSelected = selectedPhotoIds.has(photo.id);
                    const isCurrent = selectedPhoto?.id === photo.id;
                    const ai = photo.aiAnalysis;

                    return (
                      <div
                        key={photo.id}
                        onClick={(e) => handlePhotoClick(photo, e)}
                        className={`group relative rounded-xl overflow-hidden bg-slate-900 border transition-all cursor-pointer flex flex-col ${
                          isCurrent
                            ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-lg shadow-indigo-500/20'
                            : isSelected
                            ? 'ring-2 ring-purple-500 border-purple-500'
                            : 'border-slate-800/80 hover:border-slate-700 hover:shadow-md'
                        }`}
                      >
                        {/* Image Thumbnail Container */}
                        <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                          <img
                            src={photo.thumbnailUrl || photo.originalUrl}
                            alt={photo.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />

                          {/* Top Overlay Badges */}
                          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                            {/* Selection Checkbox */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePhotoSelection(photo.id);
                              }}
                              className={`p-1 rounded-md pointer-events-auto transition-colors ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-black/50 hover:bg-black/80 text-white/80 opacity-0 group-hover:opacity-100'
                              }`}
                            >
                              {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                            </button>

                            <div className="flex items-center gap-1">
                              {/* Time of Day Badge */}
                              {ai?.timeOfDay && (
                                <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-slate-200 border border-white/10 flex items-center gap-1">
                                  {ai.timeOfDay === 'night' && <Moon className="w-2.5 h-2.5 text-cyan-400" />}
                                  {ai.timeOfDay === 'golden-hour' && <Sunrise className="w-2.5 h-2.5 text-amber-400" />}
                                  {ai.timeOfDay === 'sunset' && <Sunset className="w-2.5 h-2.5 text-orange-400" />}
                                  {ai.timeOfDay === 'day' && <Sun className="w-2.5 h-2.5 text-yellow-400" />}
                                  <span className="capitalize">{ai.timeOfDay}</span>
                                </span>
                              )}

                              {/* Favorite Button */}
                              <button
                                onClick={(e) => toggleFavorite(photo.id, e)}
                                className={`p-1 rounded-md pointer-events-auto transition-colors ${
                                  photo.isFavorite
                                    ? 'bg-pink-600 text-white shadow-sm'
                                    : 'bg-black/50 hover:bg-black/80 text-white/80 opacity-0 group-hover:opacity-100'
                                }`}
                                title={photo.isFavorite ? 'Favorited' : 'Add to Favorites'}
                              >
                                <Heart className="w-3.5 h-3.5 fill-current" />
                              </button>
                            </div>
                          </div>

                          {/* Hover Bottom Action: Open in Studio */}
                          <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPhotoInEditor(photo);
                              }}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Open in Studio Editor</span>
                            </button>
                          </div>
                        </div>

                        {/* Card Info Details */}
                        <div className="p-3 flex flex-col gap-1.5 flex-1 justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <h4 className="text-xs font-bold text-slate-200 truncate" title={photo.title}>
                                {photo.title}
                              </h4>
                              {/* Star Rating Widget */}
                              <div className="flex items-center gap-0.5 shrink-0">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <button
                                    key={s}
                                    onClick={(e) => handleSetRating(photo.id, s, e)}
                                    className="p-0.5 text-slate-600 hover:text-amber-400 transition-colors"
                                  >
                                    <Star
                                      className={`w-2.5 h-2.5 ${
                                        s <= (photo.rating || 0)
                                          ? 'text-amber-400 fill-amber-400'
                                          : 'text-slate-600'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Location & Event Mini Label */}
                            {(photo.placeName || photo.eventName) && (
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 truncate mb-1">
                                {photo.placeName && (
                                  <span className="flex items-center gap-0.5 truncate text-emerald-400/80">
                                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                                    <span className="truncate">{photo.placeName}</span>
                                  </span>
                                )}
                              </div>
                            )}

                            {/* AI Scene Summary */}
                            {ai?.sceneDescription && (
                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                {ai.sceneDescription}
                              </p>
                            )}
                          </div>

                          {/* Tag Pills */}
                          <div className="flex items-center gap-1 flex-wrap pt-1">
                            {ai?.tags?.slice(0, 3).map((tag, tIdx) => (
                              <button
                                key={tIdx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFilters((prev) => ({ ...prev, searchQuery: tag }));
                                }}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 hover:bg-indigo-950/80 text-slate-300 hover:text-indigo-300 border border-slate-700/80 transition-colors"
                              >
                                #{tag}
                              </button>
                            ))}
                            {(ai?.tags?.length || 0) > 3 && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                +{(ai?.tags?.length || 0) - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* RIGHT INSPECTOR: AI VISION DETAILS, PEOPLE, PLACES, EVENTS & EXIF */}
        {selectedPhoto && filters.mainSection !== 'duplicates' && (
          <aside className="w-80 bg-slate-900/90 border-l border-slate-800/80 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4 flex flex-col gap-4">
              {/* Header & Close */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
                    Photo Inspector
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Photo Preview Thumbnail */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-[4/3] border border-slate-800 shadow-md">
                <img
                  src={selectedPhoto.originalUrl}
                  alt={selectedPhoto.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleOpenPhotoInEditor(selectedPhoto)}
                  className="absolute bottom-2 right-2 px-3 py-1 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-semibold shadow-md backdrop-blur-sm transition-all"
                >
                  Open in Editor
                </button>
              </div>

              {/* Title & Star Rating */}
              <div className="flex flex-col gap-1.5">
                <h4 className="font-bold text-sm text-white truncate" title={selectedPhoto.title}>
                  {selectedPhoto.title}
                </h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSetRating(selectedPhoto.id, s)}
                        className="p-0.5 text-slate-600 hover:text-amber-400 transition-colors"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            s <= (selectedPhoto.rating || 0)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-300 ml-1">
                      {selectedPhoto.rating ? `${selectedPhoto.rating}.0` : 'Unrated'}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleFavorite(selectedPhoto.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      selectedPhoto.isFavorite
                        ? 'bg-pink-950/60 text-pink-300 border-pink-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    <span>{selectedPhoto.isFavorite ? 'Favorited' : 'Favorite'}</span>
                  </button>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleOpenPhotoInEditor(selectedPhoto)}
                  className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Open in Studio Editor</span>
                </button>

                <button
                  onClick={() => setSocialExportPhoto(selectedPhoto)}
                  className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-pink-600/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Optimize for Social (IG, TikTok, YT)</span>
                </button>
              </div>

              {/* People Tagged in Photo */}
              {selectedPhoto.peopleIds && selectedPhoto.peopleIds.length > 0 && (
                <div className="bg-slate-950/80 rounded-xl p-3 border border-purple-500/20 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span>People in this Photo</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedPhoto.peopleIds.map((pId) => {
                      const person = people.find((p) => p.id === pId);
                      if (!person) return null;
                      return (
                        <div
                          key={pId}
                          onClick={() => setFilters((prev) => ({ ...prev, mainSection: 'people', selectedPersonId: pId }))}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 hover:border-purple-400 cursor-pointer transition-colors"
                        >
                          <img
                            src={person.avatarUrl}
                            alt={person.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="text-xs font-semibold text-purple-200">{person.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Place & Event Info */}
              {(selectedPhoto.placeName || selectedPhoto.eventName) && (
                <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex flex-col gap-2 text-xs">
                  {selectedPhoto.placeName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>Place:</span>
                      </span>
                      <span className="font-semibold text-emerald-300 truncate max-w-[140px]">
                        {selectedPhoto.placeName}
                      </span>
                    </div>
                  )}

                  {selectedPhoto.eventName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-orange-400" />
                        <span>Event:</span>
                      </span>
                      <span className="font-semibold text-orange-300 truncate max-w-[140px]">
                        {selectedPhoto.eventName}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* AI Auto-Tagging Details */}
              <div className="bg-slate-950/80 rounded-xl p-3.5 border border-indigo-500/20 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-indigo-300">Gemini Vision Analysis</span>
                  </div>
                  <button
                    onClick={() => handleSinglePhotoAutoTag(selectedPhoto)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-200 font-semibold underline"
                  >
                    Re-Analyze
                  </button>
                </div>

                {/* Scene Description */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    AI Scene Description
                  </label>
                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    {selectedPhoto.aiAnalysis?.sceneDescription || 'No description generated yet.'}
                  </p>
                </div>

                {/* Aesthetic & Portrait Score Meters */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                      <span>Aesthetic Score</span>
                      <span className="text-indigo-300">{selectedPhoto.aiAnalysis?.aestheticScore || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all"
                        style={{ width: `${selectedPhoto.aiAnalysis?.aestheticScore || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                      <span>Portrait Quality</span>
                      <span className="text-purple-300">{selectedPhoto.aiAnalysis?.portraitQualityScore || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all"
                        style={{ width: `${selectedPhoto.aiAnalysis?.portraitQualityScore || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Detected Objects */}
                {selectedPhoto.aiAnalysis?.detectedObjects && selectedPhoto.aiAnalysis.detectedObjects.length > 0 && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Detected Objects
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedPhoto.aiAnalysis.detectedObjects.map((obj, oIdx) => (
                        <span
                          key={oIdx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-950 text-indigo-300 border border-indigo-500/30 flex items-center gap-1"
                        >
                          <span>{obj.label}</span>
                          <span className="text-[9px] opacity-75 font-bold">{Math.round(obj.confidence * 100)}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dominant Color Palette */}
                {selectedPhoto.aiAnalysis?.dominantColors && selectedPhoto.aiAnalysis.dominantColors.length > 0 && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Extracted Color Palette
                    </label>
                    <div className="flex items-center gap-2">
                      {selectedPhoto.aiAnalysis.dominantColors.map((color, cIdx) => (
                        <div
                          key={cIdx}
                          className="w-7 h-7 rounded-lg shadow-sm border border-white/20 transition-transform hover:scale-110 cursor-pointer"
                          style={{ backgroundColor: color }}
                          title={`Color: ${color}`}
                          onClick={() => {
                            navigator.clipboard.writeText(color);
                            showToast('info', 'Hex Copied', color);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Tags Cloud */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    AI Tags ({selectedPhoto.aiAnalysis?.tags?.length || 0})
                  </label>
                  <div className="flex items-center gap-1 flex-wrap">
                    {selectedPhoto.aiAnalysis?.tags?.map((tag, tIdx) => (
                      <button
                        key={tIdx}
                        onClick={() => setFilters((prev) => ({ ...prev, searchQuery: tag }))}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-900 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                        title={`Filter photos tagged #${tag}`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* EXIF Camera & File Details */}
              <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 flex flex-col gap-2">
                <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Camera & Sensor Metadata</span>
                </h5>

                <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                  <span className="text-slate-400">Dimensions:</span>
                  <span className="text-slate-200 font-mono font-medium">{selectedPhoto.width} × {selectedPhoto.height} px</span>

                  <span className="text-slate-400">Format / Size:</span>
                  <span className="text-slate-200 font-mono font-medium uppercase">
                    {selectedPhoto.format} ({(selectedPhoto.fileSize / 1000000).toFixed(1)} MB)
                  </span>

                  {selectedPhoto.exifMetadata?.cameraMake && (
                    <>
                      <span className="text-slate-400">Camera:</span>
                      <span className="text-slate-200 truncate">{selectedPhoto.exifMetadata.cameraMake} {selectedPhoto.exifMetadata.cameraModel}</span>
                    </>
                  )}

                  {selectedPhoto.exifMetadata?.lens && (
                    <>
                      <span className="text-slate-400">Lens:</span>
                      <span className="text-slate-200 truncate">{selectedPhoto.exifMetadata.lens}</span>
                    </>
                  )}

                  {selectedPhoto.exifMetadata?.aperture && (
                    <>
                      <span className="text-slate-400">Exposure:</span>
                      <span className="text-slate-200 font-mono">
                        {selectedPhoto.exifMetadata.aperture} • {selectedPhoto.exifMetadata.shutterSpeed} • ISO {selectedPhoto.exifMetadata.iso}
                      </span>
                    </>
                  )}

                  {selectedPhoto.exifMetadata?.colorSpace && (
                    <>
                      <span className="text-slate-400">Color Space:</span>
                      <span className="text-slate-200 truncate">{selectedPhoto.exifMetadata.colorSpace}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* CREATE NEW CUSTOM ALBUM MODAL */}
      {isNewAlbumModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-400" />
                <span>Create New Custom Album</span>
              </h3>
              <button
                onClick={() => setIsNewAlbumModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={newAlbumTitle}
              onChange={(e) => setNewAlbumTitle(e.target.value)}
              placeholder="e.g. Portfolio 2026, Client Shoot, Summer Trip"
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsNewAlbumModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAlbum}
                disabled={!newAlbumTitle.trim()}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md disabled:opacity-50"
              >
                Create Album
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMART ALBUM BUILDER MODAL */}
      <SmartAlbumModal
        isOpen={isSmartAlbumModalOpen}
        onClose={() => setIsSmartAlbumModalOpen(false)}
        onCreateSmartAlbum={handleCreateSmartAlbum}
      />

      {/* SOCIAL MEDIA OPTIMIZER & MULTI-FORMAT EXPORT MODAL */}
      <SocialMediaExportModal
        isOpen={Boolean(socialExportPhoto)}
        onClose={() => setSocialExportPhoto(null)}
        photo={socialExportPhoto}
        showToast={showToast}
      />
    </div>
  );
};
