import { ClothingItem, UserPreferences, WardrobeData } from '@/types';
import { getSupabase } from './supabase';

// ── helpers ──────────────────────────────────────────────────────────────────

function toRow(item: ClothingItem) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    colors: item.colors,
    styles: item.styles,
    seasons: item.seasons,
    formality: item.formality,
    tags: item.tags,
    image_data: item.imageData,
    added_at: item.addedAt,
    last_worn: item.lastWorn ?? null,
    worn_count: item.wornCount,
    description: item.description ?? null,
  };
}

function fromRow(row: Record<string, unknown>): ClothingItem {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as ClothingItem['category'],
    colors: (row.colors as string[]) ?? [],
    styles: (row.styles as string[]) ?? [],
    seasons: (row.seasons as ClothingItem['seasons']) ?? [],
    formality: row.formality as ClothingItem['formality'],
    tags: (row.tags as string[]) ?? [],
    imageData: (row.image_data as string) ?? '',
    addedAt: row.added_at as string,
    lastWorn: (row.last_worn as string) ?? undefined,
    wornCount: (row.worn_count as number) ?? 0,
    description: (row.description as string) ?? undefined,
  };
}

function prefsFromRow(row: Record<string, unknown>): UserPreferences {
  return {
    styleProfile: (row.style_profile as string[]) ?? [],
    favoriteColors: (row.favorite_colors as string[]) ?? [],
    location: (row.location as string) ?? '',
    temperatureUnit: (row.temperature_unit as 'celsius' | 'fahrenheit') ?? 'fahrenheit',
    googleCalendarConnected: (row.google_calendar_connected as boolean) ?? false,
    anthropicApiKey: (row.anthropic_api_key as string) ?? undefined,
    openWeatherApiKey: (row.open_weather_api_key as string) ?? undefined,
    googleClientId: (row.google_client_id as string) ?? undefined,
    googleClientSecret: (row.google_client_secret as string) ?? undefined,
  };
}

const defaultPreferences: UserPreferences = {
  styleProfile: [],
  favoriteColors: [],
  location: '',
  temperatureUnit: 'fahrenheit',
  googleCalendarConnected: false,
};

// ── public API ────────────────────────────────────────────────────────────────

export async function readWardrobe(): Promise<WardrobeData> {
  const db = getSupabase();
  const [itemsRes, prefsRes] = await Promise.all([
    db.from('wardrobe_items').select('*').order('added_at', { ascending: false }),
    db.from('user_preferences').select('*').eq('id', 1).single(),
  ]);

  const items = (itemsRes.data ?? []).map(fromRow);
  const preferences = prefsRes.data ? prefsFromRow(prefsRes.data as Record<string, unknown>) : defaultPreferences;
  return { items, preferences };
}

export async function addClothingItem(item: ClothingItem): Promise<ClothingItem> {
  const db = getSupabase();
  const { error } = await db.from('wardrobe_items').insert(toRow(item));
  if (error) throw new Error(error.message);
  return item;
}

export async function removeClothingItem(id: string): Promise<boolean> {
  const db = getSupabase();
  const { error, count } = await db.from('wardrobe_items').delete({ count: 'exact' }).eq('id', id);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function updateClothingItem(id: string, updates: Partial<ClothingItem>): Promise<ClothingItem | null> {
  const db = getSupabase();
  const rowUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) rowUpdates.name = updates.name;
  if (updates.category !== undefined) rowUpdates.category = updates.category;
  if (updates.colors !== undefined) rowUpdates.colors = updates.colors;
  if (updates.styles !== undefined) rowUpdates.styles = updates.styles;
  if (updates.seasons !== undefined) rowUpdates.seasons = updates.seasons;
  if (updates.formality !== undefined) rowUpdates.formality = updates.formality;
  if (updates.tags !== undefined) rowUpdates.tags = updates.tags;
  if (updates.imageData !== undefined) rowUpdates.image_data = updates.imageData;
  if (updates.lastWorn !== undefined) rowUpdates.last_worn = updates.lastWorn;
  if (updates.wornCount !== undefined) rowUpdates.worn_count = updates.wornCount;
  if (updates.description !== undefined) rowUpdates.description = updates.description;

  const { data, error } = await db
    .from('wardrobe_items')
    .update(rowUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return null;
  return fromRow(data as Record<string, unknown>);
}

export async function updatePreferences(updates: Partial<UserPreferences>): Promise<UserPreferences> {
  const db = getSupabase();
  const rowUpdates: Record<string, unknown> = {};
  if (updates.styleProfile !== undefined) rowUpdates.style_profile = updates.styleProfile;
  if (updates.favoriteColors !== undefined) rowUpdates.favorite_colors = updates.favoriteColors;
  if (updates.location !== undefined) rowUpdates.location = updates.location;
  if (updates.temperatureUnit !== undefined) rowUpdates.temperature_unit = updates.temperatureUnit;
  if (updates.googleCalendarConnected !== undefined) rowUpdates.google_calendar_connected = updates.googleCalendarConnected;
  if (updates.anthropicApiKey !== undefined) rowUpdates.anthropic_api_key = updates.anthropicApiKey;
  if (updates.openWeatherApiKey !== undefined) rowUpdates.open_weather_api_key = updates.openWeatherApiKey;
  if (updates.googleClientId !== undefined) rowUpdates.google_client_id = updates.googleClientId;
  if (updates.googleClientSecret !== undefined) rowUpdates.google_client_secret = updates.googleClientSecret;

  const { data, error } = await db
    .from('user_preferences')
    .upsert({ id: 1, ...rowUpdates })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Failed to update preferences');
  return prefsFromRow(data as Record<string, unknown>);
}
