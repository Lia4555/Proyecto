import { z } from 'zod';

// ============================================================
// Reglas de formato compartidas por todos los esquemas
// ------------------------------------------------------------
// Las mismas reglas estan en el panel web (frontend-transporte/src/lib/validaciones.js)
// y en la app (AppMovil/src/Domain/entities/Validaciones.ts), para avisar
// al instante. Aqui es donde de verdad se hacen cumplir.
// ============================================================

// Letras con tildes, ñ y ü (bloque Latin-1), sin numeros ni simbolos.
const LETRA = 'A-Za-zÀ-ÖØ-öø-ÿ';

// "María José", "O'Connor", "Pérez-Gómez". Un solo separador entre palabras.
export const RE_NOMBRE_PERSONA = new RegExp(`^[${LETRA}]+(?:[ '’-][${LETRA}]+)*$`);

// "3001234567", "+57 300 123 4567". El + solo al principio.
export const RE_TELEFONO = /^\+?\d[\d ]*$/;
export const TELEFONO_MIN_DIGITOS = 7;
export const TELEFONO_MAX_DIGITOS = 15;

const cuentaDigitos = (texto) => (texto.match(/\d/g) || []).length;

// "  Ana   María " -> "Ana María": los espacios de mas no son un error.
const sinEspaciosDeMas = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : v);

export const nombrePersona = (campo) =>
  z.preprocess(
    sinEspaciosDeMas,
    z
      .string({ required_error: `${campo} es obligatorio.`, invalid_type_error: `${campo} debe ser texto.` })
      .min(2, `${campo} debe tener al menos 2 letras.`)
      .max(60, `${campo} admite como máximo 60 caracteres.`)
      .regex(RE_NOMBRE_PERSONA, `${campo} solo puede tener letras y espacios, sin números ni símbolos.`)
  );

export const telefono = (campo = 'El teléfono') =>
  z
    .string({ required_error: `${campo} es obligatorio.`, invalid_type_error: `${campo} debe ser texto.` })
    .trim()
    .max(20, `${campo} admite como máximo 20 caracteres.`)
    .regex(RE_TELEFONO, `${campo} solo puede tener números y espacios (y un + al inicio).`)
    .refine(
      (t) => cuentaDigitos(t) >= TELEFONO_MIN_DIGITOS && cuentaDigitos(t) <= TELEFONO_MAX_DIGITOS,
      `${campo} debe tener entre ${TELEFONO_MIN_DIGITOS} y ${TELEFONO_MAX_DIGITOS} dígitos.`
    );

// ------------------------------------------------------------------
// Documentos de identidad
// ------------------------------------------------------------------
// CC, CE, TI y NIT son solo numeros. El pasaporte (PA) admite letras.
// La regla depende del tipo, asi que no cabe en un esquema de Zod por
// campo: la aplica controllers/reglasTablas.js con el registro completo.
export const TIPOS_DOC_ALFANUMERICOS = new Set(['PA']);
export const RE_DOC_NUMERICO = /^\d{5,15}$/;
export const RE_DOC_ALFANUMERICO = /^[A-Za-z0-9]{5,20}$/;

export const mensajeDocumento = (tipo) =>
  TIPOS_DOC_ALFANUMERICOS.has(tipo)
    ? 'El pasaporte debe tener entre 5 y 20 letras o números, sin espacios ni símbolos.'
    : 'El número de documento solo puede tener números (entre 5 y 15), sin puntos ni espacios.';

export const documentoValido = (tipo, numero) =>
  (TIPOS_DOC_ALFANUMERICOS.has(tipo) ? RE_DOC_ALFANUMERICO : RE_DOC_NUMERICO).test(String(numero ?? ''));

// ------------------------------------------------------------------
// Placa: "abc 123" -> "ABC123". Formato colombiano: 5 a 7 letras/numeros.
// ------------------------------------------------------------------
export const RE_PLACA = /^[A-Z0-9]{5,7}$/;

export const placa = () =>
  z.preprocess(
    (v) => (typeof v === 'string' ? v.replace(/[\s-]/g, '').toUpperCase() : v),
    z
      .string({ required_error: 'La placa es obligatoria.' })
      .regex(RE_PLACA, 'La placa debe tener entre 5 y 7 letras o números (ejemplo: ABC123).')
  );

// Texto libre de un lugar (origen o destino de un servicio).
export const lugar = (campo) =>
  z.preprocess(
    sinEspaciosDeMas,
    z
      .string({ invalid_type_error: `${campo} debe ser texto.` })
      .min(2, `${campo} debe tener al menos 2 caracteres.`)
      .max(120, `${campo} admite como máximo 120 caracteres.`)
  );
