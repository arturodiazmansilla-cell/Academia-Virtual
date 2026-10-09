-- 0011: gestión de alumnos + acceso solo con habilitación del admin
--
-- 1. course_enrollments.is_active: permite DESACTIVAR un alumno en un curso
--    sin borrar su inscripción.
-- 2. Se elimina la auto-inscripción directa del alumno: el acceso lo otorga
--    solo el administrador (flujo de solicitudes) o la función de aprobación.
-- 3. El instructor/admin puede ver, desactivar/reactivar y desinscribir
--    alumnos de sus cursos (nueva página "Alumnos").
-- 4. Temas, contenidos y archivos: solo visibles con inscripción ACTIVA
--    (antes bastaba con que el curso estuviera publicado).
--
-- Aplicar con: supabase db push (o pegar en el SQL editor de Supabase)

-- ---------------------------------------------------------------------------
-- 1. Columna is_active
-- ---------------------------------------------------------------------------
alter table course_enrollments
  add column if not exists is_active boolean not null default true;

grant update on table course_enrollments to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Fin de la auto-inscripción directa
-- ---------------------------------------------------------------------------
drop policy if exists "estudiante_se_inscribe_en_publicados" on course_enrollments;

-- ---------------------------------------------------------------------------
-- 3. Gestión de inscripciones por instructor/admin
-- ---------------------------------------------------------------------------
drop policy if exists "instructor_gestiona_inscripciones" on course_enrollments;
create policy "instructor_gestiona_inscripciones"
on course_enrollments for update
using (
  exists (
    select 1 from courses c
    where c.id = course_enrollments.course_id
      and (c.instructor_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "instructor_elimina_inscripciones" on course_enrollments;
create policy "instructor_elimina_inscripciones"
on course_enrollments for delete
using (
  exists (
    select 1 from courses c
    where c.id = course_enrollments.course_id
      and (c.instructor_id = auth.uid() or public.is_admin())
  )
);

-- El instructor ve el perfil (nombre/correo) de los alumnos de sus cursos
drop policy if exists "instructor_lee_perfiles_de_sus_alumnos" on profiles;
create policy "instructor_lee_perfiles_de_sus_alumnos"
on profiles for select
using (
  public.is_admin()
  or exists (
    select 1 from course_enrollments e
    join courses c on c.id = e.course_id
    where e.student_id = profiles.id
      and c.instructor_id = auth.uid()
  )
);

-- El alumno ve sus propias solicitudes (para mostrar "Solicitud pendiente")
drop policy if exists "alumno_lee_sus_solicitudes" on enrollment_requests;
create policy "alumno_lee_sus_solicitudes"
on enrollment_requests for select
using (lower(email) = lower(auth.jwt() ->> 'email'));

-- ---------------------------------------------------------------------------
-- 4. Contenido solo con inscripción activa
-- ---------------------------------------------------------------------------
drop policy if exists "cualquiera_lee_temas_de_cursos_publicados" on course_topics;
create policy "alumno_lee_temas_de_cursos_habilitados"
on course_topics for select
using (
  exists (
    select 1 from courses c
    where c.id = course_topics.course_id
      and c.status = 'publicado'
      and (
        public.is_admin()
        or c.instructor_id = auth.uid()
        or exists (
          select 1 from course_enrollments e
          where e.course_id = c.id
            and e.student_id = auth.uid()
            and e.is_active = true
        )
      )
  )
);

do $$
begin
  drop policy if exists "cualquiera_lee_contenido_de_cursos_publicados" on topic_content;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'topic_content'
      and policyname = 'alumno_lee_contenido_de_cursos_habilitados'
  ) then
    create policy "alumno_lee_contenido_de_cursos_habilitados"
    on topic_content for select
    using (
      exists (
        select 1 from course_topics t
        join courses c on c.id = t.course_id
        where t.id = topic_content.topic_id
          and c.status = 'publicado'
          and (
            public.is_admin()
            or c.instructor_id = auth.uid()
            or exists (
              select 1 from course_enrollments e
              where e.course_id = c.id
                and e.student_id = auth.uid()
                and e.is_active = true
            )
          )
      )
    );
  end if;
end $$;

drop policy if exists "alumno_lee_archivos_de_cursos_publicados" on storage.objects;
create policy "alumno_lee_archivos_de_cursos_habilitados"
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
          c.instructor_id = auth.uid()
          or exists (
            select 1 from course_enrollments e
            where e.course_id = c.id
              and e.student_id = auth.uid()
              and e.is_active = true
          )
        )
        and (
          name like 'original/' || t.id || '/%'
          or name like 'pdf/' || t.id || '/%'
        )
    )
  )
);
