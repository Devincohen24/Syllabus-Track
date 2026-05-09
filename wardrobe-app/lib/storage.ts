import fs from 'fs';
import path from 'path';
import { WardrobeData, ClothingItem, UserPreferences } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const WARDROBE_FILE = path.join(DATA_DIR, 'wardrobe.json');

const defaultPreferences: UserPreferences = {
  styleProfile: [],
  favoriteColors: [],
  location: '',
  temperatureUnit: 'fahrenheit',
  googleCalendarConnected: false,
};

const defaultData: WardrobeData = {
  items: [],
  preferences: defaultPreferences,
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(WARDROBE_FILE)) {
    fs.writeFileSync(WARDROBE_FILE, JSON.stringify(defaultData, null, 2));
  }
}

export function readWardrobe(): WardrobeData {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(WARDROBE_FILE, 'utf-8');
    const data = JSON.parse(raw) as WardrobeData;
    if (!data.preferences) data.preferences = defaultPreferences;
    if (!data.items) data.items = [];
    return data;
  } catch {
    return defaultData;
  }
}

export function writeWardrobe(data: WardrobeData): void {
  ensureDataDir();
  fs.writeFileSync(WARDROBE_FILE, JSON.stringify(data, null, 2));
}

export function addClothingItem(item: ClothingItem): ClothingItem {
  const data = readWardrobe();
  data.items.push(item);
  writeWardrobe(data);
  return item;
}

export function removeClothingItem(id: string): boolean {
  const data = readWardrobe();
  const before = data.items.length;
  data.items = data.items.filter((i) => i.id !== id);
  writeWardrobe(data);
  return data.items.length < before;
}

export function updateClothingItem(id: string, updates: Partial<ClothingItem>): ClothingItem | null {
  const data = readWardrobe();
  const idx = data.items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  data.items[idx] = { ...data.items[idx], ...updates };
  writeWardrobe(data);
  return data.items[idx];
}

export function getClothingItem(id: string): ClothingItem | null {
  const data = readWardrobe();
  return data.items.find((i) => i.id === id) ?? null;
}

export function updatePreferences(updates: Partial<UserPreferences>): UserPreferences {
  const data = readWardrobe();
  data.preferences = { ...data.preferences, ...updates };
  writeWardrobe(data);
  return data.preferences;
}
