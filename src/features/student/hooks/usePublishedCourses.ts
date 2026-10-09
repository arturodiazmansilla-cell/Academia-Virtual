// src/features/student/hooks/usePublishedCourses.ts
//
// Cursos visibles en la sección "Cursos": para el alumno solo los publicados;
// para el administrador todos (incluye borradores). Incluye el nombre del
// instructor. Solo lectura.
//
// El nombre del instructor se obtiene con una segunda consulta (en lugar
// de un join embebido) para no depender del nombre interno de la FK.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../shared/lib/supabaseClient";
import type { Course } from "../../../shared/types/database.types";

export interface PublishedCourse extends Course {
  instructor_name: string | null;
}

export function usePublishedCourses(includeAll = false) {
  const [courses, setCourses] = useState<PublishedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("courses").select("*").order("created_at", { ascending: false });
    if (!includeAll) {
      query = query.eq("status", "publicado");
    }
    const { data: courseRows, error: courseError } = await query;

    if (courseError) {
      setError(courseError.message);
      setCourses([]);
      setLoading(false);
      return;
    }

    const instructorIds = [
      ...new Set((courseRows ?? []).map((c) => c.instructor_id).filter(Boolean)),
    ] as string[];

    let namesById = new Map<string, string>();
    if (instructorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", instructorIds);
      namesById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    }

    setError(null);
    setCourses(
      (courseRows ?? []).map((c) => ({
        ...c,
        instructor_name: c.instructor_id ? (namesById.get(c.instructor_id) ?? null) : null,
      }))
    );
    setLoading(false);
  }, [includeAll]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { courses, loading, error, reload };
}