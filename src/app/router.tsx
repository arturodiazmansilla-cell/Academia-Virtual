import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { ResetPasswordPage } from "../features/auth/pages/ResetPasswordPage";
import { ProtectedRoute } from "../features/auth/components/ProtectedRoute";
import { RoleGate } from "../features/auth/components/RoleGate";
import { HomePage } from "./HomePage";
import { CourseListPage } from "../features/courses/pages/CourseListPage";
import { CourseEditorPage } from "../features/courses/pages/CourseEditorPage";
import { UsersPage } from "../features/admin/pages/UsersPage";
import { CatalogPage } from "../features/student/pages/CatalogPage";
import { MyCoursesPage } from "../features/student/pages/MyCoursesPage";
import { StudentCoursePage } from "../features/student/pages/StudentCoursePage";
import { EnrollmentPage } from "../features/enrollment/pages/EnrollmentPage";
import { RequestsPage } from "../features/requests/pages/RequestsPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/registro",
    element: <RegisterPage />,
  },
  {
    path: "/restablecer-clave",
    element: <ResetPasswordPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/cursos",
    element: (
      <ProtectedRoute>
        <RoleGate allow={["instructor", "admin"]}>
          <CourseListPage />
        </RoleGate>
      </ProtectedRoute>
    ),
  },
  {
    path: "/cursos/:courseId",
    element: (
      <ProtectedRoute>
        <RoleGate allow={["instructor", "admin"]}>
          <CourseEditorPage />
        </RoleGate>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <RoleGate allow={["admin"]}>
          <UsersPage />
        </RoleGate>
      </ProtectedRoute>
    ),
  },
  {
    path: "/catalogo",
    element: (
      <ProtectedRoute>
        <RoleGate allow={["alumno", "admin"]}>
          <CatalogPage />
        </RoleGate>
      </ProtectedRoute>
    ),
  },
  {
    path: "/mis-cursos",
    element: (
      <ProtectedRoute>
        <RoleGate allow={["alumno", "admin"]}>
          <MyCoursesPage />
        </RoleGate>
      </ProtectedRoute>
    ),
  },
  {
    path: "/aprender/:courseId",
    element: (
      <ProtectedRoute>
        <RoleGate allow={["alumno", "admin"]}>
          <StudentCoursePage />
        </RoleGate>
      </ProtectedRoute>
    ),
  },
  {
    path: "/solicitudes",
    element: (
      <ProtectedRoute>
        <RoleGate allow={["instructor", "admin"]}>
          <RequestsPage />
        </RoleGate>
      </ProtectedRoute>
    ),
  },
  // Ruta pública: no requiere sesión (link/QR del curso)
  {
    path: "/inscripcion/:courseId",
    element: <EnrollmentPage />,
  },
]);
