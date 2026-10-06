// MODELOS que solo usa el administrador.

/** Ficha de un conductor, lo necesario para elegirlo en una lista. */
export interface ConductorResumen {
  id_conductor: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  activo: boolean | null;
}

export const nombreConductor = (c: ConductorResumen | undefined | null): string =>
  c ? `${c.nombre ?? ''} ${c.apellido ?? ''}`.trim() || c.email : 'Sin asignar';

/**
 * pendiente   -> solicitud del registro que nadie ha revisado (Aprobar / Rechazar)
 * activa      -> puede entrar (Desactivar)
 * desactivada -> ya estuvo aprobada y el administrador la apago (Reactivar)
 */
export type EstadoCuenta = 'pendiente' | 'activa' | 'desactivada';

/** Cuenta de acceso tal como la devuelve /api/cuentas (sin contraseña). */
export interface CuentaAcceso {
  id_usuario: string;
  nombre: string | null;
  apellido: string | null;
  correo: string;
  telefono: string | null;
  activo: boolean;
  estado: EstadoCuenta;
  id_rol: number;
  rol: string | null;
  fecha_registro: string | null;
  tiene_ficha: boolean;
  tipo_documento: string | null;
  numero_documento: string | null;
  es_tu_cuenta: boolean;
}

export type AccionCuenta = 'aprobar' | 'desactivar' | 'rechazar';

export interface TipoAlerta {
  id_tipo_alerta: number;
  nombre_tipo: string;
  nivel_prioridad: number | null;
  descripcion: string | null;
}

/** Datos para crear un servicio desde la app. */
export interface NuevoServicio {
  codigo_servicio: string;
  tipo_servicio: string;
  fecha_salida: string;
  fecha_llegada_estimada: string;
  numero_pasajeros: number;
  precio_total: number;
  observaciones?: string;
  id_conductor: string;
  id_vehiculo: number;
  id_origen: number;
  id_destino: number;
  id_estado: number;
}

/** Datos para enviar una alerta a un conductor. */
export interface NuevaAlerta {
  id_usuario_destino: string;
  id_tipo_alerta: number;
  tipo_alerta: string;
  prioridad: number;
  descripcion: string;
  fecha_limite?: string;
  estado_resuelta: false;
}

/** Lo que el administrador ve al abrir la app. */
export interface ResumenAdmin {
  cuentasPendientes: number;
  serviciosHoy: number;
  serviciosEnCurso: number;
  serviciosRetrasados: number;
  vehiculosFueraDeServicio: number;
  documentosVencidos: number;
  documentosPorVencer: number;
  alertasSinResolver: number;
}

/** Tipos de servicio que usa la empresa (los mismos del panel web). */
export const TIPOS_SERVICIO = ['Empresarial', 'Escolar', 'Turístico', 'Especial'];
