import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../../../shared/lib/supabaseClient";

export function LoginPage() {
  const { signInWithPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Estado del modal "olvidé mi contraseña"
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signInWithPassword(email, password);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    navigate("/");
  }

  function openForgotPassword() {
    setForgotEmail(email); // si ya escribió su correo en el login, lo reutiliza
    setForgotMessage(null);
    setForgotError(null);
    setShowForgotPassword(true);
  }

  function closeForgotPassword() {
    setShowForgotPassword(false);
  }

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault();
    setForgotError(null);
    setForgotMessage(null);
    setForgotSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/restablecer-clave`,
    });

    setForgotSubmitting(false);

    if (error) {
      setForgotError(error.message);
      return;
    }

    setForgotMessage(
      "Si ese correo está registrado, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada (y spam)."
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1>Academia Virtual</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Correo
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
        <p>
          <button type="button" className="secondary auth-link-button" onClick={openForgotPassword}>
            ¿Olvidaste tu contraseña?
          </button>
        </p>
        <p>
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </div>

      {showForgotPassword && (
        <div className="modal-overlay" onClick={closeForgotPassword}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Restablecer contraseña</h2>
            <p>Escribe tu correo y te enviaremos un enlace para elegir una nueva contraseña.</p>
            <form onSubmit={handleForgotPassword}>
              <label>
                Correo
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              {forgotError && <p role="alert">{forgotError}</p>}
              {forgotMessage && <p className="modal-success">{forgotMessage}</p>}
              <div className="topic-actions">
                <button type="submit" disabled={forgotSubmitting}>
                  {forgotSubmitting ? "Enviando…" : "Enviar enlace"}
                </button>
                <button type="button" className="secondary" onClick={closeForgotPassword}>
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
