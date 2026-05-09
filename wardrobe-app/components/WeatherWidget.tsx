'use client';

import { WeatherData } from '@/types';

interface Props {
  weather: WeatherData | null;
  loading?: boolean;
  unit?: 'celsius' | 'fahrenheit';
}

export default function WeatherWidget({ weather, loading, unit = 'fahrenheit' }: Props) {
  const unitSymbol = unit === 'celsius' ? '°C' : '°F';

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl p-5 text-white animate-pulse">
        <div className="h-4 bg-white/30 rounded w-24 mb-2" />
        <div className="h-10 bg-white/30 rounded w-32 mb-1" />
        <div className="h-4 bg-white/30 rounded w-40" />
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-gray-100 rounded-2xl p-5 text-center">
        <p className="text-gray-500 text-sm">Weather unavailable</p>
        <p className="text-gray-400 text-xs mt-1">Configure location & API key in Settings</p>
      </div>
    );
  }

  const bgGradient = weather.isRaining
    ? 'from-slate-600 to-slate-800'
    : weather.isCold
    ? 'from-blue-500 to-indigo-700'
    : weather.isHot
    ? 'from-orange-400 to-red-600'
    : 'from-sky-400 to-blue-600';

  const weatherEmoji = weather.isRaining ? '🌧️' : weather.isCold ? '🥶' : weather.isHot ? '☀️' : '⛅';

  return (
    <div className={`bg-gradient-to-br ${bgGradient} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{weather.city}, {weather.country}</p>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-5xl font-bold">{weather.temperature}{unitSymbol}</span>
            <span className="text-3xl mb-1">{weatherEmoji}</span>
          </div>
          <p className="text-white/90 capitalize mt-1">{weather.description}</p>
        </div>
        {weather.icon && (
          <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            alt={weather.condition}
            className="w-16 h-16 -mt-1"
          />
        )}
      </div>

      <div className="flex gap-4 mt-4 pt-4 border-t border-white/20 text-sm text-white/80">
        <span>Feels {weather.feelsLike}{unitSymbol}</span>
        <span>💧 {weather.humidity}%</span>
        <span>💨 {weather.windSpeed} {unit === 'celsius' ? 'm/s' : 'mph'}</span>
      </div>

      <div className="mt-3 flex gap-2">
        {weather.isCold && <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Layer up!</span>}
        {weather.isRaining && <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Bring an umbrella</span>}
        {weather.isHot && <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Dress light</span>}
      </div>
    </div>
  );
}
