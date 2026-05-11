import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

// Fetches Supabase config from the server at runtime so we never depend
// on NEXT_PUBLIC_* vars being inlined by the bundler.
export async function getBrowserSupabase(): Promise<SupabaseClient> {
  if (_client) return _client;

  const res = await fetch('/api/auth/config');
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error || 'Failed to load Supabase config');
  }
  const { url, anonKey } = await res.json();

  _client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Store session in cookies so middleware can read it server-side
      storage: {
        getItem: (key) => {
          if (typeof document === 'undefined') return null;
          const m = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
          return m ? decodeURIComponent(m[1]) : null;
        },
        setItem: (key, value) => {
          if (typeof document === 'undefined') return;
          document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=604800; SameSite=Lax`;
        },
        removeItem: (key) => {
          if (typeof document === 'undefined') return;
          document.cookie = `${key}=; path=/; max-age=0`;
        },
      },
    },
  });

  return _client;
}
