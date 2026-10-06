import { DocumentoVehiculo, Mantenimiento, Vehiculo } from '../../entities';
import { VehiculoRepository } from '../../repositories';

export interface VehiculoConDetalle {
  vehiculo: Vehiculo;
  documentos: DocumentoVehiculo[];
  mantenimientos: Mantenimiento[];
}

// CASO DE USO: arma la ficha completa del vehiculo (datos, papeles y
// mantenimientos) en una sola operacion, para que la vista no tenga
// que cruzar tres listas a mano.
export class ObtenerVehiculos {
  constructor(private readonly repositorio: VehiculoRepository) {}

  async ejecutar(): Promise<VehiculoConDetalle[]> {
    const [vehiculos, documentos, mantenimientos] = await Promise.all([
      this.repositorio.listar(),
      this.repositorio.documentos(),
      this.repositorio.mantenimientos()
    ]);

    return vehiculos.map((vehiculo) => ({
      vehiculo,
      documentos: documentos
        .filter((d) => d.id_vehiculo === vehiculo.id_vehiculo)
        .sort((a, b) => Date.parse(a.fecha_vencimiento) - Date.parse(b.fecha_vencimiento)),
      mantenimientos: mantenimientos
        .filter((m) => m.id_vehiculo === vehiculo.id_vehiculo)
        .sort((a, b) => Date.parse(b.fecha_mantenimiento) - Date.parse(a.fecha_mantenimiento))
    }));
  }
}
