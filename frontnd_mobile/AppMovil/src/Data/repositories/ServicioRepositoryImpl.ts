import { CambioServicio, NuevoServicio, Servicio } from '../../Domain/entities';
import { ServicioRepository } from '../../Domain/repositories';
import { TransporteApiSource } from '../sources/TransporteApiSource';

export class ServicioRepositoryImpl implements ServicioRepository {
  constructor(private readonly api: TransporteApiSource) {}

  listar(): Promise<Servicio[]> {
    return this.api.servicios();
  }

  obtener(idServicio: number): Promise<Servicio> {
    return this.api.servicio(idServicio);
  }

  actualizar(idServicio: number, cambios: CambioServicio): Promise<Servicio> {
    return this.api.actualizarServicio(idServicio, cambios);
  }

  crear(nuevo: NuevoServicio): Promise<Servicio> {
    return this.api.crearServicio(nuevo);
  }
}
