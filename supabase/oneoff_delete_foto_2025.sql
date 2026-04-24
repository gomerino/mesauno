-- one-off: eliminar una foto (fila en evento_fotos + objeto en bucket fotos_eventos).
-- Supabase → SQL Editor → pegar y ejecutar.
-- Ruta: evento_id / nombre-de-archivo (sin slash inicial, igual que en evento_fotos).

-- 1) Registro en el álbum
delete from public.evento_fotos
where storage_path = 'eefb9bc2-8f18-4ab9-b548-9fc85a0d4740/a73c5fdd-968b-401c-afb0-3e21a362d06e.jpg'
returning id, evento_id, storage_path;

-- 2) Archivo en Storage
delete from storage.objects
where bucket_id = 'fotos_eventos'
  and name = 'eefb9bc2-8f18-4ab9-b548-9fc85a0d4740/a73c5fdd-968b-401c-afb0-3e21a362d06e.jpg'
returning id, bucket_id, name;
