'use client';

import { ClothingItem } from '@/types';

interface Props {
  item: ClothingItem;
  onDelete?: (id: string) => void;
  onMarkWorn?: (id: string) => void;
  onEdit?: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

const formalityLabel: Record<string, string> = {
  very_casual: 'Very Casual',
  casual: 'Casual',
  smart_casual: 'Smart Casual',
  business_casual: 'Business Casual',
  business: 'Business',
  formal: 'Formal',
};

const formalityColor: Record<string, string> = {
  very_casual: 'bg-green-100 text-green-800',
  casual: 'bg-blue-100 text-blue-800',
  smart_casual: 'bg-purple-100 text-purple-800',
  business_casual: 'bg-orange-100 text-orange-800',
  business: 'bg-red-100 text-red-800',
  formal: 'bg-gray-800 text-white',
};

export default function ClothingCard({ item, onDelete, onMarkWorn, onEdit, selected, onSelect }: Props) {
  return (
    <div
      className={`relative bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg ${
        selected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
      } ${onSelect ? 'cursor-pointer' : ''}`}
      onClick={() => onSelect?.(item.id)}
    >
      {selected && (
        <div className="absolute top-2 right-2 z-10 bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          ✓
        </div>
      )}

      <div className="aspect-square relative bg-gray-100 overflow-hidden">
        {item.imageData ? (
          <img
            src={item.imageData}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
            {item.category === 'shoes' ? '👟' : item.category === 'accessory' ? '💍' : '👕'}
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-1 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{item.name}</h3>
          <span className={`text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${formalityColor[item.formality]}`}>
            {formalityLabel[item.formality]}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mb-2">
          {item.colors.slice(0, 3).map((c) => (
            <span key={c} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full capitalize">
              {c}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-1 mb-2">
          {item.seasons.map((s) => (
            <span key={s} className="text-xs text-gray-500 capitalize">
              {s === 'spring' ? '🌸' : s === 'summer' ? '☀️' : s === 'fall' ? '🍂' : '❄️'} {s}
            </span>
          ))}
        </div>

        {item.wornCount > 0 && (
          <p className="text-xs text-gray-400 mb-2">Worn {item.wornCount}x</p>
        )}

        {(onMarkWorn || onEdit || onDelete) && (
          <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
            {onMarkWorn && (
              <button
                onClick={(e) => { e.stopPropagation(); onMarkWorn(item.id); }}
                className="flex-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-1.5 rounded-lg transition-colors"
              >
                Wore today
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(item.id); }}
                className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
