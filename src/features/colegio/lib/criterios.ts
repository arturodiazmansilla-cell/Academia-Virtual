// src/features/colegio/lib/criterios.ts
//
// Criterios de evaluación del colegio (SER / SABER / HACER):
// agrupa las evaluaciones por su tipo y las ordena por fecha ascendente.

import type { ColegioEvaluation } from "./academicoClient";

export type CriterioKey = "ser" | "saber" | "hacer" | "autoevaluacion" | "otro";

const ORDEN: CriterioKey[] = ["ser", "saber", "hacer", "autoevaluacion", "otro"];

/**
 * Detecta el criterio de la evaluación.
 * 1. La columna `dimension` del colegio (lo más confiable).
 * 2. El puntaje máximo: el colegio usa 10/45/40 para SER/SABER/HACER.
 * 3. El nombre del tipo de evaluación, como último recurso.
 */
export function criterioDe(ev: ColegioEvaluation): CriterioKey {
  const d = (ev.dimension ?? "").toLowerCase().trim();
  if (d === "ser") return "ser";
  if (d === "saber") return "saber";
  if (d === "hacer") return "hacer";
  if (d === "autoevaluacion" || d === "autoevaluación") return "autoevaluacion";

  const max = Number(ev.maximum_score);
  if (max === 10) return "ser";
  if (max === 45) return "saber";
  if (max === 40) return "hacer";

  const t = (ev.evaluation_types?.name ?? "").toLowerCase();
  if (/\bsaber\b/.test(t)) return "saber";
  if (/\bhacer\b/.test(t)) return "hacer";
  if (/\bser\b/.test(t)) return "ser";
  return "otro";
}

/** Puntaje máximo oficial de cada dimensión (como en el sistema del colegio). */
export const DIMENSION_MAX: Record<CriterioKey, number | null> = {
  ser: 10,
  saber: 45,
  hacer: 40,
  autoevaluacion: 5,
  otro: null,
};

/** Etiqueta del grupo como en el módulo Notas del colegio: "SER /10". */
export function criterioEtiqueta(key: CriterioKey): string {
  switch (key) {
    case "ser":
      return "SER /10";
    case "saber":
      return "SABER /45";
    case "hacer":
      return "HACER /40";
    case "autoevaluacion":
      return "Autoevaluación /5";
    default:
      return "Otras";
  }
}

/** Clase CSS con el color del grupo (coincide con el módulo Notas del colegio). */
export function criterioClase(key: CriterioKey): string {
  return `grupo-${key}`;
}

/**
 * Promedio de un alumno en las evaluaciones de un grupo
 * (null si no tiene notas en ese criterio). Igual que el colegio:
 * promedio simple redondeado a entero.
 */
export function promedioGrupo(
  scores: Record<string, number | null>,
  evaluaciones: ColegioEvaluation[]
): number | null {
  const vals = evaluaciones
    .map((e) => scores[e.id])
    .filter((v): v is number => v !== null && v !== undefined);
  if (vals.length === 0) return null;
  const avg = vals.reduce((a, b) => a + Number(b), 0) / vals.length;
  return Math.round(avg);
}

/** Redondea una nota a entero (null se mantiene null). */
export function redondearNota(v: number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return Math.round(Number(v));
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
