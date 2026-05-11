import { CalendarEvent } from '@/types';

function parseIcsDate(value: string): Date | null {
  // TZID=America/New_York:20240511T090000 or 20240511T090000Z or 20240511
  const clean = value.includes(':') ? value.split(':').pop()! : value;
  if (!clean) return null;

  if (clean.length === 8) {
    // All-day: YYYYMMDD
    return new Date(`${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`);
  }
  // YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
  const iso = `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}T${clean.slice(9, 11)}:${clean.slice(11, 13)}:${clean.slice(13, 15)}${clean.endsWith('Z') ? 'Z' : ''}`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function unfoldLines(raw: string): string[] {
  // ICS lines can be folded with CRLF + whitespace
  return raw
    .replace(/\r\n[ \t]/g, '')
    .replace(/\n[ \t]/g, '')
    .split(/\r?\n/);
}

export async function getTodayEventsFromIcs(icsUrl: string): Promise<CalendarEvent[]> {
  const url = icsUrl.replace(/^webcal:\/\//i, 'https://');

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Failed to fetch calendar: ${res.status}`);
  const text = await res.text();
  const lines = unfoldLines(text);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const events: CalendarEvent[] = [];
  let inEvent = false;
  let current: Record<string, string> = {};

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      current = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      inEvent = false;
      const start = parseIcsDate(current['DTSTART'] ?? '');
      const end = parseIcsDate(current['DTEND'] ?? current['DTSTART'] ?? '');
      if (start && end && start <= endOfDay && end >= startOfDay) {
        events.push({
          id: current['UID'] || `${start.toISOString()}-${current['SUMMARY']}`,
          summary: current['SUMMARY'] || 'Untitled Event',
          start: start.toISOString(),
          end: end.toISOString(),
          location: current['LOCATION'] || undefined,
          description: current['DESCRIPTION'] || undefined,
        });
      }
      continue;
    }
    if (!inEvent) continue;

    // Split key and value — key may include params like DTSTART;TZID=...
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const keyPart = line.slice(0, colonIdx).split(';')[0].toUpperCase();
    const val = line.slice(colonIdx + 1).replace(/\\n/g, '\n').replace(/\\,/g, ',');
    current[keyPart] = val;
  }

  return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}
