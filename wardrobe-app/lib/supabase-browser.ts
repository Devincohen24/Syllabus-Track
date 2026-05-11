import { createClient, SupabaseClient } from '@supabase/supabase-js';

// These are the Supabase PUBLIC (anon) credentials — safe to hardcode.
// The anon key is designed to be exposed in browser code; Supabase RLS
// controls what it can actually access.
const SUPABASE_URL = 'https://mwouzebdhtngrcyxsysw.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13b3V6ZWJkaHRuZ3JjeXhzeXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDQ2ODgsImV4cCI6MjA5MzkyMDY4OH0.nM1ZBfCWjcL1cQK-WurFI_FwgQIk3lA-CmX4rnQVGqY';

let _client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (_client) return _client;

  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
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
