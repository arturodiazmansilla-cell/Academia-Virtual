// src/features/colegio/components/ReporteColegioModal.tsx
//
// Vista previa (carta vertical) y descarga del reporte de Notas o
// Asistencia del colegio en PDF o Excel.

import { useState } from "react";

interface Props {
  titulo: string;
  subtitulo: string;
  columnas: ColumnaReporte[];
  filas: (string | number | null)[][];
  nombreBase: string;
  onClose: () => void;
}

/** Columna del reporte; `grupo` agrupa columnas bajo un encabezado común (criterio). */
export interface ColumnaReporte {
  texto: string;
  grupo?: string;
}

interface GrupoEncabezado {
  texto: string;
  span: number;
  /** true = columna simple que abarca las dos filas del encabezado */
  rowspan: boolean;
}

/** Primera fila del encabezado: fusiona columnas consecutivas del mismo grupo. */
function filaGrupos(columnas: ColumnaReporte[]): GrupoEncabezado[] {
  const grupos: GrupoEncabezado[] = [];
  for (const c of columnas) {
    const last = grupos[grupos.length - 1];
    if (c.grupo && last && !last.rowspan && last.texto === c.grupo) {
      last.span += 1;
    } else {
      grupos.push({ texto: c.grupo ?? c.texto, span: 1, rowspan: !c.grupo });
    }
  }
  return grupos;
}

// Carta: 216 x 279 mm, vertical
const ANCHO_MM = 216;
const ALTO_MM = 279;
const ESCALA = 340 / ALTO_MM;

function nombreArchivo(base: string, ext: string) {
  return `${base}-${new Date().toISOString().slice(0, 10)}.${ext}`;
}

function celdaTexto(v: string | number | null): string {
  return v === null || v === undefined ? "—" : String(v);
}

export function ReporteColegioModal({ titulo, subtitulo, columnas, filas, nombreBase, onClose }: Props) {
  const [generando, setGenerando] = useState<"pdf" | "excel" | null>(null);

  const grupos = filaGrupos(columnas);
  const tieneGrupos = grupos.some((g) => !g.rowspan);
  const textosColumnas = columnas.map((c) => c.texto);
  // Segunda fila del encabezado: solo las columnas que pertenecen a un grupo
  const textosDetalle = columnas.filter((c) => c.grupo).map((c) => c.texto);

  async function descargarPDF() {
    setGenerando("pdf");
    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({ unit: "mm", format: "letter", orientation: "portrait" });
      const fecha = new Date().toLocaleDateString("es-BO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      doc.setFontSize(14);
      doc.text(titulo, 14, 16);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`${subtitulo} · Academia Virtual · ${fecha}`, 14, 22);
      doc.setTextColor(0);

      type CeldaEnc = string | { content: string; colSpan?: number; rowSpan?: number };
      const head: CeldaEnc[][] = tieneGrupos
        ? [
            grupos.map((g) =>
              g.rowspan
                ? { content: g.texto, rowSpan: 2 }
                : { content: g.texto, colSpan: g.span }
            ),
            textosDetalle,
          ]
        : [textosColumnas];

      autoTable(doc, {
        startY: 27,
        head,
        body: filas.map((f) => f.map(celdaTexto)),
        styles: { fontSize: 7, cellPadding: 1.8 },
        headStyles: { fillColor: [22, 58, 51], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 246, 248] },
      });

      doc.save(nombreArchivo(nombreBase, "pdf"));
    } finally {
      setGenerando(null);
    }
  }

  async function descargarExcel() {
    setGenerando("excel");
    try {
      const XLSX = await import("xlsx-js-style");

      const datos = filas.map((f) => f.map((v) => (v === null || v === undefined ? "" : v)));

      // Filas de encabezado (1 o 2 según haya grupos) + combinaciones de celdas
      const encabezado: string[][] = [];
      const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
      const filasEnc = tieneGrupos ? 2 : 1;
      if (tieneGrupos) {
        const fila0 = new Array<string>(columnas.length).fill("");
        const fila1 = new Array<string>(columnas.length).fill("");
        let col = 0;
        for (const g of grupos) {
          fila0[col] = g.texto;
          if (g.span > 1) merges.push({ s: { r: 0, c: col }, e: { r: 0, c: col + g.span - 1 } });
          if (g.rowspan) merges.push({ s: { r: 0, c: col }, e: { r: 1, c: col } });
          col += g.span;
        }
        columnas.forEach((c, i) => {
          if (c.grupo) fila1[i] = c.texto;
        });
        encabezado.push(fila0, fila1);
      } else {
        encabezado.push(textosColumnas);
      }

      const hoja = XLSX.utils.aoa_to_sheet([...encabezado, ...datos]);
      if (merges.length > 0) hoja["!merges"] = merges;

      const bordeCelda = {
        top: { style: "thin", color: { rgb: "DDE1E4" } },
        bottom: { style: "thin", color: { rgb: "DDE1E4" } },
        left: { style: "thin", color: { rgb: "DDE1E4" } },
        right: { style: "thin", color: { rgb: "DDE1E4" } },
      };

      for (let hr = 0; hr < filasEnc; hr++) {
        columnas.forEach((_, colIdx) => {
          const celda = XLSX.utils.encode_cell({ r: hr, c: colIdx });
          if (!hoja[celda]) return;
          hoja[celda].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "163A33" } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: bordeCelda,
          };
        });
      }

      datos.forEach((_, rowIdx) => {
        columnas.forEach((_, colIdx) => {
          const celda = XLSX.utils.encode_cell({ r: rowIdx + filasEnc, c: colIdx });
          if (!hoja[celda]) return;
          hoja[celda].s = {
            border: bordeCelda,
            alignment: { vertical: "center", horizontal: colIdx === 0 ? "left" : "center" },
            fill: rowIdx % 2 === 1 ? { fgColor: { rgb: "F5F6F8" } } : undefined,
          };
        });
      });

      hoja["!cols"] = columnas.map((_, i) => ({ wch: i === 0 ? 28 : 14 }));
      hoja["!views"] = [{ state: "frozen", ySplit: filasEnc }];

      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, titulo.slice(0, 28));
      XLSX.writeFile(libro, nombreArchivo(nombreBase, "xlsx"));
    } finally {
      setGenerando(null);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card reporte-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{titulo}</h2>
        <p className="course-meta">
          Vista previa · Carta vertical · {filas.length} fila{filas.length === 1 ? "" : "s"}
        </p>

        <div
          className="reporte-preview"
          style={{ width: ANCHO_MM * ESCALA, height: ALTO_MM * ESCALA }}
        >
          <div className="reporte-preview-inner">
            <h3>{titulo}</h3>
            <p className="reporte-preview-meta">
              {subtitulo} · Academia Virtual ·{" "}
              {new Date().toLocaleDateString("es-BO", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
            <table className="reporte-preview-table">
              <thead>
                {tieneGrupos && (
                  <tr>
                    {grupos.map((g, i) => (
                      <th key={i} colSpan={g.span} rowSpan={g.rowspan ? 2 : 1}>
                        {g.texto}
                      </th>
                    ))}
                  </tr>
                )}
                <tr>
                  {(tieneGrupos ? columnas.filter((c) => c.grupo) : columnas).map((c, i) => (
                    <th key={i}>{c.texto}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((f, ri) => (
                  <tr key={ri}>
                    {f.map((v, ci) => (
                      <td key={ci}>{celdaTexto(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="topic-actions reporte-descargar-actions">
          <button type="button" onClick={descargarPDF} disabled={generando !== null}>
            {generando === "pdf" ? "Generando…" : "Descargar PDF"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={descargarExcel}
            disabled={generando !== null}
          >
            {generando === "excel" ? "Generando…" : "Descargar Excel"}
          </button>
          <button type="button" className="secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
