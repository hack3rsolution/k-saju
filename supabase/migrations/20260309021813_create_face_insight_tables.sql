-- face_insight_sessions
create table if not exists public.face_insight_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('traditional', 'state')),
  image_source text check (image_source in ('camera', 'library')),
  image_url text not null,
  locale text not null default 'en',
  cultural_frame text not null default 'en',
  status text not null default 'pending' check (status in ('pending', 'completed', 'error')),
  created_at timestamptz not null default now()
);

-- face_insight_results
create table if not exists public.face_insight_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.face_insight_sessions(id) on delete cascade,
  result_json jsonb not null,
  summary_text text,
  mood_score int,
  stress_score int,
  fatigue_score int,
  energy_score int,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.face_insight_sessions enable row level security;
alter table public.face_insight_results enable row level security;

-- sessions: 본인 데이터만
create policy "users can manage own sessions"
  on public.face_insight_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- results: session owner만
create policy "users can manage own results"
  on public.face_insight_results
  for all
  using (
    session_id in (
      select id from public.face_insight_sessions
      where user_id = auth.uid()
    )
  );

-- Storage bucket 정책 (bucket은 Dashboard에서 생성 필요)
-- bucket name: face-insight-uploads
-- 경로 규칙: {user_id}/* → 본인만 접근
