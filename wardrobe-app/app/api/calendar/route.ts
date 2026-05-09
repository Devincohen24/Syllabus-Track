import { NextRequest, NextResponse } from 'next/server';
import { getTodayEvents } from '@/lib/google-calendar';
import { readWardrobe } from '@/lib/storage';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('google_access_token')?.value;
  const refreshToken = cookieStore.get('google_refresh_token')?.value;

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ events: [], connected: false });
  }

  const { preferences } = await readWardrobe();
  const clientId = preferences.googleClientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = preferences.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ events: [], connected: false, error: 'Google credentials not configured' });
  }

  const events = await getTodayEvents(accessToken, refreshToken, clientId, clientSecret);
  return NextResponse.json({ events, connected: true });
}
