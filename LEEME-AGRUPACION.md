# Agrupación de cursos por etapa y grado (Academia Virtual)

Fecha: 06/10/2026
Contenido: archivos nuevos y modificados para agrupar "Mis cursos" en
bloques Primaria / Secundaria, ordenados por grado ascendente (1°, 2°…).

## Archivos incluidos

Nuevo:
- supabase/migrations/0007_course_grade_grouping.sql

Modificados (sobrescribir los existentes):
- src/shared/types/database.types.ts
- src/features/courses/hooks/useCourses.ts
- src/features/courses/hooks/useCourse.ts
- src/features/courses/pages/CourseListPage.tsx
- src/features/courses/pages/CourseEditorPage.tsx
- src/features/courses/components/CourseCard.tsx
- Contexto-del-proyecto.md

## Paso 1 — Copiar los archivos

Copia el contenido de este paquete en la raíz de tu proyecto,
manteniendo la estructura de carpetas.

## Paso 2 — Ejecutar la migración en Supabase (UNA sola vez)

1. Dashboard de Supabase → SQL Editor → New query.
2. Pega TODO el contenido de
   `supabase/migrations/0007_course_grade_grouping.sql`.
3. Presiona Run.

Qué hace:
- Agrega las columnas `grade_category` ('primaria'|'secundaria') y
  `grade_number` (1-6) a la tabla `courses`.
- Rellena automáticamente esos campos en tus cursos existentes leyendo
  el título ("1ro de primaria" → primaria/1, "2do de Secundaria" →
  secundaria/2, "Word 2do Secundaria" → secundaria/2, etc.).

Verificación: en Table Editor, la tabla `courses` debe mostrar las dos
columnas con valores en tus 5 cursos. Si algún curso quedó en
"Sin clasificar", abre ese curso y usa "Editar datos del curso" para
asignarle etapa y grado.

IMPORTANTE para el equipo: que una sola persona ejecute la migración.
Después:

```bash
git add .
git commit -m "Agrupa Mis cursos por etapa y grado (Primaria/Secundaria)"
git push
```

## Paso 3 — Probar

```bash
npm run dev
```

1. Abre "Mis cursos": verás los bloques **Primaria** (1°, 2°) y
   **Secundaria** (2°, 4°), cada uno ordenado por grado ascendente.
2. Crea un curso nuevo: el formulario ahora pide Etapa educativa y Grado.
3. Edita un curso existente para corregir su etapa/grado si hizo falta.

## Notas

- Si más adelante quieren un curso sin etapa/grado, los selectores se
  pueden volver opcionales; esos cursos caen en el bloque "Sin clasificar".
- El catálogo del alumno todavía lista sin agrupar; se puede aplicar el
  mismo patrón cuando quieran.
