// MODELOS de catalogo: tablas fijas que sirven para mostrar nombres
// en vez de numeros (id_estado -> "En ruta", id_destino -> "Medellin").
import { TipoAlerta } from './Admin';

export interface EstadoServicio {
  id_estado: number;
  nombre_estado: string;
  descripcion: string | null;
}

export interface Destino {
  id_destino: number;
  nombre_destino: string;
  ciudad: string;
  departamento: string | null;
  tiempo_estimado_viaje_horas: number | null;
  activo: boolean;
}

export interface TipoVehiculo {
  id_tipo_vehiculo: number;
  nombre_tipo: string;
  descripcion: string | null;
}

/** Catalogos ya cargados y listos para consultar por id. */
export interface Catalogos {
  estados: EstadoServicio[];
  destinos: Destino[];
  tiposVehiculo: TipoVehiculo[];
  tiposAlerta: TipoAlerta[];
}

export const catalogosVacios = (): Catalogos => ({
  estados: [],
  destinos: [],
  tiposVehiculo: [],
  tiposAlerta: []
});

export const nombreEstado = (catalogos: Catalogos, id: number): string =>
  catalogos.estados.find((e) => e.id_estado === id)?.nombre_estado ?? `Estado ${id}`;

export const nombreDestino = (catalogos: Catalogos, id: number): string => {
  const destino = catalogos.destinos.find((d) => d.id_destino === id);
  return destino ? `${destino.nombre_destino} (${destino.ciudad})` : `Destino ${id}`;
};

/**
 * Texto de un lugar de un servicio: el escrito a mano si lo hay y, si no
 * (servidor antiguo o base sin migrar), el nombre del destino del catalogo.
 */
export const lugarDeServicio = (
  catalogos: Catalogos,
  texto: string | null | undefined,
  id: number | null | undefined
): string => {
  if (texto && texto.trim()) return texto.trim();
  return id ? nombreDestino(catalogos, id) : 'Sin definir';
};
