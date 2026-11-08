import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { getErrorMessage } from '../api/api.js'
import { fechaCorta } from '../lib/format.js'
import { useToast } from './ui/Toast.jsx'
import { IconActualizar, IconAlerta, IconOk } from './ui/Icons.jsx'
import '../control.css'

// ============================================================
// CENTRO DE CONTROL (solo administrador)
// ------------------------------------------------------------
// Muestra lo que la automatización del servidor vigila sola:
// documentos de vehículos y licencias por vencer, mantenimientos
// próximos y alertas abiertas. El servidor revisa cada hora y crea
// las alertas; aquí se ve el panorama y se puede forzar la revisión.
// ============================================================

const SEMAFORO = {
  vencido: 'Vencido',
  critico: '≤ 7 días',
  pronto: '≤ 15 días',
  aviso: '≤ 30 días'
}

const TIPOS = {
  documento: 'Documento',
  licencia: 'Licencia',
  mantenimiento: 'Mantenimiento'
}

const FILTROS = [
  ['todos', 'Todos'],
  ['documento', 'Documentos'],
  ['licencia', 'Licencias'],
  ['mantenimiento', 'Mantenimientos']
]

const textoDias = (d) =>
  d < 0 ? `Hace ${-d} día${d === -1 ? '' : 's'}` : d === 0 ? 'Hoy' : `En ${d} día${d === 1 ? '' : 's'}`

const hora = (iso) =>
  iso ? new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

export default function CentroControl() {
  const toast = useToast()
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [revisando, setRevisando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const { data } = await api.get('/automatizacion/resumen')
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

  const revisarAhora = async () => {
    setRevisando(true)
    try {
      const { data } = await api.post('/automatizacion/ejecutar', null, { timeout: 60000 })
      const r = data?.resultado || {}
      if (r.migracionPendiente) {
        toast.info('Revisión hecha, pero las alertas automáticas están en pausa: falta ejecutar sql/automatizacion-evaluaciones.sql en Supabase.')
      } else {
        toast.exito(
          `Revisión completa: ${r.alertasCreadas ?? 0} alertas nuevas, ${r.alertasCerradas ?? 0} cerradas, ` +
            `${r.enlacesEvaluacionCreados ?? 0} enlaces de evaluación.`
        )
      }
      await cargar()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setRevisando(false)
    }
  }

  const vencimientos = useMemo(() => datos?.vencimientos || [], [datos])
  const visibles = useMemo(
    () => (filtro === 'todos' ? vencimientos : vencimientos.filter((v) => v.tipo === filtro)),
    [vencimientos, filtro]
  )

  const c = datos?.conteos || {}
  const auto = datos?.automatizacion
  const ultima = auto?.ultimaEjecucion

  return (
    <section className="panel" aria-labelledby="titulo-control">
      <header className="panel-head">
        <div className="panel-head-text">
          <h1 className="panel-title" id="titulo-control">Centro de control</h1>
          <p className="panel-sub">
            Documentos, licencias y mantenimientos que vencen pronto. El sistema crea las alertas
            y avisa al conductor <strong>sin que tengas que hacer nada</strong>.
          </p>
        </div>
        <div className="panel-actions">
          <button type="button" className="btn ghost" onClick={cargar} disabled={cargando}>
            <IconActualizar size={16} />
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
          <button type="button" className="btn primary" onClick={revisarAhora} disabled={revisando}>
            {revisando ? 'Revisando…' : 'Revisar ahora'}
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

      <div className="kpis" aria-busy={cargando}>
        <Kpi color="rojo" label="Documentos vencidos" valor={c.documentosVencidos} nota="SOAT, tecnomecánica, pólizas…" cargando={cargando} />
        <Kpi color="rojo" label="Licencias vencidas" valor={c.licenciasVencidas} nota="Conductores que no pueden salir" cargando={cargando} />
        <Kpi color="ambar" label="Mantenimientos atrasados" valor={c.mantenimientosAtrasados} nota="Fecha programada ya pasó" cargando={cargando} />
        <Kpi color="neutro" label="Por vencer" valor={c.porVencer} nota={`${c.criticos ?? 0} en los próximos 7 días`} cargando={cargando} />
        <Kpi
          color={c.alertasUrgentes ? 'rojo' : 'verde'}
          label="Alertas abiertas"
          valor={c.alertasAbiertas}
          nota={`${c.alertasUrgentes ?? 0} de prioridad alta`}
          cargando={cargando}
        />
      </div>

      <div className="card">
        <div className="auto-estado" role="status">
          <span
            className={`punto-vivo ${!auto?.activa ? 'apagado' : ultima && !ultima.ok ? 'falla' : ''}`}
            aria-hidden="true"
          />
          <span>
            Automatización:{' '}
            <strong>{!auto ? '—' : auto.activa ? `activa, cada ${auto.intervaloMin} min` : 'desactivada'}</strong>
          </span>
          <span>
            Última revisión: <strong>{ultima ? hora(ultima.fin) : 'aún no'}</strong>
            {ultima && !ultima.ok && <> · <span className="field-error">falló: {ultima.error}</span></>}
          </span>
          {auto?.activa && (
            <span>
              Próxima: <strong>{hora(auto.proximaEjecucion)}</strong>
            </span>
          )}
          {ultima?.resultado?.migracionPendiente && (
            <span className="chip chip-warn">Falta ejecutar sql/automatizacion-evaluaciones.sql</span>
          )}
        </div>

        <div className="toolbar">
          <div className="segmentos" role="group" aria-label="Filtrar vencimientos">
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
                    {clave === 'todos' ? vencimientos.length : vencimientos.filter((v) => v.tipo === clave).length}
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
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j}><span className="skeleton" /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : visibles.length === 0 ? (
            <div className="empty">
              <IconOk size={40} />
              <p className="empty-title">Todo al día</p>
              <p className="empty-text">
                No hay documentos, licencias ni mantenimientos por vencer en esta vista.
              </p>
            </div>
          ) : (
            <table className="table">
              <caption className="sr-only">Vencimientos próximos: {visibles.length}</caption>
              <thead>
                <tr>
                  <th scope="col">Qué vence</th>
                  <th scope="col">De quién</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Cuándo</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((v) => (
                  <tr key={`${v.tipo}-${v.id}`}>
                    <td>
                      <span className="celda-principal">
                        <span className="tipo-venc">{TIPOS[v.tipo]}</span>
                        <strong>{v.titulo}</strong>
                      </span>
                    </td>
                    <td>{v.referencia}</td>
                    <td>{fechaCorta(v.fecha)}</td>
                    <td>{textoDias(v.dias)}</td>
                    <td>
                      <span className={`semaforo ${v.estado}`}>{SEMAFORO[v.estado] || v.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="card-titulo">Qué hace el sistema de forma automática</p>
        <ul className="lista-reglas">
          <li>Avisa de cada documento del vehículo a los 30, 15 y 7 días de vencer, y cuando vence lo marca como no vigente.</li>
          <li>Avisa de licencias de conducción por vencer y de mantenimientos programados en los próximos 7 días.</li>
          <li>Recuerda al conductor sus servicios de las próximas 24 horas y alerta si el vehículo tiene papeles vencidos.</li>
          <li>Al crear un servicio sin conductor o sin vehículo, asigna la mejor pareja disponible; bloquea cruces de horario, falta de cupo y documentos vencidos.</li>
          <li>Cuando el conductor registra la llegada, finaliza el servicio y genera el enlace para que el cliente lo evalúe.</li>
          <li>Cierra sola cada alerta cuando el problema se resuelve (por ejemplo, al registrar el SOAT renovado).</li>
        </ul>
      </div>
    </section>
  )
}

function Kpi({ color, label, valor, nota, cargando }) {
  return (
    <div className={`kpi ${color}`}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-valor">{cargando && valor === undefined ? '…' : valor ?? 0}</span>
      <span className="kpi-nota">{nota}</span>
    </div>
  )
}
