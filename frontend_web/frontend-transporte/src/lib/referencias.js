// ============================================================
// Referencias entre tablas (llaves foráneas)
// ------------------------------------------------------------
// El backend guarda ids (id_vehiculo, id_conductor…), pero en
// pantalla se debe ver el NOMBRE. Aquí se cargan las tablas
// relacionadas una sola vez y se arma la lista de opciones
// "id -> texto legible" que usan el formulario y la tabla.
// ============================================================
import api from '../api/api.js'
import { getEntity } from '../entities.js'

// Tablas ya descargadas (se comparten entre pantallas)
const cache = new Map()
// Peticiones en curso (evita pedir la misma tabla dos veces a la vez)
const enVuelo = new Map()

// Texto sin nombre: se usa cuando una fila no tiene con qué identificarse.
// Antes se caía al código interno; ahora no, porque en pantalla no debe
// aparecer ningún id (ni en las listas desplegables ni en las tablas).
const SIN_NOMBRE = 'Sin nombre'

// Texto con el que se muestra una fila: usa "mostrar" de entities.js.
export function etiquetaDeFila(entidad, fila) {
  if (!fila) return ''

  if (typeof entidad.mostrar === 'function') {
    return String(entidad.mostrar(fila) || '').trim() || SIN_NOMBRE
  }

  const campos = entidad.mostrar?.length
    ? entidad.mostrar
    : [entidad.fields[0]?.name].filter(Boolean)

  const texto = campos
    .map((c) => fila[c])
    .filter((v) => v !== null && v !== undefined && v !== '')
    .join(' ')

  return texto.trim() || SIN_NOMBRE
}

// Claves de las tablas a las que apunta una entidad (sin repetir).
export function referenciasDe(entity) {
  return [...new Set(entity.fields.filter((f) => f.ref).map((f) => f.ref))]
}

// Descarga (o reutiliza) una tabla relacionada y arma sus opciones.
export function cargarReferencia(clave) {
  if (cache.has(clave)) return Promise.resolve(cache.get(clave))
  if (enVuelo.has(clave)) return enVuelo.get(clave)

  const entidad = getEntity(clave)
  if (!entidad) return Promise.reject(new Error(`Tabla «${clave}» no configurada`))

  const promesa = api
    .get(`/${entidad.endpoint}`)
    .then(({ data }) => {
      const filas = Array.isArray(data) ? data : []
      const opciones = filas
        .map((fila) => ({
          valor: String(fila[entidad.pk]),
          etiqueta: etiquetaDeFila(entidad, fila)
        }))
        .sort((a, b) =>
          a.etiqueta.localeCompare(b.etiqueta, 'es', { numeric: true, sensitivity: 'base' })
        )

      const registro = {
        entidad,
        opciones,
        mapa: new Map(opciones.map((o) => [o.valor, o.etiqueta]))
      }
      cache.set(clave, registro)
      enVuelo.delete(clave)
      return registro
    })
    .catch((err) => {
      enVuelo.delete(clave)
      throw err
    })

  enVuelo.set(clave, promesa)
  return promesa
}

// Se llama al crear/editar/eliminar en una tabla para que las listas
// desplegables de las demás pantallas vuelvan a pedirla.
export function invalidarReferencia(clave) {
  cache.delete(clave)
  enVuelo.delete(clave)
}

export function invalidarTodo() {
  cache.clear()
  enVuelo.clear()
}

// Texto a mostrar en una celda: el nombre si se conoce, si no el id.
export function etiquetaDeValor(referencias, campo, valor) {
  if (!campo?.ref || valor === null || valor === undefined || valor === '') return null
  return referencias?.[campo.ref]?.mapa.get(String(valor)) || null
}
