import { DocumentoVehiculo, Mantenimiento, ReporteVehiculo, Vehiculo } from '../../Domain/entities';
import { VehiculoRepository } from '../../Domain/repositories';
import { TransporteApiSource } from '../sources/TransporteApiSource';

export class VehiculoRepositoryImpl implements VehiculoRepository {
  constructor(private readonly api: TransporteApiSource) {}

  listar(): Promise<Vehiculo[]> {
    return this.api.vehiculos();
  }

  documentos(): Promise<DocumentoVehiculo[]> {
    return this.api.documentosVehiculo();
  }

  mantenimientos(): Promise<Mantenimiento[]> {
    return this.api.mantenimientos();
  }

  reportar(idVehiculo: number, reporte: ReporteVehiculo): Promise<Vehiculo> {
    return this.api.actualizarVehiculo(idVehiculo, reporte);
  }
}
