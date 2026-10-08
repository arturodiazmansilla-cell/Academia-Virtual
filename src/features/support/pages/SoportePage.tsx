// src/features/support/pages/SoportePage.tsx
//
// Página de ayuda para el alumno/instructor.

// ⚠️ CONFIGURAR: número de WhatsApp de soporte en formato internacional.
// Si se deja vacío, se muestra un mensaje genérico en su lugar.
const SUPPORT_WHATSAPP = "";

export function SoportePage() {
  return (
    <>
      <span className="eyebrow">Ayuda</span>
      <div className="page-header">
        <div>
          <h1>Soporte</h1>
          <p className="course-meta">¿Necesitas ayuda? Aquí tienes las respuestas más comunes.</p>
        </div>
      </div>

      <div className="course-list">
        <div className="course-row">
          <span className="status-bar publicado" />
          <div className="course-row-info">
            <h3>¿Cómo me inscribo a un curso?</h3>
            <p>
              Ve al <strong>Catálogo</strong>, elige la categoría y el curso que te
              interese y pulsa <strong>Inscribirme</strong>. Si el curso requiere
              aprobación, tu solicitud quedará pendiente hasta que el instructor
              la apruebe.
            </p>
          </div>
        </div>

        <div className="course-row">
          <span className="status-bar publicado" />
          <div className="course-row-info">
            <h3>¿Cómo entro a un curso aprobado?</h3>
            <p>
              Al aprobar tu solicitud recibirás un <strong>enlace de acceso
              directo</strong> por correo y WhatsApp. Con un clic entras a{" "}
              <strong>Mis cursos</strong> sin registrarte. Si el enlace vence,
              inicia sesión con tu correo y usa "¿Olvidaste tu contraseña?".
            </p>
          </div>
        </div>

        <div className="course-row">
          <span className="status-bar publicado" />
          <div className="course-row-info">
            <h3>¿Olvidé mi contraseña?</h3>
            <p>
              En la pantalla de acceso pulsa <strong>"¿Olvidaste tu
              contraseña?"</strong>, escribe tu correo y sigue el enlace que te
              llegue para definir una nueva clave.
            </p>
          </div>
        </div>

        <div className="course-row">
          <span className="status-bar publicado" />
          <div className="course-row-info">
            <h3>Contacto directo</h3>
            {SUPPORT_WHATSAPP ? (
              <p>
                <a
                  className="secondary"
                  href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent("Hola, necesito ayuda con Academia Virtual")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Escríbenos por WhatsApp
                </a>
              </p>
            ) : (
              <p>Pregunta a tu instructor por el contacto de soporte.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
