// ============================================================
// Utilidades de presentación: cómo se ve cada dato en la tabla
// ============================================================

const fmtNumero = new Intl.NumberFormat('es-CO')
const fmtFecha = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})
const fmtFechaHora = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const RE_SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/
const RE_ISO = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2})?/

// Etiqueta legible para el encabezado de una columna.
// Usa el label definido en entities.js; si no existe (ej. la llave primaria
// o columnas extra que devuelve la BD), convierte "fecha_salida" -> "Fecha salida".
export function columnLabel(entity, key) {
  const campo = entity.fields.find((f) => f.name === key)
  if (campo) return campo.label
  if (key === entity.pk) return 'ID'
  const limpio = key.replace(/^id_/, '').replace(/_/g, ' ')
  return limpio.charAt(0).toUpperCase() + limpio.slice(1)
}

// Texto plano de un valor (para buscar, ordenar y exportar).
export function rawText(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// Cómo se muestra el valor dentro de la celda.
export function formatValue(value, field) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'

  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : fmtNumero.format(value)
  }

  const texto = String(value)

  // Fechas: las mostramos en formato local, no en ISO crudo.
  if (field?.type === 'date' || field?.type === 'datetime' || RE_ISO.test(texto)) {
    // OJO: "2026-03-05" lo interpreta JavaScript como medianoche UTC, así que
    // al formatearlo en una zona horaria negativa (Colombia) mostraría el día
    // anterior. Por eso las fechas sin hora se arman a mano.
    const partes = texto.slice(0, 10).match(RE_SOLO_FECHA)
    if (partes && (field?.type === 'date' || texto.length <= 10)) {
      return `${partes[3]}/${partes[2]}/${partes[1]}`
    }

    const fecha = new Date(texto)
    if (!Number.isNaN(fecha.getTime())) {
      return field?.type === 'date' ? fmtFecha.format(fecha) : fmtFechaHora.format(fecha)
    }
  }

  // UUID: es un código interno, no un dato que le sirva a nadie. Las
  // columnas que apuntan a otra tabla ya se pintan con su nombre; si aun
  // así llega un UUID suelto, se muestra un guion en vez del código.
  if (RE_UUID.test(texto)) return '—'

  return texto.length > 44 ? texto.slice(0, 44) + '…' : texto
}

// Comparador para ordenar columnas (números, fechas y texto).
export function compareValues(a, b) {
  const vacioA = a === null || a === undefined || a === ''
  const vacioB = b === null || b === undefined || b === ''
  if (vacioA && vacioB) return 0
  if (vacioA) return 1 // los vacíos siempre al final
  if (vacioB) return -1

  if (typeof a === 'boolean' || typeof b === 'boolean') {
    return Number(b) - Number(a)
  }

  const numA = Number(a)
  const numB = Number(b)
  if (!Number.isNaN(numA) && !Number.isNaN(numB) && a !== '' && b !== '') {
    return numA - numB
  }

  const fechaA = Date.parse(a)
  const fechaB = Date.parse(b)
  if (!Number.isNaN(fechaA) && !Number.isNaN(fechaB) && RE_ISO.test(String(a))) {
    return fechaA - fechaB
  }

  return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' })
}

// Exporta las filas visibles a CSV (compatible con Excel en español).
export function descargarCSV(nombreArchivo, columnas, encabezados, filas) {
  const escapar = (v) => `"${rawText(v).replace(/"/g, '""')}"`
  const lineas = [
    encabezados.map(escapar).join(';'),
    ...filas.map((fila) => columnas.map((c) => escapar(fila[c])).join(';'))
  ]

  // El BOM (\uFEFF) hace que Excel respete las tildes.
  const blob = new Blob(['\uFEFF' + lineas.join('\r\n')], {
    type: 'text/csv;charset=utf-8;'
  })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = `${nombreArchivo}.csv`
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  URL.revokeObjectURL(url)
}

// ============================================================
// Fechas para el panel del conductor
// ============================================================

// "2026-03-05" -> "05/03/2026"  (sin desfase por zona horaria)
export function fechaCorta(valor) {
  if (!valor) return '—'
  const partes = String(valor).slice(0, 10).match(RE_SOLO_FECHA)
  if (partes) return `${partes[3]}/${partes[2]}/${partes[1]}`
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? '—' : fmtFecha.format(fecha)
}

// "2026-03-05T14:30:00Z" -> "jue 5 mar, 2:30 p. m."
const fmtDiaHora = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit'
})

export function fechaHora(valor) {
  if (!valor) return '—'
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? '—' : fmtDiaHora.format(fecha)
}

// Días que faltan para una fecha (negativo si ya pasó). null si no hay fecha.
export function diasHasta(valor) {
  if (!valor) return null
  const partes = String(valor).slice(0, 10).match(RE_SOLO_FECHA)
  const objetivo = partes
    ? new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]))
    : new Date(valor)
  if (Number.isNaN(objetivo.getTime())) return null

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  objetivo.setHours(0, 0, 0, 0)
  return Math.round((objetivo - hoy) / 86400000)
}

// Texto humano de una cuenta atrás: "vence en 12 días", "venció hace 3 días".
export function textoVigencia(valor) {
  const dias = diasHasta(valor)
  if (dias === null) return { texto: 'Sin fecha', estado: 'neutro' }
  if (dias < 0) return { texto: `Venció hace ${Math.abs(dias)} día(s)`, estado: 'vencido' }
  if (dias === 0) return { texto: 'Vence hoy', estado: 'vencido' }
  if (dias <= 30) return { texto: `Vence en ${dias} día(s)`, estado: 'pronto' }
  return { texto: `Vigente · ${fechaCorta(valor)}`, estado: 'vigente' }
}

// Precios en pesos colombianos, sin decimales.
const fmtPesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

export function pesos(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? fmtPesos.format(numero) : '—'
}
