import { AuthRepository } from '../../repositories';

// CASO DE USO: salir de la app y borrar el token del telefono.
export class CerrarSesion {
  constructor(private readonly repositorio: AuthRepository) {}

  async ejecutar(): Promise<void> {
    await this.repositorio.cerrarSesion();
  }
}
