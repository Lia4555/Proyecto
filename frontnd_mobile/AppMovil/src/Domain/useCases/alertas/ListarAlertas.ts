import { Alerta } from '../../entities';
import { AlertaRepository } from '../../repositories';

// CASO DE USO: alertas del usuario. Primero las pendientes y, dentro de
// ellas, las de mayor prioridad: es el orden en que hay que atenderlas.
export class ListarAlertas {
  constructor(private readonly repositorio: AlertaRepository) {}

  async ejecutar(): Promise<Alerta[]> {
    const alertas = await this.repositorio.listar();
    return [...alertas].sort((a, b) => {
      if (a.estado_resuelta !== b.estado_resuelta) return a.estado_resuelta ? 1 : -1;
      return b.prioridad - a.prioridad;
    });
  }
}
