'use client';

import { useState, useEffect, useCallback } from 'react';
import WeatherWidget from '@/components/WeatherWidget';
import CalendarEvents from '@/components/CalendarEvents';
import OutfitDisplay from '@/components/OutfitDisplay';
import ChatPanel from '@/components/ChatPanel';
import { WeatherData, CalendarEvent, OutfitRecommendation, ClothingItem } from '@/types';
import Link from 'next/link';

interface RecommendResponse {
  recommendation: OutfitRecommendation;
  weather: WeatherData | null;
  events: CalendarEvent[];
}

interface CalendarResponse {
  events: CalendarEvent[];
  connected: boolean;
}

interface WeatherResponse {
  weather: WeatherData;
}

interface PreferencesResponse {
  preferences: {
    temperatureUnit: 'celsius' | 'fahrenheit';
    hasAnthropicKey: boolean;
    hasWeatherKey: boolean;
  };
}

export default function HomePage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [recommendation, setRecommendation] = useState<OutfitRecommendation | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [loadingOutfit, setLoadingOutfit] = useState(false);
  const [unit, setUnit] = useState<'celsius' | 'fahrenheit'>('fahrenheit');
  const [error, setError] = useState('');
  const [wardrobeCount, setWardrobeCount] = useState(0);
  const [hasKeys, setHasKeys] = useState(false);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const loadPreferences = useCallback(async () => {
    const res = await fetch('/api/preferences').catch(() => null);
    if (!res?.ok) return;
    const data: PreferencesResponse = await res.json();
    setUnit(data.preferences.temperatureUnit);
    setHasKeys(data.preferences.hasAnthropicKey);
  }, []);

  const loadWeather = useCallback(async () => {
    setLoadingWeather(true);
    const res = await fetch('/api/weather').catch(() => null);
    setLoadingWeather(false);
    if (!res?.ok) return;
    const data: WeatherResponse = await res.json();
    setWeather(data.weather);
  }, []);

  const loadCalendar = useCallback(async () => {
    setLoadingCalendar(true);
    const localDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in user's timezone
    const res = await fetch(`/api/calendar?localDate=${localDate}`).catch(() => null);
    setLoadingCalendar(false);
    if (!res?.ok) return;
    const data: CalendarResponse = await res.json();
    setEvents(data.events);
    setCalendarConnected(data.connected);
  }, []);

  const loadWardrobeCount = useCallback(async () => {
    const res = await fetch('/api/clothes').catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    setWardrobeCount(data.items?.length ?? 0);
  }, []);

  useEffect(() => {
    loadPreferences();
    loadWeather();
    loadCalendar();
    loadWardrobeCount();
  }, [loadPreferences, loadWeather, loadCalendar, loadWardrobeCount]);

  const getOutfitRecommendation = async () => {
    setLoadingOutfit(true);
    setError('');
    const localDate = new Date().toLocaleDateString('en-CA');
    const res = await fetch(`/api/recommend?localDate=${localDate}`).catch(() => null);
    setLoadingOutfit(false);
    if (!res) { setError('Network error'); return; }
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed to get recommendation'); return; }
    const rec: RecommendResponse = data;
    setRecommendation(rec.recommendation);
    if (rec.weather) setWeather(rec.weather);
    if (rec.events) { setEvents(rec.events); setCalendarConnected(true); }
  };

  const markWorn = async (ids: string[]) => {
    await Promise.all(
      ids.map((id) =>
        fetch('/api/clothes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, wornCount: 1, lastWorn: new Date().toISOString() }),
        })
      )
    );

    // Log the worn outfit to the learning system
    if (recommendation) {
      fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'outfit_worn',
          items: recommendation.items,
          weather,
          events,
          source: 'ai_recommendation',
        }),
      }).catch(() => {});
    }

    await loadWardrobeCount();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good morning!</h1>
          <p className="text-gray-500 text-sm mt-0.5">{today}</p>
        </div>
        <Link href="/closet" className="text-sm text-indigo-600 hover:underline">
          {wardrobeCount} items in closet
        </Link>
      </div>

      {/* Setup prompt */}
      {!hasKeys && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl">⚙️</span>
          <div>
            <p className="font-medium text-amber-800 text-sm">Setup required</p>
            <p className="text-amber-700 text-sm mt-0.5">
              Add your API keys in{' '}
              <Link href="/settings" className="underline font-medium">Settings</Link>{' '}
              to enable AI outfit recommendations and weather.
            </p>
          </div>
        </div>
      )}

      {/* Weather */}
      <WeatherWidget weather={weather} loading={loadingWeather} unit={unit} />

      {/* Calendar */}
      <CalendarEvents events={events} connected={calendarConnected} loading={loadingCalendar} />

      {/* Outfit recommendation */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {!recommendation && !loadingOutfit && (
        <button
          onClick={getOutfitRecommendation}
          disabled={wardrobeCount === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-lg transition-colors shadow-lg shadow-indigo-200"
        >
          {wardrobeCount === 0 ? 'Add clothes to get started' : 'Get My Outfit for Today ✨'}
        </button>
      )}

      <OutfitDisplay recommendation={recommendation} loading={loadingOutfit} onMarkWorn={markWorn} />

      {recommendation && (
        <button
          onClick={getOutfitRecommendation}
          className="w-full border border-indigo-200 hover:bg-indigo-50 text-indigo-600 font-medium py-3 rounded-xl transition-colors"
        >
          Refresh Recommendation
        </button>
      )}

      <ChatPanel
        currentOutfit={recommendation}
        weather={weather}
        events={events}
        onOutfitUpdate={(items: ClothingItem[]) => {
          setRecommendation((prev) =>
            prev
              ? { ...prev, items, occasionSummary: 'Updated by your style assistant' }
              : { items, reasoning: '', occasionSummary: 'Suggested by your style assistant', weatherNote: '', styleNote: '' }
          );
          // Log chat-driven outfit swap as a preference signal
          fetch('/api/learn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'signal',
              signalType: 'outfit_accepted',
              details: { itemNames: items.map((i) => i.name), source: 'chat_swap' },
            }),
          }).catch(() => {});
        }}
      />
    </div>
  );
}
