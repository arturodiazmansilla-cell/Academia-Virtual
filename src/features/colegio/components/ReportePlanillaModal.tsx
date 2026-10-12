// src/features/colegio/components/ReportePlanillaModal.tsx
//
// Vista previa y descarga del reporte de Notas con el formato de la
// planilla oficial (Registro de calificaciones) en PDF (carta apaisada)
// o Excel.

import { useState } from "react";
import {
  calcularMerges,
  hexARgb,
  PLANILLA_ESTILOS,
  type EstiloPlanilla,
  type Planilla,
} from "../lib/planilla";

interface Props {
  planilla: Planilla;
  /** Texto del filtro aplicado, si hay */
  filtro?: string;
  onClose: () => void;
}

function nombreArchivo(base: string, ext: string) {
  return `${base}-${new Date().toISOString().slice(0, 10)}.${ext}`;
}

function claseEstilo(estilo?: EstiloPlanilla): string {
  switch (estilo) {
    case "superMaestro":
      return "pl-super-maestro";
    case "superAutoev":
      return "pl-super-autoev";
    case "superTrim":
      return "pl-super-trim";
    case "dimension":
      return "pl-dimension";
    case "total":
      return "pl-total";
    case "promedio":
      return "pl-promedio";
    case "criterio":
      return "pl-criterio";
    default:
      return "pl-base";
  }
}

function celdaTexto(v: string | number | null): string {
  return v === null || v === undefined ? "—" : String(v);
}

export function ReportePlanillaModal({ planilla, filtro, onClose }: Props) {
  const [generando, setGenerando] = useState<"pdf" | "excel" | null>(null);
  const { encabezado, filas, nColumnas } = planilla;
  const subtitulo = `ÁREA: ${planilla.area} · AÑO DE ESCOLARIDAD: ${planilla.curso} · ${planilla.fecha}${
    filtro ? ` · Filtro: "${filtro}"` : ""
  }`;

  async function descargarPDF() {
    setGenerando("pdf");
    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({ unit: "mm", format: "letter", orientation: "landscape" });

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(planilla.titulo, 14, 12);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(subtitulo, 14, 18);

      type Celda = {
        content: string;
        colSpan?: number;
        rowSpan?: number;
        styles?: Record<string, unknown>;
      };
      const head: Celda[][] = encabezado.map((fila) =>
        fila.map((c) => {
          const est = c.estilo ? PLANILLA_ESTILOS[c.estilo] : undefined;
          return {
            content: c.texto,
            ...(c.colSpan && c.colSpan > 1 ? { colSpan: c.colSpan } : {}),
            ...(c.rowSpan && c.rowSpan > 1 ? { rowSpan: c.rowSpan } : {}),
            ...(est
              ? {
                  styles: {
                    fillColor: hexARgb(est.bg),
                    textColor: hexARgb(est.fg),
                    fontSize: 7,
                    fontStyle: "bold",
                  },
                }
              : {}),
          };
        })
      );

      autoTable(doc, {
        startY: 22,
        head,
        body: filas.map((f) => f.map(celdaTexto)),
        styles: {
          fontSize: 7,
          cellPadding: 1.6,
          halign: "center",
          valign: "middle",
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          1: { halign: "left", cellWidth: 42 },
        },
      });

      doc.save(nombreArchivo(planilla.nombreBase, "pdf"));
    } finally {
      setGenerando(null);
    }
  }

  async function descargarExcel() {
    setGenerando("excel");
    try {
      const XLSX = await import("xlsx-js-style");
      const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];

      const tituloRow = new Array<string>(nColumnas).fill("");
      tituloRow[0] = planilla.titulo;
      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: nColumnas - 1 } });

      const infoRow = new Array<string>(nColumnas).fill("");
      infoRow[0] = subtitulo;
      merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: nColumnas - 1 } });

      const filasEncabezado: string[][] = [[], [], []];
      // Se arma por posición para respetar colSpan/rowSpan
      const ocupadas = new Set<string>();
      encabezado.forEach((fila, ri) => {
        let col = 0;
        fila.forEach((c) => {
          while (ocupadas.has(`${ri}:${col}`)) col++;
          const cs = c.colSpan ?? 1;
          const rs = c.rowSpan ?? 1;
          for (let r = ri; r < ri + rs; r++)
            for (let cc = col; cc < col + cs; cc++) ocupadas.add(`${r}:${cc}`);
          filasEncabezado[ri][col] = c.texto;
          col += cs;
        });
      });
      const DESP = 4;
      merges.push(...calcularMerges(encabezado, DESP));

      const datos = filas.map((f) => f.map((v) => (v === null || v === undefined ? "" : v)));
      const hoja = XLSX.utils.aoa_to_sheet([
        tituloRow,
        new Array<string>(nColumnas).fill(""),
        infoRow,
        new Array<string>(nColumnas).fill(""),
        ...filasEncabezado,
        ...datos,
      ]);
      if (merges.length > 0) hoja["!merges"] = merges;

      const bordeCelda = {
        top: { style: "thin", color: { rgb: "BFBFBF" } },
        bottom: { style: "thin", color: { rgb: "BFBFBF" } },
        left: { style: "thin", color: { rgb: "BFBFBF" } },
        right: { style: "thin", color: { rgb: "BFBFBF" } },
      };

      const pintar = (
        r: number,
        c: number,
        bg: string,
        fg: string,
        size: number,
        bold = true,
        align: "center" | "left" = "center"
      ) => {
        const celda = XLSX.utils.encode_cell({ r, c });
        if (!hoja[celda]) return;
        hoja[celda].s = {
          font: { bold, size, color: { rgb: fg } },
          fill: { fgColor: { rgb: bg } },
          alignment: { horizontal: align, vertical: "center", wrapText: true },
          border: bordeCelda,
        };
      };

      // Título y subtítulo
      const estTitulo = PLANILLA_ESTILOS.titulo;
      pintar(0, 0, estTitulo.bg, estTitulo.fg, estTitulo.size);
      pintar(2, 0, "FFFFFF", "1F1F1F", 10, true, "left");

      // Encabezado: estilo por celda según su posición
      encabezado.forEach((fila, ri) => {
        let col = 0;
        const vistas = new Set<string>();
        fila.forEach((c) => {
          while (vistas.has(`${ri}:${col}`)) col++;
          const cs = c.colSpan ?? 1;
          const rs = c.rowSpan ?? 1;
          for (let r = ri; r < ri + rs; r++)
            for (let cc = col; cc < col + cs; cc++) vistas.add(`${r}:${cc}`);
          const est = c.estilo ? PLANILLA_ESTILOS[c.estilo] : PLANILLA_ESTILOS.base;
          pintar(DESP + ri, col, est.bg, est.fg, est.size);
          col += cs;
        });
      });

      // Cuerpo
      datos.forEach((filaDatos, ri) => {
        filaDatos.forEach((_, ci) => {
          const celda = XLSX.utils.encode_cell({ r: DESP + 3 + ri, c: ci });
          if (!hoja[celda]) return;
          hoja[celda].s = {
            font: { size: 10, color: { rgb: "1F1F1F" } },
            alignment: {
              horizontal: ci === 1 ? "left" : "center",
              vertical: "center",
              wrapText: true,
            },
            border: bordeCelda,
          };
        });
      });

      hoja["!cols"] = Array.from({ length: nColumnas }, (_, i) => ({
        wch: i === 0 ? 5 : i === 1 ? 34 : 13,
      }));
      hoja["!views"] = [{ state: "frozen", ySplit: DESP + 3, xSplit: 2 }];

      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Registro");
      XLSX.writeFile(libro, nombreArchivo(planilla.nombreBase, "xlsx"));
    } finally {
      setGenerando(null);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card reporte-modal reporte-modal-ancho"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{planilla.titulo}</h2>
        <p className="course-meta">
          Vista previa · {filas.length} estudiante{filas.length === 1 ? "" : "s"}
          {filtro ? ` · Filtro: "${filtro}"` : ""}
        </p>

        <div className="reporte-planilla-wrap">
          <table className="reporte-planilla-table">
            <thead>
              {encabezado.map((fila, ri) => (
                <tr key={ri}>
                  {fila.map((c, ci) => (
                    <th
                      key={ci}
                      colSpan={c.colSpan}
                      rowSpan={c.rowSpan}
                      className={claseEstilo(c.estilo)}
                    >
                      {c.texto.split("\n").map((linea, li) => (
                        <span key={li}>
                          {li > 0 && <br />}
                          {linea}
                        </span>
                      ))}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {filas.map((f, ri) => (
                <tr key={ri}>
                  {f.map((v, ci) => (
                    <td key={ci} className={ci === 1 ? "pl-nombre" : undefined}>
                      {celdaTexto(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
