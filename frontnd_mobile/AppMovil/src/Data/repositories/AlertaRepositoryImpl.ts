import { Alerta, NuevaAlerta } from '../../Domain/entities';
import { AlertaRepository } from '../../Domain/repositories';
import { TransporteApiSource } from '../sources/TransporteApiSource';

export class AlertaRepositoryImpl implements AlertaRepository {
  constructor(private readonly api: TransporteApiSource) {}

  listar(): Promise<Alerta[]> {
    return this.api.alertas();
  }

  crear(nueva: NuevaAlerta): Promise<Alerta> {
    return this.api.crearAlerta(nueva);
  }

  resolver(idAlerta: number): Promise<Alerta> {
    return this.api.actualizarAlerta(idAlerta, { estado_resuelta: true });
  }
}
