'use client';

import { useState, useEffect, useCallback } from 'react';
import ClothingCard from '@/components/ClothingCard';
import ClothingUpload from '@/components/ClothingUpload';
import ClothingEditModal from '@/components/ClothingEditModal';
import { ClothingItem, ClothingCategory, AnalysisResult } from '@/types';

const categoryLabels: Record<ClothingCategory, string> = {
  top: 'Tops',
  bottom: 'Bottoms',
  dress: 'Dresses',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessory: 'Accessories',
  underwear: 'Underwear',
  activewear: 'Activewear',
  swimwear: 'Swimwear',
};

const categoryEmojis: Record<ClothingCategory, string> = {
  top: '👕',
  bottom: '👖',
  dress: '👗',
  outerwear: '🧥',
  shoes: '👟',
  accessory: '💍',
  underwear: '🩲',
  activewear: '🏃',
  swimwear: '🩱',
};

type FilterCategory = ClothingCategory | 'all';

export default function ClosetPage() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/clothes').catch(() => null);
    setLoading(false);
    if (!res?.ok) return;
    const data = await res.json();
    setItems(data.items || []);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSave = async (item: AnalysisResult & { imageData: string }) => {
    const res = await fetch('/api/clothes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to save');
    await loadItems();
    setShowUpload(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this item from your wardrobe?')) return;
    await fetch(`/api/clothes?id=${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleMarkWorn = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await fetch('/api/clothes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        wornCount: item.wornCount + 1,
        lastWorn: new Date().toISOString(),
      }),
    });
    setItems((prev) =>
      prev.map((i) => i.id === id ? { ...i, wornCount: i.wornCount + 1, lastWorn: new Date().toISOString() } : i)
    );
  };

  const handleEdit = async (id: string, updates: Partial<ClothingItem>) => {
    const res = await fetch('/api/clothes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) throw new Error('Failed to save');
    const data = await res.json();
    setItems((prev) => prev.map((i) => i.id === id ? data.item : i));
  };

  const categories = ['all', ...new Set(items.map((i) => i.category))] as FilterCategory[];

  const filtered = items.filter((item) => {
    const matchesCategory = filter === 'all' || item.category === filter;
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.colors.some((c) => c.toLowerCase().includes(search.toLowerCase())) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const grouped = filtered.reduce<Record<string, ClothingItem[]>>((acc, item) => {
    const key = filter === 'all' ? item.category : 'all';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Closet</h1>
          <p className="text-gray-500 text-sm">{items.length} items</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className={`${
            showUpload
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          } font-semibold px-4 py-2 rounded-xl transition-colors text-sm`}
        >
          {showUpload ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {showUpload && (
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h2 className="font-semibold text-gray-800 mb-4 text-lg">Add New Item</h2>
          <ClothingUpload onSave={handleSave} />
        </div>
      )}

      {/* Search */}
      {items.length > 0 && (
        <input
          type="text"
          placeholder="Search by name, color, or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
      )}

      {/* Category filter */}
      {items.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
              }`}
            >
              {cat === 'all' ? 'All' : `${categoryEmojis[cat as ClothingCategory]} ${categoryLabels[cat as ClothingCategory]}`}
            </button>
          ))}
        </div>
      )}

      {/* Items grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">👚</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Your closet is empty</h2>
          <p className="text-gray-500 text-sm mb-6">
            Start by adding your first clothing item using the button above.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Add First Item
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm">
          No items match your search.
        </div>
      ) : filter === 'all' ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span>{categoryEmojis[cat as ClothingCategory]}</span>
                {categoryLabels[cat as ClothingCategory]}
                <span className="text-gray-400 font-normal text-sm">({catItems.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {catItems.map((item) => (
                  <ClothingCard
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    onMarkWorn={handleMarkWorn}
                    onEdit={(id) => setEditingItem(items.find((i) => i.id === id) ?? null)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <ClothingCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onMarkWorn={handleMarkWorn}
              onEdit={(id) => setEditingItem(items.find((i) => i.id === id) ?? null)}
            />
          ))}
        </div>
      )}

      {editingItem && (
        <ClothingEditModal
          item={editingItem}
          onSave={handleEdit}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}
