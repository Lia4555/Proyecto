import { useEffect, useMemo, useState } from 'react'
import { fechaCorta, pesos, textoVigencia } from '../../lib/format.js'
import { indexar } from '../../hooks/useDatosConductor.js'
import ReportarVehiculo from './ReportarVehiculo.jsx'
import {  IconBus, IconDocumento,  IconEditar,  IconHerramienta,  IconVacio} from '../ui/Icons.jsx'

export default function MiVehiculo({ datos, cargando, onActualizado, toast }) {
  const vehiculos = datos.vehiculos || []
  const [placaElegida, setPlacaElegida] = useState('')
  const [reportando, setReportando] = useState(false)

  const tipos = useMemo(
    () => indexar(datos.tiposVehiculo, 'id_tipo_vehiculo'),
    [datos.tiposVehiculo]
  )
  const tiposDoc = useMemo(
    () => indexar(datos.tiposDocumento, 'id_tipo_documento'),
    [datos.tiposDocumento]
  )

  // Al llegar los datos se selecciona el primer vehículo (lo normal es que
  // solo haya uno). Si el elegido desaparece, se vuelve al primero.
  const vehiculo = useMemo(() => {
    if (vehiculos.length === 0) return null
    return vehiculos.find((v) => String(v.id_vehiculo) === placaElegida) || vehiculos[0]
  }, [vehiculos, placaElegida])

  useEffect(() => {
    if (vehiculo && String(vehiculo.id_vehiculo) !== placaElegida) {
      setPlacaElegida(String(vehiculo.id_vehiculo))
    }
  }, [vehiculo, placaElegida])

  const documentos = useMemo(
    () =>
      (datos.documentos || [])
        .filter((d) => vehiculo && String(d.id_vehiculo) === String(vehiculo.id_vehiculo))
        .sort((a, b) => String(a.fecha_vencimiento).localeCompare(String(b.fecha_vencimiento))),
    [datos.documentos, vehiculo]
  )

  const mantenimientos = useMemo(
    () =>
      (datos.mantenimientos || [])
        .filter((m) => vehiculo && String(m.id_vehiculo) === String(vehiculo.id_vehiculo))
        .sort((a, b) => String(b.fecha_mantenimiento).localeCompare(String(a.fecha_mantenimiento)))
        .slice(0, 8),
    [datos.mantenimientos, vehiculo]
  )

  const alGuardar = (mensaje) => {
    setReportando(false)
    toast.exito(mensaje)
    onActualizado()
  }

  if (cargando) {
    return (
      <section className="cond-seccion">
        <div className="veh-card cargando"><span className="skeleton alto" /></div>
      </section>
    )
  }

  if (!vehiculo) {
    return (
      <section className="cond-seccion" aria-labelledby="titulo-vehiculo">
        <header className="cond-head">
          <div>
            <h1 className="cond-titulo" id="titulo-vehiculo">Mi vehículo</h1>
            <p className="cond-sub">Datos del vehículo que conduces.</p>
          </div>
        </header>
        <div className="empty">
          <IconVacio />
          <p className="empty-title">Todavía no tienes un vehículo asignado</p>
          <p className="empty-text">
            Aparecerá aquí en cuanto el administrador te asigne uno o te programe
            un servicio con un vehículo.
          </p>
        </div>
      </section>
    )
  }

  const tipo = tipos.get(String(vehiculo.id_tipo_vehiculo))?.nombre_tipo

  return (
    <section className="cond-seccion" aria-labelledby="titulo-vehiculo">
      <header className="cond-head">
        <div>
          <h1 className="cond-titulo" id="titulo-vehiculo">Mi vehículo</h1>
          <p className="cond-sub">
            Consulta sus datos y avisa si deja de estar operativo.
          </p>
        </div>

        {vehiculos.length > 1 && (
          <div className="field cond-selector">
            <label className="field-label" htmlFor="selector-vehiculo">Vehículo</label>
            <select
              id="selector-vehiculo"
              value={String(vehiculo.id_vehiculo)}
              onChange={(e) => setPlacaElegida(e.target.value)}
            >
              {vehiculos.map((v) => (
                <option key={v.id_vehiculo} value={String(v.id_vehiculo)}>
                  {[v.placa, v.marca, v.linea].filter(Boolean).join(' · ')}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      <article className="veh-card">
        <header className="veh-top">
          <span className="veh-icono" aria-hidden="true"><IconBus size={26} /></span>
          <div className="veh-identidad">
            <p className="veh-placa">{vehiculo.placa}</p>
            <p className="veh-modelo">
              {[vehiculo.marca, vehiculo.linea, vehiculo.modelo].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
          <span className={`estado ${vehiculo.estado_operativo ? 'hecho' : 'cancelado'}`}>
            {vehiculo.estado_operativo ? 'Operativo' : 'Fuera de servicio'}
          </span>
        </header>

        <dl className="veh-datos">
          <div>
            <dt>Tipo</dt>
            <dd>{tipo || '—'}</dd>
          </div>
          <div>
            <dt>Capacidad</dt>
            <dd>{vehiculo.capacidad_pasajeros ? `${vehiculo.capacidad_pasajeros} pasajeros` : '—'}</dd>
          </div>
          <div>
            <dt>Número interno</dt>
            <dd>{vehiculo.numero_interno || '—'}</dd>
          </div>
          <div>
            <dt>Color</dt>
            <dd>{vehiculo.color || '—'}</dd>
          </div>
          <div>
            <dt>Último mantenimiento</dt>
            <dd>{fechaCorta(vehiculo.fecha_ultimo_mantenimiento)}</dd>
          </div>
          <div>
            <dt>Próximo mantenimiento</dt>
            <dd>{fechaCorta(vehiculo.fecha_proximo_mantenimiento)}</dd>
          </div>
        </dl>

        <footer className="veh-acciones">
          <button type="button" className="btn primary small" onClick={() => setReportando(true)}>
            <IconEditar size={16} />
            Reportar estado del vehículo
          </button>
        </footer>
      </article>

      <div className="veh-columnas">
        <section className="veh-bloque" aria-labelledby="titulo-docs">
          <h2 className="veh-bloque-titulo" id="titulo-docs">
            <IconDocumento size={18} />
            Documentos
          </h2>

          {documentos.length === 0 ? (
            <p className="veh-vacio">Este vehículo no tiene documentos registrados.</p>
          ) : (
            <ul className="veh-items">
              {documentos.map((d) => {
                const vigencia = textoVigencia(d.fecha_vencimiento)
                return (
                  <li key={d.id_documento} className="veh-item">
                    <div>
                      <p className="veh-item-titulo">
                        {tiposDoc.get(String(d.id_tipo_documento))?.nombre_tipo ||
                          d.tipo_documento_legal ||
                          'Documento'}
                      </p>
                      <p className="veh-item-sub">
                        N.º {d.numero_documento}
                        {d.aseguradora ? ` · ${d.aseguradora}` : ''}
                      </p>
                    </div>
                    <span className={`vigencia ${vigencia.estado}`}>{vigencia.texto}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="veh-bloque" aria-labelledby="titulo-mant">
          <h2 className="veh-bloque-titulo" id="titulo-mant">
            <IconHerramienta size={18} />
            Mantenimientos recientes
          </h2>

          {mantenimientos.length === 0 ? (
            <p className="veh-vacio">Todavía no hay mantenimientos registrados.</p>
          ) : (
            <ul className="veh-items">
              {mantenimientos.map((m) => (
                <li key={m.id_mantenimiento} className="veh-item">
                  <div>
                    <p className="veh-item-titulo">{m.tipo_mantenimiento || 'Mantenimiento'}</p>
                    <p className="veh-item-sub">
                      {fechaCorta(m.fecha_mantenimiento)}
                      {m.taller_responsable ? ` · ${m.taller_responsable}` : ''}
                    </p>
                  </div>
                  <span className="veh-costo">{pesos(m.costo)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {reportando && (
        <ReportarVehiculo
          vehiculo={vehiculo}
          onCerrar={() => setReportando(false)}
          onGuardado={alGuardar}
        />
      )}
    </section>
  )
}
