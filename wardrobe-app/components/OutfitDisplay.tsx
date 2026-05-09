'use client';

import { OutfitRecommendation, ClothingItem } from '@/types';

interface Props {
  recommendation: OutfitRecommendation | null;
  loading?: boolean;
  onMarkWorn?: (ids: string[]) => void;
}

function OutfitItemBadge({ item }: { item: ClothingItem }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm">
      {item.imageData ? (
        <img src={item.imageData} alt={item.name} className="w-16 h-16 object-cover rounded-lg shrink-0" />
      ) : (
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl shrink-0">
          {item.category === 'shoes' ? '👟' : item.category === 'accessory' ? '💍' : '👕'}
        </div>
      )}
      <div className="min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
        <p className="text-gray-500 text-xs capitalize">{item.category} · {item.colors.join(', ')}</p>
      </div>
    </div>
  );
}

export default function OutfitDisplay({ recommendation, loading, onMarkWorn }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md space-y-4">
        <div className="h-6 bg-gray-100 rounded w-48 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md text-center">
        <div className="text-5xl mb-3">👗</div>
        <h3 className="font-semibold text-gray-800 text-lg mb-1">No Outfit Yet</h3>
        <p className="text-gray-500 text-sm">
          Add clothes to your wardrobe, then get an AI outfit recommendation.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Today's Outfit</h2>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">AI Pick</span>
      </div>

      {/* Occasion */}
      <div className="bg-indigo-50 rounded-xl p-3">
        <p className="text-sm text-indigo-800 font-medium">{recommendation.occasionSummary}</p>
      </div>

      {/* Outfit items */}
      <div className="space-y-2">
        {recommendation.items.map((item) => (
          <OutfitItemBadge key={item.id} item={item} />
        ))}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        {recommendation.weatherNote && (
          <div className="flex gap-2 text-sm text-gray-600">
            <span>🌤️</span>
            <span>{recommendation.weatherNote}</span>
          </div>
        )}
        {recommendation.styleNote && (
          <div className="flex gap-2 text-sm text-gray-600">
            <span>✨</span>
            <span>{recommendation.styleNote}</span>
          </div>
        )}
      </div>

      {/* Reasoning */}
      <details className="group">
        <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-800 font-medium select-none">
          Why this outfit? ↓
        </summary>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3">
          {recommendation.reasoning}
        </p>
      </details>

      {/* Alternatives */}
      {recommendation.alternatives && recommendation.alternatives.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Alternative Options</h4>
          <div className="space-y-3">
            {recommendation.alternatives.map((alt, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-2 font-medium">Option {idx + 2}</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {alt.map((item) => (
                    <div key={item.id} className="shrink-0 text-center">
                      {item.imageData ? (
                        <img src={item.imageData} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />
                      ) : (
                        <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                          {item.category === 'shoes' ? '👟' : '👕'}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1 w-14 truncate">{item.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {onMarkWorn && (
        <button
          onClick={() => onMarkWorn(recommendation.items.map((i) => i.id))}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          I wore this today ✓
        </button>
      )}
    </div>
  );
}
