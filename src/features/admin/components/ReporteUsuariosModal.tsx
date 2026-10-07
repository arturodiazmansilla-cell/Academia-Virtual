// src/features/admin/components/ReporteUsuariosModal.tsx
//
// Requiere: npm install jspdf jspdf-autotable xlsx

import { useState } from "react";
import type { Usuario } from "../hooks/useUsuarios";

type PaperSize = "carta" | "oficio";
type Orientation = "vertical" | "horizontal";

interface Props {
  usuarios: Usuario[];
  onClose: () => void;
}

// Dimensiones en mm para la vista previa
const DIMENSIONES: Record<PaperSize, { w: number; h: number }> = {
  carta: { w: 216, h: 279 },
  oficio: { w: 216, h: 356 },
};

const ETIQUETAS_ROL: Record<string, string> = {
  admin: "Administrador",
  instructor: "Instructor",
  alumno: "Alumno",
};

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-BO", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function ReporteUsuariosModal({ usuarios, onClose }: Props) {
  const [paperSize, setPaperSize] = useState<PaperSize>("carta");
  const [orientation, setOrientation] = useState<Orientation>("vertical");
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [generando, setGenerando] = useState<"pdf" | "excel" | null>(null);

  const dim = DIMENSIONES[paperSize];
  const anchoMM = orientation === "vertical" ? dim.w : dim.h;
  const altoMM = orientation === "vertical" ? dim.h : dim.w;
  const escala = 340 / altoMM; // ajusta la vista previa a ~340px de alto

  async function descargarPDF() {
    setGenerando("pdf");
    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({
        orientation: orientation === "vertical" ? "portrait" : "landscape",
        unit: "mm",
        format: paperSize === "oficio" ? "legal" : "letter",
      });

      doc.setFontSize(14);
      doc.text("Reporte de usuarios — Academia Virtual", 14, 15);
      doc.setFontSize(9);
      doc.text(`Generado: ${new Date().toLocaleString("es-BO")}`, 14, 21);

      autoTable(doc, {
        startY: 26,
        head: [["Nombre", "Correo", "Rol", "Estado", "Creado"]],
        body: usuarios.map((u) => [
          u.full_name,
          u.email,
          ETIQUETAS_ROL[u.role] ?? u.role,
          u.status,
          formatearFecha(u.created_at),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 58, 51] },
      });

      doc.save("reporte-usuarios.pdf");
    } finally {
      setGenerando(null);
    }
  }

  async function descargarExcel() {
    setGenerando("excel");
    try {
      // xlsx-js-style: fork de SheetJS con soporte de estilos al escribir
      // (la librería 'xlsx' base no aplica estilos en el archivo final).
      const XLSX = await import("xlsx-js-style");

      const encabezados = ["Nombre", "Correo", "Rol", "Estado", "Creado"];
      const filas = usuarios.map((u) => [
        u.full_name,
        u.email,
        ETIQUETAS_ROL[u.role] ?? u.role,
        u.status,
        formatearFecha(u.created_at),
      ]);

      const hoja = XLSX.utils.aoa_to_sheet([encabezados, ...filas]);

      const bordeCelda = {
        top: { style: "thin", color: { rgb: "DDE1E4" } },
        bottom: { style: "thin", color: { rgb: "DDE1E4" } },
        left: { style: "thin", color: { rgb: "DDE1E4" } },
        right: { style: "thin", color: { rgb: "DDE1E4" } },
      };

      // Encabezado: fondo verde de marca, texto blanco en negrita, centrado
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

      // Filas de datos: bordes + franjas alternadas para facilitar la lectura
      filas.forEach((_, rowIdx) => {
        encabezados.forEach((_, colIdx) => {
          const celda = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
          if (!hoja[celda]) return;
          hoja[celda].s = {
            border: bordeCelda,
            alignment: { vertical: "center" },
            fill: rowIdx % 2 === 1 ? { fgColor: { rgb: "F5F6F8" } } : undefined,
          };
        });
      });

      // Ancho de columnas y encabezado fijo al hacer scroll
      hoja["!cols"] = [{ wch: 26 }, { wch: 30 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
      hoja["!views"] = [{ state: "frozen", ySplit: 1 }];

      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Usuarios");
      XLSX.writeFile(libro, "reporte-usuarios.xlsx");
    } finally {
      setGenerando(null);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card reporte-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Reporte de usuarios</h2>

        <div className="reporte-config">
          <label>
            Formato de papel
            <select value={paperSize} onChange={(e) => setPaperSize(e.target.value as PaperSize)}>
              <option value="carta">Carta</option>
              <option value="oficio">Oficio</option>
            </select>
          </label>
          <label>
            Orientación
            <select value={orientation} onChange={(e) => setOrientation(e.target.value as Orientation)}>
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </label>
        </div>

        <div className="topic-actions">
          <button type="button" onClick={() => setMostrarPreview(true)}>
            Vista previa
          </button>
          <button type="button" className="secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {mostrarPreview && (
          <>
            <div
              className="reporte-preview"
              style={{
                width: anchoMM * escala,
                height: altoMM * escala,
              }}
            >
              <div className="reporte-preview-inner">
                <h3>Reporte de usuarios — Academia Virtual</h3>
                <p className="reporte-preview-meta">Generado: {new Date().toLocaleString("es-BO")}</p>
                <table className="reporte-preview-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Creado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((u) => (
                      <tr key={u.id}>
                        <td>{u.full_name}</td>
                        <td>{u.email}</td>
                        <td>{ETIQUETAS_ROL[u.role] ?? u.role}</td>
                        <td>{u.status}</td>
                        <td>{formatearFecha(u.created_at)}</td>
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
              <button type="button" onClick={descargarExcel} disabled={generando !== null}>
                {generando === "excel" ? "Generando…" : "Descargar Excel"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
