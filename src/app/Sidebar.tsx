// src/app/Sidebar.tsx
//
// Menú lateral estilo mockup: panel oscuro redondeado con avatar,
// "Catálogo" expandible por categorías y grados, e items según el rol.

import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";
import { usePendingRequestsCount } from "../features/requests/hooks/usePendingRequestsCount";
import { usePublishedCourses } from "../features/student/hooks/usePublishedCourses";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { CATEGORIES, GRADES, gradeLabel } from "../shared/utils/categories";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  catalog: "M4 6h16M4 12h16M4 18h10",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5",
  support: "M21 12a9 9 0 1 0-3.2 6.9L21 20l-1.2-3.1A8.9 8.9 0 0 0 21 12zM9 12h.01M12 12h.01M15 12h.01",
  requests: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  students: "M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5",
  admin: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function Sidebar() {
  const { profile, signOut } = useAuth();
  const { count: pendingCount } = usePendingRequestsCount();
  const location = useLocation();

  const role = profile?.role;
  const canManageCourses = role === "instructor" || role === "admin";
  const isStudent = role === "alumno";
  const canBrowseCatalog = isStudent || role === "admin";

  // Árbol del catálogo: solo categorías/grados con cursos publicados
  const { courses, reload: reloadCourses } = usePublishedCourses();

  // Refresca el árbol al navegar (p. ej. después de publicar un curso)
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    reloadCourses();
  }, [location.pathname, reloadCourses]);
  const tree = useMemo(() => {
    if (!canBrowseCatalog) return [];
    return CATEGORIES.map((cat) => {
      const inCat = courses.filter((c) => c.grade_category === cat.key);
      const grades = cat.hasGrades
        ? GRADES.filter((g) => inCat.some((c) => c.grade_number === g))
        : [];
      return { cat, count: inCat.length, grades };
    }).filter((t) => t.count > 0);
  }, [courses, canBrowseCatalog]);

  const catalogActive = location.pathname.startsWith("/catalogo");
  const [catalogOpen, setCatalogOpen] = useState(catalogActive);
  const [openCat, setOpenCat] = useState<string | null>(null);

  const initial = (profile?.full_name ?? "U").trim().charAt(0).toUpperCase();

  return (
    <aside className="app-sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden>▲</span>
        <span className="brand-name">Academia Virtual</span>
      </div>

      <div className="avatar-row">
        <span className="avatar">{initial}</span>
      </div>

      <nav>
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          <Icon d={ICONS.dashboard} /> Dashboard
        </NavLink>

        {canBrowseCatalog && (
          <div className="nav-group">
            <button
              type="button"
              className={`nav-toggle${catalogActive ? " active" : ""}`}
              onClick={() => setCatalogOpen((v) => !v)}
              aria-expanded={catalogOpen}
            >
              <Icon d={ICONS.catalog} /> Catálogo
              <span className="chevron"><Chevron open={catalogOpen} /></span>
            </button>
            {catalogOpen && (
              <div className="nav-sub">
                <NavLink to="/catalogo" end className={({ isActive }) => (isActive ? "active sub-active" : "")}>
                  Todos los cursos
                </NavLink>
                {tree.map(({ cat, grades }) => {
                  const catPath = `/catalogo/${cat.key}`;
                  const catActive = location.pathname.startsWith(catPath);
                  const isOpen = openCat === cat.key || catActive;
                  return (
                    <div key={cat.key}>
                      <div className="nav-sub-row">
                        <NavLink to={catPath} end className={({ isActive }) => (isActive ? "active sub-active" : "")}>
                          {cat.label}
                        </NavLink>
                        {cat.hasGrades && grades.length > 0 && (
                          <button
                            type="button"
                            className="mini-toggle"
                            onClick={() => setOpenCat(isOpen && openCat === cat.key ? null : cat.key)}
                            aria-label={cat.label}
                          >
                            <Chevron open={isOpen} />
                          </button>
                        )}
                      </div>
                      {isOpen && grades.map((g) => (
                        <NavLink
                          key={g}
                          to={`${catPath}/${g}`}
                          className={({ isActive }) => (isActive ? "active sub-active grade-link" : "grade-link")}
                        >
                          {gradeLabel(cat.key, g)}
                        </NavLink>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {canManageCourses && (
          <NavLink to="/cursos" className={({ isActive }) => (isActive ? "active" : "")}>
            <Icon d={ICONS.book} /> Mis cursos
          </NavLink>
        )}
        {isStudent && (
          <NavLink to="/mis-cursos" className={({ isActive }) => (isActive ? "active" : "")}>
            <Icon d={ICONS.book} /> Mis cursos
          </NavLink>
        )}
        {canManageCourses && (
          <NavLink to="/alumnos" className={({ isActive }) => (isActive ? "active" : "")}>
            <Icon d={ICONS.students} /> Alumnos
          </NavLink>
        )}
        {canManageCourses && (
          <NavLink to="/solicitudes" className={({ isActive }) => (isActive ? "active" : "")}>
            <Icon d={ICONS.requests} /> Solicitudes
            {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
          </NavLink>
        )}
        {role === "admin" && (
          <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>
            <Icon d={ICONS.admin} /> Panel admin
          </NavLink>
        )}
        <NavLink to="/soporte" className={({ isActive }) => (isActive ? "active" : "")}>
          <Icon d={ICONS.support} /> Soporte
        </NavLink>
      </nav>

      <ThemeSwitcher />
      <div className="user-box">
        <span className="name">{profile?.full_name ?? "Usuario"}</span>
        <span className="role">{profile?.role ?? "sin rol"}</span>
        <button type="button" onClick={() => signOut()}>Cerrar sesión</button>
      </div>
    </aside>
  );
}
