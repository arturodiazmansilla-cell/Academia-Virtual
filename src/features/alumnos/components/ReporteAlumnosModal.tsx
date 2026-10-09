// src/features/alumnos/components/ReporteAlumnosModal.tsx
//
// Vista previa (carta vertical) y descarga del reporte de alumnos inscritos
// en PDF o Excel. Respeta los filtros aplicados en la página.

import { useState } from "react";

export interface FilaReporteAlumnos {
  nro: number;
  alumno: string;
  curso: string;
  estado: string;
  fecha: string;
}

interface Props {
  filas: FilaReporteAlumnos[];
  filtroCurso: string;
  onClose: () => void;
}

// Carta: 216 x 279 mm, vertical
const ANCHO_MM = 216;
const ALTO_MM = 279;
const ESCALA = 340 / ALTO_MM;

function nombreArchivo(ext: string) {
  return `alumnos-inscritos-${new Date().toISOString().slice(0, 10)}.${ext}`;
}

export function ReporteAlumnosModal({ filas, filtroCurso, onClose }: Props) {
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

      doc.setFontSize(16);
      doc.text("Reporte de alumnos inscritos", 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Academia Virtual · ${fecha}`, 14, 25);
      doc.text(`Curso: ${filtroCurso}`, 14, 31);
      doc.setTextColor(0);

      autoTable(doc, {
        startY: 36,
        head: [["Nro", "Alumno", "Curso", "Estado", "Inscrito"]],
        body: filas.map((f) => [f.nro, f.alumno, f.curso, f.estado, f.fecha]),
        styles: { fontSize: 9, cellPadding: 2.5 },
        headStyles: { fillColor: [22, 58, 51], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 246, 248] },
        columnStyles: {
          0: { halign: "center", cellWidth: 12 },
          3: { halign: "center", cellWidth: 22 },
          4: { halign: "center", cellWidth: 24 },
        },
      });

      doc.save(nombreArchivo("pdf"));
    } finally {
      setGenerando(null);
    }
  }

  async function descargarExcel() {
    setGenerando("excel");
    try {
      const XLSX = await import("xlsx-js-style");

      const encabezados = ["Nro", "Alumno", "Curso", "Estado", "Inscrito"];
      const datos = filas.map((f) => [f.nro, f.alumno, f.curso, f.estado, f.fecha]);
      const hoja = XLSX.utils.aoa_to_sheet([encabezados, ...datos]);

      const bordeCelda = {
        top: { style: "thin", color: { rgb: "DDE1E4" } },
        bottom: { style: "thin", color: { rgb: "DDE1E4" } },
        left: { style: "thin", color: { rgb: "DDE1E4" } },
        right: { style: "thin", color: { rgb: "DDE1E4" } },
      };

      encabezados.forEach((_, colIdx) => {
        const celda = XLSX.utils.encode_cell({ r: 0, c: colIdx });
        if (!hoja[celda]) return;
        hoja[celda].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "163A33" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: bordeCelda,
        };
      });

      datos.forEach((_, rowIdx) => {
        encabezados.forEach((_, colIdx) => {
          const celda = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
          if (!hoja[celda]) return;
          hoja[celda].s = {
            border: bordeCelda,
            alignment: { vertical: "center", horizontal: colIdx === 0 ? "center" : "left" },
            fill: rowIdx % 2 === 1 ? { fgColor: { rgb: "F5F6F8" } } : undefined,
          };
        });
      });

      hoja["!cols"] = [{ wch: 6 }, { wch: 32 }, { wch: 32 }, { wch: 12 }, { wch: 14 }];
      hoja["!views"] = [{ state: "frozen", ySplit: 1 }];

      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Alumnos");
      XLSX.writeFile(libro, nombreArchivo("xlsx"));
    } finally {
      setGenerando(null);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card reporte-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Reporte de alumnos inscritos</h2>
        <p className="course-meta">
          Vista previa · Carta vertical · {filas.length} fila{filas.length === 1 ? "" : "s"}
        </p>

        <div
          className="reporte-preview"
          style={{ width: ANCHO_MM * ESCALA, height: ALTO_MM * ESCALA }}
        >
          <div className="reporte-preview-inner">
            <h3>Reporte de alumnos inscritos</h3>
            <p className="reporte-preview-meta">
              Academia Virtual ·{" "}
              {new Date().toLocaleDateString("es-BO", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
              {" · "}Curso: {filtroCurso}
            </p>
            <table className="reporte-preview-table">
              <thead>
                <tr>
                  <th>Nro</th>
                  <th>Alumno</th>
                  <th>Curso</th>
                  <th>Estado</th>
                  <th>Inscrito</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.nro}>
                    <td>{f.nro}</td>
                    <td>{f.alumno}</td>
                    <td>{f.curso}</td>
                    <td>{f.estado}</td>
                    <td>{f.fecha}</td>
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
