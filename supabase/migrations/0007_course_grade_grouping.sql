-- Vista del alumno / Mis cursos: agrupación por etapa y grado
--
-- 1. Nuevas columnas en courses: grade_category ('primaria'|'secundaria')
--    y grade_number (1-6). Nulleables para no romper cursos existentes.
-- 2. Relleno automático a partir del título
--    ("1ro de primaria" -> primaria/1, "2do de Secundaria" -> secundaria/2).
--
-- Aplicar con: supabase db push  (o pegar en el SQL editor de Supabase)

alter table courses
  add column if not exists grade_category text
    check (grade_category in ('primaria', 'secundaria')),
  add column if not exists grade_number int
    check (grade_number between 1 and 6);

-- Relleno para cursos ya existentes (solo los que aún no tienen etapa)
update courses
set grade_category = m[2],
    grade_number = m[1]::int
from (
  select id,
         regexp_match(
           lower(title),
           '(\d+)\s*(?:ro|do|to|er)?\s*de\s*(primaria|secundaria)'
         ) as m
  from courses
  where grade_category is null
) s
where courses.id = s.id
  and s.m is not null;
