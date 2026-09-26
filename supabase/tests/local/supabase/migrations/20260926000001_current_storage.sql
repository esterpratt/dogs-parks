-- Reproduces the current Storage bucket posture without production objects.
insert into storage.buckets (id, name, public)
values
  ('users', 'users', true),
  ('parks', 'parks', true),
  ('dogs', 'dogs', false)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

-- These intentionally permissive policies characterize the current live baseline.
-- Feature migrations must replace the dogs policies before shared ownership ships.
create policy "all users can select 1u7jr_0"
on storage.objects for select
using (bucket_id = 'dogs');

create policy "only auth can insert update delete 1u7jr_0"
on storage.objects for insert to authenticated
with check (bucket_id = 'dogs');

create policy "only auth can insert update delete 1u7jr_1"
on storage.objects for update to authenticated
using (bucket_id = 'dogs');

create policy "only auth can insert update delete 1u7jr_3"
on storage.objects for delete to authenticated
using (bucket_id = 'dogs');

create policy "allow see parks to all 1rdbd5_0"
on storage.objects for select
using (bucket_id = 'parks');

create policy "allow update parks to auth users 1rdbd5_0"
on storage.objects for insert to authenticated
with check (bucket_id = 'parks');

create policy "allow update parks to auth users 1rdbd5_1"
on storage.objects for update to authenticated
using (bucket_id = 'parks');

create policy "show photos 1ufimg_0"
on storage.objects for select
using (bucket_id = 'users');

create policy "upload photos 1ufimg_0"
on storage.objects for insert to authenticated
with check (bucket_id = 'users');

create policy "upload photos 1ufimg_1"
on storage.objects for update to authenticated
using (bucket_id = 'users');

create policy "only users can delete their own folder 1ufimg_0"
on storage.objects for delete to authenticated
using (
  bucket_id = 'users'
  and (select auth.uid()::text) = (storage.foldername(name))[1]
);
