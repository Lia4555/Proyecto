import { CambioServicio, NuevoServicio, Servicio } from '../entities';

export interface ServicioRepository {
  listar(): Promise<Servicio[]>;
  obtener(idServicio: number): Promise<Servicio>;
  actualizar(idServicio: number, cambios: CambioServicio): Promise<Servicio>;
  /** Solo administrador. */
  crear(nuevo: NuevoServicio): Promise<Servicio>;
}
