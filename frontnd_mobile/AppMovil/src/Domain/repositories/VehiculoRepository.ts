import { DocumentoVehiculo, Mantenimiento, ReporteVehiculo, Vehiculo } from '../entities';

export interface VehiculoRepository {
  listar(): Promise<Vehiculo[]>;
  documentos(): Promise<DocumentoVehiculo[]>;
  mantenimientos(): Promise<Mantenimiento[]>;
  reportar(idVehiculo: number, reporte: ReporteVehiculo): Promise<Vehiculo>;
}
