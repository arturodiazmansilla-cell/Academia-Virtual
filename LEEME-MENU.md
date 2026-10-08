# Nuevo menú lateral por categorías (07/10/2026)

Basado en el mockup: sidebar oscuro redondeado con avatar, Catálogo
expandible (Educación Secundaria/Primaria con grados, Cursos Técnicos,
Avanzados), breadcrumb en el catálogo, tarjetas con etiqueta y página Soporte.

## Pasos
1. **Supabase → SQL Editor**: ejecuta
   `supabase/migrations/0010_course_categories.sql`
   (agrega las categorías "tecnico" y "avanzado").
2. Copia TODOS los archivos del zip en tu proyecto (respetando carpetas).
3. Comandos git (uno por uno):
   git add .
   git commit -m "Nuevo menu lateral por categorias"
   git push
4. Netlify redespliega solo.

## Notas
- El árbol del Catálogo muestra solo categorías y grados con cursos publicados.
- En "Crear/editar curso" la Etapa ahora tiene: Primaria, Secundaria,
  Curso técnico, Avanzado. El Grado solo aplica a Primaria/Secundaria.
- Soporte trae preguntas frecuentes; para el botón de WhatsApp edita
  SUPPORT_WHATSAPP en src/features/support/pages/SoportePage.tsx
  (formato internacional, ej. 59170000000). Avísame el número y lo dejo puesto.
