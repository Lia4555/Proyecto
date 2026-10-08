import {
  AccionCuenta,
  Alerta,
  CambioServicio,
  ConductorResumen,
  CuentaAcceso,
  Destino,
  NuevaAlerta,
  NuevoServicio,
  TipoAlerta,
  DocumentoVehiculo,
  EstadoServicio,
  Mantenimiento,
  NombreRol,
  ReporteVehiculo,
  Servicio,
  TipoVehiculo,
  Vehiculo
} from '../../Domain/entities';
import { HttpClient } from '../api/HttpClient';

// El backend responde a los PUT con { success, data }.
interface RespuestaActualizacion<T> {
  success: boolean;
  data: T;
}

/**
 * Fuente de datos de las tablas operativas (/api/servicios, /api/vehiculos...).
 * El propio servidor recorta lo que ve cada rol, asi que aqui se pide
 * siempre la lista completa: a un conductor le llegan solo sus filas.
 */
export class TransporteApiSource {
  constructor(private readonly http: HttpClient) {}

  servicios(): Promise<Servicio[]> {
    return this.http.get<Servicio[]>('/servicios');
  }

  servicio(idServicio: number): Promise<Servicio> {
    return this.http.get<Servicio>(`/servicios/${idServicio}`);
  }

  async actualizarServicio(idServicio: number, cambios: CambioServicio): Promise<Servicio> {
    const respuesta = await this.http.put<RespuestaActualizacion<Servicio>>(
      `/servicios/${idServicio}`,
      cambios
    );
    return respuesta.data;
  }

  vehiculos(): Promise<Vehiculo[]> {
    return this.http.get<Vehiculo[]>('/vehiculos');
  }

  async actualizarVehiculo(idVehiculo: number, reporte: ReporteVehiculo): Promise<Vehiculo> {
    const respuesta = await this.http.put<RespuestaActualizacion<Vehiculo>>(
      `/vehiculos/${idVehiculo}`,
      reporte
    );
    return respuesta.data;
  }

  documentosVehiculo(): Promise<DocumentoVehiculo[]> {
    return this.http.get<DocumentoVehiculo[]>('/documentos-vehiculo');
  }

  mantenimientos(): Promise<Mantenimiento[]> {
    return this.http.get<Mantenimiento[]>('/mantenimientos');
  }

  alertas(): Promise<Alerta[]> {
    return this.http.get<Alerta[]>('/alertas');
  }

  estadosServicio(): Promise<EstadoServicio[]> {
    return this.http.get<EstadoServicio[]>('/estados-servicio');
  }

  destinos(): Promise<Destino[]> {
    return this.http.get<Destino[]>('/destinos');
  }

  tiposVehiculo(): Promise<TipoVehiculo[]> {
    return this.http.get<TipoVehiculo[]>('/tipos-vehiculo');
  }

  tiposAlerta(): Promise<TipoAlerta[]> {
    return this.http.get<TipoAlerta[]>('/tipos-alerta');
  }

  // ---- Solo administrador (el backend responde 403 a un conductor) ----

  async crearServicio(nuevo: NuevoServicio): Promise<Servicio> {
    const r = await this.http.post<RespuestaActualizacion<Servicio>>('/servicios', nuevo);
    return r.data;
  }

  async crearAlerta(nueva: NuevaAlerta): Promise<Alerta> {
    const r = await this.http.post<RespuestaActualizacion<Alerta>>('/alertas', nueva);
    return r.data;
  }

  async actualizarAlerta(idAlerta: number, cambios: Partial<Alerta>): Promise<Alerta> {
    const r = await this.http.put<RespuestaActualizacion<Alerta>>(`/alertas/${idAlerta}`, cambios);
    return r.data;
  }

  conductores(): Promise<ConductorResumen[]> {
    return this.http.get<ConductorResumen[]>('/conductor');
  }

  cuentas(): Promise<CuentaAcceso[]> {
    return this.http.get<CuentaAcceso[]>('/cuentas');
  }

  async gestionarCuenta(
    idUsuario: string,
    accion: AccionCuenta,
    // Rol con el que se aprueba. Es la delegacion del permiso: solo viaja
    // al aprobar. Sin el, el servidor conserva el rol que la cuenta tenia.
    rol?: NombreRol
  ): Promise<string> {
    const r =
      accion === 'rechazar'
        ? await this.http.delete<{ message: string; advertencia?: string | null }>(
            `/cuentas/${idUsuario}`
          )
        : await this.http.patch<{ message: string; advertencia?: string | null }>(
            `/cuentas/${idUsuario}/${accion}`,
            rol ? { rol } : {}
          );
    // El servidor avisa si un conductor quedo sin ficha: sin ella no puede entrar.
    return r.advertencia ? `${r.message} ${r.advertencia}` : r.message;
  }

  /** PATCH /cuentas/:id/contrasena: contraseña temporal puesta por el administrador. */
  async restablecerContrasena(idUsuario: string, contrasena: string): Promise<string> {
    const r = await this.http.patch<{ success: boolean; message: string }>(
      `/cuentas/${idUsuario}/contrasena`,
      { contrasena }
    );
    return r.message;
  }
}
