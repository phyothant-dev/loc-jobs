-- CV / Resume upload
-- Adds cv_url + cv_name to users, creates a public 'cvs' storage bucket

alter table public.users add column cv_url text;
alter table public.users add column cv_name text;

-- Storage bucket for CVs (public read, owner upload/update/delete)
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', true)
on conflict (id) do nothing;

create policy "Public read cvs"
  on storage.objects for select
  using (bucket_id = 'cvs');

create policy "Users can upload their own cv"
  on storage.objects for insert
  with check (
    bucket_id = 'cvs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own cv"
  on storage.objects for update
  using (
    bucket_id = 'cvs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own cv"
  on storage.objects for delete
  using (
    bucket_id = 'cvs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
