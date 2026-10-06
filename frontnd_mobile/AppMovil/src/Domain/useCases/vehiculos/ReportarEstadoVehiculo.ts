import { ReporteVehiculo, Vehiculo } from '../../entities';
import { VehiculoRepository } from '../../repositories';

// CASO DE USO: el conductor reporta si el vehiculo quedo operativo o
// fuera de servicio. El administrador lo ve al instante en el panel web.
export class ReportarEstadoVehiculo {
  constructor(private readonly repositorio: VehiculoRepository) {}

  async ejecutar(idVehiculo: number, operativo: boolean): Promise<Vehiculo> {
    const reporte: ReporteVehiculo = { estado_operativo: operativo };
    return this.repositorio.reportar(idVehiculo, reporte);
  }
}
