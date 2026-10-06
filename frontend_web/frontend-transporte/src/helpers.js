// Construye el estado inicial del formulario.
// Si recibe "row" (al editar), precarga esos valores; si no, valores vacíos.
export function buildInitialValues(fields, row) {
  const values = {}
  for (const f of fields) {
    let v = row ? row[f.name] : undefined

    if (f.type === 'checkbox') {
      // boolean: usa el valor de la fila, o el default del campo, o false
      values[f.name] = row ? !!v : (f.default ?? false)
    } else if (f.type === 'date') {
      // input date espera "YYYY-MM-DD"
      values[f.name] = v ? String(v).slice(0, 10) : ''
    } else if (f.type === 'datetime') {
      // input datetime-local espera "YYYY-MM-DDTHH:MM"
      values[f.name] = v ? String(v).slice(0, 16) : ''
    } else {
      values[f.name] = v === null || v === undefined ? '' : v
    }
  }
  return values
}

// Convierte los valores del formulario al formato que espera el backend (Zod).
export function buildPayload(fields, values) {
  const payload = {}
  for (const f of fields) {
    const raw = values[f.name]

    if (f.type === 'checkbox') {
      payload[f.name] = !!raw
      continue
    }

    // Campos de texto/fecha/número vacíos:
    const isEmpty = raw === '' || raw === null || raw === undefined
    if (isEmpty) {
      // Obligatorio vacío -> mandamos cadena vacía para que Zod lo marque
      // como error claro. Opcional vacío -> lo omitimos.
      if (f.required) payload[f.name] = ''
      continue
    }

    if (f.type === 'number') {
      payload[f.name] = Number(raw)
    } else if (f.type === 'datetime') {
      // Convertimos a ISO completo con Z (lo que valida z.string().datetime())
      payload[f.name] = new Date(raw).toISOString()
    } else {
      payload[f.name] = raw
    }
  }
  return payload
}

// Formatea un valor para mostrarlo en la tabla.
export function formatCell(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  const s = String(value)
  // Recorta textos muy largos para que la tabla no se desborde
  return s.length > 40 ? s.slice(0, 40) + '…' : s
}
