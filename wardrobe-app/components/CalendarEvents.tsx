'use client';

import { CalendarEvent } from '@/types';

interface Props {
  events: CalendarEvent[];
  connected: boolean;
  loading?: boolean;
}

function formatTime(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function CalendarEvents({ events, connected, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-md space-y-3">
        <div className="h-4 bg-gray-100 rounded w-32 animate-pulse" />
        {[1, 2].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-md">
        <h3 className="font-semibold text-gray-800 mb-3">Today's Schedule</h3>
        <div className="text-center py-4">
          <div className="text-3xl mb-2">📅</div>
          <p className="text-gray-500 text-sm">Calendar not connected</p>
          <a
            href="/settings"
            className="inline-block mt-3 text-sm text-indigo-600 hover:underline"
          >
            Connect Google Calendar →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Today's Schedule</h3>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Connected</span>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-gray-500 text-sm">No events today — dress for yourself!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-1 bg-indigo-400 rounded-full shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{event.summary}</p>
                <p className="text-gray-500 text-xs">
                  {formatTime(event.start)}
                  {event.end && event.end !== event.start && ` – ${formatTime(event.end)}`}
                  {event.location && ` · ${event.location}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
