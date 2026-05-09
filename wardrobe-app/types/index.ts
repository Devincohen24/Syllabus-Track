export type ClothingCategory =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'outerwear'
  | 'shoes'
  | 'accessory'
  | 'underwear'
  | 'activewear'
  | 'swimwear';

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export type Formality =
  | 'very_casual'
  | 'casual'
  | 'smart_casual'
  | 'business_casual'
  | 'business'
  | 'formal';

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  colors: string[];
  styles: string[];
  seasons: Season[];
  formality: Formality;
  tags: string[];
  imageData: string; // base64 data URL
  addedAt: string;
  lastWorn?: string;
  wornCount: number;
  description?: string;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  city: string;
  country: string;
  icon: string;
  isRaining: boolean;
  isCold: boolean;
  isHot: boolean;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  formality?: Formality;
}

export interface OutfitRecommendation {
  items: ClothingItem[];
  reasoning: string;
  occasionSummary: string;
  weatherNote: string;
  styleNote: string;
  alternatives?: ClothingItem[][];
}

export interface UserPreferences {
  styleProfile: string[];
  favoriteColors: string[];
  location: string;
  temperatureUnit: 'celsius' | 'fahrenheit';
  googleCalendarConnected: boolean;
  openWeatherApiKey?: string;
  anthropicApiKey?: string;
  googleClientId?: string;
  googleClientSecret?: string;
}

export interface WardrobeData {
  items: ClothingItem[];
  preferences: UserPreferences;
}

export interface AnalysisResult {
  name: string;
  category: ClothingCategory;
  colors: string[];
  styles: string[];
  seasons: Season[];
  formality: Formality;
  tags: string[];
  description: string;
}
