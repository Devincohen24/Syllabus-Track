'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface Preferences {
  location: string;
  temperatureUnit: 'celsius' | 'fahrenheit';
  styleProfile: string[];
  favoriteColors: string[];
  googleCalendarConnected: boolean;
  calendarIcsUrl?: string;
  hasAnthropicKey: boolean;
  hasWeatherKey: boolean;
  hasGoogleCreds: boolean;
}

const styleOptions = [
  'casual', 'minimalist', 'streetwear', 'bohemian', 'preppy', 'athletic',
  'formal', 'business', 'vintage', 'edgy', 'romantic', 'classic',
];

const colorOptions = [
  'black', 'white', 'navy', 'gray', 'beige', 'brown',
  'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange',
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const [prefs, setPrefs] = useState<Partial<Preferences>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [flash, setFlash] = useState('');

  const [anthropicKey, setAnthropicKey] = useState('');
  const [weatherKey, setWeatherKey] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success === 'calendar_connected') setFlash('Google Calendar connected successfully!');
    if (error) setFlash(`Error: ${error.replace(/_/g, ' ')}`);
  }, [searchParams]);

  const loadPrefs = useCallback(async () => {
    const res = await fetch('/api/preferences').catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    setPrefs(data.preferences);
  }, []);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  const save = async () => {
    setSaving(true);
    const payload: Record<string, unknown> = {
      location: prefs.location || '',
      temperatureUnit: prefs.temperatureUnit || 'fahrenheit',
      styleProfile: prefs.styleProfile || [],
      favoriteColors: prefs.favoriteColors || [],
      calendarIcsUrl: prefs.calendarIcsUrl || '',
    };
    if (anthropicKey) payload.anthropicApiKey = anthropicKey;
    if (weatherKey) payload.openWeatherApiKey = weatherKey;
    if (googleClientId) payload.googleClientId = googleClientId;
    if (googleClientSecret) payload.googleClientSecret = googleClientSecret;

    const res = await fetch('/api/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setPrefs(data.preferences);
      setSaved(true);
      setAnthropicKey('');
      setWeatherKey('');
      setGoogleClientId('');
      setGoogleClientSecret('');
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const toggleStyle = (style: string) => {
    const current = prefs.styleProfile || [];
    const next = current.includes(style) ? current.filter((s) => s !== style) : [...current, style];
    setPrefs({ ...prefs, styleProfile: next });
  };

  const toggleColor = (color: string) => {
    const current = prefs.favoriteColors || [];
    const next = current.includes(color) ? current.filter((c) => c !== color) : [...current, color];
    setPrefs({ ...prefs, favoriteColors: next });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Configure your wardrobe app</p>
      </div>

      {flash && (
        <div className={`rounded-xl px-4 py-3 text-sm ${
          flash.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {flash}
        </div>
      )}

      {/* API Keys */}
      <section className="bg-white rounded-2xl p-6 shadow-md space-y-4">
        <h2 className="font-semibold text-gray-800 text-lg">API Keys</h2>
        <p className="text-sm text-gray-500">Keys are stored locally and never sent to any server other than the respective APIs.</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Anthropic API Key
            {prefs.hasAnthropicKey && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Configured</span>}
          </label>
          <input
            type="password"
            placeholder={prefs.hasAnthropicKey ? 'Already set — enter new key to update' : 'sk-ant-...'}
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <p className="text-xs text-gray-400 mt-1">Used for AI clothing analysis and outfit recommendations</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            OpenWeatherMap API Key
            {prefs.hasWeatherKey && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Configured</span>}
          </label>
          <input
            type="password"
            placeholder={prefs.hasWeatherKey ? 'Already set — enter new key to update' : 'Your API key'}
            value={weatherKey}
            onChange={(e) => setWeatherKey(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <p className="text-xs text-gray-400 mt-1">
            Free at <span className="text-indigo-500">openweathermap.org/api</span>
          </p>
        </div>
      </section>

      {/* Location */}
      <section className="bg-white rounded-2xl p-6 shadow-md space-y-4">
        <h2 className="font-semibold text-gray-800 text-lg">Location & Units</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City / Location</label>
          <input
            type="text"
            placeholder="e.g. New York, London, Tokyo"
            value={prefs.location || ''}
            onChange={(e) => setPrefs({ ...prefs, location: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Temperature Unit</label>
          <div className="flex gap-3">
            {(['fahrenheit', 'celsius'] as const).map((u) => (
              <button
                key={u}
                onClick={() => setPrefs({ ...prefs, temperatureUnit: u })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  prefs.temperatureUnit === u
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {u === 'fahrenheit' ? '°F Fahrenheit' : '°C Celsius'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Style Profile */}
      <section className="bg-white rounded-2xl p-6 shadow-md space-y-4">
        <h2 className="font-semibold text-gray-800 text-lg">Style Profile</h2>
        <p className="text-sm text-gray-500">Select your personal style to guide outfit recommendations</p>

        <div className="flex flex-wrap gap-2">
          {styleOptions.map((style) => (
            <button
              key={style}
              onClick={() => toggleStyle(style)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                (prefs.styleProfile || []).includes(style)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </section>

      {/* Color Preferences */}
      <section className="bg-white rounded-2xl p-6 shadow-md space-y-4">
        <h2 className="font-semibold text-gray-800 text-lg">Favorite Colors</h2>
        <p className="text-sm text-gray-500">Colors you prefer wearing</p>

        <div className="flex flex-wrap gap-2">
          {colorOptions.map((color) => (
            <button
              key={color}
              onClick={() => toggleColor(color)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                (prefs.favoriteColors || []).includes(color)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </section>

      {/* Calendar */}
      <section className="bg-white rounded-2xl p-6 shadow-md space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-lg">Calendar</h2>
          {(prefs.calendarIcsUrl || prefs.googleCalendarConnected) && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Connected</span>
          )}
        </div>

        {/* ICS URL — recommended */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Recommended</span>
            <label className="text-sm font-medium text-gray-700">Paste your calendar link</label>
          </div>
          <input
            type="url"
            placeholder="webcal:// or https://... (iCal/ICS link)"
            value={prefs.calendarIcsUrl || ''}
            onChange={(e) => setPrefs({ ...prefs, calendarIcsUrl: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs text-gray-500">
            <p className="font-medium text-gray-700">How to get your link:</p>
            <p><span className="font-semibold">iPhone / iCloud:</span> Open the Calendar app → tap the calendar name → Share Calendar → enable Public Calendar → Copy Link</p>
            <p><span className="font-semibold">Google Calendar:</span> calendar.google.com → ⋮ next to your calendar → Settings → scroll to "Secret address in iCal format" → copy the URL</p>
            <p><span className="font-semibold">Outlook:</span> outlook.com → Settings → View all → Calendar → Shared calendars → Publish → Copy ICS link</p>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or use Google OAuth</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google OAuth (advanced) */}
        <details className="group">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 select-none list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            Advanced: Connect via Google OAuth
          </summary>
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Google Client ID
                {prefs.hasGoogleCreds && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Set</span>}
              </label>
              <input
                type="text"
                placeholder="your-client-id.apps.googleusercontent.com"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Google Client Secret</label>
              <input
                type="password"
                placeholder={prefs.hasGoogleCreds ? 'Already set' : 'GOCSPX-...'}
                value={googleClientSecret}
                onChange={(e) => setGoogleClientSecret(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            {prefs.hasGoogleCreds && (
              <a
                href="/api/auth/google"
                className="inline-block bg-white border border-gray-300 hover:border-indigo-400 text-gray-700 font-medium px-4 py-2 rounded-xl text-sm transition-colors"
              >
                {prefs.googleCalendarConnected ? 'Reconnect Google Calendar' : 'Connect Google Calendar'}
              </a>
            )}
          </div>
        </details>
      </section>

      {/* Save button */}
      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
