import { Sesion } from '../../entities';
import { AuthRepository } from '../../repositories';

// CASO DE USO: al abrir la app, seguir dentro si la sesion guardada
// todavia vale. Se confirma contra el servidor: un token caducado en
// el telefono no debe dar acceso a las pantallas.
export class RestaurarSesion {
  constructor(private readonly repositorio: AuthRepository) {}

  async ejecutar(): Promise<Sesion | null> {
    const guardada = await this.repositorio.sesionGuardada();
    if (!guardada) return null;

    try {
      const usuario = await this.repositorio.usuarioActual();
      return { usuario, token: guardada.token };
    } catch {
      // Token vencido o revocado: se limpia para no quedar en bucle de 401.
      await this.repositorio.cerrarSesion();
      return null;
    }
  }
}
