import { AccionCuenta, ConductorResumen, CuentaAcceso, ErrorValidacion, NombreRol } from '../../Domain/entities';
import { AdminRepository } from '../../Domain/repositories';
import { ApiError } from '../api/HttpClient';
import { TransporteApiSource } from '../sources/TransporteApiSource';

export class AdminRepositoryImpl implements AdminRepository {
  constructor(private readonly api: TransporteApiSource) {}

  cuentas(): Promise<CuentaAcceso[]> {
    return this.api.cuentas();
  }

  gestionarCuenta(idUsuario: string, accion: AccionCuenta, rol?: NombreRol): Promise<string> {
    return this.api.gestionarCuenta(idUsuario, accion, rol);
  }

  async restablecerContrasena(idUsuario: string, contrasena: string): Promise<string> {
    try {
      return await this.api.restablecerContrasena(idUsuario, contrasena);
    } catch (error) {
      // 400 de Zod: el mensaje va debajo del campo de la contraseña.
      if (error instanceof ApiError && error.status === 400 && error.detalles.length > 0) {
        throw new ErrorValidacion({ contrasena: error.detalles[0].mensaje }, error.message);
      }
      throw error;
    }
  }

  conductores(): Promise<ConductorResumen[]> {
    return this.api.conductores();
  }
}
