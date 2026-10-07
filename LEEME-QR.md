# Publicar curso + solicitudes de acceso con link/QR (Academia Virtual)

Fecha: 06/10/2026

## Qué incluye

1. Botón **"Publicar curso"** en el editor del curso (con confirmación).
   Al publicar se genera el **link de inscripción** y un **QR**.
2. Página pública `/inscripcion/:courseId` (sin necesidad de cuenta):
   el alumno deja nombre, apellido, correo y celular.
3. Panel **"Solicitudes"** (instructor/admin) para aprobar o rechazar.
4. Al recibir una solicitud: **correo al administrador** + link para
   agendar el **recordatorio en Google Calendar**.
5. Al aprobar: **correo al alumno** (y **WhatsApp** a su celular, si se
   configura) avisando que ya puede entrar. Si el alumno ya tiene cuenta,
   queda inscrito de inmediato; si no, se inscribe solo al registrarse
   con el mismo correo.

## Archivos incluidos

Nuevos:
- supabase/migrations/0008_enrollment_requests.sql
- supabase/functions/notificar-solicitud/index.ts (+ deno.json, .npmrc)
- supabase/functions/aprobar-solicitud/index.ts (+ deno.json, .npmrc)
- src/features/enrollment/pages/EnrollmentPage.tsx
- src/features/requests/hooks/useEnrollmentRequests.ts
- src/features/requests/hooks/usePendingRequestsCount.ts
- src/features/requests/pages/RequestsPage.tsx

Modificados (sobrescribir):
- package.json y package-lock.json (nueva dependencia: qrcode.react)
- src/app/router.tsx
- src/app/AppShell.tsx
- src/features/courses/pages/CourseEditorPage.tsx
- src/shared/types/database.types.ts
- Contexto-del-proyecto.md

## Paso 1 — Copiar los archivos

Copia el contenido del paquete en la raíz del proyecto y luego:

```bash
npm install
```

## Paso 2 — Migración en Supabase (UNA sola vez, una sola persona)

Dashboard → SQL Editor → New query → pega TODO el contenido de
`supabase/migrations/0008_enrollment_requests.sql` → Run.

## Paso 3 — Correo (Resend, gratis)

1. Crea una cuenta en https://resend.com y genera una API Key.
2. En Resend, verifica tu correo como remitente (Domain o "Add sender").
3. Configura los secrets de las functions:

```bash
supabase secrets set RESEND_API_KEY="re_xxx" ADMIN_EMAIL="tu@correo.com" FROM_EMAIL="tu@correo.com" APP_URL="https://tu-app.netlify.app"
```

- `ADMIN_EMAIL`: a quién llega el aviso de nueva solicitud (tú).
- `FROM_EMAIL`: remitente verificado en Resend (puede ser el mismo).
- `APP_URL`: URL pública de tu app en Netlify (sale en el correo al alumno).

## Paso 4 — Desplegar las Edge Functions

```bash
supabase functions deploy notificar-solicitud
supabase functions deploy aprobar-solicitud
```

## Paso 5 — WhatsApp (opcional)

Requiere una cuenta de Meta WhatsApp Cloud API (gratis):

1. https://developers.facebook.com → crear app → agregar "WhatsApp".
2. Obtén el **token** y el **phone number ID** (número de prueba o el tuyo).
3. Configúralos:

```bash
supabase secrets set WHATSAPP_TOKEN="tu_token" WHATSAPP_PHONE_NUMBER_ID="tu_phone_number_id"
```

Nota: Meta exige plantillas aprobadas para mensajes iniciados por la
empresa; con el número de prueba funciona para tus propios números.
Si no configuras esto, el sistema igual envía el correo y omite WhatsApp.

## Paso 6 — Probar el flujo completo

```bash
npm run dev
```

1. Como instructor: abre un curso → **Publicar curso** → copia el link o
   muestra el QR.
2. Abre el link en una ventana de incógnito (sin sesión) y envía una
   solicitud de prueba.
3. Revisa que te llegue el correo con el botón de Google Calendar.
4. Como instructor: entra a **Solicitudes** → **Aprobar**.
5. Revisa que le llegue el correo al alumno (y WhatsApp si lo configuraste).
6. Crea una cuenta con el correo del alumno → debe aparecer en Mis cursos.

## Notas

- El recordatorio de Google Calendar llega como un botón dentro del
  correo ("Agendar recordatorio"): un clic lo crea en tu calendario para
  mañana 9:00 (hora La Paz). Así no hay que conectar tu cuenta de Google
  al servidor.
- Si `notificar-solicitud` no está desplegada o sin secrets, la solicitud
  igual se guarda; solo no llega el correo (no se bloquea al alumno).
- Commit sugerido:

```bash
git add .
git commit -m "Agrega publicación con link/QR y solicitudes de acceso con notificaciones"
git push
```
