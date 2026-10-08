// REGLAS DE NEGOCIO POR TABLA
// que los valores no se repiten,documentos nu ericos

import { supabase } from '../config/supabase.js';
import { documentoValido, mensajeDocumento } from '../schemas/reglas.js';

// Error con el formato que entienden el panel web y la app:
const errorDeCampo = (status, campo, mensaje) => {
  const err = new Error(mensaje);
  err.status = status;
  err.detalles = [{ campo, mensaje }];
  return err;
};

// 1. CONSECUTIVOS
const SECUENCIAS = {
  servicios: { campo: 'codigo_servicio', prefijo: 'SVC-', digitos: 4 },
  reservas: { campo: 'numero_reserva', prefijo: 'RES-', digitos: 4 },
  vehiculos: { campo: 'numero_interno', prefijo: '', digitos: 3 }
};


async function siguienteConsecutivo(tabla) {
  const { campo, prefijo, digitos } = SECUENCIAS[tabla];
  const { data, error } = await supabase.from(tabla).select(campo);
  if (error) throw error;

  const patron = new RegExp(`^${prefijo.replace(/[-]/g, '\\-')}(\\d+)$`);
  const mayor = (data || []).reduce((max, fila) => {
    const m = patron.exec(String(fila[campo] ?? '').trim());
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);

  return `${prefijo}${String(mayor + 1).padStart(digitos, '0')}`;
}


// 2. VALORES UNICOS
const UNICOS = {
  servicios: [{ campo: 'codigo_servicio', nombre: 'código de servicio' }],
  reservas: [{ campo: 'numero_reserva', nombre: 'número de reserva' }],
  vehiculos: [
    { campo: 'placa', nombre: 'placa' },
    { campo: 'numero_interno', nombre: 'número interno' }
  ],
  conductor: [
    { campo: 'numero_documento', nombre: 'número de documento' },
    { campo: 'email', nombre: 'correo' }
  ],
  cliente: [
    { campo: 'numero_documento', nombre: 'número de documento' },
    { campo: 'email', nombre: 'correo' }
  ],
  documentos_vehiculo: [{ campo: 'numero_documento', nombre: 'número de documento' }],
  tipos_documentos: [{ campo: 'nombre_tipo', nombre: 'nombre' }],
  estados_servicio: [{ campo: 'nombre_estado', nombre: 'nombre' }],
  tipos_alerta: [{ campo: 'nombre_tipo', nombre: 'nombre' }],
  tipos_vehiculo: [{ campo: 'nombre_tipo', nombre: 'nombre' }],
  clases_viaje: [{ campo: 'nombre_clase', nombre: 'nombre' }]
};


const literalIlike = (texto) => String(texto).replace(/[\\%_]/g, (c) => `\\${c}`);

async function comprobarUnicos(tabla, pk, cuerpo, idPropio) {
  for (const { campo, nombre } of UNICOS[tabla] || []) {
    const valor = cuerpo[campo];
    if (valor === undefined || valor === null || String(valor).trim() === '') continue;

    let consulta = supabase
      .from(tabla)
      .select(pk)
      .ilike(campo, literalIlike(String(valor).trim()))
      .limit(1);
    // Al editar, la propia fila no cuenta como repetida.
    if (idPropio !== undefined) consulta = consulta.neq(pk, idPropio);

    const { data, error } = await consulta;
    if (error) throw error;
    if (data?.length) {
      throw errorDeCampo(409, campo, `Ya existe un registro con ese ${nombre} (${valor}).`);
    }
  }
}

// 4. ORIGEN Y DESTINO EN TEXTO
let columnasTexto = { existen: null, revisarDespuesDe: 0 };

export async function hayOrigenEnTexto() {
  if (columnasTexto.existen === true) return true;
  if (columnasTexto.existen === false && Date.now() < columnasTexto.revisarDespuesDe) return false;

  const { error } = await supabase.from('servicios').select('origen, destino').limit(1);
  if (error && (error.code === '42703' || /origen|destino/.test(error.message || ''))) {
    columnasTexto = { existen: false, revisarDespuesDe: Date.now() + 60000 };
    return false;
  }
  if (error) throw error;
  columnasTexto = { existen: true, revisarDespuesDe: 0 };
  return true;
}

const textoDeDestino = (d) => (d ? (d.ciudad && d.ciudad !== d.nombre_destino ? `${d.nombre_destino} (${d.ciudad})` : d.nombre_destino) : null);

async function destinosPorId(ids) {
  const limpios = [...new Set(ids.filter((v) => v !== null && v !== undefined))];
  if (!limpios.length) return new Map();
  const { data, error } = await supabase
    .from('destinos')
    .select('id_destino, nombre_destino, ciudad')
    .in('id_destino', limpios);
  if (error) throw error;
  return new Map((data || []).map((d) => [String(d.id_destino), d]));
}

// Base sin migrar: el texto escrito se guarda como un destino. Si ya hay
// uno con ese nombre se reutiliza (sin distinguir mayusculas ni espacios de
// mas); si no, se crea. Asi escribir el origen a mano funciona desde ya
async function idDestinoPorTexto(texto) {
  const limpio = String(texto).replace(/\s+/g, ' ').trim();
  const clave = limpio.toLowerCase();

  const { data, error } = await supabase.from('destinos').select('id_destino, nombre_destino, ciudad');
  if (error) throw error;
  const existente = (data || []).find(
    (d) =>
      String(d.nombre_destino ?? '').trim().toLowerCase() === clave ||
      String(textoDeDestino(d) ?? '').trim().toLowerCase() === clave
  );
  if (existente) return existente.id_destino;

 
  const { data: nuevo, error: errorAlta } = await supabase
    .from('destinos')
    .insert([{ nombre_destino: limpio, ciudad: limpio, activo: true }])
    .select('id_destino')
    .single();
  if (errorAlta) throw errorAlta;
  return nuevo.id_destino;
}

async function prepararServicio(cuerpo, esCreacion) {
  if (
    cuerpo.origen &&
    cuerpo.destino &&
    cuerpo.origen.trim().toLowerCase() === cuerpo.destino.trim().toLowerCase()
  ) {
    throw errorDeCampo(400, 'destino', 'El destino debe ser distinto del origen.');
  }

  const conTexto = await hayOrigenEnTexto();

  if (!conTexto) {
    // id de un destino (buscado o creado).
    if (cuerpo.origen) cuerpo.id_origen = await idDestinoPorTexto(cuerpo.origen);
    if (cuerpo.destino) cuerpo.id_destino = await idDestinoPorTexto(cuerpo.destino);
    delete cuerpo.origen;
    delete cuerpo.destino;

    if (esCreacion && !cuerpo.id_origen) throw errorDeCampo(400, 'origen', 'Escribe el origen del servicio.');
    if (esCreacion && !cuerpo.id_destino) throw errorDeCampo(400, 'destino', 'Escribe el destino del servicio.');
    return cuerpo;
  }

  if ((!cuerpo.origen && cuerpo.id_origen) || (!cuerpo.destino && cuerpo.id_destino)) {
    const mapa = await destinosPorId([cuerpo.id_origen, cuerpo.id_destino]);
    if (!cuerpo.origen && cuerpo.id_origen) cuerpo.origen = textoDeDestino(mapa.get(String(cuerpo.id_origen)));
    if (!cuerpo.destino && cuerpo.id_destino) cuerpo.destino = textoDeDestino(mapa.get(String(cuerpo.id_destino)));
  }

  if (esCreacion) {
    if (!cuerpo.origen) throw errorDeCampo(400, 'origen', 'Escribe el origen del servicio.');
    if (!cuerpo.destino) throw errorDeCampo(400, 'destino', 'Escribe el destino del servicio.');
  }
  if (
    cuerpo.origen &&
    cuerpo.destino &&
    cuerpo.origen.trim().toLowerCase() === cuerpo.destino.trim().toLowerCase()
  ) {
    throw errorDeCampo(400, 'destino', 'El destino debe ser distinto del origen.');
  }
  return cuerpo;
}

// Filas de servicios que se devuelven al cliente: si falta el texto

export async function completarServicios(filas) {
  const lista = Array.isArray(filas) ? filas : [filas];
  const faltan = lista.filter((f) => f && ((!f.origen && f.id_origen) || (!f.destino && f.id_destino)));
  if (!faltan.length) return filas;

  const mapa = await destinosPorId(faltan.flatMap((f) => [f.id_origen, f.id_destino]));
  for (const f of faltan) {
    if (!f.origen) f.origen = textoDeDestino(mapa.get(String(f.id_origen)));
    if (!f.destino) f.destino = textoDeDestino(mapa.get(String(f.id_destino)));
  }
  return filas;
}


// PUNTO DE ENTRADA: se llama antes de insertar o actualizar.
export async function prepararEscritura(tabla, pk, cuerpo, { esCreacion, id }) {
  
  if ((tabla === 'conductor' || tabla === 'cliente') && ('numero_documento' in cuerpo || 'tipo_documento' in cuerpo)) {
    let tipo = cuerpo.tipo_documento;
    let numero = cuerpo.numero_documento;
    if (!esCreacion && (tipo === undefined || numero === undefined)) {
      const { data } = await supabase.from(tabla).select('tipo_documento, numero_documento').eq(pk, id).maybeSingle();
      tipo ??= data?.tipo_documento;
      numero ??= data?.numero_documento;
    }
    if (typeof numero === 'string') {
      numero = numero.replace(/[\s.]/g, '');
      if ('numero_documento' in cuerpo) cuerpo.numero_documento = numero;
    }
    if (!documentoValido(tipo, numero)) {
      throw errorDeCampo(400, 'numero_documento', mensajeDocumento(tipo));
    }
  }

  if (tabla === 'servicios') await prepararServicio(cuerpo, esCreacion);

  const secuencia = SECUENCIAS[tabla];
  const generado = esCreacion && secuencia && !cuerpo[secuencia.campo];

  for (let intento = 0; ; intento++) {
    if (generado) cuerpo[secuencia.campo] = await siguienteConsecutivo(tabla);
    try {
      await comprobarUnicos(tabla, pk, cuerpo, esCreacion ? undefined : id);
      return cuerpo;
    } catch (err) {
      const chocaConsecutivo = generado && err.detalles?.[0]?.campo === secuencia.campo;
      if (!chocaConsecutivo || intento >= 3) throw err;
    }
  }
}
