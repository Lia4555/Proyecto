import { CampoTabla, Fila, Tabla, etiquetaDeFila, referenciasDe, buscarTabla } from '../../entities';
import { TablaRepository } from '../../repositories';

// ============================================================
//  CASOS DE USO: administrar cualquier tabla
// ------------------------------------------------------------
//  Las mismas reglas que aplica el panel web antes de llamar al
//  servidor. No sustituyen a Zod en el backend (que sigue
//  mandando), pero evitan un viaje y dan el error al lado del
//  campo.
// ============================================================

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Nombres sin numeros ni simbolos raros; se admiten tildes, ñ, apostrofo y guion.
const RE_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'’-]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ'’-]+)*$/;
const RE_TELEFONO = /^\+?[0-9 ]{7,20}$/;

export type ErroresCampo = Record<string, string>;

const vacio = (v: unknown): boolean => v === '' || v === null || v === undefined;

/** CASO DE USO: valida el formulario antes de enviarlo. */
export class ValidarRegistro {
  ejecutar(tabla: Tabla, valores: Fila): ErroresCampo {
    const errores: ErroresCampo = {};

    for (const campo of tabla.fields) {
      const valor = valores[campo.name];
      if (campo.type === 'checkbox') continue;

      if (campo.required && vacio(valor)) {
        errores[campo.name] = 'Este campo es obligatorio.';
        continue;
      }
      if (vacio(valor)) continue;

      const texto = String(valor).trim();

      if (campo.type === 'email' && !RE_EMAIL.test(texto)) {
        errores[campo.name] = 'Escribe un correo válido (ejemplo: nombre@empresa.com).';
        continue;
      }
      if (campo.format === 'nombre' && !RE_NOMBRE.test(texto)) {
        errores[campo.name] = 'Solo letras: sin números ni símbolos.';
        continue;
      }
      if (campo.format === 'telefono' && !RE_TELEFONO.test(texto)) {
        errores[campo.name] = 'Escribe un teléfono válido (solo números, mínimo 7).';
        continue;
      }
      if (campo.format === 'uuid' && !RE_UUID.test(texto)) {
        errores[campo.name] = 'Elige una opción de la lista.';
        continue;
      }
      if (campo.type === 'number') {
        const numero = Number(texto);
        if (Number.isNaN(numero)) {
          errores[campo.name] = 'Debe ser un número.';
          continue;
        }
        if (campo.min !== undefined && numero < campo.min) {
          errores[campo.name] = `El valor mínimo es ${campo.min}.`;
          continue;
        }
        if (campo.integer && !Number.isInteger(numero)) {
          errores[campo.name] = 'Debe ser un número entero.';
          continue;
        }
      }
      if (campo.minLength && texto.length < campo.minLength) {
        errores[campo.name] = `Debe tener al menos ${campo.minLength} caracteres.`;
        continue;
      }
      // Regla de orden entre fechas: "no puede ser anterior a ...".
      if (campo.after && !vacio(valores[campo.after])) {
        const anterior = Date.parse(String(valores[campo.after]));
        const actual = Date.parse(texto);
        if (!Number.isNaN(anterior) && !Number.isNaN(actual) && actual < anterior) {
          const otro = tabla.fields.find((f) => f.name === campo.after);
          errores[campo.name] = `No puede ser anterior a «${otro?.label ?? campo.after}».`;
        }
      }
    }

    return errores;
  }
}

/** Convierte lo escrito en pantalla a lo que espera el backend (Zod). */
export const construirCuerpo = (tabla: Tabla, valores: Fila): Fila => {
  const cuerpo: Fila = {};

  for (const campo of tabla.fields) {
    const bruto = valores[campo.name];

    if (campo.type === 'checkbox') {
      cuerpo[campo.name] = Boolean(bruto);
      continue;
    }
    if (vacio(bruto)) {
      // Obligatorio vacio -> se manda vacio para que el servidor de un error
      // claro. Opcional vacio -> se omite, para no pisar la columna con "".
      if (campo.required) cuerpo[campo.name] = '';
      continue;
    }
    if (campo.type === 'number') {
      cuerpo[campo.name] = Number(bruto);
    } else if (campo.type === 'datetime') {
      cuerpo[campo.name] = new Date(String(bruto)).toISOString();
    } else if (typeof bruto === 'string') {
      cuerpo[campo.name] = bruto.trim();
    } else {
      cuerpo[campo.name] = bruto;
    }
  }

  return cuerpo;
};

/** Valores con los que abre el formulario: la fila al editar, o vacios al crear. */
export const valoresIniciales = (tabla: Tabla, fila?: Fila | null): Fila => {
  const valores: Fila = {};
  for (const campo of tabla.fields) {
    const v = fila ? fila[campo.name] : undefined;

    if (campo.type === 'checkbox') {
      valores[campo.name] = fila ? Boolean(v) : (campo.porDefecto ?? false);
    } else if (campo.type === 'date') {
      valores[campo.name] = v ? String(v).slice(0, 10) : '';
    } else if (campo.type === 'datetime') {
      valores[campo.name] = v ? String(v).slice(0, 16) : '';
    } else {
      valores[campo.name] = v === null || v === undefined ? '' : String(v);
    }
  }
  return valores;
};

/** CASO DE USO: filas de una tabla. */
export class ListarFilas {
  constructor(private readonly repositorio: TablaRepository) {}

  ejecutar(tabla: Tabla): Promise<Fila[]> {
    return this.repositorio.listar(tabla.endpoint);
  }
}

/** CASO DE USO: guardar (crear o editar). Devuelve el mensaje para la pantalla. */
export class GuardarFila {
  constructor(private readonly repositorio: TablaRepository) {}

  async ejecutar(tabla: Tabla, valores: Fila, filaOriginal?: Fila | null): Promise<string> {
    const cuerpo = construirCuerpo(tabla, valores);

    if (filaOriginal) {
      await this.repositorio.actualizar(tabla.endpoint, filaOriginal[tabla.pk], cuerpo);
      return 'Los cambios se guardaron correctamente.';
    }
    await this.repositorio.crear(tabla.endpoint, cuerpo);
    return `Se creó el registro en ${tabla.label}.`;
  }
}

/** CASO DE USO: eliminar una fila. */
export class EliminarFila {
  constructor(private readonly repositorio: TablaRepository) {}

  async ejecutar(tabla: Tabla, fila: Fila): Promise<string> {
    await this.repositorio.eliminar(tabla.endpoint, fila[tabla.pk]);
    return 'Registro eliminado correctamente.';
  }
}

/**
 * CASO DE USO: las listas desplegables de una tabla.
 * Las claves foraneas se eligen por NOMBRE, nunca por id: un id no le
 * dice nada a quien usa la app.
 */
export interface OpcionRef {
  valor: string;
  etiqueta: string;
}

export class CargarReferencias {
  constructor(private readonly repositorio: TablaRepository) {}

  async ejecutar(tabla: Tabla): Promise<Record<string, OpcionRef[]>> {
    const claves = referenciasDe(tabla);
    const listas: Record<string, OpcionRef[]> = {};

    // Si una lista falla, el formulario sigue abriendo: solo ese campo
    // queda sin opciones y se avisa en pantalla.
    await Promise.all(
      claves.map(async (clave) => {
        const referida = buscarTabla(clave);
        if (!referida) return;
        try {
          const filas = await this.repositorio.listar(referida.endpoint);
          listas[clave] = filas
            .map((f) => ({
              valor: String(f[referida.pk]),
              etiqueta: etiquetaDeFila(referida, f)
            }))
            .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es', { numeric: true }));
        } catch {
          // se queda sin lista; la pantalla lo indica
        }
      })
    );

    return listas;
  }
}

/** Texto visible de una celda: el nombre si es una referencia, si no el valor. */
export const textoDeCampo = (
  campo: CampoTabla | undefined,
  valor: unknown,
  referencias: Record<string, OpcionRef[]>
): string => {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';

  if (campo?.ref) {
    const opcion = referencias[campo.ref]?.find((o) => o.valor === String(valor));
    return opcion?.etiqueta ?? 'Sin nombre';
  }
  if (campo?.type === 'date') return String(valor).slice(0, 10);
  if (campo?.type === 'datetime') return String(valor).slice(0, 16).replace('T', ' ');
  return String(valor);
};
