-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 004_relationships
-- Creates the relationships table for Relationship Map dashboard (issue #20).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.relationships (
  id                  uuid        default gen_random_uuid() primary key,
  owner_id            uuid        references auth.users(id) on delete cascade not null,
  name                text        not null,
  birth_year          int         not null,
  birth_month         int         not null check (birth_month between 1 and 12),
  birth_day           int         not null check (birth_day between 1 and 31),
  birth_hour          int         check (birth_hour between 0 and 23),
  gender              text        not null check (gender in ('M', 'F')),
  relationship_type   text        not null check (relationship_type in (
                        'romantic', 'friend', 'family', 'colleague', 'other'
                      )),
  compatibility_score int,        -- 0–100, cached from last computation
  compatibility_status text,      -- 'good' | 'neutral' | 'caution'
  compatibility_cached_at timestamptz,
  created_at          timestamptz default now() not null,
  updated_at          timestamptz default now() not null
);

-- RLS
alter table public.relationships enable row level security;

create policy "Users can read own relationships"
  on public.relationships for select
  using (auth.uid() = owner_id);

create policy "Users can insert own relationships"
  on public.relationships for insert
  with check (auth.uid() = owner_id);

create policy "Users can update own relationships"
  on public.relationships for update
  using (auth.uid() = owner_id);

create policy "Users can delete own relationships"
  on public.relationships for delete
  using (auth.uid() = owner_id);

-- Index for efficient per-owner queries
create index if not exists idx_relationships_owner
  on public.relationships(owner_id, created_at desc);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger relationships_updated_at
  before update on public.relationships
  for each row execute function public.set_updated_at();
