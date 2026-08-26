import React, { useState } from 'react';
import {
  Search,
  X,
  Compass,
  Download,
  ExternalLink,
  Sparkles,
  Camera,
  Heart,
  Tag,
} from 'lucide-react';

interface UnsplashPhoto {
  id: string;
  url: string;
  thumb: string;
  title: string;
  author: string;
  authorUsername: string;
  category: string;
  likes: number;
  width: number;
  height: number;
}

// Curated high-res sample collection for fast zero-latency browsing
const CURATED_UNSPLASH_COLLECTION: UnsplashPhoto[] = [
  {
    id: 'photo-1',
    title: 'Neon Tokyo Street Rain Reflection',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=2000&q=85',
    thumb: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=500&q=75',
    author: 'Aleksandar Pasaric',
    authorUsername: 'aleksandar',
    category: 'street',
    likes: 3420,
    width: 2000,
    height: 1333,
  },
  {
    id: 'photo-2',
    title: 'High-Fashion Studio Editorial Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=2000&q=85',
    thumb: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=75',
    author: 'Aiony Haust',
    authorUsername: 'aiony',
    category: 'editorial',
    likes: 4890,
    width: 2000,
    height: 2500,
  },
  {
    id: 'photo-3',
    title: 'Misty Alpine Mountain Ridge & Sunrise',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=85',
    thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=500&q=75',
    author: 'Kaley Dykstra',
    authorUsername: 'kaley',
    category: 'nature',
    likes: 6100,
    width: 2000,
    height: 1333,
  },
  {
    id: 'photo-4',
    title: 'Vintage Red Sportscar 35mm Analog Film',
    url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=2000&q=85',
    thumb: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=500&q=75',
    author: 'Stefan Rodriguez',
    authorUsername: 'stefan',
    category: 'film',
    likes: 2780,
    width: 2000,
    height: 1333,
  },
  {
    id: 'photo-5',
    title: 'Architectural Minimal Concrete Angles',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=2000&q=85',
    thumb: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=500&q=75',
    author: 'Scott Webb',
    authorUsername: 'scottwebb',
    category: 'architecture',
    likes: 1950,
    width: 2000,
    height: 1500,
  },
  {
    id: 'photo-6',
    title: 'Nordic Forest Fog & Pine Trees',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2000&q=85',
    thumb: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=500&q=75',
    author: 'Sebastian Unrau',
    authorUsername: 'sebastian',
    category: 'nature',
    likes: 5200,
    width: 2000,
    height: 1333,
  },
];

interface UnsplashBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (imageUrl: string, title: string) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const UnsplashBrowserModal: React.FC<UnsplashBrowserModalProps> = ({
  isOpen,
  onClose,
  onSelectPhoto,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isImporting, setIsImporting] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Curated' },
    { id: 'editorial', label: 'Editorial' },
    { id: 'street', label: 'Cyber & Street' },
    { id: 'nature', label: 'Landscape' },
    { id: 'film', label: '35mm Film' },
    { id: 'architecture', label: 'Architecture' },
  ];

  const filteredPhotos = CURATED_UNSPLASH_COLLECTION.filter((p) => {
    const matchCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch =
      !searchTerm.trim() ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleImport = async (photo: UnsplashPhoto) => {
    setIsImporting(photo.id);
    try {
      // Create Image from URL to load into canvas
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = photo.url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Convert to dataUrl to prevent CORS tainting in subsequent canvas operations
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 2000;
      canvas.height = img.naturalHeight || 1333;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        onSelectPhoto(dataUrl, photo.title);
        showToast('success', 'Imported from Unsplash', `Loaded "${photo.title}" by ${photo.author}`);
        onClose();
      }
    } catch (err: any) {
      showToast('error', 'Import Failed', 'Could not load photo from Unsplash.');
    } finally {
      setIsImporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Unsplash Stock Library Integration</h2>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-mono text-[10px] uppercase font-bold border border-sky-500/30">
                  OFFICIAL PLUGIN
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Explore royalty-free high-resolution photography ready to edit on your canvas.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories Filter Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/30 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search landscape, portrait, editorial, cyberpunk, film..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-sky-500/50 transition-all flex flex-col"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-900 relative">
                  <img
                    src={photo.thumb}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <button
                      onClick={() => handleImport(photo)}
                      disabled={isImporting === photo.id}
                      className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isImporting === photo.id ? 'Loading RAW...' : 'Open in Canvas'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 flex items-center justify-between">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{photo.title}</h4>
                    <p className="text-[11px] text-slate-400 truncate">by {photo.author}</p>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-rose-400 font-mono">
                    <Heart className="w-3 h-3 fill-rose-500/20" />
                    <span>{photo.likes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Powered by Unsplash API Integration Extension</span>
          <span className="font-mono text-[11px] text-slate-500">
            {filteredPhotos.length} high-res assets available
          </span>
        </div>
      </div>
    </div>
  );
};
