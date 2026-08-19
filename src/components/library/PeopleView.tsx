import React, { useState } from 'react';
import { PersonProfile, PhotoItem } from '../../types/library';
import { User, Plus, Users, Search, Edit2, Check, X, Sparkles } from 'lucide-react';

interface PeopleViewProps {
  people: PersonProfile[];
  photos: PhotoItem[];
  onSelectPerson: (personId: string) => void;
  onUpdatePeople: (people: PersonProfile[]) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const PeopleView: React.FC<PeopleViewProps> = ({
  people,
  photos,
  onSelectPerson,
  onUpdatePeople,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelationship, setNewRelationship] = useState<PersonProfile['relationship']>('Friend');
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  const filteredPeople = people.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.relationship && p.relationship.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddPerson = () => {
    if (!newName.trim()) return;

    // Pick avatar from first portrait photo if available
    const portraitPhoto = photos.find((p) => p.aiAnalysis?.isPortrait) || photos[0];
    const avatarUrl = portraitPhoto?.originalUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

    const newPerson: PersonProfile = {
      id: `person_${Date.now()}`,
      name: newName.trim(),
      relationship: newRelationship,
      avatarUrl,
      photoIds: [],
      photoCount: 0,
      createdAt: Date.now(),
    };

    const updated = [...people, newPerson];
    onUpdatePeople(updated);
    setIsAddModalOpen(false);
    setNewName('');
    showToast('success', 'Person Added', `Added "${newPerson.name}" to People & Faces.`);
  };

  const handleSaveRename = (personId: string) => {
    if (!editNameValue.trim()) return;
    const updated = people.map((p) => (p.id === personId ? { ...p, name: editNameValue.trim() } : p));
    onUpdatePeople(updated);
    setEditingPersonId(null);
    showToast('success', 'Name Updated', `Updated person name to "${editNameValue.trim()}"`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">People & Face Recognition</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-500/30">
                AI Clustered
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Recognized faces and people clusters across your photo library.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter people..."
                className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 w-48"
              />
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Person</span>
            </button>
          </div>
        </div>

        {/* People Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredPeople.map((person) => {
            const isEditing = editingPersonId === person.id;
            const count = photos.filter((p) => p.peopleIds?.includes(person.id)).length || person.photoCount;

            return (
              <div
                key={person.id}
                onClick={() => onSelectPerson(person.id)}
                className="group relative rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/50 p-4 flex flex-col items-center text-center cursor-pointer transition-all hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5"
              >
                {/* Avatar with Circular Ring */}
                <div className="relative w-24 h-24 mb-3">
                  <div className="w-full h-full rounded-full overflow-hidden ring-2 ring-indigo-500/40 group-hover:ring-indigo-500 bg-slate-950 shadow-md">
                    <img
                      src={person.avatarUrl}
                      alt={person.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {person.relationship === 'Self' && (
                    <span className="absolute bottom-0 right-0 p-1 rounded-full bg-amber-500 text-slate-950 shadow-md">
                      <Sparkles className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* Name & Relationship */}
                {isEditing ? (
                  <div
                    className="flex items-center gap-1 w-full my-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      className="w-full bg-slate-950 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveRename(person.id)}
                      className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-500"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setEditingPersonId(null)}
                      className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1 w-full">
                    <h4 className="font-bold text-xs text-white group-hover:text-indigo-300 truncate">
                      {person.name}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPersonId(person.id);
                        setEditNameValue(person.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-white transition-opacity"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1.5 mt-1">
                  {person.relationship && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/80">
                      {person.relationship}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">
                    {count} photo{count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Person Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                <span>Add Person</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Elena, Marcus, Maya..."
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300">Relationship / Role</label>
              <select
                value={newRelationship}
                onChange={(e) => setNewRelationship(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="Self">Self / Me</option>
                <option value="Friend">Friend</option>
                <option value="Client">Client</option>
                <option value="Family">Family</option>
                <option value="Model">Model</option>
                <option value="Colleague">Colleague</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPerson}
                disabled={!newName.trim()}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md disabled:opacity-50"
              >
                Save Person
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
