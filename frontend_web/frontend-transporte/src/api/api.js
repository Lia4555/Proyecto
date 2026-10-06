import axios from 'axios'
import { limpiarUsuario } from '../lib/session.js'

// URL base del backend (sale del archivo .env). Si no existe, usa localhost:3000.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Evento propio que dispara la app cuando el servidor invalida la sesión.
// App.jsx lo escucha y vuelve al login SIN recargar la página.
export const SESSION_EXPIRED_EVENT = 'sesion:expirada'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // La sesión viaja en una cookie httpOnly que el JavaScript de la página no
  // puede leer (así un XSS no puede robar el token). Para que el navegador la
  // envíe a otro puerto hace falta esta bandera, y en el backend
  // `cors({ credentials: true })` con el origen exacto.
  withCredentials: true,
  timeout: 20000
})

// ---- RESPUESTA: distinguir "sin sesión" de "sin permiso" -------------------
// 401 -> la cookie falta, venció o es inválida: hay que volver al login.
// 403 -> hay sesión, pero el rol no alcanza para eso: solo se muestra el
//        mensaje; sacar al usuario aquí sería un error muy confuso.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url = error?.config?.url || ''
    const mensaje = error?.response?.data?.error || ''

    // Las llamadas a /auth/ se excluyen: un 401 en el login o en la
    // comprobación inicial de sesión es una respuesta normal, no una caída.
    const esLlamadaDeAuth = url.includes('/auth/')

    if (status === 401 && !esLlamadaDeAuth) {
      limpiarUsuario()
      window.dispatchEvent(
        new CustomEvent(SESSION_EXPIRED_EVENT, {
          detail: { message: mensaje || 'Tu sesión expiró. Inicia sesión de nuevo.' }
        })
      )
    }

    return Promise.reject(error)
  }
)

// Convierte cualquier error de axios en un texto legible para el usuario.
export function getErrorMessage(error) {
  if (error?.code === 'ECONNABORTED') {
    return 'El servidor tardó demasiado en responder. Inténtalo de nuevo.'
  }

  const data = error?.response?.data
  if (!data) {
    return 'No se pudo conectar con el servidor. Revisa que el backend esté encendido.'
  }

  if (Array.isArray(data.detalles) && data.detalles.length > 0) {
    return data.detalles.map((d) => `${d.campo}: ${d.mensaje}`).join(' · ')
  }

  return data.error || data.message || 'Ocurrió un error inesperado.'
}

// Extrae los errores de validación de Zod por campo:
// { detalles: [{ campo, mensaje }] }  ->  { campo: 'mensaje' }
// Sirve para pintar el error justo debajo del input correspondiente.
export function getFieldErrors(error) {
  const detalles = error?.response?.data?.detalles
  if (!Array.isArray(detalles)) return {}

  const porCampo = {}
  for (const d of detalles) {
    if (d?.campo) porCampo[d.campo] = d.mensaje
  }
  return porCampo
}

export default api
