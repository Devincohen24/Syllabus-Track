import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.getAll().forEach((c) => {
    if (/^sb-/.test(c.name)) cookieStore.delete(c.name);
  });
  // Also clear the simple session flag set on login
  cookieStore.delete('sb-session');
  return NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  );
}
