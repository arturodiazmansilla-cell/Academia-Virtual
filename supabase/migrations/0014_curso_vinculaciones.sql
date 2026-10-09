-- 0014_curso_vinculaciones.sql
--
-- Vinculación ligera con el Sistema Académico del colegio (proyecto
-- Supabase separado). Cada curso virtual puede ligarse a un curso,
-- paralelo y materia del colegio para ver sus notas y asistencia
-- desde Academia Virtual (vía la Edge Function academico-proxy).

create table if not exists curso_vinculaciones (
  virtual_course_id uuid primary key references courses(id) on delete cascade,
  colegio_curso_id uuid not null,
  colegio_curso_nombre text not null default '',
  colegio_paralelo_id uuid,
  colegio_paralelo_nombre text not null default '',
  colegio_materia_id uuid,
  colegio_materia_nombre text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table curso_vinculaciones enable row level security;

drop policy if exists "staff_lee_vinculaciones" on curso_vinculaciones;
create policy "staff_lee_vinculaciones"
on curso_vinculaciones for select
using (
  public.is_admin()
  or exists (
    select 1 from courses c
    where c.id = curso_vinculaciones.virtual_course_id
      and c.instructor_id = auth.uid()
  )
);

drop policy if exists "staff_gestiona_vinculaciones" on curso_vinculaciones;
create policy "staff_gestiona_vinculaciones"
on curso_vinculaciones for all
using (
  public.is_admin()
  or exists (
    select 1 from courses c
    where c.id = curso_vinculaciones.virtual_course_id
      and c.instructor_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from courses c
    where c.id = curso_vinculaciones.virtual_course_id
      and c.instructor_id = auth.uid()
  )
);
