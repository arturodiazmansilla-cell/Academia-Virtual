// src/features/colegio/lib/planilla.ts
//
// Reporte de notas con el formato de la planilla oficial
// (Registro de calificaciones): SER / SABER / HACER con PROMEDIO por
// dimensión, TOTAL, AUTOEV. y CALIFICACIÓN TRIMESTRAL.

import type { ColegioNotaAlumno } from "./academicoClient";
import { fmtFechaEval, promedioGrupo, redondearNota, type GrupoEvaluaciones } from "./criterios";

export type EstiloPlanilla =
  | "titulo"
  | "superMaestro"
  | "superAutoev"
  | "superTrim"
  | "dimension"
  | "total"
  | "promedio"
  | "criterio"
  | "base";

export interface CeldaEncabezado {
  texto: string;
  colSpan?: number;
  rowSpan?: number;
  estilo?: EstiloPlanilla;
}

export interface Planilla {
  titulo: string;
  area: string;
  curso: string;
  fecha: string;
  /** 3 filas de encabezado */
  encabezado: CeldaEncabezado[][];
  filas: (string | number | null)[][];
  nColumnas: number;
  nombreBase: string;
}

/** Colores oficiales de la planilla (para Excel / PDF / vista previa). */
export const PLANILLA_ESTILOS: Record<EstiloPlanilla, { bg: string; fg: string; size: number }> = {
  titulo: { bg: "8EAADB", fg: "1F1F1F", size: 18 },
  superMaestro: { bg: "F4B083", fg: "1F1F1F", size: 8 },
  superAutoev: { bg: "FFD965", fg: "1F1F1F", size: 8 },
  superTrim: { bg: "A8D08D", fg: "1F1F1F", size: 11 },
  dimension: { bg: "E7E6E6", fg: "1F1F1F", size: 8 },
  total: { bg: "F4B083", fg: "1F1F1F", size: 8 },
  promedio: { bg: "E7E6E6", fg: "1F1F1F", size: 10 },
  criterio: { bg: "FFFFFF", fg: "1F1F1F", size: 8 },
  base: { bg: "FFFFFF", fg: "1F1F1F", size: 10 },
};

export function hexARgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/**
 * Construye la planilla a partir de los grupos de criterios y los alumnos
 * (ya filtrados si hay búsqueda).
 * TOTAL = suma de los promedios de dimensión disponibles (/95).
 * CALIFICACIÓN TRIMESTRAL = TOTAL + AUTOEV. (/100).
 */
export function construirPlanilla(
  grupos: GrupoEvaluaciones[],
  alumnos: ColegioNotaAlumno[],
  info: { area: string; curso: string }
): Planilla {
  const grupoAutoev = grupos.find((g) => g.key === "autoevaluacion");
  const dimensiones = grupos.filter((g) => g.key !== "autoevaluacion");

  // ---- encabezado (3 filas) ----
  const fila1: CeldaEncabezado[] = [
    { texto: "N°", rowSpan: 3, estilo: "base" },
    { texto: "APELLIDOS Y NOMBRES", rowSpan: 3, estilo: "base" },
  ];
  const fila2: CeldaEncabezado[] = [];
  const fila3: CeldaEncabezado[] = [];

  let nColsMaestro = 0;
  for (const g of dimensiones) {
    const n = g.evaluaciones.length + 1; // criterios + PROMEDIO
    nColsMaestro += n;
    fila2.push({ texto: g.etiqueta, colSpan: n, estilo: "dimension" });
    for (const e of g.evaluaciones) {
      fila3.push({
        texto: `${fmtFechaEval(e.evaluation_date)}\n${e.title}`,
        estilo: "criterio",
      });
    }
    fila3.push({ texto: "PROMEDIO", estilo: "promedio" });
  }
  fila2.push({ texto: "TOTAL", rowSpan: 2, estilo: "total" });
  nColsMaestro += 1;

  fila1.push({
    texto: "EVALUACIÓN DEL MAESTRO AL ESTUDIANTE (95 PUNTOS)",
    colSpan: nColsMaestro,
    estilo: "superMaestro",
  });
  fila1.push({ texto: "AUTOEV. DEL ESTUDIANTE /5", rowSpan: 3, estilo: "superAutoev" });
  fila1.push({ texto: "CALIFICACIÓN TRIMESTRAL", rowSpan: 3, estilo: "superTrim" });

  // ---- cuerpo ----
  const filas = alumnos.map((s, i) => {
    const promDim = dimensiones.map((g) => promedioGrupo(s.scores, g.evaluaciones));
    const validos = promDim.filter((v): v is number => v !== null);
    // Igual que el colegio: suma de los promedios de dimensión disponibles
    const total = validos.length > 0 ? validos.reduce((a, b) => a + b, 0) : null;
    const autoev = grupoAutoev ? promedioGrupo(s.scores, grupoAutoev.evaluaciones) : null;
    const trimestral = total !== null ? total + (autoev ?? 0) : null;

    const celdas: (string | number | null)[] = [i + 1, s.name];
    dimensiones.forEach((g, gi) => {
      for (const e of g.evaluaciones) celdas.push(redondearNota(s.scores[e.id]));
      celdas.push(promDim[gi]);
    });
    celdas.push(total, autoev, trimestral);
    return celdas;
  });

  const nColumnas = 2 + nColsMaestro + 2;

  return {
    titulo: "REGISTRO DE CALIFICACIONES",
    area: info.area,
    curso: info.curso,
    fecha: new Date().toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    encabezado: [fila1, fila2, fila3],
    filas,
    nColumnas,
    nombreBase: "registro-calificaciones",
  };
}

/**
 * Calcula las combinaciones de celdas (merges) de un encabezado con
 * colSpan/rowSpan. `desplazamiento` mueve las filas (p. ej. por el título).
 */
export function calcularMerges(
  encabezado: CeldaEncabezado[][],
  desplazamiento = 0
): { s: { r: number; c: number }; e: { r: number; c: number } }[] {
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
  const ocupadas = new Set<string>();
  encabezado.forEach((fila, ri) => {
    let col = 0;
    for (const celda of fila) {
      while (ocupadas.has(`${ri}:${col}`)) col++;
      const cs = celda.colSpan ?? 1;
      const rs = celda.rowSpan ?? 1;
      for (let r = ri; r < ri + rs; r++) {
        for (let c = col; c < col + cs; c++) ocupadas.add(`${r}:${c}`);
      }
      if (cs > 1 || rs > 1) {
        merges.push({
          s: { r: ri + desplazamiento, c: col },
          e: { r: ri + rs - 1 + desplazamiento, c: col + cs - 1 },
        });
      }
      col += cs;
    }
  });
  return merges;
}
