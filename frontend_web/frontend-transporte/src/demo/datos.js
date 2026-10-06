// ============================================================
// MODO DEMOSTRACIÓN (npm run demo)
// Genera datos de ejemplo para las 16 tablas y responde a la API
// desde la memoria del navegador. Sirve para revisar o presentar
// la interfaz cuando el backend o Supabase no están disponibles.
// NO se usa en la aplicación real: solo lo carga demo.html.
// ============================================================
import { entities } from '../entities.js'

const NOMBRES = ['Ana', 'Carlos', 'Lucía', 'Miguel', 'Sofía', 'Andrés', 'Valentina', 'Julián']
const APELLIDOS = ['Ramírez', 'Gómez', 'Torres', 'Muñoz', 'Castro', 'Rojas', 'Vargas', 'Pineda']
const CIUDADES = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga', 'Pereira']
const MARCAS = ['Chevrolet', 'Hino', 'Mercedes-Benz', 'Volkswagen', 'Scania']

// Cuántos registros tendrá cada tabla (variado para probar la paginación)
const CANTIDADES = {
  vehiculos: 137,
  servicios: 84,
  reservas: 213,
  conductor: 46,
  clientes: 62,
  mantenimientos: 38,
  'documentos-vehiculo': 29,
  alertas: 17,
  'historial-conductores': 23
}

const uuid = (i) => `3f7a1c2e-1111-2222-3333-${String(444455556666 + i)}`
const fecha = (dias) => new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10)
const fechaHora = (horas) => new Date(Date.now() + horas * 3600000).toISOString()

function valorDeCampo(campo, i, entidad) {
  const { name, type, options } = campo

  if (options) return options[i % options.length]
  if (type === 'checkbox') return i % 4 !== 0
  if (type === 'email') return `${NOMBRES[i % NOMBRES.length].toLowerCase()}${i}@ejemplo.com`
  // el desfase por nombre evita que todas las fechas de una fila salgan iguales
  const desfase = name.length * 3
  if (type === 'date') return fecha((i % 30) - 15 + desfase)
  if (type === 'datetime') return fechaHora((i % 48) - 24 + desfase)
  if (type === 'number') return name.startsWith('id_') ? 1 + (i % 5) : 10 + (i % 90)
  if (campo.format === 'uuid') return uuid(i)

  if (name.includes('nombre') && entidad.group === 'Personas') return NOMBRES[i % NOMBRES.length]
  if (name === 'apellido') return APELLIDOS[i % APELLIDOS.length]
  if (name === 'ciudad' || name.includes('destino')) return CIUDADES[i % CIUDADES.length]
  if (name === 'marca') return MARCAS[i % MARCAS.length]
  if (name === 'placa') return `${String.fromCharCode(65 + (i % 26))}BC${100 + (i % 900)}`
  if (name === 'telefono') return `30${i % 10}${String(1000000 + i * 7).slice(0, 7)}`
  if (name.includes('descripcion') || name.includes('observaciones')) {
    return `Registro de ejemplo número ${i + 1} para la tabla ${entidad.label.toLowerCase()}.`
  }
  if (name.includes('codigo') || name.includes('numero')) {
    return `${entidad.key.slice(0, 3).toUpperCase()}-${1000 + i}`
  }
  return `${campo.label} ${i + 1}`
}

function generarFilas(entidad) {
  const total = CANTIDADES[entidad.key] ?? 6 + (entidad.fields.length % 5)
  return Array.from({ length: total }, (_, i) => {
    const fila = { [entidad.pk]: entidad.pk === 'id_conductor' || entidad.pk === 'id_cliente' ? uuid(i) : i + 1 }
    for (const campo of entidad.fields) fila[campo.name] = valorDeCampo(campo, i, entidad)
    return fila
  })
}

// Almacén en memoria: endpoint -> filas
export const almacen = new Map(
  entities.map((e) => [e.endpoint, { entidad: e, filas: generarFilas(e) }])
)

// Segunda pasada: cada llave foránea apunta a un registro que existe de verdad,
// para que las listas desplegables y la tabla muestren nombres reales.
for (const [, registro] of almacen) {
  for (const campo of registro.entidad.fields) {
    if (!campo.ref) continue
    const referida = entities.find((e) => e.key === campo.ref)
    const destino = referida && almacen.get(referida.endpoint)
    if (!destino?.filas.length) continue
    registro.filas.forEach((fila, i) => {
      fila[campo.name] = destino.filas[i % destino.filas.length][referida.pk]
    })
  }
}

export function siguienteId(registro) {
  const pk = registro.entidad.pk
  const numericos = registro.filas.map((f) => Number(f[pk])).filter((n) => !Number.isNaN(n))
  return numericos.length ? Math.max(...numericos) + 1 : 1
}
