-- Migration: face-insight-uploads storage bucket
-- Run via: supabase db push  OR  Supabase Dashboard > SQL Editor

-- 1. Create storage bucket (idempotent)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'face-insight-uploads',
  'face-insight-uploads',
  true,
  10485760,                      -- 10 MB per file
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 2. RLS: authenticated users may upload to their own folder only
create policy "Users upload own face images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'face-insight-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. RLS: public read (URLs are served publicly via getPublicUrl)
create policy "Public read face images"
  on storage.objects for select
  to public
  using (bucket_id = 'face-insight-uploads');
