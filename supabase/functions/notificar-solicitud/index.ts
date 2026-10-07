// supabase/functions/notificar-solicitud/index.ts
//
// Se invoca desde el formulario público justo después de guardar una
// solicitud de acceso. Envía un correo al administrador con los datos del
// alumno y un link para agendar el recordatorio en Google Calendar.
//
// Variables de entorno (supabase secrets set):
//   RESEND_API_KEY -> API key de Resend (https://resend.com)
//   ADMIN_EMAIL    -> correo del administrador que aprueba accesos
//   FROM_EMAIL     -> remitente verificado en Resend (por defecto ADMIN_EMAIL)

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getServiceKey(): string {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!raw) {
    throw new Error("Falta la variable SUPABASE_SECRET_KEYS.");
  }
  const keys = JSON.parse(raw);
  const key = keys?.default;
  if (!key) {
    throw new Error("SUPABASE_SECRET_KEYS no tiene una clave 'default'.");
  }
  return key;
}

// Link "Agregar a Google Calendar" para mañana 09:00 (La Paz, UTC-4)
function calendarReminderUrl(title: string, details: string): string {
  const start = new Date(Date.now() + 24 * 3600 * 1000);
  start.setUTCHours(13, 0, 0, 0); // 09:00 en La Paz
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details,
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error("Falta RESEND_API_KEY.");
  }
  const adminEmail = Deno.env.get("ADMIN_EMAIL");
  const from = Deno.env.get("FROM_EMAIL") || adminEmail || "notificaciones@academia.virtual";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Academia Virtual <${from}>`,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend respondió ${res.status}: ${await res.text()}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { request_id } = await req.json();
    if (!request_id) {
      return new Response(JSON.stringify({ error: "Falta request_id" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, getServiceKey());

    const { data: solicitud, error } = await supabase
      .from("enrollment_requests")
      .select("*, courses(title)")
      .eq("id", request_id)
      .single();

    if (error || !solicitud) {
      return new Response(JSON.stringify({ error: "Solicitud no encontrada" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    if (!adminEmail) {
      return new Response(
        JSON.stringify({ ok: true, info: "Sin ADMIN_EMAIL: no se envió correo." }),
        { headers: corsHeaders }
      );
    }

    const courseTitle =
      (solicitud.courses as { title?: string } | null)?.title ?? "curso";
    const nombre = `${solicitud.first_name} ${solicitud.last_name}`;

    const calUrl = calendarReminderUrl(
      `Habilitar acceso: ${nombre} (${courseTitle})`,
      `Solicitud de acceso pendiente.\nAlumno: ${nombre}\nCorreo: ${solicitud.email}\nCelular: ${solicitud.phone}\nCurso: ${courseTitle}\n\nRevisar en el panel de Solicitudes de Academia Virtual.`
    );

    const html = `
      <h2>Nueva solicitud de acceso</h2>
      <p>Un alumno quiere entrar a uno de tus cursos:</p>
      <ul>
        <li><strong>Alumno:</strong> ${nombre}</li>
        <li><strong>Correo:</strong> ${solicitud.email}</li>
        <li><strong>Celular:</strong> ${solicitud.phone}</li>
        <li><strong>Curso:</strong> ${courseTitle}</li>
        <li><strong>Fecha:</strong> ${new Date(solicitud.created_at).toLocaleString("es-BO")}</li>
      </ul>
      <p>
        <a href="${calUrl}" style="display:inline-block;padding:10px 18px;background:#5b2333;color:#fff;text-decoration:none;border-radius:6px;">
          Agendar recordatorio en Google Calendar
        </a>
      </p>
      <p>Revisa y habilita al alumno en el panel de <strong>Solicitudes</strong> de Academia Virtual.</p>
    `;

    await sendEmail(adminEmail, `Nueva solicitud de acceso: ${nombre} — ${courseTitle}`, html);

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
