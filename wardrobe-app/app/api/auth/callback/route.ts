import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/google-calendar';
import { updatePreferences, readWardrobe } from '@/lib/storage';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/settings?error=calendar_auth_failed`);
  }

  const { preferences } = await readWardrobe();
  const clientId = preferences.googleClientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = preferences.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/settings?error=missing_credentials`);
  }

  const oauth2Client = getOAuth2Client(clientId, clientSecret, `${appUrl}/api/auth/callback`);
  const { tokens } = await oauth2Client.getToken(code);

  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  };

  cookieStore.set('google_access_token', tokens.access_token || '', cookieOptions);
  cookieStore.set('google_refresh_token', tokens.refresh_token || '', cookieOptions);

  await updatePreferences({ googleCalendarConnected: true });

  return NextResponse.redirect(`${appUrl}/settings?success=calendar_connected`);
}
