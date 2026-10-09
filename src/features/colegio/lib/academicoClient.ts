// src/features/colegio/lib/academicoClient.ts
//
// Cliente del puente con el Sistema Académico del colegio
// (Edge Function academico-proxy, solo admin/instructor).

import { supabase } from "../../../shared/lib/supabaseClient";

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
  const { data, error } = await supabase.functions.invoke("academico-proxy", {
    body: { action, ...params },
  });
  if (error) throw new Error(error.message || "No se pudo contactar al colegio");
  if (data && typeof data === "object" && "error" in data) {
    throw new Error(String((data as { error: unknown }).error));
  }
  return data as T;
}
