import { Fila } from '../../Domain/entities';
import { HttpClient } from '../api/HttpClient';

// ============================================================
//  ACCESO GENERICO A CUALQUIER TABLA DEL BACKEND
// ------------------------------------------------------------
//  El backend expone las 16 tablas con el mismo contrato
//  (routers/genericRouter.js), asi que basta UNA clase para
//  todas en vez de una por tabla.
//
//  Quien puede hacer que lo decide el servidor
//  (middleware/permisos.js): aqui no hay ninguna comprobacion
//  de permisos, y no debe haberla.
// ============================================================

/** Respuesta del backend al crear o actualizar. */
interface RespuestaEscritura {
  success?: boolean;
  message?: string;
  data?: Fila;
}

export class TablaApiSource {
  constructor(private readonly http: HttpClient) {}

  listar(endpoint: string): Promise<Fila[]> {
    return this.http.get<Fila[]>(`/${endpoint}`);
  }

  async crear(endpoint: string, datos: Fila): Promise<Fila> {
    const r = await this.http.post<RespuestaEscritura>(`/${endpoint}`, datos);
    return r?.data ?? datos;
  }

  async actualizar(endpoint: string, id: string | number, datos: Fila): Promise<Fila> {
    const r = await this.http.put<RespuestaEscritura>(`/${endpoint}/${id}`, datos);
    return r?.data ?? datos;
  }

  async eliminar(endpoint: string, id: string | number): Promise<void> {
    await this.http.delete<RespuestaEscritura>(`/${endpoint}/${id}`);
  }
}
