import { CambioServicio, Servicio } from '../../entities';
import { ServicioRepository } from '../../repositories';

// CASO DE USO: el conductor mueve su viaje de estado (programado -> en
// ruta -> finalizado). Es lo unico que el backend le deja modificar,
// junto con la llegada real y las observaciones.
export class ActualizarEstadoServicio {
  constructor(private readonly repositorio: ServicioRepository) {}

  async ejecutar(
    idServicio: number,
    idEstado: number,
    opciones: { marcarLlegada?: boolean; observaciones?: string | null } = {}
  ): Promise<Servicio> {
    if (!Number.isInteger(idEstado) || idEstado <= 0) {
      throw new Error('Selecciona un estado valido.');
    }

    const cambios: CambioServicio = { id_estado: idEstado };

    // Al cerrar el viaje se sella la hora real de llegada.
    if (opciones.marcarLlegada) {
      cambios.fecha_llegada_real = new Date().toISOString();
    }
    if (opciones.observaciones !== undefined) {
      const texto = (opciones.observaciones ?? '').trim();
      cambios.observaciones = texto.length > 0 ? texto : null;
    }

    return this.repositorio.actualizar(idServicio, cambios);
  }
}
