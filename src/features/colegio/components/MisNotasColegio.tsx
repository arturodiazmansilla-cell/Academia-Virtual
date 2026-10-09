// src/features/colegio/components/MisNotasColegio.tsx
//
// El alumno ve SOLO sus propias notas del colegio en el curso virtual
// (la función puente empareja por nombre y no expone a los demás).

import { Fragment, useEffect, useState } from "react";
import {
  callAcademico,
  type ColegioEvaluation,
  type ColegioNotaAlumno,
} from "../lib/academicoClient";
import { agruparEvaluaciones, fmtFechaEval } from "../lib/criterios";

interface MisNotas {
  evaluations: ColegioEvaluation[];
  student: ColegioNotaAlumno | null;
  vinculo: string;
}

export function MisNotasColegio({ courseId }: { courseId: string }) {
  const [data, setData] = useState<MisNotas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    callAcademico<MisNotas>("mis-notas", { virtual_course_id: courseId })
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : "No se pudieron cargar tus notas";
        // Sin vinculación: no se muestra la sección
        if (/vinculaci/i.test(msg)) {
          setData(null);
        } else {
          setError(msg);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [courseId]);

  if (loading) return null;
  if (error) return <p role="alert">{error}</p>;
  if (!data) return null;

  const grupos = agruparEvaluaciones(data.evaluations);

  return (
    <section style={{ marginTop: "2rem", marginBottom: "1.5rem" }}>
      <h2>Mis notas del colegio</h2>
      <p className="course-meta">{data.vinculo}</p>

      {!data.student ? (
        <p>
          No encontramos tus notas con el nombre de tu cuenta. Avísale a tu
          instructor para que revise tu registro en el colegio.
        </p>
      ) : data.evaluations.length === 0 ? (
        <p>Todavía no hay evaluaciones registradas para ti en el colegio.</p>
      ) : (
        <>
          <div className="colegio-tabla-wrap">
            <table className="colegio-tabla">
              <thead>
                <tr>
                  <th>Criterio</th>
                  <th>Evaluación</th>
                  <th>Fecha</th>
                  <th className="num">Nota</th>
                  <th className="num">Máx.</th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((g) => (
                  <Fragment key={g.key}>
                    <tr>
                      <td colSpan={5}>
                        <strong>{g.etiqueta}</strong>
                      </td>
                    </tr>
                    {g.evaluaciones.map((e) => (
                      <tr key={e.id}>
                        <td>{g.etiqueta.split(" · ")[0]}</td>
                        <td>{e.title}</td>
                        <td>{fmtFechaEval(e.evaluation_date)}</td>
                        <td className="num">{data.student!.scores[e.id] ?? "—"}</td>
                        <td className="num">{e.maximum_score}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: "0.75rem" }}>
            <strong>Promedio: {data.student.promedio ?? "—"}</strong>
          </p>
        </>
      )}
    </section>
  );
}
