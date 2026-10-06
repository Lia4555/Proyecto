import { useMemo } from 'react'
import { fechaCorta, textoVigencia } from '../../lib/format.js'
import { indexar } from '../../hooks/useDatosConductor.js'
import { IconCampana, IconOk } from '../ui/Icons.jsx'

// Prioridad numérica -> etiqueta legible. Cuanto más alto, más urgente.
function nivelPrioridad(valor) {
  const n = Number(valor)
  if (!Number.isFinite(n)) return { texto: 'Normal', clase: 'neutro' }
  if (n >= 3) return { texto: 'Alta', clase: 'cancelado' }
  if (n === 2) return { texto: 'Media', clase: 'curso' }
  return { texto: 'Baja', clase: 'neutro' }
}

export default function MisAlertas({ datos, cargando }) {
  const tipos = useMemo(() => indexar(datos.tiposAlerta, 'id_tipo_alerta'), [datos.tiposAlerta])
  const vehiculos = useMemo(() => indexar(datos.vehiculos, 'id_vehiculo'), [datos.vehiculos])

  // Sin resolver primero, y dentro de cada grupo las más urgentes arriba.
  const alertas = useMemo(() => {
    return [...(datos.alertas || [])].sort((a, b) => {
      if (!!a.estado_resuelta !== !!b.estado_resuelta) return a.estado_resuelta ? 1 : -1
      return Number(b.prioridad || 0) - Number(a.prioridad || 0)
    })
  }, [datos.alertas])

  const pendientes = alertas.filter((a) => !a.estado_resuelta).length

  return (
    <section className="cond-seccion" aria-labelledby="titulo-alertas">
      <header className="cond-head">
        <div>
          <h1 className="cond-titulo" id="titulo-alertas">Mis alertas</h1>
          <p className="cond-sub">
            Avisos que el administrador dirigió a ti. Son de solo lectura.
          </p>
        </div>
        <p className="cond-conteo" aria-live="polite">
          <strong>{pendientes}</strong> sin resolver
        </p>
      </header>

      {cargando ? (
        <ul className="cond-lista">
          {Array.from({ length: 2 }).map((_, i) => (
            <li key={i}>
              <article className="alerta-card cargando" aria-hidden="true">
                <span className="skeleton alto" />
              </article>
            </li>
          ))}
        </ul>
      ) : alertas.length === 0 ? (
        <div className="empty">
          <span className="empty-ok" aria-hidden="true"><IconOk size={34} /></span>
          <p className="empty-title">No tienes alertas</p>
          <p className="empty-text">
            Cuando el administrador te envíe un aviso (documentos por vencer,
            cambios en un servicio…) lo verás aquí.
          </p>
        </div>
      ) : (
        <ul className="cond-lista">
          {alertas.map((a) => {
            const prioridad = nivelPrioridad(a.prioridad)
            const limite = a.fecha_limite ? textoVigencia(a.fecha_limite) : null
            const vehiculo = vehiculos.get(String(a.id_vehiculo_relacionado))

            return (
              <li key={a.id_alerta}>
                <article className={`alerta-card ${a.estado_resuelta ? 'resuelta' : ''}`}>
                  <span className="alerta-icono" aria-hidden="true"><IconCampana size={20} /></span>

                  <div className="alerta-cuerpo">
                    <header className="alerta-top">
                      <span className="alerta-tipo">
                        {tipos.get(String(a.id_tipo_alerta))?.nombre_tipo || 'Aviso'}
                      </span>
                      <span className={`estado ${prioridad.clase}`}>
                        Prioridad {prioridad.texto}
                      </span>
                      {a.estado_resuelta && <span className="estado hecho">Resuelta</span>}
                    </header>

                    <p className="alerta-texto">{a.descripcion}</p>

                    <p className="alerta-pie">
                      {limite && (
                        <span className={`vigencia ${limite.estado}`}>
                          Límite: {fechaCorta(a.fecha_limite)}
                        </span>
                      )}
                      {vehiculo && <span className="alerta-ref">Vehículo {vehiculo.placa}</span>}
                    </p>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
