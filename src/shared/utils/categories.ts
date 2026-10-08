// src/shared/utils/categories.ts
//
// Categorías del catálogo (menú lateral estilo mockup):
// Educación Secundaria (con grados), Educación Primaria (con grados),
// Cursos Técnicos y Avanzados (sin grados).

import type { GradeCategory } from "../types/database.types";

export interface CategoryDef {
  key: GradeCategory;
  /** Etiqueta en el menú, p. ej. "Educación Secundaria" */
  label: string;
  /** Nombre corto para migas de pan, p. ej. "Secundaria" */
  short: string;
  /** Si lista grados (1-6) debajo */
  hasGrades: boolean;
}

export const CATEGORIES: CategoryDef[] = [
  { key: "secundaria", label: "Educación Secundaria", short: "Secundaria", hasGrades: true },
  { key: "primaria", label: "Educación Primaria", short: "Primaria", hasGrades: true },
  { key: "tecnico", label: "Cursos Técnicos", short: "Técnicos", hasGrades: false },
  { key: "avanzado", label: "Avanzados", short: "Avanzados", hasGrades: false },
];

export const GRADES = [1, 2, 3, 4, 5, 6];

export function isGradeCategory(cat: string | null | undefined): boolean {
  return cat === "primaria" || cat === "secundaria";
}

export function categoryLabel(cat: GradeCategory | null | undefined): string {
  return CATEGORIES.find((c) => c.key === cat)?.label ?? "Sin categoría";
}

/** "2° de Secundaria" · "Cursos Técnicos" · "Sin categoría" */
export function gradeLabel(
  cat: GradeCategory | null | undefined,
  num: number | null | undefined
): string {
  if ((cat === "primaria" || cat === "secundaria") && num) {
    return `${num}° de ${cat === "primaria" ? "Primaria" : "Secundaria"}`;
  }
  return categoryLabel(cat);
}

/** Valida el parámetro :categoria de la ruta /catalogo */
export function parseCategoryParam(value: string | undefined): GradeCategory | null {
  if (!value) return null;
  return (CATEGORIES.some((c) => c.key === value) ? value : null) as GradeCategory | null;
}
