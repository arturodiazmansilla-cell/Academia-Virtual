// src/features/requests/pages/RequestsPage.tsx
//
// Panel de autorización de accesos: el instructor/admin ve las solicitudes
// pendientes de sus cursos y las aprueba o rechaza. Al aprobar se invoca la
// Edge Function "aprobar-solicitud" (inscribe y avisa al alumno).

import { useState } from "react";
import {
  useEnrollmentRequests,
  type EnrollmentRequestWithCourse,
} from "../hooks/useEnrollmentRequests";
import type { EnrollmentRequestStatus } from "../../../shared/types/database.types";

const TABS: { key: EnrollmentRequestStatus | "todas"; label: string }[] = [
  { key: "pendiente", label: "Pendientes" },
  { key: "aprobado", label: "Aprobadas" },
  { key: "rechazado", label: "Rechazadas" },
  { key: "todas", label: "Todas" },
];

function RequestRow({
  request,
  onApprove,
  onReject,
  busy,
}: {
  request: EnrollmentRequestWithCourse;
  onApprove: (r: EnrollmentRequestWithCourse) => void;
  onReject: (r: EnrollmentRequestWithCourse) => void;
  busy: boolean;
}) {
  return (
    <tr>
      <td>
        {request.first_name} {request.last_name}
      </td>
      <td>{request.course_title ?? "—"}</td>
      <td>{request.email}</td>
      <td>{request.phone}</td>
      <td>{new Date(request.created_at).toLocaleDateString("es-BO")}</td>
      <td>
        {request.status === "pendiente" && (
          <div className="topic-actions">
            <button type="button" disabled={busy} onClick={() => onApprove(request)}>
              {busy ? "Aprobando…" : "Aprobar"}
            </button>
            <button type="button" className="danger" disabled={busy} onClick={() => onReject(request)}>
              Rechazar
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export function RequestsPage() {
  const [tab, setTab] = useState<EnrollmentRequestStatus | "todas">("pendiente");
  const { requests, loading, error, busyId, approve, reject } = useEnrollmentRequests(tab);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleApprove(r: EnrollmentRequestWithCourse) {
    const ok = window.confirm(
      `¿Aprobar el acceso de ${r.first_name} ${r.last_name} al curso "${r.course_title ?? ""}"?\n\nSe le enviará un correo a ${r.email} avisando que ya puede entrar.`
    );
    if (!ok) return;
    setActionError(null);
    const { error } = await approve(r.id);
    if (error) setActionError(`No se pudo aprobar: ${error}`);
  }

  async function handleReject(r: EnrollmentRequestWithCourse) {
    const ok = window.confirm(
      `¿Rechazar la solicitud de ${r.first_name} ${r.last_name} (${r.email})?`
    );
    if (!ok) return;
    setActionError(null);
    const { error } = await reject(r.id);
    if (error) setActionError(`No se pudo rechazar: ${error}`);
  }

  return (
    <>
      <span className="eyebrow">Accesos</span>
      <div className="page-header">
        <div>
          <h1>Solicitudes de acceso</h1>
          <p className="course-meta">
            Los alumnos se registran desde el link/QR del curso; aquí los habilitas.
          </p>
        </div>
      </div>

      <div className="topic-actions" style={{ marginBottom: "1rem" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? "" : "secondary"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p>Cargando solicitudes…</p>}
      {error && <p role="alert">{error}</p>}
      {actionError && <p role="alert">{actionError}</p>}

      {!loading && !error && requests.length === 0 && (
        <p>No hay solicitudes en esta vista.</p>
      )}

      {!loading && !error && requests.length > 0 && (
        <table className="users-table">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Curso</th>
              <th>Correo</th>
              <th>Celular</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <RequestRow
                key={r.id}
                request={r}
                onApprove={handleApprove}
                onReject={handleReject}
                busy={busyId === r.id}
              />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
