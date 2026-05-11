import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  // Clear all Supabase session cookies
  cookieStore.getAll().forEach((c) => {
    if (/^sb-.+/.test(c.name)) cookieStore.delete(c.name);
  });
  return NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
  );
}
