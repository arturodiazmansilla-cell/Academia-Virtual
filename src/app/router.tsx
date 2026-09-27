import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { ProtectedRoute } from "../features/auth/components/ProtectedRoute";
import { RoleGate } from "../features/auth/components/RoleGate";
import { HomePage } from "./HomePage";
import { CourseListPage } from "../features/courses/pages/CourseListPage";
import { CourseEditorPage } from "../features/courses/pages/CourseEditorPage";

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
    // Ejemplo de cómo se protegerán las rutas de admin en el próximo módulo.
    path: "/admin",
    element: (
      <ProtectedRoute>
        <RoleGate allow={["admin"]}>
          <div>Panel admin (placeholder — módulo 6)</div>
        </RoleGate>
      </ProtectedRoute>
    ),
  },
]);
