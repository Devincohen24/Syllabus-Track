import { getSupabase } from './supabase';
import { cookies } from 'next/headers';

// Reads the Supabase session cookie and returns the authenticated user,
// or null if not logged in / session is invalid.
export async function getServerUser() {
  const cookieStore = await cookies();
  const authCookie = cookieStore
    .getAll()
    .find((c) => /^sb-.+-auth-token/.test(c.name));
  if (!authCookie) return null;

  try {
    const raw = decodeURIComponent(authCookie.value);
    const session = JSON.parse(raw);
    const accessToken: string | undefined =
      session?.access_token ?? session?.[0]?.access_token;
    if (!accessToken) return null;

    const db = getSupabase();
    const { data: { user } } = await db.auth.getUser(accessToken);
    return user ?? null;
  } catch {
    return null;
  }
}
