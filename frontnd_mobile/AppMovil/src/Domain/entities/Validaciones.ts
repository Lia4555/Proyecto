// ============================================================
// REGLAS: nombres de persona y teléfonos
// ------------------------------------------------------------
// Las mismas del backend (schemas/reglas.js) y del panel web
// (frontend-transporte/src/lib/validaciones.js).
//   · limpiar*  -> al escribir: lo no permitido no llega al campo.
//   · error*    -> al enviar: mensaje debajo del campo, o null.
// ============================================================

// Letras con tildes, ñ y ü (bloque Latin-1). Se escriben los rangos a
// mano en vez de \p{L} para no depender del soporte Unicode del motor JS.
const LETRA = 'A-Za-zÀ-ÖØ-öø-ÿ';

const RE_NOMBRE_PERSONA = new RegExp(`^[${LETRA}]+(?:[ '’-][${LETRA}]+)*$`);
const RE_NO_NOMBRE = new RegExp(`[^${LETRA} '’-]`, 'g');
const RE_TELEFONO = /^\+?\d[\d ]*$/;

export const TELEFONO_MIN_DIGITOS = 7;
export const TELEFONO_MAX_DIGITOS = 15;

const digitos = (texto: string) => (texto.match(/\d/g) ?? []).length;

/** "Ana2  María" -> "Ana María". Conserva un espacio final para seguir escribiendo. */
export const limpiarNombre = (texto: string): string =>
  texto.replace(RE_NO_NOMBRE, '').replace(/\s+/g, ' ').replace(/^\s/, '').slice(0, 60);

/** "+57 (300) abc-123" -> "+57 300 123". El + solo vale al principio. */
export const limpiarTelefono = (texto: string): string => {
  const mas = texto.trimStart().startsWith('+') ? '+' : '';
  const resto = texto.replace(/[^\d ]/g, '').replace(/\s+/g, ' ').replace(/^\s/, '');
  return (mas + resto).slice(0, 20);
};

/** Espacios repetidos fuera, como los guarda el backend. */
export const normalizarNombre = (texto: string): string => texto.replace(/\s+/g, ' ').trim();

export const errorNombre = (texto: string): string | null => {
  const valor = normalizarNombre(texto);
  if (valor.length < 2) return 'Debe tener al menos 2 letras.';
  if (!RE_NOMBRE_PERSONA.test(valor)) return 'Solo letras y espacios, sin números ni símbolos.';
  return null;
};

export const errorTelefono = (texto: string): string | null => {
  const valor = texto.trim();
  if (!RE_TELEFONO.test(valor)) return 'Solo números y espacios (puede empezar con +).';
  const n = digitos(valor);
  if (n < TELEFONO_MIN_DIGITOS || n > TELEFONO_MAX_DIGITOS) {
    return `Debe tener entre ${TELEFONO_MIN_DIGITOS} y ${TELEFONO_MAX_DIGITOS} dígitos.`;
  }
  return null;
};
