// src/features/requests/hooks/useMyRequests.ts
//
// Solicitudes de acceso del alumno actual (por curso), para mostrar
// "Solicitud pendiente" en el catálogo en vez del botón de inscribirse.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../shared/lib/supabaseClient";
import { useAuth } from "../../auth/hooks/useAuth";

export function useMyRequests() {
  const { user } = useAuth();
  const [statusByCourse, setStatusByCourse] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user?.email) {
      setStatusByCourse(new Map());
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("enrollment_requests")
      .select("course_id, status")
      .ilike("email", user.email);
    setStatusByCourse(new Map((data ?? []).map((r) => [r.course_id, r.status])));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { statusByCourse, loading, reload };
}
