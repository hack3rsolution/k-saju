-- Migration: add K-Personality feature tables
-- K-Personality (K-타입) — v2.4.0
--
-- 단일 테이블 설계: k_personality_readings
--   results + cache를 하나의 테이블로 통합.
--   (user_id, language, is_premium) UNIQUE 제약으로 캐시 역할 수행.
--   is_premium=false 행이 무료 결과, is_premium=true 행이 프리미엄 결과.
--   expires_at > now() 체크로 캐시 유효성 확인.
--
-- supabase db push 전 반드시 검토 후 Donghyun이 직접 실행할 것.

-- ── 1. 테이블 ────────────────────────────────────────────────────────────────

create table if not exists public.k_personality_readings (
  id                   uuid        primary key default gen_random_uuid(),
  user_id              uuid        not null references auth.users(id) on delete cascade,

  -- 캐시 키
  language             text        not null default 'en',
  is_premium           boolean     not null default false,

  -- 오행 계산 결과
  element_ratio        jsonb       not null
    constraint element_ratio_non_negative check (
      (element_ratio->>'wood')::numeric  >= 0 and
      (element_ratio->>'fire')::numeric  >= 0 and
      (element_ratio->>'earth')::numeric >= 0 and
      (element_ratio->>'metal')::numeric >= 0 and
      (element_ratio->>'water')::numeric >= 0
    ),
  sasang_type          text        not null
    constraint sasang_type_valid check (
      sasang_type in ('taeyang', 'soyang', 'taeeum', 'soeum')
    ),

  -- 무료 결과
  type_name            text        not null,
  type_name_ko         text        not null,
  keywords             text[]      not null default '{}',
  summary_short        text        not null,

  -- 프리미엄 추가 결과 (nullable)
  summary_full         text,
  strengths            text[],
  growth_areas         text[],
  career_fit           text[],
  compatible_types     text[],
  monthly_energy_flow  text,

  -- 공유·캐시 메타
  share_enabled        boolean     not null default false,
  expires_at           timestamptz not null,

  -- 감사 로그
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- 언어 × 프리미엄 여부별 1행만 유지 (캐시 upsert 키)
  unique (user_id, language, is_premium)
);

-- ── 2. 인덱스 ────────────────────────────────────────────────────────────────

-- 캐시 조회: user_id + language + is_premium + expires_at
create index if not exists k_personality_readings_lookup
  on public.k_personality_readings (user_id, language, is_premium, expires_at);

-- 공개 공유 링크 조회: share_enabled = true
create index if not exists k_personality_readings_shared
  on public.k_personality_readings (share_enabled)
  where share_enabled = true;

-- ── 3. updated_at 자동 갱신 트리거 ──────────────────────────────────────────
-- set_updated_at() 함수는 여러 테이블이 공유하므로 CREATE OR REPLACE 사용.

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger k_personality_readings_updated_at
  before update on public.k_personality_readings
  for each row execute function public.set_updated_at();

-- ── 4. RLS (Row Level Security) ───────────────────────────────────────────────

alter table public.k_personality_readings enable row level security;

-- SELECT: 본인 데이터 또는 share_enabled = true (공유 링크)
drop policy if exists "k_personality_readings_select" on public.k_personality_readings;
create policy "k_personality_readings_select"
  on public.k_personality_readings for select
  using (auth.uid() = user_id or share_enabled = true);

-- INSERT: 본인만
drop policy if exists "k_personality_readings_insert" on public.k_personality_readings;
create policy "k_personality_readings_insert"
  on public.k_personality_readings for insert
  with check (auth.uid() = user_id);

-- UPDATE: 본인만
drop policy if exists "k_personality_readings_update" on public.k_personality_readings;
create policy "k_personality_readings_update"
  on public.k_personality_readings for update
  using (auth.uid() = user_id);

-- DELETE: 본인만
drop policy if exists "k_personality_readings_delete" on public.k_personality_readings;
create policy "k_personality_readings_delete"
  on public.k_personality_readings for delete
  using (auth.uid() = user_id);

-- ── 5. Service Role 접근 허용 ────────────────────────────────────────────────
-- Edge Function은 supabase_service_role로 실행되므로 RLS 우회 가능.
-- (Supabase 기본 동작: service role은 RLS bypass)
-- 별도 정책 불필요 — 메모용 주석.
