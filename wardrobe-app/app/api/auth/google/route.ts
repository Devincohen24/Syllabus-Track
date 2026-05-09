import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google-calendar';
import { readWardrobe } from '@/lib/storage';

export async function GET() {
  const { preferences } = readWardrobe();
  const clientId = preferences.googleClientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = preferences.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Google credentials not configured. Add them in Settings.' }, { status: 400 });
  }

  const url = getAuthUrl(clientId, clientSecret, `${appUrl}/api/auth/callback`);
  return NextResponse.redirect(url);
}
