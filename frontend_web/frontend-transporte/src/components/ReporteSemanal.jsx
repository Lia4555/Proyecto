import { useEffect, useRef, useState } from 'react'
import api, { getErrorMessage } from '../api/api.js'
import { useToast } from './ui/Toast.jsx'
import { IconCalendario, IconDescargar } from './ui/Icons.jsx'

// Botón «Reporte semanal» de la sección Servicios. Pide al backend
// (GET /reportes/servicios-semanal) un Excel de lunes a domingo y lo
// descarga. El reporte se arma en el servidor: aquí solo se elige la semana.

const aTexto = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const desdeTexto = (texto) => {
  const [a, m, d] = texto.split('-').map(Number)
  return new Date(a, m - 1, d)
}

// Lunes de la semana a la que pertenece la fecha (en hora local).
const lunesDe = (fecha) => {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

const sumarDias = (fecha, dias) => {
  const d = new Date(fecha)
  d.setDate(d.getDate() + dias)
  return d
}

const corta = (d) => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
const larga = (d) => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })

// Con responseType 'blob' el error del servidor también llega como Blob:
// hay que leerlo para poder mostrar su mensaje.
async function mensajeDeError(error) {
  const data = error?.response?.data
  if (data instanceof Blob) {
    try {
      error.response.data = JSON.parse(await data.text())
    } catch {
      error.response.data = null
    }
  }
  return getErrorMessage(error)
}

export default function ReporteSemanal() {
  const toast = useToast()
  const [abierto, setAbierto] = useState(false)
  const [lunes, setLunes] = useState(() => lunesDe(new Date()))
  const [generando, setGenerando] = useState(false)
  const contenedorRef = useRef(null)

  // No se reportan días que aún no han pasado: la semana en curso llega
  // hasta hoy, y las semanas futuras no se pueden elegir. El servidor
  // aplica la misma regla (controllers/reportesController.js).
  const hoy = new Date()
  const hoyTexto = aTexto(hoy)
  const domingo = sumarDias(lunes, 6)
  const fin = aTexto(domingo) > hoyTexto ? desdeTexto(hoyTexto) : domingo
  const esEstaSemana = aTexto(lunes) === aTexto(lunesDe(hoy))
  const haySiguiente = aTexto(sumarDias(lunes, 7)) <= hoyTexto

  // Se cierra al hacer clic fuera o con Escape (igual que el menú de columnas).
  useEffect(() => {
    if (!abierto) return
    const fuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) setAbierto(false)
    }
    const escape = (e) => e.key === 'Escape' && setAbierto(false)
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', escape)
    }
  }, [abierto])

  const elegirFecha = (texto) => {
    // Un día futuro escrito a mano se ignora: el calendario ya no deja elegirlo.
    if (texto && texto <= hoyTexto) setLunes(lunesDe(desdeTexto(texto)))
  }

  const descargar = async () => {
    const desde = aTexto(lunes)
    setGenerando(true)
    try {
      const respuesta = await api.get('/reportes/servicios-semanal', {
        params: { desde },
        responseType: 'blob',
        timeout: 60000
      })

      const url = URL.createObjectURL(respuesta.data)
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = `reporte-servicios_${desde}_a_${aTexto(fin)}.xlsx`
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()
      URL.revokeObjectURL(url)

      const total = Number(respuesta.headers['x-total-servicios'] ?? 0)
      if (total === 0) {
        toast.info('Reporte descargado. Esa semana no tiene servicios programados.')
      } else {
        toast.exito(`Reporte descargado con ${total} servicio${total === 1 ? '' : 's'}.`)
      }
      setAbierto(false)
    } catch (error) {
      toast.error(await mensajeDeError(error))
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="menu-wrap" ref={contenedorRef}>
      <button
        type="button"
        className="btn ghost"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="dialog"
      >
        <IconCalendario size={16} />
        Reporte semanal
      </button>

      {abierto && (
        <div className="menu reporte-menu" role="dialog" aria-label="Reporte semanal de servicios">
          <p className="menu-title">Reporte semanal en Excel</p>

          <div className="field">
            <label className="field-label" htmlFor="reporte-semana">Semana</label>
            <input
              id="reporte-semana"
              type="date"
              value={aTexto(lunes)}
              max={hoyTexto}
              onChange={(e) => elegirFecha(e.target.value)}
            />
            <p className="field-hint">
              Elige cualquier día hasta hoy: se toma su semana de lunes a domingo. La semana en
              curso llega solo hasta hoy.
            </p>
          </div>

          <div className="reporte-semana">
            <button
              type="button"
              className="btn ghost small"
              onClick={() => setLunes((l) => sumarDias(l, -7))}
              aria-label="Semana anterior"
            >
              ‹
            </button>
            <span className="reporte-rango" aria-live="polite">
              {corta(lunes)} – {larga(fin)}
              {esEstaSemana && <small>Esta semana · hasta hoy</small>}
            </span>
            <button
              type="button"
              className="btn ghost small"
              onClick={() => setLunes((l) => sumarDias(l, 7))}
              disabled={!haySiguiente}
              aria-label="Semana siguiente"
              title={haySiguiente ? 'Semana siguiente' : 'No hay reportes de semanas que aún no han llegado'}
            >
              ›
            </button>
          </div>

          <button
            type="button"
            className="btn primary block"
            onClick={descargar}
            disabled={generando}
          >
            <IconDescargar size={16} />
            {generando ? 'Generando…' : 'Descargar Excel'}
          </button>
        </div>
      )}
    </div>
  )
}
