import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { getErrorMessage } from '../api/api.js'
import { fechaCorta } from '../lib/format.js'
import { useToast } from './ui/Toast.jsx'
import { IconActualizar, IconAlerta, IconVacio } from './ui/Icons.jsx'
import '../control.css'

// ============================================================
// EVALUACIONES DEL SERVICIO (solo administrador)
// ------------------------------------------------------------
// Cada servicio finalizado recibe un enlace único. El cliente lo
// abre sin crear cuenta y califica de 1 a 5 estrellas. Aquí se ve
// el promedio, la calificación de cada conductor y los comentarios.
// Una calificación de 2 o menos crea una alerta urgente.
// ============================================================

const FILTROS = [
  ['respondida', 'Respondidas'],
  ['pendiente', 'Sin responder'],
  ['vencida', 'Vencidas'],
  ['todas', 'Todas']
]

const ESTADO = {
  respondida: { texto: 'Respondida', clase: 'ok' },
  pendiente: { texto: 'Sin responder', clase: 'warn' },
  vencida: { texto: 'Vencida', clase: 'bad' }
}

export function Estrellas({ valor, etiqueta }) {
  if (!valor) return <span className="kpi-nota">—</span>
  const n = Math.round(Number(valor))
  return (
    <span className="estrellas" role="img" aria-label={`${etiqueta ? `${etiqueta}: ` : ''}${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= n ? '' : 'apagada'} aria-hidden="true">★</span>
      ))}
    </span>
  )
}

const fmt = (n) => (n === null || n === undefined ? '—' : Number(n).toFixed(1))

export default function Evaluaciones() {
  const toast = useToast()
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('respondida')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const { data } = await api.get('/evaluaciones')
      setDatos(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const lista = useMemo(() => datos?.evaluaciones || [], [datos])
  const visibles = useMemo(
    () => (filtro === 'todas' ? lista : lista.filter((e) => e.estado === filtro)),
    [lista, filtro]
  )
  const r = datos?.resumen || {}
  const maximo = Math.max(1, ...(r.distribucion || [0]))

  const copiar = async (enlace) => {
    try {
      await navigator.clipboard.writeText(enlace)
      toast.exito('Enlace copiado. Envíaselo al cliente por WhatsApp o correo.')
    } catch {
      window.prompt('Copia el enlace:', enlace)
    }
  }

  return (
    <section className="panel" aria-labelledby="titulo-evaluaciones">
      <header className="panel-head">
        <div className="panel-head-text">
          <h1 className="panel-title" id="titulo-evaluaciones">Evaluación del servicio</h1>
          <p className="panel-sub">
            Al finalizar cada servicio se genera un enlace para que el cliente califique el viaje,
            sin crear cuenta. Las calificaciones de 2 estrellas o menos generan una alerta urgente.
          </p>
        </div>
        <div className="panel-actions">
          <button type="button" className="btn ghost" onClick={cargar} disabled={cargando}>
            <IconActualizar size={16} />
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
      </header>

      {error && (
        <div className="alert error" role="alert">
          <IconAlerta size={18} />
          <span>{error}</span>
          <button type="button" className="linkbtn" onClick={cargar}>Reintentar</button>
        </div>
      )}

      <div className="kpis">
        <div className="kpi verde">
          <span className="kpi-label">Calificación promedio</span>
          <span className="kpi-valor">{fmt(r.promedio)}</span>
          <Estrellas valor={r.promedio} etiqueta="Promedio" />
        </div>
        <div className="kpi neutro">
          <span className="kpi-label">Respondidas</span>
          <span className="kpi-valor">{r.respondidas ?? 0}</span>
          <span className="kpi-nota">de {r.enviadas ?? 0} enviadas · {r.tasaRespuesta ?? 0}% de respuesta</span>
        </div>
        <div className="kpi neutro">
          <span className="kpi-label">Puntualidad · Trato · Vehículo</span>
          <span className="kpi-valor" style={{ fontSize: '1.25rem' }}>
            {fmt(r.puntualidad)} · {fmt(r.trato_conductor)} · {fmt(r.estado_vehiculo)}
          </span>
          <span className="kpi-nota">Promedio de cada criterio</span>
        </div>
        <div className={`kpi ${r.recomendarian === null || r.recomendarian === undefined ? 'neutro' : r.recomendarian >= 80 ? 'verde' : 'ambar'}`}>
          <span className="kpi-label">Nos recomendarían</span>
          <span className="kpi-valor">{r.recomendarian === null || r.recomendarian === undefined ? '—' : `${r.recomendarian}%`}</span>
          <span className="kpi-nota">De quienes respondieron la pregunta</span>
        </div>
      </div>

      <div className="eval-grid">
        <div className="card">
          <p className="card-titulo">Distribución de calificaciones</p>
          <div className="barras">
            {[5, 4, 3, 2, 1].map((n) => {
              const cantidad = r.distribucion?.[n - 1] ?? 0
              return (
                <div className="barra-fila" key={n}>
                  <span>{n} ★</span>
                  <span className="barra-pista" aria-hidden="true">
                    <span className="barra-relleno" style={{ display: 'block', width: `${(cantidad / maximo) * 100}%` }} />
                  </span>
                  <span className="barra-num">{cantidad}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <p className="card-titulo">Calificación por conductor</p>
          {r.porConductor?.length ? (
            <ol className="ranking">
              {r.porConductor.map((c) => (
                <li key={c.id_conductor}>
                  <span>
                    {c.conductor} <small>· {c.cantidad} evaluación{c.cantidad === 1 ? '' : 'es'}</small>
                  </span>
                  <span>
                    <Estrellas valor={c.promedio} etiqueta={c.conductor} /> <strong>{fmt(c.promedio)}</strong>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty-text" style={{ padding: '14px 16px' }}>Aún no hay evaluaciones respondidas.</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="segmentos" role="group" aria-label="Filtrar evaluaciones">
            {FILTROS.map(([clave, texto]) => (
              <button
                key={clave}
                type="button"
                className={`segmento ${filtro === clave ? 'activo' : ''}`}
                onClick={() => setFiltro(clave)}
                aria-pressed={filtro === clave}
              >
                {texto}
                {!cargando && (
                  <span className="chip">
                    {clave === 'todas' ? lista.length : lista.filter((e) => e.estado === clave).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          {cargando && !datos ? (
            <table className="table" aria-busy="true">
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j}><span className="skeleton" /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : visibles.length === 0 ? (
            <div className="empty">
              <IconVacio />
              <p className="empty-title">No hay evaluaciones en esta vista</p>
              <p className="empty-text">
                Los enlaces se crean solos cuando un servicio queda finalizado.
              </p>
            </div>
          ) : (
            <table className="table">
              <caption className="sr-only">Evaluaciones: {visibles.length}</caption>
              <thead>
                <tr>
                  <th scope="col">Servicio</th>
                  <th scope="col">Conductor</th>
                  <th scope="col">Fecha del viaje</th>
                  <th scope="col">Calificación</th>
                  <th scope="col">Comentario</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className="col-actions">Enlace</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((e) => (
                  <tr key={e.id_evaluacion}>
                    <td>
                      <span className="celda-principal">
                        <strong>{e.codigo_servicio}</strong>
                        {e.ruta && <span className="kpi-nota">{e.ruta}</span>}
                      </span>
                    </td>
                    <td>{e.conductor}</td>
                    <td>{fechaCorta(e.fecha_salida)}</td>
                    <td><Estrellas valor={e.calificacion} etiqueta="Calificación" /></td>
                    <td className="comentario-celda">{e.comentario || '—'}</td>
                    <td>
                      <span className={`badge ${ESTADO[e.estado]?.clase ?? 'bad'}`}>{ESTADO[e.estado]?.texto ?? e.estado}</span>
                    </td>
                    <td className="col-actions">
                      {e.estado === 'pendiente' && e.enlace ? (
                        <button type="button" className="btn ghost small" onClick={() => copiar(e.enlace)}>
                          Copiar enlace
                        </button>
                      ) : (
                        <span className="kpi-nota">{e.respondida_en ? fechaCorta(e.respondida_en) : '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  )
}
