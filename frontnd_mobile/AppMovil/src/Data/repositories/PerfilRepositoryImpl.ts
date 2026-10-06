import { PerfilRepository } from '../../Domain/repositories';
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
}
