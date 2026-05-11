import { NextResponse } from 'next/server';

export async function GET() {
  // Use plain env var names (no NEXT_PUBLIC_ prefix) so these are always
  // available server-side without any bundler involvement.
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      { error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment' },
      { status: 500 }
    );
  }

  return NextResponse.json({ url, anonKey });
}
