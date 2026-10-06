import { Alerta, ErrorValidacion, NuevaAlerta } from '../../entities';
import { AlertaRepository } from '../../repositories';

// CASO DE USO: enviar una alerta a un conductor. Le aparece en su
// pestaña Alertas la proxima vez que la abra o actualice.
export class CrearAlerta {
  constructor(private readonly repositorio: AlertaRepository) {}

  validar(a: Partial<NuevaAlerta>): Partial<Record<keyof NuevaAlerta, string>> {
    const e: Partial<Record<keyof NuevaAlerta, string>> = {};
    if (!a.id_usuario_destino) e.id_usuario_destino = 'Elige a qué conductor va dirigida.';
    if (!a.id_tipo_alerta) e.id_tipo_alerta = 'Elige el tipo de alerta.';
    if (!a.prioridad || a.prioridad < 1 || a.prioridad > 5) e.prioridad = 'Elige una prioridad del 1 al 5.';
    if ((a.descripcion ?? '').trim().length < 2) e.descripcion = 'Escribe qué debe saber el conductor.';
    return e;
  }

  async ejecutar(nueva: Partial<NuevaAlerta>): Promise<Alerta> {
    const errores = this.validar(nueva);
    if (Object.keys(errores).length > 0) throw new ErrorValidacion(errores);
    const a = nueva as NuevaAlerta;
    return this.repositorio.crear({
      ...a,
      descripcion: a.descripcion.trim(),
      estado_resuelta: false,
      ...(a.fecha_limite ? {} : { fecha_limite: undefined })
    });
  }
}

export class ResolverAlerta {
  constructor(private readonly repositorio: AlertaRepository) {}

  ejecutar(alerta: Alerta): Promise<Alerta> {
    if (alerta.estado_resuelta) throw new Error('Esta alerta ya estaba resuelta.');
    return this.repositorio.resolver(alerta.id_alerta);
  }
}
