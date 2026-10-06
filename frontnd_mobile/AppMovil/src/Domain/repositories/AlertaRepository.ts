import { Alerta, NuevaAlerta } from '../entities';

export interface AlertaRepository {
  listar(): Promise<Alerta[]>;
  /** Solo administrador. */
  crear(nueva: NuevaAlerta): Promise<Alerta>;
  /** Solo administrador. */
  resolver(idAlerta: number): Promise<Alerta>;
}
