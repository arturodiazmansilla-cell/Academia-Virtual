-- 0013_course_published_at.sql
--
-- Fecha de publicación del curso: sirve para resaltar como "Nuevo"
-- los cursos publicados en la última semana (verde) y en amarillo
-- los que ya pasaron la semana.

alter table courses
  add column if not exists published_at timestamptz;

-- Relleno inicial: los cursos ya publicados toman su última
-- actualización como fecha aproximada de publicación.
update courses
  set published_at = updated_at
  where status = 'publicado' and published_at is null;
