import { NextRequest, NextResponse } from 'next/server';
import { readWardrobe, updatePreferences } from '@/lib/storage';

function safePrefs(preferences: ReturnType<typeof Object.assign>) {
  const { anthropicApiKey, openWeatherApiKey, googleClientId, googleClientSecret, ...safe } = preferences;
  return {
    ...safe,
    hasAnthropicKey: !!anthropicApiKey || !!process.env.ANTHROPIC_API_KEY,
    hasWeatherKey: !!openWeatherApiKey || !!process.env.OPENWEATHER_API_KEY,
    hasGoogleCreds:
      !!(googleClientId || process.env.GOOGLE_CLIENT_ID) &&
      !!(googleClientSecret || process.env.GOOGLE_CLIENT_SECRET),
  };
}

export async function GET() {
  const { preferences } = await readWardrobe();
  return NextResponse.json({ preferences: safePrefs(preferences) });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await updatePreferences(body);
    return NextResponse.json({ preferences: safePrefs(updated) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('PATCH /api/preferences failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
