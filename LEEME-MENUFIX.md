# Fix: el árbol del Catálogo ahora se refresca al navegar (07/10/2026)

## Problema
El menú cargaba los cursos publicados una sola vez al abrir la app. Si se
publicaba un curso después (p. ej. "1ro de primaria"), la categoría no
aparecía en el árbol hasta recargar la página con F5.

## Cambio
src/app/Sidebar.tsx: el árbol del Catálogo se vuelve a cargar cada vez que
cambias de página, así siempre muestra las categorías al día.

## Pasos
1. Copia el archivo en tu proyecto (sobrescribir).
2. Comandos git (uno por uno):
   git add .
   git commit -m "Refresca arbol del catalogo al navegar"
   git push
