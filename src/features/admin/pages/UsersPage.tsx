// src/features/admin/pages/UsersPage.tsx

import { useState } from "react";
import { useUsuarios } from "../hooks/useUsuarios";
import { ReporteUsuariosModal } from "../components/ReporteUsuariosModal";

const ETIQUETAS_ROL: Record<string, string> = {
  admin: "Administrador",
  instructor: "Instructor",
  alumno: "Alumno",
};

export function UsersPage() {
  const { usuarios, loading, error, reload } = useUsuarios();
  const [mostrarReporte, setMostrarReporte] = useState(false);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Gestionar usuarios</h1>
          <p className="course-meta">{usuarios.length} usuarios registrados</p>
        </div>
        <div className="topic-actions">
          <button type="button" className="secondary" onClick={reload} disabled={loading}>
            Recargar
          </button>
          <button type="button" onClick={() => setMostrarReporte(true)} disabled={usuarios.length === 0}>
            Generar reporte
          </button>
        </div>
      </div>

      {loading && <p>Cargando usuarios…</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <table className="users-table">
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
                <td>
                  <span className={`user-status-badge user-status-${u.status}`}>{u.status}</span>
                </td>
                <td>{new Date(u.created_at).toLocaleDateString("es-BO")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {mostrarReporte && (
        <ReporteUsuariosModal usuarios={usuarios} onClose={() => setMostrarReporte(false)} />
      )}
    </>
  );
}
