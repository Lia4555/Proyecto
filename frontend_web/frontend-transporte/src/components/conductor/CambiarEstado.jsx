import { useState } from 'react'
import api, { getErrorMessage } from '../../api/api.js'
import { useDialog } from '../../hooks/useDialog.js'
import { IconAlerta, IconCerrar } from '../ui/Icons.jsx'

// "2026-03-05T14:30:00.000Z" -> "2026-03-05T09:30" (hora local, para el input)
function paraInput(valor) {
  if (!valor) return ''
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return ''
  const dos = (n) => String(n).padStart(2, '0')
  return (
    `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}` +
    `T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`
  )
}

/**
 * Única acción de escritura que tiene el conductor sobre un servicio:
 * cambiar en qué punto va. El backend solo acepta estas tres columnas
 * (middleware/permisos.js), y únicamente en servicios asignados a él.
 */
export default function CambiarEstado({ servicio, estados, onCerrar, onGuardado }) {
  const [idEstado, setIdEstado] = useState(String(servicio.id_estado ?? ''))
  const [llegadaReal, setLlegadaReal] = useState(paraInput(servicio.fecha_llegada_real))
  const [observaciones, setObservaciones] = useState(servicio.observaciones || '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const ref = useDialog(() => !guardando && onCerrar())

  const estadoActual = estados.find((e) => String(e.id_estado) === String(servicio.id_estado))
  const estadoElegido = estados.find((e) => String(e.id_estado) === idEstado)

  const guardar = async (e) => {
    e.preventDefault()
    setError('')

    if (!idEstado) {
      setError('Elige en qué estado queda el servicio.')
      return
    }

    setGuardando(true)
    try {
      await api.put(`/servicios/${servicio.id_servicio}`, {
        id_estado: Number(idEstado),
        // Cadena vacía = "sin dato": se manda null para borrar la fecha.
        fecha_llegada_real: llegadaReal ? new Date(llegadaReal).toISOString() : null,
        observaciones: observaciones.trim() || null
      })
      onGuardado(
        estadoElegido
          ? `El servicio ${servicio.codigo_servicio} quedó en «${estadoElegido.nombre_estado}».`
          : 'Servicio actualizado.'
      )
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
        aria-labelledby="estado-titulo"
        ref={ref}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <div>
            <p className="modal-eyebrow">Servicio {servicio.codigo_servicio}</p>
            <h2 className="modal-title" id="estado-titulo">Actualizar el estado</h2>
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
            <label className="field-label" htmlFor="estado-select">
              Estado del servicio <em className="req">*</em>
            </label>
            <select
              id="estado-select"
              value={idEstado}
              onChange={(e) => setIdEstado(e.target.value)}
              disabled={guardando}
            >
              <option value="">— Selecciona —</option>
              {estados.map((e) => (
                <option key={e.id_estado} value={String(e.id_estado)}>
                  {e.nombre_estado}
                </option>
              ))}
            </select>
            <p className="field-hint">
              {estadoActual
                ? `Ahora mismo está en «${estadoActual.nombre_estado}».`
                : 'Este servicio todavía no tiene un estado registrado.'}
            </p>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="estado-llegada">Llegada real</label>
            <input
              id="estado-llegada"
              type="datetime-local"
              value={llegadaReal}
              onChange={(e) => setLlegadaReal(e.target.value)}
              disabled={guardando}
            />
            <p className="field-hint">Complétala cuando termines el viaje. Puedes dejarla vacía.</p>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="estado-obs">Observaciones</label>
            <textarea
              id="estado-obs"
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={guardando}
              placeholder="Retrasos, incidencias en la vía, novedades con los pasajeros…"
            />
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
              {guardando ? 'Guardando…' : 'Guardar cambio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
