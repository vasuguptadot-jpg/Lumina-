import React, { useState } from 'react';
import { PlaceLocation, PhotoItem } from '../../types/library';
import { MapPin, Plus, Compass, Search, Globe, X } from 'lucide-react';

interface PlacesViewProps {
  places: PlaceLocation[];
  photos: PhotoItem[];
  onSelectPlace: (placeId: string) => void;
  onUpdatePlaces: (places: PlaceLocation[]) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const PlacesView: React.FC<PlacesViewProps> = ({
  places,
  photos,
  onSelectPlace,
  onUpdatePlaces,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newLat, setNewLat] = useState('37.7749');
  const [newLng, setNewLng] = useState('-122.4194');

  const filteredPlaces = places.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPlace = () => {
    if (!newName.trim() || !newCity.trim() || !newCountry.trim()) return;

    const newPlace: PlaceLocation = {
      id: `place_${Date.now()}`,
      name: newName.trim(),
      city: newCity.trim(),
      country: newCountry.trim(),
      latitude: parseFloat(newLat) || 0,
      longitude: parseFloat(newLng) || 0,
      photoIds: [],
      photoCount: 0,
      coverPhotoUrl: photos[0]?.originalUrl,
    };

    const updated = [...places, newPlace];
    onUpdatePlaces(updated);
    setIsAddModalOpen(false);
    setNewName('');
    setNewCity('');
    setNewCountry('');
    showToast('success', 'Place Created', `Added location "${newPlace.name}"`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <MapPin className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Places & Geolocation</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                {places.length} Locations
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Explore your photo collection mapped across cities, regions, and international landmarks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search places & cities..."
                className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 w-52"
              />
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Place</span>
            </button>
          </div>
        </div>

        {/* Places Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPlaces.map((place) => {
            const count = photos.filter((p) => p.placeId === place.id).length || place.photoCount;
            const cover = place.coverPhotoUrl || photos.find((p) => p.placeId === place.id)?.originalUrl || photos[0]?.originalUrl;

            return (
              <div
                key={place.id}
                onClick={() => onSelectPlace(place.id)}
                className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 hover:border-emerald-500/50 cursor-pointer transition-all hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-0.5 flex flex-col"
              >
                {/* Location Cover Image */}
                <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                  <img
                    src={cover}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Photo Count Badge */}
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white border border-white/10">
                    {count} photo{count !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Place Details */}
                <div className="p-3.5 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 truncate">
                      {place.name}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 truncate">
                    {place.city}, {place.country} {place.region ? `• ${place.region}` : ''}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5 text-slate-400" />
                      {place.latitude.toFixed(2)}°, {place.longitude.toFixed(2)}°
                    </span>
                    <span className="text-emerald-400 font-semibold group-hover:underline">
                      View Photos &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Place Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Add New Place</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300">Place / Landmark Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Venice Canals, Mount Fuji, Big Sur"
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">City</label>
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="e.g. Venice"
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Country</label>
                <input
                  type="text"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  placeholder="e.g. Italy"
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPlace}
                disabled={!newName.trim() || !newCity.trim() || !newCountry.trim()}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-md disabled:opacity-50"
              >
                Save Place
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
