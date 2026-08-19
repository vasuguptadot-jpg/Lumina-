import React, { useState } from 'react';
import { PhotoAlbum, SmartAlbumRule } from '../../types/library';
import { Sparkles, Plus, Trash2, X } from 'lucide-react';

interface SmartAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSmartAlbum: (album: PhotoAlbum) => void;
}

export const SmartAlbumModal: React.FC<SmartAlbumModalProps> = ({
  isOpen,
  onClose,
  onCreateSmartAlbum,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Sparkles');
  const [rules, setRules] = useState<SmartAlbumRule[]>([
    { id: 'r1', field: 'rating', operator: 'gte', value: 4 },
  ]);

  if (!isOpen) return null;

  const handleAddRule = () => {
    const newRule: SmartAlbumRule = {
      id: `rule_${Date.now()}`,
      field: 'category',
      operator: 'equals',
      value: 'Landscape',
    };
    setRules([...rules, newRule]);
  };

  const handleRemoveRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const handleUpdateRule = (id: string, updates: Partial<SmartAlbumRule>) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const album: PhotoAlbum = {
      id: `smart_album_${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'Custom Dynamic Smart Album',
      icon,
      isSmart: true,
      smartRules: rules,
      photoCount: 0,
      createdAt: Date.now(),
    };

    onCreateSmartAlbum(album);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg flex flex-col gap-4 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Create Custom Smart Album</h3>
              <p className="text-[11px] text-slate-400">
                Photos matching these dynamic criteria will automatically be included.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Name & Description */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300">Smart Album Name</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 5-Star Landscapes, Night Portfolios, RAW High-Res..."
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional summary of this dynamic rule..."
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
          />
        </div>

        {/* Rules Builder */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-indigo-300">Dynamic Matching Rules</label>
            <button
              onClick={handleAddRule}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-200 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Rule</span>
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs"
              >
                {/* Field Selector */}
                <select
                  value={rule.field}
                  onChange={(e) => handleUpdateRule(rule.id, { field: e.target.value as any })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                >
                  <option value="rating">Star Rating (★)</option>
                  <option value="minAesthetic">Aesthetic Score (%)</option>
                  <option value="category">Category / Genre</option>
                  <option value="timeOfDay">Time of Day</option>
                  <option value="isRaw">Is RAW Sensor File</option>
                  <option value="tag">Has Tag</option>
                </select>

                {/* Operator Selector */}
                <select
                  value={rule.operator}
                  onChange={(e) => handleUpdateRule(rule.id, { operator: e.target.value as any })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                >
                  <option value="equals">is equal to</option>
                  <option value="gte">is greater or equal to (&gt;=)</option>
                  <option value="contains">contains</option>
                </select>

                {/* Value Input */}
                {rule.field === 'rating' ? (
                  <select
                    value={rule.value}
                    onChange={(e) => handleUpdateRule(rule.id, { value: parseInt(e.target.value, 10) })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                  >
                    <option value={1}>1 Star</option>
                    <option value={2}>2 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={5}>5 Stars</option>
                  </select>
                ) : rule.field === 'timeOfDay' ? (
                  <select
                    value={rule.value}
                    onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                  >
                    <option value="day">Day</option>
                    <option value="golden-hour">Golden Hour</option>
                    <option value="sunset">Sunset</option>
                    <option value="night">Night</option>
                    <option value="indoor">Indoor</option>
                  </select>
                ) : rule.field === 'category' ? (
                  <select
                    value={rule.value}
                    onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                  >
                    <option value="Beach & Coastal">Beach & Coastal</option>
                    <option value="Automotive & Cars">Automotive & Cars</option>
                    <option value="Portrait">Portrait</option>
                    <option value="Night Photography">Night Photography</option>
                    <option value="Landscape">Landscape</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Travel">Travel</option>
                  </select>
                ) : rule.field === 'minAesthetic' ? (
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={rule.value}
                    onChange={(e) => handleUpdateRule(rule.id, { value: parseInt(e.target.value, 10) || 90 })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={rule.value}
                    onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
                    placeholder="Value..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                  />
                )}

                {/* Remove button */}
                {rules.length > 1 && (
                  <button
                    onClick={() => handleRemoveRule(rule.id)}
                    className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md disabled:opacity-50"
          >
            Create Smart Album
          </button>
        </div>
      </div>
    </div>
  );
};
