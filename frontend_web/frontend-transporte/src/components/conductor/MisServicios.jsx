import { useMemo, useState } from 'react'
import { fechaHora } from '../../lib/format.js'
import { indexar } from '../../hooks/useDatosConductor.js'
import CambiarEstado from './CambiarEstado.jsx'
import {  IconActualizar,  IconBuscar,  IconCerrar,  IconEditar,  IconFlechaLarga,  IconVacio} from '../ui/Icons.jsx'

// Marcas diacríticas (tildes, diéresis). Quitarlas hace que la búsqueda
// no distinga acentos: "Bogota" encuentra "Bogotá".
const DIACRITICOS = /[̀-ͯ]/g

const normalizar = (texto) =>
  String(texto).toLowerCase().normalize('NFD').replace(DIACRITICOS, '')

// Color del distintivo según el nombre del estado. Como los estados los
// define el administrador en su tabla, se reconocen por palabras clave y
// cualquier otro cae en el color neutro.
function claseEstado(nombre = '') {
  const t = normalizar(nombre)
  if (t.includes('curso') || t.includes('ruta') || t.includes('transito')) return 'curso'
  if (t.includes('final') || t.includes('complet') || t.includes('termin')) return 'hecho'
  if (t.includes('cancel') || t.includes('anul')) return 'cancelado'
  if (t.includes('program') || t.includes('pendien') || t.includes('asign')) return 'programado'
  return 'neutro'
}

export default function MisServicios({ datos, cargando, onActualizado, toast }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [enEdicion, setEnEdicion] = useState(null)

  const vehiculos = useMemo(() => indexar(datos.vehiculos, 'id_vehiculo'), [datos.vehiculos])
  const estados = useMemo(() => indexar(datos.estados, 'id_estado'), [datos.estados])

  // Origen y destino llegan como texto (el servidor lo completa incluso
  // en los servicios antiguos, que guardaban un id de la tabla destinos).
  const lugar = (texto) => (texto && String(texto).trim()) || 'Sin definir'

  const nombreVehiculo = (id) => {
    const fila = vehiculos.get(String(id))
    if (!fila) return 'Sin asignar'
    return [fila.placa, fila.marca, fila.linea].filter(Boolean).join(' · ')
  }

  const nombreEstado = (id) => estados.get(String(id))?.nombre_estado || 'Sin estado'

  // Los más próximos primero: es el orden en que el conductor los necesita.
  const ordenados = useMemo(() => {
    return [...(datos.servicios || [])].sort(
      (a, b) => new Date(a.fecha_salida) - new Date(b.fecha_salida)
    )
  }, [datos.servicios])

  const visibles = useMemo(() => {
    const termino = normalizar(busqueda.trim())
    return ordenados.filter((s) => {
      if (filtroEstado !== 'todos' && String(s.id_estado) !== filtroEstado) return false
      if (!termino) return true
      const texto = [
        s.codigo_servicio,
        s.tipo_servicio,
        lugar(s.origen),
        lugar(s.destino),
        nombreVehiculo(s.id_vehiculo),
        nombreEstado(s.id_estado)
      ].join(' ')
      return normalizar(texto).includes(termino)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenados, busqueda, filtroEstado, vehiculos, estados])

  // Solo se ofrecen como filtro los estados que realmente aparecen.
  const estadosPresentes = useMemo(() => {
    const usados = new Set(ordenados.map((s) => String(s.id_estado)))
    return (datos.estados || []).filter((e) => usados.has(String(e.id_estado)))
  }, [ordenados, datos.estados])

  const hayFiltro = busqueda.trim() !== '' || filtroEstado !== 'todos'

  const limpiar = () => {
    setBusqueda('')
    setFiltroEstado('todos')
  }

  const alGuardar = (mensaje) => {
    setEnEdicion(null)
    toast.exito(mensaje)
    onActualizado()
  }

  return (
    <section className="cond-seccion" aria-labelledby="titulo-servicios">
      <header className="cond-head">
        <div>
          <h1 className="cond-titulo" id="titulo-servicios">Mis servicios</h1>
          <p className="cond-sub">
            Los viajes que te asignó el administrador. Puedes actualizar en qué punto va cada uno.
          </p>
        </div>
        <p className="cond-conteo" aria-live="polite">
          <strong>{visibles.length}</strong> de {ordenados.length} servicio
          {ordenados.length === 1 ? '' : 's'}
        </p>
      </header>

      {ordenados.length > 0 && (
        <div className="cond-filtros">
          <div className="search">
            <span className="search-icon" aria-hidden="true"><IconBuscar size={16} /></span>
            <input
              type="search"
              className="search-input"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código, ruta o placa…"
              aria-label="Buscar entre mis servicios"
            />
            {busqueda && (
              <button
                type="button"
                className="iconbtn search-clear"
                onClick={() => setBusqueda('')}
                aria-label="Limpiar búsqueda"
              >
                <IconCerrar size={14} />
              </button>
            )}
          </div>

          <div className="chips-filtro" role="group" aria-label="Filtrar por estado">
            <button
              type="button"
              className={`chip-filtro ${filtroEstado === 'todos' ? 'activo' : ''}`}
              onClick={() => setFiltroEstado('todos')}
              aria-pressed={filtroEstado === 'todos'}
            >
              Todos
            </button>
            {estadosPresentes.map((e) => (
              <button
                key={e.id_estado}
                type="button"
                className={`chip-filtro ${filtroEstado === String(e.id_estado) ? 'activo' : ''}`}
                onClick={() => setFiltroEstado(String(e.id_estado))}
                aria-pressed={filtroEstado === String(e.id_estado)}
              >
                {e.nombre_estado}
              </button>
            ))}
          </div>
        </div>
      )}

      {cargando ? (
        <div className="cond-lista">
          {Array.from({ length: 3 }).map((_, i) => (
            <article className="serv-card cargando" key={i} aria-hidden="true">
              <span className="skeleton alto" />
            </article>
          ))}
        </div>
      ) : visibles.length === 0 ? (
        <div className="empty">
          <IconVacio />
          {hayFiltro ? (
            <>
              <p className="empty-title">Ningún servicio coincide con la búsqueda</p>
              <p className="empty-text">Prueba con otro texto o quita el filtro de estado.</p>
              <button type="button" className="btn ghost small" onClick={limpiar}>
                Quitar filtros
              </button>
            </>
          ) : (
            <>
              <p className="empty-title">Todavía no tienes servicios asignados</p>
              <p className="empty-text">
                Cuando el administrador te asigne un viaje aparecerá aquí, con su ruta,
                su horario y el vehículo.
              </p>
              <button type="button" className="btn ghost small" onClick={onActualizado}>
                <IconActualizar size={16} />
                Comprobar de nuevo
              </button>
            </>
          )}
        </div>
      ) : (
        <ul className="cond-lista">
          {visibles.map((s) => (
            <li key={s.id_servicio}>
              <article className="serv-card">
                <header className="serv-top">
                  <span className="serv-codigo">{s.codigo_servicio}</span>
                  <span className={`estado ${claseEstado(nombreEstado(s.id_estado))}`}>
                    {nombreEstado(s.id_estado)}
                  </span>
                </header>

                <div className="serv-ruta">
                  <div className="serv-punto">
                    <small>Salida</small>
                    <strong>{lugar(s.origen)}</strong>
                    <span>{fechaHora(s.fecha_salida)}</span>
                  </div>
                  <IconFlechaLarga size={22} />
                  <div className="serv-punto">
                    <small>Llegada estimada</small>
                    <strong>{lugar(s.destino)}</strong>
                    <span>{fechaHora(s.fecha_llegada_estimada)}</span>
                  </div>
                </div>

                <dl className="serv-datos">
                  <div>
                    <dt>Vehículo</dt>
                    <dd>{nombreVehiculo(s.id_vehiculo)}</dd>
                  </div>
                  <div>
                    <dt>Pasajeros</dt>
                    <dd>{s.numero_pasajeros ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>Tipo</dt>
                    <dd>{s.tipo_servicio || '—'}</dd>
                  </div>
                  <div>
                    <dt>Llegada real</dt>
                    <dd>{s.fecha_llegada_real ? fechaHora(s.fecha_llegada_real) : 'Sin registrar'}</dd>
                  </div>
                </dl>

                {s.observaciones && <p className="serv-obs">{s.observaciones}</p>}

                <footer className="serv-acciones">
                  <button
                    type="button"
                    className="btn primary small"
                    onClick={() => setEnEdicion(s)}
                  >
                    <IconEditar size={16} />
                    Actualizar estado
                  </button>
                </footer>
              </article>
            </li>
          ))}
        </ul>
      )}

      {enEdicion && (
        <CambiarEstado
          servicio={enEdicion}
          estados={datos.estados || []}
          onCerrar={() => setEnEdicion(null)}
          onGuardado={alGuardar}
        />
      )}
    </section>
  )
}
