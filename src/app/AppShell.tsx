import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";
import { usePendingRequestsCount } from "../features/requests/hooks/usePendingRequestsCount";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const canManageCourses = profile?.role === "instructor" || profile?.role === "admin";
  const isStudent = profile?.role === "alumno";
  const canBrowseCatalog = isStudent || profile?.role === "admin";
  const canReviewRequests = canManageCourses;
  const { count: pendingCount } = usePendingRequestsCount();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand">Academia Virtual</div>
        <nav>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Inicio
          </NavLink>
          {canManageCourses && (
            <NavLink to="/cursos" className={({ isActive }) => (isActive ? "active" : "")}>
              Mis cursos
            </NavLink>
          )}
          {canReviewRequests && (
            <NavLink to="/solicitudes" className={({ isActive }) => (isActive ? "active" : "")}>
              Solicitudes{pendingCount > 0 ? ` (${pendingCount})` : ""}
            </NavLink>
          )}
          {canBrowseCatalog && (
            <>
              <NavLink to="/catalogo" className={({ isActive }) => (isActive ? "active" : "")}>
                Catálogo
              </NavLink>
              {isStudent && (
                <NavLink to="/mis-cursos" className={({ isActive }) => (isActive ? "active" : "")}>
                  Mis cursos
                </NavLink>
              )}
            </>
          )}
          {profile?.role === "admin" && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>
              Panel admin
            </NavLink>
          )}
        </nav>
        <ThemeSwitcher />
        <div className="user-box">
          <span className="name">{profile?.full_name ?? "Usuario"}</span>
          <span className="role">{profile?.role ?? "sin rol"}</span>
          <button onClick={() => signOut()}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}
