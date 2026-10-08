import { ErrorValidacion, ErroresCampos, errorContrasena } from '../../entities';
import { PerfilRepository } from '../../repositories';

export type CampoCambioContrasena = 'actual' | 'nueva' | 'repetir';

// CASO DE USO: cambiar la contraseña propia (cualquier rol). Se pide la
// actual para que un telefono desbloqueado no baste para cambiarla. Las
// reglas son las del backend; el servidor las vuelve a comprobar y limita
// los intentos (5 cada 15 minutos).
export class CambiarContrasena {
  constructor(private readonly repositorio: PerfilRepository) {}

  ejecutar(actual: string, nueva: string, repetir: string): Promise<string> {
    const errores: ErroresCampos<CampoCambioContrasena> = {};
    if (!actual) errores.actual = 'Escribe tu contraseña actual.';

    const problema = errorContrasena(nueva);
    if (problema) errores.nueva = problema;
    else if (nueva === actual) errores.nueva = 'La nueva debe ser distinta de la actual.';

    if (!repetir) errores.repetir = 'Repite la contraseña nueva.';
    else if (!errores.nueva && repetir !== nueva) errores.repetir = 'Las contraseñas no coinciden.';

    if (errores.actual || errores.nueva || errores.repetir) throw new ErrorValidacion(errores);
    return this.repositorio.cambiarContrasena(actual, nueva);
  }
}
