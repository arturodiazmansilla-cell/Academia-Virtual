// src/features/colegio/components/ColegioSection.tsx
//
// Vinculación ligera con el Sistema Académico del colegio:
// el curso virtual se liga a un curso/paralelo/materia del colegio
// y desde aquí se ven sus notas y asistencia (solo lectura).

import { Fragment, useEffect, useRef, useState, type RefObject } from "react";
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

import { ReporteColegioModal, type ColumnaReporte } from "./ReporteColegioModal";
import { ReportePlanillaModal } from "./ReportePlanillaModal";
import { construirPlanilla } from "../lib/planilla";
import { agruparEvaluaciones, criterioClase, fmtFechaEval, promedioGrupo } from "../lib/criterios";

interface Vinculo {
  virtual_course_id: string;
  colegio_curso_id: string;
  colegio_curso_nombre: string;
  colegio_paralelo_id: string | null;
  colegio_paralelo_nombre: string;
  colegio_materia_id: string | null;
  colegio_materia_nombre: string;
}

/** Barra de desplazamiento horizontal ubicada arriba de la tabla,
 *  sincronizada en ambos sentidos con el desplazamiento de la tabla. */
function BarraScrollArriba({ targetRef }: { targetRef: RefObject<HTMLDivElement | null> }) {
  const barraRef = useRef<HTMLDivElement | null>(null);
  const rellenoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const tabla = targetRef.current;
    const barra = barraRef.current;
    const relleno = rellenoRef.current;
    if (!tabla || !barra || !relleno) return;

    const actualizar = () => {
      relleno.style.width = `${tabla.scrollWidth}px`;
      // Solo se muestra si la tabla realmente necesita desplazamiento
      barra.style.display = tabla.scrollWidth > tabla.clientWidth + 1 ? "" : "none";
    };
    actualizar();

    const alMoverBarra = () => {
      tabla.scrollLeft = barra.scrollLeft;
    };
    const alMoverTabla = () => {
      barra.scrollLeft = tabla.scrollLeft;
    };
    barra.addEventListener("scroll", alMoverBarra);
    tabla.addEventListener("scroll", alMoverTabla);
    window.addEventListener("resize", actualizar);
    return () => {
      barra.removeEventListener("scroll", alMoverBarra);
      tabla.removeEventListener("scroll", alMoverTabla);
      window.removeEventListener("resize", actualizar);
    };
  }, [targetRef]);

  return (
    <div ref={barraRef} className="colegio-scroll-top" aria-hidden="true">
      <div ref={rellenoRef} className="colegio-scroll-top-inner" />
    </div>
  );
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
  const [showReport, setShowReport] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  const notasWrapRef = useRef<HTMLDivElement | null>(null);
  const asistenciaWrapRef = useRef<HTMLDivElement | null>(null);

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
    setPage(0);
    loadTabData(which);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(0);
  }

  /** Alumnos filtrados por el buscador (se aplica a ambas pestañas) */
  function filtrarPorNombre<T extends { name: string }>(lista: T[]): T[] {
    const q = search.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((s) => s.name.toLowerCase().includes(q));
  }

  const notasVisibles = notas ? filtrarPorNombre(notas.students) : [];
  const asistenciaVisibles = asistencia ? filtrarPorNombre(asistencia.students) : [];
  const visibles = tab === "notas" ? notasVisibles : asistenciaVisibles;
  const totalPages = Math.max(1, Math.ceil(visibles.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const notasPage = notasVisibles.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const asistenciaPage = asistenciaVisibles.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  /** Evaluaciones agrupadas por criterio (SER/SABER/HACER), ordenadas por fecha ascendente */
  const gruposEval = notas ? agruparEvaluaciones(notas.evaluations) : [];
  const evalsOrdenadas = gruposEval.flatMap((g) => g.evaluaciones);

  function renderPaginacion() {
    if (totalPages <= 1) return null;
    return (
      <div className="topic-actions" style={{ marginTop: "0.75rem", alignItems: "center" }}>
        <button
          type="button"
          className="secondary"
          disabled={safePage === 0}
          onClick={() => setPage(safePage - 1)}
        >
          ← Anterior
        </button>
        <span className="course-meta">
          Página {safePage + 1} de {totalPages} · {visibles.length} alumno
          {visibles.length === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          className="secondary"
          disabled={safePage >= totalPages - 1}
          onClick={() => setPage(safePage + 1)}
        >
          Siguiente →
        </button>
      </div>
    );
  }

  const vinculoLabel = vinculo
    ? `${vinculo.colegio_curso_nombre}${
        vinculo.colegio_paralelo_nombre ? ` · Paralelo ${vinculo.colegio_paralelo_nombre}` : ""
      }${vinculo.colegio_materia_nombre ? ` · ${vinculo.colegio_materia_nombre}` : ""}`
    : "";

  /** Datos del reporte según la pestaña activa (solo lo que se está mostrando, con el filtro aplicado) */
  function reportData() {
    if (tab === "asistencia" && asistencia) {
      const columnas: ColumnaReporte[] = [
        { texto: "Alumno" },
        { texto: "Presente" },
        { texto: "Ausente" },
        { texto: "Atraso" },
        { texto: "Licencia" },
        { texto: "% Asistencia" },
      ];
      const filas = asistenciaVisibles.map((s) => [
        s.name,
        s.presente,
        s.ausente,
        s.tarde,
        s.licencia,
        s.porcentaje !== null ? `${s.porcentaje}%` : null,
      ]);
      return {
        titulo: "Asistencia del colegio",
        columnas,
        filas,
        nombreBase: "asistencia-colegio",
      };
    }
    return null;
  }

  const report = showReport ? reportData() : null;
  const subtituloReporte =
    vinculoLabel + (search.trim() ? ` · Filtro: "${search.trim()}"` : "");

  /** Planilla oficial para la pestaña Notas (con el filtro aplicado) */
  const planillaNotas =
    showReport && tab === "notas" && notas && vinculo
      ? construirPlanilla(gruposEval, notasVisibles, {
          area: vinculo.colegio_materia_nombre || "—",
          curso: vinculo.colegio_curso_nombre || "—",
        })
      : null;

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
            <button
              type="button"
              className="secondary"
              style={{ marginLeft: "auto" }}
              onClick={() => setShowReport(true)}
              disabled={
                dataLoading ||
                (tab === "notas"
                  ? !notas || notas.evaluations.length === 0
                  : !asistencia || asistencia.sessions === 0)
              }
            >
              Reporte PDF / Excel
            </button>
          </div>

          {dataLoading && <p>Cargando datos del colegio…</p>}
          {dataError && <p role="alert">{dataError}</p>}

          {!dataLoading && !dataError && (
            <div className="filters-row">
              <label>
                Buscar alumno
                <input
                  type="search"
                  placeholder="Ej. María Pérez"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </label>
            </div>
          )}

          {!dataLoading && !dataError && tab === "notas" && notas && (
            <>
              {notas.evaluations.length === 0 ? (
                <p>Todavía no hay evaluaciones registradas en el colegio para esta vinculación.</p>
              ) : notasPage.length === 0 ? (
                <p>Sin alumnos que coincidan con la búsqueda.</p>
              ) : (
                <>
                  <BarraScrollArriba
                    key={`notas-${safePage}-${search}-${evalsOrdenadas.length}`}
                    targetRef={notasWrapRef}
                  />
                  <div className="colegio-tabla-wrap" ref={notasWrapRef}>
                  <table className="colegio-tabla">
                    <thead>
                      <tr>
                        <th rowSpan={2}>Alumno</th>
                        {gruposEval.map((g) => (
                          <th
                            key={g.key}
                            colSpan={g.evaluaciones.length + 1}
                            className={`num ${criterioClase(g.key)}`}
                          >
                            {g.etiqueta}
                          </th>
                        ))}
                        <th rowSpan={2} className="num">
                          Prom.
                        </th>
                      </tr>
                      <tr>
                        {gruposEval.map((g) => (
                          <Fragment key={g.key}>
                            {g.evaluaciones.map((e) => (
                              <th key={e.id} className="num">
                                <span className="eval-titulo">{e.title}</span>
                                <span className="eval-meta">
                                  {fmtFechaEval(e.evaluation_date)} · máx {e.maximum_score}
                                </span>
                              </th>
                            ))}
                            <th className={`num ${criterioClase(g.key)}`}>Prom.</th>
                          </Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {notasPage.map((s) => (
                        <tr key={s.id}>
                          <td>{s.name}</td>
                          {gruposEval.map((g) => (
                            <Fragment key={g.key}>
                              {g.evaluaciones.map((e) => (
                                <td key={e.id} className="num">
                                  {s.scores[e.id] ?? "—"}
                                </td>
                              ))}
                              <td className="num">
                                {promedioGrupo(s.scores, g.evaluaciones) ?? "—"}
                              </td>
                            </Fragment>
                          ))}
                          <td className="num">
                            <strong>{s.promedio ?? "—"}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              )}
              {renderPaginacion()}
            </>
          )}

          {!dataLoading && !dataError && tab === "asistencia" && asistencia && (
            <>
              {asistencia.sessions === 0 ? (
                <p>Todavía no hay sesiones de clase registradas en el colegio para esta vinculación.</p>
              ) : asistenciaPage.length === 0 ? (
                <p>Sin alumnos que coincidan con la búsqueda.</p>
              ) : (
                <>
                  <p className="course-meta">{asistencia.sessions} sesiones registradas.</p>
                  <BarraScrollArriba
                    key={`asis-${safePage}-${search}-${asistencia.sessions}`}
                    targetRef={asistenciaWrapRef}
                  />
                  <div className="colegio-tabla-wrap" ref={asistenciaWrapRef}>
                    <table className="colegio-tabla">
                      <thead>
                        <tr>
                          <th>Alumno</th>
                          <th className="num">Presente</th>
                          <th className="num">Ausente</th>
                          <th className="num">Atraso</th>
                          <th className="num">Licencia</th>
                          <th className="num">% Asistencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asistenciaPage.map((s) => (
                          <tr key={s.id}>
                            <td>{s.name}</td>
                            <td className="num">{s.presente}</td>
                            <td className="num">{s.ausente}</td>
                            <td className="num">{s.tarde}</td>
                            <td className="num">{s.licencia}</td>
                            <td className="num">
                              <strong>{s.porcentaje !== null ? `${s.porcentaje}%` : "—"}</strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {renderPaginacion()}
            </>
          )}

          {showReport && planillaNotas && (
            <ReportePlanillaModal
              planilla={planillaNotas}
              filtro={search.trim() || undefined}
              onClose={() => setShowReport(false)}
            />
          )}
          {showReport && report && (
            <ReporteColegioModal
              titulo={report.titulo}
              subtitulo={subtituloReporte}
              columnas={report.columnas}
              filas={report.filas}
              nombreBase={report.nombreBase}
              onClose={() => setShowReport(false)}
            />
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
