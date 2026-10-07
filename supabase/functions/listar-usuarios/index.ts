// supabase/functions/listar-usuarios/index.ts
//
// Devuelve la lista de usuarios (id, email, nombre, rol, estado, fecha)
// combinando auth.users (vía Admin API) con la tabla profiles.
// Solo responde si quien llama es admin.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getServiceKey(): string {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!raw) throw new Error("Falta SUPABASE_SECRET_KEYS.");
  const keys = JSON.parse(raw);
  const key = keys?.default;
  if (!key) throw new Error("SUPABASE_SECRET_KEYS no tiene clave 'default'.");
  return key;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Falta autenticación" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    const jwt = authHeader.replace("Bearer ", "");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, getServiceKey());

    // Identificar quién llama y confirmar que es admin
    const { data: userData, error: errUser } = await supabase.auth.getUser(jwt);
    if (errUser || !userData?.user) {
      return new Response(JSON.stringify({ error: "Sesión inválida" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { data: perfilSolicitante } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (perfilSolicitante?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Solo administradores pueden ver esta lista" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Traer usuarios de Auth (paginado hasta 1000)
    const { data: authUsers, error: errAuth } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (errAuth) throw errAuth;

    // Traer perfiles
    const { data: perfiles, error: errPerfiles } = await supabase
      .from("profiles")
      .select("id, full_name, role, status, created_at");
    if (errPerfiles) throw errPerfiles;

    const perfilesPorId = new Map(perfiles.map((p) => [p.id, p]));

    const usuarios = authUsers.users.map((u) => {
      const perfil = perfilesPorId.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "(sin correo)",
        full_name: perfil?.full_name ?? "(sin nombre)",
        role: perfil?.role ?? "sin_perfil",
        status: perfil?.status ?? "sin_perfil",
        created_at: perfil?.created_at ?? u.created_at,
      };
    });

    return new Response(JSON.stringify({ usuarios }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
