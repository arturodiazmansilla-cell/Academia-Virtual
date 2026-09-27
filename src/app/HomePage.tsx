import { useAuth } from "../features/auth/hooks/useAuth";
import { Link } from "react-router-dom";

export function HomePage() {
  const { profile } = useAuth();

  return (
    <>
      <span className="eyebrow">Inicio</span>
      <h1>Hola, {profile?.full_name ?? "usuario"}</h1>
      <p>
        Este es el punto de partida de la plataforma. Tu rol actual es{" "}
        <strong>{profile?.role ?? "sin rol"}</strong>.
      </p>
      {(profile?.role === "instructor" || profile?.role === "admin") && (
        <p>
          <Link to="/cursos">Ir a mis cursos →</Link>
        </p>
      )}
      <p>
        La vista del alumno, las actividades dinámicas y el panel de
        autorización de accesos se agregan en los siguientes módulos.
      </p>
    </>
  );
}
