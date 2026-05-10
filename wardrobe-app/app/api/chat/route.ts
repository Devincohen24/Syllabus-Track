import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { readWardrobe } from '@/lib/storage';
import { ClothingItem, WeatherData, CalendarEvent } from '@/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  currentOutfit: ClothingItem[];
  weather: WeatherData | null;
  events: CalendarEvent[];
}

const suggestOutfitTool: Anthropic.Tool = {
  name: 'suggest_outfit',
  description: 'Update the outfit recommendation with a new set of clothing items from the wardrobe. Use this when the user asks to change, swap, or adjust the outfit.',
  input_schema: {
    type: 'object' as const,
    properties: {
      item_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of clothing item IDs to include in the new outfit',
      },
      reason: {
        type: 'string',
        description: 'Brief explanation of why this outfit was chosen',
      },
    },
    required: ['item_ids', 'reason'],
  },
};

function buildSystemPrompt(
  wardrobe: ClothingItem[],
  currentOutfit: ClothingItem[],
  weather: WeatherData | null,
  events: CalendarEvent[],
): string {
  const wardrobeSummary = wardrobe.map((c) =>
    `- ID: ${c.id} | ${c.name} | ${c.category} | ${c.colors.join('/')} | ${c.formality} | seasons: ${c.seasons.join(',')}`
  ).join('\n');

  const outfitSummary = currentOutfit.length > 0
    ? currentOutfit.map((c) => `- ${c.name} (${c.category}, ID: ${c.id})`).join('\n')
    : 'No outfit selected yet.';

  const weatherSummary = weather
    ? `${weather.temperature}°, ${weather.description}, ${weather.isRaining ? 'raining' : 'not raining'}, feels like ${weather.feelsLike}°`
    : 'Weather data unavailable.';

  const eventsSummary = events.length > 0
    ? events.map((e) => `- ${e.summary} at ${new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${e.location ? ` @ ${e.location}` : ''}`).join('\n')
    : 'No events today.';

  return `You are a friendly personal stylist AI assistant embedded in a wardrobe app. You help the user pick and refine their outfit for the day.

TODAY'S CONTEXT:
Weather: ${weatherSummary}
Events:
${eventsSummary}

CURRENT OUTFIT:
${outfitSummary}

FULL WARDROBE (use these IDs when suggesting outfits):
${wardrobeSummary}

INSTRUCTIONS:
- Be conversational, warm, and concise. Keep responses short (2-4 sentences max).
- When the user asks to change, swap, or adjust the outfit, use the suggest_outfit tool with item IDs from the wardrobe above.
- You can answer questions about style, color matching, dress codes, occasion-appropriateness, etc.
- When suggesting a new outfit, always include at minimum: 1 top + 1 bottom (or 1 dress), and shoes if available.
- Never make up item IDs — only use IDs from the wardrobe list above.
- If the wardrobe doesn't have what the user wants, say so and offer the best available alternative.`;
}

export async function POST(req: NextRequest) {
  const body: ChatRequest = await req.json();
  const { messages, currentOutfit, weather, events } = body;

  const { items, preferences } = await readWardrobe();
  const apiKey = preferences.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: buildSystemPrompt(items, currentOutfit, weather, events),
    tools: [suggestOutfitTool],
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  // Extract text reply
  const textBlock = response.content.find((b) => b.type === 'text');
  const replyText = textBlock?.type === 'text' ? textBlock.text : '';

  // Check if Claude called suggest_outfit
  const toolUse = response.content.find((b) => b.type === 'tool_use' && b.name === 'suggest_outfit');
  let updatedOutfit: ClothingItem[] | null = null;

  if (toolUse?.type === 'tool_use') {
    const input = toolUse.input as { item_ids: string[]; reason: string };
    const itemsById = new Map(items.map((i) => [i.id, i]));
    const picked = input.item_ids.map((id) => itemsById.get(id)).filter(Boolean) as ClothingItem[];
    if (picked.length > 0) updatedOutfit = picked;
  }

  return NextResponse.json({ reply: replyText, updatedOutfit });
}
