import { useState } from 'react'
import api, { getErrorMessage } from '../../api/api.js'
import { useDialog } from '../../hooks/useDialog.js'
import { IconAlerta, IconCerrar } from '../ui/Icons.jsx'

const soloFecha = (valor) => (valor ? String(valor).slice(0, 10) : '')

/**
 * Lo único que un conductor puede modificar de su vehículo: si está
 * operativo y las fechas de mantenimiento. El backend rechaza cualquier
 * otra columna (middleware/permisos.js), así que la placa, la capacidad
 * o el conductor asignado siguen siendo cosa del administrador.
 */
export default function ReportarVehiculo({ vehiculo, onCerrar, onGuardado }) {
  const [operativo, setOperativo] = useState(!!vehiculo.estado_operativo)
  const [ultimo, setUltimo] = useState(soloFecha(vehiculo.fecha_ultimo_mantenimiento))
  const [proximo, setProximo] = useState(soloFecha(vehiculo.fecha_proximo_mantenimiento))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const ref = useDialog(() => !guardando && onCerrar())

  const guardar = async (e) => {
    e.preventDefault()
    setError('')

    if (ultimo && proximo && proximo < ultimo) {
      setError('El próximo mantenimiento no puede ser anterior al último.')
      return
    }

    setGuardando(true)
    try {
      await api.put(`/vehiculos/${vehiculo.id_vehiculo}`, {
        estado_operativo: operativo,
        fecha_ultimo_mantenimiento: ultimo || null,
        fecha_proximo_mantenimiento: proximo || null
      })
      onGuardado(`Se actualizó la información del vehículo ${vehiculo.placa}.`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={() => !guardando && onCerrar()}>
      <div
        className="modal ancho"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reporte-titulo"
        ref={ref}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <div>
            <p className="modal-eyebrow">Vehículo {vehiculo.placa}</p>
            <h2 className="modal-title" id="reporte-titulo">Reportar estado del vehículo</h2>
          </div>
          <button
            type="button"
            className="iconbtn"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
          >
            <IconCerrar />
          </button>
        </header>

        <form onSubmit={guardar} className="modal-form" noValidate>
          <div className="field">
            <label className="check">
              <input
                type="checkbox"
                checked={operativo}
                onChange={(e) => setOperativo(e.target.checked)}
                disabled={guardando}
              />
              <span>El vehículo está operativo</span>
            </label>
            <p className="field-hint">
              Desmárcalo si el vehículo quedó fuera de servicio. El administrador lo verá
              de inmediato en su panel.
            </p>
          </div>

          <div className="grid-2">
            <div className="field">
              <label className="field-label" htmlFor="veh-ultimo">Último mantenimiento</label>
              <input
                id="veh-ultimo"
                type="date"
                value={ultimo}
                onChange={(e) => setUltimo(e.target.value)}
                disabled={guardando}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="veh-proximo">Próximo mantenimiento</label>
              <input
                id="veh-proximo"
                type="date"
                value={proximo}
                onChange={(e) => setProximo(e.target.value)}
                disabled={guardando}
              />
            </div>
          </div>

          {error && (
            <div className="alert error" role="alert">
              <IconAlerta size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onCerrar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn primary" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
