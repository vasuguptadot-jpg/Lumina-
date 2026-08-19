import React, { useState } from 'react';
import { PhotoEvent, PhotoItem } from '../../types/library';
import { Calendar, Plus, MapPin, Tag, Search, Sparkles, X, Clock } from 'lucide-react';

interface EventsViewProps {
  events: PhotoEvent[];
  photos: PhotoItem[];
  onSelectEvent: (eventId: string) => void;
  onUpdateEvents: (events: PhotoEvent[]) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  photos,
  onSelectEvent,
  onUpdateEvents,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
  const [newTags, setNewTags] = useState('Client, Commercial, Studio');

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.locationName && e.locationName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateCustomEvent = () => {
    if (!newTitle.trim()) return;

    const tags = newTags.split(',').map((t) => t.trim()).filter(Boolean);
    const cover = photos[0]?.originalUrl;

    const newEvent: PhotoEvent = {
      id: `event_custom_${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Custom Photography Event',
      startDate,
      endDate,
      locationName: newLocation.trim() || undefined,
      isCustom: true,
      coverPhotoUrl: cover,
      photoIds: [],
      photoCount: 0,
      tags,
      createdAt: Date.now(),
    };

    const updated = [newEvent, ...events];
    onUpdateEvents(updated);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    setNewLocation('');
    showToast('success', 'Custom Event Created', `Created event "${newEvent.title}"`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-orange-950 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Events & Shoot Timeline</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-950 text-orange-300 border border-orange-500/30">
                {events.length} Events
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Auto-detected shoot events, client campaigns, travel expeditions, and custom event collections.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter events..."
                className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-orange-500 w-52"
              />
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white shadow-md shadow-orange-600/30 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Custom Event</span>
            </button>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredEvents.map((event) => {
            const count = photos.filter((p) => p.eventId === event.id).length || event.photoCount;
            const cover = event.coverPhotoUrl || photos.find((p) => p.eventId === event.id)?.originalUrl || photos[0]?.originalUrl;

            return (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event.id)}
                className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 hover:border-orange-500/50 cursor-pointer transition-all hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-0.5 flex flex-col"
              >
                {/* Event Hero Cover */}
                <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden">
                  <img
                    src={cover}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm ${
                        event.isCustom
                          ? 'bg-purple-900/80 text-purple-200 border border-purple-500/40'
                          : 'bg-indigo-900/80 text-indigo-200 border border-indigo-500/40 flex items-center gap-1'
                      }`}
                    >
                      {!event.isCustom && <Sparkles className="w-2.5 h-2.5 text-amber-400" />}
                      {event.isCustom ? 'Custom Event' : 'AI Clustered'}
                    </span>

                    <div className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white border border-white/10">
                      {count} photo{count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Event Body Content */}
                <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-bold text-sm text-white group-hover:text-orange-300 transition-colors">
                      {event.title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-orange-400 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{event.startDate === event.endDate ? event.startDate : `${event.startDate} — ${event.endDate}`}</span>
                    </div>

                    {event.locationName && (
                      <div className="flex items-center gap-1 text-xs text-slate-400 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{event.locationName}</span>
                      </div>
                    )}

                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  {/* Tags & Action Link */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      {event.tags?.slice(0, 2).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    <span className="text-xs text-orange-400 font-semibold group-hover:underline">
                      Explore Photos &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Custom Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-400" />
                <span>Create Custom Event</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Event Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Summer Beach Wedding 2026, Paris Fashion Week"
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Location Name</label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="e.g. Malibu Coast, California or Grand Hotel"
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Description</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Brief summary or notes about the shoot event..."
                rows={2}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Tags (comma-separated)</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Wedding, Client, Outdoor"
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomEvent}
                disabled={!newTitle.trim()}
                className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white shadow-md disabled:opacity-50"
              >
                Create Custom Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
