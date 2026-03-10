-- Run this in Supabase SQL Editor for your project.
-- It creates/updates the complaint-images bucket and allows anon/authenticated uploads.

insert into storage.buckets (id, name, public)
values ('complaint-images', 'complaint-images', true)
on conflict (id) do update set public = true;

drop policy if exists "complaint_images_insert_anon_auth" on storage.objects;
create policy "complaint_images_insert_anon_auth"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'complaint-images');

drop policy if exists "complaint_images_select_public" on storage.objects;
create policy "complaint_images_select_public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'complaint-images');
