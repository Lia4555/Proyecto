import { casosDeUso } from '../../Data/di/Container';

// ============================================================
//  Foto de perfil compartida por toda la app
// ------------------------------------------------------------
//  La cabecera y la pantalla de perfil leen el mismo estado: al
//  guardar una foto cambian las dos a la vez. Va ligada al id de
//  la cuenta para no mostrar nunca la foto de la sesion anterior.
//  (Mismo diseño que frontend-transporte/src/lib/fotoPerfil.js.)
// ============================================================

export interface EstadoFoto {
  idUsuario: string | null;
  foto: string | null;
  cargando: boolean;
  cargada: boolean;
}

const INICIAL: EstadoFoto = { idUsuario: null, foto: null, cargando: false, cargada: false };

let estado = INICIAL;
const oyentes = new Set<() => void>();

const fijar = (cambios: Partial<EstadoFoto>) => {
  estado = { ...estado, ...cambios };
  oyentes.forEach((oyente) => oyente());
};

export const suscribirFoto = (oyente: () => void) => {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
};

export const leerEstadoFoto = (): EstadoFoto => estado;

export async function cargarFotoPerfil(idUsuario: string): Promise<void> {
  if (estado.idUsuario === idUsuario && (estado.cargando || estado.cargada)) return;

  fijar({ idUsuario, foto: null, cargando: true, cargada: false });
  try {
    const foto = await casosDeUso.obtenerFotoPerfil.ejecutar();
    if (estado.idUsuario === idUsuario) fijar({ foto });
  } catch {
    // Sin foto no pasa nada: el avatar sigue con las iniciales.
  } finally {
    if (estado.idUsuario === idUsuario) fijar({ cargando: false, cargada: true });
  }
}

export async function guardarFotoPerfil(foto: string): Promise<void> {
  const guardada = await casosDeUso.guardarFotoPerfil.ejecutar(foto);
  fijar({ foto: guardada });
}

export async function quitarFotoPerfil(): Promise<void> {
  await casosDeUso.quitarFotoPerfil.ejecutar();
  fijar({ foto: null });
}

/** Al cerrar sesion. */
export const olvidarFotoPerfil = (): void => fijar(INICIAL);
