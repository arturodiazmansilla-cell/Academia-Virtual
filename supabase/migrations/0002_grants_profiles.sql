-- Necesario porque el proyecto se creó con "Exponer automáticamente nuevas
-- tablas" desmarcado: las políticas RLS ya filtran filas correctamente, pero
-- sin estos GRANT los roles de la API (anon, authenticated) no tienen ni
-- siquiera permiso para intentar la consulta.

grant usage on schema public to authenticated, anon;
grant select, insert, update on table profiles to authenticated;
