import { createClient, SupabaseClient } from '@supabase/supabase-js';

function makeCookieStorage() {
  return {
    getItem(key: string): string | null {
      if (typeof document === 'undefined') return null;
      const m = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
      return m ? decodeURIComponent(m[1]) : null;
    },
    setItem(key: string, value: string): void {
      if (typeof document === 'undefined') return;
      document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=604800; SameSite=Lax`;
    },
    removeItem(key: string): void {
      if (typeof document === 'undefined') return;
      document.cookie = `${key}=; path=/; max-age=0`;
    },
  };
}

let _client: SupabaseClient | null = null;

export async function getBrowserSupabase(): Promise<SupabaseClient> {
  if (_client) return _client;

  // Fetch config from the server at runtime — avoids relying on
  // NEXT_PUBLIC_* vars being inlined by the bundler.
  const res = await fetch('/api/auth/config');
  if (!res.ok) throw new Error('Supabase not configured — check your environment variables');
  const { url, anonKey } = await res.json();

  _client = createClient(url, anonKey, {
    auth: {
      storage: makeCookieStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return _client;
}
