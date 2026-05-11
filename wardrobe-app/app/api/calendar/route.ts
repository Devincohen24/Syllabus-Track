import { NextRequest, NextResponse } from 'next/server';
import { getTodayEventsFromIcs } from '@/lib/ical-calendar';
import { getTodayEvents } from '@/lib/google-calendar';
import { readWardrobe } from '@/lib/storage';
import { cookies } from 'next/headers';
import { getServerUser } from '@/lib/auth-server';
import { isPremium } from '@/lib/subscription';

export async function GET(req: NextRequest) {
  // Calendar is a premium feature
  const user = await getServerUser();
  const premium = user ? await isPremium(user.id) : false;
  if (!premium) {
    return NextResponse.json({ events: [], connected: false, locked: true });
  }

  const { preferences } = await readWardrobe();

  if (preferences.calendarIcsUrl) {
    const localDate = req.nextUrl.searchParams.get('localDate') ?? undefined;
    const events = await getTodayEventsFromIcs(preferences.calendarIcsUrl, localDate).catch(() => []);
    return NextResponse.json({ events, connected: true, method: 'ics' });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('google_access_token')?.value;
  const refreshToken = cookieStore.get('google_refresh_token')?.value;

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ events: [], connected: false });
  }

  const clientId = preferences.googleClientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = preferences.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ events: [], connected: false, error: 'Google credentials not configured' });
  }

  const events = await getTodayEvents(accessToken, refreshToken, clientId, clientSecret);
  return NextResponse.json({ events, connected: true, method: 'google' });
}
