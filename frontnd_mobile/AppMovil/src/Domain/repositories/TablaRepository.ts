import { Fila } from '../entities';

// CONTRATO del acceso generico a las tablas del administrador.
// El ViewModel habla con esto, no con HTTP.
export interface TablaRepository {
  listar(endpoint: string): Promise<Fila[]>;
  crear(endpoint: string, datos: Fila): Promise<Fila>;
  actualizar(endpoint: string, id: string | number, datos: Fila): Promise<Fila>;
  eliminar(endpoint: string, id: string | number): Promise<void>;
}
