-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 003_fortune_chat_history
-- Creates the fortune_chat_history table for AI follow-up Q&A sessions.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.fortune_chat_history (
  id              uuid        default gen_random_uuid() primary key,
  user_id         uuid        references auth.users(id) on delete cascade not null,
  fortune_cache_id text,                         -- date string YYYY-MM-DD linking to Reading cache
  role            text        not null check (role in ('user', 'assistant')),
  content         text        not null,
  created_at      timestamptz default now()      not null
);

-- RLS
alter table public.fortune_chat_history enable row level security;

create policy "Users can read own chat history"
  on public.fortune_chat_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own chat messages"
  on public.fortune_chat_history for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own chat history"
  on public.fortune_chat_history for delete
  using (auth.uid() = user_id);

-- Index for efficient per-user, per-fortune queries
create index if not exists idx_fch_user_fortune
  on public.fortune_chat_history(user_id, fortune_cache_id, created_at);
