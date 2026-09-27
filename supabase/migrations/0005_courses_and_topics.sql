-- Módulo 2: cursos y temas de avance

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  subject text not null,
  level text,
  instructor_id uuid references profiles(id),
  status text not null default 'borrador' check (status in ('borrador','en_revision','publicado','rechazado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists course_topics (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  description text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

alter table courses enable row level security;
alter table course_topics enable row level security;

-- Reutiliza la función public.is_admin() creada en 0004_fix_admin_policy_recursion.sql

-- courses: el instructor ve/edita solo lo suyo, el admin ve/edita todo.
-- (El acceso de alumnos a cursos publicados se agrega en el módulo de
-- inscripciones, cuando exista course_enrollments.)
create policy "instructor_lee_sus_cursos"
on courses for select
using (instructor_id = auth.uid() or public.is_admin());

create policy "instructor_crea_cursos"
on courses for insert
with check (instructor_id = auth.uid() or public.is_admin());

create policy "instructor_edita_sus_cursos"
on courses for update
using (instructor_id = auth.uid() or public.is_admin());

create policy "instructor_borra_sus_cursos"
on courses for delete
using (instructor_id = auth.uid() or public.is_admin());

-- course_topics: mismo dueño que el curso padre
create policy "instructor_lee_temas_de_sus_cursos"
on course_topics for select
using (
  exists (
    select 1 from courses c
    where c.id = course_topics.course_id
      and (c.instructor_id = auth.uid() or public.is_admin())
  )
);

create policy "instructor_crea_temas_en_sus_cursos"
on course_topics for insert
with check (
  exists (
    select 1 from courses c
    where c.id = course_topics.course_id
      and (c.instructor_id = auth.uid() or public.is_admin())
  )
);

create policy "instructor_edita_temas_de_sus_cursos"
on course_topics for update
using (
  exists (
    select 1 from courses c
    where c.id = course_topics.course_id
      and (c.instructor_id = auth.uid() or public.is_admin())
  )
);

create policy "instructor_borra_temas_de_sus_cursos"
on course_topics for delete
using (
  exists (
    select 1 from courses c
    where c.id = course_topics.course_id
      and (c.instructor_id = auth.uid() or public.is_admin())
  )
);

-- Grants: recuerda que el proyecto tiene desmarcado "exponer automáticamente
-- nuevas tablas", así que cada tabla nueva necesita esto explícitamente.
grant select, insert, update, delete on table courses to authenticated;
grant select, insert, update, delete on table course_topics to authenticated;
