import { NextRequest, NextResponse } from 'next/server';
import { readWardrobe, updatePreferences } from '@/lib/storage';

export async function GET() {
  const { preferences } = readWardrobe();
  // Never expose API keys in GET response
  const { anthropicApiKey, openWeatherApiKey, googleClientId, googleClientSecret, ...safe } = preferences;
  return NextResponse.json({
    preferences: {
      ...safe,
      hasAnthropicKey: !!anthropicApiKey || !!process.env.ANTHROPIC_API_KEY,
      hasWeatherKey: !!openWeatherApiKey || !!process.env.OPENWEATHER_API_KEY,
      hasGoogleCreds: !!(googleClientId || process.env.GOOGLE_CLIENT_ID) && !!(googleClientSecret || process.env.GOOGLE_CLIENT_SECRET),
    },
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const updated = updatePreferences(body);
  const { anthropicApiKey, openWeatherApiKey, googleClientId, googleClientSecret, ...safe } = updated;
  return NextResponse.json({
    preferences: {
      ...safe,
      hasAnthropicKey: !!anthropicApiKey || !!process.env.ANTHROPIC_API_KEY,
      hasWeatherKey: !!openWeatherApiKey || !!process.env.OPENWEATHER_API_KEY,
      hasGoogleCreds: !!(googleClientId || process.env.GOOGLE_CLIENT_ID) && !!(googleClientSecret || process.env.GOOGLE_CLIENT_SECRET),
    },
  });
}
