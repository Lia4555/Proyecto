import { ErrorValidacion } from '../../Domain/entities';
import { PerfilRepository } from '../../Domain/repositories';
import { ApiError } from '../api/HttpClient';
import { PerfilApiSource } from '../sources/PerfilApiSource';

export class PerfilRepositoryImpl implements PerfilRepository {
  constructor(private readonly api: PerfilApiSource) {}

  async obtenerFoto(): Promise<string | null> {
    const respuesta = await this.api.foto();
    return respuesta.foto ?? null;
  }

  async guardarFoto(foto: string): Promise<string | null> {
    const respuesta = await this.api.guardarFoto(foto);
    return respuesta.foto ?? null;
  }

  async quitarFoto(): Promise<void> {
    await this.api.quitarFoto();
  }

  async cambiarContrasena(actual: string, nueva: string): Promise<string> {
    try {
      return await this.api.cambiarContrasena(actual, nueva);
    } catch (error) {
      // 400 con { detalles: [{ campo, mensaje }] }. El backend valida la
      // nueva con un esquema suelto, asi que su error llega sin campo.
      if (error instanceof ApiError && error.status === 400 && error.detalles.length > 0) {
        const campos: Record<string, string> = {};
        for (const d of error.detalles) {
          campos[d.campo === 'actual' ? 'actual' : 'nueva'] = d.mensaje;
        }
        throw new ErrorValidacion(campos, error.message);
      }
      throw error;
    }
  }
}
