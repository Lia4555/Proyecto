import { IconIzquierda } from './ui/Icons.jsx'

// Marco visual compartido por Login y Registro:
// panel de marca a la izquierda + tarjeta del formulario a la derecha.
export default function AuthLayout({ titulo, subtitulo, onVolver, children }) {
  return (
    <div className="auth-screen">
      <section className="auth-brandside" aria-hidden="true">
        <div className="auth-brand">
          <span className="brand-mark">DV</span>
          <span className="brand-name">D&apos; VIAJE</span>
        </div>

        <h2 className="auth-claim">
          Gestiona tu flota, tus viajes y tus conductores desde un solo panel.
        </h2>

        <ul className="auth-points">
          <li>Control de vehículos, documentos y mantenimientos</li>
          <li>Servicios, vehículos y alertas en tiempo real</li>
          <li>Acceso protegido por roles y permisos</li>
        </ul>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          {onVolver && (
            <button type="button" className="auth-volver" onClick={onVolver}>
              <IconIzquierda size={15} />
              Volver a la página principal
            </button>
          )}

          <div className="auth-brand compacta">
            <span className="brand-mark">DV</span>
            <span className="brand-name">D&apos; VIAJE</span>
          </div>

          <h1 className="auth-title">{titulo}</h1>
          <p className="auth-sub">{subtitulo}</p>

          {children}
        </div>
      </section>
    </div>
  )
}
