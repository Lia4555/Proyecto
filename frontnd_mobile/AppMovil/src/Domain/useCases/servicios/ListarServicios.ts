import { Servicio } from '../../entities';
import { ServicioRepository } from '../../repositories';

// CASO DE USO: los servicios que le tocan al usuario, ordenados por
// fecha de salida (lo mas proximo primero, que es lo que necesita ver
// un conductor al abrir la app).
export class ListarServicios {
  constructor(private readonly repositorio: ServicioRepository) {}

  async ejecutar(): Promise<Servicio[]> {
    const servicios = await this.repositorio.listar();
    return [...servicios].sort(
      (a, b) => Date.parse(a.fecha_salida) - Date.parse(b.fecha_salida)
    );
  }
}
