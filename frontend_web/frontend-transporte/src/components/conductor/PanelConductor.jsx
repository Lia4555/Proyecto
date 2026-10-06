import { useDatosConductor } from '../../hooks/useDatosConductor.js'
import { nombreVisible } from '../../lib/session.js'
import BotonAvatar from '../perfil/BotonAvatar.jsx'
import { useToast } from '../ui/Toast.jsx'
import { FlechasHistorial, PasoSecciones } from '../ui/Navegador.jsx'
import MisServicios from './MisServicios.jsx'
import MiVehiculo from './MiVehiculo.jsx'
import MisAlertas from './MisAlertas.jsx'
import { IconActualizar, IconAlerta, IconBus, IconCampana, IconRuta, IconSalir } from '../ui/Icons.jsx'
import '../../conductor.css'

// ============================================================
// Panel del CONDUCTOR
// ------------------------------------------------------------
// Deliberadamente distinto al del administrador: tres pantallas,
// sin tablas ni formularios genéricos. Un conductor entra desde el
// móvil a mirar su próximo viaje y a marcar en qué punto va, así
// que todo está en fichas grandes y con pocas decisiones.
//
// Lo que se ve aquí es exactamente lo que el backend le permite:
// no hay ninguna pantalla escondida por CSS.
// ============================================================

export const SECCIONES_CONDUCTOR = [
  { key: 'mis-servicios', label: 'Mis servicios', Icono: IconRuta },
  { key: 'mi-vehiculo', label: 'Mi vehículo', Icono: IconBus },
  { key: 'mis-alertas', label: 'Mis alertas', Icono: IconCampana }
]

const SECCIONES = SECCIONES_CONDUCTOR
const CLAVES = SECCIONES.map((s) => s.key)

// La navegación llega desde App.jsx: portada, login y panel comparten un
// único historial, y por eso las flechas del navegador se mueven dentro de
// la aplicación en vez de sacarte de ella.
export default function PanelConductor({ usuario, nav, onLogout }) {
  const toast = useToast()
  const { datos, cargando, error, recargar } = useDatosConductor()

  const { ruta, ir, atras, adelante, puedeVolver, puedeAvanzar } = nav

  const posicion = CLAVES.indexOf(ruta)
  const anterior = posicion > 0 ? SECCIONES[posicion - 1] : null
  const siguiente = posicion < SECCIONES.length - 1 ? SECCIONES[posicion + 1] : null

  const sinResolver = (datos.alertas || []).filter((a) => !a.estado_resuelta).length

  // Tras guardar un cambio se vuelven a pedir los datos para que la pantalla
  // muestre lo que quedó guardado de verdad, no lo que creemos que guardamos.
  const actualizar = () => recargar({ silencioso: true })

  return (
    <div className="conductor">
      <a className="skip-link" href="#contenido">Ir al contenido</a>

      <header className="cond-topbar">
        <div className="cond-marca">
          <span className="brand-mark">DV</span>
          <span className="brand-name">
            D&apos; VIAJE
            <small>Panel del conductor</small>
          </span>
        </div>

        <div className="cond-topbar-derecha">
          <FlechasHistorial
            atras={atras}
            adelante={adelante}
            puedeVolver={puedeVolver}
            puedeAvanzar={puedeAvanzar}
          />

          <button
            type="button"
            className="iconbtn"
            onClick={() => recargar()}
            disabled={cargando}
            aria-label="Actualizar la información"
            title="Actualizar"
          >
            <IconActualizar size={18} />
          </button>

          <div className="user-chip">
            <BotonAvatar usuario={usuario} />
            <span className="user-data">
              <strong>{nombreVisible(usuario)}</strong>
              <small>Conductor</small>
            </span>
          </div>

          <button type="button" className="btn ghost small" onClick={onLogout}>
            <IconSalir size={16} />
            Salir
          </button>
        </div>
      </header>

      <nav className="cond-tabs" aria-label="Secciones del panel">
        {SECCIONES.map(({ key, label, Icono }) => (
          <button
            key={key}
            type="button"
            className={`cond-tab ${key === ruta ? 'activa' : ''}`}
            onClick={() => ir(key)}
            aria-current={key === ruta ? 'page' : undefined}
          >
            <Icono size={18} />
            {label}
            {key === 'mis-alertas' && sinResolver > 0 && (
              <span className="cond-badge" aria-label={`${sinResolver} sin resolver`}>
                {sinResolver}
              </span>
            )}
          </button>
        ))}
      </nav>

      <main className="cond-contenido" id="contenido">
        {error && (
          <div className="alert error" role="alert">
            <IconAlerta size={18} />
            <span>{error}</span>
            <button type="button" className="linkbtn" onClick={() => recargar()}>
              Reintentar
            </button>
          </div>
        )}

        {ruta === 'mis-servicios' && (
          <MisServicios
            datos={datos}
            cargando={cargando}
            onActualizado={actualizar}
            toast={toast}
          />
        )}

        {ruta === 'mi-vehiculo' && (
          <MiVehiculo
            datos={datos}
            cargando={cargando}
            onActualizado={actualizar}
            toast={toast}
          />
        )}

        {ruta === 'mis-alertas' && <MisAlertas datos={datos} cargando={cargando} />}

        <PasoSecciones anterior={anterior} siguiente={siguiente} onIr={ir} />
      </main>
    </div>
  )
}
