import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { selectorImagen } from '../../Data/di/Container';
import {
  cargarFotoPerfil,
  guardarFotoPerfil,
  leerEstadoFoto,
  quitarFotoPerfil,
  suscribirFoto
} from './fotoPerfilStore';

const mensaje = (e: unknown, porDefecto: string) =>
  e instanceof Error ? e.message : porDefecto;

/** Foto de perfil de la cuenta indicada (null mientras no tenga o no cargue). */
export const useFotoPerfil = (idUsuario: string | undefined): string | null => {
  const estado = useSyncExternalStore(suscribirFoto, leerEstadoFoto);

  useEffect(() => {
    if (idUsuario) cargarFotoPerfil(idUsuario);
  }, [idUsuario]);

  return idUsuario && estado.idUsuario === idUsuario ? estado.foto : null;
};

export type OrigenFoto = 'galeria' | 'camara' | { recurso: number };

// ============================================================
//  VIEWMODEL: cambiar la foto de perfil
// ------------------------------------------------------------
//  Cualquier origen deja una foto "pendiente" que se ve en grande;
//  solo se guarda al confirmar.
// ============================================================
export const useCambiarFotoViewModel = (onListo: () => void) => {
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [preparando, setPreparando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const elegir = useCallback(async (origen: OrigenFoto) => {
    setPreparando(true);
    setError(null);
    try {
      const foto =
        origen === 'galeria'
          ? await selectorImagen.desdeGaleria()
          : origen === 'camara'
            ? await selectorImagen.desdeCamara()
            : await selectorImagen.desdeRecurso(origen.recurso);
      if (foto) setPendiente(foto);
      return Boolean(foto);
    } catch (e) {
      setError(mensaje(e, 'No se pudo usar esa imagen.'));
      return false;
    } finally {
      setPreparando(false);
    }
  }, []);

  const guardar = useCallback(async () => {
    if (!pendiente) return;
    setGuardando(true);
    setError(null);
    try {
      await guardarFotoPerfil(pendiente);
      setPendiente(null);
      onListo();
    } catch (e) {
      setError(mensaje(e, 'No se pudo guardar la foto.'));
    } finally {
      setGuardando(false);
    }
  }, [pendiente, onListo]);

  const quitar = useCallback(async () => {
    setGuardando(true);
    setError(null);
    try {
      await quitarFotoPerfil();
      onListo();
    } catch (e) {
      setError(mensaje(e, 'No se pudo quitar la foto.'));
    } finally {
      setGuardando(false);
    }
  }, [onListo]);

  const descartar = useCallback(() => {
    setPendiente(null);
    setError(null);
  }, []);

  return { pendiente, preparando, guardando, error, elegir, guardar, quitar, descartar };
};
