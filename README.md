# Academia Virtual — Módulo 1: Auth + Perfiles + Roles

Este es el primer módulo del proyecto, siguiendo el orden acordado:
1. **Auth y perfiles con roles** ← estás aquí
2. CRUD de cursos y temas de avance
3. Carga de contenido (video/Word/PowerPoint)
4. Vista del alumno
5. Actividades dinámicas y progreso
6. Panel de autorización de accesos
7. Flujo de publicación/revisión de terceros

## Decisión: visor de Word/PowerPoint

Se investigó la opción técnica antes de definir el esquema de `topic_content`.
Conclusión (detalle completo en la conversación con Claude):

- **Recomendado para producción**: convertir DOCX/PPTX a PDF en el momento de
  la subida (Edge Function o servicio con LibreOffice headless) y mostrar el
  PDF con un visor tipo `pdf.js`, sirviendo el archivo desde una URL firmada
  de Supabase Storage. Mantiene los archivos privados y no depende de
  servicios externos para renderizar.
- **Alternativa rápida para prototipo**: Microsoft Office Online Viewer
  (`view.officeapps.live.com`) — funciona sin conversión, pero exige que el
  archivo sea accesible por una URL pública (no privada), es un servicio no
  documentado oficialmente por Microsoft para este uso, y los archivos pasan
  por servidores de Microsoft.
- **Alternativa comercial**: SDKs de renderizado client-side (p. ej. Nutrient
  Web SDK) que muestran Word/Excel/PPT sin conversión ni servidor propio,
  con costo de licencia.

El campo `storage_path` en `topic_content` queda genérico para soportar
cualquiera de estas opciones sin cambiar el esquema.

## Cómo correr este módulo en local

```bash
npm install
cp .env.example .env
# completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env
```

En tu proyecto de Supabase (nuevo, desde cero):

1. Ve al SQL editor y ejecuta el contenido de
   `supabase/migrations/0001_profiles_and_roles.sql`.
2. Crea tu primer usuario admin: regístrate normalmente desde la app
   (quedará como `alumno` por defecto) y luego, en el SQL editor, ejecuta:
   ```sql
   update profiles set role = 'admin' where id = 'UUID-DE-TU-USUARIO';
   ```
   (el uuid lo ves en Authentication → Users en el dashboard de Supabase).

Luego:

```bash
npm run dev
```

Abre `http://localhost:5173`, regístrate o inicia sesión. La página de
inicio muestra tu nombre y tu rol, confirmando que el flujo de auth + perfil
funciona de punta a punta.

## Pendiente antes de cerrar este módulo (ver nota en la migración SQL)

La política RLS `usuario_actualiza_su_perfil` permite que cualquier usuario
edite su propio `role`. Antes de pasar al módulo 2 conviene cerrarlo con una
función `security definer` o un trigger que solo permita cambiar `role`/
`status` a un admin.

## Siguiente paso

Con esto funcionando, seguimos con el **módulo 2: CRUD de cursos y temas de
avance**, que ya puede apoyarse en `profile.role` para distinguir vistas de
admin/instructor/alumno.
