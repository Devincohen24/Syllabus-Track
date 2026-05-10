import { NextRequest, NextResponse } from 'next/server';
import { logOutfitWorn, logStyleSignal, refreshStyleProfile, getStyleProfile } from '@/lib/learning';
import { readWardrobe } from '@/lib/storage';

// GET — return the current style profile
export async function GET() {
  const profile = await getStyleProfile();
  return NextResponse.json({ profile });
}

// POST — log a signal or trigger a refresh
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { preferences } = await readWardrobe();
  const apiKey = preferences.anthropicApiKey || process.env.ANTHROPIC_API_KEY;

  if (body.action === 'outfit_worn') {
    await logOutfitWorn({
      items: body.items,
      weather: body.weather ?? null,
      events: body.events ?? [],
      source: body.source ?? 'manual',
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'signal') {
    await logStyleSignal({ signalType: body.signalType, details: body.details }, apiKey);
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'refresh') {
    const summary = await refreshStyleProfile(apiKey);
    return NextResponse.json({ summary });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
