create extension if not exists pgcrypto;

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  artist text not null,
  musical_key text not null default 'C',
  bpm integer not null default 90 check (bpm between 20 and 300),
  time_signature text not null default '4/4',
  favorite boolean not null default false,
  sections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.setlists (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  venue text,
  show_date timestamptz,
  offline_ready boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.setlist_songs (
  setlist_id uuid not null references public.setlists(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  position integer not null check (position >= 0),
  primary key (setlist_id, song_id),
  unique (setlist_id, position)
);

alter table public.songs enable row level security;
alter table public.setlists enable row level security;
alter table public.setlist_songs enable row level security;

revoke all on table public.songs from anon, authenticated;
revoke all on table public.setlists from anon, authenticated;
revoke all on table public.setlist_songs from anon, authenticated;

grant usage on schema public to service_role;
grant all on table public.songs to service_role;
grant all on table public.setlists to service_role;
grant all on table public.setlist_songs to service_role;

create index if not exists songs_updated_at_idx on public.songs (updated_at desc);
create index if not exists setlists_updated_at_idx on public.setlists (updated_at desc);
create index if not exists setlist_songs_position_idx on public.setlist_songs (setlist_id, position);

-- One private, offline-first workspace per Supabase Auth user.
create table if not exists public.workspaces (
  user_id text primary key,
  document jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.workspaces enable row level security;
revoke all on table public.workspaces from anon, authenticated;
grant all on table public.workspaces to service_role;
