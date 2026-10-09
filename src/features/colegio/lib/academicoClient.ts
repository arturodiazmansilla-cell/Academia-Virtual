// src/features/colegio/lib/academicoClient.ts
//
// Cliente del puente con el Sistema Académico del colegio
// (Edge Function academico-proxy, solo admin/instructor).

import { supabase } from "../../../shared/lib/supabaseClient";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export interface ColegioCurso {
  id: string;
  name: string;
  level: string | null;
}

export interface ColegioParalelo {
  id: string;
  name: string;
}

export interface ColegioMateria {
  id: string;
  name: string;
}

export interface ColegioEvaluation {
  id: string;
  title: string;
  evaluation_date: string;
  maximum_score: number;
  evaluation_types: { name: string } | null;
}

export interface ColegioNotaAlumno {
  id: string;
  name: string;
  scores: Record<string, number | null>;
  promedio: number | null;
}

export interface ColegioAsistenciaAlumno {
  id: string;
  name: string;
  presente: number;
  ausente: number;
  tarde: number;
  licencia: number;
  total: number;
  porcentaje: number | null;
}

export async function callAcademico<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  // fetch directo (en vez de functions.invoke) para leer el mensaje
  // de error exacto que devuelve la función.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión iniciada");

  let res: Response;
  try {
    res = await fetch(`${FUNCTIONS_URL}/academico-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, ...params }),
    });
  } catch {
    throw new Error("No se pudo contactar al puente del colegio");
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // respuesta sin JSON
  }

  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : `El puente respondió ${res.status}`;
    throw new Error(msg);
  }
  if (body && typeof body === "object" && "error" in body) {
    throw new Error(String((body as { error: unknown }).error));
  }
  return body as T;
}
