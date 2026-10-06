// MODELO: el vehiculo que conduce el usuario, con sus papeles y mantenimientos.

export interface Vehiculo {
  id_vehiculo: number;
  placa: string;
  numero_interno: string | null;
  marca: string;
  linea: string;
  modelo: string;
  color: string | null;
  capacidad_pasajeros: number;
  estado_operativo: boolean;
  fecha_ultimo_mantenimiento: string | null;
  fecha_proximo_mantenimiento: string | null;
  id_tipo_vehiculo: number;
  id_conductor_asignado: string | null;
}

export interface DocumentoVehiculo {
  id_documento: number;
  numero_documento: string;
  tipo_documento_legal: string;
  fecha_expedicion: string;
  fecha_vencimiento: string;
  aseguradora: string | null;
  estado_vigente: boolean;
  id_vehiculo: number;
  id_tipo_documento: number;
}

export interface Mantenimiento {
  id_mantenimiento: number;
  fecha_mantenimiento: string;
  tipo_mantenimiento: string;
  descripcion: string | null;
  costo: number;
  taller_responsable: string | null;
  kilometraje_actual: number | null;
  proximo_mantenimiento: string | null;
  id_vehiculo: number;
}

/** Reporte operativo que el conductor puede enviar sobre su vehiculo. */
export interface ReporteVehiculo {
  estado_operativo?: boolean;
  fecha_ultimo_mantenimiento?: string | null;
  fecha_proximo_mantenimiento?: string | null;
}

/** Un documento vencido deja el vehiculo fuera de servicio legalmente. */
export const documentoVencido = (documento: DocumentoVehiculo): boolean =>
  Date.parse(documento.fecha_vencimiento) < Date.now();
