# Acceso directo para alumnos aprobados (06/10/2026)

## Qué cambia
Al aprobar una solicitud la función ahora:
1. **Crea la cuenta del alumno automáticamente** (correo confirmado, sin que
   él tenga que registrarse).
2. **Lo inscribe directamente** en el curso.
3. Genera un **enlace mágico de acceso directo** (magic link) que lo deja
   logueado y lo lleva a Mis cursos.
4. El correo y el WhatsApp llevan ese enlace: el alumno entra con un clic,
   sin formularios.

Si el enlace vence, el alumno entra a /login con su correo y usa
"¿Olvidaste tu contraseña?" para definir su clave.

## Pasos
1. **Supabase → Authentication → URL Configuration → Redirect URLs**:
   agrega `https://academia-virtual.netlify.app/**`
   (sin esto el enlace mágico no redirige bien).
2. Copia los 2 archivos en tu proyecto (sobrescribir).
3. `npx supabase functions deploy aprobar-solicitud`
4. Commit + push (para el mensaje actualizado de la página de inscripción).
5. Prueba: aprueba una solicitud con TU correo y TU número → abre el enlace
   → debes entrar directo a Mis cursos con el curso habilitado.

## WhatsApp: plantilla actualizada
La plantilla `acceso_aprobado` ahora lleva el ENLACE como tercer parámetro.
Cuerpo exacto:

  Hola {{1}}, tu acceso al curso "{{2}}" en Academia Virtual fue aprobado. Entra directamente aquí: {{3}}

(Categoría: Utilidad, Idioma: Español)
