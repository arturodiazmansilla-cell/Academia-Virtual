import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const canManageCourses = profile?.role === "instructor" || profile?.role === "admin";

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
