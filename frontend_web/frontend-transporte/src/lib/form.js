// ============================================================
// Utilidades del formulario genérico (crear / editar)
// ============================================================

import { errorDocumento, errorNombre, errorPlaca, errorTelefono } from './validaciones.js'

// Campos que rellena el servidor (consecutivos): se muestran, pero nunca
// se le preguntan al administrador ni se envían.
export const esAutomatico = (f) => !!f.auto

// "  Abc123 " y "ABC123" son el mismo valor a efectos de repetición.
const normalizarUnico = (v) => String(v ?? '').trim().toLowerCase()

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Estado inicial del formulario.
// Si recibe "row" (edición) precarga esos valores; si no, valores vacíos.
export function buildInitialValues(fields, row) {
  const values = {}
  for (const f of fields) {
    const v = row ? row[f.name] : undefined

    if (f.type === 'checkbox') {
      values[f.name] = row ? !!v : (f.default ?? false)
    } else if (f.type === 'date') {
      values[f.name] = v ? String(v).slice(0, 10) : ''
    } else if (f.type === 'datetime') {
      // <input type="datetime-local"> espera "YYYY-MM-DDTHH:MM" en hora local
      values[f.name] = v ? isoALocal(v) : ''
    } else if (v === null || v === undefined) {
      values[f.name] = row ? '' : (f.default ?? '')
    } else {
      values[f.name] = v
    }
  }
  return values
}

// "2024-05-01T15:30:00.000Z" -> "2024-05-01T10:30" (hora local del navegador)
function isoALocal(valor) {
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return String(valor).slice(0, 16)
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}` +
    `T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`
  )
}

// Validación en el navegador ANTES de llamar al backend.
// No reemplaza a Zod (el servidor sigue mandando), pero evita viajes
// innecesarios y muestra el error al lado del campo.
//
// `contexto` es opcional: { filas, pk, fila } permite avisar de valores
// repetidos (placa, documento, correo…) sin esperar al servidor.
export function validateValues(fields, values, contexto = {}) {
  const errores = {}
  const { filas = [], pk, fila } = contexto

  for (const f of fields) {
    const valor = values[f.name]
    const vacio = valor === '' || valor === null || valor === undefined

    if (f.type === 'checkbox' || esAutomatico(f)) continue

    if (f.required && vacio) {
      errores[f.name] = 'Este campo es obligatorio.'
      continue
    }
    if (vacio) continue

    if (f.type === 'email' && !RE_EMAIL.test(String(valor))) {
      errores[f.name] = 'Escribe un correo válido (ejemplo: nombre@empresa.com).'
      continue
    }

    if (f.type === 'number') {
      const numero = Number(valor)
      if (Number.isNaN(numero)) {
        errores[f.name] = 'Debe ser un número.'
        continue
      }
      if (f.min !== undefined && numero < f.min) {
        errores[f.name] = `El valor mínimo es ${f.min}.`
        continue
      }
      if (f.integer && !Number.isInteger(numero)) {
        errores[f.name] = 'Debe ser un número entero.'
        continue
      }
    }

    if (f.format === 'uuid' && !RE_UUID.test(String(valor).trim())) {
      errores[f.name] = 'Debe ser un UUID válido (36 caracteres con guiones).'
      continue
    }

    const errorFormato =
      f.format === 'nombre'
        ? errorNombre(valor)
        : f.format === 'telefono'
          ? errorTelefono(valor)
          : f.format === 'documento'
            ? errorDocumento(valor, values.tipo_documento)
            : f.format === 'placa'
              ? errorPlaca(valor)
              : null
    if (errorFormato) {
      errores[f.name] = errorFormato
      continue
    }

    if (f.minLength && String(valor).trim().length < f.minLength) {
      errores[f.name] = `Debe tener al menos ${f.minLength} caracteres.`
      continue
    }

    // Regla de orden entre fechas: "no puede ser anterior a ..."
    if (f.after && values[f.after]) {
      const anterior = new Date(values[f.after])
      const actual = new Date(valor)
      if (!Number.isNaN(+anterior) && !Number.isNaN(+actual) && actual < anterior) {
        const otro = fields.find((x) => x.name === f.after)
        errores[f.name] = `No puede ser anterior a «${otro?.label || f.after}».`
        continue
      }
    }

    // Dos campos que no pueden coincidir (origen y destino de un servicio).
    if (f.distinctFrom && normalizarUnico(valor) === normalizarUnico(values[f.distinctFrom])) {
      const otro = fields.find((x) => x.name === f.distinctFrom)
      errores[f.name] = `Debe ser distinto de «${otro?.label || f.distinctFrom}».`
      continue
    }

    // Valor que no se puede repetir en la tabla. Al editar, la propia
    // fila no cuenta. El servidor lo vuelve a comprobar (409).
    if (f.unique && filas.length) {
      const buscado = normalizarUnico(valor)
      const repetida = filas.find(
        (otra) =>
          normalizarUnico(otra[f.name]) === buscado &&
          !(fila && pk && String(otra[pk]) === String(fila[pk]))
      )
      if (repetida) errores[f.name] = `Ya existe un registro con este valor. Debe ser único.`
    }
  }

  return errores
}

// Convierte los valores del formulario al formato que espera el backend (Zod).
export function buildPayload(fields, values) {
  const payload = {}

  for (const f of fields) {
    const raw = values[f.name]

    // Lo genera el servidor: enviarlo solo abriría la puerta a repetirlo.
    if (esAutomatico(f)) continue

    if (f.type === 'checkbox') {
      payload[f.name] = !!raw
      continue
    }

    const vacio = raw === '' || raw === null || raw === undefined
    if (vacio) {
      // Obligatorio vacío -> se manda vacío para que Zod dé un error claro.
      // Opcional vacío -> se omite (así no se pisan columnas con "").
      if (f.required) payload[f.name] = ''
      continue
    }

    if (f.type === 'number') {
      payload[f.name] = Number(raw)
    } else if (f.type === 'datetime') {
      payload[f.name] = new Date(raw).toISOString()
    } else if (typeof raw === 'string') {
      payload[f.name] = f.format === 'nombre' ? raw.replace(/\s+/g, ' ').trim() : raw.trim()
    } else {
      payload[f.name] = raw
    }
  }

  return payload
}

// ¿Cambió algo respecto a los valores iniciales? (para avisar antes de cerrar)
export function hayCambios(inicial, actual) {
  return Object.keys(actual).some((k) => String(inicial[k] ?? '') !== String(actual[k] ?? ''))
}
