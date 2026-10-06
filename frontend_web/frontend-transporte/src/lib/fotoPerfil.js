import api from '../api/api.js'

// ============================================================
// Foto de perfil del usuario con sesión
// ------------------------------------------------------------
// Un único estado para toda la app: el avatar de la cabecera y el
// diálogo para cambiarla leen lo mismo, así que al guardar se
// actualizan los dos a la vez. Va ligado al id del usuario para
// que, al cambiar de cuenta en la misma pestaña, nunca se vea la
// foto de la sesión anterior.
// ============================================================

const INICIAL = { idUsuario: null, foto: null, cargando: false, cargada: false }

let estado = INICIAL
const oyentes = new Set()

function fijar(cambios) {
  estado = { ...estado, ...cambios }
  oyentes.forEach((oyente) => oyente())
}

export function suscribirFoto(oyente) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

export const leerEstadoFoto = () => estado
export const estadoFotoInicial = () => INICIAL

export async function cargarFoto(idUsuario) {
  if (!idUsuario) return
  if (estado.idUsuario === idUsuario && (estado.cargando || estado.cargada)) return

  fijar({ idUsuario, foto: null, cargando: true, cargada: false })
  try {
    const { data } = await api.get('/perfil/foto')
    if (estado.idUsuario === idUsuario) fijar({ foto: data?.foto ?? null })
  } catch {
    // Sin foto no pasa nada: el avatar sigue con las iniciales.
  } finally {
    if (estado.idUsuario === idUsuario) fijar({ cargando: false, cargada: true })
  }
}

export async function guardarFoto(foto) {
  const { data } = await api.put('/perfil/foto', { foto })
  fijar({ foto: data?.foto ?? null })
}

export async function quitarFoto() {
  await api.delete('/perfil/foto')
  fijar({ foto: null })
}

// Al cerrar sesión o cuando caduca.
export function olvidarFoto() {
  fijar(INICIAL)
}
