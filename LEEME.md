# "Catálogo" -> "Cursos" + admin ve todos los cursos (08/10/2026)

## Qué cambia (solo frontend, sin base de datos)
- En el menú lateral "Catálogo" ahora dice **Cursos**.
- Al entrar a Cursos:
  - El **alumno** ve solo los cursos publicados (como antes).
  - El **administrador** ve **todos** los cursos (publicados y borradores),
    con etiqueta de estado (Borrador/Publicado/...) y botones Editar y Ver.
- Textos "catálogo" en la app ahora dicen "Cursos".

## Pasos
1. Extrae este zip DENTRO de tu proyecto:
   D:\OneDrive\Escritorio\Sistemas\academia-virtual
   (acepta sobrescribir)
2. Comandos git (uno por uno):
   git add .
   git commit -m "Menu Cursos: admin ve todos los cursos"
   git push
