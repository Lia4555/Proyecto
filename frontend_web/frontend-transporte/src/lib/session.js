// ============================================================
// Sesión del usuario
// ------------------------------------------------------------
// El token vive en una cookie httpOnly: el navegador la manda
// sola en cada petición y el JavaScript de la página NO puede
// leerla. Por eso aquí no hay ningún token; la verdad sobre
// quién eres la da siempre el backend en GET /api/auth/me.
//
// De localStorage solo se guarda una copia de los datos ya
// conocidos, para pintar la cabecera sin esperar a esa llamada.
// Nunca se usa para decidir permisos.
// ============================================================

const USER_KEY = 'dv:usuario'

// Solo existen dos roles en el sistema.
export const ROL = {
  ADMIN: 'Administrador',
  CONDUCTOR: 'Conductor'
}

// Niveles definidos en el backend (middleware/permisos.js)
export const NIVEL = {
  CONDUCTOR: 2,
  ADMIN: 3
}

// El administrador ve y edita todo.
export function esAdmin(usuario) {
  return (usuario?.nivel_permiso ?? 0) >= NIVEL.ADMIN
}

// El conductor solo ve sus servicios y su vehículo.
export function esConductor(usuario) {
  return !!usuario && !esAdmin(usuario)
}

// Crear / editar / eliminar en las tablas del panel: solo el administrador.
export function puedeEscribir(usuario) {
  return esAdmin(usuario)
}

// ---- copia local, solo para pintar antes de que responda /auth/me ----
export function leerUsuario() {
  try {
    const bruto = localStorage.getItem(USER_KEY)
    return bruto ? JSON.parse(bruto) : null
  } catch {
    return null
  }
}

export function guardarUsuario(usuario) {
  try {
    if (usuario) localStorage.setItem(USER_KEY, JSON.stringify(usuario))
    else localStorage.removeItem(USER_KEY)
  } catch {
    /* modo privado o almacenamiento lleno: no es motivo para romper la app */
  }
  return usuario
}

export function limpiarUsuario() {
  guardarUsuario(null)
}

// "Diego Rojas" -> "DR" ·  "diego@x.com" -> "DI"  (avatar de la cabecera)
export function iniciales(usuario) {
  const nombre = String(usuario?.nombre || '').trim()
  if (nombre) {
    const partes = nombre.split(/\s+/)
    const dos = partes.length > 1 ? partes[0][0] + partes[1][0] : partes[0].slice(0, 2)
    return dos.toUpperCase()
  }
  const base = String(usuario?.correo || '').split('@')[0] || '?'
  return base.slice(0, 2).toUpperCase()
}

// Nombre con el que se saluda al usuario en la interfaz.
export function nombreVisible(usuario) {
  return usuario?.nombre?.trim() || usuario?.correo || 'Usuario'
}
