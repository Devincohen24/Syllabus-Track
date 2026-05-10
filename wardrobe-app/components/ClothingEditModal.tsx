'use client';

import { useState } from 'react';
import { ClothingItem, ClothingCategory, Formality, Season } from '@/types';

interface Props {
  item: ClothingItem;
  onSave: (id: string, updates: Partial<ClothingItem>) => Promise<void>;
  onClose: () => void;
}

const categories: ClothingCategory[] = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'underwear', 'activewear', 'swimwear'];
const formalities: Formality[] = ['very_casual', 'casual', 'smart_casual', 'business_casual', 'business', 'formal'];
const seasons: Season[] = ['spring', 'summer', 'fall', 'winter'];

export default function ClothingEditModal({ item, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    name: item.name,
    category: item.category,
    colors: item.colors.join(', '),
    styles: item.styles.join(', '),
    formality: item.formality,
    seasons: item.seasons,
    tags: item.tags.join(', '),
    description: item.description || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleSeason = (s: Season) => {
    setForm((f) => ({
      ...f,
      seasons: f.seasons.includes(s) ? f.seasons.filter((x) => x !== s) : [...f.seasons, s],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(item.id, {
        name: form.name.trim(),
        category: form.category,
        colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
        styles: form.styles.split(',').map((s) => s.trim()).filter(Boolean),
        formality: form.formality,
        seasons: form.seasons,
        tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
        description: form.description.trim() || undefined,
      });
      onClose();
    } catch {
      setError('Failed to save. Try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">Edit Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Image preview */}
          {item.imageData && (
            <img src={item.imageData} alt={item.name} className="w-full h-48 object-cover rounded-xl" />
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-xl">{error}</div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Name</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
            <textarea
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              placeholder="Add notes about this item..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Category</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as ClothingCategory })}
            >
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Formality */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Formality</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={form.formality}
              onChange={(e) => setForm({ ...form, formality: e.target.value as Formality })}
            >
              {formalities.map((f) => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Colors <span className="font-normal text-gray-400">(comma separated)</span></label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={form.colors}
              onChange={(e) => setForm({ ...form, colors: e.target.value })}
              placeholder="navy, white, gray"
            />
          </div>

          {/* Styles */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Styles <span className="font-normal text-gray-400">(comma separated)</span></label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={form.styles}
              onChange={(e) => setForm({ ...form, styles: e.target.value })}
              placeholder="casual, minimalist"
            />
          </div>

          {/* Seasons */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Seasons</label>
            <div className="flex gap-2 flex-wrap">
              {seasons.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSeason(s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                    form.seasons.includes(s)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s === 'spring' ? '🌸' : s === 'summer' ? '☀️' : s === 'fall' ? '🍂' : '❄️'} {s}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tags <span className="font-normal text-gray-400">(comma separated)</span></label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="cotton, slim-fit, striped"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
