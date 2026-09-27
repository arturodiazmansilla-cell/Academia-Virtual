import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../../../shared/types/database.types";

export function RoleGate({
  allow,
  children,
}: {
  allow: UserRole[];
  children: ReactNode;
}) {
  const { role, loading } = useAuth();

  if (loading) return <p>Cargando…</p>;
  if (!role || !allow.includes(role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
