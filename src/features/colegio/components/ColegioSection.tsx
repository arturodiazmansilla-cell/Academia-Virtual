// src/features/colegio/components/ColegioSection.tsx
//
// Vinculación ligera con el Sistema Académico del colegio:
// el curso virtual se liga a un curso/paralelo/materia del colegio
// y desde aquí se ven sus notas y asistencia (solo lectura).

import { useEffect, useState } from "react";
import { supabase } from "../../../shared/lib/supabaseClient";
import {
  callAcademico,
  type ColegioAsistenciaAlumno,
  type ColegioCurso,
  type ColegioEvaluation,
  type ColegioMateria,
  type ColegioNotaAlumno,
  type ColegioParalelo,
} from "../lib/academicoClient";

interface Vinculo {
  virtual_course_id: string;
  colegio_curso_id: string;
  colegio_curso_nombre: string;
  colegio_paralelo_id: string | null;
  colegio_paralelo_nombre: string;
  colegio_materia_id: string | null;
  colegio_materia_nombre: string;
}

function fmtFecha(fecha: string) {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ColegioSection({ courseId }: { courseId: string }) {
  const [vinculo, setVinculo] = useState<Vinculo | null>(null);
  const [loading, setLoading] = useState(true);

  const [cursos, setCursos] = useState<ColegioCurso[]>([]);
  const [paralelos, setParalelos] = useState<ColegioParalelo[]>([]);
  const [materias, setMaterias] = useState<ColegioMateria[]>([]);
  const [selCurso, setSelCurso] = useState("");
  const [selParalelo, setSelParalelo] = useState("");
  const [selMateria, setSelMateria] = useState("");
  const [listError, setListError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [tab, setTab] = useState<"notas" | "asistencia">("notas");
  const [notas, setNotas] = useState<{ evaluations: ColegioEvaluation[]; students: ColegioNotaAlumno[] } | null>(null);
  const [asistencia, setAsistencia] = useState<{ sessions: number; students: ColegioAsistenciaAlumno[] } | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  async function loadVinculo() {
    setLoading(true);
    const { data } = await supabase
      .from("curso_vinculaciones")
      .select("*")
      .eq("virtual_course_id", courseId)
      .maybeSingle();
    setVinculo((data as Vinculo | null) ?? null);
    setLoading(false);
  }

  useEffect(() => {
    loadVinculo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function loadListas() {
    setListError(null);
    try {
      const [c, m] = await Promise.all([
        callAcademico<ColegioCurso[]>("cursos"),
        callAcademico<ColegioMateria[]>("materias"),
      ]);
      setCursos(c);
      setMaterias(m);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "No se pudo cargar el colegio");
    }
  }

  useEffect(() => {
    if (!loading && !vinculo) loadListas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, vinculo]);

  async function handleCursoChange(id: string) {
    setSelCurso(id);
    setSelParalelo("");
    setParalelos([]);
    if (!id) return;
    try {
      setParalelos(await callAcademico<ColegioParalelo[]>("paralelos", { curso_id: id }));
    } catch (e) {
      setListError(e instanceof Error ? e.message : "No se pudieron cargar los paralelos");
    }
  }

  async function handleVincular() {
    if (!selCurso || !selMateria) {
      setSaveError("Selecciona el curso y la materia del colegio.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const curso = cursos.find((c) => c.id === selCurso);
      const paralelo = paralelos.find((p) => p.id === selParalelo);
      const materia = materias.find((m) => m.id === selMateria);
      const { error } = await supabase.from("curso_vinculaciones").upsert(
        {
          virtual_course_id: courseId,
          colegio_curso_id: selCurso,
          colegio_curso_nombre: curso?.name ?? "",
          colegio_paralelo_id: selParalelo || null,
          colegio_paralelo_nombre: paralelo?.name ?? "",
          colegio_materia_id: selMateria,
          colegio_materia_nombre: materia?.name ?? "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "virtual_course_id" }
      );
      if (error) throw new Error(error.message);
      setNotas(null);
      setAsistencia(null);
      setEditing(false);
      await loadVinculo();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "No se pudo guardar la vinculación");
    } finally {
      setSaving(false);
    }
  }

  async function startEditing() {
    if (!vinculo) return;
    setEditing(true);
    setSaveError(null);
    await loadListas();
    setSelCurso(vinculo.colegio_curso_id);
    setSelMateria(vinculo.colegio_materia_id ?? "");
    setSelParalelo(vinculo.colegio_paralelo_id ?? "");
    try {
      const pars = await callAcademico<ColegioParalelo[]>("paralelos", {
        curso_id: vinculo.colegio_curso_id,
      });
      setParalelos(pars);
    } catch {
      // si falla, igual se puede editar con los paralelos vacíos
    }
  }

  async function handleDesvincular() {
    const ok = window.confirm(
      "¿Quitar la vinculación con el colegio?\n\nSe dejarán de mostrar las notas y asistencia del colegio en este curso."
    );
    if (!ok) return;
    const { error } = await supabase
      .from("curso_vinculaciones")
      .delete()
      .eq("virtual_course_id", courseId);
    if (!error) {
      setVinculo(null);
      setNotas(null);
      setAsistencia(null);
      setSelCurso("");
      setSelParalelo("");
      setSelMateria("");
      loadListas();
    }
  }

  async function loadTabData(which: "notas" | "asistencia") {
    if (!vinculo) return;
    setDataLoading(true);
    setDataError(null);
    try {
      const params = {
        curso_id: vinculo.colegio_curso_id,
        paralelo_id: vinculo.colegio_paralelo_id ?? undefined,
        materia_id: vinculo.colegio_materia_id ?? undefined,
      };
      if (which === "notas") {
        setNotas(await callAcademico("notas", params));
      } else {
        setAsistencia(await callAcademico("asistencia", params));
      }
    } catch (e) {
      setDataError(e instanceof Error ? e.message : "No se pudieron cargar los datos");
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    if (vinculo) {
      setNotas(null);
      setAsistencia(null);
      loadTabData(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vinculo]);

  function switchTab(which: "notas" | "asistencia") {
    setTab(which);
    loadTabData(which);
  }

  if (loading) return <p>Cargando vinculación…</p>;

  return (
    <section style={{ marginTop: "2rem", marginBottom: "1.5rem" }}>
      <h2>Colegio</h2>
      <p className="course-meta">
        Vincula este curso virtual con el Sistema Académico del colegio para ver
        sus notas y asistencia sin salir de aquí.
      </p>

      {vinculo && !editing ? (
        <>
          <p>
            <strong>Vinculado con:</strong> {vinculo.colegio_curso_nombre}
            {vinculo.colegio_paralelo_nombre ? ` · Paralelo ${vinculo.colegio_paralelo_nombre}` : ""}
            {vinculo.colegio_materia_nombre ? ` · ${vinculo.colegio_materia_nombre}` : ""}
          </p>
          <div className="topic-actions" style={{ marginBottom: "1rem" }}>
            <button
              type="button"
              className={tab === "notas" ? "" : "secondary"}
              onClick={() => switchTab("notas")}
            >
              Notas
            </button>
            <button
              type="button"
              className={tab === "asistencia" ? "" : "secondary"}
              onClick={() => switchTab("asistencia")}
            >
              Asistencia
            </button>
            <button type="button" className="secondary" onClick={startEditing}>
              Cambiar vinculación
            </button>
            <button type="button" className="danger" onClick={handleDesvincular}>
              Desvincular
            </button>
          </div>

          {dataLoading && <p>Cargando datos del colegio…</p>}
          {dataError && <p role="alert">{dataError}</p>}

          {!dataLoading && !dataError && tab === "notas" && notas && (
            <>
              {notas.evaluations.length === 0 ? (
                <p>Todavía no hay evaluaciones registradas en el colegio para esta vinculación.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Alumno</th>
                        {notas.evaluations.map((e) => (
                          <th key={e.id} title={`${e.title} · ${fmtFecha(e.evaluation_date)}`}>
                            {e.title.length > 18 ? e.title.slice(0, 18) + "…" : e.title}
                          </th>
                        ))}
                        <th>Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notas.students.map((s) => (
                        <tr key={s.id}>
                          <td>{s.name}</td>
                          {notas.evaluations.map((e) => (
                            <td key={e.id}>{s.scores[e.id] ?? "—"}</td>
                          ))}
                          <td>
                            <strong>{s.promedio ?? "—"}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {!dataLoading && !dataError && tab === "asistencia" && asistencia && (
            <>
              {asistencia.sessions === 0 ? (
                <p>Todavía no hay sesiones de clase registradas en el colegio para esta vinculación.</p>
              ) : (
                <>
                  <p className="course-meta">{asistencia.sessions} sesiones registradas.</p>
                  <div style={{ overflowX: "auto" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Alumno</th>
                          <th>Presente</th>
                          <th>Ausente</th>
                          <th>Atraso</th>
                          <th>Licencia</th>
                          <th>% Asistencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asistencia.students.map((s) => (
                          <tr key={s.id}>
                            <td>{s.name}</td>
                            <td>{s.presente}</td>
                            <td>{s.ausente}</td>
                            <td>{s.tarde}</td>
                            <td>{s.licencia}</td>
                            <td>
                              <strong>{s.porcentaje !== null ? `${s.porcentaje}%` : "—"}</strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </>
      ) : (
        <>
          {listError && <p role="alert">{listError}</p>}
          <div className="filters-row">
            <label>
              Curso del colegio
              <select value={selCurso} onChange={(e) => handleCursoChange(e.target.value)}>
                <option value="">Seleccionar…</option>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.level ? ` (${c.level})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Paralelo
              <select
                value={selParalelo}
                onChange={(e) => setSelParalelo(e.target.value)}
                disabled={!selCurso}
              >
                <option value="">Todos</option>
                {paralelos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Materia
              <select value={selMateria} onChange={(e) => setSelMateria(e.target.value)}>
                <option value="">Seleccionar…</option>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {saveError && <p role="alert">{saveError}</p>}
          <div className="topic-actions">
            <button type="button" onClick={handleVincular} disabled={saving}>
              {saving ? "Vinculando…" : editing ? "Guardar cambios" : "Vincular con el colegio"}
            </button>
            {editing && (
              <button type="button" className="secondary" onClick={() => setEditing(false)}>
                Cancelar
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
