import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cookie-based storage so Next.js middleware can read the session server-side.
// @supabase/ssr is intentionally avoided — it cannot be resolved when Vercel
// builds from the monorepo root rather than the wardrobe-app subdirectory.
function makeCookieStorage() {
  return {
    getItem(key: string): string | null {
      if (typeof document === 'undefined') return null;
      const m = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
      return m ? decodeURIComponent(m[1]) : null;
    },
    setItem(key: string, value: string): void {
      if (typeof document === 'undefined') return;
      // 7-day session, sent on all same-site requests
      document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=604800; SameSite=Lax`;
    },
    removeItem(key: string): void {
      if (typeof document === 'undefined') return;
      document.cookie = `${key}=; path=/; max-age=0`;
    },
  };
}

let _client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storage: makeCookieStorage(),
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    );
  }
  return _client;
}
