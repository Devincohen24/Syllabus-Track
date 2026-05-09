import { NextRequest, NextResponse } from 'next/server';
import { analyzeClothing } from '@/lib/claude';
import { readWardrobe } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { imageData, mimeType } = body;

  if (!imageData || !mimeType) {
    return NextResponse.json({ error: 'Missing imageData or mimeType' }, { status: 400 });
  }

  const { preferences } = await readWardrobe();
  const apiKey = preferences.anthropicApiKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 400 });
  }

  const base64 = imageData.includes(',') ? imageData.split(',')[1] : imageData;
  const result = await analyzeClothing(base64, mimeType, apiKey);
  return NextResponse.json({ analysis: result });
}
