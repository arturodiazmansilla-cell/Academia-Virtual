# Módulo 4 — Vista del alumno (Academia Virtual)

Fecha: 06/10/2026
Contenido: archivos nuevos y modificados del módulo 4, listos para copiar
sobre tu proyecto local.

## Archivos incluidos

Nuevos:
- src/features/student/hooks/usePublishedCourses.ts
- src/features/student/hooks/useEnrollments.ts
- src/features/student/pages/CatalogPage.tsx
- src/features/student/pages/MyCoursesPage.tsx
- src/features/student/pages/StudentCoursePage.tsx
- src/vite-env.d.ts
- supabase/migrations/0006_enrollments_and_student_access.sql

Modificados (sobrescribir los existentes):
- src/app/router.tsx
- src/app/AppShell.tsx
- src/app/HomePage.tsx
- src/shared/types/database.types.ts
- Contexto-del-proyecto.md

No hay dependencias nuevas: package.json no cambió.

## Paso 1 — Copiar los archivos

Copia el contenido de este paquete en la raíz de tu proyecto,
manteniendo la estructura de carpetas. Los archivos modificados
reemplazan a los que ya tienes.

## Paso 2 — Instalar dependencias (si hace falta)

```bash
npm install
```

## Paso 3 — Ejecutar la migración en Supabase (UNA sola vez)

1. Abre tu proyecto en el dashboard de Supabase.
2. Ve a SQL Editor → New query.
3. Pega TODO el contenido de
   `supabase/migrations/0006_enrollments_and_student_access.sql`.
4. Presiona Run.

Qué hace: crea la tabla `course_enrollments` y las políticas RLS para que
los alumnos vean cursos publicados, se inscriban y cancelen su inscripción.

Verificación: en Table Editor debe aparecer la tabla `course_enrollments`;
en Authentication → Policies, las políticas nuevas sobre `courses`,
`course_topics`, `course_enrollments`, `profiles` y `storage.objects`.

Si al ejecutar dice `already exists` en alguna política, significa que esa
parte ya estaba aplicada: puedes ignorar ese error puntual.

IMPORTANTE para el equipo: que una sola persona ejecute la migración.
Después, suban los cambios con git:

```bash
git add .
git commit -m "Agrega módulo 4: vista del alumno (catálogo, mis cursos, aprendizaje)"
git push
```

## Paso 4 — Probar

```bash
npm run dev
```

1. Como instructor/admin: abre un curso y cambia su estado a **publicado**
   (el campo `status` ya existe en el modelo).
2. Como alumno: entra a **Catálogo**, inscríbete con *Inscribirme*,
   abre **Mis cursos** y entra al curso para ver temas y contenidos.
3. Verifica que un alumno NO inscrito no pueda ver el contenido
   (lo redirige al catálogo).

## Notas

- `database.types.ts` incluye una corrección necesaria: la versión anterior
  no cumplía el contrato de `@supabase/supabase-js` 2.117 y `npm run build`
  fallaba. Con este archivo, `npx tsc -b` y `npx vite build` pasan limpio.
- La tabla `topic_content` se creó fuera de las migraciones (SQL editor);
  la migración 0006 lo contempla y no la duplica.
- La inscripción es abierta (sin aprobación del instructor). El futuro
  panel de autorización (módulo 6) podrá restringirla.
