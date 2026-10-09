// src/features/colegio/lib/criterios.ts
//
// Criterios de evaluación del colegio (SER / SABER / HACER):
// agrupa las evaluaciones por su tipo y las ordena por fecha ascendente.

import type { ColegioEvaluation } from "./academicoClient";

export type CriterioKey = "ser" | "saber" | "hacer" | "otro";

const ORDEN: CriterioKey[] = ["ser", "saber", "hacer", "otro"];

/** Detecta el criterio por el nombre del tipo de evaluación del colegio. */
export function criterioDe(ev: ColegioEvaluation): CriterioKey {
  const t = (ev.evaluation_types?.name ?? "").toLowerCase();
  if (/\bsaber\b/.test(t)) return "saber";
  if (/\bhacer\b/.test(t)) return "hacer";
  if (/\bser\b/.test(t)) return "ser";
  return "otro";
}

/** Etiqueta del grupo: los exámenes van en SABER y las tareas en HACER. */
export function criterioEtiqueta(key: CriterioKey): string {
  switch (key) {
    case "ser":
      return "SER";
    case "saber":
      return "SABER · Exámenes";
    case "hacer":
      return "HACER · Tareas";
    default:
      return "Otras";
  }
}

function tiempoFecha(fecha: string): number {
  const t = new Date(fecha + "T00:00:00").getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/** Fecha corta; "Sin fecha" si el colegio no la registró. */
export function fmtFechaEval(fecha: string): string {
  if (tiempoFecha(fecha) === Number.POSITIVE_INFINITY) return "Sin fecha";
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export interface GrupoEvaluaciones {
  key: CriterioKey;
  etiqueta: string;
  evaluaciones: ColegioEvaluation[];
}

/**
 * Agrupa por criterio (SER → SABER → HACER → otras) y dentro de cada
 * grupo ordena por fecha de menor a mayor (las sin fecha van al final).
 */
export function agruparEvaluaciones(evaluations: ColegioEvaluation[]): GrupoEvaluaciones[] {
  const mapa = new Map<CriterioKey, ColegioEvaluation[]>();
  for (const e of evaluations) {
    const k = criterioDe(e);
    if (!mapa.has(k)) mapa.set(k, []);
    mapa.get(k)!.push(e);
  }
  return ORDEN.filter((k) => mapa.has(k)).map((k) => ({
    key: k,
    etiqueta: criterioEtiqueta(k),
    evaluaciones: mapa
      .get(k)!
      .sort((a, b) => tiempoFecha(a.evaluation_date) - tiempoFecha(b.evaluation_date)),
  }));
}
