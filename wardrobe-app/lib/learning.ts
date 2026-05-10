import Anthropic from '@anthropic-ai/sdk';
import { getSupabase } from './supabase';
import { ClothingItem, WeatherData, CalendarEvent } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OutfitWornPayload {
  items: ClothingItem[];
  weather: WeatherData | null;
  events: CalendarEvent[];
  source: 'ai_recommendation' | 'chat_edit' | 'manual';
}

export interface StyleSignalPayload {
  signalType: 'chat_request' | 'chat_swap' | 'outfit_accepted' | 'outfit_rejected';
  details: Record<string, unknown>;
}

export interface StyleProfile {
  summary: string;
  totalSignals: number;
  lastRefreshed: string | null;
}

// Refresh the profile after this many new signals
const REFRESH_THRESHOLD = 5;

// ── Logging ───────────────────────────────────────────────────────────────────

export async function logOutfitWorn(payload: OutfitWornPayload): Promise<void> {
  const db = getSupabase();
  const { items, weather, events, source } = payload;

  const allColors = [...new Set(items.flatMap((i) => i.colors))];
  const formalityLevels = items.map((i) => i.formality);
  const dominantFormality = formalityLevels[0] ?? 'casual';
  const eventsSummary = events.length > 0
    ? events.map((e) => e.summary).join(', ')
    : 'no events';

  await db.from('outfit_history').insert({
    item_ids: items.map((i) => i.id),
    item_names: items.map((i) => i.name),
    item_categories: items.map((i) => i.category),
    formality: dominantFormality,
    colors: allColors,
    weather_temp: weather?.temperature ?? null,
    weather_condition: weather?.condition ?? null,
    events_summary: eventsSummary,
    source,
  });

  await incrementSignalCount();
  await maybeRefreshProfile();
}

export async function logStyleSignal(payload: StyleSignalPayload, apiKey?: string): Promise<void> {
  const db = getSupabase();

  await db.from('style_signals').insert({
    signal_type: payload.signalType,
    details: payload.details,
  });

  await incrementSignalCount();
  await maybeRefreshProfile(apiKey);
}

async function incrementSignalCount(): Promise<void> {
  const db = getSupabase();
  const { data } = await db.from('style_learnings').select('total_signals, signals_since_refresh').eq('id', 1).single();
  if (data) {
    await db.from('style_learnings').update({
      total_signals: (data.total_signals ?? 0) + 1,
      signals_since_refresh: (data.signals_since_refresh ?? 0) + 1,
    }).eq('id', 1);
  }
}

async function maybeRefreshProfile(apiKey?: string): Promise<void> {
  const db = getSupabase();
  const { data } = await db.from('style_learnings').select('signals_since_refresh').eq('id', 1).single();
  if ((data?.signals_since_refresh ?? 0) >= REFRESH_THRESHOLD) {
    await refreshStyleProfile(apiKey);
  }
}

// ── Profile synthesis ─────────────────────────────────────────────────────────

export async function refreshStyleProfile(apiKey?: string): Promise<string> {
  const db = getSupabase();

  // Pull recent history (last 50 outfits)
  const [historyRes, signalsRes, currentRes] = await Promise.all([
    db.from('outfit_history').select('*').order('worn_at', { ascending: false }).limit(50),
    db.from('style_signals').select('*').order('recorded_at', { ascending: false }).limit(100),
    db.from('style_learnings').select('profile_summary, total_signals').eq('id', 1).single(),
  ]);

  const history = historyRes.data ?? [];
  const signals = signalsRes.data ?? [];
  const current = currentRes.data;

  if (history.length === 0 && signals.length === 0) {
    return current?.profile_summary ?? '';
  }

  const resolvedKey = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!resolvedKey) return current?.profile_summary ?? '';

  const client = new Anthropic({ apiKey: resolvedKey });

  const historySummary = history.map((h) =>
    `- Wore: ${(h.item_names as string[]).join(', ')} | Formality: ${h.formality} | Colors: ${(h.colors as string[]).join(',')} | Weather: ${h.weather_temp ?? '?'}°, ${h.weather_condition ?? '?'} | Events: ${h.events_summary} | Source: ${h.source}`
  ).join('\n');

  const signalsSummary = signals.map((s) =>
    `- ${s.signal_type}: ${JSON.stringify(s.details)}`
  ).join('\n');

  const previousProfile = current?.profile_summary
    ? `\nPrevious profile (update and expand this, don't replace it entirely):\n${current.profile_summary}`
    : '';

  const prompt = `You are analyzing a user's fashion choices and preferences to build a style profile that will help an AI wardrobe assistant make better recommendations.

OUTFIT HISTORY (most recent first):
${historySummary || 'No history yet.'}

PREFERENCE SIGNALS (chat requests, swaps, feedback):
${signalsSummary || 'No signals yet.'}
${previousProfile}

Write a concise but rich style profile paragraph (100-200 words) summarizing:
1. Their preferred formality levels and when they dress up vs. down
2. Dominant colors and color combinations they reach for
3. How weather affects their choices
4. Any patterns around events or occasions
5. What they ask to change (and in what direction)
6. Overall style personality

Write it as a third-person description that will be given to an AI stylist. Be specific about patterns you observe. Do not mention that this is based on data — just state the observations as facts about the user.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const summary = response.content[0].type === 'text' ? response.content[0].text.trim() : '';

  await db.from('style_learnings').upsert({
    id: 1,
    profile_summary: summary,
    signals_since_refresh: 0,
    last_refreshed: new Date().toISOString(),
  });

  return summary;
}

// ── Reading ───────────────────────────────────────────────────────────────────

export async function getStyleProfile(): Promise<StyleProfile> {
  const db = getSupabase();
  const { data } = await db.from('style_learnings').select('*').eq('id', 1).single();
  return {
    summary: data?.profile_summary ?? '',
    totalSignals: data?.total_signals ?? 0,
    lastRefreshed: data?.last_refreshed ?? null,
  };
}
