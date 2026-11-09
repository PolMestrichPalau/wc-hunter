-- =====================================================================
-- WC HUNTER · Almacenamiento de fotos (ejecutar DESPUES de schema.sql)
-- Bucket publico de solo lectura; cada usuario solo puede subir a su carpeta <uid>/
-- (el check-in valida ademas que photo_path empiece por su uid).
-- Limites: 2 MB por foto, solo JPEG/PNG/WebP.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "photos_insert_own_folder" on storage.objects;
create policy "photos_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
-- Lectura: al ser bucket publico, las URLs publicas funcionan sin politica de select.
