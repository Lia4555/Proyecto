// ============================================================
// Nombres de persona y teléfonos
// ------------------------------------------------------------
// Mismas reglas que el backend (schemas/reglas.js), que es quien
// manda. Aquí se usan de dos formas:
//   · limpiar*  -> al escribir: los caracteres no permitidos ni
//                  siquiera aparecen en el campo.
//   · error*    -> al enviar: mensaje debajo del campo.
// ============================================================

// Letras con tildes, ñ y ü, sin números ni símbolos.
const LETRA = 'A-Za-zÀ-ÖØ-öø-ÿ'

const RE_NOMBRE_PERSONA = new RegExp(`^[${LETRA}]+(?:[ '’-][${LETRA}]+)*$`)
const RE_NO_NOMBRE = new RegExp(`[^${LETRA} '’-]`, 'g')
const RE_TELEFONO = /^\+?\d[\d ]*$/

export const TELEFONO_MIN_DIGITOS = 7
export const TELEFONO_MAX_DIGITOS = 15

const digitos = (texto) => (texto.match(/\d/g) || []).length

// "Ana2  María" -> "Ana María". Deja un espacio al final para poder
// seguir escribiendo el segundo nombre.
export function limpiarNombre(texto) {
  return String(texto ?? '')
    .replace(RE_NO_NOMBRE, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s/, '')
    .slice(0, 60)
}

// "+57 (300) abc-123" -> "+57 300 123". El + solo vale al principio.
export function limpiarTelefono(texto) {
  const valor = String(texto ?? '')
  const mas = valor.trimStart().startsWith('+') ? '+' : ''
  const resto = valor
    .replace(/[^\d ]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s/, '')
  return (mas + resto).slice(0, 20)
}

export function errorNombre(texto) {
  const valor = String(texto ?? '').replace(/\s+/g, ' ').trim()
  if (valor.length < 2) return 'Debe tener al menos 2 letras.'
  if (!RE_NOMBRE_PERSONA.test(valor)) return 'Solo letras y espacios, sin números ni símbolos.'
  return null
}

export function errorTelefono(texto) {
  const valor = String(texto ?? '').trim()
  if (!RE_TELEFONO.test(valor)) return 'Solo números y espacios (puede empezar con +).'
  const n = digitos(valor)
  if (n < TELEFONO_MIN_DIGITOS || n > TELEFONO_MAX_DIGITOS) {
    return `Debe tener entre ${TELEFONO_MIN_DIGITOS} y ${TELEFONO_MAX_DIGITOS} dígitos.`
  }
  return null
}

// ------------------------------------------------------------
// Números
// ------------------------------------------------------------
// Un <input type="number"> deja escribir "e", "+" y "-" (notación
// científica) y en algunos navegadores cualquier letra. Por eso los
// campos numéricos son de texto con teclado numérico y se filtran aquí.

// "12a3.4" -> "1234"
export function limpiarEntero(texto) {
  return String(texto ?? '').replace(/\D/g, '').slice(0, 15)
}

// "1.234,5x" -> "1234.5": la coma cuenta como decimal y solo vale un separador.
export function limpiarDecimal(texto) {
  const valor = String(texto ?? '').replace(/,/g, '.').replace(/[^\d.]/g, '')
  const [entero, ...resto] = valor.split('.')
  return (resto.length ? `${entero}.${resto.join('')}` : entero).slice(0, 18)
}

// ------------------------------------------------------------
// Documentos de identidad (mismas reglas que schemas/reglas.js)
// ------------------------------------------------------------
// CC, CE, TI y NIT son solo números. El pasaporte (PA) admite letras.
export const TIPOS_DOC_ALFANUMERICOS = ['PA']
const esAlfanumerico = (tipo) => TIPOS_DOC_ALFANUMERICOS.includes(tipo)

export function limpiarDocumento(texto, tipo) {
  const valor = String(texto ?? '')
  return esAlfanumerico(tipo)
    ? valor.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 20)
    : valor.replace(/\D/g, '').slice(0, 15)
}

export function errorDocumento(texto, tipo) {
  const valor = String(texto ?? '').trim()
  if (esAlfanumerico(tipo)) {
    return /^[A-Za-z0-9]{5,20}$/.test(valor) ? null : 'Entre 5 y 20 letras o números, sin espacios.'
  }
  return /^\d{5,15}$/.test(valor) ? null : 'Solo números, entre 5 y 15 dígitos (sin puntos ni espacios).'
}

// ------------------------------------------------------------
// Placa: "abc 123" -> "ABC123"
// ------------------------------------------------------------
export function limpiarPlaca(texto) {
  return String(texto ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7)
}

export function errorPlaca(texto) {
  return /^[A-Z0-9]{5,7}$/.test(String(texto ?? '')) ? null : 'Entre 5 y 7 letras o números (ejemplo: ABC123).'
}

// Para <input>: filtra lo escrito según el formato del campo.
// `valores` es el formulario completo (el documento depende del tipo).
export function limpiarSegunFormato(formato, valor, valores = {}) {
  if (formato === 'nombre') return limpiarNombre(valor)
  if (formato === 'telefono') return limpiarTelefono(valor)
  if (formato === 'entero') return limpiarEntero(valor)
  if (formato === 'decimal') return limpiarDecimal(valor)
  if (formato === 'documento') return limpiarDocumento(valor, valores.tipo_documento)
  if (formato === 'placa') return limpiarPlaca(valor)
  return valor
}
