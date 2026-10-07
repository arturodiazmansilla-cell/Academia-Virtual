// src/features/requests/hooks/usePendingRequestsCount.ts
//
// Cantidad de solicitudes pendientes (para la insignia en la navegación).
// RLS filtra automáticamente a los cursos del instructor.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../shared/lib/supabaseClient";
import { useAuth } from "../../auth/hooks/useAuth";

export function usePendingRequestsCount() {
  const { user, profile } = useAuth();
  const [count, setCount] = useState(0);

  const reload = useCallback(async () => {
    if (!user || (profile?.role !== "instructor" && profile?.role !== "admin")) {
      setCount(0);
      return;
    }
    const { count } = await supabase
      .from("enrollment_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pendiente");
    setCount(count ?? 0);
  }, [user, profile]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { count, reload };
}
