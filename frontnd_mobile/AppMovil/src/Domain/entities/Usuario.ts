// MODELO de dominio: el usuario que inicio sesion.
// No depende de la API ni de React: es la forma en que la app entiende
// a un usuario, venga de donde venga.

export type NombreRol = 'Administrador' | 'Conductor';

export interface Usuario {
  id_usuario: string;
  nombre: string | null;
  apellido?: string | null;
  correo: string;
  id_rol: number;
  rol: NombreRol;
  nivel_permiso: number;
  /** Ficha de conductor asociada. Null cuando el usuario es administrador. */
  id_conductor: string | null;
}

export interface Sesion {
  usuario: Usuario;
  token: string;
}

export const esAdministrador = (usuario: Usuario | null): boolean =>
  usuario?.rol === 'Administrador';

export const esConductor = (usuario: Usuario | null): boolean =>
  usuario?.rol === 'Conductor';
