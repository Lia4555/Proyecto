import { Sesion } from '../../entities';
import { AuthRepository } from '../../repositories';

// CASO DE USO: una accion del negocio, con sus reglas, sin nada de UI.
// El ViewModel lo llama; el caso de uso decide si los datos sirven.
export class IniciarSesion {
  constructor(private readonly repositorio: AuthRepository) {}

  async ejecutar(correo: string, contrasena: string): Promise<Sesion> {
    // Mismas reglas que el login web. El correo NO se pasa a minusculas y la
    // contraseña no tiene largo minimo aqui: el backend compara el correo tal
    // cual esta guardado, y esas reglas bloqueaban cuentas que si existen.
    const correoLimpio = correo.trim();

    if (!correoLimpio || !contrasena) {
      throw new Error('Escribe tu correo y tu contraseña.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correoLimpio)) {
      throw new Error('El correo no tiene un formato válido.');
    }

    return this.repositorio.iniciarSesion(correoLimpio, contrasena);
  }
}
