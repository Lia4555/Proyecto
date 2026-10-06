import { Fila } from '../../Domain/entities';
import { TablaRepository } from '../../Domain/repositories';
import { TablaApiSource } from '../sources/TablaApiSource';

export class TablaRepositoryImpl implements TablaRepository {
  constructor(private readonly api: TablaApiSource) {}

  listar(endpoint: string): Promise<Fila[]> {
    return this.api.listar(endpoint);
  }

  crear(endpoint: string, datos: Fila): Promise<Fila> {
    return this.api.crear(endpoint, datos);
  }

  actualizar(endpoint: string, id: string | number, datos: Fila): Promise<Fila> {
    return this.api.actualizar(endpoint, id, datos);
  }

  eliminar(endpoint: string, id: string | number): Promise<void> {
    return this.api.eliminar(endpoint, id);
  }
}
