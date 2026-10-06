import { AccionCuenta, ConductorResumen, CuentaAcceso, NombreRol } from '../entities';

// CONTRATO de lo que solo gestiona el administrador: cuentas de acceso y
// la lista de conductores (para asignar servicios y enviar alertas).
export interface AdminRepository {
  cuentas(): Promise<CuentaAcceso[]>;
  /**
   * Aprueba, desactiva o rechaza una cuenta. Devuelve el mensaje del servidor.
   * `rol` solo se usa al aprobar: es el permiso que el administrador delega.
   */
  gestionarCuenta(idUsuario: string, accion: AccionCuenta, rol?: NombreRol): Promise<string>;
  conductores(): Promise<ConductorResumen[]>;
}
