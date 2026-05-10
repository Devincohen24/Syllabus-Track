-- Run this in your Supabase project's SQL Editor
-- (supabase.com → your project → SQL Editor → New query)

create table if not exists wardrobe_items (
  id text primary key,
  name text not null,
  category text not null,
  colors text[] not null default '{}',
  styles text[] not null default '{}',
  seasons text[] not null default '{}',
  formality text not null default 'casual',
  tags text[] not null default '{}',
  image_data text,
  added_at timestamptz not null default now(),
  last_worn timestamptz,
  worn_count integer not null default 0,
  description text
);

create table if not exists user_preferences (
  id integer primary key default 1,
  style_profile text[] default '{}',
  favorite_colors text[] default '{}',
  location text default '',
  temperature_unit text default 'fahrenheit',
  google_calendar_connected boolean default false,
  anthropic_api_key text,
  open_weather_api_key text,
  google_client_id text,
  google_client_secret text
);

-- Seed the single preferences row
insert into user_preferences (id)
values (1)
on conflict (id) do nothing;

-- ── Learning system ───────────────────────────────────────────────────────────

-- Every outfit actually worn by the user
create table if not exists outfit_history (
  id uuid primary key default gen_random_uuid(),
  worn_at timestamptz not null default now(),
  item_ids text[] not null,
  item_names text[] not null default '{}',
  item_categories text[] not null default '{}',
  formality text,
  colors text[] default '{}',
  weather_temp integer,
  weather_condition text,
  events_summary text,
  source text default 'manual'  -- 'ai_recommendation' | 'chat_edit' | 'manual'
);

-- Raw preference signals from chat interactions and user actions
create table if not exists style_signals (
  id uuid primary key default gen_random_uuid(),
  recorded_at timestamptz not null default now(),
  signal_type text not null,  -- 'chat_request' | 'outfit_accepted' | 'outfit_rejected' | 'chat_swap'
  details jsonb not null default '{}'
);

-- Single-row learned style profile synthesized by Claude
create table if not exists style_learnings (
  id integer primary key default 1,
  profile_summary text default '',
  total_signals integer default 0,
  signals_since_refresh integer default 0,
  last_refreshed timestamptz
);

insert into style_learnings (id)
values (1)
on conflict (id) do nothing;
