import { CambioServicio, ErrorValidacion, NuevoServicio, Servicio } from '../../entities';
import { ServicioRepository } from '../../repositories';

// CASO DE USO: crear un servicio. Las reglas son las del esquema del
// backend (schemas/genericSchema.js) mas las de sentido comun: la llegada
// no puede ser antes de la salida.
export class CrearServicio {
  constructor(private readonly repositorio: ServicioRepository) {}

  validar(n: Partial<NuevoServicio>): Partial<Record<keyof NuevoServicio, string>> {
    const e: Partial<Record<keyof NuevoServicio, string>> = {};
    if (!n.codigo_servicio?.trim()) e.codigo_servicio = 'Escribe un código.';
    if (!n.tipo_servicio) e.tipo_servicio = 'Elige el tipo de servicio.';
    if (!n.id_origen) e.id_origen = 'Elige el origen.';
    if (!n.id_destino) e.id_destino = 'Elige el destino.';
    else if (n.id_destino === n.id_origen) e.id_destino = 'El destino debe ser distinto del origen.';
    if (!n.fecha_salida) e.fecha_salida = 'Escribe fecha y hora de salida.';
    if (!n.fecha_llegada_estimada) e.fecha_llegada_estimada = 'Escribe fecha y hora de llegada.';
    else if (n.fecha_salida && Date.parse(n.fecha_llegada_estimada) <= Date.parse(n.fecha_salida)) {
      e.fecha_llegada_estimada = 'La llegada debe ser después de la salida.';
    }
    if (!Number.isInteger(n.numero_pasajeros) || (n.numero_pasajeros ?? 0) <= 0) {
      e.numero_pasajeros = 'Número entero mayor que 0.';
    }
    if (!(typeof n.precio_total === 'number' && n.precio_total > 0)) e.precio_total = 'Valor mayor que 0.';
    if (!n.id_conductor) e.id_conductor = 'Elige el conductor.';
    if (!n.id_vehiculo) e.id_vehiculo = 'Elige el vehículo.';
    if (!n.id_estado) e.id_estado = 'Elige el estado inicial.';
    return e;
  }

  async ejecutar(nuevo: Partial<NuevoServicio>): Promise<Servicio> {
    const errores = this.validar(nuevo);
    if (Object.keys(errores).length > 0) throw new ErrorValidacion(errores);

    const n = nuevo as NuevoServicio;
    const observaciones = n.observaciones?.trim();
    return this.repositorio.crear({
      ...n,
      codigo_servicio: n.codigo_servicio.trim(),
      ...(observaciones ? { observaciones } : { observaciones: undefined })
    });
  }
}

// CASO DE USO: el administrador cambia estado, conductor, vehiculo u
// observaciones. Solo se envia lo que cambio: el backend valida en parcial.
export class EditarServicio {
  constructor(private readonly repositorio: ServicioRepository) {}

  async ejecutar(
    actual: Servicio,
    cambios: CambioServicio,
    opciones: { cierraViaje: boolean }
  ): Promise<Servicio> {
    const envio: CambioServicio = {};
    if (cambios.id_estado && cambios.id_estado !== actual.id_estado) envio.id_estado = cambios.id_estado;
    if (cambios.id_conductor && cambios.id_conductor !== actual.id_conductor) envio.id_conductor = cambios.id_conductor;
    if (cambios.id_vehiculo && cambios.id_vehiculo !== actual.id_vehiculo) envio.id_vehiculo = cambios.id_vehiculo;

    const obs = (cambios.observaciones ?? '').trim();
    if (obs && obs !== (actual.observaciones ?? '')) envio.observaciones = obs;

    // Al cerrar el viaje se sella la llegada real, si no la tenia.
    if (envio.id_estado && opciones.cierraViaje && !actual.fecha_llegada_real) {
      envio.fecha_llegada_real = new Date().toISOString();
    }

    if (Object.keys(envio).length === 0) throw new Error('No hay cambios para guardar.');
    return this.repositorio.actualizar(actual.id_servicio, envio);
  }
}
