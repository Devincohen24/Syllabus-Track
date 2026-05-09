import Anthropic from '@anthropic-ai/sdk';
import { AnalysisResult, ClothingItem, WeatherData, CalendarEvent, OutfitRecommendation } from '@/types';

function getClient(apiKey?: string) {
  return new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });
}

export async function analyzeClothing(imageBase64: string, mimeType: string, apiKey?: string): Promise<AnalysisResult> {
  const client = getClient(apiKey);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `Analyze this clothing item and return a JSON object with these exact fields:
{
  "name": "descriptive name of the item",
  "category": one of: "top" | "bottom" | "dress" | "outerwear" | "shoes" | "accessory" | "underwear" | "activewear" | "swimwear",
  "colors": ["primary color", "secondary color if any"],
  "styles": ["style tags like: casual, formal, streetwear, bohemian, minimalist, sporty, preppy, etc."],
  "seasons": ["season(s) it's appropriate for: spring | summer | fall | winter"],
  "formality": one of: "very_casual" | "casual" | "smart_casual" | "business_casual" | "business" | "formal",
  "tags": ["additional descriptive tags: material, pattern, brand style, etc."],
  "description": "brief 1-2 sentence description"
}

Return ONLY the JSON object, no other text.`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse clothing analysis');
  return JSON.parse(jsonMatch[0]) as AnalysisResult;
}

export async function recommendOutfit(
  clothes: ClothingItem[],
  weather: WeatherData | null,
  events: CalendarEvent[],
  preferences: { styleProfile: string[]; favoriteColors: string[] },
  apiKey?: string
): Promise<OutfitRecommendation> {
  const client = getClient(apiKey);

  const clothesSummary = clothes.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    colors: c.colors,
    styles: c.styles,
    formality: c.formality,
    seasons: c.seasons,
    tags: c.tags,
  }));

  const weatherSummary = weather
    ? `Temperature: ${weather.temperature}°, Feels like: ${weather.feelsLike}°, Condition: ${weather.description}, Raining: ${weather.isRaining}`
    : 'Weather data unavailable';

  const eventsSummary = events.length > 0
    ? events.map((e) => `- ${e.summary} at ${new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${e.location ? ` (${e.location})` : ''}`).join('\n')
    : 'No events today - free day';

  const prompt = `You are a personal stylist AI. Based on the user's wardrobe, today's weather, and calendar events, recommend the best outfit.

USER'S WARDROBE:
${JSON.stringify(clothesSummary, null, 2)}

TODAY'S WEATHER:
${weatherSummary}

TODAY'S EVENTS:
${eventsSummary}

USER STYLE PREFERENCES: ${preferences.styleProfile.join(', ') || 'No specific preference'}
FAVORITE COLORS: ${preferences.favoriteColors.join(', ') || 'No preference'}

Pick a complete outfit from the available wardrobe items. Return a JSON object:
{
  "itemIds": ["id1", "id2", ...],
  "reasoning": "detailed explanation of why this outfit was chosen",
  "occasionSummary": "one sentence about what occasion/vibe this is for",
  "weatherNote": "one sentence about how the outfit handles the weather",
  "styleNote": "one sentence about the style choices made",
  "alternativeIds": [["id1", "id2"], ["id3", "id4"]] // 1-2 alternative outfit combinations (optional)
}

Rules:
- Pick at minimum: 1 top + 1 bottom OR 1 dress/outfit piece
- Always include shoes if available
- Consider weather (rain = avoid suede, cold = add layers)
- Match formality to the most formal event of the day
- Return ONLY the JSON object, no other text`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse outfit recommendation');

  const result = JSON.parse(jsonMatch[0]);
  const clothesById = new Map(clothes.map((c) => [c.id, c]));

  const items = (result.itemIds as string[])
    .map((id: string) => clothesById.get(id))
    .filter(Boolean) as ClothingItem[];

  const alternatives = result.alternativeIds
    ? (result.alternativeIds as string[][]).map((ids) =>
        ids.map((id: string) => clothesById.get(id)).filter(Boolean) as ClothingItem[]
      )
    : [];

  return {
    items,
    reasoning: result.reasoning,
    occasionSummary: result.occasionSummary,
    weatherNote: result.weatherNote,
    styleNote: result.styleNote,
    alternatives,
  };
}
