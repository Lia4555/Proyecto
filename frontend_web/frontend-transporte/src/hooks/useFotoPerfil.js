import { useEffect, useSyncExternalStore } from 'react'
import { cargarFoto, estadoFotoInicial, leerEstadoFoto, suscribirFoto } from '../lib/fotoPerfil.js'

// Foto de perfil del usuario indicado (null mientras no tenga o no cargue).
export function useFotoPerfil(idUsuario) {
  const estado = useSyncExternalStore(suscribirFoto, leerEstadoFoto, estadoFotoInicial)

  useEffect(() => {
    cargarFoto(idUsuario)
  }, [idUsuario])

  return estado.idUsuario === idUsuario ? estado.foto : null
}
