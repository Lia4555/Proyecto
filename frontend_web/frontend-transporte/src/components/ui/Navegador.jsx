import { IconDerecha, IconIzquierda } from './Icons.jsx'

// ============================================================
// Piezas de navegación compartidas por los dos paneles.
// ============================================================

/**
 * Flechas Atrás / Adelante de la barra superior.
 * Se apagan cuando no hay a dónde ir, para que se vea de un vistazo
 * si queda historial (mismo comportamiento que el navegador).
 */
export function FlechasHistorial({ atras, adelante, puedeVolver, puedeAvanzar }) {
  return (
    <div className="nav-historial" role="group" aria-label="Historial de navegación">
      <button
        type="button"
        className="iconbtn nav-flecha"
        onClick={atras}
        disabled={!puedeVolver}
        aria-label="Volver a la pantalla anterior"
        title="Atrás (Alt + flecha izquierda)"
      >
        <IconIzquierda size={18} />
      </button>
      <button
        type="button"
        className="iconbtn nav-flecha"
        onClick={adelante}
        disabled={!puedeAvanzar}
        aria-label="Ir a la pantalla siguiente"
        title="Adelante (Alt + flecha derecha)"
      >
        <IconDerecha size={18} />
      </button>
    </div>
  )
}

/**
 * Pie de página con la sección anterior y la siguiente, como en la
 * documentación de cualquier sitio: siempre se sabe qué viene después
 * y se puede recorrer todo el panel sin volver al menú.
 *
 * @param anterior  { key, label } o null si es la primera
 * @param siguiente { key, label } o null si es la última
 * @param onIr      recibe la key de la sección elegida
 */
export function PasoSecciones({ anterior, siguiente, onIr }) {
  if (!anterior && !siguiente) return null

  return (
    <nav className="paso-secciones" aria-label="Ir a otra sección">
      {anterior ? (
        <button type="button" className="paso" onClick={() => onIr(anterior.key)}>
          <IconIzquierda size={18} />
          <span className="paso-texto">
            <small>Anterior</small>
            <strong>{anterior.label}</strong>
          </span>
        </button>
      ) : (
        <span className="paso-hueco" aria-hidden="true" />
      )}

      {siguiente ? (
        <button type="button" className="paso derecha" onClick={() => onIr(siguiente.key)}>
          <span className="paso-texto">
            <small>Siguiente</small>
            <strong>{siguiente.label}</strong>
          </span>
          <IconDerecha size={18} />
        </button>
      ) : (
        <span className="paso-hueco" aria-hidden="true" />
      )}
    </nav>
  )
}
