import { NextRequest, NextResponse } from 'next/server';
import { getWeather } from '@/lib/weather';
import { readWardrobe } from '@/lib/storage';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locationParam = searchParams.get('location');

  const { preferences } = await readWardrobe();
  const location = locationParam || preferences.location;
  const apiKey = preferences.openWeatherApiKey || process.env.OPENWEATHER_API_KEY;

  if (!location) {
    return NextResponse.json({ error: 'No location configured' }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenWeather API key not configured' }, { status: 400 });
  }

  const weather = await getWeather(location, apiKey, preferences.temperatureUnit);
  return NextResponse.json({ weather });
}
