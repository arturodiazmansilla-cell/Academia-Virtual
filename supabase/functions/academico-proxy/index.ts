// supabase/functions/academico-proxy/index.ts
//
// Puente de solo lectura hacia el Sistema Académico del colegio
// (proyecto Supabase separado). La función usa la service_role key del
// colegio (secrets ACADEMICO_URL y ACADEMICO_SERVICE_KEY) y solo responde
// a administradores e instructores de Academia Virtual.
//
// Acciones (POST JSON):
//   { action: "cursos" }
//   { action: "paralelos", curso_id }
//   { action: "materias" }
//   { action: "notas", curso_id, paralelo_id?, materia_id }
//   { action: "asistencia", curso_id, paralelo_id?, materia_id? }

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function bGet(bUrl: string, bKey: string, path: string) {
  const res = await fetch(`${bUrl}/rest/v1/${path}`, {
    headers: { apikey: bKey, Authorization: `Bearer ${bKey}` },
  });
  if (!res.ok) throw new Error(`El colegio respondió ${res.status}`);
  return res.json();
}

function fullName(s: { first_name?: string; last_name?: string } | null | undefined) {
  return `${s?.first_name ?? ""} ${s?.last_name ?? ""}`.trim() || "Sin nombre";
}

/** Normaliza un nombre para comparar (sin tildes, minúsculas, espacios simples) */
function normName(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function httpError(message: string, status: number) {
  const e = new Error(message) as Error & { status: number };
  e.status = status;
  return e;
}

/**
 * Notas del alumno que llama: verifica su identidad, exige inscripción
 * activa al curso virtual (o ser personal) y devuelve SOLO su fila.
 */
async function misNotas(
  bUrl: string,
  bKey: string,
  body: { virtual_course_id?: string },
  userId: string
) {
  const virtualCourseId = body.virtual_course_id;
  if (!virtualCourseId) throw httpError("Falta el curso", 400);

  // Cliente con service_role para lecturas internas (el alumno no puede
  // leer vinculaciones ni inscripciones ajenas por RLS)
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, role")
    .eq("id", userId)
    .single();
  if (!profile) throw httpError("Perfil no encontrado", 404);

  const isStaff = profile.role === "admin" || profile.role === "instructor";
  if (!isStaff) {
    const { data: enr } = await admin
      .from("course_enrollments")
      .select("id")
      .eq("course_id", virtualCourseId)
      .eq("student_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    if (!enr) throw httpError("No estás inscrito en este curso", 403);
  }

  const { data: vinc } = await admin
    .from("curso_vinculaciones")
    .select("*")
    .eq("virtual_course_id", virtualCourseId)
    .maybeSingle();
  if (!vinc) throw httpError("Curso sin vinculación con el colegio", 404);

  const data = await notas(bUrl, bKey, {
    curso_id: vinc.colegio_curso_id,
    paralelo_id: vinc.colegio_paralelo_id ?? undefined,
    materia_id: vinc.colegio_materia_id ?? undefined,
  });

  const target = normName(profile.full_name ?? "");
  const student =
    (data.students as { id: string; name: string }[]).find((s) => normName(s.name) === target) ??
    null;

  return {
    evaluations: data.evaluations,
    student,
    vinculo:
      `${vinc.colegio_curso_nombre}` +
      (vinc.colegio_paralelo_nombre ? ` · Paralelo ${vinc.colegio_paralelo_nombre}` : "") +
      (vinc.colegio_materia_nombre ? ` · ${vinc.colegio_materia_nombre}` : ""),
  };
}

async function notas(
  bUrl: string,
  bKey: string,
  body: { curso_id?: string; paralelo_id?: string; materia_id?: string }
) {
  const { curso_id, paralelo_id, materia_id } = body;
  if (!curso_id || !materia_id) throw new Error("Falta el curso o la materia del colegio");

  let q =
    `evaluations?select=id,title,evaluation_date,maximum_score,evaluation_types(name)` +
    `&course_id=eq.${curso_id}&subject_id=eq.${materia_id}&order=evaluation_date`;
  if (paralelo_id) q += `&parallel_id=eq.${paralelo_id}`;
  const evaluations = await bGet(bUrl, bKey, q);
  if (evaluations.length === 0) return { evaluations: [], students: [] };

  const ids = evaluations.map((e: { id: string }) => e.id).join(",");
  const grades = await bGet(
    bUrl,
    bKey,
    `grades?select=evaluation_id,score,student:students(id,first_name,last_name)&evaluation_id=in.(${ids})`
  );

  const byStudent = new Map<string, { id: string; name: string; scores: Record<string, number | null> }>();
  for (const g of grades) {
    const s = g.student;
    if (!s?.id) continue;
    if (!byStudent.has(s.id)) {
      byStudent.set(s.id, { id: s.id, name: fullName(s), scores: {} });
    }
    byStudent.get(s.id)!.scores[g.evaluation_id] = g.score;
  }

  const students = [...byStudent.values()]
    .map((st) => {
      const vals = Object.values(st.scores).filter(
        (v): v is number => v !== null && v !== undefined
      );
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + Number(b), 0) / vals.length : null;
      return { ...st, promedio: avg !== null ? Math.round(avg * 10) / 10 : null };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return { evaluations, students };
}

async function asistencia(
  bUrl: string,
  bKey: string,
  body: { curso_id?: string; paralelo_id?: string; materia_id?: string }
) {
  const { curso_id, paralelo_id, materia_id } = body;
  if (!curso_id) throw new Error("Falta el curso del colegio");

  let q = `class_sessions?select=id,class_date&course_id=eq.${curso_id}&order=class_date`;
  if (paralelo_id) q += `&parallel_id=eq.${paralelo_id}`;
  if (materia_id) q += `&subject_id=eq.${materia_id}`;
  const sessions = await bGet(bUrl, bKey, q);
  if (sessions.length === 0) return { sessions: 0, students: [] };

  const ids = sessions.map((s: { id: string }) => s.id).join(",");
  const rows = await bGet(
    bUrl,
    bKey,
    `attendance?select=status,student:students(id,first_name,last_name)&class_session_id=in.(${ids})`
  );

  const byStudent = new Map<
    string,
    { id: string; name: string; presente: number; ausente: number; tarde: number; licencia: number }
  >();
  for (const r of rows) {
    const s = r.student;
    if (!s?.id) continue;
    if (!byStudent.has(s.id)) {
      byStudent.set(s.id, { id: s.id, name: fullName(s), presente: 0, ausente: 0, tarde: 0, licencia: 0 });
    }
    const st = byStudent.get(s.id)!;
    if (r.status === "present") st.presente += 1;
    else if (r.status === "absent") st.ausente += 1;
    else if (r.status === "late") st.tarde += 1;
    else if (r.status === "leave") st.licencia += 1;
  }

  const students = [...byStudent.values()]
    .map((st) => {
      const total = st.presente + st.ausente + st.tarde + st.licencia;
      const porcentaje = total > 0 ? Math.round(((st.presente + st.tarde) / total) * 100) : null;
      return { ...st, total, porcentaje };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return { sessions: sessions.length, students };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Solo personal de Academia Virtual (admin o instructor)
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseA = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const {
      data: { user },
    } = await supabaseA.auth.getUser();
    if (!user) {
      console.error("[academico-proxy] auth.getUser sin usuario");
      return json({ error: "No autorizado" }, 401);
    }

    const { data: profile } = await supabaseA
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = profile?.role;

    const staffOnly = ["cursos", "paralelos", "materias", "notas", "asistencia"];
    if (staffOnly.includes(body.action)) {
      if (!["admin", "instructor"].includes(role)) {
        console.error("[academico-proxy] rol sin permiso:", role);
        return json({ error: "Sin permiso" }, 403);
      }
    }

    const bUrl = (Deno.env.get("ACADEMICO_URL") ?? "").replace(/\/+$/, "");
    const bKey = Deno.env.get("ACADEMICO_SERVICE_KEY") ?? "";
    if (!bUrl || !bKey) {
      console.error("[academico-proxy] faltan secrets ACADEMICO_URL / ACADEMICO_SERVICE_KEY");
      return json({ error: "Puente con el colegio sin configurar (faltan secrets)" }, 500);
    }

    const body = await req.json();
    switch (body.action) {
      case "cursos":
        return json(await bGet(bUrl, bKey, "courses?select=id,name,level&active=eq.true&order=name"));
      case "paralelos": {
        if (!body.curso_id) return json({ error: "Falta curso_id" }, 400);
        return json(
          await bGet(
            bUrl,
            bKey,
            `parallels?select=id,name&course_id=eq.${body.curso_id}&active=eq.true&order=name`
          )
        );
      }
      case "materias":
        return json(await bGet(bUrl, bKey, "subjects?select=id,name&active=eq.true&order=name"));
      case "notas":
        return json(await notas(bUrl, bKey, body));
      case "asistencia":
        return json(await asistencia(bUrl, bKey, body));
      case "mis-notas":
        return json(await misNotas(bUrl, bKey, body, user.id));
      default:
        return json({ error: "Acción no válida" }, 400);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error en el puente";
    const status = (e as { status?: number })?.status ?? 500;
    console.error("[academico-proxy]", msg);
    return json({ error: msg }, status);
  }
});
