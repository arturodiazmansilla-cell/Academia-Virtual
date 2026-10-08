-- 0010: nuevas categorías de curso para el menú por categorías
-- Extiende grade_category con 'tecnico' (Cursos Técnicos) y 'avanzado' (Avanzados).
-- Aplicar con: supabase db push (o pegar en el SQL editor de Supabase)

alter table courses drop constraint if exists courses_grade_category_check;
alter table courses
  add constraint courses_grade_category_check
  check (grade_category in ('primaria', 'secundaria', 'tecnico', 'avanzado'));

-- Relleno automático para cursos existentes sin etapa cuyo título lo indique
update courses
set grade_category = 'tecnico'
where grade_category is null
  and (lower(title) like '%tecnico%' or lower(title) like '%técnico%');

update courses
set grade_category = 'avanzado'
where grade_category is null
  and lower(title) like '%avanzado%';
