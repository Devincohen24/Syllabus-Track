import { NextResponse } from 'next/server';
import { recommendOutfit } from '@/lib/claude';
import { readWardrobe } from '@/lib/storage';
import { getWeather } from '@/lib/weather';
import { getTodayEvents } from '@/lib/google-calendar';
import { getTodayEventsFromIcs } from '@/lib/ical-calendar';
import { getStyleProfile } from '@/lib/learning';
import { cookies } from 'next/headers';
import { WeatherData, CalendarEvent } from '@/types';

export async function GET() {
  const { items, preferences } = await readWardrobe();

  if (items.length === 0) {
    return NextResponse.json({ error: 'No clothes in wardrobe. Add some items first!' }, { status: 400 });
  }

  const apiKey = preferences.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 400 });
  }

  let weather: WeatherData | null = null;
  const weatherApiKey = preferences.openWeatherApiKey || process.env.OPENWEATHER_API_KEY;
  if (preferences.location && weatherApiKey) {
    weather = await getWeather(preferences.location, weatherApiKey, preferences.temperatureUnit).catch(() => null);
  }

  let events: CalendarEvent[] = [];
  if (preferences.calendarIcsUrl) {
    events = await getTodayEventsFromIcs(preferences.calendarIcsUrl).catch(() => []);
  } else {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('google_access_token')?.value;
    const refreshToken = cookieStore.get('google_refresh_token')?.value;
    const clientId = preferences.googleClientId || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = preferences.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET;
    if (accessToken && refreshToken && clientId && clientSecret) {
      events = await getTodayEvents(accessToken, refreshToken, clientId, clientSecret).catch(() => []);
    }
  }

  // Fetch learned style profile in parallel with everything else
  const { summary: learnedProfile } = await getStyleProfile().catch(() => ({ summary: '' }));

  const recommendation = await recommendOutfit(
    items, weather, events,
    { styleProfile: preferences.styleProfile, favoriteColors: preferences.favoriteColors },
    apiKey,
    learnedProfile || undefined,
  );

  return NextResponse.json({ recommendation, weather, events });
}
