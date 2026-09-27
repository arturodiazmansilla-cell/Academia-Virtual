import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AppShell } from "../../../app/AppShell";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <p style={{ padding: "2rem" }}>Cargando…</p>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <AppShell>{children}</AppShell>;
}
