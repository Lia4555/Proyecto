// MODELO: un servicio de transporte (un viaje asignado a un conductor).
// Los nombres de campo son los de la tabla "servicios" del backend.

export interface Servicio {
  id_servicio: number;
  codigo_servicio: string;
  tipo_servicio: string;
  fecha_salida: string;
  fecha_llegada_estimada: string;
  fecha_llegada_real: string | null;
  numero_pasajeros: number;
  precio_total: number;
  distancia_estimada_km: number | null;
  peajes_estimados: number | null;
  observaciones: string | null;
  id_conductor: string;
  id_vehiculo: number;
  // Los servicios ya no dependen de la tabla destinos: el origen y el
  // destino se escriben a mano. El servidor los manda siempre en texto
  // (tambien en los servicios antiguos); los ids quedan por compatibilidad.
  origen?: string | null;
  destino?: string | null;
  id_origen: number | null;
  id_destino: number | null;
  id_estado: number;
}

/**
 * Cambios sobre un servicio. Un conductor solo puede enviar los tres
 * primeros (el backend recorta el resto); el administrador tambien puede
 * reasignar conductor y vehiculo.
 */
export interface CambioServicio {
  id_estado?: number;
  fecha_llegada_real?: string | null;
  observaciones?: string | null;
  id_conductor?: string;
  id_vehiculo?: number;
}

/** Estados en los que el viaje ya termino (no cuenta como retrasado ni en curso). */
export const estaCerrado = (nombreEstado: string): boolean =>
  /final|complet|termin|cancel|anul/i.test(nombreEstado);

/** El viaje ya paso su hora estimada de llegada y aun no se cierra. */
export const vaConRetraso = (servicio: Servicio): boolean =>
  servicio.fecha_llegada_real === null &&
  Date.parse(servicio.fecha_llegada_estimada) < Date.now();
