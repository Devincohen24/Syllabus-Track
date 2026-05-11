import { NextResponse } from 'next/server';

// Serves Supabase public config at runtime so client components don't
// depend on NEXT_PUBLIC_* vars being baked into the bundle at build time.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  return NextResponse.json({ url, anonKey });
}
