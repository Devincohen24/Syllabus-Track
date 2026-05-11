import { CalendarEvent } from '@/types';

function unfoldLines(raw: string): string[] {
  return raw
    .replace(/\r\n[ \t]/g, '')
    .replace(/\n[ \t]/g, '')
    .split(/\r?\n/);
}

// Extract YYYY-MM-DD from an ICS date value like:
//   20240511  (all-day)
//   20240511T090000Z  (UTC)
//   20240511T090000   (floating / local)
//   value after stripping params e.g. DTSTART;TZID=...:20240511T090000
function extractDateStr(raw: string): string {
  const val = raw.includes(':') ? raw.split(':').pop()! : raw;
  return `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
}

function parseIcsDate(raw: string): Date {
  const val = raw.includes(':') ? raw.split(':').pop()! : raw;
  if (val.length === 8) {
    // All-day YYYYMMDD
    return new Date(`${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}T00:00:00`);
  }
  const iso = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}T${val.slice(9, 11)}:${val.slice(11, 13)}:${val.slice(13, 15)}${val.endsWith('Z') ? 'Z' : ''}`;
  return new Date(iso);
}

export async function getTodayEventsFromIcs(
  icsUrl: string,
  localDateStr?: string  // YYYY-MM-DD in the user's local timezone
): Promise<CalendarEvent[]> {
  const url = icsUrl.replace(/^webcal:\/\//i, 'https://');

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch calendar (${res.status})`);
  const text = await res.text();
  const lines = unfoldLines(text);

  // Use the client-supplied local date if provided, else fall back to UTC
  const today = localDateStr ?? new Date().toISOString().split('T')[0];

  const events: CalendarEvent[] = [];
  let inEvent = false;
  let current: Record<string, string> = {};

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { inEvent = true; current = {}; continue; }
    if (line === 'END:VEVENT') {
      inEvent = false;

      const dtstart = current['DTSTART'] ?? '';
      const dtend = current['DTEND'] ?? current['DTSTART'] ?? '';

      if (dtstart) {
        // Compare by local date string — avoids server UTC offset issues
        const startDate = extractDateStr(dtstart);
        const endDate = extractDateStr(dtend);

        if (startDate <= today && endDate >= today) {
          events.push({
            id: current['UID'] || `${dtstart}-${current['SUMMARY']}`,
            summary: (current['SUMMARY'] || 'Untitled Event')
              .replace(/\\n/g, ' ').replace(/\\,/g, ',').trim(),
            start: parseIcsDate(dtstart).toISOString(),
            end: parseIcsDate(dtend).toISOString(),
            location: current['LOCATION']?.replace(/\\n/g, ' ').replace(/\\,/g, ',') || undefined,
            description: current['DESCRIPTION']?.replace(/\\n/g, '\n').replace(/\\,/g, ',') || undefined,
          });
        }
      }
      continue;
    }
    if (!inEvent) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    // Key may have params: DTSTART;TZID=America/New_York → key = DTSTART
    const keyFull = line.slice(0, colonIdx);
    const keyBase = keyFull.split(';')[0].toUpperCase();
    const val = line.slice(colonIdx + 1);

    // For DTSTART/DTEND keep the full original line value including any TZID info
    // so extractDateStr can handle it
    if (keyBase === 'DTSTART' || keyBase === 'DTEND') {
      // Store the raw value (date portion), not the key params
      current[keyBase] = val;
    } else {
      current[keyBase] = val;
    }
  }

  return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}
