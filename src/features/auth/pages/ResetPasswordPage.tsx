// src/features/auth/pages/ResetPasswordPage.tsx
//
// Página pública a la que llega el enlace del correo de recuperación
// (redirectTo en resetPasswordForEmail). Supabase detecta el token en
// la URL automáticamente y habilita una sesión temporal que permite
// llamar a updateUser({ password }).

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../shared/lib/supabaseClient";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => navigate("/login"), 2500);
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1>Elegir nueva contraseña</h1>

        {success ? (
          <p className="modal-success">
            Contraseña actualizada correctamente. Te llevamos al login…
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              Nueva contraseña
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </label>
            <label>
              Confirmar contraseña
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </label>
            {error && <p role="alert">{error}</p>}
            <button type="submit" disabled={submitting}>
              {submitting ? "Guardando…" : "Guardar nueva contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
