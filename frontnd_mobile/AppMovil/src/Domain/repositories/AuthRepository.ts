import { Sesion, SolicitudCuenta, Usuario } from '../entities';

// CONTRATO. El dominio dice QUE necesita; la capa Data decide COMO
// (HTTP, cache, base local). Asi las vistas nunca hablan con la API.
export interface AuthRepository {
  iniciarSesion(correo: string, contrasena: string): Promise<Sesion>;
  /** Pide una cuenta de conductor. Devuelve el mensaje del servidor. */
  registrarCuenta(solicitud: SolicitudCuenta): Promise<string>;
  /** Sesion guardada en el telefono, o null si no hay o ya caduco. */
  sesionGuardada(): Promise<Sesion | null>;
  /** Revalida contra el servidor la sesion guardada. */
  usuarioActual(): Promise<Usuario>;
  cerrarSesion(): Promise<void>;
}
