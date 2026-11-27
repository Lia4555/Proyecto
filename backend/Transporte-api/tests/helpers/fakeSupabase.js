// ============================================================
// SUPABASE FALSO (doble de prueba en memoria)
// ------------------------------------------------------------
// Imita la parte del cliente de supabase-js que usa la API:
//   from(tabla).select / insert / update / delete
//   .eq .neq .in .ilike .gte .lt .order .limit .single .maybeSingle
// Los datos viven en un objeto de JavaScript, asi las pruebas son
// rapidas, repetibles y nunca tocan la base de datos real.
// ============================================================
import { randomUUID } from 'node:crypto';

// Llave primaria de cada tabla y si es UUID (texto) o numero autoincremental.
const LLAVES = {
  roles: ['id_rol', 'int'],
  usuario: ['id_usuario', 'uuid'],
  conductor: ['id_conductor', 'uuid'],
  cliente: ['id_cliente', 'uuid'],
  vehiculos: ['id_vehiculo', 'int'],
  servicios: ['id_servicio', 'int'],
  reservas: ['id_reserva', 'int'],
  alertas: ['id_alerta', 'int'],
  destinos: ['id_destino', 'int'],
  estados_servicio: ['id_estado', 'int'],
  tipos_vehiculo: ['id_tipo_vehiculo', 'int'],
  tipos_documentos: ['id_tipo_documento', 'int'],
  tipos_alerta: ['id_tipo_alerta', 'int'],
  clases_viaje: ['id_clase', 'int'],
  documentos_vehiculo: ['id_documento', 'int'],
  historial_conductores: ['id_historial', 'int'],
  mantenimientos: ['id_mantenimiento', 'int']
};

const comoFecha = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? Date.parse(v) : NaN);

// Compara como fecha si ambos lo son; si no, como texto/numero.
const comparar = (a, b) => {
  const fa = comoFecha(a);
  const fb = comoFecha(b);
  if (!Number.isNaN(fa) && !Number.isNaN(fb)) return fa - fb;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a ?? '').localeCompare(String(b ?? ''));
};

class Consulta {
  constructor(bd, tabla) {
    this.bd = bd;
    this.tabla = tabla;
    this.operacion = 'select';
    this.filtros = [];
    this.columnas = '*';
    this.devolverFilas = false;
    this.modo = 'lista';
  }

  // ---- operaciones -------------------------------------------------
  select(columnas = '*', opciones = {}) {
    if (this.operacion === 'select') {
      this.columnas = columnas;
      this.opcionesConteo = opciones;
    } else {
      // insert(...).select() / update(...).select(): devolver las filas
      this.devolverFilas = true;
      this.columnas = columnas;
    }
    return this;
  }

  insert(filas) {
    this.operacion = 'insert';
    this.filasNuevas = Array.isArray(filas) ? filas : [filas];
    return this;
  }

  update(cambios) {
    this.operacion = 'update';
    this.cambios = cambios;
    return this;
  }

  delete() {
    this.operacion = 'delete';
    return this;
  }

  // ---- filtros -----------------------------------------------------
  eq(col, valor) {
    this.filtros.push((f) => String(f[col]) === String(valor));
    return this;
  }

  neq(col, valor) {
    this.filtros.push((f) => String(f[col]) !== String(valor));
    return this;
  }

  in(col, valores) {
    const lista = valores.map(String);
    this.filtros.push((f) => lista.includes(String(f[col])));
    return this;
  }

  ilike(col, patron) {
    // La API solo lo usa para comparar un texto exacto sin distinguir
    // mayusculas (con % y _ escapados).
    const literal = String(patron).replace(/\\(.)/g, '$1').toLowerCase();
    this.filtros.push((f) => String(f[col] ?? '').toLowerCase() === literal);
    return this;
  }

  gte(col, valor) {
    this.filtros.push((f) => f[col] != null && comparar(f[col], valor) >= 0);
    return this;
  }

  lt(col, valor) {
    this.filtros.push((f) => f[col] != null && comparar(f[col], valor) < 0);
    return this;
  }

  order(col, { ascending = true } = {}) {
    this.orden = { col, ascending };
    return this;
  }

  limit(n) {
    this.limite = n;
    return this;
  }

  single() {
    this.modo = 'single';
    return this;
  }

  maybeSingle() {
    this.modo = 'maybeSingle';
    return this;
  }

  // ---- ejecucion ---------------------------------------------------
  // supabase-js devuelve un "thenable": se ejecuta al hacer await.
  then(resolver, rechazar) {
    return Promise.resolve()
      .then(() => this.ejecutar())
      .then(resolver, rechazar);
  }

  proyectar(fila) {
    if (!this.columnas || this.columnas.trim() === '*') return { ...fila };
    const salida = {};
    for (const c of this.columnas.split(',').map((x) => x.trim()).filter(Boolean)) {
      salida[c] = fila[c] ?? null;
    }
    return salida;
  }

  filas() {
    return (this.bd.tablas[this.tabla] ??= []);
  }

  coinciden() {
    return this.filas().filter((f) => this.filtros.every((cumple) => cumple(f)));
  }

  ejecutar() {
    const errorForzado = this.bd.fallos[this.tabla];
    if (errorForzado) return { data: null, error: errorForzado, count: null };

    let resultado;
    switch (this.operacion) {
      case 'insert':
        resultado = this.insertar();
        break;
      case 'update':
        resultado = this.actualizar();
        break;
      case 'delete':
        resultado = this.borrar();
        break;
      default:
        resultado = this.seleccionar();
    }
    if (resultado.error || resultado.head) return resultado;
    return this.aplicarModo(resultado.data, resultado.count ?? null);
  }

  seleccionar() {
    let datos = this.coinciden();
    if (this.orden) {
      const { col, ascending } = this.orden;
      datos = [...datos].sort((a, b) => comparar(a[col], b[col]) * (ascending ? 1 : -1));
    }
    const count = datos.length;
    if (this.opcionesConteo?.head) return { data: null, error: null, count, head: true };
    if (this.limite !== undefined) datos = datos.slice(0, this.limite);
    return { data: datos.map((f) => this.proyectar(f)), count };
  }

  insertar() {
    const [pk, tipo] = LLAVES[this.tabla] ?? [`id_${this.tabla}`, 'int'];
    const creadas = this.filasNuevas.map((nueva) => {
      const fila = { ...nueva };
      if (fila[pk] === undefined || fila[pk] === null) {
        fila[pk] = tipo === 'uuid' ? randomUUID() : this.bd.siguienteId(this.tabla, pk);
      }
      if (this.tabla === 'usuario' && !fila.fecha_registro) fila.fecha_registro = new Date().toISOString();
      this.filas().push(fila);
      return fila;
    });
    return { data: this.devolverFilas ? creadas.map((f) => this.proyectar(f)) : null };
  }

  actualizar() {
    const afectadas = this.coinciden();
    for (const fila of afectadas) Object.assign(fila, this.cambios);
    return { data: this.devolverFilas ? afectadas.map((f) => this.proyectar(f)) : null };
  }

  borrar() {
    const quedan = this.filas().filter((f) => !this.filtros.every((cumple) => cumple(f)));
    this.bd.tablas[this.tabla] = quedan;
    return { data: null };
  }

  aplicarModo(datos, count) {
    if (this.modo === 'lista') return { data: datos, error: null, count };
    const lista = datos ?? [];
    if (lista.length > 1) {
      return { data: null, error: { code: 'PGRST116', message: 'Varias filas' }, count };
    }
    if (lista.length === 0) {
      return this.modo === 'single'
        ? { data: null, error: { code: 'PGRST116', message: 'Ninguna fila' }, count }
        : { data: null, error: null, count };
    }
    return { data: lista[0], error: null, count };
  }
}

export function crearSupabaseFalso() {
  const bd = {
    tablas: {},
    // Errores forzados por tabla: bd.fallos.servicios = { message: '...' }
    fallos: {},
    siguienteId(tabla, pk) {
      const max = (this.tablas[tabla] ?? []).reduce((m, f) => Math.max(m, Number(f[pk]) || 0), 0);
      return max + 1;
    },
    // Reemplaza todos los datos (se llama antes de cada prueba).
    cargar(datos) {
      this.tablas = structuredClone(datos);
      this.fallos = {};
    }
  };

  const supabase = { from: (tabla) => new Consulta(bd, tabla) };
  return { supabase, bd };
}
