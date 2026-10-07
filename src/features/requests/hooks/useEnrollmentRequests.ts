// src/features/requests/hooks/useEnrollmentRequests.ts
//
// Solicitudes de acceso (instructor/admin): listar, aprobar y rechazar.
// Aprobar invoca la Edge Function "aprobar-solicitud", que actualiza el
// estado, inscribe al alumno si ya tiene cuenta y le avisa por
// correo/WhatsApp. Rechazar es una actualización directa (RLS lo permite).
//
// El título del curso se obtiene con una segunda consulta para no depender
// del nombre interno de la FK.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../shared/lib/supabaseClient";
import type {
  EnrollmentRequest,
  EnrollmentRequestStatus,
} from "../../../shared/types/database.types";

export interface EnrollmentRequestWithCourse extends EnrollmentRequest {
  course_title: string | null;
}

export function useEnrollmentRequests(status: EnrollmentRequestStatus | "todas" = "pendiente") {
  const [requests, setRequests] = useState<EnrollmentRequestWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("enrollment_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (status !== "todas") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      setError(error.message);
      setRequests([]);
      setLoading(false);
      return;
    }

    const courseIds = [...new Set((data ?? []).map((r) => r.course_id))];
    let titlesById = new Map<string, string>();
    if (courseIds.length > 0) {
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title")
        .in("id", courseIds);
      titlesById = new Map((courses ?? []).map((c) => [c.id, c.title]));
    }

    setError(null);
    setRequests(
      (data ?? []).map((r) => ({
        ...r,
        course_title: titlesById.get(r.course_id) ?? null,
      }))
    );
    setLoading(false);
  }, [status]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function approve(id: string) {
    setBusyId(id);
    try {
      const { data, error } = await supabase.functions.invoke("aprobar-solicitud", {
        body: { request_id: id },
      });
      if (error) return { error: error.message };
      if (data && (data as { error?: string }).error) {
        return { error: (data as { error: string }).error };
      }
      await reload();
      return { error: null };
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setBusyId(id);
    try {
      const { error } = await supabase
        .from("enrollment_requests")
        .update({ status: "rechazado", reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return { error: error.message };
      await reload();
      return { error: null };
    } finally {
      setBusyId(null);
    }
  }

  return { requests, loading, error, busyId, reload, approve, reject };
}
