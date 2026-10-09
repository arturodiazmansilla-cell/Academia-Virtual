// src/features/colegio/components/ReporteColegioModal.tsx
//
// Vista previa (carta vertical) y descarga del reporte de Notas o
// Asistencia del colegio en PDF o Excel.

import { useState } from "react";

interface Props {
  titulo: string;
  subtitulo: string;
  columnas: string[];
  filas: (string | number | null)[][];
  nombreBase: string;
  onClose: () => void;
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

      autoTable(doc, {
        startY: 27,
        head: [columnas],
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
      const hoja = XLSX.utils.aoa_to_sheet([columnas, ...datos]);

      const bordeCelda = {
        top: { style: "thin", color: { rgb: "DDE1E4" } },
        bottom: { style: "thin", color: { rgb: "DDE1E4" } },
        left: { style: "thin", color: { rgb: "DDE1E4" } },
        right: { style: "thin", color: { rgb: "DDE1E4" } },
      };

      columnas.forEach((_, colIdx) => {
        const celda = XLSX.utils.encode_cell({ r: 0, c: colIdx });
        if (!hoja[celda]) return;
        hoja[celda].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "163A33" } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: bordeCelda,
        };
      });

      datos.forEach((_, rowIdx) => {
        columnas.forEach((_, colIdx) => {
          const celda = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
          if (!hoja[celda]) return;
          hoja[celda].s = {
            border: bordeCelda,
            alignment: { vertical: "center", horizontal: colIdx === 0 ? "left" : "center" },
            fill: rowIdx % 2 === 1 ? { fgColor: { rgb: "F5F6F8" } } : undefined,
          };
        });
      });

      hoja["!cols"] = columnas.map((_, i) => ({ wch: i === 0 ? 28 : 14 }));
      hoja["!views"] = [{ state: "frozen", ySplit: 1 }];

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
                <tr>
                  {columnas.map((c, i) => (
                    <th key={i}>{c}</th>
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
