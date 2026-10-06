// MODELO: aviso dirigido a un conductor (documento por vencer, mantenimiento...).

export interface Alerta {
  id_alerta: number;
  tipo_alerta: string | null;
  descripcion: string;
  fecha_limite: string | null;
  estado_resuelta: boolean;
  prioridad: number;
  id_usuario_destino: string;
  id_tipo_alerta: number;
  id_vehiculo_relacionado: number | null;
  id_servicio_relacionado: number | null;
  id_reserva_relacionada: number | null;
}

export const esUrgente = (alerta: Alerta): boolean =>
  !alerta.estado_resuelta && alerta.prioridad >= 3;
