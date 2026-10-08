import ExcelJS from 'exceljs';
import { supabase } from '../config/supabase.js';

// REPORTE SEMANAL DE SERVICIOS (solo administrador)

const ZONA = '-05:00';
const DESFASE_MS = -5 * 60 * 60 * 1000;

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;

const FORMATO_PESOS = '"$"#,##0';
const FORMATO_FECHA_HORA = 'dd/mm/yyyy hh:mm';
const COLOR_MARCA = 'FFB91C1C';


// servidor no mueva el dia.
const sumarDias = (fecha, dias) => {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

// Hoy en Bogota ("AAAA-MM-DD"), sin importar la zona del servidor.
const hoyEnBogota = () => new Date(Date.now() + DESFASE_MS).toISOString().slice(0, 10);

// Dias entre dos fechas "AAAA-MM-DD" (b - a).
const diasEntre = (a, b) =>
  Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);

const fechaValida = (fecha) =>
  RE_FECHA.test(fecha) && new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) === fecha;

// Excel no guarda zona horaria: se le entrega la hora "de reloj" de Bogota
const horaLocal = (iso) => {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : new Date(ms + DESFASE_MS);
};

const numero = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const ddmm = (fecha) => `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}/${fecha.slice(0, 4)}`;


const retrasoMinutos = (s) => {
  if (!s.fecha_llegada_real || !s.fecha_llegada_estimada) return null;
  const real = Date.parse(s.fecha_llegada_real);
  const estimada = Date.parse(s.fecha_llegada_estimada);
  if (Number.isNaN(real) || Number.isNaN(estimada)) return null;
  return Math.round((real - estimada) / 60000);
};

async function leerDatos(desde, hasta) {
  const [servicios, conductores, vehiculos, destinos, estados] = await Promise.all([
    supabase
      .from('servicios')
      .select('*')
      .gte('fecha_salida', `${desde}T00:00:00${ZONA}`)
      .lt('fecha_salida', `${hasta}T00:00:00${ZONA}`)
      .order('fecha_salida', { ascending: true }),
    supabase.from('conductor').select('id_conductor, nombre, apellido'),
    supabase.from('vehiculos').select('id_vehiculo, placa, marca, linea'),
    supabase.from('destinos').select('id_destino, nombre_destino, ciudad'),
    supabase.from('estados_servicio').select('id_estado, nombre_estado')
  ]);
  for (const r of [servicios, conductores, vehiculos, destinos, estados]) if (r.error) throw r.error;

  const porId = (filas, pk) => new Map(filas.map((f) => [String(f[pk]), f]));
  const conductor = porId(conductores.data, 'id_conductor');
  const vehiculo = porId(vehiculos.data, 'id_vehiculo');
  const destino = porId(destinos.data, 'id_destino');
  const estado = porId(estados.data, 'id_estado');

  const nombreConductor = (id) => {
    const c = conductor.get(String(id));
    return c ? [c.nombre, c.apellido].filter(Boolean).join(' ') : 'Sin conductor';
  };
  const nombreVehiculo = (id) => {
    const v = vehiculo.get(String(id));
    return v ? [v.placa, v.marca, v.linea].filter(Boolean).join(' · ') : '—';
  };
  const nombreDestino = (id) => {
    const d = destino.get(String(id));
    if (!d) return '—';
    return d.ciudad ? `${d.nombre_destino} (${d.ciudad})` : d.nombre_destino;
  };
  const nombreEstado = (id) => estado.get(String(id))?.nombre_estado ?? 'Sin estado';

  return servicios.data.map((s) => {
    const salida = horaLocal(s.fecha_salida);
    return {
      codigo: s.codigo_servicio,
      tipo: s.tipo_servicio,
      dia: salida ? DIAS[salida.getUTCDay()] : '—',
      fechaDia: salida ? salida.toISOString().slice(0, 10) : null,
      salida,
      llegadaEstimada: horaLocal(s.fecha_llegada_estimada),
      llegadaReal: horaLocal(s.fecha_llegada_real),
      retraso: retrasoMinutos(s),
      // El texto escrito a mano manda; los servicios antiguos caen al catalogo.
      origen: s.origen || nombreDestino(s.id_origen),
      destino: s.destino || nombreDestino(s.id_destino),
      conductor: nombreConductor(s.id_conductor),
      vehiculo: nombreVehiculo(s.id_vehiculo),
      estado: nombreEstado(s.id_estado),
      pasajeros: numero(s.numero_pasajeros),
      precio: numero(s.precio_total),
      distancia: s.distancia_estimada_km == null ? null : numero(s.distancia_estimada_km),
      peajes: numero(s.peajes_estimados),
      observaciones: s.observaciones ?? ''
    };
  });
}

function agrupar(filas, clave) {
  const grupos = new Map();
  for (const f of filas) {
    const k = clave(f);
    const g = grupos.get(k) ?? { nombre: k, servicios: 0, pasajeros: 0, valor: 0, km: 0 };
    g.servicios += 1;
    g.pasajeros += f.pasajeros;
    g.valor += f.precio;
    g.km += f.distancia ?? 0;
    grupos.set(k, g);
  }
  return [...grupos.values()];
}

const estiloEncabezado = (fila) => {
  fila.eachCell((celda) => {
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_MARCA } };
    celda.alignment = { vertical: 'middle' };
  });
};


function escribirTabla(hoja, filaInicio, titulo, encabezados, filas, formatos = {}) {
  hoja.getCell(filaInicio, 1).value = titulo;
  hoja.getCell(filaInicio, 1).font = { bold: true, size: 12 };

  const encabezado = hoja.getRow(filaInicio + 1);
  encabezados.forEach((texto, i) => (encabezado.getCell(i + 1).value = texto));
  estiloEncabezado(encabezado);

  filas.forEach((valores, i) => {
    const fila = hoja.getRow(filaInicio + 2 + i);
    valores.forEach((v, j) => {
      const celda = fila.getCell(j + 1);
      celda.value = v;
      if (formatos[j]) celda.numFmt = formatos[j];
    });
  });

  if (filas.length === 0) {
    hoja.getCell(filaInicio + 2, 1).value = 'Sin datos en esta semana.';
    hoja.getCell(filaInicio + 2, 1).font = { italic: true, color: { argb: 'FF6B7280' } };
    return filaInicio + 4;
  }
  return filaInicio + 3 + filas.length;
}

function hojaResumen(libro, filas, desde, fin) {
  const hoja = libro.addWorksheet('Resumen', { views: [{ showGridLines: false }] });
  hoja.columns = [{ width: 34 }, { width: 14 }, { width: 14 }, { width: 18 }, { width: 14 }];

  hoja.getCell('A1').value = "D' VIAJE · Reporte semanal de servicios";
  hoja.getCell('A1').font = { bold: true, size: 16, color: { argb: COLOR_MARCA } };
  // La semana en curso se corta en el dia de hoy: lo que aun no ha pasado
  // no se reporta.
  const cortada = diasEntre(desde, fin) < 6;
  hoja.getCell('A2').value = cortada
    ? `Del ${ddmm(desde)} al ${ddmm(fin)}, hasta hoy (semana en curso, hora de Colombia)`
    : `Semana del ${ddmm(desde)} al ${ddmm(fin)} (hora de Colombia)`;
  const ahora = new Date(Date.now() + DESFASE_MS).toISOString();
  hoja.getCell('A3').value = `Generado el ${ddmm(ahora)} a las ${ahora.slice(11, 16)}`;
  hoja.getCell('A3').font = { color: { argb: 'FF6B7280' } };

  const conLlegada = filas.filter((f) => f.retraso !== null);
  const aTiempo = conLlegada.filter((f) => f.retraso <= 0).length;
  const puntualidad = conLlegada.length ? aTiempo / conLlegada.length : null;

  const indicadores = [
    ['Servicios programados', filas.length],
    ['Pasajeros', filas.reduce((t, f) => t + f.pasajeros, 0)],
    ['Valor total de los servicios', filas.reduce((t, f) => t + f.precio, 0), FORMATO_PESOS],
    ['Peajes estimados', filas.reduce((t, f) => t + f.peajes, 0), FORMATO_PESOS],
    ['Distancia estimada (km)', filas.reduce((t, f) => t + (f.distancia ?? 0), 0), '#,##0'],
    ['Servicios con llegada registrada', conLlegada.length],
    ['Llegaron a tiempo', aTiempo],
    ['Llegaron con retraso', conLlegada.length - aTiempo],
    ['Puntualidad', puntualidad ?? 'Sin llegadas registradas', puntualidad === null ? undefined : '0.0%']
  ];

  let fila = 5;
  hoja.getCell(fila, 1).value = 'Indicadores';
  hoja.getCell(fila, 1).font = { bold: true, size: 12 };
  fila += 1;
  for (const [etiqueta, valor, formato] of indicadores) {
    hoja.getCell(fila, 1).value = etiqueta;
    const celda = hoja.getCell(fila, 2);
    celda.value = valor;
    celda.font = { bold: true };
    if (formato) celda.numFmt = formato;
    fila += 1;
  }
  fila += 1;

  const porDia = new Map(agrupar(filas, (f) => f.fechaDia).map((g) => [g.nombre, g]));
  const dias = Array.from({ length: diasEntre(desde, fin) + 1 }, (_, i) => {
    const fecha = sumarDias(desde, i);
    const g = porDia.get(fecha);
    return [`${DIAS[new Date(`${fecha}T00:00:00Z`).getUTCDay()]} ${ddmm(fecha).slice(0, 5)}`,
      g?.servicios ?? 0, g?.pasajeros ?? 0, g?.valor ?? 0];
  });
  fila = escribirTabla(hoja, fila, 'Por día', ['Día', 'Servicios', 'Pasajeros', 'Valor'], dias,
    { 3: FORMATO_PESOS });

  const porEstado = agrupar(filas, (f) => f.estado)
    .sort((a, b) => b.servicios - a.servicios)
    .map((g) => [g.nombre, g.servicios, g.pasajeros, g.valor]);
  fila = escribirTabla(hoja, fila, 'Por estado', ['Estado', 'Servicios', 'Pasajeros', 'Valor'], porEstado,
    { 3: FORMATO_PESOS });

  const porConductor = agrupar(filas, (f) => f.conductor)
    .sort((a, b) => b.servicios - a.servicios || a.nombre.localeCompare(b.nombre, 'es'))
    .map((g) => [g.nombre, g.servicios, g.pasajeros, g.valor, g.km]);
  escribirTabla(hoja, fila, 'Por conductor', ['Conductor', 'Servicios', 'Pasajeros', 'Valor', 'Km'],
    porConductor, { 3: FORMATO_PESOS, 4: '#,##0' });
}

function hojaServicios(libro, filas) {
  const hoja = libro.addWorksheet('Servicios', { views: [{ state: 'frozen', ySplit: 1 }] });
  hoja.columns = [
    { header: 'Código', key: 'codigo', width: 14 },
    { header: 'Tipo', key: 'tipo', width: 14 },
    { header: 'Día', key: 'dia', width: 11 },
    { header: 'Salida', key: 'salida', width: 17, style: { numFmt: FORMATO_FECHA_HORA } },
    { header: 'Llegada estimada', key: 'llegadaEstimada', width: 17, style: { numFmt: FORMATO_FECHA_HORA } },
    { header: 'Llegada real', key: 'llegadaReal', width: 17, style: { numFmt: FORMATO_FECHA_HORA } },
    { header: 'Retraso (min)', key: 'retraso', width: 13 },
    { header: 'Origen', key: 'origen', width: 24 },
    { header: 'Destino', key: 'destino', width: 24 },
    { header: 'Conductor', key: 'conductor', width: 24 },
    { header: 'Vehículo', key: 'vehiculo', width: 26 },
    { header: 'Estado', key: 'estado', width: 16 },
    { header: 'Pasajeros', key: 'pasajeros', width: 11 },
    { header: 'Precio', key: 'precio', width: 14, style: { numFmt: FORMATO_PESOS } },
    { header: 'Distancia (km)', key: 'distancia', width: 14 },
    { header: 'Peajes', key: 'peajes', width: 12, style: { numFmt: FORMATO_PESOS } },
    { header: 'Observaciones', key: 'observaciones', width: 40 }
  ];
  estiloEncabezado(hoja.getRow(1));

  hoja.addRows(filas);

  // Los retrasos positivos se marcan en rojo para verlos de un vistazo.
  hoja.getColumn('retraso').eachCell((celda, n) => {
    if (n > 1 && typeof celda.value === 'number' && celda.value > 0) {
      celda.font = { color: { argb: COLOR_MARCA }, bold: true };
    }
  });

  if (filas.length > 0) {
    hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: hoja.columnCount } };
    const total = hoja.addRow({
      codigo: 'TOTAL',
      pasajeros: filas.reduce((t, f) => t + f.pasajeros, 0),
      precio: filas.reduce((t, f) => t + f.precio, 0),
      peajes: filas.reduce((t, f) => t + f.peajes, 0)
    });
    total.font = { bold: true };
  }
}

export const reporteServiciosSemanal = async (req, res, next) => {
  try {
    const desde = String(req.query.desde ?? '');
    if (!fechaValida(desde)) {
      return res.status(400).json({ error: 'Indica la semana con una fecha válida (AAAA-MM-DD).' });
    }
    // No se reportan dias que aun no han pasado: una semana futura se
    // rechaza, y la semana en curso llega solo hasta hoy 
    const hoy = hoyEnBogota();
    if (desde > hoy) {
      return res.status(400).json({
        error: 'No se puede sacar el reporte de una semana que todavía no ha empezado.'
      });
    }
    const domingo = sumarDias(desde, 6);
    const fin = domingo < hoy ? domingo : hoy;
    const hasta = sumarDias(fin, 1);

    const filas = await leerDatos(desde, hasta);

    const libro = new ExcelJS.Workbook();
    libro.creator = "D' VIAJE";
    libro.created = new Date();
    hojaResumen(libro, filas, desde, fin);
    hojaServicios(libro, filas);

    const archivo = `reporte-servicios_${desde}_a_${fin}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${archivo}"`);
    // El panel lo usa para avisar cuantos servicios entraron en el reporte.
    res.setHeader('X-Total-Servicios', String(filas.length));

    const buffer = await libro.xlsx.writeBuffer();
    return res.send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
};
