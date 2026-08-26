import React, { useState, useMemo, useRef } from 'react';
import {
  Image as ImageIcon,
  Camera,
  FolderOpen,
  Type,
  Palette,
  LayoutTemplate,
  Search,
  Grid,
  List,
  Upload,
  Trash2,
  Download,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Plus,
  ArrowUpDown,
  Filter,
  Eye,
  FileCheck,
  Star,
  Check,
} from 'lucide-react';
import { Project } from '../../types/editor';
import { SAMPLE_IMAGES } from '../../engine/sampleImages';
import { FILTER_PRESETS } from '../../engine/presets';

interface AssetsLibraryViewProps {
  currentProject: Project;
  onOpenProjectWithImage: (imageUrl: string, name: string, isRaw?: boolean) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

type AssetCategory = 'photos' | 'raw' | 'projects' | 'fonts' | 'luts' | 'templates';

interface AssetItem {
  id: string;
  name: string;
  category: AssetCategory;
  url?: string;
  format: string;
  dimensions?: string;
  size: string;
  date: string;
  isFavorite?: boolean;
}

export const AssetsLibraryView: React.FC<AssetsLibraryViewProps> = ({
  currentProject,
  onOpenProjectWithImage,
  showToast,
}) => {
  const [activeCategory, setActiveCategory] = useState<AssetCategory>('photos');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date_desc' | 'name_asc' | 'size_desc'>('date_desc');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synthesize rich asset library list from samples, presets, fonts, templates
  const [assets, setAssets] = useState<AssetItem[]>([
    ...SAMPLE_IMAGES.map((s, idx) => ({
      id: `asset_photo_${s.id}`,
      name: s.name,
      category: (idx % 2 === 0 ? 'photos' : 'raw') as AssetCategory,
      url: s.url,
      format: idx % 2 === 0 ? 'JPEG' : 'DNG (RAW)',
      dimensions: '6000 × 4000',
      size: idx % 2 === 0 ? '14.2 MB' : '48.6 MB',
      date: '2026-03-24',
      isFavorite: idx === 0,
    })),
    ...FILTER_PRESETS.slice(0, 8).map((p) => ({
      id: `asset_lut_${p.id}`,
      name: `${p.name} 3D LUT`,
      category: 'luts' as AssetCategory,
      format: '.CUBE (33×33×33)',
      size: '2.4 MB',
      date: '2026-03-20',
      isFavorite: true,
    })),
    {
      id: 'asset_font_1',
      name: 'Inter Pro Sans Display',
      category: 'fonts',
      format: 'OpenType (.OTF)',
      size: '1.8 MB',
      date: '2026-03-15',
    },
    {
      id: 'asset_font_2',
      name: 'Playfair Display Serif Bold',
      category: 'fonts',
      format: 'TrueType (.TTF)',
      size: '1.2 MB',
      date: '2026-03-12',
    },
    {
      id: 'asset_font_3',
      name: 'JetBrains Mono Technical',
      category: 'fonts',
      format: 'OpenType (.OTF)',
      size: '2.1 MB',
      date: '2026-03-10',
    },
    {
      id: 'asset_tpl_1',
      name: 'High-Impact YouTube Thumbnail (16:9)',
      category: 'templates',
      format: 'Lumina Template',
      dimensions: '1920 × 1080',
      size: '4.8 MB',
      date: '2026-03-22',
    },
    {
      id: 'asset_tpl_2',
      name: 'Instagram Story Magazine Layout (9:16)',
      category: 'templates',
      format: 'Lumina Template',
      dimensions: '1080 × 1920',
      size: '5.2 MB',
      date: '2026-03-21',
    },
    {
      id: 'asset_proj_active',
      name: currentProject.name,
      category: 'projects',
      url: currentProject.image?.originalUrl,
      format: '.LUMINA Package',
      dimensions: currentProject.image?.width ? `${currentProject.image.width} × ${currentProject.image.height}` : '3840 × 2160',
      size: '18.4 MB',
      date: 'Today',
      isFavorite: true,
    },
  ]);

  const CATEGORIES: { id: AssetCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'raw', label: 'RAW Files', icon: Camera },
    { id: 'projects', label: 'Projects', icon: FolderOpen },
    { id: 'fonts', label: 'Fonts', icon: Type },
    { id: 'luts', label: 'LUTs & Profiles', icon: Palette },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  ];

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    let list = assets.filter((a) => a.category === activeCategory);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q) || a.format.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return b.date.localeCompare(a.date);
    });

    return list;
  }, [assets, activeCategory, searchQuery, sortBy]);

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItemIds.length === filteredAssets.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredAssets.map((a) => a.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedItemIds.length === 0) return;
    setAssets((prev) => prev.filter((a) => !selectedItemIds.includes(a.id)));
    setSelectedItemIds([]);
    showToast?.('info', 'Assets Removed', 'Selected assets removed from library.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isRaw = file.name.match(/\.(dng|cr2|cr3|nef|arw|orf|rw2)$/i) !== null;
    const url = URL.createObjectURL(file);
    const newAsset: AssetItem = {
      id: `asset_${Date.now()}`,
      name: file.name,
      category: isRaw ? 'raw' : 'photos',
      url: url,
      format: isRaw ? 'RAW (.DNG)' : file.type || 'JPEG',
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      date: 'Just now',
    };

    setAssets((prev) => [newAsset, ...prev]);
    showToast?.('success', 'Asset Imported', `Added ${file.name} to library.`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenAsset = (item: AssetItem) => {
    if (item.url) {
      onOpenProjectWithImage(item.url, item.name, item.category === 'raw');
      showToast?.('success', 'Asset Loaded', `Opened ${item.name} in editor.`);
    } else {
      showToast?.('info', item.name, `Format: ${item.format}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#000000] p-4 sm:p-8 space-y-6 select-none text-white font-sans">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Banner Header */}
      <div className="p-6 rounded-2xl bg-[#080808] border border-[#222222] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141414] text-[#CCCCCC] border border-[#2C2C2C] uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3 h-3 text-[#CCCCCC]" />
              <span>MEDIA ASSET VAULT</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#141414] text-[#999999] border border-[#222222]">
              {assets.length} Total Items
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Asset Library
          </h1>
          <p className="text-xs text-[#999999]">
            Local media catalog, high-resolution RAW files, typography assets, 3D LUT profiles, and master templates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedItemIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="px-3 py-2 rounded-lg bg-[#181818] hover:bg-[#222222] border border-[#2C2C2C] text-[#CCCCCC] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedItemIds.length})</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-lg bg-white hover:bg-[#CCCCCC] text-black text-xs font-semibold flex items-center gap-2 transition-colors active:scale-98 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>+ Import Files</span>
          </button>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#181818]">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const count = assets.filter((a) => a.category === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedItemIds([]);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors shrink-0 ${
                isActive
                  ? 'bg-[#181818] text-white border border-[#2C2C2C]'
                  : 'text-[#999999] hover:text-white hover:bg-[#0D0D0D]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#101010] text-[#666666]">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & View Controls */}
      <div className="p-3 rounded-xl bg-[#080808] border border-[#222222] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
            <input
              type="text"
              placeholder={`Search ${activeCategory}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#101010] border border-[#222222] text-xs text-white placeholder-[#666666] focus:border-[#444444] focus:outline-none"
            />
          </div>

          <button
            onClick={handleSelectAll}
            className="px-2.5 py-1.5 rounded bg-[#101010] hover:bg-[#181818] border border-[#222222] text-xs text-[#999999] hover:text-white flex items-center gap-1.5 transition-colors"
          >
            {selectedItemIds.length === filteredAssets.length && filteredAssets.length > 0 ? (
              <CheckSquare className="w-3.5 h-3.5 text-white" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Select All</span>
          </button>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="flex items-center gap-1 text-xs text-[#999999]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#666666]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#101010] border border-[#222222] rounded px-2 py-1 text-xs text-white focus:outline-none"
            >
              <option value="date_desc">Latest First</option>
              <option value="name_asc">Name (A-Z)</option>
            </select>
          </div>

          <div className="flex items-center border border-[#222222] rounded-lg bg-[#101010] p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${
                viewMode === 'grid' ? 'bg-[#181818] text-white' : 'text-[#666666] hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${
                viewMode === 'list' ? 'bg-[#181818] text-white' : 'text-[#666666] hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Assets Grid or List */}
      {filteredAssets.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#080808] border border-[#222222] text-center space-y-3">
          <ImageIcon className="w-8 h-8 text-[#444444] mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">No items found in {activeCategory}</h3>
            <p className="text-xs text-[#666666]">
              Import local files or switch categories.
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold inline-flex items-center gap-2"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Asset</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
          {filteredAssets.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={() => handleOpenAsset(item)}
                className={`group p-3 rounded-xl bg-[#080808] border transition-colors cursor-pointer flex flex-col justify-between space-y-2.5 ${
                  isSelected
                    ? 'border-white ring-1 ring-white/30'
                    : 'border-[#222222] hover:border-[#444444]'
                }`}
              >
                {/* Thumbnail Container */}
                <div className="w-full aspect-square rounded-lg bg-[#141414] border border-[#181818] overflow-hidden relative flex items-center justify-center">
                  {item.url ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover grayscale contrast-105 group-hover:scale-102 transition-transform duration-200"
                    />
                  ) : item.category === 'fonts' ? (
                    <span className="text-2xl font-serif text-[#999999] group-hover:text-white">
                      Aa
                    </span>
                  ) : item.category === 'luts' ? (
                    <Palette className="w-8 h-8 text-[#666666] group-hover:text-white" />
                  ) : (
                    <LayoutTemplate className="w-8 h-8 text-[#666666] group-hover:text-white" />
                  )}

                  {/* Checkbox trigger */}
                  <button
                    onClick={(e) => handleToggleSelect(item.id, e)}
                    className="absolute top-1.5 left-1.5 p-1 rounded bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-[#999999]" />
                    )}
                  </button>

                  <span className="absolute bottom-1.5 right-1.5 px-1 py-0.5 rounded text-[8px] font-mono bg-black/80 text-[#CCCCCC] border border-[#333333]">
                    {item.format.split(' ')[0]}
                  </span>
                </div>

                {/* Metadata */}
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-[#CCCCCC]">
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-[#666666] font-mono">
                    <span>{item.size}</span>
                    <span>{item.date}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl bg-[#080808] border border-[#222222] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#222222] text-[#666666] font-mono text-[10px] uppercase bg-[#101010]">
                <th className="py-2.5 px-4 w-8"></th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Format</th>
                <th className="py-2.5 px-4">Dimensions</th>
                <th className="py-2.5 px-4">Size</th>
                <th className="py-2.5 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181818]">
              {filteredAssets.map((item) => {
                const isSelected = selectedItemIds.includes(item.id);
                return (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenAsset(item)}
                    className="hover:bg-[#101010] cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-4" onClick={(e) => handleToggleSelect(item.id, e)}>
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-[#666666]" />
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-white flex items-center gap-2">
                      <span>{item.name}</span>
                    </td>
                    <td className="py-2.5 px-4 text-[#CCCCCC] font-mono text-[11px]">
                      {item.format}
                    </td>
                    <td className="py-2.5 px-4 text-[#999999] font-mono text-[11px]">
                      {item.dimensions || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-[#999999] font-mono text-[11px]">
                      {item.size}
                    </td>
                    <td className="py-2.5 px-4 text-[#666666] font-mono text-[11px]">
                      {item.date}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
