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
