// supabase/functions/revocar-acceso/index.ts
//
// Revoca el acceso de un alumno ya aprobado:
// 1. Verifica que quien llama sea admin o instructor.
// 2. Elimina su inscripción al curso (pierde el acceso de inmediato).
// 3. Marca la solicitud como rechazada.
// La cuenta del usuario se conserva (puede tener otros cursos).

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const D = (...a: unknown[]) => console.log("[DIAG revocar]", ...a);

function pickFromParsed(parsed: unknown): string | null {
  if (typeof parsed === "string" && parsed) return parsed;
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const o = parsed as Record<string, unknown>;
    if (typeof o["default"] === "string" && o["default"]) return o["default"] as string;
    for (const v of Object.values(o)) {
      if (typeof v === "string" && v) return v;
    }
  }
  if (Array.isArray(parsed)) {
    for (const k of parsed) {
      if (k && typeof k === "object" && typeof (k as { api_key?: unknown }).api_key === "string") {
        const ak = (k as { api_key: string }).api_key;
        if (ak) return ak;
      }
    }
    if (typeof parsed[0] === "string" && parsed[0]) return parsed[0] as string;
  }
  return null;
}

function getServiceKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const key = pickFromParsed(JSON.parse(raw));
      if (key) return key;
    } catch {
      if (/^sb_secret_/.test(raw)) return raw;
    }
  }
  throw new Error("Sin clave de servicio utilizable");
}

function getPublicKey(): string {
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) return legacy;
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (raw) {
    try {
      const key = pickFromParsed(JSON.parse(raw));
      if (key) return key;
    } catch {
      /* noop */
    }
  }
  throw new Error("Sin clave pública utilizable");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    D("invocación recibida");
    const { request_id } = await req.json();
    if (!request_id) {
      return new Response(JSON.stringify({ error: "Falta request_id" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // --- Autenticación: solo admin o instructor ---
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, getPublicKey(), {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, getServiceKey(), {
      auth: { persistSession: false },
    });

    const { data: profile, error: errProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (errProfile || (profile?.role !== "admin" && profile?.role !== "instructor")) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { data: solicitud, error: errGet } = await supabase
      .from("enrollment_requests")
      .select("*")
      .eq("id", request_id)
      .single();
    if (errGet || !solicitud) {
      D("ERROR select:", JSON.stringify(errGet));
      return new Response(JSON.stringify({ error: "Solicitud no encontrada" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    if (solicitud.status !== "aprobado") {
      return new Response(
        JSON.stringify({ ok: true, info: `La solicitud ya estaba: ${solicitud.status}` }),
        { headers: corsHeaders }
      );
    }

    // 1. Quitar la inscripción (si el alumno tiene cuenta)
    try {
      const { data: users } = await supabase.auth.admin.listUsers();
      const match = users?.users.find(
        (u) => u.email?.toLowerCase() === String(solicitud.email).toLowerCase()
      );
      if (match) {
        const { error: errDel } = await supabase
          .from("course_enrollments")
          .delete()
          .eq("course_id", solicitud.course_id)
          .eq("student_id", match.id);
        D("delete enrollment error:", errDel?.message ?? null);
      } else {
        D("el alumno no tenía cuenta; nada que desinscribir");
      }
    } catch (e) {
      D("ERROR al desinscribir:", String(e));
    }

    // 2. Marcar como rechazada
    const { error: errUpdate } = await supabase
      .from("enrollment_requests")
      .update({ status: "rechazado", reviewed_at: new Date().toISOString() })
      .eq("id", request_id);
    if (errUpdate) throw new Error("No se pudo revocar: " + errUpdate.message);

    D("fin OK");
    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  } catch (error) {
    console.error("[DIAG revocar] ERROR:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
