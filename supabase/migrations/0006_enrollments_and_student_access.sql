-- Módulo 4: vista del alumno
--
-- 1. Nueva tabla course_enrollments (inscripciones de alumnos a cursos).
-- 2. Políticas RLS para que los alumnos puedan ver cursos publicados,
--    sus temas y contenidos, e inscribirse/cancelar su inscripción.
--
-- Aplicar con: supabase db push  (o pegar en el SQL editor de Supabase)

-- ---------------------------------------------------------------------------
-- 1. Tabla de inscripciones
-- ---------------------------------------------------------------------------

create table if not exists course_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (course_id, student_id)
);

alter table course_enrollments enable row level security;

-- El proyecto tiene desmarcado "exponer automáticamente nuevas tablas",
-- así que cada tabla nueva necesita sus grants explícitos.
grant select, insert, delete on table course_enrollments to authenticated;

-- El estudiante ve sus propias inscripciones
create policy "estudiante_lee_sus_inscripciones"
on course_enrollments for select
using (student_id = auth.uid());

-- El estudiante se inscribe solo en cursos publicados
create policy "estudiante_se_inscribe_en_publicados"
on course_enrollments for insert
with check (
  student_id = auth.uid()
  and exists (
    select 1 from courses c
    where c.id = course_enrollments.course_id
      and c.status = 'publicado'
  )
);

-- El estudiante puede cancelar su propia inscripción
create policy "estudiante_cancela_su_inscripcion"
on course_enrollments for delete
using (student_id = auth.uid());

-- El instructor (y el admin) ven las inscripciones de sus cursos
create policy "instructor_lee_inscripciones_de_sus_cursos"
on course_enrollments for select
using (
  exists (
    select 1 from courses c
    where c.id = course_enrollments.course_id
      and (c.instructor_id = auth.uid() or public.is_admin())
  )
);

-- ---------------------------------------------------------------------------
-- 2. Acceso de lectura a cursos publicados (catálogo del alumno)
-- ---------------------------------------------------------------------------

-- Cursos publicados: visibles para cualquier usuario autenticado.
-- (Las políticas existentes siguen restringiendo borradores y revisiones.)
create policy "cualquiera_lee_cursos_publicados"
on courses for select
using (status = 'publicado');

-- Temas de cursos publicados: visibles para cualquier usuario autenticado
create policy "cualquiera_lee_temas_de_cursos_publicados"
on course_topics for select
using (
  exists (
    select 1 from courses c
    where c.id = course_topics.course_id
      and c.status = 'publicado'
  )
);

-- Contenido de temas de cursos publicados.
-- Nota: la tabla topic_content se creó fuera de las migraciones (SQL editor),
-- así que esta política solo se crea si todavía no existe.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'topic_content'
      and policyname = 'cualquiera_lee_contenido_de_cursos_publicados'
  ) then
    create policy "cualquiera_lee_contenido_de_cursos_publicados"
    on topic_content for select
    using (
      exists (
        select 1 from course_topics t
        join courses c on c.id = t.course_id
        where t.id = topic_content.topic_id
          and c.status = 'publicado'
      )
    );
  end if;
end $$;

-- Storage: permitir generar URLs firmadas de archivos de cursos publicados.
-- (Si ya existe una política más permisiva, esta no estorba: las políticas
-- son permisivas y se evalúan con OR.)
create policy "alumno_lee_archivos_de_cursos_publicados"
on storage.objects for select
using (
  bucket_id = 'topic-content'
  and (
    public.is_admin()
    or exists (
      select 1 from course_topics t
      join courses c on c.id = t.course_id
      where c.status = 'publicado'
        and (
          name like 'original/' || t.id || '/%'
          or name like 'pdf/' || t.id || '/%'
        )
    )
  )
);

-- Perfiles de instructores visibles para mostrar su nombre en el catálogo
create policy "cualquiera_lee_perfiles_de_instructores"
on profiles for select
using (role = 'instructor');
