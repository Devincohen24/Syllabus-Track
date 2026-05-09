import { google } from 'googleapis';
import { CalendarEvent } from '@/types';

export function getOAuth2Client(clientId: string, clientSecret: string, redirectUri: string) {
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(clientId: string, clientSecret: string, redirectUri: string): string {
  const oauth2Client = getOAuth2Client(clientId, clientSecret, redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    prompt: 'consent',
  });
}

export async function getTodayEvents(accessToken: string, refreshToken: string, clientId: string, clientSecret: string): Promise<CalendarEvent[]> {
  const oauth2Client = getOAuth2Client(clientId, clientSecret, `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`);
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = response.data.items || [];

  return events.map((event) => ({
    id: event.id || '',
    summary: event.summary || 'Untitled Event',
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
    location: event.location || undefined,
    description: event.description || undefined,
  }));
}
