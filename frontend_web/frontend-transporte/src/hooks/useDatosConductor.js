import { useCallback, useEffect, useState } from 'react'
import api, { getErrorMessage } from '../api/api.js'

// ============================================================
// Datos del panel del conductor
// ------------------------------------------------------------
// Pide de una sola vez todo lo que necesita su panel. El backend
// ya devuelve SOLO lo suyo: sus servicios, los vehículos que
// conduce, los documentos y mantenimientos de esos vehículos y
// las alertas dirigidas a él. Aquí no hay ningún filtro de
// seguridad; los catálogos solo sirven para traducir códigos a
// nombres en pantalla.
// ============================================================

const PETICIONES = [
  ['servicios', 'servicios', true],
  ['vehiculos', 'vehiculos', true],
  ['estados', 'estados-servicio', false],
  ['tiposVehiculo', 'tipos-vehiculo', false],
  ['documentos', 'documentos-vehiculo', false],
  ['tiposDocumento', 'tipos-documentos', false],
  ['mantenimientos', 'mantenimientos', false],
  ['alertas', 'alertas', false],
  ['tiposAlerta', 'tipos-alerta', false]
]

const VACIO = Object.fromEntries(PETICIONES.map(([clave]) => [clave, []]))

// Índice id -> fila, para no recorrer el array en cada tarjeta.
export const indexar = (filas, pk) => new Map((filas || []).map((f) => [String(f[pk]), f]))

export function useDatosConductor() {
  const [datos, setDatos] = useState(VACIO)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setCargando(true)
    setError('')

    const respuestas = await Promise.allSettled(
      PETICIONES.map(([, endpoint]) => api.get(`/${endpoint}`))
    )

    const resultado = { ...VACIO }
    let fallo = ''

    respuestas.forEach((respuesta, i) => {
      const [clave, , esencial] = PETICIONES[i]
      if (respuesta.status === 'fulfilled') {
        resultado[clave] = Array.isArray(respuesta.value.data) ? respuesta.value.data : []
      } else if (esencial && !fallo) {
        // Un catálogo que falle solo hace que se vea un código en vez de un
        // nombre; que fallen los servicios o los vehículos sí hay que contarlo.
        fallo = getErrorMessage(respuesta.reason)
      }
    })

    setDatos(resultado)
    setError(fallo)
    setCargando(false)
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  return { datos, cargando, error, recargar: cargar }
}
