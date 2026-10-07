// src/features/admin/hooks/useUsuarios.ts

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../shared/lib/supabaseClient";

export interface Usuario {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
}

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.functions.invoke("listar-usuarios");

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (data?.error) {
      setError(data.error);
      setLoading(false);
      return;
    }

    setUsuarios(data?.usuarios ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { usuarios, loading, error, reload };
}
